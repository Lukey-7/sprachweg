import React, { useState } from 'react';
import { CheckCircle2, Circle, ArrowRight, Sparkles, Brain, BookOpen, Search, Mic, Headphones, Award, AlertCircle } from 'lucide-react';
import { DailySession, GrammarTopic, User, WordEntry } from '../types';
import { AudioService } from '../services/audio';
import { GermanQuickBar } from '../components/GermanQuickBar';

interface TodaySessionViewProps {
  user: User;
  onNavigateToTab: (tab: any) => void;
  onOpenWordLookup: (word: string) => void;
  topics: GrammarTopic[];
}

export const TodaySessionView: React.FC<TodaySessionViewProps> = ({
  user,
  onNavigateToTab,
  onOpenWordLookup,
  topics
}) => {
  const [session, setSession] = useState<DailySession>({
    id: 'session-today',
    userId: user.id,
    weekNumber: user.currentWeek,
    dayNumber: 1,
    block1Done: true,
    block2Done: false,
    block3Done: false,
    block4Done: false,
    block5Done: false,
  });

  const [activeBlock, setActiveBlock] = useState<number>(2);
  const [drillAnswer, setDrillAnswer] = useState('');
  const [drillFeedback, setDrillFeedback] = useState<{ isCorrect?: boolean; message?: string } | null>(null);

  const currentTopic = topics[0] || null;

  const handleCompleteBlock = (blockIndex: number) => {
    AudioService.playFeedbackSound('correct');
    const updated = { ...session };
    if (blockIndex === 1) updated.block1Done = true;
    if (blockIndex === 2) updated.block2Done = true;
    if (blockIndex === 3) updated.block3Done = true;
    if (blockIndex === 4) updated.block4Done = true;
    if (blockIndex === 5) updated.block5Done = true;
    setSession(updated);

    if (blockIndex < 5) {
      setActiveBlock(blockIndex + 1);
    } else {
      AudioService.playFeedbackSound('complete');
    }
  };

  const handleCheckDrill = () => {
    if (!drillAnswer.trim()) return;
    const isCorrect = drillAnswer.trim().toLowerCase() === 'der';
    if (isCorrect) {
      AudioService.playFeedbackSound('correct');
      setDrillFeedback({ isCorrect: true, message: 'Ausgezeichnet! "Der Mann" takes masculine nominative article.' });
      setTimeout(() => {
        handleCompleteBlock(2);
        setDrillFeedback(null);
      }, 1500);
    } else {
      AudioService.playFeedbackSound('error');
      setDrillFeedback({ isCorrect: false, message: 'Fast! "Mann" is masculine in Nominativ, so it takes "Der".' });
    }
  };

  const blocks = [
    {
      index: 1,
      name: 'Block 1: Spaced Repetition Warmup',
      desc: 'Review 15 due cards with FSRS scheduler',
      icon: Brain,
      isDone: session.block1Done,
      tag: 'SRS Warmup'
    },
    {
      index: 2,
      name: 'Block 2: New Grammar Concept',
      desc: currentTopic?.titleEn || 'Articles & Gender in Nominative',
      icon: BookOpen,
      isDone: session.block2Done,
      tag: 'Grammar Pillar'
    },
    {
      index: 3,
      name: 'Block 3: Sentence Mining Teardown',
      desc: 'Deconstruct real German sentences and word order',
      icon: Search,
      isDone: session.block3Done,
      tag: 'Sentence Miner'
    },
    {
      index: 4,
      name: 'Block 4: Speaking & Pronunciation Task',
      desc: 'German tutor conversation with real-time recast',
      icon: Mic,
      isDone: session.block4Done,
      tag: 'Voice Studio'
    },
    {
      index: 5,
      name: 'Block 5: Immersion Reading & Listening',
      desc: 'Graded dialogue with tap-to-inspect lookups',
      icon: Headphones,
      isDone: session.block5Done,
      tag: 'Graded Immersion'
    }
  ];

  const completedCount = [
    session.block1Done,
    session.block2Done,
    session.block3Done,
    session.block4Done,
    session.block5Done,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Session Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Week {user.currentWeek} • Day 1
            </span>
            <span className="text-xs text-slate-400 font-medium">45–75 min Daily Session</span>
          </div>
          <span className="text-xs font-black text-emerald-400">
            {completedCount}/5 Blocks ({Math.round((completedCount / 5) * 100)}%)
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Today's 5-Block Learning Session
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
          Structured 12-month spine: Warm-up SRS → New grammar mental model → Sentence mining → Speaking drill → Immersion reader.
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950/80 h-2.5 rounded-full overflow-hidden mt-4 p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* 5-Block Flow Cards */}
      <div className="space-y-3">
        {blocks.map((b) => {
          const Icon = b.icon;
          const isCurrent = activeBlock === b.index;

          return (
            <div
              key={b.index}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                isCurrent
                  ? 'bg-slate-900 border-emerald-500/50 shadow-lg ring-1 ring-emerald-500/20'
                  : b.isDone
                  ? 'bg-slate-900/60 border-slate-800/80 opacity-90'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      b.isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isCurrent
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {b.isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        {b.tag}
                      </span>
                      {b.isDone && (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-100 mt-0.5">{b.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{b.desc}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (b.index === 1) onNavigateToTab('srs');
                    else if (b.index === 3) onNavigateToTab('miner');
                    else if (b.index === 4) onNavigateToTab('voice');
                    else if (b.index === 5) onNavigateToTab('progress');
                    else setActiveBlock(b.index);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {b.isDone ? 'Review' : isCurrent ? 'Active Now' : 'Start'}
                </button>
              </div>

              {/* Active Interactive Block Experience */}
              {isCurrent && b.index === 2 && currentTopic && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
                  <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-black text-emerald-400">{currentTopic.titleDe}</h4>
                      <span className="text-xs text-slate-400">CEFR {currentTopic.cefrLevel}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentTopic.description}
                    </p>

                    {/* Mental Model Callout */}
                    <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
                      💡 <span className="font-bold">Mental Model:</span> Learn nouns with their gender colors: <span className="text-blue-400 font-bold">der (blue)</span>, <span className="text-rose-400 font-bold">die (red)</span>, and <span className="text-emerald-400 font-bold">das (green)</span>.
                    </div>
                  </div>

                  {/* Interactive Mini Drill */}
                  <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Check Understanding
                      </span>
                      <span className="text-[11px] text-amber-400 font-medium">Tag: nominativ</span>
                    </div>

                    <p className="text-sm font-bold text-slate-100">
                      Fill in the correct Nominativ article:
                    </p>
                    <div className="text-base font-semibold text-slate-200 p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-emerald-400 font-black">___</span> Mann trinkt Kaffee am Morgen.
                    </div>

                    <div className="flex gap-2">
                      {['Der', 'Die', 'Das', 'Ein'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setDrillAnswer(opt);
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                            drillAnswer === opt
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

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

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={handleCheckDrill}
                        className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                      >
                        Check & Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
