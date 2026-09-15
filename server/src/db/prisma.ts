import '../env.js';
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

// Reuse one client per process. On serverless this matters: warm invocations
// share the instance instead of opening a new pool against Neon each request.
export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.PRISMA_LOG_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error'],
  });

globalThis.prismaGlobal = prisma;
