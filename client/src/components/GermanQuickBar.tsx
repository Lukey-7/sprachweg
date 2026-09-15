import React from 'react';

interface GermanQuickBarProps {
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  onInsertChar?: (char: string) => void;
  className?: string;
}

const CHARS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];

/** Inserts text at the caret of a React-controlled input so its onChange fires. */
function insertAtCaret(el: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const next = el.value.slice(0, start) + text + el.value.slice(end);
  // React tracks the value via the prototype setter; assigning el.value directly
  // is ignored and gets overwritten on the next render.
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, next);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.setSelectionRange(start + text.length, start + text.length);
}

export const GermanQuickBar: React.FC<GermanQuickBarProps> = ({ inputRef, onInsertChar, className = '' }) => (
  <div className={`flex items-center gap-1.5 overflow-x-auto ${className}`}>
    {CHARS.map(char => (
      <button
        key={char}
        type="button"
        // Keep focus (and the mobile keyboard) on the input.
        onPointerDown={e => e.preventDefault()}
        onClick={() => {
          if (onInsertChar) onInsertChar(char);
          else if (inputRef?.current) {
            inputRef.current.focus();
            insertAtCaret(inputRef.current, char);
          }
        }}
        className="shrink-0 w-11 h-11 rounded-xl bg-slate-800 active:bg-emerald-600 font-semibold text-lg text-slate-100 border border-slate-700"
        aria-label={`Insert ${char}`}
      >
        {char}
      </button>
    ))}
  </div>
);
