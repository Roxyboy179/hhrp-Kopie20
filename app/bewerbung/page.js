'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  FileText, Send, Loader2, AlertTriangle, CheckCircle2, ArrowLeft,
  User, Gamepad2, Target, MessageSquare, 
  Shield, Mic, BookOpen, Heart
} from 'lucide-react';

const inputClass = "bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 focus:border-white/20 focus:ring-white/10 rounded-xl transition-all duration-300 focus:bg-white/[0.05]";

function FormSection({ number, title, icon: Icon, children, visible }) {
  return (
    <div className={`space-y-5 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <h3 className="text-base font-semibold flex items-center gap-3 text-white/80">
        <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <Icon className="w-4 h-4 text-white/40" />
        </div>
        <span className="text-white/25">{number}.</span> {title}
      </h3>
      <div className="space-y-4 pl-5 md:pl-8 border-l border-white/[0.06]">{children}</div>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-white/40 text-sm">{label} {required && <span className="text-white/20">*</span>}</Label>
      {children}
    </div>
  );
}

export default function BewerbungPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    vorname: '', alter: '', robloxName: '', spielzeit: '', fraktion: '',
    andererServer: '', bannWarn: '', warumTeam: '', geduldig: '',
    stundenProWoche: '', failRpLoesung: '', streitLoesung: '',
    hatMikro: false, kenntRegeln: false, bleibtNett: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/?error=not_logged_in');
    }
    setTimeout(() => setVisible(true), 100);
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
      toast.success('Bewerbung eingereicht!', { description: 'Wir melden uns bald bei dir.' });
      setTimeout(() => router.push('/meine-bewerbungen'), 2500);
    } catch (e) {
      setError(e.message);
      toast.error('Fehler', { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (!user) return null;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full animate-scale-in">
          <div className="p-10 rounded-3xl bg-white/[0.02] border border-white/[0.05] text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white/90 mb-3">Bewerbung eingereicht!</h2>
            <p className="text-white/35 mb-8">
              Deine Bewerbung wurde erfolgreich gesendet. Wir melden uns bald bei dir per Discord!
            </p>
            <Button 
              onClick={() => router.push('/meine-bewerbungen')}
              className="bg-white text-black hover:bg-white/90 rounded-xl w-full h-11"
            >
              Meine Bewerbungen ansehen
            </Button>
          </div>
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
          className={`mb-8 text-white/30 hover:text-white/60 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>

        <div className={`text-center mb-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h1 className="text-3xl md:text-5xl font-bold text-white/90 mb-3">
            Team-Bewerbung
          </h1>
          <p className="text-white/30 text-base md:text-lg max-w-md mx-auto">
            Fülle das Formular aus und werde Teil von Hamburg Horizon RP
          </p>
        </div>

        <div className={`p-6 md:p-10 rounded-3xl bg-white/[0.015] border border-white/[0.04] transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <form onSubmit={handleSubmit} className="space-y-10">
            
            <FormSection number={1} title="Persönliche Informationen" icon={User} visible={visible}>
              <FormField label="Vorname" required>
                <Input value={formData.vorname} onChange={e => setFormData({ ...formData, vorname: e.target.value })} placeholder="Max" className={inputClass} required />
              </FormField>
              <FormField label="Alter" required>
                <Input type="number" value={formData.alter} onChange={e => setFormData({ ...formData, alter: e.target.value })} placeholder="18" className={inputClass} required min="13" />
              </FormField>
              <FormField label="Roblox Name" required>
                <Input value={formData.robloxName} onChange={e => setFormData({ ...formData, robloxName: e.target.value })} placeholder="Dein Roblox Username" className={inputClass} required />
              </FormField>
            </FormSection>

            <FormSection number={2} title="Roleplay Erfahrung" icon={Gamepad2} visible={visible}>
              <FormField label="Wie lange spielst du schon Roleplay?" required>
                <Input value={formData.spielzeit} onChange={e => setFormData({ ...formData, spielzeit: e.target.value })} placeholder="z.B. 2 Jahre" className={inputClass} required />
              </FormField>
              <FormField label="In welcher Fraktion möchtest du arbeiten?" required>
                <Input value={formData.fraktion} onChange={e => setFormData({ ...formData, fraktion: e.target.value })} placeholder="z.B. Polizei, Feuerwehr" className={inputClass} required />
              </FormField>
              <FormField label="Warst du schon auf einem anderen RP-Server?">
                <Textarea value={formData.andererServer} onChange={e => setFormData({ ...formData, andererServer: e.target.value })} placeholder="Wenn ja, welcher?" className={inputClass + " min-h-[80px] resize-none"} />
              </FormField>
              <FormField label="Wurdest du schon mal gebannt oder verwarnt?" required>
                <Textarea value={formData.bannWarn} onChange={e => setFormData({ ...formData, bannWarn: e.target.value })} placeholder="Bitte sei ehrlich." className={inputClass + " min-h-[80px] resize-none"} required />
              </FormField>
            </FormSection>

            <FormSection number={3} title="Motivation" icon={Target} visible={visible}>
              <FormField label="Warum möchtest du in unser Team?" required>
                <Textarea value={formData.warumTeam} onChange={e => setFormData({ ...formData, warumTeam: e.target.value })} placeholder="Was motiviert dich?" className={inputClass + " min-h-[120px] resize-none"} required />
              </FormField>
              <FormField label="Bist du geduldig und kannst du mit Stress umgehen?" required>
                <Textarea value={formData.geduldig} onChange={e => setFormData({ ...formData, geduldig: e.target.value })} placeholder="Beschreibe deine Stärken" className={inputClass + " min-h-[100px] resize-none"} required />
              </FormField>
              <FormField label="Wie viele Stunden pro Woche kannst du aktiv sein?" required>
                <Input value={formData.stundenProWoche} onChange={e => setFormData({ ...formData, stundenProWoche: e.target.value })} placeholder="z.B. 10-15 Stunden" className={inputClass} required />
              </FormField>
            </FormSection>

            <FormSection number={4} title="Situationsfragen" icon={MessageSquare} visible={visible}>
              <FormField label="Ein Spieler macht Fail-RP. Wie gehst du vor?" required>
                <Textarea value={formData.failRpLoesung} onChange={e => setFormData({ ...formData, failRpLoesung: e.target.value })} placeholder="Beschreibe deine Vorgehensweise" className={inputClass + " min-h-[120px] resize-none"} required />
              </FormField>
              <FormField label="Zwei Spieler streiten sich. Wie löst du den Konflikt?" required>
                <Textarea value={formData.streitLoesung} onChange={e => setFormData({ ...formData, streitLoesung: e.target.value })} placeholder="Beschreibe deine Lösung" className={inputClass + " min-h-[120px] resize-none"} required />
              </FormField>
            </FormSection>

            <FormSection number={5} title="Voraussetzungen" icon={Shield} visible={visible}>
              <div className="space-y-3">
                {[
                  { key: 'hatMikro', icon: <Mic className="w-4 h-4 text-white/30" />, label: 'Ich habe ein funktionierendes Mikrofon' },
                  { key: 'kenntRegeln', icon: <BookOpen className="w-4 h-4 text-white/30" />, label: 'Ich habe die Serverregeln gelesen und verstanden' },
                  { key: 'bleibtNett', icon: <Heart className="w-4 h-4 text-white/30" />, label: 'Ich verpflichte mich, respektvoll und fair zu bleiben' },
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.025] hover:border-white/[0.06] transition-all duration-300">
                    <Checkbox
                      checked={formData[item.key]}
                      onCheckedChange={v => setFormData({ ...formData, [item.key]: v })}
                      className="border-white/20"
                      required
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {item.icon}
                      <label className="text-sm text-white/60 cursor-pointer">{item.label}</label>
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>

            {error && (
              <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex items-center gap-3 animate-fade-in-up">
                <AlertTriangle className="w-5 h-5 text-red-400/60 flex-shrink-0" />
                <span className="text-red-300/70 text-sm">{error}</span>
              </div>
            )}

            <div className="pt-6">
              <div className="divider-gradient mb-6" />
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-white text-black hover:bg-white/90 rounded-xl h-12 text-base font-semibold shadow-2xl shadow-white/5 hover:shadow-white/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" />Wird eingereicht...</>
                ) : (
                  <><Send className="w-5 h-5 mr-2" />Bewerbung einreichen</>
                )}
              </Button>
              <p className="text-white/20 text-xs text-center mt-4">
                Mit dem Absenden bestätigst du, dass alle Angaben wahrheitsgemäß sind.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
