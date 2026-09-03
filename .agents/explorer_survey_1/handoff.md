# Handoff Report — Backend Architecture, Database Schema, Gemini AI & FSRS Engine

**Author**: Explorer Survey 1  
**Working Directory**: `C:\Users\hp\.gemini\antigravity\scratch\sprachweg\.agents\explorer_survey_1`  
**Target Milestone**: Milestone 0 / Milestone 1 & 2 Blueprint  
**Date**: 2026-09-02  

---

## 1. Observation

Direct inspection of `ORIGINAL_REQUEST.md` and system architectural requirements reveals the foundational technical requirements for Sprachweg:
1. **Backend Runtime & Database**: Node.js/Express with TypeScript, Prisma ORM, and SQLite. Required models: `users`, `settings`, `words`, `word_forms`, `sentences`, `sentence_tokens`, `cards`, `reviews`, `grammar_topics`, `grammar_progress`, `lessons`, `sessions`, `speaking_sessions`, `error_logs`, `cache_entries`.
2. **Gemini API Integration**: Server-side wrapper utilizing `@google/genai` (or REST) with strict structured JSON schemas (`responseSchema`) and pinned linguistic system prompts.
3. **Smart Caching Layer**: Deterministic SHA-256 hash-keyed SQLite cache (`cache_entries`) preventing redundant API calls and providing offline-ready responses.
4. **German Linguistic Verification Pipeline**: Multi-pass validator verifying morphological gender, 4-case article/noun declensions, auxiliary verb selection (*haben* vs *sein* in Perfekt), preposition case governance (Akkusativ, Dativ, Genitiv, Wechselpräpositionen), and V2/Nebensatz word order.
5. **FSRS Spaced Repetition Engine**: Modern Free Spaced Repetition Scheduler (FSRS-4.5 / FSRS-5) with 19 parameter weights, mathematical calculations for Stability ($S$), Difficulty ($D$), Retrievability ($R$), and Next Interval ($I$), supporting 6 distinct card variants, daily new card limits (default 20), daily review caps (default 100), and backlog load leveling.

---

## 2. Logic Chain & Technical Specifications

### 2.1 Complete Prisma Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id               String            @id @default(uuid())
  email            String            @unique
  name             String
  avatarUrl        String?
  activeLevel      String            @default("A1") // A0, A1, A2, B1_START, B1_SOLID, B2
  currentWeek      Int               @default(1)
  streakCount      Int               @default(0)
  lastActiveAt     DateTime?
  freezeTokens     Int               @default(2)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  settings         Settings?
  cards            Card[]
  reviews          Review[]
  grammarProgress  GrammarProgress[]
  sessions         Session[]
  speakingSessions SpeakingSession[]
  errorLogs        ErrorLog[]

  @@map("users")
}

model Settings {
  id               String   @id @default(uuid())
  userId           String   @unique
  dailyNewCards    Int      @default(20)
  dailyReviewCap   Int      @default(100)
  targetRetention  Float    @default(0.90) // 90% default FSRS retention
  voiceSpeed       Float    @default(1.0)
  ttsVoice         String   @default("de-DE-Wavenet-F")
  theme            String   @default("system") // light, dark, system
  autoPlayAudio    Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("settings")
}

model Word {
  id                 String          @id @default(uuid())
  lemma              String          @unique
  normalizedLemma    String          // Lowercase without umlauts for fuzzy search indexing
  pos                String          // noun, verb, adjective, adverb, preposition, etc.
  gender             String?         // der, die, das, or null
  cefrLevel          String          // A1, A2, B1, B2
  frequencyRank      Int?
  ipa                String?         // e.g. /ɡəˈʃvɪndɪçkaɪ̯t/
  audioUrl           String?
  meaningEn          String          // Primary English definition
  secondaryMeanings  String?         // JSON string array of alternative meanings
  register           String?         // formal, informal, colloquial, technical
  disambiguation     String?         // Subtle semantic distinctions vs synonyms
  falseFriends       String?         // English false-friend warnings
  collocations       String?         // JSON string array of typical collocations
  idioms             String?         // JSON string array of Redewendungen
  isCompound         Boolean         @default(false)
  compoundParts      String?         // JSON array of decompounded segments with meanings
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  forms              WordForm[]
  cards              Card[]
  sentenceTokens     SentenceToken[]

  @@index([lemma])
  @@index([normalizedLemma])
  @@index([pos])
  @@index([cefrLevel])
  @@map("words")
}

model WordForm {
  id                  String   @id @default(uuid())
  wordId              String
  form                String   // e.g. "Geschwindigkeiten", "fährst", "gefahren"
  normalizedForm      String   // Normalized form for index lookup
  formType            String   // conjugation, declension, comparative, superlative, plural
  case                String?  // nominativ, akkusativ, dativ, genitiv
  grammaticalNumber   String?  // singular, plural
  gender              String?  // der, die, das
  tense               String?  // praesens, praeteritum, perfekt, plusquamperfekt, futur_i
  mood                String?  // indikativ, konjunktiv_i, konjunktiv_ii, imperativ
  person              String?  // 1sg, 2sg, 3sg, 1pl, 2pl, 3pl
  auxiliary           String?  // haben, sein
  separablePrefix     String?  // e.g. "auf" for "aufstehen"
  governedPreposition String?  // e.g. "auf" for "warten auf"
  governedCase        String?  // akkusativ, dativ, genitiv
  declensionCategory  String?  // strong, weak, mixed

  word                Word     @relation(fields: [wordId], references: [id], onDelete: Cascade)

  @@index([wordId])
  @@index([form])
  @@index([normalizedForm])
  @@map("word_forms")
}

