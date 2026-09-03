import { SentenceAnalysis, TokenGrammar, Gender } from './types.js';

export const GENDER_COLORS: Record<Gender | 'diePlural', string> = {
  der: '#2563eb',       // Blue
  die: '#dc2626',       // Red
  das: '#16a34a',       // Green
  diePlural: '#9333ea', // Purple
};

export interface InterlinearColumn {
  index: number;
  token: string;
  lemma: string;
  pos: string;
  gender?: Gender | null;
  genderColor?: string;
  case?: string | null;
  syntaxRole: string;
  topologicalField: string;
  literalGloss: string;
  meaningEn: string;
}

export interface InterlinearLayout {
  sentenceDe: string;
  naturalEnglish: string;
  literalEnglish: string;
  columns: InterlinearColumn[];
}

export class InterlinearGenerator {
  public static generateLayout(analysis: SentenceAnalysis): InterlinearLayout {
    const columns: InterlinearColumn[] = analysis.tokens.map((token, index) => {
      let genderColor: string | undefined;
      if (token.gender) {
        if (token.grammaticalNumber === 'PLURAL') {
          genderColor = GENDER_COLORS.diePlural;
        } else {
          genderColor = GENDER_COLORS[token.gender];
        }
      }

      return {
        index,
        token: token.token,
        lemma: token.lemma,
        pos: token.pos,
        gender: token.gender,
        genderColor,
        case: token.case,
        syntaxRole: token.syntaxRole,
        topologicalField: token.topologicalField,
        literalGloss: token.literalGlossEn || token.meaningEn,
        meaningEn: token.meaningEn,
      };
    });

    return {
      sentenceDe: analysis.sentenceDe,
      naturalEnglish: analysis.sentenceEnNatural,
      literalEnglish: analysis.sentenceEnLiteral,
      columns,
    };
  }
}
