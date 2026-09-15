// Curriculum content seeded into the database. The app reads it through the API.

export const SEED_TOPICS: any[] = [
  {
    id: 'topic-1',
    slug: 'nominativ-articles-gender',
    titleDe: 'Artikel und Geschlecht im Nominativ',
    titleEn: 'Articles & Gender in the Nominative Case',
    cefrLevel: 'A1',
    weekNumber: 1,
    orderIndex: 1,
    description: 'Master the three German genders (der, die, das) and the subject case.',
    explanationMd: `In German, every noun has a grammatical gender: **der** (masculine, blue), **die** (feminine, red), and **das** (neuter, green). In the plural, all genders use **die** (purple).

The **Nominativ** is the basic form used for the **subject** of the sentence (who or what is doing the action).

### Mental Model
Think of German genders as inseparable identity tags attached to the noun. Never learn *Tisch*; always learn *der Tisch*!`,
    formulaPattern: 'Subjekt (Nominativ) + Verb (Position 2) + Rest',
    visualTable: {
      headers: ['Gender', 'Definite', 'Indefinite', 'Negative'],
      rows: [
        ['Maskulin', 'der Mann', 'ein Mann', 'kein Mann'],
        ['Feminin', 'die Frau', 'eine Frau', 'keine Frau'],
        ['Neutral', 'das Kind', 'ein Kind', 'kein Kind'],
        ['Plural', 'die Kinder', '— Kinder', 'keine Kinder'],
      ]
    },
    commonMistakes: [
      { wrong: 'Das Tisch ist schön.', correct: 'Der Tisch ist schön.', explanation: 'Tisch is masculine (der), not neuter.' },
      { wrong: 'Ich bin ein Lehrer.', correct: 'Ich bin Lehrer.', explanation: 'Professions in German usually omit the indefinite article with sein/werden.' }
    ],
    tags: ['articles', 'nominativ', 'gender'],
    drills: [
      {
        id: 'd1-1',
        type: 'cloze',
        prompt: '___ Mann trinkt Kaffee am Morgen.',
        correctAnswer: 'Der',
        options: ['Der', 'Die', 'Das', 'Ein'],
        explanation: 'Mann is masculine singular in the Nominative case (der).',
        grammarTag: 'nominativ'
      },
      {
        id: 'd1-2',
        type: 'transform',
        prompt: 'Transform into feminine: "Der Student lernt Deutsch."',
        sentenceContext: 'Use "Die Studentin"',
        correctAnswer: 'Die Studentin lernt Deutsch.',
        options: ['Die Studentin lernt Deutsch.', 'Das Studentin lernt Deutsch.', 'Der Studentin lernt Deutsch.'],
        explanation: 'Feminine student is die Studentin.',
        grammarTag: 'gender'
      },
      {
        id: 'd1-3',
        type: 'reorder',
        prompt: 'Arrange into standard V2 sentence order:',
        sentenceContext: 'ist / Das / Buch / sehr / interessant',
        correctAnswer: 'Das Buch ist sehr interessant.',
        options: ['Das Buch ist sehr interessant.', 'Sehr interessant das Buch ist.', 'Ist das Buch sehr interessant.'],
        explanation: 'Position 1: Das Buch, Position 2: ist, Mittelfeld: sehr interessant.',
        grammarTag: 'word_order'
      }
    ]
  },
  {
    id: 'topic-2',
    slug: 'akkusativ-case',
    titleDe: 'Der Akkusativ: Das direkte Objekt',
    titleEn: 'The Accusative Case: Direct Objects',
    cefrLevel: 'A1',
    weekNumber: 2,
    orderIndex: 2,
    description: 'How the direct object changes articles — notice that only the masculine form changes!',
    explanationMd: `The **Akkusativ** marks the direct object (who or what receives the action).

### The Golden Rule of Accusative:
Only **masculine** changes! **der → den**, **ein → einen**, **kein → keinen**. Feminine, neuter, and plural stay completely identical to the nominative.`,
    formulaPattern: 'Subjekt (Nom) + Verb + Direktes Objekt (Akk)',
    visualTable: {
      headers: ['Gender', 'Nominativ', 'Akkusativ', 'Indefinite Akk'],
      rows: [
        ['Maskulin', 'der Apfel', 'den Apfel', 'einen Apfel'],
        ['Feminin', 'die Suppe', 'die Suppe', 'eine Suppe'],
        ['Neutral', 'das Brot', 'das Brot', 'ein Brot'],
        ['Plural', 'die Äpfel', 'die Äpfel', 'keine Äpfel'],
      ]
    },
    commonMistakes: [
      { wrong: 'Ich habe der Schlüssel.', correct: 'Ich habe den Schlüssel.', explanation: 'Schlüssel is masculine direct object (Akkusativ) -> den.' }
    ],
    tags: ['akkusativ', 'articles'],
    drills: [
      {
        id: 'd2-1',
        type: 'cloze',
        prompt: 'Ich kaufe ___ neuen Laptop (m).',
        correctAnswer: 'den',
        options: ['den', 'der', 'das', 'dem'],
        explanation: 'Masculine singular in Akkusativ takes "den".',
        grammarTag: 'akkusativ'
      },
      {
        id: 'd2-2',
        type: 'error_spotting',
        prompt: 'Spot and correct the error in: "Er sieht der Hund."',
        correctAnswer: 'Er sieht den Hund.',
        options: ['Er sieht den Hund.', 'Er sieht dem Hund.', 'Er sieht das Hund.'],
        explanation: 'Hund is masculine direct object (Akkusativ) -> den Hund.',
        grammarTag: 'akkusativ'
      }
    ]
  },
  {
    id: 'topic-3',
    slug: 'dativ-case-indirect-objects',
    titleDe: 'Der Dativ: Das indirekte Objekt & Präpositionen',
    titleEn: 'The Dative Case: Indirect Objects & Fixed Prepositions',
    cefrLevel: 'A2',
    weekNumber: 10,
    orderIndex: 3,
    description: 'The receiver of actions (dem, der, dem, den + n) and dative verbs (helfen, danken, gefallen).',
    explanationMd: `The **Dativ** marks the indirect object (to whom or for whom something is done) or follows dative prepositions (*aus, bei, mit, nach, seit, von, zu*).

### Dative Shifts:
- **der → dem**
- **das → dem**
- **die → der**
- **die (Plural) → den + n** (add *-n* to noun if possible!)`,
    formulaPattern: 'Subjekt (Nom) + Verb + Dativ-Objekt (dem/der) + Akkusativ-Objekt (den/die/das)',
    visualTable: {
      headers: ['Gender', 'Nominativ', 'Dativ Definite', 'Dativ Indefinite'],
      rows: [
        ['Maskulin', 'der Mann', 'dem Mann', 'einem Mann'],
        ['Feminin', 'die Frau', 'der Frau', 'einer Frau'],
        ['Neutral', 'das Kind', 'dem Kind', 'einem Kind'],
        ['Plural', 'die Kinder', 'den Kindern', 'meinen Kindern'],
      ]
    },
    tags: ['dativ', 'prepositions', 'indirect_object'],
    drills: [
      {
        id: 'd3-1',
        type: 'cloze',
        prompt: 'Ich helfe ___ alten Dame (f) über die Straße.',
        correctAnswer: 'der',
        options: ['der', 'die', 'dem', 'den'],
        explanation: 'Helfen triggers Dativ. Feminine singular in Dativ is "der".',
        grammarTag: 'dativ'
      },
      {
        id: 'd3-2',
        type: 'cloze',
        prompt: 'Wir fahren mit ___ Zug (m) nach Berlin.',
        correctAnswer: 'dem',
        options: ['dem', 'den', 'der', 'das'],
        explanation: 'Mit is a pure Dativ preposition. Masculine Dativ is "dem".',
        grammarTag: 'dativ'
      }
    ]
  },
  {
    id: 'topic-4',
    slug: 'perfekt-auxiliary-selection',
    titleDe: 'Das Perfekt: Haben oder Sein?',
    titleEn: 'The Conversational Past: Haben vs. Sein',
    cefrLevel: 'A2',
    weekNumber: 14,
    orderIndex: 4,
    description: 'How to choose between haben and sein in spoken German past tense.',
    explanationMd: `In German conversation, the **Perfekt** is the standard past tense. It forms the classic **Satzklammer** (sentence bracket): Auxiliary verb in Position 2, Partizip II at the very end of the clause.

### The Rule for "Sein":
Use **sein** only for verbs expressing:
1. **Movement / Change of location** (*gehen, fahren, fliegen, kommen, laufen*)
2. **Change of state** (*einschlafen, aufwachen, sterben, wachsen*)
3. The exceptions: *sein (ist gewesen), werden (ist geworden), bleiben (ist geblieben), passieren (ist passiert)*.

All other verbs (including all reflexive and transitive verbs with accusative objects) take **haben**!`,
    formulaPattern: 'Subjekt + [haben/sein (Pos 2)] + Mittelfeld + [Partizip II (Ende)]',
    visualTable: {
      headers: ['Auxiliary', 'Condition', 'Example', 'Partizip II'],
      rows: [
        ['sein', 'Movement / Direction change', 'Ich bin nach Hause gegangen.', 'gegangen'],
        ['sein', 'State change', 'Er ist um 7 Uhr aufgewacht.', 'aufgewacht'],
        ['sein', 'Bleiben / Sein', 'Wir sind dort geblieben.', 'geblieben'],
        ['haben', 'Transitive / All other actions', 'Sie hat einen Kaffee getrunken.', 'getrunken'],
      ]
    },
    tags: ['perfekt', 'auxiliary', 'satzklammer'],
    drills: [
      {
        id: 'd4-1',
        type: 'cloze',
        prompt: 'Gestern ___ ich den ganzen Tag zu Hause geblieben.',
        correctAnswer: 'bin',
        options: ['bin', 'habe', 'war', 'hatte'],
        explanation: 'Bleiben always takes "sein" in Perfekt (Ich bin geblieben).',
        grammarTag: 'auxiliary'
      },
      {
        id: 'd4-2',
        type: 'reorder',
        prompt: 'Build the Satzklammer past sentence:',
        sentenceContext: 'nach / Wir / gestern / gefahren / sind / München',
        correctAnswer: 'Wir sind gestern nach München gefahren.',
        options: ['Wir sind gestern nach München gefahren.', 'Wir haben gestern nach München gefahren.', 'Gestern wir sind nach München gefahren.'],
        explanation: 'Satzklammer: sind (Pos 2) ... gefahren (Ende).',
        grammarTag: 'satzklammer'
      }
    ]
  },
  {
    id: 'topic-5',
    slug: 'nebensaetze-word-order',
    titleDe: 'Nebensätze: Verb am Ende (weil, dass, wenn)',
    titleEn: 'Subordinate Clauses: Verb-Final Word Order',
    cefrLevel: 'A2',
    weekNumber: 16,
    orderIndex: 5,
    description: 'Subordinating conjunctions send the conjugated verb to the absolute end of the clause.',
    explanationMd: `Subordinating conjunctions like **weil** (because), **dass** (that), **wenn** (if/when), **ob** (whether), and **obwohl** (although) kick the finite conjugated verb to the **very end** of the clause.

### Contrast:
- Main Clause: *Ich **bleibe** heute zu Hause, denn ich **bin** krank.* (denn = Pos 0)
- Subordinate Clause: *Ich bleibe heute zu Hause, weil ich krank **bin**.* (weil = Verb-Final!)`,
    formulaPattern: 'Hauptsatz [V2] , + Subjunktion + Subjekt + Mittelfeld + [Konjugiertes Verb (Ende)]',
    visualTable: {
      headers: ['Conjunction', 'Meaning', 'Word Order Rule', 'Example'],
      rows: [
        ['weil', 'because', 'Verb to the very end', '... weil er heute keine Zeit hat.'],
        ['dass', 'that', 'Verb to the very end', 'Ich weiß, dass du fleißig lernst.'],
        ['wenn', 'if / whenever', 'Verb to the very end', 'Wenn das Wetter schön ist, wandern wir.'],
        ['obwohl', 'although', 'Verb to the very end', 'Obwohl es regnet, gehen wir spazieren.'],
      ]
    },
    tags: ['nebensatz', 'word_order', 'connectors'],
    drills: [
      {
        id: 'd5-1',
        type: 'cloze',
        prompt: 'Er lernt viel Deutsch, weil er in Deutschland arbeiten ___.',
        correctAnswer: 'möchte',
        options: ['möchte', 'will er', 'möchte er', 'hat'],
        explanation: 'In a weil clause, the conjugated modal verb goes to the very end.',
        grammarTag: 'nebensatz'
      }
    ]
  },
  {
    id: 'topic-6',
    slug: 'adjektivdeklination-three-patterns',
    titleDe: 'Adjektivdeklination: Stark, Schwach, Gemischt',
    titleEn: 'Adjective Endings: The 3 Declension Tables',
    cefrLevel: 'B1_START',
    weekNumber: 22,
    orderIndex: 6,
    description: 'Master the adjective endings that challenge every English speaker.',
    explanationMd: `Adjective endings in German follow a simple principle of **gender signaling**:
If the preceding word (article) already clearly signals the case and gender (like *der*, *die*, *das*, *dem*), the adjective takes a **weak ending** (*-e* or *-en*).
If there is no article, the adjective must do the heavy lifting and take the **strong ending** (*-er*, *-es*, *-e*, *-em*, etc.)!

### The "N-Bierkrug" Rule:
In weak and mixed declensions, almost all Dative, Genitive, and Plural adjectives end in **-en**!`,
    formulaPattern: 'Artikel + Adjektiv [-e / -en / -er / -es] + Nomen',
    visualTable: {
      headers: ['Case', 'Maskulin (der/ein)', 'Feminin (die/eine)', 'Neutral (das/ein)', 'Plural (die/—)'],
      rows: [
        ['Nom (Def)', 'der gute Mann', 'die schöne Frau', 'das kleine Kind', 'die neuen Bücher'],
        ['Akk (Def)', 'den guten Mann', 'die schöne Frau', 'das kleine Kind', 'die neuen Bücher'],
        ['Dat (Def)', 'dem guten Mann', 'der schönen Frau', 'dem kleinen Kind', 'den neuen Büchern'],
        ['Nom (Indef)', 'ein guter Mann', 'eine schöne Frau', 'ein kleines Kind', 'neue Bücher'],
      ]
    },
    tags: ['adjectives', 'declension', 'cases'],
    drills: [
      {
        id: 'd6-1',
        type: 'cloze',
        prompt: 'Ich trinke einen heiß___ Kaffee (m, Akk).',
        correctAnswer: 'en',
        options: ['en', 'er', 'es', 'e'],
        explanation: 'Mixed declension (einen) masculine accusative adjective ending is -en (einen heißen Kaffee).',
        grammarTag: 'adjectives'
      }
    ]
  },
  {
    id: 'topic-7',
    slug: 'konjunktiv-ii-hypothetical',
    titleDe: 'Konjunktiv II: Wünsche, Höflichkeit & Hypothesen',
    titleEn: 'Subjunctive II: Wishes, Politeness & Hypotheticals',
    cefrLevel: 'B1_SOLID',
    weekNumber: 34,
    orderIndex: 7,
    description: 'Polite requests (könnten, würden) and unreal conditions (wenn ich reich wäre...).',
    explanationMd: `The **Konjunktiv II** expresses politeness (*Könnten Sie mir helfen?*), wishes, and hypothetical scenarios (*Wenn ich Zeit hätte, würde ich reisen*).

### Forms:
- **würde + Infinitiv**: used for 90% of verbs (*Ich würde kaufen, er würde sagen*).
- Direct forms for core verbs:
  - *haben* → **hätte** (ich hätte, du hättest, er hätte)
  - *sein* → **wäre** (ich wäre, du wärst, er wäre)
  - *können* → **könnte**
  - *müssen* → **müsste**
  - *wissen* → **wüsste**`,
    formulaPattern: 'Wenn + Subjekt + [hätte / wäre / Modal (Ende)] , + würde + Infinitiv (Ende)',
    visualTable: {
      headers: ['Person', 'sein (wäre)', 'haben (hätte)', 'können (könnte)', 'Standard (würde)'],
      rows: [
        ['ich', 'wäre', 'hätte', 'könnte', 'würde + Inf.'],
        ['du', 'wärst', 'hättest', 'könntest', 'würdest + Inf.'],
        ['er / sie / es', 'wäre', 'hätte', 'könnte', 'würde + Inf.'],
        ['wir', 'wären', 'hätten', 'könnten', 'würden + Inf.'],
        ['ihr', 'wärt', 'hättet', 'könntet', 'würdet + Inf.'],
        ['sie / Sie', 'wären', 'hätten', 'könnten', 'würden + Inf.'],
      ]
    },
    tags: ['konjunktiv_ii', 'politeness', 'hypotheticals'],
    drills: [
      {
        id: 'd7-1',
        type: 'cloze',
        prompt: '___ Sie mir bitte das Salz geben? (Höflichkeitsform von können)',
        correctAnswer: 'Könnten',
        options: ['Könnten', 'Können', 'Würden', 'Hätten'],
        explanation: 'Könnten Sie is the polite Konjunktiv II request.',
        grammarTag: 'konjunktiv_ii'
      }
    ]
  }
];

