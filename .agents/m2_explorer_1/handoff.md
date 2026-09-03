# Milestone 2 Architectural & Implementation Handoff Report

## 1. Observation

### 1.1 Requirements & Specifications
- **Authoritative Requirements (`ORIGINAL_REQUEST.md`)**:
  - `R1`: "Linguistic Verification: Multi-pass validation for grammar-critical attributes (gender, plural forms, auxiliary verbs haben/sein, case governance)."
  - `R2`: "Sentence Miner & Word Order Analysis Engine: Deep sentence teardown... word-by-word token analysis resolving lemma, POS, contextual meaning, and exact grammatical role... Visual word order map highlighting Position 1, Verb Position 2 (V2), Mittelfeld, and Verb-Final (Nebensatz / Klammerstruktur)... Side-by-Side Translations (literal & natural)... One-tap addition of any word or whole-sentence cloze card into FSRS deck, plus generation of 3 CEFR-calibrated variations."
  - `R4`: "FSRS Spaced Repetition System: Implementation of the Free Spaced Repetition Scheduler (FSRS) with stability, difficulty, retrievability, and interval calculations (superior to SM-2)... 6 Card Formats (Recognition, Production, Sentence Cloze, Audio -> Meaning, Gender drill, Plural drill)... Daily new card limits (default 20) and daily review ceilings."

- **Interface Contracts (`PROJECT.md:129-210` & `e2e/harness/contracts.ts`)**:
  - `TokenGrammar` requires: `token`, `lemma`, `pos`, `gender`, `case`, `grammaticalNumber`, `syntaxRole`, `topologicalField`, `tekamoloCategory`, `meaningEn`, `literalGlossEn`.
  - `SentenceAnalysis` requires: `sentenceDe`, `sentenceEnNatural`, `sentenceEnLiteral`, `tokens`, `topologicalMap` (`vorfeld`, `linkeSatzklammer`, `mittelfeld`, `rechteSatzklammer`, `nachfeld`), `isNebensatz`, `conjunctionTrigger`, `grammarTags`, `cefrLevel`, `variations`.
  - `FsrsCardData` requires: `id`, `userId`, `cardType`, `front`, `back`, `contextSentence`, `clozeDe`, `audioUrl`, `gender`, `plural`, `state`, `stability`, `difficulty`, `elapsedDays`, `scheduledDays`, `reps`, `lapses`, `dueAt`.
  - `FsrsScheduleResult` requires: `rating`, `card`, `reviewLog`.

- **Mathematical Ground Truths (`e2e/harness/referenceOracles.ts:25-236`)**:
  - `FsrsOracle.W`: 17 standard weights `[0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]`.
  - Retrievability curve: $R(t) = \left(1 + \frac{19}{81} \cdot \frac{t}{S}\right)^{-0.5}$.
  - Initial stability: $S_0(G) = \max(0.1, W[G - 1])$.
  - Initial difficulty: $D_0(G) = \text{clamp}(1.0, 10.0, W[4] - \exp(W[5] \cdot (G - 1)) + 1)$.
  - Next difficulty: $D' = \text{clamp}(1.0, 10.0, D - W[6] \cdot (G - 3) + W[7] \cdot (D_0(3) - D))$.
  - Recall stability ($G \in \{2, 3, 4\}$):
    $S'_{new} = \max(S + 0.1, S \cdot (1 + \exp(W[8]) \cdot (11 - D) \cdot S^{-W[9]} \cdot (\exp((1 - R) \cdot W[10]) - 1) \cdot h \cdot e))$.
  - Lapse stability ($G = 1$):
    $S'_{lapse} = \text{clamp}(0.1, S, \max(0.1, W[11] \cdot D^{-W[12]} \cdot ((S + 1)^{W[13]} - 1) \cdot \exp(W[14] \cdot (1 - R))))$.
  - Interval: $I = \text{clamp}(1, 36500, \text{round}((S / (19/81)) \cdot (r^{-2} - 1)))$ for request retention $r = 0.90$.

- **Database Model Capabilities (`prisma/schema.prisma:157-211`)**:
  - `Card` table supports `cardType` (`recognition`, `production`, `sentence_cloze`, `audio_meaning`, `gender_drill`, `plural_drill`), `state` (`new`, `learning`, `review`, `relearning`), `stability`, `difficulty`, `elapsedDays`, `scheduledDays`, `reps`, `lapses`, `dueAt`.
  - `Review` table stores audit logs with `stabilityBefore`, `stabilityAfter`, `difficultyBefore`, `difficultyAfter`, `elapsedDays`, `scheduledDays`, `rating`, `responseTimeMs`.
  - `Settings` table stores `dailyNewCards` (default 20), `dailyReviewCap` (default 100), `targetRetention` (default 0.90).

- **Current Test Suite Baseline**:
  - `runAllTests.ts`: 220/220 passing in 30ms across Tiers 1-4.
  - Server vitest suite: 67/67 passing in 9.27s (`adversarial_m1.test.ts`, `m1_stress_challenger.test.ts`, `m1.test.ts`).

---

## 2. Logic Chain

1. **Linguistic Verification Integrity (from Observation 1.1 & 1.3)**:
   - Grammatical validation in German requires deterministic rules before/alongside AI processing to catch declension errors, preposition mismatches, and incorrect auxiliary verbs.
   - We must create pure algorithmic modules for:
     - `prepositions.ts`: Accusative (bis, durch, für, gegen, ohne, um, entlang), Dative (aus, bei, mit, nach, seit, von, zu, gegenüber), Genitive (während, wegen, trotz, statt, anstatt, außerhalb, innerhalb), and Wechselpräpositionen (an, auf, hinter, in, neben, über, unter, vor, zwischen) factoring in directional motion vs static location.
     - `auxiliary.ts`: Strict motion/change-of-state/existential verbs (*gehen, fahren, fliegen, laufen, schwimmen, reisen, wandern, fallen, steigen, sterben, wachsen, aufstehen, einschlafen, bleiben, sein, werden, passieren, geschehen*) map to `sein`, while transitive, modal, reflexive, and duration verbs map to `haben`.
     - `declensions.ts`: 4-case declension matrices for definite, indefinite, and negative/possessive determiners; strong, weak, and mixed adjective endings; noun genitive singular (`-s`/`-es`) and dative plural (`-n` with exemption for `-s`/`-n` endings); N-declension weak nouns.
     - `satzklammer.ts`: Topological field segmentation (*Feldermodell*) into Vorfeld, Linke Satzklammer (V2 finite verb or subordinating conjunction trigger), Mittelfeld (TeKaMoLo ordering), Rechte Satzklammer (Partizip II / separable prefix / infinitive / subordinate verb cluster), and Nachfeld.
     - `errorDiagnostics.ts`: Multi-pass error classifier generating bilingual pedagogical explanations.

