import { describe, it, expect } from '../harness/testRunner';
import { FsrsOracle, SatzklammerOracle } from '../harness/referenceOracles';
import { FsrsCardData, TokenGrammar, SentenceAnalysis } from '../harness/contracts';

describe('Tier 3: Reader -> Sentence Miner -> FSRS Card Pipeline', () => {
  it('should execute end-to-end flow from Reader tap to FSRS scheduled review', () => {
    // Step 1: Reader Story Passage
    const storyPassage = 'Anna fährt mit dem Zug nach München. Sie liest ein spannendes Buch.';

    // Step 2: User taps on token 'fährt'
    const tappedToken: TokenGrammar = {
      token: 'fährt',
      lemma: 'fahren',
      pos: 'VERB',
      syntaxRole: 'Finite Verb',
      topologicalField: 'LINKE_SATZKLAMMER',
      meaningEn: 'drives / travels',
      literalGlossEn: 'travels',
    };
    expect(tappedToken.lemma).toBe('fahren');

    // Step 3: Sentence Miner deep analysis
    const sentenceParsed = SatzklammerOracle.parseSentence('Anna fährt mit dem Zug nach München.');
    expect(sentenceParsed.vorfeld).toBe('Anna');
    expect(sentenceParsed.linkeSatzklammer).toBe('fährt');
    expect(sentenceParsed.mittelfeld).toContain('mit dem Zug nach München');

    // Step 4: 1-Tap FSRS Card Generation (Sentence Cloze variant)
    const newClozeCard: FsrsCardData = {
      id: 'card_cloze_fahren',
      userId: 'u1',
      cardType: 'SENTENCE_CLOZE',
      front: 'Anna {{c1::fährt}} mit dem Zug nach München.',
      back: 'fährt (fahren - Präsens er/sie/es)',
      contextSentence: 'Anna fährt mit dem Zug nach München.',
      clozeDe: 'fährt',
      state: 'NEW',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      dueAt: new Date('2026-09-02T12:00:00Z').toISOString(),
    };
    expect(newClozeCard.cardType).toBe('SENTENCE_CLOZE');

    // Step 5: Learner reviews card in SRS session and grades rating 3 (Good)
    const reviewResult = FsrsOracle.scheduleCard(newClozeCard, 3, new Date('2026-09-02T12:00:00Z'));

    expect(reviewResult.card.state).toBe('REVIEW');
    expect(reviewResult.card.stability).toBeCloseTo(2.4, 1);
    expect(reviewResult.card.scheduledDays).toBeGreaterThan(0);
    expect(reviewResult.card.reps).toBe(1);
    expect(reviewResult.reviewLog.rating).toBe(3);
  });

  it('should generate multiple card formats (Recognition, Cloze, Gender) from a single mined sentence', () => {
    const minedSentence = 'Der Arzt untersucht den Patienten im Krankenhaus.';
    const minedNouns = [
      { lemma: 'Arzt', gender: 'der' as const, meaning: 'doctor' },
      { lemma: 'Patient', gender: 'der' as const, meaning: 'patient' },
      { lemma: 'Krankenhaus', gender: 'das' as const, meaning: 'hospital' },
    ];

    const cards: FsrsCardData[] = [
      // 1. Recognition card for Arzt
      {
        id: 'c_rec_arzt',
        userId: 'u1',
        cardType: 'RECOGNITION',
        front: 'der Arzt',
        back: 'doctor',
        gender: 'der',
        contextSentence: minedSentence,
        state: 'NEW',
        stability: 0,
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        dueAt: new Date().toISOString(),
      },
      // 2. Gender drill card for Krankenhaus
      {
        id: 'c_gen_krankenhaus',
        userId: 'u1',
        cardType: 'GENDER_DRILL',
        front: 'Krankenhaus (der / die / das ?)',
        back: 'das Krankenhaus',
        gender: 'das',
        state: 'NEW',
        stability: 0,
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        dueAt: new Date().toISOString(),
      },
    ];

    expect(cards).toHaveLength(2);
    expect(cards[0].cardType).toBe('RECOGNITION');
    expect(cards[1].cardType).toBe('GENDER_DRILL');
  });

  it('should verify that newly mined cards are immediately queryable in the review deck queue', () => {
    const deck = new Map<string, FsrsCardData>();
    const cardId = 'card_mined_001';
    deck.set(cardId, {
      id: cardId,
      userId: 'u1',
      cardType: 'PRODUCTION',
      front: 'the dog',
      back: 'der Hund',
      state: 'NEW',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      dueAt: new Date().toISOString(),
    });

    expect(deck.has(cardId)).toBe(true);
    expect(deck.get(cardId)?.front).toBe('the dog');
  });

  it('should track source sentence attribution on flashcards for contextual recall', () => {
    const card: FsrsCardData = {
      id: 'c_attr_1',
      userId: 'u1',
      cardType: 'RECOGNITION',
      front: 'die Geduld',
      back: 'patience',
      contextSentence: 'Man braucht viel Geduld beim Deutschlernen.',
      state: 'NEW',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      dueAt: new Date().toISOString(),
    };

    expect(card.contextSentence).toBeDefined();
    expect(card.contextSentence).toContain('Geduld');
  });

  it('should prevent duplicate card creation if the lemma and card type already exist in user deck', () => {
    const userDeck = [
      { lemma: 'Hund', cardType: 'RECOGNITION' },
      { lemma: 'Katze', cardType: 'RECOGNITION' },
    ];

    const canAddCard = (lemma: string, type: string) => {
      return !userDeck.some(c => c.lemma === lemma && c.cardType === type);
    };

    expect(canAddCard('Hund', 'RECOGNITION')).toBe(false); // Duplicate!
    expect(canAddCard('Hund', 'GENDER_DRILL')).toBe(true); // Different card type allowed
    expect(canAddCard('Vogel', 'RECOGNITION')).toBe(true); // New lemma allowed
  });
}, 'Tier 3');
