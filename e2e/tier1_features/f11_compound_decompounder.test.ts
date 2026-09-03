import { describe, it, expect } from '../harness/testRunner';
import { DecompounderOracle } from '../harness/referenceOracles';

describe('Feature 11: German Compound Decompounder Verification', () => {
  it('should split classic German compound with linking Fugenelement (Geschwindigkeitsbegrenzung -> Geschwindigkeit + s + Begrenzung)', () => {
    const result = DecompounderOracle.decompound('Geschwindigkeitsbegrenzung');
    expect(result.elements).toHaveLength(2);
    expect(result.elements[0].word).toBe('Geschwindigkeit');
    expect(result.elements[1].word).toBe('Begrenzung');
    expect(result.fugenElements).toContain('s');
    expect(result.headWord).toBe('Begrenzung');
    expect(result.gender).toBe('die');
  });

  it('should split 3-level hierarchical compound (Haustürschlüssel -> Haus + Tür + Schlüssel)', () => {
    const result = DecompounderOracle.decompound('Haustürschlüssel');
    expect(result.elements).toHaveLength(3);
    expect(result.elements[0].word).toBe('Haus');
    expect(result.elements[1].word).toBe('Tür');
    expect(result.elements[2].word).toBe('Schlüssel');
    expect(result.headWord).toBe('Schlüssel');
    expect(result.gender).toBe('der'); // Inherits gender of the last element 'der Schlüssel'
  });

  it('should correctly assign the grammatical gender of the rightmost head noun', () => {
    // Apfel (der) + Baum (der) -> der Apfelbaum
    const apfelbaum = DecompounderOracle.decompound('Apfelbaum');
    expect(apfelbaum.gender).toBe('der');

    // Kinder (die) + Garten (der) -> der Kindergarten
    const kindergarten = DecompounderOracle.decompound('Kindergarten');
    expect(kindergarten.gender).toBe('der');
  });

  it('should handle single / atomic words gracefully returning base identity', () => {
    const atomic = DecompounderOracle.decompound('Buch');
    expect(atomic.elements).toHaveLength(1);
    expect(atomic.elements[0].word).toBe('Buch');
    expect(atomic.headWord).toBe('Buch');
  });

  it('should provide individual translations for all identified morphological sub-elements', () => {
    const result = DecompounderOracle.decompound('Geschwindigkeitsbegrenzung');
    expect(result.elements[0].translation).toBe('speed');
    expect(result.elements[1].translation).toBe('limit');
  });
}, 'Tier 1');
