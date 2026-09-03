import { prisma } from '../db/prisma.js';
import { FsrsCardData, FsrsRating, DailyQueuePayload, CardType, CardState } from './types.js';
import { FsrsEngine } from './fsrsEngine.js';

export class FsrsQueueManager {
  public static async getDailyStudyQueue(
    userId: string,
    now: Date = new Date()
  ): Promise<DailyQueuePayload> {
    const settings = await prisma.settings.findUnique({ where: { userId } });
    const dailyNewLimit = settings?.dailyNewCards ?? 20;
    const dailyReviewLimit = settings?.dailyReviewCap ?? 100;

    const allUserCards = await prisma.card.findMany({
      where: { userId },
      orderBy: { dueAt: 'asc' },
    });

    const mappedCards: FsrsCardData[] = allUserCards.map(c => {
      const elapsedDays = c.lastReview
        ? Math.max(0, (now.getTime() - new Date(c.lastReview).getTime()) / 86400000)
        : 0;
      return {
        id: c.id,
        userId: c.userId,
        cardType: (c.cardType ? c.cardType.toUpperCase() : 'RECOGNITION') as CardType,
        front: c.prompt,
        back: c.answer,
        contextSentence: c.contextSentence || undefined,
        state: (c.state ? c.state.toUpperCase() : 'NEW') as CardState,
        stability: c.stability,
        difficulty: c.difficulty,
        elapsedDays: Number(elapsedDays.toFixed(2)),
        scheduledDays: c.scheduledDays,
        reps: c.reps,
        lapses: c.lapses,
        dueAt: c.dueAt.toISOString(),
      };
    });

    const dueReviews = mappedCards.filter(
      c => c.state !== 'NEW' && new Date(c.dueAt).getTime() <= now.getTime()
    );
    const newCards = mappedCards.filter(c => c.state === 'NEW');

    const cappedReviews = dueReviews.slice(0, dailyReviewLimit);
    const cappedNew = newCards.slice(0, dailyNewLimit);
    const backlogSurplus = Math.max(0, dueReviews.length - dailyReviewLimit);

    return {
      reviewQueue: cappedReviews,
      newQueue: cappedNew,
      totalToday: cappedReviews.length + cappedNew.length,
      backlogSurplus,
      dailyNewLimit,
      dailyReviewLimit,
    };
  }

  public static async submitReview(
    cardId: string,
    userId: string,
    rating: number,
    responseTimeMs: number = 0,
    reviewedAt: Date = new Date()
  ) {
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new Error('Card not found');

    const settings = await prisma.settings.findUnique({ where: { userId } });
    const targetRetention = settings?.targetRetention ?? 0.90;

    const elapsedDays = card.lastReview
      ? Math.max(0, (reviewedAt.getTime() - new Date(card.lastReview).getTime()) / 86400000)
      : 0;

    const fsrsCard: FsrsCardData = {
      id: card.id,
      userId: card.userId,
      cardType: (card.cardType ? card.cardType.toUpperCase() : 'RECOGNITION') as CardType,
      front: card.prompt,
      back: card.answer,
      contextSentence: card.contextSentence || undefined,
      state: (card.state ? card.state.toUpperCase() : 'NEW') as CardState,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsedDays,
      scheduledDays: card.scheduledDays,
      reps: card.reps,
      lapses: card.lapses,
      dueAt: card.dueAt.toISOString(),
    };

    // Clamp rating to 1..4 for FSRS scheduler calculation
    const clampedRating: FsrsRating = Math.max(1, Math.min(4, Math.round(rating || 3))) as FsrsRating;
    const scheduled = FsrsEngine.scheduleCard(fsrsCard, clampedRating, reviewedAt, targetRetention);

    const updatedDbCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        state: scheduled.card.state.toLowerCase(),
        stability: scheduled.card.stability,
        difficulty: scheduled.card.difficulty,
        scheduledDays: scheduled.card.scheduledDays,
        elapsedDays: 0,
        reps: scheduled.card.reps,
        lapses: scheduled.card.lapses,
        lastReview: reviewedAt,
        dueAt: new Date(scheduled.card.dueAt),
      },
    });

    const reviewLog = await prisma.review.create({
      data: {
        cardId,
        userId,
        rating: Math.round(rating),
        reviewType: fsrsCard.state.toLowerCase(),
        elapsedDays: Number(elapsedDays.toFixed(2)),
        scheduledDays: scheduled.card.scheduledDays,
        stabilityBefore: card.stability,
        stabilityAfter: scheduled.card.stability,
        difficultyBefore: card.difficulty,
        difficultyAfter: scheduled.card.difficulty,
        responseTimeMs,
        reviewedAt,
      },
    });

    return { card: updatedDbCard, review: reviewLog, scheduledResult: scheduled };
  }
}
