'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield, LogOut, Menu, X, Globe, FileText, Eye, Settings, User, Loader2, Bell, Users, ChevronDown, FlaskConical, Headphones
} from 'lucide-react';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { LoginModal } from '@/components/LoginModal';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const DiscordIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

export function Navbar({ user, loading }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    refreshUser();
    router.push('/'); // Zur Startseite nach Logout
  };

  const navItems = [
    { id: '/', label: 'Startseite', icon: <Globe className="w-4 h-4" />, show: true },
    { id: '/bewerbung', label: 'Team-Bewerbung', icon: <FileText className="w-4 h-4" />, show: true, requireAuth: true },
    { id: '/meine-bewerbungen', label: 'Meine Bewerbungen', icon: <Eye className="w-4 h-4" />, show: !!user },
    { id: '/voice-support', label: 'Voice Support', icon: <Headphones className="w-4 h-4" />, show: !!user },
    { id: '/faq', label: 'FAQ', icon: <FileText className="w-4 h-4" />, show: true },
    { id: '/team', label: 'Team', icon: <Users className="w-4 h-4" />, show: true },
    { id: '/beta', label: 'Beta', icon: <FlaskConical className="w-4 h-4" />, show: user?.roles?.includes('1494434149623136276') },
    { id: '/admin', label: 'Admin', icon: <Settings className="w-4 h-4" />, show: user?.adminLevel > 0 },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-2xl border-b border-white/[0.04] shadow-2xl shadow-black/40' : 'bg-transparent'}`}>
      <div className="w-full h-16">
        <div className="flex items-center h-full">
          {/* Logo - Ganz links am Rand */}
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

          {/* Navigation Tabs - Absolut in Bildschirmmitte */}
          <div className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1 bg-white/[0.03] backdrop-blur-xl rounded-2xl p-1 border border-white/[0.06]">
              {navItems.filter(n => n.show).map(n => {
                const requiresDiscordAuth = n.requireAuth && !user;
                const isActive = pathname === n.id;
                
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
                      {n.icon}<span className="hidden lg:inline">{n.label}</span>
                    </button>
                  );
                }
                
                return (
                  <Link
                    key={n.id}
                    href={n.id}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                      isActive
                        ? '' 
                        : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
                    }`}
                    style={isActive ? {
                      background: 'rgba(var(--theme-accent-rgb), 0.15)',
                      color: 'var(--theme-accent)',
                      boxShadow: 'inset 0 1px 2px rgba(var(--theme-accent-rgb), 0.1)'
                    } : {}}
                  >
                    {n.icon}<span className="hidden lg:inline">{n.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
            
          {/* Profile + Bell - Ganz rechts am Rand */}
          <div className="flex items-center justify-end gap-3 pr-4 sm:pr-6 flex-1">
            {loading ? (
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                
                {/* Profil Dropdown */}
                <DropdownMenu onOpenChange={setProfileDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                      {user.avatar ? (
                        <img 
                          src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`} 
                          alt={user.globalName || user.username} 
                          className="w-7 h-7 rounded-full transition-transform group-hover:scale-110" 
                          style={{ boxShadow: '0 0 0 2px rgba(var(--theme-accent-rgb), 0.2)' }} 
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: 'rgba(var(--theme-accent-rgb), 0.3)' }}>
                          <User className="w-3.5 h-3.5" style={{ color: 'var(--theme-accent)' }} />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors max-w-[120px] truncate">{user.globalName || user.username}</span>
                        {(() => {
                          const licenses = user?.licenses || [];
                          
                          // Hilfsfunktion: Prüfe ob User eine Lizenz hat (unterstützt String und Object Format)
                          const hasLicense = (licenseId) => {
                            if (!licenseId) return false;
                            return licenses.some(l => {
                              if (!l) return false; // Sicherheitscheck
                              if (typeof l === 'string') return l === licenseId;
                              if (typeof l === 'object') return (l.name === licenseId || l.id === licenseId);
                              return false;
                            });
                          };
                          
                          const hasLuxusPass = hasLicense('luxus_pass');
                          const hasVipElitePlus = hasLicense('vip_elite_plus');
                          const hasVipUltimate = hasLicense('vip_ultimate');
                          const hasVipPlatinum = hasLicense('vip_platinum');
                          const hasVipPremium = hasLicense('vip_premium');
                          const hasBetaTester = user.roles?.includes('1494434149623136276');
                          
                          let vipStatus = '';
                          if (hasLuxusPass) vipStatus = 'Luxus-Pass';
                          else if (hasVipElitePlus) vipStatus = 'VIP Elite Plus';
                          else if (hasVipUltimate) vipStatus = 'VIP Ultimate';
                          else if (hasVipPlatinum) vipStatus = 'VIP Platinum';
                          else if (hasVipPremium) vipStatus = 'VIP Premium';
                          else vipStatus = 'Standard Plan "Free"';
                          
                          const statusText = hasBetaTester 
                            ? `${vipStatus} · Beta Tester`
                            : vipStatus;
                          
                          return (
                            <span className="text-[10px] font-medium leading-tight" style={{ color: 'var(--theme-accent)' }}>
                              {statusText}
                            </span>
                          );
                        })()}
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 text-white/40 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : 'rotate-0'}`} 
                      />
                    </button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent 
                    align="end" 
                    className="w-48 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/[0.06] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
                  >
                    <DropdownMenuItem 
                      onClick={() => router.push('/profil')}
                      className="cursor-pointer flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/[0.06] focus:bg-white/[0.06] focus:text-white"
                    >
                      <User className="w-4 h-4" />
                      <span>Profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="cursor-pointer flex items-center gap-2 text-red-400/70 hover:text-red-400 hover:bg-white/[0.06] focus:bg-white/[0.06] focus:text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Abmelden</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setLoginModalOpen(true);
                }}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'var(--theme-accent)',
                  color: '#000',
                  boxShadow: '0 10px 25px -5px rgba(var(--theme-accent-rgb), 0.25)'
                }}
              >
                <DiscordIcon size={14} />
                <span className="hidden sm:inline">Anmelden</span>
              </button>
            )}
            <button className="md:hidden text-white/50 hover:text-white p-2 rounded-xl hover:bg-white/[0.04] transition-all" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass-strong mx-4 mb-4 rounded-2xl p-2 animate-fade-in-down space-y-1">
          {navItems.filter(n => n.show).map(n => {
            const requiresDiscordAuth = n.requireAuth && !user;
            
            if (requiresDiscordAuth) {
              return (
                <button
                  key={n.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setLoginModalOpen(true);
                    setMobileOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm text-white/70 hover:bg-white/[0.06] transition-all flex items-center gap-3"
                >
                  {n.icon}{n.label}
                </button>
              );
            }
            
            return (
              <Link
                key={n.id}
                href={n.id}
                onClick={() => setMobileOpen(false)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm text-white/70 hover:bg-white/[0.06] transition-all flex items-center gap-3"
              >
                {n.icon}{n.label}
              </Link>
            );
          })}
        </div>
      )}
      
      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </nav>
  );
}
