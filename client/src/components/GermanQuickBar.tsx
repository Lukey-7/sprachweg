import React from 'react';

interface GermanQuickBarProps {
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  onInsertChar?: (char: string) => void;
  className?: string;
}

export const GermanQuickBar: React.FC<GermanQuickBarProps> = ({ inputRef, onInsertChar, className = '' }) => {
  const chars = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];

  const handleInsert = (char: string) => {
    if (onInsertChar) {
      onInsertChar(char);
      return;
    }

    if (inputRef && inputRef.current) {
      const el = inputRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const val = el.value;

      el.value = val.substring(0, start) + char + val.substring(end);
      el.selectionStart = el.selectionEnd = start + char.length;
      el.focus();

      // Trigger standard React change event
      const event = new Event('input', { bubbles: true });
      el.dispatchEvent(event);
    }
  };

  return (
    <div className={`flex items-center gap-1.5 py-1.5 px-2 bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700/60 shadow-inner overflow-x-auto ${className}`}>
      <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 select-none">DE:</span>
      {chars.map((char) => (
        <button
          key={char}
          type="button"
          onClick={() => handleInsert(char)}
          className="w-8 h-8 rounded-lg bg-slate-700/80 hover:bg-emerald-600 hover:text-white active:scale-90 transition-all font-semibold text-sm text-slate-100 flex items-center justify-center border border-slate-600/50 shadow-sm"
        >
          {char}
        </button>
      ))}
    </div>
  );
};