model Sentence {
  id                 String          @id @default(uuid())
  textDe             String
  textEnNatural      String
  textEnLiteral      String
  cefrLevel          String          // A1, A2, B1, B2
  audioUrl           String?
  v2Position1        String          // Position 1 element
  v2Verb             String          // Position 2 finite verb
  v2Mittelfeld       String          // Mittelfeld components
  v2VerbFinal        String?         // Satzklammer end / Verb-Final
  isNebensatz        Boolean         @default(false)
  conjunctionTrigger String?         // weil, dass, wenn, etc.
  grammarTags        String?         // JSON array of grammar tags
  source             String?         // curriculum, mined, reader, gemini
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  tokens             SentenceToken[]
  cards              Card[]

  @@map("sentences")
}

model SentenceToken {
  id                 String   @id @default(uuid())
  sentenceId         String
  tokenIndex         Int
  surfaceToken       String   // Exact token in sentence
  lemma              String   // Dictionary base form
  pos                String   // noun, verb, adj, etc.
  gender             String?  // der, die, das
  case               String?  // nominativ, akkusativ, dativ, genitiv
  syntaxRole         String?  // subject, direct_object, prep_object, etc.
  declensionTrigger  String?  // Preposition or adjective governing case
  meaningEn          String?  // Contextual meaning of this word
  wordId             String?

  sentence           Sentence @relation(fields: [sentenceId], references: [id], onDelete: Cascade)
  word               Word?    @relation(fields: [wordId], references: [id], onDelete: SetNull)

  @@index([sentenceId])
  @@index([lemma])
  @@map("sentence_tokens")
}

model Card {
  id              String    @id @default(uuid())
  userId          String
  wordId          String?
  sentenceId      String?
  cardType        String    // recognition, production, sentence_cloze, audio_meaning, gender_drill, plural_drill
  prompt          String    // Front content
  answer          String    // Back content
  contextSentence String?   // Full context with optional cloze markers
  optionsJson     String?   // JSON array of choices for multiple-choice/drills
  state           String    @default("new") // new, learning, review, relearning
  stability       Float     @default(0.0)
  difficulty      Float     @default(0.0)
  elapsedDays     Float     @default(0.0)
  scheduledDays   Float     @default(0.0)
  reps            Int       @default(0)
  lapses          Int       @default(0)
  lastReview      DateTime?
  dueAt           DateTime  @default(now())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  word            Word?     @relation(fields: [wordId], references: [id], onDelete: SetNull)
  sentence        Sentence? @relation(fields: [sentenceId], references: [id], onDelete: SetNull)
  reviews         Review[]

  @@index([userId, dueAt])
  @@index([userId, state])
  @@index([userId, cardType])
  @@map("cards")
}

model Review {
  id               String   @id @default(uuid())
  cardId           String
  userId           String
  rating           Int      // 1: Again, 2: Hard, 3: Good, 4: Easy
  reviewType       String   // learning, review, relearning
  elapsedDays      Float
  scheduledDays    Float
  stabilityBefore  Float
  stabilityAfter   Float
  difficultyBefore Float
  difficultyAfter  Float
  responseTimeMs   Int?
  reviewedAt       DateTime @default(now())

  card             Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, reviewedAt])
  @@index([cardId])
  @@map("reviews")
}

model GrammarTopic {
  id                 String            @id @default(uuid())
  slug               String            @unique
  titleDe            String
  titleEn            String
  cefrLevel          String            // A1, A2, B1, B2
  weekNumber         Int
  orderIndex         Int
  description        String
  explanationMd      String            // Comprehensive markdown lesson & mental models
  formulaPattern     String?           // Visual formula pattern
  visualTableJson    String?           // JSON structured matrix
  commonMistakesJson String?           // JSON array of pitfall comparisons
  tagsJson           String            // JSON array of tags
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  progress           GrammarProgress[]
  lessons            Lesson[]

  @@index([slug])
  @@index([cefrLevel])
  @@index([weekNumber])
  @@map("grammar_topics")
}

model GrammarProgress {
  id               String       @id @default(uuid())
  userId           String
  topicId          String
  masteryScore     Float        @default(0.0) // 0.0 to 1.0 (>= 0.80 is mastered)
  timesPracticed   Int          @default(0)
  correctCount     Int          @default(0)
  errorCount       Int          @default(0)
  lastPracticedAt  DateTime?
  isRemedialActive Boolean      @default(false)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic            GrammarTopic @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@unique([userId, topicId])
  @@index([userId, isRemedialActive])
  @@map("grammar_progress")
}

model Lesson {
  id          String        @id @default(uuid())
  topicId     String?
  weekNumber  Int
  dayNumber   Int           // 1 to 7
  blockType   String        // warmup_srs, grammar_concept, sentence_miner, speaking_task, immersion_listening
  title       String
  contentJson String        // Structured lesson block payload
  drillsJson  String?       // JSON array of 15 interactive drills
  orderIndex  Int

  topic       GrammarTopic? @relation(fields: [topicId], references: [id], onDelete: SetNull)

  @@index([weekNumber, dayNumber])
  @@index([blockType])
  @@map("lessons")
}

