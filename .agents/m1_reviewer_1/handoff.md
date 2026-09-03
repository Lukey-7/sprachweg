# Milestone 1 Quality Review & Adversarial Stress Report

**Reviewer**: Reviewer 1 (`.agents/m1_reviewer_1`)  
**Role**: Reviewer & Adversarial Critic  
**Milestone**: Milestone 1 (Core Backend, SQLite Prisma DB, Gemini Client & SQLite Cache)  
**Date**: 2026-09-02  
**Explicit Verdict**: **APPROVE**

---

## 1. Observation

### 1.1 Inspected Codebase Files & Artifacts

1. **Prisma Relational Schema (`prisma/schema.prisma`)** — 360 lines:
   - Contains all **15 required domain models**:
     1. `User` (`users`) — user accounts, CEFR levels (A0-B2), streaks, freeze tokens.
     2. `Settings` (`settings`) — SRS daily limits (20 new, 100 review cap), target retention (0.90), TTS voice preferences.
     3. `Word` (`words`) — vocabulary lemmas, normalized lemmas, POS, gender (der/die/das), CEFR level, IPA, meanings, decompounding parts.
     4. `WordForm`(`word_forms`) — full inflected surface forms, normalized forms, case/number/gender, conjugation tense/mood/person/auxiliary (haben/sein).
     5. `Sentence`(`sentences`) — German sentence text, natural & literal English glosses, Satzklammer topological fields (`v2Position1`, `v2Verb`, `v2Mittelfeld`, `v2VerbFinal`), Nebensatz flags, conjunction triggers.
     6. `SentenceToken` (`sentence_tokens`) — word-level token breakdown with surface token, lemma, POS, case, syntax role, declension trigger.
     7. `Card`(`cards`) — 6 SRS card types (recognition, production, sentence_cloze, audio_meaning, gender_drill, plural_drill), stability, difficulty, state, due date.
     8. `Review` (`reviews`) — review history, 1-4 ratings (Again, Hard, Good, Easy), stability/difficulty before and after, response latency.
     9. `GrammarTopic`(`grammar_topics`) — 52-week curriculum grammar units, slug, CEFR level, markdown explanations, visual formula patterns, paradigm tables.
     10. `GrammarProgress` (`grammar_progress`) — granular mastery scores (0.0 to 1.0, >= 0.80 mastered), remedial active status flag.
     11. `Lesson`(`lessons`) — 5-block daily lesson components (`warmup_srs`, `grammar_concept`, `sentence_miner`, `speaking_task`, `immersion_listening`).
     12. `Session`(`sessions`) — daily 5-block tracking with completion flags for blocks 1-5, injected remedial drills, duration.
     13. `SpeakingSession` (`speaking_sessions`) — 5 voice modes, scenario IDs, transcripts, accuracy/fluency scores, 3 successes, 3 corrections, 5 mined words.
     14. `ErrorLog` (`error_logs`) — contextual error tracking (gender, case, conjugation, word_order) with explanations and grammar tags.
     15. `CacheEntry` (`cache_entries`) — deterministic SHA-256 hash cache for Gemini API requests, hit counters, TTL support.
   - Foreign key constraints configured with `onDelete: Cascade` for owned relations and `onDelete: SetNull` for optional entity lookups.
   - Comprehensive query indexes on critical lookup paths (`[lemma]`, `[normalizedLemma]`, `[userId, dueAt]`, `[userId, state]`, `[cacheKey]`, `[slug]`, `[weekNumber, dayNumber]`).

2. **Database Singleton & Seeding(`server/src/db/`)**:
   - `prisma.ts`: Singleton `PrismaClient` instance using `globalThis.prismaGlobal` to prevent connection leaks during development.
   - `seed.ts`: Idempotent seeding script provisioning default guest user (`guest-user-001`), user settings, 5 core vocabulary items with inflected forms (`Haus`, `Geschwindigkeit`, `gehen`, `Mann`, `Apfel`), 4 baseline grammar topics (`gender-and-articles`, `satzklammer-v2`, `accusative-case`, `subordinate-clauses-weil`), and analyzed sentences with token breakdowns.

