import { describe, it, expect } from '../harness/testRunner';
import { SentenceAnalysis, TokenGrammar } from '../harness/contracts';

describe('Feature 9: Sentence Miner Word-by-Word Parser Verification', () => {
  const sampleSentenceAnalysis: SentenceAnalysis = {
    sentenceDe: 'Der fleißige Student liest heute ein schweres Buch in der Bibliothek.',
    sentenceEnNatural: 'The diligent student is reading a difficult book in the library today.',
    sentenceEnLiteral: 'The diligent student reads today a heavy book in the library.',
    tokens: [
      {
        token: 'Der',
        lemma: 'der',
        pos: 'ART',
        gender: 'der',
        case: 'NOMINATIV',
        grammaticalNumber: 'SINGULAR',
        syntaxRole: 'Definite Article',
        topologicalField: 'VORFELD',
        meaningEn: 'the',
        literalGlossEn: 'the',
      },
      {
        token: 'fleißige',
        lemma: 'fleißig',
        pos: 'ADJ',
        gender: 'der',
        case: 'NOMINATIV',
        grammaticalNumber: 'SINGULAR',
        syntaxRole: 'Attributive Adjective',
        topologicalField: 'VORFELD',
        meaningEn: 'diligent',
        literalGlossEn: 'diligent',
      },
      {
        token: 'Student',
        lemma: 'Student',
        pos: 'NOUN',
        gender: 'der',
        case: 'NOMINATIV',
        grammaticalNumber: 'SINGULAR',
        syntaxRole: 'Subject',
        topologicalField: 'VORFELD',
        meaningEn: 'student',
        literalGlossEn: 'student',
      },
      {
        token: 'liest',
        lemma: 'lesen',
        pos: 'VERB',
        syntaxRole: 'Finite Predicate Verb',
        topologicalField: 'LINKE_SATZKLAMMER',
        meaningEn: 'reads',
        literalGlossEn: 'reads',
      },
      {
        token: 'heute',
        lemma: 'heute',
        pos: 'ADV',
        syntaxRole: 'Temporal Adverbial',
        topologicalField: 'MITTELFELD',
        tekamoloCategory: 'TEMPORAL',
        meaningEn: 'today',
        literalGlossEn: 'today',
      },
      {
        token: 'ein',
        lemma: 'ein',
        pos: 'ART',
        gender: 'das',
        case: 'AKKUSATIV',
        grammaticalNumber: 'SINGULAR',
        syntaxRole: 'Indefinite Article',
        topologicalField: 'MITTELFELD',
        meaningEn: 'a',
        literalGlossEn: 'a',
      },
      {
        token: 'schweres',
        lemma: 'schwer',
        pos: 'ADJ',
        gender: 'das',
        case: 'AKKUSATIV',
        grammaticalNumber: 'SINGULAR',
        syntaxRole: 'Attributive Adjective',
        topologicalField: 'MITTELFELD',
        meaningEn: 'difficult / heavy',
        literalGlossEn: 'heavy',
      },
      {
        token: 'Buch',
        lemma: 'Buch',
        pos: 'NOUN',
        gender: 'das',
        case: 'AKKUSATIV',
        grammaticalNumber: 'SINGULAR',
        syntaxRole: 'Direct Object',
        topologicalField: 'MITTELFELD',
        meaningEn: 'book',
        literalGlossEn: 'book',
      },
      {
        token: 'in',
        lemma: 'in',
        pos: 'PREP',
        case: 'DATIV',
        syntaxRole: 'Local Preposition',
        topologicalField: 'MITTELFELD',
        tekamoloCategory: 'LOKAL',
        meaningEn: 'in',
        literalGlossEn: 'in',
      },
      {
        token: 'der',
        lemma: 'der',
        pos: 'ART',
        gender: 'die',
        case: 'DATIV',
        grammaticalNumber: 'SINGULAR',
        syntaxRole: 'Definite Article',
        topologicalField: 'MITTELFELD',
        meaningEn: 'the',
        literalGlossEn: 'the',
      },
      {
        token: 'Bibliothek',
        lemma: 'Bibliothek',
        pos: 'NOUN',
        gender: 'die',
        case: 'DATIV',
        grammaticalNumber: 'SINGULAR',
        syntaxRole: 'Dative Object of Preposition',
        topologicalField: 'MITTELFELD',
        tekamoloCategory: 'LOKAL',
        meaningEn: 'library',
        literalGlossEn: 'library',
      },
    ],
    topologicalMap: {
      vorfeld: 'Der fleißige Student',
      linkeSatzklammer: 'liest',
      mittelfeld: 'heute ein schweres Buch in der Bibliothek',
      rechteSatzklammer: '',
    },
    isNebensatz: false,
    grammarTags: ['art_nom_def', 'adj_decl_weak_nom', 'v2_word_order', 'tekamolo_time_place', 'prep_dat_in'],
    cefrLevel: 'A2',
    variations: [
      { level: 'A1', textDe: 'Der Student liest ein Buch.', textEn: 'The student is reading a book.' },
      { level: 'A2', textDe: 'Der Student liest heute in der Bibliothek.', textEn: 'The student reads today in the library.' },
      { level: 'B1', textDe: 'Obwohl es spät ist, liest der fleißige Student ein schweres Buch.', textEn: 'Although it is late, the diligent student is reading a difficult book.' },
    ],
  };

  it('should parse word-level tokens extracting lemma, POS, and contextual meaning', () => {
    const studentToken = sampleSentenceAnalysis.tokens.find(t => t.token === 'Student')!;
    expect(studentToken).toBeDefined();
    expect(studentToken.lemma).toBe('Student');
    expect(studentToken.pos).toBe('NOUN');
    expect(studentToken.gender).toBe('der');
    expect(studentToken.case).toBe('NOMINATIV');
  });

  it('should identify case and declension triggers (e.g. Dativ triggered by "in")', () => {
    const bibToken = sampleSentenceAnalysis.tokens.find(t => t.token === 'Bibliothek')!;
    expect(bibToken).toBeDefined();
    expect(bibToken.case).toBe('DATIV');
    expect(bibToken.gender).toBe('die');
    expect(bibToken.tekamoloCategory).toBe('LOKAL');
  });

  it('should parse topological Satzklammer fields (Vorfeld, Linke Satzklammer, Mittelfeld)', () => {
    expect(sampleSentenceAnalysis.topologicalMap.vorfeld).toBe('Der fleißige Student');
    expect(sampleSentenceAnalysis.topologicalMap.linkeSatzklammer).toBe('liest');
    expect(sampleSentenceAnalysis.topologicalMap.mittelfeld).toContain('heute ein schweres Buch');
  });

  it('should provide both literal word-for-word gloss and natural idiomatic English translations', () => {
    expect(sampleSentenceAnalysis.sentenceEnLiteral).toContain('reads today a heavy book');
    expect(sampleSentenceAnalysis.sentenceEnNatural).toContain('is reading a difficult book in the library today');
  });

  it('should generate 3 CEFR-calibrated sentence variations (A1, A2, B1)', () => {
    expect(sampleSentenceAnalysis.variations).toHaveLength(3);
    const levels = sampleSentenceAnalysis.variations.map(v => v.level);
    expect(levels).toEqual(['A1', 'A2', 'B1']);
    expect(sampleSentenceAnalysis.variations[0].textDe).toBe('Der Student liest ein Buch.');
  });
}, 'Tier 1');
