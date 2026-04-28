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
import CountdownOverlay from '@/components/CountdownOverlay';
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
  // Erweiterte UI-Effekte
  const [fxShimmer, setFxShimmer]         = useState(true);
  const [fxHoverGlow, setFxHoverGlow]     = useState(true);
  const [fxAnimNumbers, setFxAnimNumbers] = useState(true);
  const [fxGradBorders, setFxGradBorders] = useState(true);
  const [fxGlassStrength, setFxGlassStrength] = useState('medium'); // low | medium | high
  const [fxCardShine, setFxCardShine]     = useState(true);
  const [fxParallax, setFxParallax]       = useState(false);
  const [fxBotPulse, setFxBotPulse]       = useState(true);
  const [fxRipple, setFxRipple]           = useState(false);
  const [fxTabSlide, setFxTabSlide]       = useState(true);
  const [fxProgressSmooth, setFxProgressSmooth] = useState(true);
  const [fxSuccessAnim, setFxSuccessAnim] = useState(true);
  const [fxTopLoader, setFxTopLoader]     = useState(true);
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

    // Erweiterte UI-Effekte laden
    const loadBool = (k, def) => {
      const v = localStorage.getItem(k);
      return v === null ? def : v === 'true';
    };
    setFxShimmer(loadBool('hhrp-fx-shimmer', true));
    setFxHoverGlow(loadBool('hhrp-fx-hover-glow', true));
    setFxAnimNumbers(loadBool('hhrp-fx-anim-numbers', true));
    setFxGradBorders(loadBool('hhrp-fx-grad-borders', true));
    const savedGlass = localStorage.getItem('hhrp-fx-glass-strength');
    if (savedGlass) setFxGlassStrength(savedGlass);
    setFxCardShine(loadBool('hhrp-fx-card-shine', true));
    setFxParallax(loadBool('hhrp-fx-parallax', false));
    setFxBotPulse(loadBool('hhrp-fx-bot-pulse', true));
    setFxRipple(loadBool('hhrp-fx-ripple', false));
    setFxTabSlide(loadBool('hhrp-fx-tab-slide', true));
    setFxProgressSmooth(loadBool('hhrp-fx-progress-smooth', true));
    setFxSuccessAnim(loadBool('hhrp-fx-success-anim', true));
    setFxTopLoader(loadBool('hhrp-fx-top-loader', true));

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
      // Erweiterte Effekte
      if (e.detail?.fxShimmer       !== undefined) setFxShimmer(e.detail.fxShimmer);
      if (e.detail?.fxHoverGlow     !== undefined) setFxHoverGlow(e.detail.fxHoverGlow);
      if (e.detail?.fxAnimNumbers   !== undefined) setFxAnimNumbers(e.detail.fxAnimNumbers);
      if (e.detail?.fxGradBorders   !== undefined) setFxGradBorders(e.detail.fxGradBorders);
      if (e.detail?.fxGlassStrength !== undefined) setFxGlassStrength(e.detail.fxGlassStrength);
      if (e.detail?.fxCardShine     !== undefined) setFxCardShine(e.detail.fxCardShine);
      if (e.detail?.fxParallax      !== undefined) setFxParallax(e.detail.fxParallax);
      if (e.detail?.fxBotPulse      !== undefined) setFxBotPulse(e.detail.fxBotPulse);
      if (e.detail?.fxRipple        !== undefined) setFxRipple(e.detail.fxRipple);
      if (e.detail?.fxTabSlide      !== undefined) setFxTabSlide(e.detail.fxTabSlide);
      if (e.detail?.fxProgressSmooth!== undefined) setFxProgressSmooth(e.detail.fxProgressSmooth);
      if (e.detail?.fxSuccessAnim   !== undefined) setFxSuccessAnim(e.detail.fxSuccessAnim);
      if (e.detail?.fxTopLoader     !== undefined) setFxTopLoader(e.detail.fxTopLoader);
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
        {/* Globales Cooldown-Overlay (1.5. – 3.5.2026 + 20s Goodbye + 20s Hello V1) */}
        <CountdownOverlay />
        {fxTopLoader && animationen && !datensparmodus && <TopProgressLoader pathname={pathname} />}
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
          className={[
            kompaktModus ? 'hhrp-compact' : '',
            (!animationen || datensparmodus) ? 'hhrp-no-anim' : '',
            `hhrp-text-${textGroesse}`,
            datensparmodus ? 'hhrp-datenspar' : '',
            // Erweiterte Effekte (nur wenn Haupt-Animationen an & nicht datensparmodus)
            (animationen && !datensparmodus && fxShimmer) ? 'hhrp-fx-shimmer' : '',
            (animationen && !datensparmodus && fxHoverGlow) ? 'hhrp-fx-hover-glow' : '',
            (animationen && !datensparmodus && fxAnimNumbers) ? 'hhrp-fx-anim-numbers' : '',
            (animationen && !datensparmodus && fxGradBorders) ? 'hhrp-fx-gradient-borders' : '',
            (fxGlassStrength === 'low')  ? 'hhrp-fx-glass-low'  : '',
            (fxGlassStrength === 'high') ? 'hhrp-fx-glass-high' : '',
            (animationen && !datensparmodus && fxCardShine) ? 'hhrp-fx-card-shine' : '',
            (animationen && !datensparmodus && fxParallax) ? 'hhrp-fx-parallax' : '',
            (animationen && !datensparmodus && fxBotPulse) ? 'hhrp-fx-bot-pulse' : '',
            (animationen && !datensparmodus && fxRipple) ? 'hhrp-fx-ripple' : '',
            (animationen && !datensparmodus && fxTabSlide) ? 'hhrp-fx-tab-slide' : '',
            (animationen && !datensparmodus && fxProgressSmooth) ? 'hhrp-fx-progress-smooth' : '',
            (animationen && !datensparmodus && fxSuccessAnim) ? 'hhrp-fx-success-anim' : '',
          ].filter(Boolean).join(' ')}
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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-6 sm:py-10 relative overflow-hidden"
      style={{ background: '#050506' }}
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(234,179,8,0.05), transparent 60%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(ellipse 40% 30% at 50% 80%, rgba(249,115,22,0.04), transparent 60%)',
        }}
      />

      {/* Grid Pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-2xl w-full relative animate-[fade-in-up_0.6s_cubic-bezier(0.22,1,0.36,1)]">
        {/* Card Container */}
        <div
          className="rounded-2xl sm:rounded-3xl p-6 sm:p-9 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(18,18,20,0.92) 0%, rgba(10,10,12,0.96) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Top gradient line */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(234,179,8,0.4), transparent)',
            }}
          />

          {/* Logo + Icon Header */}
          <div className="flex flex-col items-center text-center">
            {/* Server Logo with animated ring */}
            <div className="relative mb-5">
              {/* Outer pulsing ring */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl animate-ping"
                style={{
                  background: 'rgba(234,179,8,0.15)',
                  animationDuration: '2.5s',
                }}
              />
              <div
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center border overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(234,179,8,0.12), rgba(249,115,22,0.08))',
                  borderColor: 'rgba(234,179,8,0.25)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 30px rgba(234,179,8,0.1)',
                }}
              >
                <img src="/logo.webp" alt="HHRP" className="w-full h-full object-cover" />
              </div>

              {/* Wrench badge (bottom-right) */}
              <div
                className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center border-2 animate-[wrench-spin_4s_ease-in-out_infinite]"
                style={{
                  background: 'linear-gradient(135deg, rgba(234,179,8,0.9), rgba(249,115,22,0.9))',
                  borderColor: '#050506',
                  boxShadow: '0 4px 12px rgba(234,179,8,0.35)',
                }}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black/85" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Wartungsarbeiten
            </h1>

            {/* Subtitle pill */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mt-3 border"
              style={{
                background: 'rgba(234,179,8,0.08)',
                borderColor: 'rgba(234,179,8,0.22)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#eab308', boxShadow: '0 0 6px #eab308' }}
              />
              <span className="text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'rgba(253,224,71,0.95)' }}>
                Live · Wir arbeiten daran
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="mt-6 sm:mt-7 text-center">
            <p className="text-[13.5px] sm:text-[15px] text-white/70 leading-relaxed px-2">
              Wir führen gerade wichtige Wartungsarbeiten durch, um Hamburg Horizon RP noch besser zu machen.
            </p>
          </div>

          {/* Simple Info Box */}
          <div
            className="mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-xl flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0"
              style={{ background: 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.2)' }}
            >
              <svg className="w-4 h-4 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[12.5px] sm:text-[13px] font-semibold text-white/85">Geplante Dauer</p>
              <p className="text-[11px] sm:text-[11.5px] text-white/45 mt-0.5">Voraussichtlich 30-60 Minuten</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row gap-3 sm:gap-3">
            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:flex-1 h-16 sm:h-12 px-12 sm:px-6 rounded-xl flex items-center justify-center gap-3 text-[15px] sm:text-[13px] font-semibold transition-all active:scale-[0.98] border"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                borderColor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              <svg className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="whitespace-nowrap">Erneut versuchen</span>
            </button>

            {/* Discord Button */}
            <a
              href="https://discord.gg/g784tka9sh"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 h-16 sm:h-12 px-12 sm:px-6 rounded-xl flex items-center justify-center gap-3 text-[15px] sm:text-[13px] font-semibold transition-all active:scale-[0.98] border"
              style={{
                background: 'linear-gradient(135deg, rgba(88,101,242,0.18), rgba(88,101,242,0.08))',
                borderColor: 'rgba(88,101,242,0.3)',
                color: 'rgba(196,204,255,0.95)',
                boxShadow: '0 4px 12px -4px rgba(88,101,242,0.25)',
              }}
            >
              <svg className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span className="whitespace-nowrap">Discord Updates</span>
            </a>
          </div>

          {/* Auto-refresh Hint */}
          <p className="mt-4 sm:mt-5 text-center text-[10px] sm:text-[10.5px] text-white/25 tracking-wide">
            Seite aktualisiert sich beim Reload automatisch
          </p>
        </div>

        {/* Footer Brand */}
        <p className="text-center mt-5 sm:mt-6 text-[10.5px] sm:text-[11px] text-white/25 tracking-wide">
          Hamburg Horizon RP · Danke für deine Geduld
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

// Top-Bar Progress Loader (NProgress-Style) bei Route-Wechseln
function TopProgressLoader({ pathname }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let t1, t2, t3;
    setVisible(true);
    setProgress(15);
    t1 = setTimeout(() => setProgress(55), 120);
    t2 = setTimeout(() => setProgress(85), 350);
    t3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
    }, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  if (!visible) return null;
  return (
    <div
      className="hhrp-top-loader"
      style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
      aria-hidden="true"
    />
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
