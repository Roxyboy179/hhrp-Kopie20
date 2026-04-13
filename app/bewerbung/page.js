'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileText, Send, Loader2, AlertTriangle, User, Mail, Calendar, CheckCircle2, Eye } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const inputClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl";

function FormSection({ number, title, emoji, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold flex items-center gap-2 text-white/90">
        <span className="text-lg">{emoji}</span>
        <span className="text-blue-400">{number}.</span> {title}
      </h3>
      <div className="space-y-4 pl-7 border-l-2 border-blue-500/20">{children}</div>
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
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    vorname: '', alter: '', robloxName: '',
    spielzeit: '', fraktion: '', andererServer: '', bannWarn: '',
    warumTeam: '', geduldig: '', stundenProWoche: '',
    failRpLoesung: '', streitLoesung: '',
    hatMikro: false, kenntRegeln: false, bleibtNett: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Anmeldung erforderlich</h2>
          <p className="text-white/40 mb-6">Du musst angemeldet sein, um eine Bewerbung einzureichen.</p>
          <Button onClick={() => window.location.href = '/api/auth/discord'} className="bg-[#5865F2] hover:bg-[#4752C4] rounded-xl">
            Mit Discord anmelden
          </Button>
        </GlassCard>
      </div>
    );
  }

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
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="p-12 max-w-2xl w-full text-center animate-scale-in">
          <div className="w-20 h-20 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Bewerbung eingereicht!</h2>
          <p className="text-white/40 mb-8 text-sm">Deine Bewerbung wurde erfolgreich eingereicht und wird an das Discord-Team gesendet.</p>
          <Button onClick={() => router.push('/meine-bewerbungen')} className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2">
            <Eye className="w-4 h-4" /> Meine Bewerbungen ansehen
          </Button>
        </GlassCard>
      </div>
    );
  }

  const discordSince = user?.createdAt ? formatDate(user.createdAt) : '-';

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto animate-fade-in-up">
        <GlassCard className="p-6 md:p-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1">Bewerbung für das Server-Team</h2>
            <p className="text-white/30 text-sm">HHRP – Hamburg Horizon RP</p>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent mt-6" />
          </div>

          <div className="mb-8 p-4 rounded-xl bg-[#5865F2]/[0.08] border border-[#5865F2]/20">
            <h3 className="text-xs font-semibold text-blue-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
              Discord-Daten (automatisch)
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-3.5 h-3.5 text-white/30" />
                <span className="text-white/50">Name:</span>
                <span className="text-white/90 truncate">{user?.globalName || user?.username}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-3.5 h-3.5 text-white/30" />
                <span className="text-white/50">E-Mail:</span>
                <span className="text-white/90 truncate">{user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-3.5 h-3.5 text-white/30" />
                <span className="text-white/50">Seit:</span>
                <span className="text-white/90">{discordSince}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <FormSection number="1" title="ÜBER MICH" emoji="👋">
              <FormField label="Dein Vorname" required>
                <Input value={formData.vorname} onChange={e => setFormData({...formData, vorname: e.target.value})} placeholder="Max" className={inputClass} required />
              </FormField>
              <FormField label="Wie alt bist du?" required>
                <Input value={formData.alter} onChange={e => setFormData({...formData, alter: e.target.value})} placeholder="18" className={inputClass} required />
              </FormField>
              <FormField label="Dein Roblox-Name" required>
                <Input value={formData.robloxName} onChange={e => setFormData({...formData, robloxName: e.target.value})} placeholder="Dein Roblox-Benutzername" className={inputClass} required />
              </FormField>
            </FormSection>

            <FormSection number="2" title="MEIN ZOCKEN IN EH" emoji="🎮">
              <FormField label="Wie lange spielst du schon auf unserem Server?" required>
                <Input value={formData.spielzeit} onChange={e => setFormData({...formData, spielzeit: e.target.value})} placeholder="z.B. 3 Monate" className={inputClass} required />
              </FormField>
              <FormField label="In welcher Fraktion bist du am meisten (Polizei, FW, RD)?" required>
                <Input value={formData.fraktion} onChange={e => setFormData({...formData, fraktion: e.target.value})} placeholder="z.B. Polizei" className={inputClass} required />
              </FormField>
              <FormField label="Hast du schon mal auf einem anderen Server geholfen?" required>
                <Input value={formData.andererServer} onChange={e => setFormData({...formData, andererServer: e.target.value})} placeholder="Ja/Nein - wenn ja, wo?" className={inputClass} required />
              </FormField>
              <FormField label="Hattest du hier schon mal einen Bann oder Warn?" required>
                <Input value={formData.bannWarn} onChange={e => setFormData({...formData, bannWarn: e.target.value})} placeholder="Ja/Nein - wenn ja, wofür?" className={inputClass} required />
              </FormField>
            </FormSection>

            <FormSection number="3" title="WARUM WILLST DU INS TEAM?" emoji="🛠️">
              <FormField label="Warum hast du Bock, bei uns im Team zu helfen?" required>
                <Textarea value={formData.warumTeam} onChange={e => setFormData({...formData, warumTeam: e.target.value})} placeholder="Schreib hier kurz was dazu..." className={`${inputClass} min-h-[100px]`} required />
              </FormField>
              <FormField label="Bist du geduldig, auch wenn jemand nervt?" required>
                <Textarea value={formData.geduldig} onChange={e => setFormData({...formData, geduldig: e.target.value})} placeholder="Schreib hier kurz was dazu..." className={`${inputClass} min-h-[100px]`} required />
              </FormField>
              <FormField label="Wie viele Stunden bist du pro Woche auf dem Server?" required>
                <Input value={formData.stundenProWoche} onChange={e => setFormData({...formData, stundenProWoche: e.target.value})} placeholder="z.B. 10-15 Stunden" className={inputClass} required />
              </FormField>
            </FormSection>

            <FormSection number="4" title="WAS MACHST DU IN DIESER SITUATION?" emoji="⚖️">
              <FormField label="Ein Spieler macht Fail-RP (z.B. fährt mit 3 Reifen weiter). Was sagst du ihm?" required>
                <Textarea value={formData.failRpLoesung} onChange={e => setFormData({...formData, failRpLoesung: e.target.value})} placeholder="Deine Lösung..." className={`${inputClass} min-h-[100px]`} required />
              </FormField>
              <FormField label="Zwei Leute streiten sich im Support-Chat voll heftig. Wie klärst du das?" required>
                <Textarea value={formData.streitLoesung} onChange={e => setFormData({...formData, streitLoesung: e.target.value})} placeholder="Deine Lösung..." className={`${inputClass} min-h-[100px]`} required />
              </FormField>
            </FormSection>

            <FormSection number="5" title="KURZER CHECK" emoji="🎙️">
              <div className="space-y-4">
                {[
                  { id: 'mikro', key: 'hatMikro', label: 'Ich habe ein Mikro (für Support-Gespräche).' },
                  { id: 'regeln', key: 'kenntRegeln', label: 'Ich kenne unsere Server-Regeln gut.' },
                  { id: 'nett', key: 'bleibtNett', label: 'Ich bleibe immer nett zu den Spielern.' },
                ].map(c => (
                  <div key={c.id} className="flex items-center gap-3">
                    <Checkbox 
                      id={c.id} 
                      checked={formData[c.key]} 
                      onCheckedChange={(checked) => setFormData({...formData, [c.key]: checked === true})} 
                      className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" 
                    />
                    <Label htmlFor={c.id} className="text-white/70 cursor-pointer text-sm">{c.label}</Label>
                  </div>
                ))}
              </div>
            </FormSection>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={submitting} 
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Wird eingereicht...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Bewerbung einreichen
                  </>
                )}
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
