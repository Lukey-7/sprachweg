/**
 * Maps the many ways a model or source can express grammatical gender
 * ("der", "masculine", "m", "Maskulinum", "der (masculine)") to der/die/das.
 * Returns null for non-nouns or anything unrecognised.
 */
export function normalizeGender(value: unknown): 'der' | 'die' | 'das' | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (!v) return null;
  if (/^(der|m|masc|masculine|maskulin(um)?|männlich)\b/.test(v)) return 'der';
  if (/^(die|f|fem|feminine|feminin(um)?|weiblich)\b/.test(v)) return 'die';
  if (/^(das|n|neut|neuter|neutral|neutrum|sächlich)\b/.test(v)) return 'das';
  return null;
}

const POS: [RegExp, string][] = [
  [/^(noun|nomen|substantiv)/, 'noun'],
  [/^(verb)/, 'verb'],
  [/^(adj)/, 'adjective'],
  [/^(adv)/, 'adverb'],
  [/^(prep|präp|praep)/, 'preposition'],
  [/^(conj|konj)/, 'conjunction'],
  [/^(pron)/, 'pronoun'],
  [/^(art)/, 'article'],
  [/^(part)/, 'particle'],
];

/** Maps English or German part-of-speech names ("Nomen", "Adjektiv") to the app's English ones. */
export function normalizePos(value: unknown): string {
  const v = String(value ?? '').trim().toLowerCase();
  return POS.find(([re]) => re.test(v))?.[1] ?? (v || 'word');
}

/** Splits a leading article off a noun: "der Kaffee" → { gender: "der", lemma: "Kaffee" }. */
export function splitArticle(word: string): { gender: 'der' | 'die' | 'das' | null; lemma: string } {
  const m = word.trim().match(/^(der|die|das)\s+(.+)$/i);
  return m ? { gender: m[1].toLowerCase() as 'der' | 'die' | 'das', lemma: m[2] } : { gender: null, lemma: word.trim() };
}
