# Technical Specification & Handoff Report — Frontend, UI/UX, Visual Grammar, Voice Studio & Interactive Readers

**Author**: Explorer Survey 2  
**Date**: 2026-09-02  
**Working Directory**: `C:\Users\hp\.gemini\antigravity\scratch\sprachweg\.agents\explorer_survey_2`  
**Target Milestone**: Milestone 0 / Survey & Technical Blueprint  

---

## 1. Observation

Directly extracted from `C:\Users\hp\.gemini\antigravity\scratch\sprachweg\ORIGINAL_REQUEST.md`:

1. **Frontend Stack & Mobile-First UX (R7)**:
   - *"React + Vite + Tailwind CSS + Lucide icons."* (Lines 63, 112)
   - *"Mobile-First UX: Responsive dark/light UI, persistent German special character quick-bar (ä, ö, ü, ß), thumb-friendly navigation, and under-3-tap path to daily sessions."* (Lines 63-64)
   - *"German character toolbar (ä, ö, ü, ß) allows 1-tap character insertion into all input fields."* (Line 95)

2. **Universal Visual Grammar & Sentence Miner UI (R2)**:
   - *"Deep Sentence Teardown: Word-by-word token analysis resolving lemma, POS, contextual meaning, and exact grammatical role (case, declension trigger, syntax function)."* (Lines 23-24)
   - *"Consistent gender color-coding: der (blue), die (red), das (green)."* (Line 25)
   - *"Visual word order map highlighting Position 1, Verb Position 2 (V2), Mittelfeld, and Verb-Final (Nebensatz / Klammerstruktur)."* (Line 26)
   - *"Side-by-Side Translations: Literal word-for-word translation alongside natural idiomatic English translation."* (Line 27)
   - *"Drill & Deck Integration: One-tap addition of any word or whole-sentence cloze card into the FSRS deck, plus generation of 3 CEFR-calibrated variations."* (Line 28)

3. **Audio, Voice & Interactive Readers (R6, R7)**:
   - *"Audio playback (TTS) and Web Audio recording/waveform components function seamlessly."* (Line 93)
   - *"Five Voice Modes: Free Conversation, Scenario Role-Play, Pronunciation Coach, Shadowing & Dictation."* (Lines 52-56)
   - *"Pronunciation Coach: Target sentence repetition with phoneme analysis for key phonetic markers (ü/ö, ch, uvular r, auslautverhärtung, vowel length, glottal stop) and visual audio waveform display."* (Lines 55-56)
   - *"Session Debrief: Highlights 3 successes, 3 prioritized corrections, and 5 mined vocabulary words."* (Line 57)
   - *"Interactive Graded Readers: Graded stories and dialogues with tap-to-inspect lookup on every token."* (Lines 60, 96)

---

## 2. Logic Chain

### Step 1: Mobile-First UX Architecture & Under-3-Tap Flow
- **Goal**: Minimize learner cognitive load and eliminate friction to start daily practice.
- **Deduction**: The main screen must feature a prominent, contextual **Hero Action Card** reflecting the user's immediate curriculum state:
  - **Tap 1**: Open application (landing on `DashboardPage`).
  - **Tap 2**: Tap `"Start Today's 5-Block Session"` (or `"Resume Block 2"`).
  - **Zero-Wait Transition**: The learner is immediately in the interactive drill/review container without navigating nested submenus.
- **Navigation Model**:
  - **Mobile (<1024px)**: Fixed bottom navigation bar (`h-16`) with safe-area padding (`pb-[env(safe-area-inset-bottom)]`) featuring 5 primary icons: *Home/Session*, *Curriculum/Grammar*, *Sentence Miner*, *FSRS Decks*, *Voice Studio*.
  - **Desktop (≥1024px)**: Left collapsible sidebar (`w-64`), displaying user level badge, current streak with freeze protections, and quick theme/sound toggles.

### Step 2: Global German Special Character Quick-Bar
- **Problem**: Standard non-German keyboards lack native physical keys for `ä, ö, ü, ß, Ä, Ö, Ü`, slowing down learners in drills, dictations, and searches.
- **Deduction**: A universal input observer (`useActiveInput`) must track the currently focused `<input>` or `<textarea>` element document-wide.
- **Technical Mechanism**:
  1. Window-level `focusin` / `focusout` event listeners capture the active input reference.
  2. Clicking a quick-bar button retrieves the caret cursor position (`selectionStart`, `selectionEnd`).
  3. The character is spliced into the string.
  4. Crucially, React's synthetic event dispatcher is triggered using `Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set` so internal React `onChange` state updates fire reliably.
  5. The input is re-focused and the selection cursor is restored immediately after the inserted character.
  6. Includes a `Shift` modifier toggle for capital letters (`Ä, Ö, Ü`) and haptic feedback.

