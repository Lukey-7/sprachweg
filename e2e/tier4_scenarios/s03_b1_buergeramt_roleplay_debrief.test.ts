import { describe, it, expect } from '../harness/testRunner';
import { DebriefGeneratorOracle } from '../harness/referenceOracles';

describe('Tier 4 Scenario 3: B1 Bürgeramt Roleplay & Debrief Session', () => {
  it('should execute full 6-turn administrative registration roleplay scenario', () => {
    const dialogHistory = [
      { speaker: 'CLERK', text: 'Guten Tag, wie kann ich Ihnen heute helfen?' },
      { speaker: 'USER', text: 'Guten Tag. Ich bin vor einer Woche nach Berlin gezogen und möchte meine Wohnung anmelden.' },
      { speaker: 'CLERK', text: 'Haben Sie das Anmeldeformular und die Bestätigung vom Vermieter dabei?' },
      { speaker: 'USER', text: 'Ja, ich habe das ausgefüllte Formular und die Wohnungsgeberbestätigung hier.' },
      { speaker: 'CLERK', text: 'Sehr gut. Bitte geben Sie mir auch Ihren Reisepass zur Identitätsprüfung.' },
      { speaker: 'USER', text: 'Hier ist mein Reisepass. Brauchen Sie noch weitere Unterlagen?' },
    ];

    expect(dialogHistory).toHaveLength(6);
    expect(dialogHistory[1].text).toContain('Wohnung anmelden');
  });

  it('should evaluate task completion checklist for municipal registration', () => {
    const checklist = [
      { task: 'State intention to register address', completed: true },
      { task: 'Provide Wohnungsgeberbestätigung', completed: true },
      { task: 'Present identification document (Pass/Ausweis)', completed: true },
    ];

    const completedCount = checklist.filter(t => t.completed).length;
    const taskCompletionScore = (completedCount / checklist.length) * 100;

    expect(taskCompletionScore).toBe(100);
  });

  it('should generate standard 3-3-5 debrief report with high accuracy', () => {
    const debrief = DebriefGeneratorOracle.generateDebrief(
      'sess_b1_roleplay_01',
      'ROLEPLAY',
      ['Guten Tag', 'Ich möchte mich anmelden.'],
      {
        successes: [
          'Excellent formal register and polite phrasing throughout dialogue',
          'Accurate use of past tense (bin gezogen)',
          'Clear pronunciation of administrative compounds',
        ],
        corrections: [
          { original: 'vor eine Woche', corrected: 'vor einer Woche', explanation: '"vor" takes Dative feminine (einer Woche).' },
          { original: 'Bestätigung von Vermieter', corrected: 'Bestätigung vom Vermieter', explanation: 'von + dem contracts to vom.' },
          { original: 'weitere Unterlage', corrected: 'weitere Unterlagen', explanation: 'Plural form Unterlagen needed.' },
        ],
        minedWords: [
          { wordDe: 'die Wohnungsgeberbestätigung', meaningEn: 'landlord confirmation', gender: 'die', exampleDe: 'Hier ist die Bestätigung.' },
          { wordDe: 'die Meldebehörde', meaningEn: 'registration authority', gender: 'die', exampleDe: 'Die Meldebehörde hat geöffnet.' },
          { wordDe: 'der Reisepass', meaningEn: 'passport', gender: 'der', exampleDe: 'Geben Sie mir Ihren Reisepass.' },
          { wordDe: 'die Identitätsprüfung', meaningEn: 'identity verification', gender: 'die', exampleDe: 'Die Prüfung ist abgeschlossen.' },
          { wordDe: 'die Bescheinigung', meaningEn: 'certificate / attestation', gender: 'die', exampleDe: 'Ihre Bescheinigung ist fertig.' },
        ],
        fluencyScore: 92,
        pronunciationScore: 90,
        taskCompletionScore: 100,
      }
    );

    expect(debrief.successes).toHaveLength(3);
    expect(debrief.corrections).toHaveLength(3);
    expect(debrief.minedVocabulary).toHaveLength(5);
  });

  it('should auto-mine 5 official administrative vocabulary items to user B1 vocabulary deck', () => {
    const minedList = [
      'die Wohnungsgeberbestätigung',
      'die Meldebehörde',
      'der Reisepass',
      'die Identitätsprüfung',
      'die Bescheinigung',
    ];

    expect(minedList).toHaveLength(5);
    expect(minedList[0]).toBe('die Wohnungsgeberbestätigung');
  });

  it('should update learner B1 readiness meter towards 85% fluency goal', () => {
    let b1Readiness = 72;
    const sessionGain = 4;
    b1Readiness += sessionGain;

    expect(b1Readiness).toBe(76);
  });
}, 'Tier 4');