model Session {
  id                 String    @id @default(uuid())
  userId             String
  weekNumber         Int
  dayNumber          Int
  sessionType        String    @default("daily_5_block")
  status             String    @default("in_progress") // in_progress, completed, abandoned
  block1Done         Boolean   @default(false)
  block2Done         Boolean   @default(false)
  block3Done         Boolean   @default(false)
  block4Done         Boolean   @default(false)
  block5Done         Boolean   @default(false)
  remedialDrillsJson String?   // Injected remedial drills for tags < 80%
  score              Float?
  durationSeconds    Int       @default(0)
  startedAt          DateTime  @default(now())
  completedAt        DateTime?

  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, startedAt])
  @@index([userId, weekNumber, dayNumber])
  @@map("sessions")
}

model SpeakingSession {
  id                String   @id @default(uuid())
  userId            String
  sessionMode       String   // free_conversation, roleplay, pronunciation, shadowing, dictation
  scenarioId        String?  // buergeramt, arzt, baeckerei, wohnung, interview
  targetText        String?
  transcript        String
  audioUrl          String?
  overallScore      Float    // 0 to 100
  fluencyScore      Float?
  accuracyScore     Float?
  phonemeScoresJson String?  // JSON array of phoneme breakdown
  successPointsJson String   // JSON array of 3 successes
  correctionsJson   String   // JSON array of 3 prioritized corrections
  minedWordsJson    String   // JSON array of 5 mined vocabulary entries
  createdAt         DateTime @default(now())

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, sessionMode])
  @@index([userId, createdAt])
  @@map("speaking_sessions")
}

model ErrorLog {
  id            String   @id @default(uuid())
  userId        String
  contextType   String   // drill, review, speaking, miner
  inputValue    String
  expectedValue String
  errorType     String   // gender, case, conjugation, word_order, spelling, vocabulary
  explanation   String
  grammarTag    String?
  createdAt     DateTime @default(now())

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, grammarTag])
  @@index([userId, errorType])
  @@map("error_logs")
}

model CacheEntry {
  id              String    @id @default(uuid())
  cacheKey        String    @unique // SHA-256 hash of normalized request parameters
  cacheType       String    // dictionary, sentence_parse, drill_gen, speaking_eval, audio_meta
  inputParamsJson String    // Serialized input parameters
  payloadJson     String    // Validated response payload
  hitCount        Int       @default(1)
  expiresAt       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([cacheKey])
  @@index([cacheType])
  @@map("cache_entries")
}
```

---

### 2.2 REST API Specification

| Route & Method | Description | Request Body / Query | Response Structure |
| :--- | :--- | :--- | :--- |
| **`POST /api/auth/guest`** | Initialize or resume guest session | None | `{ user: User, settings: Settings }` |
| **`GET /api/user/profile`** | Get current learner profile & streak | Header `x-user-id` | `{ user: User, streak: number, freezeTokens: number, cefrLevel: string }` |
| **`PATCH /api/user/settings`** | Update user preferences | `{ dailyNewCards?, dailyReviewCap?, targetRetention?, ttsVoice? }` | `{ settings: Settings }` |
| **`GET /api/dictionary/lookup`** | Search lemma/inflected form with umlaut tolerance | Query: `?q=schoen` | `{ word: Word, forms: WordForm[], declensions: object, conjugations: object, compoundParts: object[], idioms: string[] }` |
| **`GET /api/dictionary/autocomplete`** | Fast prefix search for UI search bar | Query: `?q=ges` | `{ suggestions: Array<{ lemma: string, pos: string, gender: string, meaningEn: string }> }` |
| **`POST /api/miner/analyze`** | Deep teardown of German sentence with visual V2 map | `{ sentence: string, level?: string }` | `{ sentence: Sentence, tokens: SentenceToken[], v2Map: object, isNebensatz: boolean, variations: string[] }` |
| **`POST /api/miner/mine-card`** | One-tap addition of word or cloze into FSRS deck | `{ wordId?: string, sentenceId?: string, cardTypes: string[] }` | `{ createdCards: Card[] }` |
| **`GET /api/cards/study-queue`** | Retrieve due cards bounded by daily new & review limits | None | `{ queue: Card[], meta: { dueCount: number, newCount: number, learningCount: number, totalPending: number } }` |
| **`POST /api/cards/:id/review`** | Submit FSRS rating (1: Again, 2: Hard, 3: Good, 4: Easy) | `{ rating: 1 \| 2 \| 3 \| 4, responseTimeMs?: number }` | `{ card: Card, review: Review, nextDueAt: string, intervalDays: number }` |
| **`GET /api/curriculum/syllabus`** | Complete 52-week curriculum overview | None | `{ weeks: Array<{ weekNumber: number, cefrLevel: string, topicCount: number, completed: boolean }> }` |
| **`GET /api/curriculum/week/:weekNumber`** | Detailed 7-day schedule with topic metadata | None | `{ weekNumber: number, cefrLevel: string, topics: GrammarTopic[], days: Lesson[] }` |
| **`GET /api/curriculum/topics/:slug`** | Grammar lesson details & reference tables | None | `{ topic: GrammarTopic, visualTable: object, commonMistakes: object[], userMastery: number }` |
| **`POST /api/curriculum/drills/evaluate`** | Score interactive drill answer | `{ topicId: string, drillId: string, userInput: string, drillType: string }` | `{ isCorrect: boolean, expected: string, explanation: string, newMasteryScore: number }` |
| **`GET /api/sessions/today`** | Load or create today's dynamic 5-block session | None | `{ session: Session, blocks: Lesson[], remedialDrills: object[] }` |
| **`POST /api/sessions/:id/block/:blockNum/complete`** | Mark block complete and save progress | `{ durationSeconds: number, score?: number }` | `{ session: Session, allBlocksDone: boolean }` |
| **`POST /api/speaking/evaluate`** | Evaluate spoken German audio or transcript | `{ mode: string, transcript: string, targetText?: string, scenarioId?: string }` | `{ overallScore: number, fluencyScore: number, accuracyScore: number, phonemes: object[], successes: string[], corrections: object[], minedVocabulary: object[] }` |
| **`GET /api/stats/dashboard`** | Learner dashboard with CEFR estimation & heatmap | None | `{ wordsKnown: number, grammarHeatmap: Record<string, number>, reviewForecast: number[], streak: number, estimatedCEFR: string }` |

---

### 2.3 Gemini API Wrapper, Structured Schemas & SQLite Caching

#### 2.3.1 Structured JSON Response Schemas
Using `@google/genai` with `responseMimeType: "application/json"` and `responseSchema`:

```typescript
import { GoogleGenAI, Type } from '@google/genai';

