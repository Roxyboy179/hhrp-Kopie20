'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2, Mail, Key, User, Shield, Eye, EyeOff,
  Save, AlertTriangle, CheckCircle2
} from 'lucide-react';

const inputClass = "bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/25 focus:border-white/30 focus:ring-white/10 rounded-xl h-11";

const cardStyle = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};

const primaryButtonStyle = {
  background: 'linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)',
  boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 8px 20px -6px rgba(0,0,0,0.6)',
  color: 'black',
};

function getRoleBadgeStyle(roleName) {
  const map = {
    'Projektinhaber':     { color: 'rgba(252,165,165,0.95)', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.22)' },
    'Stl. Projektinhaber':{ color: 'rgba(253,186,116,0.95)', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.22)' },
    'Projektleitung':     { color: 'rgba(253,186,116,0.95)', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.22)' },
    'Stl. Projektleitung':{ color: 'rgba(253,186,116,0.95)', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.22)' },
    'Teamkoordination':   { color: 'rgba(253,224,71,0.95)',  bg: 'rgba(234,179,8,0.10)',  border: 'rgba(234,179,8,0.22)' },
    'Qualitätsmanagement':{ color: 'rgba(216,180,254,0.95)', bg: 'rgba(168,85,247,0.10)', border: 'rgba(168,85,247,0.22)' },
    'Teamvertretung':     { color: 'rgba(147,197,253,0.95)', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.22)' },
    'Teamleitung':        { color: 'rgba(134,239,172,0.95)', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.22)' },
    'Stl. Teamleitung':   { color: 'rgba(94,234,212,0.95)',  bg: 'rgba(20,184,166,0.10)', border: 'rgba(20,184,166,0.22)' },
  };
  return map[roleName] || { color: 'rgba(255,255,255,0.7)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' };
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="p-5 md:p-6 rounded-2xl relative overflow-hidden" style={cardStyle}>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
      />
      <h3 className="text-[11px] font-semibold text-white/70 uppercase tracking-[0.12em] mb-5 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-white/55" /> {title}
      </h3>
      {children}
    </div>
  );
}

export default function AdminEinstellungenPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // E-Mail Form
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  
  // Passwort Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Admin-Auth prüfen
      const meRes = await fetch('/api/admin/me');
      const meData = await meRes.json();
      if (!meData.admin) {
        router.push('/admin');
        return;
      }
      setAdmin(meData.admin);
      
      // Einstellungen laden
      const settingsRes = await fetch('/api/admin/settings');
      const settingsData = await settingsRes.json();
      if (settingsData.settings) {
        setSettings(settingsData.settings);
        setNewEmail(settingsData.settings.email || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Ungültige E-Mail');
      return;
    }
    setEmailSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'email', value: newEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('E-Mail aktualisiert', { description: data.message });
      setSettings(prev => ({ ...prev, email: newEmail }));
    } catch (e) {
      toast.error('Fehler', { description: e.message });
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'password', currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Passwort aktualisiert', { 
        description: 'Du wirst automatisch abgemeldet...' 
      });
      
      // Automatische Abmeldung nach Passwort-Änderung
      if (data.forceLogout) {
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      }
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      toast.error('Fehler', { description: e.message });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
      </div>
    );
  }

  const roleStyle = getRoleBadgeStyle(settings?.roleName || admin?.roleName);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">Einstellungen</h1>
        <p className="text-white/45 text-[13px] mt-1.5">Dein Konto verwalten</p>
      </div>

      {/* Profil-Info (read-only) */}
      <Section icon={User} title="Profil">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <Label className="text-white/35 text-[10.5px] uppercase tracking-wider">Discord Username</Label>
            <p className="text-white/85 mt-1 font-medium text-[13.5px]">{settings?.discordUsername || admin?.discordUsername || '-'}</p>
          </div>
          <div>
            <Label className="text-white/35 text-[10.5px] uppercase tracking-wider">Discord ID</Label>
            <p className="text-white/85 mt-1 font-mono text-[12px]">{settings?.discordUserId || admin?.discordUserId || '-'}</p>
          </div>
          <div>
            <Label className="text-white/35 text-[10.5px] uppercase tracking-wider">Mitarbeiter-Nummer</Label>
            <p className="text-white/85 mt-1 font-medium text-[13.5px]">{settings?.mitarbeiterNummer || admin?.mitarbeiterNummer || '-'}</p>
          </div>
          <div>
            <Label className="text-white/35 text-[10.5px] uppercase tracking-wider">Rolle</Label>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border tracking-tight"
                style={{ color: roleStyle.color, background: roleStyle.bg, borderColor: roleStyle.border }}
              >
                {settings?.roleName || admin?.roleName || '-'}
              </span>
              <span className="text-white/30 text-[10.5px]">(Discord-Rang)</span>
            </div>
          </div>
        </div>
        <div
          className="mt-5 p-3 rounded-xl text-[11.5px] flex items-center gap-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}
        >
          <Shield className="w-3.5 h-3.5 shrink-0 text-white/45" />
          Dein Username und Rang werden automatisch über Discord synchronisiert.
        </div>
      </Section>

      {/* E-Mail ändern */}
      <Section icon={Mail} title="E-Mail ändern">
        <form onSubmit={handleEmailUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white/60 text-[12.5px] font-medium">Neue E-Mail-Adresse</Label>
            <Input 
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="deine@email.de"
              className={inputClass}
              required
            />
          </div>
          <Button 
            type="submit" 
            disabled={emailSaving || newEmail === settings?.email}
            className="h-11 px-5 rounded-xl border-0 text-[12.5px] font-semibold hover:opacity-90 transition-opacity"
            style={primaryButtonStyle}
          >
            {emailSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            E-Mail speichern
          </Button>
        </form>
      </Section>

      {/* Passwort ändern */}
      <Section icon={Key} title="Passwort ändern">
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white/60 text-[12.5px] font-medium">Aktuelles Passwort</Label>
            <div className="relative">
              <Input 
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Aktuelles Passwort eingeben"
                className={`${inputClass} pr-10`}
                required
              />
              <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-white/60 text-[12.5px] font-medium">Neues Passwort</Label>
            <div className="relative">
              <Input 
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                className={`${inputClass} pr-10`}
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60 text-[12.5px] font-medium">Neues Passwort bestätigen</Label>
            <Input 
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Passwort wiederholen"
              className={inputClass}
              required
            />
            {confirmPassword && newPassword && confirmPassword !== newPassword && (
              <p className="text-red-300/80 text-[11.5px] flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" /> Passwörter stimmen nicht überein
              </p>
            )}
            {confirmPassword && newPassword && confirmPassword === newPassword && newPassword.length >= 6 && (
              <p className="text-green-300/80 text-[11.5px] flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Passwörter stimmen überein
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={passwordSaving || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
            className="h-11 px-5 rounded-xl border-0 text-[12.5px] font-semibold hover:opacity-90 transition-opacity"
            style={primaryButtonStyle}
          >
            {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
            Passwort ändern
          </Button>
        </form>
      </Section>
    </div>
  );
}
