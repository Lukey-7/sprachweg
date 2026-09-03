import { GoogleGenAI, Type } from '@google/genai';
import { sqliteCache } from '../cache/sqliteCache.js';

export const GERMAN_LINGUISTIC_SYSTEM_PROMPT = `
You are an expert computational German linguist, lexicographer, and CEFR pedagogue for the Sprachweg platform.
Always adhere strictly to these principles:
1. Precise grammatical categorization: 4 cases (Nominativ, Akkusativ, Dativ, Genitiv), 3 genders (der=masculine, die=feminine, das=neuter), plural forms with umlauts.
2. Topological field analysis: Vorfeld (Position 1), Linke Satzklammer (Position 2 finite verb), Mittelfeld (TeKaMoLo: Temporal, Kausal, Modal, Lokal), Rechte Satzklammer (Verb-Ende / separable prefix / participle), Nachfeld.
3. Subordinate clauses (Nebensätze): identify subordinating conjunction triggers (weil, dass, wenn, obwohl, etc.) and ensure finite verb is placed strictly at the clause end.
4. Auxiliary selection: accurate categorization of Perfekt auxiliary verbs (haben vs. sein).
5. Preposition governance: accurate case binding (Akkusativ, Dativ, Genitiv, or Wechselpräpositionen with Wo/Wohin rules).
6. Provide natural and literal English glosses side-by-side.
Always respond with valid JSON matching the exact requested responseSchema.
`;

// Schema 1: Sentence Teardown & Satzklammer Analysis
export const SentenceAnalysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    textDe: { type: Type.STRING },
    textEnNatural: { type: Type.STRING },
    textEnLiteral: { type: Type.STRING },
    cefrLevel: { type: Type.STRING },
    v2Position1: { type: Type.STRING },
    v2Verb: { type: Type.STRING },
    v2Mittelfeld: { type: Type.STRING },
    v2VerbFinal: { type: Type.STRING },
    isNebensatz: { type: Type.BOOLEAN },
    conjunctionTrigger: { type: Type.STRING },
    grammarTags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    tokens: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.INTEGER },
          surfaceToken: { type: Type.STRING },
          lemma: { type: Type.STRING },
          pos: { type: Type.STRING },
          gender: { type: Type.STRING },
          case: { type: Type.STRING },
          syntaxRole: { type: Type.STRING },
          declensionTrigger: { type: Type.STRING },
          meaningEn: { type: Type.STRING },
        },
        required: ['index', 'surfaceToken', 'lemma', 'pos', 'meaningEn'],
      },
    },
    variations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.STRING },
          textDe: { type: Type.STRING },
          textEn: { type: Type.STRING },
        },
        required: ['level', 'textDe', 'textEn'],
      },
    },
  },
  required: ['textDe', 'textEnNatural', 'textEnLiteral', 'cefrLevel', 'v2Position1', 'v2Verb', 'v2Mittelfeld', 'tokens'],
};

// Schema 2: Comprehensive Dictionary Word Entry
export const WordLookupResponseSchema = {
  type: Type.OBJECT,
  properties: {
    lemma: { type: Type.STRING },
    pos: { type: Type.STRING },
    gender: { type: Type.STRING },
    cefrLevel: { type: Type.STRING },
    ipa: { type: Type.STRING },
    meaningEn: { type: Type.STRING },
    secondaryMeanings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    disambiguation: { type: Type.STRING },
    falseFriends: { type: Type.STRING },
    isCompound: { type: Type.BOOLEAN },
    compoundParts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          part: { type: Type.STRING },
          meaningEn: { type: Type.STRING },
          isFugenelement: { type: Type.BOOLEAN },
        },
        required: ['part', 'meaningEn'],
      },
    },
    collocations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    idioms: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    declensions: {
      type: Type.OBJECT,
      properties: {
        nominativSg: { type: Type.STRING },
        akkusativSg: { type: Type.STRING },
        dativSg: { type: Type.STRING },
        genitivSg: { type: Type.STRING },
        nominativPl: { type: Type.STRING },
        akkusativPl: { type: Type.STRING },
        dativPl: { type: Type.STRING },
        genitivPl: { type: Type.STRING },
      },
    },
    conjugations: {
      type: Type.OBJECT,
      properties: {
        auxiliary: { type: Type.STRING },
        praesens3sg: { type: Type.STRING },
        praeteritum3sg: { type: Type.STRING },
        perfekt3sg: { type: Type.STRING },
        konjunktiv2_3sg: { type: Type.STRING },
        imperativDu: { type: Type.STRING },
      },
    },
  },
  required: ['lemma', 'pos', 'cefrLevel', 'meaningEn'],
};