### Step 3: Universal Visual Grammar & Sentence Topological Model
- **Color System Standard**:
  - Masculine (*der* / *m*): **Blue** (`#2563eb`, `text-blue-600 dark:text-blue-400`, `bg-blue-50 dark:bg-blue-950/40`, `border-blue-500`).
  - Feminine (*die* / *f*): **Red/Rose** (`#dc2626`, `text-rose-600 dark:text-rose-400`, `bg-rose-50 dark:bg-rose-950/40`, `border-rose-500`).
  - Neuter (*das* / *n*): **Green/Emerald** (`#16a34a`, `text-emerald-600 dark:text-emerald-400`, `bg-emerald-50 dark:bg-emerald-950/40`, `border-emerald-500`).
  - Plural (*die (Pl.)*): **Purple/Violet** (`#9333ea`, `text-purple-600 dark:text-purple-400`, `bg-purple-50 dark:bg-purple-950/40`, `border-purple-500`).
- **German Topological Sentence Model (*Satzklammer*)**:
  - German syntax follows a bracket structure:
    1. **Vorfeld (Position 1)**: Topic / Subject / Adverbial anchor.
    2. **Linke Satzklammer (Position 2 - V2)**: Finite conjugated verb (*Hauptsatz*) or Subordinating conjunction (*Nebensatz*).
    3. **Mittelfeld (Middle Field)**: Governed by **TeKaMoLo** rule (Temporal → Kausal → Modal → Lokal) + Objects / Pronouns / Negation (*nicht*).
    4. **Rechte Satzklammer (Verb-Ende / Bracket Closure)**: Separable prefix (*ab, an, auf*), Partizip II, Infinitive, or conjugated verb in Nebensatz.
    5. **Nachfeld**: Comparative phrases or heavy explanatory clauses.
  - Visual Representation:
    - Connected bracket lines linking Linke Satzklammer (Pos 2) to Rechte Satzklammer (Verb-Ende).
    - Color-coded badges for TeKaMoLo positions with interactive tooltips.

### Step 4: Side-by-Side Interlinear Translations & 1-Tap Deck Mining
- **Tri-Tier View**:
  - **Tier 1 (German)**: Interactive word tokens with gender dots and grammatical case badges.
  - **Tier 2 (Word-for-Word Literal Gloss)**: Direct literal English translation aligned under each German word, preserving German syntax to reveal the structural logic.
  - **Tier 3 (Natural Idiomatic English)**: Fluent English translation with cultural/grammatical context notes.
- **1-Tap Mining**:
  - Clicking any token or the "Mine Sentence" button opens a flashcard preview.
  - Pre-fills: Target word, sentence cloze `[___]`, IPA, English meaning, and audio prompt.
  - Automatically requests or computes 3 CEFR-calibrated sentence variations (A1, A2, B1) so learners reinforce the word across different syntactic structures.

### Step 5: Web Audio API Recording, Waveform & Voice Studio
- **Audio Capture & Analysis**:
  - Uses `navigator.mediaDevices.getUserMedia({ audio: true })`.
  - Routes stream into `AudioContext` → `AnalyserNode` (`fftSize: 256` or `512`).
  - Encodes speech chunks via `MediaRecorder` (`audio/webm;codecs=opus`).
- **Waveform Visualizer**:
  - Canvas-based visualizer running on `requestAnimationFrame`.
  - Mode A: Real-time dynamic amplitude bar visualizer / oscilloscope during active speech.
  - Mode B: Side-by-side pitch/amplitude envelope comparison for Pronunciation Coach (Learner vs Native Speaker Model).
- **TTS Playback**:
  - Gemini Audio / Server TTS API with Web Speech API `speechSynthesis` fallback (German `de-DE` locale).
  - Audio playback synchronization with sentence token highlight tracking.
- **Voice Modes UI**:
  - 5 Distinct Mode Containers (Free Conversation, Scenario Role-Play, Pronunciation Coach, Shadowing, Dictation).
  - Automated **Session Debriefing Modal** showing 3 Key Successes, 3 Priority Corrections with audio replay comparison, and 5 Mined Vocabulary Cards with 1-tap add to FSRS.

### Step 6: Interactive Graded Readers & Tap-to-Inspect Token Popover
- **Tokenizer Engine**:
  - Parses text into sentences and word tokens, separating punctuation while retaining whitespace.
- **Tap-to-Inspect Popover**:
  - Floating tooltip / mobile bottom-sheet positioned relative to tapped token.
  - Contains:
    1. Base Lemma + Gender color indicator (`der / die / das`).
    2. Inflected grammatical role (e.g., *Dativ Singular*).
    3. Contextual English definition.
    4. Instant native TTS pronunciation audio button.
    5. Direct link to full dictionary declension/conjugation entry.
    6. 1-Tap "Add to SRS Deck" button.

---

## 3. Caveats

1. **Browser Audio Autoplay & Permission Policies**:
   - Modern browsers block `AudioContext` and TTS audio playback if invoked prior to user interaction.
   - *Mitigation*: Initialize `AudioContext` and unlock audio on the first user tap (e.g., "Start Session" or "Enable Audio" button).
2. **Mobile Soft Keyboard & Viewport Resizing**:
   - When the virtual keyboard appears on mobile, floating toolbars can be obscured or cause layout shifts.
   - *Mitigation*: Utilize `visualViewport` resize event listeners and CSS `interactive-widget=resizes-content` viewport meta tag to dock the German quick-bar directly above the soft keyboard.
