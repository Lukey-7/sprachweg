import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';

export const authRouter = Router();

authRouter.post('/guest', async (_req: Request, res: Response) => {
  try {
    let guestUser = await prisma.user.findFirst({
      where: { email: 'guest@sprachweg.app' },
      include: { settings: true },
    });

    if (!guestUser) {
      guestUser = await prisma.user.create({
        data: {
          id: 'guest-user-001',
          email: 'guest@sprachweg.app',
          name: 'Guest Learner',
          activeLevel: 'A1',
          currentWeek: 1,
          streakCount: 3,
          freezeTokens: 2,
          settings: {
            create: {
              dailyNewCards: 20,
              dailyReviewCap: 100,
              targetRetention: 0.90,
              voiceSpeed: 1.0,
              ttsVoice: 'de-DE-Wavenet-F',
              theme: 'system',
              autoPlayAudio: true,
            },
          },
        },
        include: { settings: true },
      });
    }

    res.json({
      user: {
        id: guestUser.id,
        email: guestUser.email,
        name: guestUser.name,
        activeLevel: guestUser.activeLevel,
        currentWeek: guestUser.currentWeek,
        streakCount: guestUser.streakCount,
        freezeTokens: guestUser.freezeTokens,
      },
      settings: guestUser.settings,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to initialize guest session', message: error?.message });
  }
});
