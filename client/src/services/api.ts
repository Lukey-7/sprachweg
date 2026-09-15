import {
  Card,
  CEFRLevel,
  DailySession,
  DashboardStats,
  GrammarProgress,
  GrammarTopic,
  GradedStory,
  ReviewPreview,
  SentenceAnalysis,
  SpeakingDebrief,
  User,
  WordEntry,
} from '../types';

const BASE_URL = '/api';

/** A failed API call. `status` is 0 when the request never reached the server. */
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }

  /** The AI backend (Gemini) was unreachable or rejected the request. */
  get isAiUnavailable() {
    return this.status === 503;
  }

  get isOffline() {
    return this.status === 0;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        // Lets the server compute "today" and streaks in the learner's timezone.
        'x-tz-offset': String(new Date().getTimezoneOffset()),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(navigator.onLine ? 'Could not reach the server.' : 'You are offline.', 0);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.message || body?.error || res.statusText;
    throw new ApiError(detail, res.status);
  }
  return body as T;
}

const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) });

const patch = <T>(path: string, data: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(data) });

/** Parses a JSON-string column, tolerating null and already-parsed values. */
function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ── Mappers: server rows → app types ──────────────────────────────────────

export function toUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    activeLevel: row.activeLevel,
    currentWeek: row.currentWeek,
    streakCount: row.streakCount,
    freezeTokens: row.freezeTokens,
    settings: row.settings ?? undefined,
  };
}

export function toCard(row: any): Card {
  return {
    id: row.id,
    userId: row.userId,
    wordId: row.wordId ?? undefined,
    sentenceId: row.sentenceId ?? undefined,
    cardType: row.cardType,
    prompt: row.prompt,
    answer: row.answer,
    contextSentence: row.contextSentence ?? undefined,
    options: parseJson<string[] | undefined>(row.optionsJson, undefined),
    state: row.state,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsedDays: row.elapsedDays,
    scheduledDays: row.scheduledDays,
    reps: row.reps,
    lapses: row.lapses,
    lastReview: row.lastReview ?? undefined,
    dueAt: row.dueAt,
  };
}

export function toTopic(row: any): GrammarTopic {
  return {
    id: row.id,
    slug: row.slug,
    titleDe: row.titleDe,
    titleEn: row.titleEn,
    cefrLevel: row.cefrLevel,
    weekNumber: row.weekNumber,
    orderIndex: row.orderIndex,
    description: row.description,
    explanationMd: row.explanationMd,
    formulaPattern: row.formulaPattern ?? undefined,
    visualTable: parseJson(row.visualTableJson, undefined),
    commonMistakes: parseJson(row.commonMistakesJson, undefined),
    tags: parseJson<string[]>(row.tagsJson, []),
    drills: parseJson(row.drillsJson, []),
  };
}

export function toStory(row: any): GradedStory {
  return {
    id: row.slug ?? row.id,
    title: row.title,
    cefrLevel: row.cefrLevel,
    coverEmoji: row.coverEmoji,
    audioUrl: row.audioUrl ?? undefined,
    paragraphs: parseJson(row.paragraphsJson, []),
  };
}

export function toWord(row: any): WordEntry {
  const detail = parseJson<Record<string, any>>(row.detailJson, {});
  return {
    id: row.id ?? `word-${row.lemma}`,
    lemma: row.lemma,
    normalizedLemma: row.normalizedLemma ?? row.lemma?.toLowerCase(),
    pos: row.pos,
    gender: row.gender ?? null,
    cefrLevel: row.cefrLevel,
    frequencyRank: row.frequencyRank ?? undefined,
    ipa: row.ipa ?? undefined,
    audioUrl: row.audioUrl ?? undefined,
    meaningEn: row.meaningEn,
    secondaryMeanings: parseJson(row.secondaryMeanings, undefined),
    register: row.register ?? undefined,
    disambiguation: row.disambiguation ?? undefined,
    falseFriends: row.falseFriends ?? undefined,
    collocations: parseJson(row.collocations, undefined),
    idioms: parseJson(row.idioms, undefined),
    isCompound: !!row.isCompound,
    compoundParts: parseJson(row.compoundParts, undefined),
    nounTable: detail.nounTable ?? row.nounTable,
    verbTable: detail.verbTable ?? row.verbTable,
    adjectiveTable: detail.adjectiveTable ?? row.adjectiveTable,
    examples: detail.examples ?? row.examples,
  };
}