// Schema 3: Drill Generation
export const DrillGenerationResponseSchema = {
  type: Type.OBJECT,
  properties: {
    topicSlug: { type: Type.STRING },
    cefrLevel: { type: Type.STRING },
    drills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          drillId: { type: Type.STRING },
          drillType: { type: Type.STRING }, // reorder, cloze, transform, error_spotting
          promptDe: { type: Type.STRING },
          promptEn: { type: Type.STRING },
          tokensOrOptions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING },
          grammarTag: { type: Type.STRING },
        },
        required: ['drillId', 'drillType', 'promptDe', 'correctAnswer', 'explanation'],
      },
    },
  },
  required: ['topicSlug', 'cefrLevel', 'drills'],
};

// Schema 4: Speaking Evaluation & Debrief
export const SpeakingEvaluationResponseSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER },
    fluencyScore: { type: Type.NUMBER },
    accuracyScore: { type: Type.NUMBER },
    successes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    corrections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalSnippet: { type: Type.STRING },
          correctedSnippet: { type: Type.STRING },
          ruleExplanation: { type: Type.STRING },
          errorCategory: { type: Type.STRING },
        },
        required: ['originalSnippet', 'correctedSnippet', 'ruleExplanation'],
      },
    },
    minedVocabulary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          lemma: { type: Type.STRING },
          gender: { type: Type.STRING },
          meaningEn: { type: Type.STRING },
          exampleUsageDe: { type: Type.STRING },
        },
        required: ['lemma', 'meaningEn'],
      },
    },
  },
  required: ['overallScore', 'successes', 'corrections', 'minedVocabulary'],
};

export interface GeminiGenerateOptions<T> {
  prompt: string;
  systemInstruction?: string;
  responseSchema: object;
  temperature?: number;
  cacheType?: string;
  cacheKeyData?: string | object;
  model?: string;
}

