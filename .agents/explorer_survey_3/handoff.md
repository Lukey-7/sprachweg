# Sprachweg Technical Specification & Dataset Blueprint
**Explorer Survey 3**: Curriculum Engine, Grammar Course, Reference Dictionary, Voice Modes & Debrief Engine  
**Author**: Explorer Survey Agent 3  
**Date**: 2026-09-02  
**Target File**: `C:\Users\hp\.gemini\antigravity\scratch\sprachweg\.agents\explorer_survey_3\handoff.md`

---

## 1. Observation

Direct examination of `ORIGINAL_REQUEST.md` establishes specific requirements for the Sprachweg platform:
1. **Curriculum & Adaptive Grammar (R5)**:
   - 52-week curriculum structured across A1 (M1–2), A2 (M3–4), B1 Start (M5–7), B1 Solid (M8–10), and B1+/B2 (M11–12).
   - Daily 5-block session flow: `Warm-up review (SRS)` → `New grammar point` → `Sentence mining` → `Speaking task` → `Listening/reading immersion`.
   - Adaptive engine tracking granular `grammar_tag` accuracies, auto-injecting remedial drills for tags `<80%` mastery.
   - ~60 structured grammar topics with mental models, reference matrices, authentic examples, and 15 interactive drills per topic across 4 interactive mechanics (Reorder, Cloze, Transform, Error-Spotting) totaling 900+ drills.
2. **Comprehensive German Reference Dictionary (R3)**:
   - Noun morphology: 4 cases (Nom, Akk, Dat, Gen) singular/plural, N-declension, 5 plural classes + umlauts, diminutives (*-chen*, *-lein*), and compound decompounding (*Geschwindigkeitsbegrenzung* → *Geschwindigkeit* + *s* + *Begrenzung*).
   - Verb morphology: Full conjugations (Präsens, Präteritum, Perfekt, Plusquamperfekt, Futur I/II, Konjunktiv I/II, Imperativ), *haben* vs *sein* auxiliary selection engine, separability classification (*trennbar*, *untrennbar*, *dual*), and governed prepositions + case valency (*warten auf + Akk*).
   - Adjective declensions: Strong, weak, and mixed declension matrices across all 4 cases and genders, plus regular/irregular comparatives and superlatives.
   - Tolerant search: Diacritic/umlaut normalization (*ae/oe/ue* ↔ *ä/ö/ü*, *ss* ↔ *ß*), Levenshtein fuzzy matching, and full inflected-form reverse lookup index.
3. **Voice Interaction Modes & Debrief Engine (R6)**:
   - Five voice modes: Free Conversation (adaptive tutor with recasts), Scenario Role-Play (5 realistic German life scenarios with state machines & task completion scoring), Pronunciation Coach (phoneme analysis for 6 key German phonetic markers), Shadowing, and Dictation (strict spelling/casing/umlaut validation).
   - Post-session debrief generator producing 3 highlighted successes, 3 prioritized corrections with explanations, and 5 mined vocabulary words with 1-tap FSRS card creation.

---

## 2. Logic Chain & System Architecture Blueprint

```
+===================================================================================+
|                               SPRACHWEG CORE ENGINE                                |
+===================================================================================+
|                                                                                   |
|  +-----------------------------------+     +-----------------------------------+  |
|  |     52-WEEK CEFR CURRICULUM       |     |   GERMAN REFERENCE DICTIONARY     |  |
|  |  * A1 (W1-8)   -> A2 (W9-17)      |     |  * Noun 4-Case Declension & Plural|  |
|  |  * B1.1(W18-30)-> B1.2(W31-43)    |     |  * Compound Decompounder (-s-,-en)|  |
|  |  * B1+/B2 (W44-52)                |     |  * Verb Conjugation & Aux (haben/ |  |
|  +-----------------+-----------------+     |    sein) & Governed Prepositions  |  |
|                    |                       |  * Adjective Strong/Weak/Mixed    |  |
|                    v                       |  * Fuzzy & Inflection Search Index|  |
|  +-----------------------------------+     +-----------------+-----------------+  |
|  |    DAILY 5-BLOCK SESSION ENGINE   |                       |                    |
|  |  1. Warm-up (FSRS + Remedial Tag) |                       |                    |
|  |  2. New Grammar Lesson (~60 Topic)|                       |                    |
|  |  3. Sentence Mining Lab           |<----------------------+                    |
|  |  4. Voice Task (5 Voice Modes)    |                                            |
|  |  5. Immersion (Reader/Dialogue)   |                                            |
|  +-----------------+-----------------+                                            |
|                    |                                                              |
|                    v                                                              |
|  +-----------------------------------+     +-----------------------------------+  |
|  |      ADAPTIVE MASTERY ENGINE      |     |   5 VOICE MODES & DEBRIEF ENGINE  |  |
|  |  * Track grammar_tag accuracy     |     |  1. Free Conversation (Recasts)   |  |
|  |  * Auto-inject if tag < 80%       |     |  2. Role-Play (5 Scenarios + Rubric)|
|  |  * Rolling-window accuracy metric |     |  3. Pronunciation (6 Phonetics)   |  |
|  |  * Unlock gates for next weeks    |     |  4. Shadowing (Pitch & Pace)      |  |
|  +-----------------------------------+     |  5. Dictation (Casing & Umlauts)  |  |
|                                            |  * Post-Session Debrief (3-3-5)   |  |
|                                            +-----------------------------------+  |
+===================================================================================+
```

---

### PART I: 52-WEEK CEFR CURRICULUM & DAILY SESSION ENGINE

#### 1.1 Complete 52-Week Syllabus Progression (A0 to B2)

The curriculum spans 12 months (52 weeks), divided into 5 distinct pedagogical phases. Each week contains specific grammar competencies, vocabulary milestones, functional communication can-do targets, and sentence mining themes.

```
PHASE 1: A1 Foundation (Weeks 1–8 | Months 1–2) — "Survival & Immediate Environment"
PHASE 2: A2 Expansion (Weeks 9–17 | Months 3–4) — "Daily Life, Routines & Past Events"
PHASE 3: B1 Start (Weeks 18–30 | Months 5–7) — "Independence, Complex Syntax & Feelings"
PHASE 4: B1 Solid (Weeks 31–43 | Months 8–10) — "Professional Life, Nuance & Discourse"
PHASE 5: B1+/B2 Reach (Weeks 44–52 | Months 11–12) — "Idiomatic Fluency & Advanced Grammar"
```

##### Detailed Weekly Curriculum Table

