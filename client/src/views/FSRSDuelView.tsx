import React, { useState } from 'react';
import { Brain, Volume2, Check, RefreshCw, Eye, Sparkles, Layers, Award } from 'lucide-react';
import { Card } from '../types';
import { ApiService } from '../services/api';
import { AudioService } from '../services/audio';

interface FSRSDuelViewProps {
  cards: Card[];
  onReviewCard: (cardId: string, rating: 1 | 2 | 3 | 4) => void;
  onOpenWordLookup: (word: string) => void;
}

export const FSRSDuelView: React.FC<FSRSDuelViewProps> = ({ cards, onReviewCard, onOpenWordLookup }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const currentCard: Card | undefined = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(true);
    AudioService.playFeedbackSound('click');
  };

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    if (!currentCard) return;

    if (rating === 1) AudioService.playFeedbackSound('error');
    else AudioService.playFeedbackSound('correct');

    onReviewCard(currentCard.id, rating);
    setIsFlipped(false);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSessionCompleted(true);
      AudioService.playFeedbackSound('complete');
    }
  };

  const handlePlayAudio = () => {
    if (currentCard) {
      AudioService.playGermanText(currentCard.contextSentence || currentCard.prompt || currentCard.answer);
    }
  };

  if (sessionCompleted || !currentCard) {
    return (
      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl text-center space-y-4 max-w-lg mx-auto mt-8 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
          <Award className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Daily FSRS Queue Clear!</h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
          You reviewed all scheduled cards for today with optimal memory retention parameters. Great work!
        </p>
        <button
          onClick={() => {
            setCurrentIndex(0);
            setSessionCompleted(false);
            setIsFlipped(false);
          }}
          className="py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
        >
          Review Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-xl mx-auto">
      {/* Header Bar */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white">FSRS Memory Review</h1>
            <p className="text-[11px] text-slate-400">Card {currentIndex + 1} of {cards.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold border border-slate-700">
            {currentCard.cardType.replace('_', ' ')}
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
            Reps: {currentCard.reps}
          </span>
        </div>
      </div>

      {/* Flashcard Body */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 min-h-[320px] flex flex-col justify-between relative overflow-hidden transition-all">
        {/* Top Info */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-400 uppercase tracking-wider">
            {isFlipped ? 'Back (Answer & Context)' : 'Front (Prompt)'}
          </span>
          <button
            onClick={handlePlayAudio}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-750 text-emerald-400"
            title="Listen to audio"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Center Content */}
        <div className="my-auto py-6 text-center space-y-4">
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {currentCard.prompt}
          </div>

          {currentCard.contextSentence && (
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto italic bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              "{currentCard.contextSentence}"
            </p>
          )}

          {isFlipped && (
            <div className="pt-4 border-t border-slate-800/80 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-xs uppercase font-bold text-emerald-400 mb-1">Answer</div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-300">
                {currentCard.answer}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div>
          {!isFlipped ? (
            <button
              onClick={handleFlip}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Eye className="w-4 h-4" /> Reveal Answer (Space)
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-2 animate-in slide-in-from-bottom-2 duration-200">
              {/* 1: Again */}
              <button
                onClick={() => handleRate(1)}
                className="p-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 flex flex-col items-center justify-center transition-all active:scale-95"
              >
                <span className="font-extrabold text-xs">Again</span>
                <span className="text-[10px] text-rose-400 mt-0.5">10 min</span>
              </button>

              {/* 2: Hard */}
              <button
                onClick={() => handleRate(2)}
                className="p-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex flex-col items-center justify-center transition-all active:scale-95"
              >
                <span className="font-extrabold text-xs">Hard</span>
                <span className="text-[10px] text-amber-400 mt-0.5">1.2 d</span>
              </button>

              {/* 3: Good */}
              <button
                onClick={() => handleRate(3)}
                className="p-3 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 flex flex-col items-center justify-center transition-all active:scale-95"
              >
                <span className="font-extrabold text-xs">Good</span>
                <span className="text-[10px] text-blue-400 mt-0.5">3.5 d</span>
              </button>

              {/* 4: Easy */}
              <button
                onClick={() => handleRate(4)}
                className="p-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex flex-col items-center justify-center transition-all active:scale-95"
              >
                <span className="font-extrabold text-xs">Easy</span>
                <span className="text-[10px] text-emerald-400 mt-0.5">7.0 d</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
