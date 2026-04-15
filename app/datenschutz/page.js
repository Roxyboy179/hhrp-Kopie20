'use client';

import { Shield, Lock, Eye, Database, Cookie, Mail, FileText, Scale } from 'lucide-react';

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen px-4 py-8 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img src="/icon-192.png" alt="Hamburg Horizon RP" className="w-16 h-16 rounded-2xl" />
            <div>
              <h1 className="text-4xl font-bold text-white">Datenschutzerklärung</h1>
              <p className="text-white/60">Datenschutz nach DSGVO</p>
            </div>
          </div>
        </div>

        {/* Einleitung */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Datenschutz auf einen Blick</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Allgemeine Hinweise</h3>
              <p className="text-white/70 leading-relaxed">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen 
                Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit 
                denen Sie persönlich identifiziert werden können.
              </p>
            </div>
          </div>
        </div>

        {/* Datenerfassung */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Datenerfassung auf dieser Website</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Wer ist verantwortlich für die Datenerfassung?</h3>
              <p className="text-white/70 leading-relaxed">
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
                können Sie dem Impressum dieser Website entnehmen.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Wie erfassen wir Ihre Daten?</h3>
              <p className="text-white/70 leading-relaxed mb-3">
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.B. 
                um Daten handeln, die Sie in ein Kontaktformular eingeben.
              </p>
              <p className="text-white/70 leading-relaxed">
                Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere 
                IT-Systeme erfasst. Das sind vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder 
                Uhrzeit des Seitenaufrufs).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Wofür nutzen wir Ihre Daten?</h3>
              <p className="text-white/70 leading-relaxed">
                Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. 
                Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Welche Rechte haben Sie bezüglich Ihrer Daten?</h3>
              <p className="text-white/70 leading-relaxed">
                Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer 
                gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung 
                oder Löschung dieser Daten zu verlangen.
              </p>
            </div>
          </div>
        </div>

        {/* Discord Integration */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Discord OAuth Integration</h2>
          </div>

          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              Diese Website nutzt die OAuth-Authentifizierung von Discord. Wenn Sie sich über Discord anmelden, 
              erhalten wir folgende Informationen:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
              <li>Discord Benutzer-ID</li>
              <li>Benutzername und Diskriminator</li>
              <li>E-Mail-Adresse (falls freigegeben)</li>
              <li>Profilbild</li>
            </ul>
            <p className="text-white/70 leading-relaxed">
              Diese Daten werden ausschließlich zur Authentifizierung und zur Bereitstellung der Funktionen dieser 
              Website verwendet. Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO.
            </p>
          </div>
        </div>

        {/* Cookies */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Cookie className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Cookies</h2>
          </div>

          <p className="text-white/70 leading-relaxed mb-4">
            Diese Website verwendet Cookies. Das sind kleine Textdateien, die Ihr Webbrowser auf Ihrem Endgerät 
            speichert. Cookies helfen uns dabei, unser Angebot nutzerfreundlicher, effektiver und sicherer zu machen.
          </p>
          <p className="text-white/70 leading-relaxed">
            Einige Cookies sind "Session-Cookies". Solche Cookies werden nach Ende Ihrer Browser-Sitzung von selbst 
            gelöscht. Hingegen bleiben andere Cookies auf Ihrem Endgerät bestehen, bis Sie diese selbst löschen. 
            Solche Cookies helfen uns, Sie bei Rückkehr auf unserer Website wiederzuerkennen.
          </p>
        </div>

        {/* Server-Log-Dateien */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Server-Log-Dateien</h2>
          </div>

          <p className="text-white/70 leading-relaxed mb-4">
            Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, 
            die Ihr Browser automatisch an uns übermittelt. Dies sind:
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/70 ml-4 mb-4">
            <li>Browsertyp und Browserversion</li>
            <li>Verwendetes Betriebssystem</li>
            <li>Referrer URL</li>
            <li>Hostname des zugreifenden Rechners</li>
            <li>Uhrzeit der Serveranfrage</li>
            <li>IP-Adresse</li>
          </ul>
          <p className="text-white/70 leading-relaxed">
            Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung dieser 
            Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
          </p>
        </div>

        {/* Kontakt */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Kontakt & Anfragen</h2>
          </div>

          <p className="text-white/70 leading-relaxed mb-4">
            Wenn Sie uns per E-Mail kontaktieren, wird Ihre Anfrage inklusive aller daraus hervorgehenden 
            personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung Ihres Anliegens bei uns gespeichert 
            und verarbeitet.
          </p>
          <p className="text-white/70 leading-relaxed">
            Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage 
            mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen 
            erforderlich ist.
          </p>
        </div>

        {/* Ihre Rechte */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Ihre Rechte</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Auskunftsrecht</h3>
              <p className="text-white/70 leading-relaxed">
                Sie haben das Recht, Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten zu verlangen.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Berichtigung & Löschung</h3>
              <p className="text-white/70 leading-relaxed">
                Sie haben das Recht, unverzüglich die Berichtigung unrichtiger oder Vervollständigung Ihrer bei uns 
                gespeicherten personenbezogenen Daten zu verlangen. Sie haben außerdem das Recht, die Löschung Ihrer 
                personenbezogenen Daten zu verlangen.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Einschränkung der Verarbeitung</h3>
              <p className="text-white/70 leading-relaxed">
                Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Widerspruchsrecht</h3>
              <p className="text-white/70 leading-relaxed">
                Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen 
                die Verarbeitung Sie betreffender personenbezogener Daten Widerspruch einzulegen.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Beschwerderecht</h3>
              <p className="text-white/70 leading-relaxed">
                Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren, wenn Sie der Ansicht sind, dass 
                die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt.
              </p>
            </div>
          </div>
        </div>

        {/* Hinweis */}
        <div className="glass rounded-2xl p-6 border border-blue-500/20 bg-blue-500/5 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white/60 leading-relaxed">
                <span className="font-semibold text-white">Hinweis:</span> Hamburg Horizon RP ist ein 
                privates Roleplay-Projekt auf Discord und dient ausschließlich Unterhaltungszwecken. 
                Alle verarbeiteten Daten werden ausschließlich zum Betrieb dieser Website verwendet.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 mb-4">
          <p className="text-white/40 text-sm">
             © 2026 Hamburg Horizon RP - Alle Rechte vorbehalten
          </p>
        </div>
      </div>
    </div>
  );
}