const POS_NAMES: Record<string, string> = {
  NOUN: 'noun', VERB: 'verb', ADJ: 'adjective', ADV: 'adverb', ART: 'article',
  PREP: 'preposition', PRON: 'pronoun', CONJ: 'conjunction', PART: 'particle', OTHER: 'word',
};

export function toSentenceAnalysis(a: any): SentenceAnalysis {
  const topo = a.topologicalMap ?? {};
  return {
    textDe: a.textDe ?? a.sentenceDe,
    textEnNatural: a.textEnNatural ?? a.sentenceEnNatural ?? '',
    textEnLiteral: a.textEnLiteral ?? a.sentenceEnLiteral ?? '',
    cefrLevel: a.cefrLevel ?? 'A2',
    v2Position1: topo.vorfeld ?? '',
    v2Verb: topo.linkeSatzklammer ?? '',
    v2Mittelfeld: topo.mittelfeld ?? '',
    v2VerbFinal: topo.rechteSatzklammer || undefined,
    isNebensatz: !!a.isNebensatz,
    conjunctionTrigger: a.conjunctionTrigger ?? undefined,
    grammarTags: a.grammarTags ?? [],
    tokens: (a.tokens ?? []).map((t: any, index: number) => ({
      tokenIndex: index,
      surfaceToken: t.surfaceToken ?? t.token ?? '',
      lemma: t.lemma ?? t.token ?? '',
      pos: POS_NAMES[String(t.pos).toUpperCase()] ?? String(t.pos ?? 'word').toLowerCase(),
      gender: t.gender ? String(t.gender).toLowerCase() : null,
      case: t.case ? String(t.case).toLowerCase() : null,
      syntaxRole: t.syntaxRole ?? '',
      declensionTrigger: t.declensionTrigger ?? undefined,
      meaningEn: t.meaningEn ?? t.literalGlossEn ?? '',
    })),
    variations: (a.variations ?? []).map((v: any) => ({
      de: v.textDe ?? v.de ?? '',
      en: v.textEn ?? v.en ?? '',
      note: v.level ?? v.note ?? '',
    })),
  };
}

export function toSpeakingDebrief(e: any): SpeakingDebrief {
  return {
    overallScore: Math.round(e.overallScore ?? 0),
    fluencyScore: Math.round(e.fluencyScore ?? e.overallScore ?? 0),
    accuracyScore: Math.round(e.accuracyScore ?? e.overallScore ?? 0),
    // Pronunciation can't be scored from a text transcript, so none are reported.
    phonemeScores: [],
    successPoints: e.successes ?? [],
    corrections: (e.corrections ?? []).map((c: any) => ({
      learnerSaid: c.originalSnippet,
      nativeRecast: c.correctedSnippet,
      rule: c.ruleExplanation,
    })),
    minedWords: (e.minedVocabulary ?? []).map((w: any) => ({
      word: w.gender && !/^(der|die|das)\s/i.test(w.lemma) ? `${w.gender} ${w.lemma}` : w.lemma,
      pos: w.gender ? 'noun' : 'word',
      gender: w.gender ?? undefined,
      meaning: w.meaningEn,
    })),
  };
}

export function toSession(row: any): DailySession {
  return {
    id: row.id,
    userId: row.userId,
    weekNumber: row.weekNumber,
    dayNumber: row.dayNumber,
    block1Done: row.block1Done,
    block2Done: row.block2Done,
    block3Done: row.block3Done,
    block4Done: row.block4Done,
    block5Done: row.block5Done,
    status: row.status,
  };
}

/** AI-backed results say whether they came from the offline mock (unrelated sample data). */
export interface AiResult<T> {
  data: T;
  mock: boolean;
}

// ── Endpoints ─────────────────────────────────────────────────────────────

