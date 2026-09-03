import { describe, it, expect } from '../harness/testRunner';
import { FsrsOracle } from '../harness/referenceOracles';
import { FsrsCardData } from '../harness/contracts';

describe('Feature 6: FSRS Spaced Repetition Engine Mathematical Verification', () => {
  const createNewCard = (id: string = 'card_1'): FsrsCardData => ({
    id,
    userId: 'u1',
    cardType: 'RECOGNITION',
    front: 'der Hund',
    back: 'the dog',
    state: 'NEW',
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    dueAt: '2026-09-02T12:00:00Z',
  });

  it('should initialize stability and difficulty accurately based on rating (Again=1, Hard=2, Good=3, Easy=4)', () => {
    const card = createNewCard();

    const resAgain = FsrsOracle.scheduleCard(card, 1);
    expect(resAgain.card.stability).toBeCloseTo(0.4, 2);
    expect(resAgain.card.state).toBe('LEARNING');

    const resGood = FsrsOracle.scheduleCard(card, 3);
    expect(resGood.card.stability).toBeCloseTo(2.4, 2);
    expect(resGood.card.state).toBe('REVIEW');
    expect(resGood.card.scheduledDays).toBeGreaterThan(0);

    const resEasy = FsrsOracle.scheduleCard(card, 4);
    expect(resEasy.card.stability).toBeCloseTo(5.8, 2);
    expect(resEasy.card.scheduledDays).toBeGreaterThan(resGood.card.scheduledDays);
  });

  it('should calculate retrievability R(t) following the power-law forgetting curve', () => {
    const stability = 10.0; // 10 days
    // At t = 0, R = 1.0
    expect(FsrsOracle.calculateRetrievability(stability, 0)).toBeCloseTo(1.0, 3);
    // At t = 10 days, R ~ 0.90
    const rAt10 = FsrsOracle.calculateRetrievability(stability, 10);
    expect(rAt10).toBeCloseTo(0.9, 2);
    // As t increases, R decreases monotonically
    const rAt30 = FsrsOracle.calculateRetrievability(stability, 30);
    expect(rAt30).toBeLessThan(rAt10);
    expect(rAt30).toBeGreaterThan(0);
  });

  it('should clamp difficulty strictly within bounds [1.0, 10.0]', () => {
    let card = createNewCard();
    let sched = FsrsOracle.scheduleCard(card, 1); // Again increases difficulty

    // Repeated rating 1 (Again)
    for (let i = 0; i < 20; i++) {
      card = { ...sched.card, elapsedDays: 1 };
      sched = FsrsOracle.scheduleCard(card, 1);
      expect(sched.card.difficulty).toBeLessThanOrEqual(10.0);
      expect(sched.card.difficulty).toBeGreaterThanOrEqual(1.0);
    }
    expect(sched.card.difficulty).toBe(10.0);

    // Repeated rating 4 (Easy) decreases difficulty towards 1.0
    for (let i = 0; i < 30; i++) {
      card = { ...sched.card, elapsedDays: 10 };
      sched = FsrsOracle.scheduleCard(card, 4);
      expect(sched.card.difficulty).toBeGreaterThanOrEqual(1.0);
      expect(sched.card.difficulty).toBeLessThanOrEqual(10.0);
    }
    expect(sched.card.difficulty).toBe(1.0);
  });

  it('should transition card state from REVIEW to RELEARNING on lapse (Again) and record lapses count', () => {
    let card = createNewCard();
    // First review: Good -> REVIEW state
    let res = FsrsOracle.scheduleCard(card, 3);
    expect(res.card.state).toBe('REVIEW');
    expect(res.card.reps).toBe(1);
    expect(res.card.lapses).toBe(0);

    // Subsequent review after 5 days: Again (lapse)
    card = { ...res.card, elapsedDays: 5 };
    const lapseRes = FsrsOracle.scheduleCard(card, 1);
    expect(lapseRes.card.state).toBe('RELEARNING');
    expect(lapseRes.card.reps).toBe(2);
    expect(lapseRes.card.lapses).toBe(1);
    expect(lapseRes.card.scheduledDays).toBe(0); // Due immediately
  });

  it('should compute growing intervals on consecutive successful reviews (Good / Easy)', () => {
    let card = createNewCard();
    let res = FsrsOracle.scheduleCard(card, 3);
    const interval1 = res.card.scheduledDays;

    card = { ...res.card, elapsedDays: interval1 };
    res = FsrsOracle.scheduleCard(card, 3);
    const interval2 = res.card.scheduledDays;

    card = { ...res.card, elapsedDays: interval2 };
    res = FsrsOracle.scheduleCard(card, 3);
    const interval3 = res.card.scheduledDays;

    expect(interval2).toBeGreaterThan(interval1);
    expect(interval3).toBeGreaterThan(interval2);
  });
}, 'Tier 1');
