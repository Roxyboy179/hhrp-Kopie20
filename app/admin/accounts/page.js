'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2, UserPlus, Trash2, RefreshCw, Shield, AlertTriangle,
  Search, CheckCircle2, XCircle, Eye, EyeOff, Ban, CheckCheck
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

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getRoleBadgeStyle(roleName) {
  const map = {
    'Projektinhaber':     { color: 'rgba(252,165,165,0.95)', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.22)',  dot: 'rgb(252,165,165)' },
    'Stl. Projektinhaber':{ color: 'rgba(253,186,116,0.95)', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.22)', dot: 'rgb(253,186,116)' },
    'Teamkoordination':   { color: 'rgba(253,224,71,0.95)',  bg: 'rgba(234,179,8,0.10)',  border: 'rgba(234,179,8,0.22)',  dot: 'rgb(253,224,71)' },
    'Qualitätsmanagement':{ color: 'rgba(216,180,254,0.95)', bg: 'rgba(168,85,247,0.10)', border: 'rgba(168,85,247,0.22)', dot: 'rgb(216,180,254)' },
    'Teamvertretung':     { color: 'rgba(147,197,253,0.95)', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.22)', dot: 'rgb(147,197,253)' },
    'Teamleitung':        { color: 'rgba(134,239,172,0.95)', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.22)',  dot: 'rgb(134,239,172)' },
    'Stl. Teamleitung':   { color: 'rgba(94,234,212,0.95)',  bg: 'rgba(20,184,166,0.10)', border: 'rgba(20,184,166,0.22)', dot: 'rgb(94,234,212)' },
  };
  return map[roleName] || { color: 'rgba(255,255,255,0.7)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', dot: 'rgba(255,255,255,0.5)' };
}

