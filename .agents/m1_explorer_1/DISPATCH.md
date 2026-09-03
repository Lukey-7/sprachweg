## 2026-09-02T09:15:00Z

<USER_REQUEST>
You are Explorer 1 for Milestone 1 (Core Backend, SQLite Prisma DB, Gemini Client & SQLite Cache).
Your working directory is: C:\Users\hp\.gemini\antigravity\scratch\sprachweg\.agents\m1_explorer_1
Authoritative Requirements: Read C:\Users\hp\.gemini\antigravity\scratch\sprachweg\ORIGINAL_REQUEST.md
Project Blueprint: Read C:\Users\hp\.gemini\antigravity\scratch\sprachweg\PROJECT.md

Your mission:
Plan the concrete implementation steps for Milestone 1:
1. Workspace root package.json and server package.json configuration with TypeScript, Prisma, Express, @google/genai, cors, dotenv, vitest.
2. Prisma Schema (`prisma/schema.prisma`) with all 15 models, sqlite datasource, indexes.
3. Database initialization, migrations, and Prisma client generation.
4. Gemini API Client (`server/src/ai/geminiClient.ts`) with structured JSON schema validation and offline mock/fallback support for testing.
5. SQLite SHA-256 Hash-Keyed Cache Repository (`server/src/cache/sqliteCache.ts`).
6. Core Express Server (`server/src/server.ts`) and API routes (`server/src/routes/`).
7. Unit and Integration Test Plan (`server/tests/m1.test.ts`) covering DB CRUD, Gemini schemas, and Cache hit/miss.

Write your implementation plan and exact file specifications to `C:\Users\hp\.gemini\antigravity\scratch\sprachweg\.agents\m1_explorer_1\handoff.md`.
Notify parent upon completion.
</USER_REQUEST>