export const SEED_DICTIONARY: Record<string, any> = {
  'geschwindigkeitsbegrenzung': {
    id: 'word-geschwindigkeitsbegrenzung',
    lemma: 'Geschwindigkeitsbegrenzung',
    normalizedLemma: 'geschwindigkeitsbegrenzung',
    pos: 'noun',
    gender: 'die',
    cefrLevel: 'B1',
    ipa: '[ɡəˈʃvɪndɪçkaɪ̯tsbəˌɡʁɛnt͡sʊŋ]',
    meaningEn: 'speed limit',
    secondaryMeanings: ['velocity restriction'],
    register: 'formal / official',
    isCompound: true,
    compoundParts: [
      { part: 'Geschwindigkeit', meaningEn: 'speed, velocity', gender: 'die' },
      { part: 's', meaningEn: 'Fugenelement (linking element)', isFugenelement: true },
      { part: 'Begrenzung', meaningEn: 'limitation, restriction', gender: 'die' }
    ],
    nounTable: {
      nominativ: { sg: 'die Geschwindigkeitsbegrenzung', pl: 'die Geschwindigkeitsbegrenzungen' },
      akkusativ: { sg: 'die Geschwindigkeitsbegrenzung', pl: 'die Geschwindigkeitsbegrenzungen' },
      dativ: { sg: 'der Geschwindigkeitsbegrenzung', pl: 'den Geschwindigkeitsbegrenzungen' },
      genitiv: { sg: 'der Geschwindigkeitsbegrenzung', pl: 'der Geschwindigkeitsbegrenzungen' }
    },
    collocations: ['auf der Autobahn gilt eine Geschwindigkeitsbegrenzung', 'die Geschwindigkeitsbegrenzung überschreiten'],
    idioms: [],
    examples: [
      { de: 'Hier gilt eine Geschwindigkeitsbegrenzung von 50 km/h.', en: 'A speed limit of 50 km/h applies here.' },
      { de: 'Auf vielen Abschnitten der Autobahn gibt es keine Geschwindigkeitsbegrenzung.', en: 'On many sections of the autobahn there is no speed limit.' }
    ]
  },
  'fahren': {
    id: 'word-fahren',
    lemma: 'fahren',
    normalizedLemma: 'fahren',
    pos: 'verb',
    gender: null,
    cefrLevel: 'A1',
    ipa: '[ˈfaːʁən]',
    meaningEn: 'to drive / to ride / to travel by vehicle',
    register: 'standard',
    disambiguation: 'Fahren is strictly by vehicle (car, train, bike); walking on foot is gehen or laufen.',
    verbTable: {
      praesens: { ich: 'fahre', du: 'fährst', er_sie_es: 'fährt', wir: 'fahren', ihr: 'fahrt', sie_Sie: 'fahren' },
      praeteritum: { ich: 'fuhr', du: 'fuhrst', er_sie_es: 'fuhr', wir: 'fuhren', ihr: 'fuhrt', sie_Sie: 'fuhren' },
      perfekt: { auxiliary: 'sein', partizipII: 'gefahren' },
      konjunktivII: { ich: 'führe', er_sie_es: 'führe' },
      imperativ: { du: 'fahr / fahre', ihr: 'fahrt', Sie: 'fahren Sie' },
      governedPreposition: 'mit',
      governedCase: 'dativ'
    },
    collocations: ['mit dem Zug fahren', 'Auto fahren', 'nach Hause fahren'],
    examples: [
      { de: 'Ich fahre jeden Tag mit der U-Bahn zur Arbeit.', en: 'I take the subway to work every day.' },
      { de: 'Bist du schon einmal nach Berlin gefahren?', en: 'Have you ever traveled to Berlin?' }
    ]
  },
  'warten': {
    id: 'word-warten',
    lemma: 'warten',
    normalizedLemma: 'warten',
    pos: 'verb',
    gender: null,
    cefrLevel: 'A1',
    ipa: '[ˈvaʁtn̩]',
    meaningEn: 'to wait',
    register: 'standard',
    verbTable: {
      praesens: { ich: 'warte', du: 'wartest', er_sie_es: 'wartet', wir: 'warten', ihr: 'wartet', sie_Sie: 'warten' },
      praeteritum: { ich: 'wartete', du: 'wartetest', er_sie_es: 'wartete', wir: 'warteten', ihr: 'wartetet', sie_Sie: 'warteten' },
      perfekt: { auxiliary: 'haben', partizipII: 'gewartet' },
      governedPreposition: 'auf',
      governedCase: 'akkusativ'
    },
    collocations: ['warten auf den Bus', 'lange warten'],
    examples: [
      { de: 'Wir warten seit zwanzig Minuten auf den Zug.', en: 'We have been waiting for the train for twenty minutes.' }
    ]
  },
  'schon': {
    id: 'word-schon',
    lemma: 'schon',
    normalizedLemma: 'schon',
    pos: 'adverb',
    cefrLevel: 'A1',
    ipa: '[ʃoːn]',
    meaningEn: 'already / indeed / quite',
    falseFriends: 'Warning: "schon" means already; "schön" (with umlaut) means beautiful!',
    examples: [
      { de: 'Hast du die Hausaufgaben schon gemacht?', en: 'Have you done the homework already?' }
    ]
  },
  'schoen': {
    id: 'word-schoen',
    lemma: 'schön',
    normalizedLemma: 'schoen',
    pos: 'adjective',
    cefrLevel: 'A1',
    ipa: '[ʃøːn]',
    meaningEn: 'beautiful / lovely / nice',
    adjectiveTable: {
      comparative: 'schöner',
      superlative: 'am schönsten',
      strongDeclension: { nomM: 'schöner', nomF: 'schöne', nomN: 'schönes', nomPl: 'schöne', datM: 'schönem' },
      weakDeclension: { nomM: 'schöne', nomF: 'schöne', nomN: 'schöne', nomPl: 'schönen', datM: 'schönen' },
      mixedDeclension: { nomM: 'schöner', nomF: 'schöne', nomN: 'schönes', nomPl: 'schönen', datM: 'schönen' }
    },
    examples: [
      { de: 'Das Wetter in München ist heute sehr schön.', en: 'The weather in Munich is very nice today.' }
    ]
  }
};

