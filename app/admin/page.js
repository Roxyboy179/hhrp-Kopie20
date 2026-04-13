'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Loader2, Lock, LogIn, LogOut, FileText, UserPlus, 
  AlertTriangle, Settings, Shield
} from 'lucide-react';

const inputClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ mitarbeiterNummer: '', email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();
        if (data.admin) setAdmin(data.admin);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    } catch (e) {
      setLoginError(e.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAdmin(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

            {user && user.adminLevel > 0 && (
              <div className="mt-6 text-center">
                <div className="w-full h-px bg-white/[0.06] mb-6" />
                <p className="text-white/30 text-sm mb-3">
                  Angemeldet als <span className="text-blue-300 font-medium">{user.adminRole}</span>
                </p>
                <Button 
                  variant="outline" 
                  className="border-blue-500/20 text-blue-300 hover:bg-blue-500/10 rounded-xl"
                  onClick={() => setAdmin({ 
                    discordUserId: user.id, 
                    discordUsername: user.globalName || user.username, 
                    roleName: user.adminRole, 
                    roleLevel: user.adminLevel, 
                    canCreateAccounts: user.canCreateAccounts, 
                    canSeeAll: user.canSeeAll, 
                    viaDiscord: true 
                  })}
                >
                  Mit Discord-Rolle fortfahren
                </Button>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">Admin Panel</h2>
            <p className="text-white/40 text-sm mt-1">
              Rolle: <span className="text-blue-300">{admin.roleName}</span>
              {admin.discordUsername && ` | ${admin.discordUsername}`}
            </p>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="text-white/40 hover:text-white gap-2 rounded-xl"
          >
            <LogOut className="w-4 h-4" /> Abmelden
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GlassCard hover className="p-6" onClick={() => router.push('/admin/bewerbungen')}>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Bewerbungen</h3>
            <p className="text-white/40 text-sm">Verwalte alle eingereichten Bewerbungen</p>
          </GlassCard>

          {(admin.canCreateAccounts || admin.roleLevel >= 3) && (
            <GlassCard hover className="p-6" onClick={() => router.push('/admin/accounts')}>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                <UserPlus className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">Accounts</h3>
              <p className="text-white/40 text-sm">Verwalte Admin-Accounts</p>
            </GlassCard>
          )}

          <GlassCard hover className="p-6">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Einstellungen</h3>
            <p className="text-white/40 text-sm">Systemeinstellungen anpassen</p>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="font-bold mb-1">Admin-Dashboard in Entwicklung</h3>
              <p className="text-white/40 text-sm">
                Das vollständige Admin-Dashboard mit Statistiken, Bewerbungsverwaltung und mehr kommt bald.
                Derzeit können Sie über die Navigation auf Bewerbungen und Accounts zugreifen.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