3. **Gemini AI Integration (`server/src/ai/geminiClient.ts`)** — 422 lines:
   - Uses `@google/genai` SDK with `GoogleGenAI` client and `Type` enum structured schemas.
   - Pinned `GERMAN_LINGUISTIC_SYSTEM_PROMPT` establishing strict linguistic instructions (4 cases, 3 genders, Satzklammer Vorfeld/V2/Mittelfeld/Verb-Ende/Nachfeld, Nebensatz triggers, auxiliary haben/sein selection, preposition case governance).
   - 4 strict structured response schemas:
     - `SentenceAnalysisResponseSchema`
     - `WordLookupResponseSchema`
     - `DrillGenerationResponseSchema`
     - `SpeakingEvaluationResponseSchema`
   - Deterministic offline mock engine providing valid, schema-compliant responses when running offline or during automated test executions.

4. **SHA-256 SQLite Cache Layer (`server/src/cache/sqliteCache.ts`)** — 185 lines:
   - `generateHashKey(cacheType, inputParams)`: Generates deterministic SHA-256 hashes with recursive JSON key sorting (`sortObjectKeys`).
   - `get<T>(cacheType, inputParams)`: Checks key presence, handles TTL expiration, automatically increments `hitCount`.
   - `set<T>(cacheType, inputParams, payload, ttlSeconds)`: Stores normalized parameters and validated JSON payloads in `cache_entries`.
   - `invalidate(cacheKey)`, `clearExpired()`, and `getMetrics()` for cache management and monitoring.

5. **Express REST Server & Routes (`server/src/server.ts`, `server/src/routes/`)**:
   - Configured with CORS, JSON body parser, healthcheck at `GET /api/health`, request logging, 404 handler, and global error handling middleware.
   - 10 REST routers mounted:
     - `authRoutes.ts` (`POST /api/auth/guest`)
     - `userRoutes.ts` (`GET /api/user/profile`, `PATCH /api/user/settings`)
     - `dictionaryRoutes.ts` (`GET /api/dictionary/lookup`, `GET /api/dictionary/autocomplete`)
     - `minerRoutes.ts` (`POST /api/miner/analyze`, `POST /api/miner/mine-card`)
     - `cardRoutes.ts` (`GET /api/cards/study-queue`, `POST /api/cards/:id/review`)
     - `curriculumRoutes.ts` (`GET /api/curriculum/syllabus`, `GET /api/curriculum/topics/:slug`)
     - `sessionRoutes.ts` (`GET /api/sessions/today`, `POST /api/sessions/:id/block/:blockNum/complete`)
     - `speakingRoutes.ts` (`POST /api/speaking/evaluate`)
     - `statsRoutes.ts` (`GET /api/stats/dashboard`)
     - `cacheRoutes.ts` (`GET /api/cache/metrics`, `DELETE /api/cache/:key`)

### 1.2 Build & Test Verification Execution

1. **TypeScript Compilation Build**:
   - Command: `npm run server:build`
   - Result: Exit code 0. Zero TypeScript compilation errors.

2. **Server Vitest Unit & Stress Test Suites**:
   - Command: `npm run server:test`
   - Result: **43 passed across 2 test files (100% pass rate in 4.61s)*:
     - `server/tests/m1.test.ts`: 26 passed
     - `server/tests/m1_stress_challenger.test.ts`: 17 passed (high-concurrency stress, real-time TTL expiration, schema fidelity)

