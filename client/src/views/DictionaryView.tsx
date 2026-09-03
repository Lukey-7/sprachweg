import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Search, Volume2, Plus, Check, AlertTriangle, Layers, Sparkles } from 'lucide-react';
import { WordEntry } from '../types';
import { ApiService } from '../services/api';
import { AudioService } from '../services/audio';
import { GermanQuickBar } from '../components/GermanQuickBar';

interface DictionaryViewProps {
  initialQuery?: string;
  onAddCard: (word: WordEntry) => void;
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({ initialQuery = '', onAddCard }) => {
  const [query, setQuery] = useState(initialQuery);
  const [word, setWord] = useState<WordEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    } else {
      handleSearch('geschwindigkeitsbegrenzung');
    }
  }, [initialQuery]);

  const handleSearch = async (searchTerm?: string) => {
    const q = (searchTerm || query).trim();
    if (!q) return;
    setIsLoading(true);
    try {
      const result = await ApiService.lookupWord(q);
      setWord(result);
      AudioService.playFeedbackSound('click');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    if (!word) return;
    onAddCard(word);
    setAdded(true);
    AudioService.playFeedbackSound('correct');
    setTimeout(() => setAdded(false), 2500);
  };

  const quickSearches = [
    { label: 'Geschwindigkeitsbegrenzung', q: 'geschwindigkeitsbegrenzung' },
    { label: 'fahren (Verb)', q: 'fahren' },
    { label: 'warten auf (Preposition)', q: 'warten' },
    { label: 'schoen (Missing umlaut)', q: 'schoen' },
    { label: 'schon (False friend)', q: 'schon' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Search Header */}
      <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">German Reference Dictionary</h1>
            <p className="text-xs text-slate-400">Full morphological reference with search tolerance & compound splitting</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search German or English word (e.g. 'schoen', 'fahren', 'speed limit')..."
              className="w-full bg-slate-950 py-3.5 pl-11 pr-24 rounded-2xl border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <Search className="w-5 h-5 text-slate-500 absolute left-3.5 pointer-events-none" />
            <button
              onClick={() => handleSearch()}
              disabled={isLoading || !query.trim()}
              className="absolute right-2 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all shadow"
            >
              {isLoading ? 'Searching...' : 'Lookup'}
            </button>
          </div>

          <GermanQuickBar inputRef={inputRef} />

          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {quickSearches.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(item.q);
                  handleSearch(item.q);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dictionary Card Display */}
      {word && (
        <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6 animate-in slide-in-from-bottom-3 duration-300">
          {/* Top Word Summary */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="text-2xl sm:text-3xl font-black text-white">{word.lemma}</h2>
                <button
                  onClick={() => AudioService.playGermanText(word.lemma)}
                  className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                  title="Play pronunciation"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                {word.gender === 'der' && <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">der (Maskulin)</span>}
                {word.gender === 'die' && <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30">die (Feminin)</span>}
                {word.gender === 'das' && <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">das (Neutral)</span>}
                <span className="px-2.5 py-0.5 rounded-full font-medium text-xs bg-slate-800 text-slate-300 capitalize">{word.pos}</span>
                {word.ipa && <span className="text-xs font-mono text-slate-400">{word.ipa}</span>}
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/20">CEFR {word.cefrLevel}</span>
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={added}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow ${
                added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {added ? 'Added to FSRS!' : 'Add to Deck'}
            </button>
          </div>

          {/* Meaning & Usage Notes */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">English Definition</div>
            <div className="text-lg font-bold text-slate-100">{word.meaningEn}</div>
            {word.secondaryMeanings && word.secondaryMeanings.length > 0 && (
              <div className="text-xs text-slate-400">Also: {word.secondaryMeanings.join(', ')}</div>
            )}
            {word.disambiguation && (
              <div className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                💡 <span className="font-semibold">Semantic distinction:</span> {word.disambiguation}
              </div>
            )}
            {word.falseFriends && (
              <div className="text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{word.falseFriends}</span>
              </div>
            )}
          </div>

          {/* Morphological Decompounding */}
          {word.compoundParts && word.compoundParts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                Compound Decomposition
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {word.compoundParts.map((p, i) => (
                  <div key={i} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="font-bold text-slate-100 text-sm">{p.part}</div>
                    <div className="text-xs text-slate-400">{p.meaningEn}</div>
                    {p.gender && <div className="text-[10px] text-blue-400 font-semibold mt-1">Gender: {p.gender}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Declension Table for Nouns */}
          {word.nounTable && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">4-Case Noun Declension Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse rounded-xl overflow-hidden bg-slate-950/60 border border-slate-800">
                  <thead>
                    <tr className="bg-slate-800/60 text-slate-400">
                      <th className="p-2.5 text-left">Case</th>
                      <th className="p-2.5 text-left">Singular</th>
                      <th className="p-2.5 text-left">Plural</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="p-2.5 font-semibold text-blue-400">Nominativ</td>
                      <td className="p-2.5 font-medium">{word.nounTable.nominativ.sg}</td>
                      <td className="p-2.5">{word.nounTable.nominativ.pl}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-emerald-400">Akkusativ</td>
                      <td className="p-2.5 font-medium">{word.nounTable.akkusativ.sg}</td>
                      <td className="p-2.5">{word.nounTable.akkusativ.pl}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-amber-400">Dativ</td>
                      <td className="p-2.5 font-medium">{word.nounTable.dativ.sg}</td>
                      <td className="p-2.5">{word.nounTable.dativ.pl}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-purple-400">Genitiv</td>
                      <td className="p-2.5 font-medium">{word.nounTable.genitiv.sg}</td>
                      <td className="p-2.5">{word.nounTable.genitiv.pl}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Verb Conjugation Table */}
          {word.verbTable && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Conjugation & Government</h3>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-wrap gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Auxiliary:</span>{' '}
                  <strong className="text-emerald-400 uppercase">{word.verbTable.perfekt.auxiliary}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Partizip II:</span>{' '}
                  <strong className="text-slate-100">{word.verbTable.perfekt.partizipII}</strong>
                </div>
                {word.verbTable.governedPreposition && (
                  <div>
                    <span className="text-slate-400">Fixed Preposition:</span>{' '}
                    <strong className="text-amber-400">{word.verbTable.governedPreposition} + {word.verbTable.governedCase}</strong>
                  </div>
                )}
              </div>

              <table className="w-full text-xs border-collapse rounded-xl overflow-hidden bg-slate-950/60 border border-slate-800">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-400">
                    <th className="p-2 text-left">Person</th>
                    <th className="p-2 text-left">Präsens</th>
                    <th className="p-2 text-left">Präteritum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-2 font-semibold text-slate-400">ich</td>
                    <td className="p-2">{word.verbTable.praesens.ich}</td>
                    <td className="p-2">{word.verbTable.praeteritum.ich}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold text-slate-400">du</td>
                    <td className="p-2 font-medium text-emerald-400">{word.verbTable.praesens.du}</td>
                    <td className="p-2">{word.verbTable.praeteritum.du}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold text-slate-400">er / sie / es</td>
                    <td className="p-2 font-medium text-emerald-400">{word.verbTable.praesens.er_sie_es}</td>
                    <td className="p-2">{word.verbTable.praeteritum.er_sie_es}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold text-slate-400">wir</td>
                    <td className="p-2">{word.verbTable.praesens.wir}</td>
                    <td className="p-2">{word.verbTable.praeteritum.wir}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Example Sentences */}
          {word.examples && word.examples.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contextual Examples</h3>
              <div className="space-y-2">
                {word.examples.map((ex, i) => (
                  <div key={i} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-200 text-sm">{ex.de}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{ex.en}</div>
                    </div>
                    <button
                      onClick={() => AudioService.playGermanText(ex.de)}
                      className="text-slate-400 hover:text-emerald-400 p-1"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
