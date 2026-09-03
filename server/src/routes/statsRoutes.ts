import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';

export const statsRouter = Router();

statsRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'guest-user-001';

    const [user, totalCards, totalReviews, grammarProgress] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, include: { settings: true } }),
      prisma.card.count({ where: { userId } }),
      prisma.review.count({ where: { userId } }),
      prisma.grammarProgress.findMany({ where: { userId } }),
    ]);

    const grammarHeatmap: Record<string, number> = {};
    for (const gp of grammarProgress) {
      grammarHeatmap[gp.topicId] = gp.masteryScore;
    }

    res.json({
      user,
      wordsKnown: totalCards,
      totalReviews,
      streak: user?.streakCount || 0,
      estimatedCEFR: user?.activeLevel || 'A1',
      grammarHeatmap,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats', message: error?.message });
  }
});