| Week | Phase / CEFR | Topic ID & Grammar Core | Functional Can-Do Objective | Core Vocabulary Focus (Target: ~50 w/wk) |
|---|---|---|---|---|
| **W01** | A1.1 (M1) | `A1_G01` Pronouns & *sein/haben* in Präsens | Introduce oneself, spell names, ask basic questions | Greetings, alphabet, numbers 0–100, countries, languages |
| **W02** | A1.1 (M1) | `A1_G02` Regular Verbs & V2 Word Order | Describe daily activities, profession, origin | Nationalities, professions, hobbies, basic action verbs |
| **W03** | A1.1 (M1) | `A1_G03` Noun Genders (*der/die/das*) & Plurals | Identify objects, ask prices, name household items | Household objects, classroom vocabulary, colors, furniture |
| **W04** | A1.1 (M1) | `A1_G04` Definite/Indefinite & Negation (*nicht/kein*) | Order in a café, express likes/dislikes, negate statements | Food, beverages, restaurant terms, supermarket goods |
| **W05** | A1.2 (M2) | `A1_G05` Akkusativ Case & Direct Objects | Shop for groceries, express possession and needs | Supermarket items, clothing, electronics, measurements |
| **W06** | A1.2 (M2) | `A1_G06` Modal Verbs (*können, müssen, möchten, wollen*)| State obligations, abilities, and desires | Hobbies, sports, daily schedule, appointments |
| **W07** | A1.2 (M2) | `A1_G07` Separable Verbs (*trennbare Verben*) | Describe a typical daily routine from morning to night | Daily routine verbs (*aufstehen, anrufen, einkaufen*), time of day |
| **W08** | A1.2 (M2) | `A1_G08` Cardinal/Ordinal Numbers, Time & Acc Prepositions| Read schedules, tell official/informal time, directions | Clock times, calendar days, months, prepositions (*für, ohne, durch*)|
| **W09** | A2.1 (M3) | `A2_G01` Dativ Case & Indirect Objects | Give gifts, talk about helping/thanking people | Family members, gifts, dative verbs (*helfen, danken, gefallen*)|
| **W10** | A2.1 (M3) | `A2_G02` Dative Prepositions (*aus, bei, mit, nach, seit, von, zu*)| Describe routes, travel methods, living situations | Transportation, public transit, city landmarks, housing types |
| **W11** | A2.1 (M3) | `A2_G03` Two-Way Prepositions (*Wechselpräpositionen*)| Describe room layouts (Wo? = Dativ) & place items (Wohin? = Akk)| Furniture, rooms, spatial verbs (*stellen/stehen, legen/liegen*)|
| **W12** | A2.1 (M3) | `A2_G04` Perfekt Tense with *haben* | Recount past weekend events, work tasks, hobbies | Past participles regular/separable, time markers (*gestern, früher*)|
| **W13** | A2.2 (M4) | `A2_G05` Perfekt Tense with *sein* & Irregular Participles| Narrate travel experiences and life milestones | Movement verbs (*fahren, gehen, fliegen*), state changes (*sterben*)|
| **W14** | A2.2 (M4) | `A2_G06` Präteritum of *sein, haben* & Modal Verbs | Write simple emails/reports about past situations | Work environment, illnesses, basic doctor visit vocabulary |
| **W15** | A2.2 (M4) | `A2_G07` Subordinate Clauses with *weil, dass, wenn* | Give reasons, express opinions, formulate conditions | Emotions, weather, opinions, modern technology |
| **W16** | A2.2 (M4) | `A2_G08` Adjective Declension: Weak & Mixed (Nom/Akk) | Describe people, clothes, and products in detail | Colors, clothing styles, materials, physical descriptions |
| **W17** | A2.2 (M4) | `A2_G09` Comparative & Superlative (*-er, am ...sten*) | Compare prices, quality, travel options, weather | Adjectives of comparison, city life vs countryside, geography |
| **W18** | B1.1 (M5) | `B1_G01` Reflexive Verbs (*Akkusativ & Dativ*) | Express feelings, health habits, daily self-care | Health, body parts, emotional states (*sich ärgern, sich freuen*)|
| **W19** | B1.1 (M5) | `B1_G02` Verbs with Fixed Prepositions (*warten auf, denken an*)| Discuss hopes, memories, interests, complaints | Abstract verbs, conversational connectors, debate phrases |
| **W20** | B1.1 (M5) | `B1_G03` Präteritum of Regular & Irregular Verbs (Narrative)| Read and write formal narratives, stories, biographies | Historical events, literary terms, biographical markers |
| **W21** | B1.1 (M5) | `B1_G04` Genitiv Case: Nouns, Names & S-Suffixes | Express ownership, formal descriptions, institutional titles| Institutions, government offices, family lineage, law basics |
| **W22** | B1.1 (M5) | `B1_G05` Adjective Declension: All Cases & Strong Endings | Write descriptive property and job applications | Real estate terms, contracts, detailed specifications |
| **W23** | B1.1 (M6) | `B1_G06` Relative Clauses in Nominativ & Akkusativ | Define terms, describe complex objects and people | Social roles, community, hobbies, cultural concepts |
| **W24** | B1.1 (M6) | `B1_G07` Relative Clauses with Dativ & Prepositions | Describe complex interactions and spatial relationships | City infrastructure, workplace relations, networking |
| **W25** | B1.1 (M6) | `B1_G08` Subordinate Clauses with *obwohl, während, bevor, da*| Express contrasts, temporal sequences, logical reasoning| Media, news consumption, environment, climate discussion |
| **W26** | B1.1 (M6) | `B1_G09` Infinitiv mit *zu* (*versuchen zu, planen zu*) | Discuss plans, intentions, promises, abilities | Career goals, personal development, project planning |
| **W27** | B1.1 (M7) | `B1_G10` Final Clauses (*um...zu* vs *damit*) | State purposes, aims, organizational rules | Bureaucracy, visa processes, study regulations |
| **W28** | B1.1 (M7) | `B1_G11` Prepositions with Genitiv (*während, wegen, trotz*) | Formulate formal written excuses, official letters | Bureaucracy, formal correspondence, legal notices |
| **W29** | B1.1 (M7) | `B1_G12` Two-Part Connectors (*nicht nur...sondern auch*)| Formulate nuanced arguments and balanced perspectives | Politics, society, education, higher education |
| **W30** | B1.1 (M7) | `B1_G13` Konjunktiv II: Polite Requests (*würde, könnte, hätte*)| Make polite requests, navigate service disputes | Customer service, hospitality, polite negotiations |
| **W31** | B1.2 (M8) | `B1_G14` Konjunktiv II: Unreal Conditions (*wenn ich reich wäre*)| Express hypothetical scenarios, dreams, counterfactuals | Economy, personal dreams, philosophical questions |
| **W32** | B1.2 (M8) | `B1_G15` Vorgangspassiv in Präsens (*wird gemacht*) | Describe manufacturing, processes, recipes, rules | Manufacturing, gastronomy, office workflows |
| **W33** | B1.2 (M8) | `B1_G16` Vorgangspassiv in Präteritum & Perfekt | Report past historical events, news broadcasts | History, news reporting, scientific discoveries |
| **W34** | B1.2 (M8) | `B1_G17` Passiv with Modal Verbs (*muss gemacht werden*) | State laws, workplace safety regulations, requirements | Legal regulations, safety manuals, compliance |
| **W35** | B1.2 (M9) | `B1_G18` Zustandspassiv (*ist geöffnet* vs *wird geöffnet*) | Describe states resulting from completed actions | Store hours, status reports, logistics tracking |
| **W36** | B1.2 (M9) | `B1_G19` Plusquamperfekt & Temporal Conjunction *nachdem* | Clarify exact chronological order of past actions | Detective narratives, historical sequence, project retrospectives|
| **W37** | B1.2 (M9) | `B1_G20` Futur I for Predictions & Intentions (*wird wohl...*)| Make future forecasts, express assumptions/intentions | Future trends, climate forecasts, technology predictions |
| **W38** | B1.2 (M9) | `B1_G21` Concessive & Consecutive Clauses (*sodass, weshalb*)| Explain consequences, outcomes, and logical results | Research results, sociological trends, business reports |
| **W39** | B1.2 (M10)| `B1_G22` Partizip I as Adjective (*das schlafende Kind*) | Express simultaneous active states in concise form | Academic texts, literature, journalism |
| **W40** | B1.2 (M10)| `B1_G23` Partizip II as Adjective (*das reparierte Auto*) | Express completed passive states in concise form | Technical manuals, quality assurance, consumer reports |
| **W41** | B1.2 (M10)| `B1_G24` Noun-Verb Collocations (*Nomen-Verb-Verbindungen 1*)| Use formal corporate German (*zur Verfügung stehen*) | Business German, meetings, negotiations |
| **W42** | B1.2 (M10)| `B1_G25` Noun-Verb Collocations (*Nomen-Verb-Verbindungen 2*)| Use formal administrative German (*eine Entscheidung treffen*)| Administrative correspondence, formal reports |
| **W43** | B1.2 (M10)| `B1_G26` Indirect Questions & Embedded Clauses | Conduct formal interviews, customer surveys | Interview techniques, polling, customer relations |
| **W44** | B2.1 (M11)| `B2_G01` Konjunktiv II of Past (*hätte getan, wäre gewesen*) | Express past regrets, missed opportunities, counterfactuals| Dispute resolution, historical analysis, project audits |
| **W45** | B2.1 (M11)| `B2_G02` Passiversatzformen (*-bar, -lich, lässt sich, ist zu*) | Express feasibility and necessity without passive voice | Scientific writing, product specifications, patents |
| **W46** | B2.1 (M11)| `B2_G03` Extended Participle Attributes (*die vom Rat beschlossene...*)| Parse and construct dense journalistic and legal sentences| Journalism, legal contracts, statutory law |
| **W47** | B2.1 (M11)| `B2_G04` Nominal Style (*Nominalstil* vs *Verbalstil*) | Transform verbal sentences into formal officialese | Official memos, research papers, executive summaries |
| **W48** | B2.1 (M12)| `B2_G05` Modal Particles (*ja, doch, denn, mal, eben, halt*) | Add authentic native coloring, nuance, and emotional tone| Colloquial conversations, debates, podcast discussions |
| **W49** | B2.1 (M12)| `B2_G06` Indirect Speech & Konjunktiv I Basics | Report statements neutrally from press releases and sources | Press releases, news reporting, academic citations |
| **W50** | B2.1 (M12)| `B2_G07` Advanced Temporal & Causal Prepositions (*anlässlich, infolge*)| Formulate high-register justifications and event reports| Corporate communications, formal speeches, policy briefs |
| **W51** | B2.1 (M12)| `B2_G08` Hypothetical Comparative (*als ob / als wenn + KII*)| Describe appearances vs realities, illusions | Literary critiques, psychological analyses, debate rebuttal |
| **W52** | B2.1 (M12)| `B2_G09` Comprehensive CEFR B1/B2 Capstone & Exam Readiness | Complete full simulated Goethe/telc B1/B2 multi-skill exam| Integrated multi-domain professional German |

