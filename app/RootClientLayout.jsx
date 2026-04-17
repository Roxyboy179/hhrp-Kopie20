'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Navbar } from '@/components/shared/Navbar';
import { ThemeButton } from '@/components/shared/ThemeButton';
import { SplashScreen } from '@/components/shared/SplashScreen';
import { InstallPrompt } from '@/components/shared/InstallPrompt';
import { InstallButton } from '@/components/shared/InstallButton';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { WartungsBanner } from '@/components/shared/WartungsBanner';
import { BetaNotice } from '@/components/shared/BetaNotice';
import { BetaTesterRecruitmentModal } from '@/components/BetaTesterRecruitmentModal';
import { Toaster } from 'sonner';
import Link from 'next/link';
import { Loader2, Sparkles, Zap } from 'lucide-react';

export default function RootClientLayout({ children }) {
  const [splashDone, setSplashDone] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isPWA, setIsPWA] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [customBg, setCustomBg] = useState(null);
  const [kompaktModus, setKompaktModus] = useState(false);
  const [animationen, setAnimationen] = useState(true);
  const [textGroesse, setTextGroesse] = useState('normal');
  const [datensparmodus, setDatensparmodus] = useState(false);
  const [schnellstart, setSchnellstart] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [offlineModus, setOfflineModus] = useState(false);
  const [notificationStyle, setNotificationStyle] = useState('normal');
  const router = useRouter();
  const pathname = usePathname();
  const isProfilePage = pathname === '/profil';
  const handleSplashComplete = useCallback(() => {
    setSplashDone(true);
    // NICHT sofort ausblenden - warten bis React gemountet ist!
  }, []);

  // Loading Screen ausblenden sobald React bereit ist
  useEffect(() => {
    if (splashDone) {
      // Warten bis DOM komplett geladen ist
      const hideLoading = () => {
        const delay = localStorage.getItem('hhrp-schnellstart') === 'true' ? 100 : 300;
        setTimeout(() => {
          setPageLoading(false);
          // Signal an den inline Loader senden
          window.dispatchEvent(new Event('react-ready'));
        }, delay);
      };

      if (document.readyState === 'complete') {
        hideLoading();
      } else {
        window.addEventListener('load', hideLoading);
        return () => window.removeEventListener('load', hideLoading);
      }
    }
  }, [splashDone]);

  // PWA Detection
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone || 
                          document.referrer.includes('android-app://');
      setIsPWA(isStandalone);
    };
    checkPWA();
  }, []);

  // Offline Detection & Auto-Redirect
  useEffect(() => {
    // Initiale Prüfung beim Laden
    const checkInitialOffline = () => {
      const isCurrentlyOnline = navigator.onLine;
      setIsOnline(isCurrentlyOnline);
      
      // Wenn initial offline, handle es
      if (!isCurrentlyOnline && pathname !== '/offline.html' && pathname !== '/offline') {
        const offlineModusAktiv = localStorage.getItem('hhrp-offline') === 'true';
        
        if (offlineModusAktiv) {
          import('sonner').then(({ toast }) => {
            toast.info('Du bist offline', {
              description: 'Offline-Modus ist aktiviert. Gecachte Daten werden verwendet.',
              duration: 5000
            });
          });
        } else {
          window.location.href = '/offline.html';
        }
      }
    };

    const handleOnline = () => {
      console.log('✅ Online-Event erkannt');
      setIsOnline(true);
      // Zurück zur Startseite wenn man wieder online ist (nur wenn man auf /offline.html war)
      if (pathname === '/offline.html' || pathname === '/offline') {
        router.push('/');
      }
    };

    const handleOffline = () => {
      console.log('❌ Offline-Event erkannt');
      setIsOnline(false);
      
      // Prüfe ob Offline-Modus bevorzugen aktiviert ist
      const offlineModusAktiv = localStorage.getItem('hhrp-offline') === 'true';
      console.log('Offline-Modus aktiviert:', offlineModusAktiv);
      
      if (offlineModusAktiv) {
        // Nur Toast-Benachrichtigung, keine Weiterleitung
        if (pathname !== '/offline.html' && pathname !== '/offline') {
          import('sonner').then(({ toast }) => {
            toast.info('Du bist offline', {
              description: 'Offline-Modus ist aktiviert. Gecachte Daten werden verwendet.',
              duration: 5000
            });
          });
        }
      } else {
        // Weiterleitung zur statischen Offline-HTML (außer man ist schon dort)
        if (pathname !== '/offline.html' && pathname !== '/offline') {
          console.log('→ Weiterleitung zu /offline.html');
          window.location.href = '/offline.html';
        }
      }
    };

    // Initiale Prüfung
    checkInitialOffline();

    // Event Listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pathname, router]);

  // Hilfsfunktion: Konvertiert preset IDs in echte Dateipfade
  const getBgUrl = (bgValue) => {
    if (!bgValue) return null;
    if (bgValue === 'standard') return '/hhrp-standard-bg.webp';
    if (bgValue.startsWith('preset:')) {
      // preset:city-1 → /bg-city-1.webp
      const presetName = bgValue.replace('preset:', '');
      return `/bg-${presetName}.webp`;
    }
    // Custom Upload (Base64 oder URL)
    return bgValue;
  };

  // Custom Background und Einstellungen aus localStorage laden
  useEffect(() => {
    const savedBg = localStorage.getItem('hhrp-custom-bg');
    if (savedBg) setCustomBg(savedBg);

    const savedKompakt = localStorage.getItem('hhrp-kompakt');
    if (savedKompakt === 'true') setKompaktModus(true);

    const savedAnim = localStorage.getItem('hhrp-animationen');
    if (savedAnim === 'false') setAnimationen(false);

    const savedTextGroesse = localStorage.getItem('hhrp-textgroesse');
    if (savedTextGroesse) setTextGroesse(savedTextGroesse);

    const savedDatensparmodus = localStorage.getItem('hhrp-datensparmodus');
    if (savedDatensparmodus === 'true') setDatensparmodus(true);

    const savedSchnellstart = localStorage.getItem('hhrp-schnellstart');
    if (savedSchnellstart === 'true') setSchnellstart(true);

    const savedAutoSync = localStorage.getItem('hhrp-autosync');
    if (savedAutoSync === 'false') setAutoSync(false);

    const savedOfflineModus = localStorage.getItem('hhrp-offline');
    if (savedOfflineModus === 'true') setOfflineModus(true);

    const savedNotificationStyle = localStorage.getItem('hhrp-notification-style');
    if (savedNotificationStyle) setNotificationStyle(savedNotificationStyle);

    // Auf Änderungen vom Profil-Einstellungen hören
    const handleBgChange = (e) => {
      setCustomBg(e.detail?.bg || null);
    };
    const handleSettingsChange = (e) => {
      if (e.detail?.kompakt !== undefined) setKompaktModus(e.detail.kompakt);
      if (e.detail?.animationen !== undefined) setAnimationen(e.detail.animationen);
      if (e.detail?.textgroesse !== undefined) setTextGroesse(e.detail.textgroesse);
      if (e.detail?.datensparmodus !== undefined) setDatensparmodus(e.detail.datensparmodus);
      if (e.detail?.schnellstart !== undefined) setSchnellstart(e.detail.schnellstart);
      if (e.detail?.autosync !== undefined) setAutoSync(e.detail.autosync);
      if (e.detail?.offline !== undefined) setOfflineModus(e.detail.offline);
      if (e.detail?.notificationStyle !== undefined) setNotificationStyle(e.detail.notificationStyle);
    };
    window.addEventListener('hhrp-bg-change', handleBgChange);
    window.addEventListener('hhrp-settings-change', handleSettingsChange);
    return () => {
      window.removeEventListener('hhrp-bg-change', handleBgChange);
      window.removeEventListener('hhrp-settings-change', handleSettingsChange);
    };
  }, []);

  // Register Service Worker für PWA Caching
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('❌ Service Worker registration failed:', error);
        });
    }
  }, []);

  const isLegalPage = ['/impressum', '/datenschutz', '/nutzungsbedingungen'].includes(pathname);

  return (
    <AuthProvider>
      <ThemeProvider>
        {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
        
        {/* Loading Spinner nach Splash Screen - Nur für PWA, im Splash-Screen-Stil */}
        {splashDone && pageLoading && isPWA && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}
          >
            {/* Ambient glow */}
            <div 
              className="absolute w-[400px] h-[400px] rounded-full blur-[200px]"
              style={{ background: 'rgba(59, 130, 246, 0.12)' }}
            />

            <div className="text-center relative">
              {/* Server Logo */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <img 
                  src="/icon-192.png" 
                  alt="Hamburg Horizon RP" 
                  className="w-full h-full rounded-2xl shadow-2xl"
                  style={{ boxShadow: '0 20px 60px rgba(59, 130, 246, 0.4)' }}
                />
                
                {/* Rotating ring */}
                <div 
                  className="absolute inset-[-4px] rounded-2xl border-2 border-dashed animate-spin"
                  style={{ borderColor: 'rgba(59, 130, 246, 0.3)', animationDuration: '12s' }} 
                />
                
                {/* Pulse ring */}
                <div 
                  className="absolute inset-[-8px] rounded-2xl border animate-pulse"
                  style={{ borderColor: 'rgba(59, 130, 246, 0.2)', animationDuration: '3s' }} 
                />
              </div>

              {/* Text */}
              <h3 className="text-2xl font-bold text-white mb-2">Lädt...</h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.5))' }} />
                <p className="text-xs font-light tracking-[0.2em] uppercase text-white/40">
                  Hamburg Horizon RP
                </p>
                <div className="w-8 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(59, 130, 246, 0.5))' }} />
              </div>

              {/* Progress indicator */}
              <div className="flex gap-1.5 justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }} />
              </div>
            </div>
          </div>
        )}

        <div 
          className={`${kompaktModus ? 'hhrp-compact' : ''} ${!animationen || datensparmodus ? 'hhrp-no-anim' : ''} hhrp-text-${textGroesse} ${datensparmodus ? 'hhrp-datenspar' : ''}`}
          style={{ 
            opacity: splashDone && !pageLoading ? 1 : 0, 
            transition: (animationen && !datensparmodus) ? 'opacity 0.5s ease' : 'none',
            ...(customBg ? { position: 'relative' } : {})
          }}>
          {customBg && !datensparmodus && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${getBgUrl(customBg)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                opacity: 0.15,
                zIndex: 0,
                pointerEvents: 'none'
              }}
            />
          )}
          <WartungsBanner />
          <LayoutContent>{children}</LayoutContent>
          <CookieBanner />
          <BetaNotice />
          <BetaTesterRecruitmentModalWrapper />
          {!isProfilePage && !isLegalPage && <InstallPrompt />}
          {!isProfilePage && !isLegalPage && <InstallButton />}
          <Toaster 
            position="bottom-right" 
            theme="dark"
            toastOptions={{
              style: notificationStyle === 'glass' ? {
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                color: 'white',
              } : {
                background: 'rgba(30, 41, 59, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
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
  const isProfilePage = pathname === '/profil';
  const isLegalPage = ['/impressum', '/datenschutz', '/nutzungsbedingungen'].includes(pathname);
  const [wartungsmodus, setWartungsmodus] = useState(false);
  const [wartungsLoading, setWartungsLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  // Wartungsmodus-Status prüfen
  useEffect(() => {
    const checkWartungsmodus = async () => {
      try {
        const res = await fetch('/api/system-status/public', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
          const data = await res.json();
          setWartungsmodus(data.wartungsmodus || false);
          setShowBanner(data.geplante_wartung || false);
        }
      } catch (e) {
        console.error('Fehler beim Prüfen des Wartungsmodus:', e);
      } finally {
        setWartungsLoading(false);
      }
    };

    checkWartungsmodus();
    // Alle 30 Sekunden prüfen
    const interval = setInterval(checkWartungsmodus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Admin-Seiten: Kein globales Navbar/Footer (Admin hat eigenes Layout)
  if (isAdmin) {
    return <>{children}</>;
  }

  // Wartungsmodus für normale Benutzer (nicht für Admins)
  if (!wartungsLoading && wartungsmodus && !user?.admin) {
    return <WartungsmodusSeite />;
  }

  return (
    <>
      <Navbar user={user} loading={loading} />
      <main className={showBanner ? "pt-16 min-h-screen" : "pt-16 min-h-screen"}>{children}</main>
      <Footer />
      {!isProfilePage && !isLegalPage && <ThemeButton />}
    </>
  );
}

function WartungsmodusSeite() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--theme-bg)' }}>
      <div className="max-w-2xl w-full text-center">
        {/* Animated Icon */}
        <div className="relative mb-8 inline-block">
          <div className="absolute inset-0 bg-orange-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div 
            className="relative w-32 h-32 mx-auto rounded-3xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(234,88,12,0.1) 100%)',
              border: '2px solid rgba(249,115,22,0.3)',
              boxShadow: '0 0 40px rgba(249,115,22,0.2)',
            }}
          >
            <svg className="w-16 h-16 text-orange-400 animate-spin" style={{ animationDuration: '3s' }} fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--theme-accent)' }}>
          Wartungsarbeiten
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl mb-8 leading-relaxed" style={{ color: 'rgba(var(--theme-accent-rgb), 0.6)' }}>
          Wir führen gerade wichtige Wartungsarbeiten durch, um Hamburg Horizon RP noch besser zu machen.
        </p>

        {/* Info Card */}
        <div 
          className="glass rounded-2xl p-8 mb-8 text-left"
          style={{ 
            border: '1px solid rgba(var(--theme-accent-rgb), 0.1)',
            background: 'rgba(var(--theme-accent-rgb), 0.02)',
          }}
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--theme-accent)' }}>
            Was bedeutet das?
          </h2>
          <ul className="space-y-3" style={{ color: 'rgba(var(--theme-accent-rgb), 0.5)' }}>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(249,115,22,0.2)' }}>
                <span className="text-orange-400 text-sm">•</span>
              </div>
              <span>Die Seite ist vorübergehend nicht verfügbar, während wir Updates durchführen.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(249,115,22,0.2)' }}>
                <span className="text-orange-400 text-sm">•</span>
              </div>
              <span>Die Wartungsarbeiten dauern in der Regel nur wenige Minuten.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(249,115,22,0.2)' }}>
                <span className="text-orange-400 text-sm">•</span>
              </div>
              <span>Deine Daten und Bewerbungen sind sicher gespeichert.</span>
            </li>
          </ul>
        </div>

        {/* Retry Button */}
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2"
          style={{ 
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            color: '#fff',
            boxShadow: '0 10px 40px rgba(249,115,22,0.3)',
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Erneut versuchen
        </button>

        {/* Footer Info */}
        <p className="mt-12 text-sm" style={{ color: 'rgba(var(--theme-accent-rgb), 0.3)' }}>
          Vielen Dank für deine Geduld! Wir sind bald wieder für dich da.
        </p>
      </div>
    </div>
  );
}

// Wrapper für Beta Tester Recruitment Modal mit Auth Context
function BetaTesterRecruitmentModalWrapper() {
  const { user } = useAuth();
  return <BetaTesterRecruitmentModal user={user} />;
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
              <Link href="/impressum" className="block text-sm transition-colors" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
                Impressum
              </Link>
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
          © 2026 Hamburg Horizon RP. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
}
