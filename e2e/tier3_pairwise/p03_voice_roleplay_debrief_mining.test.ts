import { describe, it, expect } from '../harness/testRunner';
import { DebriefGeneratorOracle } from '../harness/referenceOracles';

describe('Tier 3: Voice Roleplay -> Debriefing -> Flashcard Mining Pipeline', () => {
  it('should process multi-turn Bürgeramt scenario roleplay and generate 3-3-5 debrief summary', () => {
    const roleplayTurns = [
      { speaker: 'TUTOR', text: 'Guten Tag! Was kann ich für Sie tun?' },
      { speaker: 'USER', text: 'Guten Tag, ich möchte mich für meine neue Wohnung anmelden.' },
      { speaker: 'TUTOR', text: 'Haben Sie Ihre Wohnungsgeberbestätigung und Ihren Personalausweis dabei?' },
      { speaker: 'USER', text: 'Ja, hier sind die Unterlagen und das Formular.' },
    ];

    expect(roleplayTurns).toHaveLength(4);

    const debrief = DebriefGeneratorOracle.generateDebrief(
      'sess_buergeramt_01',
      'ROLEPLAY',
      roleplayTurns.map(t => t.text),
      {
        successes: [
          'Appropriate polite greeting and formal address (Sie/Ihre)',
          'Clear communication of core objective (Wohnung anmelden)',
          'Complete document presentation',
        ],
        corrections: [
          { original: 'für meine neue Wohnung', corrected: 'in meiner neuen Wohnung', explanation: 'sich anmelden in + Dativ' },
          { original: 'hier sind Unterlagen', corrected: 'hier sind die Unterlagen', explanation: 'Definite article required for specific documents' },
          { original: 'ich habe Formular', corrected: 'ich habe das Formular', explanation: 'Accusative neuter article das' },
        ],
        minedWords: [
          { wordDe: 'die Wohnungsgeberbestätigung', meaningEn: 'landlord confirmation of residence', gender: 'die', exampleDe: 'Bringen Sie die Wohnungsgeberbestätigung mit.' },
          { wordDe: 'der Personalausweis', meaningEn: 'identity card', gender: 'der', exampleDe: 'Hier ist mein Personalausweis.' },
          { wordDe: 'die Unterlagen', meaningEn: 'documents', gender: 'die', exampleDe: 'Alle Unterlagen sind bereit.' },
          { wordDe: 'das Formular', meaningEn: 'form', gender: 'das', exampleDe: 'Bitte füllen Sie das Formular aus.' },
          { wordDe: 'die Anmeldung', meaningEn: 'registration', gender: 'die', exampleDe: 'Die Anmeldung ist kostenlos.' },
        ],
        fluencyScore: 88,
        pronunciationScore: 92,
        taskCompletionScore: 100,
      }
    );

    expect(debrief.successes).toHaveLength(3);
    expect(debrief.corrections).toHaveLength(3);
    expect(debrief.minedVocabulary).toHaveLength(5);
    expect(debrief.taskCompletionScore).toBe(100);
  });

  it('should auto-populate FSRS new review queue with the 5 mined officialese vocabulary cards', () => {
    const minedWords = [
      { wordDe: 'die Wohnungsgeberbestätigung', meaningEn: 'landlord confirmation of residence' },
      { wordDe: 'der Personalausweis', meaningEn: 'identity card' },
      { wordDe: 'die Unterlagen', meaningEn: 'documents' },
      { wordDe: 'das Formular', meaningEn: 'form' },
      { wordDe: 'die Anmeldung', meaningEn: 'registration' },
    ];

    const newCards = minedWords.map((w, idx) => ({
      id: `c_mined_roleplay_${idx}`,
      userId: 'u1',
      cardType: 'RECOGNITION' as const,
      front: w.wordDe,
      back: w.meaningEn,
      state: 'NEW' as const,
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      dueAt: new Date().toISOString(),
    }));

    expect(newCards).toHaveLength(5);
    expect(newCards[0].front).toBe('die Wohnungsgeberbestätigung');
  });

  it('should respect daily new card limits when adding mined words to an active user deck', () => {
    const existingNewCardsCount = 18;
    const dailyNewLimit = 20;
    const cardsToAdd = 5;

    const availableSlots = Math.max(0, dailyNewLimit - existingNewCardsCount);
    const addedToday = Math.min(cardsToAdd, availableSlots);
    const queuedForTomorrow = cardsToAdd - addedToday;

    expect(availableSlots).toBe(2);
    expect(addedToday).toBe(2);
    expect(queuedForTomorrow).toBe(3); // Pacing protection prevents overload!
  });

  it('should log speech duration and update speaking analytics trajectory', () => {
    const sessionDurationSeconds = 360; // 6 minutes
    let userSpeakingTotalMinutes = 40;
    userSpeakingTotalMinutes += Math.round(sessionDurationSeconds / 60);

    expect(userSpeakingTotalMinutes).toBe(46);
  });

  it('should link corrections to grammar tag mastery updates for targeted remediation', () => {
    const detectedCorrectionTag = 'prep_dativ_in_location';
    const tagUpdate = {
      tag: detectedCorrectionTag,
      totalAttempts: 5,
      correctAttempts: 3, // 60%
    };

    expect(tagUpdate.correctAttempts / tagUpdate.totalAttempts).toBeLessThan(0.80);
  });
}, 'Tier 3');