3. **High-DPI Retina Waveform Rendering**:
   - Canvas elements can blur on high-DPI/retina screens.
   - *Mitigation*: Scale Canvas `width` and `height` attributes by `window.devicePixelRatio` while maintaining CSS display dimensions.
4. **German Separable Verbs (*Trennbare Verben*)**:
   - In Hauptsatz, the prefix detaches (*er steht morgen um 7 Uhr auf*).
   - *Mitigation*: Sentence parser must link the prefix token (`auf`) to the finite verb root (`steht` → `aufstehen`) in the visual word order map and token popover.

---

## 4. Conclusion & Technical Blueprint

### 4.1 Component Directory Structure

```
sprachweg/
└── src/
    ├── assets/
    ├── components/
    │   ├── audio/
    │   │   ├── AudioRecorder.tsx           # Web Audio API mic capture & state
    │   │   ├── AudioWaveform.tsx           # Live & static Canvas waveform visualizer
    │   │   ├── PronunciationVisualizer.tsx # Side-by-side pitch/amplitude coach
    │   │   └── TtsAudioButton.tsx          # 1-tap native German audio player
    │   ├── common/
    │   │   ├── Badge.tsx                   # Semantic badges (CEFR, POS, Case)
    │   │   ├── Button.tsx                  # Accessible touch buttons
    │   │   ├── Card.tsx                    # Surface card with theme support
    │   │   ├── Modal.tsx                   # Accessible modal dialog
    │   │   ├── Popover.tsx                 # Floating anchored overlay
    │   │   └── ThemeToggle.tsx             # Dark/Light mode toggle switch
    │   ├── grammar/
    │   │   ├── GenderBadge.tsx             # der(blue)/die(red)/das(green)/pl(purple)
    │   │   ├── KlammerstrukturViewer.tsx   # Satzklammer visual connector & bracket lines
    │   │   ├── NebensatzIndicator.tsx      # Subordinating conjunction & verb-final badge
    │   │   ├── SentenceMiner.tsx           # Sentence miner container with deep teardown
    │   │   ├── SideBySideTranslation.tsx   # Tri-tier interlinear translation display
    │   │   ├── TeKaMoLoBadge.tsx           # Temporal/Kausal/Modal/Lokal syntax badges
    │   │   └── WordOrderMap.tsx            # Vorfeld, V2, Mittelfeld, Verb-Ende visual map
    │   ├── input/
    │   │   ├── GermanQuickBar.tsx          # Persistent toolbar (ä, ö, ü, ß, Ä, Ö, Ü)
    │   │   └── InputWithQuickBar.tsx       # Text input/textarea with docked quick-bar
    │   ├── layout/
    │   │   ├── AppHeader.tsx               # Top bar with streak, CEFR level, theme toggle
    │   │   ├── AppLayout.tsx               # Responsive layout wrapper
    │   │   ├── BottomNav.tsx               # Mobile thumb-friendly bottom nav (5 tabs)
    │   │   └── Sidebar.tsx                 # Desktop expandable navigation sidebar
    │   ├── readers/
    │   │   ├── GradedReaderCard.tsx        # Story catalog card with CEFR & audio tags
    │   │   ├── GradedReaderView.tsx        # Active reading view with karaoke sync
    │   │   ├── TokenizedText.tsx           # Clickable tokenized German text engine
    │   │   └── TokenPopover.tsx            # Tap-to-inspect dictionary & cloze popover
    │   ├── srs/
    │   │   ├── ClozeReviewCard.tsx         # German sentence cloze review card
    │   │   ├── FsrsRatingBar.tsx           # 1-4 rating buttons (Again, Hard, Good, Easy)
    │   │   └── ReviewSessionContainer.tsx  # FSRS review loop engine
    │   └── voice/
    │       ├── ConversationMode.tsx        # Free conversational AI tutor
    │       ├── DictationMode.tsx           # Listen & type with spelling/umlaut diff
    │       ├── PronunciationMode.tsx       # Phoneme repetition & visual score
    │       ├── RolePlayMode.tsx            # Scenario-based conversation with goals
    │       ├── SessionDebriefModal.tsx     # 3 Successes, 3 Corrections, 5 Mined Words
    │       ├── ShadowingMode.tsx           # Audio sync repeat mode
    │       └── VoiceStudio.tsx             # Voice mode selector & session wrapper
    ├── hooks/
    │   ├── useActiveInput.ts               # Tracks active element & inserts umlauts
    │   ├── useAudioRecorder.ts             # Manages MediaRecorder & AnalyserNode
    │   ├── useFsrsDeck.ts                  # FSRS card queue & review actions
    │   ├── useGradedReader.ts              # Reader state & token inspection
    │   ├── useSentenceMiner.ts             # Teardown parser & variation generator
    │   ├── useTheme.ts                     # Dark/Light theme manager
    │   ├── useTtsAudio.ts                  # TTS speech playback with fallback
    │   └── useVoiceSession.ts              # Voice session state & debrief data
    ├── lib/
    │   ├── audioUtils.ts                   # PCM math, audio decoding, buffer helpers
    │   ├── colorTokens.ts                  # Gender & grammatical color constants
    │   ├── grammarSyntax.ts                # Satzklammer & TeKaMoLo categorization rules
    │   └── tokenParser.ts                  # German text & punctuation tokenizer
    ├── pages/
    │   ├── DashboardPage.tsx               # Home dashboard with 1-tap session launcher
    │   ├── DictionaryPage.tsx              # Comprehensive reference dictionary
    │   ├── GrammarCoursePage.tsx           # 52-week curriculum & interactive drills
    │   ├── GradedReadersPage.tsx           # Graded immersion library & reader
    │   ├── PlacementTestPage.tsx           # CEFR diagnostic placement test
    │   ├── ReviewSessionPage.tsx           # Daily 5-block session & FSRS review
    │   ├── SentenceMinerPage.tsx           # Interactive sentence miner
    │   ├── SettingsPage.tsx                # User preferences, daily limits & theme
    │   └── VoiceStudioPage.tsx             # 5 Voice modes & pronunciation coach
    ├── stores/
    │   ├── appStore.ts                     # User progress, streak, current session state
    │   ├── audioStore.ts                   # Global audio volume, voice settings
    │   ├── deckStore.ts                    # FSRS decks, active review queues
    │   └── voiceStore.ts                   # Active conversation transcript & debrief
    └── types/
        ├── audio.ts                        # Audio recording & waveform interfaces
        ├── dictionary.ts                   # Noun/Verb/Adj declension/conjugation types
        ├── fsrs.ts                         # FSRS card, review, and rating models
        ├── grammar.ts                      # Sentence teardown, word order, TeKaMoLo
        ├── reader.ts                       # Story, token, and reader metadata
        └── voice.ts                        # Voice scenario, transcript, debrief types
```

