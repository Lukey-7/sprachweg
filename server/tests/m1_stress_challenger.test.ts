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

describe('Milestone 1 Challenger Empirical Stress & Adversarial Test Suite', () => {
  beforeAll(async () => {
    // Ensure clean state and seed baseline data
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

    await seedDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // =========================================================================
  // Section 1: Rapid Concurrency Stress Tests
  // =========================================================================
  describe('1. Rapid Concurrency & Stress Tests', () => {
    it('1.1 executes 60 concurrent GET /api/health requests without failure or timeout', async () => {
      const concurrency = 60;
      const promises = Array.from({ length: concurrency }).map(() =>
        request(app).get('/api/health')
      );

      const responses = await Promise.all(promises);

      expect(responses.length).toBe(concurrency);
      for (const res of responses) {
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.database).toBe('connected');
      }
    });

    it('1.2 executes 50 concurrent identical GET /api/dictionary/lookup requests (cache contention check)', async () => {
      const concurrency = 50;
      const targetQuery = 'Haus';
      const promises = Array.from({ length: concurrency }).map(() =>
        request(app).get(`/api/dictionary/lookup?q=${targetQuery}`)
      );

      const responses = await Promise.all(promises);

      expect(responses.length).toBe(concurrency);
      for (const res of responses) {
        expect(res.status).toBe(200);
        expect(res.body.word).toBeDefined();
        expect(res.body.word.lemma).toBe('Haus');
        expect(res.body.source).toBe('database');
      }
    });

    it('1.3 executes 40 concurrent diverse dictionary queries with mix of DB hits and Gemini mock fallback', async () => {
      const words = [
        'Haus', 'Mann', 'Apfel', 'gehen', 'Geschwindigkeit',
        'Buch', 'Schule', 'Fenster', 'Wasser', 'Flugzeug',
        'Bahnhof', 'Strasse', 'Baum', 'Tisch', 'Stuhl',
        'schoen', 'Ueberraschung', 'aehnlich', 'gross', 'weiss'
      ];

      const queries = Array.from({ length: 40 }).map((_, i) => words[i % words.length]);
      const promises = queries.map((w) =>
        request(app).get(`/api/dictionary/lookup?q=${encodeURIComponent(w)}`)
      );

      const responses = await Promise.all(promises);

      expect(responses.length).toBe(40);
      for (const res of responses) {
        expect(res.status).toBe(200);
        expect(res.body.word).toBeDefined();
        expect(['database', 'gemini']).toContain(res.body.source);
      }
    });

    it('1.4 executes 30 rapid concurrent POST /api/miner/analyze requests with diverse German sentences', async () => {
      const testSentences = [
        'Der Hund bellt im Garten.',
        'Heute fahre ich mit dem Zug nach Hamburg.',
        'Weil das Wetter schön ist, gehen wir im Park spazieren.',
        'Er hat gestern einen interessanten Film gesehen.',
        'Sie möchte Deutsch lernen, um in Berlin zu studieren.',
        'Obwohl es regnet, machen die Kinder eine Fahrradtour.',
      ];

      const promises = Array.from({ length: 30 }).map((_, i) =>
        request(app)
          .post('/api/miner/analyze')
          .send({
            sentence: testSentences[i % testSentences.length],
            level: i % 2 === 0 ? 'A1' : 'A2',
          })
      );

      const responses = await Promise.all(promises);

      expect(responses.length).toBe(30);
      for (const res of responses) {
        expect(res.status).toBe(200);
        expect(res.body.analysis).toBeDefined();
        expect(res.body.analysis.tokens.length).toBeGreaterThan(0);
        expect(res.body.analysis.textEnNatural).toBeDefined();
      }
    });

    it('1.5 executes 30 concurrent POST /api/cards/:id/review requests across multiple cards', async () => {
      // Create 5 test cards for guest user
      const createdCards = await Promise.all(
        Array.from({ length: 5 }).map((_, i) =>
          prisma.card.create({
            data: {
              userId: 'guest-user-001',
              cardType: 'recognition',
              prompt: `Test Card Stress ${i}`,
              answer: `Answer Stress ${i}`,
              state: 'learning',
              scheduledDays: 1,
              stability: 1.0,
              difficulty: 5.0,
            },
          })
        )
      );

      // Submit 30 reviews concurrently distributed across the 5 cards
      const promises = Array.from({ length: 30 }).map((_, i) => {
        const targetCard = createdCards[i % createdCards.length];
        const rating = (i % 4) + 1; // 1 to 4
        return request(app)
          .post(`/api/cards/${targetCard.id}/review`)
          .set('x-user-id', 'guest-user-001')
          .send({ rating, responseTimeMs: 800 + i * 50 });
      });

      const responses = await Promise.all(promises);

      expect(responses.length).toBe(30);
      for (const res of responses) {
        expect(res.status).toBe(200);
        expect(res.body.card).toBeDefined();
        expect(res.body.review).toBeDefined();
        expect(res.body.review.cardId).toBeDefined();
      }

      // Verify that all 30 reviews were recorded in the database
      const reviewCount = await prisma.review.count({
        where: {
          cardId: { in: createdCards.map((c) => c.id) },
        },
      });
      expect(reviewCount).toBe(30);
    });

    it('1.6 executes 20 concurrent PATCH /api/user/settings requests with varying preferences', async () => {
      const themes = ['light', 'dark', 'system'];
      const promises = Array.from({ length: 20 }).map((_, i) =>
        request(app)
          .patch('/api/user/settings')
          .set('x-user-id', 'guest-user-001')
          .send({
            dailyNewCards: 10 + (i % 30),
            dailyReviewCap: 50 + (i % 100),
            theme: themes[i % themes.length],
            voiceSpeed: 0.8 + (i % 5) * 0.1,
          })
      );

      const responses = await Promise.all(promises);

      expect(responses.length).toBe(20);
      for (const res of responses) {
        expect(res.status).toBe(200);
        expect(res.body.settings).toBeDefined();
        expect(res.body.settings.userId).toBe('guest-user-001');
      }
    });

    it('1.7 executes 20 concurrent POST /api/speaking/evaluate requests', async () => {
      const transcripts = [
        'Ich möchte einen Kaffee bitte.',
        'Guten Tag, wo ist der Bahnhof?',
        'Wie viel kostet dieses Buch?',
        'Ich habe gestern meine Freunde besucht.',
      ];

      const promises = Array.from({ length: 20 }).map((_, i) =>
        request(app)
          .post('/api/speaking/evaluate')
          .set('x-user-id', 'guest-user-001')
          .send({
            mode: 'free_conversation',
            transcript: transcripts[i % transcripts.length],
          })
      );

      const responses = await Promise.all(promises);

      expect(responses.length).toBe(20);
      for (const res of responses) {
        expect(res.status).toBe(200);
        expect(res.body.evaluation).toBeDefined();
        expect(res.body.speakingSession).toBeDefined();
        expect(res.body.speakingSession.id).toBeDefined();
      }
    });
  });

  // =========================================================================
  // Section 2: Cache TTL Expiration, Invalidation & Edge Cases
  // =========================================================================
  describe('2. Cache TTL Expiration, Invalidation & Edge Cases', () => {
    it('2.1 validates real-time TTL expiration: active before expiry, evicted after expiry', async () => {
      const cacheType = 'ttl_empirical_test';
      const keyData = { empiricalId: `ttl-test-${Date.now()}` };
      const testPayload = { message: 'temporary-data', timestamp: Date.now() };

      // Set with 1-second TTL
      const hashKey = await sqliteCache.set(cacheType, keyData, testPayload, 1);
      expect(hashKey).toBeDefined();

      // Immediate check -> MUST be hit
      const immediateGet = await sqliteCache.get<typeof testPayload>(cacheType, keyData);
      expect(immediateGet).toEqual(testPayload);

      const existsBefore = await sqliteCache.has(cacheType, keyData);
      expect(existsBefore).toBe(true);

      // Wait 1.2 seconds for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Post-expiration check -> MUST return null and auto-evict
      const afterExpiryGet = await sqliteCache.get(cacheType, keyData);
      expect(afterExpiryGet).toBeNull();

      const existsAfter = await sqliteCache.has(cacheType, keyData);
      expect(existsAfter).toBe(false);

      // Verify row is removed from DB
      const dbRow = await prisma.cacheEntry.findUnique({ where: { cacheKey: hashKey } });
      expect(dbRow).toBeNull();
    });

    it('2.2 tests sqliteCache.clearExpired() bulk cleanup with mix of active and expired entries', async () => {
      const baseType = 'bulk_ttl_cleanup';

      // Insert 5 expired entries (negative TTL)
      for (let i = 0; i < 5; i++) {
        await sqliteCache.set(baseType, { id: `expired-${i}-${Date.now()}` }, { expired: true }, -60);
      }

      // Insert 3 immortal / long-lived entries (no TTL or long TTL)
      const immortalKeys: string[] = [];
      for (let i = 0; i < 3; i++) {
        const k = await sqliteCache.set(baseType, { id: `immortal-${i}-${Date.now()}` }, { expired: false }, 3600);
        immortalKeys.push(k);
      }

      // Execute bulk cleanup
      const deletedCount = await sqliteCache.clearExpired();
      expect(deletedCount).toBeGreaterThanOrEqual(5);

      // Verify long-lived entries are still intact
      for (const k of immortalKeys) {
        const row = await prisma.cacheEntry.findUnique({ where: { cacheKey: k } });
        expect(row).not.toBeNull();
      }
    });

    it('2.3 invalidates specific key via REST DELETE /api/cache/:key and handles non-existent key gracefully', async () => {
      // 1. Create a cache entry
      const cacheType = 'rest_invalidation_test';
      const keyData = { target: `invalidate-me-${Date.now()}` };
      const hashKey = await sqliteCache.set(cacheType, keyData, { data: 'active' });

      // Confirm presence
      const beforeRes = await sqliteCache.get(cacheType, keyData);
      expect(beforeRes).not.toBeNull();

      // Invalidate via REST API endpoint
      const deleteRes = await request(app).delete(`/api/cache/${hashKey}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.invalidatedKey).toBe(hashKey);

      // Confirm eviction
      const afterRes = await sqliteCache.get(cacheType, keyData);
      expect(afterRes).toBeNull();

      // Invalidate non-existent key (should not throw or crash)
      const nonExistentRes = await request(app).delete('/api/cache/0000000000000000000000000000000000000000000000000000000000000000');
      expect(nonExistentRes.status).toBe(200);
      expect(nonExistentRes.body.success).toBe(true);
    });

    it('2.4 validates hash generation invariance across deeply nested objects, arrays, and special characters', () => {
      const nested1 = {
        meta: { level: 'B1', tags: ['v2', 'nebensatz', 'modal'] },
        prompt: 'Übermorgen möchten wir süße Äpfel essen & trinken!',
        config: { retry: true, timeoutMs: 5000, active: null },
      };

      const nested2 = {
        config: { timeoutMs: 5000, active: null, retry: true },
        meta: { tags: ['v2', 'nebensatz', 'modal'], level: 'B1' },
        prompt: 'Übermorgen möchten wir süße Äpfel essen & trinken!',
      };

      const hash1 = sqliteCache.generateHashKey('deep_test', nested1);
      const hash2 = sqliteCache.generateHashKey('deep_test', nested2);

      expect(hash1.hashKey).toBe(hash2.hashKey);
      expect(hash1.hashKey.length).toBe(64);

      // Verify distinction between different cache types with identical payloads
      const hashOtherType = sqliteCache.generateHashKey('other_type', nested1);
      expect(hashOtherType.hashKey).not.toBe(hash1.hashKey);
    });

    it('2.5 validates caching of large structured payloads (100KB+ JSON)', async () => {
      const largeArray = Array.from({ length: 500 }).map((_, i) => ({
        index: i,
        token: `Token_${i}`,
        lemma: `Lemma_${i}`,
        tags: ['grammatik', 'wortschatz', 'beispiel'],
        metadata: { score: Math.random(), active: true },
      }));

      const largePayload = { items: largeArray, total: largeArray.length };
      const cacheType = 'large_payload_test';
      const keyData = { key: 'large_payload_01' };

      const key = await sqliteCache.set(cacheType, keyData, largePayload);
      expect(key.length).toBe(64);

      const retrieved = await sqliteCache.get<typeof largePayload>(cacheType, keyData);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.total).toBe(500);
      expect(retrieved?.items.length).toBe(500);
      expect(retrieved?.items[499].lemma).toBe('Lemma_499');
    });
  });

  // =========================================================================
  // Section 3: Offline Mock Generation Fidelity & Linguistic Validity
  // =========================================================================
  describe('3. Offline Mock Generation Fidelity & Linguistic Validity', () => {
    it('3.1 validates SentenceAnalysis offline mock against strict JSON schema', async () => {
      const sentencesToTest = [
        'Der Mann kauft einen Apfel.',
        'Heute fährt die Frau mit dem Fahrrad zur Arbeit.',
        'Weil er krank ist, bleibt der Schüler heute zu Hause.',
        'Wir haben das schöne Haus in den Bergen besichtigt.',
        'Obwohl es spät war, hat sie die Hausaufgaben fertiggemacht.',
      ];

      for (const sent of sentencesToTest) {
        const result = await geminiService.generateStructured({
          prompt: `Analyze German sentence: ${sent}`,
          responseSchema: SentenceAnalysisResponseSchema,
          cacheType: 'test_sentence_schema_fidelity',
          cacheKeyData: { sentence: sent },
        }) as any;

        // Verify required top-level fields
        expect(result.textDe).toBeTypeOf('string');
        expect(result.textEnNatural).toBeTypeOf('string');
        expect(result.textEnLiteral).toBeTypeOf('string');
        expect(result.cefrLevel).toBeTypeOf('string');
        expect(result.v2Position1).toBeTypeOf('string');
        expect(result.v2Verb).toBeTypeOf('string');
        expect(result.v2Mittelfeld).toBeTypeOf('string');
        expect(result.tokens).toBeInstanceOf(Array);
        expect(result.tokens.length).toBeGreaterThan(0);

        // Verify token structure
        for (const token of result.tokens) {
          expect(token.index).toBeTypeOf('number');
          expect(token.surfaceToken).toBeTypeOf('string');
          expect(token.lemma).toBeTypeOf('string');
          expect(token.pos).toBeTypeOf('string');
          expect(token.meaningEn).toBeTypeOf('string');
        }

        // Verify variations
        if (result.variations) {
          expect(result.variations).toBeInstanceOf(Array);
          for (const v of result.variations) {
            expect(v.level).toBeTypeOf('string');
            expect(v.textDe).toBeTypeOf('string');
            expect(v.textEn).toBeTypeOf('string');
          }
        }
      }
    });

    it('3.2 validates WordLookup offline mock against strict JSON schema', async () => {
      const wordsToTest = ['Geschwindigkeit', 'Haus', 'verstehen', 'schön', 'zuverlässig'];

      for (const word of wordsToTest) {
        const result = await geminiService.generateStructured({
          prompt: `Lookup German word: ${word}`,
          responseSchema: WordLookupResponseSchema,
          cacheType: 'test_word_schema_fidelity',
          cacheKeyData: { word },
        }) as any;

        expect(result.lemma).toBeTypeOf('string');
        expect(result.pos).toBeTypeOf('string');
        expect(result.cefrLevel).toBeTypeOf('string');
        expect(result.meaningEn).toBeTypeOf('string');
        if (result.declensions) {
          expect(result.declensions.nominativSg).toBeTypeOf('string');
          expect(result.declensions.akkusativSg).toBeTypeOf('string');
          expect(result.declensions.dativSg).toBeTypeOf('string');
          expect(result.declensions.genitivSg).toBeTypeOf('string');
        }
      }
    });

    it('3.3 validates DrillGeneration offline mock against strict JSON schema', async () => {
      const topics = ['satzklammer-v2', 'accusative-case', 'subordinate-clauses-weil'];

      for (const topic of topics) {
        const result = await geminiService.generateStructured({
          prompt: `Generate drills for topic: ${topic}`,
          responseSchema: DrillGenerationResponseSchema,
          cacheType: 'test_drill_schema_fidelity',
          cacheKeyData: { topic },
        }) as any;

        expect(result.topicSlug).toBeTypeOf('string');
        expect(result.cefrLevel).toBeTypeOf('string');
        expect(result.drills).toBeInstanceOf(Array);
        expect(result.drills.length).toBeGreaterThan(0);

        for (const drill of result.drills) {
          expect(drill.drillId).toBeTypeOf('string');
          expect(drill.drillType).toBeTypeOf('string');
          expect(drill.promptDe).toBeTypeOf('string');
          expect(drill.correctAnswer).toBeTypeOf('string');
          expect(drill.explanation).toBeTypeOf('string');
        }
      }
    });

    it('3.4 validates SpeakingEvaluation offline mock against strict JSON schema', async () => {
      const samples = [
        'Ich habe gefahrt mit die Frau',
        'Guten Tag, ich möchte bitte ein Zimmer buchen',
        'Weil ich keine Zeit habe, kann ich nicht kommen',
      ];

      for (const transcript of samples) {
        const result = await geminiService.generateStructured({
          prompt: `Evaluate learner transcript: ${transcript}`,
          responseSchema: SpeakingEvaluationResponseSchema,
          cacheType: 'test_speaking_schema_fidelity',
          cacheKeyData: { transcript },
        }) as any;

        expect(result.overallScore).toBeTypeOf('number');
        expect(result.overallScore).toBeGreaterThanOrEqual(0);
        expect(result.overallScore).toBeLessThanOrEqual(100);

        expect(result.successes).toBeInstanceOf(Array);
        expect(result.corrections).toBeInstanceOf(Array);
        expect(result.minedVocabulary).toBeInstanceOf(Array);

        for (const corr of result.corrections) {
          expect(corr.originalSnippet).toBeTypeOf('string');
          expect(corr.correctedSnippet).toBeTypeOf('string');
          expect(corr.ruleExplanation).toBeTypeOf('string');
        }

        for (const vocab of result.minedVocabulary) {
          expect(vocab.lemma).toBeTypeOf('string');
          expect(vocab.meaningEn).toBeTypeOf('string');
        }
      }
    });

    it('3.5 validates input validation and edge cases in Miner & Dictionary endpoints', async () => {
      // 1. Missing sentence body
      const res1 = await request(app).post('/api/miner/analyze').send({});
      expect(res1.status).toBe(400);
      expect(res1.body.error).toMatch(/sentence string is required/i);

      // 2. Non-string sentence body
      const res2 = await request(app).post('/api/miner/analyze').send({ sentence: 12345 });
      expect(res2.status).toBe(400);

      // 3. Missing dictionary query parameter
      const res3 = await request(app).get('/api/dictionary/lookup');
      expect(res3.status).toBe(400);
      expect(res3.body.error).toMatch(/query parameter q is required/i);

      // 4. Blank dictionary query
      const res4 = await request(app).get('/api/dictionary/lookup?q=   ');
      expect(res4.status).toBe(400);

      // 5. Card review with invalid card id
      const res5 = await request(app)
        .post('/api/cards/non-existent-card-id/review')
        .set('x-user-id', 'guest-user-001')
        .send({ rating: 3 });
      expect(res5.status).toBe(404);
      expect(res5.body.error).toMatch(/card not found/i);

      // 6. Curriculum topic with invalid slug
      const res6 = await request(app).get('/api/curriculum/topics/invalid-slug-12345');
      expect(res6.status).toBe(404);
      expect(res6.body.error).toMatch(/topic not found/i);
    });

    it('3.6 performs linguistic analysis validation across diverse German syntactic forms', async () => {
      const syntacticForms = [
        { type: 'V2 Declarative', sent: 'Der Hund schläft im Garten.' },
        { type: 'Inverted Vorfeld Temporal', sent: 'Gestern ging der Lehrer nach Hause.' },
        { type: 'Subordinate Weil', sent: 'Er lernt fleißig, weil er die Prüfung bestehen möchte.' },
        { type: 'Subordinate Dass', sent: 'Ich weiß, dass sie heute kommt.' },
        { type: 'Separable Verb Perfekt', sent: 'Wir sind um 8 Uhr abgefahren.' },
        { type: 'Heavy Umlaut & Eszett', sent: 'Übermorgen müssen große Männer süßen Saft trinken.' },
      ];

      for (const item of syntacticForms) {
        const res = await request(app)
          .post('/api/miner/analyze')
          .send({ sentence: item.sent, level: 'B1' });

        expect(res.status).toBe(200);
        const analysis = res.body.analysis;
        expect(analysis).toBeDefined();
        expect(analysis.textDe).toBeTypeOf('string');
        expect(analysis.textEnNatural).toBeTypeOf('string');
        expect(analysis.textEnLiteral).toBeTypeOf('string');
        expect(analysis.tokens).toBeInstanceOf(Array);
        expect(analysis.tokens.length).toBeGreaterThan(0);

        // Check each token has valid grammatical role
        for (const tok of analysis.tokens) {
          expect(tok.surfaceToken).toBeTypeOf('string');
          expect(tok.lemma).toBeTypeOf('string');
          expect(tok.pos).toBeTypeOf('string');
          expect(tok.meaningEn).toBeTypeOf('string');
        }
      }
    });

    it('3.7 executes 25 concurrent card mining requests (POST /api/miner/mine-card)', async () => {
      const promises = Array.from({ length: 25 }).map((_, i) =>
        request(app)
          .post('/api/miner/mine-card')
          .set('x-user-id', 'guest-user-001')
          .send({
            prompt: `Mined Word #${i}`,
            answer: `Mined Definition #${i}`,
            contextSentence: `Context sentence for mined card #${i}`,
            cardType: 'recognition',
            optionsJson: { tags: ['mined', 'stress-test'] },
          })
      );

      const responses = await Promise.all(promises);
      expect(responses.length).toBe(25);
      for (const res of responses) {
        expect(res.status).toBe(200);
        expect(res.body.card).toBeDefined();
        expect(res.body.card.id).toBeDefined();
      }

      // Verify database count
      const minedCount = await prisma.card.count({
        where: {
          prompt: { startsWith: 'Mined Word #' },
        },
      });
      expect(minedCount).toBe(25);
    });

    it('3.8 verifies cache metrics accuracy under high-volume interleaved traffic', async () => {
      const initialMetrics = await sqliteCache.getMetrics();

      // Perform 20 cached requests for same payload
      const cacheInput = { metricChurnKey: `churn-${Date.now()}` };
      await sqliteCache.set('churn_test', cacheInput, { churn: true });

      for (let i = 0; i < 20; i++) {
        await sqliteCache.get('churn_test', cacheInput);
      }

      const updatedMetrics = await sqliteCache.getMetrics();
      expect(updatedMetrics.totalHits).toBeGreaterThanOrEqual(initialMetrics.totalHits + 20);
      expect(updatedMetrics.typeDistribution['churn_test']).toBeGreaterThanOrEqual(1);
    });
  });
});

