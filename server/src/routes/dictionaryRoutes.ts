import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { geminiService, WordLookupResponseSchema } from '../ai/geminiClient.js';

export const dictionaryRouter = Router();

dictionaryRouter.get('/lookup', async (req: Request, res: Response) => {
  try {
    const query = ((req.query.q as string) || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    // 1. Check local DB Word cache
    const normalized = query.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
    const existingWord = await prisma.word.findFirst({
      where: {
        OR: [
          { lemma: query },
          { normalizedLemma: normalized },
        ],
      },
      include: { forms: true },
    });

    if (existingWord) {
      return res.json({ word: existingWord, source: 'database' });
    }

    // 2. Fetch via Gemini Service (with SHA-256 SQLite cache)
    const geminiResult = await geminiService.generateStructured({
      prompt: `Provide complete German dictionary entry and declension/conjugation tables for the word "${query}".`,
      responseSchema: WordLookupResponseSchema,
      cacheType: 'dictionary_lookup',
      cacheKeyData: { query: query.toLowerCase() },
    });

    res.json({ word: geminiResult, source: 'gemini' });
  } catch (error: any) {
    res.status(500).json({ error: 'Dictionary lookup failed', message: error?.message });
  }
});

dictionaryRouter.get('/:query', async (req: Request, res: Response) => {
  try {
    const query = (req.params.query || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const normalized = query.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
    const existingWord = await prisma.word.findFirst({
      where: {
        OR: [
          { lemma: query },
          { normalizedLemma: normalized },
        ],
      },
      include: { forms: true },
    });

    if (existingWord) {
      return res.json({ word: existingWord, source: 'database' });
    }

    const geminiResult = await geminiService.generateStructured({
      prompt: `Provide complete German dictionary entry and declension/conjugation tables for the word "${query}".`,
      responseSchema: WordLookupResponseSchema,
      cacheType: 'dictionary_lookup',
      cacheKeyData: { query: query.toLowerCase() },
    });

    res.json({ word: geminiResult, source: 'gemini' });
  } catch (error: any) {
    res.status(500).json({ error: 'Dictionary lookup failed', message: error?.message });
  }
});

dictionaryRouter.get('/autocomplete', async (req: Request, res: Response) => {
  try {
    const prefix = ((req.query.q as string) || '').toLowerCase().trim();
    const suggestions = await prisma.word.findMany({
      where: {
        normalizedLemma: { startsWith: prefix },
      },
      take: 8,
      select: {
        lemma: true,
        pos: true,
        gender: true,
        meaningEn: true,
        cefrLevel: true,
      },
    });

    res.json({ suggestions });
  } catch (error: any) {
    res.status(500).json({ error: 'Autocomplete failed', message: error?.message });
  }
});
