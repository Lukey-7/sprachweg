import { GermanCase, PrepositionValidationResult } from './types.js';

export const ACCUSATIVE_PREPOSITIONS = new Set(['bis', 'durch', 'für', 'gegen', 'ohne', 'um', 'entlang']);
export const DATIVE_PREPOSITIONS = new Set(['aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu', 'gegenüber']);
export const GENITIVE_PREPOSITIONS = new Set(['während', 'wegen', 'trotz', 'statt', 'anstatt', 'außerhalb', 'innerhalb']);
export const WECHSEL_PREPOSITIONS = new Set(['an', 'auf', 'hinter', 'in', 'neben', 'über', 'unter', 'vor', 'zwischen']);

export const PREPOSITION_CONTRACTIONS: Record<string, { prep: string; case: GermanCase; article: string }> = {
  im: { prep: 'in', case: 'DATIV', article: 'dem' },
  ins: { prep: 'in', case: 'AKKUSATIV', article: 'das' },
  am: { prep: 'an', case: 'DATIV', article: 'dem' },
  ans: { prep: 'an', case: 'AKKUSATIV', article: 'das' },
  beim: { prep: 'bei', case: 'DATIV', article: 'dem' },
  vom: { prep: 'von', case: 'DATIV', article: 'dem' },
  zum: { prep: 'zu', case: 'DATIV', article: 'dem' },
  zur: { prep: 'zu', case: 'DATIV', article: 'der' },
  fürs: { prep: 'für', case: 'AKKUSATIV', article: 'das' },
  durchs: { prep: 'durch', case: 'AKKUSATIV', article: 'das' },
  ums: { prep: 'um', case: 'AKKUSATIV', article: 'das' },
};

export function validatePrepositionCase(
  preposition: string,
  detectedCase: GermanCase,
  isDirectional: boolean = false
): PrepositionValidationResult {
  const prep = preposition.toLowerCase().trim();

  // Check contractions
  if (PREPOSITION_CONTRACTIONS[prep]) {
    const info = PREPOSITION_CONTRACTIONS[prep];
    const valid = detectedCase === info.case;
    return {
      valid,
      preposition: info.prep,
      detectedCase,
      expectedCases: [info.case],
      isWechsel: WECHSEL_PREPOSITIONS.has(info.prep),
      explanation: valid
        ? `Contraction "${prep}" correctly fuses "${info.prep} + ${info.article}" in ${info.case}.`
        : `Contraction "${prep}" requires ${info.case}, but ${detectedCase} was provided.`,
    };
  }

  if (ACCUSATIVE_PREPOSITIONS.has(prep)) {
    const valid = detectedCase === 'AKKUSATIV';
    return {
      valid,
      preposition: prep,
      detectedCase,
      expectedCases: ['AKKUSATIV'],
      isWechsel: false,
      explanation: valid
        ? `The preposition "${prep}" strictly governs the Akkusativ case (DOGFU: durch, ohne, gegen, für, um).`
        : `The preposition "${prep}" requires Akkusativ, but ${detectedCase} was found.`,
    };
  }

  if (DATIVE_PREPOSITIONS.has(prep)) {
    const valid = detectedCase === 'DATIV';
    return {
      valid,
      preposition: prep,
      detectedCase,
      expectedCases: ['DATIV'],
      isWechsel: false,
      explanation: valid
        ? `The preposition "${prep}" strictly governs the Dativ case (aus, bei, mit, nach, seit, von, zu).`
        : `The preposition "${prep}" requires Dativ, but ${detectedCase} was found.`,
    };
  }

  if (GENITIVE_PREPOSITIONS.has(prep)) {
    const valid = detectedCase === 'GENITIV';
    return {
      valid,
      preposition: prep,
      detectedCase,
      expectedCases: ['GENITIV'],
      isWechsel: false,
      explanation: valid
        ? `The preposition "${prep}" governs the Genitiv case (während, wegen, trotz, statt).`
        : `The preposition "${prep}" requires Genitiv, but ${detectedCase} was found.`,
    };
  }

  if (WECHSEL_PREPOSITIONS.has(prep)) {
    const expectedCase: GermanCase = isDirectional ? 'AKKUSATIV' : 'DATIV';
    const valid = detectedCase === expectedCase;
    return {
      valid,
      preposition: prep,
      detectedCase,
      expectedCases: [expectedCase],
      isWechsel: true,
      explanation: valid
        ? `Wechselpräposition "${prep}" correctly uses ${expectedCase} for ${isDirectional ? 'directional motion (Wohin?)' : 'static location (Wo?)'}.`
        : `Wechselpräposition "${prep}" requires ${expectedCase} for ${isDirectional ? 'directional motion (Wohin?)' : 'static location (Wo?)'}, but ${detectedCase} was found.`,
    };
  }

  return {
    valid: true,
    preposition: prep,
    detectedCase,
    expectedCases: [detectedCase],
    isWechsel: false,
    explanation: `Preposition "${prep}" recognized.`,
  };
}
