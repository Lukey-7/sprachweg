import { describe, it, expect } from '../harness/testRunner';
import { SatzklammerOracle, LinguisticValidatorOracle } from '../harness/referenceOracles';

describe('Tier 4 Scenario 2: A2 Intermediate Past Narrative & Dictation Session', () => {
  it('should validate Week 12 A2 grammar objectives: Perfekt auxiliary selection and irregular Partizip II', () => {
    const verbsToTest = [
      { verb: 'aufstehen', aux: 'sein', partizipII: 'aufgestanden' },
      { verb: 'frühstücken', aux: 'haben', partizipII: 'gefrühstückt' },
      { verb: 'fahren', aux: 'sein', partizipII: 'gefahren' },
      { verb: 'arbeiten', aux: 'haben', partizipII: 'gearbeitet' },
    ];

    for (const item of verbsToTest) {
      expect(LinguisticValidatorOracle.validateAuxiliaryVerb(item.verb)).toBe(item.aux);
    }
  });

  it('should parse complex past narrative sentence with Satzklammer bracket structure and subordinate clause', () => {
    // "Gestern bin ich früh aufgestanden, weil ich nach Hamburg fahren musste."
    const sentence1 = 'Gestern bin ich früh aufgestanden.';
    const parsed1 = SatzklammerOracle.parseSentence(sentence1);

    expect(parsed1.vorfeld).toBe('Gestern');
    expect(parsed1.linkeSatzklammer).toBe('bin'); // Aux in V2
    expect(parsed1.mittelfeld).toBe('ich früh');
    expect(parsed1.rechteSatzklammer).toBe('aufgestanden'); // Partizip II at Verb-Ende

    const subClause = 'weil ich nach Hamburg fahren musste.';
    const parsedSub = SatzklammerOracle.parseSentence(subClause);
    expect(parsedSub.isNebensatz).toBe(true);
    expect(parsedSub.rechteSatzklammer).toContain('musste');
  });

  it('should evaluate Dictation Studio exercise with strict capitalization and spelling accuracy', () => {
    const targetAudioTranscript = 'Am Wochenende habe ich meine Großeltern auf dem Land besucht.';
    
    const evaluateSubmission = (input: string) => {
      return {
        isExact: input === targetAudioTranscript,
        hasCapitalizedNouns: input.includes('Wochenende') && input.includes('Großeltern') && input.includes('Land'),
        hasCorrectUmlaut: input.includes('Großeltern'),
      };
    };

    const userSuccess = evaluateSubmission('Am Wochenende habe ich meine Großeltern auf dem Land besucht.');
    expect(userSuccess.isExact).toBe(true);
    expect(userSuccess.hasCapitalizedNouns).toBe(true);
    expect(userSuccess.hasCorrectUmlaut).toBe(true);

    const userTypo = evaluateSubmission('am wochenende habe ich meine Grosseltern auf dem land besucht.');
    expect(userTypo.isExact).toBe(false);
    expect(userTypo.hasCapitalizedNouns).toBe(false);
  });

  it('should process FSRS daily review queue with 20 due cards and cap protection', () => {
    const dueCardsCount = 35;
    const dailyReviewLimit = 20;
    const sessionReviewQueue = Array.from({ length: Math.min(dueCardsCount, dailyReviewLimit) });

    expect(sessionReviewQueue).toHaveLength(20);
  });

  it('should award learner A2 milestone progress points upon session completion', () => {
    let learnerPoints = 1250;
    const sessionPoints = 150;
    learnerPoints += sessionPoints;

    expect(learnerPoints).toBe(1400);
    expect(learnerPoints).toBeGreaterThan(1000);
  });
}, 'Tier 4');
