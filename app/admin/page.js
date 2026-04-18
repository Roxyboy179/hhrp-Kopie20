'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminCardHeader } from '@/components/admin/AdminCard';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2, Lock, LogIn, FileText, UserPlus, 
  Clock, CheckCircle2, XCircle, AlertTriangle,
  Users, Shield, Eye, EyeOff, Activity, Settings,
  BarChart3, TrendingUp
} from 'lucide-react';
import { useAdminAuth } from '@/components/providers/AdminAuthProvider';

const inputClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl";

function getRoleBadgeColor(roleName) {
  switch (roleName) {
    case 'Projektinhaber': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'Stl. Projektinhaber': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'Teamkoordination': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'Qualitätsmanagement': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'Teamvertretung': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'Teamleitung': return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'Stl. Teamleitung': return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
}

export default function AdminPage() {
  const router = useRouter();
  const { admin, loading, setAdmin, logout } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login Form State
  const [mitarbeiterNummer, setMitarbeiterNummer] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/bewerbungen', { credentials: 'include' });
      const data = await res.json();
      const bewerbungen = data.bewerbungen || [];
      setStats({
        total: bewerbungen.length,
        eingereicht: bewerbungen.filter(b => b.status === 'Eingereicht').length,
        inBearbeitung: bewerbungen.filter(b => b.status === 'In Bearbeitung').length,
        angenommen: bewerbungen.filter(b => b.status === 'Angenommen').length,
        abgelehnt: bewerbungen.filter(b => b.status === 'Abgelehnt').length,
      });
    } catch (e) {
      console.error('[DEBUG] Stats fetch error:', e);
    }
  };

  // Stats laden wenn Admin eingeloggt ist
  useEffect(() => {
    if (admin) {
      fetchStats();
    } else {
      setStats(null);
    }
  }, [admin]);

  // Stiller Auto-Refresh fuer Stats
  useEffect(() => {
    if (!admin) return;
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [admin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mitarbeiterNummer: mitarbeiterNummer.trim(),
          email: email.trim(),
          password: password
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Login fehlgeschlagen');
      }
      
      setAdmin(data.admin);
      
      toast.success('Erfolgreich angemeldet', {
        description: `Willkommen, ${data.admin.discordUsername}! Rolle: ${data.admin.roleName}`,
      });
    } catch (e) {
      console.error('[DEBUG] Login error:', e);
      setLoginError(e.message);
      toast.error('Anmeldung fehlgeschlagen', { description: e.message });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Abgemeldet', { description: 'Du wurdest komplett abgemeldet.' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  // LOGIN FORM - Improved Design
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
        <div className="max-w-md w-full animate-fade-in-up">
          <AdminCard className="p-8">
            <AdminCardHeader 
              icon={Lock}
              title="Admin Panel"
              subtitle="Melde dich mit deinen Anmeldedaten an"
            />

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Mitarbeiter Nummer</Label>
                <Input 
                  value={mitarbeiterNummer} 
                  onChange={e => setMitarbeiterNummer(e.target.value)} 
                  placeholder="z.B. MA001" 
                  className={inputClass}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Email</Label>
                <Input 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  type="email" 
                  placeholder="deine@email.com" 
                  className={inputClass}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Passwort</Label>
                <div className="relative">
                  <Input 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    className={`${inputClass} pr-10`}
                    required 
                    autoComplete="off"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-red-300 text-sm">{loginError}</span>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loginLoading} 
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-11"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Wird angemeldet...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Anmelden
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-white/30 text-xs text-center">
                Hamburg Horizon RP - Admin Dashboard
              </p>
            </div>
          </AdminCard>
        </div>
      </div>
    );
  }

  // DASHBOARD - Improved with new Components
  const canSeeAccounts = admin.canCreateAccounts || admin.roleLevel >= 3;
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-white/60">Willkommen zurück, {admin.discordUsername}!</p>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(admin.roleName)}`}>
              {admin.roleName} (Lv.{admin.roleLevel})
            </span>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="rounded-xl border-white/10 hover:border-white/20"
        >
          Abmelden
        </Button>
      </div>

      {/* Permissions Card */}
      <AdminCard className="p-4">
        <div className="flex items-center gap-3 flex-wrap text-sm">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-white/60">Deine Berechtigungen:</span>
          <span className={`px-2 py-0.5 rounded text-xs ${admin.canSeeAll ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {admin.canSeeAll ? 'Alle Bewerbungen sehen' : 'Eingeschränkte Sicht'}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${admin.canCreateAccounts ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {admin.canCreateAccounts ? 'Accounts erstellen' : 'Keine Account-Verwaltung'}
          </span>
        </div>
      </AdminCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard 
          icon={FileText}
          label="Gesamt Bewerbungen"
          value={stats?.total || 0}
          color="blue"
        />
        <AdminStatCard 
          icon={Clock}
          label="Eingereicht"
          value={stats?.eingereicht || 0}
          color="yellow"
        />
        <AdminStatCard 
          icon={CheckCircle2}
          label="Angenommen"
          value={stats?.angenommen || 0}
          color="green"
        />
        <AdminStatCard 
          icon={XCircle}
          label="Abgelehnt"
          value={stats?.abgelehnt || 0}
          color="red"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Schnellzugriff
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminCard 
            className="cursor-pointer group"
            hover
            onClick={() => router.push('/admin/bewerbungen')}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Bewerbungen</h3>
                <p className="text-white/60 text-sm">Bewerbungen anzeigen, bearbeiten und Status ändern</p>
              </div>
            </div>
          </AdminCard>

          {canSeeAccounts ? (
            <AdminCard 
              className="cursor-pointer group"
              hover
              onClick={() => router.push('/admin/accounts')}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Admin Accounts</h3>
                  <p className="text-white/60 text-sm">
                    {admin.canCreateAccounts 
                      ? 'Admin-Konten erstellen und verwalten' 
                      : 'Admin-Konten anzeigen'
                    }
                  </p>
                </div>
              </div>
            </AdminCard>
          ) : (
            <AdminCard className="opacity-40 cursor-not-allowed">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white/20" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white/40 mb-1">Admin Accounts</h3>
                  <p className="text-white/20 text-sm">Keine Berechtigung (min. Level 3 erforderlich)</p>
                </div>
              </div>
            </AdminCard>
          )}

          <AdminCard 
            className="cursor-pointer group"
            hover
            onClick={() => router.push('/admin/system-status')}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">System Status</h3>
                <p className="text-white/60 text-sm">Server-Status und Performance-Metriken</p>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
