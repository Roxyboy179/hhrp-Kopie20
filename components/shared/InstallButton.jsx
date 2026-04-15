'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { InstallModal } from './InstallModal';
import { usePathname } from 'next/navigation';

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const pathname = usePathname();

  // Nicht auf Admin-Seiten anzeigen - sehr strikte Prüfung
  if (pathname?.includes('/admin')) return null;

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Always show button after 2 seconds if not installed
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 2000);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Native install prompt available
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Show modal with instructions
      setShowModal(true);
    }
  };

  // Don't show if installed
  if (isInstalled) return null;
  
  // Show button after delay or when prompt is available
  if (!showButton) return null;

  return (
    <>
      <button
        onClick={handleInstall}
        className="fixed bottom-6 right-24 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl z-[9997] group"
        style={{ 
          background: 'var(--theme-accent)',
          boxShadow: '0 8px 32px rgba(var(--theme-accent-rgb), 0.4)',
        }}
        title="App installieren"
      >
        <Download className="w-6 h-6" style={{ color: '#000' }} />
        
        {/* Tooltip */}
        <div 
          className="absolute bottom-full mb-2 right-0 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ 
            background: 'rgba(0,0,0,0.9)',
            color: '#fff',
          }}
        >
          App installieren
        </div>

        {/* Pulse Animation */}
        <div 
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ background: 'var(--theme-accent)' }}
        />
      </button>

      {showModal && <InstallModal onClose={() => setShowModal(false)} />}
    </>
  );
}
