'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, X, HelpCircle, Sparkles,
  Hand, UserCircle2, LayoutGrid, Activity, Smartphone, Crown,
  Wallet, Send, ArrowLeftRight, IdCard, ShoppingCart, Building2,
  ClipboardList, Settings, PartyPopper, CreditCard
} from 'lucide-react';

/**
 * ProfileTour – Interaktive, karten-basierte Anleitung für die Profilseite.
 *
 * Die Tour besteht aus:
 *  1. Statischen "Struktur-Schritten" (Welcome, Profile-Header, Main-Tabs, Finish)
 *  2. Dynamischen "Tab-Schritten", die pro Tab gebaut werden:
 *     - Ein Tab-Intro-Schritt
 *     - Ein Schritt pro Karte (Elemente mit data-tour-card="Titel|Beschreibung")
 */

// Welche Tabs durchlaufen werden + Meta (Tab-ID, Sub-Tab, Intro-Text, Icon)
const TAB_FLOW = [
  {
    tab: 'overview',
    subTab: null,
    icon: Activity,
    title: 'Übersicht & Status',
    intro: 'Deine Kommandozentrale. Hier findest du den täglichen Bonus, deinen Geld-Überblick, Statistiken und wichtige Warnungen.'
  },
  {
    tab: 'benefits',
    subTab: 'pwa',
    icon: Smartphone,
    title: 'PWA-Vorteile',
    intro: 'Installiere die App auf deinem Handy und schalte exklusive Boni, Streaks und Extras frei.'
  },
  {
    tab: 'benefits',
    subTab: 'discord',
    icon: Crown,
    title: 'Discord-Vorteile',
    intro: 'Premium-Member, Booster und verifizierte Spieler erhalten hier besondere Vorteile.'
  },
  {
    tab: 'finance',
    subTab: 'overview',
    icon: Wallet,
    title: 'Finanzen – Übersicht',
    intro: 'Alle deine Geldbestände, Karten und Schnellzugriffe in einem Blick.'
  },
  {
    tab: 'finance',
    subTab: 'transfer',
    icon: Send,
    title: 'Überweisung',
    intro: 'Sende Geld schnell und sicher an andere Spieler.'
  },
  {
    tab: 'finance',
    subTab: 'transactions',
    icon: ArrowLeftRight,
    title: 'Transaktionen & Rechnungen',
    intro: 'Alle deine Zahlungen und offenen/bezahlten Rechnungen.'
  },
  {
    tab: 'documents',
    subTab: 'cards',
    icon: IdCard,
    title: 'Ausweise & Lizenzen',
    intro: 'Deine digitalen Dokumente: Personalausweis, Führerschein, Waffenschein und mehr.'
  },
  {
    tab: 'documents',
    subTab: 'personalakte',
    icon: ClipboardList,
    title: 'Personalakte',
    intro: 'Persönliche Daten, Notizen und Einträge in deiner Akte.'
  },
  {
    tab: 'shop',
    subTab: null,
    icon: ShoppingCart,
    title: 'Shop',
    intro: 'Exklusive Items, Premium-Pakete und Sonderangebote.'
  },
  {
    tab: 'hamburg-horizon',
    subTab: null,
    icon: Building2,
    title: 'Hamburg Horizon',
    intro: 'Die Server-Welt: Karte, Fraktionen, Events und Statistiken.'
  },
  {
    tab: 'applications',
    subTab: null,
    icon: ClipboardList,
    title: 'Bewerbungen',
    intro: 'Deine Bewerbungen bei Polizei, Feuerwehr, Rettungsdienst und Staat.'
  },
  {
    tab: 'settings',
    subTab: null,
    icon: Settings,
    title: 'Einstellungen',
    intro: 'Personalisiere Theme, Hintergrund, Benachrichtigungen und mehr.'
  }
];

