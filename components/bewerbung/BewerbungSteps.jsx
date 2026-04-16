'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Gamepad2, Target, MessageSquare, Shield, Mic, BookOpen, Heart, Briefcase, TrendingUp } from 'lucide-react';
import { WizardStep } from './MultiStepWizard';

const inputClass = "bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 focus:ring-white/10 rounded-xl transition-all duration-300 focus:bg-white/[0.05] min-h-[44px]";

function FormField({ label, required, children }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/60">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

// ============ NORMAL TEAM BEWERBUNG - MULTI STEP ============

export function NormalStep1({ formData, setFormData }) {
  return (
    <WizardStep 
      title="Persönliche Informationen" 
      description="Erzähl uns ein bisschen über dich"
    >
      <FormField label="Vorname" required>
        <Input 
          value={formData.vorname || ''} 
          onChange={e => setFormData({ ...formData, vorname: e.target.value })} 
          placeholder="Max" 
          className={inputClass} 
        />
      </FormField>
      <FormField label="Alter" required>
        <Input 
          type="number" 
          value={formData.alter || ''} 
          onChange={e => setFormData({ ...formData, alter: e.target.value })} 
          placeholder="18" 
          className={inputClass} 
          min="13" 
        />
      </FormField>
      <FormField label="Roblox Name" required>
        <Input 
          value={formData.robloxName || ''} 
          onChange={e => setFormData({ ...formData, robloxName: e.target.value })} 
          placeholder="Dein Roblox Username" 
          className={inputClass} 
        />
      </FormField>
    </WizardStep>
  );
}

export function NormalStep2({ formData, setFormData }) {
  return (
    <WizardStep 
      title="Deine Roleplay Erfahrung" 
      description="Wir möchten mehr über deinen Background erfahren"
    >
      <FormField label="Wie lange spielst du schon Roleplay?" required>
        <Input 
          value={formData.spielzeit || ''} 
          onChange={e => setFormData({ ...formData, spielzeit: e.target.value })} 
          placeholder="z.B. 2 Jahre" 
          className={inputClass} 
        />
      </FormField>
      <FormField label="In welcher Fraktion möchtest du arbeiten?" required>
        <Input 
          value={formData.fraktion || ''} 
          onChange={e => setFormData({ ...formData, fraktion: e.target.value })} 
          placeholder="z.B. Polizei, Feuerwehr, Medic" 
          className={inputClass} 
        />
      </FormField>
      <FormField label="Warst du schon auf einem anderen RP-Server?">
        <Textarea 
          value={formData.andererServer || ''} 
          onChange={e => setFormData({ ...formData, andererServer: e.target.value })} 
          placeholder="Wenn ja, welcher Server und was hast du dort gemacht?" 
          className={inputClass + " min-h-[80px] resize-none"} 
        />
      </FormField>
      <FormField label="Wurdest du schon mal gebannt oder verwarnt?" required>
        <Textarea 
          value={formData.bannWarn || ''} 
          onChange={e => setFormData({ ...formData, bannWarn: e.target.value })} 
          placeholder="Bitte sei ehrlich. Falls ja, warum? Falls nein, schreibe 'Nein'" 
          className={inputClass + " min-h-[80px] resize-none"} 
        />
      </FormField>
    </WizardStep>
  );
}

export function NormalStep3({ formData, setFormData }) {
  return (
    <WizardStep 
      title="Motivation & Fähigkeiten" 
      description="Zeig uns, warum du perfekt ins Team passt"
    >
      <FormField label="Warum möchtest du in unser Team?" required>
        <Textarea 
          value={formData.warumTeam || ''} 
          onChange={e => setFormData({ ...formData, warumTeam: e.target.value })} 
          placeholder="Was motiviert dich? Was reizt dich am Team-Sein?" 
          className={inputClass + " min-h-[120px] resize-none"} 
        />
      </FormField>
      <FormField label="Bist du geduldig und kannst du mit Stress umgehen?" required>
        <Textarea 
          value={formData.geduldig || ''} 
          onChange={e => setFormData({ ...formData, geduldig: e.target.value })} 
          placeholder="Beschreibe deine Stärken im Umgang mit schwierigen Situationen" 
          className={inputClass + " min-h-[100px] resize-none"} 
        />
      </FormField>
      <FormField label="Wie viele Stunden pro Woche kannst du aktiv sein?" required>
        <Input 
          value={formData.stundenProWoche || ''} 
          onChange={e => setFormData({ ...formData, stundenProWoche: e.target.value })} 
          placeholder="z.B. 10-15 Stunden" 
          className={inputClass} 
        />
      </FormField>
      <FormField label="Ein Spieler macht Fail-RP. Wie gehst du vor?" required>
        <Textarea 
          value={formData.failRpLoesung || ''} 
          onChange={e => setFormData({ ...formData, failRpLoesung: e.target.value })} 
          placeholder="Beschreibe Schritt für Schritt deine Vorgehensweise" 
          className={inputClass + " min-h-[120px] resize-none"} 
        />
      </FormField>
      <FormField label="Zwei Spieler streiten sich. Wie löst du den Konflikt?" required>
        <Textarea 
          value={formData.streitLoesung || ''} 
          onChange={e => setFormData({ ...formData, streitLoesung: e.target.value })} 
          placeholder="Beschreibe deine Konfliktlösungsstrategie" 
          className={inputClass + " min-h-[120px] resize-none"} 
        />
      </FormField>
    </WizardStep>
  );
}

export function NormalStep4({ formData, setFormData }) {
  return (
    <WizardStep 
      title="Voraussetzungen" 
      description="Bitte bestätige folgende Punkte"
    >
      <div className="space-y-4">
        {[
          { key: 'hatMikro', icon: Mic, label: 'Ich habe ein funktionierendes Mikrofon' },
          { key: 'kenntRegeln', icon: BookOpen, label: 'Ich habe die Serverregeln gelesen und verstanden' },
          { key: 'bleibtNett', icon: Heart, label: 'Ich verpflichte mich, respektvoll und fair zu bleiben' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div 
              key={item.key} 
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all"
            >
              <Checkbox 
                checked={formData[item.key] || false} 
                onCheckedChange={v => setFormData({ ...formData, [item.key]: v })} 
                className="border-white/20 min-w-[20px] min-h-[20px]" 
              />
              <Icon className="w-5 h-5 text-white/40 flex-shrink-0" />
              <label className="text-sm text-white/70 cursor-pointer flex-1">
                {item.label}
              </label>
            </div>
          );
        })}
      </div>
    </WizardStep>
  );
}

