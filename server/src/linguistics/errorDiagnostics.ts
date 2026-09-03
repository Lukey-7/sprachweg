import { DiagnosticReport, DiagnosticError } from './types.js';
import { validatePrepositionCase } from './prepositions.js';
import { getAuxiliaryVerb } from './auxiliary.js';

export class ErrorDiagnosticsEngine {
  public static diagnose(input: string, expected: string): DiagnosticReport {
    const errors: DiagnosticError[] = [];
    const inWords = input.trim().split(/\s+/);
    const expWords = expected.trim().split(/\s+/);

    // 1. Auxiliary Selection Error (e.g. "habe gefahren" -> "bin gefahren")
    if (/\b(habe|hast|hat|haben|habt)\s+(gefahren|gegangen|geflogen|gelaufen|geblieben|gestorben|gewachsen|geschwommen|gereist|gewandert|aufgestanden|eingeschlafen)\b/i.test(input)) {
      errors.push({
        code: 'AUXILIARY_SELECTION_ERROR',
        messageEn: 'Incorrect auxiliary verb "haben" used with a verb of motion or state change.',
        messageDe: 'Falsches Hilfsverb "haben" für ein Verb der Orts- oder Zustandsveränderung verwendet.',
        expected: 'sein (bin/bist/ist/sind/seid)',
        actual: 'haben',
        ruleExplanation: 'Verbs indicating change of place (fahren, gehen, fliegen) or change of state take "sein" in the Perfekt tense.',
        grammarTag: 'perfekt_auxiliary_sein',
        severity: 'ERROR',
      });
    }

    // 2. Preposition Case Governance Errors
    if (/\bmit\s+(die|das)\b/i.test(input)) {
      const match = input.match(/\bmit\s+(die|das)\b/i);
      if (match) {
        errors.push({
          code: 'CASE_GOVERNANCE_ERROR',
          messageEn: `Preposition "mit" requires Dativ case, but "${match[0]}" was used.`,
          messageDe: `Die Präposition "mit" verlangt den Dativ, aber "${match[0]}" wurde verwendet.`,
          expected: match[1].toLowerCase() === 'die' ? 'mit der' : 'mit dem',
          actual: match[0],
          ruleExplanation: '"mit" is strictly a Dativ preposition (aus, bei, mit, nach, seit, von, zu, gegenüber).',
          grammarTag: 'preposition_dative_mit',
          severity: 'ERROR',
        });
      }
    }
    if (/\b(ohne|durch|für|gegen|um)\s+(dem|der|einem|einer)\b/i.test(input)) {
      const match = input.match(/\b(ohne|durch|für|gegen|um)\s+(dem|der|einem|einer)\b/i);
      if (match) {
        errors.push({
          code: 'CASE_GOVERNANCE_ERROR',
          messageEn: `Preposition "${match[1]}" requires Akkusativ case, but Dativ form "${match[2]}" was used.`,
          messageDe: `Die Präposition "${match[1]}" verlangt den Akkusativ, aber Dativ "${match[2]}" wurde verwendet.`,
          expected: `${match[1]} (Akkusativ)`,
          actual: match[0],
          ruleExplanation: 'Accusative prepositions (durch, für, gegen, ohne, um) strictly govern Akkusativ.',
          grammarTag: 'preposition_accusative',
          severity: 'ERROR',
        });
      }
    }

    // 3. Subordinate Word Order (e.g. "weil ich will gehen" -> "weil ich gehen will")
    if (/\b(weil|dass|wenn|obwohl|ob|da)\s+[^,.]+\b(will|kann|muss|soll|darf|hat|ist|habe|bin)\s+([a-zäöüß]+en|[a-zäöüß]+t)\b/i.test(input)) {
      const match = input.match(/\b(weil|dass|wenn|obwohl|ob|da)\s+[^,.]+\b(will|kann|muss|soll|darf|hat|ist|habe|bin)\s+([a-zäöüß]+en|[a-zäöüß]+t)\b/i);
      errors.push({
        code: 'NEBENSATZ_VERB_FINAL_VIOLATION',
        messageEn: 'Finite verb must be placed at the very end of subordinate clauses introduced by "weil/dass/wenn".',
        messageDe: 'Das finite Verb muss im Nebensatz an letzter Stelle stehen.',
        expected: match ? `... ${match[3]} ${match[2]}` : 'Verb at end of clause',
        actual: match ? `... ${match[2]} ${match[3]}` : 'Verb before non-finite predicate',
        ruleExplanation: 'In Nebensätzen with modal or auxiliary verbs, the finite conjugated verb occupies the final position at the end of the clause.',
        grammarTag: 'word_order_nebensatz',
        severity: 'ERROR',
      });
    }

    // 4. V2 Word Order Violation (e.g. "Heute ich kaufe" -> "Heute kaufe ich")
    if (/^(Heute|Morgen|Gestern|Jetzt|Dann|Danach|Hier|Dort)\s+([A-Za-zäöüÄÖÜß]+)\s+([a-zäöüß]+(t|st|en|e))\b/i.test(input)) {
      const match = input.match(/^(Heute|Morgen|Gestern|Jetzt|Dann|Danach|Hier|Dort)\s+([A-Za-zäöüÄÖÜß]+)\s+([a-zäöüß]+(t|st|en|e))\b/i);
      if (match && !['ist', 'hat', 'wird', 'kann', 'muss', 'soll', 'darf', 'will'].includes(match[2].toLowerCase())) {
        errors.push({
          code: 'V2_WORD_ORDER_VIOLATION',
          messageEn: `V2 Word Order Violation: When adverb "${match[1]}" is in Vorfeld (Position 1), the finite verb must immediately follow in Position 2.`,
          messageDe: `V2-Stellungsfehler: Wenn das Adverb "${match[1]}" im Vorfeld steht, muss das finite Verb an Position 2 folgen.`,
          expected: `${match[1]} ${match[3]} ${match[2]}`,
          actual: `${match[1]} ${match[2]} ${match[3]}`,
          ruleExplanation: 'In German main clauses (Hauptsätze), the finite verb must occupy Position 2 (V2 rule).',
          grammarTag: 'v2_word_order',
          severity: 'ERROR',
        });
      }
    }

    // 5. Capitalization for German Nouns
    for (let i = 0; i < inWords.length; i++) {
      const iw = inWords[i]?.replace(/[,.!?]/g, '');
      const ew = expWords[i]?.replace(/[,.!?]/g, '');
      if (iw && ew && /^[A-ZÄÖÜ]/.test(ew) && /^[a-zäöü]/.test(iw) && iw.toLowerCase() === ew.toLowerCase()) {
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

    // 6. Umlaut Spelling Errors (e.g. "mussen" -> "müssen", "apfel" -> "Apfel / Äpfel")
    for (let i = 0; i < inWords.length; i++) {
      const iw = inWords[i]?.replace(/[,.!?]/g, '').toLowerCase();
      const ew = expWords[i]?.replace(/[,.!?]/g, '').toLowerCase();
      if (iw && ew && iw !== ew) {
        const hasUmlautExpected = /[äöü]/.test(ew);
        const hasUmlautInput = /[äöü]/.test(iw);
        if (hasUmlautExpected && !hasUmlautInput) {
          const simpleRepl = iw.replace(/a/g, 'ä').replace(/o/g, 'ö').replace(/u/g, 'ü');
          if (simpleRepl === ew || iw.replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü') === ew) {
            errors.push({
              code: 'UMLAUT_SPELLING_ERROR',
              messageEn: `Missing umlaut in "${inWords[i]}". Expected "${expWords[i]}".`,
              messageDe: `Fehlender Umlaut in "${inWords[i]}". Erwartet: "${expWords[i]}".`,
              expected: expWords[i],
              actual: inWords[i],
              ruleExplanation: 'German umlauts (ä, ö, ü) change the pronunciation and grammatical meaning of words.',
              grammarTag: 'umlaut_spelling',
              severity: 'ERROR',
            });
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions: errors.map(e => e.ruleExplanation),
    };
  }
}
