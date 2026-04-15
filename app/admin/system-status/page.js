'use client';

import { useState, useEffect } from 'react';
import { Power, AlertTriangle, Clock, Save, RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/components/providers/AdminAuthProvider';

export default function SystemStatusPage() {
  const { admin } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({
    wartungsmodus: false,
    geplante_wartung: false,
    wartung_start: '',
    wartung_ende: '',
    wartung_nachricht: 'Wir führen gerade Wartungsarbeiten durch.',
  });

  // Nur Projektinhaber (Level 4) dürfen diese Seite nutzen
  const canManageStatus = admin?.roleLevel >= 4;

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/system-status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status || status);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canManageStatus) {
      toast.error('Keine Berechtigung', { description: 'Nur Projektinhaber können den Status ändern.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/system-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status),
      });

      if (res.ok) {
        toast.success('Status gespeichert', { description: 'System-Status wurde aktualisiert.' });
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Speichern');
      }
    } catch (e) {
      toast.error('Fehler', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (!canManageStatus) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold text-white mb-2">Keine Berechtigung</h2>
          <p className="text-white/50">
            Nur <strong>Projektinhaber</strong> können den System-Status verwalten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">System-Status</h1>
          <p className="text-sm text-white/40">Wartungsmodus und geplante Wartungen verwalten</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
      </div>

      {/* Wartungsmodus */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div 
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              status.wartungsmodus 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-green-500/20 text-green-400'
            }`}
          >
            <Power className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-1">Wartungsmodus</h2>
            <p className="text-sm text-white/50 mb-4">
              Wenn aktiv, wird die Seite für alle Nutzer (außer Admins) gesperrt und die Wartungsseite angezeigt.
            </p>
            
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={status.wartungsmodus}
                onChange={(e) => setStatus({ ...status, wartungsmodus: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
              />
              <span className="text-sm font-medium text-white">
                Wartungsmodus {status.wartungsmodus ? 'aktiviert' : 'deaktiviert'}
              </span>
            </label>

            {status.wartungsmodus && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-300">
                  ⚠️ Die Seite ist aktuell im Wartungsmodus. Nur Admins können zugreifen.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Geplante Wartung */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div 
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              status.geplante_wartung 
                ? 'bg-yellow-500/20 text-yellow-400' 
                : 'bg-slate-500/20 text-slate-400'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-1">Geplante Wartung</h2>
            <p className="text-sm text-white/50 mb-4">
              Zeigt allen Nutzern ein Banner mit Countdown zur nächsten Wartung an.
            </p>
            
            <label className="flex items-center gap-3 cursor-pointer w-fit mb-4">
              <input
                type="checkbox"
                checked={status.geplante_wartung}
                onChange={(e) => setStatus({ ...status, geplante_wartung: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
              />
              <span className="text-sm font-medium text-white">
                Wartungs-Banner anzeigen
              </span>
            </label>

            {status.geplante_wartung && (
              <div className="space-y-4">
                {/* Start-Zeit */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Wartung startet am
                  </label>
                  <input
                    type="datetime-local"
                    value={status.wartung_start}
                    onChange={(e) => setStatus({ ...status, wartung_start: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* End-Zeit */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Voraussichtliches Ende
                  </label>
                  <input
                    type="datetime-local"
                    value={status.wartung_ende}
                    onChange={(e) => setStatus({ ...status, wartung_ende: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* Nachricht */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Nachricht im Banner
                  </label>
                  <textarea
                    value={status.wartung_nachricht}
                    onChange={(e) => setStatus({ ...status, wartung_nachricht: e.target.value })}
                    rows={3}
                    placeholder="Kurze Info zur Wartung..."
                    className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  />
                </div>

                {/* Vorschau */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-400 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-semibold">Geplante Wartung</span>
                  </div>
                  <p className="text-xs text-yellow-300/80">
                    {status.wartung_nachricht || 'Keine Nachricht'}
                  </p>
                  {status.wartung_start && (
                    <p className="text-xs text-yellow-300/60 mt-2">
                      Start: {new Date(status.wartung_start).toLocaleString('de-DE')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-sm text-blue-300">
          <strong>Hinweis:</strong> Admins können auch während des Wartungsmodus auf die Seite zugreifen. 
          Das Wartungs-Banner wird Admins nicht angezeigt.
        </p>
      </div>
    </div>
  );
}
