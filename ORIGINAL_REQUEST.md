# Original User Request

## Initial Request — 2026-09-02T09:09:27Z

# Teamwork Project Prompt — Sprachweg

Build Sprachweg, a production-quality German learning application that takes an absolute beginner (A0) to solid B1 with reach into B2 across a structured 12-month curriculum, powered by the Google Gemini API with FSRS spaced repetition, sentence mining, an exhaustive dictionary layer, grammar courses, and voice modules.

Working directory: C:\Users\hp\.gemini\antigravity\scratch\sprachweg
Integrity mode: development

---

## Requirements

### R1. Core Architecture, Data Model & Gemini Backend Layer
- **Backend & Storage**: Node.js/Express (or full-stack TypeScript Vite server) with SQLite managed via Prisma ORM. Implement models for users, settings, words, word_forms, sentences, cards, eviews, grammar_topics, grammar_progress, lessons, sessions, speaking_sessions, and errors.
- **Gemini API Integration**: Secure server-side wrapper using @google/genai (or REST) with structured JSON schemas (esponseSchema) and pinned linguistic system instructions.
- **Smart Caching Layer**: Hash-keyed SQLite cache for all AI-generated word entries, sentence analyses, drills, and audio, guaranteeing zero duplicate API calls and offline availability for cached items.
- **Linguistic Verification**: Multi-pass validation for grammar-critical attributes (gender, plural forms, auxiliary verbs haben/sein, case governance).

### R2. Sentence Miner & Word Order Analysis Engine
- **Deep Sentence Teardown**: Word-by-word token analysis resolving lemma, POS, contextual meaning, and exact grammatical role (case, declension trigger, syntax function).
- **Universal Visual Grammar**:
  - Consistent gender color-coding: der (blue), die (red), das (green).
  - Visual word order map highlighting Position 1, Verb Position 2 (V2), Mittelfeld, and Verb-Final (Nebensatz / Klammerstruktur).
- **Side-by-Side Translations**: Literal word-for-word translation alongside natural idiomatic English translation.
- **Drill & Deck Integration**: One-tap addition of any word or whole-sentence cloze card into the FSRS deck, plus generation of 3 CEFR-calibrated variations.

### R3. Comprehensive German Reference Dictionary
- **Nouns**: Declension tables across all 4 cases (Singular/Plural), plural endings, diminutive forms, and compound word decompounding (*Geschwindigkeitsbegrenzung* → *Geschwindigkeit* + *s* + *Begrenzung*).
- **Verbs**: Full conjugations (Präsens, Präteritum, Perfekt, Futur, Konjunktiv I/II, Imperativ), auxiliary selection (haben/sein), regularity, separability, and governed prepositions with case (*warten auf + Akk*).
- **Adjectives**: Comparative, superlative, and full declension tables (strong, weak, mixed).
- **Rich Context & Search Tolerance**: IPA, TTS audio triggers, collocations, idioms (*Redewendungen*), register tags, false-friend alerts, synonym disambiguation, and tolerant fuzzy search (handling umlauts like e/oe/ue and inflected forms).

### R4. FSRS Spaced Repetition System
- **FSRS Engine**: Implementation of the Free Spaced Repetition Scheduler (FSRS) with stability, difficulty, retrievability, and interval calculations (superior to SM-2).
- **Card Formats**:
  - Recognition (DE → EN) & Production (EN → DE).
  - Sentence Cloze (with full source context).
  - Audio → Meaning.
  - Targeted Gender drill & Plural drill.
- **Pacing & Workload Protection**: Configurable daily new card limits (default 20) and daily review ceilings to prevent backlog burnout.

### R5. 52-Week CEFR Curriculum & Interactive Grammar Course
- **Syllabus Progression**: Structured 52-week curriculum spanning A1 (Months 1–2), A2 (Months 3–4), B1 Start (Months 5–7), B1 Solid (Months 8–10), and B1+/B2 (Months 11–12).
- **Daily 5-Block Sessions**: Warm-up review (SRS) → New grammar point → Sentence mining → Speaking task → Listening/reading.
- **Adaptive Engine**: Tracks granular grammar_tag accuracies; automatically re-injects tags below 80% mastery into upcoming sessions before allowing progression.
- **Grammar Lessons (~60 Topics)**: Intuitive mental models, clean reference tables, contextual examples, and 15 interactive drills per topic (fill-in, reorder, transform, error-spotting).

