'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X, Inbox, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Gerade eben';
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
}

function getStatusIcon(type, data) {
  const status = data?.newStatus;
  if (status === 'Angenommen') return '✅';
  if (status === 'Abgelehnt') return '❌';
  if (status === 'In Bearbeitung') return '🔄';
  return '📋';
}

function getAccentColor(type, data) {
  const status = data?.newStatus;
  if (status === 'Angenommen') return 'rgb(34, 197, 94)'; // green
  if (status === 'Abgelehnt') return 'rgb(239, 68, 68)'; // red
  if (status === 'In Bearbeitung') return 'rgb(59, 130, 246)'; // blue
  return 'rgb(156, 163, 175)'; // gray
}

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const panelRef = useRef(null);

  // Silent background fetch: vollständige Liste + unreadCount in einem Call.
  // Läuft sofort beim Mount + alle 10s im Hintergrund, egal ob Panel offen ist.
  // Kein Loading-State, kein Spinner - User merkt nichts davon.
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    let cancelled = false;

    const fetchSilently = async () => {
      try {
        const res = await fetch('/api/notifications', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch {
        // silent - kein UI-Feedback bei Fehlern
      }
    };

    // Sofort beim Mount laden (Hintergrund, User merkt nichts)
    fetchSilently();
    // Egress-optimiert: alle 60s statt 10s, pausiert wenn Tab im Hintergrund
    let interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fetchSilently();
    }, 60000);
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchSilently();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }, [user]);

  // Close on outside click (desktop only) + Escape
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const escHandler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, []);

  // Lock body scroll when mobile fullscreen overlay is open
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      const isMobile = window.matchMedia('(max-width: 639px)').matches;
      if (isMobile) {
        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          document.body.style.overflow = '';
          window.scrollTo(0, scrollY);
        };
      }
    }
  }, [open]);

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST', credentials: 'include' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  if (!user) return null;

  // Notification Card Component (re-used for desktop & mobile)
  const NotificationItem = ({ notif }) => {
    const accent = getAccentColor(notif.type, notif.data);
    return (
      <button
        type="button"
        onClick={() => !notif.isRead && markAsRead(notif.id)}
        className={`w-full text-left group relative px-4 py-3.5 border-b border-white/[0.04] transition-all hover:bg-white/[0.025] ${
          !notif.isRead ? 'bg-white/[0.015]' : ''
        }`}
      >
        {/* Unread accent bar on the left */}
        {!notif.isRead && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-r-full"
            style={{ background: accent, boxShadow: `0 0 10px ${accent}55` }}
          />
        )}
        <div className="flex items-start gap-3 pl-1">
          {/* Icon Bubble */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-white/[0.06] transition-all group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${accent}18, rgba(255,255,255,0.02))`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
            }}
          >
            <span>{getStatusIcon(notif.type, notif.data)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm font-semibold leading-tight tracking-tight ${!notif.isRead ? 'text-white' : 'text-white/55'}`}>
                {notif.title}
              </p>
              {!notif.isRead && (
                <span
                  className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
                  style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                />
              )}
            </div>
            <p className="text-xs text-white/45 mt-1 leading-relaxed line-clamp-2">{notif.message}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10.5px] text-white/25 font-medium">{timeAgo(notif.createdAt)}</p>
              {!notif.isRead && (
                <span
                  onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                  className="cursor-pointer inline-flex items-center gap-1 text-[10.5px] font-medium text-white/35 hover:text-white/80 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  <span>Gelesen</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Bell Button */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Benachrichtigungen"
          className="relative w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all border border-white/[0.06] hover:border-white/[0.12] hover:scale-105 active:scale-95"
        >
          <Bell className={`w-4 h-4 text-white/60 ${unreadCount > 0 ? 'animate-[wiggle_2s_ease-in-out_infinite]' : ''}`} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center text-white px-1 ring-2 ring-[#0a0a0a]"
              style={{ background: 'var(--theme-accent, #3b82f6)' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* ===== DESKTOP Dropdown (≥ sm) ===== */}
        <div
          ref={panelRef}
          className={`hidden sm:block absolute right-0 top-12 w-[380px] rounded-2xl overflow-hidden z-50 origin-top-right transition-all duration-200 ${
            open ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }`}
          style={{
            background: 'linear-gradient(180deg, rgba(18,18,20,0.92) 0%, rgba(10,10,12,0.96) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.02) inset, 0 1px 0 rgba(255,255,255,0.06) inset',
          }}
        >
          {/* Subtle gradient overlay on top */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
          />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] bg-white/[0.015]">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/[0.08]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
                }}
              >
                <Bell className="w-3.5 h-3.5 text-white/75" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-semibold text-white/90 tracking-tight">Benachrichtigungen</span>
                <span className="text-[10px] text-white/35">
                  {unreadCount > 0 ? `${unreadCount} neue` : 'Alle gelesen'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-all text-white/45 hover:text-white/90 text-[11px] font-medium"
                  title="Alle als gelesen markieren"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Alle</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-all text-white/40 hover:text-white/80"
                aria-label="Schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto scrollbar-none">
            {notifications.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div
                  className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center border border-white/[0.06]"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }}
                >
                  <Inbox className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/50 text-[13px] font-medium">Keine Benachrichtigungen</p>
                <p className="text-white/25 text-[11px] mt-1">Du bist auf dem neuesten Stand</p>
              </div>
            ) : (
              notifications.map(notif => <NotificationItem key={notif.id} notif={notif} />)
            )}
          </div>

          {/* Footer subtle gradient */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-white/[0.04] bg-white/[0.01]">
              <p className="text-[10px] text-white/25 text-center tracking-wide">
                {notifications.length} Benachrichtigung{notifications.length !== 1 ? 'en' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== MOBILE Fullscreen Overlay (< sm) ===== */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-[100] flex flex-col animate-[fade-in_0.2s_ease-out]">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            }}
          />

          {/* Panel */}
          <div
            className="relative flex flex-col w-full h-full animate-[slide-down-mobile_0.3s_cubic-bezier(0.22,1,0.36,1)]"
            style={{
              background: 'linear-gradient(180deg, rgba(22,22,24,0.96) 0%, rgba(10,10,12,0.98) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            }}
          >
            {/* Top gradient line */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
            />

            {/* Header with safe-area padding */}
            <div
              className="flex items-center justify-between px-5 pb-4 border-b border-white/[0.06] bg-white/[0.02]"
              style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/[0.08] relative"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                  }}
                >
                  <Bell className="w-4 h-4 text-white/80" />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full text-[9px] font-bold flex items-center justify-center text-white px-1 ring-2 ring-[#141416]"
                      style={{ background: 'var(--theme-accent, #3b82f6)' }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[15px] font-semibold text-white tracking-tight">Benachrichtigungen</span>
                  <span className="text-[11px] text-white/40 mt-0.5">
                    {unreadCount > 0 ? `${unreadCount} ungelesen` : 'Alle gelesen'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] active:scale-90 transition-all border border-white/[0.06]"
                aria-label="Schließen"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Action Bar (mark all as read) */}
            {unreadCount > 0 && (
              <div className="px-5 py-2.5 border-b border-white/[0.04] bg-white/[0.01]">
                <button
                  onClick={markAllAsRead}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12.5px] font-medium text-white/80 active:scale-[0.98] transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Alle als gelesen markieren</span>
                </button>
              </div>
            )}

            {/* List - takes remaining space */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              {notifications.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <div
                    className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center border border-white/[0.06] relative"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))' }}
                  >
                    <Inbox className="w-8 h-8 text-white/25" />
                    <Sparkles className="absolute -top-1.5 -right-1.5 w-4 h-4 text-white/30" />
                  </div>
                  <p className="text-white/70 text-[15px] font-semibold">Keine Benachrichtigungen</p>
                  <p className="text-white/35 text-[12px] mt-1.5">Du bist auf dem neuesten Stand ✨</p>
                </div>
              ) : (
                <div className="pb-4">
                  {notifications.map(notif => <NotificationItem key={notif.id} notif={notif} />)}
                  <div className="pt-4 pb-6 text-center">
                    <p className="text-[10px] text-white/25 tracking-wide">
                      {notifications.length} Benachrichtigung{notifications.length !== 1 ? 'en' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
