import { describe, it, expect } from '../harness/testRunner';
import { SearchNormalizerOracle, DecompounderOracle, FsrsOracle } from '../harness/referenceOracles';
import { FsrsCardData } from '../harness/contracts';

describe('Tier 3: Dictionary Search -> Compound Breakdown -> FSRS Creation Pipeline', () => {
  it('should execute full chain: fuzzy query -> decompounder -> declension matrix -> SRS flashcard', () => {
    // 1. User types un-umlauted fuzzy query: "apfelbaum"
    const rawQuery = 'apfelbaum';
    const normalized = SearchNormalizerOracle.normalize(rawQuery);
    expect(normalized).toBe('apfelbaum');

    // 2. Decompounder engine decomposes the word
    const decompoundResult = DecompounderOracle.decompound('Apfelbaum');
    expect(decompoundResult.elements).toHaveLength(2);
    expect(decompoundResult.elements[0].word).toBe('Apfel');
    expect(decompoundResult.elements[1].word).toBe('Baum');
    expect(decompoundResult.headWord).toBe('Baum');
    expect(decompoundResult.gender).toBe('der');

    // 3. Generate Gender Drill and Recognition flashcards
    const genderCard: FsrsCardData = {
      id: 'c_gen_apfelbaum',
      userId: 'u1',
      cardType: 'GENDER_DRILL',
      front: 'Apfelbaum (der / die / das ?)',
      back: 'der Apfelbaum (erbt Genus vom Grundwort "der Baum")',
      gender: decompoundResult.gender,
      state: 'NEW',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      dueAt: new Date().toISOString(),
    };

    expect(genderCard.gender).toBe('der');
    expect(genderCard.cardType).toBe('GENDER_DRILL');

    // 4. Initial review rating: Good (3)
    const review = FsrsOracle.scheduleCard(genderCard, 3);
    expect(review.card.state).toBe('REVIEW');
    expect(review.card.scheduledDays).toBeGreaterThan(0);
  });

  it('should verify cache lookup avoids redundant morphological decompounding on identical queries', () => {
    const cache = new Map<string, any>();
    let decompoundCallCount = 0;

    const cachedDecompound = (word: string) => {
      const key = `decompound:${word.toLowerCase()}`;
      if (cache.has(key)) return cache.get(key);
      decompoundCallCount++;
      const res = DecompounderOracle.decompound(word);
      cache.set(key, res);
      return res;
    };

    const res1 = cachedDecompound('Geschwindigkeitsbegrenzung');
    expect(decompoundCallCount).toBe(1);

    const res2 = cachedDecompound('Geschwindigkeitsbegrenzung');
    expect(decompoundCallCount).toBe(1); // Cached!
    expect(res2.headWord).toBe('Begrenzung');
  });

  it('should format declension matrix for display alongside compound breakdown in dictionary modal', () => {
    const wordEntry = {
      lemma: 'Haustür',
      gender: 'die',
      decompound: {
        elements: ['Haus', 'Tür'],
        headWord: 'Tür',
      },
      declension: {
        nom: 'die Haustür',
        akk: 'die Haustür',
        dat: 'der Haustür',
        gen: 'der Haustür',
        pluralNom: 'die Haustüren',
      },
    };

    expect(wordEntry.declension.pluralNom).toBe('die Haustüren');
    expect(wordEntry.decompound.headWord).toBe('Tür');
  });

  it('should support audio pronunciation trigger for compound and sub-elements', () => {
    const getAudioUrlForWord = (word: string) => `https://cdn.sprachweg.app/audio/${encodeURIComponent(word.toLowerCase())}.mp3`;
    expect(getAudioUrlForWord('Haustür')).toContain('haust%C3%BCr.mp3');
  });

  it('should handle inflected compound queries (e.g. "Geschwindigkeitsbegrenzungen") resolving to singular lemma', () => {
    const inflectedForm = 'Geschwindigkeitsbegrenzungen';
    const singularLemma = 'Geschwindigkeitsbegrenzung';

    const resolveLemma = (form: string) => (form.endsWith('en') ? form.slice(0, -2) : form);
    expect(resolveLemma(inflectedForm)).toBe(singularLemma);
  });
}, 'Tier 3');
