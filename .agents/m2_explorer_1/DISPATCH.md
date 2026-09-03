## 2026-09-02T09:29:36Z
You are Explorer 1 for Milestone 2 (Linguistic Validation Engine, FSRS Spaced Repetition & Sentence Miner).
Your working directory is: C:\Users\hp\.gemini\antigravity\scratch\sprachweg\.agents\m2_explorer_1
Authoritative Requirements: Read C:\Users\hp\.gemini\antigravity\scratch\sprachweg\ORIGINAL_REQUEST.md
Master Architecture & Blueprint: Read C:\Users\hp\.gemini\antigravity\scratch\sprachweg\PROJECT.md
E2E Contracts & Oracles: Read C:\Users\hp\.gemini\antigravity\scratch\sprachweg\e2e\harness\referenceOracles.ts and C:\Users\hp\.gemini\antigravity\scratch\sprachweg\TEST_INFRA.md

Your mission:
Plan the concrete implementation files and algorithms for Milestone 2:
1. German Linguistic Engine (`server/src/linguistics/`):
   - Multi-pass grammatical verification: 4-case article and adjective declensions (Nominativ, Akkusativ, Dativ, Genitiv), auxiliary verb selection (*haben* vs *sein* for Perfekt tense), preposition case governance (*Wechselpräpositionen*, Acc-only, Dat-only, Gen-only), and V2/Nebensatz word order rules.
   - Comprehensive error diagnosis with pedagogical explanations.
2. FSRS Spaced Repetition Engine (`server/src/fsrs/`):
   - Full FSRS 4.5/5 algorithm with exact formulas for initial stability ($S_0$), initial difficulty ($D_0$), retrievability ($R$), stability updates upon success ($S_{new}$), stability updates upon lapse/failure ($S_{lapse}$), and interval calculation with target retention ($r=0.90$).
   - Support for all 6 card types: `RECOGNITION`, `PRODUCTION`, `SENTENCE_CLOZE`, `AUDIO_MEANING`, `GENDER_DRILL`, `PLURAL_DRILL`.
   - Queue management with daily new card limits (default 20) and daily review limits (default 100), backlog protection, and review logging to SQLite `reviews` table.
3. Sentence Miner & Satzklammer Parser (`server/src/miner/`):
   - Word-by-word token teardown resolving lemma, POS, contextual case, gender styling, and syntactic function.
   - Topological sentence map generator dividing sentences into Vorfeld (Pos 1), Linke Satzklammer (Pos 2 V2 or sub conjunction), Mittelfeld (TeKaMoLo components), Rechte Satzklammer (Verb-Ende / Satzklammer), and Nachfeld.
   - Tri-tier interlinear side-by-side translation (Tokens, literal word-for-word gloss, natural idiomatic English).
   - 1-tap deck card generator (Word card and Cloze card) + generation of 3 CEFR-calibrated variations (A1, A2, B1).
4. REST API Endpoints in `server/src/routes/linguistics.ts`, `server/src/routes/cards.ts`, and `server/src/routes/miner.ts`.
5. Unit & Integration Tests in `server/tests/m2.test.ts`.

Write your detailed plan and exact code specifications to `C:\Users\hp\.gemini\antigravity\scratch\sprachweg\.agents\m2_explorer_1\handoff.md`.
Notify parent upon completion.