3. **Master E2E Test Suite Harness**:
   - Command: `npx tsx e2e/harness/runAllTests.ts`
   - Result: **220 passed out of 220 tests (100% pass rate in 124.27ms)**:
     - Tier 1 (Feature Coverage): 145/145 Passed
     - Tier 2 (Boundaries & Edge Cases): 30/30 Passed
     - Tier 3 (Cross-Feature Pairwise): 25/25 Passed
     - Tier 4 (Real-World Learner Journeys): 20/20 Passed

---

## 2. Logic Chain

1. **Integrity & Authenticity Assessment**:
   - Inspected source code for hardcoded test fixtures, facade stubs, or bypasses.
   - Result: **Zero Integrity Violations Found**.
   - The database layer uses actual Prisma ORM queries to SQLite.
   - The cache layer uses genuine Node.js `crypto.createHash('sha256')` implementation and executes atomic `updateMany`incrementing on database records.
   - The routes perform actual database CRUD, handle authorization headers (`x-user-id`), and return proper HTTP response codes (200, 400, 404, 500).

2. **Schema & Model Conformance**:
   - Verified that all 15 models defined in `prisma/schema.prisma` map 1-to-1 with the system requirements in `PROJECT.md` and `ORIGINAL_REQUEST.md`.
   - Verified that cascading deletions function correctly (deleting a `User` cleanly cascades and removes `Settings`, `Cards`, `Reviews`, `Sessions`, `SpeakingSessions`).

3. **Gemini AI & Cache Layer Conformance**:
   - Verified that Gemini API wrapper integrates with `@google/genai` using structured `responseSchema` schemas.
   - Verified that the SHA-256 cache avoids duplicate API calls by producing identical hashes for objects with differing key order (`{ a: 1, b: 2 }` vs `{ b: 2, a: 1 }`).
   - Verified that distinct cache types with identical input parameters generate distinct hash keys, avoiding cross-namespace cache collisions.

4. **Adversarial & Stress-Testing Findings**:
   - **Concurrency Stress**: Tested 60 concurrent health requests, 50 concurrent dictionary requests, 30 concurrent miner analyses, 30 concurrent card reviews, 20 concurrent speaking evaluations. All resolved with 200 OK and no SQLite database lock contention.
   - **Real-Time TTL Expiration**: Tested 1-second TTL expiration. Entries were immediately retrievable before expiration and returned null / auto-evicted after 1.2 seconds.
   - **Input Validation & Error Handling**: Verified that missing parameters return 400 Bad Request and non-existent IDs return 404 Not Found without crashing the server.

---

## 3. Caveats

- **FSRS Mathematical Scheduler Scope**: In Milestone 1, `/api/cards/:id/review` implements the baseline interval and repetition state transitions. The complete 19-parameter mathematical scheduler with memory retrievability equations is designed for full expansion in Milestone 2.
- **Offline / Online API Operation**: In offline mode or automated test execution, `GeminiService` uses deterministic structured mock generators. Setting `GEMINI_API_KEY` and `MOCK_GEMINI=false` connects to the live Gemini 2.5 Flash endpoint via `@google/genai`.
- **Frontend & Web Audio**: Frontend UI and Web Audio API waveform visualizers are scheduled for Milestones 5 and 6 according to the master architecture.

---

## 4. Conclusion

**Verdict: APPROVE**

The Milestone 1 implementation satisfies all authoritative requirements from `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `TEST_READY.md`. The SQLite database schema models all 15 entities with relational integrity, the Gemini structured output client is backed by deterministic SHA-256 SQLite caching, and the Express REST API endpoints operate cleanly under stress.

All 43 unit/stress tests and all 220 E2E tests pass with a 100% pass rate. Milestone 1 is approved to proceed to Milestone 2.

---

## 5. Verification Method

To independently reproduce and verify this review:

```powershell
# 1. Compile TypeScript Backend
npm run server:build

# 2. Execute Backend Unit, Integration & Adversarial Stress Tests
npm run server:test

# 3. Execute Complete E2E Dual-Track Test Harness (220 tests)
npx tsx e2e/harness/runAllTests.ts
```
