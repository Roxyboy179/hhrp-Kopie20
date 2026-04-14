'use client'

import { ArrowLeft, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function NutzungsbedingungenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück zur Startseite
        </Link>

        {/* Header */}
        <div className="glass-apple rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Nutzungsbedingungen
              </h1>
              <p className="text-gray-400">
                Letzte Aktualisierung: {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="glass-apple rounded-2xl shadow-xl p-8 space-y-8">
          {/* Section 1 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">
                1. Allgemeine Bestimmungen
              </h2>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Durch die Nutzung unseres Bewerbungssystems erklären Sie sich mit diesen Nutzungsbedingungen einverstanden.
              Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern.
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">
                2. Bewerbungsprozess
              </h2>
            </div>
            <p className="text-gray-400 leading-relaxed mb-4">
              Bei der Einreichung einer Bewerbung gelten folgende Regeln:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Alle Angaben müssen wahrheitsgemäß sein</li>
              <li>Sie dürfen nur eine aktive Bewerbung gleichzeitig haben</li>
              <li>Spam-Bewerbungen führen zu einer sofortigen Ablehnung</li>
              <li>Das Mindestalter beträgt 16 Jahre</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">
                3. Verhaltensregeln
              </h2>
            </div>
            <p className="text-gray-400 leading-relaxed mb-4">
              Folgendes Verhalten ist untersagt:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Beleidigungen oder Diskriminierung</li>
              <li>Mehrfach-Accounts oder Identitätstäuschung</li>
              <li>Missbrauch des Bewerbungssystems</li>
              <li>Verbreitung von unangemessenen Inhalten</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              4. Entscheidungen und Rückmeldung
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Alle Bewerbungsentscheidungen werden von unserem Admin-Team getroffen. 
              Sie erhalten eine Rückmeldung über Discord, sobald Ihre Bewerbung bearbeitet wurde.
              Die Entscheidung des Teams ist <strong className="text-white">final</strong>.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Haftungsausschluss
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Wir übernehmen keine Haftung für technische Probleme oder Verzögerungen im Bewerbungsprozess.
              Das System wird "wie es ist" bereitgestellt.
            </p>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              6. Kontakt
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Bei Fragen zu den Nutzungsbedingungen kontaktieren Sie uns bitte über Discord.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
