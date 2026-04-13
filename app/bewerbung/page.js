'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  FileText, Send, Loader2, AlertTriangle, CheckCircle2, ArrowLeft,
  User, Calendar, Gamepad2, Shield, Target, MessageSquare, 
  Clock, Mic, BookOpen, Heart
} from 'lucide-react';

const inputClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl";

function FormSection({ number, title, icon: Icon, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold flex items-center gap-2 text-white/90">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-400" />
        </div>
        <span className="text-blue-400">{number}.</span> {title}
      </h3>
      <div className="space-y-4 pl-4 md:pl-7 border-l-2 border-blue-500/20">{children}</div>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-white/60 text-sm">{label} {required && <span className="text-red-400">*</span>}</Label>
      {children}
    </div>
  );
}

export default function BewerbungPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    vorname: '',
    alter: '',
    robloxName: '',
    spielzeit: '',
    fraktion: '',
    andererServer: '',
    bannWarn: '',
    warumTeam: '',
    geduldig: '',
    stundenProWoche: '',
    failRpLoesung: '',
    streitLoesung: '',
    hatMikro: false,
    kenntRegeln: false,
    bleibtNett: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/?error=not_logged_in');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/bewerbungen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Einreichen');

      setSubmitted(true);
      setTimeout(() => router.push('/meine-bewerbungen'), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user) return null;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full animate-fade-in-up">
          <GlassCard className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Bewerbung eingereicht!</h2>
            <p className="text-white/60 mb-6">
              Deine Bewerbung wurde erfolgreich an unser Team gesendet. Wir melden uns bald bei dir!
            </p>
            <Button 
              onClick={() => router.push('/meine-bewerbungen')}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl w-full"
            >
              Meine Bewerbungen ansehen
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6 text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur Startseite
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Team-Bewerbung</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
            Bewirb dich für unser Team
          </h1>
          <p className="text-white/60 text-base md:text-lg">
            Fülle das Formular aus und werde Teil von Hamburg Horizon RP
          </p>
        </div>

        <GlassCard className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Persönliche Informationen */}
            <FormSection number={1} title="Persönliche Informationen" icon={User}>
              <FormField label="Vorname" required>
                <Input
                  value={formData.vorname}
                  onChange={e => setFormData({ ...formData, vorname: e.target.value })}
                  placeholder="Max"
                  className={inputClass}
                  required
                />
              </FormField>

              <FormField label="Alter" required>
                <Input
                  type="number"
                  value={formData.alter}
                  onChange={e => setFormData({ ...formData, alter: e.target.value })}
                  placeholder="18"
                  className={inputClass}
                  required
                  min="13"
                />
              </FormField>

              <FormField label="Roblox Name" required>
                <Input
                  value={formData.robloxName}
                  onChange={e => setFormData({ ...formData, robloxName: e.target.value })}
                  placeholder="Dein Roblox Username"
                  className={inputClass}
                  required
                />
              </FormField>
            </FormSection>

            {/* Roleplay Erfahrung */}
            <FormSection number={2} title="Roleplay Erfahrung" icon={Gamepad2}>
              <FormField label="Wie lange spielst du schon Roleplay?" required>
                <Input
                  value={formData.spielzeit}
                  onChange={e => setFormData({ ...formData, spielzeit: e.target.value })}
                  placeholder="z.B. 2 Jahre"
                  className={inputClass}
                  required
                />
              </FormField>

              <FormField label="In welcher Fraktion möchtest du arbeiten?" required>
                <Input
                  value={formData.fraktion}
                  onChange={e => setFormData({ ...formData, fraktion: e.target.value })}
                  placeholder="z.B. Polizei, Feuerwehr, Rettungsdienst"
                  className={inputClass}
                  required
                />
              </FormField>

              <FormField label="Warst du schon auf einem anderen RP-Server?">
                <Textarea
                  value={formData.andererServer}
                  onChange={e => setFormData({ ...formData, andererServer: e.target.value })}
                  placeholder="Wenn ja, welcher und wie war deine Erfahrung?"
                  className={inputClass + " min-h-[80px] resize-none"}
                />
              </FormField>

              <FormField label="Wurdest du schon mal gebannt oder verwarnt?" required>
                <Textarea
                  value={formData.bannWarn}
                  onChange={e => setFormData({ ...formData, bannWarn: e.target.value })}
                  placeholder="Wenn ja, warum? Bitte sei ehrlich."
                  className={inputClass + " min-h-[80px] resize-none"}
                  required
                />
              </FormField>
            </FormSection>

            {/* Motivation */}
            <FormSection number={3} title="Motivation & Eigenschaften" icon={Target}>
              <FormField label="Warum möchtest du in unser Team?" required>
                <Textarea
                  value={formData.warumTeam}
                  onChange={e => setFormData({ ...formData, warumTeam: e.target.value })}
                  placeholder="Was motiviert dich?"
                  className={inputClass + " min-h-[120px] resize-none"}
                  required
                />
              </FormField>

              <FormField label="Bist du geduldig und kannst du mit Stress umgehen?" required>
                <Textarea
                  value={formData.geduldig}
                  onChange={e => setFormData({ ...formData, geduldig: e.target.value })}
                  placeholder="Beschreibe deine Stärken"
                  className={inputClass + " min-h-[100px] resize-none"}
                  required
                />
              </FormField>

              <FormField label="Wie viele Stunden pro Woche kannst du aktiv sein?" required>
                <Input
                  value={formData.stundenProWoche}
                  onChange={e => setFormData({ ...formData, stundenProWoche: e.target.value })}
                  placeholder="z.B. 10-15 Stunden"
                  className={inputClass}
                  required
                />
              </FormField>
            </FormSection>

            {/* Situationen */}
            <FormSection number={4} title="Situationsfragen" icon={MessageSquare}>
              <FormField label="Ein Spieler macht Fail-RP. Wie gehst du vor?" required>
                <Textarea
                  value={formData.failRpLoesung}
                  onChange={e => setFormData({ ...formData, failRpLoesung: e.target.value })}
                  placeholder="Beschreibe deine Vorgehensweise"
                  className={inputClass + " min-h-[120px] resize-none"}
                  required
                />
              </FormField>

              <FormField label="Zwei Spieler streiten sich. Wie löst du den Konflikt?" required>
                <Textarea
                  value={formData.streitLoesung}
                  onChange={e => setFormData({ ...formData, streitLoesung: e.target.value })}
                  placeholder="Beschreibe deine Lösung"
                  className={inputClass + " min-h-[120px] resize-none"}
                  required
                />
              </FormField>
            </FormSection>

            {/* Voraussetzungen */}
            <FormSection number={5} title="Voraussetzungen" icon={Shield}>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <Checkbox
                    checked={formData.hatMikro}
                    onCheckedChange={v => setFormData({ ...formData, hatMikro: v })}
                    className="mt-0.5"
                    required
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-blue-400" />
                      <label className="text-sm text-white/80 cursor-pointer font-medium">
                        Ich habe ein funktionierendes Mikrofon
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <Checkbox
                    checked={formData.kenntRegeln}
                    onCheckedChange={v => setFormData({ ...formData, kenntRegeln: v })}
                    className="mt-0.5"
                    required
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <label className="text-sm text-white/80 cursor-pointer font-medium">
                        Ich habe die Serverregeln gelesen und verstanden
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <Checkbox
                    checked={formData.bleibtNett}
                    onCheckedChange={v => setFormData({ ...formData, bleibtNett: v })}
                    className="mt-0.5"
                    required
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-green-400" />
                      <label className="text-sm text-white/80 cursor-pointer font-medium">
                        Ich verpflichte mich, respektvoll und fair zu bleiben
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}

            <div className="pt-4 border-t border-white/5">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12 text-lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Wird eingereicht...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Bewerbung einreichen
                  </>
                )}
              </Button>

              <p className="text-white/40 text-xs text-center mt-4">
                Mit dem Absenden bestätigst du, dass alle Angaben wahrheitsgemäß sind.
              </p>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
