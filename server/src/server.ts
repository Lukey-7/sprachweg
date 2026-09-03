import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './db/prisma.js';

// Route imports
import { authRouter } from './routes/authRoutes.js';
import { userRouter } from './routes/userRoutes.js';
import { dictionaryRouter } from './routes/dictionaryRoutes.js';
import { minerRouter } from './routes/minerRoutes.js';
import { cardRouter } from './routes/cardRoutes.js';
import { curriculumRouter } from './routes/curriculumRoutes.js';
import { sessionRouter } from './routes/sessionRoutes.js';
import { speakingRouter } from './routes/speakingRoutes.js';
import { statsRouter } from './routes/statsRoutes.js';
import { cacheRouter } from './routes/cacheRoutes.js';
import { linguisticsRouter } from './routes/linguisticsRoutes.js';

dotenv.config();

export function createServer(): Express {
  const app = express();

  // Core Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Request logger
  if (process.env.NODE_ENV !== 'test') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });
  }

  // Health check endpoint
  app.get('/api/health', async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'ok',
        service: 'Sprachweg Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        database: 'connected',
        cache: 'ready',
      });
    } catch (err: any) {
      res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: err?.message,
      });
    }
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/user', userRouter);
  app.use('/api/dictionary', dictionaryRouter);
  app.use('/api/miner', minerRouter);
  app.use('/api/cards', cardRouter);
  app.use('/api/curriculum', curriculumRouter);
  app.use('/api/sessions', sessionRouter);
  app.use('/api/speaking', speakingRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/cache', cacheRouter);
  app.use('/api/linguistics', linguisticsRouter);

  // 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err?.message || 'An unexpected error occurred',
    });
  });

  return app;
}

const PORT = process.env.PORT || 4000;

if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  const app = createServer();
  app.listen(PORT, () => {
    console.log(`Sprachweg Backend Server running at http://localhost:${PORT}`);
    console.log(`Healthcheck available at http://localhost:${PORT}/api/health`);
  });
}
