'use client';

// ─────────────────────────────────────────────────────────────────────
// Voice Transcription Hook – Browser Web Speech API
//
// Nutzt das native SpeechRecognition-API von Chrome/Edge/Safari, um das
// lokale Mikrofon (via WebRTC bereits aktiv) live zu transkribieren.
//
// Wichtig: SpeechRecognition greift parallel auf dasselbe Mikrofon zu –
// das ist im Browser erlaubt, solange bereits getUserMedia-Permission
// erteilt wurde (was der useVoiceCall-Hook macht).
//
// Sprache: Deutsch (de-DE). onFinal wird für jeden abgeschlossenen Satz
// aufgerufen.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react';

export function useVoiceTranscription({ enabled, onFinal, lang = 'de-DE' }) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const enabledRef = useRef(enabled);
  const onFinalRef = useRef(onFinal);

  // Refs up-to-date halten ohne Effect-Restart
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { onFinalRef.current = onFinal; }, [onFinal]);

  useEffect(() => {
    if (!enabled) return;

    // Feature-Detect
    const SR = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (!SR) {
      setSupported(false);
      console.warn('[transcription] SpeechRecognition nicht verfügbar');
      return;
    }

    setSupported(true);

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = lang;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend = () => {
      setListening(false);
      // Auto-Restart solange aktiviert
      if (enabledRef.current && recognitionRef.current === rec) {
        setTimeout(() => {
          if (enabledRef.current && recognitionRef.current === rec) {
            try { rec.start(); } catch (e) {
              // Bereits gestartet – ignorieren
              if (e?.name !== 'InvalidStateError') {
                console.warn('[transcription] restart failed', e);
              }
            }
          }
        }, 300);
      }
    };

    rec.onerror = (e) => {
      // "no-speech" und "aborted" sind normal, nicht loggen
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('[transcription] error:', e.error);
      }
    };

    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = (result[0]?.transcript || '').trim();
          const confidence = result[0]?.confidence ?? 1;
          if (text && text.length > 1) {
            try {
              onFinalRef.current?.({
                text,
                confidence,
                timestamp: new Date().toISOString(),
              });
            } catch (err) {
              console.warn('[transcription] onFinal threw', err);
            }
          }
        }
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (e) {
      console.warn('[transcription] initial start failed', e);
    }

    return () => {
      recognitionRef.current = null;
      try { rec.onend = null; } catch {}
      try { rec.stop(); } catch {}
      try { rec.abort(); } catch {}
      setListening(false);
    };
  }, [enabled, lang]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  }, []);

  return { supported, listening, stop };
}