// ============ PRAKTIKUM BEWERBUNG - MULTI STEP ============

export function PraktikumStep1({ formData, setFormData }) {
  return (
    <WizardStep 
      title="Persönliche Informationen" 
      description="Erzähl uns ein bisschen über dich"
    >
      <FormField label="Vorname" required>
        <Input 
          value={formData.vorname || ''} 
          onChange={e => setFormData({ ...formData, vorname: e.target.value })} 
          placeholder="Max" 
          className={inputClass} 
        />
      </FormField>
      <FormField label="Alter" required>
        <Input 
          type="number" 
          value={formData.alter || ''} 
          onChange={e => setFormData({ ...formData, alter: e.target.value })} 
          placeholder="18" 
          className={inputClass} 
          min="13" 
        />
      </FormField>
      <FormField label="Roblox Name" required>
        <Input 
          value={formData.robloxName || ''} 
          onChange={e => setFormData({ ...formData, robloxName: e.target.value })} 
          placeholder="Dein Roblox Username" 
          className={inputClass} 
        />
      </FormField>
    </WizardStep>
  );
}

export function PraktikumStep2({ formData, setFormData }) {
  return (
    <WizardStep 
      title="Praktikum Details" 
      description="Für welche Fraktion interessierst du dich?"
    >
      <FormField label="Für welche Fraktion möchtest du ein Praktikum machen?" required>
        <Input 
          value={formData.fraktion || ''} 
          onChange={e => setFormData({ ...formData, fraktion: e.target.value })} 
          placeholder="z.B. Polizei, Feuerwehr, Medic" 
          className={inputClass} 
        />
      </FormField>
      <FormField label="Hast du Roleplay-Erfahrung?" required>
        <Textarea 
          value={formData.spielzeit || ''} 
          onChange={e => setFormData({ ...formData, spielzeit: e.target.value })} 
          placeholder="Wenn ja, wie viel? Wenn nein, macht nichts!" 
          className={inputClass + " min-h-[80px] resize-none"} 
        />
      </FormField>
      <FormField label="Warst du schon auf anderen RP-Servern?">
        <Textarea 
          value={formData.andererServer || ''} 
          onChange={e => setFormData({ ...formData, andererServer: e.target.value })} 
          placeholder="Optional: Welche Server?" 
          className={inputClass + " min-h-[60px] resize-none"} 
        />
      </FormField>
    </WizardStep>
  );
}

