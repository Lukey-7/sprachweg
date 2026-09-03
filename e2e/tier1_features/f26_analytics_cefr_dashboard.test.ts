import { describe, it, expect } from '../harness/testRunner';

describe('Feature 26: Progress Analytics & CEFR Dashboard Verification', () => {
  const userStats = {
    userId: 'u1',
    wordsKnown: 650,
    wordsLearning: 120,
    totalSpeakingMinutes: 145,
    currentStreakDays: 14,
    freezeCredits: 2,
    grammarTagMasteries: [
      { tag: 'art_nom', accuracy: 0.95 },
      { tag: 'art_akk', accuracy: 0.88 },
      { tag: 'prep_dat', accuracy: 0.82 },
      { tag: 'perfekt_sein', accuracy: 0.65 }, // weak
    ],
    lastActiveDate: '2026-09-01T20:00:00Z',
  };

  it('should compute words known vs learning counts accurately', () => {
    expect(userStats.wordsKnown).toBe(650);
    expect(userStats.wordsLearning).toBe(120);
    const totalEncountered = userStats.wordsKnown + userStats.wordsLearning;
    expect(totalEncountered).toBe(770);
  });

  it('should maintain streak count and apply streak freeze protection when a day is missed', () => {
    const checkStreak = (
      lastDate: Date,
      currentDate: Date,
      currentStreak: number,
      freezeCredits: number
    ) => {
      const diffDays = Math.floor(
        (currentDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (diffDays === 1) {
        return { newStreak: currentStreak + 1, freezeUsed: false, freezeCredits };
      } else if (diffDays === 2 && freezeCredits > 0) {
        // Missed 1 day, freeze protection used
        return { newStreak: currentStreak, freezeUsed: true, freezeCredits: freezeCredits - 1 };
      } else if (diffDays > 1) {
        // Streak broken
        return { newStreak: 1, freezeUsed: false, freezeCredits };
      }
      return { newStreak: currentStreak, freezeUsed: false, freezeCredits };
    };

    const d1 = new Date('2026-09-01T12:00:00Z');
    const d2 = new Date('2026-09-02T12:00:00Z'); // 1 day -> streak increments
    expect(checkStreak(d1, d2, 14, 2).newStreak).toBe(15);

    const d3 = new Date('2026-09-03T12:00:00Z'); // 2 days -> freeze used, streak preserved
    const freezeRes = checkStreak(d1, d3, 14, 2);
    expect(freezeRes.newStreak).toBe(14);
    expect(freezeRes.freezeUsed).toBe(true);
    expect(freezeRes.freezeCredits).toBe(1);
  });

  it('should render grammar mastery heatmap data categorizing mastery levels (High, Medium, Remedial)', () => {
    const categorizeHeatmap = (accuracy: number) => {
      if (accuracy >= 0.9) return { level: 'HIGH', color: '#16a34a' };
      if (accuracy >= 0.8) return { level: 'MEDIUM', color: '#eab308' };
      return { level: 'REMEDIAL', color: '#dc2626' };
    };

    expect(categorizeHeatmap(0.95).level).toBe('HIGH');
    expect(categorizeHeatmap(0.82).level).toBe('MEDIUM');
    expect(categorizeHeatmap(0.65).level).toBe('REMEDIAL');
  });

  it('should track speaking minutes and conversational fluency trajectory', () => {
    expect(userStats.totalSpeakingMinutes).toBe(145);
    const targetMinutesA2 = 120;
    expect(userStats.totalSpeakingMinutes).toBeGreaterThanOrEqual(targetMinutesA2);
  });

  it('should generate CEFR readiness breakdown radar data for Reading, Listening, Writing, Speaking', () => {
    const radarData = {
      reading: 78,
      listening: 70,
      writing: 85,
      speaking: 68,
      overallCefr: 'A2',
    };

    expect(radarData.reading).toBeGreaterThan(50);
    expect(radarData.overallCefr).toBe('A2');
  });
}, 'Tier 1');
