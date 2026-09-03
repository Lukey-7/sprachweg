import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';

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
