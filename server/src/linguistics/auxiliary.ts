import { AuxiliaryValidationResult } from './types.js';

export const SEIN_AUX_VERBS = new Set([
  'gehen', 'kommen', 'fahren', 'fliegen', 'laufen', 'schwimmen', 'reisen', 'wandern',
  'fallen', 'steigen', 'sterben', 'wachsen', 'aufstehen', 'einschlafen', 'bleiben',
  'sein', 'werden', 'passieren', 'geschehen', 'rennen', 'springen', 'ankommen',
  'abfahren', 'umsteigen', 'aussteigen', 'einsteigen', 'aufwachen', 'ertrinken',
  'schmelzen', 'verblühen', 'entstehen', 'gelingen', 'misslingen', 'eintreffen',
  'abfliegen', 'losfahren', 'losgehen', 'aufbrechen', 'verschwinden', 'sinken',
  'umkommen', 'verreisen', 'spazieren', 'joggen', 'tauchen', 'klettern'
]);

export function getAuxiliaryVerb(verbLemma: string): 'haben' | 'sein' {
  const lemma = verbLemma.toLowerCase().trim();
  if (SEIN_AUX_VERBS.has(lemma)) {
    return 'sein';
  }
  return 'haben';
}

export function validateAuxiliaryVerb(
  verbLemma: string,
  detectedAuxiliary?: 'haben' | 'sein'
): AuxiliaryValidationResult {
  const lemma = verbLemma.toLowerCase().trim();
  const expectedAuxiliary = getAuxiliaryVerb(lemma);
  const detected = detectedAuxiliary || expectedAuxiliary;
  const valid = detected === expectedAuxiliary;

  const explanation = valid
    ? expectedAuxiliary === 'sein'
      ? `"${lemma}" indicates motion, a change of state, or is an existential verb (sein/bleiben/werden), requiring auxiliary "sein".`
      : `"${lemma}" is a transitive or standard action verb, requiring auxiliary "haben".`
    : `Incorrect auxiliary verb "${detected}" used for "${lemma}". It requires "${expectedAuxiliary}".`;

  return {
    valid,
    verbLemma: lemma,
    detectedAuxiliary: detected,
    expectedAuxiliary,
    explanation,
  };
}
