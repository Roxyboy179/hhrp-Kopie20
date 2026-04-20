'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, X, HelpCircle, Sparkles,
  Hand, UserCircle2, LayoutGrid, Activity, Smartphone, Crown,
  Wallet, Send, ArrowLeftRight, IdCard, ShoppingCart, Building2,
  ClipboardList, Settings, PartyPopper
} from 'lucide-react';

/**
 * ProfileTour – Interaktive Schritt-für-Schritt-Anleitung für die Profilseite.
 *
 * Props:
 *  - run (boolean): Startet die Tour, wenn true
 *  - onClose (function): Wird aufgerufen, wenn die Tour beendet / übersprungen wird
 *  - setActiveTab (function): Wechselt den Haupt-Tab
 *  - setActiveSubTab (function): Wechselt den Sub-Tab
 */

// 15 Tour-Schritte – perfekt abgestimmt auf die Profilseite
const TOUR_STEPS = [
  {
    id: 'welcome',
    icon: Hand,
    title: 'Willkommen in deinem Profil!',
    body: 'Diese kurze Tour zeigt dir in wenigen Schritten alle Funktionen deines Profils. Du kannst sie jederzeit überspringen oder pausieren. Los geht\'s!',
    target: null,
    placement: 'center'
  },
  {
    id: 'header',
    icon: UserCircle2,
    title: 'Dein Profil-Header',
    body: 'Hier siehst du deinen Discord-Avatar, deinen Namen, deine ID und den Zeitpunkt der letzten Synchronisation mit unserem System.',
    target: '[data-tour="profile-header"]',
    placement: 'bottom'
  },
  {
    id: 'main-tabs',
    icon: LayoutGrid,
    title: 'Hauptnavigation',
    body: 'Über diese 8 Tabs erreichst du alle Bereiche deines Profils: Übersicht, Vorteile, Finanzen, Dokumente, Shop, Hamburg Horizon, Bewerbungen und Einstellungen.',
    target: '[data-tour="main-tabs"]',
    placement: 'bottom',
    tab: 'overview'
  },
  {
    id: 'overview',
    icon: Activity,
    title: 'Übersicht & Status',
    body: 'Das ist deine Kommandozentrale. Hier siehst du auf einen Blick deinen Kontostand, die wichtigsten Statistiken, deine Lizenzen und den allgemeinen Status deines Accounts.',
    target: '[data-tour="overview-content"]',
    placement: 'top',
    tab: 'overview'
  },
  {
    id: 'benefits-pwa',
    icon: Smartphone,
    title: 'PWA-Vorteile',
    body: 'Installiere die App auf deinem Handy und erhalte exklusive Vorteile: tägliche Boni, Push-Benachrichtigungen, Offline-Zugriff und einen festen Login-Streak.',
    target: '[data-tour="overview-content"]',
    placement: 'top',
    tab: 'benefits',
    subTab: 'pwa'
  },
  {
    id: 'benefits-discord',
    icon: Crown,
    title: 'Discord-Vorteile',
    body: 'Premium-Member, Booster und verifizierte Spieler erhalten hier besondere Boni, Rabatte und Sonderrollen. Alles synchronisiert direkt mit dem Discord-Server.',
    target: '[data-tour="overview-content"]',
    placement: 'top',
    tab: 'benefits',
    subTab: 'discord'
  },
  {
    id: 'finance-overview',
    icon: Wallet,
    title: 'Finanzen – Übersicht',
    body: 'Alle deine Finanzen an einem Ort: Bargeld, Bank und Sparkonto. Inklusive Schnellzugriff auf Überweisungen, Rechnungen und Karten.',
    target: '[data-tour="overview-content"]',
    placement: 'top',
    tab: 'finance',
    subTab: 'overview'
  },
  {
    id: 'finance-transfer',
    icon: Send,
    title: 'Geld überweisen',
    body: 'Überweise Geld an andere Spieler. Wähle den Empfänger, gib den Betrag ein und optional eine Nachricht. Sicher und schnell.',
    target: '[data-tour="overview-content"]',
    placement: 'top',
    tab: 'finance',
    subTab: 'transfer'
  },
  {
    id: 'finance-transactions',
    icon: ArrowLeftRight,
    title: 'Transaktionen & Rechnungen',
    body: 'Alle deine Zahlungen übersichtlich aufgelistet. Filtere nach Typ, Status oder Datum. Auch deine offenen und bezahlten Rechnungen findest du hier.',
    target: '[data-tour="overview-content"]',
    placement: 'top',
    tab: 'finance',
    subTab: 'transactions'
  },
  {
    id: 'documents',
    icon: IdCard,
    title: 'Dokumente & Ausweise',
    body: 'Hier findest du alle deine offiziellen Dokumente: Personalausweis, Führerschein, Waffenschein und weitere Lizenzen. Digital und immer griffbereit.',
    target: '[data-tour="overview-content"]',
    placement: 'top',
    tab: 'documents',
    subTab: 'cards'
  },
  {
    id: 'shop',
    icon: ShoppingCart,
    title: 'Shop',
    body: 'Entdecke exklusive Items, Premium-Pakete und Sonderangebote. Mit deinen Rewards und Bonuspunkten kannst du dir hier besondere Vorteile sichern.',
    target: '[data-tour="overview-content"]',
    placement: 'top',
    tab: 'shop'
  },
  {
    id: 'hamburg-horizon',
    icon: Building2,
    title: 'Hamburg Horizon',
    body: 'Dein Tor zur Stadt: Stadtkarte, Fraktionen, Events und aktuelle Statistiken unserer Server-Welt Hamburg Horizon.',
    target: '[data-tour="overview-content"]',
    placement: 'top',
    tab: 'hamburg-horizon'
  },
  {
    id: 'applications',
    icon: ClipboardList,
    title: 'Bewerbungen',
    body: 'Hier verwaltest du alle deine Bewerbungen bei Fraktionen (Polizei, Feuerwehr, Rettungsdienst, Staat). Verfolge den Status und erhalte Updates in Echtzeit.',
    target: '[data-tour="overview-content"]',
    placement: 'top',
    tab: 'applications'
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Einstellungen',
    body: 'Personalisiere dein Erlebnis: Theme, Hintergrundbild, Textgröße, Benachrichtigungen, Kompakt-Modus, Datenspar-Modus und vieles mehr.',
    target: '[data-tour="overview-content"]',
    placement: 'top',
    tab: 'settings'
  },
  {
    id: 'finish',
    icon: PartyPopper,
    title: 'Du bist startklar!',
    body: 'Das war\'s schon! Du kennst jetzt alle Bereiche deines Profils. Viel Spaß beim Erkunden – und falls du die Tour erneut brauchst, klicke einfach auf "Tour starten".',
    target: null,
    placement: 'center'
  }
];

