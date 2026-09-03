import { describe, it, expect } from '../harness/testRunner';
import { FsrsOracle } from '../harness/referenceOracles';
import { FsrsCardData } from '../harness/contracts';

describe('Tier 2: FSRS Boundary Ratings & Extreme Timing Tests', () => {
  const baseCard: FsrsCardData = {
    id: 'c_bound_1',
    userId: 'u1',
    cardType: 'RECOGNITION',
    front: 'die Grenze',
    back: 'boundary / limit',
    state: 'NEW',
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    dueAt: '2026-09-02T12:00:00Z',
  };

  it('should handle continuous stream of "Again" ratings without stability dipping below 0.1 floor', () => {
    let card = { ...baseCard };
    let sched = FsrsOracle.scheduleCard(card, 1);

    for (let i = 0; i < 50; i++) {
      card = { ...sched.card, elapsedDays: 1 };
      sched = FsrsOracle.scheduleCard(card, 1);
      expect(sched.card.stability).toBeGreaterThanOrEqual(0.1);
      expect(sched.card.difficulty).toBeLessThanOrEqual(10.0);
      expect(sched.card.difficulty).toBeGreaterThanOrEqual(1.0);
    }
  });

  it('should handle rapid consecutive "Easy" ratings with difficulty staying above 1.0 floor', () => {
    let card = { ...baseCard };
    let sched = FsrsOracle.scheduleCard(card, 4);

    for (let i = 0; i < 30; i++) {
      card = { ...sched.card, elapsedDays: Math.min(30, sched.card.scheduledDays) };
      sched = FsrsOracle.scheduleCard(card, 4);
      expect(sched.card.difficulty).toBeGreaterThanOrEqual(1.0);
      expect(sched.card.difficulty).toBeLessThanOrEqual(10.0);
    }
    expect(sched.card.difficulty).toBe(1.0);
  });

  it('should calculate retrievability for extreme overdue intervals (e.g. 365 days overdue)', () => {
    const stability = 10.0;
    const rAt365 = FsrsOracle.calculateRetrievability(stability, 365);
    expect(rAt365).toBeGreaterThanOrEqual(0.0);
    expect(rAt365).toBeLessThan(0.4); // severely decayed retention (~0.32)
    expect(rAt365).toBeGreaterThan(0.2);
  });

  it('should handle same-minute repeated reviews (elapsedDays = 0) gracefully', () => {
    let card = { ...baseCard };
    let sched1 = FsrsOracle.scheduleCard(card, 3);
    // Review again immediately (0 elapsed days)
    let cardImmediate = { ...sched1.card, elapsedDays: 0 };
    let sched2 = FsrsOracle.scheduleCard(cardImmediate, 3);

    expect(sched2.card.reps).toBe(2);
    expect(sched2.card.scheduledDays).toBeGreaterThanOrEqual(1);
  });

  it('should ensure interval never rounds down to 0 days for successful review cards', () => {
    let card = { ...baseCard };
    let sched = FsrsOracle.scheduleCard(card, 3);
    expect(sched.card.scheduledDays).toBeGreaterThanOrEqual(1);

    // Hard rating
    card = { ...baseCard };
    sched = FsrsOracle.scheduleCard(card, 2);
    expect(sched.card.scheduledDays).toBeGreaterThanOrEqual(1);
  });
}, 'Tier 2');
