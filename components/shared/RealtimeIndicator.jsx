'use client';

import { Wifi, WifiOff } from 'lucide-react';

/**
 * RealtimeIndicator – kleiner Live-Badge (grüner Punkt + "Live")
 *
 * Props:
 *   connected: boolean – vom useRealtime() Hook
 *   size?: "sm" | "md" (default "sm")
 */
export function RealtimeIndicator({ connected, size = 'sm', label = true, className = '' }) {
  const isSmall = size === 'sm';
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all ${className}`}
      style={{
        background: connected
          ? 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))'
          : 'linear-gradient(135deg, rgba(250,204,21,0.12), rgba(250,204,21,0.04))',
        borderColor: connected ? 'rgba(34,197,94,0.35)' : 'rgba(250,204,21,0.3)',
      }}
      title={connected ? 'Echtzeit-Verbindung aktiv' : 'Verbindung wird aufgebaut…'}
    >
      <span className="relative flex items-center justify-center">
        <span
          className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-400'}`}
          style={{
            boxShadow: connected
              ? '0 0 6px rgba(34,197,94,0.8), 0 0 2px rgba(34,197,94,0.5)'
              : '0 0 4px rgba(250,204,21,0.6)',
          }}
        />
        {connected && (
          <span
            className="absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-60 animate-ping"
            style={{ animationDuration: '2s' }}
          />
        )}
      </span>
      {label && (
        <span
          className={`font-medium tracking-tight ${isSmall ? 'text-[10px]' : 'text-xs'} ${
            connected ? 'text-green-300/90' : 'text-yellow-300/90'
          }`}
        >
          {connected ? 'Live' : 'Verbinde…'}
        </span>
      )}
    </div>
  );
}

export default RealtimeIndicator;
