import { describe, it, expect } from '../harness/testRunner';
import { AdaptiveCurriculumOracle } from '../harness/referenceOracles';
import { InteractiveDrill } from '../harness/contracts';

describe('Feature 15: Adaptive Grammar Mastery Engine Verification', () => {
  it('should track granular grammar tag accuracies and calculate mastery percentage', () => {
    const mastery1 = AdaptiveCurriculumOracle.calculateMastery(10, 9, 'art_nom_def');
    expect(mastery1.accuracy).toBe(0.9);
    expect(mastery1.needsRemediation).toBe(false);

    const mastery2 = AdaptiveCurriculumOracle.calculateMastery(10, 7, 'adj_decl_mixed_akk');
    expect(mastery2.accuracy).toBe(0.7);
    expect(mastery2.needsRemediation).toBe(true);
  });

  it('should trigger remediation when tag accuracy drops strictly below 80% (<0.80)', () => {
    // 79% -> Remediation
    const m79 = AdaptiveCurriculumOracle.calculateMastery(100, 79, 'tag_prep_dat');
    expect(m79.accuracy).toBe(0.79);
    expect(m79.needsRemediation).toBe(true);

    // Exactly 80% -> Passed (No remediation)
    const m80 = AdaptiveCurriculumOracle.calculateMastery(100, 80, 'tag_prep_dat');
    expect(m80.accuracy).toBe(0.80);
    expect(m80.needsRemediation).toBe(false);
  });

  it('should auto-inject remedial drills targeting weak grammar tags into Block 1 Warmup', () => {
    const masteries = [
      AdaptiveCurriculumOracle.calculateMastery(10, 9, 'perfekt_haben'),
      AdaptiveCurriculumOracle.calculateMastery(10, 6, 'perfekt_sein'), // weak: 60%
    ];

    const availableDrills: InteractiveDrill[] = [
      {
        id: 'd1',
        topicId: 'top_perfekt',
        type: 'FILL_IN',
        promptDe: 'Er ___ nach Berlin gefahren. (sein)',
        promptEn: 'He drove to Berlin.',
        correctAnswer: 'ist',
        explanationDe: 'fahren verwendet das Hilfsverb sein.',
        explanationEn: 'fahren takes sein auxiliary.',
        grammarTag: 'perfekt_sein',
      },
      {
        id: 'd2',
        topicId: 'top_perfekt',
        type: 'FILL_IN',
        promptDe: 'Ich habe ein Buch ___. (kaufen)',
        promptEn: 'I bought a book.',
        correctAnswer: 'gekauft',
        explanationDe: 'kaufen nimmt haben.',
        explanationEn: 'kaufen takes haben.',
        grammarTag: 'perfekt_haben',
      },
    ];

    const injected = AdaptiveCurriculumOracle.filterRemedialDrills(masteries, availableDrills);
    expect(injected).toHaveLength(1);
    expect(injected[0].grammarTag).toBe('perfekt_sein');
    expect(injected[0].correctAnswer).toBe('ist');
  });

  it('should clear remediation flag once tag accuracy recovers to 80% or above', () => {
    let tagHistory = { total: 10, correct: 6 }; // 60% -> Needs remediation
    let m = AdaptiveCurriculumOracle.calculateMastery(tagHistory.total, tagHistory.correct, 'dative_prep');
    expect(m.needsRemediation).toBe(true);

    // Learner completes 5 remedial drills correctly: 11 / 15 = 73.3% -> still remediation
    tagHistory.total += 5;
    tagHistory.correct += 5;
    m = AdaptiveCurriculumOracle.calculateMastery(tagHistory.total, tagHistory.correct, 'dative_prep');
    expect(m.needsRemediation).toBe(true);

    // Learner completes 5 more drills correctly: 16 / 20 = 80.0% -> remediation cleared!
    tagHistory.total += 5;
    tagHistory.correct += 5;
    m = AdaptiveCurriculumOracle.calculateMastery(tagHistory.total, tagHistory.correct, 'dative_prep');
    expect(m.accuracy).toBe(0.8);
    expect(m.needsRemediation).toBe(false);
  });

  it('should prevent syllabus progression when critical core tags remain in remedial status', () => {
    const allMasteries = [
      AdaptiveCurriculumOracle.calculateMastery(20, 19, 'nominativ_art'),
      AdaptiveCurriculumOracle.calculateMastery(20, 14, 'akkusativ_art'), // 70% < 80%
    ];

    const canAdvanceToNextWeek = (mList: typeof allMasteries) => {
      return !mList.some(m => m.needsRemediation);
    };

    expect(canAdvanceToNextWeek(allMasteries)).toBe(false);
  });
}, 'Tier 1');
