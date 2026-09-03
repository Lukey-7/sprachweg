# Project: Sprachweg

Production-quality German learning platform taking learners from absolute beginner (A0) to solid B1 with reach into B2 across a structured 52-week curriculum, powered by the Google Gemini API with FSRS spaced repetition, deep sentence mining, comprehensive dictionary with compound decompounding, interactive grammar courses, 5 voice interaction modes, and mobile-first UX.

## Architecture

```
+========================================================================================================+
|                                        SPRACHWEG ARCHITECTURE                                          |
+========================================================================================================+
|                                                                                                        |
|  +--------------------------------------------------------------------------------------------------+  |
|  |                           FRONTEND CLIENT (React + Vite + Tailwind CSS)                           |  |
|  |  * Mobile-First Responsive Layout (<1024px Bottom Nav, >=1024px Sidebar)                          |  |
|  |  * Universal German Quick-Bar (ä, ö, ü, ß, Ä, Ö, Ü) with Caret Tracking & Synthetic Event Sync   |  |
|  |  * Visual Satzklammer Word Order Map (Vorfeld, Pos 2 V2, Mittelfeld TeKaMoLo, Verb-Ende, Nachfeld)|  |
|  |  * Standardized Gender Visual Colors (der=Blue, die=Red, das=Green, die Pl=Purple)               |  |
|  |  * Side-by-Side Interlinear Translations & 1-Tap FSRS Cloze Sentence Miner                       |  |
|  |  * Web Audio API Recorder & Dynamic Canvas Oscillogram / Phonetic Pitch Waveform Visualizer      |  |
|  |  * Interactive Graded Readers with Tap-to-Inspect Token Popovers                                  |  |
|  +-------------------------------------------------+------------------------------------------------+  |
|                                                    | REST API Calls / JSON Payloads                    |
|                                                    v                                                   |
|  +--------------------------------------------------------------------------------------------------+  |
|  |                              BACKEND SERVER (Node.js / Express / TypeScript)                     |  |
|  |  +---------------------------+  +---------------------------+  +------------------------------+  |  |
|  |  |    Linguistic Engine      |  |   FSRS Spaced Repetition  |  |   Curriculum & Adaptive      |  |  |
|  |  |  * Satzklammer Parser     |  |  * Stability / Difficulty |  |  * 52-Week CEFR Progression   |  |  |
|  |  |  * 4-Case Validator       |  |  * Retrievability Calc    |  |  * 5-Block Daily Session     |  |  |
|  |  |  * Haben/Sein Aux Checker |  |  * 6 Card Variant Types   |  |  * <80% Remedial Drill Inject|  |  |
|  |  |  * Decompounder Engine    |  |  * Daily Caps & Burnout   |  |  * 60 Topics / 900+ Drills   |  |  |
|  |  +-------------+-------------+  +-------------+-------------+  +--------------+---------------+  |  |
|  |                |                              |                               |                  |  |
|  |  +-------------v------------------------------v-------------------------------v---------------+  |  |
|  |  |                      Reference Dictionary & Voice Studio Modules                           |  |  |
|  |  |  * 4-Case Declension & Conjugation Matrices    * 5 Voice Modes (Chat, Roleplay, Coach, etc)|  |  |
|  |  |  * Fuzzy Diacritic Tolerant Search Index        * 3-3-5 Post-Session Debriefing Engine      |  |  |
|  |  +---------------------------------------------+----------------------------------------------+  |  |
|  |                                                |                                                 |  |
|  |  +---------------------------------------------v----------------------------------------------+  |  |
|  |  |                  Gemini AI Layer with Structured Schemas & SQLite Caching                  |  |  |
|  |  |  * Server-side @google/genai Wrapper with responseSchema Pinned Prompts                     |  |  |
|  |  |  * SHA-256 Hash-Keyed SQLite Cache (Zero Duplicate Calls, Offline Readiness)               |  |  |
|  |  +---------------------------------------------+----------------------------------------------+  |  |
|  +-------------------------------------------------+------------------------------------------------+  |
|                                                    | Prisma Client                                     |
|                                                    v                                                   |
|  +--------------------------------------------------------------------------------------------------+  |
|  |                                DATABASE (SQLite via Prisma ORM)                                  |  |
|  |  * users, settings, words, word_forms, sentences, sentence_tokens, cards, reviews,               |  |
|  |    grammar_topics, grammar_progress, lessons, sessions, speaking_sessions, error_logs, cache     |  |
|  +--------------------------------------------------------------------------------------------------+  |
+========================================================================================================+
```