---

### 4.2 Core TypeScript Interfaces & Data Models

```typescript
// types/grammar.ts

export type GermanGender = 'masculine' | 'feminine' | 'neuter' | 'plural' | 'none';
export type GermanCase = 'nominative' | 'accusative' | 'dative' | 'genitive' | 'none';
export type GermanPos = 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'particle' | 'article' | 'other';
export type TopologicalPosition = 'vorfeld' | 'linke_klammer' | 'mittelfeld' | 'rechte_klammer' | 'nachfeld';
export type TeKaMoLoCategory = 'temporal' | 'kausal' | 'modal' | 'lokal' | 'none';

export interface GermanToken {
  id: string;
  rawText: string;
  lemma: string;
  pos: GermanPos;
  gender: GermanGender;
  case: GermanCase;
  number?: 'singular' | 'plural';
  person?: '1st' | '2nd' | '3rd';
  tense?: 'present' | 'past' | 'perfect' | 'future';
  isSeparablePrefix?: boolean;
  linkedVerbId?: string;
  literalEnglish: string;
  ipa?: string;
  topologicalRole: TopologicalPosition;
  tekamolo: TeKaMoLoCategory;
  grammarNotes?: string;
}

export interface SentenceAnalysis {
  id: string;
  originalGerman: string;
  literalTranslation: string;
  naturalTranslation: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  clauseType: 'hauptsatz' | 'nebensatz' | 'inversion' | 'frage';
  tokens: GermanToken[];
  topologicalMap: {
    vorfeld: GermanToken[];
    linkeKlammer: GermanToken[]; // Finite verb in Hauptsatz / Subjunktor in Nebensatz
    mittelfeld: GermanToken[];   // TeKaMoLo, objects, pronouns, particles
    rechteKlammer: GermanToken[];// Prefix, Partizip II, Infinitiv, or Verb in Nebensatz
    nachfeld: GermanToken[];     // Comparisons, heavy clauses
  };
  cefrVariations: {
    a1_a2: string;
    a2_modal: string;
    b1_nebensatz: string;
  };
  grammarTags: string[];
}

// types/voice.ts

export type VoiceMode = 'conversation' | 'roleplay' | 'pronunciation' | 'shadowing' | 'dictation';

export interface PhonemeScore {
  phoneme: string;
  category: 'ch_laut' | 'umlaut' | 'uvular_r' | 'auslautverhaertung' | 'glottal_stop' | 'vowel_length';
  score: number; // 0 to 100
  feedback: string;
  audioSampleOffsetMs?: [number, number];
}

export interface VoiceDebrief {
  sessionId: string;
  mode: VoiceMode;
  durationSeconds: number;
  overallFluencyScore: number;
  successes: [string, string, string]; // 3 Key successes
  priorityCorrections: Array<{
    id: string;
    learnerUtterance: string;
    correctedGerman: string;
    ruleExplanation: string;
    audioReplayUrl?: string;
  }>; // 3 Priority corrections
  minedVocabulary: Array<{
    word: string;
    gender: GermanGender;
    translation: string;
    contextSentence: string;
    clozeSentence: string;
  }>; // 5 Mined vocabulary words
}
```

