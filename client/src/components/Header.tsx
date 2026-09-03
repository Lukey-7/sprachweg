import React from 'react';
import { Flame, Shield, Award, Sparkles, BookOpen } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onOpenPlacement: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onOpenPlacement }) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* App Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-0.5 shadow-lg shadow-emerald-950/40">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-emerald-400 text-lg">
              S
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">Sprachweg</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                A0→B2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">12-Month German Mastery</p>
          </div>
        </div>

        {/* Live Level & Stats Chips */}
        <div className="flex items-center gap-2">
          {/* CEFR Level Badge */}
          <button
            onClick={onOpenPlacement}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-750 border border-slate-700 transition-all text-xs font-semibold text-slate-200 shadow-sm"
            title="Current estimated CEFR level (Tap for Placement Test)"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>{user.activeLevel.replace('_', ' ')}</span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">W{user.currentWeek}</span>
          </button>

          {/* Streak Chip with Freeze Protection */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{user.streakCount}d</span>
            {user.freezeTokens > 0 && (
              <span className="flex items-center text-[10px] text-emerald-400 ml-0.5" title={`${user.freezeTokens} Streak Freeze Tokens active`}>
                <Shield className="w-3 h-3 fill-emerald-400/20" />
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
