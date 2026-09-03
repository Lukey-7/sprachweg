import React, { useState } from 'react';
import { X, Volume2, Plus, Check, Sparkles, AlertTriangle, Layers, BookOpen } from 'lucide-react';
import { WordEntry } from '../types';
import { AudioService } from '../services/audio';

interface DictionaryModalProps {
  word: WordEntry | null;
  onClose: () => void;
  onAddCard: (word: WordEntry) => void;
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({ word, onClose, onAddCard }) => {
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'compounds'>('overview');

  if (!word) return null;

  const handlePlayAudio = () => {
    AudioService.playGermanText(word.lemma);
  };

  const handleAdd = () => {
    onAddCard(word);
    setAdded(true);
    AudioService.playFeedbackSound('correct');
    setTimeout(() => setAdded(false), 2500);
  };

  const getGenderBadge = () => {
    if (word.gender === 'der') return <span className="px-2 py-0.5 rounded-full font-bold text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">der (Maskulin)</span>;
    if (word.gender === 'die') return <span className="px-2 py-0.5 rounded-full font-bold text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30">die (Feminin)</span>;
    if (word.gender === 'das') return <span className="px-2 py-0.5 rounded-full font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">das (Neutral)</span>;
    return <span className="px-2 py-0.5 rounded-full font-medium text-xs bg-slate-800 text-slate-300">{word.pos}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[90vh] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-black text-white tracking-tight">{word.lemma}</h2>
              <button
                onClick={handlePlayAudio}
                className="p-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                title="Play pronunciation"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {getGenderBadge()}
              {word.ipa && <span className="text-xs font-mono text-slate-400">{word.ipa}</span>}
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/20">
                {word.cefrLevel}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-4 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview & Context
          </button>
          {(word.nounTable || word.verbTable || word.adjectiveTable) && (
            <button
              onClick={() => setActiveTab('tables')}
              className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'tables'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Declension / Conjugation
            </button>
          )}
          {word.isCompound && (
            <button
              onClick={() => setActiveTab('compounds')}
              className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'compounds'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Decompounder
            </button>
          )}
        </div>

        {/* Modal Scroll Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-sm flex-1">
          {activeTab === 'overview' && (
            <>
              {/* Meaning */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Meaning</div>
                <div className="text-base font-bold text-slate-100">{word.meaningEn}</div>
                {word.secondaryMeanings && word.secondaryMeanings.length > 0 && (
                  <div className="text-xs text-slate-400 mt-1">
                    Also: {word.secondaryMeanings.join(', ')}
                  </div>
                )}
                {word.disambiguation && (
                  <div className="text-xs text-amber-300/90 mt-2 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    💡 <span className="font-semibold">Usage note:</span> {word.disambiguation}
                  </div>
                )}
                {word.falseFriends && (
                  <div className="text-xs text-rose-300/90 mt-2 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20 flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>{word.falseFriends}</div>
                  </div>
                )}
              </div>

              {/* Example Sentences */}
              {word.examples && word.examples.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Example Sentences</div>
                  <div className="space-y-2">
                    {word.examples.map((ex, i) => (
                      <div key={i} className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
                        <div className="font-medium text-slate-200 flex items-center justify-between">
                          <span>{ex.de}</span>
                          <button
                            onClick={() => AudioService.playGermanText(ex.de)}
                            className="text-slate-400 hover:text-emerald-400"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{ex.en}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collocations & Idioms */}
              {word.collocations && word.collocations.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Collocations & Phrases</div>
                  <div className="flex flex-wrap gap-1.5">
                    {word.collocations.map((c, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'tables' && (
            <div className="space-y-4">
              {/* Noun Table */}
              {word.nounTable && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">4-Case Declension Matrix</div>
                  <table className="w-full text-xs border-collapse rounded-xl overflow-hidden bg-slate-950/60 border border-slate-800">
                    <thead>
                      <tr className="bg-slate-800/60 text-slate-400">
                        <th className="p-2 text-left">Case</th>
                        <th className="p-2 text-left">Singular</th>
                        <th className="p-2 text-left">Plural</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="p-2 font-semibold text-blue-400">Nominativ</td>
                        <td className="p-2">{word.nounTable.nominativ.sg}</td>
                        <td className="p-2">{word.nounTable.nominativ.pl}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold text-emerald-400">Akkusativ</td>
                        <td className="p-2">{word.nounTable.akkusativ.sg}</td>
                        <td className="p-2">{word.nounTable.akkusativ.pl}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold text-amber-400">Dativ</td>
                        <td className="p-2">{word.nounTable.dativ.sg}</td>
                        <td className="p-2">{word.nounTable.dativ.pl}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold text-purple-400">Genitiv</td>
                        <td className="p-2">{word.nounTable.genitiv.sg}</td>
                        <td className="p-2">{word.nounTable.genitiv.pl}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Verb Table */}
              {word.verbTable && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Conjugation & Auxiliary</div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 mb-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Perfekt Aux:</span>{' '}
                      <span className="font-bold text-emerald-400 uppercase">{word.verbTable.perfekt.auxiliary}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Partizip II:</span>{' '}
                      <span className="font-bold text-slate-100">{word.verbTable.perfekt.partizipII}</span>
                    </div>
                    {word.verbTable.governedPreposition && (
                      <div>
                        <span className="text-slate-400">Prep:</span>{' '}
                        <span className="font-bold text-amber-400">{word.verbTable.governedPreposition} + {word.verbTable.governedCase}</span>
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
                        <td className="p-2 font-medium">{word.verbTable.praesens.ich}</td>
                        <td className="p-2">{word.verbTable.praeteritum.ich}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold text-slate-400">du</td>
                        <td className="p-2 font-medium">{word.verbTable.praesens.du}</td>
                        <td className="p-2">{word.verbTable.praeteritum.du}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold text-slate-400">er / sie / es</td>
                        <td className="p-2 font-medium">{word.verbTable.praesens.er_sie_es}</td>
                        <td className="p-2">{word.verbTable.praeteritum.er_sie_es}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold text-slate-400">wir</td>
                        <td className="p-2 font-medium">{word.verbTable.praesens.wir}</td>
                        <td className="p-2">{word.verbTable.praeteritum.wir}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'compounds' && word.compoundParts && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Morphological Decompounding</div>
              <div className="space-y-2">
                {word.compoundParts.map((p, i) => (
                  <div key={i} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-100 text-sm">{p.part}</span>
                      {p.gender && <span className="ml-2 text-xs text-blue-400 font-semibold">({p.gender})</span>}
                    </div>
                    <div className="text-xs text-slate-400">{p.meaningEn}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs text-emerald-300 mt-3">
                ⭐ <span className="font-bold">Head Noun Rule:</span> The gender of a compound noun in German is always determined by the last element (*Begrenzung* is *die*, so *Geschwindigkeitsbegrenzung* is *die*).
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-2">
          <button
            onClick={handleAdd}
            disabled={added}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              added
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-98'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" /> Added to FSRS Deck!
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add Word to FSRS Deck
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