---

#### 1.2 Daily 5-Block Session Engine Architecture

Every daily session runs a strictly orchestrated 5-block pipeline designed for maximum retention, active production, and cognitive variety within a 20–30 minute daily window.

```
+---------------------------------------------------------------------------------------+
|                                DAILY 5-BLOCK PIPELINE                                 |
+---------------------------------------------------------------------------------------+
| [Block 1: Warm-up Review] (3-5 min)                                                   |
|   ├── FSRS Spaced Repetition Due Queue (up to 20 cards)                               |
|   └── Adaptive Remedial Injection (1-3 micro-drills for grammar tags with <80% mastery|
+---------------------------------------------------------------------------------------+
| [Block 2: New Grammar Concept] (5-7 min)                                              |
|   ├── Visual Mental Model & Analogy Diagram                                           |
|   ├── Interactive Paradigm / Declension Matrix                                        |
|   └── 3 Scaffolded Micro-Checks (Immediate feedback)                                  |
+---------------------------------------------------------------------------------------+
| [Block 3: Sentence Mining Lab] (5-7 min)                                              |
|   ├── 3-5 Level-Calibrated Authentic Sentences                                         |
|   ├── Token-by-token parsing (Lemma, POS, Gender color, Case, Syntax role)            |
|   ├── Visual Word Order Map (Position 1, V2, Mittelfeld, Satzklammer)                 |
|   ├── Side-by-Side Literal Gloss vs Natural English                                   |
|   └── 1-Tap Add to FSRS Deck (Word card or Sentence cloze card)                       |
+---------------------------------------------------------------------------------------+
| [Block 4: Speaking & Pronunciation Task] (4-6 min)                                    |
|   ├── Audio Prompt Generation (TTS)                                                   |
|   ├── Learner Audio Recording (Web Audio API / MediaRecorder)                         |
|   ├── Phoneme Analysis (Umlauts, ch-Laut, uvular r, Auslautverhärtung, Vowel Length)  |
|   └── Real-time Score Badge & Phonetic Waveform Feedback                              |
+---------------------------------------------------------------------------------------+
| [Block 5: Listening / Reading Immersion] (4-5 min)                                    |
|   ├── Micro-Dialogue or Graded Passage (CEFR calibrated)                              |
|   ├── Interactive Reader with Tap-to-Inspect Token Dictionary                         |
|   ├── 2 Comprehension / Grammar-in-Context Verification Questions                     |
|   └── Automated Daily Debrief (3 Strengths, 3 Priorities, 5 Mined Words)              |
+---------------------------------------------------------------------------------------+
```

##### Daily Session State Engine (TypeScript Schema)

```typescript
export interface DailySessionState {
  sessionId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  weekNumber: number; // 1-52
  dayOfWeek: number; // 1-7
  currentBlockIndex: 0 | 1 | 2 | 3 | 4;
  blocks: [
    WarmupBlockState,
    GrammarBlockState,
    MiningBlockState,
    SpeakingBlockState,
    ImmersionBlockState
  ];
  sessionStartTime: number;
  sessionEndTime?: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface WarmupBlockState {
  type: 'WARMUP_SRS';
  fsrsCardsDueCount: number;
  fsrsCardsReviewed: number;
  remedialTagsInjected: string[]; // e.g. ['tag_two_way_prep_dat', 'tag_adj_decl_mixed']
  remedialDrillsCompleted: number;
  isComplete: boolean;
}

export interface GrammarBlockState {
  type: 'NEW_GRAMMAR';
  topicId: string; // e.g. 'A2_G03'
  mentalModelViewed: boolean;
  tableInteracted: boolean;
  drillsTotal: number; // 15
  drillsCompleted: number;
  drillsScore: number; // 0-15
  isComplete: boolean;
}

export interface MiningBlockState {
  type: 'SENTENCE_MINING';
  targetSentences: MinedSentencePayload[];
  cardsCreatedCount: number;
  isComplete: boolean;
}

export interface SpeakingBlockState {
  type: 'SPEAKING_TASK';
  voiceMode: 'PRONUNCIATION' | 'SCENARIO' | 'SHADOWING' | 'FREE_CONV';
  promptId: string;
  phonemeAccuracyScore?: number;
  taskCompletionScore?: number;
  recordedAudioDurationSec: number;
  isComplete: boolean;
}

export interface ImmersionBlockState {
  type: 'IMMERSION';
  readingId: string;
  tokensInspected: string[];
  comprehensionScore: number; // 0-100%
  debriefGenerated: boolean;
  isComplete: boolean;
}
```

---

#### 1.3 Adaptive Engine: Grammar Tag Tracking & Auto-Injection

The adaptive engine tracks user accuracy across 120+ granular grammatical sub-tags (e.g., `tag_akk_masc_def`, `tag_dat_plural_n`, `tag_v2_inversion`, `tag_modal_k2_konjunktiv`).

##### Mastery Calculation Formula

We utilize a **Time-Decayed Exponential Rolling Window (EMA)**:

$$\text{Accuracy}_{\text{tag}} = \alpha \cdot \text{Score}_{\text{current}} + (1 - \alpha) \cdot \text{Accuracy}_{\text{previous}}$$

Where:
- $\alpha = 0.25$ (gives 25% weight to recent attempt, preserving stability).
- Base Mastery Threshold: $\text{Accuracy}_{\text{tag}} \ge 0.80$ with $\text{Attempts}_{\text{tag}} \ge 5$.

```
+------------------------------------------------------------------------------------+
|                         ADAPTIVE INJECTION DECISION MATRIX                         |
+------------------------------------------------------------------------------------+
| Condition                                | Action Taken                            |
+------------------------------------------+-----------------------------------------+
| Accuracy < 0.60 (Critical Weakness)      | Inject 2 Remedial Drills into Warm-up   |
|                                          | + Flag tag for Sentence Miner selection |
| 0.60 <= Accuracy < 0.80 (Vulnerable)     | Inject 1 Remedial Drill into Warm-up    |
| Accuracy >= 0.80 (Mastered)              | Standard FSRS Maintenance               |
| New Topic Gate Check (Accuracy < 0.80)   | Soft-Gate Warning with Review Offer     |
+------------------------------------------------------------------------------------+
```

##### Remedial Injection Engine Algorithm (TypeScript)

