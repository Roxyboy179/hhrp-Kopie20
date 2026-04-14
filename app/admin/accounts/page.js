'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Loader2, UserPlus, Trash2, RefreshCw, Shield, AlertTriangle 
} from 'lucide-react';

const inputClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl";

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminAccountsPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    discordUserId: '',
    discordUsername: '',
    mitarbeiterNummer: '',
    email: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();
        if (!data.admin) {
          router.push('/admin');
          return;
        }
        if (!data.admin.canCreateAccounts && data.admin.roleLevel < 3) {
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

  const handleCreate = async (e) => {
    e.preventDefault();
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
      await fetchAccounts();
      setShowForm(false);
      setFormData({ discordUserId: '', discordUsername: '', mitarbeiterNummer: '', email: '', password: '' });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Möchtest du diesen Account wirklich löschen?')) return;
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) await fetchAccounts();
    } catch (e) {
      console.error(e);
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
          <p className="text-white/40 text-sm mt-1">{accounts.length} Accounts insgesamt</p>
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
              onClick={() => setShowForm(!showForm)} 
              className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2"
            >
              <UserPlus className="w-4 h-4" /> Account erstellen
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold mb-4">Neuen Admin Account erstellen</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Discord User ID</Label>
                <Input 
                  value={formData.discordUserId} 
                  onChange={e => setFormData({...formData, discordUserId: e.target.value})} 
                  placeholder="123456789012345678" 
                  className={inputClass} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Discord Username</Label>
                <Input 
                  value={formData.discordUsername} 
                  onChange={e => setFormData({...formData, discordUsername: e.target.value})} 
                  placeholder="username" 
                  className={inputClass} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Mitarbeiter Nummer</Label>
                <Input 
                  value={formData.mitarbeiterNummer} 
                  onChange={e => setFormData({...formData, mitarbeiterNummer: e.target.value})} 
                  placeholder="MA-001" 
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
                <Input 
                  type="password"
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  placeholder="••••••••" 
                  className={inputClass} 
                  required 
                />
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
                onClick={() => { setShowForm(false); setError(''); }} 
                className="rounded-xl border-white/10"
              >
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                disabled={submitting} 
                className="bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Erstellen'}
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

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
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold">{account.mitarbeiterNummer}</span>
                      <span className="text-white/60">{account.email}</span>
                      {account.roleName && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {account.roleName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/30">
                      {account.discordUsername && <span>Discord: {account.discordUsername}</span>}
                      <span>Erstellt: {formatDate(account.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {admin?.canCreateAccounts && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(account.id)} 
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
