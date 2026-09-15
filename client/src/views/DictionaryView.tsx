import React, { useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { WordEntry } from '../types';
import { api } from '../services/api';
import { GermanQuickBar } from '../components/GermanQuickBar';
import { ErrorPanel, MockNotice } from '../components/Feedback';
import { WordBody, WordHeader } from '../components/WordDetail';

interface DictionaryViewProps {
  onAddCard: (word: WordEntry) => void;
  aiIsMock: boolean;
}

const SUGGESTIONS = ['Geschwindigkeitsbegrenzung', 'fahren', 'warten', 'schön', 'schon'];

type State =
  | { kind: 'idle' }
  | { kind: 'loading'; query: string }
  | { kind: 'found'; word: WordEntry; mock: boolean }
  | { kind: 'missing'; query: string }
  | { kind: 'error'; query: string; error: unknown };

export const DictionaryView: React.FC<DictionaryViewProps> = ({ onAddCard, aiIsMock }) => {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  const search = async (term = query) => {
    const q = term.trim();
    if (!q) return;
    inputRef.current?.blur();
    setState({ kind: 'loading', query: q });
    try {
      const result = await api.lookupWord(q);
      setState(result ? { kind: 'found', word: result.data, mock: result.mock } : { kind: 'missing', query: q });
    } catch (error) {
      setState({ kind: 'error', query: q, error });
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <form
        onSubmit={e => {
          e.preventDefault();
          search();
        }}
        className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3"
      >
        <div className="relative">
          <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Look up a German word"
            lang="de"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full bg-slate-950 py-3.5 pl-11 pr-3 rounded-2xl border border-slate-700 text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <GermanQuickBar inputRef={inputRef} />
        <button
          type="submit"
          disabled={state.kind === 'loading' || !query.trim()}
          className="w-full min-h-[52px] rounded-2xl bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-base"
        >
          {state.kind === 'loading' ? 'Looking up…' : 'Look up'}
        </button>
        {state.kind === 'idle' && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map(s => (
              <button
                type="button"
                key={s}
                onClick={() => {
                  setQuery(s);
                  search(s);
                }}
                className="text-sm px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </form>

      {state.kind === 'missing' && (
        <p className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-300">
          No entry for “{state.query}”.{aiIsMock && ' The AI is in mock mode, so only words already in the dictionary can be found.'}
        </p>
      )}

      {state.kind === 'error' && <ErrorPanel title={`Couldn't look up “${state.query}”`} error={state.error} onRetry={() => search(state.query)} />}

      {state.kind === 'found' && (
        <article className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-5">
          {state.mock && <MockNotice />}
          <WordHeader word={state.word} />
          <button
            onClick={() => onAddCard(state.word)}
            disabled={state.mock}
            className="w-full min-h-[48px] rounded-2xl bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add to review deck
          </button>
          <WordBody word={state.word} />
        </article>
      )}
    </div>
  );
};
