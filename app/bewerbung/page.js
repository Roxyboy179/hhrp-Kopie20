'use client';

import { useState, useEffect, useMemo } from 'react';
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
  User, Gamepad2, Target, MessageSquare, Eye, Edit,
  Shield, Mic, BookOpen, Heart, TrendingUp, Briefcase, Lock, Clock, BarChart3, ExternalLink, Sparkles
} from 'lucide-react';
import { MultiStepWizard, WizardStep } from '@/components/bewerbung/MultiStepWizard';
import { 
  NormalStep1, NormalStep2, NormalStep3, NormalStep4,
  PraktikumStep1, PraktikumStep2, PraktikumStep3, PraktikumStep4,
  UprankStep1, UprankStep2, UprankStep3,
  BetaTesterStep1, BetaTesterStep2, BetaTesterStep3, BetaTesterStep4
} from '@/components/bewerbung/BewerbungSteps';

const inputClass = "bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 focus:ring-white/10 rounded-xl transition-all duration-300 focus:bg-white/[0.05] min-h-[44px]";

function FormField({ label, required, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm" style={{ color: 'rgba(var(--theme-accent-rgb, 255,255,255), 0.4)' }}>{label} {required && <span style={{ color: 'rgba(var(--theme-accent-rgb, 255,255,255), 0.15)' }}>*</span>}</Label>
      {children}
    </div>
  );
}

function FormSection({ number, title, icon: Icon, children }) {
  return (
    <div className="space-y-5">
      <h3 className="text-base md:text-lg font-semibold flex items-center gap-3 text-white/80">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(var(--theme-accent-rgb, 255,255,255), 0.06)', border: '1px solid rgba(var(--theme-accent-rgb, 255,255,255), 0.1)' }}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: 'rgba(var(--theme-accent-rgb, 255,255,255), 0.4)' }} />
        </div>
        <span style={{ color: 'rgba(var(--theme-accent-rgb, 255,255,255), 0.2)' }}>{number}.</span> {title}
      </h3>
      <div className="space-y-4 pl-5 md:pl-8" style={{ borderLeft: '1px solid var(--theme-glass-border, rgba(255,255,255,0.06))' }}>{children}</div>
    </div>
  );
}

