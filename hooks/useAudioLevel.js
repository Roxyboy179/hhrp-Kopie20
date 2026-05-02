'use client';

// ─────────────────────────────────────────────────────────────────────
// useAudioLevel – Echtzeit-Audio-Pegel für einen MediaStream
//
// Liefert ein Array von Werten (0–1) das die FFT-Frequenzen des Streams
// darstellt. Perfekt für Voice-Wave-Animationen.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';

export function useAudioLevel(stream, { bands = 7, smoothing = 0.7 } = {}) {
  const [levels, setLevels] = useState(() => new Array(bands).fill(0));
  const [overallLevel, setOverallLevel] = useState(0);
  const rafRef = useRef(null);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    if (!stream || typeof window === 'undefined') {
      setLevels(new Array(bands).fill(0));
      setOverallLevel(0);
      return;
    }

    let cancelled = false;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = smoothing;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      ctxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const tick = () => {
        if (cancelled || !analyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        // In bands aufteilen
        const bandSize = Math.floor(bufferLength / bands);
        const newLevels = new Array(bands).fill(0);
        let sum = 0;
        for (let i = 0; i < bands; i++) {
          let bandSum = 0;
          for (let j = 0; j < bandSize; j++) {
            bandSum += dataArray[i * bandSize + j];
          }
          const avg = bandSum / bandSize / 255;
          newLevels[i] = avg;
          sum += avg;
        }
        setLevels(newLevels);
        setOverallLevel(sum / bands);

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.warn('[useAudioLevel] setup failed', e);
    }

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { sourceRef.current?.disconnect(); } catch {}
      try { analyserRef.current?.disconnect(); } catch {}
      try { ctxRef.current?.close(); } catch {}
      sourceRef.current = null;
      analyserRef.current = null;
      ctxRef.current = null;
    };
  }, [stream, bands, smoothing]);

  return { levels, overallLevel };
}
