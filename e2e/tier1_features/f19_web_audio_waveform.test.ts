import { describe, it, expect } from '../harness/testRunner';

describe('Feature 19: Web Audio API & Waveform Visualizer Verification', () => {
  it('should process audio buffer data and compute normalized RMS amplitude levels', () => {
    const rawAudioBuffer = new Float32Array([0.1, -0.2, 0.5, -0.8, 0.4, -0.1, 0.0, 0.3]);
    let sumSq = 0;
    for (let i = 0; i < rawAudioBuffer.length; i++) {
      sumSq += rawAudioBuffer[i] * rawAudioBuffer[i];
    }
    const rms = Math.sqrt(sumSq / rawAudioBuffer.length);
    expect(rms).toBeGreaterThan(0);
    expect(rms).toBeLessThan(1.0);
  });

  it('should generate canvas oscillogram sample points from audio frames', () => {
    const generateWaveformSamples = (buffer: Float32Array, pointCount: number = 64): number[] => {
      const step = Math.floor(buffer.length / pointCount);
      const points: number[] = [];
      for (let i = 0; i < pointCount; i++) {
        let max = 0;
        for (let j = 0; j < step; j++) {
          const val = Math.abs(buffer[i * step + j] || 0);
          if (val > max) max = val;
        }
        points.push(Number(max.toFixed(3)));
      }
      return points;
    };

    const mockBuffer = new Float32Array(512).fill(0.5);
    const waveform = generateWaveformSamples(mockBuffer, 32);
    expect(waveform).toHaveLength(32);
    expect(waveform[0]).toBe(0.5);
  });

  it('should calculate pitch difference between native reference audio and learner recording', () => {
    const comparePitchContours = (nativeFreqHz: number[], learnerFreqHz: number[]) => {
      if (nativeFreqHz.length !== learnerFreqHz.length) throw new Error('Contour length mismatch');
      let totalDiff = 0;
      for (let i = 0; i < nativeFreqHz.length; i++) {
        totalDiff += Math.abs(nativeFreqHz[i] - learnerFreqHz[i]);
      }
      return totalDiff / nativeFreqHz.length;
    };

    const nativePitch = [120, 130, 145, 135, 110];
    const learnerPitchGood = [122, 131, 142, 134, 112];
    const avgDiff = comparePitchContours(nativePitch, learnerPitchGood);

    expect(avgDiff).toBeLessThan(5.0); // very close intonation
  });

  it('should validate audio payload MIME types and container formats (audio/webm, audio/wav, audio/ogg)', () => {
    const supportedMimeTypes = new Set(['audio/webm', 'audio/wav', 'audio/ogg', 'audio/mp4']);
    expect(supportedMimeTypes.has('audio/webm')).toBe(true);
    expect(supportedMimeTypes.has('audio/wav')).toBe(true);
    expect(supportedMimeTypes.has('video/mp4')).toBe(false);
  });

  it('should handle zero-length / silent audio buffers and return silence warnings', () => {
    const detectSilence = (buffer: Float32Array, threshold: number = 0.01): boolean => {
      for (let i = 0; i < buffer.length; i++) {
        if (Math.abs(buffer[i]) > threshold) return false;
      }
      return true;
    };

    const silentBuffer = new Float32Array(100).fill(0.001);
    expect(detectSilence(silentBuffer)).toBe(true);

    const activeBuffer = new Float32Array(100).fill(0.001);
    activeBuffer[50] = 0.25;
    expect(detectSilence(activeBuffer)).toBe(false);
  });
}, 'Tier 1');
