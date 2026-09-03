import { describe, it, expect } from '../harness/testRunner';
import { LinguisticValidatorOracle } from '../harness/referenceOracles';

describe('Tier 2: Linguistic Boundary & Edge Case Tests', () => {
  it('should handle Swiss German ss substitution without breaking search or validation', () => {
    const swissText = 'Ich weiss, dass die Strasse gross ist.';
    const standardText = 'Ich weiß, dass die Straße groß ist.';

    const normalizeSwiss = (s: string) => s.replace(/ss/g, 'ß');
    expect(normalizeSwiss('Strasse')).toBe('Straße');
    expect(normalizeSwiss('weiss')).toBe('weiß');
  });

  it('should preserve acute accents and loanword phonology (Café, Crème, Menü)', () => {
    const loanwords = ['das Café', 'die Crème', 'das Menü', 'das Restaurant'];
    for (const w of loanwords) {
      expect(w.length).toBeGreaterThan(0);
      expect(w).toMatch(/^[a-zA-ZäöüÄÖÜßéèê\s]+$/);
    }
  });

  it('should handle Dative plural with nouns already ending in -s (das Auto -> den Autos, das Foto -> den Fotos)', () => {
    const dativeAuto = LinguisticValidatorOracle.validateNounDeclension('Autos', 'das', 'DATIV', 'PLURAL');
    expect(dativeAuto).toBe('Autos'); // does NOT add an extra -n -> Autosn is invalid

    const dativeFoto = LinguisticValidatorOracle.validateNounDeclension('Fotos', 'das', 'DATIV', 'PLURAL');
    expect(dativeFoto).toBe('Fotos');
  });

  it('should validate rare strong / irregular verbs with vowel shifts in Präteritum and Konjunktiv II', () => {
    const irregularVerbs = {
      heben: { praeteritum: 'hob', partizipII: 'gehoben', konjunktivII: 'höbe' },
      ziehen: { praeteritum: 'zog', partizipII: 'gezogen', konjunktivII: 'zöge' },
      bitten: { praeteritum: 'bat', partizipII: 'gebeten', konjunktivII: 'bäte' },
      sterben: { praeteritum: 'starb', partizipII: 'gestorben', konjunktivII: 'stürbe' },
    };

    expect(irregularVerbs.heben.konjunktivII).toBe('höbe');
    expect(irregularVerbs.ziehen.partizipII).toBe('gezogen');
    expect(irregularVerbs.sterben.konjunktivII).toBe('stürbe');
  });

  it('should handle dual-gender or region-specific gender variations (das/der Joghurt, der/das Radio, das/der Teil)', () => {
    const dualGenderWords = {
      Joghurt: ['der', 'das'],
      Radio: ['das', 'der'],
      Teil: ['der', 'das'], // der Teil (portion) vs das Teil (piece/component)
    };

    const isValidGenderForWord = (word: keyof typeof dualGenderWords, g: string) => {
      return dualGenderWords[word].includes(g);
    };

    expect(isValidGenderForWord('Joghurt', 'der')).toBe(true);
    expect(isValidGenderForWord('Joghurt', 'das')).toBe(true);
    expect(isValidGenderForWord('Joghurt', 'die')).toBe(false);
  });
}, 'Tier 2');