```typescript
export interface GrammarTagProgress {
  tagId: string;
  topicId: string;
  attemptsCount: number;
  correctCount: number;
  rollingAccuracy: number; // 0.00 to 1.00
  lastAttemptTimestamp: number;
  masteryStatus: 'LEARNING' | 'VULNERABLE' | 'MASTERED';
}

export function evaluateRemedialInjection(
  userTags: GrammarTagProgress[],
  currentWeekTopicId: string
): { injectedDrillIds: string[]; flaggedTags: string[] } {
  const CRITICAL_THRESHOLD = 0.60;
  const MASTERY_THRESHOLD = 0.80;
  const MIN_ATTEMPTS = 3;

  // Filter tags requiring remediation, sorted by lowest accuracy first
  const weakTags = userTags
    .filter(t => t.attemptsCount >= MIN_ATTEMPTS && t.rollingAccuracy < MASTERY_THRESHOLD)
    .sort((a, b) => a.rollingAccuracy - b.rollingAccuracy);

  const injectedDrillIds: string[] = [];
  const flaggedTags: string[] = [];

  for (const tag of weakTags.slice(0, 3)) { // Max 3 tags injected per session
    flaggedTags.push(tag.tagId);
    const countToInject = tag.rollingAccuracy < CRITICAL_THRESHOLD ? 2 : 1;
    const drills = fetchDrillsForTag(tag.tagId, countToInject);
    injectedDrillIds.push(...drills.map(d => d.id));
  }

  return { injectedDrillIds, flaggedTags };
}
```

---

#### 1.4 ~60 Structured Grammar Topics Catalog & 15-Drill Mechanics

The curriculum incorporates 60 core grammar topics spanning A1 to B2. Below is the complete catalog of topics with their pedagogical mental models, rule matrices, and the 15-drill interactive taxonomy.

```
GRAMMAR TOPIC DISTRIBUTION:
- A1: 14 Topics (`A1_G01` to `A1_G14`)
- A2: 16 Topics (`A2_G01` to `A2_G16`)
- B1: 20 Topics (`B1_G01` to `B1_G20`)
- B2: 10 Topics (`B2_G01` to `B2_G10`)
Total = 60 Core Topics x 15 Interactive Drills = 900+ Handcrafted/Validated Interactive Drills
```

##### Representative Topic Catalog (Excerpts Across Levels)

```markdown
### Topic: A1_G03 — Noun Gender & The "Color-Coded Traffic Light" Mental Model
- **Mental Model**: Imagine German nouns as living in 3 color-coded households: Blue (der - Masculine), Red (die - Feminine), Green (das - Neuter). The article is not an accessory; it is part of the word's DNA. Plural transforms everyone into Yellow/Orange (die).
- **Rule Matrix**:
  | Case | Masculine (Blue) | Feminine (Red) | Neuter (Green) | Plural (Yellow) |
  |---|---|---|---|---|
  | Nominativ | der / ein / kein | die / eine / keine | das / ein / kein | die / - / keine |
  | Akkusativ | den / einen / keinen | die / eine / keine | das / ein / kein | die / - / keine |
- **High-Impact Examples**:
  1. *Der Tisch (blue) ist neu, aber die Lampe (red) ist alt.* (The table is new, but the lamp is old.)
  2. *Ich habe einen grünen Apfel (Akk. Masc) und ein Buch (Akk. Neut).* (I have a green apple and a book.)

---

### Topic: A2_G03 — Two-Way Prepositions (*Wechselpräpositionen*) & The "GPS Motion vs Location" Model
- **Mental Model**: Prepositions of place (*an, auf, hinter, in, neben, über, unter, vor, zwischen*) act like a GPS. If the GPS tracks a change of boundary / destination (*Wohin?* = Where to?), switch to Akkusativ. If the GPS tracks static coordinates / location within a boundary (*Wo?* = Where at?), lock into Dativ.
- **Rule Matrix**:
  | Question | Question Trigger | Case Governed | Example Action Verbs |
  |---|---|---|---|
  | **Wohin?** (Direction/Motion) | Dynamic boundary crossing | **Akkusativ** (*den/die/das/die*) | *stellen, legen, hängen, setzen* |
  | **Wo?** (Location/Position) | Static position inside boundary | **Dativ** (*dem/der/dem/den+n*) | *stehen, liegen, hängen, sitzen* |
- **High-Impact Examples**:
  1. *Ich stelle das Glas auf den Tisch (Akk).* (I place the glass onto the table.)
  2. *Das Glas steht auf dem Tisch (Dat).* (The glass is standing on the table.)

---

### Topic: B1_G10 — Final Clauses: *um...zu* vs *damit* (The "Identity of Subject" Switch)
- **Mental Model**: When the actor in Clause 1 and Clause 2 is the SAME person, use the streamlined *um...zu + Infinitiv* bridge. When the actor in Clause 2 is a DIFFERENT person (or subject must be preserved), use the full *damit + Nebensatz* subordinator.
- **Rule Matrix**:
  | Structure | Subject Condition | Verb Position | Example Pattern |
  |---|---|---|---|
  | *um...zu + Inf* | Subject 1 == Subject 2 | Verb at very end (Infinitive) | *Ich lerne Deutsch, um in Berlin zu studieren.* |
  | *damit + Nebensatz* | Subject 1 != Subject 2 (or ==) | Conjugated Verb at end | *Ich gebe dir Geld, damit du die Miete bezahlst.* |
- **High-Impact Examples**:
  1. *Er spart Geld, um ein neues Auto zu kaufen.* (He saves money to buy a new car.)
  2. *Die Mutter hilft dem Kind, damit es die Hausaufgaben versteht.* (The mother helps the child so that it understands the homework.)

---

### Topic: B2_G02 — Passive Replacements (*Passiversatzformen*)
- **Mental Model**: Advanced German avoids excessive *wird gemacht* by using elegant active alternatives that imply possibility or obligation.
- **Rule Matrix**:
  | Construction | Meaning Nuance | Equivalent Passive Form | Example |
  |---|---|---|---|
  | *sein + zu + Infinitiv* | Obligation (*muss*) or Possibility (*kann*) | *muss/kann getan werden* | *Dieser Text ist bis morgen zu lesen.* |
  | *sich lassen + Infinitiv* | Possibility (*kann*) | *kann getan werden* | *Das Problem lässt sich leicht lösen.* |
  | Suffix *-bar / -lich* | Potential capability | *kann getan werden* | *Die Handschrift ist kaum lesbar.* |
- **High-Impact Examples**:
  1. *Die Aufgabe lässt sich nicht in zwei Stunden bewältigen.* (The task cannot be managed in two hours.)
  2. *Die Vorschriften sind strikt einzuhalten.* (The regulations are to be strictly followed.)
```

##### 15-Drill Interactive Taxonomy per Topic

Every grammar topic includes 15 calibrated drills distributed across 4 distinct cognitive interaction mechanics:

```
+------------------------------------------------------------------------------------+
|                        15-DRILL DISTRIBUTION PER TOPIC                             |
+------------------------------------------------------------------------------------+
| Mechanics Type             | Count | Pedagogical Objective                         |
+----------------------------+-------+-----------------------------------------------+
| 1. CLOZE / FILL-IN         |   5   | Target inflection, endings, prepositions      |
| 2. WORD REORDER (SCRAMBLE) |   4   | Syntax, V2, Satzklammer, TeKaMoLo word order  |
| 3. SENTENCE TRANSFORMATION |   3   | Active->Passive, Direct->Subordinate, Tenses  |
| 4. ERROR-SPOTTING          |   3   | Critical recognition & correction of mistakes |
| TOTAL                      |  15   | Complete formative & summative mastery check  |
+------------------------------------------------------------------------------------+
```

