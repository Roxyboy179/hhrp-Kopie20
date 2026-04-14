'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function DatenschutzPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.push('/')} className="mb-8 text-neutral-600 hover:text-neutral-300">
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>

        <div className="prose prose-invert prose-neutral max-w-none" style={{ '--tw-prose-body': 'rgba(var(--theme-accent-rgb), 0.45)' }}>
          <h1 className="text-4xl font-bold text-white mb-8">Datenschutzerklärung</h1>
          
          <p className="mb-8" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
            Zuletzt aktualisiert: {new Date().toLocaleDateString('de-DE')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Verantwortlicher</h2>
            <p className="text-neutral-400" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
              Hamburg Horizon RP<br />
              Kontakt: Über Discord-Server
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Erhebung und Speicherung personenbezogener Daten</h2>
            <p className="text-neutral-400 mb-4">
              Beim Besuch unserer Website und bei der Nutzung des Bewerbungsportals werden folgende Daten erhoben:
            </p>
            <h3 className="text-xl font-semibold text-white mb-3">2.1 Discord OAuth2</h3>
            <p className="text-neutral-400 mb-4">
              Für die Anmeldung nutzen wir Discord OAuth2. Dabei werden folgende Daten von Discord übermittelt:
            </p>
            <ul className="list-disc list-inside text-neutral-400 mb-4 space-y-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              <li>Discord User-ID</li>
              <li>Discord Benutzername</li>
              <li>Discord Avatar</li>
              <li>E-Mail-Adresse</li>
              <li>Discord Server-Rollen (zur Berechtigungsprüfung)</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-white mb-3">2.2 Bewerbungsdaten</h3>
            <p className="text-neutral-400 mb-4">
              Bei Einreichung einer Bewerbung speichern wir die von Ihnen eingegebenen Daten:
            </p>
            <ul className="list-disc list-inside text-neutral-400 mb-4 space-y-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              <li>Vorname</li>
              <li>Alter</li>
              <li>Roblox-Benutzername</li>
              <li>Bewerbungsformular-Antworten</li>
              <li>Zeitstempel der Einreichung</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. Zweck der Datenverarbeitung</h2>
            <p className="text-neutral-400 mb-4">
              Wir verwenden Ihre Daten ausschließlich für folgende Zwecke:
            </p>
            <ul className="list-disc list-inside text-neutral-400 space-y-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              <li>Authentifizierung und Anmeldung</li>
              <li>Bearbeitung Ihrer Bewerbung</li>
              <li>Kontaktaufnahme via Discord bei Status-Änderungen</li>
              <li>Verwaltung von Teammitgliedern und Bewerbern</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Rechtsgrundlage</h2>
            <p className="text-neutral-400" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) sowie zur Erfüllung vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Speicherdauer</h2>
            <p className="text-neutral-400 mb-4">
              Ihre Bewerbungsdaten werden gespeichert:
            </p>
            <ul className="list-disc list-inside text-neutral-400 space-y-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              <li>Bei Annahme: Solange Sie Teammitglied sind</li>
              <li>Bei Ablehnung: Bis zu 6 Monate nach Ablehnung</li>
              <li>Bei Rückzug: Sofortige Löschung auf Anfrage möglich</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Weitergabe von Daten</h2>
            <p className="text-neutral-400 mb-4">
              Eine Weitergabe Ihrer Daten an Dritte erfolgt nur:
            </p>
            <ul className="list-disc list-inside text-neutral-400 space-y-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              <li>An Discord (nur für Benachrichtigungen über Webhooks)</li>
              <li>An Hosting-Provider (Vercel, Supabase) zur technischen Bereitstellung</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">7. Ihre Rechte</h2>
            <p className="text-neutral-400 mb-4">
              Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
            </p>
            <ul className="list-disc list-inside text-neutral-400 space-y-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              <li><strong className="text-white">Auskunftsrecht:</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen</li>
              <li><strong className="text-white">Berichtigungsrecht:</strong> Sie können die Berichtigung unrichtiger Daten verlangen</li>
              <li><strong className="text-white">Löschungsrecht:</strong> Sie können die Löschung Ihrer Daten verlangen</li>
              <li><strong className="text-white">Widerspruchsrecht:</strong> Sie können der Verarbeitung widersprechen</li>
              <li><strong className="text-white">Datenübertragbarkeit:</strong> Sie können Ihre Daten in einem strukturierten Format erhalten</li>
            </ul>
            <p className="text-neutral-400 mt-4">
              Zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte über unseren Discord-Server.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">8. Cookies</h2>
            <p className="text-neutral-400 mb-4">
              Unsere Website verwendet folgende Cookies:
            </p>
            <ul className="list-disc list-inside text-neutral-400 space-y-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              <li><strong className="text-white">auth_token:</strong> Session-Cookie für Anmeldung (7 Tage Gültigkeit)</li>
              <li><strong className="text-white">admin_token:</strong> Session-Cookie für Admin-Panel (7 Tage Gültigkeit)</li>
              <li><strong className="text-white">cookie_consent:</strong> Speichert Ihre Cookie-Präferenzen (365 Tage)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">9. Beschwerderecht</h2>
            <p className="text-neutral-400" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten zu beschweren.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
