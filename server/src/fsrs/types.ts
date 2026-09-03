export type FsrsRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy
export type CardType = 'RECOGNITION' | 'PRODUCTION' | 'SENTENCE_CLOZE' | 'AUDIO_MEANING' | 'GENDER_DRILL' | 'PLURAL_DRILL';
export type CardState = 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';
export type Gender = 'der' | 'die' | 'das';

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

export interface FsrsReviewLog {
  rating: FsrsRating;
  state: CardState;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reviewedAt: string;
}

export interface FsrsScheduleResult {
  rating: FsrsRating;
  card: FsrsCardData;
  reviewLog: FsrsReviewLog;
}

export interface DailyQueuePayload {
  reviewQueue: FsrsCardData[];
  newQueue: FsrsCardData[];
  totalToday: number;
  backlogSurplus: number;
  dailyNewLimit: number;
  dailyReviewLimit: number;
}