---

### 4.3 Key Component Specifications

#### A. Persistent German Quick-Bar (`src/components/input/GermanQuickBar.tsx`)
```tsx
import React, { useState, useEffect } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

interface GermanQuickBarProps {
  onInsert?: (char: string) => void;
  className?: string;
}

const LOWERCASE_CHARS = ['ä', 'ö', 'ü', 'ß'];
const UPPERCASE_CHARS = ['Ä', 'Ö', 'Ü', 'SS'];

export const GermanQuickBar: React.FC<GermanQuickBarProps> = ({ onInsert, className = '' }) => {
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [lastActiveElement, setLastActiveElement] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        setLastActiveElement(target);
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    return () => window.removeEventListener('focusin', handleFocusIn);
  }, []);

  const handleCharClick = (char: string) => {
    // 1. Trigger optional callback
    onInsert?.(char);

    // 2. Trigger native insertion into active DOM element
    if (lastActiveElement && document.body.contains(lastActiveElement)) {
      const input = lastActiveElement;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const val = input.value;
      const nextVal = val.substring(0, start) + char + val.substring(end);

      // React synthetic event workaround
      const setter = Object.getOwnPropertyDescriptor(
        input instanceof HTMLInputElement ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;

      if (setter) {
        setter.call(input, nextVal);
      } else {
        input.value = nextVal;
      }

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
      const newCursor = start + char.length;
      input.setSelectionRange(newCursor, newCursor);

      // Reset shift if it was a one-shot capital insertion
      if (isShiftActive) setIsShiftActive(false);

      // Haptic feedback where supported
      if ('vibrate' in navigator) {
        navigator.vibrate(8);
      }
    }
  };

  const activeChars = isShiftActive ? UPPERCASE_CHARS : LOWERCASE_CHARS;

  return (
    <div
      role="toolbar"
      aria-label="German special character toolbar"
      className={`inline-flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsShiftActive((prev) => !prev)}
        title="Toggle uppercase umlauts"
        aria-pressed={isShiftActive}
        className={`px-2 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 ${
          isShiftActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
        }`}
      >
        <ArrowUp className="w-3.5 h-3.5 inline mr-0.5" />
        Shift
      </button>

      {activeChars.map((char) => (
        <button
          key={char}
          type="button"
          onClick={() => handleCharClick(char)}
          className="w-8 h-8 flex items-center justify-center font-medium text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg shadow-sm border border-slate-200/60 dark:border-slate-600/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300 hover:border-blue-300 transition-all active:scale-90"
        >
          {char}
        </button>
      ))}
    </div>
  );
};
```

---

#### B. Universal Gender Color Standard (`src/lib/colorTokens.ts`)
```typescript
export const GENDER_STYLES = {
  masculine: {
    label: 'der',
    code: 'm',
    color: '#2563eb',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    dotClass: 'bg-blue-600',
    borderClass: 'border-blue-500',
    textClass: 'text-blue-600 dark:text-blue-400 font-semibold',
  },
  feminine: {
    label: 'die',
    code: 'f',
    color: '#e11d48',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700',
    dotClass: 'bg-rose-600',
    borderClass: 'border-rose-500',
    textClass: 'text-rose-600 dark:text-rose-400 font-semibold',
  },
  neuter: {
    label: 'das',
    code: 'n',
    color: '#16a34a',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    dotClass: 'bg-emerald-600',
    borderClass: 'border-emerald-500',
    textClass: 'text-emerald-600 dark:text-emerald-400 font-semibold',
  },
  plural: {
    label: 'die (Pl.)',
    code: 'pl',
    color: '#9333ea',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    dotClass: 'bg-purple-600',
    borderClass: 'border-purple-500',
    textClass: 'text-purple-600 dark:text-purple-400 font-semibold',
  },
  none: {
    label: '-',
    code: '-',
    color: '#64748b',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dotClass: 'bg-slate-400',
    borderClass: 'border-slate-300',
    textClass: 'text-slate-800 dark:text-slate-200',
  }
};
```

---

#### C. Visual Word Order Map & Satzklammer (`src/components/grammar/WordOrderMap.tsx`)
```tsx
import React from 'react';
import { SentenceAnalysis, GermanToken } from '../../types/grammar';
import { GENDER_STYLES } from '../../lib/colorTokens';
import { Link2 } from 'lucide-react';

interface WordOrderMapProps {
  analysis: SentenceAnalysis;
  onTokenClick?: (token: GermanToken) => void;
}

