'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut, Menu, X, Globe, FileText, Eye, Settings, User, Loader2,
  Users, ChevronDown, FlaskConical, Headphones, Radio, Play, Palette, Smartphone,
  Sparkles
} from 'lucide-react';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { LoginModal } from '@/components/LoginModal';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeMenuItem } from '@/components/shared/ThemeMenuItem';
import { InstallMenuItem } from '@/components/shared/InstallMenuItem';
import { ThemeModal } from '@/components/shared/ThemeModal';
import { InstallModal } from '@/components/shared/InstallModal';

const DiscordIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
);

// ─── Helpers ─────────────────────────────────────────────────────
function getUserStatus(user) {
  if (!user) return { vip: 'Standard Plan "Free"', isBeta: false, label: 'Standard Plan "Free"' };
  const licenses = user.licenses || [];
  const hasLicense = (id) => {
    if (!id) return false;
    return licenses.some((l) => {
      if (!l) return false;
      if (typeof l === 'string') return l === id;
      if (typeof l === 'object') return l.name === id || l.id === id;
      return false;
    });
  };
  let vip = 'Standard Plan "Free"';
  if (hasLicense('luxus_pass')) vip = 'Luxus-Pass';
  else if (hasLicense('vip_elite_plus')) vip = 'VIP Elite Plus';
  else if (hasLicense('vip_ultimate')) vip = 'VIP Ultimate';
  else if (hasLicense('vip_platinum')) vip = 'VIP Platinum';
  else if (hasLicense('vip_premium')) vip = 'VIP Premium';
  const isBeta = user.roles?.includes('1494434149623136276');
  return { vip, isBeta, label: isBeta ? `${vip} · Beta Tester` : vip };
}

// Unterseiten-bewusster Active-Check
function isPathActive(pathname, target) {
  if (target === '/') return pathname === '/';
  return pathname === target || pathname.startsWith(target + '/');
}

