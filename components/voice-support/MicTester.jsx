'use client';

// MicTester – Mikrofon vor dem Voice-Call testen
// Zeigt Pegel-Visualisierung und Status

import { useEffect } from 'react';
import { Mic, MicOff, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useMicTest } from '@/hooks/useMicTest';
import { useAudioLevel } from '@/hooks/useAudioLevel';

export function MicTester() {
  const { status, stream, error, start, stop } = useMicTest();
  const { overallLevel, levels } = useAudioLevel(stream, { bands: 12 });

  // Cleanup beim Unmount
  useEffect(() => () => stop(), [stop]);

  const isActive = status === 'active';
  const isHearing = isActive && overallLevel > 0.04;

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              status === 'denied' || status === 'error'
                ? 'bg-red-500/10 text-red-300'
                : isActive
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'bg-white/[0.04] text-white/50'
            }`}
          >
            {status === 'requesting' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : status === 'denied' || status === 'error' ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Mikrofon-Test</div>
            <div className="text-[11px] text-white/50">
              {status === 'idle' && 'Teste deine Audio-Eingabe'}
              {status === 'requesting' && 'Frage Mikrofon-Berechtigung an…'}
              {status === 'active' && (isHearing ? 'Du wirst gehört! ✓' : 'Sag etwas…')}
              {status === 'denied' && 'Zugriff verweigert'}
              {status === 'error' && 'Fehler beim Zugriff'}
            </div>
          </div>
        </div>

        {!isActive && status !== 'requesting' && (
          <button
            type="button"
            onClick={start}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/20 text-blue-200 transition-all"
          >
            Test starten
          </button>
        )}
        {isActive && (
          <button
            type="button"
            onClick={stop}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 transition-all"
          >
            Stoppen
          </button>
        )}
      </div>

      {/* Pegel-Visualizer */}
      {isActive && (
        <div className="space-y-2">
          <div className="flex items-end gap-1 h-12 bg-black/20 rounded-xl px-3 py-2">
            {levels.map((lvl, i) => {
              const h = Math.max(6, Math.min(100, lvl * 220));
              return (
                <span
                  key={i}
                  className={`flex-1 rounded-full transition-[height] duration-75 ${
                    isHearing
                      ? 'bg-gradient-to-t from-emerald-400 to-teal-300'
                      : 'bg-gradient-to-t from-white/30 to-white/50'
                  }`}
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/40">Pegel</span>
            <span
              className={`font-mono font-medium ${
                overallLevel > 0.15
                  ? 'text-emerald-300'
                  : overallLevel > 0.04
                  ? 'text-amber-300'
                  : 'text-white/30'
              }`}
            >
              {Math.round(overallLevel * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Status */}
      {status === 'active' && isHearing && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300">
          <Check className="w-3.5 h-3.5" />
          <span>Mikrofon funktioniert einwandfrei</span>
        </div>
      )}
      {(status === 'denied' || status === 'error') && error && (
        <div className="mt-3 flex items-start gap-2 text-xs text-red-300/90">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
