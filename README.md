# Sprachweg 🇩🇪

**Sprachweg** is a production-quality German language learning application designed to guide an absolute beginner (A0) to solid B1 with reach into B2 within 12 months (45–75 min/day). Powered by **Google Gemini API**, **Prisma + SQLite**, and an advanced **FSRS (Free Spaced Repetition Scheduler)** engine.

---

## Key Features

### 1. 52-Week Curriculum Engine
- Structured syllabus covering A1, A2, B1 Start, B1 Solid, and B1+/B2.
- 5-block daily sessions: Warm-up (SRS) → New grammar → Sentence mining → Speaking task → Reading/listening.
- Adaptive engine: Tracks `grammar_tag` accuracy and auto-injects remedial drills for tags <80% mastery.

### 2. Deep Sentence Miner & Word Order Visualizer
- Word-by-word token teardown resolving lemma, POS, case, declension triggers, and contextual meaning.
- Visual Satzklammer word order map: Position 1 (Vorfeld), Verb Position 2 (V2), Mittelfeld (TeKaMoLo), and Verb-Final (Rechte Satzklammer / Nebensatz).
- Side-by-side literal gloss and natural English translations.
- Universal gender color-coding: `der` (blue), `die` (red), `das` (green), `die Plural` (purple).
- 1-tap addition of any word or sentence cloze to your FSRS review deck.

### 3. German Reference Dictionary
- Declension matrices for nouns (all 4 cases, singular and plural).
- Full verb conjugations across Präsens, Präteritum, Perfekt, Futur, Konjunktiv I & II, Imperativ with auxiliary (`haben`/`sein`) and governed prepositions.
- Morphological compound decompounder (*Geschwindigkeitsbegrenzung* → *Geschwindigkeit* + *s* + *Begrenzung*).
- Diacritic-tolerant search (supports `ae`, `oe`, `ue`, `ss` as well as conjugated forms).

### 4. Spaced Repetition (FSRS Engine)
- Mathematical Free Spaced Repetition Scheduler calculating memory stability, difficulty, and retrievability across 4 ratings (Again, Hard, Good, Easy).
- 6 card variants: Recognition, Production, Cloze-in-Sentence, Audio→Meaning, Gender drill, and Plural drill.
- Daily pacing limits (20 new cards/day, 100 reviews/day) to prevent review fatigue.

### 5. Voice Studio (5 Modes)
- **Free Conversation**: Interactive tutor with recasts and error debriefs.
- **Scenario Roleplay**: Real-world simulations (Bürgeramt, bakery, doctor, flat viewing, job interview).
- **Pronunciation Coach**: Phoneme-level scoring on German phonetic markers (*ü/ö*, *ch*, uvular *r*, auslautverhärtung, glottal stops) with real-time waveform visualizer.
- **Shadowing & Dictation**: Timing synchronization and strict capitalization/umlaut feedback.
- Post-session 3-3-5 debrief: 3 successes, 3 corrections, 5 mined vocabulary words.

### 6. Immersion, Readers & Mobile-First UX
- Graded readers and dialogues with tap-to-inspect token popovers.
- Universal German character quick-bar (`ä`, `ö`, `ü`, `ß`, `Ä`, `Ö`, `Ü`) with caret preservation.
- Live CEFR progress estimation and simulated placement exams.
- Mobile-first responsive layout with dark/light mode and PWA offline capability.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide icons, Canvas Web Audio visualizer.
- **Backend**: Node.js, Express, TypeScript, Zod schema validation.
- **Database**: SQLite via Prisma ORM (2.8+ MB seeded dictionary, grammar topics, FSRS cards).
- **AI Integration**: Server-side Google Gemini client with structured JSON output and SHA-256 caching.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
The server includes a pre-configured `.env` in `server/.env`:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
MOCK_GEMINI=true       # Set to false and provide GEMINI_API_KEY for live API
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start Development Servers
To start both backend (http://localhost:4000) and frontend (http://localhost:5173) together:
```bash
npm run dev
```
Or run them individually:
```bash
npm run server:dev   # Express API server on :4000
npm run client:dev   # Vite frontend on :5173
```

### 4. Running the Test Suite
The project features 287 automated tests (67 server unit/adversarial tests and 220 multi-tier E2E tests):
```bash
npm test
```
Or individually:
```bash
npm run test:server   # Vitest unit & adversarial tests
npm run test:e2e      # Multi-tier curriculum and scenario tests
```

---

## Architecture Overview

```
sprachweg/
├── client/              # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/  # QuickBar, Satzklammer map, DictionaryModal, Waveform
│   │   ├── views/       # 7 core views (Session, Miner, Dictionary, FSRS, Voice, Grammar, Immersion)
│   │   ├── services/    # API client, Web Audio service, offline seed data
│   │   └── types/       # Shared TypeScript models
├── server/              # Express + TypeScript backend
│   ├── src/
│   │   ├── ai/          # Gemini structured client with SHA-256 SQLite cache
│   │   ├── db/          # Prisma client and seed script
│   │   ├── fsrs/        # FSRS scheduling math & queue manager
│   │   ├── linguistics/ # Satzklammer, declensions, prepositions, auxiliary rules
│   │   ├── miner/       # Tokenizer, interlinear gloss, cloze & variation generator
│   │   └── routes/      # REST API endpoints
├── prisma/              # Prisma schema & SQLite database (dev.db)
├── e2e/                 # 220 multi-tier E2E test suites
└── scripts/             # Dev runners
```
