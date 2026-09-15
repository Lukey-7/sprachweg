import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { getUserId } from '../user.js';

export const curriculumRouter = Router();

curriculumRouter.get('/syllabus', async (_req: Request, res: Response) => {
  try {
    const topics = await prisma.grammarTopic.findMany({
      orderBy: [{ weekNumber: 'asc' }, { orderIndex: 'asc' }],
    });

    res.json({ topics, totalWeeks: 52 });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch syllabus', message: error?.message });
  }
});

curriculumRouter.get('/stories', async (_req: Request, res: Response) => {
  try {
    const stories = await prisma.gradedStory.findMany({ orderBy: { orderIndex: 'asc' } });
    res.json({ stories });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch stories', message: error?.message });
  }
});

curriculumRouter.get('/topics/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const topic = await prisma.grammarTopic.findUnique({
      where: { slug },
      include: { progress: true },
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json({ topic });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch topic', message: error?.message });
  }
});

// A topic counts as mastered at 80%; below that after a few attempts it is flagged for remediation.
const MASTERY_THRESHOLD = 0.8;

curriculumRouter.post('/topics/:slug/practice', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { correct } = req.body ?? {};
    if (typeof correct !== 'boolean') {
      return res.status(400).json({ error: 'correct (boolean) is required' });
    }
    const topic = await prisma.grammarTopic.findUnique({ where: { slug: req.params.slug } });
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const existing = await prisma.grammarProgress.findUnique({
      where: { userId_topicId: { userId, topicId: topic.id } },
    });
    const prev = existing?.masteryScore ?? 0;
    const times = (existing?.timesPracticed ?? 0) + 1;
    // Moving average weighted toward recent answers, starting from zero, so one lucky
    // answer can't mark a topic mastered: four correct in a row reach 80%.
    const alpha = Math.max(0.2, 1 / (times + 1));
    const masteryScore = Math.round((prev + alpha * ((correct ? 1 : 0) - prev)) * 10000) / 10000;

    const progress = await prisma.grammarProgress.upsert({
      where: { userId_topicId: { userId, topicId: topic.id } },
      create: {
        userId,
        topicId: topic.id,
        masteryScore,
        timesPracticed: 1,
        correctCount: correct ? 1 : 0,
        errorCount: correct ? 0 : 1,
        lastPracticedAt: new Date(),
        isRemedialActive: false,
      },
      update: {
        masteryScore,
        timesPracticed: times,
        correctCount: { increment: correct ? 1 : 0 },
        errorCount: { increment: correct ? 0 : 1 },
        lastPracticedAt: new Date(),
        isRemedialActive: times >= 3 && masteryScore < MASTERY_THRESHOLD,
      },
    });
    res.json({ progress });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record practice', message: error?.message });
  }
});

curriculumRouter.get('/progress', async (req: Request, res: Response) => {
  try {
    const progress = await prisma.grammarProgress.findMany({ where: { userId: getUserId(req) } });
    res.json({ progress });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch progress', message: error?.message });
  }
});
