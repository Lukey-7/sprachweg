import { prisma } from '../db/prisma.js';
import { CardType, Gender } from '../fsrs/types.js';
import { VariationItem } from './types.js';

export interface CreateMinedCardOptions {
  userId: string;
  cardType: CardType | string;
  prompt: string;
  answer: string;
  contextSentence?: string;
  clozeDe?: string;
  gender?: Gender;
  plural?: string;
  wordId?: string;
  sentenceId?: string;
  optionsJson?: string[] | string;
}

export class SentenceCardGenerator {
  public static async createMinedCard(options: CreateMinedCardOptions) {
    const {
      userId,
      cardType,
      prompt,
      answer,
      contextSentence,
      wordId,
      sentenceId,
      optionsJson,
    } = options;

    const normalizedType = (cardType || 'recognition').toLowerCase();
    const cleanPrompt = prompt.trim();
    const cleanAnswer = answer.trim();

    // 1. Check for duplicates per user & type
    const existing = await prisma.card.findFirst({
      where: {
        userId,
        prompt: cleanPrompt,
        cardType: normalizedType,
      },
    });

    if (existing) {
      throw new Error(`Card with prompt "${cleanPrompt}" and type "${normalizedType}" already exists in your deck.`);
    }

    // 2. Format optionsJson
    let formattedOptions: string | undefined;
    if (Array.isArray(optionsJson)) {
      formattedOptions = JSON.stringify(optionsJson);
    } else if (typeof optionsJson === 'string') {
      formattedOptions = optionsJson;
    }

    // 3. Persist new card
    const card = await prisma.card.create({
      data: {
        userId,
        cardType: normalizedType,
        prompt: cleanPrompt,
        answer: cleanAnswer,
        contextSentence,
        optionsJson: formattedOptions,
        wordId,
        sentenceId,
        state: 'new',
        stability: 0,
        difficulty: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        dueAt: new Date(),
      },
    });

    return card;
  }

  public static generateClozeCardData(
    sentenceDe: string,
    targetToken: string,
    meaningEn: string
  ): { front: string; back: string; clozeDe: string } {
    const cleanToken = targetToken.trim();
    const escaped = cleanToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    const front = sentenceDe.replace(regex, `{{c1::${cleanToken}}}`);
    const back = `${cleanToken} (${meaningEn})`;

    return { front, back, clozeDe: cleanToken };
  }

  public static generateGenderDrillData(
    noun: string,
    gender: Gender,
    meaningEn: string
  ): { prompt: string; answer: string; options: string[] } {
    return {
      prompt: `Welcher Artikel gehört zu: "${noun}" (${meaningEn})?`,
      answer: gender,
      options: ['der', 'die', 'das'],
    };
  }

  public static generatePluralDrillData(
    singular: string,
    plural: string,
    meaningEn: string
  ): { prompt: string; answer: string } {
    return {
      prompt: `Was ist die Pluralform von "${singular}" (${meaningEn})?`,
      answer: plural,
    };
  }
}