##### Drill JSON Schema Specification

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GrammarDrill",
  "type": "object",
  "required": ["id", "topicId", "grammarTag", "type", "prompt", "instructions", "solution"],
  "properties": {
    "id": { "type": "string", "example": "A2_G03_D04" },
    "topicId": { "type": "string", "example": "A2_G03" },
    "grammarTag": { "type": "string", "example": "tag_wechselprep_akk" },
    "cefrLevel": { "type": "string", "enum": ["A1", "A2", "B1", "B2"] },
    "type": { "type": "string", "enum": ["CLOZE", "REORDER", "TRANSFORM", "ERROR_SPOTTING"] },
    "prompt": { "type": "string", "example": "Er stellt die Flasche auf ___ Tisch (m)." },
    "instructions": { "type": "string", "example": "Wähle den richtigen Artikel für die Richtung (Wohin?)." },
    "options": {
      "type": "array",
      "items": { "type": "string" },
      "example": ["den", "dem", "der", "das"]
    },
    "tokens": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Used for REORDER drills",
      "example": ["Er", "stellt", "die", "Flasche", "auf", "den", "Tisch."]
    },
    "solution": { "type": "string", "example": "den" },
    "explanation": {
      "type": "string",
      "example": "Wohin? stellt er die Flasche -> Akkusativ maskulin verlangt 'den Tisch'."
    },
    "remedialHint": {
      "type": "string",
      "example": "Merke: stellen + auf = Akkusativ (Wohin?). stehen + auf = Dativ (Wo?)."
    }
  }
}
```

---

### PART II: COMPREHENSIVE GERMAN REFERENCE DICTIONARY

#### 2.1 Noun Declension, Pluralization & Compound Decompounder

German nouns require complete inflectional profiles across 4 cases, plural formations, diminutive transformations, and compound word decompounding.

##### Complete 4-Case Declension Matrix Table

```
+---------------------------------------------------------------------------------------------------------+
|                                GERMAN NOUN DECLENSION PARADIGMS                                         |
+---------------------------------------------------------------------------------------------------------+
| Case       | Masc (Strong)   | Masc (N-Decl/Weak) | Fem (die)         | Neut (das)        | Plural (all)   |
+------------+-----------------+--------------------+-------------------+-------------------+----------------+
| Nominativ  | der Tisch       | der Student        | die Lampe         | das Buch          | die Tische/..  |
| Akkusativ  | den Tisch       | den Studenten      | die Lampe         | das Buch          | die Tische/..  |
| Dativ      | dem Tisch(e)    | dem Studenten      | der Lampe         | dem Buch(e)       | den Tischen*   |
| Genitiv    | des Tisches     | des Studenten      | der Lampe         | des Buches        | der Tische/..  |
+---------------------------------------------------------------------------------------------------------+
* Rule: Dativ Plural always adds -n unless plural already ends in -n or -s (e.g., den Autos, den Tischen).
```

##### 5 Plural Classes & Distribution

1. **Class 1 (-e / -¨e)**: Most masculines (*der Tag → die Tage*, *der Baum → die Bäume*), some neuters (*das Boot → die Boote*), feminine monosyllables with umlaut (*die Hand → die Hände*).
2. **Class 2 (-er / -¨er)**: Most neuters (*das Kind → die Kinder*, *das Haus → die Häuser*), few masculines (*der Mann → die Männer*). Never feminines.
3. **Class 3 (-(e)n)**: Most feminines (*die Frau → die Frauen*, *die Schule → die Schulen*), weak masculines (*der Student → die Studenten*), masculine living beings ending in *-e*.
4. **Class 4 (-s)**: Foreign loanwords, acronyms, words ending in vowels other than -e (*das Auto → die Autos*, *das Hotel → die Hotels*, *die Oma → die Omas*).
5. **Class 5 (Zero / -¨)**: Masculines/Neuters ending in *-el, -en, -er* (*der Lehrer → die Lehrer*, *der Apfel → die Äpfel*, *das Fenster → die Fenster*).

##### Diminutive Engine (*-chen / -lein*)

- **Rule 1 (Gender Shift)**: Any noun affixed with *-chen* or *-lein* becomes strictly **Neuter (`das`)**.
- **Rule 2 (Stem Umlauting)**: Root vowels *a, o, u, au* mutate into *ä, ö, ü, äu* (*der Baum → das Bäumchen*, *die Katze → das Kätzchen*, *das Brot → das Brötchen*).
- **Rule 3 (Elision)**: Final *-e* or consonants (*-en*) are elided before suffixation (*die Hose → das Höschen*).

##### Compound Decompounder Algorithm

German compounds (*Komposita*) are structured from right to left:
- **Head Noun (Grundwort)**: The rightmost component determines the gender, declension pattern, and plural ending of the entire compound.
- **Modifiers (Bestimmungswörter)**: Nouns, verbs, adjectives, or prepositions attached to the left.
- **Interfix / Fugenelement**: Connecting sounds inserted between elements: `-s-`, `-es-`, `-en-`, `-er-`, `-e-`, or `Ø` (zero).

```
EXAMPLE DECOMPOSITION:
"Geschwindigkeitsbegrenzung"
├── Base Component 1: die Geschwindigkeit (f) [Speed]
├── Fugenelement: -s-
└── Base Component 2: die Begrenzung (f) [Limit / Restriction]
=> Entire Compound Gender: die (inherited from die Begrenzung)
=> English Translation: Speed limit
```

```typescript
export interface CompoundDecomposition {
  originalWord: string;
  isCompound: boolean;
  headNoun: {
    lemma: string;
    gender: 'DER' | 'DIE' | 'DAS';
    english: string;
  };
  components: Array<{
    segment: string;
    lemma: string;
    pos: 'NOUN' | 'VERB' | 'ADJ' | 'PREP' | 'INTERFIX';
    englishTranslation?: string;
  }>;
  fugenelemente: string[]; // e.g. ['-s-']
}

