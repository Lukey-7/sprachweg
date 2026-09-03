import { describe, it, expect } from '../harness/testRunner';

describe('Tier 2: Quick-Bar Caret Position & DOM Interaction Boundaries', () => {
  const applyCaretInsert = (currentText: string, char: string, start: number, end: number) => {
    const s = Math.max(0, Math.min(currentText.length, start));
    const e = Math.max(0, Math.min(currentText.length, end));
    const newText = currentText.substring(0, s) + char + currentText.substring(e);
    const newCaret = s + char.length;
    return { newText, newCaret };
  };

  it('should insert character when caret is at index 0 (start of string)', () => {
    const res = applyCaretInsert('pfel', 'Ä', 0, 0);
    expect(res.newText).toBe('Äpfel');
    expect(res.newCaret).toBe(1);
  });

  it('should insert character when caret is at end of string', () => {
    const res = applyCaretInsert('Gro', 'ß', 3, 3);
    expect(res.newText).toBe('Groß');
    expect(res.newCaret).toBe(4);
  });

  it('should insert character into completely empty input field', () => {
    const res = applyCaretInsert('', 'ü', 0, 0);
    expect(res.newText).toBe('ü');
    expect(res.newCaret).toBe(1);
  });

  it('should replace entire highlighted string when selection spans entire input', () => {
    const res = applyCaretInsert('ABCDEF', 'Ö', 0, 6);
    expect(res.newText).toBe('Ö');
    expect(res.newCaret).toBe(1);
  });

  it('should handle multiline textarea with newline characters correctly', () => {
    const multiline = 'Erste Zeile.\nZweite Zeile.';
    const newlineIndex = multiline.indexOf('\n');
    const res = applyCaretInsert(multiline, 'ä', newlineIndex, newlineIndex);
    expect(res.newText).toBe('Erste Zeile.ä\nZweite Zeile.');
  });
}, 'Tier 2');
