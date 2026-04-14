'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2, UserPlus, Trash2, RefreshCw, Shield, AlertTriangle,
  Search, CheckCircle2, XCircle, Eye, EyeOff
} from 'lucide-react';

const inputClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl";

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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
      setAccounts(data.accounts || []);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Accounts</h1>
          <p className="text-white/40 text-sm mt-1">
            {accounts.length} Accounts insgesamt
            {admin?.canCreateAccounts && (
              <span className="ml-2 text-green-400">| Du kannst Accounts erstellen</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchAccounts} 
            className="gap-2 rounded-xl border-white/10"
          >
            <RefreshCw className="w-4 h-4" /> Aktualisieren
          </Button>
          {admin?.canCreateAccounts && (
            <Button 
              onClick={() => { setShowForm(!showForm); setDetectedUser(null); setError(''); }} 
              className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2"
            >
              <UserPlus className="w-4 h-4" /> Account erstellen
            </Button>
          )}
        </div>
      </div>

      {/* Rechte-Info */}
      <GlassCard className="p-4">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">Rollen & Berechtigungen</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span className="text-white/60">Projektinhaber (Lv.4) - Vollzugriff</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
            <span className="text-white/60">Stl. Projektinhaber (Lv.3) - Alles sehen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            <span className="text-white/60">Teamkoordination (Lv.2) - Alles sehen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <span className="text-white/60">Teamleitung (Lv.1) - Eingeschränkt</span>
          </div>
        </div>
      </GlassCard>

      {/* Account-Erstellung mit Auto-Rollen-Erkennung */}
      {showForm && admin?.canCreateAccounts && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold mb-4">Neuen Admin Account erstellen</h3>
          <p className="text-white/40 text-sm mb-4">
            Die Discord-Rolle wird automatisch erkannt. Nur Benutzer mit einer Team-Rolle können einen Account erhalten.
          </p>
          
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Discord User ID mit Rollenprüfung */}
            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Discord User ID</Label>
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
                  className="bg-[#5865F2] hover:bg-[#4752C4] rounded-xl shrink-0"
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
              <div className={`p-4 rounded-xl border ${detectedUser.hasTeamRole 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-red-500/10 border-red-500/20'}`}
              >
                <div className="flex items-center gap-3">
                  {detectedUser.avatar ? (
                    <img 
                      src={`https://cdn.discordapp.com/avatars/${formData.discordUserId}/${detectedUser.avatar}.png?size=64`} 
                      alt="" 
                      className="w-10 h-10 rounded-full ring-2 ring-white/20" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{detectedUser.globalName}</p>
                    <p className="text-white/40 text-xs">@{detectedUser.username}</p>
                  </div>
                  <div className="ml-auto">
                    {detectedUser.hasTeamRole ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(detectedUser.role.name)}`}>
                          {detectedUser.role.name} (Lv.{detectedUser.role.level})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-red-300 text-xs">Keine Team-Rolle</span>
                      </div>
                    )}
                  </div>
                </div>
                {detectedUser.hasTeamRole && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/50">
                    <div>Accounts erstellen: {detectedUser.role.canCreateAccounts ? '✅ Ja' : '❌ Nein'}</div>
                    <div>Alles sehen: {detectedUser.role.canSeeAll ? '✅ Ja' : '❌ Nein'}</div>
                  </div>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Mitarbeiter Nummer</Label>
                <Input 
                  value={formData.mitarbeiterNummer} 
                  onChange={e => setFormData({...formData, mitarbeiterNummer: e.target.value})} 
                  placeholder="MA-002" 
                  className={inputClass} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">E-Mail</Label>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="email@example.com" 
                  className={inputClass} 
                  required 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-white/60 text-sm">Passwort</Label>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setShowForm(false); setError(''); setDetectedUser(null); }} 
                className="rounded-xl border-white/10"
              >
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || !detectedUser?.hasTeamRole} 
                className="bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Account erstellen
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Lösch-Bestätigung */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-lg font-bold mb-2">Account löschen?</h3>
            <p className="text-white/50 text-sm mb-6">
              Möchtest du den Account <strong className="text-white">{deleteConfirm.name}</strong> ({deleteConfirm.ma}) wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirm(null)} 
                className="rounded-xl border-white/10"
              >
                Abbrechen
              </Button>
              <Button 
                onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.name)} 
                className="bg-red-600 hover:bg-red-700 rounded-xl"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Löschen
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Account-Liste */}
      <div className="grid gap-4">
        {accounts.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <UserPlus className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">Keine Accounts vorhanden</p>
          </GlassCard>
        ) : (
          accounts.map(account => (
            <GlassCard key={account.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-semibold">{account.mitarbeiterNummer}</span>
                      <span className="text-white/60 text-sm">{account.email}</span>
                      {account.roleName && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(account.roleName)}`}>
                          {account.roleName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/30">
                      {account.discordUsername && <span>Discord: @{account.discordUsername}</span>}
                      <span>Erstellt: {formatDate(account.createdAt)}</span>
                      {account.createdBy && <span>Von: {account.createdBy}</span>}
                    </div>
                  </div>
                </div>
                {admin?.canCreateAccounts && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setDeleteConfirm({ 
                      id: account.id, 
                      name: account.discordUsername || account.email,
                      ma: account.mitarbeiterNummer 
                    })} 
                    className="text-red-400/70 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
