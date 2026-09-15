import { Request } from 'express';
import { prisma } from './db/prisma.js';
import { USER_ID } from './env.js';

/** Client's UTC offset in minutes (Date#getTimezoneOffset), so "today" means the learner's today. */
export function getTzOffset(req: Request): number {
  const n = Number(req.headers['x-tz-offset']);
  return Number.isFinite(n) && Math.abs(n) <= 840 ? n : 0;
}

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
const dayIndex = (d: Date, tzOffset: number) => Math.floor((d.getTime() - tzOffset * 60000) / DAY_MS);

/** Start of the learner's current local day, as an absolute instant. */
export function startOfLocalDay(tzOffset: number, now: Date = new Date()): Date {
  return new Date(dayIndex(now, tzOffset) * DAY_MS + tzOffset * 60000);
}

/** Counts consecutive days with at least one review. Called after every review. */
export async function recordActivity(userId: string, tzOffset = 0, now: Date = new Date()) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const today = dayIndex(now, tzOffset);
  const last = user.lastActiveAt ? dayIndex(user.lastActiveAt, tzOffset) : null;
  let streakCount = user.streakCount;
  if (last === null || today - last > 1) streakCount = 1;
  else if (today - last === 1) streakCount += 1;
  else if (streakCount === 0) streakCount = 1;

  await prisma.user.update({ where: { id: userId }, data: { streakCount, lastActiveAt: now } });
}