export function PraktikumStep3({ formData, setFormData }) {
  return (
    <WizardStep 
      title="Deine Motivation" 
      description="Warum möchtest du ein Praktikum bei uns machen?"
    >
      <FormField label="Warum möchtest du ein Praktikum bei uns?" required>
        <Textarea 
          value={formData.warumTeam || ''} 
          onChange={e => setFormData({ ...formData, warumTeam: e.target.value })} 
          placeholder="Was erhoffst du dir? Was möchtest du lernen?" 
          className={inputClass + " min-h-[120px] resize-none"} 
        />
      </FormField>
      <FormField label="Wie viele Stunden pro Woche kannst du aktiv sein?" required>
        <Input 
          value={formData.stundenProWoche || ''} 
          onChange={e => setFormData({ ...formData, stundenProWoche: e.target.value })} 
          placeholder="z.B. 5-10 Stunden" 
          className={inputClass} 
        />
      </FormField>
    </WizardStep>
  );
}

export function PraktikumStep4({ formData, setFormData }) {
  return (
    <WizardStep 
      title="Voraussetzungen" 
      description="Bitte bestätige folgende Punkte"
    >
      <div className="space-y-4">
        {[
          { key: 'hatMikro', icon: Mic, label: 'Ich habe ein funktionierendes Mikrofon' },
          { key: 'kenntRegeln', icon: BookOpen, label: 'Ich habe die Serverregeln gelesen und verstanden' },
          { key: 'bleibtNett', icon: Heart, label: 'Ich verpflichte mich, respektvoll und fair zu bleiben' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div 
              key={item.key} 
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all"
            >
              <Checkbox 
                checked={formData[item.key] || false} 
                onCheckedChange={v => setFormData({ ...formData, [item.key]: v })} 
                className="border-white/20 min-w-[20px] min-h-[20px]" 
              />
              <Icon className="w-5 h-5 text-white/40 flex-shrink-0" />
              <label className="text-sm text-white/70 cursor-pointer flex-1">
                {item.label}
              </label>
            </div>
          );
        })}
      </div>
    </WizardStep>
  );
}

// ============ UPRANK BEWERBUNG - MULTI STEP ============

export function UprankStep1({ formData, setFormData, user }) {
  return (
    <WizardStep 
      title="Deine aktuelle Situation" 
      description={`Aktuelle Rolle: ${user?.adminRole || 'Unbekannt'}`}
    >
      <FormField label="Seit wann bist du im Team?" required>
        <Input 
          value={formData.seitWannImTeam || ''} 
          onChange={e => setFormData({ ...formData, seitWannImTeam: e.target.value })} 
          placeholder="z.B. seit 3 Monaten / seit Januar 2025" 
          className={inputClass} 
        />
      </FormField>
      <FormField label="Welche Aufgaben erfüllst du aktuell?" required>
        <Textarea 
          value={formData.aktuelleAufgaben || ''} 
          onChange={e => setFormData({ ...formData, aktuelleAufgaben: e.target.value })} 
          placeholder="Beschreibe deine täglichen Aufgaben und Verantwortungen" 
          className={inputClass + " min-h-[100px] resize-none"} 
        />
      </FormField>
    </WizardStep>
  );
}

