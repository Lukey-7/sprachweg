import React, { useRef, useState } from 'react';
import { BookOpen, Plus, Sparkles, Volume2 } from 'lucide-react';
import { Card, SentenceAnalysis, SentenceToken, User } from '../types';
import { api } from '../services/api';
import { AudioService } from '../services/audio';
import { useMarkBlockDone } from '../services/queries';
import { GermanQuickBar } from '../components/GermanQuickBar';
import { WordOrderMap } from '../components/WordOrderMap';
import { ErrorPanel, MockNotice } from '../components/Feedback';

type NewCard = Parameters<typeof api.addCard>[0];

interface SentenceMinerViewProps {
  user: User;
  onOpenWordLookup: (word: string) => void;
  onAddCard: (card: NewCard) => Promise<Card | null>;
}

const SAMPLES = [
  'Ich fahre heute mit dem Zug nach Berlin, weil ich einen Termin habe.',
  'Die Verkäuferin gibt dem freundlichen Kunden das frische Brot.',
  'Wenn das Wetter morgen schön ist, wandern wir in den Bergen.',
];

/** Replaces the first whole-word occurrence of `token` with a blank. */
export function makeCloze(sentence: string, token: string): string | null {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[^\\p{L}])${escaped}(?=$|[^\\p{L}])`, 'u');
  if (!re.test(sentence)) return null;
  return sentence.replace(re, (_m, before) => `${before}___`);
}

const tokenClass = (t: SentenceToken) => {
  if (t.gender === 'der') return 'text-blue-300 bg-blue-500/10 border-blue-500/40';
  if (t.gender === 'die') return 'text-rose-300 bg-rose-500/10 border-rose-500/40';
  if (t.gender === 'das') return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/40';
  if (t.pos === 'verb') return 'text-amber-300 bg-amber-500/10 border-amber-500/40';
  return 'text-slate-200 border-slate-700';
};

export const SentenceMinerView: React.FC<SentenceMinerViewProps> = ({ user, onOpenWordLookup, onAddCard }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ analysis: SentenceAnalysis; mock: boolean } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<SentenceToken | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const markDone = useMarkBlockDone();

  const analyze = async (text = input) => {
    const sentence = text.trim();
    if (!sentence) return;
    setIsLoading(true);
    setError(null);
    setSelected(null);
    try {
      const { data, mock } = await api.analyzeSentence(sentence, user.activeLevel);
      setResult({ analysis: data, mock });
      if (!mock) markDone(3);
    } catch (e) {
      setResult(null);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const analysis = result?.analysis;
  const cloze = analysis && selected ? makeCloze(analysis.textDe, selected.surfaceToken.replace(/[.,!?;:"„“]/g, '')) : null;

  return (
    <div className="space-y-4 pb-4">
      <section className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3">
        <p className="text-sm text-slate-400">Paste any German sentence to see how it's built.</p>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="z. B. Ich fahre heute mit dem Zug nach Berlin."
          rows={3}
          lang="de"
          autoCapitalize="sentences"
          spellCheck={false}
          className="w-full bg-slate-950 p-3.5 rounded-2xl border border-slate-700 text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
        />
        <GermanQuickBar inputRef={inputRef} />
        <button
          onClick={() => analyze()}
          disabled={isLoading || !input.trim()}
          className="w-full min-h-[52px] rounded-2xl bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-base flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" /> {isLoading ? 'Analyzing…' : 'Analyze'}
        </button>
        {!result && !isLoading && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-500">Or try one:</span>
            {SAMPLES.map(s => (
              <button
                key={s}
                onClick={() => {
                  setInput(s);
                  analyze(s);
                }}
                className="text-left text-sm px-3 py-2.5 rounded-xl bg-slate-800/70 text-slate-300 active:bg-slate-800"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </section>

      {error != null && <ErrorPanel title="Couldn't analyze that sentence" error={error} onRetry={() => analyze()} />}

      {analysis && result && (
        <section className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-4">
          {result.mock && <MockNotice />}

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tap a word</span>
            <button onClick={() => AudioService.playGermanText(analysis.textDe)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-emerald-400 text-sm font-semibold">
              <Volume2 className="w-4 h-4" /> Listen
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-lg font-medium">
            {analysis.tokens.map(t => (
              <button
                key={t.tokenIndex}
                onClick={() => setSelected(t)}
                className={`px-2.5 py-1.5 rounded-xl border-b-2 ${tokenClass(t)} ${selected?.tokenIndex === t.tokenIndex ? 'ring-2 ring-emerald-400' : ''}`}
              >
                {t.surfaceToken}
              </button>
            ))}
          </div>

          {selected && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/30 space-y-3">
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xl font-black text-white">{selected.surfaceToken}</span>
                  {selected.lemma && selected.lemma !== selected.surfaceToken && <span className="text-sm text-slate-400">from {selected.lemma}</span>}
                </div>
                <p className="text-sm text-slate-300 mt-1">
                  {selected.meaningEn && <strong className="text-slate-100">{selected.meaningEn}</strong>}
                  {selected.pos && <span> · {selected.pos}</span>}
                  {selected.gender && <span> · {selected.gender}</span>}
                  {selected.case && <span className="capitalize"> · {selected.case}</span>}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenWordLookup(selected.lemma || selected.surfaceToken)}
                  className="min-h-[44px] rounded-xl bg-slate-800 text-slate-100 text-sm font-bold flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" /> Dictionary
                </button>
                <button
                  disabled={!cloze || result.mock}
                  onClick={() =>
                    cloze &&
                    onAddCard({
                      cardType: 'sentence_cloze',
                      prompt: cloze,
                      answer: selected.surfaceToken.replace(/[.,!?;:"„“]/g, ''),
                      contextSentence: analysis.textDe,
                    })
                  }
                  className="min-h-[44px] rounded-xl bg-emerald-500 disabled:opacity-40 text-slate-950 text-sm font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Cloze card
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
              <div className="text-xs font-bold uppercase text-emerald-400 mb-1">Meaning</div>
              <div className="text-[15px] text-slate-100">{analysis.textEnNatural}</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
              <div className="text-xs font-bold uppercase text-amber-400 mb-1">Word for word</div>
              <div className="text-[15px] text-slate-300 italic">{analysis.textEnLiteral}</div>
            </div>
          </div>

          <WordOrderMap
            pos1={analysis.v2Position1}
            verb2={analysis.v2Verb}
            mittelfeld={analysis.v2Mittelfeld}
            verbFinal={analysis.v2VerbFinal}
            isNebensatz={analysis.isNebensatz}
          />

          {analysis.variations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Variations</h3>
              {analysis.variations.map((v, i) => (
                <div key={i} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-100">{v.de}</div>
                    <div className="text-sm text-slate-400">{v.en}</div>
                    {v.note && <div className="text-xs text-emerald-400/80 mt-1">{v.note}</div>}
                  </div>
                  <button onClick={() => AudioService.playGermanText(v.de)} className="p-2 text-slate-400" aria-label="Listen">
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