export default function AdminAccountsPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    discordUserId: '',
    mitarbeiterNummer: '',
    email: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Discord-Rolle prüfen State
  const [checkingRole, setCheckingRole] = useState(false);
  const [detectedUser, setDetectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();
        if (!data.admin) {
          router.push('/admin');
          return;
        }
        // Nur Projektinhaber und Stl. Projektinhaber dürfen Accounts sehen
        if (!data.admin.canCreateAccounts && data.admin.roleLevel < 3) {
          toast.error('Keine Berechtigung', { 
            description: 'Du hast keine Berechtigung, Accounts zu verwalten.' 
          });
          router.push('/admin');
          return;
        }
        setAdmin(data.admin);
        await fetchAccounts();
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    })();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accounts');
      const data = await res.json();
      // Nach Rang sortieren (höchster zuerst)
      const roleOrder = {
        'Projektinhaber': 1,
        'Stl. Projektinhaber': 2,
        'Teamkoordination': 3,
        'Qualitätsmanagement': 4,
        'Teamvertretung': 5,
        'Teamleitung': 6,
        'Stl. Teamleitung': 7,
      };
      const sorted = (data.accounts || []).sort((a, b) => {
        const orderA = roleOrder[a.roleName] || 99;
        const orderB = roleOrder[b.roleName] || 99;
        return orderA - orderB;
      });
      setAccounts(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Discord User ID eingeben -> Rolle automatisch prüfen
  const checkDiscordRole = async (userId) => {
    if (!userId || userId.length < 15) {
      setDetectedUser(null);
      return;
    }
    
    setCheckingRole(true);
    try {
      const res = await fetch('/api/admin/check-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordUserId: userId })
      });
      const data = await res.json();
      
      if (data.found) {
        setDetectedUser(data);
        if (data.hasTeamRole) {
          toast.success('Discord-Benutzer gefunden', {
            description: `${data.globalName} - Rolle: ${data.role.name}`,
          });
        } else {
          toast.error('Keine Team-Rolle', {
            description: `${data.globalName} hat keine Team-Rolle auf dem Discord-Server.`,
          });
        }
      } else {
        setDetectedUser(null);
        toast.error('Nicht gefunden', {
          description: 'Benutzer nicht auf dem Discord-Server gefunden.',
        });
      }
    } catch (e) {
      console.error(e);
      setDetectedUser(null);
    } finally {
      setCheckingRole(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!detectedUser?.hasTeamRole) {
      toast.error('Keine Team-Rolle', {
        description: 'Der Benutzer muss eine Team-Rolle auf dem Discord-Server haben.',
      });
      return;
    }
    
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Account erstellt', {
        description: `${detectedUser.globalName} (${data.detectedRole}) wurde erfolgreich angelegt.`,
      });
      
      await fetchAccounts();
      setShowForm(false);
      setFormData({ discordUserId: '', mitarbeiterNummer: '', email: '', password: '' });
      setDetectedUser(null);
    } catch (e) {
      setError(e.message);
      toast.error('Fehler', { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    setDeleteConfirm(null);
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Account gelöscht', {
          description: `${name} wurde erfolgreich gelöscht.`,
        });
        await fetchAccounts();
      } else {
        toast.error('Fehler', { description: 'Account konnte nicht gelöscht werden.' });
      }
    } catch (e) {
      console.error(e);
      toast.error('Fehler', { description: 'Account konnte nicht gelöscht werden.' });
    }
  };
  
  const handleToggleStatus = async (id, currentStatus, name) => {
    const newStatus = !currentStatus;
    try {
      const res = await fetch(`/api/admin/accounts/${id}/toggle-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(
        newStatus ? 'Account aktiviert' : 'Account deaktiviert',
        { description: newStatus 
          ? `${name} wurde aktiviert.` 
          : `${name} wurde deaktiviert und wird automatisch abgemeldet.` 
        }
      );
      
      await fetchAccounts();
    } catch (e) {
      toast.error('Fehler', { description: e.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">Admin Accounts</h1>
          <p className="text-white/45 text-[13px] mt-1.5">
            <span className="tabular-nums">{accounts.length}</span> Accounts insgesamt
            {admin?.canCreateAccounts && (
              <span className="ml-2 text-green-300/80">· Du kannst Accounts erstellen</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchAccounts} 
            className="gap-2 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] hover:border-white/[0.15] text-white/75 hover:text-white text-[12.5px] font-medium"
          >
            <RefreshCw className="w-4 h-4" /> Aktualisieren
          </Button>
          {admin?.canCreateAccounts && (
            <Button 
              onClick={() => { setShowForm(!showForm); setDetectedUser(null); setError(''); }} 
              className="h-10 px-4 rounded-xl gap-2 text-[12.5px] font-semibold border-0"
              style={primaryButtonStyle}
            >
              <UserPlus className="w-4 h-4" /> Account erstellen
            </Button>
          )}
        </div>
      </div>

      {/* Rechte-Info */}
      <div className="p-4 rounded-2xl relative overflow-hidden" style={cardStyle}>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
        />
        <h4 className="text-[10.5px] font-semibold text-white/65 uppercase tracking-[0.12em] mb-3">Rollen &amp; Berechtigungen</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-[11.5px]">
          {[
            { name: 'Projektinhaber', desc: '(Lv.4) · Vollzugriff' },
            { name: 'Stl. Projektinhaber', desc: '(Lv.3) · Alles sehen' },
            { name: 'Teamkoordination', desc: '(Lv.2) · Alles sehen' },
            { name: 'Teamleitung', desc: '(Lv.1) · Eingeschränkt' },
          ].map(r => {
            const s = getRoleBadgeStyle(r.name);
            return (
              <div key={r.name} className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                <span className="text-white/55 truncate">
                  <span className="text-white/80">{r.name}</span> {r.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Account-Erstellung mit Auto-Rollen-Erkennung */}
      {showForm && admin?.canCreateAccounts && (
        <div className="p-5 md:p-6 rounded-2xl relative overflow-hidden" style={cardStyle}>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
          />
          <h3 className="text-[16px] font-semibold text-white tracking-tight mb-1.5">Neuen Admin Account erstellen</h3>
          <p className="text-white/45 text-[12.5px] mb-5 leading-relaxed">
            Die Discord-Rolle wird automatisch erkannt. Nur Benutzer mit einer Team-Rolle können einen Account erhalten.
          </p>
          
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Discord User ID mit Rollenprüfung */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-[12.5px] font-medium">Discord User ID</Label>
              <div className="flex gap-2">
                <Input 
                  value={formData.discordUserId} 
                  onChange={e => {
                    setFormData({...formData, discordUserId: e.target.value});
                    setDetectedUser(null);
                  }} 
                  placeholder="123456789012345678" 
                  className={`${inputClass} flex-1`} 
                  required 
                />
                <Button 
                  type="button"
                  onClick={() => checkDiscordRole(formData.discordUserId)}
                  disabled={checkingRole || !formData.discordUserId || formData.discordUserId.length < 15}
                  className="h-11 rounded-xl shrink-0 text-[12.5px] font-medium border border-[#5865F2]/30 text-white disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(88,101,242,0.25), rgba(88,101,242,0.15))',
                  }}
                >
                  {checkingRole ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-1" /> Prüfen
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Erkannter Benutzer */}
            {detectedUser && (
              <div
                className="p-4 rounded-xl"
                style={
                  detectedUser.hasTeamRole
                    ? { background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }
                    : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }
                }
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {detectedUser.avatar ? (
                    <img 
                      src={`https://cdn.discordapp.com/avatars/${formData.discordUserId}/${detectedUser.avatar}.png?size=64`} 
                      alt="" 
                      className="w-10 h-10 rounded-full ring-1 ring-white/15" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-[13px] text-white truncate">{detectedUser.globalName}</p>
                    <p className="text-white/40 text-[11px] truncate">@{detectedUser.username}</p>
                  </div>
                  <div className="ml-auto">
                    {detectedUser.hasTeamRole ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-300" />
                        {(() => {
                          const s = getRoleBadgeStyle(detectedUser.role.name);
                          return (
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                              style={{ color: s.color, background: s.bg, borderColor: s.border }}
                            >
                              {detectedUser.role.name} (Lv.{detectedUser.role.level})
                            </span>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-red-300" />
                        <span className="text-red-300/90 text-[11.5px] font-medium">Keine Team-Rolle</span>
                      </div>
                    )}
                  </div>
                </div>
                {detectedUser.hasTeamRole && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px] text-white/55 pt-3 border-t border-white/[0.04]">
                    <div>Accounts erstellen: {detectedUser.role.canCreateAccounts ? '✅ Ja' : '❌ Nein'}</div>
                    <div>Alles sehen: {detectedUser.role.canSeeAll ? '✅ Ja' : '❌ Nein'}</div>
                  </div>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white/60 text-[12.5px] font-medium">Mitarbeiter Nummer</Label>
                <Input 
                  value={formData.mitarbeiterNummer} 
                  onChange={e => setFormData({...formData, mitarbeiterNummer: e.target.value})} 
                  placeholder="MA-002" 
                  className={inputClass} 
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/60 text-[12.5px] font-medium">E-Mail</Label>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="email@example.com" 
                  className={inputClass} 
                  required 
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-white/60 text-[12.5px] font-medium">Passwort</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    placeholder="Sicheres Passwort eingeben" 
                    className={`${inputClass} pr-10`} 
                    required 
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
            </div>
            
            {error && (
              <div
                className="p-3 rounded-xl text-[12.5px] flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(252,165,165,0.95)' }}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <Button 
                type="button"
                onClick={() => { setShowForm(false); setError(''); setDetectedUser(null); }} 
                className="h-10 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white/75 hover:text-white text-[12.5px] font-medium"
              >
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || !detectedUser?.hasTeamRole} 
                className="h-10 px-5 rounded-xl text-[12.5px] font-semibold border-0 disabled:opacity-50"
                style={primaryButtonStyle}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Account erstellen
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lösch-Bestätigung */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px) saturate(160%)', WebkitBackdropFilter: 'blur(16px) saturate(160%)' }}
        >
          <div
            className="p-6 max-w-md w-full rounded-2xl animate-scale-in relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(18,18,20,0.96) 0%, rgba(10,10,12,0.98) 100%)',
              border: '1px solid rgba(239,68,68,0.22)',
              boxShadow: '0 24px 60px -12px rgba(0,0,0,0.85)',
            }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.35), transparent)' }}
            />
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }}
              >
                <Trash2 className="w-4 h-4 text-red-300" />
              </div>
              <h3 className="text-[16px] font-semibold text-white tracking-tight">Account löschen?</h3>
            </div>
            <p className="text-white/50 text-[13px] mb-6 leading-relaxed">
              Möchtest du den Account <strong className="text-white/90">{deleteConfirm.name}</strong> ({deleteConfirm.ma}) wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-2 justify-end">
              <Button 
                onClick={() => setDeleteConfirm(null)} 
                className="h-10 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white/75 hover:text-white text-[12.5px] font-medium"
              >
                Abbrechen
              </Button>
              <Button 
                onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.name)} 
                className="h-10 px-4 rounded-xl border-0 text-white text-[12.5px] font-semibold"
                style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.85), rgba(220,38,38,0.95))',
                  boxShadow: '0 4px 14px -4px rgba(239,68,68,0.4)',
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Löschen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Account-Liste */}
      <div className="grid gap-2.5">
        {accounts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl" style={cardStyle}>
            <div
              className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center border border-white/[0.06]"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }}
            >
              <UserPlus className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-white/50 text-[13.5px] font-medium">Keine Accounts vorhanden</p>
          </div>
        ) : (
          accounts.map(account => {
            const rs = getRoleBadgeStyle(account.roleName);
            return (
              <div
                key={account.id}
                className="p-4 md:p-5 rounded-xl transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))',
                  border: `1px solid ${account.isActive === false ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.08]"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))' }}
                    >
                      <Shield className="w-5 h-5 text-white/75" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                        <span className="font-semibold text-white text-[13.5px] tracking-tight">{account.mitarbeiterNummer}</span>
                        <span className="text-white/55 text-[12px] truncate max-w-[200px]">{account.email}</span>
                        {account.roleName && (
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10.5px] font-medium border"
                            style={{ color: rs.color, background: rs.bg, borderColor: rs.border }}
                          >
                            {account.roleName}
                          </span>
                        )}
                        {account.isActive === false && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium border"
                            style={{ color: 'rgba(252,165,165,0.95)', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.22)' }}
                          >
                            <Ban className="w-3 h-3" />
                            Deaktiviert
                          </span>
                        )}
                        {account.isActive === true && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium border"
                            style={{ color: 'rgba(134,239,172,0.95)', background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' }}
                          >
                            <CheckCheck className="w-3 h-3" />
                            Aktiv
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-white/35 flex-wrap">
                        {account.discordUsername && <span>Discord: @{account.discordUsername}</span>}
                        <span>Erstellt: {formatDate(account.createdAt)}</span>
                        {account.createdBy && <span>Von: {account.createdBy}</span>}
                      </div>
                    </div>
                  </div>
                  {admin?.canCreateAccounts && (
                    <div className="flex items-center gap-1.5">
                      <Button 
                        size="sm"
                        onClick={() => handleToggleStatus(
                          account.id, 
                          account.isActive, 
                          account.discordUsername || account.email
                        )}
                        className={`h-8 rounded-lg text-[11.5px] font-medium border ${
                          account.isActive === false 
                            ? 'text-green-300/85 hover:text-green-200 border-green-500/15 hover:border-green-500/30 hover:bg-green-500/10' 
                            : 'text-orange-300/85 hover:text-orange-200 border-orange-500/15 hover:border-orange-500/30 hover:bg-orange-500/10'
                        } bg-white/[0.03]`}
                      >
                        {account.isActive === false ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 mr-1" />
                            Aktivieren
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5 mr-1" />
                            Deaktivieren
                          </>
                        )}
                      </Button>
                      <Button 
                        size="icon" 
                        onClick={() => setDeleteConfirm({ 
                          id: account.id, 
                          name: account.discordUsername || account.email,
                          ma: account.mitarbeiterNummer 
                        })} 
                        className="h-8 w-8 rounded-lg text-red-300/75 hover:text-red-200 bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/25"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
