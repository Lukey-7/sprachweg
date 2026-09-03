import React, { useEffect, useRef } from 'react';

interface WaveformDisplayProps {
  isRecording: boolean;
  score?: number;
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({ isRecording, score }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Draw background grid lines
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Dynamic waveform bars
      const numBars = 36;
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4;
        if (isRecording) {
          const wave = Math.sin(phase + i * 0.35) * Math.cos(phase * 0.7 + i * 0.2);
          barHeight = Math.max(4, Math.abs(wave) * (height * 0.45));
        } else if (score) {
          barHeight = Math.max(4, (Math.sin(i * 0.4) * 0.5 + 0.5) * (height * 0.35));
        }

        const x = i * (barWidth + 2);
        const y = centerY - barHeight / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isRecording) {
          gradient.addColorStop(0, '#34d399');
          gradient.addColorStop(1, '#059669');
        } else {
          gradient.addColorStop(0, '#38bdf8');
          gradient.addColorStop(1, '#0284c7');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      phase += 0.08;
      if (isRecording) {
        animationId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isRecording, score]);

  return (
    <div className="w-full bg-slate-950/80 rounded-2xl p-3 border border-slate-800 flex flex-col items-center">
      <div className="w-full flex items-center justify-between text-[11px] text-slate-400 font-medium mb-2 px-1">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'}`} />
          {isRecording ? 'Listening (Web Audio Stream)...' : 'Audio Spectrum Ready'}
        </span>
        <span>44.1 kHz • PCM Mono</span>
      </div>
      <canvas
        ref={canvasRef}
        width={320}
        height={64}
        className="w-full h-16 rounded-xl bg-slate-900/50"
      />
    </div>
  );
};
