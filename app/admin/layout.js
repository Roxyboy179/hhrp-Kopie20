'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, FileText, UserPlus, Settings, LogOut, 
  Menu, X, ChevronRight, Sliders, Clock, Shield, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminAuthProvider, useAdminAuth } from '@/components/providers/AdminAuthProvider';

export default function AdminLayout({ children }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminAuthProvider>
  );
}

function AdminLayoutInner({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation basierend auf Rechten
  const canSeeAccounts = admin?.canCreateAccounts || (admin?.roleLevel >= 3);
  const canManageBewerbungen = admin?.roleLevel >= 3;

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, show: true },
    { href: '/admin/bewerbungen', label: 'Bewerbungen', icon: <FileText className="w-[18px] h-[18px]" />, show: true },
    { href: '/admin/bewerbung-verwaltung', label: 'Bewerbungs-Verwaltung', icon: <Sliders className="w-[18px] h-[18px]" />, show: canManageBewerbungen },
    { href: '/admin/verwarnungen', label: 'Verwarnungen', icon: <AlertTriangle className="w-[18px] h-[18px]" />, show: true },
    { href: '/admin/logs', label: 'Aktivitäts-Logs', icon: <Clock className="w-[18px] h-[18px]" />, show: true },
    { href: '/admin/accounts', label: 'Accounts', icon: <UserPlus className="w-[18px] h-[18px]" />, show: canSeeAccounts },
    { href: '/admin/system-status', label: 'System-Status', icon: <Shield className="w-[18px] h-[18px]" />, show: admin?.roleLevel >= 4 },
    { href: '/admin/einstellungen', label: 'Einstellungen', icon: <Settings className="w-[18px] h-[18px]" />, show: true },
  ];

  const handleLogout = async () => {
    await logout();
    toast.success('Abgemeldet', { description: 'Du wurdest komplett abgemeldet.' });
    router.push('/');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0b' }}>
      {/* Subtle ambient background glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,255,255,0.025), transparent 60%)',
        }}
      />

      {/* ═══ SIDEBAR ═══ */}
      <aside
        className={`fixed md:relative z-50 h-full w-64 flex-shrink-0 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(16,16,18,0.96) 0%, rgba(10,10,12,0.98) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Subtle top gradient line */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
        />

        <div className="flex flex-col h-full relative">
          {/* Logo */}
          <div className="px-5 py-6 border-b border-white/[0.05]">
            <Link href="/" className="flex items-center gap-3 group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.08] transition-all group-hover:scale-105 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <img src="/logo.webp" alt="HHRP" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-[15px] tracking-tight text-white/95">HHRP Admin</span>
                <span className="text-[10px] text-white/35 mt-0.5">Hamburg Horizon RP</span>
              </div>
            </Link>
          </div>

          {/* Admin Info */}
          {admin && (
            <div
              className="mx-3 mt-3 px-3 py-2.5 rounded-xl border border-white/[0.06]"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))' }}
            >
              <p className="text-[12.5px] text-white/80 font-medium truncate">{admin.discordUsername}</p>
              <p className="text-[10px] text-white/35 mt-0.5">{admin.roleName} · Lv.{admin.roleLevel}</p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-none">
            {navItems.filter(n => n.show).map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'text-white'
                      : 'text-white/55 hover:text-white/90 hover:bg-white/[0.03]'
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  } : {
                    border: '1px solid transparent',
                  }}
                >
                  {/* Active accent bar */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r-full"
                      style={{ background: 'rgba(255,255,255,0.6)', boxShadow: '0 0 6px rgba(255,255,255,0.4)' }}
                    />
                  )}
                  <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-white/90' : 'text-white/45 group-hover:text-white/70'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium text-[13px] tracking-tight truncate">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/40" />}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-white/[0.05] space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/55 hover:text-white/90 hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/[0.06]"
            >
              <Settings className="w-[18px] h-[18px] text-white/45" />
              <span className="font-medium text-[13px]">Zurück zur Webseite</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/55 hover:text-white transition-all border border-transparent hover:border-white/[0.08]"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut className="w-[18px] h-[18px] text-white/45" />
              <span className="font-medium text-[13px]">Abmelden</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        />
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header
          className="md:hidden h-14 flex items-center px-3 relative z-10 flex-shrink-0"
          style={{
            background: 'linear-gradient(180deg, rgba(16,16,18,0.92) 0%, rgba(12,12,14,0.96) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-all active:scale-95"
            aria-label={sidebarOpen ? 'Menü schließen' : 'Menü öffnen'}
          >
            {sidebarOpen ? <X className="w-4 h-4 text-white/80" /> : <Menu className="w-4 h-4 text-white/80" />}
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/[0.08] overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))' }}
            >
              <img src="/logo.webp" alt="HHRP" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold text-[14px] text-white/90 tracking-tight">HHRP Admin</span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto relative z-0">
          {children}
        </main>
      </div>
    </div>
  );
}
