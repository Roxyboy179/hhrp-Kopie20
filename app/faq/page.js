'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/shared/GlassCard';
import { ChevronDown, HelpCircle, FileText, Clock, CheckCircle2, Shield, MessageCircle, AlertTriangle } from 'lucide-react';

const faqData = [
  {
    category: 'Bewerbung',
    icon: <FileText className="w-5 h-5" />,
    questions: [
      {
        q: 'Wie bewerbe ich mich?',
        a: 'Melde dich zuerst mit deinem Discord-Account an. Dann kannst du unter "Team-Bewerbung" das Bewerbungsformular ausfüllen und absenden. Du musst auf dem Hamburg Horizon RP Discord-Server sein.'
      },
      {
        q: 'Welche Voraussetzungen gibt es?',
        a: 'Du musst mindestens 16 Jahre alt sein, einen Discord-Account besitzen und auf dem Hamburg Horizon RP Discord-Server sein. Außerdem solltest du motiviert und teamfähig sein.'
      },
      {
        q: 'Kann ich meine Bewerbung nachträglich ändern?',
        a: 'Nein, eine eingereichte Bewerbung kann nicht mehr bearbeitet werden. Allerdings kannst du eine Bewerbung als Entwurf speichern und später fertigstellen, bevor du sie abschickst.'
      },
      {
        q: 'Kann ich mich für mehrere Positionen gleichzeitig bewerben?',
        a: 'Ja, du kannst dich für verschiedene Positionen bewerben. Jede Bewerbung wird einzeln bearbeitet und bewertet.'
      },
      {
        q: 'Was ist eine Uprank-Bewerbung?',
        a: 'Wenn du bereits Teamler bist, kannst du dich für eine höhere Position bewerben. Diese Option wird automatisch freigeschaltet, sobald du als Teamler erkannt wirst.'
      },
    ]
  },
  {
    category: 'Bearbeitung',
    icon: <Clock className="w-5 h-5" />,
    questions: [
      {
        q: 'Wie lange dauert die Bearbeitung?',
        a: 'In der Regel wird deine Bewerbung innerhalb von 3-7 Tagen bearbeitet. Bei hohem Aufkommen kann es etwas länger dauern. Du erhältst eine Benachrichtigung, sobald sich der Status ändert.'
      },
      {
        q: 'Was bedeuten die verschiedenen Status?',
        a: '"Eingereicht" - Deine Bewerbung wartet auf Bearbeitung. "In Bearbeitung" - Ein Admin prüft deine Bewerbung. "Angenommen" - Herzlichen Glückwunsch! "Abgelehnt" - Leider hat es diesmal nicht geklappt.'
      },
      {
        q: 'Kann ich meine Bewerbung zurückziehen?',
        a: 'Ja, solange die Bewerbung noch nicht abschließend bearbeitet wurde, kannst du sie unter "Meine Bewerbungen" zurückziehen.'
      },
    ]
  },
  {
    category: 'Annahme & Ablehnung',
    icon: <CheckCircle2 className="w-5 h-5" />,
    questions: [
      {
        q: 'Was passiert nach der Annahme?',
        a: 'Nach der Annahme wirst du über Discord kontaktiert und erhältst weitere Informationen zum Onboarding. Du bekommst deine Teamler-Rolle auf dem Discord-Server.'
      },
      {
        q: 'Kann ich mich nach einer Ablehnung erneut bewerben?',
        a: 'Ja, du kannst dich nach einer Ablehnung erneut bewerben. Wir empfehlen jedoch, mindestens 2 Wochen zu warten und die Gründe der Ablehnung zu reflektieren.'
      },
      {
        q: 'Werden Ablehnungsgründe genannt?',
        a: 'In den meisten Fällen erhältst du einen kurzen Hinweis zum Grund der Ablehnung. Bei Rückfragen kannst du dich an das Team wenden.'
      },
    ]
  },
  {
    category: 'Konto & Sicherheit',
    icon: <Shield className="w-5 h-5" />,
    questions: [
      {
        q: 'Warum muss ich mich mit Discord anmelden?',
        a: 'Die Discord-Anmeldung dient zur Verifizierung deiner Identität und ermöglicht uns, dich nach der Bewerbung direkt über Discord zu kontaktieren.'
      },
      {
        q: 'Welche Daten werden gespeichert?',
        a: 'Wir speichern deinen Discord-Benutzernamen, deine Discord-ID und die Bewerbungsdaten. Weitere Informationen findest du in unserer Datenschutzerklärung.'
      },
      {
        q: 'Wie kann ich mein Konto löschen?',
        a: 'Da wir die Discord-Authentifizierung nutzen, gibt es kein separates Konto. Deine Bewerbungsdaten können auf Anfrage gelöscht werden.'
      },
    ]
  },
  {
    category: 'Technische Probleme',
    icon: <AlertTriangle className="w-5 h-5" />,
    questions: [
      {
        q: 'Die Anmeldung funktioniert nicht - was tun?',
        a: 'Stelle sicher, dass du auf dem Hamburg Horizon RP Discord-Server bist. Lösche deine Browser-Cookies und versuche es erneut. Falls das Problem weiterhin besteht, kontaktiere uns auf Discord.'
      },
      {
        q: 'Meine Bewerbung wird nicht angezeigt.',
        a: 'Überprüfe, ob du mit dem richtigen Discord-Account angemeldet bist. Falls das Problem bestehen bleibt, kontaktiere uns auf Discord.'
      },
    ]
  },
];

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left glass rounded-xl p-4 transition-all hover:bg-white/[0.02]"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-white/90 text-sm">{question}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--theme-accent)' }} />
      </div>
      <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>{answer}</p>
        </div>
      </div>
    </button>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('Alle');
  const allCategories = ['Alle', ...faqData.map(c => c.category)];
  const filtered = activeCategory === 'Alle' ? faqData : faqData.filter(c => c.category === activeCategory);

  return (
    <div className="min-h-screen px-6 py-24 page-transition-enter">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <HelpCircle className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
            <span className="text-xs tracking-wider uppercase font-medium" style={{ color: 'rgba(var(--theme-accent-rgb), 0.6)' }}>Hilfe & FAQ</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Häufige Fragen</h1>
          <p style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>Alles was du über den Bewerbungsprozess wissen musst</p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === cat ? '' : 'glass text-white/40 hover:text-white/70'}`}
              style={activeCategory === cat ? { background: 'var(--theme-accent)', color: '#000' } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {filtered.map((section, si) => (
            <div key={si}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(var(--theme-accent-rgb), 0.08)', border: '1px solid rgba(var(--theme-accent-rgb), 0.12)', color: 'var(--theme-accent)' }}>
                  {section.icon}
                </div>
                <h2 className="text-lg font-semibold text-white">{section.category}</h2>
              </div>
              <div className="space-y-2">
                {section.questions.map((item, qi) => (
                  <AccordionItem key={qi} question={item.q} answer={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <GlassCard className="mt-16 p-8 text-center">
          <MessageCircle className="w-8 h-8 mx-auto mb-4" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }} />
          <h3 className="text-xl font-bold text-white mb-2">Noch Fragen?</h3>
          <p className="mb-6" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>Kontaktiere uns direkt auf dem Discord-Server!</p>
          <a
            href="https://discord.gg/g784tka9sh"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
            style={{ background: 'var(--theme-accent)', color: '#000' }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/></svg>
            Discord Server beitreten
          </a>
        </GlassCard>
      </div>
    </div>
  );
}
