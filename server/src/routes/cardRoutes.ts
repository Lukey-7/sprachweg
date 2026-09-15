import { Router, Request, Response } from 'express';
import { FsrsQueueManager } from '../fsrs/queueManager.js';
import { FsrsEngine } from '../fsrs/fsrsEngine.js';
import { SentenceCardGenerator } from '../miner/variations.js';
import { getUserId, recordActivity } from '../user.js';
import { prisma } from '../db/prisma.js';
import { CardType, CardState } from '../fsrs/types.js';

export const cardRouter = Router();

cardRouter.get('/study-queue', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const queue = await FsrsQueueManager.getDailyStudyQueue(userId);

    const fullQueue = [...queue.reviewQueue, ...queue.newQueue];

    res.json({
      ...queue,
      // Backward compatibility for M1 test assertions:
      queue: fullQueue,
      meta: {
        dueCount: fullQueue.length,
        dailyCap: queue.dailyReviewLimit,
        totalToday: queue.totalToday,
        backlogSurplus: queue.backlogSurplus,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch study queue', message: error?.message });
  }
});

// Today's study queue as stored card rows (what the app renders): due reviews
// first, then new cards, both capped by the learner's daily limits.
cardRouter.get('/today', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const queue = await FsrsQueueManager.getDailyStudyQueue(userId);
    const ids = [...queue.reviewQueue, ...queue.newQueue].map(c => c.id);
    const rows = await prisma.card.findMany({ where: { id: { in: ids } } });
    const byId = new Map(rows.map(r => [r.id, r]));

    res.json({
      cards: ids.map(id => byId.get(id)).filter(Boolean),
      reviewCount: queue.reviewQueue.length,
      newCount: queue.newQueue.length,
      backlogSurplus: queue.backlogSurplus,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch today's cards", message: error?.message });
  }
});

cardRouter.post('/:id/review', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { rating, responseTimeMs } = req.body;

    const numRating = Number(rating) ?? 3;

    const result = await FsrsQueueManager.submitReview(
      id,
      userId,
      numRating,
      responseTimeMs || 0
    );
    await recordActivity(userId);

    res.json(result);
  } catch (error: any) {
    if (error?.message === 'Card not found') {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.status(500).json({ error: 'Review submission failed', message: error?.message });
  }
});

cardRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { prompt, answer } = req.body;

    if (!prompt || !answer) {
      return res.status(400).json({ error: 'prompt and answer are required' });
    }

    const card = await SentenceCardGenerator.createMinedCard({
      userId,
      ...req.body,
    });

    res.json({ card });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to create card' });
  }
});

cardRouter.post('/:id/preview', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const card = await prisma.card.findUnique({ where: { id } });
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const elapsedDays = card.lastReview
      ? Math.max(0, (Date.now() - new Date(card.lastReview).getTime()) / 86400000)
      : 0;

    const fsrsCard = {
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

    const previews = FsrsEngine.previewRatings(fsrsCard);
    res.json({ previews });
  } catch (error: any) {
    res.status(500).json({ error: 'Preview failed', message: error?.message });
  }
});

cardRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const allCards = await prisma.card.findMany({ where: { userId } });

    const total = allCards.length;
    const byState = {
      new: allCards.filter(c => c.state === 'new').length,
      learning: allCards.filter(c => c.state === 'learning').length,
      review: allCards.filter(c => c.state === 'review').length,
      relearning: allCards.filter(c => c.state === 'relearning').length,
    };
    const byType = {
      recognition: allCards.filter(c => c.cardType === 'recognition').length,
      production: allCards.filter(c => c.cardType === 'production').length,
      sentence_cloze: allCards.filter(c => c.cardType === 'sentence_cloze').length,
      gender_drill: allCards.filter(c => c.cardType === 'gender_drill').length,
      plural_drill: allCards.filter(c => c.cardType === 'plural_drill').length,
      audio_meaning: allCards.filter(c => c.cardType === 'audio_meaning').length,
    };

    res.json({ total, byState, byType });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch card stats', message: error?.message });
  }
});
