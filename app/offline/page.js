'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      window.location.href = '/';
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#050505' }}>
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div 
          className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-8"
          style={{ 
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <WifiOff className="w-12 h-12" style={{ color: '#ef4444' }} />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Keine Verbindung
        </h1>

        {/* Description */}
        <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Du bist offline. Bitte überprüfe deine Internetverbindung und versuche es erneut.
        </p>

        {/* Status */}
        <div 
          className="glass rounded-xl p-4 mb-8"
          style={{ borderColor: 'rgba(239,68,68,0.2)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Status: <span className="font-semibold" style={{ color: isOnline ? '#22c55e' : '#ef4444' }}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </p>
        </div>

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] mx-auto"
          style={{ 
            background: '#ef4444',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(239,68,68,0.3)',
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Erneut versuchen
        </button>

        {/* Tips */}
        <div className="mt-12 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Tipps zur Fehlerbehebung:
          </p>
          <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <li>• WLAN oder mobile Daten aktivieren</li>
            <li>• Flugmodus deaktivieren</li>
            <li>• Router neu starten</li>
            <li>• Netzwerkeinstellungen überprüfen</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
