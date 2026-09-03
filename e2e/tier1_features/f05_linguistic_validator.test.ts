import { describe, it, expect } from '../harness/testRunner';
import { LinguisticValidatorOracle } from '../harness/referenceOracles';

describe('Feature 5: Multi-Pass Linguistic Validator Verification', () => {
  it('should validate accusative preposition governance (bis, durch, für, gegen, ohne, um)', () => {
    const testCases = [
      { prep: 'für', case: 'AKKUSATIV' as const, expected: true },
      { prep: 'ohne', case: 'AKKUSATIV' as const, expected: true },
      { prep: 'durch', case: 'DATIV' as const, expected: false },
      { prep: 'gegen', case: 'GENITIV' as const, expected: false },
    ];

    for (const tc of testCases) {
      const res = LinguisticValidatorOracle.validatePrepositionCase(tc.prep, tc.case);
      expect(res.valid).toBe(tc.expected);
    }
  });

  it('should validate dative preposition governance (aus, bei, mit, nach, seit, von, zu)', () => {
    const testCases = [
      { prep: 'mit', case: 'DATIV' as const, expected: true },
      { prep: 'nach', case: 'DATIV' as const, expected: true },
      { prep: 'von', case: 'AKKUSATIV' as const, expected: false },
      { prep: 'bei', case: 'NOMINATIV' as const, expected: false },
    ];

    for (const tc of testCases) {
      const res = LinguisticValidatorOracle.validatePrepositionCase(tc.prep, tc.case);
      expect(res.valid).toBe(tc.expected);
    }
  });

  it('should validate two-way Wechselpräpositionen based on directional motion vs static location', () => {
    // in den Park gehen (motion -> Akkusativ)
    const motionRes = LinguisticValidatorOracle.validatePrepositionCase('in', 'AKKUSATIV', true);
    expect(motionRes.valid).toBe(true);

    // im (in dem) Park sein (location -> Dativ)
    const locationRes = LinguisticValidatorOracle.validatePrepositionCase('in', 'DATIV', false);
    expect(locationRes.valid).toBe(true);

    // Incorrect: in den Park sein (location with Akkusativ)
    const invalidLoc = LinguisticValidatorOracle.validatePrepositionCase('in', 'AKKUSATIV', false);
    expect(invalidLoc.valid).toBe(false);
  });

  it('should validate auxiliary verb selection (haben vs sein in Perfekt)', () => {
    // Verbs of motion or change of state -> sein
    expect(LinguisticValidatorOracle.validateAuxiliaryVerb('gehen')).toBe('sein');
    expect(LinguisticValidatorOracle.validateAuxiliaryVerb('fahren')).toBe('sein');
    expect(LinguisticValidatorOracle.validateAuxiliaryVerb('bleiben')).toBe('sein');
    expect(LinguisticValidatorOracle.validateAuxiliaryVerb('sterben')).toBe('sein');

    // Transitive and standard action verbs -> haben
    expect(LinguisticValidatorOracle.validateAuxiliaryVerb('kaufen')).toBe('haben');
    expect(LinguisticValidatorOracle.validateAuxiliaryVerb('lesen')).toBe('haben');
    expect(LinguisticValidatorOracle.validateAuxiliaryVerb('essen')).toBe('haben');
    expect(LinguisticValidatorOracle.validateAuxiliaryVerb('arbeiten')).toBe('haben');
  });

  it('should validate noun declension ending rules across 4 cases and numbers', () => {
    // Genitive singular masculine adds -es or -s
    expect(LinguisticValidatorOracle.validateNounDeclension('Tisch', 'der', 'GENITIV', 'SINGULAR')).toBe('Tisches');
    expect(LinguisticValidatorOracle.validateNounDeclension('Hund', 'der', 'GENITIV', 'SINGULAR')).toBe('Hunds');

    // Genitive singular feminine does not add -s
    expect(LinguisticValidatorOracle.validateNounDeclension('Frau', 'die', 'GENITIV', 'SINGULAR')).toBe('Frau');

    // Dative plural adds -n
    expect(LinguisticValidatorOracle.validateNounDeclension('Kinder', 'die', 'DATIV', 'PLURAL')).toBe('Kindern');
    expect(LinguisticValidatorOracle.validateNounDeclension('Autos', 'das', 'DATIV', 'PLURAL')).toBe('Autos'); // already ends in s
  });
}, 'Tier 1');
