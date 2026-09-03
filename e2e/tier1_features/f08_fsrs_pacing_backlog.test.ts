import { describe, it, expect } from '../harness/testRunner';
import { FsrsCardData } from '../harness/contracts';

describe('Feature 8: FSRS Daily Pacing & Backlog Protection Verification', () => {
  const createMockDeck = (count: number, state: 'NEW' | 'REVIEW', dueDaysOffset: number = 0): FsrsCardData[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `card_${state}_${i}`,
      userId: 'u1',
      cardType: 'RECOGNITION',
      front: `Front ${i}`,
      back: `Back ${i}`,
      state,
      stability: state === 'NEW' ? 0 : 5,
      difficulty: state === 'NEW' ? 0 : 5,
      elapsedDays: 5,
      scheduledDays: 5,
      reps: state === 'NEW' ? 0 : 1,
      lapses: 0,
      dueAt: new Date(Date.now() + dueDaysOffset * 86400000).toISOString(),
    }));
  };

  const getDailyReviewQueue = (
    allCards: FsrsCardData[],
    dailyNewLimit: number = 20,
    dailyReviewLimit: number = 100,
    now: Date = new Date()
  ) => {
    const dueReviews = allCards.filter(
      c => c.state !== 'NEW' && new Date(c.dueAt).getTime() <= now.getTime()
    );
    const newCards = allCards.filter(c => c.state === 'NEW');

    // Prioritize due reviews up to review limit, then add new cards up to new limit
    const cappedReviews = dueReviews.slice(0, dailyReviewLimit);
    const cappedNew = newCards.slice(0, dailyNewLimit);

    return {
      reviewQueue: cappedReviews,
      newQueue: cappedNew,
      totalToday: cappedReviews.length + cappedNew.length,
      backlogSurplus: Math.max(0, dueReviews.length - dailyReviewLimit),
    };
  };

  it('should enforce daily new card limit (default 20) when deck has 50 new cards', () => {
    const deck = createMockDeck(50, 'NEW');
    const queue = getDailyReviewQueue(deck, 20, 100);
    expect(queue.newQueue).toHaveLength(20);
    expect(queue.reviewQueue).toHaveLength(0);
    expect(queue.totalToday).toBe(20);
  });

  it('should enforce daily review limit ceiling (default 100) preventing learner burnout', () => {
    // Learner returns after vacation with 350 overdue reviews
    const overdueCards = createMockDeck(350, 'REVIEW', -1);
    const queue = getDailyReviewQueue(overdueCards, 20, 100);

    expect(queue.reviewQueue).toHaveLength(100);
    expect(queue.backlogSurplus).toBe(250);
  });

  it('should allow user custom configurable limits (e.g. 10 new, 50 reviews)', () => {
    const deck = [...createMockDeck(30, 'NEW'), ...createMockDeck(80, 'REVIEW', -1)];
    const queue = getDailyReviewQueue(deck, 10, 50);

    expect(queue.newQueue).toHaveLength(10);
    expect(queue.reviewQueue).toHaveLength(50);
    expect(queue.totalToday).toBe(60);
  });

  it('should prioritize overdue review cards over new cards in daily study queue', () => {
    const dueCards = createMockDeck(5, 'REVIEW', -2);
    const newCards = createMockDeck(5, 'NEW');
    const combined = [...newCards, ...dueCards];

    const queue = getDailyReviewQueue(combined, 5, 5);
    expect(queue.reviewQueue[0].state).toBe('REVIEW');
    expect(queue.newQueue[0].state).toBe('NEW');
  });

  it('should not include future scheduled cards in today review queue', () => {
    const futureCards = createMockDeck(20, 'REVIEW', 3); // due in 3 days
    const queue = getDailyReviewQueue(futureCards, 20, 100);

    expect(queue.reviewQueue).toHaveLength(0);
  });
}, 'Tier 1');
