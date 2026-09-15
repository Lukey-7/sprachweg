import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { GrammarTopic, User } from '../types';
import { AudioService } from '../services/audio';
import { ErrorPanel, LoadingPanel } from '../components/Feedback';
import { useGrammarProgress, useMarkBlockDone, useRecordPractice, useTopics } from '../services/queries';

interface GrammarCourseViewProps {
  user: User;
}

const LEVELS = ['ALL', 'A1', 'A2', 'B1', 'B2'];

const masteryLabel = (score: number | undefined) => {
  if (score === undefined) return { text: 'Not started', cls: 'text-slate-500' };
  if (score >= 0.8) return { text: `Mastered · ${Math.round(score * 100)}%`, cls: 'text-emerald-400' };
  return { text: `${Math.round(score * 100)}%`, cls: 'text-amber-400' };
};

export const GrammarCourseView: React.FC<GrammarCourseViewProps> = () => {
  const topics = useTopics();
  const progress = useGrammarProgress();
  const [level, setLevel] = useState('ALL');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const mastery = useMemo(() => new Map((progress.data ?? []).map(p => [p.topicId, p])), [progress.data]);

  if (topics.isPending) return <LoadingPanel label="Loading lessons…" />;
  if (topics.isError) return <ErrorPanel error={topics.error} onRetry={() => topics.refetch()} />;

  const ordered = [...topics.data].sort((a, b) => a.weekNumber - b.weekNumber || a.orderIndex - b.orderIndex);
  const filtered = level === 'ALL' ? ordered : ordered.filter(t => t.cefrLevel.startsWith(level));
  const selected = ordered.find(t => t.slug === selectedSlug);

  const list = (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {LEVELS.map(l => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`shrink-0 text-sm px-4 py-2 rounded-xl font-bold ${level === l ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
          >
            {l === 'ALL' ? 'All' : l}
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-sm text-slate-400 p-4">No lessons at this level yet.</p>}
      <ul className="space-y-2">
        {filtered.map(t => {
          const m = masteryLabel(mastery.get(t.id)?.masteryScore);
          const isSelected = t.slug === selectedSlug;
          return (
            <li key={t.id}>
              <button
                onClick={() => {
                  setSelectedSlug(t.slug);
                  window.scrollTo({ top: 0 });
                }}
                className={`w-full text-left p-4 rounded-2xl border flex items-center gap-3 ${
                  isSelected ? 'bg-slate-900 border-emerald-500/50' : 'bg-slate-900/50 border-slate-800 active:bg-slate-900'
                }`}
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-slate-500">
                    Week {t.weekNumber} · {t.cefrLevel}
                  </span>
                  <span className="block font-bold text-slate-100">{t.titleDe}</span>
                  <span className="block text-sm text-slate-400">{t.titleEn}</span>
                  <span className={`block text-xs font-bold mt-1 ${m.cls}`}>
                    {m.text}
                    {mastery.get(t.id)?.isRemedialActive && ' · needs review'}
                  </span>
                </span>
                <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-5 pb-4">
      <div className={`lg:col-span-4 ${selected ? 'hidden lg:block' : ''}`}>{list}</div>
      <div className={`lg:col-span-8 ${selected ? '' : 'hidden lg:block'}`}>
        {selected ? (
          <TopicDetail key={selected.slug} topic={selected} onBack={() => setSelectedSlug(null)} />
        ) : (
          <p className="text-sm text-slate-400 p-6">Pick a lesson to start.</p>
        )}
      </div>
    </div>
  );
};

const TopicDetail: React.FC<{ topic: GrammarTopic; onBack: () => void }> = ({ topic, onBack }) => {
  const [drillIndex, setDrillIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const record = useRecordPractice();
  const markDone = useMarkBlockDone();

  const drill = topic.drills[drillIndex];
  const roundDone = drillIndex >= topic.drills.length;
  const isCorrect = !!drill && answer.trim().toLowerCase() === drill.correctAnswer.trim().toLowerCase();

  const check = () => {
    if (!drill || !answer.trim() || checked) return;
    setChecked(true);
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    AudioService.playFeedbackSound(isCorrect ? 'correct' : 'error');
    record.mutate({ slug: topic.slug, correct: isCorrect });
  };

  const next = () => {
    setChecked(false);
    setAnswer('');
    const nextIndex = drillIndex + 1;
    setDrillIndex(nextIndex);
    if (nextIndex >= topic.drills.length) {
      AudioService.playFeedbackSound('complete');
      markDone(2);
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="lg:hidden flex items-center gap-1.5 text-sm font-bold text-slate-300 py-2">
        <ArrowLeft className="w-4 h-4" /> All lessons
      </button>

      <article className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4">
        <header>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Week {topic.weekNumber} · {topic.cefrLevel}
          </span>
          <h2 className="text-2xl font-black text-white mt-1">{topic.titleDe}</h2>
          <p className="text-sm text-slate-400">{topic.titleEn}</p>
        </header>

        <div className="text-[15px] text-slate-200 leading-relaxed whitespace-pre-line">{topic.explanationMd.replace(/\*\*|###\s?/g, '')}</div>

        {topic.formulaPattern && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200 font-semibold">{topic.formulaPattern}</div>
        )}

        {topic.visualTable && (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm border-collapse bg-slate-950/60 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-800/60 text-slate-300">
                  {topic.visualTable.headers.map(h => (
                    <th key={h} className="p-2.5 text-left whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {topic.visualTable.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((cell, j) => (
                      <td key={j} className={`p-2.5 whitespace-nowrap ${j === 0 ? 'font-semibold text-slate-100' : 'text-slate-300'}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {topic.commonMistakes && topic.commonMistakes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">Common mistakes</h3>
            {topic.commonMistakes.map((m, i) => (
              <div key={i} className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-sm">
                <div className="text-slate-400 line-through">{m.wrong}</div>
                <div className="text-emerald-300 font-bold">{m.correct}</div>
                <div className="text-slate-400 text-xs mt-1">{m.explanation}</div>
              </div>
            ))}
          </div>
        )}
      </article>

      {topic.drills.length > 0 && (
        <section className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3">
          {roundDone ? (
            <div className="text-center space-y-3 py-2">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-lg font-black text-white">
                {score.correct} / {score.total} correct
              </p>
              <button
                onClick={() => {
                  setDrillIndex(0);
                  setScore({ correct: 0, total: 0 });
                }}
                className="w-full py-3 rounded-xl bg-slate-800 text-slate-100 text-sm font-bold"
              >
                Practice again
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">
                  Drill {drillIndex + 1} of {topic.drills.length}
                </span>
                <span className="text-slate-500 uppercase">{drill.type}</span>
              </div>
              <p className="text-base font-semibold text-slate-100">{drill.prompt}</p>
              {drill.sentenceContext && <p className="text-sm text-slate-400 italic">{drill.sentenceContext}</p>}

              {drill.options && drill.options.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {drill.options.map(opt => {
                    const isAnswer = opt === drill.correctAnswer;
                    const picked = opt === answer;
                    return (
                      <button
                        key={opt}
                        onClick={() => !checked && setAnswer(opt)}
                        disabled={checked}
                        className={`min-h-[48px] p-3 rounded-xl text-sm font-semibold text-left border ${
                          checked && isAnswer
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : checked && picked
                            ? 'bg-rose-500/20 text-rose-200 border-rose-500/50'
                            : picked
                            ? 'bg-slate-700 text-white border-emerald-500'
                            : 'bg-slate-800 text-slate-100 border-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  type="text"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (checked ? next() : check())}
                  disabled={checked}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Type your answer"
                  className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 text-base text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              )}

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

              <button
                onClick={checked ? next : check}
                disabled={!checked && !answer.trim()}
                className="w-full min-h-[52px] rounded-xl bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-base"
              >
                {checked ? (drillIndex + 1 < topic.drills.length ? 'Next' : 'Finish') : 'Check'}
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
};
