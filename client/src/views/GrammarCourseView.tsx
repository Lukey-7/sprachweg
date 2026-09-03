import React, { useState } from 'react';
import { Layers, CheckCircle2, AlertCircle, Sparkles, BookOpen, ChevronRight, Play } from 'lucide-react';
import { GrammarDrill, GrammarTopic } from '../types';
import { AudioService } from '../services/audio';

interface GrammarCourseViewProps {
  topics: GrammarTopic[];
  onOpenWordLookup: (word: string) => void;
}

export const GrammarCourseView: React.FC<GrammarCourseViewProps> = ({ topics, onOpenWordLookup }) => {
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(topics[0] || null);
  const [activeLevelFilter, setActiveLevelFilter] = useState<string>('ALL');
  const [activeDrillIndex, setActiveDrillIndex] = useState<number>(0);
  const [drillAnswer, setDrillAnswer] = useState<string>('');
  const [drillFeedback, setDrillFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [tagScores, setTagScores] = useState<Record<string, { correct: number; total: number }>>({});

  const levels = ['ALL', 'A1', 'A2', 'B1_START', 'B1_SOLID', 'B2'];

  const filteredTopics = activeLevelFilter === 'ALL'
    ? topics
    : topics.filter(t => t.cefrLevel === activeLevelFilter);

  const currentDrill: GrammarDrill | undefined = selectedTopic?.drills[activeDrillIndex];

  const handleCheckAnswer = () => {
    if (!currentDrill || !drillAnswer.trim()) return;

    const isCorrect = drillAnswer.trim().toLowerCase() === currentDrill.correctAnswer.toLowerCase();
    const tag = currentDrill.grammarTag;

    // Update tag score
    setTagScores(prev => {
      const current = prev[tag] || { correct: 0, total: 0 };
      return {
        ...prev,
        [tag]: {
          correct: current.correct + (isCorrect ? 1 : 0),
          total: current.total + 1
        }
      };
    });

    if (isCorrect) {
      AudioService.playFeedbackSound('correct');
      setDrillFeedback({
        isCorrect: true,
        message: `Richtig! ${currentDrill.explanation}`
      });
    } else {
      AudioService.playFeedbackSound('error');
      setDrillFeedback({
        isCorrect: false,
        message: `Nicht ganz. Richtige Antwort: "${currentDrill.correctAnswer}". ${currentDrill.explanation}`
      });
    }
  };

  const handleNextDrill = () => {
    setDrillFeedback(null);
    setDrillAnswer('');
    if (selectedTopic && activeDrillIndex < selectedTopic.drills.length - 1) {
      setActiveDrillIndex(activeDrillIndex + 1);
    } else {
      AudioService.playFeedbackSound('complete');
      setActiveDrillIndex(0);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Grammar Course & Drill Engine</h1>
            <p className="text-xs text-slate-400">~60 CEFR lessons with mental models, reference tables & 15 interactive drills</p>
          </div>
        </div>

        {/* Level Filter Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setActiveLevelFilter(lvl)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeLevelFilter === lvl
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
            >
              {lvl.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Topic List (4 cols) */}
        <div className="lg:col-span-4 space-y-2 max-h-[75vh] overflow-y-auto pr-1">
          {filteredTopics.map((t) => {
            const isSelected = selectedTopic?.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedTopic(t);
                  setActiveDrillIndex(0);
                  setDrillFeedback(null);
                  setDrillAnswer('');
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-amber-400 border border-amber-500/20">
                    Week {t.weekNumber} • {t.cefrLevel}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-500 ${isSelected ? 'text-emerald-400 translate-x-0.5' : ''}`} />
                </div>
                <h3 className="font-bold text-slate-100 text-sm">{t.titleDe}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t.titleEn}</p>
              </div>
            );
          })}
        </div>

        {/* Right Topic Details & Drills (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedTopic && (
            <>
              {/* Lesson Detail Card */}
              <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Week {selectedTopic.weekNumber} • Lesson {selectedTopic.orderIndex}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">{selectedTopic.titleDe}</h2>
                    <p className="text-xs text-slate-400">{selectedTopic.titleEn}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    CEFR {selectedTopic.cefrLevel}
                  </span>
                </div>

                {/* Explanation */}
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  {selectedTopic.explanationMd}
                </div>

                {/* Visual Reference Table */}
                {selectedTopic.visualTable && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Reference Matrix</div>
                    <table className="w-full text-xs border-collapse rounded-xl overflow-hidden bg-slate-950/60 border border-slate-800">
                      <thead>
                        <tr className="bg-slate-800/60 text-slate-400">
                          {selectedTopic.visualTable.headers.map((h, idx) => (
                            <th key={idx} className="p-2.5 text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {selectedTopic.visualTable.rows.map((r, rowIdx) => (
                          <tr key={rowIdx}>
                            {r.map((cell, colIdx) => (
                              <td key={colIdx} className={`p-2.5 ${colIdx === 0 ? 'font-semibold text-slate-200' : 'text-slate-300'}`}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Common Pitfalls */}
                {selectedTopic.commonMistakes && selectedTopic.commonMistakes.length > 0 && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">Common Pitfalls & Fixes</div>
                    <div className="space-y-2">
                      {selectedTopic.commonMistakes.map((m, i) => (
                        <div key={i} className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-xs text-rose-200">
                          <div>❌ <span className="line-through text-slate-400">{m.wrong}</span></div>
                          <div className="text-emerald-400 font-bold mt-0.5">✔️ {m.correct}</div>
                          <div className="text-slate-400 text-[11px] mt-1">{m.explanation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Drill Studio */}
              {currentDrill && (
                <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-slate-100">
                        Drill {activeDrillIndex + 1} of {selectedTopic.drills.length}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-semibold">
                        {currentDrill.type}
                      </span>
                    </div>
                    <span className="text-xs text-amber-400 font-medium">Tag: {currentDrill.grammarTag}</span>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <p className="text-sm font-bold text-slate-100">{currentDrill.prompt}</p>
                    {currentDrill.sentenceContext && (
                      <div className="text-xs text-slate-400 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        {currentDrill.sentenceContext}
                      </div>
                    )}

                    {currentDrill.options && currentDrill.options.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {currentDrill.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setDrillAnswer(opt)}
                            className={`p-3 rounded-xl text-xs font-semibold text-left transition-all border ${
                              drillAnswer === opt
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                                : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={drillAnswer}
                        onChange={(e) => setDrillAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCheckAnswer()}
                        placeholder="Type answer here..."
                        className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    )}

                    {drillFeedback && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                          drillFeedback.isCorrect
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {drillFeedback.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        )}
                        <span>{drillFeedback.message}</span>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      {!drillFeedback ? (
                        <button
                          onClick={handleCheckAnswer}
                          disabled={!drillAnswer.trim()}
                          className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow transition-all"
                        >
                          Check Answer
                        </button>
                      ) : (
                        <button
                          onClick={handleNextDrill}
                          className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-all"
                        >
                          Next Drill →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
