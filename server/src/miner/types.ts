export type Gender = 'der' | 'die' | 'das';
export type GermanCase = 'NOMINATIV' | 'AKKUSATIV' | 'DATIV' | 'GENITIV';
export type GrammaticalNumber = 'SINGULAR' | 'PLURAL';
export type POS = 'NOUN' | 'VERB' | 'ADJ' | 'ADV' | 'ART' | 'PREP' | 'PRON' | 'CONJ' | 'PART' | 'OTHER';
export type TopologicalField = 'VORFELD' | 'LINKE_SATZKLAMMER' | 'MITTELFELD' | 'RECHTE_SATZKLAMMER' | 'NACHFELD';
export type TeKaMoLo = 'TEMPORAL' | 'KAUSAL' | 'MODAL' | 'LOKAL';

export interface TokenGrammar {
  token: string;
  surfaceToken?: string;
  lemma: string;
  pos: POS;
  gender?: Gender | null;
  case?: GermanCase | null;
  grammaticalNumber?: GrammaticalNumber | null;
  syntaxRole: string;
  topologicalField: TopologicalField;
  tekamoloCategory?: TeKaMoLo | null;
  meaningEn: string;
  literalGlossEn: string;
}

export interface VariationItem {
  level: 'A1' | 'A2' | 'B1';
  textDe: string;
  textEn: string;
}

export interface SentenceAnalysis {
  sentenceDe: string;
  textDe?: string;
  sentenceEnNatural: string;
  textEnNatural?: string;
  sentenceEnLiteral: string;
  textEnLiteral?: string;
  tokens: TokenGrammar[];
  topologicalMap: {
    vorfeld: string;
    linkeSatzklammer: string;
    mittelfeld: string;
    rechteSatzklammer: string;
    nachfeld?: string;
  };
  isNebensatz: boolean;
  conjunctionTrigger?: string;
  grammarTags: string[];
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  variations: VariationItem[];
}

export interface InterlinearLine {
  tokens: string[];
  literalGlosses: string[];
  posTags: string[];
  naturalEnglish: string;
}
