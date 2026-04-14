'use client';

import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

export default function NutzungsbedingungenPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6 text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur Startseite
        </Button>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Nutzungsbedingungen</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Nutzungsbedingungen</h1>
          <p className="text-white/60">Zuletzt aktualisiert: {new Date().toLocaleDateString('de-DE')}</p>
        </div>

        <GlassCard className="p-6 md:p-8">
          <div className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">1. Geltungsbereich</h2>
              <p className="text-white/80 leading-relaxed">
                Diese Nutzungsbedingungen gelten für die Nutzung der Hamburg Horizon RP Team-Bewerbungsplattform. Mit der Nutzung der Plattform erklärst du dich mit diesen Bedingungen einverstanden.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">2. Registrierung und Zugang</h2>
              <p className="text-white/80 leading-relaxed mb-3">
                Für die Nutzung der Plattform ist eine Authentifizierung über Discord erforderlich. Du verpflichtest dich:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2">
                <li>Wahrheitsgemäße Angaben zu machen</li>
                <li>Deine Zugangsdaten vertraulich zu behandeln</li>
                <li>Uns über unbefugte Zugriffe zu informieren</li>
                <li>Nur einen Account pro Person zu erstellen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">3. Bewerbungen</h2>
              <p className="text-white/80 leading-relaxed mb-3">
                Bei der Einreichung von Bewerbungen gelten folgende Regeln:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2">
                <li>Alle Angaben müssen wahrheitsgemäß sein</li>
                <li>Bewerbungen dürfen keine beleidigenden Inhalte enthalten</li>
                <li>Du darfst dich mehrfach bewerben, wenn deine vorherige Bewerbung abgelehnt wurde</li>
                <li>Spam-Bewerbungen führen zur Sperrung</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">4. Verhaltensregeln</h2>
              <p className="text-white/80 leading-relaxed mb-3">
                Auf der Plattform ist untersagt:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2">
                <li>Belästigung anderer Nutzer oder Team-Mitglieder</li>
                <li>Verbreitung von Falschinformationen</li>
                <li>Versuch unbefugten Zugriffs auf Systeme</li>
                <li>Missbrauch der Plattform-Funktionen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">5. Haftungsausschluss</h2>
              <p className="text-white/80 leading-relaxed">
                Die Plattform wird "wie besehen" zur Verfügung gestellt. Wir übernehmen keine Garantie für ununterbrochene Verfügbarkeit oder Fehlerfreiheit. Eine Haftung für Schäden durch die Nutzung der Plattform ist ausgeschlossen, soweit gesetzlich zulässig.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">6. Änderungen</h2>
              <p className="text-white/80 leading-relaxed">
                Wir behalten uns vor, diese Nutzungsbedingungen jederzeit zu ändern. Änderungen werden auf der Plattform bekanntgegeben. Die fortgesetzte Nutzung nach einer Änderung gilt als Zustimmung.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">7. Kündigung</h2>
              <p className="text-white/80 leading-relaxed">
                Du kannst dein Konto jederzeit löschen. Wir behalten uns vor, Accounts bei Verstößen gegen diese Bedingungen zu sperren oder zu löschen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">8. Kontakt</h2>
              <p className="text-white/80 leading-relaxed">
                Bei Fragen zu den Nutzungsbedingungen kannst du uns über Discord kontaktieren.
              </p>
            </section>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
