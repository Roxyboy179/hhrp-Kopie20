'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, CheckCircle2, XCircle, FileText, Briefcase, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BewerbungVerwaltungPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    normal_open: true,
    praktikum_open: true,
    uprank_open: true,
    beta_tester_open: true
  });

  useEffect(() => {
    checkAdmin();
    fetchSettings();
  }, []);

  const checkAdmin = async () => {
    try {
      const res = await fetch('/api/admin/me');
      const data = await res.json();
      
      if (!data.admin || data.admin.adminLevel < 3) {
        toast.error('Keine Berechtigung', { description: 'Nur Projektinhaber und Stl. Projektinhaber können diese Seite aufrufen.' });
        router.push('/admin');
        return;
      }
      
      setAdmin(data.admin);
    } catch (e) {
      console.error(e);
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/bewerbung-settings');
      const data = await res.json();
      setSettings(data.settings || { normal_open: true, praktikum_open: true, uprank_open: true, beta_tester_open: true });
    } catch (e) {
      console.error('Fehler beim Laden der Settings:', e);
    }
  };

  const handleToggle = (type) => {
    setSettings(prev => ({ ...prev, [`${type}_open`]: !prev[`${type}_open`] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/bewerbung-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          normalOpen: settings.normal_open,
          praktikumOpen: settings.praktikum_open,
          uprankOpen: settings.uprank_open,
          betaTesterOpen: settings.beta_tester_open
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Gespeichert', { description: 'Bewerbungs-Einstellungen wurden aktualisiert.' });
    } catch (e) {
      toast.error('Fehler', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  const bewerbungTypes = [
    {
      key: 'normal',
      title: 'Team Bewerbung',
      desc: 'Neue Bewerber können sich für einen Teamplatz bewerben',
      icon: <FileText className="w-6 h-6" />,
      color: 'blue'
    },
    {
      key: 'praktikum',
      title: 'Praktikum Bewerbung',
      desc: 'Bewerber können sich für ein Praktikum bewerben',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'orange'
    },
    {
      key: 'beta_tester',
      title: 'Beta Tester Bewerbung',
      desc: 'User können sich als Beta Tester bewerben',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'purple'
    },
    {
      key: 'uprank',
      title: 'Uprank Bewerbung',
      desc: 'Teammitglieder können eine Beförderung beantragen',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'green'
    }
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => router.push('/admin')}
          className="mb-6 gap-2 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-white/75 hover:text-white text-[12.5px] font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Dashboard
        </Button>

        <div className="mb-7">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">Bewerbungs-Verwaltung</h1>
          <p className="text-white/50 text-[13.5px] mt-1.5 leading-relaxed">
            Öffne oder schließe einzelne Bewerbungstypen. Geschlossene Bewerbungen können nicht eingereicht werden.
          </p>
        </div>

        <div className="space-y-3">
          {bewerbungTypes.map((type) => {
            const isOpen = settings[`${type.key}_open`];
            const iconColors = {
              blue: 'rgba(147,197,253,0.9)',
              orange: 'rgba(253,186,116,0.9)',
              purple: 'rgba(216,180,254,0.9)',
              green: 'rgba(134,239,172,0.9)',
            };

            return (
              <div
                key={type.key}
                className="p-5 rounded-2xl relative overflow-hidden transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                  border: `1px solid ${isOpen ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
                />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/[0.08] flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
                        color: iconColors[type.color] || 'rgba(255,255,255,0.8)',
                      }}
                    >
                      {type.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[14.5px] font-semibold text-white tracking-tight truncate">{type.title}</h3>
                      <p className="text-[12px] text-white/50 mt-0.5 leading-snug">{type.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(type.key)}
                    aria-label={isOpen ? 'Schließen' : 'Öffnen'}
                    className="relative w-12 h-7 rounded-full transition-colors flex-shrink-0 border"
                    style={{
                      background: isOpen ? 'linear-gradient(135deg, rgba(34,197,94,0.85), rgba(22,163,74,0.95))' : 'rgba(255,255,255,0.06)',
                      borderColor: isOpen ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.12)',
                    }}
                  >
                    <div
                      className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-transform"
                      style={{ transform: isOpen ? 'translateX(22px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>

                <div className="mt-3.5 flex items-center gap-2 text-[11.5px] font-medium pt-3.5 border-t border-white/[0.04]">
                  {isOpen ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
                      <span className="text-green-200/90">Bewerbungen geöffnet</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-red-300" />
                      <span className="text-red-200/90">Bewerbungen geschlossen</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-11 px-6 rounded-xl text-[13px] font-semibold text-black border-0 tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 8px 20px -6px rgba(0,0,0,0.6)',
            }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Einstellungen speichern
              </>
            )}
          </Button>
        </div>

        <div
          className="mt-5 p-4 rounded-xl"
          style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}
        >
          <p className="text-[12.5px] text-yellow-200/85 leading-relaxed">
            <strong className="text-yellow-100">Hinweis:</strong> Wenn du Bewerbungen schließt, sehen Nutzer einen Sperrbildschirm auf der Bewerbungsseite.
          </p>
        </div>
      </div>
    </div>
  );
}
