'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, Lock, LogIn, FileText, UserPlus, 
  Clock, CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, Users, Activity
} from 'lucide-react';

const inputClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl";

export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [loginForm, setLoginForm] = useState({ mitarbeiterNummer: '', email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();
        if (data.admin) {
          setAdmin(data.admin);
          await fetchStats();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      console.error(e);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdmin(data.admin);
      await fetchStats();
    } catch (e) {
      setLoginError(e.message);
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

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
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Mitarbeiter Nummer</Label>
                <Input 
                  value={loginForm.mitarbeiterNummer} 
                  onChange={e => setLoginForm({...loginForm, mitarbeiterNummer: e.target.value})} 
                  placeholder="z.B. MA-001" 
                  className={inputClass} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-sm">E-Mail / Benutzername</Label>
                <Input 
                  value={loginForm.email} 
                  onChange={e => setLoginForm({...loginForm, email: e.target.value})} 
                  placeholder="deine@email.de" 
                  className={inputClass} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Passwort</Label>
                <Input 
                  type="password" 
                  value={loginForm.password} 
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})} 
                  placeholder="••••••••" 
                  className={inputClass} 
                  required 
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                  {loginError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loginLoading} 
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                Anmelden
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Willkommen zurück!</h1>
        <p className="text-white/40">
          {admin.discordUsername} · {admin.roleName}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-sm">Gesamt</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold">{stats?.total || 0}</p>
          <p className="text-xs text-white/30 mt-1">Bewerbungen</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-sm">Eingereicht</span>
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold">{stats?.eingereicht || 0}</p>
          <p className="text-xs text-white/30 mt-1">Warten auf Bearbeitung</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-sm">In Bearbeitung</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold">{stats?.inBearbeitung || 0}</p>
          <p className="text-xs text-white/30 mt-1">Wird gerade bearbeitet</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-sm">Angenommen</span>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold">{stats?.angenommen || 0}</p>
          <p className="text-xs text-white/30 mt-1">Erfolgreiche Bewerbungen</p>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GlassCard hover className="p-6" onClick={() => router.push('/admin/bewerbungen')}>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold mb-2">Bewerbungen verwalten</h3>
          <p className="text-white/40 text-sm mb-4">
            Alle eingereichten Bewerbungen ansehen, bearbeiten und Status ändern
          </p>
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <span>Jetzt öffnen</span>
            <TrendingUp className="w-3 h-3" />
          </div>
        </GlassCard>

        {(admin.canCreateAccounts || admin.roleLevel >= 3) && (
          <GlassCard hover className="p-6" onClick={() => router.push('/admin/accounts')}>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Admin Accounts</h3>
            <p className="text-white/40 text-sm mb-4">
              Admin-Accounts erstellen, verwalten und Berechtigungen anpassen
            </p>
            <div className="flex items-center gap-2 text-xs text-green-400">
              <span>Jetzt öffnen</span>
              <TrendingUp className="w-3 h-3" />
            </div>
          </GlassCard>
        )}

        <GlassCard className="p-6 opacity-50">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold mb-2">Statistiken</h3>
          <p className="text-white/40 text-sm mb-4">
            Detaillierte Analysen und Berichte (Bald verfügbar)
          </p>
        </GlassCard>
      </div>

      {/* Info Card */}
      <GlassCard className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold mb-1">Admin Panel - Hamburg Horizon RP</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Über das Admin Panel können Sie Bewerbungen verwalten, Admin-Accounts erstellen und das System überwachen. 
              Nutzen Sie die Sidebar-Navigation, um zwischen den verschiedenen Bereichen zu wechseln.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