### R6. Voice & Audio Interaction Module
- **Five Voice Modes**:
  - *Free Conversation*: Adaptive German tutor with conversational recasts and session error debriefing.
  - *Scenario Role-Play*: Real-world situations (Bürgeramt, bakery, doctor, flat viewing, job interview) with task completion scoring.
  - *Pronunciation Coach*: Target sentence repetition with phoneme analysis for key phonetic markers (*ü/ö*, *ch*, uvular *r*, auslautverhärtung, vowel length, glottal stop) and visual audio waveform display.
  - *Shadowing & Dictation*: Native-speed audio synchronization and strict spelling/case/umlaut evaluation.
- **Session Debrief**: Highlights 3 successes, 3 prioritized corrections, and 5 mined vocabulary words.

### R7. Graded Immersion, Progress Tracking & Mobile-First UX
- **Interactive Readers**: Graded stories and dialogues with tap-to-inspect lookup on every token.
- **Progress Analytics**: Words known, grammar mastery heatmap, speaking minutes, streak tracker (with freeze protections), and dynamic CEFR level estimation.
- **Placement & Diagnostic Testing**: Comprehensive simulated CEFR placement tests (reading, listening, writing, speaking).
- **Mobile-First UX**: Responsive dark/light UI, persistent German special character quick-bar (ä, ö, ü, ß), thumb-friendly navigation, and under-3-tap path to daily sessions.

---

## Acceptance Criteria

### Architecture, Database & Caching
- [ ] SQLite database is provisioned with Prisma schema modeling all core entities and relations.
- [ ] Backend provides REST/API endpoints for dictionary lookups, sentence analysis, curriculum progression, and FSRS reviews.
- [ ] All Gemini API requests are validated against strict JSON schemas before being served to client.
- [ ] Repeated lookups for words, sentence parses, and drills resolve instantly from the SQLite cache without issuing new API requests.

### Sentence Miner & Dictionary
- [ ] Inputting any German sentence returns word-level lemmas, contextual POS, case/syntax roles, color-coded genders, and visual V2/Nebensatz word order bar.
- [ ] Literal and natural English translations render side-by-side.
- [ ] Dictionary displays full declension/conjugation matrices, compound breakdowns, and disambiguation guides.
- [ ] Search supports un-umlauted input (schoen → schön) and conjugated verb queries.

### FSRS & Spaced Repetition
- [ ] FSRS scheduling logic accurately calculates memory stability, difficulty, and next review due dates based on 1-4 user ratings (Again, Hard, Good, Easy).
- [ ] All 6 card variants render correctly and update review logs.
- [ ] Daily card caps prevent review queues from exceeding user settings.

### Curriculum & Adaptive Grammar
- [ ] 52-week curriculum tracks completion and dynamic CEFR level based on vocabulary, grammar tag scores, and speaking sessions.
- [ ] Daily sessions generate the 5-block flow dynamically.
- [ ] Grammar tag accuracy drops (<80%) trigger automatic remedial drill injections.
- [ ] Interactive grammar drills (reorder, cloze, transform) score user answers with clear feedback.

### Voice, Immersion & UX
- [ ] Audio playback (TTS) and Web Audio recording/waveform components function seamlessly.
- [ ] Conversation, role-play, pronunciation, shadowing, and dictation modes generate debrief summaries with mined vocabulary.
- [ ] German character toolbar (ä, ö, ü, ß) allows 1-tap character insertion into all input fields.
- [ ] Tap-to-lookup is available on all German tokens in readers, lessons, and miner views.

---

## Verification Plan

### Automated Test Suites
- **Unit Tests**:
  - FSRS algorithm test suite validating stability and interval transitions against standard test vectors.
  - Dictionary caching and query normalization test suite (umlauts, inflections, case sensitivity).
  - Sentence analysis parser and schema validator unit tests with mock Gemini payloads.
  - Adaptive curriculum engine test suite verifying remedial tag injection on low scores (<80%).
- **Integration & API Tests**:
  - Backend API endpoint tests validating CRUD operations for words, decks, cards, grammar progress, and sessions.
  - Gemini proxy middleware tests validating schema adherence and error retry handling.
- **Frontend Component & E2E Tests**:
  - Vitest / Testing Library tests for German character quick-bar, gender color badges, and interactive drill widgets.
  - End-to-end user journey test: login/guest session → start daily session → sentence mining → add to deck → FSRS review session.