export function decompoundWord(
  compound: string,
  lexicon: Set<string>
): CompoundDecomposition | null {
  const FUGEN = ['s', 'es', 'en', 'er', 'e'];
  // Recursive right-to-left split search against verified German lemma lexicon
  // Returns structured tree and head-noun gender inheritance
  // (Implementation in backend dictionary service)
  return null;
}
```

---

#### 2.2 Verb Conjugations, Auxiliary Engine & Governed Prepositions

##### Complete Verb Conjugation System (All Tenses & Moods)

For every verb in the dictionary, the system maintains complete paradigms across:
- **Präsens** (Present)
- **Präteritum** (Simple Past)
- **Perfekt** (Present Perfect: *haben/sein + Partizip II*)
- **Plusquamperfekt** (Past Perfect: *hatte/war + Partizip II*)
- **Futur I** (Future: *werden + Infinitiv*)
- **Futur II** (Future Perfect: *werden + Partizip II + haben/sein*)
- **Konjunktiv I** (Indirect Speech: Präsens stem + *-e, -est, -e, -en, -et, -en*)
- **Konjunktiv II** (Subjunctive/Hypothetical: Präteritum stem + Umlaut + endings or *würde + Inf*)
- **Imperativ** (du, ihr, Sie)

##### Auxiliary Selection Logic (*haben* vs *sein*)

```
+------------------------------------------------------------------------------------+
|                         AUXILIARY SELECTION DECISION ENGINE                        |
+------------------------------------------------------------------------------------+
| CONDITION                                                     | AUXILIARY SELECTED |
+---------------------------------------------------------------+--------------------+
| 1. Transitive verbs (takes Akkusativ object)                  | HABEN              |
|    e.g. *Ich habe einen Brief geschrieben.*                   |                    |
| 2. Reflexive verbs (*sich freuen, sich waschen*)              | HABEN              |
|    e.g. *Sie hat sich gefreut.*                               |                    |
| 3. Modal verbs (*können, müssen, wollen...*)                  | HABEN              |
|    e.g. *Er hat das gewollt.*                                 |                    |
| 4. Impersonal weather verbs (*regnen, schneien*)              | HABEN              |
|    e.g. *Es hat geregnet.*                                    |                    |
| 5. Durative verbs with no position change (*schlafen, wohnen*)| HABEN              |
|    e.g. *Wir haben lange geschlafen.*                         |                    |
| ------------------------------------------------------------- | ------------------ |
| 6. Intransitive verbs of LOCATIVE MOTION / DESTINATION CHANGE | SEIN               |
|    e.g. *gehen, fahren, laufen, schwimmen, fliegen, reisen*   |                    |
| 7. Intransitive verbs of STATE CHANGE (Zustandsänderung)      | SEIN               |
|    e.g. *sterben, aufwachen, einschlafen, wachsen, schmelzen* |                    |
| 8. The Cardinal Copula/Existence Triad:                       | SEIN               |
|    *sein* (gewesen), *werden* (geworden), *bleiben* (geblieben)|                   |
| 9. Specific intransitive event verbs:                         | SEIN               |
|    *passieren, geschehen, gelingen, misslingen*               |                    |
+---------------------------------------------------------------+--------------------+
```

*Dual Auxiliary Edge-Case Handling*:
- *Ich **habe** das Auto in die Garage gefahren.* (Transitive with Accusative Object $\rightarrow$ `haben`)
- *Ich **bin** nach München gefahren.* (Intransitive motion to destination $\rightarrow$ `sein`)

##### Governed Prepositions & Case Valency (Top Reference Table)

```
+------------------------------------------------------------------------------------+
|                        VERB-PREPOSITION VALENCY CATALOG                            |
+------------------------------------------------------------------------------------+
| Verb & Preposition           | Case | English Meaning         | Example Sentence   |
+------------------------------+------+-------------------------+--------------------+
| *warten auf*                 | Akk  | to wait for             | *Ich warte auf den Bus.* |
| *denken an*                  | Akk  | to think of/about       | *Er denkt an seine Familie.* |
| *sich freuen auf*            | Akk  | to look forward to      | *Wir freuen uns auf den Urlaub.*|
| *sich freuen über*           | Akk  | to be glad about (past) | *Sie freut sich über das Geschenk.*|
| *sich interessieren für*     | Akk  | to be interested in     | *Interessierst du dich für Kunst?*|
| *bitten um*                  | Akk  | to ask/request for      | *Darf ich um Hilfe bitten?* |
| *sich kümmern um*            | Akk  | to take care of         | *Er kümmert sich um die Kinder.*|
| *hoffen auf*                 | Akk  | to hope for             | *Wir hoffen auf besseres Wetter.*|
| *teilnehmen an*              | Dat  | to participate in       | *Sie nimmt an der Konferenz teil.*|
| *gehören zu*                 | Dat  | to belong to            | *Das gehört zu meinen Aufgaben.*|
| *zweifeln an*                | Dat  | to doubt                | *Ich zweifle an seiner Aussage.*|
| *abhängen von*               | Dat  | to depend on            | *Das hängt vom Preis ab.* |
| *bestehen aus*               | Dat  | to consist of           | *Das Haus besteht aus Holz.*|
| *bestehen auf*               | Akk  | to insist on            | *Er besteht auf seinem Recht.*|
| *gratulieren zu*             | Dat  | to congratulate on      | *Ich gratuliere dir zum Geburtstag.*|
| *leiden an*                  | Dat  | to suffer from (disease)| *Er leidet an einer Allergie.*|
| *leiden unter*               | Dat  | to suffer under (stress)| *Sie leidet unter dem Lärm.*|
+------------------------------------------------------------------------------------+
```

---

#### 2.3 Adjective Declensions (Strong, Weak, Mixed) & Comparatives

German adjectives preceding a noun must take an ending based on:
1. The preceding determiner (*Der-Wort*, *Ein-Wort*, or *Nullartikel*).
2. The grammatical gender of the noun.
3. The case of the noun.

##### Complete Adjective Declension Reference Matrices

```
1. WEAK DECLENSION (Preceded by Definite Article: der, die, das, dieser, jeder, etc.)
+------------+-----------------+-----------------+-----------------+-----------------+
| Case       | Masculine       | Feminine        | Neuter          | Plural          |
+------------+-----------------+-----------------+-----------------+-----------------+
| Nominativ  | der alt-e Mann  | die alt-e Frau  | das alt-e Kind  | die alt-en Leute|
| Akkusativ  | den alt-en Mann | die alt-e Frau  | das alt-e Kind  | die alt-en Leute|
| Dativ      | dem alt-en Mann | der alt-en Frau | dem alt-en Kind | den alt-en Leuten|
| Genitiv    | des alt-en Manns| der alt-en Frau | des alt-en Kinds| der alt-en Leute|
+------------+-----------------+-----------------+-----------------+-----------------+
* Mental Model Rule: 5 "e" endings in the upper-left boot (Nom M/F/N, Akk F/N); all other endings are strictly "-en".

2. MIXED DECLENSION (Preceded by Indefinite Article: ein, eine, kein, mein, dein, etc.)
+------------+-----------------+-----------------+-----------------+-----------------+
| Case       | Masculine       | Feminine        | Neuter          | Plural (keine)  |
+------------+-----------------+-----------------+-----------------+-----------------+
| Nominativ  | ein alt-er Mann | eine alt-e Frau | ein alt-es Kind | keine alt-en ...|
| Akkusativ  | einen alt-en M. | eine alt-e Frau | ein alt-es Kind | keine alt-en ...|
| Dativ      | einem alt-en M. | einer alt-en F. | einem alt-en K. | keinen alt-en ..|
| Genitiv    | eines alt-en M. | einer alt-en F. | eines alt-en K. | keiner alt-en ..|
+------------+-----------------+-----------------+-----------------+-----------------+
* Rule: Adjective supplies missing gender signal when 'ein' lacks ending (Masc Nom -> -er, Neut Nom/Akk -> -es).

3. STRONG DECLENSION (No Preceding Article / Nullartikel)
+------------+-----------------+-----------------+-----------------+-----------------+
| Case       | Masculine       | Feminine        | Neuter          | Plural          |
+------------+-----------------+-----------------+-----------------+-----------------+
| Nominativ  | alt-er Wein     | frisch-e Milch  | kalt-es Wasser  | gut-e Freunde   |
| Akkusativ  | alt-en Wein     | frisch-e Milch  | kalt-es Wasser  | gut-e Freunde   |
| Dativ      | alt-em Wein     | frisch-er Milch | kalt-em Wasser  | gut-en Freunden |
| Genitiv    | alt-en Weins*   | frisch-er Milch | kalt-en Wassers*| gut-er Freunde  |
+------------+-----------------+-----------------+-----------------+-----------------+
* Note: Genitive Masc & Neut take "-en" (not -es) to prevent double sibilant clash with noun's "-s/-es".
```

##### Comparative & Superlative Paradigm

- **Regular**: `Positiv` + `-er` $\rightarrow$ `Komparativ`; `am` + `Positiv` + `-sten` $\rightarrow$ `Superlativ` (*schnell → schneller → am schnellsten*).
- **Umlauting Monosyllables**: *alt → älter → am ältesten*, *groß → größer → am größten*, *warm → wärmer → am wärmsten*.
- **Irregular Top Reference**:
  - *gut → besser → am besten*
  - *viel → mehr → am meisten*
  - *gern → lieber → am liebsten*
  - *hoch → höher → am höchsten* (drops 'c' in comparative)
  - *nah → näher → am nächsten* (adds 'ch' in superlative)

---

#### 2.4 Fuzzy Tolerant Search & Reverse Inflection Engine

Users frequently query words with missing umlauts (e.g. typing *schoen* or *schon* for *schön*), conjugated verbs (*gingst* instead of *gehen*), or declined nouns (*Häusern* instead of *Haus*).

##### Multi-Tier Normalization & Indexing Architecture

```
[Raw User Query: "schoenen"]
       │
       ▼
[Tier 1: Character Normalization Pipeline]
├── Lowercase folding: "schoenen"
├── Umlaut expansion mapping: "oe" ↔ "ö", "ae" ↔ "ä", "ue" ↔ "ü", "ss" ↔ "ß"
├── Variant candidates generated: ["schönen", "schoenen", "schonen"]
       │
       ▼
[Tier 2: Reverse Inflection Index Lookup (SQLite)]
├── Querying `word_forms` table:
│   WHERE form IN ("schönen", "schoenen", "schonen")
├── Match Found:
│   ├── Lemma: "schön" (Adjective)
│   ├── Inflection Tag: "POS=ADJ, CASE=ACC/DAT/GEN, GENDER=M/F/N/PL, DECL=WEAK/MIXED"
       │
       ▼
[Tier 3: Levenshtein Fuzzy Fallback (if Tier 2 returns 0 matches)]
├── Trigram index search + Levenshtein distance <= 2
└── Ranked suggestion list returned
```

##### TypeScript Normalization Utility

```typescript
export interface SearchCandidate {
  normalized: string;
  umlautVariants: string[];
}

