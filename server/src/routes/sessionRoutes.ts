import { getUserId } from '../user.js';
import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';

export const sessionRouter = Router();

sessionRouter.get('/today', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    let session = await prisma.session.findFirst({
      where: {
        userId,
        status: 'in_progress',
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!session) {
      session = await prisma.session.create({
        data: {
          userId,
          weekNumber: 1,
          dayNumber: 1,
          sessionType: 'daily_5_block',
          status: 'in_progress',
        },
      });
    }

    res.json({ session });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load daily session', message: error?.message });
  }
});

sessionRouter.post('/:id/block/:blockNum/complete', async (req: Request, res: Response) => {
  try {
    const { id, blockNum } = req.params;
    const blockIndex = parseInt(blockNum, 10);
    const updateField: Record<string, boolean> = {};

    if (blockIndex >= 1 && blockIndex <= 5) {
      updateField[`block${blockIndex}Done`] = true;
    }

    const session = await prisma.session.update({
      where: { id },
      data: updateField,
    });

    const allDone = session.block1Done && session.block2Done && session.block3Done && session.block4Done && session.block5Done;
    if (allDone) {
      await prisma.session.update({
        where: { id },
        data: { status: 'completed', completedAt: new Date() },
      });
    }

    res.json({ session, allBlocksDone: allDone });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update session block', message: error?.message });
  }
});
