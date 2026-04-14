'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  FileText, Send, Loader2, AlertTriangle, CheckCircle2, ArrowLeft, ArrowRight,
  User, Gamepad2, Target, MessageSquare, 
  Shield, Mic, BookOpen, Heart, TrendingUp, Briefcase, Lock, Clock
} from 'lucide-react';

const inputClass = "bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 focus:border-white/20 focus:ring-white/10 rounded-xl transition-all duration-300 focus:bg-white/[0.05]";

function FormField({ label, required, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-white/40 text-sm">{label} {required && <span className="text-white/20">*</span>}</Label>
      {children}
    </div>
  );
}

function FormSection({ number, title, icon: Icon, children }) {
  return (
    <div className="space-y-5">
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

// ========== KARTEN-AUSWAHL ==========
function BewerbungCards({ user, onSelect }) {
  const isTeamler = user?.isTeamMember || false;

  const cards = [
    {
      type: 'normal',
      title: 'Team Bewerbung',
      desc: 'Bewirb dich als neues Teammitglied bei Hamburg Horizon RP.',
      icon: <Users className="w-7 h-7" />,
      color: 'from-neutral-800 to-neutral-900',
      borderHover: 'hover:border-white/20',
      show: !isTeamler,
    },
    {
      type: 'praktikum',
      title: 'Praktikum Bewerbung',
      desc: 'Bewirb dich für ein Praktikum im Team, um uns kennenzulernen.',
      icon: <Briefcase className="w-7 h-7" />,
      color: 'from-neutral-800 to-neutral-900',
      borderHover: 'hover:border-white/20',
      show: !isTeamler,
    },
    {
      type: 'uprank',
      title: 'Uprank Bewerbung',
      desc: 'Beantrage eine Beförderung innerhalb des Teams.',
      icon: <TrendingUp className="w-7 h-7" />,
      color: 'from-neutral-800 to-neutral-900',
      borderHover: 'hover:border-white/20',
      show: isTeamler,
      note: 'Nur für Teamler • Du kannst deine eigene Bewerbung nicht selbst bearbeiten',
    },
  ];

  const visibleCards = cards.filter(c => c.show);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">Bewerbung einreichen</h1>
        <p className="text-neutral-500 text-base md:text-lg max-w-md mx-auto">
          {isTeamler 
            ? 'Als Teamler kannst du eine Uprank-Bewerbung einreichen.'
            : 'Wähle den passenden Bewerbungstyp aus.'
          }
        </p>
      </div>

      {isTeamler && (
        <div className="mb-8 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
          <Shield className="w-5 h-5 text-neutral-400 shrink-0" />
          <p className="text-neutral-400 text-sm">
            Du bist als <strong className="text-white">{user.adminRole}</strong> eingeloggt. Team-Bewerbungen sind für dich nicht verfügbar, da du bereits im Team bist.
          </p>
        </div>
      )}

      <div className={`grid ${visibleCards.length === 1 ? 'max-w-md mx-auto' : 'md:grid-cols-2'} gap-5`}>
        {visibleCards.map((card, i) => (
          <button
            key={card.type}
            onClick={() => onSelect(card.type)}
            className={`group text-left p-8 rounded-2xl bg-gradient-to-b ${card.color} border border-neutral-800 ${card.borderHover} transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 animate-fade-in-up`}
            style={{ animationDelay: `${0.4 + i * 0.15}s`, animationFillMode: 'both' }}
          >
            <div className="w-14 h-14 rounded-2xl bg-neutral-700/30 border border-neutral-700 flex items-center justify-center mb-5 text-neutral-400 group-hover:text-white group-hover:bg-neutral-700/50 transition-all duration-300">
              {card.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">{card.title}</h3>
            <p className="text-neutral-500 text-sm leading-relaxed mb-4">{card.desc}</p>
            {card.note && (
              <p className="text-neutral-600 text-xs flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> {card.note}
              </p>
            )}
            <div className="mt-4 flex items-center gap-2 text-neutral-500 group-hover:text-white text-sm font-medium transition-colors">
              Bewerbung starten <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      {!isTeamler && (
        <div className="mt-8 text-center animate-fade-in-up" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
          <p className="text-neutral-700 text-xs flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" /> Uprank-Bewerbungen sind nur für aktive Teamler sichtbar
          </p>
        </div>
      )}
    </div>
  );
}

// ========== FORMULAR-FELDER JE NACH TYP ==========
function NormalFormFields({ formData, setFormData }) {
  return (
    <>
      <FormSection number={1} title="Persönliche Informationen" icon={User}>
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
      <FormSection number={2} title="Roleplay Erfahrung" icon={Gamepad2}>
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
      <FormSection number={3} title="Motivation" icon={Target}>
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
      <FormSection number={4} title="Situationsfragen" icon={MessageSquare}>
        <FormField label="Ein Spieler macht Fail-RP. Wie gehst du vor?" required>
          <Textarea value={formData.failRpLoesung} onChange={e => setFormData({ ...formData, failRpLoesung: e.target.value })} placeholder="Beschreibe deine Vorgehensweise" className={inputClass + " min-h-[120px] resize-none"} required />
        </FormField>
        <FormField label="Zwei Spieler streiten sich. Wie löst du den Konflikt?" required>
          <Textarea value={formData.streitLoesung} onChange={e => setFormData({ ...formData, streitLoesung: e.target.value })} placeholder="Beschreibe deine Lösung" className={inputClass + " min-h-[120px] resize-none"} required />
        </FormField>
      </FormSection>
    </>
  );
}

function PraktikumFormFields({ formData, setFormData }) {
  return (
    <>
      <FormSection number={1} title="Persönliche Informationen" icon={User}>
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
      <FormSection number={2} title="Praktikum" icon={Briefcase}>
        <FormField label="Für welche Fraktion möchtest du ein Praktikum machen?" required>
          <Input value={formData.fraktion} onChange={e => setFormData({ ...formData, fraktion: e.target.value })} placeholder="z.B. Polizei, Feuerwehr" className={inputClass} required />
        </FormField>
        <FormField label="Hast du Roleplay-Erfahrung?" required>
          <Textarea value={formData.spielzeit} onChange={e => setFormData({ ...formData, spielzeit: e.target.value })} placeholder="Wenn ja, wie viel?" className={inputClass + " min-h-[80px] resize-none"} required />
        </FormField>
        <FormField label="Warum möchtest du ein Praktikum bei uns?" required>
          <Textarea value={formData.warumTeam} onChange={e => setFormData({ ...formData, warumTeam: e.target.value })} placeholder="Was erhoffst du dir?" className={inputClass + " min-h-[120px] resize-none"} required />
        </FormField>
        <FormField label="Wie viele Stunden pro Woche kannst du aktiv sein?" required>
          <Input value={formData.stundenProWoche} onChange={e => setFormData({ ...formData, stundenProWoche: e.target.value })} placeholder="z.B. 5-10 Stunden" className={inputClass} required />
        </FormField>
      </FormSection>
    </>
  );
}

function UprankFormFields({ formData, setFormData, user }) {
  return (
    <>
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-3 mb-2">
        <TrendingUp className="w-5 h-5 text-neutral-400 shrink-0" />
        <p className="text-neutral-400 text-sm">
          Aktuelle Rolle: <strong className="text-white">{user?.adminRole || 'Unbekannt'}</strong>. 
          Du kannst deine eigene Uprank-Bewerbung <strong>nicht selbst</strong> bearbeiten.
        </p>
      </div>
      <FormSection number={1} title="Aktuelle Situation" icon={User}>
        <FormField label="Seit wann bist du im Team?" required>
          <Input value={formData.seitWannImTeam} onChange={e => setFormData({ ...formData, seitWannImTeam: e.target.value })} placeholder="z.B. seit 3 Monaten" className={inputClass} required />
        </FormField>
        <FormField label="Welche Aufgaben erfüllst du aktuell?" required>
          <Textarea value={formData.aktuelleAufgaben} onChange={e => setFormData({ ...formData, aktuelleAufgaben: e.target.value })} placeholder="Beschreibe deine täglichen Aufgaben" className={inputClass + " min-h-[100px] resize-none"} required />
        </FormField>
      </FormSection>
      <FormSection number={2} title="Beförderung" icon={TrendingUp}>
        <FormField label="Auf welchen Rang möchtest du befördert werden?" required>
          <Input value={formData.gewuenschterRang} onChange={e => setFormData({ ...formData, gewuenschterRang: e.target.value })} placeholder="z.B. Teamkoordination" className={inputClass} required />
        </FormField>
        <FormField label="Warum verdienst du eine Beförderung?" required>
          <Textarea value={formData.warumUprank} onChange={e => setFormData({ ...formData, warumUprank: e.target.value })} placeholder="Was hast du geleistet? Was zeichnet dich aus?" className={inputClass + " min-h-[120px] resize-none"} required />
        </FormField>
        <FormField label="Welche zusätzlichen Verantwortungen würdest du übernehmen?" required>
          <Textarea value={formData.zusaetzlicheVerantwortung} onChange={e => setFormData({ ...formData, zusaetzlicheVerantwortung: e.target.value })} placeholder="Was würdest du im neuen Rang anders/mehr machen?" className={inputClass + " min-h-[120px] resize-none"} required />
        </FormField>
        <FormField label="Wie viele Stunden bist du pro Woche aktiv?" required>
          <Input value={formData.stundenProWoche} onChange={e => setFormData({ ...formData, stundenProWoche: e.target.value })} placeholder="z.B. 15-20 Stunden" className={inputClass} required />
        </FormField>
      </FormSection>
    </>
  );
}

// ========== HAUPTKOMPONENTE ==========
export default function BewerbungPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [existingBewerbung, setExistingBewerbung] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [bewerbungSettings, setBewerbungSettings] = useState({ normal_open: true, praktikum_open: true, uprank_open: true });
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/?error=not_logged_in');
  }, [user, authLoading, router]);
  
  // Lade Bewerbungs-Settings im Hintergrund
  useEffect(() => {
    fetchBewerbungSettings();
  }, []);
  
  const fetchBewerbungSettings = async () => {
    try {
      const res = await fetch('/api/bewerbung-settings');
      const data = await res.json();
      setBewerbungSettings(data.settings || { normal_open: true, praktikum_open: true, uprank_open: true });
    } catch (e) {
      console.error('Fehler beim Laden der Settings:', e);
      // Fallback zu default
      setBewerbungSettings({ normal_open: true, praktikum_open: true, uprank_open: true });
    } finally {
      setLoadingSettings(false);
    }
  };
  
  // Prüfe ob User bereits eine aktive Bewerbung hat (im Hintergrund)
  useEffect(() => {
    if (user && !authLoading) {
      checkExistingBewerbung();
    } else if (!authLoading && !user) {
      setCheckingExisting(false);
    }
  }, [user, authLoading]);
  
  const checkExistingBewerbung = async () => {
    try {
      const res = await fetch('/api/bewerbungen');
      const data = await res.json();
      
      // Prüfe ob es eine aktive Bewerbung gibt (nicht Angenommen, Abgelehnt oder Zurückgezogen)
      const activeBewerbung = data.bewerbungen?.find(b => 
        b.status === 'Eingereicht' || b.status === 'In Bearbeitung'
      );
      
      setExistingBewerbung(activeBewerbung || null);
    } catch (e) {
      console.error('Fehler beim Prüfen der Bewerbungen:', e);
    } finally {
      setCheckingExisting(false);
    }
  };

  const initFormData = (type) => {
    const base = { bewerbungType: type };
    if (type === 'normal') {
      return { ...base, vorname: '', alter: '', robloxName: '', spielzeit: '', fraktion: '', andererServer: '', bannWarn: '', warumTeam: '', geduldig: '', stundenProWoche: '', failRpLoesung: '', streitLoesung: '', hatMikro: false, kenntRegeln: false, bleibtNett: false };
    }
    if (type === 'praktikum') {
      return { ...base, vorname: '', alter: '', robloxName: '', fraktion: '', spielzeit: '', warumTeam: '', stundenProWoche: '', hatMikro: false, kenntRegeln: false, bleibtNett: false };
    }
    if (type === 'uprank') {
      return { ...base, seitWannImTeam: '', aktuelleAufgaben: '', gewuenschterRang: '', warumUprank: '', zusaetzlicheVerantwortung: '', stundenProWoche: '' };
    }
    return base;
  };

  const handleSelect = (type) => {
    setSelectedType(type);
    setFormData(initFormData(type));
    setError('');
  };

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

  // Redirect wenn nicht eingeloggt (ohne Spinner)
  useEffect(() => {
    if (!authLoading && !user) router.push('/?error=not_logged_in');
  }, [user, authLoading, router]);

  if (!user) return null;
  
  // Wenn bereits eine aktive Bewerbung existiert
  if (existingBewerbung) {
    const statusColors = {
      'Eingereicht': 'bg-blue-500/10 border-blue-500/20 text-blue-300',
      'In Bearbeitung': 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
    };
    
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full animate-scale-in">
          <Button variant="ghost" onClick={() => router.push('/')} className="mb-4 text-neutral-600 hover:text-neutral-300">
            <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
          </Button>
          <div className="p-10 rounded-3xl bg-neutral-900/50 border border-neutral-800 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Bereits eine Bewerbung aktiv</h2>
            <p className="text-neutral-500 mb-2">
              Du hast bereits eine Bewerbung eingereicht, die noch bearbeitet wird.
            </p>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${statusColors[existingBewerbung.status]} mt-4 mb-6`}>
              <Clock className="w-4 h-4" />
              Status: {existingBewerbung.status}
            </div>
            <p className="text-neutral-600 text-sm mb-8">
              Du kannst erst eine neue Bewerbung einreichen, wenn deine aktuelle Bewerbung bearbeitet wurde.
            </p>
            <Button onClick={() => router.push('/meine-bewerbungen')} className="bg-white text-black hover:bg-neutral-200 rounded-xl w-full h-11">
              Meine Bewerbungen ansehen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    const typeLabels = { normal: 'Team-Bewerbung', praktikum: 'Praktikum-Bewerbung', uprank: 'Uprank-Bewerbung' };
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full animate-scale-in">
          <div className="p-10 rounded-3xl bg-neutral-900/50 border border-neutral-800 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{typeLabels[selectedType]} eingereicht!</h2>
            <p className="text-neutral-500 mb-8">Wir melden uns bald bei dir per Discord!</p>
            <Button onClick={() => router.push('/meine-bewerbungen')} className="bg-white text-black hover:bg-neutral-200 rounded-xl w-full h-11">
              Meine Bewerbungen ansehen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // KARTEN-AUSWAHL
  if (!selectedType) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => router.push('/')} className="mb-8 text-neutral-600 hover:text-neutral-300">
            <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
          </Button>
          <BewerbungCards user={user} onSelect={handleSelect} settings={bewerbungSettings} />
        </div>
      </div>
    );
  }

  // FORMULAR
  const typeLabels = { normal: 'Team-Bewerbung', praktikum: 'Praktikum-Bewerbung', uprank: 'Uprank-Bewerbung' };
  const needsCheckboxes = selectedType === 'normal' || selectedType === 'praktikum';

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => setSelectedType(null)} className="mb-8 text-neutral-600 hover:text-neutral-300">
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zur Auswahl
        </Button>

        <div className="text-center mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">{typeLabels[selectedType]}</h1>
          <p className="text-neutral-500 text-base">Fülle alle Felder sorgfältig aus.</p>
        </div>

        <div className="p-6 md:p-10 rounded-3xl bg-neutral-900/30 border border-neutral-800/60 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <form onSubmit={handleSubmit} className="space-y-10">
            {selectedType === 'normal' && <NormalFormFields formData={formData} setFormData={setFormData} />}
            {selectedType === 'praktikum' && <PraktikumFormFields formData={formData} setFormData={setFormData} />}
            {selectedType === 'uprank' && <UprankFormFields formData={formData} setFormData={setFormData} user={user} />}

            {needsCheckboxes && (
              <FormSection number={selectedType === 'normal' ? 5 : 3} title="Voraussetzungen" icon={Shield}>
                <div className="space-y-3">
                  {[
                    { key: 'hatMikro', icon: <Mic className="w-4 h-4 text-white/30" />, label: 'Ich habe ein funktionierendes Mikrofon' },
                    { key: 'kenntRegeln', icon: <BookOpen className="w-4 h-4 text-white/30" />, label: 'Ich habe die Serverregeln gelesen und verstanden' },
                    { key: 'bleibtNett', icon: <Heart className="w-4 h-4 text-white/30" />, label: 'Ich verpflichte mich, respektvoll und fair zu bleiben' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.025] transition-all">
                      <Checkbox checked={formData[item.key]} onCheckedChange={v => setFormData({ ...formData, [item.key]: v })} className="border-white/20" required />
                      <div className="flex items-center gap-2 flex-1">
                        {item.icon}
                        <label className="text-sm text-white/60 cursor-pointer">{item.label}</label>
                      </div>
                    </div>
                  ))}
                </div>
              </FormSection>
            )}

            {error && (
              <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400/60 shrink-0" />
                <span className="text-red-300/70 text-sm">{error}</span>
              </div>
            )}

            <div className="pt-6">
              <div className="h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent mb-6" />
              <Button type="submit" disabled={submitting} className="w-full bg-white text-black hover:bg-neutral-200 rounded-xl h-14 text-base font-semibold shadow-2xl shadow-white/5 transition-all hover:scale-[1.01] active:scale-[0.99]">
                {submitting ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Wird eingereicht...</> : <><Send className="w-5 h-5 mr-2" />{typeLabels[selectedType]} einreichen</>}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Users(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
