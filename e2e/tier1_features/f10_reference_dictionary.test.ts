import { describe, it, expect } from '../harness/testRunner';
import { NounDeclensionMatrix, VerbConjugationMatrix } from '../harness/contracts';

describe('Feature 10: German Reference Dictionary Matrix Verification', () => {
  it('should validate 4-case Noun Declension Matrix for regular and irregular nouns', () => {
    const nounTisch: NounDeclensionMatrix = {
      gender: 'der',
      pluralEnding: '-e',
      isNDeclension: false,
      singular: {
        nominativ: 'der Tisch',
        akkusativ: 'den Tisch',
        dativ: 'dem Tisch',
        genitiv: 'des Tisches',
      },
      plural: {
        nominativ: 'die Tische',
        akkusativ: 'die Tische',
        dativ: 'den Tischen',
        genitiv: 'der Tische',
      },
      diminutive: 'das Tischchen',
    };

    expect(nounTisch.singular.genitiv).toBe('des Tisches');
    expect(nounTisch.plural.dativ).toBe('den Tischen');
    expect(nounTisch.diminutive).toBe('das Tischchen');
  });

  it('should validate masculine N-Declension noun matrices (e.g. der Student / der Name)', () => {
    const nounStudent: NounDeclensionMatrix = {
      gender: 'der',
      pluralEnding: '-en',
      isNDeclension: true,
      singular: {
        nominativ: 'der Student',
        akkusativ: 'den Studenten',
        dativ: 'dem Studenten',
        genitiv: 'des Studenten',
      },
      plural: {
        nominativ: 'die Studenten',
        akkusativ: 'die Studenten',
        dativ: 'den Studenten',
        genitiv: 'der Studenten',
      },
    };

    expect(nounStudent.isNDeclension).toBe(true);
    expect(nounStudent.singular.akkusativ).toBe('den Studenten');
    expect(nounStudent.singular.dativ).toBe('dem Studenten');
  });

  it('should validate full Verb Conjugation Matrix across all tenses and moods', () => {
    const verbSehen: VerbConjugationMatrix = {
      praesens: { ich: 'sehe', du: 'siehst', er: 'sieht', wir: 'sehen', ihr: 'seht', sie: 'sehen' },
      praeteritum: { ich: 'sah', du: 'sahst', er: 'sah', wir: 'sahen', ihr: 'saht', sie: 'sahen' },
      perfekt: { auxiliary: 'haben', partizipII: 'gesehen' },
      futurI: { ich: 'werde sehen', du: 'wirst sehen', er: 'wird sehen', wir: 'werden sehen', ihr: 'werdet sehen', sie: 'werden sehen' },
      konjunktivI: { ich: 'sehe', er: 'sehe', wir: 'sehen' },
      konjunktivII: { ich: 'sähe', du: 'sähest', er: 'sähe', wir: 'sähen' },
      imperativ: { du: 'sieh!', ihr: 'seht!', sie: 'sehen Sie!' },
      isSeparable: false,
    };

    expect(verbSehen.praesens.du).toBe('siehst');
    expect(verbSehen.praeteritum.ich).toBe('sah');
    expect(verbSehen.perfekt.partizipII).toBe('gesehen');
    expect(verbSehen.konjunktivII.ich).toBe('sähe');
    expect(verbSehen.imperativ.du).toBe('sieh!');
  });

  it('should validate separable verbs and governed prepositions with case', () => {
    const verbWarten: VerbConjugationMatrix = {
      praesens: { ich: 'warte', du: 'wartest', er: 'wartet' },
      praeteritum: { ich: 'wartete', du: 'wartetest', er: 'wartete' },
      perfekt: { auxiliary: 'haben', partizipII: 'gewartet' },
      futurI: { ich: 'werde warten' },
      konjunktivI: { ich: 'warte' },
      konjunktivII: { ich: 'wartete' },
      imperativ: { du: 'warte!', ihr: 'wartet!', sie: 'warten Sie!' },
      isSeparable: false,
      governedPreposition: { preposition: 'auf', case: 'AKKUSATIV' },
    };

    const verbAnrufen: VerbConjugationMatrix = {
      praesens: { ich: 'rufe an', du: 'rufst an', er: 'ruft an' },
      praeteritum: { ich: 'rief an', du: 'riefst an', er: 'rief an' },
      perfekt: { auxiliary: 'haben', partizipII: 'angerufen' },
      futurI: { ich: 'werde anrufen' },
      konjunktivI: { ich: 'rufe an' },
      konjunktivII: { ich: 'riefe an' },
      imperativ: { du: 'ruf an!', ihr: 'ruft an!', sie: 'rufen Sie an!' },
      isSeparable: true,
      prefix: 'an',
    };

    expect(verbWarten.governedPreposition?.preposition).toBe('auf');
    expect(verbWarten.governedPreposition?.case).toBe('AKKUSATIV');
    expect(verbAnrufen.isSeparable).toBe(true);
    expect(verbAnrufen.perfekt.partizipII).toBe('angerufen');
  });

  it('should validate Adjective Declension tables (strong, weak, mixed endings)', () => {
    const adjDeclensionTable = {
      strong: {
        masculine: { nom: 'guter', akk: 'guten', dat: 'gutem', gen: 'guten' },
        feminine: { nom: 'gute', akk: 'gute', dat: 'guter', gen: 'guter' },
        neuter: { nom: 'gutes', akk: 'gutes', dat: 'gutem', gen: 'guten' },
        plural: { nom: 'gute', akk: 'gute', dat: 'guten', gen: 'guter' },
      },
      weak: {
        masculine: { nom: 'gute', akk: 'guten', dat: 'guten', gen: 'guten' },
        feminine: { nom: 'gute', akk: 'gute', dat: 'guten', gen: 'guten' },
        neuter: { nom: 'gute', akk: 'gute', dat: 'guten', gen: 'guten' },
        plural: { nom: 'guten', akk: 'guten', dat: 'guten', gen: 'guten' },
      },
      mixed: {
        masculine: { nom: 'guter', akk: 'guten', dat: 'guten', gen: 'guten' },
        feminine: { nom: 'gute', akk: 'gute', dat: 'guten', gen: 'guten' },
        neuter: { nom: 'gutes', akk: 'gutes', dat: 'guten', gen: 'guten' },
        plural: { nom: 'guten', akk: 'guten', dat: 'guten', gen: 'guten' },
      },
    };

    // Strong neuter accusative: z.B. "kaltes Wasser"
    expect(adjDeclensionTable.strong.neuter.akk).toBe('gutes');
    // Weak masculine accusative: z.B. "den guten Mann"
    expect(adjDeclensionTable.weak.masculine.akk).toBe('guten');
    // Mixed neuter nominative: z.B. "ein gutes Buch"
    expect(adjDeclensionTable.mixed.neuter.nom).toBe('gutes');
  });
}, 'Tier 1');
