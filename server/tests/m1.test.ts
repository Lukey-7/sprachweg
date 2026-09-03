import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server.js';
import { prisma } from '../src/db/prisma.js';
import { sqliteCache } from '../src/cache/sqliteCache.js';
import {
  geminiService,
  SentenceAnalysisResponseSchema,
  WordLookupResponseSchema,
  DrillGenerationResponseSchema,
  SpeakingEvaluationResponseSchema,
} from '../src/ai/geminiClient.js';
import { seedDatabase } from '../src/db/seed.js';

const app = createServer();

describe('Milestone 1 Core Backend Test Suite', () => {
  beforeAll(async () => {
    // Clean tables to ensure reproducible test run
    await prisma.cacheEntry.deleteMany();
    await prisma.review.deleteMany();
    await prisma.card.deleteMany();
    await prisma.sentenceToken.deleteMany();
    await prisma.sentence.deleteMany();
    await prisma.wordForm.deleteMany();
    await prisma.word.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.grammarProgress.deleteMany();
    await prisma.grammarTopic.deleteMany();
    await prisma.speakingSession.deleteMany();
    await prisma.errorLog.deleteMany();
    await prisma.session.deleteMany();
    await prisma.settings.deleteMany();
    await prisma.user.deleteMany();

    // Seed baseline database
    await seedDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Suite 1: Prisma DB Schema & 15 Models CRUD Validation', () => {
    it('1.1 verifies User and Settings models and cascade delete capability', async () => {
      const testEmail = `cascade-user-${Date.now()}@example.com`;
      const testUser = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Cascade Test User',
          settings: {
            create: {
              dailyNewCards: 25,
              dailyReviewCap: 150,
            },
          },
        },
        include: { settings: true },
      });

      expect(testUser.id).toBeDefined();
      expect(testUser.settings?.dailyNewCards).toBe(25);

      // Verify Cascade Delete
      await prisma.user.delete({ where: { id: testUser.id } });
      const orphanedSettings = await prisma.settings.findUnique({ where: { userId: testUser.id } });
      expect(orphanedSettings).toBeNull();
    });

    it('1.2 creates and reads Word, WordForm, Sentence, and SentenceToken models', async () => {
      const word = await prisma.word.create({
        data: {
          lemma: `laufen-${Date.now()}`,
          normalizedLemma: 'laufen',
          pos: 'verb',
          cefrLevel: 'A1',
          meaningEn: 'to run / walk',
          forms: {
            create: [
              { form: 'läuft', normalizedForm: 'laeuft', formType: 'conjugation', tense: 'praesens', person: '3sg' },
              { form: 'lief', normalizedForm: 'lief', formType: 'conjugation', tense: 'praeteritum', person: '3sg' },
            ],
          },
        },
        include: { forms: true },
      });

      expect(word.forms.length).toBe(2);

      const sentence = await prisma.sentence.create({
        data: {
          textDe: 'Er läuft sehr schnell.',
          textEnNatural: 'He runs very fast.',
          textEnLiteral: 'He runs very fast.',
          cefrLevel: 'A1',
          v2Position1: 'Er',
          v2Verb: 'läuft',
          v2Mittelfeld: 'sehr schnell',
          tokens: {
            create: [
              { tokenIndex: 0, surfaceToken: 'Er', lemma: 'er', pos: 'pronoun', syntaxRole: 'subject' },
              { tokenIndex: 1, surfaceToken: 'läuft', lemma: 'laufen', pos: 'verb', syntaxRole: 'finite_verb', wordId: word.id },
            ],
          },
        },
        include: { tokens: true },
      });

      expect(sentence.tokens.length).toBe(2);
      expect(sentence.tokens[1].wordId).toBe(word.id);
    });

    it('1.3 creates Card, Review, GrammarProgress, Lesson, Session, SpeakingSession, ErrorLog, and CacheEntry models', async () => {
      const user = await prisma.user.findFirst({ where: { email: 'guest@sprachweg.app' } });
      expect(user).toBeDefined();

      // Card & Review
      const card = await prisma.card.create({
        data: {
          userId: user!.id,
          cardType: 'recognition',
          prompt: 'Buch',
          answer: 'book',
        },
      });
      const review = await prisma.review.create({
        data: {
          cardId: card.id,
          userId: user!.id,
          rating: 3,
          reviewType: 'new',
          elapsedDays: 0,
          scheduledDays: 1,
          stabilityBefore: 0,
          stabilityAfter: 1.5,
          difficultyBefore: 0,
          difficultyAfter: 5.0,
        },
      });
      expect(review.id).toBeDefined();
      expect(review.cardId).toBe(card.id);

      // Grammar Topic, Progress, and Lesson
      const topic = await prisma.grammarTopic.findFirst();
      expect(topic).toBeDefined();

      const progress = await prisma.grammarProgress.upsert({
        where: { userId_topicId: { userId: user!.id, topicId: topic!.id } },
        update: { masteryScore: 0.85 },
        create: { userId: user!.id, topicId: topic!.id, masteryScore: 0.85 },
      });
      expect(progress.masteryScore).toBe(0.85);

      const lesson = await prisma.lesson.create({
        data: {
          topicId: topic!.id,
          weekNumber: 1,
          dayNumber: 1,
          blockType: 'grammar_concept',
          title: 'Introduction to Genders',
          contentJson: JSON.stringify({ summary: 'Learn der, die, das' }),
          orderIndex: 1,
        },
      });
      expect(lesson.id).toBeDefined();

      // Session
      const session = await prisma.session.create({
        data: {
          userId: user!.id,
          weekNumber: 1,
          dayNumber: 1,
          status: 'in_progress',
        },
      });
      expect(session.id).toBeDefined();

      // SpeakingSession
      const speaking = await prisma.speakingSession.create({
        data: {
          userId: user!.id,
          sessionMode: 'free_conversation',
          transcript: 'Hallo, wie geht es dir?',
          overallScore: 90.0,
          successPointsJson: JSON.stringify(['Good greeting']),
          correctionsJson: JSON.stringify([]),
          minedWordsJson: JSON.stringify([]),
        },
      });
      expect(speaking.overallScore).toBe(90.0);

      // ErrorLog
      const errorLog = await prisma.errorLog.create({
        data: {
          userId: user!.id,
          contextType: 'drill',
          inputValue: 'der Haus',
          expectedValue: 'das Haus',
          errorType: 'gender',
          explanation: 'Haus is neuter (das Haus).',
        },
      });
      expect(errorLog.errorType).toBe('gender');

      // CacheEntry
      const cacheKey = `test-key-${Date.now()}`;
      const cacheEntry = await prisma.cacheEntry.create({
        data: {
          cacheKey,
          cacheType: 'test_model_check',
          inputParamsJson: JSON.stringify({ test: true }),
          payloadJson: JSON.stringify({ success: true }),
        },
      });
      expect(cacheEntry.cacheKey).toBe(cacheKey);
    });
  });

  describe('Suite 2: SHA-256 SQLite Cache Repository & Hit/Miss Dynamics', () => {
    it('2.1 generates deterministic SHA-256 hash regardless of object key order', () => {
      const obj1 = { sentence: 'Hallo Welt', level: 'A1', count: 5 };
      const obj2 = { count: 5, level: 'A1', sentence: 'Hallo Welt' };

      const res1 = sqliteCache.generateHashKey('sentence_analysis', obj1);
      const res2 = sqliteCache.generateHashKey('sentence_analysis', obj2);

      expect(res1.hashKey).toBe(res2.hashKey);
      expect(res1.hashKey.length).toBe(64);
    });

    it('2.2 handles Cache Miss -> Cache Set -> Cache Hit workflow with hit count increment', async () => {
      const cacheType = 'test_cache_flow';
      const input = { testId: `cache-unit-${Date.now()}`, value: 42 };
      const payload = { result: 'computed-value-alpha', numbers: [1, 2, 3] };

      // 1. Initial Miss
      const miss = await sqliteCache.get(cacheType, input);
      expect(miss).toBeNull();

      // 2. Set Cache
      const key = await sqliteCache.set(cacheType, input, payload);
      expect(key.length).toBe(64);

      // 3. Cache Hit
      const hit = await sqliteCache.get<typeof payload>(cacheType, input);
      expect(hit).toEqual(payload);

      // 4. Invalidation
      await sqliteCache.invalidate(key);
      const afterInvalidation = await sqliteCache.get(cacheType, input);
      expect(afterInvalidation).toBeNull();
    });

    it('2.3 respects TTL and handles expired entries', async () => {
      const cacheType = 'test_ttl_flow';
      const input = { ttlTest: `ttl-${Date.now()}` };
      const payload = { temporary: true };

      // Set with -10 second TTL (already expired)
      await sqliteCache.set(cacheType, input, payload, -10);

      const expiredGet = await sqliteCache.get(cacheType, input);
      expect(expiredGet).toBeNull();
    });

    it('2.4 aggregates cache operational metrics', async () => {
      await sqliteCache.set('metric_type_a', { k: '1' }, { val: 'a' });
      await sqliteCache.set('metric_type_b', { k: '2' }, { val: 'b' });

      const metrics = await sqliteCache.getMetrics();
      expect(metrics.totalEntries).toBeGreaterThanOrEqual(2);
      expect(metrics.typeDistribution['metric_type_a']).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Suite 3: Gemini Client & Structured Schema Validation', () => {
    it('3.1 returns valid schema-compliant response for Sentence Analysis', async () => {
      const res = await geminiService.generateStructured({
        prompt: 'Analyze German sentence: Heute kauft der Mann im Supermarkt einen frischen Apfel.',
        responseSchema: SentenceAnalysisResponseSchema,
        cacheType: 'test_gemini_sentence',
        cacheKeyData: { sentence: 'Heute kauft der Mann im Supermarkt einen frischen Apfel.' },
      });

      expect((res as any).textDe).toBeDefined();
      expect((res as any).textEnNatural).toBeDefined();
      expect((res as any).textEnLiteral).toBeDefined();
      expect((res as any).tokens).toBeInstanceOf(Array);
      expect((res as any).tokens.length).toBeGreaterThan(0);
      expect((res as any).v2Position1).toBeDefined();
      expect((res as any).v2Verb).toBeDefined();
      expect((res as any).variations).toBeInstanceOf(Array);
    });

    it('3.2 returns valid schema-compliant response for Word Lookup', async () => {
      const res = await geminiService.generateStructured({
        prompt: 'Lookup word: Geschwindigkeit',
        responseSchema: WordLookupResponseSchema,
        cacheType: 'test_gemini_word',
        cacheKeyData: { word: 'Geschwindigkeit' },
      });

      expect((res as any).lemma).toBe('Geschwindigkeit');
      expect((res as any).gender).toBe('die');
      expect((res as any).cefrLevel).toBe('B1');
      expect((res as any).isCompound).toBe(true);
      expect((res as any).compoundParts).toBeInstanceOf(Array);
      expect((res as any).declensions).toBeDefined();
      expect((res as any).declensions.nominativSg).toBe('die Geschwindigkeit');
    });

    it('3.3 returns valid schema-compliant response for Drill Generation', async () => {
      const res = await geminiService.generateStructured({
        prompt: 'Generate drills for topic: satzklammer-v2',
        responseSchema: DrillGenerationResponseSchema,
        cacheType: 'test_gemini_drill',
        cacheKeyData: { topic: 'satzklammer-v2' },
      });

      expect((res as any).topicSlug).toBe('satzklammer-v2');
      expect((res as any).drills).toBeInstanceOf(Array);
      expect((res as any).drills.length).toBeGreaterThan(0);
      expect((res as any).drills[0].drillType).toBeDefined();
      expect((res as any).drills[0].correctAnswer).toBeDefined();
    });

    it('3.4 returns valid schema-compliant response for Speaking Evaluation', async () => {
      const res = await geminiService.generateStructured({
        prompt: 'Evaluate transcript: Ich habe gefahrt mit die Frau',
        responseSchema: SpeakingEvaluationResponseSchema,
        cacheType: 'test_gemini_speaking',
        cacheKeyData: { transcript: 'Ich habe gefahrt mit die Frau' },
      });

      expect((res as any).overallScore).toBeGreaterThan(0);
      expect((res as any).successes).toBeInstanceOf(Array);
      expect((res as any).corrections).toBeInstanceOf(Array);
      expect((res as any).minedVocabulary).toBeInstanceOf(Array);
    });
  });

  describe('Suite 4: Express REST Endpoints Integration', () => {
    it('4.1 GET /api/health returns 200 OK and database connectivity', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('Sprachweg Backend');
      expect(res.body.database).toBe('connected');
      expect(res.body.cache).toBe('ready');
    });

    it('4.2 POST /api/auth/guest returns guest user session and settings', async () => {
      const res = await request(app).post('/api/auth/guest');
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('guest@sprachweg.app');
      expect(res.body.settings.dailyNewCards).toBe(20);
    });

    it('4.3 GET /api/user/profile returns user profile details', async () => {
      const res = await request(app).get('/api/user/profile').set('x-user-id', 'guest-user-001');
      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe('guest-user-001');
      expect(res.body.cefrLevel).toBe('A1');
    });

    it('4.4 PATCH /api/user/settings updates user preference settings', async () => {
      const res = await request(app)
        .patch('/api/user/settings')
        .set('x-user-id', 'guest-user-001')
        .send({ dailyNewCards: 25, theme: 'dark', voiceSpeed: 0.9 });
      expect(res.status).toBe(200);
      expect(res.body.settings.dailyNewCards).toBe(25);
      expect(res.body.settings.theme).toBe('dark');
      expect(res.body.settings.voiceSpeed).toBe(0.9);
    });

    it('4.5 GET /api/dictionary/lookup performs lookup for seeded word and fallback', async () => {
      const res1 = await request(app).get('/api/dictionary/lookup?q=Haus');
      expect(res1.status).toBe(200);
      expect(res1.body.word.lemma).toBe('Haus');
      expect(res1.body.source).toBe('database');

      const res2 = await request(app).get('/api/dictionary/lookup?q=Geschwindigkeit');
      expect(res2.status).toBe(200);
      expect(res2.body.word).toBeDefined();
    });

    it('4.6 GET /api/dictionary/autocomplete returns matching prefix suggestions', async () => {
      const res = await request(app).get('/api/dictionary/autocomplete?q=ha');
      expect(res.status).toBe(200);
      expect(res.body.suggestions).toBeInstanceOf(Array);
      expect(res.body.suggestions.some((s: any) => s.lemma === 'Haus')).toBe(true);
    });

    it('4.7 POST /api/miner/analyze executes deep sentence teardown', async () => {
      const res = await request(app)
        .post('/api/miner/analyze')
        .send({ sentence: 'Der Mann kauft einen Apfel.', level: 'A1' });
      expect(res.status).toBe(200);
      expect(res.body.analysis).toBeDefined();
      expect(res.body.analysis.tokens).toBeInstanceOf(Array);
    });

    it('4.8 POST /api/miner/mine-card creates a new flashcard in the user deck', async () => {
      const res = await request(app)
        .post('/api/miner/mine-card')
        .set('x-user-id', 'guest-user-001')
        .send({
          prompt: 'der Mann',
          answer: 'the man',
          contextSentence: 'Der Mann kauft einen Apfel.',
          cardType: 'recognition',
        });
      expect(res.status).toBe(200);
      expect(res.body.card.id).toBeDefined();
      expect(res.body.card.prompt).toBe('der Mann');
    });

    it('4.9 GET /api/cards/study-queue returns due cards', async () => {
      const res = await request(app).get('/api/cards/study-queue').set('x-user-id', 'guest-user-001');
      expect(res.status).toBe(200);
      expect(res.body.queue).toBeInstanceOf(Array);
      expect(res.body.meta.dueCount).toBeGreaterThanOrEqual(1);
    });

    it('4.10 POST /api/cards/:id/review records review log and updates card interval', async () => {
      const card = await prisma.card.findFirst({ where: { userId: 'guest-user-001' } });
      expect(card).toBeDefined();

      const res = await request(app)
        .post(`/api/cards/${card!.id}/review`)
        .set('x-user-id', 'guest-user-001')
        .send({ rating: 3, responseTimeMs: 1200 });

      expect(res.status).toBe(200);
      expect(res.body.card.reps).toBeGreaterThan(0);
      expect(res.body.review.rating).toBe(3);
    });

    it('4.11 GET /api/curriculum/syllabus and /api/curriculum/topics/:slug', async () => {
      const syllabusRes = await request(app).get('/api/curriculum/syllabus');
      expect(syllabusRes.status).toBe(200);
      expect(syllabusRes.body.topics).toBeInstanceOf(Array);
      expect(syllabusRes.body.totalWeeks).toBe(52);

      const topicRes = await request(app).get('/api/curriculum/topics/gender-and-articles');
      expect(topicRes.status).toBe(200);
      expect(topicRes.body.topic.slug).toBe('gender-and-articles');
    });

    it('4.12 GET /api/sessions/today and POST /api/sessions/:id/block/:num/complete', async () => {
      const todayRes = await request(app).get('/api/sessions/today').set('x-user-id', 'guest-user-001');
      expect(todayRes.status).toBe(200);
      const sessionId = todayRes.body.session.id;

      const completeRes = await request(app).post(`/api/sessions/${sessionId}/block/1/complete`);
      expect(completeRes.status).toBe(200);
      expect(completeRes.body.session.block1Done).toBe(true);
    });

    it('4.13 POST /api/speaking/evaluate evaluates speech and logs speaking session', async () => {
      const res = await request(app)
        .post('/api/speaking/evaluate')
        .set('x-user-id', 'guest-user-001')
        .send({
          mode: 'free_conversation',
          transcript: 'Ich fahre nach Berlin.',
        });

      expect(res.status).toBe(200);
      expect(res.body.evaluation.overallScore).toBeDefined();
      expect(res.body.speakingSession.id).toBeDefined();
    });

    it('4.14 GET /api/stats/dashboard returns dashboard metrics and grammar heatmap', async () => {
      const res = await request(app).get('/api/stats/dashboard').set('x-user-id', 'guest-user-001');
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.wordsKnown).toBeGreaterThanOrEqual(1);
      expect(res.body.totalReviews).toBeGreaterThanOrEqual(1);
      expect(res.body.grammarHeatmap).toBeDefined();
    });

    it('4.15 GET /api/cache/metrics returns operational cache metrics', async () => {
      const res = await request(app).get('/api/cache/metrics');
      expect(res.status).toBe(200);
      expect(res.body.metrics.totalEntries).toBeGreaterThanOrEqual(1);
    });
  });
});
