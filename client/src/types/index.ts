export type CEFRLevel = 'A0' | 'A1' | 'A2' | 'B1_START' | 'B1_SOLID' | 'B2';

export interface User {
  id: string;
  email: string;
  name: string;
  activeLevel: CEFRLevel;
  currentWeek: number;
  streakCount: number;
  freezeTokens: number;
  settings?: UserSettings;
}

export interface UserSettings {
  dailyNewCards: number;
  dailyReviewCap: number;
  targetRetention: number;
  voiceSpeed: number;
  ttsVoice: string;
  theme: 'light' | 'dark' | 'system';
  autoPlayAudio: boolean;
}

export interface WordEntry {
  id: string;
  lemma: string;
  normalizedLemma: string;
  pos: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'pronoun' | 'article' | 'particle';
  gender?: 'der' | 'die' | 'das' | null;
  cefrLevel: 'A0' | 'A1' | 'A2' | 'B1' | 'B1_START' | 'B1_SOLID' | 'B2';
  frequencyRank?: number;
  ipa?: string;
  audioUrl?: string;
  meaningEn: string;
  secondaryMeanings?: string[];
  register?: string;
  disambiguation?: string;
  falseFriends?: string;
  collocations?: string[];
  idioms?: string[];
  isCompound?: boolean;
  compoundParts?: { part: string; meaningEn: string; isFugenelement?: boolean; gender?: string }[];
  nounTable?: {
    nominativ: { sg: string; pl: string };
    akkusativ: { sg: string; pl: string };
    dativ: { sg: string; pl: string };
    genitiv: { sg: string; pl: string };
  };
  verbTable?: {
    praesens: { ich: string; du: string; er_sie_es: string; wir: string; ihr: string; sie_Sie: string };
    praeteritum: { ich: string; du: string; er_sie_es: string; wir: string; ihr: string; sie_Sie: string };
    perfekt: { auxiliary: 'haben' | 'sein'; partizipII: string };
    konjunktivII?: { ich: string; er_sie_es: string };
    imperativ?: { du: string; ihr: string; Sie: string };
    governedPreposition?: string;
    governedCase?: 'akkusativ' | 'dativ' | 'genitiv';
    isSeparable?: boolean;
    separablePrefix?: string;
  };
  adjectiveTable?: {
    comparative?: string;
    superlative?: string;
    strongDeclension?: { nomM: string; nomF: string; nomN: string; nomPl: string; datM: string };
    weakDeclension?: { nomM: string; nomF: string; nomN: string; nomPl: string; datM: string };
    mixedDeclension?: { nomM: string; nomF: string; nomN: string; nomPl: string; datM: string };
  };
  examples?: { de: string; en: string }[];
}

export interface SentenceToken {
  tokenIndex: number;
  surfaceToken: string;
  lemma: string;
  pos: string;
  gender?: 'der' | 'die' | 'das' | 'plural' | null;
  case?: 'nominativ' | 'akkusativ' | 'dativ' | 'genitiv' | null;
  syntaxRole?: string;
  declensionTrigger?: string;
  meaningEn: string;
}

export interface SentenceAnalysis {
  id?: string;
  textDe: string;
  textEnNatural: string;
  textEnLiteral: string;
  cefrLevel: string;
  v2Position1: string;
  v2Verb: string;
  v2Mittelfeld: string;
  v2VerbFinal?: string;
  isNebensatz: boolean;
  conjunctionTrigger?: string;
  grammarTags: string[];
  tokens: SentenceToken[];
  variations: { de: string; en: string; note: string }[];
}

export type CardType = 'recognition' | 'production' | 'sentence_cloze' | 'audio_meaning' | 'gender_drill' | 'plural_drill';

export interface Card {
  id: string;
  userId: string;
  wordId?: string;
  sentenceId?: string;
  cardType: CardType;
  prompt: string;
  answer: string;
  contextSentence?: string;
  options?: string[];
  state: 'new' | 'learning' | 'review' | 'relearning';
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview?: string;
  dueAt: string;
  word?: WordEntry;
}

export interface GrammarTopic {
  id: string;
  slug: string;
  titleDe: string;
  titleEn: string;
  cefrLevel: 'A0' | 'A1' | 'A2' | 'B1' | 'B1_START' | 'B1_SOLID' | 'B2';
  weekNumber: number;
  orderIndex: number;
  description: string;
  explanationMd: string;
  formulaPattern?: string;
  visualTable?: { headers: string[]; rows: string[][] };
  commonMistakes?: { wrong: string; correct: string; explanation: string }[];
  tags: string[];
  drills: GrammarDrill[];
}

export interface GrammarDrill {
  id: string;
  type: 'cloze' | 'reorder' | 'transform' | 'error_spotting';
  prompt: string;
  sentenceContext?: string;
  correctAnswer: string;
  options?: string[];
  explanation: string;
  grammarTag: string;
}

export interface GrammarProgress {
  topicId: string;
  masteryScore: number; // 0.0 - 1.0
  timesPracticed: number;
  correctCount: number;
  errorCount: number;
  isRemedialActive: boolean;
  lastPracticedAt?: string;
}

export interface DailySession {
  id: string;
  userId: string;
  weekNumber: number;
  dayNumber: number;
  block1Done: boolean; // Warmup SRS
  block2Done: boolean; // Grammar concept
  block3Done: boolean; // Sentence mining
  block4Done: boolean; // Speaking task
  block5Done: boolean; // Immersion listening/reading
  status?: 'in_progress' | 'completed' | 'abandoned';
  remedialDrills?: GrammarDrill[];
  score?: number;
}

export interface SpeakingDebrief {
  overallScore: number;
  fluencyScore: number;
  accuracyScore: number;
  phonemeScores: { phoneme: string; score: number; label: string; tip: string }[];
  successPoints: string[];
  corrections: { learnerSaid: string; nativeRecast: string; rule: string }[];
  minedWords: { word: string; pos: string; gender?: string; meaning: string }[];
}

export interface GradedStory {
  id: string;
  title: string;
  cefrLevel: string;
  coverEmoji: string;
  audioUrl?: string;
  paragraphs: { textDe: string; textEn: string }[];
}

/** Days until the card is due again for each rating (1 Again … 4 Easy). */
export type ReviewPreview = Record<1 | 2 | 3 | 4, number>;

export interface DashboardStats {
  totalCards: number;
  cardsByState: Record<'new' | 'learning' | 'review' | 'relearning', number>;
  matureCards: number;
  totalReviews: number;
  reviewsThisWeek: number;
  retentionThisWeek: number | null;
  streak: number;
  estimatedCEFR: CEFRLevel;
  grammar: {
    slug: string;
    titleDe: string;
    cefrLevel: string;
    masteryScore: number;
    timesPracticed: number;
    isRemedialActive: boolean;
  }[];
}