2. **FSRS Scheduling Mathematical Rigor (from Observation 1.3 & 1.4)**:
   - FSRS replaces heuristic SM-2 with continuous memory dynamics ($S, D, R$).
   - The scheduler must handle all 4 review ratings ($1=\text{Again}, 2=\text{Hard}, 3=\text{Good}, 4=\text{Easy}$) with strict boundary clamping ($D \in [1.0, 10.0]$, $S \ge 0.1$, $I \ge 1$).
   - Card state transitions must properly distinguish first-time learning (`NEW` $\to$ `LEARNING` or `REVIEW`) from lapses (`REVIEW` $\to$ `RELEARNING`).
   - Daily queue pacing must enforce user-configured `dailyNewCards` (20) and `dailyReviewCap` (100) with prioritized ordering (overdue reviews first, then new cards) and calculate `backlogSurplus`.
   - Every review must record full before/after state snapshots into the SQLite `reviews` table.

3. **Sentence Miner & Satzklammer Parser Architecture (from Observation 1.1 & 1.2)**:
   - Must provide both local algorithmic parsing and Gemini structured AI parsing (with SHA-256 caching).
   - Token teardown must output rich grammatical metadata (`lemma`, `pos`, `gender`, `case`, `grammaticalNumber`, `syntaxRole`, `topologicalField`, `tekamoloCategory`, `meaningEn`, `literalGlossEn`).
   - Must provide tri-tier interlinear side-by-side formatting (Tokens, literal word-for-word gloss, natural idiomatic English).
   - Must provide 1-tap card creation for Word (`RECOGNITION`/`PRODUCTION`), Sentence Cloze (`SENTENCE_CLOZE`), `GENDER_DRILL`, and `PLURAL_DRILL` cards with duplicate prevention per user.
   - Must generate 3 CEFR-calibrated variations (A1, A2, B1) with both German text and English translations.

4. **REST API & Test Integration (from Observation 1.4 & 1.5)**:
   - API endpoints must expose all linguistic validations, FSRS queue/review workflows, and sentence mining/card creation operations.
   - Unit & Integration tests in `server/tests/m2.test.ts` must comprehensively validate all algorithms, edge cases, and API routes.

---

## 3. Caveats

1. **Swiss German Orthography**:
   - Swiss German replaces `ß` with `ss`. The normalizer and validator must accept both standard German `ß` and Swiss `ss` without error.
2. **Dual-Gender Nouns**:
   - Certain German nouns allow multiple valid articles (e.g. *der/das Joghurt*, *der/das Radio*, *der/das Teil*). The validator must recognize both valid options.
3. **Complex Sentence Types**:
   - While simple main clauses follow strict V2 word order, real German sentences include V1 questions (*Hast du...?*), Imperatives (*Lies...!*), inverted Vorfeld, and subordinate clauses occupying the Vorfeld (*Weil es regnet, bleibt er zu Hause*). The Satzklammer engine must gracefully segment all these structures.

---

## 4. Conclusion & Concrete File Blueprint

The implementation for Milestone 2 is organized into 3 core engine directories, updated routes, and a dedicated test suite:

### 4.1 Directory Structure & File Map

```
server/src/
├── linguistics/
│   ├── types.ts                # German linguistic types, cases, genders, POS, error codes
│   ├── prepositions.ts         # Preposition case governance (Acc, Dat, Gen, Wechsel)
│   ├── auxiliary.ts            # Perfekt auxiliary selection (haben vs sein)
│   ├── declensions.ts          # 4-case noun, article, and adjective declension matrices
│   ├── satzklammer.ts          # Topological field parser (Vorfeld, Linke/Rechte Klammer, Mittelfeld)
│   ├── errorDiagnostics.ts     # Multi-pass pedagogical error diagnosis
│   └── index.ts                # Public module exports
├── fsrs/
│   ├── types.ts                # FSRS ratings, states, card data, review log types
│   ├── fsrsEngine.ts           # Full FSRS 4.5/5 mathematical engine (S, D, R, intervals)
│   ├── queueManager.ts         # Daily queue pacing, backlog protection & DB operations
│   └── index.ts                # Public module exports
├── miner/
│   ├── types.ts                # Miner types, token teardown, variations, cloze syntax
│   ├── sentenceMiner.ts        # Word-by-word token teardown & topological analyzer
│   ├── interlinear.ts          # Tri-tier side-by-side interlinear translation generator
│   ├── variations.ts           # 3 CEFR-calibrated variations & 1-tap card generator
│   └── index.ts                # Public module exports
├── routes/
│   ├── linguisticsRoutes.ts    # REST endpoints for validation & Satzklammer parsing
│   ├── cardRoutes.ts           # Enhanced FSRS card review, study-queue & CRUD endpoints
│   └── minerRoutes.ts          # Enhanced sentence analysis, cloze mining & variations endpoints
└── server.ts                   # Mounts /api/linguistics, /api/cards, /api/miner
server/tests/
└── m2.test.ts                  # Comprehensive Milestone 2 Unit & Integration Vitest suite
```

---

### 4.2 Concrete Code Specifications

#### File 1: `server/src/linguistics/types.ts`
```typescript
export type Gender = 'der' | 'die' | 'das';
export type GermanCase = 'NOMINATIV' | 'AKKUSATIV' | 'DATIV' | 'GENITIV';
export type GrammaticalNumber = 'SINGULAR' | 'PLURAL';
export type POS = 'NOUN' | 'VERB' | 'ADJ' | 'ADV' | 'ART' | 'PREP' | 'PRON' | 'CONJ' | 'PART' | 'OTHER';
export type TopologicalField = 'VORFELD' | 'LINKE_SATZKLAMMER' | 'MITTELFELD' | 'RECHTE_SATZKLAMMER' | 'NACHFELD';
export type TeKaMoLo = 'TEMPORAL' | 'KAUSAL' | 'MODAL' | 'LOKAL';
export type DeclensionCategory = 'strong' | 'weak' | 'mixed';

export interface PrepositionValidationResult {
  valid: boolean;
  preposition: string;
  detectedCase: GermanCase;
  expectedCases: GermanCase[];
  isWechsel: boolean;
  explanation: string;
}

export interface AuxiliaryValidationResult {
  valid: boolean;
  verbLemma: string;
  detectedAuxiliary: 'haben' | 'sein';
  expectedAuxiliary: 'haben' | 'sein';
  explanation: string;
}

export interface DeclensionValidationResult {
  valid: boolean;
  noun: string;
  gender: Gender;
  case: GermanCase;
  number: GrammaticalNumber;
  expectedForm: string;
  explanation: string;
}

export interface TopologicalParseResult {
  vorfeld: string;
  linkeSatzklammer: string;
  mittelfeld: string;
  rechteSatzklammer: string;
  nachfeld: string;
  isNebensatz: boolean;
  clauseType: 'HAUPTSATZ_V2' | 'NEBENSATZ' | 'V1_QUESTION' | 'V1_IMPERATIVE';
  conjunctionTrigger?: string;
  finiteVerb?: string;
  verbFinal?: string;
}

export type DiagnosticErrorCode =
  | 'GENDER_MISMATCH'
  | 'CASE_GOVERNANCE_ERROR'
  | 'AUXILIARY_SELECTION_ERROR'
  | 'V2_WORD_ORDER_VIOLATION'
  | 'NEBENSATZ_VERB_FINAL_VIOLATION'
  | 'ADJECTIVE_DECLENSION_ERROR'
  | 'NOUN_DECLENSION_ERROR'
  | 'PLURAL_FORMATION_ERROR'
  | 'CAPITALIZATION_ERROR'
  | 'UMLAUT_SPELLING_ERROR';

export interface DiagnosticError {
  code: DiagnosticErrorCode;
  messageEn: string;
  messageDe: string;
  expected: string;
  actual: string;
  ruleExplanation: string;
  grammarTag: string;
  severity: 'ERROR' | 'WARNING';
}

export interface DiagnosticReport {
  isValid: boolean;
  errors: DiagnosticError[];
  suggestions: string[];
}
```

