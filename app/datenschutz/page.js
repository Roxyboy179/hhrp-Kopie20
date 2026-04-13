'use client';

import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

export default function DatenschutzPage() {
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
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Datenschutz</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Datenschutzerklärung</h1>
          <p className="text-white/60">Zuletzt aktualisiert: {new Date().toLocaleDateString('de-DE')}</p>
        </div>

        <GlassCard className="p-6 md:p-8">
          <div className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">1. Datenerfassung</h2>
              <p className="text-white/80 leading-relaxed">
                Wir erfassen folgende Daten über Discord OAuth:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 mt-3">
                <li>Discord Benutzer-ID</li>
                <li>Discord Benutzername</li>
                <li>E-Mail-Adresse (falls freigegeben)</li>
                <li>Profilbild-URL</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">2. Verwendung der Daten</h2>
              <p className="text-white/80 leading-relaxed">
                Deine Daten werden ausschließlich für folgende Zwecke verwendet:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 mt-3">
                <li>Verwaltung deiner Team-Bewerbungen</li>
                <li>Authentifizierung und Zugang zum System</li>
                <li>Kommunikation bezüglich deiner Bewerbung</li>
                <li>Bereitstellung der Plattform-Funktionen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">3. Datenspeicherung</h2>
              <p className="text-white/80 leading-relaxed">
                Deine Daten werden sicher in unserer Datenbank (Supabase) gespeichert und sind durch moderne Sicherheitsmaßnahmen geschützt. Wir geben deine Daten nicht an Dritte weiter.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">4. Deine Rechte</h2>
              <p className="text-white/80 leading-relaxed mb-3">
                Du hast folgende Rechte bezüglich deiner Daten:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2">
                <li>Recht auf Auskunft über gespeicherte Daten</li>
                <li>Recht auf Berichtigung falscher Daten</li>
                <li>Recht auf Löschung deiner Daten</li>
                <li>Recht auf Datenübertragbarkeit</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">5. Cookies</h2>
              <p className="text-white/80 leading-relaxed">
                Wir verwenden Session-Cookies für die Authentifizierung. Diese sind technisch notwendig und werden nach dem Abmelden oder nach 7 Tagen automatisch gelöscht.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">6. Kontakt</h2>
              <p className="text-white/80 leading-relaxed">
                Bei Fragen zum Datenschutz oder zur Ausübung deiner Rechte kannst du uns über Discord kontaktieren.
              </p>
            </section>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
