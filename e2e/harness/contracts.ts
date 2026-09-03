/**
 * Sprachweg E2E Test Suite - Core Data Types & Interface Contracts
 * Strictly derived from ORIGINAL_REQUEST.md & PROJECT.md
 */

// 1. Gemini AI & Caching Types
export interface GeminiRequestOptions<T> {
  prompt: string;
  systemInstruction?: string;
  responseSchema: object;
  temperature?: number;
  cacheKeyData?: string;
}

export interface GeminiClient {
  generateStructured<T>(options: GeminiRequestOptions<T>): Promise<T>;
  getCachedResponse<T>(hashKey: string): Promise<T | null>;
  setCachedResponse<T>(hashKey: string, requestType: string, promptHash: string, data: T): Promise<void>;
}

// 2. Linguistics & Satzklammer Types
export type Gender = 'der' | 'die' | 'das';
export type GermanCase = 'NOMINATIV' | 'AKKUSATIV' | 'DATIV' | 'GENITIV';
export type GrammaticalNumber = 'SINGULAR' | 'PLURAL';
export type POS = 'NOUN' | 'VERB' | 'ADJ' | 'ADV' | 'ART' | 'PREP' | 'PRON' | 'CONJ' | 'PART' | 'OTHER';
export type TopologicalField = 'VORFELD' | 'LINKE_SATZKLAMMER' | 'MITTELFELD' | 'RECHTE_SATZKLAMMER' | 'NACHFELD';
export type TeKaMoLo = 'TEMPORAL' | 'KAUSAL' | 'MODAL' | 'LOKAL';

export interface TokenGrammar {
  token: string;
  lemma: string;
  pos: POS;
  gender?: Gender | null;
  case?: GermanCase | null;
  grammaticalNumber?: GrammaticalNumber | null;
  syntaxRole: string; // e.g. "Subject", "Direct Object", "Predicate Verb"
  topologicalField: TopologicalField;
  tekamoloCategory?: TeKaMoLo | null;
  meaningEn: string;
  literalGlossEn: string;
}

export interface SentenceAnalysis {
  sentenceDe: string;
  sentenceEnNatural: string;
  sentenceEnLiteral: string;
  tokens: TokenGrammar[];
  topologicalMap: {
    vorfeld: string;
    linkeSatzklammer: string;
    mittelfeld: string;
    rechteSatzklammer: string;
    nachfeld?: string;
  };
  isNebensatz: boolean;
  conjunctionTrigger?: string;
  grammarTags: string[];
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  variations: {
    level: 'A1' | 'A2' | 'B1';
    textDe: string;
    textEn: string;
  }[];
}

// 3. FSRS Spaced Repetition Types
export type FsrsRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy
export type CardType = 'RECOGNITION' | 'PRODUCTION' | 'SENTENCE_CLOZE' | 'AUDIO_MEANING' | 'GENDER_DRILL' | 'PLURAL_DRILL';
export type CardState = 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';

export interface FsrsCardData {
  id: string;
  userId: string;
  cardType: CardType;
  front: string;
  back: string;
  contextSentence?: string;
  clozeDe?: string;
  audioUrl?: string;
  gender?: Gender;
  plural?: string;
  state: CardState;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReviewedAt?: string;
  dueAt: string;
}

export interface FsrsScheduleResult {
  rating: FsrsRating;
  card: FsrsCardData;
  reviewLog: {
    rating: FsrsRating;
    state: CardState;
    stability: number;
    difficulty: number;
    elapsedDays: number;
    scheduledDays: number;
    reviewedAt: string;
  };
}

// 4. Grammar & Drill Types
export type DrillType = 'FILL_IN' | 'REORDER' | 'TRANSFORM' | 'ERROR_SPOTTING';

export interface InteractiveDrill {
  id: string;
  topicId: string;
  type: DrillType;
  promptDe: string;
  promptEn: string;
  options?: string[];
  correctAnswer: string | string[];
  explanationDe: string;
  explanationEn: string;
  grammarTag: string;
}

export interface GrammarTopicSummary {
  id: string;
  titleDe: string;
  titleEn: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  weekNumber: number;
  tags: string[];
  mentalModel: string;
  paradigmTable: Record<string, any>;
  drillsCount: number;
}