#### File 2: `server/src/linguistics/prepositions.ts`
```typescript
import { GermanCase, PrepositionValidationResult } from './types.js';

export const ACCUSATIVE_PREPOSITIONS = new Set(['bis', 'durch', 'für', 'gegen', 'ohne', 'um', 'entlang']);
export const DATIVE_PREPOSITIONS = new Set(['aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu', 'gegenüber']);
export const GENITIVE_PREPOSITIONS = new Set(['während', 'wegen', 'trotz', 'statt', 'anstatt', 'außerhalb', 'innerhalb']);
export const WECHSEL_PREPOSITIONS = new Set(['an', 'auf', 'hinter', 'in', 'neben', 'über', 'unter', 'vor', 'zwischen']);

export const PREPOSITION_CONTRACTIONS: Record<string, { prep: string; case: GermanCase; article: string }> = {
  im: { prep: 'in', case: 'DATIV', article: 'dem' },
  ins: { prep: 'in', case: 'AKKUSATIV', article: 'das' },
  am: { prep: 'an', case: 'DATIV', article: 'dem' },
  ans: { prep: 'an', case: 'AKKUSATIV', article: 'das' },
  beim: { prep: 'bei', case: 'DATIV', article: 'dem' },
  vom: { prep: 'von', case: 'DATIV', article: 'dem' },
  zum: { prep: 'zu', case: 'DATIV', article: 'dem' },
  zur: { prep: 'zu', case: 'DATIV', article: 'der' },
  fürs: { prep: 'für', case: 'AKKUSATIV', article: 'das' },
  durchs: { prep: 'durch', case: 'AKKUSATIV', article: 'das' },
  ums: { prep: 'um', case: 'AKKUSATIV', article: 'das' },
};

export function validatePrepositionCase(
  preposition: string,
  detectedCase: GermanCase,
  isDirectional: boolean = false
): PrepositionValidationResult {
  const prep = preposition.toLowerCase().trim();

  // Check contractions
  if (PREPOSITION_CONTRACTIONS[prep]) {
    const info = PREPOSITION_CONTRACTIONS[prep];
    const valid = detectedCase === info.case;
    return {
      valid,
      preposition: info.prep,
      detectedCase,
      expectedCases: [info.case],
      isWechsel: WECHSEL_PREPOSITIONS.has(info.prep),
      explanation: valid
        ? `Contraction "${prep}" correctly fuses "${info.prep} + ${info.article}" in ${info.case}.`
        : `Contraction "${prep}" requires ${info.case}, but ${detectedCase} was provided.`,
    };
  }

  if (ACCUSATIVE_PREPOSITIONS.has(prep)) {
    const valid = detectedCase === 'AKKUSATIV';
    return {
      valid,
      preposition: prep,
      detectedCase,
      expectedCases: ['AKKUSATIV'],
      isWechsel: false,
      explanation: valid
        ? `The preposition "${prep}" strictly governs the Akkusativ case (DOGFU: durch, ohne, gegen, für, um).`
        : `The preposition "${prep}" requires Akkusativ, but ${detectedCase} was found.`,
    };
  }

  if (DATIVE_PREPOSITIONS.has(prep)) {
    const valid = detectedCase === 'DATIV';
    return {
      valid,
      preposition: prep,
      detectedCase,
      expectedCases: ['DATIV'],
      isWechsel: false,
      explanation: valid
        ? `The preposition "${prep}" strictly governs the Dativ case (aus, bei, mit, nach, seit, von, zu).`
        : `The preposition "${prep}" requires Dativ, but ${detectedCase} was found.`,
    };
  }

  if (GENITIVE_PREPOSITIONS.has(prep)) {
    const valid = detectedCase === 'GENITIV';
    return {
      valid,
      preposition: prep,
      detectedCase,
      expectedCases: ['GENITIV'],
      isWechsel: false,
      explanation: valid
        ? `The preposition "${prep}" governs the Genitiv case (während, wegen, trotz, statt).`
        : `The preposition "${prep}" requires Genitiv, but ${detectedCase} was found.`,
    };
  }

  if (WECHSEL_PREPOSITIONS.has(prep)) {
    const expectedCase: GermanCase = isDirectional ? 'AKKUSATIV' : 'DATIV';
    const valid = detectedCase === expectedCase;
    return {
      valid,
      preposition: prep,
      detectedCase,
      expectedCases: [expectedCase],
      isWechsel: true,
      explanation: valid
        ? `Wechselpräposition "${prep}" correctly uses ${expectedCase} for ${isDirectional ? 'directional motion (Wohin?)' : 'static location (Wo?)'}.`
        : `Wechselpräposition "${prep}" requires ${expectedCase} for ${isDirectional ? 'directional motion (Wohin?)' : 'static location (Wo?)'}, but ${detectedCase} was found.`,
    };
  }

  return {
    valid: true,
    preposition: prep,
    detectedCase,
    expectedCases: [detectedCase],
    isWechsel: false,
    explanation: `Preposition "${prep}" recognized.`,
  };
}
```

