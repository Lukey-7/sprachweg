import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpen, Brain, CheckCircle2, ChevronRight, Headphones, Mic, Search } from 'lucide-react';
import { GrammarTopic, User } from '../types';
import { TabId } from '../components/BottomNav';
import { ErrorPanel, LoadingPanel } from '../components/Feedback';
import { AudioService } from '../services/audio';
import {
  useGrammarProgress,
  useMarkBlockDone,
  useRecordPractice,
  useTodayCards,
  useTodaySession,
  useTopics,
} from '../services/queries';

interface TodaySessionViewProps {
  user: User;
  dueCount: number;
  onNavigate: (tab: TabId) => void;
  onOpenLearn: (view: 'grammar' | 'reader') => void;
  onOpenExplore: (view: 'dictionary' | 'miner') => void;
}

/** The next topic to study: lowest week first, skipping ones already mastered. */
export function pickCurrentTopic(topics: GrammarTopic[], mastery: Map<string, number>): GrammarTopic | undefined {
  const ordered = [...topics].sort((a, b) => a.weekNumber - b.weekNumber || a.orderIndex - b.orderIndex);
  return ordered.find(t => (mastery.get(t.id) ?? 0) < 0.8) ?? ordered[ordered.length - 1];
}

export const TodaySessionView: React.FC<TodaySessionViewProps> = ({ user, dueCount, onNavigate, onOpenLearn, onOpenExplore }) => {
  const session = useTodaySession();
  const todayCards = useTodayCards();
  const topics = useTopics();
  const progress = useGrammarProgress();
  const markDone = useMarkBlockDone();

  const mastery = useMemo(() => new Map((progress.data ?? []).map(p => [p.topicId, p.masteryScore])), [progress.data]);
  const topic = topics.data ? pickCurrentTopic(topics.data, mastery) : undefined;

  // Nothing due means the warm-up is already satisfied for today.
  useEffect(() => {
    if (todayCards.data && todayCards.data.cards.length === 0) markDone(1);
  }, [todayCards.data, session.data?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (session.isPending) return <LoadingPanel label="Preparing today's session…" />;
  if (session.isError) return <ErrorPanel error={session.error} onRetry={() => session.refetch()} />;

  const s = session.data;
  const blocks = [
    {
      n: 1 as const,
      done: s.block1Done,
      icon: Brain,
      label: 'Warm-up review',
      detail: dueCount > 0 ? `${dueCount} card${dueCount === 1 ? '' : 's'} due` : 'Nothing due right now',
      action: () => onNavigate('review'),
    },
    {
      n: 2 as const,
      done: s.block2Done,
      icon: BookOpen,
      label: 'Grammar',
      detail: topic ? topic.titleEn : 'Loading lesson…',
      action: () => {
        onOpenLearn('grammar');
        onNavigate('learn');
      },
    },
    {
      n: 3 as const,
      done: s.block3Done,
      icon: Search,
      label: 'Sentence mining',
      detail: 'Break down one real German sentence',
      action: () => {
        onOpenExplore('miner');
        onNavigate('explore');
      },
    },
    {
      n: 4 as const,
      done: s.block4Done,
      icon: Mic,
      label: 'Speaking',
      detail: 'Say a few sentences and get corrections',
      action: () => onNavigate('speak'),
    },
    {
      n: 5 as const,
      done: s.block5Done,
      icon: Headphones,
      label: 'Reading',
      detail: 'Read a short graded story',
      action: () => {
        onOpenLearn('reader');
        onNavigate('learn');
      },
    },
  ];

  const completed = blocks.filter(b => b.done).length;
  const next = blocks.find(b => !b.done);

  return (
    <div className="space-y-4 pb-4">
      <section className="bg-gradient-to-br from-slate-900 to-emerald-950/40 p-5 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
            Week {s.weekNumber} · Day {s.dayNumber}
          </span>
          <span className="text-emerald-400">{completed} of 5 done</span>
        </div>
        <h1 className="text-2xl font-black text-white mt-3">
          {completed === 5 ? 'Session complete. Gut gemacht!' : completed === 0 ? `Hallo${user.name && user.name !== 'Learner' ? `, ${user.name}` : ''}!` : 'Weiter so!'}
        </h1>
        <p className="text-sm text-slate-300 mt-1">
          {next ? `Up next: ${next.label.toLowerCase()}.` : 'Come back tomorrow to keep your streak going.'}
        </p>
        <div className="flex gap-1.5 mt-4" aria-hidden>
          {blocks.map(b => (
            <div key={b.n} className={`h-2 flex-1 rounded-full ${b.done ? 'bg-emerald-500' : 'bg-slate-800'}`} />
          ))}
        </div>
      </section>

      <ol className="space-y-2">
        {blocks.map(b => {
          const Icon = b.icon;
          const isNext = next?.n === b.n;
          return (
            <li key={b.n}>
              <button
                onClick={b.action}
                className={`w-full text-left flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
                  isNext ? 'bg-slate-900 border-emerald-500/50' : 'bg-slate-900/50 border-slate-800 active:bg-slate-900'
                }`}
              >
                <span
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    b.done ? 'bg-emerald-500/20 text-emerald-400' : isNext ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {b.done ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-base font-bold ${b.done ? 'text-slate-400' : 'text-slate-100'}`}>{b.label}</span>
                  <span className="block text-sm text-slate-400 truncate">{b.detail}</span>
                </span>
                <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
              </button>
            </li>
          );
        })}
      </ol>

      {topic && !s.block2Done && <QuickDrill topic={topic} onCorrect={() => markDone(2)} onOpenLesson={blocks[1].action} />}
    </div>
  );
};

/** One multiple-choice drill from the current topic, so grammar can be started right here. */
const QuickDrill: React.FC<{ topic: GrammarTopic; onCorrect: () => void; onOpenLesson: () => void }> = ({ topic, onCorrect, onOpenLesson }) => {
  const drill = topic.drills.find(d => d.options && d.options.length > 1);
  const [answer, setAnswer] = useState<string | null>(null);
  const record = useRecordPractice();

  if (!drill) return null;
  const checked = answer !== null;
  const isCorrect = answer?.trim().toLowerCase() === drill.correctAnswer.trim().toLowerCase();

  const choose = (opt: string) => {
    if (checked) return;
    setAnswer(opt);
    const correct = opt.trim().toLowerCase() === drill.correctAnswer.trim().toLowerCase();
    AudioService.playFeedbackSound(correct ? 'correct' : 'error');
    record.mutate({ slug: topic.slug, correct });
    if (correct) onCorrect();
  };

  return (
    <section className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Quick check · {topic.titleDe}</span>
        <button onClick={onOpenLesson} className="text-xs font-bold text-slate-400 hover:text-emerald-400">
          Full lesson
        </button>
      </div>
      <p className="text-base font-semibold text-slate-100">{drill.prompt}</p>
      {drill.sentenceContext && <p className="text-sm text-slate-400 italic">{drill.sentenceContext}</p>}
      <div className="grid grid-cols-2 gap-2">
        {drill.options!.map(opt => {
          const isAnswer = opt === drill.correctAnswer;
          const picked = opt === answer;
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={checked}
              className={`min-h-[48px] px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
                checked && isAnswer
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : checked && picked
                  ? 'bg-rose-500/20 text-rose-200 border-rose-500/50'
                  : 'bg-slate-800 text-slate-100 border-slate-700 active:bg-slate-700'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {checked && (
        <div
          className={`p-3 rounded-xl text-sm flex items-start gap-2 ${
            isCorrect ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-200 border border-rose-500/30'
          }`}
        >
          {isCorrect ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />}
          <span>
            {isCorrect ? 'Richtig! ' : `Answer: ${drill.correctAnswer}. `}
            {drill.explanation}
          </span>
        </div>
      )}
      {checked && !isCorrect && (
        <button onClick={() => setAnswer(null)} className="w-full py-3 rounded-xl bg-slate-800 text-slate-100 text-sm font-bold">
          Try again
        </button>
      )}
    </section>
  );
};
