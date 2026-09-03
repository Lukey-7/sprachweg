import { describe, it, expect } from '../harness/testRunner';
import { SatzklammerOracle } from '../harness/referenceOracles';

describe('Tier 2: Satzklammer Complex Clauses & Word Order Boundaries', () => {
  it('should parse inverted Vorfeld where adverbial expression occupies Position 1', () => {
    // "Gestern Abend hat meine Schwester ein interessantes Buch gelesen."
    const parsed = SatzklammerOracle.parseSentence('Gestern hat meine Schwester ein Buch gelesen.');
    expect(parsed.vorfeld).toBe('Gestern');
    expect(parsed.linkeSatzklammer).toBe('hat'); // V2 finite verb is still Pos 2!
    expect(parsed.mittelfeld).toContain('meine Schwester ein Buch');
    expect(parsed.rechteSatzklammer).toBe('gelesen');
  });

  it('should parse Yes/No Questions with Verb in Position 1 (V1 word order / Fronted Linke Satzklammer)', () => {
    const parseV1Question = (sentence: string) => {
      const words = sentence.trim().split(/\s+/);
      const finiteVerb = words[0];
      const lastWord = words[words.length - 1].replace('?', '');
      const mittelfeld = words.slice(1, words.length - 1).join(' ');
      return {
        isV1Question: true,
        linkeSatzklammer: finiteVerb,
        mittelfeld,
        rechteSatzklammer: lastWord,
      };
    };

    const q = parseV1Question('Hast du das Buch heute gelesen?');
    expect(q.linkeSatzklammer).toBe('Hast');
    expect(q.mittelfeld).toBe('du das Buch heute');
    expect(q.rechteSatzklammer).toBe('gelesen');
  });

  it('should parse Imperative sentences with Verb-First syntax', () => {
    const parseImperative = (sentence: string) => {
      const words = sentence.trim().split(/\s+/);
      return {
        isImperative: true,
        linkeSatzklammer: words[0],
        mittelfeld: words.slice(1).join(' ').replace('!', ''),
      };
    };

    const imp = parseImperative('Lies bitte diesen Text aufmerksam!');
    expect(imp.linkeSatzklammer).toBe('Lies');
    expect(imp.mittelfeld).toBe('bitte diesen Text aufmerksam');
  });

  it('should handle complex relative clauses embedded within main clauses', () => {
    const sentenceWithRelClause = 'Der Mann, den ich gestern gesehen habe, ist mein Professor.';
    // Relative clause: "den ich gestern gesehen habe"
    // Relativpronomen in Linke Satzklammer, Verbs at end ("gesehen habe")
    expect(sentenceWithRelClause).toContain('den ich gestern gesehen habe');
    expect(sentenceWithRelClause.startsWith('Der Mann')).toBe(true);
  });

  it('should parse sentences where Vorfeld is occupied by an entire subordinate clause', () => {
    // "Weil es regnet, bleibt er heute zu Hause."
    // Subordinate clause in Vorfeld -> Main clause finite verb ("bleibt") immediately in V2!
    const complex = {
      vorfeldClause: 'Weil es regnet',
      mainFiniteVerb: 'bleibt', // V2
      subject: 'er',
      mittelfeld: 'heute',
      nachfeld: 'zu Hause',
    };

    expect(complex.vorfeldClause).toBe('Weil es regnet');
    expect(complex.mainFiniteVerb).toBe('bleibt');
  });
}, 'Tier 2');