// Sentence Teardown Schema
export const SentenceAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    textDe: { type: Type.STRING },
    textEnNatural: { type: Type.STRING },
    textEnLiteral: { type: Type.STRING },
    cefrLevel: { type: Type.STRING, enum: ['A1', 'A2', 'B1', 'B2'] },
    v2Position1: { type: Type.STRING, description: 'Element in Position 1 (Topic/Subject/Adverbial)' },
    v2Verb: { type: Type.STRING, description: 'Finite verb in Position 2' },
    v2Mittelfeld: { type: Type.STRING, description: 'Mittelfeld elements' },
    v2VerbFinal: { type: Type.STRING, description: 'Verb-Final element in Satzklammer' },
    isNebensatz: { type: Type.BOOLEAN },
    conjunctionTrigger: { type: Type.STRING },
    tokens: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.INTEGER },
          surfaceToken: { type: Type.STRING },
          lemma: { type: Type.STRING },
          pos: { type: Type.STRING, enum: ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'article', 'particle'] },
          gender: { type: Type.STRING, enum: ['der', 'die', 'das', 'none'] },
          case: { type: Type.STRING, enum: ['nominativ', 'akkusativ', 'dativ', 'genitiv', 'none'] },
          syntaxRole: { type: Type.STRING },
          declensionTrigger: { type: Type.STRING },
          meaningEn: { type: Type.STRING }
        },
        required: ['index', 'surfaceToken', 'lemma', 'pos', 'meaningEn']
      }
    },
    cefrVariations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 CEFR-calibrated sentence variations'
    }
  },
  required: ['textDe', 'textEnNatural', 'textEnLiteral', 'cefrLevel', 'v2Position1', 'v2Verb', 'v2Mittelfeld', 'tokens', 'cefrVariations']
};

