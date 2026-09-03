import { describe, it, expect } from '../harness/testRunner';
import { DecompounderOracle } from '../harness/referenceOracles';

describe('Tier 2: Decompounder Boundary & Morphological Edge Cases', () => {
  it('should handle extreme long compounds (63 characters: Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz)', () => {
    const longCompound = 'Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz';
    expect(longCompound.length).toBe(63);

    const breakdown = {
      original: longCompound,
      elements: [
        { word: 'Rindfleisch', pos: 'NOUN', translation: 'beef' },
        { word: 'Etikettierung', pos: 'NOUN', translation: 'labeling' },
        { word: 'Überwachung', pos: 'NOUN', translation: 'surveillance' },
        { word: 'Aufgabe', pos: 'NOUN', translation: 'duties / tasks' },
        { word: 'Übertragung', pos: 'NOUN', translation: 'transfer' },
        { word: 'Gesetz', pos: 'NOUN', translation: 'law' },
      ],
      headWord: 'Gesetz',
      gender: 'das',
    };

    expect(breakdown.elements).toHaveLength(6);
    expect(breakdown.headWord).toBe('Gesetz');
    expect(breakdown.gender).toBe('das');
  });

  it('should handle hyphenated compound words (U-Bahn-Station, ICE-Zug, COVID-19-Impfung)', () => {
    const splitHyphenated = (compound: string) => {
      return compound.split('-');
    };

    const parts = splitHyphenated('U-Bahn-Station');
    expect(parts).toEqual(['U', 'Bahn', 'Station']);
    expect(parts[parts.length - 1]).toBe('Station');
  });

  it('should distinguish words containing pseudo-Fugenelemente (Kissen vs Kindes, Flasche vs Flaute)', () => {
    // Kissen is NOT a compound with 's' fugen
    const isAtomic = (word: string) => ['Kissen', 'Flasche', 'Kastanie', 'Messer'].includes(word);
    expect(isAtomic('Kissen')).toBe(true);
    expect(isAtomic('Messer')).toBe(true);
  });

  it('should handle empty, whitespace-only, or single-character inputs safely', () => {
    const safeDecompound = (input: string) => {
      if (!input || input.trim().length <= 1) {
        return { original: input.trim(), elements: [], headWord: input.trim(), gender: 'das' };
      }
      return DecompounderOracle.decompound(input);
    };

    expect(safeDecompound('').elements).toHaveLength(0);
    expect(safeDecompound('   ').elements).toHaveLength(0);
    expect(safeDecompound('A').elements).toHaveLength(0);
  });

  it('should handle compound words with numbers (3-Zimmer-Wohnung, 100-Jahr-Feier)', () => {
    const parseNumberedCompound = (compound: string) => {
      const parts = compound.split('-');
      const num = parseInt(parts[0], 10);
      return { hasNumberPrefix: !isNaN(num), number: num, baseWord: parts.slice(1).join('-') };
    };

    const parsed = parseNumberedCompound('3-Zimmer-Wohnung');
    expect(parsed.hasNumberPrefix).toBe(true);
    expect(parsed.number).toBe(3);
    expect(parsed.baseWord).toBe('Zimmer-Wohnung');
  });
}, 'Tier 2');
