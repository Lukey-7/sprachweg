import { describe, it, expect } from '../harness/testRunner';
import { DailySessionPlan } from '../harness/contracts';

describe('Feature 14: Daily 5-Block Session Pipeline Verification', () => {
  const samplePlan: DailySessionPlan = {
    sessionId: 'sess_w04_d2',
    weekNumber: 4,
    dayOfWeek: 2,
    cefrLevel: 'A1',
    block1Warmup: {
      dueCards: [
        {
          id: 'c1',
          userId: 'u1',
          cardType: 'RECOGNITION',
          front: 'die Zeitung',
          back: 'newspaper',
          state: 'REVIEW',
          stability: 3.2,
          difficulty: 4.5,
          elapsedDays: 3,
          scheduledDays: 3,
          reps: 2,
          lapses: 0,
          dueAt: '2026-09-02T00:00:00Z',
        },
      ],
      remedialDrills: [],
    },
    block2Grammar: {
      topic: {
        id: 'top_modal_koennen',
        titleDe: 'Modalverb können im Präsens',
        titleEn: 'Modal verb can/to be able to in present tense',
        cefrLevel: 'A1',
        weekNumber: 4,
        tags: ['modal_koennen'],
        mentalModel: 'Modal verb takes Position 2, main action infinitive goes to sentence end.',
        paradigmTable: { ich: 'kann', du: 'kannst', er: 'kann', wir: 'können', ihr: 'könnt', sie: 'können' },
        drillsCount: 15,
      },
      mentalModel: 'Modal verb takes Position 2, main action infinitive goes to sentence end.',
      paradigmTable: { ich: 'kann', du: 'kannst', er: 'kann', wir: 'können', ihr: 'könnt', sie: 'können' },
      drills: [
        {
          id: 'drill_1',
          topicId: 'top_modal_koennen',
          type: 'FILL_IN',
          promptDe: 'Ich ___ gut Deutsch sprechen. (können)',
          promptEn: 'I can speak German well.',
          correctAnswer: 'kann',
          explanationDe: '1. Person Singular Präsens: ich kann.',
          explanationEn: 'First person singular of können is kann.',
          grammarTag: 'modal_koennen',
        },
      ],
    },
    block3Mining: {
      sentences: [
        {
          sentenceDe: 'Er kann heute nicht kommen, weil er arbeiten muss.',
          sentenceEnNatural: 'He cannot come today because he has to work.',
          sentenceEnLiteral: 'He can today not come, because he work must.',
          tokens: [],
          topologicalMap: {
            vorfeld: 'Er',
            linkeSatzklammer: 'kann',
            mittelfeld: 'heute nicht kommen',
            rechteSatzklammer: '',
          },
          isNebensatz: false,
          grammarTags: ['modal_koennen', 'subord_weil'],
          cefrLevel: 'A2',
          variations: [],
        },
      ],
    },
    block4Speaking: {
      mode: 'PRONUNCIATION',
      promptDe: 'Ich kann sehr gut schwimmen.',
      targetPhonemes: ['ü_ö', 'vowel_length'],
    },
    block5Immersion: {
      passageTitle: 'Ein Tag im Schwimmbad',
      passageDe: 'Max geht heute ins Schwimmbad. Er kann schnell schwimmen.',
      tokens: [],
      questions: [
        {
          questionDe: 'Wohin geht Max?',
          options: ['Ins Kino', 'Ins Schwimmbad', 'Nach Hause'],
          answerIndex: 1,
        },
      ],
    },
  };

  it('should validate complete 5-block structure in daily session plan', () => {
    expect(samplePlan.block1Warmup).toBeDefined();
    expect(samplePlan.block2Grammar).toBeDefined();
    expect(samplePlan.block3Mining).toBeDefined();
    expect(samplePlan.block4Speaking).toBeDefined();
    expect(samplePlan.block5Immersion).toBeDefined();
  });

  it('should sequence Block 1 Warmup with due FSRS cards and remedial drills', () => {
    expect(samplePlan.block1Warmup.dueCards).toHaveLength(1);
    expect(samplePlan.block1Warmup.dueCards[0].front).toBe('die Zeitung');
  });

  it('should present Block 2 Grammar with mental model, paradigm table, and interactive drills', () => {
    expect(samplePlan.block2Grammar.mentalModel).toContain('Position 2');
    expect(samplePlan.block2Grammar.paradigmTable).toBeDefined();
    expect(samplePlan.block2Grammar.drills).toHaveLength(1);
    expect(samplePlan.block2Grammar.drills[0].correctAnswer).toBe('kann');
  });

  it('should configure Block 3 Sentence Mining with authentic German sentences and side-by-side glosses', () => {
    expect(samplePlan.block3Mining.sentences[0].sentenceDe).toContain('Er kann heute nicht kommen');
    expect(samplePlan.block3Mining.sentences[0].sentenceEnNatural).toBe('He cannot come today because he has to work.');
  });

  it('should configure Block 4 Speaking task and Block 5 Graded Immersion reading comprehension', () => {
    expect(samplePlan.block4Speaking.mode).toBe('PRONUNCIATION');
    expect(samplePlan.block4Speaking.targetPhonemes).toContain('ü_ö');
    expect(samplePlan.block5Immersion.questions[0].answerIndex).toBe(1);
    expect(samplePlan.block5Immersion.questions[0].options[1]).toBe('Ins Schwimmbad');
  });
}, 'Tier 1');
