import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Award, Brain, Eye, Volume2 } from 'lucide-react';
import { Card } from '../types';
import { AudioService } from '../services/audio';
import { ErrorPanel, LoadingPanel, useToast } from '../components/Feedback';
import { useQueryClient } from '@tanstack/react-query';
import { errorMessage, keys, useMarkBlockDone, useReviewPreview, useSubmitReview, useTodayCards } from '../services/queries';

interface FSRSDuelViewProps {
  onOpenWordLookup: (word: string) => void;
  onFinished: () => void;
}

type Rating = 1 | 2 | 3 | 4;

const RATINGS: { rating: Rating; label: string; key: string; cls: string }[] = [
  { rating: 1, label: 'Again', key: '1', cls: 'bg-rose-500/20 text-rose-200 border-rose-500/40' },
  { rating: 2, label: 'Hard', key: '2', cls: 'bg-amber-500/20 text-amber-200 border-amber-500/40' },
  { rating: 3, label: 'Good', key: '3', cls: 'bg-blue-500/20 text-blue-200 border-blue-500/40' },
  { rating: 4, label: 'Easy', key: '4', cls: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40' },
];

export function formatInterval(days: number | undefined): string {
  if (days === undefined || !Number.isFinite(days)) return '…';
  const minutes = days * 24 * 60;
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`;
  if (days < 1) return `${Math.round(minutes / 60)} h`;
  if (days < 30) return `${Math.round(days)} d`;
  if (days < 365) return `${Math.round(days / 30)} mo`;
  return `${(days / 365).toFixed(1)} y`;
}

export const FSRSDuelView: React.FC<FSRSDuelViewProps> = ({ onOpenWordLookup, onFinished }) => {
  const today = useTodayCards();
  // Snapshot of the queue for this round, so refetches don't reshuffle cards mid-review.
  const [round, setRound] = useState<Card[] | null>(null);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const shownAt = useRef(Date.now());

  const submit = useSubmitReview();
  const markDone = useMarkBlockDone();
  const toast = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (round === null && today.data) setRound(today.data.cards);
  }, [today.data, round]);

  const card = round?.[index];
  const preview = useReviewPreview(isFlipped ? card?.id : undefined);
  const finished = round !== null && index >= round.length;

  useEffect(() => {
    shownAt.current = Date.now();
  }, [card?.id]);

  useEffect(() => {
    if (finished && round && round.length > 0) {
      // Refresh the due count (nav badge, Today); this round's snapshot is unaffected.
      queryClient.invalidateQueries({ queryKey: keys.todayCards });
      markDone(1);
      AudioService.playFeedbackSound('complete');
    }
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const flip = useCallback(() => {
    setIsFlipped(true);
    AudioService.playFeedbackSound('click');
  }, []);

  const rate = useCallback(
    async (rating: Rating) => {
      if (!card || submit.isPending) return;
      try {
        await submit.mutateAsync({ cardId: card.id, rating, responseTimeMs: Date.now() - shownAt.current });
        AudioService.playFeedbackSound(rating === 1 ? 'error' : 'correct');
        setIsFlipped(false);
        setIndex(i => i + 1);
      } catch (e) {
        // The card stays on screen so the rating can be retried; nothing is lost.
        toast('error', `Review not saved: ${errorMessage(e)}`);
      }
    },
    [card, submit, toast]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!card || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!isFlipped && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        flip();
      } else if (isFlipped && ['1', '2', '3', '4'].includes(e.key)) {
        rate(Number(e.key) as Rating);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, isFlipped, flip, rate]);

  const startNextRound = async () => {
    const { data } = await today.refetch();
    setRound(data?.cards ?? []);
    setIndex(0);
    setIsFlipped(false);
  };

  if (today.isPending || round === null) return <LoadingPanel label="Loading your reviews…" />;
  if (today.isError) return <ErrorPanel error={today.error} onRetry={() => today.refetch()} />;

  if (finished || !card) {
    const reviewed = round.length;
    return (
      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <Award className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">{reviewed > 0 ? 'All caught up!' : 'Nothing to review'}</h2>
        <p className="text-sm text-slate-300">
          {reviewed > 0
            ? `You reviewed ${reviewed} card${reviewed === 1 ? '' : 's'}. Cards you marked "Again" come back shortly.`
            : 'No cards are due. Words you add from the Dictionary, Sentence Miner or Speak tab show up here.'}
        </p>
        <div className="flex flex-col gap-2">
          <button onClick={startNextRound} className="py-3 rounded-2xl bg-slate-800 text-slate-100 font-bold text-sm">
            Check for more cards
          </button>
          <button onClick={onFinished} className="py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm">
            Back to today
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-400" />
          <h1 className="text-lg font-black text-white">Review</h1>
        </div>
        <span className="text-sm font-semibold text-slate-400">
          {index + 1} / {round.length}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(index / round.length) * 100}%` }} />
      </div>

      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 min-h-[340px] flex flex-col">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider">
            {card.cardType.replace(/_/g, ' ')}
            {card.state === 'new' && <span className="ml-2 text-emerald-400">new</span>}
          </span>
          <button
            // The context sentence contains the answer for cloze cards, so it is only read after flipping.
            onClick={() => AudioService.playGermanText(isFlipped ? card.contextSentence || card.prompt : card.prompt.replace(/_+/g, ' '))}
            className="p-2.5 rounded-full bg-slate-800 text-emerald-400"
            aria-label="Listen"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        <div className="my-auto py-6 text-center space-y-4">
          {card.cardType === 'recognition' ? (
            <button onClick={() => onOpenWordLookup(card.prompt.replace(/^(der|die|das)\s+/i, ''))} className="text-3xl font-black text-white tracking-tight">
              {card.prompt}
            </button>
          ) : (
            <p className="text-2xl font-black text-white tracking-tight">{card.prompt}</p>
          )}

          {card.contextSentence && isFlipped && (
            <p className="text-sm text-slate-400 italic bg-slate-950/60 p-3 rounded-2xl border border-slate-800">“{card.contextSentence}”</p>
          )}

          {isFlipped && (
            <div className="pt-4 border-t border-slate-800">
              <div className="text-2xl font-bold text-emerald-300">{card.answer}</div>
            </div>
          )}
        </div>

        {!isFlipped ? (
          <button
            onClick={flip}
            className="w-full min-h-[56px] rounded-2xl bg-emerald-500 active:bg-emerald-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2"
          >
            <Eye className="w-5 h-5" /> Show answer
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map(r => (
              <button
                key={r.rating}
                onClick={() => rate(r.rating)}
                disabled={submit.isPending}
                className={`min-h-[64px] rounded-2xl border flex flex-col items-center justify-center disabled:opacity-50 ${r.cls}`}
              >
                <span className="font-extrabold text-sm">{r.label}</span>
                <span className="text-xs opacity-80 mt-0.5">{preview.data ? formatInterval(preview.data[r.rating]) : '…'}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="hidden sm:block text-center text-xs text-slate-500">Space to show · 1–4 to rate</p>
    </div>
  );
};
