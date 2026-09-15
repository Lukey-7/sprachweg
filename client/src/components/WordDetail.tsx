import React from 'react';
import { AlertTriangle, Volume2 } from 'lucide-react';
import { WordEntry } from '../types';
import { AudioService } from '../services/audio';

const GENDER_BADGE: Record<string, { label: string; cls: string }> = {
  der: { label: 'der · masculine', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  die: { label: 'die · feminine', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  das: { label: 'das · neuter', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

export const WordHeader: React.FC<{ word: WordEntry }> = ({ word }) => {
  const gender = word.gender ? GENDER_BADGE[word.gender] : undefined;
  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-3xl font-black text-white tracking-tight break-all">{word.lemma}</h2>
        <button
          onClick={() => AudioService.playGermanText(word.gender ? `${word.gender} ${word.lemma}` : word.lemma)}
          className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 shrink-0"
          aria-label="Play pronunciation"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {gender && <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${gender.cls}`}>{gender.label}</span>}
        <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300 capitalize">{word.pos}</span>
        {word.ipa && <span className="text-xs font-mono text-slate-400">{word.ipa}</span>}
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400">{word.cefrLevel}</span>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h3>
    {children}
  </section>
);

const CASES = [
  ['nominativ', 'Nominativ', 'text-blue-400'],
  ['akkusativ', 'Akkusativ', 'text-emerald-400'],
  ['dativ', 'Dativ', 'text-amber-400'],
  ['genitiv', 'Genitiv', 'text-purple-400'],
] as const;

const PERSONS = [
  ['ich', 'ich'],
  ['du', 'du'],
  ['er_sie_es', 'er/sie/es'],
  ['wir', 'wir'],
  ['ihr', 'ihr'],
  ['sie_Sie', 'sie/Sie'],
] as const;

/** Meaning, examples, tables and compound parts for a dictionary entry. */
export const WordBody: React.FC<{ word: WordEntry }> = ({ word }) => (
  <div className="space-y-5">
    <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
      <div className="text-lg font-bold text-slate-100">{word.meaningEn}</div>
      {word.secondaryMeanings && word.secondaryMeanings.length > 0 && <div className="text-sm text-slate-400">Also: {word.secondaryMeanings.join(', ')}</div>}
      {word.disambiguation && <div className="text-sm text-amber-200 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">{word.disambiguation}</div>}
      {word.falseFriends && word.falseFriends.toLowerCase() !== 'none' && (
        <div className="text-sm text-rose-200 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{word.falseFriends}</span>
        </div>
      )}
    </div>

    {word.examples && word.examples.length > 0 && (
      <Section title="Examples">
        {word.examples.map((ex, i) => (
          <div key={i} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-100">{ex.de}</div>
              <div className="text-sm text-slate-400 mt-0.5">{ex.en}</div>
            </div>
            <button onClick={() => AudioService.playGermanText(ex.de)} className="p-2 text-slate-400 shrink-0" aria-label="Listen">
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </Section>
    )}

    {word.nounTable && (
      <Section title="Declension">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse bg-slate-950/60 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400">
                <th className="p-2.5 text-left">Case</th>
                <th className="p-2.5 text-left">Singular</th>
                <th className="p-2.5 text-left">Plural</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {CASES.map(([key, label, cls]) => (
                <tr key={key}>
                  <td className={`p-2.5 font-semibold ${cls}`}>{label}</td>
                  <td className="p-2.5 text-slate-100 whitespace-nowrap">{word.nounTable![key]?.sg}</td>
                  <td className="p-2.5 text-slate-300 whitespace-nowrap">{word.nounTable![key]?.pl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    )}

    {word.verbTable && (
      <Section title="Conjugation">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <span>
            <span className="text-slate-400">Perfekt with </span>
            <strong className="text-emerald-400">{word.verbTable.perfekt.auxiliary}</strong>
          </span>
          <span>
            <span className="text-slate-400">Partizip II </span>
            <strong className="text-slate-100">{word.verbTable.perfekt.partizipII}</strong>
          </span>
          {word.verbTable.governedPreposition && (
            <span>
              <span className="text-slate-400">Takes </span>
              <strong className="text-amber-400">
                {word.verbTable.governedPreposition} + {word.verbTable.governedCase}
              </strong>
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse bg-slate-950/60 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400">
                <th className="p-2.5 text-left">Person</th>
                <th className="p-2.5 text-left">Präsens</th>
                <th className="p-2.5 text-left">Präteritum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {PERSONS.filter(([key]) => word.verbTable!.praesens?.[key]).map(([key, label]) => (
                <tr key={key}>
                  <td className="p-2.5 font-semibold text-slate-400 whitespace-nowrap">{label}</td>
                  <td className="p-2.5 text-slate-100 whitespace-nowrap">{word.verbTable!.praesens[key]}</td>
                  <td className="p-2.5 text-slate-300 whitespace-nowrap">{word.verbTable!.praeteritum?.[key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    )}

    {word.compoundParts && word.compoundParts.length > 0 && (
      <Section title="Built from">
        <div className="flex flex-wrap items-center gap-1.5">
          {word.compoundParts.map((p, i) => (
            <span key={i} className={`px-3 py-2 rounded-xl border text-sm ${p.isFugenelement ? 'border-dashed border-slate-700 text-slate-500' : 'bg-slate-950/60 border-slate-800'}`}>
              <span className="font-bold text-slate-100">{p.part}</span>
              {!p.isFugenelement && <span className="block text-xs text-slate-400">{p.meaningEn}</span>}
            </span>
          ))}
        </div>
        {word.gender && <p className="text-xs text-slate-400">A compound takes the gender of its last part, so it's “{word.gender}”.</p>}
      </Section>
    )}

    {word.collocations && word.collocations.length > 0 && (
      <Section title="Common phrases">
        <div className="flex flex-wrap gap-1.5">
          {word.collocations.map((c, i) => (
            <span key={i} className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">
              {c}
            </span>
          ))}
        </div>
      </Section>
    )}
  </div>
);
