import { Router, Request, Response } from 'express';
import { sqliteCache } from '../cache/sqliteCache.js';

export const cacheRouter = Router();

cacheRouter.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await sqliteCache.getMetrics();
    res.json({ metrics });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch cache metrics', message: error?.message });
  }
});

cacheRouter.delete('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    await sqliteCache.invalidate(key);
    res.json({ success: true, invalidatedKey: key });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to invalidate cache key', message: error?.message });
  }
});
