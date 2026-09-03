import React, { useState } from 'react';
import { BookOpen, BarChart3, Award, Flame, Volume2, Shield, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { GradedStory, User } from '../types';
import { AudioService } from '../services/audio';

interface ImmersionProgressViewProps {
  user: User;
  stories: GradedStory[];
  onOpenWordLookup: (word: string) => void;
  onOpenPlacement: () => void;
}

export const ImmersionProgressView: React.FC<ImmersionProgressViewProps> = ({
  user,
  stories,
  onOpenWordLookup,
  onOpenPlacement,
}) => {
  const [selectedStory, setSelectedStory] = useState<GradedStory | null>(stories[0] || null);

  const months = [
    { label: 'M1-2 (A1)', targetWords: 800, currentWords: 750, active: true },
    { label: 'M3-4 (A2)', targetWords: 1800, currentWords: 1200, active: false },
    { label: 'M5-7 (B1 Start)', targetWords: 3000, currentWords: 0, active: false },
    { label: 'M8-10 (B1 Solid)', targetWords: 4500, currentWords: 0, active: false },
    { label: 'M11-12 (B2)', targetWords: 6000, currentWords: 0, active: false },
  ];

  const grammarTagsHeatmap = [
    { tag: 'Nominativ', score: 96, count: 48 },
    { tag: 'Akkusativ', score: 88, count: 42 },
    { tag: 'Dativ', score: 82, count: 35 },
    { tag: 'Perfekt Aux', score: 90, count: 28 },
    { tag: 'Satzklammer', score: 84, count: 30 },
    { tag: 'Nebensätze', score: 78, count: 22, isRemedial: true },
    { tag: 'Adjektivdeklination', score: 72, count: 18, isRemedial: true },
    { tag: 'Konjunktiv II', score: 85, count: 15 },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Immersion & Progress Dashboard</h1>
          </div>
          <p className="text-xs text-slate-400">Graded readers, vocabulary breadth, grammar mastery & mock placement tests</p>
        </div>

        <button
          onClick={onOpenPlacement}
          className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-2"
        >
          <Award className="w-4 h-4" /> Start Monthly Mock Placement Test
        </button>
      </div>

      {/* 12-Month Projected CEFR Progression Curve */}
      <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              12-Month CEFR Syllabus Curve
            </span>
            <span className="text-[11px] text-slate-400">Live Computed Level: <strong>{user.activeLevel.replace('_', ' ')}</strong></span>
          </div>
          <span className="text-xs font-bold text-slate-300">Target: Solid B1+ (Reach B2)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {months.map((m, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                m.active
                  ? 'bg-emerald-950/30 border-emerald-500/50 ring-1 ring-emerald-500/30'
                  : 'bg-slate-950/60 border-slate-800/80'
              }`}
            >
              <div className="text-xs font-bold text-slate-200">{m.label}</div>
              <div className="text-lg font-black text-white mt-1">{m.targetWords} <span className="text-[10px] text-slate-400 font-normal">words</span></div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (m.currentWords / m.targetWords) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grammar Mastery Heatmap */}
      <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Grammar Tag Mastery Heatmap
          </h3>
          <span className="text-xs text-slate-400">Automatic Remediation Threshold: &lt; 80%</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {grammarTagsHeatmap.map((t, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl border ${
                t.isRemedial
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>{t.tag}</span>
                <span className={t.isRemedial ? 'text-rose-400 font-black' : 'text-emerald-400'}>{t.score}%</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {t.count} drills practiced {t.isRemedial && '• Re-injected!'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graded Reader Stories */}
      {selectedStory && (
        <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{selectedStory.coverEmoji}</span>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">{selectedStory.title}</h2>
                <p className="text-xs text-slate-400">Tap any word to open instantaneous morphological dictionary</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 border border-amber-500/20">
              CEFR {selectedStory.cefrLevel}
            </span>
          </div>

          <div className="space-y-4">
            {selectedStory.paragraphs.map((para, pIdx) => {
              const words = para.textDe.split(' ');
              return (
                <div key={pIdx} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                  <div className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed flex flex-wrap gap-1.5">
                    {words.map((w, wIdx) => {
                      const cleanWord = w.replace(/[.,!?;:"„“]/g, '');
                      return (
                        <span
                          key={wIdx}
                          onClick={() => onOpenWordLookup(cleanWord)}
                          className="de-token px-1 py-0.5 rounded cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                          title="Tap for word breakdown"
                        >
                          {w}
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-xs text-slate-400 italic pt-1 border-t border-slate-900">
                    {para.textEn}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