#### File 3: `server/src/linguistics/auxiliary.ts`
```typescript
import { AuxiliaryValidationResult } from './types.js';

export const SEIN_AUX_VERBS = new Set([
  'gehen', 'kommen', 'fahren', 'fliegen', 'laufen', 'schwimmen', 'reisen', 'wandern',
  'fallen', 'steigen', 'sterben', 'wachsen', 'aufstehen', 'einschlafen', 'bleiben',
  'sein', 'werden', 'passieren', 'geschehen', 'rennen', 'springen', 'ankommen',
  'abfahren', 'umsteigen', 'aussteigen', 'einsteigen', 'aufwachen', 'ertrinken',
  'schmelzen', 'verblühen', 'entstehen', 'gelingen', 'misslingen'
]);

export function getAuxiliaryVerb(verbLemma: string): 'haben' | 'sein' {
  const lemma = verbLemma.toLowerCase().trim();
  if (SEIN_AUX_VERBS.has(lemma)) {
    return 'sein';
  }
  return 'haben';
}

export function validateAuxiliaryVerb(
  verbLemma: string,
  detectedAuxiliary?: 'haben' | 'sein'
): AuxiliaryValidationResult {
  const lemma = verbLemma.toLowerCase().trim();
  const expectedAuxiliary = getAuxiliaryVerb(lemma);
  const detected = detectedAuxiliary || expectedAuxiliary;
  const valid = detected === expectedAuxiliary;

  const explanation = valid
    ? expectedAuxiliary === 'sein'
      ? `"${lemma}" indicates motion, a change of state, or is an existential verb (sein/bleiben/werden), requiring auxiliary "sein".`
      : `"${lemma}" is a transitive or standard action verb, requiring auxiliary "haben".`
    : `Incorrect auxiliary verb "${detected}" used for "${lemma}". It requires "${expectedAuxiliary}".`;

  return {
    valid,
    verbLemma: lemma,
    detectedAuxiliary: detected,
    expectedAuxiliary,
    explanation,
  };
}
```

#### File 4: `server/src/linguistics/declensions.ts`
```typescript
import { Gender, GermanCase, GrammaticalNumber, DeclensionCategory, DeclensionValidationResult } from './types.js';

export const DEFINITE_ARTICLES: Record<GermanCase, Record<Gender | 'diePlural', string>> = {
  NOMINATIV: { der: 'der', die: 'die', das: 'das', diePlural: 'die' },
  AKKUSATIV: { der: 'den', die: 'die', das: 'das', diePlural: 'die' },
  DATIV: { der: 'dem', die: 'der', das: 'dem', diePlural: 'den' },
  GENITIV: { der: 'des', die: 'der', das: 'des', diePlural: 'der' },
};

export const INDEFINITE_ARTICLES: Record<GermanCase, Record<Gender, string>> = {
  NOMINATIV: { der: 'ein', die: 'eine', das: 'ein' },
  AKKUSATIV: { der: 'einen', die: 'eine', das: 'ein' },
  DATIV: { der: 'einem', die: 'einer', das: 'einem' },
  GENITIV: { der: 'eines', die: 'einer', das: 'eines' },
};

export const WEAK_ADJECTIVE_ENDINGS: Record<GermanCase, Record<Gender | 'diePlural', string>> = {
  NOMINATIV: { der: 'e', die: 'e', das: 'e', diePlural: 'en' },
  AKKUSATIV: { der: 'en', die: 'e', das: 'e', diePlural: 'en' },
  DATIV: { der: 'en', die: 'en', das: 'en', diePlural: 'en' },
  GENITIV: { der: 'en', die: 'en', das: 'en', diePlural: 'en' },
};

export const MIXED_ADJECTIVE_ENDINGS: Record<GermanCase, Record<Gender | 'diePlural', string>> = {
  NOMINATIV: { der: 'er', die: 'e', das: 'es', diePlural: 'en' },
  AKKUSATIV: { der: 'en', die: 'e', das: 'es', diePlural: 'en' },
  DATIV: { der: 'en', die: 'en', das: 'en', diePlural: 'en' },
  GENITIV: { der: 'en', die: 'en', das: 'en', diePlural: 'en' },
};

export const STRONG_ADJECTIVE_ENDINGS: Record<GermanCase, Record<Gender | 'diePlural', string>> = {
  NOMINATIV: { der: 'er', die: 'e', das: 'es', diePlural: 'e' },
  AKKUSATIV: { der: 'en', die: 'e', das: 'es', diePlural: 'e' },
  DATIV: { der: 'em', die: 'er', das: 'em', diePlural: 'en' },
  GENITIV: { der: 'en', die: 'er', das: 'en', diePlural: 'er' },
};

export function validateNounDeclension(
  noun: string,
  gender: Gender,
  targetCase: GermanCase,
  number: GrammaticalNumber,
  isNDeclension: boolean = false
): string {
  const cleanNoun = noun.trim();

  if (isNDeclension && gender === 'der' && !(targetCase === 'NOMINATIV' && number === 'SINGULAR')) {
    if (cleanNoun.endsWith('e')) return `${cleanNoun}n`;
    if (!cleanNoun.endsWith('en')) return `${cleanNoun}en`;
    return cleanNoun;
  }

  if (number === 'SINGULAR') {
    if (targetCase === 'GENITIV') {
      if (gender === 'der' || gender === 'das') {
        if (cleanNoun.endsWith('s') || cleanNoun.endsWith('z') || cleanNoun.endsWith('ß') || cleanNoun.endsWith('sch') || cleanNoun.endsWith('x') || cleanNoun.endsWith('tz')) {
          return `${cleanNoun}es`;
        }
        return `${cleanNoun}s`;
      }
    }
    return cleanNoun;
  } else {
    // Dative plural adds -n if not ending in -n or -s
    if (targetCase === 'DATIV') {
      if (!cleanNoun.endsWith('n') && !cleanNoun.endsWith('s')) {
        return `${cleanNoun}n`;
      }
    }
    return cleanNoun;
  }
}
```

#### File 5: `server/src/linguistics/satzklammer.ts`
```typescript
import { TopologicalParseResult } from './types.js';

export const SUBORDINATING_CONJUNCTIONS = new Set([
  'weil', 'dass', 'daß', 'wenn', 'ob', 'obwohl', 'da', 'bevor', 'nachdem',
  'während', 'damit', 'falls', 'indem', 'sodass', 'sofern', 'solange', 'ehe'
]);

export const SEPARABLE_PREFIXES = new Set([
  'ab', 'an', 'auf', 'aus', 'bei', 'ein', 'fest', 'fort', 'her', 'hin',
  'los', 'mit', 'nach', 'vor', 'weg', 'weiter', 'zu', 'zurück', 'zusammen'
]);

export function parseSatzklammer(sentence: string): TopologicalParseResult {
  const cleanSentence = sentence.trim().replace(/[.!?]+$/, '');
  const words = cleanSentence.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return {
      vorfeld: '',
      linkeSatzklammer: '',
      mittelfeld: '',
      rechteSatzklammer: '',
      nachfeld: '',
      isNebensatz: false,
      clauseType: 'HAUPTSATZ_V2',
    };
  }

  const rawFirst = words[0].replace(/[,.!?]/g, '');
  const firstLower = rawFirst.toLowerCase();
  const isSubordinate = SUBORDINATING_CONJUNCTIONS.has(firstLower);

  if (isSubordinate) {
    const conjunction = words[0];
    const verbPart = words[words.length - 1];
    const mittelfeld = words.slice(1, words.length - 1).join(' ');
    return {
      vorfeld: '',
      linkeSatzklammer: conjunction,
      mittelfeld,
      rechteSatzklammer: verbPart,
      nachfeld: '',
      isNebensatz: true,
      conjunctionTrigger: firstLower,
      clauseType: 'NEBENSATZ',
      verbFinal: verbPart,
    };
  }

  // Check V1 Question / Imperative
  const isQuestion = sentence.includes('?');
  const isImperative = sentence.includes('!') || /^[A-ZÄÖÜ][a-zäöüß]+(en|t|e|st)\b/.test(words[0]);

  // Standard Main Clause (Hauptsatz V2)
  const vorfeld = words[0] || '';
  const finiteVerb = words[1] || '';
  let rechteSatzklammer = '';
  let mittelfeldWords = words.slice(2);

  if (words.length > 2) {
    const rawLast = words[words.length - 1].replace(/[,.!?]/g, '');
    const isLowercase = rawLast.charAt(0) === rawLast.charAt(0).toLowerCase();
    const isPrefix = SEPARABLE_PREFIXES.has(rawLast.toLowerCase());
    const isParticipleOrInfinitive = isLowercase && (rawLast.startsWith('ge') || rawLast.endsWith('en') || rawLast.endsWith('t'));

    if (isPrefix || isParticipleOrInfinitive) {
      rechteSatzklammer = rawLast;
      mittelfeldWords = words.slice(2, words.length - 1);
    }
  }

  return {
    vorfeld,
    linkeSatzklammer: finiteVerb,
    mittelfeld: mittelfeldWords.join(' '),
    rechteSatzklammer,
    nachfeld: '',
    isNebensatz: false,
    clauseType: isQuestion ? 'V1_QUESTION' : isImperative && words.length < 4 ? 'V1_IMPERATIVE' : 'HAUPTSATZ_V2',
    finiteVerb,
    verbFinal: rechteSatzklammer || undefined,
  };
}
```

