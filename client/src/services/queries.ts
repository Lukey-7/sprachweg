import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './api';
import { CEFRLevel, DailySession } from '../types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Don't hammer a server that is down; do retry a flaky mobile connection once.
      retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1,
      refetchOnWindowFocus: true,
    },
  },
});

export const keys = {
  health: ['health'] as const,
  user: ['user'] as const,
  todayCards: ['cards', 'today'] as const,
  preview: (cardId: string) => ['cards', 'preview', cardId] as const,
  topics: ['topics'] as const,
  grammarProgress: ['grammar-progress'] as const,
  stories: ['stories'] as const,
  session: ['session', 'today'] as const,
  stats: ['stats'] as const,
};

export const useHealth = () => useQuery({ queryKey: keys.health, queryFn: api.health, staleTime: 5 * 60_000 });
export const useUser = () => useQuery({ queryKey: keys.user, queryFn: api.getUser });
export const useTodayCards = () => useQuery({ queryKey: keys.todayCards, queryFn: api.getTodayCards });
export const useTopics = () => useQuery({ queryKey: keys.topics, queryFn: api.getTopics, staleTime: Infinity });
export const useGrammarProgress = () => useQuery({ queryKey: keys.grammarProgress, queryFn: api.getGrammarProgress });
export const useStories = () => useQuery({ queryKey: keys.stories, queryFn: api.getStories, staleTime: Infinity });
export const useTodaySession = () => useQuery({ queryKey: keys.session, queryFn: api.getTodaySession });
export const useStats = () => useQuery({ queryKey: keys.stats, queryFn: api.getStats });

export const useReviewPreview = (cardId: string | undefined) =>
  useQuery({
    queryKey: keys.preview(cardId ?? ''),
    queryFn: () => api.previewReview(cardId!),
    enabled: !!cardId,
    staleTime: 30_000,
  });

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, rating, responseTimeMs }: { cardId: string; rating: 1 | 2 | 3 | 4; responseTimeMs?: number }) =>
      api.submitReview(cardId, rating, responseTimeMs),
    onSuccess: () => {
      // The queue itself is refetched when the learner finishes the round, so the
      // card list doesn't shift under them mid-review.
      qc.invalidateQueries({ queryKey: keys.user });
      qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function useAddCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (card: Parameters<typeof api.addCard>[0]) => api.addCard(card),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.todayCards });
      qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function useRecordPractice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, correct }: { slug: string; correct: boolean }) => api.recordPractice(slug, correct),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.grammarProgress });
      qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function useCompleteBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, block }: { sessionId: string; block: 1 | 2 | 3 | 4 | 5 }) => api.completeBlock(sessionId, block),
    onSuccess: session => qc.setQueryData(keys.session, session),
  });
}

/** Marks one block of today's session done (no-op if already done or the session isn't loaded). */
export function useMarkBlockDone() {
  const session = useTodaySession();
  const complete = useCompleteBlock();
  return (block: 1 | 2 | 3 | 4 | 5) => {
    const s = session.data;
    if (!s || s[`block${block}Done` as keyof DailySession]) return;
    complete.mutate({ sessionId: s.id, block });
  };
}

export function useUpdateLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (activeLevel: CEFRLevel) => api.updateUser({ activeLevel }),
    onSuccess: user => qc.setQueryData(keys.user, user),
  });
}

/** Human-readable message for any error thrown by the API layer. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isOffline) return "You're offline. This needs a connection.";
    if (error.isAiUnavailable) return `The AI service is unavailable right now (${error.message}). Try again in a moment.`;
    return error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}

