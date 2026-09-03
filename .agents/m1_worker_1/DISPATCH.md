## 2026-09-02T09:17:35Z
You are Worker 1 for Milestone 1 (Core Backend, SQLite Prisma DB, Gemini Client & SQLite Cache).
Your working directory is: C:\Users\hp\.gemini\antigravity\scratch\sprachweg\.agents\m1_worker_1
Authoritative Requirements: Read C:\Users\hp\.gemini\antigravity\scratch\sprachweg\ORIGINAL_REQUEST.md
Master Architecture & Blueprint: Read C:\Users\hp\.gemini\antigravity\scratch\sprachweg\PROJECT.md
Implementation Specifications: Read C:\Users\hp\.gemini\antigravity\scratch\sprachweg\.agents\m1_explorer_1\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write Ownership:
You exclusively own: `package.json`, `server/`, `prisma/`, `.env`.

Your mission:
1. Create root `package.json`, `server/package.json`, and `server/tsconfig.json`.
2. Create `prisma/schema.prisma` with all 15 relational models (`User`, `Settings`, `Word`, `WordForm`, `Sentence`, `SentenceToken`, `Card`, `Review`, `GrammarTopic`, `GrammarProgress`, `Lesson`, `Session`, `SpeakingSession`, `ErrorLog`, `CacheEntry`) with exact relations, cascade rules, and SQLite indexes.
3. Install dependencies in root and `server/`. Run `prisma db push` or `prisma generate` to generate the client and initialize SQLite database (`prisma/dev.db`).
4. Implement `server/src/db/prisma.ts` (singleton Prisma client) and `server/src/db/seed.ts` (idempotent seeding of user, settings, core vocabulary, grammar topics, sample sentences). Run `npm run prisma:seed`.
5. Implement `server/src/ai/geminiClient.ts` using `@google/genai`, pinned linguistic system prompt, JSON response schemas for Sentence Teardown, Word Lookup, Drill Generation, Speaking Evaluation, and robust offline mock fallback engine for deterministic offline execution.
6. Implement `server/src/cache/sqliteCache.ts` (SHA-256 hash-keyed SQLite cache repository with hit count tracking and TTL).
7. Implement `server/src/server.ts` (Express server with CORS, JSON body parser, health endpoint `/api/health`, error handling) and modular REST API routers in `server/src/routes/` (`auth.ts`, `dictionary.ts`, `miner.ts`, `cards.ts`, `curriculum.ts`, `sessions.ts`, `speaking.ts`, `stats.ts`, `cache.ts`).
8. Implement comprehensive unit & integration tests in `server/tests/m1.test.ts` (DB CRUD, Prisma relations, Cache hit/miss dynamics, Gemini schema compliance, Express REST endpoints).
9. Run all tests with `npm test` inside `server/` and ensure 100% pass rate.
10. Write your handoff report to `C:\Users\hp\.gemini\antigravity\scratch\sprachweg\.agents\m1_worker_1\handoff.md`. Include exact build and test command outputs.
11. Send a message to parent notifying completion.
