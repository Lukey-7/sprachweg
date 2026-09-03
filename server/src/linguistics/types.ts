export type Gender = 'der' | 'die' | 'das';
export type GermanCase = 'NOMINATIV' | 'AKKUSATIV' | 'DATIV' | 'GENITIV';
export type GrammaticalNumber = 'SINGULAR' | 'PLURAL';
export type POS = 'NOUN' | 'VERB' | 'ADJ' | 'ADV' | 'ART' | 'PREP' | 'PRON' | 'CONJ' | 'PART' | 'OTHER';
export type TopologicalField = 'VORFELD' | 'LINKE_SATZKLAMMER' | 'MITTELFELD' | 'RECHTE_SATZKLAMMER' | 'NACHFELD';
export type TeKaMoLo = 'TEMPORAL' | 'KAUSAL' | 'MODAL' | 'LOKAL';
export type DeclensionCategory = 'strong' | 'weak' | 'mixed';

export interface PrepositionValidationResult {
  valid: boolean;
  preposition: string;
  detectedCase: GermanCase;
  expectedCases: GermanCase[];
  isWechsel: boolean;
  explanation: string;
}

export interface AuxiliaryValidationResult {
  valid: boolean;
  verbLemma: string;
  detectedAuxiliary: 'haben' | 'sein';
  expectedAuxiliary: 'haben' | 'sein';
  explanation: string;
}

export interface DeclensionValidationResult {
  valid: boolean;
  noun: string;
  gender: Gender;
  case: GermanCase;
  number: GrammaticalNumber;
  expectedForm: string;
  explanation: string;
}

export interface TopologicalParseResult {
  vorfeld: string;
  linkeSatzklammer: string;
  mittelfeld: string;
  rechteSatzklammer: string;
  nachfeld: string;
  isNebensatz: boolean;
  clauseType: 'HAUPTSATZ_V2' | 'NEBENSATZ' | 'V1_QUESTION' | 'V1_IMPERATIVE';
  conjunctionTrigger?: string;
  finiteVerb?: string;
  verbFinal?: string;
}

export type DiagnosticErrorCode =
  | 'GENDER_MISMATCH'
  | 'CASE_GOVERNANCE_ERROR'
  | 'AUXILIARY_SELECTION_ERROR'
  | 'V2_WORD_ORDER_VIOLATION'
  | 'NEBENSATZ_VERB_FINAL_VIOLATION'
  | 'ADJECTIVE_DECLENSION_ERROR'
  | 'NOUN_DECLENSION_ERROR'
  | 'PLURAL_FORMATION_ERROR'
  | 'CAPITALIZATION_ERROR'
  | 'UMLAUT_SPELLING_ERROR';

export interface DiagnosticError {
  code: DiagnosticErrorCode;
  messageEn: string;
  messageDe: string;
  expected: string;
  actual: string;
  ruleExplanation: string;
  grammarTag: string;
  severity: 'ERROR' | 'WARNING';
}

export interface DiagnosticReport {
  isValid: boolean;
  errors: DiagnosticError[];
  suggestions: string[];
}
