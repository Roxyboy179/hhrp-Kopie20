'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const inputClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl";

export default function BetaTesterBewerbungPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [betaTesterOpen, setBetaTesterOpen] = useState(true);
  const [alreadyHasRole, setAlreadyHasRole] = useState(false);
  const [existingBewerbung, setExistingBewerbung] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    discordName: '',
    alter: '',
    warum: '',
    erfahrung: '',
    verfuegbarkeit: '',
    features: '',
    bugs: '',
    feedback: '',
    kommunikation: '',
    zeitinvestition: '',
    erwartungen: '',
    staerken: '',
    schwaechen: '',
    zusaetzlich: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/?error=not_logged_in');
    }
    
    if (user) {
      // Check ob User bereits Beta Tester Rolle hat
      if (user.roles && user.roles.includes('1494434149623136276')) {
        setAlreadyHasRole(true);
      }
      
      // Discord Name vorausfüllen
      setFormData(prev => ({
        ...prev,
        discordName: user.globalName || user.username
      }));
      
      // Check Settings
      fetchSettings();
      // Check ob bereits Bewerbung existiert
      checkExistingBewerbung();
    }
  }, [user, authLoading, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/bewerbung-settings');
      const data = await res.json();
      setBetaTesterOpen(data.beta_tester_open !== false);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const checkExistingBewerbung = async () => {
    try {
      const res = await fetch('/api/meine-bewerbungen', { credentials: 'include' });
      const data = await res.json();
      const betaTesterBewerbung = data.bewerbungen?.find(b => 
        b.form_data?.bewerbungstyp === 'beta_tester' && 
        b.status !== 'Abgelehnt'
      );
      if (betaTesterBewerbung) {
        setExistingBewerbung(betaTesterBewerbung);
      }
    } catch (error) {
      console.error('Error checking existing bewerbung:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const requiredFields = ['name', 'discordName', 'alter', 'warum', 'erfahrung'];
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        toast.error('Pflichtfelder fehlen', {
          description: 'Bitte fülle alle Pflichtfelder aus.'
        });
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('/api/bewerbungen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bewerbungstyp: 'beta_tester',
          ...formData
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Bewerbung fehlgeschlagen');
      }

      setSubmitted(true);
      toast.success('Bewerbung eingereicht!', {
        description: 'Deine Beta Tester Bewerbung wurde erfolgreich eingereicht.'
      });
      
      setTimeout(() => {
        router.push('/meine-bewerbungen');
      }, 2000);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Fehler', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-accent)' }} />
      </div>
    );
  }

  if (alreadyHasRole) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <GlassCard className="p-8 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold mb-2">Du bist bereits Beta Tester!</h1>
          <p className="text-white/60 mb-6">
            Du hast bereits die Beta Tester Rolle und kannst dich nicht erneut bewerben.
          </p>
          <Button onClick={() => router.push('/')}>
            Zur Startseite
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (existingBewerbung) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <GlassCard className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--theme-accent)' }} />
          <h1 className="text-2xl font-bold mb-2">Bewerbung bereits vorhanden</h1>
          <p className="text-white/60 mb-2">
            Du hast bereits eine Beta Tester Bewerbung eingereicht.
          </p>
          <p className="text-white/40 mb-6 text-sm">
            Status: <span className="font-semibold" style={{ color: 'var(--theme-accent)' }}>
              {existingBewerbung.status}
            </span>
          </p>
          <Button onClick={() => router.push('/meine-bewerbungen')}>
            Meine Bewerbungen ansehen
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (!betaTesterOpen) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <GlassCard className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--theme-accent)' }} />
          <h1 className="text-2xl font-bold mb-2">Beta Tester Bewerbungen geschlossen</h1>
          <p className="text-white/60 mb-6">
            Aktuell nehmen wir keine neuen Beta Tester Bewerbungen an.
          </p>
          <Button onClick={() => router.push('/')}>
            Zur Startseite
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <GlassCard className="p-8 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold mb-2">Bewerbung eingereicht!</h1>
          <p className="text-white/60 mb-6">
            Deine Beta Tester Bewerbung wurde erfolgreich eingereicht. Du wirst benachrichtigt, sobald sie bearbeitet wurde.
          </p>
          <Button onClick={() => router.push('/meine-bewerbungen')}>
            Meine Bewerbungen ansehen
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: 'rgba(var(--theme-accent-rgb), 0.1)', border: '1px solid rgba(var(--theme-accent-rgb), 0.2)' }}>
          <Sparkles className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--theme-accent)' }}>HHRP Beta Tester Programm</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Beta Tester werden</h1>
        <p className="text-white/60 max-w-2xl mx-auto">
          Werde Teil unseres exklusiven Beta Tester Programms und hilf uns, Hamburg Horizon RP noch besser zu machen!
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <GlassCard className="p-6 md:p-8 space-y-6">
          {/* Persönliche Daten */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span style={{ color: 'var(--theme-accent)' }}>01</span>
              Persönliche Daten
            </h2>
            
            <div>
              <Label>Vollständiger Name *</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Max Mustermann"
                className={inputClass}
                required
              />
            </div>

            <div>
              <Label>Discord Name *</Label>
              <Input
                name="discordName"
                value={formData.discordName}
                onChange={handleChange}
                className={inputClass}
                required
                disabled
              />
            </div>

            <div>
              <Label>Alter *</Label>
              <Input
                name="alter"
                type="number"
                value={formData.alter}
                onChange={handleChange}
                placeholder="18"
                className={inputClass}
                required
                min="13"
              />
            </div>
          </div>

          {/* Motivation & Erfahrung */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span style={{ color: 'var(--theme-accent)' }}>02</span>
              Motivation & Erfahrung
            </h2>

            <div>
              <Label>Warum möchtest du Beta Tester werden? *</Label>
              <Textarea
                name="warum"
                value={formData.warum}
                onChange={handleChange}
                placeholder="Beschreibe deine Motivation..."
                className={inputClass}
                rows={4}
                required
              />
            </div>

            <div>
              <Label>Hast du Erfahrung mit Beta Testing oder Qualitätssicherung? *</Label>
              <Textarea
                name="erfahrung"
                value={formData.erfahrung}
                onChange={handleChange}
                placeholder="Beschreibe deine Erfahrungen..."
                className={inputClass}
                rows={3}
                required
              />
            </div>

            <div>
              <Label>Wie viel Zeit kannst du pro Woche für Beta Testing aufbringen?</Label>
              <Input
                name="verfuegbarkeit"
                value={formData.verfuegbarkeit}
                onChange={handleChange}
                placeholder="z.B. 5-10 Stunden pro Woche"
                className={inputClass}
              />
            </div>
          </div>

          {/* Testing Fähigkeiten */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span style={{ color: 'var(--theme-accent)' }}>03</span>
              Testing Fähigkeiten
            </h2>

            <div>
              <Label>Welche Features würdest du am liebsten testen?</Label>
              <Textarea
                name="features"
                value={formData.features}
                onChange={handleChange}
                placeholder="z.B. Neue Bewerbungssysteme, Admin-Tools, UI-Updates..."
                className={inputClass}
                rows={3}
              />
            </div>

            <div>
              <Label>Wie gehst du vor, wenn du einen Bug findest?</Label>
              <Textarea
                name="bugs"
                value={formData.bugs}
                onChange={handleChange}
                placeholder="Beschreibe deinen Prozess zum Dokumentieren und Melden von Bugs..."
                className={inputClass}
                rows={3}
              />
            </div>

            <div>
              <Label>Wie gibst du konstruktives Feedback?</Label>
              <Textarea
                name="feedback"
                value={formData.feedback}
                onChange={handleChange}
                placeholder="Beschreibe, wie du Verbesserungsvorschläge formulierst..."
                className={inputClass}
                rows={3}
              />
            </div>
          </div>

          {/* Teamwork & Kommunikation */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span style={{ color: 'var(--theme-accent)' }}>04</span>
              Teamwork & Kommunikation
            </h2>

            <div>
              <Label>Wie würdest du mit anderen Beta Testern kommunizieren?</Label>
              <Textarea
                name="kommunikation"
                value={formData.kommunikation}
                onChange={handleChange}
                placeholder="z.B. Discord, Ticket-System, direkter Austausch..."
                className={inputClass}
                rows={3}
              />
            </div>

            <div>
              <Label>Wie viel Zeit kannst du täglich/wöchentlich investieren?</Label>
              <Input
                name="zeitinvestition"
                value={formData.zeitinvestition}
                onChange={handleChange}
                placeholder="z.B. 1-2 Stunden täglich"
                className={inputClass}
              />
            </div>

            <div>
              <Label>Was erwartest du vom Beta Tester Programm?</Label>
              <Textarea
                name="erwartungen"
                value={formData.erwartungen}
                onChange={handleChange}
                placeholder="Deine Erwartungen und Ziele..."
                className={inputClass}
                rows={3}
              />
            </div>
          </div>

          {/* Persönliche Einschätzung */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span style={{ color: 'var(--theme-accent)' }}>05</span>
              Persönliche Einschätzung
            </h2>

            <div>
              <Label>Was sind deine Stärken?</Label>
              <Textarea
                name="staerken"
                value={formData.staerken}
                onChange={handleChange}
                placeholder="z.B. Detailgenauigkeit, technisches Verständnis, Kreativität..."
                className={inputClass}
                rows={3}
              />
            </div>

            <div>
              <Label>Was sind deine Schwächen im Bereich Testing?</Label>
              <Textarea
                name="schwaechen"
                value={formData.schwaechen}
                onChange={handleChange}
                placeholder="Sei ehrlich - wir schätzen Selbstreflexion!"
                className={inputClass}
                rows={3}
              />
            </div>

            <div>
              <Label>Möchtest du uns noch etwas mitteilen?</Label>
              <Textarea
                name="zusaetzlich"
                value={formData.zusaetzlich}
                onChange={handleChange}
                placeholder="Zusätzliche Informationen..."
                className={inputClass}
                rows={3}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold"
              style={{ background: 'var(--theme-accent)', color: '#000' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Wird eingereicht...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Bewerbung einreichen
                </>
              )}
            </Button>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}
