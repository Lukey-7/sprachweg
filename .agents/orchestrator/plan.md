# Master Plan — Sprachweg

## Overview
Sprachweg is a production-grade German learning platform taking learners from A0 to B1/B2 across a 52-week curriculum with Gemini AI, FSRS spaced repetition, sentence mining, comprehensive dictionary, interactive grammar, voice modules, and graded readers.

## Architectural Tracks
1. **Implementation Track**:
   - Milestone 0: Survey & Project Blueprint (`PROJECT.md`)
   - Milestone 1: Core Architecture, SQLite Prisma ORM, Gemini API wrapper with Structured JSON Schemas & SQLite Response Cache
   - Milestone 2: Linguistic Engine, Sentence Miner (Word Order Map, V2/Nebensatz/Klammerstruktur, visual genders), Side-by-Side Translations & FSRS Spaced Repetition Engine (6 card types)
   - Milestone 3: German Reference Dictionary (Declensions, Conjugations, Compound Decompounding, tolerant fuzzy search)
   - Milestone 4: 52-Week CEFR Curriculum Engine, 60 Grammar Courses, 900+ Interactive Drills & Adaptive Mastery Tracking (<80% tag remediation)
   - Milestone 5: Voice Modules (5 Modes: Free Conversation, Scenario Role-Play, Pronunciation Coach, Shadowing & Dictation) + Audio Waveforms & Debriefing Engine
   - Milestone 6: Full Frontend Application (React, Vite, Tailwind CSS, Lucide Icons), Graded Immersion Readers, German Character Quickbar (ä, ö, ü, ß), Placement & Diagnostic Tests, Mobile-First UX
   - Milestone 7: Final System Integration, 100% Passing E2E Test Suite, and Tier 5 Adversarial Coverage Hardening

2. **E2E Testing Track**:
   - Test Infrastructure & Harness (`TEST_INFRA.md`)
   - Tier 1: Feature Coverage (≥5 tests per feature)
   - Tier 2: Boundary & Corner Cases (≥5 tests per feature)
   - Tier 3: Cross-Feature Interactions & Pairwise Combinations
   - Tier 4: Real-World Learner Workflows & Application Scenarios
   - Verification & Handshake (`TEST_READY.md`)

3. **Victory Verification & Sentinel Hand-off**:
   - Multi-tier automated test suite execution (100% pass)
   - Forensic Integrity Audit (clean verdict)
   - Victory Report & Handoff to Sentinel