export interface GrammarTagMastery {
  tag: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number; // 0.00 to 1.00
  needsRemediation: boolean; // accuracy < 0.80
}

// 5. Daily Session & Curriculum Types
export interface DailySessionPayload {
  userId: string;
  weekNumber: number;
  dayOfWeek: number;
}

export interface DailySessionPlan {
  sessionId: string;
  weekNumber: number;
  dayOfWeek: number;
  cefrLevel: string;
  block1Warmup: {
    dueCards: FsrsCardData[];
    remedialDrills: InteractiveDrill[];
  };
  block2Grammar: {
    topic: GrammarTopicSummary;
    mentalModel: string;
    paradigmTable: object;
    drills: InteractiveDrill[];
  };
  block3Mining: {
    sentences: SentenceAnalysis[];
  };
  block4Speaking: {
    mode: 'CONVERSATION' | 'ROLEPLAY' | 'PRONUNCIATION' | 'SHADOWING' | 'DICTATION';
    promptDe: string;
    targetPhonemes?: string[];
  };
  block5Immersion: {
    passageTitle: string;
    passageDe: string;
    tokens: TokenGrammar[];
    questions: { questionDe: string; options: string[]; answerIndex: number }[];
  };
}

// 6. Voice Studio & Debrief Types
export type VoiceMode = 'CONVERSATION' | 'ROLEPLAY' | 'PRONUNCIATION' | 'SHADOWING' | 'DICTATION';

export interface VoiceDebrief {
  sessionId: string;
  mode: VoiceMode;
  successes: [string, string, string]; // Exactly 3 successes
  corrections: [
    { original: string; corrected: string; explanation: string },
    { original: string; corrected: string; explanation: string },
    { original: string; corrected: string; explanation: string }
  ]; // Exactly 3 prioritized corrections
  minedVocabulary: [
    { wordDe: string; meaningEn: string; gender?: Gender; exampleDe: string },
    { wordDe: string; meaningEn: string; gender?: Gender; exampleDe: string },
    { wordDe: string; meaningEn: string; gender?: Gender; exampleDe: string },
    { wordDe: string; meaningEn: string; gender?: Gender; exampleDe: string },
    { wordDe: string; meaningEn: string; gender?: Gender; exampleDe: string }
  ]; // Exactly 5 mined words
  fluencyScore: number;
  pronunciationScore: number;
  taskCompletionScore?: number;
}

export interface PhoneticAnalysis {
  targetPhoneme: 'ü_ö' | 'ch_ich_ach' | 'uvular_r' | 'auslautverhaertung' | 'vowel_length' | 'glottal_stop';
  score: number; // 0 to 100
  pitchDifferenceHz: number;
  feedbackEn: string;
}

// 7. Dictionary & Morphology Types
export interface NounDeclensionMatrix {
  singular: {
    nominativ: string;
    akkusativ: string;
    dativ: string;
    genitiv: string;
  };
  plural: {
    nominativ: string;
    akkusativ: string;
    dativ: string;
    genitiv: string;
  };
  gender: Gender;
  pluralEnding: string;
  isNDeclension: boolean;
  diminutive?: string;
}

export interface VerbConjugationMatrix {
  praesens: Record<string, string>;
  praeteritum: Record<string, string>;
  perfekt: { auxiliary: 'haben' | 'sein'; partizipII: string };
  futurI: Record<string, string>;
  konjunktivI: Record<string, string>;
  konjunktivII: Record<string, string>;
  imperativ: { du: string; ihr: string; sie: string };
  isSeparable: boolean;
  prefix?: string;
  governedPreposition?: { preposition: string; case: GermanCase };
}

export interface CompoundBreakdown {
  original: string;
  elements: { word: string; pos: POS; translation: string }[];
  fugenElements: string[]; // e.g. ["s", "en", "n", "es", ""]
  headWord: string;
  gender: Gender;
}

// 8. Visual Constants & UI Contracts
export const GENDER_COLORS = {
  der: '#2563eb', // Blue
  die: '#dc2626', // Red
  das: '#16a34a', // Green
  diePlural: '#9333ea', // Purple
} as const;

export const GERMAN_SPECIAL_CHARACTERS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'] as const;
