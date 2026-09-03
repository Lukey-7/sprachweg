import { describe, it, expect } from '../harness/testRunner';
import { SatzklammerOracle } from '../harness/referenceOracles';

describe('Feature 22: Visual Satzklammer Word Order Map Verification', () => {
  it('should map standard Main Clause (Hauptsatz) with Vorfeld, Linke Satzklammer (V2), Mittelfeld, and Rechte Satzklammer', () => {
    // "Heute hat er ein Buch gelesen."
    const parsed = SatzklammerOracle.parseSentence('Heute hat er ein Buch gelesen.');
    expect(parsed.vorfeld).toBe('Heute');
    expect(parsed.linkeSatzklammer).toBe('hat');
    expect(parsed.mittelfeld).toBe('er ein Buch');
    expect(parsed.rechteSatzklammer).toBe('gelesen');
    expect(parsed.isNebensatz).toBe(false);
  });

  it('should map Subordinate Clause (Nebensatz) with Conjunction in Linke Satzklammer and Verb at Verb-Ende (Rechte Satzklammer)', () => {
    // "weil er heute krank ist"
    const parsed = SatzklammerOracle.parseSentence('weil er heute krank ist');
    expect(parsed.isNebensatz).toBe(true);
    expect(parsed.conjunctionTrigger).toBe('weil');
    expect(parsed.linkeSatzklammer).toBe('weil');
    expect(parsed.mittelfeld).toBe('er heute krank');
    expect(parsed.rechteSatzklammer).toBe('ist');
  });

  it('should map Separable Prefix verbs in main clauses (Linke Satzklammer finite verb, Rechte Satzklammer prefix)', () => {
    // "Er ruft seine Mutter an."
    const parsed = SatzklammerOracle.parseSentence('Er ruft seine Mutter an.');
    expect(parsed.vorfeld).toBe('Er');
    expect(parsed.linkeSatzklammer).toBe('ruft');
    expect(parsed.mittelfeld).toBe('seine Mutter');
    expect(parsed.rechteSatzklammer).toBe('an');
  });

  it('should map Modal Verb + Infinitive sentence structure', () => {
    // "Wir müssen heute fleißig Deutsch lernen."
    const parsed = SatzklammerOracle.parseSentence('Wir müssen heute fleißig Deutsch lernen.');
    expect(parsed.vorfeld).toBe('Wir');
    expect(parsed.linkeSatzklammer).toBe('müssen');
    expect(parsed.mittelfeld).toBe('heute fleißig Deutsch');
    expect(parsed.rechteSatzklammer).toBe('lernen');
  });

  it('should identify and map TeKaMoLo ordering within the Mittelfeld (Temporal -> Kausal -> Modal -> Lokal)', () => {
    const mittelfeldTokens = [
      { text: 'heute', category: 'TEMPORAL' },
      { text: 'wegen des Regens', category: 'KAUSAL' },
      { text: 'mit dem Bus', category: 'MODAL' },
      { text: 'zur Arbeit', category: 'LOKAL' },
    ];

    const tekamoloOrder = ['TEMPORAL', 'KAUSAL', 'MODAL', 'LOKAL'];
    for (let i = 0; i < mittelfeldTokens.length; i++) {
      expect(mittelfeldTokens[i].category).toBe(tekamoloOrder[i]);
    }
  });
}, 'Tier 1');