export const SEED_STORIES: any[] = [
  {
    id: 'story-1',
    title: 'Ein Morgen in der Bäckerei',
    cefrLevel: 'A1',
    coverEmoji: '🥐',
    paragraphs: [
      {
        textDe: 'Guten Morgen! Herr Müller geht um sieben Uhr morgens in die kleine Bäckerei an der Ecke.',
        textEn: 'Good morning! Mr. Müller goes to the small bakery on the corner at seven in the morning.'
      },
      {
        textDe: '„Ich möchte bitte zwei frische Brötchen und ein knuspriges Croissant“, sagt er freundlich zur Verkäuferin.',
        textEn: '"I would like two fresh bread rolls and a crispy croissant, please," he says politely to the shop assistant.'
      },
      {
        textDe: 'Die Verkäuferin lächelt: „Das macht zusammen drei Euro fünfzig. Zahlen Sie bar oder mit Karte?“',
        textEn: 'The assistant smiles: "That comes to three euros fifty in total. Are you paying cash or with card?"'
      }
    ]
  },
  {
    id: 'story-2',
    title: 'Der Termin beim Bürgeramt',
    cefrLevel: 'B1',
    coverEmoji: '🏛️',
    paragraphs: [
      {
        textDe: 'Die Kursteilnehmerin hat endlich einen Termin beim Bürgeramt in Berlin bekommen, um ihre neue Wohnung anzumelden.',
        textEn: 'The learner finally secured an appointment at the Bürgeramt in Berlin to register her new apartment.'
      },
      {
        textDe: 'Sie hat alle erforderlichen Unterlagen mitgebracht: den Reisepass, den Mietvertrag und die Wohnungsgeberbestätigung des Vermieters.',
        textEn: 'She brought all required documents: her passport, the rental contract, and the landlord\'s confirmation of residence.'
      },
      {
        textDe: 'Der Beamte prüft die Dokumente sorgfältig und druckt die amtliche Meldebestätigung aus.',
        textEn: 'The official verifies the documents carefully and prints out the official registration confirmation.'
      }
    ]
  }
];