export const api = {
  async health(): Promise<{ ai: 'mock' | 'live' }> {
    return request('/health');
  },

  async getUser(): Promise<User> {
    const { user } = await request<{ user: any }>('/user/me');
    return toUser(user);
  },

  async updateUser(changes: { activeLevel?: CEFRLevel; currentWeek?: number }): Promise<User> {
    const { user } = await patch<{ user: any }>('/user/me', changes);
    return toUser(user);
  },

  async getTodayCards(): Promise<{ cards: Card[]; reviewCount: number; newCount: number; backlogSurplus: number }> {
    const res = await request<any>('/cards/today');
    return { ...res, cards: res.cards.map(toCard) };
  },

  async previewReview(cardId: string): Promise<ReviewPreview> {
    const { previews } = await post<{ previews: Record<string, { intervalDays: number }> }>(`/cards/${cardId}/preview`);
    return {
      1: previews['1'].intervalDays,
      2: previews['2'].intervalDays,
      3: previews['3'].intervalDays,
      4: previews['4'].intervalDays,
    };
  },

  async submitReview(cardId: string, rating: 1 | 2 | 3 | 4, responseTimeMs?: number): Promise<Card> {
    const { card } = await post<{ card: any }>(`/cards/${cardId}/review`, { rating, responseTimeMs });
    return toCard(card);
  },

  async addCard(card: Pick<Card, 'cardType' | 'prompt' | 'answer'> & Partial<Pick<Card, 'contextSentence' | 'options' | 'wordId'>>): Promise<Card> {
    const { card: row } = await post<{ card: any }>('/cards/create', {
      cardType: card.cardType,
      prompt: card.prompt,
      answer: card.answer,
      contextSentence: card.contextSentence,
      optionsJson: card.options,
      wordId: card.wordId,
    });
    return toCard(row);
  },

  async getTopics(): Promise<GrammarTopic[]> {
    const { topics } = await request<{ topics: any[] }>('/curriculum/syllabus');
    return topics.map(toTopic);
  },

  async getGrammarProgress(): Promise<GrammarProgress[]> {
    const { progress } = await request<{ progress: any[] }>('/curriculum/progress');
    return progress.map(p => ({
      topicId: p.topicId,
      masteryScore: p.masteryScore,
      timesPracticed: p.timesPracticed,
      correctCount: p.correctCount,
      errorCount: p.errorCount,
      isRemedialActive: p.isRemedialActive,
      lastPracticedAt: p.lastPracticedAt ?? undefined,
    }));
  },

  async recordPractice(topicSlug: string, correct: boolean): Promise<void> {
    await post(`/curriculum/topics/${encodeURIComponent(topicSlug)}/practice`, { correct });
  },

  async getStories(): Promise<GradedStory[]> {
    const { stories } = await request<{ stories: any[] }>('/curriculum/stories');
    return stories.map(toStory);
  },

  /** Returns null when the word isn't in the dictionary and the AI can't be asked. */
  async lookupWord(query: string): Promise<AiResult<WordEntry> | null> {
    try {
      const res = await request<{ word: any; source: string }>(`/dictionary/lookup?q=${encodeURIComponent(query.trim())}`);
      return { data: toWord(res.word), mock: res.source === 'mock' };
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },

  async analyzeSentence(sentence: string, level?: string): Promise<AiResult<SentenceAnalysis>> {
    const res = await post<{ analysis: any; mock: boolean }>('/miner/analyze', { sentence, level });
    return { data: toSentenceAnalysis(res.analysis), mock: !!res.mock };
  },

  async evaluateSpeaking(input: { mode: string; scenarioId?: string; transcript: string; targetText?: string }): Promise<AiResult<SpeakingDebrief>> {
    const res = await post<{ evaluation: any; mock: boolean }>('/speaking/evaluate', input);
    return { data: toSpeakingDebrief(res.evaluation), mock: !!res.mock };
  },

  async getTodaySession(): Promise<DailySession> {
    const { session } = await request<{ session: any }>('/sessions/today');
    return toSession(session);
  },

  async completeBlock(sessionId: string, block: 1 | 2 | 3 | 4 | 5): Promise<DailySession> {
    const { session } = await post<{ session: any }>(`/sessions/${sessionId}/block/${block}/complete`);
    return toSession(session);
  },

  async getStats(): Promise<DashboardStats> {
    return request('/stats/dashboard');
  },
};
