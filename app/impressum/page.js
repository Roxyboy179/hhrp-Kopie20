'use client';

import { Building2, Mail, MapPin, Scale, Shield, FileText } from 'lucide-react';

export default function ImpressumPage() {
  return (
    <div className="min-h-screen px-4 py-8 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Impressum</h1>
              <p className="text-white/60">Angaben gemäß § 5 TMG</p>
            </div>
          </div>
        </div>

        {/* Betreiber Information */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Betreiber</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Name</p>
                <p className="text-white font-medium text-lg">Joel Lading</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Anschrift</p>
                <p className="text-white font-medium">Schrotebogen 6</p>
                <p className="text-white font-medium">39126 Magdeburg</p>
                <p className="text-white/60 text-sm mt-1">Deutschland</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Kontakt</p>
                <a 
                  href="mailto:roxyboy2474@gmail.com"
                  className="text-white font-medium hover:text-blue-400 transition-colors"
                >
                  roxyboy2474@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Haftungsausschluss */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Haftungsausschluss</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Haftung für Inhalte</h3>
              <p className="text-white/70 leading-relaxed">
                Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
                Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. 
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten 
                nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als 
                Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde 
                Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige 
                Tätigkeit hinweisen.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Haftung für Links</h3>
              <p className="text-white/70 leading-relaxed">
                Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen 
                Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. 
                Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der 
                Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf 
                mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der 
                Verlinkung nicht erkennbar.
              </p>
            </div>
          </div>
        </div>

        {/* Urheberrecht */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Urheberrecht</h2>
          </div>

          <p className="text-white/70 leading-relaxed mb-4">
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen 
            dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art 
            der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen 
            Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>

          <p className="text-white/70 leading-relaxed">
            Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die 
            Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche 
            gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, 
            bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen 
            werden wir derartige Inhalte umgehend entfernen.
          </p>
        </div>

        {/* EU-Streitschlichtung */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Streitschlichtung</h2>
          </div>

          <p className="text-white/70 leading-relaxed mb-4">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
            <a 
              href="https://ec.europa.eu/consumers/odr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors ml-1"
            >
              https://ec.europa.eu/consumers/odr
            </a>
          </p>

          <p className="text-white/70 leading-relaxed">
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </div>

        {/* Hinweis */}
        <div className="glass rounded-2xl p-6 border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white/60 leading-relaxed">
                <span className="font-semibold text-white">Hinweis:</span> Hamburg Horizon RP ist ein 
                privates Roleplay-Projekt auf Discord und dient ausschließlich Unterhaltungszwecken. 
                Alle Inhalte sind fiktiv und stehen in keiner Verbindung zu realen Institutionen oder 
                Personen.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 mb-4">
          <p className="text-white/40 text-sm">
            © 2024 Hamburg Horizon RP - Alle Rechte vorbehalten
          </p>
        </div>
      </div>
    </div>
  );
}
