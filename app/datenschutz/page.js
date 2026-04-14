'use client'

import { ArrowLeft, Shield, Lock, Eye, UserCheck } from 'lucide-react'
import Link from 'next/link'

export default function DatenschutzPage() {
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
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Datenschutzerklärung
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
              <Eye className="w-6 h-6 text-gray-400" />
              <h2 className="text-2xl font-bold text-white">
                1. Erhebung und Speicherung personenbezogener Daten
              </h2>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Wir erheben und speichern folgende Daten im Rahmen des Bewerbungsprozesses:
            </p>
            <ul className="list-disc list-inside text-gray-400 mt-4 space-y-2 ml-4">
              <li>Discord-Username und User-ID</li>
              <li>Alter</li>
              <li>Bewerbungstexte (Motivation, RP-Erfahrung, Charaktergeschichte)</li>
              <li>Zeitpunkt der Bewerbung</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-gray-400" />
              <h2 className="text-2xl font-bold text-white">
                2. Verwendung der Daten
              </h2>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Die erhobenen Daten werden ausschließlich für folgende Zwecke verwendet:
            </p>
            <ul className="list-disc list-inside text-gray-400 mt-4 space-y-2 ml-4">
              <li>Bearbeitung und Bewertung Ihrer Bewerbung</li>
              <li>Kommunikation über Discord (Status-Updates)</li>
              <li>Verwaltung der Bewerbungen im Admin-Panel</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-gray-400" />
              <h2 className="text-2xl font-bold text-white">
                3. Weitergabe an Dritte
              </h2>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Ihre Daten werden <strong className="text-white">nicht</strong> an Dritte weitergegeben. 
              Der Zugriff ist ausschließlich unserem Administrations-Team vorbehalten.
            </p>
          </div>

          {/* Section 4 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-gray-400" />
              <h2 className="text-2xl font-bold text-white">
                4. Ihre Rechte
              </h2>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Sie haben das Recht auf:
            </p>
            <ul className="list-disc list-inside text-gray-400 mt-4 space-y-2 ml-4">
              <li>Auskunft über Ihre gespeicherten Daten</li>
              <li>Berichtigung oder Löschung Ihrer Daten</li>
              <li>Widerruf Ihrer Einwilligung</li>
            </ul>
            <p className="text-gray-400 mt-4 leading-relaxed">
              Für Anfragen kontaktieren Sie uns bitte über Discord.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Kontakt
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Bei Fragen zum Datenschutz wenden Sie sich bitte an unser Team auf Discord.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
