'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

export function InstallMenuItem({ onShowModal }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

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
      // Modal über die Navbar-Ebene öffnen (wie das normale Popup)
      onShowModal?.();
    }
  };

  // Nicht rendern wenn App bereits installiert
  if (isInstalled) return null;

  return (
    <DropdownMenuItem
      onSelect={() => {
        handleInstall();
      }}
      className="cursor-pointer flex items-center gap-3 px-2.5 py-2 mx-0.5 rounded-lg text-white/75 hover:text-white focus:text-white hover:bg-white/[0.05] focus:bg-white/[0.05] transition-colors"
    >
      <span
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}
      >
        <Download className="w-3.5 h-3.5 text-blue-400" />
      </span>
      <span className="text-[13px] font-medium">App installieren</span>
    </DropdownMenuItem>
  );
}
