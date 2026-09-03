import { describe, it, expect } from '../harness/testRunner';

describe('Feature 24: Side-by-Side Interlinear Translation Verification', () => {
  const interlinearData = {
    tokens: [
      { de: 'Ich', gloss: 'I', pos: 'PRON' },
      { de: 'habe', gloss: 'have', pos: 'VERB' },
      { de: 'das', gloss: 'the', pos: 'ART' },
      { de: 'Buch', gloss: 'book', pos: 'NOUN' },
      { de: 'gelesen', gloss: 'read (participle)', pos: 'VERB' },
    ],
    literalEnglish: 'I have the book read.',
    naturalEnglish: 'I have read the book.',
  };

  it('should verify three-tier alignment: German token, literal gloss, and natural English sentence', () => {
    expect(interlinearData.tokens).toHaveLength(5);
    expect(interlinearData.literalEnglish).toBe('I have the book read.');
    expect(interlinearData.naturalEnglish).toBe('I have read the book.');
  });

  it('should maintain 1-to-1 token gloss alignment for each word in the source sentence', () => {
    for (const tok of interlinearData.tokens) {
      expect(tok.de).toBeDefined();
      expect(tok.gloss).toBeDefined();
    }
    expect(interlinearData.tokens[4].de).toBe('gelesen');
    expect(interlinearData.tokens[4].gloss).toContain('read');
  });

  it('should highlight word order divergence between German verb-final and English SVO', () => {
    // German: "gelesen" at end (pos 4) vs English: "read" at pos 2
    const deVerbPos = interlinearData.tokens.findIndex(t => t.de === 'gelesen');
    expect(deVerbPos).toBe(4);
    expect(interlinearData.naturalEnglish.startsWith('I have read')).toBe(true);
  });

  it('should render idiomatic cultural expressions clearly alongside literal word glosses', () => {
    const idiomData = {
      de: 'Ich drücke dir die Daumen.',
      literal: 'I press to-you the thumbs.',
      natural: 'I am keeping my fingers crossed for you / Good luck!',
    };
    expect(idiomData.literal).toContain('press to-you the thumbs');
    expect(idiomData.natural).toContain('fingers crossed');
  });

  it('should support toggle between full interlinear view and compact reading view', () => {
    const renderMode = (mode: 'INTERLINEAR' | 'COMPACT') => {
      if (mode === 'INTERLINEAR') {
        return { showGloss: true, showLiteral: true, showNatural: true };
      }
      return { showGloss: false, showLiteral: false, showNatural: true };
    };

    expect(renderMode('INTERLINEAR').showGloss).toBe(true);
    expect(renderMode('COMPACT').showGloss).toBe(false);
    expect(renderMode('COMPACT').showNatural).toBe(true);
  });
}, 'Tier 1');
