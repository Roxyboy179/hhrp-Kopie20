'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2, Lock, LogIn, FileText, UserPlus, 
  Clock, CheckCircle2, XCircle, AlertTriangle,
  Users, Shield, Eye, EyeOff, ArrowRight
} from 'lucide-react';
import { useAdminAuth } from '@/components/providers/AdminAuthProvider';

// ────────────────────────────────────────────────────────────
// Shared Style Constants (Überweisungsstil – monochrom)
// ────────────────────────────────────────────────────────────
const inputClass = "bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/25 focus:border-white/30 focus:ring-white/10 rounded-xl h-11";

const cardGradient = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};

function getRoleBadgeStyle(roleName) {
  // Subdued, meaningful status colors (like Überweisung)
  const map = {
    'Projektinhaber':     { color: 'rgba(252,165,165,0.95)', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.22)' },
    'Stl. Projektinhaber':{ color: 'rgba(253,186,116,0.95)', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.22)' },
    'Projektleitung'     :{ color: 'rgba(253,186,116,0.95)', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.22)' },
    'Stl. Projektleitung':{ color: 'rgba(253,186,116,0.95)', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.22)' },
    'Teamkoordination':   { color: 'rgba(253,224,71,0.95)',  bg: 'rgba(234,179,8,0.10)',  border: 'rgba(234,179,8,0.22)' },
    'Qualitätsmanagement':{ color: 'rgba(216,180,254,0.95)', bg: 'rgba(168,85,247,0.10)', border: 'rgba(168,85,247,0.22)' },
    'Teamvertretung':     { color: 'rgba(147,197,253,0.95)', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.22)' },
    'Teamleitung':        { color: 'rgba(134,239,172,0.95)', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.22)' },
    'Stl. Teamleitung':   { color: 'rgba(94,234,212,0.95)',  bg: 'rgba(20,184,166,0.10)', border: 'rgba(20,184,166,0.22)' },
  };
  return map[roleName] || { color: 'rgba(255,255,255,0.7)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' };
}

