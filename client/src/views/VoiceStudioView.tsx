import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Mic, Plus, RefreshCw, Square, Volume2 } from 'lucide-react';
import { Card, SpeakingDebrief } from '../types';
import { api } from '../services/api';
import { AudioService } from '../services/audio';
import { useMarkBlockDone, useStories } from '../services/queries';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { GermanQuickBar } from '../components/GermanQuickBar';
import { ErrorPanel, MockNotice, Segmented } from '../components/Feedback';

type NewCard = Parameters<typeof api.addCard>[0];
type Mode = 'talk' | 'shadow' | 'dictation';

interface VoiceStudioViewProps {
  onAddCard: (card: NewCard) => Promise<Card | null>;
}

const SCENARIOS = [
  { id: 'free_conversation', title: 'Free talk', prompt: 'Erzähl mir von deinem Tag.', level: 'A1' },
  { id: 'baeckerei', title: 'At the bakery', prompt: 'Guten Morgen! Was darf es sein?', level: 'A1' },
  { id: 'arzt', title: 'At the doctor', prompt: 'Was fehlt Ihnen denn?', level: 'A2' },
  { id: 'buergeramt', title: 'Registering an address', prompt: 'Sie möchten sich anmelden. Haben Sie alle Unterlagen dabei?', level: 'B1' },
  { id: 'wohnung', title: 'Flat viewing', prompt: 'Die Wohnung ist 60 Quadratmeter groß. Haben Sie Fragen?', level: 'B1' },
  { id: 'interview', title: 'Job interview', prompt: 'Erzählen Sie etwas über Ihre Berufserfahrung.', level: 'B2' },
];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[.,!?;:"„“«»]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Word-level comparison of a typed or spoken attempt against the target sentence. */
export function compareWords(target: string, attempt: string) {
  const want = target.split(/\s+/).filter(Boolean);
  const got = new Set(normalize(attempt).split(' '));
  const exact = new Set(attempt.split(/\s+/).map(w => w.replace(/[.,!?;:"„“«»]/g, '')));
  return want.map(word => {
    const bare = word.replace(/[.,!?;:"„“«»]/g, '');
    return { word, heard: got.has(bare.toLowerCase()), exactCase: exact.has(bare) };
  });
}

export const VoiceStudioView: React.FC<VoiceStudioViewProps> = ({ onAddCard }) => {
  const [mode, setMode] = useState<Mode>('talk');

  return (
    <div className="space-y-4 pb-4">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { id: 'talk', label: 'Talk' },
          { id: 'shadow', label: 'Shadow' },
          { id: 'dictation', label: 'Dictation' },
        ]}
      />
      {mode === 'talk' && <TalkMode onAddCard={onAddCard} />}
      {mode === 'shadow' && <ShadowMode />}
      {mode === 'dictation' && <DictationMode />}
    </div>
  );
};

const useTargetSentences = () => {
  const stories = useStories();
  return useMemo(
    () =>
      (stories.data ?? [])
        .flatMap(s => s.paragraphs.flatMap(p => p.textDe.match(/[^.!?]+[.!?]/g) ?? [p.textDe]))
        .map(s => s.trim())
        .filter(s => s.split(' ').length >= 4 && s.split(' ').length <= 16),
    [stories.data]
  );
};

const MicButton: React.FC<{ listening: boolean; onStart: () => void; onStop: () => void }> = ({ listening, onStart, onStop }) => (
  <button
    onClick={listening ? onStop : onStart}
    className={`w-full min-h-[64px] rounded-2xl font-bold text-base flex items-center justify-center gap-2 ${
      listening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-100 border border-slate-700'
    }`}
  >
    {listening ? <Square className="w-5 h-5 fill-white" /> : <Mic className="w-6 h-6" />}
    {listening ? 'Stop' : 'Tap and speak German'}
  </button>
);

const TalkMode: React.FC<{ onAddCard: VoiceStudioViewProps['onAddCard'] }> = ({ onAddCard }) => {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<{ debrief: SpeakingDebrief; mock: boolean } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const markDone = useMarkBlockDone();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeechRecognition(text => setTranscript(t => (t ? `${t} ${text}` : text)));

  const scenario = SCENARIOS.find(s => s.id === scenarioId)!;

  const evaluate = async () => {
    if (!transcript.trim()) return;
    speech.stop();
    setIsEvaluating(true);
    setError(null);
    try {
      const { data, mock } = await api.evaluateSpeaking({
        mode: scenarioId === 'free_conversation' ? 'free_conversation' : 'roleplay',
        scenarioId,
        transcript: transcript.trim(),
        targetText: scenario.prompt,
      });
      setResult({ debrief: data, mock });
      if (!mock) markDone(4);
      AudioService.playFeedbackSound('complete');
    } catch (e) {
      setError(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <>
      <section className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => {
                setScenarioId(s.id);
                setResult(null);
              }}
              className={`shrink-0 px-3 py-2 rounded-xl text-sm font-bold border ${
                s.id === scenarioId ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {s.title} <span className="opacity-70">{s.level}</span>
            </button>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
          <p className="text-base font-semibold text-slate-100">“{scenario.prompt}”</p>
          <button onClick={() => AudioService.playGermanText(scenario.prompt)} className="p-2.5 rounded-full bg-slate-800 text-emerald-400 shrink-0" aria-label="Listen">
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {speech.supported ? (
          <MicButton listening={speech.listening} onStart={speech.start} onStop={speech.stop} />
        ) : (
          <p className="text-sm text-slate-400">Speech recognition isn't available in this browser. Type your answer instead, or use Chrome.</p>
        )}
        {speech.error && <p className="text-sm text-rose-300">{speech.error}</p>}

        <div>
          <textarea
            ref={inputRef}
            value={speech.interim ? `${transcript} ${speech.interim}`.trim() : transcript}
            onChange={e => setTranscript(e.target.value)}
            readOnly={speech.listening}
            rows={3}
            lang="de"
            placeholder="Your answer appears here. You can also type or correct it."
            className="w-full bg-slate-950 p-3.5 rounded-2xl border border-slate-700 text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
          />
          <GermanQuickBar inputRef={inputRef} className="mt-2" />
        </div>

        <button
          onClick={evaluate}
          disabled={isEvaluating || !transcript.trim()}
          className="w-full min-h-[52px] rounded-2xl bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-base"
        >
          {isEvaluating ? 'Checking…' : 'Get feedback'}
        </button>
      </section>

      {error != null && <ErrorPanel title="Couldn't get feedback" error={error} onRetry={evaluate} />}

      {result && (
        <section className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-5">
          {result.mock && <MockNotice />}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white">Feedback</h2>
            <span className="text-2xl font-black text-emerald-400">{result.debrief.overallScore}%</span>
          </div>

          {result.debrief.successPoints.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">What went well</h3>
              {result.debrief.successPoints.map((pt, i) => (
                <div key={i} className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-sm text-emerald-100 flex gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          )}

          {result.debrief.corrections.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">Corrections</h3>
              {result.debrief.corrections.map((c, i) => (
                <div key={i} className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-sm space-y-1">
                  <div className="text-slate-400 line-through">{c.learnerSaid}</div>
                  <div className="text-emerald-300 font-bold flex items-center gap-2">
                    {c.nativeRecast}
                    <button onClick={() => AudioService.playGermanText(c.nativeRecast)} className="text-slate-400" aria-label="Listen">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-slate-300 text-xs">{c.rule}</div>
                </div>
              ))}
            </div>
          )}

          {result.debrief.minedWords.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Useful words</h3>
              {result.debrief.minedWords.map(w => (
                <div key={w.word} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-100">{w.word}</div>
                    <div className="text-sm text-slate-400">{w.meaning}</div>
                  </div>
                  <button
                    disabled={result.mock || added.has(w.word)}
                    onClick={async () => {
                      const card = await onAddCard({ cardType: 'recognition', prompt: w.word, answer: w.meaning });
                      if (card) setAdded(s => new Set(s).add(w.word));
                    }}
                    className="shrink-0 min-h-[40px] px-3 rounded-lg bg-emerald-500 disabled:opacity-40 text-slate-950 text-sm font-bold flex items-center gap-1"
                  >
                    {added.has(w.word) ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {added.has(w.word) ? 'Added' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
};

const WordDiff: React.FC<{ target: string; attempt: string }> = ({ target, attempt }) => {
  const words = compareWords(target, attempt);
  const score = Math.round((words.filter(w => w.heard).length / Math.max(1, words.length)) * 100);
  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
      <div className="text-sm font-bold text-slate-300">{score}% of words matched</div>
      <div className="flex flex-wrap gap-1.5 text-base">
        {words.map((w, i) => (
          <span
            key={i}
            className={`px-1.5 py-0.5 rounded ${
              !w.heard ? 'bg-rose-500/20 text-rose-200' : !w.exactCase ? 'bg-amber-500/20 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'
            }`}
          >
            {w.word}
          </span>
        ))}
      </div>
      <p className="text-xs text-slate-500">Red: missing or misspelled · Amber: check capitalisation</p>
    </div>
  );
};

const ShadowMode: React.FC = () => {
  const sentences = useTargetSentences();
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState('');
  const speech = useSpeechRecognition(text => setAttempt(text));
  const target = sentences[index % Math.max(1, sentences.length)];

  if (!speech.supported) {
    return <p className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-300">Shadowing needs speech recognition, which this browser doesn't support. Try Chrome on Android or desktop.</p>;
  }
  if (!target) return null;

  return (
    <section className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-4">
      <p className="text-sm text-slate-400">Listen, then repeat the sentence out loud.</p>
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
        <p className="text-lg font-semibold text-slate-100">{target}</p>
        <button onClick={() => AudioService.playGermanText(target, 0.85)} className="p-3 rounded-full bg-emerald-500 text-slate-950 shrink-0" aria-label="Listen">
          <Volume2 className="w-5 h-5" />
        </button>
      </div>
      <MicButton listening={speech.listening} onStart={() => { setAttempt(''); speech.start(); }} onStop={speech.stop} />
      {speech.error && <p className="text-sm text-rose-300">{speech.error}</p>}
      {speech.interim && <p className="text-sm text-slate-400 italic">{speech.interim}</p>}
      {attempt && !speech.listening && <WordDiff target={target} attempt={attempt} />}
      <button
        onClick={() => {
          setIndex(i => i + 1);
          setAttempt('');
        }}
        className="w-full py-3 rounded-2xl bg-slate-800 text-slate-100 font-bold text-sm flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" /> Next sentence
      </button>
    </section>
  );
};

const DictationMode: React.FC = () => {
  const sentences = useTargetSentences();
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const target = sentences[index % Math.max(1, sentences.length)];

  if (!target) return null;
  const perfect = checked && input.trim().replace(/\s+/g, ' ') === target;

  return (
    <section className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-4">
      <button
        onClick={() => AudioService.playGermanText(target, 0.85)}
        className="w-full min-h-[64px] rounded-2xl bg-emerald-500 text-slate-950 font-bold text-base flex items-center justify-center gap-2"
      >
        <Volume2 className="w-6 h-6" /> Play sentence
      </button>
      <textarea
        ref={inputRef}
        value={input}
        onChange={e => {
          setInput(e.target.value);
          setChecked(false);
        }}
        rows={3}
        lang="de"
        autoCapitalize="sentences"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Type what you hear"
        className="w-full bg-slate-950 p-3.5 rounded-2xl border border-slate-700 text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
      />
      <GermanQuickBar inputRef={inputRef} />
      {checked &&
        (perfect ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm flex gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Perfekt, every letter right.
          </div>
        ) : (
          <>
            <WordDiff target={target} attempt={input} />
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 flex gap-2">
              <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" /> {target}
            </div>
          </>
        ))}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setIndex(i => i + 1);
            setInput('');
            setChecked(false);
          }}
          className="min-h-[52px] rounded-2xl bg-slate-800 text-slate-100 font-bold text-sm"
        >
          Skip
        </button>
        <button onClick={() => setChecked(true)} disabled={!input.trim()} className="min-h-[52px] rounded-2xl bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-sm">
          Check
        </button>
      </div>
    </section>
  );
};
