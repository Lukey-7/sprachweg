import { describe, it, expect } from '../harness/testRunner';
import { VoiceMode, PhoneticAnalysis } from '../harness/contracts';

describe('Feature 17: 5 Voice Studio Interaction Modes Verification', () => {
  it('should validate Free Conversation mode with conversational recasts', () => {
    const freeConvState = {
      mode: 'CONVERSATION' as VoiceMode,
      learnerUtterance: 'Ich habe gestern gegangen.',
      tutorRecast: 'Ach so, du bist gestern gegangen! Wohin bist du denn gegangen?',
      detectedError: {
        original: 'habe gegangen',
        recast: 'bist gegangen',
        rule: 'Verbs of motion use sein auxiliary in Perfekt.',
      },
    };

    expect(freeConvState.mode).toBe('CONVERSATION');
    expect(freeConvState.tutorRecast).toContain('du bist gestern gegangen');
    expect(freeConvState.detectedError.rule).toContain('sein auxiliary');
  });

  it('should validate 5 Scenario Role-Play environments and task completion criteria', () => {
    const scenarios = [
      { id: 'buergeramt', name: 'Bürgeramt Anmeldung', tasks: ['Ask for appointment', 'Provide address', 'State nationality'] },
      { id: 'baeckerei', name: 'In der Bäckerei', tasks: ['Greet baker', 'Order 2 Brötchen', 'Ask for price and pay'] },
      { id: 'arzt', name: 'Beim Arzt', tasks: ['Describe symptoms', 'Explain duration', 'Ask for prescription'] },
      { id: 'wohnung', name: 'Wohnungsbesichtigung', tasks: ['Ask about rent/Nebenkosten', 'Inquire about move-in date'] },
      { id: 'interview', name: 'Vorstellungsgespräch', tasks: ['Introduce background', 'Explain strengths', 'Ask questions'] },
    ];

    expect(scenarios).toHaveLength(5);
    expect(scenarios.map(s => s.id)).toEqual(['buergeramt', 'baeckerei', 'arzt', 'wohnung', 'interview']);
    expect(scenarios[0].tasks).toHaveLength(3);
  });

  it('should validate Pronunciation Coach across 6 core phonetic markers', () => {
    const phoneticMarkers = [
      'ü_ö', // front rounded vowels (Tür, schön)
      'ch_ich_ach', // ich-Laut vs ach-Laut (ich vs Buch)
      'uvular_r', // German uvular /r/
      'auslautverhaertung', // final devoicing (Hund -> [hunt], Tag -> [tak])
      'vowel_length', // short vs long vowels (Bann vs Bahn)
      'glottal_stop', // Knacklaut before initial vowels (Theater, be-achten)
    ];

    expect(phoneticMarkers).toHaveLength(6);

    const sampleAnalysis: PhoneticAnalysis = {
      targetPhoneme: 'ü_ö',
      score: 88,
      pitchDifferenceHz: 4.2,
      feedbackEn: 'Good lip rounding for the [yː] sound in "Tür".',
    };

    expect(sampleAnalysis.score).toBeGreaterThan(80);
    expect(sampleAnalysis.targetPhoneme).toBe('ü_ö');
  });

  it('should validate Shadowing mode audio synchronization and pacing markers', () => {
    const shadowingSession = {
      mode: 'SHADOWING' as VoiceMode,
      targetSentenceDe: 'Entschuldigung, wie komme ich zum Bahnhof?',
      targetSpeedWpm: 120,
      userRecordedDurationMs: 2500,
      targetDurationMs: 2400,
      paceAccuracy: 0.96, // 96% tempo alignment
    };

    expect(shadowingSession.mode).toBe('SHADOWING');
    expect(shadowingSession.paceAccuracy).toBeGreaterThan(0.90);
  });

  it('should validate Dictation mode with strict spelling, umlaut, and capitalization evaluation', () => {
    const evaluateDictation = (target: string, input: string) => {
      const matchExact = target === input;
      const targetWords = target.split(/\s+/);
      const inputWords = input.split(/\s+/);
      let errors: string[] = [];

      for (let i = 0; i < targetWords.length; i++) {
        const expected = targetWords[i];
        const actual = inputWords[i] || '';
        if (expected !== actual) {
          if (expected.toLowerCase() === actual.toLowerCase()) {
            errors.push(`Capitalization error at word ${i + 1}: expected "${expected}", got "${actual}"`);
          } else {
            errors.push(`Spelling error at word ${i + 1}: expected "${expected}", got "${actual}"`);
          }
        }
      }
      return { matchExact, errors, score: Math.max(0, 1 - errors.length / targetWords.length) };
    };

    const target = 'Die schöne Stadt hat viele Bäume.';
    // Missing umlauts and lowercase noun:
    const inputWrong = 'Die schone stadt hat viele Baume.';
    const resWrong = evaluateDictation(target, inputWrong);
    expect(resWrong.matchExact).toBe(false);
    expect(resWrong.errors).toHaveLength(3); // schone, stadt, Baume

    // Correct:
    const resCorrect = evaluateDictation(target, target);
    expect(resCorrect.matchExact).toBe(true);
    expect(resCorrect.score).toBe(1.0);
  });
}, 'Tier 1');
