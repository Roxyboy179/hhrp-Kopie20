'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Loader2, Settings, User, Lock, ArrowLeft, CheckCircle2, AlertTriangle, Save
} from 'lucide-react';

const inputClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl";

export default function EinstellungenPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/?error=not_logged_in');
      return;
    }
    if (user) {
      setUsername(user.username || user.globalName || '');
    }
  }, [user, authLoading, router]);

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setUsernameLoading(true);
    setUsernameError('');
    setUsernameSuccess('');

    try {
      const res = await fetch('/api/settings/username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsernameSuccess('Benutzername erfolgreich geändert!');
      setTimeout(() => setUsernameSuccess(''), 3000);
    } catch (e) {
      setUsernameError(e.message);
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwörter stimmen nicht überein!');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Passwort muss mindestens 8 Zeichen lang sein!');
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPasswordSuccess('Passwort erfolgreich geändert!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (e) {
      setPasswordError(e.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6 text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur Startseite
        </Button>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <Settings className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Einstellungen</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Konto-Einstellungen</h1>
          <p className="text-white/60">Verwalte deine Konto-Informationen</p>
        </div>

        <div className="space-y-6">
          {/* Benutzername ändern */}
          <GlassCard className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Benutzername ändern</h2>
                <p className="text-white/40 text-sm">Ändere deinen Anzeigenamen</p>
              </div>
            </div>

            <form onSubmit={handleUsernameChange} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Neuer Benutzername</Label>
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Dein neuer Name"
                  className={inputClass}
                  required
                  minLength={3}
                />
              </div>

              {usernameSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 text-sm">{usernameSuccess}</span>
                </div>
              )}

              {usernameError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 text-sm">{usernameError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={usernameLoading}
                className="bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                {usernameLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Speichern
                  </>
                )}
              </Button>
            </form>
          </GlassCard>

          {/* Passwort ändern */}
          <GlassCard className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Passwort ändern</h2>
                <p className="text-white/40 text-sm">Aktualisiere dein Passwort für mehr Sicherheit</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Aktuelles Passwort</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Neues Passwort</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  required
                  minLength={8}
                />
                <p className="text-white/30 text-xs">Mindestens 8 Zeichen</p>
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Passwort bestätigen</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  required
                />
              </div>

              {passwordSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 text-sm">{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 text-sm">{passwordError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={passwordLoading}
                className="bg-purple-600 hover:bg-purple-700 rounded-xl"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Wird aktualisiert...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Passwort ändern
                  </>
                )}
              </Button>
            </form>
          </GlassCard>

          {/* Account Info */}
          <GlassCard className="p-6 md:p-8">
            <h2 className="text-lg font-semibold mb-4">Account-Informationen</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/40">Discord ID</span>
                <span className="text-white/80">{user.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/40">E-Mail</span>
                <span className="text-white/80">{user.email || 'Nicht verfügbar'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-white/40">Account erstellt</span>
                <span className="text-white/80">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('de-DE') : '-'}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