export class GeminiService {
  private client: GoogleGenAI | null = null;
  private isOfflineMockMode: boolean = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey || process.env.MOCK_GEMINI === 'true' || process.env.NODE_ENV === 'test') {
      this.isOfflineMockMode = true;
      console.log('GeminiService initialized in OFFLINE MOCK MODE.');
    } else {
      this.client = new GoogleGenAI({ apiKey });
      console.log('GeminiService initialized with Google GenAI SDK.');
    }
  }

  public async generateStructured<T>(options: GeminiGenerateOptions<T>): Promise<T> {
    const cacheType = options.cacheType || 'generic_gemini';
    const cacheInput = options.cacheKeyData || { prompt: options.prompt, systemInstruction: options.systemInstruction };

    // 1. Check SQLite Hash-Keyed Cache
    const cached = await sqliteCache.get<T>(cacheType, cacheInput);
    if (cached) {
      return cached;
    }

    // 2. Offline Fallback or Live API Call
    let resultPayload: T;
    if (this.isOfflineMockMode || !this.client) {
      resultPayload = this.generateOfflineMock<T>(options.prompt, options.responseSchema);
    } else {
      try {
        const response = await this.client.models.generateContent({
          model: options.model || 'gemini-2.5-flash',
          contents: options.prompt,
          config: {
            systemInstruction: options.systemInstruction || GERMAN_LINGUISTIC_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            responseSchema: options.responseSchema as any,
            temperature: options.temperature ?? 0.2,
          },
        });

        const text = response.text;
        if (!text) {
          throw new Error('Gemini returned empty response text.');
        }
        resultPayload = JSON.parse(text) as T;
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to deterministic offline mock:', err?.message);
        resultPayload = this.generateOfflineMock<T>(options.prompt, options.responseSchema);
      }
    }

    // 3. Store in SQLite Cache
    await sqliteCache.set<T>(cacheType, cacheInput, resultPayload);
    return resultPayload;
  }

  private generateOfflineMock<T>(prompt: string, schema: object): T {
    const p = prompt.toLowerCase();

    // 1. Drill Generation Mock
    if (schema === DrillGenerationResponseSchema || p.includes('drill') || p.includes('exercise')) {
      return {
        topicSlug: 'satzklammer-v2',
        cefrLevel: 'A1',
        drills: [
          {
            drillId: 'drill-v2-01',
            drillType: 'reorder',
            promptDe: 'Heute / der Mann / kauft / einen Apfel',
            promptEn: 'Today the man buys an apple.',
            tokensOrOptions: ['Heute', 'kauft', 'der Mann', 'einen Apfel.'],
            correctAnswer: 'Heute kauft der Mann einen Apfel.',
            explanation: 'V2 Rule: When "Heute" is in Vorfeld (Position 1), the verb "kauft" must immediately follow in Position 2.',
            grammarTag: 'v2_word_order',
          },
          {
            drillId: 'drill-v2-02',
            drillType: 'cloze',
            promptDe: 'Der Mann ___ jeden Morgen Kaffee. (trinken)',
            promptEn: 'The man drinks coffee every morning.',
            tokensOrOptions: ['trinkt', 'trinken', 'trinke', 'trank'],
            correctAnswer: 'trinkt',
            explanation: 'Subject "Der Mann" is 3rd person singular, requiring the verb ending "-t" (trinkt).',
            grammarTag: 'verb_conjugation_3sg',
          },
        ],
      } as unknown as T;
    }

    // 2. Speaking Evaluation Mock
    if (schema === SpeakingEvaluationResponseSchema || p.includes('speaking') || p.includes('transcript') || p.includes('evaluate')) {
      return {
        overallScore: 88.5,
        fluencyScore: 85.0,
        accuracyScore: 92.0,
        successes: [
          'Correct V2 verb position maintained throughout the turn.',
          'Accurate usage of Akkusativ direct object ("einen Kaffee").',
          'Clear pronunciation of umlaut vowel /øː/ in "hören".',
        ],
        corrections: [
          {
            originalSnippet: 'Ich habe gefahrt',
            correctedSnippet: 'Ich bin gefahren',
            ruleExplanation: 'Verbs of motion (fahren) take "sein" as auxiliary in the Perfekt tense, and "fahren" has the irregular participle "gefahren".',
            errorCategory: 'auxiliary_selection',
          },
          {
            originalSnippet: 'mit die Frau',
            correctedSnippet: 'mit der Frau',
            ruleExplanation: 'The preposition "mit" strictly governs the Dativ case (die Frau -> der Frau).',
            errorCategory: 'preposition_dative',
          },
          {
            originalSnippet: 'weil ich will gehen',
            correctedSnippet: 'weil ich gehen will',
            ruleExplanation: 'In subordinate clauses introduced by "weil", the finite modal verb must be placed at the very end of the clause.',
            errorCategory: 'word_order_nebensatz',
          },
        ],
        minedVocabulary: [
          { lemma: 'aussteigen', gender: null, meaningEn: 'to exit / get off (transport)', exampleUsageDe: 'Ich muss an der nächsten Haltestelle aussteigen.' },
          { lemma: 'Verspätung', gender: 'die', meaningEn: 'delay', exampleUsageDe: 'Der Zug hat zehn Minuten Verspätung.' },
          { lemma: 'Fahrkarte', gender: 'die', meaningEn: 'ticket', exampleUsageDe: 'Haben Sie eine gültige Fahrkarte?' },
          { lemma: 'umsteigen', gender: null, meaningEn: 'to transfer / change trains', exampleUsageDe: 'Wir müssen in Frankfurt umsteigen.' },
          { lemma: 'Gleis', gender: 'das', meaningEn: 'track / platform', exampleUsageDe: 'Der Zug fährt von Gleis 4 ab.' },
        ],
      } as unknown as T;
    }

    // 3. Word Lookup Mock
    if (schema === WordLookupResponseSchema || p.includes('dictionary') || p.includes('lookup word') || p.includes('geschwindig')) {
      return {
        lemma: 'Geschwindigkeit',
        pos: 'noun',
        gender: 'die',
        cefrLevel: 'B1',
        ipa: '/ɡəˈʃvɪndɪçkaɪ̯t/',
        meaningEn: 'speed, velocity',
        secondaryMeanings: ['quickness', 'pace'],
        disambiguation: 'Refers to physical velocity, distinct from "Eile" (hurry/urgency).',
        falseFriends: 'None',
        isCompound: true,
        compoundParts: [
          { part: 'geschwind', meaningEn: 'swift/fast', isFugenelement: false },
          { part: '-ig-', meaningEn: 'adjective suffix', isFugenelement: false },
          { part: '-keit', meaningEn: 'noun suffix forming feminine nouns', isFugenelement: false },
        ],
        collocations: ['hohe Geschwindigkeit', 'die Geschwindigkeit messen', 'mit Lichtgeschwindigkeit'],
        idioms: [],
        declensions: {
          nominativSg: 'die Geschwindigkeit',
          akkusativSg: 'die Geschwindigkeit',
          dativSg: 'der Geschwindigkeit',
          genitivSg: 'der Geschwindigkeit',
          nominativPl: 'die Geschwindigkeiten',
          akkusativPl: 'die Geschwindigkeiten',
          dativPl: 'den Geschwindigkeiten',
          genitivPl: 'der Geschwindigkeiten',
        },
        conjugations: undefined,
      } as unknown as T;
    }

    // 4. Sentence Teardown Mock
    if (schema === SentenceAnalysisResponseSchema || p.includes('sentence') || p.includes('satzklammer') || p.includes('teardown') || p.includes('morphological')) {
      return {
        textDe: 'Heute kauft der Mann im Supermarkt einen frischen Apfel, weil er Hunger hat.',
        textEnNatural: 'Today the man buys a fresh apple in the supermarket because he is hungry.',
        textEnLiteral: 'Today buys the man in the supermarket a fresh apple, because he hunger has.',
        cefrLevel: 'A2',
        v2Position1: 'Heute',
        v2Verb: 'kauft',
        v2Mittelfeld: 'der Mann im Supermarkt einen frischen Apfel',
        v2VerbFinal: '',
        isNebensatz: true,
        conjunctionTrigger: 'weil',
        grammarTags: ['v2_word_order', 'accusative_object', 'subordinating_conjunction_weil', 'tekamolo'],
        tokens: [
          { index: 0, surfaceToken: 'Heute', lemma: 'heute', pos: 'adverb', meaningEn: 'today', syntaxRole: 'temporal_adverbial' },
          { index: 1, surfaceToken: 'kauft', lemma: 'kaufen', pos: 'verb', meaningEn: 'buys', syntaxRole: 'finite_verb' },
          { index: 2, surfaceToken: 'der', lemma: 'der', pos: 'article', gender: 'der', case: 'nominativ', meaningEn: 'the', syntaxRole: 'subject_article' },
          { index: 3, surfaceToken: 'Mann', lemma: 'Mann', pos: 'noun', gender: 'der', case: 'nominativ', meaningEn: 'man', syntaxRole: 'subject' },
          { index: 4, surfaceToken: 'im', lemma: 'in', pos: 'preposition', case: 'dativ', meaningEn: 'in the', syntaxRole: 'local_adverbial' },
          { index: 5, surfaceToken: 'Supermarkt', lemma: 'Supermarkt', pos: 'noun', gender: 'der', case: 'dativ', meaningEn: 'supermarket', syntaxRole: 'prep_noun' },
          { index: 6, surfaceToken: 'einen', lemma: 'ein', pos: 'article', gender: 'der', case: 'akkusativ', meaningEn: 'a', syntaxRole: 'object_article' },
          { index: 7, surfaceToken: 'frischen', lemma: 'frisch', pos: 'adjective', case: 'akkusativ', meaningEn: 'fresh', syntaxRole: 'adjective_attribute' },
          { index: 8, surfaceToken: 'Apfel', lemma: 'Apfel', pos: 'noun', gender: 'der', case: 'akkusativ', meaningEn: 'apple', syntaxRole: 'direct_object' },
        ],
        variations: [
          { level: 'A1', textDe: 'Der Mann kauft einen Apfel.', textEn: 'The man buys an apple.' },
          { level: 'A2', textDe: 'Heute kauft der Mann einen frischen Apfel.', textEn: 'Today the man buys a fresh apple.' },
          { level: 'B1', textDe: 'Da der Mann Hunger verspürt, kauft er im Supermarkt einen frischen Apfel.', textEn: 'Since the man feels hungry, he buys a fresh apple in the supermarket.' },
        ],
      } as unknown as T;
    }

    // Default Fallback Mock
    return {
      message: 'Schema matched offline mock',
      timestamp: new Date().toISOString(),
    } as unknown as T;
  }
}

export const geminiService = new GeminiService();
