## 2026-09-02T09:11:09Z

You are Explorer 1 for the Sprachweg survey phase.
Your working directory is: C:\Users\hp\.gemini\antigravity\scratch\sprachweg\.agents\explorer_survey_1
Authoritative Requirements: Read C:\Users\hp\.gemini\antigravity\scratch\sprachweg\ORIGINAL_REQUEST.md

Your mission:
Investigate and design the technical specifications for:
1. Core Backend & Database Architecture:
   - Node.js/Express + TypeScript with Prisma ORM and SQLite.
   - Complete Prisma schema covering all required entities: users, settings, words, word_forms, sentences, cards, reviews, grammar_topics, grammar_progress, lessons, sessions, speaking_sessions, errors, cache_entries.
   - REST API endpoints for dictionary, sentence mining, curriculum progression, sessions, cards, and reviews.
2. Gemini API Integration & Linguistic Verification:
   - Server-side wrapper using @google/genai or REST with structured JSON schemas (responseSchema).
   - Smart SQLite SHA-256 hash-keyed caching for all AI responses (zero duplicate calls, offline readiness).
   - Multi-pass linguistic validation pipeline for German grammatical correctness (gender, plural, auxiliary haben/sein, case governance).
3. FSRS (Free Spaced Repetition Scheduler) Engine:
   - Exact mathematical formulation for stability (S), difficulty (D), retrievability (R), and interval calculations across 4 ratings (1: Again, 2: Hard, 3: Good, 4: Easy).
   - Support for 6 card variants: Recognition (DE->EN), Production (EN->DE), Sentence Cloze, Audio->Meaning, Targeted Gender drill, Plural drill.
   - Daily new card limits (default 20) and daily review caps with backlog protection.

Write your findings and technical blueprint to C:\Users\hp\.gemini\antigravity\scratch\sprachweg\.agents\explorer_survey_1\handoff.md.
When finished, send a message to parent notifying completion.
