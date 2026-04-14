'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function NutzungsbedingungenPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.push('/')} className="mb-8 text-neutral-600 hover:text-neutral-300">
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>

        <div className="prose prose-invert prose-neutral max-w-none">
          <h1 className="text-4xl font-bold text-white mb-8">Nutzungsbedingungen</h1>
          
          <p className="mb-8" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
            Zuletzt aktualisiert: {new Date().toLocaleDateString('de-DE')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Geltungsbereich</h2>
            <p className="text-neutral-400" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              Diese Nutzungsbedingungen gelten für das Bewerbungsportal von Hamburg Horizon RP. 
              Mit der Nutzung des Portals akzeptieren Sie diese Bedingungen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Nutzung des Bewerbungsportals</h2>
            <h3 className="text-xl font-semibold text-white mb-3">2.1 Voraussetzungen</h3>
            <p className="text-neutral-400 mb-4">
              Für die Nutzung des Bewerbungsportals benötigen Sie:
            </p>
            <ul className="list-disc list-inside text-neutral-400 mb-4 space-y-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              <li>Einen Discord-Account</li>
              <li>Mitgliedschaft im Hamburg Horizon RP Discord-Server</li>
              <li>Mindestalter von 13 Jahren</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">2.2 Bewerbungsrichtlinien</h3>
            <p className="text-neutral-400 mb-4">
              Bei der Einreichung einer Bewerbung verpflichten Sie sich:
            </p>
            <ul className="list-disc list-inside text-neutral-400 space-y-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              <li>Wahrheitsgemäße und vollständige Angaben zu machen</li>
              <li>Nur EINE aktive Bewerbung gleichzeitig einzureichen</li>
              <li>Respektvoll und professionell zu kommunizieren</li>
              <li>Keine beleidigenden oder unangemessenen Inhalte zu verwenden</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. Bewerbungsprozess</h2>
            <h3 className="text-xl font-semibold text-white mb-3">3.1 Bewerbungstypen</h3>
            <p className="text-neutral-400 mb-4">
              Folgende Bewerbungstypen stehen zur Verfügung:
            </p>
            <ul className="list-disc list-inside text-neutral-400 mb-4 space-y-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              <li><strong className="text-white">Team-Bewerbung:</strong> Für neue Bewerber ohne Team-Zugehörigkeit</li>
              <li><strong className="text-white">Praktikum:</strong> Für Bewerber, die das Team kennenlernen möchten</li>
              <li><strong className="text-white">Uprank:</strong> Nur für bestehende Teammitglieder (Beförderung)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">3.2 Bearbeitungszeit</h3>
            <p className="text-neutral-400" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              Bewerbungen werden in der Regel innerhalb von 7-14 Tagen bearbeitet. 
              Eine Garantie auf Annahme besteht nicht.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Pflichten des Bewerbers</h2>
            <p className="text-neutral-400 mb-4">
              Als Bewerber verpflichten Sie sich:
            </p>
            <ul className="list-disc list-inside text-neutral-400 space-y-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              <li>Keine Mehrfachbewerbungen unter verschiedenen Namen einzureichen</li>
              <li>Auf Rückfragen zeitnah zu antworten</li>
              <li>Bei Rückzug der Bewerbung uns umgehend zu informieren</li>
              <li>Die Server-Regeln von Hamburg Horizon RP zu kennen und einzuhalten</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Ablehnung von Bewerbungen</h2>
            <p className="text-neutral-400 mb-4">
              Bewerbungen können abgelehnt werden bei:
            </p>
            <ul className="list-disc list-inside text-neutral-400 space-y-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              <li>Unvollständigen oder falschen Angaben</li>
              <li>Verstoß gegen die Server-Regeln</li>
              <li>Beleidigendem oder unangemessenem Verhalten</li>
              <li>Mehrfachbewerbungen</li>
              <li>Mangelnder Motivation oder Eignung</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Haftungsausschluss</h2>
            <p className="text-neutral-400 mb-4">
              Hamburg Horizon RP haftet nicht für:
            </p>
            <ul className="list-disc list-inside text-neutral-400 space-y-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              <li>Technische Störungen oder Ausfälle des Bewerbungsportals</li>
              <li>Verlust von Bewerbungsdaten durch höhere Gewalt</li>
              <li>Verzögerungen in der Bearbeitung</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">7. Ausschluss von der Nutzung</h2>
            <p className="text-neutral-400 mb-4">
              Wir behalten uns das Recht vor, Nutzer von der Nutzung des Portals auszuschließen bei:
            </p>
            <ul className="list-disc list-inside text-neutral-400 space-y-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              <li>Missbrauch des Bewerbungssystems</li>
              <li>Belästigung von Teammitgliedern</li>
              <li>Verstößen gegen diese Nutzungsbedingungen</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">8. Änderungen der Nutzungsbedingungen</h2>
            <p className="text-neutral-400" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              Wir behalten uns vor, diese Nutzungsbedingungen jederzeit zu ändern. 
              Änderungen werden auf dieser Seite veröffentlicht und gelten ab dem Zeitpunkt der Veröffentlichung.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">9. Kontakt</h2>
            <p className="text-neutral-400" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              Bei Fragen zu diesen Nutzungsbedingungen kontaktieren Sie uns bitte über unseren Discord-Server.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
