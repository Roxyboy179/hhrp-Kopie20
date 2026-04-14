'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield, LogOut, Menu, X, Globe, FileText, Eye, Settings, User, Loader2
} from 'lucide-react';

const DiscordIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

export function Navbar({ user, loading }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const navItems = [
    { id: '/', label: 'Startseite', icon: <Globe className="w-4 h-4" />, show: true },
    { id: '/bewerbung', label: 'Team-Bewerbung', icon: <FileText className="w-4 h-4" />, show: true, requireAuth: true },
    { id: '/meine-bewerbungen', label: 'Meine Bewerbungen', icon: <Eye className="w-4 h-4" />, show: !!user },
    { id: '/admin', label: 'Admin', icon: <Settings className="w-4 h-4" />, show: user?.adminLevel > 0 },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-2xl border-b border-white/[0.04] shadow-2xl shadow-black/40' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 cursor-pointer select-none group">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-black/30 group-hover:shadow-black/50 transition-all group-hover:scale-105 overflow-hidden">
            <img src="/logo.webp" alt="HHRP" className="w-full h-full object-cover" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg tracking-tight">HHRP</span>
            <span className="text-[10px] text-white/30 block -mt-1">Hamburg Horizon RP</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1 bg-white/[0.03] backdrop-blur-xl rounded-2xl p-1 border border-white/[0.06]">
          {navItems.filter(n => n.show).map(n => {
            const requiresDiscordAuth = n.requireAuth && !user;
            const isActive = pathname === n.id;
            
            if (requiresDiscordAuth) {
              return (
                <button
                  key={n.id}
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/api/auth/discord';
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
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
              <a
                key={n.id}
                href={n.id}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-300 shadow-inner shadow-blue-500/10'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
                }`}
              >
                {n.icon}<span className="hidden lg:inline">{n.label}</span>
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                {user.avatar ? (
                  <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`} alt="" className="w-7 h-7 rounded-full ring-2 ring-blue-500/20" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center"><User className="w-3.5 h-3.5" /></div>
                )}
                <span className="text-sm text-white/70 max-w-[100px] truncate">{user.globalName || user.username}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/30 hover:text-white hover:bg-white/[0.06] rounded-xl h-9 w-9">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/api/auth/discord';
              }}
              className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg shadow-[#5865F2]/25 hover:shadow-[#5865F2]/40 transition-all hover:scale-105 active:scale-95"
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
                    window.location.href = '/api/auth/discord';
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm text-white/70 hover:bg-white/[0.06] transition-all flex items-center gap-3"
                >
                  {n.icon}{n.label}
                </button>
              );
            }
            
            return (
              <a
                key={n.id}
                href={n.id}
                onClick={() => setMobileOpen(false)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm text-white/70 hover:bg-white/[0.06] transition-all flex items-center gap-3"
              >
                {n.icon}{n.label}
              </a>
            );
          })}
        </div>
      )}
    </nav>
  );
}
