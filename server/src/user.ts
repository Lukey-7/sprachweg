import { Request } from 'express';
import { prisma } from './db/prisma.js';
import { USER_ID } from './env.js';

/** Single-learner app: the header is honoured (tests use it), otherwise the configured user. */
export function getUserId(req: Request): string {
  return (req.headers['x-user-id'] as string) || USER_ID;
}

/** Creates the learner row + default settings on first use, so a fresh database just works. */
export async function ensureUser(userId: string) {
  return prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: `${userId}@sprachweg.local`,
      name: 'Learner',
      activeLevel: 'A1',
      currentWeek: 1,
      streakCount: 0,
      freezeTokens: 2,
      settings: { create: {} },
    },
    include: { settings: true },
  });
}

const DAY_MS = 86400000;
const dayIndex = (d: Date) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / DAY_MS);

/** Counts consecutive days with at least one review. Called after every review. */
export async function recordActivity(userId: string, now: Date = new Date()) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const today = dayIndex(now);
  const last = user.lastActiveAt ? dayIndex(user.lastActiveAt) : null;
  let streakCount = user.streakCount;
  if (last === null || today - last > 1) streakCount = 1;
  else if (today - last === 1) streakCount += 1;
  else if (streakCount === 0) streakCount = 1;

  await prisma.user.update({ where: { id: userId }, data: { streakCount, lastActiveAt: now } });
}
