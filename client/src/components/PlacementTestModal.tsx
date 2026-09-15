import React, { useState } from 'react';
import { X, Award, CheckCircle2, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { AudioService } from '../services/audio';
import { CEFRLevel } from '../types';
import { errorMessage, useUpdateLevel } from '../services/queries';

interface PlacementTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlacementTestModal: React.FC<PlacementTestModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [resultLevel, setResultLevel] = useState<CEFRLevel | null>(null);
  const updateLevel = useUpdateLevel();

  const close = () => {
    setCurrentStep(0);
    setAnswers({});
    setResultLevel(null);
    updateLevel.reset();
    onClose();
  };

  if (!isOpen) return null;

  const testQuestions = [
    {
      id: 0,
      skill: 'Leseverstehen (Reading)',
      prompt: 'Welcher Artikel ist korrekt? "Ich trinke gern ___ kalten Tee."',
      options: ['den', 'der', 'das', 'dem'],
      correct: 'den',
      level: 'A1'
    },
    {
      id: 1,
      skill: 'Hörverstehen (Listening)',
      prompt: 'Hören Sie zu und wählen Sie die richtige Bedeutung: "Wir sind gestern zu Hause geblieben."',
      audioText: 'Wir sind gestern zu Hause geblieben.',
      options: ['We stayed at home yesterday.', 'We went home yesterday.', 'We are staying at home today.'],
      correct: 'We stayed at home yesterday.',
      level: 'A2'
    },
    {
      id: 2,
      skill: 'Grammatik & Satzbau (Syntax)',
      prompt: 'Vervollständigen Sie den Nebensatz: "Er bleibt im Bett, weil er krank ___."',
      options: ['ist', 'ist er', 'wird', 'sei'],
      correct: 'ist',
      level: 'A2'
    },
    {
      id: 3,
      skill: 'Schreiben & Konnektoren (B1)',
      prompt: 'Wählen Sie das passende Konjunktiv II Verb: "Wenn ich mehr Zeit hätte, ___ ich mehr reisen."',
      options: ['würde', 'werde', 'habe', 'konnte'],
      correct: 'würde',
      level: 'B1'
    }
  ];

  const currentQ = testQuestions[currentStep];

  const handleSelectOption = (opt: string) => {
    setAnswers(prev => ({ ...prev, [currentStep]: opt }));
    AudioService.playFeedbackSound('click');
  };

  const handleNext = () => {
    if (currentStep < testQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate score
      let score = 0;
      testQuestions.forEach((q, idx) => {
        if (answers[idx] === q.correct) score += 1;
      });

      // Four questions can only separate broad bands, so the estimate stays conservative.
      let calculated: CEFRLevel = 'A1';
      if (score === 4) calculated = 'B1_START';
      else if (score === 2) calculated = 'A2';
      else calculated = 'A1';

      setResultLevel(calculated);
      AudioService.playFeedbackSound('complete');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-white">Placement check</h2>
          </div>
          <button onClick={close} className="p-2 text-slate-400 hover:text-white rounded-xl" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!resultLevel ? (
            <>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-emerald-400 uppercase">{currentQ.skill}</span>
                <span>Question {currentStep + 1} of {testQuestions.length}</span>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-sm font-bold text-slate-100">{currentQ.prompt}</p>

                {currentQ.audioText && (
                  <button
                    onClick={() => AudioService.playGermanText(currentQ.audioText!)}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 text-xs font-bold flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" /> Play Audio
                  </button>
                )}

                <div className="space-y-2 pt-2">
                  {currentQ.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full min-h-[48px] p-3 rounded-xl text-sm font-semibold text-left transition-all border ${
                        answers[currentStep] === opt
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!answers[currentStep]}
                  className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow transition-all"
                >
                  {currentStep < testQuestions.length - 1 ? 'Next Question →' : 'Submit & Calculate Level'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white">Estimated level</h3>
              <div className="text-3xl font-black text-emerald-400">{resultLevel.replace('_', ' ')}</div>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                A rough estimate from {testQuestions.length} questions. Apply it to set your level, or keep your current one.
              </p>
              {updateLevel.isError && <p className="text-sm text-rose-300">{errorMessage(updateLevel.error)}</p>}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={close} className="min-h-[48px] rounded-2xl bg-slate-800 text-slate-100 font-bold text-sm">
                  Keep current
                </button>
                <button
                  onClick={() => updateLevel.mutate(resultLevel, { onSuccess: close })}
                  disabled={updateLevel.isPending}
                  className="min-h-[48px] rounded-2xl bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-sm"
                >
                  {updateLevel.isPending ? 'Saving…' : 'Apply level'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