// Struktur-Schritte (fix am Anfang/Ende)
const OPENING_STEPS = [
  {
    kind: 'static',
    id: 'welcome',
    icon: Hand,
    title: 'Willkommen in deinem Profil!',
    body: 'Diese Tour zeigt dir jede Funktion einzeln – jede Karte wird erklärt. Du kannst jederzeit zurückgehen, überspringen oder mit Escape abbrechen.',
    target: null,
    placement: 'center'
  },
  {
    kind: 'static',
    id: 'header',
    icon: UserCircle2,
    title: 'Dein Profil-Header',
    body: 'Dein Discord-Avatar, Name, ID und die letzte Synchronisation. Rechts findest du auch den „Tour starten"-Button.',
    target: '[data-tour="profile-header"]',
    placement: 'auto'
  },
  {
    kind: 'static',
    id: 'main-tabs',
    icon: LayoutGrid,
    title: 'Hauptnavigation',
    body: 'Über diese 8 Tabs erreichst du alle Bereiche. Die Tour führt dich jetzt nacheinander durch jeden Tab und erklärt jede Karte.',
    target: '[data-tour="main-tabs"]',
    placement: 'auto'
  }
];

const CLOSING_STEPS = [
  {
    kind: 'static',
    id: 'finish',
    icon: PartyPopper,
    title: 'Du bist startklar!',
    body: 'Glückwunsch! Du kennst jetzt jede Karte deines Profils. Die Tour kannst du jederzeit über den „Tour starten"-Button neu starten.',
    target: null,
    placement: 'center'
  }
];

const STORAGE_KEY = 'profile_tour_completed_v2';

