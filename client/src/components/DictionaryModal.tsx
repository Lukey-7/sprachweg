import React, { useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { WordEntry } from '../types';
import { MockNotice } from './Feedback';
import { WordBody, WordHeader } from './WordDetail';

interface DictionaryModalProps {
  word: WordEntry | null;
  isMock: boolean;
  onClose: () => void;
  onAddCard: (word: WordEntry) => void;
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({ word, isMock, onClose, onAddCard }) => {
  useEffect(() => {
    if (!word) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [word, onClose]);

  if (!word) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={word.lemma}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-2">
          <WordHeader word={word} />
          <button onClick={onClose} className="p-2.5 rounded-xl text-slate-400 active:bg-slate-800 shrink-0" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {isMock && <MockNotice />}
          <WordBody word={word} />
        </div>

        <div className="p-4 border-t border-slate-800 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={() => onAddCard(word)}
            disabled={isMock}
            className="w-full min-h-[52px] rounded-2xl bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-base flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add to review deck
          </button>
        </div>
      </div>
    </div>
  );
};
