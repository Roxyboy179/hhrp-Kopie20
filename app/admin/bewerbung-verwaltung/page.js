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
          uprankOpen: settings.uprank_open
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
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin')}
          className="mb-6 text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zum Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bewerbungs-Verwaltung</h1>
          <p className="text-white/50">
            Öffne oder schließe einzelne Bewerbungstypen. Geschlossene Bewerbungen können nicht eingereicht werden.
          </p>
        </div>

        <div className="space-y-4">
          {bewerbungTypes.map((type) => {
            const isOpen = settings[`${type.key}_open`];
            const colorClasses = {
              blue: 'border-blue-500/30 bg-blue-500/5',
              orange: 'border-orange-500/30 bg-orange-500/5',
              purple: 'border-purple-500/30 bg-purple-500/5',
              green: 'border-green-500/30 bg-green-500/5'
            };

            return (
              <div
                key={type.key}
                className={`p-6 rounded-2xl border ${colorClasses[type.color]} backdrop-blur-sm`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-${type.color}-500/10 border border-${type.color}-500/20 flex items-center justify-center text-${type.color}-400`}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{type.title}</h3>
                      <p className="text-sm text-white/50">{type.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(type.key)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      isOpen ? 'bg-green-500' : 'bg-red-500/80'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        isOpen ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {isOpen ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">Bewerbungen geöffnet</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400">Bewerbungen geschlossen</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-black hover:bg-gray-200 rounded-xl px-8"
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

        <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-sm text-yellow-300/80">
            <strong>Hinweis:</strong> Wenn du Bewerbungen schließt, sehen Nutzer einen Sperrbildschirm auf der Bewerbungsseite.
          </p>
        </div>
      </div>
    </div>
  );
}