export function UprankStep2({ formData, setFormData }) {
  return (
    <WizardStep 
      title="Gewünschte Beförderung" 
      description="Auf welchen Rang möchtest du befördert werden?"
    >
      <FormField label="Gewünschter Rang" required>
        <Input 
          value={formData.gewuenschterRang || ''} 
          onChange={e => setFormData({ ...formData, gewuenschterRang: e.target.value })} 
          placeholder="z.B. Teamkoordination, Teamleitung" 
          className={inputClass} 
        />
      </FormField>
      <FormField label="Warum verdienst du eine Beförderung?" required>
        <Textarea 
          value={formData.warumUprank || ''} 
          onChange={e => setFormData({ ...formData, warumUprank: e.target.value })} 
          placeholder="Was hast du geleistet? Was zeichnet dich aus? Welche Erfolge kannst du vorweisen?" 
          className={inputClass + " min-h-[120px] resize-none"} 
        />
      </FormField>
    </WizardStep>
  );
}

export function UprankStep3({ formData, setFormData }) {
  return (
    <WizardStep 
      title="Zusätzliche Verantwortung" 
      description="Was würdest du im neuen Rang übernehmen?"
    >
      <FormField label="Welche zusätzlichen Verantwortungen würdest du übernehmen?" required>
        <Textarea 
          value={formData.zusaetzlicheVerantwortung || ''} 
          onChange={e => setFormData({ ...formData, zusaetzlicheVerantwortung: e.target.value })} 
          placeholder="Was würdest du im neuen Rang anders/mehr machen? Welche neuen Aufgaben würdest du übernehmen?" 
          className={inputClass + " min-h-[120px] resize-none"} 
        />
      </FormField>
      <FormField label="Wie viele Stunden bist du pro Woche aktiv?" required>
        <Input 
          value={formData.stundenProWoche || ''} 
          onChange={e => setFormData({ ...formData, stundenProWoche: e.target.value })} 
          placeholder="z.B. 15-20 Stunden" 
          className={inputClass} 
        />
      </FormField>
    </WizardStep>
  );
}


// ============ BETA TESTER BEWERBUNG - MULTI STEP ============

export function BetaTesterStep1({ formData, setFormData }) {
  return (
    <WizardStep 
      title="Persönliche Daten" 
      description="Grundlegende Informationen über dich"
    >
      <FormField label="Vollständiger Name" required>
        <Input 
          value={formData.name || ''} 
          onChange={e => setFormData({ ...formData, name: e.target.value })} 
          placeholder="Max Mustermann" 
          className={inputClass} 
        />
      </FormField>
      <FormField label="Discord Name" required>
        <Input 
          value={formData.discordName || ''} 
          onChange={e => setFormData({ ...formData, discordName: e.target.value })} 
          className={inputClass}
          disabled
        />
      </FormField>
      <FormField label="Alter" required>
        <Input 
          type="number" 
          value={formData.alter || ''} 
          onChange={e => setFormData({ ...formData, alter: e.target.value })} 
          placeholder="18" 
          className={inputClass} 
          min="13" 
        />
      </FormField>
      <FormField label="Warum möchtest du Beta Tester werden?" required>
        <Textarea 
          value={formData.warum || ''} 
          onChange={e => setFormData({ ...formData, warum: e.target.value })} 
          placeholder="Beschreibe deine Motivation..." 
          className={inputClass + " min-h-[120px] resize-none"} 
        />
      </FormField>
    </WizardStep>
  );
}

