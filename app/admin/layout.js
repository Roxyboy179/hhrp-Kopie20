'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, FileText, UserPlus, Settings, LogOut, 
  Menu, X, Shield, ChevronRight, Sliders, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
    const interval = setInterval(checkAdmin, 15000);
    return () => clearInterval(interval);
  }, []);

  const checkAdmin = async () => {
    try {
      const res = await fetch('/api/admin/me');
      const data = await res.json();
      if (data.admin) {
        setAdmin(data.admin);
      } else if (data.forceLogout) {
        toast.error('Account deaktiviert', { 
          description: data.error || 'Dein Account wurde deaktiviert.' 
        });
        setAdmin(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isLoginPage = pathname === '/admin';

  // Wenn kein Admin eingeloggt: Nur Content (Login-Formular)
  if (!admin) {
    return <div className="min-h-screen bg-slate-950">{children}</div>;
  }

  // Wenn eingeloggt: Zeige Sidebar + Navbar für ALLE Admin-Seiten (inkl. Dashboard)

  // Navigation basierend auf Rechten
  const canSeeAccounts = admin?.canCreateAccounts || (admin?.roleLevel >= 3);
  const canManageBewerbungen = admin?.roleLevel >= 3;
  
  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, show: true },
    { href: '/admin/bewerbungen', label: 'Bewerbungen', icon: <FileText className="w-5 h-5" />, show: true },
    { href: '/admin/bewerbung-verwaltung', label: 'Bewerbungs-Verwaltung', icon: <Sliders className="w-5 h-5" />, show: canManageBewerbungen },
    { href: '/admin/logs', label: 'Aktivitäts-Logs', icon: <Clock className="w-5 h-5" />, show: true },
    { href: '/admin/accounts', label: 'Accounts', icon: <UserPlus className="w-5 h-5" />, show: canSeeAccounts },
    { href: '/admin/einstellungen', label: 'Einstellungen', icon: <Settings className="w-5 h-5" />, show: true },
  ];

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    toast.success('Abgemeldet');
    setAdmin(null);
    router.push('/admin');
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed md:relative z-50 h-full w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/[0.06] transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/[0.06]">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg">HHRP Admin</span>
                <span className="text-[10px] text-white/30 block -mt-1">Hamburg Horizon RP</span>
              </div>
            </Link>
          </div>

          {admin && (
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-sm text-white/70 truncate">{admin.discordUsername}</p>
              <p className="text-[10px] text-white/30">{admin.roleName} - Lv.{admin.roleLevel}</p>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.filter(n => n.show).map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/[0.06] space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium text-sm">Zurück zur Webseite</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Abmelden</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar - Immer sichtbar wenn eingeloggt */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4 md:px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-white/70 hover:text-white rounded-xl"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          
          <span className="ml-4 md:ml-0 font-bold text-white">HHRP Admin</span>
          
          {/* Desktop: Admin Info */}
          <div className="ml-auto hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-white/80 font-medium">{admin.discordUsername}</p>
              <p className="text-xs text-white/40">{admin.roleName}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