#### File 6: `server/src/linguistics/errorDiagnostics.ts`
```typescript
import { DiagnosticReport, DiagnosticError } from './types.js';
import { validatePrepositionCase } from './prepositions.js';
import { getAuxiliaryVerb } from './auxiliary.js';

export class ErrorDiagnosticsEngine {
  public static diagnose(input: string, expected: string): DiagnosticReport {
    const errors: DiagnosticError[] = [];
    const inWords = input.trim().split(/\s+/);
    const expWords = expected.trim().split(/\s+/);

    // 1. Check Auxiliary Selection (e.g. "habe gefahren" -> "bin gefahren")
    if (/\b(habe|hast|hat|haben|habt)\s+(gefahren|gegangen|geflogen|gelaufen|geblieben|gestorben|gewachsen)\b/i.test(input)) {
      errors.push({
        code: 'AUXILIARY_SELECTION_ERROR',
        messageEn: 'Incorrect auxiliary verb "haben" used with a verb of motion or state change.',
        messageDe: 'Falsches Hilfsverb "haben" für ein Verb der Orts- oder Zustandsveränderung verwendet.',
        expected: 'sein (bin/bist/ist/sind/seid)',
        actual: 'haben',
        ruleExplanation: 'Verbs indicating change of place (fahren, gehen) or change of state take "sein" in the Perfekt tense.',
        grammarTag: 'perfekt_auxiliary_sein',
        severity: 'ERROR',
      });
    }

    // 2. Check Preposition Governance (e.g. "mit die Frau" -> "mit der Frau")
    if (/\bmit\s+die\b/i.test(input)) {
      errors.push({
        code: 'CASE_GOVERNANCE_ERROR',
        messageEn: 'Preposition "mit" requires Dativ case (mit der Frau).',
        messageDe: 'Die Präposition "mit" verlangt den Dativ (mit der Frau).',
        expected: 'mit der',
        actual: 'mit die',
        ruleExplanation: '"mit" is strictly a Dativ preposition (aus, bei, mit, nach, seit, von, zu).',
        grammarTag: 'preposition_dative_mit',
        severity: 'ERROR',
      });
    }

    // 3. Check Subordinate Word Order (e.g. "weil ich will gehen" -> "weil ich gehen will")
    if (/\b(weil|dass|wenn|obwohl)\s+[^,.]+\b(will|kann|muss|soll|darf|hat|ist)\s+([a-zäöüß]+en)\b/i.test(input)) {
      errors.push({
        code: 'NEBENSATZ_VERB_FINAL_VIOLATION',
        messageEn: 'Finite verb must be placed at the very end of subordinate clauses introduced by "weil/dass/wenn".',
        messageDe: 'Das finite Verb muss im Nebensatz an letzter Stelle stehen.',
        expected: '... gehen will',
        actual: '... will gehen',
        ruleExplanation: 'In Nebensätzen with modal verbs, the finite modal verb occupies the final position after the infinitive.',
        grammarTag: 'word_order_nebensatz',
        severity: 'ERROR',
      });
    }

    // 4. Check Capitalization for German Nouns
    for (let i = 0; i < inWords.length; i++) {
      const iw = inWords[i];
      const ew = expWords[i];
      if (ew && /^[A-ZÄÖÜ]/.test(ew) && /^[a-zäöü]/.test(iw)) {
        errors.push({
          code: 'CAPITALIZATION_ERROR',
          messageEn: `German nouns must always be capitalized: "${ew}".`,
          messageDe: `Deutsche Substantive müssen großgeschrieben werden: "${ew}".`,
          expected: ew,
          actual: iw,
          ruleExplanation: 'All German nouns (Substantive) start with a capital letter.',
          grammarTag: 'noun_capitalization',
          severity: 'WARNING',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions: errors.map(e => e.ruleExplanation),
    };
  }
}
```

---

#### File 7: `server/src/fsrs/types.ts`
```typescript
export type FsrsRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy
export type CardType = 'RECOGNITION' | 'PRODUCTION' | 'SENTENCE_CLOZE' | 'AUDIO_MEANING' | 'GENDER_DRILL' | 'PLURAL_DRILL';
export type CardState = 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';
export type Gender = 'der' | 'die' | 'das';

export interface FsrsCardData {
  id: string;
  userId: string;
  cardType: CardType;
  front: string;
  back: string;
  contextSentence?: string;
  clozeDe?: string;
  audioUrl?: string;
  gender?: Gender;
  plural?: string;
  state: CardState;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReviewedAt?: string;
  dueAt: string;
}

export interface FsrsScheduleResult {
  rating: FsrsRating;
  card: FsrsCardData;
  reviewLog: {
    rating: FsrsRating;
    state: CardState;
    stability: number;
    difficulty: number;
    elapsedDays: number;
    scheduledDays: number;
    reviewedAt: string;
  };
}

export interface DailyQueuePayload {
  reviewQueue: FsrsCardData[];
  newQueue: FsrsCardData[];
  totalToday: number;
  backlogSurplus: number;
  dailyNewLimit: number;
  dailyReviewLimit: number;
}
```

