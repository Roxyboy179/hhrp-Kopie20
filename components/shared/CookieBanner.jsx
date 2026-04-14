'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Prüfe ob User bereits Cookies akzeptiert/abgelehnt hat
    const cookieConsent = localStorage.getItem('cookie_consent');
    if (!cookieConsent) {
      // Verzögerung für sanfte Animation
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
      <div className="max-w-5xl mx-auto">
        <div className="relative bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl p-5 md:p-6">
          {/* Dekorative Elemente */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Close Button */}
          <button
            onClick={handleDecline}
            className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
            aria-label="Banner schließen"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            {/* Icon */}
            <div className="shrink-0 w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              <Cookie className="w-6 h-6 text-neutral-400" />
            </div>

            {/* Content */}
            <div className="flex-1 pr-6 md:pr-0">
              <h3 className="text-white font-semibold text-base mb-1.5">
                Cookies & Datenschutz
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Wir verwenden notwendige Cookies, um diese Website zu betreiben. Durch die Nutzung stimmst du unseren{' '}
                <Link href="/datenschutz" className="text-white/70 hover:text-white underline underline-offset-2 transition-colors">
                  Datenschutzbestimmungen
                </Link>
                {' '}und{' '}
                <Link href="/nutzungsbedingungen" className="text-white/70 hover:text-white underline underline-offset-2 transition-colors">
                  Nutzungsbedingungen
                </Link>
                {' '}zu.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
              <Button
                onClick={handleDecline}
                variant="ghost"
                className="rounded-xl h-11 px-5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
              >
                Ablehnen
              </Button>
              <Button
                onClick={handleAccept}
                className="rounded-xl h-11 px-6 bg-white text-black hover:bg-neutral-200 font-semibold shadow-lg transition-all"
              >
                Alle akzeptieren
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
