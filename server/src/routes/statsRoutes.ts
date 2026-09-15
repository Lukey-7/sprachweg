import { getUserId } from '../user.js';
import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';

export const statsRouter = Router();

statsRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const weekAgo = new Date(Date.now() - 7 * 86400000);

    const [user, cardsByState, totalReviews, reviewsThisWeek, againThisWeek, grammarProgress, topics] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, include: { settings: true } }),
      prisma.card.groupBy({ by: ['state'], where: { userId }, _count: { _all: true } }),
      prisma.review.count({ where: { userId } }),
      prisma.review.count({ where: { userId, reviewedAt: { gte: weekAgo } } }),
      prisma.review.count({ where: { userId, reviewedAt: { gte: weekAgo }, rating: 1 } }),
      prisma.grammarProgress.findMany({ where: { userId } }),
      prisma.grammarTopic.findMany({ select: { id: true, slug: true, titleDe: true, cefrLevel: true } }),
    ]);

    const counts: Record<string, number> = { new: 0, learning: 0, review: 0, relearning: 0 };
    for (const row of cardsByState) counts[row.state] = row._count._all;
    const totalCards = Object.values(counts).reduce((a, b) => a + b, 0);

    const grammarHeatmap: Record<string, number> = {};
    for (const gp of grammarProgress) grammarHeatmap[gp.topicId] = gp.masteryScore;

    res.json({
      user,
      wordsKnown: totalCards,
      totalCards,
      cardsByState: counts,
      matureCards: counts.review,
      totalReviews,
      reviewsThisWeek,
      retentionThisWeek: reviewsThisWeek ? (reviewsThisWeek - againThisWeek) / reviewsThisWeek : null,
      streak: user?.streakCount || 0,
      estimatedCEFR: user?.activeLevel || 'A1',
      grammarHeatmap,
      grammar: grammarProgress.map(gp => {
        const topic = topics.find(t => t.id === gp.topicId);
        return {
          slug: topic?.slug,
          titleDe: topic?.titleDe,
          cefrLevel: topic?.cefrLevel,
          masteryScore: gp.masteryScore,
          timesPracticed: gp.timesPracticed,
          isRemedialActive: gp.isRemedialActive,
        };
      }),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats', message: error?.message });
  }
});