export function generateSearchVariants(input: string): string[] {
  const clean = input.trim().toLowerCase();
  const variants = new Set<string>([clean]);

  // Expand standard ASCII digraphs to German umlauts
  variants.add(clean.replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü').replace(/ss/g, 'ß'));
  
  // Transliterate umlauts to ASCII digraphs
  variants.add(clean.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'));

  // Strip umlauts entirely as typo fallback
  variants.add(clean.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u'));

  return Array.from(variants);
}
```

---

### PART III: 5 VOICE MODES, SCENARIOS & DEBRIEF ENGINE

#### 3.1 Five Voice Modes Architecture

```
+---------------------------------------------------------------------------------------+
|                                5 VOICE MODES TAXONOMY                                 |
+---------------------------------------------------------------------------------------+
| 1. FREE CONVERSATION     | AI German tutor with conversational recasts & debriefing   |
| 2. SCENARIO ROLE-PLAY    | 5 Immersion situations (Bürgeramt, Arzt, Bäckerei, etc.)   |
| 3. PRONUNCIATION COACH   | 6 Phonetic markers analysis with visual audio waveform     |
| 4. SHADOWING             | Native audio sync, pitch contour, and pace matching        |
| 5. DICTATION             | Strict spelling, noun capitalization & umlaut verification |
+---------------------------------------------------------------------------------------+
```

---

#### 3.2 Scenario Role-Play Engine (5 Scenarios with State Machines & Rubrics)

Every scenario operates as a finite state machine with defined milestones, acceptable learner actions, vocabulary unlocks, and multi-dimensional scoring.

##### 1. Bürgeramt (*Anmeldung einer Wohnung*)
- **Setting**: Municipal registration office in Berlin / Munich.
- **AI Persona**: Herr/Frau Schmidt, efficient but formal municipal civil servant (*Beamter*).
- **User Goal**: Register residency, submit *Wohnungsgeberbestätigung*, state marital status and tax ID details.
- **Key Milestones**:
  1. Formal greeting and reason for visit (*"Ich möchte mich anmelden"*).
  2. Handing over passport and landlord confirmation document.
  3. Answering questions about move-in date (*Einzugsdatum*), civil status, and religious tax affiliation (*Kirchensteuer*).
  4. Reviewing and confirming the registration certificate (*Meldebestätigung*).

##### 2. Arztpraxis (*Besuch beim Allgemeinmediziner*)
- **Setting**: Doctor's office consultation room.
- **AI Persona**: Dr. Weber, empathetic and thorough general practitioner.
- **User Goal**: Describe symptoms, onset duration, allergies, and obtain a prescription / sick leave certificate (*AU-Bescheinigung*).
- **Key Milestones**:
  1. Describing primary symptom (e.g. *starke Halsschmerzen, Husten, leichtes Fieber*).
  2. Stating how long symptoms have persisted (*"Seit drei Tagen"*).
  3. Answering lifestyle/allergy questions (*"Ich habe keine Penicillin-Allergie"*).
  4. Clarifying medication dosage and requesting doctor's note for employer.

##### 3. Bäckerei & Wochenmarkt (*Einkaufen beim Bäcker*)
- **Setting**: Neighborhood bakery counter.
- **AI Persona**: Bäckereifachverkäufer(in), friendly, colloquial, brisk.
- **User Goal**: Order 4 whole-grain rolls (*Vollkornbrötchen*), a loaf of sourdough rye bread (*Sauerteigbrot*), inquire about sliced bread and card payment.
- **Key Milestones**:
  1. Polite ordering phrase (*"Ich hätte gerne..."* / *"Ich bekomme bitte..."*).
  2. Specifying quantity, type, and asking if sliced (*"Könnten Sie das Brot bitte schneiden?"*).
  3. Responding to the standard prompt *"Darf es sonst noch etwas sein?"*.
  4. Inquiring about payment method (*"Kann ich mit Karte zahlen?"*) and settling bill.

##### 4. Wohnungsbesichtigung (*Wohnungssuche & Vermietergespräch*)
- **Setting**: 2-room apartment in a German city during an open viewing.
- **AI Persona**: Makler(in) or landlord Herr Meyer, selective and detail-oriented.
- **User Goal**: Ask about rental costs (*Kaltmiete* vs *Warmmiete*), utility bills (*Nebenkosten*), deposit (*Kaution*), pet rules, and express intent to apply.
- **Key Milestones**:
  1. Introducing oneself professionally and complimenting the apartment layout.
  2. Asking for itemized breakdown of *Nebenkosten* (heating, waste disposal, internet).
  3. Clarifying move-in date and deposit schedule (*3 Monatskaltmieten*).
  4. Handing over / discussing the *SCHUFA-Auskunft* and *Selbstauskunft*.

##### 5. Vorstellungsgespräch (*Bewerbungsgespräch für eine Stelle*)
- **Setting**: Conference room / video call with HR Director.
- **AI Persona**: Frau Dr. Hoffmann, professional HR Director asking structured competency questions.
- **User Goal**: Present professional background, explain motivations, demonstrate strengths with evidence, and ask 2 thoughtful questions about team culture.
- **Key Milestones**:
  1. Professional greeting and elevator pitch (*Werdegang*).
  2. Answering why the user chose this company (*Motivation*).
  3. Describing a challenging work situation using Konjunktiv II and formal Sie-form.
  4. Asking about onboarding (*Einarbeitungsphase*) and professional development.

##### Scenario Task Completion Rubric (100 Points Total)

```
+------------------------------------------------------------------------------------+
|                         SCENARIO ROLE-PLAY EVALUATION RUBRIC                       |
+------------------------------------------------------------------------------------+
| DIMENSION                   | WEIGHT | EVALUATION CRITERIA                                 |
+-----------------------------+--------+-----------------------------------------------------+
| 1. Task Completion          |  40%   | Were all milestones/objectives successfully reached?|
| 2. Grammatical Accuracy     |  25%   | Correct word order (V2/Klammer), case endings, verbs|
| 3. Lexical Range & Register |  20%   | Appropriate situational vocabulary, formal Sie vs du|
| 4. Interaction & Fluency    |  15%   | Logical turn-taking, responsiveness to AI questions |
+------------------------------------------------------------------------------------+
```

---

#### 3.3 Pronunciation Coach & 6 Phonetic Markers

The pronunciation coach provides phoneme-level diagnostic feedback against 6 primary German phonological markers that present difficulty for learners.

```
+---------------------------------------------------------------------------------------+
|                          6 KEY GERMAN PHONETIC MARKERS                                |
+---------------------------------------------------------------------------------------+
| 1. ROUNDED FRONT VOWELS (*ü / ö*)                                                     |
|    - Long /yː/ (*Tür*) vs Short /ʏ/ (*Hütte*)                                         |
|    - Long /øː/ (*schön*) vs Short /œ/ (*können*)                                      |
|    - Diagnostic Check: Lip rounding (labialization) maintained during front tongue    |
+---------------------------------------------------------------------------------------+
| 2. ICH-LAUT vs ACH-LAUT ALLOPHONY (*ch*)                                              |
|    - Palatal Fricative [ç] (ich-Laut) after front vowels (i, e, ä, ö, ü, ei, eu) & C  |
|    - Velar/Uvular Fricative [x]/[χ] (ach-Laut) after back vowels (a, o, u, au)        |
|    - Diagnostic Check: Correct acoustic formants without collapsing into [ʃ] ("sh")  |
+---------------------------------------------------------------------------------------+
| 3. UVULAR RHOTIC (*r*) & VOCALIZED TIEFSCHWA (*[ɐ]*)                                  |
|    - Syllable onset: Voiced uvular fricative/trill [ʁ] (*rot, Reise, Brot*)           |
|    - Syllable coda / prefix er-, ver-, zer-: Vocalized [ɐ] (*Wasser* [ˈvasɐ])         |
|    - Diagnostic Check: Avoidance of English alveolar retroflex [ɹ]                    |
+---------------------------------------------------------------------------------------+
| 4. FINAL DEVOICING (*Auslautverhärtung*)                                              |
|    - Syllable-final /b, d, g, v, z/ are realized as voiceless [p, t, k, f, s]         |
|    - Examples: *Tag* [taːk], *Hund* [hʊnt], *gelb* [ɡɛlp], *ab* [ap]                  |
|    - Diagnostic Check: Complete devoicing of final stops and sibilants                |
+---------------------------------------------------------------------------------------+
| 5. VOWEL LENGTH & TENSE / LAX CONTRASTS                                               |
|    - Long Tense vs Short Lax minimal pairs:                                           |
|      * *bieten* [iː] vs *bitten* [ɪ]                                                  |
|      * *Beet* [eː] vs *Bett* [ɛ]                                                      |
|      * *Ofen* [oː] vs *offen* [ɔ]                                                     |
|      * *fühlen* [yː] vs *füllen* [ʏ]                                                  |
|    - Diagnostic Check: Vowel duration and formant centering                           |
+---------------------------------------------------------------------------------------+
| 6. GLOTTAL STOP (*Knacklaut [ʔ]*)                                                     |
|    - Crisp vocal fold closure before word-initial and stem-initial vowels             |
|    - Examples: *Theater* [teˈʔaːtɐ], *Vereinbarung* [fɛɐ̯ˈʔaɪ̯nbaʁʊŋ], *Apfel* [ˈʔapfl̩] |
|    - Diagnostic Check: Hard acoustic attack / boundary separation without liaison    |
+---------------------------------------------------------------------------------------+
```

##### Visual Waveform & Phoneme Grading Schema

```typescript
export interface PhonemeScore {
  phonemeIpa: string;
  expectedIpa: string;
  score: number; // 0-100%
  status: 'PERFECT' | 'ACCEPTABLE' | 'NEEDS_WORK'; // Green >= 85%, Yellow 60-84%, Red < 60%
  markerCategory: 'UMLAUT' | 'CH_LAUT' | 'UVULAR_R' | 'AUSLAUTVERHAERTUNG' | 'VOWEL_LENGTH' | 'GLOTTAL_STOP' | 'GENERAL';
  feedbackHint: string;
}

export interface PronunciationResult {
  sentenceId: string;
  targetSentence: string;
  targetIpa: string;
  overallScore: number; // 0-100
  phonemeBreakdown: PhonemeScore[];
  audioWaveformData: number[]; // Normalized audio amplitude array (0-1) for client canvas
  nativeReferenceWaveformData: number[];
}
```

---

#### 3.4 Shadowing & Dictation Engines

##### Shadowing Engine
1. **Pacing Sync**: Measures user speaking rate (syllables/sec) against native speaker reference audio.
2. **Pitch Contour Overlay**: Extracts fundamental frequency ($F_0$) pitch curves via autocorrelation and visualizes user intonation curve overlaid on native reference.
3. **Chunking Buffer**: Breaks long sentences into prosodic phrases (*Phrasierungsblöcke*).

##### Dictation Engine
Evaluates typed transcriptions against audio prompts with strict validation for:
- **Capitalization (*Großschreibung*)**: German nouns must be capitalized (e.g. *der Tisch*, *das Haus*). Lowercase nouns flagged as errors.
- **Umlauts (*ä, ö, ü*) & Eszett (*ß*)**: Missing or incorrect umlauts explicitly highlighted.
- **Punctuation & Compound Spelling**: Validates compound joins without unauthorized hyphens.

```typescript
export interface DictationEvaluation {
  rawInput: string;
  referenceSentence: string;
  isPerfect: boolean;
  score: number; // 0-100%
  diffTokens: Array<{
    word: string;
    status: 'CORRECT' | 'WRONG_SPELLING' | 'WRONG_CASING' | 'MISSING_UMLAUT' | 'OMITTED' | 'EXTRA';
    expectedWord?: string;
    explanation?: string;
  }>;
}
```

---

#### 3.5 Session Debrief Generator (3-3-5 Model)

At the conclusion of any voice interaction session, the system invokes Gemini with a strict response schema to generate an actionable debrief report structured as:
- **3 Highlighted Successes**
- **3 Prioritized Corrections**
- **5 Mined Vocabulary Words**

##### Structured Debrief Output Schema & Pinned Prompt

```typescript
export interface SessionDebrief {
  sessionId: string;
  timestamp: string;
  overallScore: number; // 0-100
  successes: [
    { title: string; detail: string },
    { title: string; detail: string },
    { title: string; detail: string }
  ];
  prioritizedCorrections: [
    {
      errorType: 'WORD_ORDER' | 'CASE_ENDING' | 'VERB_CONJUGATION' | 'VOCABULARY' | 'PRONUNCIATION';
      learnerUtterance: string;
      correctedUtterance: string;
      grammaticalExplanation: string;
      remedialExampleSentence: string;
    },
    {
      errorType: string;
      learnerUtterance: string;
      correctedUtterance: string;
      grammaticalExplanation: string;
      remedialExampleSentence: string;
    },
    {
      errorType: string;
      learnerUtterance: string;
      correctedUtterance: string;
      grammaticalExplanation: string;
      remedialExampleSentence: string;
    }
  ];
  minedVocabulary: Array<{
    lemma: string;
    gender?: 'DER' | 'DIE' | 'DAS';
    partOfSpeech: string;
    cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
    contextSentenceGerman: string;
    contextSentenceEnglish: string;
    englishMeaning: string;
    readyForFsrsDeck: boolean;
  }>; // Exactly 5 items
}
```

---

## 3. Caveats & Assumptions

1. **Audio Latency & Web Audio Constraints**: Real-time phonetic analysis in the browser requires Web Audio API recording combined with backend Gemini / DSP audio feature extraction. For optimal mobile responsiveness, audio processing is structured asynchronously with immediate client-side visual waveform feedback while server-side phoneme alignment finishes in `<1.5s`.
2. **Dialectal Variation**: Standard German (*Hochdeutsch / Bühnendeutsch*) is the authoritative reference standard for phonetic scoring and declension paradigms. Regional variations (e.g. Austrian/Swiss vocabulary differences like *Grüß Gott*, *Velo*, *Jänner*) are cataloged as valid lexical tags in the dictionary without penalizing learners in general drills.
3. **Offline Mode**: The hash-keyed SQLite cache enables offline access for all pre-seeded dictionary words, static curriculum lessons, and cached TTS audio. New generative conversational turns gracefully queue or inform the user when offline.

---

## 4. Conclusion & Deliverables Summary

The survey and technical blueprints for **Explorer 3** are complete and fully specified:
1. **52-Week Curriculum & Daily Session Engine**: Full A0-to-B2 syllabus spanning 52 weeks, 5-block daily session pipeline, adaptive rolling-accuracy grammar tag tracking with `<80%` auto-injection, and catalog of ~60 grammar topics with 900+ drills.
2. **Comprehensive German Reference Dictionary**: 4-case noun declensions, plural classes, diminutive rules, compound decompounder with Fugenelemente, verb conjugations with *haben/sein* auxiliary selector and governed prepositions, 3 adjective declensions + comparatives, and fuzzy/umlaut tolerant reverse inflection search.
3. **5 Voice Modes & Debrief Engine**: Free Conversation with recasts, 5 concrete role-play scenarios with state machines and scoring rubrics, Pronunciation Coach with 6 phonetic markers, Shadowing, Dictation, and the 3-3-5 Post-Session Debrief generator with 1-tap FSRS deck mining.

---

## 5. Verification Method

To independently verify these specifications during implementation:

1. **Curriculum & Adaptive Mastery Unit Tests**:
   - Verify that when a user's `GrammarTagProgress` for `tag_wechselprep_akk` falls to `0.50`, `evaluateRemedialInjection()` injects exactly 2 remedial drills into the next session's Warm-up block.
   - Verify that all 52 weeks contain valid topic links and can-do statements.
2. **Dictionary Inflection & Decompounding Unit Tests**:
   - Verify query normalization: `generateSearchVariants("schoenen")` includes `"schönen"`.
   - Verify compound decompounding: `"Geschwindigkeitsbegrenzung"` resolves to components `["Geschwindigkeit", "-s-", "Begrenzung"]` with head noun gender `DIE`.
   - Verify auxiliary selection: `getVerbAuxiliary("gehen")` $\rightarrow$ `SEIN`, `getVerbAuxiliary("kaufen")` $\rightarrow$ `HABEN`.
3. **Voice & Debrief JSON Schema Validation**:
   - Validate that mock Gemini outputs for `SessionDebrief` strictly conform to the 3 successes, 3 prioritized corrections, and 5 mined vocabulary words schema without missing properties.
