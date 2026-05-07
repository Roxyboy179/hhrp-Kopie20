'use client';

import { useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';

/* ============================================================
   MAIN TABS BAR (altes Design - mit funktionalen Verbesserungen)
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

  // Auto-scroll active tab into view (Mobile)
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

  const renderBadge = (badge, hasDot, isActive, locked) => {
    if (locked) return null;
    if (typeof badge === 'number' && badge > 0) {
      return (
        <span
          className={`ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
            isActive ? 'bg-white text-zinc-900' : 'bg-blue-500/90 text-white'
          }`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      );
    }
    if (hasDot) {
      return (
        <span className="ml-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
      );
    }
    return null;
  };

  return (
    <div data-tour="main-tabs" className="glass rounded-2xl p-2 border border-white/[0.08]">
      {/* Mobile: Horizontal Scrollable */}
      <div
        role="tablist"
        aria-label="Profil-Bereiche"
        className="flex lg:hidden gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
      >
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          const locked = isTabLocked ? isTabLocked(tab) : false;
          const DisplayIcon = locked ? Lock : Icon;
          const isActive = activeTab === tab.id;
          const badge = badges[tab.id];
          const hasDot = notifications[tab.id];
          return (
            <button
              key={`m-${tab.id}`}
              ref={(el) => (tabRefs.current[`m-${tab.id}`] = el)}
              role="tab"
              id={`tab-m-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              aria-disabled={locked}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !locked && onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx, 'm')}
              disabled={locked}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm whitespace-nowrap snap-center flex-shrink-0 ${
                isActive
                  ? 'bg-white/10 text-white border border-white/20 shadow-lg'
                  : locked
                  ? 'bg-orange-500/5 text-orange-300/50 border border-orange-500/20 cursor-not-allowed'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              <DisplayIcon className={`w-4 h-4 flex-shrink-0 ${locked ? 'text-orange-400/60' : ''}`} />
              <span className="font-medium">{tab.label}</span>
              {renderBadge(badge, hasDot, isActive, locked)}
            </button>
          );
        })}
      </div>

      {/* Desktop: Grid Layout */}
      <div role="tablist" aria-label="Profil-Bereiche" className="hidden lg:grid grid-cols-5 gap-2">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          const locked = isTabLocked ? isTabLocked(tab) : false;
          const DisplayIcon = locked ? Lock : Icon;
          const isActive = activeTab === tab.id;
          const badge = badges[tab.id];
          const hasDot = notifications[tab.id];
          return (
            <button
              key={`d-${tab.id}`}
              ref={(el) => (tabRefs.current[`d-${tab.id}`] = el)}
              role="tab"
              id={`tab-d-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              aria-disabled={locked}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !locked && onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx, 'd')}
              disabled={locked}
              title={locked ? 'Charakter erforderlich – erstelle einen im Discord' : tab.label}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all text-base ${
                isActive
                  ? 'bg-white/10 text-white border border-white/20'
                  : locked
                  ? 'bg-orange-500/5 text-orange-300/50 border border-orange-500/20 cursor-not-allowed'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <DisplayIcon className={`w-5 h-5 flex-shrink-0 ${locked ? 'text-orange-400/60' : ''}`} />
              <span className="font-medium">{tab.label}</span>
              {renderBadge(badge, hasDot, isActive, locked)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   SUB TABS BAR (altes Design - mit funktionalen Verbesserungen)
============================================================ */
export function SubTabsBar({ subTabs, activeSubTab, onSubTabChange, badges = {} }) {
  const tabRefs = useRef({});

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

  const renderBadge = (badge, isActive) => {
    if (typeof badge !== 'number' || badge <= 0) return null;
    return (
      <span
        className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold ${
          isActive ? 'bg-white text-zinc-900' : 'bg-blue-500/90 text-white'
        }`}
      >
        {badge > 99 ? '99+' : badge}
      </span>
    );
  };

  return (
    <div className="glass rounded-2xl p-2 border border-white/[0.08]">
      {/* Mobile: Horizontal Scrollable */}
      <div
        role="tablist"
        aria-label="Unter-Bereiche"
        className="flex lg:hidden gap-2 overflow-x-auto pb-2 scrollbar-hide"
      >
        {subTabs.map((subTab, idx) => {
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
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium">{subTab.label}</span>
              {renderBadge(badge, isActive)}
            </button>
          );
        })}
      </div>

      {/* Desktop: Flex Layout */}
      <div role="tablist" aria-label="Unter-Bereiche" className="hidden lg:flex gap-2 justify-center">
        {subTabs.map((subTab, idx) => {
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{subTab.label}</span>
              {renderBadge(badge, isActive)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