#### File 8: `server/src/fsrs/fsrsEngine.ts`
```typescript
import { FsrsCardData, FsrsRating, FsrsScheduleResult, CardState } from './types.js';

export class FsrsEngine {
  public static readonly W = [
    0.4, 0.6, 2.4, 5.8,      // w0..w3: Initial stabilities
    4.93, 0.94, 0.86, 0.01,  // w4..w7: Difficulty parameters
    1.49, 0.14, 0.94,        // w8..w10: Stability increase parameters
    2.18, 0.05, 0.34, 1.26,  // w11..w14: Lapse stability parameters
    0.29, 2.61               // w15..w16: Hard / Easy modifiers
  ];

  public static readonly REQUEST_RETENTION = 0.9;
  public static readonly DECAY = -0.5;
  public static readonly FACTOR = 19 / 81;

  public static calculateRetrievability(stability: number, elapsedDays: number): number {
    if (elapsedDays <= 0) return 1.0;
    if (stability <= 0) return 0.0;
    const r = Math.pow(1 + (this.FACTOR * elapsedDays) / stability, this.DECAY);
    return Math.max(0.0, Math.min(1.0, r));
  }

  public static calculateInitialStability(rating: FsrsRating): number {
    return Math.max(0.1, this.W[rating - 1]);
  }

  public static calculateInitialDifficulty(rating: FsrsRating): number {
    const d0 = this.W[4] - Math.exp(this.W[5] * (rating - 1)) + 1;
    return Math.max(1.0, Math.min(10.0, d0));
  }

  public static calculateNextDifficulty(currentDifficulty: number, rating: FsrsRating): number {
    const deltaD = -this.W[6] * (rating - 3);
    const meanReversion = this.W[7] * (this.calculateInitialDifficulty(3) - currentDifficulty);
    const nextD = currentDifficulty + deltaD + meanReversion;
    return Math.max(1.0, Math.min(10.0, nextD));
  }

  public static calculateNextStabilityReview(
    stability: number,
    difficulty: number,
    retrievability: number,
    rating: FsrsRating
  ): number {
    if (rating === 1) {
      const lapseS =
        this.W[11] *
        Math.pow(difficulty, -this.W[12]) *
        (Math.pow(stability + 1, this.W[13]) - 1) *
        Math.exp(this.W[14] * (1 - retrievability));
      return Math.max(0.1, Math.min(stability, Math.max(0.1, lapseS)));
    }

    const hardMultiplier = rating === 2 ? this.W[15] : 1.0;
    const easyMultiplier = rating === 4 ? this.W[16] : 1.0;
    const sInc =
      Math.exp(this.W[8]) *
      (11 - difficulty) *
      Math.pow(stability, -this.W[9]) *
      (Math.exp((1 - retrievability) * this.W[10]) - 1) *
      hardMultiplier *
      easyMultiplier;

    return Math.max(stability + 0.1, stability * (1 + sInc));
  }

  public static calculateInterval(stability: number, requestRetention: number = 0.9): number {
    const interval = (stability / this.FACTOR) * (Math.pow(requestRetention, 1 / this.DECAY) - 1);
    const rounded = Math.max(1, Math.round(interval));
    return Math.min(36500, rounded);
  }

  public static scheduleCard(
    card: FsrsCardData,
    rating: FsrsRating,
    currentDate: Date = new Date(),
    targetRetention: number = 0.90
  ): FsrsScheduleResult {
    let nextStability: number;
    let nextDifficulty: number;
    let nextState = card.state;
    let nextScheduledDays: number;
    let nextLapses = card.lapses;
    let nextReps = card.reps + 1;

    if (card.state === 'NEW') {
      nextStability = this.calculateInitialStability(rating);
      nextDifficulty = this.calculateInitialDifficulty(rating);
      if (rating === 1) {
        nextState = 'LEARNING';
        nextScheduledDays = 0;
        nextLapses += 1;
      } else {
        nextState = 'REVIEW';
        nextScheduledDays = this.calculateInterval(nextStability, targetRetention);
      }
    } else {
      const r = this.calculateRetrievability(card.stability, card.elapsedDays);
      nextDifficulty = this.calculateNextDifficulty(card.difficulty, rating);
      nextStability = this.calculateNextStabilityReview(card.stability, nextDifficulty, r, rating);

      if (rating === 1) {
        nextState = 'RELEARNING';
        nextScheduledDays = 0;
        nextLapses += 1;
      } else {
        nextState = 'REVIEW';
        nextScheduledDays = this.calculateInterval(nextStability, targetRetention);
      }
    }

    const dueAtDate = new Date(currentDate.getTime() + nextScheduledDays * 86400000);

    const updatedCard: FsrsCardData = {
      ...card,
      state: nextState,
      stability: Number(nextStability.toFixed(4)),
      difficulty: Number(nextDifficulty.toFixed(4)),
      elapsedDays: 0,
      scheduledDays: nextScheduledDays,
      reps: nextReps,
      lapses: nextLapses,
      lastReviewedAt: currentDate.toISOString(),
      dueAt: dueAtDate.toISOString(),
    };

    return {
      rating,
      card: updatedCard,
      reviewLog: {
        rating,
        state: card.state,
        stability: updatedCard.stability,
        difficulty: updatedCard.difficulty,
        elapsedDays: card.elapsedDays,
        scheduledDays: nextScheduledDays,
        reviewedAt: currentDate.toISOString(),
      },
    };
  }

  public static previewRatings(
    card: FsrsCardData,
    currentDate: Date = new Date(),
    targetRetention: number = 0.90
  ): Record<FsrsRating, { intervalDays: number; state: CardState; stability: number; difficulty: number }> {
    return {
      1: this.scheduleCard(card, 1, currentDate, targetRetention).card,
      2: this.scheduleCard(card, 2, currentDate, targetRetention).card,
      3: this.scheduleCard(card, 3, currentDate, targetRetention).card,
      4: this.scheduleCard(card, 4, currentDate, targetRetention).card,
    } as any;
  }
}
```

