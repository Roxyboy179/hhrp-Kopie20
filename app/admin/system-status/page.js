'use client';

import { useState, useEffect } from 'react';
import { Power, AlertTriangle, Clock, Save, RefreshCw, ShieldAlert, Calendar, Flag, MessageSquare, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/components/providers/AdminAuthProvider';

const cardStyle = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
  border: '1px solid rgba(255,255,255,0.08)',
};

const inputStyle = 'w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/30 text-[13px]';

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

  const canManageStatus = admin?.roleLevel >= 4;

  useEffect(() => {
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
      const res = await fetch('/api/admin/system-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify(status),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Status gespeichert', { description: 'System-Status wurde aktualisiert.' });
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.open(name).then((cache) => {
                cache.delete('/api/admin/system-status');
              });
            });
          });
        }
        setTimeout(() => { fetchStatus(); }, 500);
      } else {
        throw new Error(data.error || 'Fehler beim Speichern');
      }
    } catch (e) {
      console.error('Save error:', e);
      toast.error('Fehler', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-white/45" />
      </div>
    );
  }

  if (!canManageStatus) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md p-8 rounded-2xl" style={cardStyle}>
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center border"
            style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }}
          >
            <ShieldAlert className="w-6 h-6 text-red-300" />
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight mb-1.5">Keine Berechtigung</h2>
          <p className="text-white/50 text-[13px]">
            Nur <strong className="text-white/80">Projektinhaber</strong> können den System-Status verwalten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header mit Speichern Button */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">System-Status &amp; Wartungen</h1>
          <p className="text-white/45 text-[13px] mt-1.5">Wartungsmodus und geplante Wartungen verwalten</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 h-11 rounded-xl font-semibold text-[12.5px] text-black border-0 transition-all disabled:opacity-50 hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 8px 20px -6px rgba(0,0,0,0.6)',
          }}
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Speichern...' : 'Änderungen speichern'}
        </button>
      </div>

      {/* Wartungsmodus Card */}
      <div className="p-5 md:p-6 rounded-2xl relative overflow-hidden" style={cardStyle}>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
        />
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0 border"
            style={status.wartungsmodus
              ? { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.25)', color: 'rgba(252,165,165,0.95)' }
              : { background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.25)', color: 'rgba(134,239,172,0.95)' }
            }
          >
            <Power className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-semibold text-white tracking-tight mb-1.5">Wartungsmodus</h2>
            <p className="text-[12.5px] text-white/50 mb-4 leading-relaxed">
              Wenn aktiviert, wird die gesamte Seite für alle Nutzer (außer Admins) gesperrt und eine Wartungsseite angezeigt.
            </p>
            
            <label className="group flex items-center gap-3 cursor-pointer w-fit px-3 py-2 -mx-3 rounded-xl hover:bg-white/[0.03] transition-colors">
              <input
                type="checkbox"
                checked={status.wartungsmodus}
                onChange={(e) => setStatus({ ...status, wartungsmodus: e.target.checked })}
                className="w-5 h-5 rounded-md border-2 border-white/20 bg-white/5 text-white focus:ring-2 focus:ring-white/20 cursor-pointer accent-white"
              />
              <span className="text-[13px] font-medium text-white">
                Wartungsmodus {status.wartungsmodus ? '✓ Aktiviert' : 'Deaktiviert'}
              </span>
            </label>

            {status.wartungsmodus && (
              <div
                className="mt-4 p-3.5 rounded-xl flex items-start gap-3 animate-in fade-in duration-300"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <AlertTriangle className="w-4 h-4 text-red-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-red-200 mb-0.5">⚠️ Wartungsmodus ist aktiv!</p>
                  <p className="text-[11.5px] text-red-200/70 leading-relaxed">
                    Die Seite ist für alle normalen Benutzer nicht erreichbar. Nur Admins können zugreifen.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Geplante Wartung Card */}
      <div className="p-5 md:p-6 rounded-2xl relative overflow-hidden" style={cardStyle}>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
        />
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0 border"
            style={status.geplante_wartung
              ? { background: 'rgba(234,179,8,0.12)', borderColor: 'rgba(234,179,8,0.25)', color: 'rgba(253,224,71,0.95)' }
              : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }
            }
          >
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-semibold text-white tracking-tight mb-1.5">Geplante Wartung</h2>
            <p className="text-[12.5px] text-white/50 mb-4 leading-relaxed">
              Zeigt allen Nutzern ein auffälliges Banner unter der Navigation mit Countdown zur nächsten geplanten Wartung.
            </p>
            
            <label className="group flex items-center gap-3 cursor-pointer w-fit px-3 py-2 -mx-3 rounded-xl hover:bg-white/[0.03] transition-colors mb-4">
              <input
                type="checkbox"
                checked={status.geplante_wartung}
                onChange={(e) => setStatus({ ...status, geplante_wartung: e.target.checked })}
                className="w-5 h-5 rounded-md border-2 border-white/20 bg-white/5 text-white focus:ring-2 focus:ring-white/20 cursor-pointer accent-white"
              />
              <span className="text-[13px] font-medium text-white">
                Wartungs-Banner {status.geplante_wartung ? '✓ Aktiviert' : 'Deaktiviert'}
              </span>
            </label>

            {status.geplante_wartung && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Zeitraum */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11.5px] font-medium text-white/65 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/45" />
                      Wartung startet am
                    </label>
                    <input
                      type="datetime-local"
                      value={status.wartung_start}
                      onChange={(e) => setStatus({ ...status, wartung_start: e.target.value })}
                      className={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="text-[11.5px] font-medium text-white/65 mb-1.5 flex items-center gap-1.5">
                      <Flag className="w-3.5 h-3.5 text-white/45" />
                      Voraussichtliches Ende
                    </label>
                    <input
                      type="datetime-local"
                      value={status.wartung_ende}
                      onChange={(e) => setStatus({ ...status, wartung_ende: e.target.value })}
                      className={inputStyle}
                    />
                  </div>
                </div>

                {/* Nachricht */}
                <div>
                  <label className="text-[11.5px] font-medium text-white/65 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-white/45" />
                    Nachricht im Banner
                  </label>
                  <textarea
                    value={status.wartung_nachricht}
                    onChange={(e) => setStatus({ ...status, wartung_nachricht: e.target.value })}
                    rows={3}
                    placeholder="z.B. Wir führen Wartungsarbeiten durch, um die Performance zu verbessern..."
                    className={`${inputStyle} resize-none leading-relaxed`}
                  />
                </div>

                {/* Banner Vorschau */}
                <div>
                  <p className="text-[11.5px] font-medium text-white/65 mb-2 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-white/45" />
                    Live-Vorschau des Banners:
                  </p>
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'linear-gradient(90deg, rgba(234,179,8,0.14), rgba(249,115,22,0.14), rgba(239,68,68,0.14))',
                      border: '1px solid rgba(234,179,8,0.3)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-300" />
                      <span className="text-[14px] font-semibold text-yellow-100 tracking-tight">Geplante Wartungsarbeiten</span>
                    </div>
                    <p className="text-[12.5px] text-yellow-100/85 mb-2 leading-relaxed">
                      {status.wartung_nachricht || 'Wir führen gerade Wartungsarbeiten durch.'}
                    </p>
                    {status.wartung_start && (
                      <div className="flex items-center gap-4 text-[11px] text-yellow-200/70 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          Start: {new Date(status.wartung_start).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {status.wartung_ende && (
                          <span className="flex items-center gap-1.5">
                            <Flag className="w-3 h-3" />
                            Ende: {new Date(status.wartung_ende).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
      </div>

      {/* Info Box */}
      <div
        className="p-4 rounded-xl flex items-start gap-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <ShieldAlert className="w-4 h-4 text-white/55 mt-0.5 flex-shrink-0" />
        <div className="text-[12.5px] text-white/60 leading-relaxed">
          <strong className="text-white/80">Admin-Hinweis:</strong> Als Admin kannst du auch während des Wartungsmodus auf die gesamte Seite zugreifen. Das Wartungs-Banner wird für Admins nicht angezeigt.
        </div>
      </div>
    </div>
  );
}