export const WordOrderMap: React.FC<WordOrderMapProps> = ({ analysis, onTokenClick }) => {
  const { topologicalMap, clauseType } = analysis;

  const renderTokenBox = (token: GermanToken) => {
    const genderStyle = GENDER_STYLES[token.gender] || GENDER_STYLES.none;
    const isTeKaMoLo = token.tekamolo !== 'none';

    return (
      <button
        key={token.id}
        type="button"
        onClick={() => onTokenClick?.(token)}
        className="group relative flex flex-col items-center px-2.5 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all text-left"
      >
        <div className="flex items-center gap-1.5 mb-1">
          {token.gender !== 'none' && (
            <span className={`w-2 h-2 rounded-full ${genderStyle.dotClass}`} title={genderStyle.label} />
          )}
          <span className={`text-sm font-bold ${genderStyle.textClass}`}>
            {token.rawText}
          </span>
        </div>

        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          {token.lemma !== token.rawText ? `[${token.lemma}]` : token.pos}
        </span>

        {isTeKaMoLo && (
          <span className="mt-1 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
            {token.tekamolo}
          </span>
        )}

        {token.case !== 'none' && (
          <span className="text-[9px] text-slate-500 font-medium">
            {token.case.substring(0, 3)}.
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Visual Word Order Map (Topologisches Modell)
        </h4>
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          Clause: {clauseType.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Vorfeld / Position 1 */}
        <div className="flex flex-col p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
          <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center justify-between">
            <span>Pos 1: Vorfeld</span>
            <span className="text-[9px] px-1 bg-blue-100 dark:bg-blue-900/60 rounded">Topic</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topologicalMap.vorfeld.length > 0 ? (
              topologicalMap.vorfeld.map(renderTokenBox)
            ) : (
              <span className="text-xs text-slate-400 italic">Empty</span>
            )}
          </div>
        </div>

        {/* Linke Satzklammer / Position 2 */}
        <div className="flex flex-col p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border-2 border-purple-300 dark:border-purple-700/60">
          <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300 mb-2 flex items-center justify-between">
            <span>Pos 2: Linke Klammer</span>
            <span className="text-[9px] px-1 bg-purple-200 dark:bg-purple-900/80 rounded">Finite Verb</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topologicalMap.linkeKlammer.map(renderTokenBox)}
          </div>
        </div>

        {/* Mittelfeld / TeKaMoLo */}
        <div className="flex flex-col p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
            <span>Mittelfeld</span>
            <span className="text-[9px] px-1 bg-slate-200 dark:bg-slate-700 rounded">TeKaMoLo / Obj</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topologicalMap.mittelfeld.length > 0 ? (
              topologicalMap.mittelfeld.map(renderTokenBox)
            ) : (
              <span className="text-xs text-slate-400 italic">Empty</span>
            )}
          </div>
        </div>

        {/* Rechte Satzklammer / Verb-Final */}
        <div className="flex flex-col p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border-2 border-dashed border-purple-300 dark:border-purple-700/60">
          <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300 mb-2 flex items-center justify-between">
            <span>Rechte Klammer</span>
            <span className="text-[9px] px-1 bg-purple-200 dark:bg-purple-900/80 rounded">Verb-Ende</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topologicalMap.rechteKlammer.length > 0 ? (
              topologicalMap.rechteKlammer.map(renderTokenBox)
            ) : (
              <span className="text-xs text-slate-400 italic">Ø</span>
            )}
          </div>
        </div>

        {/* Nachfeld */}
        <div className="flex flex-col p-2.5 rounded-xl bg-slate-50/40 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-bold text-slate-500 mb-2">
            <span>Nachfeld</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topologicalMap.nachfeld.length > 0 ? (
              topologicalMap.nachfeld.map(renderTokenBox)
            ) : (
              <span className="text-xs text-slate-400 italic">Ø</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

#### D. Side-by-Side Interlinear Translation (`src/components/grammar/SideBySideTranslation.tsx`)
```tsx
import React from 'react';
import { SentenceAnalysis } from '../../types/grammar';
import { GENDER_STYLES } from '../../lib/colorTokens';
import { Volume2, PlusCircle, Sparkles } from 'lucide-react';

interface SideBySideTranslationProps {
  analysis: SentenceAnalysis;
  onPlayAudio?: () => void;
  onMineSentence?: () => void;
  onMineToken?: (token: any) => void;
}

export const SideBySideTranslation: React.FC<SideBySideTranslationProps> = ({
  analysis,
  onPlayAudio,
  onMineSentence,
  onMineToken,
}) => {
  return (
    <div className="w-full bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white">
            {analysis.cefrLevel}
          </span>
          <button
            type="button"
            onClick={onPlayAudio}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Listen to German Audio"
          >
            <Volume2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </button>
        </div>

        <button
          type="button"
          onClick={onMineSentence}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          Mine to FSRS Deck
        </button>
      </div>

      {/* Tier 1 & 2: Interlinear Token Alignment */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
        <div className="flex items-end gap-3 min-w-max pb-1">
          {analysis.tokens.map((tok) => {
            const g = GENDER_STYLES[tok.gender] || GENDER_STYLES.none;
            return (
              <div
                key={tok.id}
                onClick={() => onMineToken?.(tok)}
                className="cursor-pointer group flex flex-col items-center text-center hover:bg-white dark:hover:bg-slate-800 p-1.5 rounded-lg transition-all"
              >
                {/* German Token */}
                <span className={`text-base font-bold tracking-wide ${g.textClass}`}>
                  {tok.rawText}
                </span>

                {/* Literal Word-for-Word Gloss */}
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {tok.literalEnglish}
                </span>

                {/* Grammatical Tag Chip */}
                {tok.case !== 'none' && (
                  <span className="text-[9px] font-semibold text-slate-400 mt-1 uppercase">
                    {tok.case.substring(0, 3)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier 3: Natural Idiomatic Translation */}
      <div className="flex items-start gap-3 p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/40">
        <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            Natural Idiomatic English
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
            "{analysis.naturalTranslation}"
          </p>
        </div>
      </div>

      {/* CEFR Variations Drawer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          CEFR-Calibrated Structural Variations:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs">
            <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">A1/A2 (Past/Perfekt):</span>
            <span className="text-slate-700 dark:text-slate-300">{analysis.cefrVariations.a1_a2}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">A2 (Modalverb):</span>
            <span className="text-slate-700 dark:text-slate-300">{analysis.cefrVariations.a2_modal}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs">
            <span className="font-bold text-purple-600 dark:text-purple-400 block mb-1">B1 (Nebensatz):</span>
            <span className="text-slate-700 dark:text-slate-300">{analysis.cefrVariations.b1_nebensatz}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

#### E. Web Audio Recording & Canvas Waveform Visualizer (`src/components/audio/AudioWaveform.tsx`)
```tsx
import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  analyserNode: AnalyserNode | null;
  isRecording: boolean;
  className?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  analyserNode,
  isRecording,
  className = 'w-full h-24',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina display scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      if (!isRecording || !analyserNode) {
        // Idle state: gentle pulsating flatline
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      analyserNode.getByteTimeDomainData(dataArray);

      ctx.lineWidth = 3;
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#2563eb');
      gradient.addColorStop(0.5, '#06b6d4');
      gradient.addColorStop(1, '#10b981');
      ctx.strokeStyle = gradient;

      ctx.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-xl bg-slate-900 border border-slate-800 shadow-inner ${className}`}
    />
  );
};
```

---

#### F. Graded Readers & Tap-to-Inspect Token Popover (`src/components/readers/TokenizedText.tsx` & `TokenPopover.tsx`)
```tsx
import React, { useState } from 'react';
import { GENDER_STYLES } from '../../lib/colorTokens';
import { Volume2, Plus, BookOpen } from 'lucide-react';

export interface ReaderToken {
  id: string;
  rawText: string;
  lemma: string;
  gender: 'masculine' | 'feminine' | 'neuter' | 'plural' | 'none';
  grammarCase?: string;
  definition: string;
  ipa?: string;
}

interface TokenizedTextProps {
  tokens: ReaderToken[];
  onAddFlashcard: (token: ReaderToken) => void;
  onOpenDictionary: (lemma: string) => void;
  onPlayTts: (text: string) => void;
}

export const TokenizedText: React.FC<TokenizedTextProps> = ({
  tokens,
  onAddFlashcard,
  onOpenDictionary,
  onPlayTts,
}) => {
  const [selectedToken, setSelectedToken] = useState<ReaderToken | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  const handleTokenClick = (token: ReaderToken, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setSelectedToken(token);
    setPopoverPos({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 8,
    });
  };

  return (
    <div className="relative leading-relaxed text-lg text-slate-800 dark:text-slate-100 font-serif">
      <p className="flex flex-wrap gap-x-1.5 gap-y-2">
        {tokens.map((token) => {
          const gender = GENDER_STYLES[token.gender] || GENDER_STYLES.none;
          const isNoun = token.gender !== 'none';

          return (
            <span
              key={token.id}
              onClick={(e) => handleTokenClick(token, e)}
              className={`cursor-pointer px-1 py-0.5 rounded transition-all select-none hover:bg-amber-100 dark:hover:bg-amber-950/60 ${
                isNoun ? 'underline decoration-2 underline-offset-4' : ''
              }`}
              style={{ textDecorationColor: isNoun ? gender.color : undefined }}
            >
              {token.rawText}
            </span>
          );
        })}
      </p>

      {/* Tap-to-Inspect Popover Card */}
      {selectedToken && popoverPos && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSelectedToken(null)}
          />
          <div
            style={{ top: `${popoverPos.y}px`, left: `${Math.min(popoverPos.x, window.innerWidth - 300)}px` }}
            className="absolute z-50 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedToken.lemma}
                  </span>
                  {selectedToken.gender !== 'none' && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${GENDER_STYLES[selectedToken.gender].badgeClass}`}>
                      {GENDER_STYLES[selectedToken.gender].label}
                    </span>
                  )}
                </div>
                {selectedToken.ipa && (
                  <span className="text-xs text-slate-400 font-mono">
                    /{selectedToken.ipa}/
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onPlayTts(selectedToken.lemma)}
                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                title="Hear native pronunciation"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 font-sans font-medium">
              {selectedToken.definition}
            </p>

            {selectedToken.grammarCase && (
              <div className="mt-1 text-[11px] font-mono text-slate-400">
                Form: {selectedToken.grammarCase}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenDictionary(selectedToken.lemma);
                  setSelectedToken(null);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Dictionary
              </button>

              <button
                type="button"
                onClick={() => {
                  onAddFlashcard(selectedToken);
                  setSelectedToken(null);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Deck
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
```

---

#### G. Voice Studio Debrief Modal (`src/components/voice/SessionDebriefModal.tsx`)
```tsx
import React from 'react';
import { VoiceDebrief } from '../../types/voice';
import { CheckCircle2, AlertTriangle, Plus, Sparkles, X } from 'lucide-react';
import { GENDER_STYLES } from '../../lib/colorTokens';

interface SessionDebriefModalProps {
  debrief: VoiceDebrief;
  isOpen: boolean;
  onClose: () => void;
  onAddWordToDeck: (word: any) => void;
}

export const SessionDebriefModal: React.FC<SessionDebriefModalProps> = ({
  debrief,
  isOpen,
  onClose,
  onAddWordToDeck,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Speaking Session Debrief
              </h3>
              <p className="text-xs text-slate-500">
                Mode: {debrief.mode.toUpperCase()} • Fluency Score: {debrief.overallFluencyScore}%
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Three Key Successes */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2.5">
            <CheckCircle2 className="w-4 h-4" />
            3 Key Successes
          </h4>
          <ul className="space-y-2">
            {debrief.successes.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-sm text-slate-800 dark:text-slate-200 font-medium"
              >
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. Three Priority Corrections */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-2.5">
            <AlertTriangle className="w-4 h-4" />
            3 Priority Corrections & Explanations
          </h4>
          <div className="space-y-2.5">
            {debrief.priorityCorrections.map((corr) => (
              <div
                key={corr.id}
                className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1.5 text-sm"
              >
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold line-through text-xs">
                  "{corr.learnerUtterance}"
                </div>
                <div className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                  → "{corr.correctedGerman}"
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1 border-t border-rose-200/50 dark:border-rose-900/40">
                  {corr.ruleExplanation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Five Mined Vocabulary Words */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-2.5">
            <Plus className="w-4 h-4" />
            5 Mined Vocabulary Words
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {debrief.minedVocabulary.map((vocab, i) => {
              const g = GENDER_STYLES[vocab.gender] || GENDER_STYLES.none;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-bold ${g.textClass}`}>
                        {vocab.word}
                      </span>
                      {vocab.gender !== 'none' && (
                        <span className={`px-1.5 py-0.2 text-[10px] font-semibold rounded ${g.badgeClass}`}>
                          {g.label}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{vocab.translation}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddWordToDeck(vocab)}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                    title="Add to FSRS review deck"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95"
          >
            Complete Session
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 5. Verification Method

To independently verify all frontend specifications during implementation and testing phases:

### A. Automated Component & Unit Test Commands
```bash
# Run Vitest suite across frontend components
npm run test

# Run specific UI & visual grammar test suites
npx vitest run src/components/input/GermanQuickBar.test.tsx
npx vitest run src/components/grammar/WordOrderMap.test.tsx
npx vitest run src/components/readers/TokenizedText.test.tsx
npx vitest run src/components/audio/AudioRecorder.test.tsx
```

### B. Core Test Cases to Validate
1. **German Character Quick-Bar**:
   - `test_focus_tracking`: Focuses an input, clicks `ä`, verifies `input.value` contains `ä` at cursor, and React `onChange` fires.
   - `test_shift_toggle`: Toggles Shift, clicks `Ä`, verifies uppercase inserted, and Shift resets.
   - `test_caret_preservation`: Inserts character in the middle of a string (`"Bcher"` → `"Bücher"`), verifies cursor advances to index 2.
2. **Universal Visual Grammar & Color Badges**:
   - `test_gender_colors`: Validates `der` renders blue (`#2563eb`), `die` renders red (`#dc2626`), `das` renders green (`#16a34a`), and plural renders purple (`#9333ea`).
   - `test_word_order_map`: Verifies that given sentence *"Gestern habe ich ein Buch gekauft"*, Vorfeld contains `"Gestern"`, Linke Klammer contains `"habe"`, Mittelfeld contains `"ich ein Buch"`, and Rechte Klammer contains `"gekauft"`.
3. **Side-by-Side Interlinear Translation & Mining**:
   - `test_interlinear_display`: Verifies literal gloss matches word-by-word tokens and natural translation renders in Tier 3.
   - `test_one_tap_mining`: Simulates click on "Mine to FSRS Deck", verifies payload contains cloze sentence and 3 CEFR variations.
4. **Web Audio & Waveform Visualization**:
   - `test_audio_recorder_lifecycle`: Mock `getUserMedia`, start recording, verify `AnalyserNode` frequency bin query, stop recording, verify audio blob generation.
5. **Interactive Graded Readers & Token Popover**:
   - `test_tap_to_inspect`: Clicks a token, verifies popover mounts with lemma, gender badge, definition, audio trigger, and dictionary action.
6. **Voice Studio Debrief**:
   - `test_debrief_modal`: Verifies modal renders exactly 3 successes, 3 priority corrections with grammatical explanations, and 5 mined words with 1-tap deck insertion.
