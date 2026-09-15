/**
 * Client ↔ server contract.
 *
 * Runs the real client API layer (client/src/services/api.ts) against the real
 * Express app, with fetch routed in-process. A wrong URL, a changed response
 * shape, or a mapper that drops a field fails here instead of in the browser.
 * The original app shipped four client URLs that 404'd, silently masked by
 * fallback data. That class of bug is what this suite exists to catch.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server.js';
import { prisma } from '../src/db/prisma.js';
import { seedDatabase } from '../src/db/seed.js';
import { api, ApiError } from '../../client/src/services/api';

const app = createServer();
const realFetch = globalThis.fetch;

beforeAll(async () => {
  await prisma.review.deleteMany();
  await prisma.card.deleteMany();
  await prisma.session.deleteMany();
  await prisma.grammarProgress.deleteMany();
  await seedDatabase();

  globalThis.fetch = (async (input: string, init: RequestInit = {}) => {
    const method = (init.method || 'GET').toLowerCase() as 'get' | 'post' | 'patch';
    let req = request(app)[method](String(input));
    for (const [k, v] of Object.entries((init.headers as Record<string, string>) || {})) req = req.set(k, v);
    const res = init.body ? await req.send(JSON.parse(String(init.body))) : await req;
    return new Response(JSON.stringify(res.body), { status: res.status, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

describe('client API contract', () => {
  it('health reports AI mode', async () => {
    expect(['mock', 'live']).toContain((await api.health()).ai);
  });

  it('getUser returns the configured learner, created on demand', async () => {
    const user = await api.getUser();
    expect(user.id).toBe('guest-user-001');
    expect(typeof user.streakCount).toBe('number');
    expect(user.activeLevel).toBeTruthy();
  });

  it('updateUser persists level and rejects invalid ones', async () => {
    expect((await api.updateUser({ activeLevel: 'A2' })).activeLevel).toBe('A2');
    expect((await api.getUser()).activeLevel).toBe('A2');
    await expect(api.updateUser({ activeLevel: 'Z9' as any })).rejects.toBeInstanceOf(ApiError);
    await api.updateUser({ activeLevel: 'A1' });
  });

  it('getTopics maps JSON columns into drills, tags and tables', async () => {
    const topics = await api.getTopics();
    expect(topics.length).toBeGreaterThan(0);
    const t = topics.find(x => x.slug === 'nominativ-articles-gender')!;
    expect(Array.isArray(t.tags)).toBe(true);
    expect(t.drills.length).toBeGreaterThan(0);
    expect(t.drills[0].correctAnswer).toBeTruthy();
    expect(t.visualTable?.headers.length).toBeGreaterThan(0);
  });

  it('getStories returns paragraphs', async () => {
    const stories = await api.getStories();
    expect(stories.length).toBeGreaterThan(0);
    expect(stories[0].paragraphs[0].textDe).toBeTruthy();
  });

  it('lookupWord finds seeded words by umlaut-free spelling and returns full tables', async () => {
    const schoen = await api.lookupWord('schoen');
    expect(schoen?.data.lemma).toBe('schön');
    const fahren = await api.lookupWord('fahren');
    expect(fahren?.data.verbTable?.praesens.du).toBeTruthy();
    const noun = await api.lookupWord('Geschwindigkeitsbegrenzung');
    expect(noun?.data.nounTable?.dativ.pl).toBeTruthy();
    expect(noun?.data.compoundParts?.length).toBeGreaterThan(0);
  });

  it('add card → appears in today → review is persisted by the server FSRS engine', async () => {
    const card = await api.addCard({ cardType: 'recognition', prompt: 'der Vertrag', answer: 'the contract' });
    expect(card.id).toBeTruthy();
    expect(card.state).toBe('new');

    const today = await api.getTodayCards();
    expect(today.cards.map(c => c.id)).toContain(card.id);

    const preview = await api.previewReview(card.id);
    expect(preview[4]).toBeGreaterThan(preview[1]);

    const reviewed = await api.submitReview(card.id, 3);
    expect(reviewed.id).toBe(card.id);
    expect(reviewed.reps).toBe(1);
    expect(new Date(reviewed.dueAt).getTime()).toBeGreaterThan(Date.now());

    const row = await prisma.card.findUnique({ where: { id: card.id } });
    expect(row?.reps).toBe(1);
    expect(await prisma.review.count({ where: { cardId: card.id } })).toBe(1);
  });

  it('adding a duplicate card fails with a readable error', async () => {
    await expect(api.addCard({ cardType: 'recognition', prompt: 'der Vertrag', answer: 'x' })).rejects.toThrow(/already exists/);
  });

  it('reviewing counts toward the streak', async () => {
    expect((await api.getUser()).streakCount).toBeGreaterThanOrEqual(1);
  });

  it('reviewing an unknown card is an error, not a silent success', async () => {
    await expect(api.submitReview('does-not-exist', 3)).rejects.toMatchObject({ status: 404 });
  });

  it('practice results update grammar mastery and stats', async () => {
    await api.recordPractice('akkusativ-case', true);
    await api.recordPractice('akkusativ-case', false);
    const progress = await api.getGrammarProgress();
    expect(progress.length).toBeGreaterThan(0);
    const stats = await api.getStats();
    expect(stats.grammar.some(g => g.slug === 'akkusativ-case')).toBe(true);
    expect(stats.totalReviews).toBeGreaterThanOrEqual(1);
  });

  it('daily session is created once per day and blocks persist', async () => {
    const s1 = await api.getTodaySession();
    const s2 = await api.getTodaySession();
    expect(s2.id).toBe(s1.id);
    const updated = await api.completeBlock(s1.id, 2);
    expect(updated.block2Done).toBe(true);
    expect((await api.getTodaySession()).block2Done).toBe(true);
  });

  it('analyzeSentence and evaluateSpeaking map to app types and flag mock output', async () => {
    const analysis = await api.analyzeSentence('Der Mann kauft einen Apfel.');
    expect(analysis.mock).toBe(true);
    expect(analysis.data.tokens.length).toBeGreaterThan(0);
    expect(analysis.data.tokens[0].pos).toMatch(/^[a-z]+$/);

    const speaking = await api.evaluateSpeaking({ mode: 'free_conversation', transcript: 'Ich fahre nach Berlin.' });
    expect(speaking.mock).toBe(true);
    expect(Array.isArray(speaking.data.corrections)).toBe(true);
    expect(speaking.data.corrections[0].nativeRecast).toBeTruthy();
  });
});
