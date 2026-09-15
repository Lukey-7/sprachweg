import React from 'react';
import { Award, Flame } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onOpenProgress: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onOpenProgress }) => (
  <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
    <div className="max-w-5xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-0.5">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-emerald-400 text-lg">S</div>
        </div>
        <span className="font-extrabold text-base tracking-tight text-white">Sprachweg</span>
      </div>

      <button
        onClick={onOpenProgress}
        className="flex items-center gap-2 rounded-xl px-1 py-1 active:bg-slate-800"
        aria-label={`Level ${user.activeLevel}, ${user.streakCount} day streak. Open progress.`}
      >
        <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200">
          <Award className="w-4 h-4 text-amber-400" />
          {user.activeLevel.replace('_', ' ')}
        </span>
        <span
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold ${
            user.streakCount > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          <Flame className={`w-4 h-4 ${user.streakCount > 0 ? 'text-amber-400 fill-amber-400' : ''}`} />
          {user.streakCount}d
        </span>
      </button>
    </div>
  </header>
);
