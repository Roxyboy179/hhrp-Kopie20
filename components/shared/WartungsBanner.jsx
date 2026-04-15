'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, X, Wrench, Calendar, Flag } from 'lucide-react';

export function WartungsBanner() {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    fetchStatus();
    
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
    const countdownInterval = setInterval(updateCountdown, 60000);
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

  if (!status?.geplante_wartung || dismissed) return null;

  return (
    <div className="relative w-full bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border-b-2 border-yellow-500/30 backdrop-blur-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Wrench className="w-4 h-4 text-yellow-300 flex-shrink-0" />
              <span className="text-sm md:text-base font-bold text-yellow-200">
                Geplante Wartungsarbeiten
              </span>
              {countdown && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/30 text-xs font-semibold text-yellow-200">
                  <Clock className="w-3 h-3" />
                  {countdown}
                </span>
              )}
            </div>
            
            <p className="text-xs md:text-sm text-yellow-100/90 leading-relaxed mb-2">
              {status.wartung_nachricht || 'Wir führen Wartungsarbeiten durch, um unseren Service zu verbessern.'}
            </p>

            {(status.wartung_start || status.wartung_ende) && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-yellow-200/70">
                {status.wartung_start && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      {new Date(status.wartung_start).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </span>
                )}
                {status.wartung_ende && (
                  <span className="flex items-center gap-1">
                    <Flag className="w-3 h-3 flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      {new Date(status.wartung_ende).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-yellow-200/60 hover:text-yellow-200 flex-shrink-0"
            aria-label="Banner schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
