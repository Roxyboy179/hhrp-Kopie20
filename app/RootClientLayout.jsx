'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Navbar } from '@/components/shared/Navbar';
import { ThemeButton } from '@/components/shared/ThemeButton';
import { SplashScreen } from '@/components/shared/SplashScreen';
import { InstallPrompt } from '@/components/shared/InstallPrompt';
import { InstallButton } from '@/components/shared/InstallButton';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { Toaster } from 'sonner';
import Link from 'next/link';

export default function RootClientLayout({ children }) {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
        <div style={{ opacity: splashDone ? 1 : 0, transition: 'opacity 0.5s ease' }}>
          <LayoutContent>{children}</LayoutContent>
          <CookieBanner />
          <InstallPrompt />
          <InstallButton />
          <Toaster 
            position="bottom-right" 
            theme="dark"
            toastOptions={{
              style: {
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                color: 'white',
              },
            }}
            richColors
            closeButton
          />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

function LayoutContent({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isAdmin = pathname?.startsWith('/admin');

  // Admin-Seiten: Kein globales Navbar/Footer (Admin hat eigenes Layout)
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar user={user} loading={loading} />
      <main className="pt-16 min-h-screen">{children}</main>
      <Footer />
      <ThemeButton />
    </>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--theme-glass-border)', background: 'rgba(0,0,0,0.2)' }} className="mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3">Hamburg Horizon RP</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(var(--theme-accent-rgb), 0.35)' }}>
              Team-Bewerbungsportal für Hamburg Horizon Roleplay. Werde Teil unserer Community!
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Links</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-sm transition-colors" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
                Startseite
              </Link>
              <Link href="/bewerbung" className="block text-sm transition-colors" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
                Team-Bewerbung
              </Link>
              <Link href="/meine-bewerbungen" className="block text-sm transition-colors" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
                Meine Bewerbungen
              </Link>
              <Link href="/faq" className="block text-sm transition-colors" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
                FAQ / Hilfe
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Rechtliches</h3>
            <div className="space-y-2">
              <Link href="/datenschutz" className="block text-sm transition-colors" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
                Datenschutzerklärung
              </Link>
              <Link href="/nutzungsbedingungen" className="block text-sm transition-colors" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
                Nutzungsbedingungen
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 text-center text-xs" style={{ borderTop: '1px solid var(--theme-glass-border)', color: 'rgba(var(--theme-accent-rgb), 0.2)' }}>
          © {new Date().getFullYear()} Hamburg Horizon RP. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
}
