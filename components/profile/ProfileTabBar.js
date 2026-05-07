'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';

/**
 * Hilfs-Hook: berechnet die Position für den Slider-Indicator.
 */
function useIndicatorPosition(activeId, refsMap, containerRef, deps = []) {
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  useLayoutEffect(() => {
    const compute = () => {
      const el = refsMap.current?.[activeId];
      const container = containerRef.current;
      if (!el || !container) return;
      const cRect = container.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      setIndicator({
        left: eRect.left - cRect.left,
        width: eRect.width,
        ready: true,
      });
    };
    compute();
    // ResizeObserver für Layout-Änderungen
    let ro;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(compute);
      ro.observe(containerRef.current);
    }
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('resize', compute);
      if (ro) ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, ...deps]);

  return indicator;
}

/**
 * Mobile Scroll-Fade-Detection
 */
function useScrollFade(containerRef, deps = []) {
  const [fade, setFade] = useState({ left: false, right: false });

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const update = () => {
      const max = c.scrollWidth - c.clientWidth;
      setFade({
        left: c.scrollLeft > 4,
        right: c.scrollLeft < max - 4,
      });
    };
    update();
    c.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const t = setTimeout(update, 100);
    return () => {
      c.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return fade;
}

/* ============================================================
   MAIN TABS BAR
============================================================ */
export function MainTabsBar({
  tabs,
  activeTab,
  onTabChange,
  isTabLocked,
  badges = {},
  notifications = {},
}) {
  const tabRefs = useRef({});
  const mobileScrollRef = useRef(null);
  const fade = useScrollFade(mobileScrollRef, [tabs.length]);

  // Auto-scroll active tab into view (mobile)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 1024) return;
    const el = tabRefs.current[`m-${activeTab}`];
    if (el) {
      try {
        el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      } catch {}
    }
  }, [activeTab]);

  // Keyboard nav
  const handleKeyDown = (e, currentIndex, prefix) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const enabled = tabs
      .map((t, i) => (isTabLocked && isTabLocked(t) ? null : i))
      .filter((i) => i !== null);
    if (enabled.length === 0) return;
    const pos = enabled.indexOf(currentIndex);
    let nextIdx;
    if (e.key === 'ArrowLeft') nextIdx = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === 'ArrowRight') nextIdx = enabled[(pos + 1) % enabled.length];
    else if (e.key === 'Home') nextIdx = enabled[0];
    else if (e.key === 'End') nextIdx = enabled[enabled.length - 1];
    const target = tabs[nextIdx];
    if (target) {
      onTabChange(target.id);
      setTimeout(() => tabRefs.current[`${prefix}-${target.id}`]?.focus(), 0);
    }
  };

  const renderButton = (tab, idx, variant) => {
    const Icon = tab.icon;
    const locked = isTabLocked ? isTabLocked(tab) : false;
    const DisplayIcon = locked ? Lock : Icon;
    const isActive = activeTab === tab.id;
    const badge = badges[tab.id];
    const hasDot = notifications[tab.id];
    const prefix = variant === 'mobile' ? 'm' : 'd';

    const baseClasses =
      variant === 'mobile'
        ? 'relative flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 text-sm whitespace-nowrap snap-center flex-shrink-0'
        : 'relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 text-base';

    const stateClasses = isActive
      ? 'bg-gradient-to-br from-white/15 to-white/5 text-white border border-white/25 shadow-lg shadow-blue-500/10 scale-[1.02]'
      : locked
      ? 'bg-white/[0.02] text-white/30 border border-white/[0.06] cursor-not-allowed'
      : 'text-white/60 hover:text-white hover:bg-white/[0.07] border border-transparent';

    return (
      <button
        key={`${prefix}-${tab.id}`}
        ref={(el) => (tabRefs.current[`${prefix}-${tab.id}`] = el)}
        role="tab"
        id={`tab-${prefix}-${tab.id}`}
        aria-selected={isActive}
        aria-controls={`panel-${tab.id}`}
        aria-disabled={locked}
        tabIndex={isActive ? 0 : -1}
        onClick={() => !locked && onTabChange(tab.id)}
        onKeyDown={(e) => handleKeyDown(e, idx, prefix)}
        disabled={locked}
        title={locked ? 'Charakter erforderlich – erstelle einen im Discord' : tab.label}
        className={`${baseClasses} ${stateClasses}`}
      >
        <DisplayIcon
          className={`${variant === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0 ${
            locked ? 'text-white/40' : ''
          }`}
        />
        <span className="font-medium">{tab.label}</span>

        {/* Badge */}
        {!locked && typeof badge === 'number' && badge > 0 && (
          <span
            className={`ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
              isActive ? 'bg-white text-zinc-900' : 'bg-blue-500/90 text-white shadow-md shadow-blue-500/30'
            }`}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}

        {/* Notification Dot */}
        {!locked && hasDot && !(typeof badge === 'number' && badge > 0) && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
        )}
      </button>
    );
  };

  return (
    <div data-tour="main-tabs" className="glass rounded-2xl p-2 border border-white/[0.08] relative">
      {/* Mobile */}
      <div className="lg:hidden relative">
        {fade.left && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-10 bg-gradient-to-r from-zinc-950/95 via-zinc-950/60 to-transparent rounded-l-2xl z-10" />
        )}
        {fade.right && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-zinc-950/95 via-zinc-950/60 to-transparent rounded-r-2xl z-10" />
        )}
        <div
          ref={mobileScrollRef}
          role="tablist"
          aria-label="Profil-Bereiche"
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        >
          {tabs.map((tab, idx) => renderButton(tab, idx, 'mobile'))}
        </div>
      </div>

      {/* Desktop */}
      <div
        role="tablist"
        aria-label="Profil-Bereiche"
        className="hidden lg:grid grid-cols-5 gap-2"
      >
        {tabs.map((tab, idx) => renderButton(tab, idx, 'desktop'))}
      </div>
    </div>
  );
}

