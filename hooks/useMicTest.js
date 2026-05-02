'use client';

// ─────────────────────────────────────────────────────────────────────
// useMicTest – Lokales Mic testen ohne WebRTC-Verbindung
//
// Holt das Mikrofon, gibt einen Stream + Pegel-Indikator zurück.
// Stoppt automatisch beim Cleanup.
// ─────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react';

export function useMicTest() {
  const [status, setStatus] = useState('idle'); // idle | requesting | active | denied | error
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  const start = useCallback(async () => {
    setStatus('requesting');
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      streamRef.current = s;
      setStream(s);
      setStatus('active');
    } catch (e) {
      console.warn('[useMicTest] error', e);
      if (e?.name === 'NotAllowedError') {
        setStatus('denied');
        setError('Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.');
      } else {
        setStatus('error');
        setError(e?.message || 'Mikrofon nicht verfügbar.');
      }
    }
  }, []);

  const stop = useCallback(() => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;
    setStream(null);
    setStatus('idle');
  }, []);

  return { status, stream, error, start, stop };
}
