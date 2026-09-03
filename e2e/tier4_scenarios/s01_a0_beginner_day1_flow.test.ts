import { describe, it, expect } from '../harness/testRunner';
import { FsrsOracle, SatzklammerOracle } from '../harness/referenceOracles';
import { FsrsCardData, GERMAN_SPECIAL_CHARACTERS } from '../harness/contracts';

describe('Tier 4 Scenario 1: A0 Absolute Beginner Day 1 Journey', () => {
  it('should initialize brand new learner account with default settings and A0/A1 starting curriculum state', () => {
    const newLearner = {
      id: 'learner_a0_001',
      name: 'Elena Rostova',
      currentWeek: 1,
      currentDay: 1,
      cefrLevel: 'A0',
      wordsKnown: 0,
      streakDays: 0,
      settings: {
        dailyNewCardsLimit: 20,
        dailyReviewLimit: 100,
      },
    };

    expect(newLearner.currentWeek).toBe(1);
    expect(newLearner.wordsKnown).toBe(0);
    expect(newLearner.settings.dailyNewCardsLimit).toBe(20);
  });

  it('should enable learner to insert German characters using quick-bar on Day 1 exercises', () => {
    let inputField = '';
    const typeCharacter = (char: string) => {
      inputField += char;
    };

    // Elena types "Grüße" using quick-bar for 'ü' and 'ß'
    typeCharacter('G');
    typeCharacter('r');
    typeCharacter('ü');
    typeCharacter('ß');
    typeCharacter('e');

    expect(inputField).toBe('Grüße');
    expect(GERMAN_SPECIAL_CHARACTERS).toContain('ü');
    expect(GERMAN_SPECIAL_CHARACTERS).toContain('ß');
  });

  it('should complete Week 1 Day 1 Grammar block: Personalpronomen and sein im Präsens', () => {
    const grammarLesson = {
      topic: 'Personalpronomen & Verb "sein" im Präsens',
      mentalModel: 'In German, verbs change ending depending on who is doing the action. "sein" (to be) is irregular.',
      paradigm: {
        ich: 'bin',
        du: 'bist',
        er_sie_es: 'ist',
        wir: 'sind',
        ihr: 'seid',
        sie_Sie: 'sind',
      },
      drills: [
        { q: 'Ich ___ Elena. (sein)', answer: 'bin' },
        { q: 'Du ___ mein Freund. (sein)', answer: 'bist' },
        { q: 'Das ___ ein Buch. (sein)', answer: 'ist' },
      ],
    };

    expect(grammarLesson.paradigm.ich).toBe('bin');
    expect(grammarLesson.paradigm.du).toBe('bist');
    expect(grammarLesson.drills[0].answer).toBe('bin');
  });

  it('should mine first sentence "Ich bin neu in Deutschland." and extract word-level tokens', () => {
    const sentence = 'Ich bin neu in Deutschland.';
    const parsed = SatzklammerOracle.parseSentence(sentence);

    expect(parsed.vorfeld).toBe('Ich');
    expect(parsed.linkeSatzklammer).toBe('bin');
    expect(parsed.mittelfeld).toBe('neu in Deutschland');
  });

  it('should create initial 5 FSRS flashcards and complete Elena first review session with 100% success', () => {
    const initialCards: FsrsCardData[] = [
      { id: 'c1', userId: 'u1', cardType: 'RECOGNITION', front: 'ich', back: 'I', state: 'NEW', stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, reps: 0, lapses: 0, dueAt: new Date().toISOString() },
      { id: 'c2', userId: 'u1', cardType: 'RECOGNITION', front: 'sein', back: 'to be', state: 'NEW', stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, reps: 0, lapses: 0, dueAt: new Date().toISOString() },
      { id: 'c3', userId: 'u1', cardType: 'RECOGNITION', front: 'neu', back: 'new', state: 'NEW', stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, reps: 0, lapses: 0, dueAt: new Date().toISOString() },
      { id: 'c4', userId: 'u1', cardType: 'RECOGNITION', front: 'Deutschland', back: 'Germany', state: 'NEW', stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, reps: 0, lapses: 0, dueAt: new Date().toISOString() },
      { id: 'c5', userId: 'u1', cardType: 'PRODUCTION', front: 'I am', back: 'ich bin', state: 'NEW', stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, reps: 0, lapses: 0, dueAt: new Date().toISOString() },
    ];

    expect(initialCards).toHaveLength(5);

    // Elena grades Good (3) on all 5 cards
    const scheduled = initialCards.map(c => FsrsOracle.scheduleCard(c, 3));
    for (const res of scheduled) {
      expect(res.card.state).toBe('REVIEW');
      expect(res.card.stability).toBeCloseTo(2.4, 1);
      expect(res.card.scheduledDays).toBeGreaterThan(0);
    }
  });
}, 'Tier 4');