export function BetaTesterStep2({ formData, setFormData }) {
  return (
    <WizardStep 
      title="Erfahrung & Verfügbarkeit" 
      description="Deine Testing-Erfahrung und zeitliche Verfügbarkeit"
    >
      <FormField label="Hast du Erfahrung mit Beta Testing oder Qualitätssicherung?" required>
        <Textarea 
          value={formData.erfahrung || ''} 
          onChange={e => setFormData({ ...formData, erfahrung: e.target.value })} 
          placeholder="Beschreibe deine Erfahrungen..." 
          className={inputClass + " min-h-[100px] resize-none"} 
        />
      </FormField>
      <FormField label="Wie viel Zeit kannst du pro Woche für Beta Testing aufbringen?">
        <Input 
          value={formData.verfuegbarkeit || ''} 
          onChange={e => setFormData({ ...formData, verfuegbarkeit: e.target.value })} 
          placeholder="z.B. 5-10 Stunden pro Woche" 
          className={inputClass} 
        />
      </FormField>
      <FormField label="Welche Features würdest du am liebsten testen?">
        <Textarea 
          value={formData.features || ''} 
          onChange={e => setFormData({ ...formData, features: e.target.value })} 
          placeholder="z.B. Neue Bewerbungssysteme, Admin-Tools, UI-Updates..." 
          className={inputClass + " min-h-[100px] resize-none"} 
        />
      </FormField>
      <FormField label="Wie gehst du vor, wenn du einen Bug findest?">
        <Textarea 
          value={formData.bugs || ''} 
          onChange={e => setFormData({ ...formData, bugs: e.target.value })} 
          placeholder="Beschreibe deinen Prozess zum Dokumentieren und Melden von Bugs..." 
          className={inputClass + " min-h-[100px] resize-none"} 
        />
      </FormField>
    </WizardStep>
  );
}

export function BetaTesterStep3({ formData, setFormData }) {
  return (
    <WizardStep 
      title="Feedback & Kommunikation" 
      description="Deine Art zu kommunizieren und Feedback zu geben"
    >
      <FormField label="Wie gibst du konstruktives Feedback?">
        <Textarea 
          value={formData.feedback || ''} 
          onChange={e => setFormData({ ...formData, feedback: e.target.value })} 
          placeholder="Beschreibe, wie du Verbesserungsvorschläge formulierst..." 
          className={inputClass + " min-h-[100px] resize-none"} 
        />
      </FormField>
      <FormField label="Wie würdest du mit anderen Beta Testern kommunizieren?">
        <Textarea 
          value={formData.kommunikation || ''} 
          onChange={e => setFormData({ ...formData, kommunikation: e.target.value })} 
          placeholder="z.B. Discord, Ticket-System, direkter Austausch..." 
          className={inputClass + " min-h-[100px] resize-none"} 
        />
      </FormField>
      <FormField label="Was erwartest du vom Beta Tester Programm?">
        <Textarea 
          value={formData.erwartungen || ''} 
          onChange={e => setFormData({ ...formData, erwartungen: e.target.value })} 
          placeholder="Deine Erwartungen und Ziele..." 
          className={inputClass + " min-h-[100px] resize-none"} 
        />
      </FormField>
    </WizardStep>
  );
}

export function BetaTesterStep4({ formData, setFormData }) {
  return (
    <WizardStep 
      title="Persönliche Einschätzung" 
      description="Letzte Fragen zu deinen Stärken und Schwächen"
    >
      <FormField label="Was sind deine Stärken?">
        <Textarea 
          value={formData.staerken || ''} 
          onChange={e => setFormData({ ...formData, staerken: e.target.value })} 
          placeholder="z.B. Detailgenauigkeit, technisches Verständnis, Kreativität..." 
          className={inputClass + " min-h-[100px] resize-none"} 
        />
      </FormField>
      <FormField label="Was sind deine Schwächen im Bereich Testing?">
        <Textarea 
          value={formData.schwaechen || ''} 
          onChange={e => setFormData({ ...formData, schwaechen: e.target.value })} 
          placeholder="Sei ehrlich - wir schätzen Selbstreflexion!" 
          className={inputClass + " min-h-[100px] resize-none"} 
        />
      </FormField>
      <FormField label="Möchtest du uns noch etwas mitteilen?">
        <Textarea 
          value={formData.zusaetzlich || ''} 
          onChange={e => setFormData({ ...formData, zusaetzlich: e.target.value })} 
          placeholder="Zusätzliche Informationen..." 
          className={inputClass + " min-h-[100px] resize-none"} 
        />
      </FormField>
    </WizardStep>
  );
}
