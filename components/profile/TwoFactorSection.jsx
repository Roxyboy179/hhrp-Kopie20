'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck, ShieldOff, Loader2, KeyRound, Copy, Check, RefreshCw,
  AlertTriangle, Smartphone, Mail, Eye, EyeOff, X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function TwoFactorSection({ accountEmail }) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ enabled: false, backupCodesRemaining: 0 });

  // Setup-Wizard State
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState(1); // 1: QR, 2: Code, 3: Backup-Codes
  const [setupSecret, setSetupSecret] = useState('');
  const [setupOtpauth, setSetupOtpauth] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState([]);
  const [backupCopied, setBackupCopied] = useState(false);

  // Disable-Dialog State
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePw, setDisablePw] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disablePending, setDisablePending] = useState(false);

  // Regenerate-Dialog State
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenCode, setRegenCode] = useState('');
  const [regenPending, setRegenPending] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/status', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setStatus({
          enabled: !!data.enabled,
          backupCodesRemaining: data.backupCodesRemaining || 0,
          enabledAt: data.enabledAt || null,
        });
      }
    } catch (e) {
      console.error('[2fa] load status:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // ─── Setup-Wizard ────────────────────────────────────────────────
  const startSetup = async () => {
    setSetupLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup-init', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Setup fehlgeschlagen');
      setSetupSecret(data.secret);
      setSetupOtpauth(data.otpauth);
      setSetupCode('');
      setSetupStep(1);
      setSetupOpen(true);
    } catch (err) {
      toast.error(err.message || 'Konnte 2FA-Setup nicht starten');
    } finally {
      setSetupLoading(false);
    }
  };

  const verifySetupCode = async () => {
    if (!/^\d{6}$/.test(setupCode.trim())) {
      toast.error('Bitte gib einen 6-stelligen Code ein');
      return;
    }
    setSetupLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: setupCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'INVALID_CODE') {
          toast.error('Ungültiger Code — versuche es erneut');
          return;
        }
        throw new Error(data.error || 'Aktivierung fehlgeschlagen');
      }
      setGeneratedBackupCodes(data.backupCodes || []);
      setSetupStep(3);
      toast.success('2FA aktiviert');
      await loadStatus();
    } catch (err) {
      toast.error(err.message || 'Aktivierung fehlgeschlagen');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    if (!generatedBackupCodes.length) return;
    navigator.clipboard.writeText(generatedBackupCodes.join('\n')).then(() => {
      setBackupCopied(true);
      toast.success('Codes in Zwischenablage kopiert');
      setTimeout(() => setBackupCopied(false), 2500);
    }).catch(() => {
      toast.error('Konnte nicht kopieren');
    });
  };

  const closeSetupWizard = () => {
    setSetupOpen(false);
    setSetupStep(1);
    setSetupSecret('');
    setSetupOtpauth('');
    setSetupCode('');
    setGeneratedBackupCodes([]);
  };

  // ─── Deaktivieren ────────────────────────────────────────────────
  const handleDisable = async () => {
    if (!disablePw || !disableCode) {
      toast.error('Bitte Passwort und 2FA-Code eingeben');
      return;
    }
    setDisablePending(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: disablePw, code: disableCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deaktivierung fehlgeschlagen');
      toast.success('2FA deaktiviert');
      setDisableOpen(false);
      setDisablePw('');
      setDisableCode('');
      await loadStatus();
    } catch (err) {
      toast.error(err.message || 'Deaktivierung fehlgeschlagen');
    } finally {
      setDisablePending(false);
    }
  };

  // ─── Backup-Codes neu generieren ─────────────────────────────────
  const handleRegen = async () => {
    if (!regenCode) {
      toast.error('Bitte 2FA-Code eingeben');
      return;
    }
    setRegenPending(true);
    try {
      const res = await fetch('/api/auth/2fa/regenerate-backup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: regenCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehlgeschlagen');
      toast.success('Neue Backup-Codes per E-Mail verschickt');
      setRegenOpen(false);
      setRegenCode('');
      await loadStatus();
    } catch (err) {
      toast.error(err.message || 'Fehlgeschlagen');
    } finally {
      setRegenPending(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border border-white/[0.08] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <>
      <div className="glass rounded-2xl p-6 border border-white/[0.08]">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: status.enabled ? 'rgba(34,197,94,0.12)' : 'rgba(var(--theme-accent-rgb), 0.12)',
              border: `1px solid ${status.enabled ? 'rgba(34,197,94,0.25)' : 'rgba(var(--theme-accent-rgb), 0.25)'}`,
            }}
          >
            {status.enabled ? (
              <ShieldCheck className="w-5 h-5 text-green-400" />
            ) : (
              <ShieldOff className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white">Zwei-Faktor-Authentifizierung</h2>
            <p className="text-xs text-white/40">
              {status.enabled
                ? 'Dein Konto ist mit 2FA geschützt'
                : 'Schütze dein Konto mit einer Authenticator-App'}
            </p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              status.enabled
                ? 'bg-green-500/10 text-green-300 border border-green-500/25'
                : 'bg-white/[0.04] text-white/50 border border-white/10'
            }`}
          >
            {status.enabled ? 'Aktiv' : 'Inaktiv'}
          </span>
        </div>

        {!status.enabled && (
          <>
            <div className="space-y-2.5 mb-5">
              <InfoRow icon={Smartphone}>
                Verknüpfe Google Authenticator (oder Authy) für 6-stellige Codes.
              </InfoRow>
              <InfoRow icon={KeyRound}>
                2FA wird bei <b className="text-white/80">Login</b>, <b className="text-white/80">Passwortänderung</b> und <b className="text-white/80">Account-Löschung</b> abgefragt.
              </InfoRow>
              <InfoRow icon={Mail}>
                10 Backup-Codes werden dir an <span className="text-white/70">{accountEmail || 'deine E-Mail'}</span> gesendet.
              </InfoRow>
            </div>
            <button
              onClick={startSetup}
              disabled={setupLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'var(--theme-accent)', color: '#000' }}
            >
              {setupLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              2FA jetzt aktivieren
            </button>
          </>
        )}

        {status.enabled && (
          <>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-xs text-white/50">Status</span>
                <span className="text-sm text-green-300 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Aktiv seit {status.enabledAt ? new Date(status.enabledAt).toLocaleDateString('de-DE') : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-xs text-white/50">Backup-Codes übrig</span>
                <span
                  className={`text-sm font-mono font-semibold ${
                    status.backupCodesRemaining <= 2
                      ? 'text-red-300'
                      : status.backupCodesRemaining <= 5
                      ? 'text-yellow-300'
                      : 'text-white'
                  }`}
                >
                  {status.backupCodesRemaining} / 10
                </span>
              </div>
              {status.backupCodesRemaining <= 2 && (
                <div
                  className="rounded-xl p-3 text-xs flex items-start gap-2"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#fca5a5',
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Nur noch wenige Backup-Codes übrig. Erstelle dir neue Codes, damit du im Notfall Zugriff hast.
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setRegenOpen(true)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition"
                style={{
                  background: 'rgba(var(--theme-accent-rgb), 0.12)',
                  border: '1px solid rgba(var(--theme-accent-rgb), 0.3)',
                  color: 'var(--theme-accent)',
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Backup-Codes neu erstellen
              </button>
              <button
                onClick={() => setDisableOpen(true)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition"
                style={{
                  background: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.30)',
                  color: '#fca5a5',
                }}
              >
                <ShieldOff className="w-4 h-4" />
                2FA deaktivieren
              </button>
            </div>
          </>
        )}
      </div>

      {/* ───── Setup-Wizard Dialog ───── */}
      <AlertDialog open={setupOpen} onOpenChange={(o) => { if (!o) closeSetupWizard(); }}>
        <AlertDialogContent
          className="border-white/10 max-w-md"
          style={{ background: 'rgba(12,12,12,0.98)', backdropFilter: 'blur(20px)' }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
              {setupStep === 1 && '2FA einrichten — Schritt 1 von 2'}
              {setupStep === 2 && '2FA einrichten — Schritt 2 von 2'}
              {setupStep === 3 && 'Backup-Codes speichern'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/55 text-sm">
              {setupStep === 1 && 'Scanne den QR-Code mit Google Authenticator (oder Authy).'}
              {setupStep === 2 && 'Gib den 6-stelligen Code aus der App ein, um 2FA zu aktivieren.'}
              {setupStep === 3 && 'Bewahre diese Codes sicher auf. Sie wurden auch an deine E-Mail gesendet.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {setupStep === 1 && (
            <div className="space-y-4 my-2">
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl">
                  {setupOtpauth ? (
                    <QRCodeSVG value={setupOtpauth} size={192} level="M" />
                  ) : (
                    <div className="w-[192px] h-[192px] flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-white/50 text-center">
                  Falls du den Code nicht scannen kannst, gib diesen Wert manuell ein:
                </p>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.04] border border-white/10">
                  <code className="flex-1 font-mono text-xs text-white tracking-wider break-all">
                    {showSecret ? setupSecret : setupSecret.replace(/./g, '•')}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowSecret((v) => !v)}
                    className="text-white/50 hover:text-white shrink-0"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(setupSecret).then(() => toast.success('Secret kopiert'));
                    }}
                    className="text-white/50 hover:text-white shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] hover:text-white">
                  Abbrechen
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => { e.preventDefault(); setSetupStep(2); }}
                  className="text-black hover:opacity-90"
                  style={{ background: 'var(--theme-accent)' }}
                >
                  Weiter
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          )}

          {setupStep === 2 && (
            <div className="space-y-4 my-2">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">
                  6-stelliger Code aus der App
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-4 py-4 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-center text-2xl font-mono tracking-[0.5em] font-semibold"
                  autoFocus
                />
                <p className="text-[11px] text-white/35 mt-2 text-center">
                  Der Code ändert sich alle 30 Sekunden.
                </p>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={(e) => { e.preventDefault(); setSetupStep(1); }}
                  className="bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] hover:text-white"
                >
                  Zurück
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => { e.preventDefault(); verifySetupCode(); }}
                  disabled={setupLoading || setupCode.length !== 6}
                  className="text-black hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--theme-accent)' }}
                >
                  {setupLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Aktivieren…
                    </>
                  ) : (
                    'Aktivieren'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          )}

          {setupStep === 3 && (
            <div className="space-y-4 my-2">
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(234,179,8,0.08)',
                  border: '1px solid rgba(234,179,8,0.30)',
                }}
              >
                <p className="text-xs text-yellow-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Diese Codes werden <b>nur jetzt</b> angezeigt. Speichere sie sicher ab — du brauchst sie, falls du deinen Authenticator verlierst.
                  </span>
                </p>
              </div>

              <div className="rounded-xl p-4 bg-white/[0.04] border border-white/10">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm text-white tracking-wider">
                  {generatedBackupCodes.map((c, i) => (
                    <div key={i} className="px-2.5 py-1.5 bg-white/[0.04] rounded text-center">
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCopyBackupCodes}
                className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: '#fff',
                }}
              >
                {backupCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {backupCopied ? 'Kopiert!' : 'Alle Codes kopieren'}
              </button>

              <p className="text-[11px] text-white/40 text-center">
                Eine Kopie wurde an <span className="text-white/60">{accountEmail}</span> gesendet.
              </p>

              <AlertDialogFooter>
                <AlertDialogAction
                  onClick={(e) => { e.preventDefault(); closeSetupWizard(); }}
                  className="w-full text-black hover:opacity-90"
                  style={{ background: 'var(--theme-accent)' }}
                >
                  Fertig
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* ───── Deaktivieren-Dialog ───── */}
      <AlertDialog open={disableOpen} onOpenChange={(o) => { setDisableOpen(o); if (!o) { setDisablePw(''); setDisableCode(''); } }}>
        <AlertDialogContent
          className="border-white/10 max-w-md"
          style={{ background: 'rgba(12,12,12,0.98)', backdropFilter: 'blur(20px)' }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <ShieldOff className="w-5 h-5 text-red-400" />
              2FA wirklich deaktivieren?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/55 text-sm">
              Ohne 2FA ist dein Konto weniger gut geschützt. Zur Bestätigung benötigen wir dein Passwort und einen aktuellen 2FA-Code.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 my-2">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Aktuelles Passwort</label>
              <input
                type="password"
                value={disablePw}
                onChange={(e) => setDisablePw(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm"
                autoComplete="current-password"
                disabled={disablePending}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                2FA-Code (oder Backup-Code)
              </label>
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="123456 oder XXXX-XXXX"
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm font-mono tracking-wider"
                autoComplete="one-time-code"
                disabled={disablePending}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={disablePending} className="bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] hover:text-white">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDisable(); }}
              disabled={disablePending || !disablePw || !disableCode}
              className="bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-50"
            >
              {disablePending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deaktiviere…
                </>
              ) : (
                'Deaktivieren'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ───── Backup-Codes regenerate Dialog ───── */}
      <AlertDialog open={regenOpen} onOpenChange={(o) => { setRegenOpen(o); if (!o) setRegenCode(''); }}>
        <AlertDialogContent
          className="border-white/10 max-w-md"
          style={{ background: 'rgba(12,12,12,0.98)', backdropFilter: 'blur(20px)' }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
              Neue Backup-Codes erstellen
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/55 text-sm">
              Deine bisherigen Backup-Codes werden ungültig. Die neuen 10 Codes werden dir per E-Mail an{' '}
              <span className="text-white/80">{accountEmail}</span> gesendet.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-2">
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Bestätige mit 2FA-Code (aus der App)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={regenCode}
              onChange={(e) => setRegenCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full px-3 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-center text-lg font-mono tracking-[0.4em] font-semibold"
              autoComplete="one-time-code"
              disabled={regenPending}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenPending} className="bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] hover:text-white">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleRegen(); }}
              disabled={regenPending || regenCode.length !== 6}
              className="text-black hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--theme-accent)' }}
            >
              {regenPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Erstelle…
                </>
              ) : (
                'Neu erstellen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function InfoRow({ icon: Icon, children }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--theme-accent)' }} />
      <p className="text-xs md:text-sm text-white/70">{children}</p>
    </div>
  );
}
