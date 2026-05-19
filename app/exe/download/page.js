'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/shared/GlassCard';
import {
  Download,
  Monitor,
  RefreshCw,
  Shield,
  AlertCircle,
  Loader2,
  Zap,
} from 'lucide-react';

export default function ExeDownloadPage() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/launcher/version', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('Version konnte nicht geladen werden');
        return r.json();
      })
      .then(setInfo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const canDownload = info?.available;

  return (
    <div
      className="min-h-[calc(100vh-4rem)] px-4 py-12 sm:py-16"
      style={{
        background:
          'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.08), transparent 60%)',
      }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center border overflow-hidden"
            style={{
              background: 'rgba(var(--theme-accent-rgb), 0.08)',
              borderColor: 'rgba(var(--theme-accent-rgb), 0.2)',
              boxShadow: '0 20px 60px rgba(var(--theme-accent-rgb), 0.15)',
            }}
          >
            <img
              src="/icon-192.png"
              alt="HHRP Launcher"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            HHRP Launcher
          </h1>
          <p
            className="text-sm sm:text-base max-w-md mx-auto"
            style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}
          >
            Offizieller Windows-Launcher — nur hier auf hhrp24.de herunterladen.
            Updates werden automatisch erkannt.
          </p>
        </div>

        <GlassCard className="p-6 sm:p-8 border border-white/[0.08]">
          {loading && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: 'var(--theme-accent)' }}
              />
              <p className="text-sm text-white/50">Lade Launcher-Informationen…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200/90">{error}</p>
            </div>
          )}

          {!loading && info && (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold border"
                  style={{
                    background: 'rgba(var(--theme-accent-rgb), 0.1)',
                    borderColor: 'rgba(var(--theme-accent-rgb), 0.25)',
                    color: 'var(--theme-accent)',
                  }}
                >
                  Version {info.version}
                </span>
                {info.file?.sizeMB && (
                  <span className="text-xs text-white/40">
                    ca. {info.file.sizeMB} MB
                  </span>
                )}
                {info.publishedAt && (
                  <span className="text-xs text-white/30">
                    Veröffentlicht: {info.publishedAt}
                  </span>
                )}
              </div>

              {info.releaseNotes && (
                <p className="text-sm text-white/60 mb-6 leading-relaxed">
                  {info.releaseNotes}
                </p>
              )}

              {!canDownload ? (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <p className="text-sm text-amber-100/80">
                    Der Launcher ist gerade nicht auf dem Server hinterlegt. Bitte
                    später erneut versuchen.
                  </p>
                </div>
              ) : (
                <a
                  href="/api/exe/download"
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] mb-6"
                  style={{
                    background: 'var(--theme-accent)',
                    color: '#000',
                    boxShadow: '0 8px 32px rgba(var(--theme-accent-rgb), 0.35)',
                  }}
                >
                  <Download className="w-5 h-5" />
                  hhrp-launcher.exe herunterladen
                </a>
              )}

              <ul className="space-y-3 text-sm text-white/55">
                {[
                  {
                    icon: Monitor,
                    text: info.minWindows || 'Windows 10/11 (64-bit)',
                  },
                  {
                    icon: RefreshCw,
                    text: 'Installierte Launcher prüfen beim Start automatisch auf Updates',
                  },
                  {
                    icon: Shield,
                    text: 'Nur Downloads von dieser Seite sind offiziell',
                  },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <Icon
                      className="w-4 h-4 flex-shrink-0 mt-0.5"
                      style={{ color: 'var(--theme-accent)' }}
                    />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Installation
                </h2>
                <ol className="space-y-2 text-sm text-white/50 list-decimal list-inside">
                  <li>Datei herunterladen und speichern</li>
                  <li>
                    Bei Windows-Warnung: „Weitere Informationen“ → „Trotzdem
                    ausführen“
                  </li>
                  <li>Launcher startet HHRP im eigenen Fenster</li>
                  <li>
                    Bei neuer Version: Launcher zeigt eine Warnung und verweist
                    dich hierher zum Download
                  </li>
                </ol>
              </div>
            </>
          )}
        </GlassCard>

        <p className="text-center text-xs text-white/25 mt-8 tracking-wide">
          Hamburg Horizon RP · Nur offizieller Download unter /exe/download
        </p>
      </div>
    </div>
  );
}