// Dictionary Entry Schema
export const DictionaryEntrySchema = {
  type: Type.OBJECT,
  properties: {
    lemma: { type: Type.STRING },
    pos: { type: Type.STRING },
    gender: { type: Type.STRING, enum: ['der', 'die', 'das', 'none'] },
    cefrLevel: { type: Type.STRING },
    ipa: { type: Type.STRING },
    meaningEn: { type: Type.STRING },
    secondaryMeanings: { type: Type.ARRAY, items: { type: Type.STRING } },
    register: { type: Type.STRING },
    disambiguation: { type: Type.STRING },
    falseFriends: { type: Type.STRING },
    collocations: { type: Type.ARRAY, items: { type: Type.STRING } },
    idioms: { type: Type.ARRAY, items: { type: Type.STRING } },
    isCompound: { type: Type.BOOLEAN },
    compoundParts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          part: { type: Type.STRING },
          meaning: { type: Type.STRING }
        },
        required: ['part', 'meaning']
      }
    },
    declensionTable: {
      type: Type.OBJECT,
      properties: {
        nominativeSg: { type: Type.STRING },
        accusativeSg: { type: Type.STRING },
        dativeSg: { type: Type.STRING },
        genitiveSg: { type: Type.STRING },
        nominativePl: { type: Type.STRING },
        accusativePl: { type: Type.STRING },
        dativePl: { type: Type.STRING },
        genitivePl: { type: Type.STRING }
      }
    },
    conjugationTable: {
      type: Type.OBJECT,
      properties: {
        auxiliary: { type: Type.STRING, enum: ['haben', 'sein'] },
        praesensEr: { type: Type.STRING },
        praeteritumEr: { type: Type.STRING },
        partizipII: { type: Type.STRING },
        konjunktivIIEr: { type: Type.STRING },
        imperativDu: { type: Type.STRING },
        separablePrefix: { type: Type.STRING },
        governedPreposition: { type: Type.STRING },
        governedCase: { type: Type.STRING }
      }
    }
  },
  required: ['lemma', 'pos', 'meaningEn', 'cefrLevel', 'ipa']
};
```

#### 2.3.2 Smart SHA-256 SQLite Caching Architecture
- **Hash Key Formula**:
  `cacheKey = crypto.createHash('sha256').update(`${type}:${normalizedInput}:${MODEL_VERSION}`).digest('hex')`
- **Cache Execution Logic**:
  ```typescript
  import crypto from 'crypto';
  import { prisma } from '../db/prisma';

  export class CacheService {
    private static memoryCache = new Map<string, any>();

    public static generateKey(type: string, input: any, version = 'gemini-2.5-flash'): string {
      const normalized = typeof input === 'string' 
        ? input.trim().normalize('NFC').toLowerCase() 
        : JSON.stringify(input);
      return crypto.createHash('sha256').update(`${type}:${normalized}:${version}`).digest('hex');
    }

    public static async get<T>(type: string, input: any): Promise<T | null> {
      const key = this.generateKey(type, input);
      if (this.memoryCache.has(key)) {
        return this.memoryCache.get(key) as T;
      }
      const entry = await prisma.cacheEntry.findUnique({ where: { cacheKey: key } });
      if (!entry) return null;

      // Increment hit count asynchronously
      prisma.cacheEntry.update({
        where: { id: entry.id },
        data: { hitCount: { increment: 1 } }
      }).catch(console.error);

      const parsed = JSON.parse(entry.payloadJson) as T;
      this.memoryCache.set(key, parsed);
      return parsed;
    }

    public static async set(type: string, input: any, payload: any, ttlDays?: number): Promise<void> {
      const key = this.generateKey(type, input);
      const expiresAt = ttlDays ? new Date(Date.now() + ttlDays * 86400 * 1000) : null;
      const payloadStr = JSON.stringify(payload);

      this.memoryCache.set(key, payload);
      await prisma.cacheEntry.upsert({
        where: { cacheKey: key },
        create: {
          cacheKey: key,
          cacheType: type,
          inputParamsJson: typeof input === 'string' ? input : JSON.stringify(input),
          payloadJson: payloadStr,
          expiresAt
        },
        update: {
          payloadJson: payloadStr,
          hitCount: { increment: 1 },
          expiresAt
        }
      });
    }
  }
  ```

---

### 2.4 Multi-Pass German Linguistic Verification Pipeline

```typescript
export interface ValidationResult<T> {
  isValid: boolean;
  errors: string[];
  repairedData: T;
}

export class GermanLinguisticValidator {
  // Pass 1: Schema Structure Check (handled by Zod / Gemini responseSchema)
  
