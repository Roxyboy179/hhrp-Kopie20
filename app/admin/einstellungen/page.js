'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2, Settings, Mail, Key, User, Shield, Eye, EyeOff,
  Save, AlertTriangle, CheckCircle2
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-white/40 text-sm mt-1">Dein Konto verwalten</p>
      </div>

      {/* Profil-Info (read-only) */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-5 flex items-center gap-2">
          <User className="w-4 h-4" /> Profil
        </h3>
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <Label className="text-white/30 text-xs uppercase tracking-wider">Discord Username</Label>
            <p className="text-white/80 mt-1 font-medium">{settings?.discordUsername || admin?.discordUsername || '-'}</p>
          </div>
          <div>
            <Label className="text-white/30 text-xs uppercase tracking-wider">Discord ID</Label>
            <p className="text-white/80 mt-1 font-mono text-sm">{settings?.discordUserId || admin?.discordUserId || '-'}</p>
          </div>
          <div>
            <Label className="text-white/30 text-xs uppercase tracking-wider">Mitarbeiter-Nummer</Label>
            <p className="text-white/80 mt-1 font-medium">{settings?.mitarbeiterNummer || admin?.mitarbeiterNummer || '-'}</p>
          </div>
          <div>
            <Label className="text-white/30 text-xs uppercase tracking-wider">Rolle</Label>
            <div className="mt-1 flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(settings?.roleName || admin?.roleName)}`}>
                {settings?.roleName || admin?.roleName || '-'}
              </span>
              <span className="text-white/30 text-xs">(Discord-Rang)</span>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-300/60 text-xs flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          Dein Username und Rang werden automatisch über Discord synchronisiert.
        </div>
      </GlassCard>

      {/* E-Mail ändern */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-5 flex items-center gap-2">
          <Mail className="w-4 h-4" /> E-Mail ändern
        </h3>
        <form onSubmit={handleEmailUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/40 text-sm">Neue E-Mail-Adresse</Label>
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
            className="bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            {emailSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            E-Mail speichern
          </Button>
        </form>
      </GlassCard>

      {/* Passwort ändern */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-5 flex items-center gap-2">
          <Key className="w-4 h-4" /> Passwort ändern
        </h3>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/40 text-sm">Aktuelles Passwort</Label>
            <div className="relative">
              <Input 
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Aktuelles Passwort eingeben"
                className={`${inputClass} pr-10`}
                required
              />
              <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-white/40 text-sm">Neues Passwort</Label>
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
              <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/40 text-sm">Neues Passwort bestätigen</Label>
            <Input 
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Passwort wiederholen"
              className={inputClass}
              required
            />
            {confirmPassword && newPassword && confirmPassword !== newPassword && (
              <p className="text-red-400/70 text-xs flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" /> Passwörter stimmen nicht überein
              </p>
            )}
            {confirmPassword && newPassword && confirmPassword === newPassword && newPassword.length >= 6 && (
              <p className="text-green-400/70 text-xs flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Passwörter stimmen überein
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={passwordSaving || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
            Passwort ändern
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
