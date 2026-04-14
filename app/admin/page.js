'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2, Lock, LogIn, FileText, UserPlus, 
  Clock, CheckCircle2, XCircle, AlertTriangle,
  Users, Shield, Eye, EyeOff
} from 'lucide-react';

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
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login Form State
  const [mitarbeiterNummer, setMitarbeiterNummer] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/me');
      const data = await res.json();
      if (data.admin) {
        setAdmin(data.admin);
        await fetchStats();
      }
    } catch (e) {
      console.error('[DEBUG] Auth check error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/bewerbungen');
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

  // Stiller Auto-Refresh für Stats
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
      await fetchStats();
      
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
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setAdmin(null);
      setStats(null);
      toast.success('Abgemeldet', { description: 'Du wurdest erfolgreich abgemeldet.' });
    } catch (e) {
      console.error('[DEBUG] Logout error:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  // LOGIN FORM
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full animate-fade-in-up">
          <GlassCard className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">Admin Panel</h2>
              <p className="text-white/40 text-sm mt-2">Melde dich mit deinen Anmeldedaten an</p>
              <p className="text-white/25 text-xs mt-1">Deine Discord-Rolle bestimmt deine Berechtigungen</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Mitarbeiter Nummer</Label>
                <Input 
                  value={mitarbeiterNummer} 
                  onChange={e => setMitarbeiterNummer(e.target.value)} 
                  placeholder="z.B. MA-001" 
                  className={inputClass} 
                  required 
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-sm">E-Mail / Benutzername</Label>
                <Input 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="deine@email.de" 
                  className={inputClass} 
                  required 
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Passwort</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? 'text' : 'password'}
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Dein Passwort" 
                    className={`${inputClass} pr-10`} 
                    required 
                    autoComplete="off"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
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
          </GlassCard>
        </div>
      </div>
    );
  }

  // DASHBOARD - Rechte-basiert
  const canSeeAccounts = admin.canCreateAccounts || admin.roleLevel >= 3;
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-white/40">Willkommen zurück, {admin.discordUsername}!</p>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(admin.roleName)}`}>
              {admin.roleName} (Lv.{admin.roleLevel})
            </span>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="rounded-xl border-white/10"
        >
          Abmelden
        </Button>
      </div>

      {/* Rechte-Info */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3 text-sm">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-white/60">Deine Berechtigungen:</span>
          <span className={`px-2 py-0.5 rounded text-xs ${admin.canSeeAll ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {admin.canSeeAll ? 'Alle Bewerbungen sehen' : 'Eingeschränkte Sicht'}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${admin.canCreateAccounts ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {admin.canCreateAccounts ? 'Accounts erstellen' : 'Keine Account-Verwaltung'}
          </span>
        </div>
      </GlassCard>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="text-2xl font-bold">{stats?.total || 0}</span>
          </div>
          <p className="text-white/60 text-sm">Gesamt Bewerbungen</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className="text-2xl font-bold">{stats?.eingereicht || 0}</span>
          </div>
          <p className="text-white/60 text-sm">Eingereicht</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-2xl font-bold">{stats?.angenommen || 0}</span>
          </div>
          <p className="text-white/60 text-sm">Angenommen</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-2xl font-bold">{stats?.abgelehnt || 0}</span>
          </div>
          <p className="text-white/60 text-sm">Abgelehnt</p>
        </GlassCard>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <GlassCard 
          className="p-6 cursor-pointer hover:bg-white/[0.03] transition-colors"
          onClick={() => router.push('/admin/bewerbungen')}
        >
          <FileText className="w-8 h-8 text-blue-400 mb-3" />
          <h3 className="text-xl font-semibold mb-2">Bewerbungen verwalten</h3>
          <p className="text-white/40 text-sm">Bewerbungen anzeigen, bearbeiten und Status ändern</p>
        </GlassCard>

        {canSeeAccounts && (
          <GlassCard 
            className="p-6 cursor-pointer hover:bg-white/[0.03] transition-colors"
            onClick={() => router.push('/admin/accounts')}
          >
            <Users className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Admin Accounts</h3>
            <p className="text-white/40 text-sm">
              {admin.canCreateAccounts 
                ? 'Admin-Konten erstellen und verwalten' 
                : 'Admin-Konten anzeigen'
              }
            </p>
          </GlassCard>
        )}

        {!canSeeAccounts && (
          <GlassCard className="p-6 opacity-40">
            <Users className="w-8 h-8 text-white/20 mb-3" />
            <h3 className="text-xl font-semibold mb-2 text-white/40">Admin Accounts</h3>
            <p className="text-white/20 text-sm">Keine Berechtigung (min. Level 3 erforderlich)</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