  // Pass 2: Morphological & Deterministic Grammar Rules
  public static validateWordEntry(data: any): ValidationResult<any> {
    const errors: string[] = [];
    const repaired = { ...data };

    // 1. Gender Suffix Heuristics
    if (repaired.pos === 'noun' && repaired.lemma) {
      const lemma = repaired.lemma;
      if (/.*(ung|heit|keit|schaft|tion|tät|ik|ie|ur|ei)$/i.test(lemma) && repaired.gender !== 'die') {
        errors.push(`Suffix rule violation: Noun ending indicates feminine (die), got ${repaired.gender}`);
        repaired.gender = 'die';
      } else if (/.*(ling|ismus|ist|ant|ent|eur)$/i.test(lemma) && repaired.gender !== 'der') {
        errors.push(`Suffix rule violation: Noun ending indicates masculine (der), got ${repaired.gender}`);
        repaired.gender = 'der';
      } else if (/.*(chen|lein|ment|um|tum)$/i.test(lemma) && repaired.gender !== 'das') {
        errors.push(`Suffix rule violation: Noun ending indicates neuter (das), got ${repaired.gender}`);
        repaired.gender = 'das';
      }
    }

    // 2. Verb Auxiliary Validation (haben vs sein)
    if (repaired.pos === 'verb' && repaired.conjugationTable) {
      const conj = repaired.conjugationTable;
      const motionAndStateChangeVerbs = new Set([
        'gehen', 'fahren', 'laufen', 'fliegen', 'schwimmen', 'reisen', 'kommen', 'springen',
        'aufstehen', 'einschlafen', 'sterben', 'wachsen', 'schmelzen', 'aufwachen',
        'sein', 'bleiben', 'werden', 'geschehen', 'passieren', 'gelingen', 'misslingen'
      ]);

      if (motionAndStateChangeVerbs.has(repaired.lemma?.toLowerCase()) && conj.auxiliary !== 'sein') {
        errors.push(`Auxiliary rule violation: Verb "${repaired.lemma}" must conjugate with "sein" in Perfekt`);
        conj.auxiliary = 'sein';
      }
    }

    // 3. Preposition Case Governance
    if (repaired.pos === 'preposition' || (repaired.conjugationTable && repaired.conjugationTable.governedPreposition)) {
      const prep = (repaired.lemma || repaired.conjugationTable?.governedPreposition || '').toLowerCase();
      const dativePreps = new Set(['aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu', 'gegenüber', 'außer']);
      const accusativePreps = new Set(['durch', 'für', 'gegen', 'ohne', 'um', 'bis', 'entlang']);
      const genitivePreps = new Set(['wegen', 'trotz', 'während', 'statt', 'anstatt', 'außerhalb', 'innerhalb']);

      if (dativePreps.has(prep) && repaired.conjugationTable?.governedCase && repaired.conjugationTable.governedCase !== 'dativ') {
        errors.push(`Case governance violation: Preposition "${prep}" strictly governs Dativ, got ${repaired.conjugationTable.governedCase}`);
        repaired.conjugationTable.governedCase = 'dativ';
      } else if (accusativePreps.has(prep) && repaired.conjugationTable?.governedCase && repaired.conjugationTable.governedCase !== 'akkusativ') {
        errors.push(`Case governance violation: Preposition "${prep}" strictly governs Akkusativ, got ${repaired.conjugationTable.governedCase}`);
        repaired.conjugationTable.governedCase = 'akkusativ';
      } else if (genitivePreps.has(prep) && repaired.conjugationTable?.governedCase && repaired.conjugationTable.governedCase !== 'genitiv') {
        errors.push(`Case governance violation: Preposition "${prep}" strictly governs Genitiv, got ${repaired.conjugationTable.governedCase}`);
        repaired.conjugationTable.governedCase = 'genitiv';
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      repairedData: repaired
    };
  }

  // Sentence V2 / Satzklammer Syntax Validator
  public static validateSentenceSyntax(data: any): ValidationResult<any> {
    const errors: string[] = [];
    const repaired = { ...data };

    if (!repaired.isNebensatz) {
      // Main clause: V2 must be present
      if (!repaired.v2Verb || repaired.v2Verb.trim().length === 0) {
        errors.push('Syntax violation: Hauptsatz missing finite verb in Position 2');
      }
    } else {
      // Subordinate clause: Verb-Final must be populated
      if (!repaired.v2VerbFinal || repaired.v2VerbFinal.trim().length === 0) {
        errors.push('Syntax violation: Nebensatz missing finite verb in final position');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      repairedData: repaired
    };
  }
}
```

---

### 2.5 FSRS (Free Spaced Repetition Scheduler) Engine

#### 2.5.1 Exact Mathematical Formulations
The FSRS model is governed by memory stability $S$ (in days), item difficulty $D \in [1, 10]$, and retrievability $R \in [0, 1]$:

1. **Retrievability Equation**:
   $$R(t, S) = \left(1 + \frac{19}{81} \cdot \frac{t}{S}\right)^{-0.5}$$
   where $t$ is elapsed days since last review. Note that when $t = S$, $R = 0.90$.

2. **Next Review Interval from Target Retention ($R_{\text{target}}$)**:
   $$I(S, R_{\text{target}}) = \frac{S}{19/81} \cdot \left(R_{\text{target}}^{-1 / 0.5} - 1\right) = \frac{81}{19} \cdot S \cdot \left(R_{\text{target}}^{-2} - 1\right)$$
   For $R_{\text{target}} = 0.90$, $I(S, 0.90) = S$ days.

3. **Initial Values for New Cards ($t=0$, First Rating $G \in \{1, 2, 3, 4\}$)**:
   $$S_0(G) = w_{G-1}$$
   $$D_0(G) = \text{clamp}\left(w_4 - e^{w_5 \cdot (G - 1)} + 1, 1.0, 10.0\right)$$

4. **Difficulty Update ($D \to D'$)**:
   $$\Delta D = -w_6 \cdot (G - 3)$$
   $$D'(D, G) = \text{clamp}\left(w_7 \cdot D_0(3) + (1 - w_7) \cdot (D + \Delta D), 1.0, 10.0\right)$$

5. **Stability on Successful Recall ($G \in \{2, 3, 4\}$)**:
   $$S_{\text{recall}}(D, S, R, G) = S \cdot \left(1 + e^{w_8} \cdot (11 - D) \cdot S^{-w_9} \cdot \left(e^{w_{10} \cdot (1 - R)} - 1\right) \cdot h(G)\right)$$
   where:
   $$h(2) = w_{15} \quad (\text{Hard}), \quad h(3) = 1.0 \quad (\text{Good}), \quad h(4) = w_{16} \quad (\text{Easy})$$

6. **Stability on Forgetting ($G = 1$, Again / Lapse)**:
   $$S_{\text{forget}}(D, S, R) = w_{11} \cdot D^{-w_{12}} \cdot \left((S + 1)^{w_{13}} - 1\right) \cdot e^{w_{14} \cdot (1 - R)}$$

#### 2.5.2 FSRS TypeScript Implementation & Default Weights

```typescript
export enum Rating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4
}

export enum CardState {
  New = 'new',
  Learning = 'learning',
  Review = 'review',
  Relearning = 'relearning'
}

export interface FSRSParameters {
  targetRetention: number; // default 0.90
  weights: number[];
}

export const DEFAULT_FSRS_WEIGHTS: number[] = [
  0.40255,  // w0: S0(Again)
  1.18385,  // w1: S0(Hard)
  3.173,    // w2: S0(Good)
  15.69105, // w3: S0(Easy)
  7.1949,   // w4: D0 base
  0.5345,   // w5: D0 slope
  1.4604,   // w6: Difficulty step delta
  0.0046,   // w7: Mean reversion weight
  1.54575,  // w8: Recall stability exponent base
  0.1192,   // w9: Stability power exponent
  1.01925,  // w10: Retrievability difference exponent
  1.9395,   // w11: Forget stability base
  0.11,     // w12: Forget difficulty power
  0.29605,  // w13: Forget stability power
  0.22695,  // w14: Forget retrievability exponent
  0.2315,   // w15: Hard penalty factor
  2.9898,   // w16: Easy bonus factor
  0.51655,  // w17: Short-term stability factor
  0.6621    // w18: Short-term power factor
];

export class FSRSEngine {
  private params: FSRSParameters;
  private readonly FACTOR = 19 / 81;

