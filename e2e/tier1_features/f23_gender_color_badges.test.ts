import { describe, it, expect } from '../harness/testRunner';
import { GENDER_COLORS, Gender } from '../harness/contracts';

describe('Feature 23: Universal Gender Color Badges Verification', () => {
  it('should verify der (masculine) maps strictly to blue (#2563eb)', () => {
    expect(GENDER_COLORS.der).toBe('#2563eb');
  });

  it('should verify die (feminine) maps strictly to red (#dc2626)', () => {
    expect(GENDER_COLORS.die).toBe('#dc2626');
  });

  it('should verify das (neuter) maps strictly to green (#16a34a)', () => {
    expect(GENDER_COLORS.das).toBe('#16a34a');
  });

  it('should verify die Plural maps strictly to purple (#9333ea)', () => {
    expect(GENDER_COLORS.diePlural).toBe('#9333ea');
  });

  it('should assign correct CSS classes and badge styling for words based on gender and number', () => {
    const getBadgeStyle = (gender?: Gender, isPlural: boolean = false) => {
      if (isPlural) return { color: GENDER_COLORS.diePlural, label: 'die (Pl.)', bgClass: 'bg-purple-100 text-purple-800' };
      if (gender === 'der') return { color: GENDER_COLORS.der, label: 'der (mask.)', bgClass: 'bg-blue-100 text-blue-800' };
      if (gender === 'die') return { color: GENDER_COLORS.die, label: 'die (fem.)', bgClass: 'bg-red-100 text-red-800' };
      if (gender === 'das') return { color: GENDER_COLORS.das, label: 'das (neut.)', bgClass: 'bg-green-100 text-green-800' };
      return { color: '#64748b', label: 'none', bgClass: 'bg-slate-100 text-slate-800' };
    };

    const derTisch = getBadgeStyle('der', false);
    expect(derTisch.color).toBe('#2563eb');

    const dieFrau = getBadgeStyle('die', false);
    expect(dieFrau.color).toBe('#dc2626');

    const dasKind = getBadgeStyle('das', false);
    expect(dasKind.color).toBe('#16a34a');

    const dieKinder = getBadgeStyle('die', true);
    expect(dieKinder.color).toBe('#9333ea');
  });
}, 'Tier 1');
