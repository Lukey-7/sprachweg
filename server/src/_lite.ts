import './env.js';
import { GoogleGenAI } from '@google/genai';
import { WordLookupResponseSchema, SentenceAnalysisResponseSchema, SpeakingEvaluationResponseSchema, GERMAN_LINGUISTIC_SYSTEM_PROMPT } from './ai/geminiClient.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const model = process.argv[2];
const jobs: [string, object, string, (j: any) => string][] = [
  ['dictionary', WordLookupResponseSchema, 'Provide a complete German dictionary entry for "Schlüssel": lemma, gender, meaning, full declension or full Präsens/Präteritum conjugation for all persons, Perfekt auxiliary and Partizip II, and two example sentences.',
    j => `lemma=${j.lemma} gender=${j.gender} datPl=${j.declensions?.dativPl} ex=${j.examples?.length}`],
  ['verb', WordLookupResponseSchema, 'Provide a complete German dictionary entry for "einkaufen": lemma, gender, meaning, full declension or full Präsens/Präteritum conjugation for all persons, Perfekt auxiliary and Partizip II, and two example sentences.',
    j => `aux=${j.conjugations?.auxiliary} P2=${j.conjugations?.partizipII} du=${j.conjugations?.praesens?.du} prät.ich=${j.conjugations?.praeteritum?.ich}`],
  ['miner', SentenceAnalysisResponseSchema, 'Perform complete morphological, topological (Satzklammer/V2), and token teardown of this German sentence: "Obwohl es regnet, gehen wir heute Abend ins Kino." Target CEFR level: A2.',
    j => `EN="${j.textEnNatural}" V="${j.v2Position1}" LSK=${j.v2Verb} MF="${j.v2Mittelfeld}" RSK="${j.v2VerbFinal}" neben=${j.isNebensatz} tokens=${j.tokens?.length}`],
  ['speaking', SpeakingEvaluationResponseSchema, 'Evaluate this spoken German response for mode roleplay. Target text: "Was darf es sein?". Learner transcript: "Ich möchte zwei Brötchen und ein Kaffee, bitte. Ich habe gestern hier gekauft ein Kuchen." Give scores as integers from 0 to 100, up to 3 successes, up to 3 corrections, and up to 5 useful vocabulary words.',
    j => `score=${j.overallScore} fixes=${(j.corrections || []).map((c: any) => c.originalSnippet + '→' + c.correctedSnippet).join('; ')}`],
];
for (const [name, schema, prompt, show] of jobs) {
  const t = Date.now();
  try {
    const r: any = await ai.models.generateContent({
      model, contents: prompt,
      config: { systemInstruction: GERMAN_LINGUISTIC_SYSTEM_PROMPT, responseMimeType: 'application/json', responseSchema: schema as any, temperature: 0.2, maxOutputTokens: 8192, abortSignal: AbortSignal.timeout(30000) },
    });
    console.log(`${name}: ${Date.now() - t}ms | ${show(JSON.parse(r.text || '{}'))}`);
  } catch (e: any) {
    const msg = String(e.message);
    console.log(`${name}: FAILED ${Date.now() - t}ms ${msg.match(/"message":"([^"]{0,200})/)?.[1] ?? msg.slice(0, 200)}${/quota/i.test(msg) ? ' [limit=' + (msg.match(/quotaValue\?":\?"(\d+)/)?.[1] ?? '?') + ']' : ''}`);
  }
}
process.exit(0);
