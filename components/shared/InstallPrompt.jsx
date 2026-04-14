'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { InstallModal } from './InstallModal';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('hhrp-install-dismissed');
    if (dismissed) return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      return;
    }

    // Show prompt after 5 seconds even without beforeinstallprompt
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt) {
        setShowPrompt(true);
      }
    }, 5000);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after 3 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Native install available
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`Install prompt outcome: ${outcome}`);
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // Show modal with instructions
      setShowPrompt(false);
      setShowModal(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('hhrp-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <>
      <div 
        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-[9998] animate-slide-up"
        style={{
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div 
          className="glass rounded-2xl p-5 border shadow-2xl relative overflow-hidden"
          style={{ 
            borderColor: 'rgba(var(--theme-accent-rgb), 0.2)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(var(--theme-accent-rgb), 0.1)',
          }}
        >
          {/* Glow Effect */}
          <div 
            className="absolute inset-0 opacity-10 blur-3xl"
            style={{ background: 'var(--theme-accent)' }}
          />

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ 
              background: 'rgba(var(--theme-accent-rgb), 0.1)',
              color: 'rgba(var(--theme-accent-rgb), 0.5)',
            }}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative">
            {/* Icon */}
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ 
                background: 'rgba(var(--theme-accent-rgb), 0.1)',
                border: '1px solid rgba(var(--theme-accent-rgb), 0.2)',
              }}
            >
              <span className="text-2xl font-black" style={{ color: 'var(--theme-accent)' }}>H</span>
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold text-white mb-1">
              App installieren
            </h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(var(--theme-accent-rgb), 0.5)' }}>
              Installiere <strong>HHRP - Bewerbungsportal</strong> für schnellen Zugriff und ein besseres Erlebnis.
            </p>

            {/* Install Button */}
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ 
                background: 'var(--theme-accent)',
                color: '#000',
                boxShadow: '0 4px 20px rgba(var(--theme-accent-rgb), 0.3)',
              }}
            >
              <Download className="w-4 h-4" />
              Jetzt installieren
            </button>

            {/* Later Button */}
            <button
              onClick={() => setShowPrompt(false)}
              className="w-full mt-2 px-4 py-2 text-xs font-medium transition-opacity hover:opacity-80"
              style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}
            >
              Vielleicht später
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>

      {showModal && <InstallModal onClose={() => setShowModal(false)} />}
    </>
  );
}
