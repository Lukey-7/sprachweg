import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { geminiService, GeminiUnavailableError, WordLookupResponseSchema } from '../ai/geminiClient.js';
import { normalizeGender, normalizePos, splitArticle } from '../linguistics/gender.js';

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

/** Falls back to the article in the nominative singular form, e.g. "der Kühlschrank". */
function genderFromTable(g: any): 'der' | 'die' | 'das' | null {
  return splitArticle(String(g?.declensions?.nominativSg || '')).gender;
}

/**
 * Converts a Gemini lookup into the stored detail shape the app renders. The response
 * schema requires every field, so tables that don't apply arrive filled with empty
 * strings (or guesses); only the table matching the part of speech is kept.
 */
export function toDetail(g: any, pos: string) {
  const d = g.declensions;
  const c = g.conjugations;
  const detail: Record<string, unknown> = {};
  const filled = (obj: any) => !!obj && Object.values(obj).some(v => typeof v === 'string' && v.trim() !== '');

  if (pos === 'noun' && (d?.nominativSg || d?.nominativPl)) {
    detail.nounTable = {
      nominativ: { sg: d.nominativSg || '', pl: d.nominativPl || '' },
      akkusativ: { sg: d.akkusativSg || '', pl: d.akkusativPl || '' },
      dativ: { sg: d.dativSg || '', pl: d.dativPl || '' },
      genitiv: { sg: d.genitivSg || '', pl: d.genitivPl || '' },
    };
  }
  if (pos === 'verb' && filled(c?.praesens) && filled(c?.praeteritum)) {
    detail.verbTable = {
      praesens: c.praesens,
      praeteritum: c.praeteritum,
      perfekt: { auxiliary: c.auxiliary === 'sein' ? 'sein' : 'haben', partizipII: c.partizipII || c.perfekt3sg || '' },
      ...(c.konjunktiv2_3sg && { konjunktivII: { ich: c.konjunktiv2_3sg, er_sie_es: c.konjunktiv2_3sg } }),
      ...(c.governedPreposition && { governedPreposition: c.governedPreposition }),
      ...(c.governedCase && { governedCase: c.governedCase.toLowerCase() }),
    };
  }
  const examples = Array.isArray(g.examples) ? g.examples.filter((e: any) => e?.de) : [];
  if (examples.length) detail.examples = examples;
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
    // Models sometimes include the article in the lemma ("der Kühlschrank").
    const split = splitArticle(String(result.lemma || query));
    const lemma = split.lemma;
    const pos = normalizePos(result.pos);
    const gender = normalizeGender(result.gender) ?? split.gender ?? (pos === 'noun' ? genderFromTable(result) : null);
    const word = await prisma.word.upsert({
      where: { lemma },
      update: {},
      create: {
        lemma,
        normalizedLemma: normalize(lemma),
        pos,
        gender,
        cefrLevel: result.cefrLevel || 'B1',
        ipa: result.ipa || null,
        meaningEn: result.meaningEn,
        secondaryMeanings: result.secondaryMeanings?.length ? JSON.stringify(result.secondaryMeanings) : null,
        disambiguation: result.disambiguation || null,
        falseFriends: result.falseFriends || null,
        collocations: result.collocations?.length ? JSON.stringify(result.collocations) : null,
        idioms: result.idioms?.length ? JSON.stringify(result.idioms) : null,
        isCompound: !!result.isCompound,
        compoundParts: result.isCompound && result.compoundParts?.length ? JSON.stringify(result.compoundParts) : null,
        detailJson: JSON.stringify(toDetail(result, pos)),
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
