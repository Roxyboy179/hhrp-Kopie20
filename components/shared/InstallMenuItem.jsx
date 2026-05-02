'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { InstallModal } from './InstallModal';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

export function InstallMenuItem() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Bereits installiert?
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true)
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  // Nicht rendern wenn App bereits installiert
  if (isInstalled) return null;

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          handleInstall();
        }}
        className="cursor-pointer flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/[0.06] focus:bg-white/[0.06] focus:text-white"
      >
        <Download className="w-4 h-4" />
        <span>App installieren</span>
      </DropdownMenuItem>

      {showModal && <InstallModal onClose={() => setShowModal(false)} />}
    </>
  );
}
