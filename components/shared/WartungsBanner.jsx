'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, X, Wrench, Calendar, Flag } from 'lucide-react';

export function WartungsBanner() {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    fetchStatus();
    
    // Alle 30 Sekunden aktualisieren
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!status?.geplante_wartung || !status?.wartung_start) return;

    const updateCountdown = () => {
      const now = new Date();
      const start = new Date(status.wartung_start);
      const diff = start - now;

      if (diff <= 0) {
        setCountdown('Die Wartung hat begonnen');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdown(`in ${days} Tag${days > 1 ? 'en' : ''} ${hours} Stunde${hours !== 1 ? 'n' : ''}`);
      } else if (hours > 0) {
        setCountdown(`in ${hours} Stunde${hours !== 1 ? 'n' : ''} ${minutes} Minute${minutes !== 1 ? 'n' : ''}`);
      } else {
        setCountdown(`in ${minutes} Minute${minutes !== 1 ? 'n' : ''}`);
      }
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 60000); // Jede Minute
    return () => clearInterval(countdownInterval);
  }, [status]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/system-status/public', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Fehler beim Laden des Wartungsstatus:', e);
    }
  };

  // Nicht anzeigen wenn: keine geplante Wartung, dismissed, oder keine Daten
  if (!status?.geplante_wartung || dismissed) return null;

  return (
    <div className="relative w-full bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border-b-2 border-yellow-500/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Icon mit Animation */}
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-300" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="w-4 h-4 text-yellow-300" />
                <span className="text-base font-bold text-yellow-200">
                  Geplante Wartungsarbeiten
                </span>
                {countdown && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/30 text-xs font-semibold text-yellow-200">
                    <Clock className="w-3 h-3" />
                    {countdown}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-yellow-100/90 leading-relaxed">
                {status.wartung_nachricht || 'Wir führen Wartungsarbeiten durch, um unseren Service zu verbessern.'}
              </p>

              {/* Zeitangaben */}
              {(status.wartung_start || status.wartung_ende) && (
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-yellow-200/70">
                  {status.wartung_start && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Start: {new Date(status.wartung_start).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                  {status.wartung_ende && (
                    <span className="flex items-center gap-1.5">
                      <Flag className="w-3.5 h-3.5" />
                      Ende: {new Date(status.wartung_ende).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setDismissed(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-yellow-200/60 hover:text-yellow-200"
            aria-label="Banner schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
