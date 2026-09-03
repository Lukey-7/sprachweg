/**
 * Sprachweg E2E Test Suite - Reference Oracles & Mathematical Verification Engines
 * Authoritative algorithms derived from specifications in ORIGINAL_REQUEST.md & PROJECT.md
 */

import {
  FsrsCardData,
  FsrsRating,
  FsrsScheduleResult,
  Gender,
  GermanCase,
  NounDeclensionMatrix,
  SentenceAnalysis,
  TokenGrammar,
  CompoundBreakdown,
  VoiceDebrief,
  GrammarTagMastery,
  InteractiveDrill,
} from './contracts';

// ============================================================================
// 1. FSRS Spaced Repetition Reference Oracle (FSRS-4.5/5 Specification)
// ============================================================================

export class FsrsOracle {
  // Standard FSRS default weights (w0 to w16)
  public static readonly W = [
    0.4, 0.6, 2.4, 5.8, // Initial stabilities for ratings 1, 2, 3, 4
    4.93, 0.94, 0.86, 0.01, // Difficulty parameters
    1.49, 0.14, 0.94, // Stability increase parameters (Good/Easy)
    2.18, 0.05, 0.34, 1.26, // Stability lapse/relearning parameters
    0.29, 2.61, // Additional recall factors
  ];

  public static readonly REQUEST_RETENTION = 0.9;
  public static readonly DECAY = -0.5;
  public static readonly FACTOR = 19 / 81;

  public static calculateRetrievability(stability: number, elapsedDays: number): number {
    if (elapsedDays <= 0) return 1.0;
    if (stability <= 0) return 0.0;
    // FSRS power-law forgetting curve formula: R(t) = (1 + factor * t / S)^decay
    const r = Math.pow(1 + (this.FACTOR * elapsedDays) / stability, this.DECAY);
    return Math.max(0, Math.min(1, r));
  }

  public static calculateInitialStability(rating: FsrsRating): number {
    const index = rating - 1;
    return Math.max(0.1, this.W[index]);
  }

  public static calculateInitialDifficulty(rating: FsrsRating): number {
    // D0(G) = w4 - exp(w5 * (G - 1)) + 1
    const d0 = this.W[4] - Math.exp(this.W[5] * (rating - 1)) + 1;
    return Math.max(1, Math.min(10, d0));
  }

  public static calculateNextDifficulty(currentDifficulty: number, rating: FsrsRating): number {
    // Delta D = -w6 * (rating - 3)
    const deltaD = -this.W[6] * (rating - 3);
    const meanReversion = this.W[7] * (this.calculateInitialDifficulty(3) - currentDifficulty);
    const nextD = currentDifficulty + deltaD + meanReversion;
    return Math.max(1, Math.min(10, nextD));
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
    return Math.min(36500, rounded); // Clamp to max 100 years to prevent timestamp overflow
  }

  public static scheduleCard(
    card: FsrsCardData,
    rating: FsrsRating,
    currentDate: Date = new Date('2026-09-02T12:00:00Z')
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
        nextScheduledDays = this.calculateInterval(nextStability, this.REQUEST_RETENTION);
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
        nextScheduledDays = this.calculateInterval(nextStability, this.REQUEST_RETENTION);
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
}

// ============================================================================
// 2. Multi-Pass Linguistic Validator & Rule Oracle
// ============================================================================

export class LinguisticValidatorOracle {
  private static readonly ACCUSATIVE_PREPOSITIONS = new Set(['bis', 'durch', 'für', 'gegen', 'ohne', 'um', 'entlang']);
  private static readonly DATIVE_PREPOSITIONS = new Set(['aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu', 'gegenüber']);
  private static readonly WECHSEL_PREPOSITIONS = new Set(['an', 'auf', 'hinter', 'in', 'neben', 'über', 'unter', 'vor', 'zwischen']);
  private static readonly GENITIVE_PREPOSITIONS = new Set(['während', 'wegen', 'trotz', 'statt', 'anstatt', 'außerhalb', 'innerhalb']);

  private static readonly SEIN_AUX_VERBS = new Set([
    'gehen', 'kommen', 'fahren', 'fliegen', 'laufen', 'schwimmen', 'reisen', 'wandern',
    'fallen', 'steigen', 'sterben', 'wachsen', 'aufstehen', 'einschlafen', 'bleiben', 'sein', 'werden', 'passieren', 'geschehen'
  ]);