export default function ProfileTour({ run, onClose, setActiveTab, setActiveSubTab }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tipPos, setTipPos] = useState({ top: 0, left: 0, placement: 'center' });
  const [mounted, setMounted] = useState(false);
  const [tabCards, setTabCards] = useState({}); // { 'overview|null': [{title, body, target}], ... }
  const [discoveredTabs, setDiscoveredTabs] = useState(new Set());
  const rafRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // Entdecke Karten im aktuell sichtbaren Tab und speichere sie.
  // Wird jedesmal aufgerufen, wenn der Tab/Sub-Tab wechselt.
  const discoverCardsForTab = useCallback((tab, subTab) => {
    const key = `${tab}|${subTab || 'null'}`;
    const nodes = document.querySelectorAll('[data-tour-card]');
    const cards = [];
    nodes.forEach((el, idx) => {
      // Nur sichtbare Karten (display !== none, opacity > 0)
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || parseFloat(style.opacity) === 0) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const raw = el.getAttribute('data-tour-card') || '';
      const [title, ...rest] = raw.split('|');
      const body = rest.join('|').trim();

      // Eindeutigen Selektor generieren – pro Tab einen sequenziellen Index
      const cardKey = `${key}-${idx}`;
      el.setAttribute('data-tour-card-key', cardKey);

      cards.push({
        title: title?.trim() || 'Karte',
        body: body || 'Weitere Informationen zu diesem Bereich.',
        target: `[data-tour-card-key="${cardKey}"]`
      });
    });
    setTabCards((prev) => ({ ...prev, [key]: cards }));
    setDiscoveredTabs((prev) => new Set(prev).add(key));
  }, []);

  // Baue die komplette Step-Liste zusammen (Opening + Tabs + Closing)
  const steps = useMemo(() => {
    const all = [...OPENING_STEPS];
    TAB_FLOW.forEach((flow) => {
      // Tab-Intro
      all.push({
        kind: 'tab-intro',
        id: `tab-${flow.tab}-${flow.subTab || 'root'}`,
        icon: flow.icon,
        title: flow.title,
        body: flow.intro,
        target: '[data-tour="overview-content"]',
        placement: 'auto',
        tab: flow.tab,
        subTab: flow.subTab
      });
      // Karten dieses Tabs (nachdem sie entdeckt wurden)
      const key = `${flow.tab}|${flow.subTab || 'null'}`;
      const cards = tabCards[key] || [];
      cards.forEach((card, i) => {
        all.push({
          kind: 'card',
          id: `${key}-card-${i}`,
          icon: CreditCard,
          title: card.title,
          body: card.body,
          target: card.target,
          placement: 'auto',
          tab: flow.tab,
          subTab: flow.subTab
        });
      });
    });
    all.push(...CLOSING_STEPS);
    return all;
  }, [tabCards]);

  const totalSteps = steps.length;
  const step = steps[stepIndex];

  // Tab-Wechsel wenn nötig + Karten entdecken
  useEffect(() => {
    if (!run || !step) return;
    if (step.tab && typeof setActiveTab === 'function') setActiveTab(step.tab);
    if (step.subTab && typeof setActiveSubTab === 'function') setActiveSubTab(step.subTab);

    // Nach Tab-Wechsel: Karten entdecken, falls noch nicht geschehen
    if (step.tab) {
      const key = `${step.tab}|${step.subTab || 'null'}`;
      if (!discoveredTabs.has(key)) {
        const t = setTimeout(() => discoverCardsForTab(step.tab, step.subTab), 350);
        return () => clearTimeout(t);
      }
    }
  }, [stepIndex, run, step, setActiveTab, setActiveSubTab, discoveredTabs, discoverCardsForTab]);

  // Positionsberechnung (Spotlight + Tooltip)
  const updatePosition = useCallback(() => {
    if (!run || !step) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!step.target || step.placement === 'center') {
      setTargetRect(null);
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
      setTargetRect(null);
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
    const MAX_SPOTLIGHT_HEIGHT = 480;

    // Spotlight auf Viewport clippen
    const visTop = Math.max(0, rect.top);
    const visBottom = Math.min(vh, rect.bottom);
    const clippedHeight = Math.max(0, visBottom - visTop);
    const cappedHeight = Math.min(clippedHeight || rect.height, MAX_SPOTLIGHT_HEIGHT);
    const spotTop = rect.top < 0 ? 0 : rect.top;

    const box = {
      top: spotTop - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: cappedHeight + padding * 2
    };
    setTargetRect(box);

    // Tooltip in fester Viewport-Ecke – wählt die Ecke, die NICHT überlappt
    const tipW = Math.min(420, vw - 32);
    const tipH = 300;
    const margin = 16;
    const corners = {
      'bottom-right': { top: vh - tipH - margin, left: vw - tipW - margin },
      'bottom-left':  { top: vh - tipH - margin, left: margin },
      'top-right':    { top: margin,             left: vw - tipW - margin },
      'top-left':     { top: margin,             left: margin }
    };
    const overlaps = (c) => {
      const cR = c.left + tipW, cB = c.top + tipH;
      const bR = box.left + box.width, bB = box.top + box.height;
      return !(c.left > bR || cR < box.left || c.top > bB || cB < box.top);
    };
    const order = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    const chosen = order.find((k) => !overlaps(corners[k])) || 'bottom-right';
    let { top, left } = corners[chosen];
    left = Math.max(margin, Math.min(left, vw - tipW - margin));
    top = Math.max(margin, Math.min(top, vh - tipH - margin));
    setTipPos({ top, left, placement: chosen, width: tipW });

    // Scrolle Element NUR ins Sichtbare, wenn es komplett außerhalb ist
    const completelyOffScreen = rect.bottom < 0 || rect.top > vh;
    if (completelyOffScreen) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [run, step]);

  useEffect(() => {
    if (!run) return;
    // Delay nach Tab-Wechsel, damit DOM aktualisiert ist
    const delay = step?.tab || step?.subTab ? 450 : 80;
    const timer = setTimeout(updatePosition, delay);

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updatePosition);
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

  // Tastatur
  useEffect(() => {
    if (!run) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleSkip();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, stepIndex]);

  const handleNext = () => {
    if (stepIndex < totalSteps - 1) setStepIndex(stepIndex + 1);
    else handleFinish();
  };
  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };
  const handleSkip = () => {
    try { localStorage.setItem(STORAGE_KEY, 'skipped'); } catch {}
    setStepIndex(0);
    onClose?.('skipped');
  };
  const handleFinish = () => {
    try { localStorage.setItem(STORAGE_KEY, 'completed'); } catch {}
    setStepIndex(0);
    onClose?.('finished');
  };

  // Reset stepIndex wenn Tour neu startet
  useEffect(() => {
    if (run) setStepIndex(0);
  }, [run]);

  if (!run || !mounted || !step) return null;

  const hasTarget = !!targetRect;
  const progress = ((stepIndex + 1) / totalSteps) * 100;
  const StepIcon = step.icon || Sparkles;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none" aria-live="polite">
      {/* Dark Backdrop mit Spotlight-Loch – pointer-events-none, damit
          der User frei durch das Overlay scrollen kann */}
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

      {/* Ring ums Target */}
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
        />
      )}

      {/* Tooltip-Box (fix am Viewport) */}
      <div
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
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

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

          <div className="px-5">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="px-5 pt-4 pb-5">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 mb-3">
              <StepIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">{step.body}</p>
          </div>

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

export function hasCompletedProfileTour() {
  if (typeof window === 'undefined') return true;
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

export function resetProfileTour() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

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
