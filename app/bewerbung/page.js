'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, Send, CheckCircle2, AlertTriangle, ArrowLeft, FileText 
} from 'lucide-react';

const inputClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl";

export default function BewerbungPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    vorname: '',
    nachname: '',
    alter: '',
    discord: '',
    erfahrung: '',
    motivation: '',
    verfuegbarkeit: '',
    zusatz: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/?error=not_logged_in');
    }
    if (user) {
      setFormData(prev => ({ ...prev, discord: user.username || user.globalName || '' }));
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
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
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

  if (success) {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Bewirb dich für unser Team
          </h1>
          <p className="text-white/60 text-lg">
            Fülle das Formular aus und werde Teil von Hamburg Horizon RP
          </p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Vorname *</Label>
                <Input
                  value={formData.vorname}
                  onChange={e => setFormData({ ...formData, vorname: e.target.value })}
                  placeholder="Max"
                  className={inputClass}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Nachname *</Label>
                <Input
                  value={formData.nachname}
                  onChange={e => setFormData({ ...formData, nachname: e.target.value })}
                  placeholder="Mustermann"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Alter *</Label>
                <Input
                  type="number"
                  value={formData.alter}
                  onChange={e => setFormData({ ...formData, alter: e.target.value })}
                  placeholder="18"
                  className={inputClass}
                  required
                  min="16"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Discord Username *</Label>
                <Input
                  value={formData.discord}
                  onChange={e => setFormData({ ...formData, discord: e.target.value })}
                  placeholder="username#0000"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Roleplay Erfahrung *</Label>
              <Textarea
                value={formData.erfahrung}
                onChange={e => setFormData({ ...formData, erfahrung: e.target.value })}
                placeholder="Beschreibe deine bisherige Erfahrung im Roleplay..."
                className={inputClass + " min-h-[120px] resize-none"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Warum möchtest du in unser Team? *</Label>
              <Textarea
                value={formData.motivation}
                onChange={e => setFormData({ ...formData, motivation: e.target.value })}
                placeholder="Was motiviert dich, Teil unseres Teams zu werden?"
                className={inputClass + " min-h-[120px] resize-none"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Verfügbarkeit *</Label>
              <Textarea
                value={formData.verfuegbarkeit}
                onChange={e => setFormData({ ...formData, verfuegbarkeit: e.target.value })}
                placeholder="Wann bist du in der Regel online und verfügbar?"
                className={inputClass + " min-h-[80px] resize-none"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Zusätzliche Informationen</Label>
              <Textarea
                value={formData.zusatz}
                onChange={e => setFormData({ ...formData, zusatz: e.target.value })}
                placeholder="Gibt es noch etwas, das wir wissen sollten?"
                className={inputClass + " min-h-[80px] resize-none"}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}

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

            <p className="text-white/40 text-xs text-center">
              Mit dem Absenden bestätigst du, dass alle Angaben wahrheitsgemäß sind.
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