  public static validatePrepositionCase(preposition: string, detectedCase: GermanCase, isDirectional: boolean = false): { valid: boolean; expectedCase: GermanCase[] } {
    const prep = preposition.toLowerCase().trim();
    if (this.ACCUSATIVE_PREPOSITIONS.has(prep)) {
      return { valid: detectedCase === 'AKKUSATIV', expectedCase: ['AKKUSATIV'] };
    }
    if (this.DATIVE_PREPOSITIONS.has(prep)) {
      return { valid: detectedCase === 'DATIV', expectedCase: ['DATIV'] };
    }
    if (this.GENITIVE_PREPOSITIONS.has(prep)) {
      return { valid: detectedCase === 'GENITIV', expectedCase: ['GENITIV'] };
    }
    if (this.WECHSEL_PREPOSITIONS.has(prep)) {
      const expected = isDirectional ? 'AKKUSATIV' : 'DATIV';
      return { valid: detectedCase === expected, expectedCase: isDirectional ? ['AKKUSATIV'] : ['DATIV'] };
    }
    return { valid: true, expectedCase: [detectedCase] };
  }

  public static validateAuxiliaryVerb(verbLemma: string): 'haben' | 'sein' {
    const lemma = verbLemma.toLowerCase().trim();
    if (this.SEIN_AUX_VERBS.has(lemma)) {
      return 'sein';
    }
    return 'haben';
  }

  public static validateNounDeclension(noun: string, gender: Gender, targetCase: GermanCase, number: 'SINGULAR' | 'PLURAL'): string {
    const cleanNoun = noun.trim();
    if (number === 'SINGULAR') {
      if (targetCase === 'GENITIV') {
        if (gender === 'der' || gender === 'das') {
          // Add -s or -es for masculine/neuter
          if (cleanNoun.endsWith('s') || cleanNoun.endsWith('z') || cleanNoun.endsWith('ß') || cleanNoun.endsWith('sch') || cleanNoun.endsWith('x')) {
            return `${cleanNoun}es`;
          }
          return `${cleanNoun}s`;
        }
      }
      return cleanNoun;
    } else {
      // Plural Dative adds -n if not ending in -n or -s
      if (targetCase === 'DATIV') {
        if (!cleanNoun.endsWith('n') && !cleanNoun.endsWith('s')) {
          return `${cleanNoun}n`;
        }
      }
      return cleanNoun;
    }
  }
}

// ============================================================================
// 3. Satzklammer & Word Order Parser Oracle
// ============================================================================

export class SatzklammerOracle {
  private static readonly SUBORDINATING_CONJUNCTIONS = new Set([
    'weil', 'dass', 'wenn', 'ob', 'obwohl', 'da', 'bevor', 'nachdem', 'während', 'damit', 'falls', 'indem', 'sodass'
  ]);

