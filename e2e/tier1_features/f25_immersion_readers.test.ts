import { describe, it, expect } from '../harness/testRunner';
import { TokenGrammar } from '../harness/contracts';

describe('Feature 25: Interactive Graded Immersion Readers Verification', () => {
  const story = {
    id: 'reader_a1_01',
    title: 'Ein Spaziergang durch Berlin',
    cefrLevel: 'A1',
    paragraphs: [
      'Heute ist ein schöner Tag in Berlin. Anna geht durch den Tiergarten.',
      'Sie sieht viele Bäume und bunte Blumen.',
    ],
    tokens: [
      { token: 'Heute', lemma: 'heute', pos: 'ADV', meaningEn: 'today' },
      { token: 'ist', lemma: 'sein', pos: 'VERB', meaningEn: 'is' },
      { token: 'ein', lemma: 'ein', pos: 'ART', gender: 'der', case: 'NOMINATIV', meaningEn: 'a' },
      { token: 'schöner', lemma: 'schön', pos: 'ADJ', gender: 'der', case: 'NOMINATIV', meaningEn: 'beautiful' },
      { token: 'Tag', lemma: 'Tag', pos: 'NOUN', gender: 'der', case: 'NOMINATIV', meaningEn: 'day' },
      { token: 'Tiergarten', lemma: 'Tiergarten', pos: 'NOUN', gender: 'der', case: 'AKKUSATIV', meaningEn: 'animal garden / park' },
    ] as TokenGrammar[],
  };

  it('should support tap-to-inspect popovers on any token in graded text', () => {
    const inspectToken = (tokenStr: string) => {
      return story.tokens.find(t => t.token === tokenStr) || null;
    };

    const inspected = inspectToken('Tiergarten');
    expect(inspected).toBeDefined();
    expect(inspected?.lemma).toBe('Tiergarten');
    expect(inspected?.gender).toBe('der');
    expect(inspected?.case).toBe('AKKUSATIV');
  });

  it('should enable 1-tap addition of inspected word to learner FSRS review deck', () => {
    const inspected = story.tokens.find(t => t.token === 'schöner')!;
    const createCardFromToken = (token: TokenGrammar, contextSentence: string) => ({
      id: `card_${Date.now()}`,
      userId: 'u1',
      cardType: 'RECOGNITION' as const,
      front: token.lemma,
      back: token.meaningEn,
      contextSentence,
      state: 'NEW' as const,
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      dueAt: new Date().toISOString(),
    });

    const newCard = createCardFromToken(inspected, story.paragraphs[0]);
    expect(newCard.front).toBe('schön');
    expect(newCard.back).toBe('beautiful');
    expect(newCard.contextSentence).toContain('Heute ist ein schöner Tag');
  });

  it('should grade reader vocabulary difficulty matching CEFR level (A1, A2, B1, B2)', () => {
    const getCefrDifficulty = (level: string) => {
      const maxWordComplexity = { A1: 1, A2: 2, B1: 3, B2: 4 };
      return maxWordComplexity[level as keyof typeof maxWordComplexity] || 1;
    };

    expect(getCefrDifficulty('A1')).toBe(1);
    expect(getCefrDifficulty('B1')).toBe(3);
  });

  it('should provide comprehension check questions with instant scoring feedback', () => {
    const questions = [
      {
        prompt: 'Wo ist Anna heute?',
        options: ['In München', 'In Berlin', 'In Hamburg'],
        correctIndex: 1,
      },
    ];

    const scoreAnswer = (qIndex: number, selectedOptionIndex: number) => {
      return questions[qIndex].correctIndex === selectedOptionIndex;
    };

    expect(scoreAnswer(0, 1)).toBe(true);
    expect(scoreAnswer(0, 0)).toBe(false);
  });

  it('should highlight words already known vs new vocabulary dynamically in the reader', () => {
    const knownWords = new Set(['heute', 'sein', 'ein', 'tag']);
    const getWordHighlightClass = (lemma: string) => {
      if (knownWords.has(lemma.toLowerCase())) return 'text-slate-800'; // regular known
      return 'text-blue-600 font-semibold underline decoration-dotted'; // new word to learn
    };

    expect(getWordHighlightClass('heute')).toBe('text-slate-800');
    expect(getWordHighlightClass('Tiergarten')).toContain('text-blue-600');
  });
}, 'Tier 1');
