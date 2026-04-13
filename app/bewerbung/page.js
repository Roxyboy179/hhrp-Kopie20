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
import { Progress } from '@/components/ui/progress';
import { 
  FileText, Send, Loader2, AlertTriangle, CheckCircle2, ArrowLeft,
  User, Calendar, Gamepad2, Users, Target, MessageSquare, Clock,
  ShieldCheck, Mic, BookOpen, Heart
} from 'lucide-react';

const inputClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl h-11";
const textareaClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl resize-none";

function SectionHeader({ icon: Icon, title, subtitle, step, totalSteps }) {
  return (
    <div className=\"mb-6\">
      <div className=\"flex items-center gap-3 mb-2\">
        <div className=\"w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center\">
          <Icon className=\"w-5 h-5 text-blue-400\" />
        </div>
        <div className=\"flex-1\">
          <div className=\"flex items-center justify-between\">
            <h3 className=\"text-lg font-semibold text-white\">{title}</h3>
            <span className=\"text-xs text-white/40\">Schritt {step} von {totalSteps}</span>
          </div>
          <p className=\"text-sm text-white/50\">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, required, hint, children }) {
  return (
    <div className=\"space-y-2\">
      <Label className=\"text-white/70 text-sm font-medium\">
        {label} {required && <span className=\"text-red-400\">*</span>}
      </Label>
      {children}
      {hint && <p className=\"text-xs text-white/30\">{hint}</p>}
    </div>
  );
}

export default function BewerbungPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
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

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

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

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (authLoading) {
    return (
      <div className=\"flex items-center justify-center min-h-screen\">
        <Loader2 className=\"w-8 h-8 animate-spin text-blue-400\" />
      </div>
    );
  }

  if (!user) return null;

  if (submitted) {
    return (
      <div className=\"min-h-screen flex items-center justify-center px-4\">
        <div className=\"max-w-md w-full animate-fade-in-up\">
          <GlassCard className=\"p-8 text-center\">
            <div className=\"w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4\">
              <CheckCircle2 className=\"w-8 h-8 text-green-400\" />
            </div>
            <h2 className=\"text-2xl font-bold mb-3\">Bewerbung eingereicht!</h2>
            <p className=\"text-white/60 mb-6\">
              Deine Bewerbung wurde erfolgreich an unser Team gesendet. Wir melden uns bald bei dir!
            </p>
            <Button 
              onClick={() => router.push('/meine-bewerbungen')}
              className=\"bg-blue-600 hover:bg-blue-700 rounded-xl w-full\"
            >
              Meine Bewerbungen ansehen
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen px-4 py-8\">
      <div className=\"max-w-4xl mx-auto\">
        <Button
          variant=\"ghost\"
          onClick={() => router.push('/')}
          className=\"mb-6 text-white/60 hover:text-white\"
        >
          <ArrowLeft className=\"w-4 h-4 mr-2\" />
          Zurück zur Startseite
        </Button>

        {/* Header */}
        <div className=\"text-center mb-8\">
          <div className=\"inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4\">
            <FileText className=\"w-4 h-4 text-blue-400\" />
            <span className=\"text-sm text-blue-300\">Team-Bewerbung</span>
          </div>
          <h1 className=\"text-3xl md:text-4xl font-bold mb-3\">
            Bewirb dich für unser Team
          </h1>
          <p className=\"text-white/60\">
            Fülle das Formular Schritt für Schritt aus
          </p>
        </div>

        {/* Progress */}
        <GlassCard className=\"p-6 mb-6\">
          <div className=\"flex items-center justify-between mb-3\">
            <span className=\"text-sm text-white/60\">Fortschritt</span>
            <span className=\"text-sm font-medium text-blue-400\">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className=\"h-2\" />
        </GlassCard>

        {/* Form */}
        <GlassCard className=\"p-6 md:p-8\">
          <form onSubmit={handleSubmit} className=\"space-y-8\">
            {/* Step 1: Persönliche Informationen */}
            {currentStep === 1 && (
              <div className=\"space-y-6 animate-fade-in-up\">
                <SectionHeader 
                  icon={User}
                  title=\"Persönliche Informationen\"
                  subtitle=\"Erzähl uns etwas über dich\"
                  step={1}
                  totalSteps={totalSteps}
                />

                <div className=\"grid md:grid-cols-2 gap-6\">
                  <FormField label=\"Vorname\" required>
                    <Input
                      value={formData.vorname}
                      onChange={e => setFormData({ ...formData, vorname: e.target.value })}
                      placeholder=\"Max\"
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label=\"Alter\" required>
                    <Input
                      type=\"number\"
                      value={formData.alter}
                      onChange={e => setFormData({ ...formData, alter: e.target.value })}
                      placeholder=\"18\"
                      className={inputClass}
                      required
                      min=\"13\"
                    />
                  </FormField>
                </div>

                <FormField label=\"Roblox Name\" required hint=\"Dein aktueller Roblox Benutzername\">
                  <Input
                    value={formData.robloxName}
                    onChange={e => setFormData({ ...formData, robloxName: e.target.value })}
                    placeholder=\"DeineRobloxName\"
                    className={inputClass}
                    required
                  />
                </FormField>
              </div>
            )}

            {/* Step 2: Roleplay Erfahrung */}
            {currentStep === 2 && (
              <div className=\"space-y-6 animate-fade-in-up\">
                <SectionHeader 
                  icon={Gamepad2}
                  title=\"Roleplay Erfahrung\"
                  subtitle=\"Deine bisherige RP-Geschichte\"
                  step={2}
                  totalSteps={totalSteps}
                />

                <FormField label=\"Wie lange spielst du schon Roleplay?\" required>
                  <Input
                    value={formData.spielzeit}
                    onChange={e => setFormData({ ...formData, spielzeit: e.target.value })}
                    placeholder=\"z.B. 2 Jahre\"
                    className={inputClass}
                    required
                  />
                </FormField>

                <FormField label=\"In welcher Fraktion möchtest du arbeiten?\" required>
                  <Input
                    value={formData.fraktion}
                    onChange={e => setFormData({ ...formData, fraktion: e.target.value })}
                    placeholder=\"z.B. Polizei, Feuerwehr, Rettungsdienst\"
                    className={inputClass}
                    required
                  />
                </FormField>

                <FormField label=\"Warst du schon auf einem anderen RP-Server?\">
                  <Textarea
                    value={formData.andererServer}
                    onChange={e => setFormData({ ...formData, andererServer: e.target.value })}
                    placeholder=\"Wenn ja, welcher und wie war deine Erfahrung?\"
                    className={textareaClass}
                    rows={4}
                  />
                </FormField>

                <FormField label=\"Wurdest du schon mal gebannt oder verwarnt?\" required>
                  <Textarea
                    value={formData.bannWarn}
                    onChange={e => setFormData({ ...formData, bannWarn: e.target.value })}
                    placeholder=\"Wenn ja, warum? Bitte sei ehrlich.\"
                    className={textareaClass}
                    rows={4}
                    required
                  />
                </FormField>
              </div>
            )}

            {/* Step 3: Motivation */}
            {currentStep === 3 && (
              <div className=\"space-y-6 animate-fade-in-up\">
                <SectionHeader 
                  icon={Target}
                  title=\"Motivation & Eigenschaften\"
                  subtitle=\"Was treibt dich an?\"
                  step={3}
                  totalSteps={totalSteps}
                />

                <FormField label=\"Warum möchtest du in unser Team?\" required>
                  <Textarea
                    value={formData.warumTeam}
                    onChange={e => setFormData({ ...formData, warumTeam: e.target.value })}
                    placeholder=\"Was motiviert dich, Teil unseres Teams zu werden?\"
                    className={textareaClass}
                    rows={5}
                    required
                  />
                </FormField>

                <FormField label=\"Bist du geduldig und kannst du mit Stress umgehen?\" required>
                  <Textarea
                    value={formData.geduldig}
                    onChange={e => setFormData({ ...formData, geduldig: e.target.value })}
                    placeholder=\"Beschreibe deine Stärken im Umgang mit schwierigen Situationen\"
                    className={textareaClass}
                    rows={4}
                    required
                  />
                </FormField>

                <FormField label=\"Wie viele Stunden pro Woche kannst du aktiv sein?\" required>
                  <Input
                    value={formData.stundenProWoche}
                    onChange={e => setFormData({ ...formData, stundenProWoche: e.target.value })}
                    placeholder=\"z.B. 10-15 Stunden\"
                    className={inputClass}
                    required
                  />
                </FormField>
              </div>
            )}

            {/* Step 4: Situationsfragen */}
            {currentStep === 4 && (
              <div className=\"space-y-6 animate-fade-in-up\">
                <SectionHeader 
                  icon={MessageSquare}
                  title=\"Situationsfragen\"
                  subtitle=\"Wie würdest du reagieren?\"
                  step={4}
                  totalSteps={totalSteps}
                />

                <FormField label=\"Ein Spieler macht Fail-RP. Wie gehst du vor?\" required>
                  <Textarea
                    value={formData.failRpLoesung}
                    onChange={e => setFormData({ ...formData, failRpLoesung: e.target.value })}
                    placeholder=\"Beschreibe deine Vorgehensweise Schritt für Schritt\"
                    className={textareaClass}
                    rows={5}
                    required
                  />
                </FormField>

                <FormField label=\"Zwei Spieler streiten sich. Wie löst du den Konflikt?\" required>
                  <Textarea
                    value={formData.streitLoesung}
                    onChange={e => setFormData({ ...formData, streitLoesung: e.target.value })}
                    placeholder=\"Erkläre deine Lösung für diesen Konflikt\"
                    className={textareaClass}
                    rows={5}
                    required
                  />
                </FormField>
              </div>
            )}

            {/* Step 5: Voraussetzungen */}
            {currentStep === 5 && (
              <div className=\"space-y-6 animate-fade-in-up\">
                <SectionHeader 
                  icon={ShieldCheck}
                  title=\"Voraussetzungen\"
                  subtitle=\"Bestätige die wichtigsten Punkte\"
                  step={5}
                  totalSteps={totalSteps}
                />

                <div className=\"space-y-4\">
                  <div className=\"flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] transition-colors\">
                    <Checkbox
                      checked={formData.hatMikro}
                      onCheckedChange={v => setFormData({ ...formData, hatMikro: v })}
                      className=\"mt-1\"
                      required
                    />
                    <div className=\"flex-1\">
                      <div className=\"flex items-center gap-2 mb-1\">
                        <Mic className=\"w-4 h-4 text-blue-400\" />
                        <span className=\"font-medium text-white\">Funktionierendes Mikrofon</span>
                      </div>
                      <p className=\"text-sm text-white/50\">
                        Ich habe ein funktionierendes Mikrofon für die Kommunikation
                      </p>
                    </div>
                  </div>

                  <div className=\"flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] transition-colors\">
                    <Checkbox
                      checked={formData.kenntRegeln}
                      onCheckedChange={v => setFormData({ ...formData, kenntRegeln: v })}
                      className=\"mt-1\"
                      required
                    />
                    <div className=\"flex-1\">
                      <div className=\"flex items-center gap-2 mb-1\">
                        <BookOpen className=\"w-4 h-4 text-purple-400\" />
                        <span className=\"font-medium text-white\">Serverregeln gelesen</span>
                      </div>
                      <p className=\"text-sm text-white/50\">
                        Ich habe die Serverregeln gelesen und vollständig verstanden
                      </p>
                    </div>
                  </div>

                  <div className=\"flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] transition-colors\">
                    <Checkbox
                      checked={formData.bleibtNett}
                      onCheckedChange={v => setFormData({ ...formData, bleibtNett: v })}
                      className=\"mt-1\"
                      required
                    />
                    <div className=\"flex-1\">
                      <div className=\"flex items-center gap-2 mb-1\">
                        <Heart className=\"w-4 h-4 text-green-400\" />
                        <span className=\"font-medium text-white\">Respektvolles Verhalten</span>
                      </div>
                      <p className=\"text-sm text-white/50\">
                        Ich verpflichte mich, respektvoll und fair zu bleiben
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className=\"bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3\">
                <AlertTriangle className=\"w-5 h-5 text-red-400 flex-shrink-0\" />
                <span className=\"text-red-300 text-sm\">{error}</span>
              </div>
            )}

            {/* Navigation */}
            <div className=\"flex items-center justify-between pt-6 border-t border-white/5\">
              <Button
                type=\"button\"
                variant=\"ghost\"
                onClick={prevStep}
                disabled={currentStep === 1}
                className=\"rounded-xl\"
              >
                <ArrowLeft className=\"w-4 h-4 mr-2\" />
                Zurück
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  type=\"button\"
                  onClick={nextStep}
                  className=\"bg-blue-600 hover:bg-blue-700 rounded-xl\"
                >
                  Weiter
                  <ArrowLeft className=\"w-4 h-4 ml-2 rotate-180\" />
                </Button>
              ) : (
                <Button
                  type=\"submit\"
                  disabled={submitting}
                  className=\"bg-green-600 hover:bg-green-700 rounded-xl\"
                >
                  {submitting ? (
                    <>
                      <Loader2 className=\"w-4 h-4 animate-spin mr-2\" />
                      Wird eingereicht...
                    </>
                  ) : (
                    <>
                      <Send className=\"w-4 h-4 mr-2\" />
                      Bewerbung einreichen
                    </>
                  )}
                </Button>
              )}
            </div>

            <p className=\"text-white/30 text-xs text-center pt-4\">
              Mit dem Absenden bestätigst du, dass alle Angaben wahrheitsgemäß sind.
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