// ─── Component ─────────────────────────────────────────────────────
export function Navbar({ user, loading }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Mobile-Menu auto-close bei Route-Wechsel
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    refreshUser();
    router.push('/');
  };

  const navItems = [
    { id: '/', label: 'Startseite', icon: <Globe className="w-4 h-4" />, show: true },
    { id: '/bewerbung', label: 'Team-Bewerbung', icon: <FileText className="w-4 h-4" />, show: true, requireAuth: true },
    { id: '/meine-bewerbungen', label: 'Meine Bewerbungen', icon: <Eye className="w-4 h-4" />, show: !!user },
    { id: '/faq', label: 'FAQ', icon: <FileText className="w-4 h-4" />, show: true },
    { id: '/team', label: 'Team', icon: <Users className="w-4 h-4" />, show: true },
    { id: '/beta', label: 'Beta', icon: <FlaskConical className="w-4 h-4" />, show: user?.roles?.includes('1494434149623136276') },
    { id: '/admin', label: 'Admin', icon: <Settings className="w-4 h-4" />, show: user?.adminLevel > 0 },
  ];

  const status = useMemo(() => getUserStatus(user), [user]);
  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : null;

  // Items für Dropdown / Mobile (DRY)
  const dropdownSections = [
    {
      label: 'Account',
      items: [
        { id: 'profil', label: 'Profil', icon: User, color: 'rgb(99, 102, 241)', onClick: () => router.push('/profil') },
      ],
    },
    {
      label: 'Services',
      items: [
        { id: 'voice', label: 'Voice Support', icon: Headphones, color: 'rgb(168, 85, 247)', onClick: () => router.push('/voice-support') },
        { id: 'radio', label: 'HHRP Radio', icon: Radio, color: 'rgb(236, 72, 153)', onClick: () => router.push('/radio') },
        { id: 'social', label: 'Social Media', icon: Play, color: 'rgb(239, 68, 68)', onClick: () => router.push('/social') },
      ],
    },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#0a0a0a]/90 backdrop-blur-2xl border-b border-white/[0.04] shadow-2xl shadow-black/40'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full h-16">
        <div className="flex items-center h-full">
          {/* Logo */}
          <div className="flex items-center pl-4 sm:pl-6 flex-shrink-0">
            <Link href="/" className="flex items-center gap-3 cursor-pointer select-none group">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-black/30 group-hover:shadow-black/50 transition-all group-hover:scale-105 overflow-hidden">
                <img src="/logo.webp" alt="HHRP" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg tracking-tight">HHRP</span>
                <span className="text-[10px] text-white/30 block -mt-1">Hamburg Horizon RP</span>
              </div>
            </Link>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1 bg-white/[0.03] backdrop-blur-xl rounded-2xl p-1 border border-white/[0.06]">
              {navItems
                .filter((n) => n.show)
                .map((n) => {
                  const requiresDiscordAuth = n.requireAuth && !user;
                  const isActive = isPathActive(pathname, n.id);

                  if (requiresDiscordAuth) {
                    return (
                      <button
                        key={n.id}
                        onClick={(e) => {
                          e.preventDefault();
                          setLoginModalOpen(true);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                          isActive
                            ? 'bg-white/[0.06] text-white/90 shadow-inner shadow-white/5'
                            : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03]'
                        }`}
                      >
                        {n.icon}
                        <span className="hidden lg:inline">{n.label}</span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={n.id}
                      href={n.id}
                      aria-current={isActive ? 'page' : undefined}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                        isActive ? '' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
                      }`}
                      style={
                        isActive
                          ? {
                              background: 'rgba(var(--theme-accent-rgb), 0.15)',
                              color: 'var(--theme-accent)',
                              boxShadow: 'inset 0 1px 2px rgba(var(--theme-accent-rgb), 0.1)',
                            }
                          : {}
                      }
                    >
                      {n.icon}
                      <span className="hidden lg:inline">{n.label}</span>
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* Right: Profile + Bell */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 pr-3 sm:pr-6 flex-1">
            {loading ? (
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />

                {/* Profile Dropdown */}
                <DropdownMenu onOpenChange={setProfileDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Profil-Menü öffnen"
                      aria-expanded={profileDropdownOpen}
                      className="flex items-center gap-2 sm:gap-2.5 px-1.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={user.globalName || user.username}
                          className="w-7 h-7 rounded-full transition-transform group-hover:scale-110 flex-shrink-0"
                          style={{ boxShadow: '0 0 0 2px rgba(var(--theme-accent-rgb), 0.2)' }}
                        />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 flex-shrink-0"
                          style={{ background: 'rgba(var(--theme-accent-rgb), 0.3)' }}
                        >
                          <User className="w-3.5 h-3.5" style={{ color: 'var(--theme-accent)' }} />
                        </div>
                      )}
                      <div className="hidden sm:flex flex-col">
                        <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors max-w-[120px] truncate">
                          {user.globalName || user.username}
                        </span>
                        <span
                          className="text-[10px] font-medium leading-tight max-w-[120px] truncate"
                          style={{ color: 'var(--theme-accent)' }}
                        >
                          {status.label}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-white/40 transition-transform duration-300 hidden sm:block ${
                          profileDropdownOpen ? 'rotate-180' : 'rotate-0'
                        }`}
                      />
                    </button>
                  </DropdownMenuTrigger>

                  {/* ── DROPDOWN ── */}
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-72 p-0 overflow-hidden border border-white/[0.07] shadow-2xl shadow-black/60 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 flex flex-col"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(20,20,22,0.96) 0%, rgba(13,13,15,0.97) 100%)',
                      backdropFilter: 'blur(40px) saturate(160%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(160%)',
                      maxHeight: 'calc(100vh - 80px)',
                    }}
                  >
                    {/* User Header (sticky) */}
                    <div
                      className="relative px-4 pt-4 pb-3 border-b border-white/[0.05] flex-shrink-0"
                      style={{
                        background:
                          'radial-gradient(ellipse 70% 80% at 0% 0%, rgba(var(--theme-accent-rgb), 0.15), transparent 60%)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt=""
                            className="w-12 h-12 rounded-full flex-shrink-0"
                            style={{
                              boxShadow:
                                '0 0 0 2px rgba(var(--theme-accent-rgb), 0.35), 0 8px 20px rgba(0,0,0,0.45)',
                            }}
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(var(--theme-accent-rgb), 0.3)' }}
                          >
                            <User className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold text-white truncate">
                            {user.globalName || user.username}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Sparkles
                              className="w-3 h-3 flex-shrink-0"
                              style={{ color: 'var(--theme-accent)' }}
                            />
                            <p
                              className="text-[11px] font-medium truncate"
                              style={{ color: 'var(--theme-accent)' }}
                            >
                              {status.vip}
                            </p>
                          </div>
                          {status.isBeta && (
                            <span
                              className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-semibold uppercase tracking-wider"
                              style={{
                                background: 'rgba(168, 85, 247, 0.15)',
                                color: 'rgb(192, 132, 252)',
                                border: '1px solid rgba(168, 85, 247, 0.25)',
                              }}
                            >
                              <FlaskConical className="w-2.5 h-2.5" />
                              Beta Tester
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sections (scrollable) */}
                    <div className="p-1.5 overflow-y-auto overflow-x-hidden flex-1 hh-scroll">
                      {dropdownSections.map((section, sIdx) => (
                        <div key={section.label} className={sIdx > 0 ? 'mt-1' : ''}>
                          <div className="px-2.5 pt-2 pb-1">
                            <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-white/35">
                              {section.label}
                            </p>
                          </div>
                          {section.items.map((it) => (
                            <DropdownMenuItem
                              key={it.id}
                              onClick={it.onClick}
                              className="cursor-pointer flex items-center gap-3 px-2.5 py-2 mx-0.5 rounded-lg text-white/75 hover:text-white focus:text-white hover:bg-white/[0.05] focus:bg-white/[0.05] transition-colors"
                            >
                              <span
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: `${it.color.replace('rgb', 'rgba').replace(')', ', 0.12)')}`,
                                  border: `1px solid ${it.color
                                    .replace('rgb', 'rgba')
                                    .replace(')', ', 0.2)')}`,
                                }}
                              >
                                <it.icon
                                  className="w-3.5 h-3.5"
                                  style={{ color: it.color }}
                                />
                              </span>
                              <span className="text-[13px] font-medium">{it.label}</span>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      ))}

                      {/* Settings Section */}
                      <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />
                      <div className="px-2.5 pb-1">
                        <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-white/35">
                          Einstellungen
                        </p>
                      </div>
                      <ThemeMenuItem onOpen={() => setThemeModalOpen(true)} />
                      <InstallMenuItem onShowModal={() => setInstallModalOpen(true)} />

                      {/* Logout */}
                      <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer flex items-center gap-3 px-2.5 py-2 mx-0.5 rounded-lg text-red-400/80 hover:text-red-300 focus:text-red-300 hover:bg-red-500/[0.08] focus:bg-red-500/[0.08] transition-colors"
                      >
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                          }}
                        >
                          <LogOut className="w-3.5 h-3.5 text-red-400" />
                        </span>
                        <span className="text-[13px] font-medium">Abmelden</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setLoginModalOpen(true);
                }}
                className="flex items-center gap-2 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'var(--theme-accent)',
                  color: '#000',
                  boxShadow: '0 10px 25px -5px rgba(var(--theme-accent-rgb), 0.25)',
                }}
              >
                <DiscordIcon size={14} />
                <span className="hidden sm:inline">Anmelden</span>
              </button>
            )}

            {/* Mobile Toggle */}
            <button
              aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
              aria-expanded={mobileOpen}
              className="md:hidden text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/[0.04] transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div
          className="md:hidden mx-3 mb-3 rounded-2xl overflow-hidden border border-white/[0.07] animate-fade-in-down shadow-2xl shadow-black/60 flex flex-col"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,20,22,0.96) 0%, rgba(13,13,15,0.97) 100%)',
            backdropFilter: 'blur(40px) saturate(160%)',
            WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            maxHeight: 'calc(100vh - 80px)',
          }}
        >
          {/* User Header (mobile, sticky) */}
          {user && (
            <div
              className="px-4 pt-4 pb-3 border-b border-white/[0.05] flex-shrink-0"
              style={{
                background:
                  'radial-gradient(ellipse 70% 80% at 0% 0%, rgba(var(--theme-accent-rgb), 0.15), transparent 60%)',
              }}
            >
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-11 h-11 rounded-full flex-shrink-0"
                    style={{
                      boxShadow:
                        '0 0 0 2px rgba(var(--theme-accent-rgb), 0.35), 0 8px 20px rgba(0,0,0,0.45)',
                    }}
                  />
                ) : (
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(var(--theme-accent-rgb), 0.3)' }}
                  >
                    <User className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-white truncate">
                    {user.globalName || user.username}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Sparkles
                      className="w-3 h-3 flex-shrink-0"
                      style={{ color: 'var(--theme-accent)' }}
                    />
                    <p
                      className="text-[11px] font-medium truncate"
                      style={{ color: 'var(--theme-accent)' }}
                    >
                      {status.vip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Section (scrollable) */}
          <div className="p-2 overflow-y-auto overflow-x-hidden flex-1 hh-scroll">
            <p className="px-3 pt-1.5 pb-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-white/35">
              Navigation
            </p>
            {navItems
              .filter((n) => n.show)
              .map((n) => {
                const requiresDiscordAuth = n.requireAuth && !user;
                const isActive = isPathActive(pathname, n.id);

                if (requiresDiscordAuth) {
                  return (
                    <button
                      key={n.id}
                      onClick={(e) => {
                        e.preventDefault();
                        setLoginModalOpen(true);
                        setMobileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] text-white/70 hover:bg-white/[0.05] active:bg-white/[0.07] transition-all flex items-center gap-3"
                    >
                      {n.icon}
                      {n.label}
                    </button>
                  );
                }

                return (
                  <Link
                    key={n.id}
                    href={n.id}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full px-3 py-2.5 rounded-lg text-[13px] hover:bg-white/[0.05] active:bg-white/[0.07] transition-all flex items-center gap-3 ${
                      isActive ? 'font-semibold' : 'text-white/70'
                    }`}
                    style={
                      isActive
                        ? {
                            background: 'rgba(var(--theme-accent-rgb), 0.12)',
                            color: 'var(--theme-accent)',
                          }
                        : {}
                    }
                  >
                    {n.icon}
                    {n.label}
                  </Link>
                );
              })}

            {/* Account Sections (only when logged in) */}
            {user &&
              dropdownSections.map((section) => (
                <div key={section.label}>
                  <p className="px-3 pt-3 pb-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-white/35">
                    {section.label}
                  </p>
                  {section.items.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => {
                        it.onClick();
                        setMobileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] text-white/75 hover:text-white hover:bg-white/[0.05] active:bg-white/[0.07] transition-all flex items-center gap-3"
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: it.color.replace('rgb', 'rgba').replace(')', ', 0.12)'),
                          border: `1px solid ${it.color
                            .replace('rgb', 'rgba')
                            .replace(')', ', 0.2)')}`,
                        }}
                      >
                        <it.icon className="w-3.5 h-3.5" style={{ color: it.color }} />
                      </span>
                      {it.label}
                    </button>
                  ))}
                </div>
              ))}

            {/* Settings (only when logged in) */}
            {user && (
              <>
                <p className="px-3 pt-3 pb-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-white/35">
                  Einstellungen
                </p>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setThemeModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] text-white/75 hover:text-white hover:bg-white/[0.05] active:bg-white/[0.07] transition-all flex items-center gap-3"
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                    }}
                  >
                    <Palette className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                  Theme
                </button>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setInstallModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] text-white/75 hover:text-white hover:bg-white/[0.05] active:bg-white/[0.07] transition-all flex items-center gap-3"
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(59, 130, 246, 0.12)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                    }}
                  >
                    <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  </span>
                  App installieren
                </button>

                {/* Logout */}
                <div className="mt-2 pt-2 border-t border-white/[0.05]">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] text-red-400/80 hover:text-red-300 hover:bg-red-500/[0.08] active:bg-red-500/[0.1] transition-all flex items-center gap-3"
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                      }}
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-400" />
                    </span>
                    Abmelden
                  </button>
                </div>
              </>
            )}

            {/* Login Button (not logged in) */}
            {!user && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setLoginModalOpen(true);
                }}
                className="w-full mt-2 px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'var(--theme-accent)',
                  color: '#000',
                  boxShadow: '0 10px 25px -5px rgba(var(--theme-accent-rgb), 0.25)',
                }}
              >
                <DiscordIcon size={14} />
                Mit Discord anmelden
              </button>
            )}
          </div>
        </div>
      )}

      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
      <ThemeModal open={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
      {installModalOpen && <InstallModal onClose={() => setInstallModalOpen(false)} />}
    </nav>
  );
}
