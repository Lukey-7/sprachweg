import React, { useState } from 'react';
import { ArrowLeft, Award, Brain, CheckCircle2, ChevronRight, Flame, Languages, Volume2 } from 'lucide-react';
import { GradedStory, User } from '../types';
import { AudioService } from '../services/audio';
import { ErrorPanel, LoadingPanel } from '../components/Feedback';
import { useMarkBlockDone, useStats, useStories } from '../services/queries';

// ── Reader ────────────────────────────────────────────────────────────────

export const ReaderView: React.FC<{ onOpenWordLookup: (word: string) => void }> = ({ onOpenWordLookup }) => {
  const stories = useStories();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (stories.isPending) return <LoadingPanel label="Loading stories…" />;
  if (stories.isError) return <ErrorPanel error={stories.error} onRetry={() => stories.refetch()} />;

  const story = stories.data.find(s => s.id === selectedId);
  if (story) return <StoryReader story={story} onBack={() => setSelectedId(null)} onOpenWordLookup={onOpenWordLookup} />;

  return (
    <ul className="space-y-2 pb-4">
      {stories.data.map(s => (
        <li key={s.id}>
          <button onClick={() => setSelectedId(s.id)} className="w-full text-left p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3 active:bg-slate-800">
            <span className="text-3xl">{s.coverEmoji}</span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-slate-100">{s.title}</span>
              <span className="block text-sm text-slate-400">
                {s.cefrLevel} · {s.paragraphs.length} paragraphs
              </span>
            </span>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
        </li>
      ))}
    </ul>
  );
};

const StoryReader: React.FC<{ story: GradedStory; onBack: () => void; onOpenWordLookup: (word: string) => void }> = ({ story, onBack, onOpenWordLookup }) => {
  const [shown, setShown] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);
  const markDone = useMarkBlockDone();

  const toggle = (i: number) =>
    setShown(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <div className="space-y-4 pb-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold text-slate-300 py-2">
        <ArrowLeft className="w-4 h-4" /> All stories
      </button>
      <header className="flex items-center gap-3">
        <span className="text-4xl">{story.coverEmoji}</span>
        <div>
          <h2 className="text-xl font-black text-white">{story.title}</h2>
          <p className="text-sm text-slate-400">{story.cefrLevel} · tap any word to look it up</p>
        </div>
      </header>

      {story.paragraphs.map((p, i) => (
        <article key={i} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
          <p className="text-lg text-slate-100 leading-relaxed" lang="de">
            {p.textDe.split(/(\s+)/).map((part, j) =>
              /^\s+$/.test(part) ? (
                part
              ) : (
                <span key={j} onClick={() => onOpenWordLookup(part)} className="cursor-pointer rounded active:bg-emerald-500/30 hover:text-emerald-300">
                  {part}
                </span>
              )
            )}
          </p>
          <div className="flex gap-2">
            <button onClick={() => AudioService.playGermanText(p.textDe, 0.9)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-emerald-400 text-sm font-semibold">
              <Volume2 className="w-4 h-4" /> Listen
            </button>
            <button onClick={() => toggle(i)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold">
              <Languages className="w-4 h-4" /> {shown.has(i) ? 'Hide' : 'Translate'}
            </button>
          </div>
          {shown.has(i) && <p className="text-sm text-slate-400 italic border-t border-slate-800 pt-3">{p.textEn}</p>}
        </article>
      ))}

      <button
        onClick={() => {
          setFinished(true);
          markDone(5);
          AudioService.playFeedbackSound('complete');
        }}
        disabled={finished}
        className="w-full min-h-[52px] rounded-2xl bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-300 text-slate-950 font-bold text-base flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-5 h-5" /> {finished ? 'Marked as read' : "I've read this"}
      </button>
    </div>
  );
};

// ── Progress ──────────────────────────────────────────────────────────────

const Stat: React.FC<{ icon: React.ElementType; label: string; value: string; hint?: string }> = ({ icon: Icon, label, value, hint }) => (
  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
      <Icon className="w-4 h-4" /> {label}
    </div>
    <div className="text-2xl font-black text-white mt-1">{value}</div>
    {hint && <div className="text-xs text-slate-500 mt-0.5">{hint}</div>}
  </div>
);

export const ImmersionProgressView: React.FC<{ user: User; onOpenPlacement: () => void }> = ({ user, onOpenPlacement }) => {
  const stats = useStats();

  if (stats.isPending) return <LoadingPanel label="Loading progress…" />;
  if (stats.isError) return <ErrorPanel error={stats.error} onRetry={() => stats.refetch()} />;

  const s = stats.data;
  const grammar = [...s.grammar].sort((a, b) => a.masteryScore - b.masteryScore);

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-2xl font-black text-white">Your progress</h1>

      <div className="grid grid-cols-2 gap-2">
        <Stat icon={Flame} label="Streak" value={`${s.streak} day${s.streak === 1 ? '' : 's'}`} />
        <Stat icon={Award} label="Level" value={user.activeLevel.replace('_', ' ')} hint={`Week ${user.currentWeek} of 52`} />
        <Stat icon={Brain} label="Cards" value={String(s.totalCards)} hint={`${s.matureCards} learned · ${s.cardsByState.new} new`} />
        <Stat
          icon={CheckCircle2}
          label="Recall this week"
          value={s.retentionThisWeek === null ? '–' : `${Math.round(s.retentionThisWeek * 100)}%`}
          hint={`${s.reviewsThisWeek} reviews`}
        />
      </div>

      <section className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3">
        <h2 className="text-sm font-bold text-slate-100">Grammar</h2>
        {grammar.length === 0 ? (
          <p className="text-sm text-slate-400">Practice drills in Learn → Grammar and your mastery shows up here.</p>
        ) : (
          <ul className="space-y-3">
            {grammar.map(g => (
              <li key={g.slug}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-200">{g.titleDe}</span>
                  <span className={g.masteryScore >= 0.8 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{Math.round(g.masteryScore * 100)}%</span>
                </div>
                <div className="h-2 mt-1 rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full ${g.masteryScore >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.round(g.masteryScore * 100)}%` }} />
                </div>
                {g.isRemedialActive && <p className="text-xs text-rose-300 mt-1">Needs another look</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <button onClick={onOpenPlacement} className="w-full min-h-[52px] rounded-2xl bg-slate-800 text-slate-100 font-bold text-sm flex items-center justify-center gap-2">
        <Award className="w-5 h-5 text-amber-400" /> Take the placement check
      </button>
    </div>
  );
};