/* ============================================================
   SUB TABS BAR
============================================================ */
export function SubTabsBar({ subTabs, activeSubTab, onSubTabChange, badges = {} }) {
  const tabRefs = useRef({});
  const mobileScrollRef = useRef(null);
  const desktopContainerRef = useRef(null);

  const fade = useScrollFade(mobileScrollRef, [subTabs.length]);

  // Indicator (Desktop)
  const indicator = useIndicatorPosition(
    activeSubTab,
    { current: tabRefs.current },
    desktopContainerRef,
    [subTabs.length]
  );

  // Hack: re-trigger indicator measurement when refs become available
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, [subTabs]);

  // Mobile auto-scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 1024) return;
    const el = tabRefs.current[`m-${activeSubTab}`];
    if (el) {
      try {
        el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      } catch {}
    }
  }, [activeSubTab]);

  const handleKeyDown = (e, currentIndex, prefix) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    let nextIdx;
    if (e.key === 'ArrowLeft') nextIdx = (currentIndex - 1 + subTabs.length) % subTabs.length;
    else if (e.key === 'ArrowRight') nextIdx = (currentIndex + 1) % subTabs.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = subTabs.length - 1;
    const next = subTabs[nextIdx];
    if (next) {
      onSubTabChange(next.id);
      setTimeout(() => tabRefs.current[`${prefix}-${next.id}`]?.focus(), 0);
    }
  };

  const renderMobileBtn = (subTab, idx) => {
    const Icon = subTab.icon;
    const isActive = activeSubTab === subTab.id;
    const badge = badges[subTab.id];
    return (
      <button
        key={`m-${subTab.id}`}
        ref={(el) => (tabRefs.current[`m-${subTab.id}`] = el)}
        role="tab"
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        onClick={() => onSubTabChange(subTab.id)}
        onKeyDown={(e) => handleKeyDown(e, idx, 'm')}
        className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs whitespace-nowrap flex-shrink-0 ${
          isActive
            ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-400/40 shadow-md shadow-blue-500/10'
            : 'text-white/60 hover:text-white hover:bg-white/[0.07] border border-transparent'
        }`}
      >
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="font-medium">{subTab.label}</span>
        {typeof badge === 'number' && badge > 0 && (
          <span
            className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold ${
              isActive ? 'bg-white text-zinc-900' : 'bg-blue-500/90 text-white'
            }`}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    );
  };

  const renderDesktopBtn = (subTab, idx) => {
    const Icon = subTab.icon;
    const isActive = activeSubTab === subTab.id;
    const badge = badges[subTab.id];
    return (
      <button
        key={`d-${subTab.id}`}
        ref={(el) => (tabRefs.current[`d-${subTab.id}`] = el)}
        role="tab"
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        onClick={() => onSubTabChange(subTab.id)}
        onKeyDown={(e) => handleKeyDown(e, idx, 'd')}
        className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
          isActive ? 'text-white' : 'text-white/60 hover:text-white'
        }`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">{subTab.label}</span>
        {typeof badge === 'number' && badge > 0 && (
          <span
            className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
              isActive ? 'bg-white text-zinc-900' : 'bg-blue-500/90 text-white'
            }`}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="glass rounded-2xl p-2 border border-white/[0.08] relative">
      {/* Mobile */}
      <div className="lg:hidden relative">
        {fade.left && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-zinc-950/95 via-zinc-950/60 to-transparent rounded-l-2xl z-10" />
        )}
        {fade.right && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-zinc-950/95 via-zinc-950/60 to-transparent rounded-r-2xl z-10" />
        )}
        <div
          ref={mobileScrollRef}
          role="tablist"
          aria-label="Unter-Bereiche"
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          {subTabs.map((s, i) => renderMobileBtn(s, i))}
        </div>
      </div>

      {/* Desktop with sliding indicator */}
      <div
        ref={desktopContainerRef}
        role="tablist"
        aria-label="Unter-Bereiche"
        className="hidden lg:flex gap-1 justify-center relative flex-wrap"
      >
        {ready && indicator.ready && indicator.width > 0 && (
          <div
            className="absolute top-0 h-full bg-gradient-to-r from-blue-500/25 to-purple-500/25 border border-blue-400/40 rounded-lg pointer-events-none transition-all duration-300 ease-out shadow-md shadow-blue-500/20"
            style={{
              left: `${indicator.left}px`,
              width: `${indicator.width}px`,
            }}
          />
        )}
        {subTabs.map((s, i) => renderDesktopBtn(s, i))}
      </div>
    </div>
  );
}