// Monochrome StatCard like Überweisung Balance-Cards
function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div
      className="p-5 rounded-2xl transition-all hover:translate-y-[-1px] relative overflow-hidden"
      style={cardGradient}
    >
      {/* Subtle top gradient line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
      />
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]"
          style={{
            background: `linear-gradient(135deg, ${accent || 'rgba(255,255,255,0.08)'}, rgba(255,255,255,0.02))`,
          }}
        >
          <Icon className="w-4 h-4 text-white/80" />
        </div>
        <span className="text-2xl font-bold text-white tabular-nums tracking-tight">{value}</span>
      </div>
      <p className="text-white/45 text-[12.5px] font-medium">{label}</p>
    </div>
  );
}

function ActionCard({ icon: Icon, title, description, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-left p-6 rounded-2xl transition-all relative overflow-hidden group w-full ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:translate-y-[-1px] cursor-pointer'
      }`}
      style={cardGradient}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
      />
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/[0.08] mb-4 transition-transform group-hover:scale-105"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))' }}
      >
        <Icon className="w-5 h-5 text-white/80" />
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-white/95 tracking-tight mb-1.5">{title}</h3>
        {!disabled && <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />}
      </div>
      <p className="text-white/45 text-[12.5px] leading-relaxed">{description}</p>
    </button>
  );
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
      
      // Shared Context aktualisieren - Layout-Sidebar wird SOFORT aktualisiert!
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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LOGIN FORM
  // ═══════════════════════════════════════════════════════════
  if (!admin) {
    return (
      <div className="min-h-full flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full animate-fade-in-up">
          <div
            className="p-7 rounded-2xl relative overflow-hidden"
            style={cardGradient}
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
            />

            <div className="text-center mb-7">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/[0.08]"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))' }}
              >
                <Lock className="w-6 h-6 text-white/75" />
              </div>
              <h2 className="text-xl font-semibold text-white tracking-tight">Admin Panel</h2>
              <p className="text-white/45 text-[13px] mt-1.5">Melde dich mit deinen Anmeldedaten an</p>
              <p className="text-white/25 text-[11px] mt-1">Deine Discord-Rolle bestimmt deine Berechtigungen</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-white/65 text-[12.5px] font-medium">Mitarbeiter Nummer</Label>
                <Input 
                  value={mitarbeiterNummer} 
                  onChange={e => setMitarbeiterNummer(e.target.value)} 
                  placeholder="z.B. MA-001" 
                  className={inputClass} 
                  required 
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/65 text-[12.5px] font-medium">E-Mail / Benutzername</Label>
                <Input 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="deine@email.de" 
                  className={inputClass} 
                  required 
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/65 text-[12.5px] font-medium">Passwort</Label>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div
                  className="rounded-xl px-3 py-2.5 flex items-center gap-2"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.18)',
                  }}
                >
                  <AlertTriangle className="w-4 h-4 text-red-300 flex-shrink-0" />
                  <span className="text-red-200/90 text-[12.5px]">{loginError}</span>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loginLoading} 
                className="w-full h-11 rounded-xl font-medium text-[13.5px] tracking-tight border-0 text-black hover:text-black transition-all"
                style={{
                  background: 'linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.1) inset, 0 8px 20px -6px rgba(0,0,0,0.6)',
                }}
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

            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <p className="text-white/30 text-[11px] text-center tracking-wide">
                Hamburg Horizon RP · Admin Dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════
  const canSeeAccounts = admin.canCreateAccounts || admin.roleLevel >= 3;
  const roleStyle = getRoleBadgeStyle(admin.roleName);
  
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">Dashboard</h1>
          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <p className="text-white/50 text-[13.5px]">Willkommen zurück, {admin.discordUsername}</p>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border tracking-tight"
              style={{
                color: roleStyle.color,
                background: roleStyle.bg,
                borderColor: roleStyle.border,
              }}
            >
              {admin.roleName} · Lv.{admin.roleLevel}
            </span>
          </div>
        </div>
        <Button 
          onClick={handleLogout}
          className="h-10 px-4 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/75 hover:bg-white/[0.08] hover:text-white hover:border-white/[0.15] transition-all font-medium text-[12.5px]"
        >
          Abmelden
        </Button>
      </div>

      {/* Berechtigungen Info */}
      <div className="p-4 rounded-2xl relative overflow-hidden" style={cardGradient}>
        <div className="flex items-center gap-3 text-[13px] flex-wrap">
          <Shield className="w-4 h-4 text-white/55 flex-shrink-0" />
          <span className="text-white/60 font-medium">Berechtigungen:</span>
          <span
            className="px-2.5 py-1 rounded-lg text-[11.5px] font-medium border"
            style={
              admin.canSeeAll
                ? { color: 'rgba(134,239,172,0.95)', background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' }
                : { color: 'rgba(252,165,165,0.95)', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }
            }
          >
            {admin.canSeeAll ? '✓ Alle Bewerbungen sehen' : '✕ Eingeschränkte Sicht'}
          </span>
          <span
            className="px-2.5 py-1 rounded-lg text-[11.5px] font-medium border"
            style={
              admin.canCreateAccounts
                ? { color: 'rgba(134,239,172,0.95)', background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' }
                : { color: 'rgba(252,165,165,0.95)', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }
            }
          >
            {admin.canCreateAccounts ? '✓ Accounts erstellen' : '✕ Keine Account-Verwaltung'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={FileText} label="Gesamt Bewerbungen" value={stats?.total ?? 0} accent="rgba(255,255,255,0.08)" />
        <StatCard icon={Clock} label="Eingereicht" value={stats?.eingereicht ?? 0} accent="rgba(234,179,8,0.18)" />
        <StatCard icon={CheckCircle2} label="Angenommen" value={stats?.angenommen ?? 0} accent="rgba(34,197,94,0.18)" />
        <StatCard icon={XCircle} label="Abgelehnt" value={stats?.abgelehnt ?? 0} accent="rgba(239,68,68,0.18)" />
      </div>

      {/* Action Grid */}
      <div className="grid md:grid-cols-2 gap-3 md:gap-4">
        <ActionCard
          icon={FileText}
          title="Bewerbungen verwalten"
          description="Bewerbungen anzeigen, bearbeiten und Status ändern"
          onClick={() => router.push('/admin/bewerbungen')}
        />
        {canSeeAccounts ? (
          <ActionCard
            icon={Users}
            title="Admin Accounts"
            description={admin.canCreateAccounts ? 'Admin-Konten erstellen und verwalten' : 'Admin-Konten anzeigen'}
            onClick={() => router.push('/admin/accounts')}
          />
        ) : (
          <ActionCard
            icon={Users}
            title="Admin Accounts"
            description="Keine Berechtigung (min. Level 3 erforderlich)"
            disabled
          />
        )}
      </div>
    </div>
  );
}