// ========== PROGRESS BAR ==========
function ProgressBar({ formData, selectedType }) {
  const { filled, total, percentage } = useMemo(() => {
    let requiredFields = [];
    
    if (selectedType === 'normal') {
      requiredFields = ['vorname', 'alter', 'robloxName', 'spielzeit', 'fraktion', 'bannWarn', 'warumTeam', 'geduldig', 'stundenProWoche', 'failRpLoesung', 'streitLoesung', 'hatMikro', 'kenntRegeln', 'bleibtNett'];
    } else if (selectedType === 'praktikum') {
      requiredFields = ['vorname', 'alter', 'robloxName', 'fraktion', 'spielzeit', 'warumTeam', 'stundenProWoche', 'hatMikro', 'kenntRegeln', 'bleibtNett'];
    } else if (selectedType === 'uprank') {
      requiredFields = ['seitWannImTeam', 'aktuelleAufgaben', 'gewuenschterRang', 'warumUprank', 'zusaetzlicheVerantwortung', 'stundenProWoche'];
    } else if (selectedType === 'beta_tester') {
      requiredFields = ['name', 'discordName', 'alter', 'warum', 'erfahrung'];
    }
    
    const filledCount = requiredFields.filter(field => {
      const value = formData[field];
      if (typeof value === 'boolean') return value === true;
      return value && value.toString().trim().length > 0;
    }).length;
    
    const totalCount = requiredFields.length;
    const percent = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;
    
    return { filled: filledCount, total: totalCount, percentage: percent };
  }, [formData, selectedType]);

  return (
    <div className="sticky top-16 z-40 bg-[#080808]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 md:py-4 animate-fade-in-down">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-white/40" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <span className="text-white/60 text-xs md:text-sm font-medium">Fortschritt</span>
              <span className="text-white/80 text-sm md:text-base font-semibold tabular-nums">
                {filled} / {total} Felder
              </span>
            </div>
            <div className="w-full bg-white/[0.04] rounded-full h-2 md:h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          <div className="shrink-0 text-white/70 font-bold text-base md:text-lg tabular-nums">
            {percentage}%
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== PREVIEW SCREEN ==========
function PreviewScreen({ formData, selectedType, onEdit, onSubmit, submitting }) {
  const typeLabels = { 
    normal: 'Team-Bewerbung', 
    praktikum: 'Praktikum-Bewerbung', 
    uprank: 'Uprank-Bewerbung' 
  };

  const getFieldLabel = (key) => {
    const labels = {
      vorname: 'Vorname',
      alter: 'Alter',
      robloxName: 'Roblox Name',
      spielzeit: 'Roleplay-Erfahrung',
      fraktion: 'Fraktion',
      andererServer: 'Andere RP-Server',
      bannWarn: 'Bans/Verwarnungen',
      warumTeam: 'Motivation',
      geduldig: 'Geduld & Stressresistenz',
      stundenProWoche: 'Stunden pro Woche',
      failRpLoesung: 'Fail-RP Lösung',
      streitLoesung: 'Konfliktlösung',
      hatMikro: 'Mikrofon vorhanden',
      kenntRegeln: 'Regeln gelesen',
      bleibtNett: 'Respektvoll bleiben',
      seitWannImTeam: 'Im Team seit',
      aktuelleAufgaben: 'Aktuelle Aufgaben',
      gewuenschterRang: 'Gewünschter Rang',
      warumUprank: 'Grund für Beförderung',
      zusaetzlicheVerantwortung: 'Zusätzliche Verantwortung'
    };
    return labels[key] || key;
  };

  const renderValue = (key, value) => {
    if (typeof value === 'boolean') {
      return value ? (
        <span className="inline-flex items-center gap-1.5 text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4" /> Ja
        </span>
      ) : (
        <span className="text-white/30 text-sm">Nein</span>
      );
    }
    if (!value || value.toString().trim() === '') {
      return <span className="text-white/20 text-sm italic">Nicht angegeben</span>;
    }
    return <span className="text-white/80 text-sm md:text-base leading-relaxed whitespace-pre-wrap">{value}</span>;
  };

  const fieldsToShow = Object.keys(formData).filter(k => k !== 'bewerbungType');

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={onEdit} 
          className="mb-6 md:mb-8 text-neutral-600 hover:text-neutral-300 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zur Bearbeitung
        </Button>

        <div className="text-center mb-8 md:mb-10 animate-fade-in-up">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4 md:mb-5">
            <Eye className="w-8 h-8 md:w-10 md:h-10 text-white/40" />
          </div>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3">Vorschau</h1>
          <p className="text-neutral-500 text-sm md:text-base">Überprüfe deine Angaben vor dem Absenden</p>
        </div>

        <div className="p-5 md:p-8 lg:p-10 rounded-2xl md:rounded-3xl bg-neutral-900/30 border border-neutral-800/60 space-y-6 md:space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="pb-4 md:pb-6 border-b border-white/[0.06]">
            <h2 className="text-lg md:text-xl font-bold text-white/90">{typeLabels[selectedType]}</h2>
            <p className="text-white/40 text-xs md:text-sm mt-1">Bitte alle Angaben sorgfältig prüfen</p>
          </div>

          <div className="space-y-5 md:space-y-6">
            {fieldsToShow.map((key, idx) => (
              <div 
                key={key} 
                className="animate-fade-in-up" 
                style={{ animationDelay: `${0.05 * idx}s`, animationFillMode: 'both' }}
              >
                <div className="text-white/50 text-xs md:text-sm font-medium mb-1.5 md:mb-2">{getFieldLabel(key)}</div>
                <div className="p-3 md:p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  {renderValue(key, formData[key])}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 md:pt-8">
            <div className="h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent mb-6 md:mb-8" />
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Button 
                onClick={onEdit} 
                variant="outline"
                className="flex-1 rounded-xl h-12 md:h-14 text-sm md:text-base border-white/10 hover:bg-white/[0.04] min-h-[44px]"
              >
                <Edit className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Bearbeiten
              </Button>
              <Button 
                onClick={onSubmit}
                disabled={submitting}
                className="flex-1 bg-white text-black hover:bg-neutral-200 rounded-xl h-12 md:h-14 text-sm md:text-base font-semibold shadow-2xl shadow-white/5 transition-all hover:scale-[1.01] active:scale-[0.99] min-h-[44px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin mr-2" />
                    Wird eingereicht...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Jetzt absenden
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== KARTEN-AUSWAHL ==========
function BewerbungCards({ user, onSelect, settings }) {
  const isTeamler = user?.isTeamMember || false;
  const hasBetaTesterRole = user?.roles?.includes('1494434149623136276');

  const cards = [
    {
      type: 'normal',
      title: 'Team Bewerbung',
      desc: 'Bewirb dich als neues Teammitglied bei Hamburg Horizon RP.',
      icon: <Users className="w-6 h-6 md:w-7 md:h-7" />,
      color: 'from-neutral-800 to-neutral-900',
      borderHover: 'hover:border-white/20',
      show: !isTeamler,
      isOpen: settings?.normal_open !== false
    },
    {
      type: 'praktikum',
      title: 'Praktikum Bewerbung',
      desc: 'Bewirb dich für ein Praktikum im Team, um uns kennenzulernen.',
      icon: <Briefcase className="w-6 h-6 md:w-7 md:h-7" />,
      color: 'from-neutral-800 to-neutral-900',
      borderHover: 'hover:border-white/20',
      show: !isTeamler,
      isOpen: settings?.praktikum_open !== false
    },
    {
      type: 'beta_tester',
      title: 'Beta Tester',
      desc: 'Werde Teil unseres exklusiven Beta Tester Programms!',
      icon: <Sparkles className="w-6 h-6 md:w-7 md:h-7" />,
      color: 'from-neutral-800 to-neutral-900',
      borderHover: 'hover:border-purple-500/20',
      show: !isTeamler && !hasBetaTesterRole,
      isOpen: settings?.beta_tester_open !== false
    },
    {
      type: 'uprank',
      title: 'Uprank Bewerbung',
      desc: 'Beantrage eine Beförderung innerhalb des Teams.',
      icon: <TrendingUp className="w-6 h-6 md:w-7 md:h-7" />,
      color: 'from-neutral-800 to-neutral-900',
      borderHover: 'hover:border-white/20',
      show: isTeamler,
      note: 'Nur für Teamler • Du kannst deine eigene Bewerbung nicht selbst bearbeiten',
      isOpen: settings?.uprank_open !== false
    },
  ];

  const visibleCards = cards.filter(c => c.show);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8 md:mb-10 animate-fade-in-up px-4" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3">Bewerbung einreichen</h1>
        <p className="text-sm md:text-base lg:text-lg max-w-md mx-auto" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
          {isTeamler 
            ? 'Als Teamler kannst du eine Uprank-Bewerbung einreichen.'
            : 'Wähle den passenden Bewerbungstyp aus.'
          }
        </p>
      </div>

      {isTeamler && (
        <div className="mb-6 md:mb-8 p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-2.5 md:gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
          <Shield className="w-4 h-4 md:w-5 md:h-5 text-neutral-400 shrink-0" />
          <p className="text-neutral-400 text-xs md:text-sm">
            Du bist als <strong className="text-white">{user.adminRole}</strong> eingeloggt. Team-Bewerbungen sind für dich nicht verfügbar, da du bereits im Team bist.
          </p>
        </div>
      )}

      <div className={`grid ${visibleCards.length === 1 ? 'max-w-md mx-auto' : 'md:grid-cols-2'} gap-4 md:gap-5`}>
        {visibleCards.map((card, i) => {
          const hasDraft = typeof window !== 'undefined' && localStorage.getItem(`hhrp-draft-${card.type}`);
          return (
          <button
            key={card.type}
            onClick={() => card.isOpen ? onSelect(card.type) : null}
            disabled={!card.isOpen}
            className={`group relative text-left p-6 md:p-8 rounded-xl md:rounded-2xl glass
              ${card.isOpen ? 'hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 cursor-pointer' : 'opacity-60 cursor-not-allowed'}
              transition-all duration-500 animate-fade-in-up min-h-[44px]`}
            style={{ animationDelay: `${0.4 + i * 0.15}s`, animationFillMode: 'both' }}
          >
            {!card.isOpen && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl md:rounded-2xl backdrop-blur-sm z-10">
                <div className="text-center px-6">
                  <Lock className="w-8 h-8 md:w-10 md:h-10 text-red-400/70 mx-auto mb-2 md:mb-3" />
                  <p className="text-white font-semibold text-sm md:text-base">Bewerbungen geschlossen</p>
                  <p className="text-white/50 text-xs mt-1">Derzeit nicht verfügbar</p>
                </div>
              </div>
            )}
            {hasDraft && card.isOpen && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(var(--theme-accent-rgb), 0.15)', color: 'var(--theme-accent)' }}>
                ENTWURF
              </div>
            )}
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-5 transition-all duration-300 ${!card.isOpen && 'blur-[2px]'}`}
              style={{ background: 'rgba(var(--theme-accent-rgb), 0.06)', border: '1px solid rgba(var(--theme-accent-rgb), 0.1)', color: 'rgba(var(--theme-accent-rgb), 0.5)' }}>
              {card.icon}
            </div>
            <h3 className={`text-lg md:text-xl font-bold text-white mb-2 transition-colors ${!card.isOpen && 'blur-[2px]'}`}>{card.title}</h3>
            <p className={`text-xs md:text-sm leading-relaxed mb-3 md:mb-4 ${!card.isOpen && 'blur-[2px]'}`} style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>{card.desc}</p>
            {card.note && (
              <p className={`text-xs flex items-center gap-1.5 ${!card.isOpen && 'blur-[2px]'}`} style={{ color: 'rgba(var(--theme-accent-rgb), 0.25)' }}>
                <Lock className="w-3 h-3" /> {card.note}
              </p>
            )}
            {card.isOpen && (
              <div className="mt-3 md:mt-4 flex items-center gap-2 text-xs md:text-sm font-medium transition-colors" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
                {hasDraft ? 'Entwurf fortsetzen' : 'Bewerbung starten'} <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </button>
          );
        })}
      </div>

      {!isTeamler && (
        <div className="mt-6 md:mt-8 text-center animate-fade-in-up" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
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
      <div className="p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-2.5 md:gap-3 mb-2">
        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-neutral-400 shrink-0" />
        <p className="text-neutral-400 text-xs md:text-sm">
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
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // NEU: Multi-Step State
  const [error, setError] = useState('');
  const [existingBewerbung, setExistingBewerbung] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [bewerbungSettings, setBewerbungSettings] = useState({ normal_open: true, praktikum_open: true, uprank_open: true });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [nichtVerifiziert, setNichtVerifiziert] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/?error=not_logged_in');
  }, [user, authLoading, router]);

  // Verifizierungs-Check via Discord Rollen
  useEffect(() => {
    if (user && !authLoading) {
      checkVerification();
    } else if (!authLoading) {
      setCheckingVerification(false);
    }
  }, [user, authLoading]);

  const checkVerification = () => {
    try {
      // User ist verifiziert wenn er Rollen hat (Discord Server Member)
      // Oder wenn keine spezielle Verifizierungs-Rolle erforderlich ist
      const hasVerifiedRole = user?.roles && user.roles.length > 0;
      setNichtVerifiziert(false); // Alle Discord-Member sind verifiziert
    } catch (e) {
      console.error('Verifizierungs-Check fehlgeschlagen:', e);
      setNichtVerifiziert(false); // Bei Fehler als verifiziert behandeln
    } finally {
      setCheckingVerification(false);
    }
  };
  
  // Lade Bewerbungs-Settings im Hintergrund
  useEffect(() => {
    fetchBewerbungSettings();
  }, []);
  
  const fetchBewerbungSettings = async () => {
    try {
      const res = await fetch('/api/bewerbung-settings');
      const data = await res.json();
      setBewerbungSettings(data.settings || { normal_open: true, praktikum_open: true, uprank_open: true, beta_tester_open: true });
    } catch (e) {
      console.error('Fehler beim Laden der Settings:', e);
      setBewerbungSettings({ normal_open: true, praktikum_open: true, uprank_open: true, beta_tester_open: true });
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
    if (type === 'beta_tester') {
      return { ...base, name: '', discordName: user?.globalName || user?.username || '', alter: '', warum: '', erfahrung: '', verfuegbarkeit: '', features: '', bugs: '', feedback: '', kommunikation: '', erwartungen: '', staerken: '', schwaechen: '', zusaetzlich: '' };
    }
    return base;
  };

  const handleSelect = (type) => {
    setSelectedType(type);
    setCurrentStep(0); // Reset to first step
    // Prüfe ob ein Entwurf existiert
    const draftKey = `hhrp-draft-${type}`;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setFormData(draft);
        toast.success('Entwurf geladen', { description: 'Dein gespeicherter Entwurf wurde geladen.' });
      } catch {
        setFormData(initFormData(type));
      }
    } else {
      setFormData(initFormData(type));
    }
    setError('');
    setShowPreview(false);
  };

  // Auto-Save: Speichere formData bei jeder Änderung
  useEffect(() => {
    if (selectedType && Object.keys(formData).length > 0) {
      const draftKey = `hhrp-draft-${selectedType}`;
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, selectedType]);

  // Step-Validierung
  const canGoToNextStep = () => {
    if (selectedType === 'normal') {
      if (currentStep === 0) {
        return formData.vorname && formData.alter && formData.robloxName;
      }
      if (currentStep === 1) {
        return formData.spielzeit && formData.fraktion && formData.bannWarn;
      }
      if (currentStep === 2) {
        return formData.warumTeam && formData.geduldig && formData.stundenProWoche && 
               formData.failRpLoesung && formData.streitLoesung;
      }
      if (currentStep === 3) {
        return formData.hatMikro && formData.kenntRegeln && formData.bleibtNett;
      }
    }
    
    if (selectedType === 'praktikum') {
      if (currentStep === 0) {
        return formData.vorname && formData.alter && formData.robloxName;
      }
      if (currentStep === 1) {
        return formData.fraktion && formData.spielzeit;
      }
      if (currentStep === 2) {
        return formData.warumTeam && formData.stundenProWoche;
      }
      if (currentStep === 3) {
        return formData.hatMikro && formData.kenntRegeln && formData.bleibtNett;
      }
    }
    
    if (selectedType === 'uprank') {
      if (currentStep === 0) {
        return formData.seitWannImTeam && formData.aktuelleAufgaben;
      }
      if (currentStep === 1) {
        return formData.gewuenschterRang && formData.warumUprank;
      }
      if (currentStep === 2) {
        return formData.zusaetzlicheVerantwortung && formData.stundenProWoche;
      }
    }
    
    return true;
  };

  const handleStepChange = (newStep) => {
    setCurrentStep(newStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveDraft = () => {
    if (!selectedType) return;
    const draftKey = `hhrp-draft-${selectedType}`;
    localStorage.setItem(draftKey, JSON.stringify(formData));
    toast.success('Entwurf gespeichert', { description: 'Du kannst jederzeit weitermachen.' });
  };

  const handleDeleteDraft = () => {
    if (!selectedType) return;
    const draftKey = `hhrp-draft-${selectedType}`;
    localStorage.removeItem(draftKey);
    toast.info('Entwurf gelöscht');
  };

  // Auto-Save Entwurf alle 30 Sekunden
  useEffect(() => {
    if (!selectedType || showPreview || submitted) return;
    const interval = setInterval(() => {
      const draftKey = `hhrp-draft-${selectedType}`;
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedType, formData, showPreview, submitted]);

  const handlePreview = (e) => {
    e.preventDefault();
    setShowPreview(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
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
      handleDeleteDraft(); // Entwurf löschen nach Einreichung
      toast.success('Bewerbung eingereicht!', { description: 'Wir melden uns bald bei dir.' });
      setTimeout(() => router.push('/meine-bewerbungen'), 2500);
    } catch (e) {
      setError(e.message);
      toast.error('Fehler', { description: e.message });
      setShowPreview(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  // Nicht Verifiziert Blockade
  if (nichtVerifiziert) {
    return (
      <div className="min-h-screen px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          <div className="glass rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-orange-500/10 overflow-hidden">
            <div className="p-8 sm:p-12 flex flex-col items-center text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mb-6">
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-red-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-red-400 mb-3">Nicht Verifiziert</h2>
              <p className="text-white/60 max-w-md mb-6 leading-relaxed">
                Du kannst keine Bewerbung einreichen, da dein Account noch nicht verifiziert ist. Bitte verifiziere dich zuerst auf dem Discord Server.
              </p>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] max-w-sm w-full mb-6">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">So verifizierst du dich:</p>
                    <p className="text-xs text-white/40 mt-0.5">Gehe auf den Discord Server und folge den Anweisungen im Verifizierungs-Kanal</p>
                  </div>
                </div>
              </div>
              <a 
                href="https://discord.gg/nJWPrTURq5" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl font-medium transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Zum Discord Server
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Wenn bereits eine aktive Bewerbung existiert
  if (existingBewerbung) {
    const statusColors = {
      'Eingereicht': 'bg-blue-500/10 border-blue-500/20 text-blue-300',
      'In Bearbeitung': 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
    };
    
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-6 md:py-8">
        <div className="max-w-lg w-full">
          <div className="relative p-8 md:p-10 lg:p-12 rounded-2xl md:rounded-3xl bg-gradient-to-br from-neutral-900/80 to-neutral-900/60 border border-neutral-800 backdrop-blur-xl animate-scale-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
            
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-5 md:mb-6 shadow-lg shadow-orange-500/10">
              <Clock className="w-8 h-8 md:w-10 md:h-10 text-orange-400" />
            </div>
            
            <h2 className="relative text-2xl md:text-3xl font-bold text-white mb-2 md:mb-3 text-center">
              Bereits eine Bewerbung aktiv
            </h2>
            
            <p className="relative text-neutral-400 text-center mb-5 md:mb-6 leading-relaxed text-sm md:text-base">
              Du hast bereits eine Bewerbung eingereicht, die noch bearbeitet wird.
            </p>
            
            <div className="relative flex justify-center mb-6 md:mb-8">
              <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs md:text-sm font-medium border shadow-lg ${statusColors[existingBewerbung.status]}`}>
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <span>Status: {existingBewerbung.status}</span>
              </div>
            </div>
            
            <div className="relative p-3.5 md:p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50 mb-6 md:mb-8">
              <p className="text-neutral-500 text-xs md:text-sm text-center">
                Du kannst erst eine neue Bewerbung einreichen, wenn deine aktuelle Bewerbung bearbeitet wurde.
              </p>
            </div>
            
            <div className="relative space-y-3">
              <Button 
                onClick={() => router.push('/meine-bewerbungen')} 
                className="bg-white text-black hover:bg-neutral-200 rounded-xl w-full h-12 md:h-14 font-semibold shadow-lg text-sm md:text-base min-h-[44px]"
              >
                <FileText className="w-4 h-4 mr-2" />
                Meine Bewerbungen ansehen
              </Button>
              <Button 
                variant="ghost"
                onClick={() => router.push('/')} 
                className="w-full text-neutral-500 hover:text-white hover:bg-neutral-800/50 rounded-xl h-11 md:h-12 text-sm md:text-base min-h-[44px]"
              >
                Zurück zur Startseite
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    const typeLabels = { normal: 'Team-Bewerbung', praktikum: 'Praktikum-Bewerbung', uprank: 'Uprank-Bewerbung' };
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-6 md:py-8">
        <div className="max-w-md w-full animate-scale-in">
          <div className="p-8 md:p-10 rounded-2xl md:rounded-3xl bg-neutral-900/50 border border-neutral-800 text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4 md:mb-5">
              <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-green-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">{typeLabels[selectedType]} eingereicht!</h2>
            <p className="text-neutral-500 mb-6 md:mb-8 text-sm md:text-base">Wir melden uns bald bei dir per Discord!</p>
            <Button 
              onClick={() => router.push('/meine-bewerbungen')} 
              className="bg-white text-black hover:bg-neutral-200 rounded-xl w-full h-11 md:h-12 text-sm md:text-base min-h-[44px]"
            >
              Meine Bewerbungen ansehen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // PREVIEW SCREEN
  if (showPreview) {
    return (
      <PreviewScreen 
        formData={formData} 
        selectedType={selectedType}
        onEdit={() => setShowPreview(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    );
  }

  // KARTEN-AUSWAHL
  if (!selectedType) {
    return (
      <div className="min-h-screen px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')} 
            className="mb-6 md:mb-8 text-neutral-600 hover:text-neutral-300 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
          </Button>
          <BewerbungCards user={user} onSelect={handleSelect} settings={bewerbungSettings} />
        </div>
      </div>
    );
  }

  // FORMULAR MIT MULTI-STEP WIZARD
  const typeLabels = { 
    normal: 'Team-Bewerbung', 
    praktikum: 'Praktikum-Bewerbung', 
    uprank: 'Uprank-Bewerbung', 
    beta_tester: 'Beta Tester Bewerbung' 
  };
  const totalSteps = (selectedType === 'uprank') ? 3 : 4;

  return (
    <div className="min-h-screen">
      <ProgressBar formData={formData} selectedType={selectedType} />
      
      <div className="px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedType(null);
              setCurrentStep(0);
            }} 
            className="mb-6 md:mb-8 text-neutral-600 hover:text-neutral-300 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zur Auswahl
          </Button>

          <div className="text-center mb-8 md:mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3">{typeLabels[selectedType]}</h1>
            <p className="text-sm md:text-base" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              Schritt {currentStep + 1} von {totalSteps}
            </p>
          </div>

          <div className="p-5 md:p-8 lg:p-10 rounded-2xl md:rounded-3xl glass animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <MultiStepWizard
              currentStep={currentStep}
              totalSteps={totalSteps}
              onStepChange={handleStepChange}
              onSubmit={handleSubmit}
              canGoNext={canGoToNextStep()}
              submitting={submitting}
            >
              {/* Normal Team-Bewerbung - 4 Steps */}
              {selectedType === 'normal' && currentStep === 0 && <NormalStep1 formData={formData} setFormData={setFormData} />}
              {selectedType === 'normal' && currentStep === 1 && <NormalStep2 formData={formData} setFormData={setFormData} />}
              {selectedType === 'normal' && currentStep === 2 && <NormalStep3 formData={formData} setFormData={setFormData} />}
              {selectedType === 'normal' && currentStep === 3 && <NormalStep4 formData={formData} setFormData={setFormData} />}

              {/* Praktikum-Bewerbung - 4 Steps */}
              {selectedType === 'praktikum' && currentStep === 0 && <PraktikumStep1 formData={formData} setFormData={setFormData} />}
              {selectedType === 'praktikum' && currentStep === 1 && <PraktikumStep2 formData={formData} setFormData={setFormData} />}
              {selectedType === 'praktikum' && currentStep === 2 && <PraktikumStep3 formData={formData} setFormData={setFormData} />}
              {selectedType === 'praktikum' && currentStep === 3 && <PraktikumStep4 formData={formData} setFormData={setFormData} />}

              {/* Beta Tester Bewerbung - 4 Steps */}
              {selectedType === 'beta_tester' && currentStep === 0 && <BetaTesterStep1 formData={formData} setFormData={setFormData} />}
              {selectedType === 'beta_tester' && currentStep === 1 && <BetaTesterStep2 formData={formData} setFormData={setFormData} />}
              {selectedType === 'beta_tester' && currentStep === 2 && <BetaTesterStep3 formData={formData} setFormData={setFormData} />}
              {selectedType === 'beta_tester' && currentStep === 3 && <BetaTesterStep4 formData={formData} setFormData={setFormData} />}

              {/* Uprank-Bewerbung - 3 Steps */}
              {selectedType === 'uprank' && currentStep === 0 && <UprankStep1 formData={formData} setFormData={setFormData} user={user} />}
              {selectedType === 'uprank' && currentStep === 1 && <UprankStep2 formData={formData} setFormData={setFormData} />}
              {selectedType === 'uprank' && currentStep === 2 && <UprankStep3 formData={formData} setFormData={setFormData} />}
            </MultiStepWizard>

            {error && (
              <div className="mt-6 bg-red-500/5 border border-red-500/10 rounded-xl p-3.5 md:p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400/60 shrink-0" />
                <span className="text-red-300/70 text-xs md:text-sm">{error}</span>
              </div>
            )}
          </div>
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
