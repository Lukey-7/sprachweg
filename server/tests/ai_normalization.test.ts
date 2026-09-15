import { describe, it, expect } from 'vitest';
import { normalizeGender, normalizePos, splitArticle } from '../src/linguistics/gender.js';
import { describeGeminiError, requireAllFields } from '../src/ai/geminiClient.js';
import { toPercent } from '../src/routes/speakingRoutes.js';
import { toDetail } from '../src/routes/dictionaryRoutes.js';

describe('normalizeGender', () => {
  it.each([
    ['der', 'der'], ['Der', 'der'], ['masculine', 'der'], ['m', 'der'], ['Maskulinum', 'der'], ['der (masculine)', 'der'],
    ['die', 'die'], ['feminine', 'die'], ['f', 'die'], ['Femininum', 'die'],
    ['das', 'das'], ['neuter', 'das'], ['n', 'das'], ['Neutrum', 'das'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeGender(input)).toBe(expected);
  });

  it.each([[''], ['none'], [null], [undefined], ['plural'], ['nominativ']])('%s → null', input => {
    expect(normalizeGender(input)).toBeNull();
  });
});

describe('splitArticle', () => {
  it('splits a leading article', () => {
    expect(splitArticle('der Kühlschrank')).toEqual({ gender: 'der', lemma: 'Kühlschrank' });
    expect(splitArticle('Das Brötchen')).toEqual({ gender: 'das', lemma: 'Brötchen' });
  });
  it('leaves words without an article alone', () => {
    expect(splitArticle('kaufen')).toEqual({ gender: null, lemma: 'kaufen' });
    expect(splitArticle('Dieser')).toEqual({ gender: null, lemma: 'Dieser' });
  });
});

describe('toPercent', () => {
  it('rescales 0–5 and 0–10 answers to percentages', () => {
    expect(toPercent(3.5, 4)).toBe(70);
    expect(toPercent(8, 9)).toBe(80);
  });
  it('keeps 0–100 answers and clamps out-of-range values', () => {
    expect(toPercent(72, 85)).toBe(72);
    expect(toPercent(140, 140)).toBe(100);
    expect(toPercent('abc', 50)).toBeUndefined();
  });
});

describe('normalizePos', () => {
  it.each([['Nomen', 'noun'], ['Substantiv', 'noun'], ['noun', 'noun'], ['Verb', 'verb'], ['Adjektiv', 'adjective'], ['Adverb', 'adverb'], ['Präposition', 'preposition'], ['', 'word']])(
    '%s → %s',
    (input, expected) => expect(normalizePos(input)).toBe(expected)
  );
});

describe('requireAllFields', () => {
  it('requires every property at every depth, including array items', () => {
    const out: any = requireAllFields({
      type: 'OBJECT',
      properties: {
        a: { type: 'STRING' },
        nested: { type: 'OBJECT', properties: { x: { type: 'STRING' }, y: { type: 'STRING' } } },
        list: { type: 'ARRAY', items: { type: 'OBJECT', properties: { z: { type: 'STRING' } } } },
      },
      required: ['a'],
    });
    expect(out.required).toEqual(['a', 'nested', 'list']);
    expect(out.properties.nested.required).toEqual(['x', 'y']);
    expect(out.properties.list.items.required).toEqual(['z']);
  });
});

describe('describeGeminiError', () => {
  it('turns a daily quota error into a readable message', () => {
    const raw = '{"error":{"code":429,"message":"You exceeded your current quota","status":"RESOURCE_EXHAUSTED","details":[{"violations":[{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaValue":"20"}]}]}}';
    expect(describeGeminiError(new Error(raw))).toMatch(/Daily AI limit reached \(20 requests\/day/);
  });
  it('reports timeouts and overload plainly', () => {
    expect(describeGeminiError(Object.assign(new Error('x'), { name: 'TimeoutError' }))).toMatch(/longer than/);
    expect(describeGeminiError(new Error('{"error":{"code":503,"message":"This model is currently experiencing high demand."}}'))).toMatch(/busy/);
  });
});

describe('toDetail', () => {
  const empty = { ich: '', du: '', er_sie_es: '', wir: '', ihr: '', sie_Sie: '' };
  const noun = {
    declensions: { nominativSg: 'der Schlüssel', nominativPl: 'die Schlüssel', akkusativSg: 'den Schlüssel', akkusativPl: 'die Schlüssel', dativSg: 'dem Schlüssel', dativPl: 'den Schlüsseln', genitivSg: 'des Schlüssels', genitivPl: 'der Schlüssel' },
    conjugations: { auxiliary: 'haben', partizipII: '', praesens: empty, praeteritum: empty },
    examples: [{ de: 'Wo ist der Schlüssel?', en: 'Where is the key?' }],
  };

  it('keeps only the noun table for a noun, even when the model filled in verb fields', () => {
    const d: any = toDetail(noun, 'noun');
    expect(d.nounTable.dativ.pl).toBe('den Schlüsseln');
    expect(d.verbTable).toBeUndefined();
    expect(d.examples).toHaveLength(1);
  });

  it('keeps only the verb table for a verb', () => {
    const d: any = toDetail(
      { declensions: { nominativSg: '', nominativPl: '' }, conjugations: { auxiliary: 'sein', partizipII: 'aufgestanden', praesens: { ...empty, du: 'stehst auf' }, praeteritum: { ...empty, wir: 'standen auf' } } },
      'verb'
    );
    expect(d.nounTable).toBeUndefined();
    expect(d.verbTable.perfekt).toEqual({ auxiliary: 'sein', partizipII: 'aufgestanden' });
  });

  it('shows no table for an adjective', () => {
    const d: any = toDetail({ declensions: { nominativSg: 'schnellen' }, conjugations: { praesens: empty, praeteritum: empty } }, 'adjective');
    expect(d).toEqual({});
  });
});
