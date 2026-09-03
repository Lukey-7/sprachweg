import { Gender, GermanCase, GrammaticalNumber, DeclensionCategory, DeclensionValidationResult } from './types.js';

export const DEFINITE_ARTICLES: Record<GermanCase, Record<Gender | 'diePlural', string>> = {
  NOMINATIV: { der: 'der', die: 'die', das: 'das', diePlural: 'die' },
  AKKUSATIV: { der: 'den', die: 'die', das: 'das', diePlural: 'die' },
  DATIV: { der: 'dem', die: 'der', das: 'dem', diePlural: 'den' },
  GENITIV: { der: 'des', die: 'der', das: 'des', diePlural: 'der' },
};

export const INDEFINITE_ARTICLES: Record<GermanCase, Record<Gender, string>> = {
  NOMINATIV: { der: 'ein', die: 'eine', das: 'ein' },
  AKKUSATIV: { der: 'einen', die: 'eine', das: 'ein' },
  DATIV: { der: 'einem', die: 'einer', das: 'einem' },
  GENITIV: { der: 'eines', die: 'einer', das: 'eines' },
};

export const WEAK_ADJECTIVE_ENDINGS: Record<GermanCase, Record<Gender | 'diePlural', string>> = {
  NOMINATIV: { der: 'e', die: 'e', das: 'e', diePlural: 'en' },
  AKKUSATIV: { der: 'en', die: 'e', das: 'e', diePlural: 'en' },
  DATIV: { der: 'en', die: 'en', das: 'en', diePlural: 'en' },
  GENITIV: { der: 'en', die: 'en', das: 'en', diePlural: 'en' },
};

export const MIXED_ADJECTIVE_ENDINGS: Record<GermanCase, Record<Gender | 'diePlural', string>> = {
  NOMINATIV: { der: 'er', die: 'e', das: 'es', diePlural: 'en' },
  AKKUSATIV: { der: 'en', die: 'e', das: 'es', diePlural: 'en' },
  DATIV: { der: 'en', die: 'en', das: 'en', diePlural: 'en' },
  GENITIV: { der: 'en', die: 'en', das: 'en', diePlural: 'en' },
};

export const STRONG_ADJECTIVE_ENDINGS: Record<GermanCase, Record<Gender | 'diePlural', string>> = {
  NOMINATIV: { der: 'er', die: 'e', das: 'es', diePlural: 'e' },
  AKKUSATIV: { der: 'en', die: 'e', das: 'es', diePlural: 'e' },
  DATIV: { der: 'em', die: 'er', das: 'em', diePlural: 'en' },
  GENITIV: { der: 'en', die: 'er', das: 'en', diePlural: 'er' },
};

export const N_DECLENSION_NOUNS = new Set([
  'junge', 'herr', 'kollege', 'student', 'polizist', 'kunde', 'nachbar',
  'tourist', 'mensch', 'bär', 'baer', 'löwe', 'loewe', 'automat', 'experte',
  'patient', 'zeuge', 'name', 'affe', 'biologe', 'diplomat', 'elefant',
  'fotograf', 'journalist', 'kamerad', 'laie', 'neffe', 'optimist',
  'philosoph', 'präsident', 'praesident', 'psychologe', 'rabe', 'soziologe'
]);

export function isWeakNDeclensionNoun(noun: string, gender: Gender): boolean {
  if (gender !== 'der') return false;
  const lower = noun.toLowerCase().trim();
  return N_DECLENSION_NOUNS.has(lower) || (gender === 'der' && lower.endsWith('ent') && lower.length > 5) || (gender === 'der' && lower.endsWith('ist') && lower.length > 5);
}

export function validateNounDeclension(
  noun: string,
  gender: Gender,
  targetCase: GermanCase,
  number: GrammaticalNumber,
  isNDeclension: boolean = false
): string {
  const cleanNoun = noun.trim();
  const isWeak = isNDeclension || isWeakNDeclensionNoun(cleanNoun, gender);

  if (isWeak && gender === 'der' && !(targetCase === 'NOMINATIV' && number === 'SINGULAR')) {
    if (cleanNoun.toLowerCase() === 'herr') {
      return number === 'PLURAL' ? `${cleanNoun}en` : `${cleanNoun}n`;
    }
    if (cleanNoun.endsWith('e')) return `${cleanNoun}n`;
    if (!cleanNoun.endsWith('en')) return `${cleanNoun}en`;
    return cleanNoun;
  }

  if (number === 'SINGULAR') {
    if (targetCase === 'GENITIV') {
      if (gender === 'der' || gender === 'das') {
        const lower = cleanNoun.toLowerCase();
        if (
          lower.endsWith('s') ||
          lower.endsWith('z') ||
          lower.endsWith('ß') ||
          lower.endsWith('sch') ||
          lower.endsWith('x') ||
          lower.endsWith('tz') ||
          lower.endsWith('st')
        ) {
          return `${cleanNoun}es`;
        }
        return `${cleanNoun}s`;
      }
    }
    return cleanNoun;
  } else {
    // Dative plural adds -n if not ending in -n or -s
    if (targetCase === 'DATIV') {
      if (!cleanNoun.endsWith('n') && !cleanNoun.endsWith('s')) {
        return `${cleanNoun}n`;
      }
    }
    return cleanNoun;
  }
}

export function getAdjectiveEnding(
  category: DeclensionCategory,
  targetCase: GermanCase,
  gender: Gender | 'diePlural'
): string {
  switch (category) {
    case 'weak':
      return WEAK_ADJECTIVE_ENDINGS[targetCase][gender];
    case 'mixed':
      return MIXED_ADJECTIVE_ENDINGS[targetCase][gender];
    case 'strong':
      return STRONG_ADJECTIVE_ENDINGS[targetCase][gender];
    default:
      return 'e';
  }
}

export function getNounDeclensionMatrix(
  noun: string,
  gender: Gender,
  pluralForm: string,
  isNDeclension: boolean = false
) {
  return {
    singular: {
      nominativ: noun,
      akkusativ: validateNounDeclension(noun, gender, 'AKKUSATIV', 'SINGULAR', isNDeclension),
      dativ: validateNounDeclension(noun, gender, 'DATIV', 'SINGULAR', isNDeclension),
      genitiv: validateNounDeclension(noun, gender, 'GENITIV', 'SINGULAR', isNDeclension),
    },
    plural: {
      nominativ: pluralForm,
      akkusativ: pluralForm,
      dativ: validateNounDeclension(pluralForm, gender, 'DATIV', 'PLURAL', isNDeclension),
      genitiv: pluralForm,
    },
    gender,
    isNDeclension,
  };
}
