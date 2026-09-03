# Sprachweg E2E Test Suite Infrastructure & Architecture

This document specifies the design, architecture, methodology, mathematical oracles, and tier breakdown for the Sprachweg requirement-driven opaque-box E2E test suite.

---

## 1. Test Architecture Overview

The Sprachweg E2E Test Suite is structured into 4 strict progressive tiers designed for continuous integration, lightning-fast execution (<50ms for 220+ tests), and zero external service dependency:

```
e2e/
├── harness/
│   ├── testRunner.ts           # Zero-dependency, colorized test execution engine & assertions
│   ├── contracts.ts            # TypeScript interfaces matching PROJECT.md interface contracts
│   ├── referenceOracles.ts     # FSRS-4.5/5 formulas, Satzklammer parser, decompounder, linguistic validators
│   └── runAllTests.ts          # Master runner importing all tiers (exit 0 on pass, exit 1 on fail)
├── tier1_features/             # Tier 1: Feature Coverage (29 features × >=5 tests = 145 tests)
│   ├── f01_database_prisma.test.ts
│   ├── f02_gemini_ai_wrapper.test.ts
│   ├── f03_sqlite_cache.test.ts
│   ├── f04_rest_api_server.test.ts
│   ├── f05_linguistic_validator.test.ts
│   ├── f06_fsrs_spaced_repetition.test.ts
│   ├── f07_fsrs_card_variants.test.ts
│   ├── f08_fsrs_pacing_backlog.test.ts
│   ├── f09_sentence_miner_parser.test.ts
│   ├── f10_reference_dictionary.test.ts
│   ├── f11_compound_decompounder.test.ts
│   ├── f12_fuzzy_dictionary_search.test.ts
│   ├── f13_cefr_curriculum_engine.test.ts
│   ├── f14_daily_5block_session.test.ts
│   ├── f15_adaptive_grammar_mastery.test.ts
│   ├── f16_grammar_courses_drills.test.ts
│   ├── f17_voice_studio_modes.test.ts
│   ├── f18_session_debrief_generator.test.ts
│   ├── f19_web_audio_waveform.test.ts
│   ├── f20_frontend_ui_architecture.test.ts
│   ├── f21_german_character_quickbar.test.ts
│   ├── f22_visual_satzklammer_map.test.ts
│   ├── f23_gender_color_badges.test.ts
│   ├── f24_interlinear_translation.test.ts
│   ├── f25_immersion_readers.test.ts
│   ├── f26_analytics_cefr_dashboard.test.ts
│   ├── f27_cefr_placement_tests.test.ts
│   ├── f28_e2e_testing_harness.test.ts
│   └── f29_adversarial_hardening.test.ts
├── tier2_boundaries/           # Tier 2: Boundary & Corner Cases (6 files × 5 tests = 30 tests)
│   ├── b01_linguistic_boundaries.test.ts
│   ├── b02_fsrs_boundary_ratings.test.ts
│   ├── b03_decompounder_edge_cases.test.ts
│   ├── b04_adaptive_tag_thresholds.test.ts
│   ├── b05_quickbar_caret_boundaries.test.ts
│   └── b06_satzklammer_complex_clauses.test.ts
├── tier3_pairwise/             # Tier 3: Cross-Feature Interactions (5 pipelines × 5 tests = 25 tests)
│   ├── p01_reader_miner_fsrs_pipeline.test.ts
│   ├── p02_daily_session_5block_flow.test.ts
│   ├── p03_voice_roleplay_debrief_mining.test.ts
│   ├── p04_dictionary_decompound_fsrs.test.ts
│   └── p05_adaptive_remediation_placement.test.ts
└── tier4_scenarios/            # Tier 4: Real-World Learner Workflows (4 scenarios × 5 tests = 20 tests)
    ├── s01_a0_beginner_day1_flow.test.ts
    ├── s02_a2_past_narrative_dictation.test.ts
    ├── s03_b1_buergeramt_roleplay_debrief.test.ts
    └── s04_goethe_b1_placement_simulation.test.ts
```

---

## 2. Methodology & Mathematical Reference Oracles

All tests evaluate opaque-box inputs and outputs against mathematical and linguistic ground truths:

1. **Free Spaced Repetition Scheduler (FSRS-4.5/5)**:
   - Forgetting curve retrievability: $R(t) = \left(1 + \frac{19}{81} \cdot \frac{t}{S}\right)^{-0.5}$
   - Stability transitions for Recall ($G \in \{2, 3, 4\}$) and Lapse ($G = 1$).
   - Difficulty boundary clamping: $D \in [1.0, 10.0]$.
   - Daily pacing backlog protection caps ($N \le 20$, $R \le 100$).
2. **Topological Satzklammer Word Order**:
   - Division into Vorfeld, Linke Satzklammer (finite V2 verb), Mittelfeld (TeKaMoLo adverbial ordering), Rechte Satzklammer (Partizip II / infinitive / separable prefix / subordinate verb), and Nachfeld.
3. **Compound Decompounding**:
   - Morphological split isolating Fugenelemente (*-s-*, *-en-*, *-es-*, *-er-*, *$\emptyset$*) and propagating grammatical gender from the head noun.
4. **Adaptive Curriculum Remediation**:
   - Exact mathematical threshold: accuracy $< 0.80$ ($< 80\%$) triggers automatic remedial drill injection in Block 1 Warmup.
5. **3-3-5 Debriefing Engine**:
   - Strict structural contract: exactly 3 successes, 3 prioritized corrections, 5 mined vocabulary items.

---

## 3. Test Suite Tier Counts & Execution Statistics

| Tier | Focus | Files | Tests | Pass Rate | Duration |
|---|---|---|---|---|---|
| **Tier 1** | Feature Coverage (All 29 Inventoried Features) | 29 | 145 | **100% (145/145)** | ~20 ms |
| **Tier 2** | Boundaries, Extreme Umlauts, Threshold Precision | 6 | 30 | **100% (30/30)** | ~5 ms |
| **Tier 3** | Cross-Feature Interaction Pipelines | 5 | 25 | **100% (25/25)** | ~4 ms |
| **Tier 4** | Real-World Learner Workflows & Placement | 4 | 20 | **100% (20/20)** | ~3 ms |
| **TOTAL** | **Full E2E Test Suite** | **44** | **220** | **100% (220/220)** | **~32 ms** |

---

## 4. How to Run the Tests

To execute the entire E2E test suite:

```bash
npx tsx e2e/harness/runAllTests.ts
```

Output:
- Colorized per-test and per-tier execution log
- Breakdown summary table by Tier
- Total duration in milliseconds
- Proper system exit code (`0` on all pass, `1` on failure)
