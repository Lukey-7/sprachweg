import { ensureUser, getUserId } from '../user.js';
import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';

export const userRouter = Router();

userRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const user = await ensureUser(getUserId(req));
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load user', message: error?.message });
  }
});


userRouter.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user,
      streak: user.streakCount,
      freezeTokens: user.freezeTokens,
      cefrLevel: user.activeLevel,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user profile', message: error?.message });
  }
});

userRouter.patch('/settings', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { dailyNewCards, dailyReviewCap, targetRetention, voiceSpeed, ttsVoice, theme, autoPlayAudio } = req.body;

    const updatedSettings = await prisma.settings.upsert({
      where: { userId },
      update: {
        ...(dailyNewCards !== undefined && { dailyNewCards }),
        ...(dailyReviewCap !== undefined && { dailyReviewCap }),
        ...(targetRetention !== undefined && { targetRetention }),
        ...(voiceSpeed !== undefined && { voiceSpeed }),
        ...(ttsVoice !== undefined && { ttsVoice }),
        ...(theme !== undefined && { theme }),
        ...(autoPlayAudio !== undefined && { autoPlayAudio }),
      },
      create: {
        userId,
        dailyNewCards: dailyNewCards ?? 20,
        dailyReviewCap: dailyReviewCap ?? 100,
        targetRetention: targetRetention ?? 0.90,
        voiceSpeed: voiceSpeed ?? 1.0,
        ttsVoice: ttsVoice ?? 'de-DE-Wavenet-F',
        theme: theme ?? 'system',
        autoPlayAudio: autoPlayAudio ?? true,
      },
    });

    res.json({ settings: updatedSettings });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user settings', message: error?.message });
  }
});
