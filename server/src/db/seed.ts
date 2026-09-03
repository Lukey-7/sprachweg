import { prisma } from './prisma.js';

export async function seedDatabase() {
  console.log('Seeding initial Sprachweg database...');

  // 1. Seed Guest User & Settings
  const guestUser = await prisma.user.upsert({
    where: { email: 'guest@sprachweg.app' },
    update: {},
    create: {
      id: 'guest-user-001',
      email: 'guest@sprachweg.app',
      name: 'Guest Learner',
      activeLevel: 'A1',
      currentWeek: 1,
      streakCount: 3,
      freezeTokens: 2,
      settings: {
        create: {
          dailyNewCards: 20,
          dailyReviewCap: 100,
          targetRetention: 0.90,
          voiceSpeed: 1.0,
          ttsVoice: 'de-DE-Wavenet-F',
          theme: 'system',
          autoPlayAudio: true,
        },
      },
    },
    include: { settings: true },
  });

  console.log(`Guest user seeded: ${guestUser.id}`);

  // 2. Seed Baseline Core Vocabulary Words with Word Forms
  const wordData = [
    {
      lemma: 'Haus',
      normalizedLemma: 'haus',
      pos: 'noun',
      gender: 'das',
      cefrLevel: 'A1',
      meaningEn: 'house, building',
      ipa: '/haʊ̯s/',
      isCompound: false,
      forms: [
        { form: 'Haus', normalizedForm: 'haus', formType: 'declension', case: 'nominativ', grammaticalNumber: 'singular', gender: 'das' },
        { form: 'Häuser', normalizedForm: 'haeuser', formType: 'plural', case: 'nominativ', grammaticalNumber: 'plural', gender: 'das' },
      ],
    },
    {
      lemma: 'Geschwindigkeit',
      normalizedLemma: 'geschwindigkeit',
      pos: 'noun',
      gender: 'die',
      cefrLevel: 'B1',
      meaningEn: 'speed, velocity',
      ipa: '/ɡəˈʃvɪndɪçkaɪ̯t/',
      isCompound: true,
      compoundParts: JSON.stringify([
        { part: 'geschwind', meaningEn: 'swift/fast', isFugenelement: false },
        { part: '-ig-', meaningEn: 'adjective suffix', isFugenelement: false },
        { part: '-keit', meaningEn: 'noun suffix', isFugenelement: false },
      ]),
      forms: [
        { form: 'Geschwindigkeit', normalizedForm: 'geschwindigkeit', formType: 'declension', case: 'nominativ', grammaticalNumber: 'singular', gender: 'die' },
        { form: 'Geschwindigkeiten', normalizedForm: 'geschwindigkeiten', formType: 'plural', case: 'nominativ', grammaticalNumber: 'plural', gender: 'die' },
      ],
    },
    {
      lemma: 'gehen',
      normalizedLemma: 'gehen',
      pos: 'verb',
      gender: null,
      cefrLevel: 'A1',
      meaningEn: 'to go, to walk',
      ipa: '/ˈɡeːən/',
      isCompound: false,
      forms: [
        { form: 'gehe', normalizedForm: 'gehe', formType: 'conjugation', tense: 'praesens', person: '1sg', auxiliary: 'sein' },
        { form: 'gehst', normalizedForm: 'gehst', formType: 'conjugation', tense: 'praesens', person: '2sg', auxiliary: 'sein' },
        { form: 'geht', normalizedForm: 'geht', formType: 'conjugation', tense: 'praesens', person: '3sg', auxiliary: 'sein' },
        { form: 'ging', normalizedForm: 'ging', formType: 'conjugation', tense: 'praeteritum', person: '3sg', auxiliary: 'sein' },
        { form: 'gegangen', normalizedForm: 'gegangen', formType: 'participle', tense: 'perfekt', auxiliary: 'sein' },
      ],
    },
    {
      lemma: 'Mann',
      normalizedLemma: 'mann',
      pos: 'noun',
      gender: 'der',
      cefrLevel: 'A1',
      meaningEn: 'man, husband',
      ipa: '/man/',
      isCompound: false,
      forms: [
        { form: 'Mann', normalizedForm: 'mann', formType: 'declension', case: 'nominativ', grammaticalNumber: 'singular', gender: 'der' },
        { form: 'Männer', normalizedForm: 'maenner', formType: 'plural', case: 'nominativ', grammaticalNumber: 'plural', gender: 'der' },
      ],
    },
    {
      lemma: 'Apfel',
      normalizedLemma: 'apfel',
      pos: 'noun',
      gender: 'der',
      cefrLevel: 'A1',
      meaningEn: 'apple',
      ipa: '/ˈapfl̩/',
      isCompound: false,
      forms: [
        { form: 'Apfel', normalizedForm: 'apfel', formType: 'declension', case: 'nominativ', grammaticalNumber: 'singular', gender: 'der' },
        { form: 'Äpfel', normalizedForm: 'aepfel', formType: 'plural', case: 'nominativ', grammaticalNumber: 'plural', gender: 'der' },
      ],
    },
  ];

  for (const item of wordData) {
    const { forms, ...wordFields } = item;
    const word = await prisma.word.upsert({
      where: { lemma: item.lemma },
      update: wordFields,
      create: wordFields,
    });

    for (const f of forms) {
      const existingForm = await prisma.wordForm.findFirst({
        where: { wordId: word.id, form: f.form, formType: f.formType },
      });
      if (!existingForm) {
        await prisma.wordForm.create({
          data: {
            wordId: word.id,
            ...f,
          },
        });
      }
    }
  }

  // 3. Seed Baseline Grammar Topics
  const topicData = [
    {
      slug: 'gender-and-articles',
      titleDe: 'Geschlecht und Artikel',
      titleEn: 'Noun Gender & Definite/Indefinite Articles',
      cefrLevel: 'A1',
      weekNumber: 1,
      orderIndex: 1,
      description: 'Master the three German genders (der, die, das) and definite/indefinite articles.',
      explanationMd: '# German Genders\n\nGerman nouns have three grammatical genders:\n- **der** (Masculine, Blue)\n- **die** (Feminine, Red)\n- **das** (Neuter, Green)\n- **die** (Plural, Purple)',
      tagsJson: JSON.stringify(['gender', 'articles', 'der_die_das', 'A1']),
    },
    {
      slug: 'satzklammer-v2',
      titleDe: 'Satzklammer & Verbzweitstellung',
      titleEn: 'Sentence Bracket & V2 Word Order',
      cefrLevel: 'A1',
      weekNumber: 1,
      orderIndex: 2,
      description: 'The golden rule of German main clauses: the finite verb is locked in Position 2.',
      explanationMd: '# Satzklammer and V2\n\nIn standard German declarative clauses, the conjugated verb always sits in Position 2 (V2), regardless of what occupies Position 1 (Vorfeld).',
      tagsJson: JSON.stringify(['word_order', 'v2', 'satzklammer', 'A1']),
    },
    {
      slug: 'accusative-case',
      titleDe: 'Der Akkusativ',
      titleEn: 'The Accusative Case (Direct Objects)',
      cefrLevel: 'A1',
      weekNumber: 2,
      orderIndex: 1,
      description: 'Understand direct objects and masculine article changes (der -> den, ein -> einen).',
      explanationMd: '# The Accusative Case\n\nThe accusative case marks the direct receiver of an action. Only masculine articles change: *der* -> *den*, *ein* -> *einen*.',
      tagsJson: JSON.stringify(['case', 'accusative', 'direct_object', 'A1']),
    },
    {
      slug: 'subordinate-clauses-weil',
      titleDe: 'Nebensätze mit "weil"',
      titleEn: 'Subordinate Clauses with "weil"',
      cefrLevel: 'A2',
      weekNumber: 5,
      orderIndex: 1,
      description: 'Learn how subordinating conjunctions kick the finite verb to the very end of the clause.',
      explanationMd: '# Nebensätze mit "weil"\n\nSubordinating conjunctions like *weil* trigger verb-final word order.',
      tagsJson: JSON.stringify(['word_order', 'nebensatz', 'verb_final', 'weil', 'A2']),
    },
  ];

  for (const topic of topicData) {
    await prisma.grammarTopic.upsert({
      where: { slug: topic.slug },
      update: topic,
      create: topic,
    });
  }

  // 4. Seed Baseline Sample Sentences with Tokens
  const sampleSentences = [
    {
      textDe: 'Der Mann kauft einen Apfel.',
      textEnNatural: 'The man buys an apple.',
      textEnLiteral: 'The man buys an apple.',
      cefrLevel: 'A1',
      v2Position1: 'Der Mann',
      v2Verb: 'kauft',
      v2Mittelfeld: 'einen Apfel',
      v2VerbFinal: '',
      isNebensatz: false,
      grammarTags: JSON.stringify(['v2_word_order', 'accusative_object']),
      source: 'curriculum',
      tokens: [
        { tokenIndex: 0, surfaceToken: 'Der', lemma: 'der', pos: 'article', gender: 'der', case: 'nominativ', syntaxRole: 'subject_article', meaningEn: 'the' },
        { tokenIndex: 1, surfaceToken: 'Mann', lemma: 'Mann', pos: 'noun', gender: 'der', case: 'nominativ', syntaxRole: 'subject', meaningEn: 'man' },
        { tokenIndex: 2, surfaceToken: 'kauft', lemma: 'kaufen', pos: 'verb', syntaxRole: 'finite_verb', meaningEn: 'buys' },
        { tokenIndex: 3, surfaceToken: 'einen', lemma: 'ein', pos: 'article', gender: 'der', case: 'akkusativ', syntaxRole: 'object_article', meaningEn: 'an' },
        { tokenIndex: 4, surfaceToken: 'Apfel', lemma: 'Apfel', pos: 'noun', gender: 'der', case: 'akkusativ', syntaxRole: 'direct_object', meaningEn: 'apple' },
      ],
    },
  ];

  for (const s of sampleSentences) {
    const { tokens, ...sentenceFields } = s;
    const existingSentence = await prisma.sentence.findFirst({
      where: { textDe: s.textDe },
    });

    if (!existingSentence) {
      await prisma.sentence.create({
        data: {
          ...sentenceFields,
          tokens: {
            create: tokens,
          },
        },
      });
    }
  }

  console.log('Database seeded successfully.');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .catch((e) => {
      console.error('Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