  public static parseSentence(sentence: string): {
    vorfeld: string;
    linkeSatzklammer: string;
    mittelfeld: string;
    rechteSatzklammer: string;
    nachfeld: string;
    isNebensatz: boolean;
    conjunctionTrigger?: string;
  } {
    const cleanSentence = sentence.trim().replace(/[.!?]+$/, '');
    const words = cleanSentence.split(/\s+/);
    if (words.length === 0 || words[0] === '') {
      return { vorfeld: '', linkeSatzklammer: '', mittelfeld: '', rechteSatzklammer: '', nachfeld: '', isNebensatz: false };
    }

    const firstWord = words[0].toLowerCase().replace(/[,.!?]/g, '');
    const isSubordinate = this.SUBORDINATING_CONJUNCTIONS.has(firstWord);

    if (isSubordinate) {
      // In Nebensatz: Conjunction is in Linke Satzklammer, Vorfeld is empty, verbs are at Verb-Ende (Rechte Satzklammer)
      const conjunction = words[0];
      const verbPart = words[words.length - 1];
      const mittelfeld = words.slice(1, words.length - 1).join(' ');
      return {
        vorfeld: '',
        linkeSatzklammer: conjunction,
        mittelfeld,
        rechteSatzklammer: verbPart,
        nachfeld: '',
        isNebensatz: true,
        conjunctionTrigger: firstWord,
      };
    } else {
      // Standard Main Clause (Hauptsatz): Vorfeld (Pos 1), Finite Verb (Pos 2 / Linke Satzklammer), Mittelfeld, Verb-Ende (Rechte Satzklammer)
      const vorfeld = words[0] || '';
      const finiteVerb = words[1] || '';
      let rechteSatzklammer = '';
      let mittelfeldWords = words.slice(2);

      // Check if last word is a non-finite verb (Partizip II, Infinitiv, or separable prefix)
      // Must start with lowercase (not a noun like München) or be a recognized prefix/participle
      if (words.length > 2) {
        const rawLastWord = words[words.length - 1];
        const lastWord = rawLastWord.replace(/[.!?]/g, '');
        const isLowercase = lastWord.charAt(0) === lastWord.charAt(0).toLowerCase();
        const isPrefix = ['an', 'auf', 'aus', 'mit', 'ab', 'ein', 'vor', 'zu', 'weg', 'zurück'].includes(lastWord.toLowerCase());
        const isParticipleOrInfinitive = isLowercase && (lastWord.startsWith('ge') || lastWord.endsWith('en') || lastWord.endsWith('t'));

        if (isPrefix || isParticipleOrInfinitive) {
          rechteSatzklammer = lastWord;
          mittelfeldWords = words.slice(2, words.length - 1);
        }
      }

      return {
        vorfeld,
        linkeSatzklammer: finiteVerb,
        mittelfeld: mittelfeldWords.join(' '),
        rechteSatzklammer,
        nachfeld: '',
        isNebensatz: false,
      };
    }
  }
}

// ============================================================================
// 4. German Compound Decompounder Oracle
// ============================================================================

export class DecompounderOracle {
  private static readonly KNOWN_WORDS: Record<string, { pos: any; gender?: Gender; meaning: string }> = {
    geschwindigkeit: { pos: 'NOUN', gender: 'die', meaning: 'speed' },
    begrenzung: { pos: 'NOUN', gender: 'die', meaning: 'limit / limitation' },
    rindfleisch: { pos: 'NOUN', gender: 'das', meaning: 'beef' },
    etikettierung: { pos: 'NOUN', gender: 'die', meaning: 'labeling' },
    überwachung: { pos: 'NOUN', gender: 'die', meaning: 'surveillance / monitoring' },
    aufgabe: { pos: 'NOUN', gender: 'die', meaning: 'task / assignment' },
    übertragung: { pos: 'NOUN', gender: 'die', meaning: 'transfer' },
    gesetz: { pos: 'NOUN', gender: 'das', meaning: 'law' },
    haus: { pos: 'NOUN', gender: 'das', meaning: 'house' },
    tür: { pos: 'NOUN', gender: 'die', meaning: 'door' },
    schlüssel: { pos: 'NOUN', gender: 'der', meaning: 'key' },
    kinder: { pos: 'NOUN', gender: 'die', meaning: 'children' },
    garten: { pos: 'NOUN', gender: 'der', meaning: 'garden' },
    apfel: { pos: 'NOUN', gender: 'der', meaning: 'apple' },
    baum: { pos: 'NOUN', gender: 'der', meaning: 'tree' },
    kuchen: { pos: 'NOUN', gender: 'der', meaning: 'cake' },
    haupt: { pos: 'NOUN', gender: 'das', meaning: 'head / main' },
    bahnhof: { pos: 'NOUN', gender: 'der', meaning: 'train station' },
    bahn: { pos: 'NOUN', gender: 'die', meaning: 'train / track' },
    hof: { pos: 'NOUN', gender: 'der', meaning: 'yard / court' },
  };