#### File 9: `server/src/fsrs/queueManager.ts`
```typescript
import { prisma } from '../db/prisma.js';
import { FsrsCardData, FsrsRating, DailyQueuePayload, CardType, CardState } from './types.js';
import { FsrsEngine } from './fsrsEngine.js';

export class FsrsQueueManager {
  public static async getDailyStudyQueue(
    userId: string,
    now: Date = new Date()
  ): Promise<DailyQueuePayload> {
    const settings = await prisma.settings.findUnique({ where: { userId } });
    const dailyNewLimit = settings?.dailyNewCards ?? 20;
    const dailyReviewLimit = settings?.dailyReviewCap ?? 100;

    const allUserCards = await prisma.card.findMany({
      where: { userId },
      orderBy: { dueAt: 'asc' },
    });

    const mappedCards: FsrsCardData[] = allUserCards.map(c => {
      const elapsedDays = c.lastReview
        ? Math.max(0, (now.getTime() - new Date(c.lastReview).getTime()) / 86400000)
        : 0;
      return {
        id: c.id,
        userId: c.userId,
        cardType: c.cardType.toUpperCase() as CardType,
        front: c.prompt,
        back: c.answer,
        contextSentence: c.contextSentence || undefined,
        state: c.state.toUpperCase() as CardState,
        stability: c.stability,
        difficulty: c.difficulty,
        elapsedDays: Number(elapsedDays.toFixed(2)),
        scheduledDays: c.scheduledDays,
        reps: c.reps,
        lapses: c.lapses,
        dueAt: c.dueAt.toISOString(),
      };
    });

    const dueReviews = mappedCards.filter(
      c => c.state !== 'NEW' && new Date(c.dueAt).getTime() <= now.getTime()
    );
    const newCards = mappedCards.filter(c => c.state === 'NEW');

    const cappedReviews = dueReviews.slice(0, dailyReviewLimit);
    const cappedNew = newCards.slice(0, dailyNewLimit);
    const backlogSurplus = Math.max(0, dueReviews.length - dailyReviewLimit);

    return {
      reviewQueue: cappedReviews,
      newQueue: cappedNew,
      totalToday: cappedReviews.length + cappedNew.length,
      backlogSurplus,
      dailyNewLimit,
      dailyReviewLimit,
    };
  }

  public static async submitReview(
    cardId: string,
    userId: string,
    rating: FsrsRating,
    responseTimeMs: number = 0,
    reviewedAt: Date = new Date()
  ) {
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new Error('Card not found');

    const settings = await prisma.settings.findUnique({ where: { userId } });
    const targetRetention = settings?.targetRetention ?? 0.90;

    const elapsedDays = card.lastReview
      ? Math.max(0, (reviewedAt.getTime() - new Date(card.lastReview).getTime()) / 86400000)
      : 0;

    const fsrsCard: FsrsCardData = {
      id: card.id,
      userId: card.userId,
      cardType: card.cardType.toUpperCase() as CardType,
      front: card.prompt,
      back: card.answer,
      contextSentence: card.contextSentence || undefined,
      state: card.state.toUpperCase() as CardState,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsedDays,
      scheduledDays: card.scheduledDays,
      reps: card.reps,
      lapses: card.lapses,
      dueAt: card.dueAt.toISOString(),
    };

    const scheduled = FsrsEngine.scheduleCard(fsrsCard, rating, reviewedAt, targetRetention);

    const updatedDbCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        state: scheduled.card.state.toLowerCase(),
        stability: scheduled.card.stability,
        difficulty: scheduled.card.difficulty,
        scheduledDays: scheduled.card.scheduledDays,
        elapsedDays: 0,
        reps: scheduled.card.reps,
        lapses: scheduled.card.lapses,
        lastReview: reviewedAt,
        dueAt: new Date(scheduled.card.dueAt),
      },
    });

    const reviewLog = await prisma.review.create({
      data: {
        cardId,
        userId,
        rating,
        reviewType: fsrsCard.state.toLowerCase(),
        elapsedDays: Number(elapsedDays.toFixed(2)),
        scheduledDays: scheduled.card.scheduledDays,
        stabilityBefore: card.stability,
        stabilityAfter: scheduled.card.stability,
        difficultyBefore: card.difficulty,
        difficultyAfter: scheduled.card.difficulty,
        responseTimeMs,
        reviewedAt,
      },
    });

    return { card: updatedDbCard, review: reviewLog, scheduledResult: scheduled };
  }
}
```

---

#### File 10: `server/src/miner/sentenceMiner.ts`
```typescript
import { SentenceAnalysis, TokenGrammar, Gender, GermanCase, POS, TopologicalField, TeKaMoLo } from './types.js';
import { parseSatzklammer } from '../linguistics/satzklammer.js';
import { geminiService, SentenceAnalysisResponseSchema } from '../ai/geminiClient.js';
import { prisma } from '../db/prisma.js';

export class SentenceMinerEngine {
  public static async analyzeSentence(sentenceDe: string, level: string = 'auto'): Promise<SentenceAnalysis> {
    const cleanSentence = sentenceDe.trim();

    // 1. Call structured Gemini with cache
    const aiAnalysis = await geminiService.generateStructured<any>({
      prompt: `Analyze this German sentence: "${cleanSentence}". Target CEFR level: ${level}.`,
      responseSchema: SentenceAnalysisResponseSchema,
      cacheType: 'sentence_analysis',
      cacheKeyData: { sentence: cleanSentence, level },
    });

    // 2. Validate topological fields with deterministic Satzklammer parser
    const topo = parseSatzklammer(cleanSentence);

    const tokens: TokenGrammar[] = (aiAnalysis.tokens || []).map((t: any) => ({
      token: t.surfaceToken || t.token,
      lemma: t.lemma || t.surfaceToken,
      pos: (t.pos || 'OTHER').toUpperCase() as POS,
      gender: t.gender ? (t.gender.toLowerCase() as Gender) : null,
      case: t.case ? (t.case.toUpperCase() as GermanCase) : null,
      grammaticalNumber: t.grammaticalNumber ? (t.grammaticalNumber.toUpperCase() as any) : null,
      syntaxRole: t.syntaxRole || 'constituent',
      topologicalField: (t.topologicalField || 'MITTELFELD').toUpperCase() as TopologicalField,
      tekamoloCategory: t.tekamoloCategory ? (t.tekamoloCategory.toUpperCase() as TeKaMoLo) : null,
      meaningEn: t.meaningEn || '',
      literalGlossEn: t.literalGlossEn || t.meaningEn || '',
    }));

    const result: SentenceAnalysis = {
      sentenceDe: cleanSentence,
      sentenceEnNatural: aiAnalysis.textEnNatural || '',
      sentenceEnLiteral: aiAnalysis.textEnLiteral || '',
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
      variations: aiAnalysis.variations || [
        { level: 'A1', textDe: cleanSentence, textEn: aiAnalysis.textEnNatural },
        { level: 'A2', textDe: cleanSentence, textEn: aiAnalysis.textEnNatural },
        { level: 'B1', textDe: cleanSentence, textEn: aiAnalysis.textEnNatural },
      ],
    };

    return result;
  }
}
```

---

