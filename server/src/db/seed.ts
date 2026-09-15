import { prisma } from './prisma.js';
import { USER_ID } from '../env.js';
import { ensureUser } from '../user.js';
import { SEED_DICTIONARY, SEED_STORIES, SEED_TOPICS } from './content.js';

export async function seedDatabase() {
  console.log('Seeding initial Sprachweg database...');

  // 1. The learner row (id from SPRACHWEG_USER_ID) with default settings
  const learner = await ensureUser(USER_ID);
  console.log(`Learner ready: ${learner.id}`);

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

  // 3. Grammar course topics with drills
  for (const t of SEED_TOPICS) {
    const topic = {
      slug: t.slug,
      titleDe: t.titleDe,
      titleEn: t.titleEn,
      cefrLevel: t.cefrLevel,
      weekNumber: t.weekNumber,
      orderIndex: t.orderIndex,
      description: t.description,
      explanationMd: t.explanationMd,
      formulaPattern: t.formulaPattern ?? null,
      visualTableJson: t.visualTable ? JSON.stringify(t.visualTable) : null,
      commonMistakesJson: t.commonMistakes ? JSON.stringify(t.commonMistakes) : null,
      tagsJson: JSON.stringify(t.tags || []),
      drillsJson: JSON.stringify(t.drills || []),
    };
    await prisma.grammarTopic.upsert({ where: { slug: topic.slug }, update: topic, create: topic });
  }

  // 3b. Reference dictionary entries with full tables
  for (const w of Object.values(SEED_DICTIONARY)) {
    const { nounTable, verbTable, adjectiveTable, examples } = w;
    const word = {
      lemma: w.lemma,
      normalizedLemma: w.normalizedLemma,
      pos: w.pos,
      gender: w.gender ?? null,
      cefrLevel: w.cefrLevel,
      ipa: w.ipa ?? null,
      meaningEn: w.meaningEn,
      secondaryMeanings: w.secondaryMeanings ? JSON.stringify(w.secondaryMeanings) : null,
      register: w.register ?? null,
      disambiguation: w.disambiguation ?? null,
      falseFriends: w.falseFriends ?? null,
      collocations: w.collocations ? JSON.stringify(w.collocations) : null,
      idioms: w.idioms ? JSON.stringify(w.idioms) : null,
      isCompound: !!w.isCompound,
      compoundParts: w.compoundParts ? JSON.stringify(w.compoundParts) : null,
      detailJson: JSON.stringify({ nounTable, verbTable, adjectiveTable, examples }),
    };
    await prisma.word.upsert({ where: { lemma: word.lemma }, update: word, create: word });
  }

  // 3c. Graded reader stories
  for (const [index, story] of SEED_STORIES.entries()) {
    const row = {
      slug: story.id,
      title: story.title,
      cefrLevel: story.cefrLevel,
      coverEmoji: story.coverEmoji,
      audioUrl: story.audioUrl ?? null,
      paragraphsJson: JSON.stringify(story.paragraphs),
      orderIndex: index,
    };
    await prisma.gradedStory.upsert({ where: { slug: row.slug }, update: row, create: row });
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