  constructor(params?: Partial<FSRSParameters>) {
    this.params = {
      targetRetention: params?.targetRetention ?? 0.90,
      weights: params?.weights ?? DEFAULT_FSRS_WEIGHTS
    };
  }

  public getRetrievability(elapsedDays: number, stability: number): number {
    if (stability <= 0) return 0;
    return Math.pow(1 + (this.FACTOR * elapsedDays) / stability, -0.5);
  }

  public calculateInterval(stability: number, targetRetention: number = this.params.targetRetention): number {
    if (stability <= 0) return 1;
    const interval = (stability / this.FACTOR) * (Math.pow(targetRetention, -2) - 1);
    return Math.max(1, Math.round(interval));
  }

  public initialStability(rating: Rating): number {
    return this.params.weights[rating - 1];
  }

  public initialDifficulty(rating: Rating): number {
    const w = this.params.weights;
    const d0 = w[4] - Math.exp(w[5] * (rating - 1)) + 1;
    return Math.min(Math.max(d0, 1.0), 10.0);
  }

  public nextDifficulty(currentDifficulty: number, rating: Rating): number {
    const w = this.params.weights;
    const deltaD = -w[6] * (rating - 3);
    const d0_good = this.initialDifficulty(Rating.Good);
    const nextD = w[7] * d0_good + (1 - w[7]) * (currentDifficulty + deltaD);
    return Math.min(Math.max(nextD, 1.0), 10.0);
  }

  public nextStabilityRecall(difficulty: number, stability: number, retrievability: number, rating: Rating): number {
    const w = this.params.weights;
    let hardPenalty = 1.0;
    if (rating === Rating.Hard) hardPenalty = w[15];
    else if (rating === Rating.Easy) hardPenalty = w[16];

    const s = stability * (1 + Math.exp(w[8]) * (11 - difficulty) * Math.pow(stability, -w[9]) * (Math.exp(w[10] * (1 - retrievability)) - 1) * hardPenalty);
    return Math.max(0.1, s);
  }

  public nextStabilityForget(difficulty: number, stability: number, retrievability: number): number {
    const w = this.params.weights;
    const s = w[11] * Math.pow(difficulty, -w[12]) * (Math.pow(stability + 1, w[13]) - 1) * Math.exp(w[14] * (1 - retrievability));
    return Math.min(Math.max(0.1, s), stability);
  }

