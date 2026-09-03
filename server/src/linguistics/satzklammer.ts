import { TopologicalParseResult } from './types.js';

export const SUBORDINATING_CONJUNCTIONS = new Set([
  'weil', 'dass', 'daß', 'wenn', 'ob', 'obwohl', 'da', 'bevor', 'nachdem',
  'während', 'damit', 'falls', 'indem', 'sodass', 'sofern', 'solange', 'ehe',
  'nachdem', 'seitdem', 'sobald', 'als'
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

  // Check if starts with a subordinate clause: e.g. "Weil es regnet, bleibt er zu Hause"
  if (sentence.includes(',')) {
    const commaSplit = sentence.split(',');
    const firstPart = commaSplit[0].trim();
    const firstPartWords = firstPart.split(/\s+/).filter(Boolean);
    const firstWordClean = firstPartWords[0]?.toLowerCase().replace(/[,.!?]/g, '');

    if (SUBORDINATING_CONJUNCTIONS.has(firstWordClean)) {
      // Subordinate clause occupies Vorfeld of the main sentence
      const rest = commaSplit.slice(1).join(',').trim().replace(/[.!?]+$/, '');
      const restWords = rest.split(/\s+/).filter(Boolean);
      const mainFiniteVerb = restWords[0] || '';
      let rechte = '';
      let mitteWords = restWords.slice(1);

      if (restWords.length > 1) {
        const lastW = restWords[restWords.length - 1].replace(/[,.!?]/g, '');
        const isLowercase = lastW.charAt(0) === lastW.charAt(0).toLowerCase();
        const isPrefix = SEPARABLE_PREFIXES.has(lastW.toLowerCase());
        const isParticipleOrInfinitive = isLowercase && (lastW.startsWith('ge') || lastW.endsWith('en') || lastW.endsWith('t'));
        if (isPrefix || isParticipleOrInfinitive) {
          rechte = lastW;
          mitteWords = restWords.slice(1, restWords.length - 1);
        }
      }

      return {
        vorfeld: firstPart,
        linkeSatzklammer: mainFiniteVerb,
        mittelfeld: mitteWords.join(' '),
        rechteSatzklammer: rechte,
        nachfeld: '',
        isNebensatz: false,
        clauseType: 'HAUPTSATZ_V2',
        finiteVerb: mainFiniteVerb,
        verbFinal: rechte || undefined,
      };
    }
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
  const isQuestion = sentence.trim().endsWith('?');
  const isImperative = sentence.trim().endsWith('!') && /^[A-ZÄÖÜ]/.test(words[0]);

  // V1 Question
  if (isQuestion && !words[0].toLowerCase().startsWith('w')) {
    const finiteVerb = words[0];
    const lastWord = words[words.length - 1].replace(/[?]/g, '');
    const isLastVerb = words.length > 1 && (
      SEPARABLE_PREFIXES.has(lastWord.toLowerCase()) ||
      (lastWord.charAt(0) === lastWord.charAt(0).toLowerCase() && (lastWord.startsWith('ge') || lastWord.endsWith('en') || lastWord.endsWith('t')))
    );
    const mittelfeld = isLastVerb
      ? words.slice(1, words.length - 1).join(' ')
      : words.slice(1).join(' ');
    const rechteSatzklammer = isLastVerb ? lastWord : '';

    return {
      vorfeld: '',
      linkeSatzklammer: finiteVerb,
      mittelfeld,
      rechteSatzklammer,
      nachfeld: '',
      isNebensatz: false,
      clauseType: 'V1_QUESTION',
      finiteVerb,
      verbFinal: rechteSatzklammer || undefined,
    };
  }

  // V1 Imperative
  if (isImperative && words.length <= 5) {
    const finiteVerb = words[0];
    const mittelfeld = words.slice(1).join(' ').replace(/[!]/g, '');
    return {
      vorfeld: '',
      linkeSatzklammer: finiteVerb,
      mittelfeld,
      rechteSatzklammer: '',
      nachfeld: '',
      isNebensatz: false,
      clauseType: 'V1_IMPERATIVE',
      finiteVerb,
    };
  }

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
    clauseType: 'HAUPTSATZ_V2',
    finiteVerb,
    verbFinal: rechteSatzklammer || undefined,
  };
}
