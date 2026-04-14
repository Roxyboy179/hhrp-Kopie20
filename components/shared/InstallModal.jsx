'use client';

import { X, Smartphone, Monitor, Chrome, Menu, Share2, MoreVertical } from 'lucide-react';

export function InstallModal({ onClose }) {
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div 
        className="glass rounded-2xl max-w-md w-full p-6 relative"
        style={{ 
          borderColor: 'rgba(var(--theme-accent-rgb), 0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
          style={{ 
            background: 'rgba(var(--theme-accent-rgb), 0.1)',
            color: 'rgba(var(--theme-accent-rgb), 0.6)',
          }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ 
              background: 'rgba(var(--theme-accent-rgb), 0.1)',
              border: '1px solid rgba(var(--theme-accent-rgb), 0.2)',
            }}
          >
            <span className="text-2xl font-black" style={{ color: 'var(--theme-accent)' }}>H</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            App installieren
          </h2>
          <p className="text-sm" style={{ color: 'rgba(var(--theme-accent-rgb), 0.5)' }}>
            So installierst du <strong>HHRP - Bewerbungsportal</strong> auf deinem Gerät:
          </p>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          {/* Chrome Android */}
          <div 
            className="p-4 rounded-xl"
            style={{ background: 'rgba(var(--theme-accent-rgb), 0.05)' }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: 'rgba(var(--theme-accent-rgb), 0.1)',
                  color: 'var(--theme-accent)',
                }}
              >
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm mb-1">
                  Chrome (Android)
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(var(--theme-accent-rgb), 0.5)' }}>
                  Tippe auf das <Menu className="w-3 h-3 inline" /> Menü → "Zum Startbildschirm hinzufügen"
                </p>
              </div>
            </div>
          </div>

          {/* Chrome/Edge Desktop */}
          <div 
            className="p-4 rounded-xl"
            style={{ background: 'rgba(var(--theme-accent-rgb), 0.05)' }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: 'rgba(var(--theme-accent-rgb), 0.1)',
                  color: 'var(--theme-accent)',
                }}
              >
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm mb-1">
                  Chrome/Edge (Desktop)
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(var(--theme-accent-rgb), 0.5)' }}>
                  Klicke in der Adressleiste auf das <Chrome className="w-3 h-3 inline" /> Symbol → "Installieren"
                </p>
              </div>
            </div>
          </div>

          {/* Safari iOS */}
          <div 
            className="p-4 rounded-xl"
            style={{ background: 'rgba(var(--theme-accent-rgb), 0.05)' }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: 'rgba(var(--theme-accent-rgb), 0.1)',
                  color: 'var(--theme-accent)',
                }}
              >
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm mb-1">
                  Safari (iOS)
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(var(--theme-accent-rgb), 0.5)' }}>
                  Tippe auf <Share2 className="w-3 h-3 inline" /> Teilen → "Zum Home-Bildschirm"
                </p>
              </div>
            </div>
          </div>

          {/* Other Browsers */}
          <div 
            className="p-4 rounded-xl"
            style={{ background: 'rgba(var(--theme-accent-rgb), 0.05)' }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: 'rgba(var(--theme-accent-rgb), 0.1)',
                  color: 'var(--theme-accent)',
                }}
              >
                <MoreVertical className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm mb-1">
                  Andere Browser
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(var(--theme-accent-rgb), 0.5)' }}>
                  Suche im Menü nach "Installieren" oder "Zum Startbildschirm"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(var(--theme-accent-rgb), 0.1)' }}>
          <p className="text-xs text-center" style={{ color: 'rgba(var(--theme-accent-rgb), 0.3)' }}>
            Die App läuft dann wie eine native Anwendung!
          </p>
        </div>
      </div>
    </div>
  );
}
