import { useCallback, useEffect, useRef, useState } from 'react';

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

const RecognitionCtor: (new () => Recognition) | undefined =
  typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined;

export const speechRecognitionSupported = !!RecognitionCtor;

/** German speech-to-text using the browser's Web Speech API (Chrome/Edge/Android; limited on iOS). */
export function useSpeechRecognition(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => () => recRef.current?.abort(), []);

  const start = useCallback(() => {
    if (!RecognitionCtor) return;
    setError(null);
    setInterim('');
    const rec = new RecognitionCtor();
    rec.lang = 'de-DE';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = e => {
      let partial = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) onFinalRef.current(r[0].transcript.trim());
        else partial += r[0].transcript;
      }
      setInterim(partial);
    };
    rec.onerror = e => {
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone permission was denied.',
        'no-speech': "Didn't hear anything. Try again.",
        network: 'Speech recognition needs an internet connection.',
      };
      setError(messages[e.error] ?? `Speech recognition error: ${e.error}`);
    };
    rec.onend = () => {
      setListening(false);
      setInterim('');
    };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => recRef.current?.stop(), []);

  return { supported: speechRecognitionSupported, listening, interim, error, start, stop };
}
