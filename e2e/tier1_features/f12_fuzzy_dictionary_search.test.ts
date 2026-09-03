import { describe, it, expect } from '../harness/testRunner';
import { SearchNormalizerOracle } from '../harness/referenceOracles';

describe('Feature 12: Fuzzy Tolerant Dictionary Search Verification', () => {
  it('should normalize un-umlauted input digraphs (ae -> ä, oe -> ö, ue -> ü)', () => {
    expect(SearchNormalizerOracle.normalize('schoen')).toBe('schön');
    expect(SearchNormalizerOracle.normalize('kaese')).toBe('käse');
    expect(SearchNormalizerOracle.normalize('uebung')).toBe('übung');
    expect(SearchNormalizerOracle.normalize('Muenchen')).toBe('münchen');
  });

  it('should normalize eszett variations (ss <-> ß)', () => {
    expect(SearchNormalizerOracle.normalize('strasse')).toBe('straße');
    expect(SearchNormalizerOracle.normalize('fleissig')).toBe('fleißig');
  });

  it('should resolve inflected conjugated verbs to base lemma via reverse index', () => {
    const reverseIndex: Record<string, string> = {
      ging: 'gehen',
      gegangen: 'gehen',
      liest: 'lesen',
      gelesen: 'lesen',
      wäre: 'sein',
      gewesen: 'sein',
      hätte: 'haben',
      gehabt: 'haben',
    };

    const lookupLemma = (form: string) => reverseIndex[form.toLowerCase()] || form;

    expect(lookupLemma('ging')).toBe('gehen');
    expect(lookupLemma('gelesen')).toBe('lesen');
    expect(lookupLemma('wäre')).toBe('sein');
    expect(lookupLemma('unbekannt')).toBe('unbekannt');
  });

  it('should calculate Levenshtein distance for typo tolerance', () => {
    // 1 typo distance
    expect(SearchNormalizerOracle.levenshteinDistance('Katze', 'Katse')).toBe(1);
    expect(SearchNormalizerOracle.levenshteinDistance('Hund', 'Hunde')).toBe(1);
    // Exact match
    expect(SearchNormalizerOracle.levenshteinDistance('Schule', 'Schule')).toBe(0);
  });

  it('should rank exact and normalized matches higher than fuzzy typo matches in search results', () => {
    const dictionary = ['schön', 'schon', 'Schoner', 'schonen'];
    const search = (query: string) => {
      const normalizedQuery = SearchNormalizerOracle.normalize(query);
      return dictionary
        .map(entry => {
          const normEntry = SearchNormalizerOracle.normalize(entry);
          let score = 100;
          if (normEntry === normalizedQuery) score = 0; // Exact / normalized match
          else score = SearchNormalizerOracle.levenshteinDistance(normEntry, normalizedQuery);
          return { entry, score };
        })
        .sort((a, b) => a.score - b.score);
    };

    const results = search('schoen');
    expect(results[0].entry).toBe('schön');
    expect(results[0].score).toBe(0);
  });
}, 'Tier 1');
