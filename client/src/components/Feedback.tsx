import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FlaskConical, RefreshCw, WifiOff, XCircle } from 'lucide-react';
import { errorMessage } from '../services/queries';

// ── Toasts ────────────────────────────────────────────────────────────────

type ToastKind = 'success' | 'error';
interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

const ToastContext = createContext<(kind: ToastKind, text: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-2), { id, kind, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), kind === 'error' ? 5000 : 2500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="fixed left-0 right-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-md w-full flex items-start gap-2 px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl border animate-in slide-in-from-bottom-2 duration-200 ${
              t.kind === 'success'
                ? 'bg-emerald-950 text-emerald-200 border-emerald-500/40'
                : 'bg-rose-950 text-rose-200 border-rose-500/40'
            }`}
          >
            {t.kind === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> : <XCircle className="w-5 h-5 shrink-0 text-rose-400" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ── Panels ────────────────────────────────────────────────────────────────

export const LoadingPanel: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400" role="status">
    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    <p className="text-sm font-semibold">{label}</p>
  </div>
);

export const ErrorPanel: React.FC<{ error: unknown; onRetry?: () => void; title?: string }> = ({
  error,
  onRetry,
  title = "Couldn't load this",
}) => (
  <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3" role="alert">
    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-rose-200">{title}</p>
      <p className="text-sm text-rose-300/90 mt-0.5 break-words">{errorMessage(error)}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 text-xs font-bold"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Retry
      </button>
    )}
  </div>
);

/** Shown next to AI output that came from the offline mock rather than Gemini. */
export const MockNotice: React.FC = () => (
  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
    <FlaskConical className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
    <span>
      <strong>Sample output.</strong> The AI is in mock mode, so this is canned data, not an analysis of your input. Add a
      Gemini API key to get real results.
    </span>
  </div>
);

export const OfflineBanner: React.FC = () => {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online) return null;
  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4" /> Offline: showing saved content. Reviews and AI tools need a connection.
    </div>
  );
};

/** Two-option switch used by tabs that group related tools. */
export const Segmented = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) => (
  <div className="grid gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }} role="tablist">
    {options.map(o => (
      <button
        key={o.id}
        role="tab"
        aria-selected={value === o.id}
        onClick={() => onChange(o.id)}
        className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
          value === o.id ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);