const STORAGE_KEY = 'profile_tour_completed_v1';

export default function ProfileTour({ run, onClose, setActiveTab, setActiveSubTab }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tipPos, setTipPos] = useState({ top: 0, left: 0, placement: 'center' });
  const [mounted, setMounted] = useState(false);
  const tipRef = useRef(null);
  const rafRef = useRef(null);

  const step = TOUR_STEPS[stepIndex];
  const totalSteps = TOUR_STEPS.length;

  // Wechsle Tab wenn Schritt es erfordert
  useEffect(() => {
    if (!run || !step) return;
    if (step.tab && typeof setActiveTab === 'function') {
      setActiveTab(step.tab);
    }
    if (step.subTab && typeof setActiveSubTab === 'function') {
      setActiveSubTab(step.subTab);
    }
  }, [stepIndex, run, step, setActiveTab, setActiveSubTab]);

  // Setze mounted nach Hydration, damit Portal/Scroll-Lock sauber startet
  useEffect(() => {
    setMounted(true);
  }, []);

  // Berechne Position des Ziels + Tooltip
  const updatePosition = useCallback(() => {
    if (!run || !step) return;

    // Center-Step (Welcome / Finish)
    if (!step.target || step.placement === 'center') {
      setTargetRect(null);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const tipW = Math.min(480, vw - 32);
      const tipH = 280;
      setTipPos({
        top: Math.max(16, vh / 2 - tipH / 2),
        left: Math.max(16, vw / 2 - tipW / 2),
        placement: 'center',
        width: tipW
      });
      return;
    }

    const el = document.querySelector(step.target);
    if (!el) {
      // Fallback: zentriert anzeigen, wenn Element nicht gefunden
      setTargetRect(null);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const tipW = Math.min(480, vw - 32);
      const tipH = 280;
      setTipPos({
        top: Math.max(16, vh / 2 - tipH / 2),
        left: Math.max(16, vw / 2 - tipW / 2),
        placement: 'center',
        width: tipW
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Begrenze Spotlight-Höhe, damit bei großen Tab-Inhalten nur der obere,
    // relevante Teil hervorgehoben wird (User kann trotzdem den Rest erkennen)
    const MAX_SPOTLIGHT_HEIGHT = 420;

    // Clippe den sichtbaren Rect auf den Viewport, damit der Spotlight
    // IMMER nur im sichtbaren Bereich gezeichnet wird – auch ohne zu scrollen
    const visTop = Math.max(0, rect.top);
    const visBottom = Math.min(vh, rect.bottom);
    const clippedHeight = Math.max(0, visBottom - visTop);
    const cappedHeight = Math.min(clippedHeight || rect.height, MAX_SPOTLIGHT_HEIGHT);

    // Starte Spotlight bei sichtbarem Top oder rect.top, was größer ist
    const spotTop = rect.top < 0 ? 0 : rect.top;
    const box = {
      top: spotTop - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: cappedHeight + padding * 2
    };
    setTargetRect(box);

    // Tooltip-Position: FIXE Viewport-Ecke, damit das Popup beim Scrollen
    // an derselben Stelle am Bildschirm bleibt und der User den Inhalt
    // in Ruhe anschauen kann.
    const tipW = Math.min(420, vw - 32);
    const tipH = 300;
    const margin = 16;

    // Alle 4 möglichen Ecken (fix am Viewport)
    const corners = {
      'bottom-right': { top: vh - tipH - margin, left: vw - tipW - margin },
      'bottom-left':  { top: vh - tipH - margin, left: margin },
      'top-right':    { top: margin,             left: vw - tipW - margin },
      'top-left':     { top: margin,             left: margin }
    };

    // Prüfe Überlappung mit Spotlight – wähle die Ecke, die NICHT
    // mit dem beleuchteten Element kollidiert (sonst würde das Popup
    // das Highlight verdecken).
    const overlaps = (corner) => {
      const cRight = corner.left + tipW;
      const cBottom = corner.top + tipH;
      const bRight = box.left + box.width;
      const bBottom = box.top + box.height;
      return !(
        corner.left > bRight ||
        cRight < box.left ||
        corner.top > bBottom ||
        cBottom < box.top
      );
    };

    // Reihenfolge: bevorzuge unten-rechts, dann die anderen Ecken
    const order = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    let chosen = order.find(k => !overlaps(corners[k])) || 'bottom-right';
    const placement = chosen;
    let { top, left } = corners[chosen];

    // Safety-Clamp (für kleine Viewports)
    left = Math.max(margin, Math.min(left, vw - tipW - margin));
    top = Math.max(margin, Math.min(top, vh - tipH - margin));

    setTipPos({ top, left, placement, width: tipW });

    // Scrolle Element NUR wenn es komplett außerhalb des Viewports ist.
    // Ansonsten darf der User frei scrollen; Spotlight folgt mit.
    const completelyOffScreen = rect.bottom < 0 || rect.top > vh;
    if (completelyOffScreen) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [run, step]);

  // Recalc bei Schrittwechsel + Resize + Scroll
  useEffect(() => {
    if (!run) return;

    // Warte 400ms nach Tab-Wechsel, damit DOM aktualisiert ist
    const timer = setTimeout(() => {
      updatePosition();
    }, step?.tab || step?.subTab ? 420 : 60);

    const loop = () => {
      updatePosition();
      rafRef.current = requestAnimationFrame(loop);
    };
    // Rerender bei Scroll/Resize mit RAF für smooth following
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        updatePosition();
      });
    };
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stepIndex, run, updatePosition, step]);

  // Während der Tour NICHT den Body-Scroll sperren – der User soll selbst
  // scrollen können, um den Inhalt zu sehen, den die Tour erklärt.
  // Spotlight & Tooltip folgen dem Scroll automatisch (siehe RAF-Loop oben).

  // Tastatur-Navigation
  useEffect(() => {
    if (!run) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, stepIndex]);

  const handleNext = () => {
    if (stepIndex < totalSteps - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const handleSkip = () => {
    try { localStorage.setItem(STORAGE_KEY, 'skipped'); } catch (e) {}
    setStepIndex(0);
    onClose?.('skipped');
  };

  const handleFinish = () => {
    try { localStorage.setItem(STORAGE_KEY, 'completed'); } catch (e) {}
    setStepIndex(0);
    onClose?.('finished');
  };

  if (!run || !mounted) return null;

  const hasTarget = !!targetRect;
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none" aria-live="polite">
      {/* Dark Backdrop mit Spotlight-Loch – pointer-events-none, damit
          der User durch das Overlay scrollen kann */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {hasTarget && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#tour-spotlight-mask)"
          style={{ transition: 'all 0.3s ease' }}
        />
      </svg>

      {/* Animierter Rahmen ums Target */}
      {hasTarget && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            borderRadius: 16,
            boxShadow: '0 0 0 2px rgba(255,255,255,0.9), 0 0 40px 8px rgba(99,102,241,0.35)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <span className="absolute inset-0 rounded-2xl animate-[ping_2s_ease-in-out_infinite] opacity-40"
            style={{ boxShadow: '0 0 0 4px rgba(255,255,255,0.5)' }}
          />
        </div>
      )}

      {/* Tooltip-Box */}
      <div
        ref={tipRef}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        className="absolute pointer-events-auto"
        style={{
          top: tipPos.top,
          left: tipPos.left,
          width: tipPos.width || 420,
          transition: 'top 0.25s ease, left 0.25s ease'
        }}
      >
        <div className="relative rounded-2xl border border-white/15 bg-neutral-900/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Top-Gradient-Accent */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          {/* Header-Zeile: Schritt X von Y + Überspringen */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
              Schritt {stepIndex + 1} von {totalSteps}
            </span>
            <button
              onClick={handleSkip}
              className="text-[11px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/80 transition-colors"
            >
              Tour überspringen
            </button>
          </div>

          {/* Progress-Bar */}
          <div className="px-5">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pt-4 pb-5">
            {step.icon && (
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 mb-3">
                <step.icon className="w-5 h-5 text-white" />
              </div>
            )}
            <h3 className="text-xl font-bold text-white mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">{step.body}</p>
          </div>

          {/* Footer mit Buttons */}
          <div className="flex items-center justify-between px-5 pb-5 gap-2">
            <button
              onClick={handlePrev}
              disabled={stepIndex === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                stepIndex === 0
                  ? 'text-white/20 cursor-not-allowed'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Zurück
            </button>

            <div className="flex-1 flex justify-center gap-1">
              {TOUR_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === stepIndex
                      ? 'w-6 bg-white'
                      : i < stepIndex
                      ? 'w-1.5 bg-white/50'
                      : 'w-1.5 bg-white/15'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-neutral-900 hover:bg-white/90 transition-all"
            >
              {stepIndex === totalSteps - 1 ? 'Fertig' : 'Weiter'}
              {stepIndex !== totalSteps - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hilfsfunktion: Prüft, ob die Tour schon einmal absolviert wurde.
 */
export function hasCompletedProfileTour() {
  if (typeof window === 'undefined') return true;
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return true;
  }
}

export function resetProfileTour() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

/**
 * Floating "Tour starten" Button – kann in der Profilseite platziert werden.
 */
export function TourStartButton({ onStart, className = '' }) {
  return (
    <button
      onClick={onStart}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white text-sm font-medium transition-all ${className}`}
      title="Tour starten"
    >
      <HelpCircle className="w-4 h-4" />
      Tour starten
    </button>
  );
}
