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
    // Topological fields describe the MAIN clause. A leading subordinate clause fills the Vorfeld.
    v2Position1: { type: Type.STRING, description: 'Vorfeld of the main clause (may be a whole subordinate clause).' },
    v2Verb: { type: Type.STRING, description: 'Finite verb of the main clause (linke Satzklammer).' },
    v2Mittelfeld: { type: Type.STRING, description: 'Mittelfeld of the main clause.' },
    v2VerbFinal: { type: Type.STRING, description: 'Rechte Satzklammer of the main clause only (participle, infinitive, separable prefix). Empty if none. Never a verb from a subordinate clause.' },
    isNebensatz: { type: Type.BOOLEAN, description: 'True if the sentence contains a subordinate clause.' },
    conjunctionTrigger: { type: Type.STRING, description: 'The subordinating conjunction, if any.' },
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
    gender: { type: Type.STRING, description: 'For nouns exactly one of: der, die, das. Empty for other parts of speech.' },
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
        partizipII: { type: Type.STRING },
        governedPreposition: { type: Type.STRING },
        governedCase: { type: Type.STRING },
        praesens: {
          type: Type.OBJECT,
          properties: {
            ich: { type: Type.STRING },
            du: { type: Type.STRING },
            er_sie_es: { type: Type.STRING },
            wir: { type: Type.STRING },
            ihr: { type: Type.STRING },
            sie_Sie: { type: Type.STRING },
          },
        },
        praeteritum: {
          type: Type.OBJECT,
          properties: {
            ich: { type: Type.STRING },
            du: { type: Type.STRING },
            er_sie_es: { type: Type.STRING },
            wir: { type: Type.STRING },
            ihr: { type: Type.STRING },
            sie_Sie: { type: Type.STRING },
          },
        },
      },
    },
    examples: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          de: { type: Type.STRING },
          en: { type: Type.STRING },
        },
        required: ['de', 'en'],
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
    overallScore: { type: Type.NUMBER, description: 'Integer from 0 to 100.' },
    fluencyScore: { type: Type.NUMBER, description: 'Integer from 0 to 100.' },
    accuracyScore: { type: Type.NUMBER, description: 'Integer from 0 to 100.' },
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
          lemma: { type: Type.STRING, description: 'Dictionary form without an article.' },
          gender: { type: Type.STRING, description: 'For nouns exactly one of: der, die, das. Empty otherwise.' },
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

export const PROMPT_VERSION = 3;

/**
 * gemini-2.5-flash is retired for new keys and capped at 20 free requests/day.
 * Measured on this app's four tasks, gemini-3.5-flash-lite answered correctly in ~2-3s
 * (gemini-3.5-flash: 8-24s and frequent "high demand" errors).
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

/**
 * Marks every property of a response schema as required. Lighter models silently omit
 * optional nested objects (declension and conjugation tables); requiring them, with
 * empty strings where a field doesn't apply, makes the output complete.
 */
export function requireAllFields<T>(schema: T): T {
  const walk = (node: any): any => {
    if (!node || typeof node !== 'object') return node;
    const out: any = { ...node };
    if (out.properties) {
      out.properties = Object.fromEntries(Object.entries(out.properties).map(([k, v]) => [k, walk(v)]));
      out.required = Object.keys(out.properties);
    }
    if (out.items) out.items = walk(out.items);
    return out;
  };
  return walk(schema);
}

/** Upper bound for one Gemini call; a stalled generation becomes a retryable error. */
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 25_000; // under the 30s Vercel function limit
const GEMINI_THINKING_BUDGET = Number(process.env.GEMINI_THINKING_BUDGET ?? 512);

/** Short, learner-readable reason for a failed Gemini call (the raw error is a JSON blob). */
export function describeGeminiError(err: any): string {
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
    return `The AI took longer than ${GEMINI_TIMEOUT_MS / 1000}s.`;
  }
  const raw = String(err?.message ?? '');
  if (/RESOURCE_EXHAUSTED|quota|429/i.test(raw)) {
    const perDay = /PerDay/i.test(raw);
    const limit = raw.match(/quotaValue\\?"\s*:\s*\\?"(\d+)/)?.[1];
    return perDay
      ? `Daily AI limit reached${limit ? ` (${limit} requests/day on the free tier)` : ''}. It resets at midnight Pacific time.`
      : 'Too many AI requests in a short time. Wait a minute and try again.';
  }
  if (/high demand|UNAVAILABLE|503/i.test(raw)) return 'The AI service is busy right now. Try again in a moment.';
  if (/API key|PERMISSION_DENIED|403|401/i.test(raw)) return 'The Gemini API key was rejected. Check GEMINI_API_KEY.';
  return raw.match(/"message"\s*:\s*"([^"]{1,200})/)?.[1] ?? (raw.slice(0, 200) || 'AI request failed.');
}

export class GeminiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiUnavailableError';
  }
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

  /** True when responses are canned (no key, MOCK_GEMINI=true, or tests). */
  public get isMockMode(): boolean {
    return this.isOfflineMockMode || !this.client;
  }

  public async generateStructured<T>(options: GeminiGenerateOptions<T>): Promise<T> {
    // Mock responses ignore the input, so they are never cached: caching them
    // would keep serving canned data for that input after a real key is added.
    if (this.isMockMode) {
      return this.generateOfflineMock<T>(options.prompt, options.responseSchema);
    }

    // Versioned so that prompt or schema changes don't keep serving answers produced by
    // the old ones. Bump PROMPT_VERSION whenever a prompt or response schema changes.
    const cacheType = `${options.cacheType || 'generic_gemini'}:v${PROMPT_VERSION}`;
    const cacheInput = options.cacheKeyData || { prompt: options.prompt, systemInstruction: options.systemInstruction };

    const cached = await sqliteCache.get<T>(cacheType, cacheInput);
    if (cached) {
      return cached;
    }

    const model = options.model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    let resultPayload: T;
    try {
      const response = await this.client!.models.generateContent({
        model,
        contents: options.prompt,
        config: {
          systemInstruction: options.systemInstruction || GERMAN_LINGUISTIC_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: requireAllFields(options.responseSchema) as any,
          temperature: options.temperature ?? 0.2,
          // gemini-2.5 models stall on these schemas with no thinking and occasionally with
          // unbounded thinking; a small fixed budget was reliable. Newer models are fast as-is.
          ...(/2\.5/.test(model) && { thinkingConfig: { thinkingBudget: GEMINI_THINKING_BUDGET } }),
          maxOutputTokens: 8192,
          abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Gemini returned an empty response.');
      }
      resultPayload = JSON.parse(text) as T;
    } catch (err: any) {
      // Surface the failure. Substituting mock data here would show the learner a
      // confident analysis of a different sentence.
      throw new GeminiUnavailableError(describeGeminiError(err));
    }

    // Only successful live responses are cached.
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
