'use client';

import { useState, useEffect } from 'react';
import { Power, AlertTriangle, Clock, Save, RefreshCw, ShieldAlert, Calendar, Flag, MessageSquare, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/components/providers/AdminAuthProvider';
import { AdminCard, AdminCardHeader } from '@/components/admin/AdminCard';
import { Button } from '@/components/ui/button';

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
    // WICHTIG: Cache für diese API-Route löschen beim Laden der Seite
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.open(name).then((cache) => {
            cache.delete('/api/admin/system-status');
          });
        });
      });
    }
    
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      // Cache-Busting: Füge Timestamp hinzu um gecachte Responses zu vermeiden
      const res = await fetch('/api/admin/system-status?_=' + Date.now(), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
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
      console.log('📤 Sending update:', status);
      
      const res = await fetch('/api/admin/system-status', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(status),
      });

      const data = await res.json();
      console.log('📥 Response:', data);

      if (res.ok) {
        toast.success('Status gespeichert', { description: 'System-Status wurde aktualisiert.' });
        
        // Cache löschen und Daten neu laden um Persistenz zu verifizieren
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.open(name).then((cache) => {
                cache.delete('/api/admin/system-status');
              });
            });
          });
        }
        
        // Warte kurz und lade dann neu um zu verifizieren
        setTimeout(() => {
          fetchStatus();
        }, 500);
      } else {
        throw new Error(data.error || 'Fehler beim Speichern');
      }
    } catch (e) {
      console.error('❌ Save error:', e);
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
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header mit Speichern Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">System-Status & Wartungen</h1>
          <p className="text-white/60 text-sm mt-1">Wartungsmodus und geplante Wartungen verwalten</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20"
        >
          {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Speichern...' : 'Änderungen speichern'}
        </Button>
      </div>

      {/* Wartungsmodus Card */}
      <AdminCard>
        <div className="flex items-start gap-5">
          <div 
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              status.wartungsmodus 
                ? 'bg-red-500/20 text-red-400 shadow-lg shadow-red-500/20' 
                : 'bg-green-500/20 text-green-400 shadow-lg shadow-green-500/20'
            }`}
          >
            <Power className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">Wartungsmodus</h2>
            <p className="text-sm text-white/60 mb-5 leading-relaxed">
              Wenn aktiviert, wird die gesamte Seite für alle Nutzer (außer Admins) gesperrt und eine Wartungsseite angezeigt.
            </p>
            
            <label className="group flex items-center gap-3 cursor-pointer w-fit p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
              <input
                type="checkbox"
                checked={status.wartungsmodus}
                onChange={(e) => setStatus({ ...status, wartungsmodus: e.target.checked })}
                className="w-6 h-6 rounded-lg border-2 border-white/20 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              />
              <span className="text-sm font-semibold text-white">
                Wartungsmodus {status.wartungsmodus ? '✓ Aktiviert' : 'Deaktiviert'}
              </span>
            </label>

            {status.wartungsmodus && (
              <div className="mt-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in duration-300">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-300 mb-1">⚠️ Wartungsmodus ist aktiv!</p>
                  <p className="text-xs text-red-300/80">
                    Die Seite ist für alle normalen Benutzer nicht erreichbar. Nur Admins können zugreifen.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminCard>

      {/* Geplante Wartung Card */}
      <AdminCard>
        <div className="flex items-start gap-5">
          <div 
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              status.geplante_wartung 
                ? 'bg-yellow-500/20 text-yellow-400 shadow-lg shadow-yellow-500/20' 
                : 'bg-slate-500/20 text-slate-400'
            }`}
          >
            <Clock className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">Geplante Wartung</h2>
            <p className="text-sm text-white/60 mb-5 leading-relaxed">
              Zeigt allen Nutzern ein auffälliges Banner unter der Navigation mit Countdown zur nächsten geplanten Wartung.
            </p>
            
            <label className="group flex items-center gap-3 cursor-pointer w-fit p-3 rounded-xl hover:bg-white/[0.02] transition-colors mb-5">
              <input
                type="checkbox"
                checked={status.geplante_wartung}
                onChange={(e) => setStatus({ ...status, geplante_wartung: e.target.checked })}
                className="w-6 h-6 rounded-lg border-2 border-white/20 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              />
              <span className="text-sm font-semibold text-white">
                Wartungs-Banner {status.geplante_wartung ? '✓ Aktiviert' : 'Deaktiviert'}
              </span>
            </label>

            {status.geplante_wartung && (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Zeitraum */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Wartung startet am
                    </label>
                    <input
                      type="datetime-local"
                      value={status.wartung_start}
                      onChange={(e) => setStatus({ ...status, wartung_start: e.target.value })}
                      className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2 flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Voraussichtliches Ende
                    </label>
                    <input
                      type="datetime-local"
                      value={status.wartung_ende}
                      onChange={(e) => setStatus({ ...status, wartung_ende: e.target.value })}
                      className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>
                </div>

                {/* Nachricht */}
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Nachricht im Banner
                  </label>
                  <textarea
                    value={status.wartung_nachricht}
                    onChange={(e) => setStatus({ ...status, wartung_nachricht: e.target.value })}
                    rows={3}
                    placeholder="z.B. Wir führen Wartungsarbeiten durch, um die Performance zu verbessern..."
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
                  />
                </div>

                {/* Banner Vorschau */}
                <div>
                  <p className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Live-Vorschau des Banners:
                  </p>
                  <div className="p-5 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 border-2 border-yellow-500/30 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <span className="text-base font-bold text-yellow-200">Geplante Wartungsarbeiten</span>
                    </div>
                    <p className="text-sm text-yellow-100/90 mb-2">
                      {status.wartung_nachricht || 'Wir führen gerade Wartungsarbeiten durch.'}
                    </p>
                    {status.wartung_start && (
                      <div className="flex items-center gap-4 text-xs text-yellow-200/70">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Start: {new Date(status.wartung_start).toLocaleString('de-DE', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {status.wartung_ende && (
                          <span className="flex items-center gap-1.5">
                            <Flag className="w-3.5 h-3.5" />
                            Ende: {new Date(status.wartung_ende).toLocaleString('de-DE', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminCard>

      {/* Info Box */}
      <AdminCard className="border-blue-500/20 bg-blue-500/5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-300/90 leading-relaxed">
            <strong className="text-blue-200">Admin-Hinweis:</strong> Als Admin kannst du auch während des Wartungsmodus 
            auf die gesamte Seite zugreifen. Das Wartungs-Banner wird für Admins nicht angezeigt.
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
