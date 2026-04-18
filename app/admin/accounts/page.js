'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminCardHeader } from '@/components/admin/AdminCard';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminTable, AdminTableHeader, AdminTableBody, AdminTableRow, AdminTableHead, AdminTableCell } from '@/components/admin/AdminTable';
import { AdminModal } from '@/components/admin/AdminModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminAuth } from '@/components/providers/AdminAuthProvider';
import { 
  Users, UserPlus, RefreshCw, Loader2, Shield, 
  Search, Trash2, AlertCircle, CheckCircle, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

const inputClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 rounded-xl";

function getRoleBadgeColor(roleName) {
  const colors = {
    'Projektinhaber': 'bg-red-500/20 text-red-300 border-red-500/30',
    'Stl. Projektinhaber': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'Teamkoordination': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Qualitätsmanagement': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'Teamvertretung': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Teamleitung': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Stl. Teamleitung': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  };
  return colors[roleName] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
}

export default function AccountsPage() {
  const router = useRouter();
  const { admin, loading } = useAdminAuth();
  const [accounts, setAccounts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    discordUserId: '',
    mitarbeiterNummer: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);
  const [detectedUser, setDetectedUser] = useState(null);

  useEffect(() => {
    if (!loading && !admin) {
      router.push('/admin');
      return;
    }
    if (!admin?.canSeeAll && admin?.roleLevel < 3) {
      toast.error('Keine Berechtigung', { description: 'Mindestens Level 3 erforderlich' });
      router.push('/admin');
      return;
    }
  }, [admin, loading, router]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/accounts');
      const data = await res.json();
      setAccounts(data.accounts || []);
      setFiltered(data.accounts || []);
    } catch (e) {
      console.error(e);
      toast.error('Fehler beim Laden der Accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (admin && (admin.canSeeAll || admin.roleLevel >= 3)) {
      fetchAccounts();
    }
  }, [admin]);

  useEffect(() => {
    if (!searchTerm) {
      setFiltered(accounts);
      return;
    }
    const filtered = accounts.filter(acc => 
      acc.discordUsername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.mitarbeiterNummer?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFiltered(filtered);
  }, [searchTerm, accounts]);

  const checkDiscordRole = async (userId) => {
    if (!userId || userId.length < 15) return;
    
    setCheckingRole(true);
    try {
      const res = await fetch(`/api/admin/check-discord-role?userId=${userId}`);
      const data = await res.json();
      
      if (res.ok) {
        setDetectedUser(data.user);
        if (data.user.hasTeamRole) {
          toast.success('Benutzer gefunden!', { 
            description: `${data.user.username} - ${data.user.roleName}` 
          });
        } else {
          toast.warning('Keine Team-Rolle', { 
            description: 'Dieser Benutzer hat keine Team-Rolle' 
          });
        }
      } else {
        toast.error('Fehler', { description: data.error });
        setDetectedUser(null);
      }
    } catch (e) {
      toast.error('Fehler', { description: 'Konnte Discord-Rolle nicht prüfen' });
      setDetectedUser(null);
    } finally {
      setCheckingRole(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!detectedUser?.hasTeamRole) {
      toast.error('Fehler', { description: 'Benutzer muss eine Team-Rolle haben' });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          roleId: detectedUser.roleId,
          roleName: detectedUser.roleName,
          roleLevel: detectedUser.roleLevel,
          discordUsername: detectedUser.username,
          avatar: detectedUser.avatar
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Account erstellt!', { 
          description: `${formData.mitarbeiterNummer} wurde angelegt` 
        });
        setShowCreateModal(false);
        setFormData({ discordUserId: '', mitarbeiterNummer: '', email: '', password: '' });
        setDetectedUser(null);
        fetchAccounts();
      } else {
        throw new Error(data.error || 'Fehler beim Erstellen');
      }
    } catch (e) {
      toast.error('Fehler', { description: e.message });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (accountId, username) => {
    if (!confirm(`Account "${username}" wirklich löschen?`)) return;

    try {
      const res = await fetch(`/api/admin/accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Account gelöscht');
        fetchAccounts();
      } else {
        throw new Error('Fehler beim Löschen');
      }
    } catch (e) {
      toast.error('Fehler', { description: e.message });
    }
  };

  if (loading || !admin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const canCreate = admin.canCreateAccounts;
  const stats = {
    total: accounts.length,
    level4: accounts.filter(a => a.roleLevel === 4).length,
    level3: accounts.filter(a => a.roleLevel === 3).length,
    level2: accounts.filter(a => a.roleLevel === 2).length,
    level1: accounts.filter(a => a.roleLevel === 1).length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Accounts</h1>
          <p className="text-white/60 text-sm mt-1">{filtered.length} von {accounts.length} Accounts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchAccounts}
            disabled={isLoading}
            className="gap-2 rounded-xl border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          {canCreate && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Account erstellen
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <AdminStatCard icon={Users} label="Gesamt" value={stats.total} color="blue" />
        <AdminStatCard icon={Shield} label="Level 4" value={stats.level4} color="red" />
        <AdminStatCard icon={Shield} label="Level 3" value={stats.level3} color="orange" />
        <AdminStatCard icon={Shield} label="Level 2" value={stats.level2} color="yellow" />
        <AdminStatCard icon={Shield} label="Level 1" value={stats.level1} color="green" />
      </div>

      {/* Info Card */}
      <AdminCard className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-white/80 font-medium mb-1">Rollen & Berechtigungen</p>
            <p className="text-white/60">
              Level 4 (Projektinhaber) = Vollzugriff • Level 3 (Stl. Projektinhaber) = Alles sehen • 
              Level 2 (Teamkoordination) = Alles sehen • Level 1 (Teamleitung) = Eingeschränkt
            </p>
          </div>
        </div>
      </AdminCard>

      {/* Search */}
      <AdminCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nach Username, Email oder MA-Nummer suchen..."
            className={`pl-10 ${inputClass}`}
          />
        </div>
      </AdminCard>

      {/* Table */}
      <AdminTable>
        <AdminTableHeader>
          <AdminTableRow>
            <AdminTableHead>Benutzer</AdminTableHead>
            <AdminTableHead>MA-Nummer</AdminTableHead>
            <AdminTableHead>Rolle</AdminTableHead>
            <AdminTableHead>Level</AdminTableHead>
            <AdminTableHead>Berechtigungen</AdminTableHead>
            {canCreate && <AdminTableHead>Aktionen</AdminTableHead>}
          </AdminTableRow>
        </AdminTableHeader>
        <AdminTableBody>
          {filtered.map((acc) => (
            <AdminTableRow key={acc.id}>
              <AdminTableCell>
                <div className="flex items-center gap-3">
                  {acc.avatar ? (
                    <img 
                      src={`https://cdn.discordapp.com/avatars/${acc.discordUserId}/${acc.avatar}.png?size=64`}
                      alt=""
                      className="w-8 h-8 rounded-full ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-white">{acc.discordUsername}</div>
                    <div className="text-xs text-white/60">{acc.email}</div>
                  </div>
                </div>
              </AdminTableCell>
              <AdminTableCell>
                <div className="font-mono text-sm text-white/80">{acc.mitarbeiterNummer}</div>
              </AdminTableCell>
              <AdminTableCell>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(acc.roleName)}`}>
                  {acc.roleName}
                </span>
              </AdminTableCell>
              <AdminTableCell>
                <div className="text-white/80">Level {acc.roleLevel}</div>
              </AdminTableCell>
              <AdminTableCell>
                <div className="flex flex-wrap gap-1">
                  {acc.canSeeAll && (
                    <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-300">
                      Alle sehen
                    </span>
                  )}
                  {acc.canCreateAccounts && (
                    <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300">
                      Accounts erstellen
                    </span>
                  )}
                </div>
              </AdminTableCell>
              {canCreate && (
                <AdminTableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(acc.id, acc.discordUsername)}
                    className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                    Löschen
                  </Button>
                </AdminTableCell>
              )}
            </AdminTableRow>
          ))}
          {filtered.length === 0 && (
            <AdminTableRow>
              <AdminTableCell colSpan={canCreate ? 6 : 5}>
                <div className="text-center py-12 text-white/40">
                  <Users className="w-16 h-16 mx-auto mb-3 opacity-20" />
                  <p className="text-lg mb-1">Keine Accounts gefunden</p>
                  <p className="text-sm">Ändere die Suche oder erstelle einen neuen Account</p>
                </div>
              </AdminTableCell>
            </AdminTableRow>
          )}
        </AdminTableBody>
      </AdminTable>

      {/* Create Modal */}
      <AdminModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ discordUserId: '', mitarbeiterNummer: '', email: '', password: '' });
          setDetectedUser(null);
        }}
        title="Neuen Admin Account erstellen"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          {/* Discord User ID */}
          <div className="space-y-2">
            <Label className="text-white/60">Discord User ID</Label>
            <div className="flex gap-2">
              <Input
                value={formData.discordUserId}
                onChange={(e) => {
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
                className="bg-[#5865F2] hover:bg-[#4752C4] rounded-xl"
              >
                {checkingRole ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-1" />
                    Prüfen
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Detected User */}
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
                <div className="flex-1">
                  <div className="font-medium text-white">{detectedUser.username}</div>
                  {detectedUser.hasTeamRole ? (
                    <div className="text-sm text-green-300 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {detectedUser.roleName} (Level {detectedUser.roleLevel})
                    </div>
                  ) : (
                    <div className="text-sm text-red-300 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Keine Team-Rolle
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MA Nummer */}
          <div className="space-y-2">
            <Label className="text-white/60">Mitarbeiter Nummer</Label>
            <Input
              value={formData.mitarbeiterNummer}
              onChange={(e) => setFormData({...formData, mitarbeiterNummer: e.target.value})}
              placeholder="MA001"
              className={inputClass}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-white/60">Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="admin@example.com"
              className={inputClass}
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="text-white/60">Passwort</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className={`${inputClass} pr-10`}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-white/40">Mindestens 8 Zeichen</p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 rounded-xl border-white/10"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={creating || !detectedUser?.hasTeamRole}
              className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Erstelle...
                </>
              ) : (
                'Account erstellen'
              )}
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