#### File 11: `server/src/miner/variations.ts`
```typescript
import { prisma } from '../db/prisma.js';
import { CardType, Gender } from '../fsrs/types.js';

export interface CreateMinedCardOptions {
  userId: string;
  cardType: CardType;
  prompt: string;
  answer: string;
  contextSentence?: string;
  clozeDe?: string;
  gender?: Gender;
  plural?: string;
  wordId?: string;
  sentenceId?: string;
  optionsJson?: string[];
}

export class SentenceCardGenerator {
  public static async createMinedCard(options: CreateMinedCardOptions) {
    const { userId, cardType, prompt, answer, contextSentence, clozeDe, gender, plural, wordId, sentenceId, optionsJson } = options;

    // Check for duplicates
    const existing = await prisma.card.findFirst({
      where: {
        userId,
        prompt,
        cardType: cardType.toLowerCase(),
      },
    });

    if (existing) {
      throw new Error(`Card with prompt "${prompt}" and type "${cardType}" already exists in your deck.`);
    }

    const card = await prisma.card.create({
      data: {
        userId,
        cardType: cardType.toLowerCase(),
        prompt,
        answer,
        contextSentence,
        optionsJson: optionsJson ? JSON.stringify(optionsJson) : undefined,
        wordId,
        sentenceId,
        state: 'new',
        stability: 0,
        difficulty: 0,
        scheduledDays: 0,
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
    const regex = new RegExp(`\\b${targetToken}\\b`, 'i');
    const front = sentenceDe.replace(regex, `{{c1::${targetToken}}}`);
    const back = `${targetToken} (${meaningEn})`;

    return { front, back, clozeDe: targetToken };
  }
}
```

---

#### File 12: `server/src/routes/linguisticsRoutes.ts`
```typescript
import { Router, Request, Response } from 'express';
import { validatePrepositionCase } from '../linguistics/prepositions.js';
import { validateAuxiliaryVerb } from '../linguistics/auxiliary.js';
import { validateNounDeclension } from '../linguistics/declensions.js';
import { parseSatzklammer } from '../linguistics/satzklammer.js';
import { ErrorDiagnosticsEngine } from '../linguistics/errorDiagnostics.js';

export const linguisticsRouter = Router();

linguisticsRouter.post('/validate-preposition', (req: Request, res: Response) => {
  const { preposition, detectedCase, isDirectional } = req.body;
  if (!preposition || !detectedCase) {
    return res.status(400).json({ error: 'preposition and detectedCase are required' });
  }
  const result = validatePrepositionCase(preposition, detectedCase, isDirectional);
  res.json(result);
});

linguisticsRouter.post('/validate-auxiliary', (req: Request, res: Response) => {
  const { verbLemma, detectedAuxiliary } = req.body;
  if (!verbLemma) {
    return res.status(400).json({ error: 'verbLemma is required' });
  }
  const result = validateAuxiliaryVerb(verbLemma, detectedAuxiliary);
  res.json(result);
});

linguisticsRouter.post('/validate-declension', (req: Request, res: Response) => {
  const { noun, gender, targetCase, number, isNDeclension } = req.body;
  if (!noun || !gender || !targetCase || !number) {
    return res.status(400).json({ error: 'noun, gender, targetCase, and number are required' });
  }
  const expectedForm = validateNounDeclension(noun, gender, targetCase, number, isNDeclension);
  res.json({ expectedForm });
});

linguisticsRouter.post('/parse-satzklammer', (req: Request, res: Response) => {
  const { sentence } = req.body;
  if (!sentence) {
    return res.status(400).json({ error: 'sentence is required' });
  }
  const result = parseSatzklammer(sentence);
  res.json(result);
});

linguisticsRouter.post('/diagnose-error', (req: Request, res: Response) => {
  const { input, expected } = req.body;
  if (!input || !expected) {
    return res.status(400).json({ error: 'input and expected are required' });
  }
  const report = ErrorDiagnosticsEngine.diagnose(input, expected);
  res.json(report);
});
```

---

#### File 13: Enhanced `server/src/routes/cardRoutes.ts`
```typescript
import { Router, Request, Response } from 'express';
import { FsrsQueueManager } from '../fsrs/queueManager.js';
import { SentenceCardGenerator } from '../miner/variations.js';
import { prisma } from '../db/prisma.js';

export const cardRouter = Router();

cardRouter.get('/study-queue', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'guest-user-001';
    const queue = await FsrsQueueManager.getDailyStudyQueue(userId);
    res.json(queue);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch study queue', message: error?.message });
  }
});

cardRouter.post('/:id/review', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'guest-user-001';
    const { id } = req.params;
    const { rating, responseTimeMs } = req.body;

    const numRating = Number(rating) || 3;
    const result = await FsrsQueueManager.submitReview(id, userId, numRating as any, responseTimeMs || 0);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Review submission failed', message: error?.message });
  }
});

cardRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'guest-user-001';
    const card = await SentenceCardGenerator.createMinedCard({
      userId,
      ...req.body,
    });
    res.json({ card });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to create card' });
  }
});
```

---

#### File 14: Enhanced `server/src/routes/minerRoutes.ts`
```typescript
import { Router, Request, Response } from 'express';
import { SentenceMinerEngine } from '../miner/sentenceMiner.js';
import { SentenceCardGenerator } from '../miner/variations.js';
import { parseSatzklammer } from '../linguistics/satzklammer.js';

export const minerRouter = Router();

minerRouter.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { sentence, level } = req.body;
    if (!sentence || typeof sentence !== 'string') {
      return res.status(400).json({ error: 'sentence string is required' });
    }
    const analysis = await SentenceMinerEngine.analyzeSentence(sentence, level);
    res.json({ analysis });
  } catch (error: any) {
    res.status(500).json({ error: 'Sentence analysis failed', message: error?.message });
  }
});

minerRouter.post('/parse-topological', (req: Request, res: Response) => {
  const { sentence } = req.body;
  if (!sentence) return res.status(400).json({ error: 'sentence is required' });
  const result = parseSatzklammer(sentence);
  res.json(result);
});

minerRouter.post('/mine-card', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'guest-user-001';
    const card = await SentenceCardGenerator.createMinedCard({
      userId,
      ...req.body,
    });
    res.json({ card });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Mining card failed' });
  }
});
```

---

## 5. Verification Method

To independently verify the implementation after code creation:

1. **Execute Milestone 2 Unit & Integration Vitest Suite**:
   ```bash
   npm --prefix server test -- server/tests/m2.test.ts
   ```
   - Must verify 4 suites: Linguistics Engine, FSRS Math Scheduler, Sentence Miner & Satzklammer, REST API Endpoints.
   - All tests must pass with 100% assertions.

2. **Execute Full 4-Tier E2E Test Suite**:
   ```bash
   npx tsx e2e/harness/runAllTests.ts
   ```
   - Validates all 220 tests across Tiers 1-4 including `f05`, `f06`, `f07`, `f08`, `f09`, `b01`, `b02`, `b06`, and `p01`.
   - Exit code must be 0 with zero failures.

3. **Invalidation Conditions**:
   - If $R(t)$ produces negative values or fails to decay monotonically $\to$ INVALID.
   - If difficulty dips below 1.0 or exceeds 10.0 $\to$ INVALID.
   - If Wechselpräpositionen fail to distinguish motion (Wohin -> Akkusativ) from location (Wo -> Dativ) $\to$ INVALID.
   - If *gehen/fahren* selects *haben* auxiliary $\to$ INVALID.
   - If daily study queue exceeds `dailyReviewCap` or `dailyNewCards` $\to$ INVALID.
   - If duplicate cards can be created for the same user and lemma $\to$ INVALID.
