import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';

interface WordOrderMapProps {
  pos1: string;
  verb2: string;
  mittelfeld: string;
  verbFinal?: string;
  isNebensatz?: boolean;
}

export const WordOrderMap: React.FC<WordOrderMapProps> = ({
  pos1,
  verb2,
  mittelfeld,
  verbFinal,
  isNebensatz = false
}) => {
  return (
    <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Satzklammer & Word Order Topology</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400">
          {isNebensatz ? 'Nebensatz (Verb-Ende)' : 'Hauptsatz (V2-Regel)'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
        {/* Position 1 / Vorfeld */}
        <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
            Pos 1 (Vorfeld)
          </div>
          <div className="font-semibold text-slate-100 break-words">{pos1 || '—'}</div>
          <div className="text-[9px] text-slate-400 mt-1">Topic / Subject / Time</div>
        </div>

        {/* Position 2 / Linke Satzklammer */}
        <div className="bg-emerald-950/40 rounded-xl p-2.5 border border-emerald-500/30 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500" />
          <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-1">
            Pos 2 (V2 Finite Verb)
          </div>
          <div className="font-bold text-emerald-400 text-sm break-words">{verb2 || '—'}</div>
          <div className="text-[9px] text-emerald-300/70 mt-1">Konjugiertes Verb</div>
        </div>

        {/* Mittelfeld */}
        <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
            Mittelfeld (TeKaMoLo)
          </div>
          <div className="font-medium text-slate-200 break-words">{mittelfeld || '—'}</div>
          <div className="text-[9px] text-slate-400 mt-1">Objects / Adverbials</div>
        </div>

        {/* Rechte Satzklammer / Verb-Final */}
        <div className="bg-purple-950/40 rounded-xl p-2.5 border border-purple-500/30 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-500" />
          <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">
            Satzende (Klammer)
          </div>
          <div className="font-bold text-purple-400 text-sm break-words">{verbFinal || '—'}</div>
          <div className="text-[9px] text-purple-300/70 mt-1">Partizip / Infinitiv / Prefix</div>
        </div>
      </div>
    </div>
  );
};
