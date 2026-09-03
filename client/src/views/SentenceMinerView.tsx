import React, { useState, useRef } from 'react';
import { Search, Sparkles, Volume2, Plus, Check, ArrowRight, Layers, HelpCircle } from 'lucide-react';
import { SentenceAnalysis, SentenceToken, WordEntry } from '../types';
import { ApiService } from '../services/api';
import { AudioService } from '../services/audio';
import { GermanQuickBar } from '../components/GermanQuickBar';
import { WordOrderMap } from '../components/WordOrderMap';

interface SentenceMinerViewProps {
  onOpenWordLookup: (word: string) => void;
  onAddCard: (cardData: any) => void;
}

export const SentenceMinerView: React.FC<SentenceMinerViewProps> = ({
  onOpenWordLookup,
  onAddCard
}) => {
  const [inputText, setInputText] = useState('Ich fahre heute mit dem Zug nach Berlin, weil ich einen Termin habe.');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SentenceAnalysis | null>(null);
  const [selectedToken, setSelectedToken] = useState<SentenceToken | null>(null);
  const [addedCloze, setAddedCloze] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sampleSentences = [
    'Ich fahre heute mit dem Zug nach Berlin, weil ich einen Termin habe.',
    'Die Verkäuferin gibt dem freundlichen Kunden das frische Brot.',
    'Auf vielen Abschnitten der Autobahn gilt keine Geschwindigkeitsbegrenzung.',
    'Wenn das Wetter morgen schön ist, wandern wir in den Bergen.'
  ];

  const handleAnalyze = async (sentenceToAnalyze?: string) => {
    const text = (sentenceToAnalyze || inputText).trim();
    if (!text) return;
    setIsLoading(true);
    setSelectedToken(null);
    try {
      const result = await ApiService.analyzeSentence(text);
      setAnalysis(result);
      AudioService.playFeedbackSound('click');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClozeCard = () => {
    if (!analysis) return;
    onAddCard({
      cardType: 'sentence_cloze',
      prompt: analysis.textDe.replace('Zug', '___'),
      answer: 'Zug',
      contextSentence: analysis.textDe,
    });
    setAddedCloze(true);
    AudioService.playFeedbackSound('correct');
    setTimeout(() => setAddedCloze(false), 2500);
  };

  const getTokenColorClass = (token: SentenceToken) => {
    if (token.gender === 'der') return 'text-blue-400 font-semibold border-b-2 border-blue-500/40 bg-blue-500/10';
    if (token.gender === 'die') return 'text-rose-400 font-semibold border-b-2 border-rose-500/40 bg-rose-500/10';
    if (token.gender === 'das') return 'text-emerald-400 font-semibold border-b-2 border-emerald-500/40 bg-emerald-500/10';
    if (token.pos === 'verb') return 'text-amber-300 font-semibold border-b-2 border-amber-500/40 bg-amber-500/10';
    return 'text-slate-200 border-b border-slate-700 hover:bg-slate-800';
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Sentence Miner</h1>
            <p className="text-xs text-slate-400">Paste, type, or speak any German sentence for full grammatical teardown</p>
          </div>
        </div>

        {/* Text Input Area */}
        <div className="mt-4 space-y-2">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste any German sentence here..."
              rows={3}
              className="w-full bg-slate-950 p-3.5 rounded-2xl border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
            />
          </div>

          {/* German Umlauts Quick Bar */}
          <GermanQuickBar inputRef={inputRef} />

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap gap-1.5">
              {sampleSentences.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(s);
                    handleAnalyze(s);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
                >
                  Example {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleAnalyze()}
              disabled={isLoading || !inputText.trim()}
              className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 ml-auto"
            >
              {isLoading ? (
                <>Analyzing linguistics...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Deconstruct Sentence
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-300">
          {/* Main Sentence Breakdown */}
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Interactive Token Breakdown
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CEFR {analysis.cefrLevel}
                </span>
              </div>
              <button
                onClick={() => AudioService.playGermanText(analysis.textDe)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-emerald-400 text-xs font-medium transition-colors"
              >
                <Volume2 className="w-4 h-4" /> Listen
              </button>
            </div>

            {/* Interactive Token Stream */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 flex flex-wrap gap-2 items-center text-lg sm:text-xl font-medium">
              {analysis.tokens.map((token, idx) => (
                <span
                  key={idx}
                  onClick={() => setSelectedToken(token)}
                  className={`de-token px-2 py-1 rounded-xl cursor-pointer transition-all ${getTokenColorClass(token)} ${
                    selectedToken?.tokenIndex === token.tokenIndex ? 'ring-2 ring-emerald-400 scale-105' : ''
                  }`}
                  title="Click for deep grammatical teardown"
                >
                  {token.surfaceToken}
                </span>
              ))}
            </div>

            {/* Token Detail Sheet (When Tapped) */}
            {selectedToken && (
              <div className="p-4 bg-slate-950/90 rounded-2xl border border-emerald-500/30 animate-in fade-in duration-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white">{selectedToken.surfaceToken}</span>
                      <span className="text-xs text-slate-400">→ Lemma: <strong className="text-slate-200">{selectedToken.lemma}</strong></span>
                      {selectedToken.gender && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {selectedToken.gender}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      Role in this sentence: <strong className="text-emerald-400">{selectedToken.syntaxRole || selectedToken.pos}</strong>
                      {selectedToken.case && <span> • Case: <strong className="capitalize text-amber-300">{selectedToken.case}</strong></span>}
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenWordLookup(selectedToken.lemma)}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
                  >
                    Deep Dictionary
                  </button>
                </div>
              </div>
            )}

            {/* Translations Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  Natural English Translation
                </div>
                <div className="text-sm font-medium text-slate-100">{analysis.textEnNatural}</div>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                  Literal Pedagogical Translation
                </div>
                <div className="text-sm font-medium text-slate-300 italic">{analysis.textEnLiteral}</div>
              </div>
            </div>

            {/* Satzklammer Word Order Map */}
            <WordOrderMap
              pos1={analysis.v2Position1}
              verb2={analysis.v2Verb}
              mittelfeld={analysis.v2Mittelfeld}
              verbFinal={analysis.v2VerbFinal}
              isNebensatz={analysis.isNebensatz}
            />

            {/* Add to Deck Quick Actions */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={handleAddClozeCard}
                disabled={addedCloze}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  addedCloze
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow'
                }`}
              >
                {addedCloze ? (
                  <>
                    <Check className="w-4 h-4" /> Added Sentence Cloze to FSRS!
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Add Sentence Cloze Card
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Calibrated Variations */}
          {analysis.variations && analysis.variations.length > 0 && (
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3">
              <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                CEFR-Calibrated Sentence Variations
              </h3>
              <div className="space-y-2">
                {analysis.variations.map((v, i) => (
                  <div key={i} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-200 text-sm">{v.de}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{v.en}</div>
                      <div className="text-[11px] text-emerald-400/80 mt-1">💡 {v.note}</div>
                    </div>
                    <button
                      onClick={() => AudioService.playGermanText(v.de)}
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
