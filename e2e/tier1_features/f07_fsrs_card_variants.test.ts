import { describe, it, expect } from '../harness/testRunner';
import { CardType, FsrsCardData } from '../harness/contracts';

describe('Feature 7: 6 FSRS Card Variant Types Verification', () => {
  it('should format and validate Recognition card (DE -> EN)', () => {
    const card: FsrsCardData = {
      id: 'c_rec_1',
      userId: 'u1',
      cardType: 'RECOGNITION',
      front: 'die Geschwindigkeit',
      back: 'speed, velocity',
      gender: 'die',
      state: 'NEW',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      dueAt: '2026-09-02T12:00:00Z',
    };

    expect(card.cardType).toBe('RECOGNITION');
    expect(card.front).toBe('die Geschwindigkeit');
    expect(card.back).toContain('speed');
  });

  it('should format and validate Production card (EN -> DE)', () => {
    const card: FsrsCardData = {
      id: 'c_prod_1',
      userId: 'u1',
      cardType: 'PRODUCTION',
      front: 'the apple',
      back: 'der Apfel',
      gender: 'der',
      state: 'NEW',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      dueAt: '2026-09-02T12:00:00Z',
    };

    expect(card.cardType).toBe('PRODUCTION');
    expect(card.front).toBe('the apple');
    expect(card.back).toBe('der Apfel');
  });

  it('should format and validate Sentence Cloze card with context', () => {
    const card: FsrsCardData = {
      id: 'c_cloze_1',
      userId: 'u1',
      cardType: 'SENTENCE_CLOZE',
      front: 'Ich {{c1::gehe}} jeden Morgen zur Arbeit.',
      back: 'gehe (gehen - Präsens ich)',
      contextSentence: 'Ich gehe jeden Morgen zur Arbeit.',
      clozeDe: 'gehe',
      state: 'NEW',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      dueAt: '2026-09-02T12:00:00Z',
    };

    expect(card.cardType).toBe('SENTENCE_CLOZE');
    expect(card.front).toContain('{{c1::gehe}}');
    expect(card.clozeDe).toBe('gehe');
  });

  it('should format and validate Audio -> Meaning card with audio URL trigger', () => {
    const card: FsrsCardData = {
      id: 'c_audio_1',
      userId: 'u1',
      cardType: 'AUDIO_MEANING',
      front: '[Audio Clip]',
      back: 'das Frühstück (breakfast)',
      audioUrl: 'https://cdn.sprachweg.app/audio/fruehstueck.mp3',
      state: 'NEW',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      dueAt: '2026-09-02T12:00:00Z',
    };

    expect(card.cardType).toBe('AUDIO_MEANING');
    expect(card.audioUrl).toBeDefined();
    expect(card.audioUrl).toContain('fruehstueck.mp3');
  });

  it('should format and validate Targeted Gender Drill and Plural Drill cards', () => {
    const genderCard: FsrsCardData = {
      id: 'c_gen_1',
      userId: 'u1',
      cardType: 'GENDER_DRILL',
      front: 'Mädchen (der / die / das ?)',
      back: 'das Mädchen (Diminutiv auf -chen ist immer Neutrum)',
      gender: 'das',
      state: 'NEW',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      dueAt: '2026-09-02T12:00:00Z',
    };

    const pluralCard: FsrsCardData = {
      id: 'c_plu_1',
      userId: 'u1',
      cardType: 'PLURAL_DRILL',
      front: 'das Buch -> Plural?',
      back: 'die Bücher',
      plural: 'Bücher',
      state: 'NEW',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      dueAt: '2026-09-02T12:00:00Z',
    };

    expect(genderCard.cardType).toBe('GENDER_DRILL');
    expect(genderCard.gender).toBe('das');
    expect(pluralCard.cardType).toBe('PLURAL_DRILL');
    expect(pluralCard.plural).toBe('Bücher');
  });
}, 'Tier 1');
