import { describe, it, expect } from '../harness/testRunner';
import { AdaptiveCurriculumOracle } from '../harness/referenceOracles';

describe('Tier 2: Adaptive Tag Threshold & Precision Boundary Tests', () => {
  it('should test exact boundary conditions: 79.99% (Remediation) vs 80.00% (Passed)', () => {
    // 7999 / 10000 = 0.7999 -> < 0.80 -> Remediation required
    const m7999 = AdaptiveCurriculumOracle.calculateMastery(10000, 7999, 'tag_boundary');
    expect(m7999.accuracy).toBe(0.7999);
    expect(m7999.needsRemediation).toBe(true);

    // 8000 / 10000 = 0.8000 -> >= 0.80 -> Passed
    const m8000 = AdaptiveCurriculumOracle.calculateMastery(10000, 8000, 'tag_boundary');
    expect(m8000.accuracy).toBe(0.8);
    expect(m8000.needsRemediation).toBe(false);

    // 8001 / 10000 = 0.8001 -> >= 0.80 -> Passed
    const m8001 = AdaptiveCurriculumOracle.calculateMastery(10000, 8001, 'tag_boundary');
    expect(m8001.accuracy).toBe(0.8001);
    expect(m8001.needsRemediation).toBe(false);
  });

  it('should handle zero attempts (0 / 0) division-by-zero boundary safely', () => {
    const m0 = AdaptiveCurriculumOracle.calculateMastery(0, 0, 'new_unseen_tag');
    expect(m0.accuracy).toBe(1.0); // Default neutral/pass to avoid false alarm before first exposure
    expect(m0.needsRemediation).toBe(false);
  });

  it('should test small sample fractions (1/1=100%, 3/4=75%, 4/5=80%, 7/10=70%)', () => {
    expect(AdaptiveCurriculumOracle.calculateMastery(1, 1, 't').needsRemediation).toBe(false);
    expect(AdaptiveCurriculumOracle.calculateMastery(4, 3, 't').needsRemediation).toBe(true); // 75%
    expect(AdaptiveCurriculumOracle.calculateMastery(5, 4, 't').needsRemediation).toBe(false); // 80%
    expect(AdaptiveCurriculumOracle.calculateMastery(10, 7, 't').needsRemediation).toBe(true); // 70%
  });

  it('should calculate minimum consecutive correct drills required to clear remediation', () => {
    const minDrillsToClear = (total: number, correct: number): number => {
      // (correct + x) / (total + x) >= 0.80
      // correct + x >= 0.80 * total + 0.80 * x
      // 0.20 * x >= 0.80 * total - correct
      // x >= (0.80 * total - correct) / 0.20
      const needed = (0.8 * total - correct) / 0.2;
      return Math.max(0, Math.ceil(needed));
    };

    // 10 attempts, 5 correct (50%): needs (8 - 5) / 0.2 = 15 consecutive correct
    expect(minDrillsToClear(10, 5)).toBe(15);
    // Verify: (5 + 15) / (10 + 15) = 20 / 25 = 80.0%
    expect((5 + 15) / (10 + 15)).toBe(0.8);

    // 10 attempts, 7 correct (70%): needs (8 - 7) / 0.2 = 5 consecutive correct
    expect(minDrillsToClear(10, 7)).toBe(5);
    // Verify: (7 + 5) / (10 + 5) = 12 / 15 = 80.0%
    expect((7 + 5) / (10 + 5)).toBe(0.8);
  });

  it('should handle floating point representation anomalies without false triggering', () => {
    // 0.1 + 0.2 in JS is 0.30000000000000004
    // 4 / 5 in JS is 0.8
    const val = 4 / 5;
    expect(val >= 0.8).toBe(true);
  });
}, 'Tier 2');
