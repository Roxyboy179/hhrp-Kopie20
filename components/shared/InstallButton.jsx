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
  const isAdminPage = pathname?.includes('/admin');

  useEffect(() => {
    // Don't run on admin pages
    if (isAdminPage) return;

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
  }, [isAdminPage]);

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

  // Don't render if on admin page, installed, or not ready
  if (isAdminPage || isInstalled || !showButton) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstall}
        className="fixed bottom-6 right-24 z-40 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl shadow-black/50 transition-all hover:scale-110 active:scale-95"
        style={{ 
          background: 'var(--theme-accent, #ffffff)',
          color: '#000' 
        }}
        title="App installieren"
      >
        <Download className="w-5 h-5" />
      </button>

      {showModal && <InstallModal onClose={() => setShowModal(false)} />}
    </>
  );
}
