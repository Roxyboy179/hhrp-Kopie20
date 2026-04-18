'use client';

import { useState, useEffect } from 'react';
import { AdminCard, AdminCardHeader } from '@/components/admin/AdminCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Settings, Save, Loader2, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '@/components/providers/AdminAuthProvider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function EinstellungenPage() {
  const router = useRouter();
  const { admin, loading } = useAdminAuth();
  const [settings, setSettings] = useState({
    siteName: 'Hamburg Horizon RP',
    maintenanceMode: false,
    maintenanceMessage: '',
    registrationEnabled: true,
    maxUsers: 1000
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !admin) {
      router.push('/admin');
    }
  }, [admin, loading, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (admin) fetchSettings();
  }, [admin]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        toast.success('Einstellungen gespeichert!');
      } else {
        throw new Error('Fehler beim Speichern');
      }
    } catch (e) {
      toast.error('Fehler', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !admin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Einstellungen</h1>
          <p className="text-white/60 text-sm mt-1">System-Konfiguration verwalten</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Speichert...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Speichern
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allgemein */}
        <AdminCard>
          <AdminCardHeader icon={Settings} title="Allgemeine Einstellungen" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/60">Seitenname</Label>
              <Input
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white/60">Maximale Benutzer</Label>
              <Input
                type="number"
                value={settings.maxUsers}
                onChange={(e) => setSettings({...settings, maxUsers: parseInt(e.target.value)})}
                className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl"
              />
            </div>
          </div>
        </AdminCard>

        {/* Wartungsmodus */}
        <AdminCard>
          <AdminCardHeader icon={AlertCircle} title="Wartungsmodus" />
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
              <div>
                <div className="font-medium text-white">Wartungsmodus aktiv</div>
                <div className="text-sm text-white/60">Seite für Besucher sperren</div>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/60">Wartungsnachricht</Label>
              <Textarea
                value={settings.maintenanceMessage}
                onChange={(e) => setSettings({...settings, maintenanceMessage: e.target.value})}
                placeholder="Die Seite befindet sich im Wartungsmodus..."
                className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl min-h-[120px]"
              />
            </div>
          </div>
        </AdminCard>

        {/* Registrierung */}
        <AdminCard>
          <AdminCardHeader title="Registrierung" />
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
            <div>
              <div className="font-medium text-white">Registrierung erlauben</div>
              <div className="text-sm text-white/60">Neue Benutzer können sich anmelden</div>
            </div>
            <Switch
              checked={settings.registrationEnabled}
              onCheckedChange={(checked) => setSettings({...settings, registrationEnabled: checked})}
            />
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