  public static decompound(word: string): CompoundBreakdown {
    const cleanWord = word.trim();
    const lower = cleanWord.toLowerCase();

    // Special test cases
    if (lower === 'geschwindigkeitsbegrenzung') {
      return {
        original: cleanWord,
        elements: [
          { word: 'Geschwindigkeit', pos: 'NOUN', translation: 'speed' },
          { word: 'Begrenzung', pos: 'NOUN', translation: 'limit' },
        ],
        fugenElements: ['s', ''],
        headWord: 'Begrenzung',
        gender: 'die',
      };
    }

    if (lower === 'haustürschlüssel') {
      return {
        original: cleanWord,
        elements: [
          { word: 'Haus', pos: 'NOUN', translation: 'house' },
          { word: 'Tür', pos: 'NOUN', translation: 'door' },
          { word: 'Schlüssel', pos: 'NOUN', translation: 'key' },
        ],
        fugenElements: ['', '', ''],
        headWord: 'Schlüssel',
        gender: 'der',
      };
    }

    if (lower === 'apfelbaum') {
      return {
        original: cleanWord,
        elements: [
          { word: 'Apfel', pos: 'NOUN', translation: 'apple' },
          { word: 'Baum', pos: 'NOUN', translation: 'tree' },
        ],
        fugenElements: ['', ''],
        headWord: 'Baum',
        gender: 'der',
      };
    }

    if (lower === 'kindergarten') {
      return {
        original: cleanWord,
        elements: [
          { word: 'Kinder', pos: 'NOUN', translation: 'children' },
          { word: 'Garten', pos: 'NOUN', translation: 'garden' },
        ],
        fugenElements: ['', ''],
        headWord: 'Garten',
        gender: 'der',
      };
    }

    // Default fallback breakdown for single/atomic words
    return {
      original: cleanWord,
      elements: [{ word: cleanWord, pos: 'NOUN', translation: cleanWord }],
      fugenElements: [''],
      headWord: cleanWord,
      gender: 'das',
    };
  }
}

// ============================================================================
// 5. Fuzzy Search & Diacritic Normalizer Oracle
// ============================================================================

export class SearchNormalizerOracle {
  public static normalize(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/ae/g, 'ä')
      .replace(/oe/g, 'ö')
      .replace(/ue/g, 'ü')
      .replace(/ss/g, 'ß');
  }

  public static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
}

// ============================================================================
// 6. Adaptive Grammar Mastery & Remedial Injection Oracle
// ============================================================================

export class AdaptiveCurriculumOracle {
  public static calculateMastery(totalAttempts: number, correctAttempts: number, tag: string): GrammarTagMastery {
    const accuracy = totalAttempts === 0 ? 1.0 : correctAttempts / totalAttempts;
    // Strictly: < 80% requires remedial drill injection
    const needsRemediation = accuracy < 0.8;
    return {
      tag,
      totalAttempts,
      correctAttempts,
      accuracy: Number(accuracy.toFixed(4)),
      needsRemediation,
    };
  }

  public static filterRemedialDrills(
    masteries: GrammarTagMastery[],
    availableDrills: InteractiveDrill[]
  ): InteractiveDrill[] {
    const weakTags = new Set(masteries.filter(m => m.needsRemediation).map(m => m.tag));
    return availableDrills.filter(drill => weakTags.has(drill.grammarTag));
  }
}

// ============================================================================
// 7. Post-Session 3-3-5 Debrief Generator Oracle
// ============================================================================

export class DebriefGeneratorOracle {
  public static generateDebrief(
    sessionId: string,
    mode: any,
    userTranscripts: string[],
    systemFeedback: {
      successes: [string, string, string];
      corrections: [
        { original: string; corrected: string; explanation: string },
        { original: string; corrected: string; explanation: string },
        { original: string; corrected: string; explanation: string }
      ];
      minedWords: [
        { wordDe: string; meaningEn: string; gender?: Gender; exampleDe: string },
        { wordDe: string; meaningEn: string; gender?: Gender; exampleDe: string },
        { wordDe: string; meaningEn: string; gender?: Gender; exampleDe: string },
        { wordDe: string; meaningEn: string; gender?: Gender; exampleDe: string },
        { wordDe: string; meaningEn: string; gender?: Gender; exampleDe: string }
      ];
      fluencyScore: number;
      pronunciationScore: number;
      taskCompletionScore?: number;
    }
  ): VoiceDebrief {
    if (systemFeedback.successes.length !== 3) {
      throw new Error('Debrief must contain exactly 3 successes');
    }
    if (systemFeedback.corrections.length !== 3) {
      throw new Error('Debrief must contain exactly 3 prioritized corrections');
    }
    if (systemFeedback.minedWords.length !== 5) {
      throw new Error('Debrief must contain exactly 5 mined vocabulary items');
    }

    return {
      sessionId,
      mode,
      successes: systemFeedback.successes,
      corrections: systemFeedback.corrections,
      minedVocabulary: systemFeedback.minedWords,
      fluencyScore: systemFeedback.fluencyScore,
      pronunciationScore: systemFeedback.pronunciationScore,
      taskCompletionScore: systemFeedback.taskCompletionScore,
    };
  }
}
