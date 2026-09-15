import { Router, Request, Response } from 'express';
import { ensureUser, getUserId } from '../user.js';

export const authRouter = Router();

authRouter.post('/guest', async (req: Request, res: Response) => {
  try {
    const { settings, ...user } = await ensureUser(getUserId(req));
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        activeLevel: user.activeLevel,
        currentWeek: user.currentWeek,
        streakCount: user.streakCount,
        freezeTokens: user.freezeTokens,
      },
      settings,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to initialize guest session', message: error?.message });
  }
});
