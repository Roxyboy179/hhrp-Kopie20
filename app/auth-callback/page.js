'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // URL-Parameter auslesen
    const authParam = searchParams.get('auth');
    const errorParam = searchParams.get('error');

    if (window.opener) {
      // Nachricht an Hauptfenster senden
      window.opener.postMessage({
        type: 'discord-auth',
        success: authParam === 'success',
        error: errorParam
      }, window.location.origin);

      // Fenster nach kurzer Verzögerung schließen
      setTimeout(() => {
        window.close();
      }, 500);
    } else {
      // Fallback: Wenn kein opener vorhanden, zurück zur Hauptseite
      window.location.href = '/';
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#080808]">
      <div className="text-center">
        <Loader2 
          className="w-12 h-12 animate-spin mx-auto mb-4" 
          style={{ color: 'var(--theme-accent)' }} 
        />
        <p className="text-white text-lg">Anmeldung wird verarbeitet...</p>
        <p className="text-white/40 text-sm mt-2">Dieses Fenster schließt sich automatisch.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#080808]">
        <div className="text-center">
          <Loader2 
            className="w-12 h-12 animate-spin mx-auto mb-4" 
            style={{ color: 'var(--theme-accent)' }} 
          />
          <p className="text-white text-lg">Lädt...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
