import { FsrsCardData, FsrsRating, FsrsScheduleResult, CardState } from './types.js';

export class FsrsEngine {
  // Standard FSRS default weights (w0 to w16)
  public static readonly W = [
    0.4, 0.6, 2.4, 5.8,      // w0..w3: Initial stabilities
    4.93, 0.94, 0.86, 0.01,  // w4..w7: Difficulty parameters
    1.49, 0.14, 0.94,        // w8..w10: Stability increase parameters
    2.18, 0.05, 0.34, 1.26,  // w11..w14: Lapse stability parameters
    0.29, 2.61               // w15..w16: Hard / Easy modifiers
  ];

  public static readonly REQUEST_RETENTION = 0.9;
  public static readonly DECAY = -0.5;
  public static readonly FACTOR = 19 / 81;

  public static calculateRetrievability(stability: number, elapsedDays: number): number {
    if (elapsedDays <= 0) return 1.0;
    if (stability <= 0) return 0.0;
    // FSRS power-law forgetting curve formula: R(t) = (1 + factor * t / S)^decay
    const r = Math.pow(1 + (this.FACTOR * elapsedDays) / stability, this.DECAY);
    return Math.max(0.0, Math.min(1.0, r));
  }

  public static calculateInitialStability(rating: FsrsRating): number {
    const index = rating - 1;
    return Math.max(0.1, this.W[index]);
  }

  public static calculateInitialDifficulty(rating: FsrsRating): number {
    // D0(G) = w4 - exp(w5 * (G - 1)) + 1
    const d0 = this.W[4] - Math.exp(this.W[5] * (rating - 1)) + 1;
    return Math.max(1.0, Math.min(10.0, d0));
  }

  public static calculateNextDifficulty(currentDifficulty: number, rating: FsrsRating): number {
    // Delta D = -w6 * (rating - 3)
    const deltaD = -this.W[6] * (rating - 3);
    const meanReversion = this.W[7] * (this.calculateInitialDifficulty(3) - currentDifficulty);
    const nextD = currentDifficulty + deltaD + meanReversion;
    return Math.max(1.0, Math.min(10.0, nextD));
  }

  public static calculateNextStabilityReview(
    stability: number,
    difficulty: number,
    retrievability: number,
    rating: FsrsRating
  ): number {
    if (rating === 1) {
      // Lapse / Again: S'_f = w11 * D^-w12 * ( (S + 1)^w13 - 1 ) * exp(w14 * (1 - R))
      const lapseS =
        this.W[11] *
        Math.pow(difficulty, -this.W[12]) *
        (Math.pow(stability + 1, this.W[13]) - 1) *
        Math.exp(this.W[14] * (1 - retrievability));
      return Math.max(0.1, Math.min(stability, Math.max(0.1, lapseS)));
    }

    // Recall (Hard=2, Good=3, Easy=4):
    const hardMultiplier = rating === 2 ? this.W[15] : 1.0;
    const easyMultiplier = rating === 4 ? this.W[16] : 1.0;
    const sInc =
      Math.exp(this.W[8]) *
      (11 - difficulty) *
      Math.pow(stability, -this.W[9]) *
      (Math.exp((1 - retrievability) * this.W[10]) - 1) *
      hardMultiplier *
      easyMultiplier;

    return Math.max(stability + 0.1, stability * (1 + sInc));
  }

  public static calculateInterval(stability: number, requestRetention: number = 0.9): number {
    // Interval formula: I = S / factor * ( R^(1/decay) - 1 )
    const interval = (stability / this.FACTOR) * (Math.pow(requestRetention, 1 / this.DECAY) - 1);
    const rounded = Math.max(1, Math.round(interval));
    return Math.min(36500, rounded); // Max 100 years
  }

  public static scheduleCard(
    card: FsrsCardData,
    rating: FsrsRating,
    currentDate: Date = new Date(),
    targetRetention: number = 0.90
  ): FsrsScheduleResult {
    let nextStability: number;
    let nextDifficulty: number;
    let nextState = card.state;
    let nextScheduledDays: number;
    let nextLapses = card.lapses;
    let nextReps = card.reps + 1;

    if (card.state === 'NEW') {
      nextStability = this.calculateInitialStability(rating);
      nextDifficulty = this.calculateInitialDifficulty(rating);
      if (rating === 1) {
        nextState = 'LEARNING';
        nextScheduledDays = 0;
        nextLapses += 1;
      } else {
        nextState = 'REVIEW';
        nextScheduledDays = this.calculateInterval(nextStability, targetRetention);
      }
    } else {
      const r = this.calculateRetrievability(card.stability, card.elapsedDays);
      nextDifficulty = this.calculateNextDifficulty(card.difficulty, rating);
      nextStability = this.calculateNextStabilityReview(card.stability, nextDifficulty, r, rating);

      if (rating === 1) {
        nextState = 'RELEARNING';
        nextScheduledDays = 0;
        nextLapses += 1;
      } else {
        nextState = 'REVIEW';
        nextScheduledDays = this.calculateInterval(nextStability, targetRetention);
      }
    }

    const dueAtDate = new Date(currentDate.getTime() + nextScheduledDays * 24 * 60 * 60 * 1000);

    const updatedCard: FsrsCardData = {
      ...card,
      state: nextState,
      stability: Number(nextStability.toFixed(4)),
      difficulty: Number(nextDifficulty.toFixed(4)),
      elapsedDays: 0,
      scheduledDays: nextScheduledDays,
      reps: nextReps,
      lapses: nextLapses,
      lastReviewedAt: currentDate.toISOString(),
      dueAt: dueAtDate.toISOString(),
    };

    return {
      rating,
      card: updatedCard,
      reviewLog: {
        rating,
        state: card.state,
        stability: updatedCard.stability,
        difficulty: updatedCard.difficulty,
        elapsedDays: card.elapsedDays,
        scheduledDays: nextScheduledDays,
        reviewedAt: currentDate.toISOString(),
      },
    };
  }

  public static previewRatings(
    card: FsrsCardData,
    currentDate: Date = new Date(),
    targetRetention: number = 0.90
  ): Record<FsrsRating, { intervalDays: number; state: CardState; stability: number; difficulty: number }> {
    const r1 = this.scheduleCard(card, 1, currentDate, targetRetention).card;
    const r2 = this.scheduleCard(card, 2, currentDate, targetRetention).card;
    const r3 = this.scheduleCard(card, 3, currentDate, targetRetention).card;
    const r4 = this.scheduleCard(card, 4, currentDate, targetRetention).card;

    return {
      1: { intervalDays: r1.scheduledDays, state: r1.state, stability: r1.stability, difficulty: r1.difficulty },
      2: { intervalDays: r2.scheduledDays, state: r2.state, stability: r2.stability, difficulty: r2.difficulty },
      3: { intervalDays: r3.scheduledDays, state: r3.state, stability: r3.stability, difficulty: r3.difficulty },
      4: { intervalDays: r4.scheduledDays, state: r4.state, stability: r4.stability, difficulty: r4.difficulty },
    };
  }
}