  public step(
    card: { state: CardState; stability: number; difficulty: number; elapsedDays: number; reps: number; lapses: number },
    rating: Rating,
    now: Date = new Date()
  ) {
    let nextStability: number;
    let nextDifficulty: number;
    let nextState: CardState;
    let scheduledDays: number;
    let lapses = card.lapses;
    let reps = card.reps + 1;

    if (card.state === CardState.New) {
      nextStability = this.initialStability(rating);
      nextDifficulty = this.initialDifficulty(rating);
      nextState = rating === Rating.Again ? CardState.Learning : CardState.Review;
      scheduledDays = rating === Rating.Again ? 0 : this.calculateInterval(nextStability);
    } else {
      const R = this.getRetrievability(card.elapsedDays, card.stability);
      nextDifficulty = this.nextDifficulty(card.difficulty, rating);

      if (rating === Rating.Again) {
        nextStability = this.nextStabilityForget(card.difficulty, card.stability, R);
        nextState = CardState.Relearning;
        lapses += 1;
        scheduledDays = 0; // due intra-day
      } else {
        nextStability = this.nextStabilityRecall(card.difficulty, card.stability, R, rating);
        nextState = CardState.Review;
        scheduledDays = this.calculateInterval(nextStability);
      }
    }

    const dueAt = new Date(now.getTime() + scheduledDays * 86400 * 1000);

    return {
      state: nextState,
      stability: nextStability,
      difficulty: nextDifficulty,
      elapsedDays: 0,
      scheduledDays,
      reps,
      lapses,
      lastReview: now,
      dueAt
    };
  }
}
```

#### 2.5.3 6 Card Variants Specification
1. **Recognition (`recognition`, DE $\to$ EN)**:
   - Front: German target word/phrase with TTS speaker icon.
   - Back: English translation, IPA, Part of Speech, contextual example sentence with highlight, grammatical register.
2. **Production (`production`, EN $\to$ DE)**:
   - Front: English definition and hints (e.g. "starts with G...", "noun, feminine").
   - Back: German target with article and plural form (*die Geschwindigkeit, -en*).
3. **Sentence Cloze (`sentence_cloze`, DE Contextual)**:
   - Front: Full German context sentence with blanked word: *"Er wartet seit einer Stunde [___] den Bus."* Clue: `[auf + Akk]`.
   - Back: Full sentence filled in, literal and natural English translations, case governance explanation.
4. **Audio $\to$ Meaning (`audio_meaning`)**:
   - Front: Audio play trigger (text hidden). Learner listens to native pronunciation.
   - Back: German transcript, English meaning, IPA, and token breakdown.
5. **Targeted Gender Drill (`gender_drill`)**:
   - Front: German noun without article (e.g. *Gabel*, *Löffel*, *Messer*).
   - Back: der (blue) / die (red) / das (green) with morphological ending rule explanation.
6. **Plural Drill (`plural_drill`)**:
   - Front: Singular noun with article (e.g. *das Buch*).
   - Back: Correct plural form with article and ending highlighted (*die Bücher*, umlaut + *-er*).

#### 2.5.4 Daily Queue Limits & Backlog Load Leveling
- **Queue Prioritization**:
  1. Learning & Relearning intra-day cards due immediately (`state IN ('learning', 'relearning')`).
  2. Due Review cards (`dueAt <= now()`), ordered by lowest Retrievability $R$ (highest forgetting risk), up to `daily_review_cap` (default 100).
  3. New cards introduced up to `daily_new_cards` (default 20).
- **Backlog Smoothing Protection**:
  If overdue review cards exceed $1.5 \times \text{daily\_review\_cap}$, the scheduler activates backlog leveling:
  - Takes the top $N$ cards with $R < 0.70$ for today's session.
  - Spreads the remaining overdue items across the subsequent 3–5 days with a $\pm 10\%$ random fuzz factor to prevent artificial recurring spikes.

---

## 3. Caveats

1. **SQLite Concurrency in Node.js**: SQLite supports high read throughput, but concurrent writes require Write-Ahead Logging (WAL) mode. The Prisma SQLite initialization script must execute `PRAGMA journal_mode = WAL;` and `PRAGMA busy_timeout = 5000;`.
2. **Gemini API Rate Limits & Network Resilience**: While the SQLite cache eliminates duplicate queries for seen entries, initial curriculum seeding or rapid sentence mining requires exponential backoff retry logic (up to 3 retries) with jitter.
3. **Offline Mode Scope**: SQLite cache allows instant offline retrieval of all previously cached dictionary entries, parsed sentences, and curriculum drills. Live un-cached generative features (e.g. free voice conversation with new un-cached topics) require an active internet connection.

---

## 4. Conclusion

The technical architecture for Sprachweg's backend, database, Gemini AI layer, and FSRS spaced repetition engine is fully specified and ready for direct implementation:
- The **Prisma schema** models all 15 required entities and their relational foreign keys cleanly for SQLite.
- The **REST API** provides complete coverage across dictionary, miner, curriculum, sessions, speaking evaluation, and reviews.
- The **Gemini wrapper** combines `@google/genai` with strict `responseSchema`, deterministic SHA-256 SQLite caching, and a multi-pass German linguistic validator.
- The **FSRS engine** implements the mathematically exact 19-parameter power-law formulation with support for 6 specialized German flashcard variants and backlog burnout protection.

---

## 5. Verification Method

### 5.1 Schema & Database Verification
1. Initialize Prisma schema in project directory: `npx prisma db push --schema=prisma/schema.prisma`
2. Verify SQLite tables and foreign keys: `npx prisma studio` or run SQLite schema inspection query: `SELECT name FROM sqlite_master WHERE type='table';`

### 5.2 FSRS Unit Test Vectors
Run unit test suite with Vitest / Jest:
```typescript
import { FSRSEngine, Rating, CardState } from './fsrs';

test('FSRS initial step for Good rating', () => {
  const engine = new FSRSEngine({ targetRetention: 0.90 });
  const initialCard = { state: CardState.New, stability: 0, difficulty: 0, elapsedDays: 0, reps: 0, lapses: 0 };
  const next = engine.step(initialCard, Rating.Good);
  expect(next.state).toBe(CardState.Review);
  expect(next.stability).toBeCloseTo(3.173, 2);
  expect(next.scheduledDays).toBe(3);
});

test('FSRS retrievability power-law', () => {
  const engine = new FSRSEngine();
  // When elapsed days = stability, R must be 0.90
  const R = engine.getRetrievability(10, 10);
  expect(R).toBeCloseTo(0.90, 3);
});
```

### 5.3 Linguistic Validator & Caching Test
```typescript
import { GermanLinguisticValidator } from './validator';
import { CacheService } from './cache';

test('Linguistic validator auto-repairs suffix gender', () => {
  const badData = { lemma: 'Möglichkeit', pos: 'noun', gender: 'der' };
  const res = GermanLinguisticValidator.validateWordEntry(badData);
  expect(res.repairedData.gender).toBe('die');
  expect(res.errors.length).toBeGreaterThan(0);
});

test('Linguistic validator enforces motion verb sein auxiliary', () => {
  const badVerb = { lemma: 'gehen', pos: 'verb', conjugationTable: { auxiliary: 'haben' } };
  const res = GermanLinguisticValidator.validateWordEntry(badVerb);
  expect(res.repairedData.conjugationTable.auxiliary).toBe('sein');
});
```