---

## Feature Inventory

Every requirement from `ORIGINAL_REQUEST.md` and the survey phase is mapped to a milestone below:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | SQLite Database & Prisma ORM | Complete schema modeling users, settings, words, forms, sentences, cards, reviews, grammar, sessions, cache | M1 | R1, survey |
| 2 | Gemini AI Wrapper & Structured Output | @google/genai integration with responseSchema enforcement and pinned linguistic system prompts | M1 | R1, survey |
| 3 | SHA-256 SQLite Response Cache | Hash-keyed SQLite caching for AI outputs (words, analyses, drills, audio metadata) guaranteeing zero redundant calls | M1 | R1, survey |
| 4 | Core REST API Express Server | Modular Express router serving all API endpoints with middleware validation and error handling | M1 | R1, survey |
| 5 | Multi-Pass Linguistic Validator | Algorithmic verification for gender, 4-case declension, auxiliary haben/sein, and preposition case governance | M2 | R1, survey |
| 6 | FSRS Spaced Repetition Engine | Full Free Spaced Repetition Scheduler with S, D, R, and interval calculations across 4 ratings (Again/Hard/Good/Easy) | M2 | R4, survey |
| 7 | 6 FSRS Card Variant Types | Recognition (DE->EN), Production (EN->DE), Sentence Cloze, Audio->Meaning, Targeted Gender drill, Plural drill | M2 | R4, survey |
| 8 | FSRS Daily Pacing & Backlog Protection | Configurable daily new card limits (default 20) and daily review ceilings (default 100) | M2 | R4, survey |
| 9 | Sentence Miner Word-by-Word Parser | Deep token teardown extracting lemma, POS, contextual meaning, case, declension trigger, syntax function | M2 | R2, survey |
| 10 | German Reference Dictionary Matrix | Declension tables (4 cases, singular/plural, N-declension), full verb conjugations across all tenses/moods, adjective tables | M3 | R3, survey |
| 11 | German Compound Decompounder | Algorithmic morphological decompounding with Fugenelemente (*Geschwindigkeitsbegrenzung* -> *Geschwindigkeit* + *s* + *Begrenzung*) | M3 | R3, survey |
| 12 | Fuzzy Tolerant Dictionary Search | Search normalizing umlauts (ae/oe/ue -> ä/ö/ü, ss -> ß), inflected form reverse index, and Levenshtein matching | M3 | R3, survey |
| 13 | 52-Week CEFR Curriculum Engine | Structured syllabus across A1 (M1-2), A2 (M3-4), B1 Start (M5-7), B1 Solid (M8-10), B1+/B2 (M11-12) | M4 | R5, survey |
| 14 | Daily 5-Block Session Pipeline | Warm-up SRS -> New grammar concept -> Sentence mining lab -> Speaking task -> Immersion listening/reading | M4 | R5, survey |
| 15 | Adaptive Grammar Mastery Engine | Granular tracking of grammar_tag accuracies with auto-injection of remedial drills for tags <80% mastery | M4 | R5, survey |
| 16 | 60 Grammar Courses & 900+ Drills | Intuitive mental models, paradigm tables, examples, and 15 interactive drills per topic (reorder, cloze, transform, error-spot) | M4 | R5, survey |
| 17 | 5 Voice Studio Interaction Modes | Free Conversation (recasts), Scenario Role-Play (5 scenarios), Pronunciation Coach (6 phonetic markers), Shadowing, Dictation | M5 | R6, survey |
| 18 | Post-Session Debriefing Generator | Automated debrief highlighting 3 successes, 3 prioritized corrections, and 5 mined vocabulary words | M5 | R6, survey |
| 19 | Web Audio API & Waveform Visualizer | Client-side audio recording, real-time Canvas oscillogram, native/learner pitch-amplitude comparison, TTS playback | M5 | R6, survey |
| 20 | React + Vite + Tailwind Frontend UI | Mobile-first responsive app (<1024px bottom nav, >=1024px sidebar), dark/light theme, under-3-tap daily session flow | M6 | R7, survey |
| 21 | Universal German Character Quick-Bar | Global toolbar (ä, ö, ü, ß, Ä, Ö, Ü) inserting into any active focused input/textarea with DOM caret preservation | M6 | R7, survey |
| 22 | Visual Satzklammer Word Order Map | Visual bar highlighting Position 1 (Vorfeld), V2 Verb, Mittelfeld (TeKaMoLo), and Verb-Final (Rechte Satzklammer/Nebensatz) | M6 | R2, survey |
| 23 | Universal Gender Color Badges | Consistent gender styling: der (blue #2563eb), die (red #dc2626), das (green #16a34a), die Pl (purple #9333ea) | M6 | R2, survey |
| 24 | Side-by-Side Interlinear Translation | Tri-tier view: German tokens, literal word-for-word gloss, and natural idiomatic English | M6 | R2, survey |
| 25 | Interactive Graded Immersion Readers | Graded stories and dialogues with tap-to-inspect token lookup popovers (lemma, case, definition, audio, 1-tap SRS add) | M6 | R7, survey |
| 26 | Progress Analytics & CEFR Dashboard | Words known counter, grammar mastery heatmap, speaking minutes, streak tracker with freeze protection, CEFR estimator | M6 | R7, survey |
| 27 | Simulated CEFR Placement Tests | Diagnostic test battery across reading, listening, writing, and speaking | M6 | R7, survey |
| 28 | Comprehensive E2E Testing Suite | Multi-tier test harness (Tiers 1-4) covering all features, boundaries, pairwise combinations, and realistic learner journeys | M7 | AC, survey |
| 29 | Adversarial Coverage Hardening | Tier 5 white-box challenger test generation and edge-case verification | M7 | AC, survey |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| **M1** | Core Backend, SQLite Prisma DB, Gemini Client & SQLite Cache | Models, migrations, Express server, Gemini wrapper, SHA-256 cache, API routes | None | DONE |
| **M2** | Linguistic Validation Engine, FSRS Spaced Repetition & Sentence Miner | Multi-pass validator, FSRS mathematical scheduler (6 card types), sentence tokenizer & parser | M1 | IN_PROGRESS |
| **M3** | Reference Dictionary, Decompounding & Fuzzy Search Index | Declensions, conjugations, compound decompounder with Fugenelemente, fuzzy tolerant search | M1, M2 | PLANNED |
| **M4** | 52-Week CEFR Curriculum, 60 Grammar Courses & Adaptive Engine | 52-week syllabus, daily 5-block orchestrator, adaptive <80% remediation, 60 topics / 900+ drills | M1, M2, M3 | PLANNED |
| **M5** | Voice Studio (5 Modes), Audio Waveform Engine & Debriefing | Web Audio / TTS pipelines, 5 voice modes, 5 roleplay scenarios, pronunciation coach, debrief | M1, M2, M4 | PLANNED |
| **M6** | Frontend Web Application, Readers, Quickbar & Mobile UX | React/Vite/Tailwind UI, German quickbar, visual Satzklammer, interlinear translation, readers, analytics | M1–M5 | PLANNED |
| **M7** | Final Integration, 100% Passing E2E Test Suite & Adversarial Hardening | End-to-end integration, passing all E2E tests (Tiers 1-4), Tier 5 adversarial tests, clean audit | M1–M6, E2E | PLANNED |

---

## Interface Contracts

### 1. Gemini AI & Cache Layer (`server/src/ai/geminiClient.ts`)
```typescript
export interface GeminiRequestOptions<T> {
  prompt: string;
  systemInstruction?: string;
  responseSchema: object;
  temperature?: number;
  cacheKeyData?: string;
}

export interface GeminiClient {
  generateStructured<T>(options: GeminiRequestOptions<T>): Promise<T>;
  getCachedResponse<T>(hashKey: string): Promise<T | null>;
  setCachedResponse<T>(hashKey: string, requestType: string, promptHash: string, data: T): Promise<void>;
}
```

### 2. Linguistic Validator & Satzklammer Parser (`server/src/linguistics/types.ts`)
```typescript
export interface TokenGrammar {
  token: string;
  lemma: string;
  pos: 'NOUN' | 'VERB' | 'ADJ' | 'ADV' | 'ART' | 'PREP' | 'PRON' | 'CONJ' | 'PART' | 'OTHER';
  gender?: 'der' | 'die' | 'das' | null;
  case?: 'NOMINATIV' | 'AKKUSATIV' | 'DATIV' | 'GENITIV' | null;
  grammaticalNumber?: 'SINGULAR' | 'PLURAL' | null;
  syntaxRole: string; // e.g. "Subject", "Direct Object", "Predicate Verb"
  topologicalField: 'VORFELD' | 'LINKE_SATZKLAMMER' | 'MITTELFELD' | 'RECHTE_SATZKLAMMER' | 'NACHFELD';
  tekamoloCategory?: 'TEMPORAL' | 'KAUSAL' | 'MODAL' | 'LOKAL' | null;
  meaningEn: string;
  literalGlossEn: string;
}

export interface SentenceAnalysis {
  sentenceDe: string;
  sentenceEnNatural: string;
  sentenceEnLiteral: string;
  tokens: TokenGrammar[];
  topologicalMap: {
    vorfeld: string;
    linkeSatzklammer: string;
    mittelfeld: string;
    rechteSatzklammer: string;
    nachfeld?: string;
  };
  isNebensatz: boolean;
  conjunctionTrigger?: string;
  grammarTags: string[];
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  variations: {
    level: 'A1' | 'A2' | 'B1';
    textDe: string;
    textEn: string;
  }[];
}
```

### 3. FSRS Engine (`server/src/fsrs/types.ts`)
```typescript
export type FsrsRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy
export type CardType = 'RECOGNITION' | 'PRODUCTION' | 'SENTENCE_CLOZE' | 'AUDIO_MEANING' | 'GENDER_DRILL' | 'PLURAL_DRILL';
export type CardState = 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';

export interface FsrsCardData {
  id: string;
  userId: string;
  cardType: CardType;
  front: string;
  back: string;
  contextSentence?: string;
  clozeDe?: string;
  audioUrl?: string;
  gender?: 'der' | 'die' | 'das';
  plural?: string;
  state: CardState;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReviewedAt?: string;
  dueAt: string;
}

export interface FsrsScheduleResult {
  rating: FsrsRating;
  card: FsrsCardData;
  reviewLog: {
    rating: FsrsRating;
    state: CardState;
    stability: number;
    difficulty: number;
    elapsedDays: number;
    scheduledDays: number;
    reviewedAt: string;
  };
}
```

### 4. Curriculum & Adaptive Session (`server/src/curriculum/types.ts`)
```typescript
export interface DailySessionPayload {
  userId: string;
  weekNumber: number;
  dayOfWeek: number;
}

export interface DailySessionPlan {
  sessionId: string;
  weekNumber: number;
  dayOfWeek: number;
  cefrLevel: string;
  block1Warmup: {
    dueCards: FsrsCardData[];
    remedialDrills: InteractiveDrill[];
  };
  block2Grammar: {
    topic: GrammarTopicSummary;
    mentalModel: string;
    paradigmTable: object;
    drills: InteractiveDrill[];
  };
  block3Mining: {
    sentences: SentenceAnalysis[];
  };
  block4Speaking: {
    mode: 'CONVERSATION' | 'ROLEPLAY' | 'PRONUNCIATION' | 'SHADOWING' | 'DICTATION';
    promptDe: string;
    targetPhonemes?: string[];
  };
  block5Immersion: {
    passageTitle: string;
    passageDe: string;
    tokens: TokenGrammar[];
    questions: { questionDe: string; options: string[]; answerIndex: number }[];
  };
}
```

---

## Code Layout

```
sprachweg/
├── .agents/                        # Agent metadata, plans, reports (NEVER source code)
├── prisma/
│   ├── schema.prisma               # Prisma schema defining all 15 models
│   └── migrations/                 # SQLite migration history
├── server/                         # Backend Express + TypeScript Service
│   ├── src/
│   │   ├── ai/                     # Gemini client, schemas, pinned system prompts
│   │   ├── cache/                  # SHA-256 SQLite caching middleware & repository
│   │   ├── db/                     # Prisma database client & seed scripts
│   │   ├── linguistics/            # Satzklammer tokenizer, case & aux validators
│   │   ├── fsrs/                   # FSRS 4.5/5 algorithm & queue pacing manager
│   │   ├── dictionary/             # Morphology, decompounder, fuzzy search
│   │   ├── curriculum/             # 52-week syllabus, 5-block session builder, adaptive engine
│   │   ├── grammar/                # 60 grammar topics, paradigm tables, 900+ drills
│   │   ├── voice/                  # 5 voice modes, roleplay scenarios, 3-3-5 debrief engine
│   │   ├── routes/                 # Express REST API routes
│   │   └── server.ts               # Express entrypoint
│   ├── tests/                      # Backend Unit & Integration Tests (Vitest)
│   ├── package.json
│   └── tsconfig.json
├── src/                            # Frontend React + Vite + Tailwind Application
│   ├── assets/
│   ├── components/
│   │   ├── audio/                  # Audio recorder, canvas oscillogram waveform visualizer
│   │   ├── common/                 # Button, Card, Badge, Modal, German Quickbar
│   │   ├── curriculum/             # Weekly map, 5-block session flow, grammar viewer, drill widgets
│   │   ├── dictionary/             # Dictionary search, declension/conjugation tables, decompounder
│   │   ├── miner/                  # Sentence miner UI, Satzklammer visual map, interlinear view
│   │   ├── readers/                # Graded immersion readers, tap-to-inspect token popover
│   │   ├── srs/                    # FSRS flashcard player (6 variants), queue pacing, stats
│   │   ├── voice/                  # 5 voice mode containers, debrief modal
│   │   └── layout/                 # Mobile bottom nav, desktop sidebar, dark/light theme
│   ├── hooks/                      # useActiveInput, useAudioRecorder, useFsrsQueue, useSession
│   ├── pages/                      # Dashboard, Session, Curriculum, Miner, Dictionary, Decks, Voice
│   ├── services/                   # Frontend API client & audio player
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── e2e/                            # Dual Track Opaque-Box E2E Tests (Tiers 1-4)
│   ├── harness/                    # Custom lightweight runner / test fixtures
│   ├── tier1_features/             # Tier 1 Feature Coverage (>=5 per feature)
│   ├── tier2_boundaries/           # Tier 2 Boundary & Edge Cases (>=5 per feature)
│   ├── tier3_pairwise/             # Tier 3 Cross-Feature Interactions
│   ├── tier4_scenarios/            # Tier 4 Real-World Learner Workflows
│   └── tier5_adversarial/          # Tier 5 Adversarial Hardening Tests
├── package.json                    # Root workspace package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```
