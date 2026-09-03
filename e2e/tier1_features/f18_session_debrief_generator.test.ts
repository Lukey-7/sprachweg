import { describe, it, expect } from '../harness/testRunner';
import { DebriefGeneratorOracle } from '../harness/referenceOracles';

describe('Feature 18: Post-Session Debriefing Generator Verification (3-3-5 Protocol)', () => {
  const validDebriefPayload = {
    successes: [
      'Accurate V2 word order in main clauses',
      'Flawless pronunciation of the umlaut [øː] in "schön"',
      'Successfully completed Bürgeramt address registration task',
    ] as [string, string, string],
    corrections: [
      {
        original: 'Ich bin das Formular ausgefüllt.',
        corrected: 'Ich habe das Formular ausgefüllt.',
        explanation: 'ausfüllen takes haben auxiliary.',
      },
      {
        original: 'für die Termin',
        corrected: 'für den Termin',
        explanation: 'der Termin in Accusative with "für" becomes "den Termin".',
      },
      {
        original: 'Ich wohne seit zwei Monate hier.',
        corrected: 'Ich wohne seit zwei Monaten hier.',
        explanation: '"seit" governs Dative plural which requires the -n suffix.',
      },
    ] as [
      { original: string; corrected: string; explanation: string },
      { original: string; corrected: string; explanation: string },
      { original: string; corrected: string; explanation: string }
    ],
    minedWords: [
      { wordDe: 'die Meldebestätigung', meaningEn: 'registration certificate', gender: 'die' as const, exampleDe: 'Hier ist Ihre Meldebestätigung.' },
      { wordDe: 'das Formular', meaningEn: 'form / document', gender: 'das' as const, exampleDe: 'Bitte füllen Sie das Formular aus.' },
      { wordDe: 'der Mietvertrag', meaningEn: 'rental agreement', gender: 'der' as const, exampleDe: 'Ich habe den Mietvertrag mitgebracht.' },
      { wordDe: 'der Personalausweis', meaningEn: 'identity card', gender: 'der' as const, exampleDe: 'Zeigen Sie bitte Ihren Personalausweis.' },
      { wordDe: 'die Unterlagen', meaningEn: 'documents / papers', gender: 'die' as const, exampleDe: 'Alle Unterlagen sind vollständig.' },
    ] as [
      { wordDe: string; meaningEn: string; gender?: any; exampleDe: string },
      { wordDe: string; meaningEn: string; gender?: any; exampleDe: string },
      { wordDe: string; meaningEn: string; gender?: any; exampleDe: string },
      { wordDe: string; meaningEn: string; gender?: any; exampleDe: string },
      { wordDe: string; meaningEn: string; gender?: any; exampleDe: string }
    ],
    fluencyScore: 85,
    pronunciationScore: 90,
    taskCompletionScore: 100,
  };

  it('should enforce exactly 3 successes in the post-session debrief', () => {
    const debrief = DebriefGeneratorOracle.generateDebrief(
      'sess_voice_1',
      'ROLEPLAY',
      ['Hallo', 'Ich möchte mich anmelden.'],
      validDebriefPayload
    );
    expect(debrief.successes).toHaveLength(3);
    expect(debrief.successes[0]).toContain('V2 word order');
  });

  it('should enforce exactly 3 prioritized corrections with original, corrected, and explanation fields', () => {
    const debrief = DebriefGeneratorOracle.generateDebrief(
      'sess_voice_1',
      'ROLEPLAY',
      [],
      validDebriefPayload
    );
    expect(debrief.corrections).toHaveLength(3);
    for (const c of debrief.corrections) {
      expect(c.original).toBeDefined();
      expect(c.corrected).toBeDefined();
      expect(c.explanation).toBeDefined();
    }
    expect(debrief.corrections[1].corrected).toBe('für den Termin');
  });

  it('should enforce exactly 5 mined vocabulary words with German lemma, English translation, and example sentence', () => {
    const debrief = DebriefGeneratorOracle.generateDebrief(
      'sess_voice_1',
      'ROLEPLAY',
      [],
      validDebriefPayload
    );
    expect(debrief.minedVocabulary).toHaveLength(5);
    for (const word of debrief.minedVocabulary) {
      expect(word.wordDe).toBeDefined();
      expect(word.meaningEn).toBeDefined();
      expect(word.exampleDe).toBeDefined();
    }
    expect(debrief.minedVocabulary[0].wordDe).toBe('die Meldebestätigung');
  });

  it('should reject invalid debrief payloads not adhering to the 3-3-5 count contract', () => {
    const invalidPayload = {
      ...validDebriefPayload,
      successes: ['Only one success'] as any,
    };

    expect(() =>
      DebriefGeneratorOracle.generateDebrief('sess_err', 'CONVERSATION', [], invalidPayload)
    ).toThrow('Debrief must contain exactly 3 successes');
  });

  it('should auto-format mined words for 1-tap conversion into FSRS flashcards', () => {
    const debrief = DebriefGeneratorOracle.generateDebrief('sess_voice_1', 'ROLEPLAY', [], validDebriefPayload);
    const fsrsCards = debrief.minedVocabulary.map((item, idx) => ({
      id: `card_mined_${idx}`,
      userId: 'u1',
      cardType: 'RECOGNITION' as const,
      front: item.wordDe,
      back: item.meaningEn,
      contextSentence: item.exampleDe,
      gender: item.gender,
      state: 'NEW' as const,
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      dueAt: new Date().toISOString(),
    }));

    expect(fsrsCards).toHaveLength(5);
    expect(fsrsCards[0].front).toBe('die Meldebestätigung');
    expect(fsrsCards[0].contextSentence).toContain('Meldebestätigung');
  });
}, 'Tier 1');
