'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function WartungsBanner() {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const pathname = usePathname();

  // Nicht auf Admin-Seiten anzeigen
  const isAdminPage = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdminPage) return;

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [isAdminPage]);

  useEffect(() => {
    if (!status?.geplante_wartung || !status?.wartung_start) return;

    const updateCountdown = () => {
      const start = new Date(status.wartung_start).getTime();
      const now = Date.now();
      const diff = start - now;

      if (diff <= 0) {
        setTimeLeft('Wartung läuft');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`in ${days} Tag${days > 1 ? 'en' : ''}`);
      } else if (hours > 0) {
        setTimeLeft(`in ${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`in ${minutes} Minute${minutes > 1 ? 'n' : ''}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [status]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/system-status/public');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch system status:', e);
    }
  };

  if (isAdminPage || !status?.geplante_wartung || dismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9996] animate-slide-down"
      style={{ animation: 'slideDown 0.3s ease-out' }}
    >
      <div
        className="glass border-b"
        style={{
          background: 'rgba(234,179,8,0.95)',
          borderColor: 'rgba(234,179,8,0.3)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#78350f' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#78350f' }}>
                Geplante Wartung {timeLeft}
              </p>
              <p className="text-xs truncate" style={{ color: '#92400e' }}>
                {status.wartung_nachricht}
              </p>
            </div>
          </div>

          {status.wartung_start && (
            <div className="hidden md:block text-xs font-medium" style={{ color: '#92400e' }}>
              {new Date(status.wartung_start).toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-110 flex-shrink-0"
            style={{ background: 'rgba(120,53,15,0.2)', color: '#78350f' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
