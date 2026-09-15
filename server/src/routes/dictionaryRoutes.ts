import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { geminiService, GeminiUnavailableError, WordLookupResponseSchema } from '../ai/geminiClient.js';

export const dictionaryRouter = Router();

const normalize = (s: string) =>
  s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');

/** Finds a word by lemma (case-insensitive), normalized lemma (ae/oe/ue/ss), or any inflected form. */
async function findWord(query: string) {
  const normalized = normalize(query);
  return prisma.word.findFirst({
    where: {
      OR: [
        { lemma: { equals: query, mode: 'insensitive' } },
        { normalizedLemma: normalized },
        { forms: { some: { normalizedForm: normalized } } },
      ],
    },
    include: { forms: true },
  });
}

/** Converts a Gemini lookup into the stored detail shape the app renders. */
function toDetail(g: any) {
  const d = g.declensions;
  const c = g.conjugations;
  const detail: Record<string, unknown> = {};

  if (d?.nominativSg || d?.nominativPl) {
    detail.nounTable = {
      nominativ: { sg: d.nominativSg || '', pl: d.nominativPl || '' },
      akkusativ: { sg: d.akkusativSg || '', pl: d.akkusativPl || '' },
      dativ: { sg: d.dativSg || '', pl: d.dativPl || '' },
      genitiv: { sg: d.genitivSg || '', pl: d.genitivPl || '' },
    };
  }
  if (c?.praesens && c?.praeteritum) {
    detail.verbTable = {
      praesens: c.praesens,
      praeteritum: c.praeteritum,
      perfekt: { auxiliary: c.auxiliary === 'sein' ? 'sein' : 'haben', partizipII: c.partizipII || c.perfekt3sg || '' },
      ...(c.konjunktiv2_3sg && { konjunktivII: { ich: c.konjunktiv2_3sg, er_sie_es: c.konjunktiv2_3sg } }),
      ...(c.governedPreposition && { governedPreposition: c.governedPreposition }),
      ...(c.governedCase && { governedCase: c.governedCase.toLowerCase() }),
    };
  }
  if (Array.isArray(g.examples) && g.examples.length) detail.examples = g.examples;
  return detail;
}

async function lookup(req: Request, res: Response, rawQuery: string) {
  try {
    const query = (rawQuery || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const existingWord = await findWord(query);
    if (existingWord) {
      return res.json({ word: existingWord, source: 'database' });
    }

    const result: any = await geminiService.generateStructured({
      prompt: `Provide a complete German dictionary entry for "${query}": lemma, gender, meaning, full declension or full Präsens/Präteritum conjugation for all persons, Perfekt auxiliary and Partizip II, and two example sentences.`,
      responseSchema: WordLookupResponseSchema,
      cacheType: 'dictionary_lookup',
      cacheKeyData: { query: query.toLowerCase() },
    });

    if (geminiService.isMockMode) {
      // Canned sample, unrelated to the query. Never stored.
      return res.json({ word: result, source: 'mock' });
    }

    // Persist live lookups so the dictionary grows and repeat lookups are free.
    const lemma = String(result.lemma || query).trim();
    const word = await prisma.word.upsert({
      where: { lemma },
      update: {},
      create: {
        lemma,
        normalizedLemma: normalize(lemma),
        pos: String(result.pos || 'noun').toLowerCase(),
        gender: ['der', 'die', 'das'].includes(result.gender) ? result.gender : null,
        cefrLevel: result.cefrLevel || 'B1',
        ipa: result.ipa,
        meaningEn: result.meaningEn,
        secondaryMeanings: result.secondaryMeanings ? JSON.stringify(result.secondaryMeanings) : null,
        disambiguation: result.disambiguation,
        falseFriends: result.falseFriends,
        collocations: result.collocations ? JSON.stringify(result.collocations) : null,
        idioms: result.idioms ? JSON.stringify(result.idioms) : null,
        isCompound: !!result.isCompound,
        compoundParts: result.compoundParts ? JSON.stringify(result.compoundParts) : null,
        detailJson: JSON.stringify(toDetail(result)),
      },
      include: { forms: true },
    });

    res.json({ word, source: 'gemini' });
  } catch (error: any) {
    const status = error instanceof GeminiUnavailableError ? 503 : 500;
    res.status(status).json({ error: 'Dictionary lookup failed', message: error?.message });
  }
}

dictionaryRouter.get('/lookup', (req, res) => lookup(req, res, req.query.q as string));

// Must be registered before '/:query', which would otherwise capture it.
dictionaryRouter.get('/autocomplete', async (req: Request, res: Response) => {
  try {
    const prefix = normalize(((req.query.q as string) || '').trim());
    const suggestions = await prisma.word.findMany({
      where: { normalizedLemma: { startsWith: prefix } },
      take: 8,
      orderBy: { lemma: 'asc' },
      select: { lemma: true, pos: true, gender: true, meaningEn: true, cefrLevel: true },
    });
    res.json({ suggestions });
  } catch (error: any) {
    res.status(500).json({ error: 'Autocomplete failed', message: error?.message });
  }
});

dictionaryRouter.get('/:query', (req, res) => lookup(req, res, req.params.query));
