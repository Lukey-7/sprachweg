# BRIEFING — 2026-09-02T15:05:00Z

## Mission
Implement Milestone 2: Linguistic Validation Engine, FSRS Spaced Repetition Engine, and Sentence Miner with full mathematical rigor, database persistence, REST endpoints, and 100% test coverage.

## 🔒 My Identity
- Archetype: implementer
- Roles: implementer, qa, specialist
- Working directory: C:\Users\hp\.gemini\antigravity\scratch\sprachweg\.agents\m2_worker_1
- Original parent: 72741ab4-cb02-4e83-ab3e-7d16ec7167f7
- Milestone: Milestone 2 (Linguistic Validation Engine, FSRS Spaced Repetition & Sentence Miner)

## 🔒 Key Constraints
- Pure genuine logic: No cheating, no hardcoded test shortcuts, no mock facade cheating.
- Retrievability curve, initial stabilities, next difficulties, and lapse/recall stability formulas must match FSRS 4.5/5 reference oracles.
- German grammar engine must validate 4 cases, accusative/dative/genitive/wechsel prepositions, haben vs sein auxiliary selection, 4-case declension matrices, Satzklammer topological fields, and multi-pass pedagogical diagnostics.
- Write ownership: server/src/linguistics/, server/src/fsrs/, server/src/miner/, server/src/routes/linguisticsRoutes.ts, server/src/routes/cardRoutes.ts, server/src/routes/minerRoutes.ts, server/src/server.ts, server/tests/m2.test.ts.

## Current Parent
- Conversation ID: 72741ab4-cb02-4e83-ab3e-7d16ec7167f7
- Updated: 2026-09-02T15:05:00Z

## Task Summary
- **What to build**:
  1. server/src/linguistics/: types.ts, prepositions.ts, auxiliary.ts, declensions.ts, satzklammer.ts, errorDiagnostics.ts, index.ts
  2. server/src/fsrs/: types.ts, fsrsEngine.ts, queueManager.ts, index.ts
  3. server/src/miner/: types.ts, sentenceMiner.ts, interlinear.ts, variations.ts, index.ts
  4. server/src/routes/: linguisticsRoutes.ts, cardRoutes.ts, minerRoutes.ts, server.ts
  5. server/tests/m2.test.ts: comprehensive Vitest test suite covering all modules and API endpoints
- **Success criteria**:
  - 
pm run server:build passes cleanly
  - 
pm run server:test passes 100% (including all existing tests + new M2 tests)
  - 
px tsx e2e/harness/runAllTests.ts passes 100% (220/220 tests)
- **Interface contracts**: PROJECT.md & e2e/harness/contracts.ts
- **Code layout**: PROJECT.md

## Key Decisions Made
- Use exact FSRS-4.5 weights and power-law formulas aligned with referenceOracles.ts.
- Deterministic topological parsing in satzklammer.ts for Hauptsatz (V2), Nebensatz (Verb-Ende), V1 Questions, and Imperatives.
- Multi-tier error diagnostics with German and English explanations and severity codes.
- SQLite-backed queueManager enforcing daily limits and review audit logging.

## Artifact Index
- server/src/linguistics/*
- server/src/fsrs/*
- server/src/miner/*
- server/src/routes/*
- server/tests/m2.test.ts
