/**
 * Sprachweg Dual-Track E2E Test Suite Master Runner
 * Executes all tests across Tier 1, Tier 2, Tier 3, and Tier 4.
 */

import { runAllSuites } from './testRunner';

// ============================================================================
// Tier 1: Feature Coverage (All 29 Inventoried Features)
// ============================================================================
import '../tier1_features/f01_database_prisma.test';
import '../tier1_features/f02_gemini_ai_wrapper.test';
import '../tier1_features/f03_sqlite_cache.test';
import '../tier1_features/f04_rest_api_server.test';
import '../tier1_features/f05_linguistic_validator.test';
import '../tier1_features/f06_fsrs_spaced_repetition.test';
import '../tier1_features/f07_fsrs_card_variants.test';
import '../tier1_features/f08_fsrs_pacing_backlog.test';
import '../tier1_features/f09_sentence_miner_parser.test';
import '../tier1_features/f10_reference_dictionary.test';
import '../tier1_features/f11_compound_decompounder.test';
import '../tier1_features/f12_fuzzy_dictionary_search.test';
import '../tier1_features/f13_cefr_curriculum_engine.test';
import '../tier1_features/f14_daily_5block_session.test';
import '../tier1_features/f15_adaptive_grammar_mastery.test';
import '../tier1_features/f16_grammar_courses_drills.test';
import '../tier1_features/f17_voice_studio_modes.test';
import '../tier1_features/f18_session_debrief_generator.test';
import '../tier1_features/f19_web_audio_waveform.test';
import '../tier1_features/f20_frontend_ui_architecture.test';
import '../tier1_features/f21_german_character_quickbar.test';
import '../tier1_features/f22_visual_satzklammer_map.test';
import '../tier1_features/f23_gender_color_badges.test';
import '../tier1_features/f24_interlinear_translation.test';
import '../tier1_features/f25_immersion_readers.test';
import '../tier1_features/f26_analytics_cefr_dashboard.test';
import '../tier1_features/f27_cefr_placement_tests.test';
import '../tier1_features/f28_e2e_testing_harness.test';
import '../tier1_features/f29_adversarial_hardening.test';

// ============================================================================
// Tier 2: Boundary & Corner Cases
// ============================================================================
import '../tier2_boundaries/b01_linguistic_boundaries.test';
import '../tier2_boundaries/b02_fsrs_boundary_ratings.test';
import '../tier2_boundaries/b03_decompounder_edge_cases.test';
import '../tier2_boundaries/b04_adaptive_tag_thresholds.test';
import '../tier2_boundaries/b05_quickbar_caret_boundaries.test';
import '../tier2_boundaries/b06_satzklammer_complex_clauses.test';

// ============================================================================
// Tier 3: Cross-Feature Interactions & Pairwise Pipelines
// ============================================================================
import '../tier3_pairwise/p01_reader_miner_fsrs_pipeline.test';
import '../tier3_pairwise/p02_daily_session_5block_flow.test';
import '../tier3_pairwise/p03_voice_roleplay_debrief_mining.test';
import '../tier3_pairwise/p04_dictionary_decompound_fsrs.test';
import '../tier3_pairwise/p05_adaptive_remediation_placement.test';

// ============================================================================
// Tier 4: Real-World Learner Workflows & Scenarios
// ============================================================================
import '../tier4_scenarios/s01_a0_beginner_day1_flow.test';
import '../tier4_scenarios/s02_a2_past_narrative_dictation.test';
import '../tier4_scenarios/s03_b1_buergeramt_roleplay_debrief.test';
import '../tier4_scenarios/s04_goethe_b1_placement_simulation.test';

async function main() {
  const result = await runAllSuites();
  process.exit(result.exitCode);
}

main().catch(err => {
  console.error('Fatal execution error in test runner:', err);
  process.exit(1);
});
