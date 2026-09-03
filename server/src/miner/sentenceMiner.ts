import { SentenceAnalysis, TokenGrammar, Gender, GermanCase, POS, TopologicalField, TeKaMoLo, VariationItem } from './types.js';
import { parseSatzklammer } from '../linguistics/satzklammer.js';
import { geminiService, SentenceAnalysisResponseSchema } from '../ai/geminiClient.js';

export class SentenceMinerEngine {
  public static async analyzeSentence(sentenceDe: string, level: string = 'auto'): Promise<SentenceAnalysis> {
    const cleanSentence = sentenceDe.trim();

    // 1. Call structured Gemini AI service (cached via SQLite SHA-256)
    const aiAnalysis = await geminiService.generateStructured<any>({
      prompt: `Perform complete morphological, topological (Satzklammer/V2), and token teardown of this German sentence: "${cleanSentence}". Target CEFR level: ${level}.`,
      responseSchema: SentenceAnalysisResponseSchema,
      cacheType: 'sentence_analysis',
      cacheKeyData: { sentence: cleanSentence, level },
    });

    // 2. Validate topological fields with deterministic Satzklammer parser
    const topo = parseSatzklammer(cleanSentence);

    // 3. Normalize tokens
    let tokens: TokenGrammar[] = [];
    if (aiAnalysis.tokens && Array.isArray(aiAnalysis.tokens) && aiAnalysis.tokens.length > 0) {
      tokens = aiAnalysis.tokens.map((t: any, index: number) => {
        const rawToken = t.surfaceToken || t.token || '';
        const rawPos = (t.pos || 'OTHER').toUpperCase();
        let pos: POS = 'OTHER';
        if (['NOUN', 'VERB', 'ADJ', 'ADV', 'ART', 'PREP', 'PRON', 'CONJ', 'PART'].includes(rawPos)) {
          pos = rawPos as POS;
        } else if (rawPos.includes('NOUN') || rawPos.includes('SUBSTANTIV')) {
          pos = 'NOUN';
        } else if (rawPos.includes('VERB')) {
          pos = 'VERB';
        } else if (rawPos.includes('ADJ')) {
          pos = 'ADJ';
        } else if (rawPos.includes('ADV')) {
          pos = 'ADV';
        } else if (rawPos.includes('ART') || rawPos.includes('DET')) {
          pos = 'ART';
        } else if (rawPos.includes('PREP')) {
          pos = 'PREP';
        } else if (rawPos.includes('PRON')) {
          pos = 'PRON';
        } else if (rawPos.includes('CONJ')) {
          pos = 'CONJ';
        }

        // Determine topological field for token if missing
        let topologicalField: TopologicalField = 'MITTELFELD';
        if (t.topologicalField) {
          topologicalField = t.topologicalField.toUpperCase() as TopologicalField;
        } else {
          if (index === 0 && topo.vorfeld && !topo.isNebensatz) {
            topologicalField = 'VORFELD';
          } else if (topo.linkeSatzklammer.includes(rawToken)) {
            topologicalField = 'LINKE_SATZKLAMMER';
          } else if (topo.rechteSatzklammer.includes(rawToken)) {
            topologicalField = 'RECHTE_SATZKLAMMER';
          }
        }

        return {
          token: rawToken,
          surfaceToken: rawToken,
          lemma: t.lemma || rawToken,
          pos,
          gender: t.gender ? (t.gender.toLowerCase() as Gender) : null,
          case: t.case ? (t.case.toUpperCase() as GermanCase) : null,
          grammaticalNumber: t.grammaticalNumber ? (t.grammaticalNumber.toUpperCase() as any) : null,
          syntaxRole: t.syntaxRole || 'constituent',
          topologicalField,
          tekamoloCategory: t.tekamoloCategory ? (t.tekamoloCategory.toUpperCase() as TeKaMoLo) : null,
          meaningEn: t.meaningEn || '',
          literalGlossEn: t.literalGlossEn || t.meaningEn || '',
        };
      });
    } else {
      // Fallback word tokenization
      const words = cleanSentence.split(/\s+/);
      tokens = words.map((w, idx) => ({
        token: w,
        surfaceToken: w,
        lemma: w.replace(/[,.!?]/g, ''),
        pos: 'OTHER',
        gender: null,
        case: null,
        grammaticalNumber: null,
        syntaxRole: 'constituent',
        topologicalField: idx === 0 ? 'VORFELD' : idx === 1 ? 'LINKE_SATZKLAMMER' : 'MITTELFELD',
        tekamoloCategory: null,
        meaningEn: w,
        literalGlossEn: w,
      }));
    }

    // 4. Extract Variations
    const variations: VariationItem[] = aiAnalysis.variations || [
      { level: 'A1', textDe: cleanSentence, textEn: aiAnalysis.textEnNatural || '' },
      { level: 'A2', textDe: cleanSentence, textEn: aiAnalysis.textEnNatural || '' },
      { level: 'B1', textDe: cleanSentence, textEn: aiAnalysis.textEnNatural || '' },
    ];

    const naturalEn = aiAnalysis.textEnNatural || '';
    const literalEn = aiAnalysis.textEnLiteral || '';

    const result: SentenceAnalysis = {
      sentenceDe: cleanSentence,
      textDe: cleanSentence,
      sentenceEnNatural: naturalEn,
      textEnNatural: naturalEn,
      sentenceEnLiteral: literalEn,
      textEnLiteral: literalEn,
      tokens,
      topologicalMap: {
        vorfeld: topo.vorfeld || aiAnalysis.v2Position1 || '',
        linkeSatzklammer: topo.linkeSatzklammer || aiAnalysis.v2Verb || '',
        mittelfeld: topo.mittelfeld || aiAnalysis.v2Mittelfeld || '',
        rechteSatzklammer: topo.rechteSatzklammer || aiAnalysis.v2VerbFinal || '',
        nachfeld: topo.nachfeld || '',
      },
      isNebensatz: topo.isNebensatz,
      conjunctionTrigger: topo.conjunctionTrigger,
      grammarTags: aiAnalysis.grammarTags || [],
      cefrLevel: (aiAnalysis.cefrLevel || 'A2').toUpperCase() as any,
      variations,
    };

    return result;
  }
}
