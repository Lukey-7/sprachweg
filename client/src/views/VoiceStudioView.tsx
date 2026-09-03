import React, { useState } from 'react';
import { Mic, Volume2, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Layers, Plus, Check } from 'lucide-react';
import { SpeakingDebrief } from '../types';
import { ApiService } from '../services/api';
import { AudioService } from '../services/audio';
import { WaveformDisplay } from '../components/WaveformDisplay';
import { GermanQuickBar } from '../components/GermanQuickBar';

interface VoiceStudioViewProps {
  onAddCard: (card: any) => void;
}

export const VoiceStudioView: React.FC<VoiceStudioViewProps> = ({ onAddCard }) => {
  const [activeMode, setActiveMode] = useState<'free' | 'roleplay' | 'pronunciation' | 'shadowing' | 'dictation'>('roleplay');
  const [scenarioId, setScenarioId] = useState<string>('buergeramt');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('Guten Tag, ich möchte meine neue Wohnung beim Bürgeramt anmelden. Hier sind mein Reisepass und die Bestätigung.');
  const [dictationInput, setDictationInput] = useState<string>('');
  const [dictationResult, setDictationResult] = useState<{ isCorrect: boolean; feedback: string } | null>(null);
  const [debrief, setDebrief] = useState<SpeakingDebrief | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [minedAdded, setMinedAdded] = useState<Record<string, boolean>>({});

  const scenarios = [
    { id: 'buergeramt', title: 'Bürgeramt (City Registration)', desc: 'Registering your residence with official paperwork', level: 'B1' },
    { id: 'baeckerei', title: 'Bäckerei (Bakery Order)', desc: 'Ordering specific pastries and paying in cash/card', level: 'A1' },
    { id: 'arzt', title: 'Beim Arzt (Doctor Consultation)', desc: 'Describing physical symptoms and scheduling appointments', level: 'A2' },
    { id: 'wohnung', title: 'Wohnungsbesichtigung (Flat Viewing)', desc: 'Inquiring about rent, Nebenkosten, and lease terms', level: 'B1' },
    { id: 'interview', title: 'Vorstellungsgespräch (Job Interview)', desc: 'Presenting your career background and professional skills', level: 'B2' },
  ];

  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      handleEvaluate();
    } else {
      setIsRecording(true);
      AudioService.playFeedbackSound('click');
    }
  };

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    try {
      const result = await ApiService.evaluateSpeaking(activeMode, scenarioId, transcript);
      setDebrief(result);
      AudioService.playFeedbackSound('complete');
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCheckDictation = () => {
    const target = 'Die amtliche Meldebestätigung ist für alle Behörden erforderlich.';
    const isCorrect = dictationInput.trim() === target;

    if (isCorrect) {
      AudioService.playFeedbackSound('correct');
      setDictationResult({ isCorrect: true, feedback: 'Perfekt! Capitalization, umlauts, and spelling are 100% accurate.' });
    } else {
      AudioService.playFeedbackSound('error');
      setDictationResult({ isCorrect: false, feedback: `Notice target: "${target}" — Pay attention to noun capitalization (Meldebestätigung, Behörden) and ä.` });
    }
  };

  const handleAddMinedWord = (word: any) => {
    onAddCard({
      cardType: 'recognition',
      prompt: word.word,
      answer: word.meaning,
      contextSentence: `Wortschatz aus Sprechstunde: ${word.word}`,
    });
    setMinedAdded(prev => ({ ...prev, [word.word]: true }));
    AudioService.playFeedbackSound('correct');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Voice Mode Selector */}
      <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Voice & Conversation Studio</h1>
            <p className="text-xs text-slate-400">Gemini Live audio interaction, phoneme coach, roleplay & dictation</p>
          </div>
        </div>

        {/* 5 Mode Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'free', label: 'Free Tutor' },
            { id: 'roleplay', label: 'Role-Play' },
            { id: 'pronunciation', label: 'Phoneme Coach' },
            { id: 'shadowing', label: 'Shadowing' },
            { id: 'dictation', label: 'Dictation' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setActiveMode(m.id as any);
                setDebrief(null);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center ${
                activeMode === m.id
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
        {activeMode === 'roleplay' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Scenario Selection
              </span>
              <span className="text-xs text-slate-400">Scored on task completion</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {scenarios.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setScenarioId(s.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    scenarioId === s.id
                      ? 'bg-emerald-950/30 border-emerald-500/50 ring-1 ring-emerald-500/20'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-100 text-xs">{s.title}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 border border-amber-500/20">
                      {s.level}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeMode === 'dictation' ? (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase">Target Audio</div>
                <div className="text-sm font-semibold text-slate-200 mt-1">Listen and transcribe accurately:</div>
              </div>
              <button
                onClick={() => AudioService.playGermanText('Die amtliche Meldebestätigung ist für alle Behörden erforderlich.')}
                className="p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow flex items-center gap-2 text-xs"
              >
                <Volume2 className="w-4 h-4" /> Play Audio
              </button>
            </div>

            <textarea
              value={dictationInput}
              onChange={(e) => setDictationInput(e.target.value)}
              placeholder="Type German audio transcription here..."
              rows={3}
              className="w-full bg-slate-950 p-3.5 rounded-2xl border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />

            <GermanQuickBar onInsertChar={(c) => setDictationInput(prev => prev + c)} />

            {dictationResult && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                  dictationResult.isCorrect
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                }`}
              >
                {dictationResult.isCorrect ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />}
                <span>{dictationResult.feedback}</span>
              </div>
            )}

            <button
              onClick={handleCheckDictation}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-all"
            >
              Verify Dictation Spelling
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live Web Audio Waveform */}
            <WaveformDisplay isRecording={isRecording} score={debrief?.overallScore} />

            {/* Speaking Transcript Box */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Spoken Transcript (STT)</span>
                <button
                  onClick={() => AudioService.playGermanText(transcript)}
                  className="text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Replay Speech
                </button>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={2}
                className="w-full bg-transparent text-sm font-medium text-slate-100 focus:outline-none resize-none"
              />
            </div>

            {/* Record / Evaluate Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleToggleRecord}
                className={`flex-1 py-3.5 px-4 rounded-2xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700'
                }`}
              >
                <Mic className="w-4 h-4" />
                {isRecording ? 'Stop Recording & Analyze' : 'Start Speech Recording'}
              </button>

              <button
                onClick={handleEvaluate}
                disabled={isEvaluating || !transcript.trim()}
                className="py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg transition-all"
              >
                {isEvaluating ? 'Evaluating...' : 'Evaluate Session'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3-3-5 Session Debrief Card */}
      {debrief && (
        <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5 animate-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Session Debrief Report
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">3-3-5 Performance Teardown</h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-400">{debrief.overallScore}%</div>
              <div className="text-[10px] text-slate-400 font-semibold">Fluency: {debrief.fluencyScore}%</div>
            </div>
          </div>

          {/* Phoneme Coach Breakdown */}
          {debrief.phonemeScores && debrief.phonemeScores.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">German Phoneme Killers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {debrief.phonemeScores.map((p, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-100 text-xs">{p.phoneme} ({p.label})</span>
                      <span className="text-xs font-black text-emerald-400">{p.score}%</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{p.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3 Successes */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">3 Things Done Well</h3>
            <div className="space-y-1.5">
              {debrief.successPoints.map((pt, i) => (
                <div key={i} className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3 Corrections */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">3 Prioritized Corrections</h3>
            <div className="space-y-2">
              {debrief.corrections.map((c, i) => (
                <div key={i} className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-xs text-rose-200 space-y-1">
                  <div>You said: <span className="line-through text-slate-400 font-medium">{c.learnerSaid}</span></div>
                  <div className="text-emerald-400 font-bold">Native Recast: {c.nativeRecast}</div>
                  <div className="text-[11px] text-slate-400">💡 {c.rule}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5 Mined Vocabulary Words */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">5 Mined Words from What You Tried to Say</h3>
            <div className="space-y-1.5">
              {debrief.minedWords.map((w, idx) => (
                <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-100 text-xs">{w.word}</span>
                    {w.gender && <span className="text-[10px] text-blue-400 ml-1.5">({w.gender})</span>}
                    <div className="text-xs text-slate-400">{w.meaning}</div>
                  </div>
                  <button
                    onClick={() => handleAddMinedWord(w)}
                    disabled={minedAdded[w.word]}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      minedAdded[w.word]
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    }`}
                  >
                    {minedAdded[w.word] ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {minedAdded[w.word] ? 'Added' : 'Add Card'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
