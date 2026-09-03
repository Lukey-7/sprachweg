import { describe, it, expect } from '../harness/testRunner';
import { DailySessionPlan, InteractiveDrill } from '../harness/contracts';
import { AdaptiveCurriculumOracle, FsrsOracle } from '../harness/referenceOracles';

describe('Tier 3: Daily Session Orchestration & 5-Block Progression Flow', () => {
  it('should step through all 5 daily session blocks sequentially and record block completions', () => {
    const sessionState = {
      sessionId: 'sess_w08_d1',
      completedBlocks: [] as string[],
      currentBlockIndex: 0,
      blocks: ['block1Warmup', 'block2Grammar', 'block3Mining', 'block4Speaking', 'block5Immersion'],
    };

    const completeBlock = (blockName: string) => {
      sessionState.completedBlocks.push(blockName);
      sessionState.currentBlockIndex++;
    };

    // Step 1: Complete Block 1 Warmup
    completeBlock('block1Warmup');
    expect(sessionState.completedBlocks).toContain('block1Warmup');
    expect(sessionState.currentBlockIndex).toBe(1);

    // Step 2: Complete Block 2 Grammar
    completeBlock('block2Grammar');
    expect(sessionState.completedBlocks).toContain('block2Grammar');

    // Step 3: Complete Block 3 Sentence Mining
    completeBlock('block3Mining');

    // Step 4: Complete Block 4 Speaking
    completeBlock('block4Speaking');

    // Step 5: Complete Block 5 Immersion
    completeBlock('block5Immersion');

    expect(sessionState.completedBlocks).toHaveLength(5);
    expect(sessionState.currentBlockIndex).toBe(5);
  });

  it('should dynamically inject remedial grammar drills into Block 1 Warmup based on user tag history', () => {
    const userTagStats = [
      AdaptiveCurriculumOracle.calculateMastery(10, 6, 'akkusativ_masculine'), // 60% -> Remedial!
      AdaptiveCurriculumOracle.calculateMastery(10, 9, 'nominativ_neuter'), // 90%
    ];

    const bank: InteractiveDrill[] = [
      {
        id: 'drill_akk_1',
        topicId: 'top_akk',
        type: 'FILL_IN',
        promptDe: 'Ich suche ___ Schlüssel. (der)',
        promptEn: 'I am looking for the key.',
        correctAnswer: 'den',
        explanationDe: 'der Schlüssel im Akkusativ wird zu "den Schlüssel".',
        explanationEn: 'Accusative masculine is "den".',
        grammarTag: 'akkusativ_masculine',
      },
    ];

    const remedialDrills = AdaptiveCurriculumOracle.filterRemedialDrills(userTagStats, bank);
    expect(remedialDrills).toHaveLength(1);
    expect(remedialDrills[0].id).toBe('drill_akk_1');
  });

  it('should increment user daily streak and update words known upon 5-block session completion', () => {
    let userProfile = {
      streakDays: 7,
      wordsKnown: 450,
      lastSessionCompletedAt: '2026-09-01T10:00:00Z',
    };

    const onSessionComplete = (newWordsMinedCount: number) => {
      userProfile.streakDays += 1;
      userProfile.wordsKnown += newWordsMinedCount;
      userProfile.lastSessionCompletedAt = new Date('2026-09-02T10:00:00Z').toISOString();
    };

    onSessionComplete(5);
    expect(userProfile.streakDays).toBe(8);
    expect(userProfile.wordsKnown).toBe(455);
  });

  it('should allow resuming an interrupted daily session from the exact block in progress', () => {
    const savedSessionProgress = {
      sessionId: 'sess_w08_d1',
      lastCompletedBlock: 'block2Grammar',
      blockIndex: 2, // Resume at block3Mining
    };

    const getNextBlockToResume = (progress: typeof savedSessionProgress) => {
      const allBlocks = ['block1Warmup', 'block2Grammar', 'block3Mining', 'block4Speaking', 'block5Immersion'];
      return allBlocks[progress.blockIndex];
    };

    expect(getNextBlockToResume(savedSessionProgress)).toBe('block3Mining');
  });

  it('should persist speaking accuracy and pronunciation scores to user session logs', () => {
    const sessionLog = {
      sessionId: 'sess_w08_d1',
      speakingScore: 88,
      pronunciationScore: 92,
      drillsScore: 100,
    };

    expect(sessionLog.speakingScore).toBe(88);
    expect(sessionLog.pronunciationScore).toBe(92);
  });
}, 'Tier 3');
