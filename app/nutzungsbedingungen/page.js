'use client';

import { FileText, AlertTriangle, Shield, Users, Ban, Check, Scale } from 'lucide-react';

export default function NutzungsbedingungenPage() {
  return (
    <div className="min-h-screen px-4 py-8 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img src="/icon-192.png" alt="Hamburg Horizon RP" className="w-16 h-16 rounded-2xl" />
            <div>
              <h1 className="text-4xl font-bold text-white">Nutzungsbedingungen</h1>
              <p className="text-white/60">Allgemeine Geschäftsbedingungen (AGB)</p>
            </div>
          </div>
        </div>

        {/* Einleitung */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Allgemeines</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              Willkommen bei Hamburg Horizon RP! Durch die Nutzung dieser Website und unseres Discord-Servers 
              erklären Sie sich mit den folgenden Nutzungsbedingungen einverstanden. Bitte lesen Sie diese 
              sorgfältig durch.
            </p>
            <p className="text-white/70 leading-relaxed">
              Hamburg Horizon RP ist ein privates Roleplay-Projekt und dient ausschließlich Unterhaltungszwecken. 
              Alle Inhalte sind fiktiv und stehen in keiner Verbindung zu realen Institutionen oder Personen.
            </p>
          </div>
        </div>

        {/* Geltungsbereich */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Geltungsbereich</h2>
          </div>

          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              Diese Nutzungsbedingungen gelten für:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
              <li>Die Nutzung dieser Website (Hamburg Horizon RP Portal)</li>
              <li>Die Nutzung des Hamburg Horizon RP Discord-Servers</li>
              <li>Alle damit verbundenen Dienste und Features</li>
              <li>Die Team-Bewerbungsportale und Profile</li>
            </ul>
          </div>
        </div>

        {/* Registrierung & Account */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Registrierung & Account</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Discord-Authentifizierung</h3>
              <p className="text-white/70 leading-relaxed">
                Um diese Website nutzen zu können, ist eine Anmeldung über Discord erforderlich. Sie sind 
                verpflichtet, wahrheitsgemäße Angaben zu machen und Ihren Account sicher aufzubewahren.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Mindestalter</h3>
              <p className="text-white/70 leading-relaxed">
                Die Nutzung unserer Dienste ist erst ab 16 Jahren gestattet. Durch die Registrierung bestätigen 
                Sie, dass Sie mindestens 16 Jahre alt sind.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Account-Sicherheit</h3>
              <p className="text-white/70 leading-relaxed">
                Sie sind für alle Aktivitäten verantwortlich, die über Ihren Account erfolgen. Bei Verdacht auf 
                unbefugte Nutzung informieren Sie uns bitte umgehend.
              </p>
            </div>
          </div>
        </div>

        {/* Verhaltensregeln */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Verhaltensregeln</h2>
          </div>

          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed mb-4">
              Bei der Nutzung unserer Dienste ist Folgendes untersagt:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <Ban className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300 mb-1">Verbotene Inhalte</p>
                  <p className="text-xs text-white/60">
                    Keine rassistischen, diskriminierenden, beleidigenden oder gewaltverherrlichenden Inhalte
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <Ban className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300 mb-1">Spam & Werbung</p>
                  <p className="text-xs text-white/60">
                    Keine unerwünschte Werbung, Spam oder Phishing-Versuche
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <Ban className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300 mb-1">Betrug & Manipulation</p>
                  <p className="text-xs text-white/60">
                    Keine Manipulation von Daten, Cheating oder unerlaubte Zugriffe
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <Ban className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300 mb-1">Rechtsverletzungen</p>
                  <p className="text-xs text-white/60">
                    Keine Urheberrechtsverletzungen oder Verstöße gegen geltendes Recht
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inhalte & Urheberrecht */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Inhalte & Urheberrecht</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Unsere Inhalte</h3>
              <p className="text-white/70 leading-relaxed">
                Alle auf dieser Website bereitgestellten Inhalte (Texte, Bilder, Logos, Designs) sind urheberrechtlich 
                geschützt und Eigentum von Hamburg Horizon RP oder werden mit Erlaubnis verwendet.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Nutzergenerierte Inhalte</h3>
              <p className="text-white/70 leading-relaxed">
                Durch das Hochladen von Inhalten (z.B. Bewerbungen, Profilbilder) räumen Sie uns das Recht ein, 
                diese Inhalte im Rahmen unserer Dienste zu verwenden, anzuzeigen und zu speichern.
              </p>
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
            <p className="text-white/70 leading-relaxed">
              Hamburg Horizon RP wird "wie besehen" bereitgestellt. Wir übernehmen keine Gewährleistung für:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
              <li>Die ständige Verfügbarkeit der Dienste</li>
              <li>Die Fehlerfreiheit der Website und Dienste</li>
              <li>Die Richtigkeit und Vollständigkeit der Inhalte</li>
              <li>Die Kompatibilität mit allen Geräten und Browsern</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-4">
              Wir haften nicht für Schäden, die durch die Nutzung oder Nicht-Nutzung unserer Dienste entstehen, 
              es sei denn, diese beruhen auf Vorsatz oder grober Fahrlässigkeit.
            </p>
          </div>
        </div>

        {/* Änderungen & Kündigung */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Änderungen & Kündigung</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Änderung der Bedingungen</h3>
              <p className="text-white/70 leading-relaxed">
                Wir behalten uns das Recht vor, diese Nutzungsbedingungen jederzeit zu ändern. Über wesentliche 
                Änderungen werden Sie per E-Mail oder durch einen Hinweis auf der Website informiert.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Account-Sperrung</h3>
              <p className="text-white/70 leading-relaxed">
                Wir behalten uns das Recht vor, Accounts bei Verstößen gegen diese Nutzungsbedingungen zu sperren 
                oder zu löschen. Ein Anspruch auf Wiederherstellung besteht nicht.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Beendigung der Nutzung</h3>
              <p className="text-white/70 leading-relaxed">
                Sie können Ihren Account jederzeit durch Kontaktaufnahme mit uns löschen lassen. Ihre Daten werden 
                dann gemäß unserer Datenschutzerklärung behandelt.
              </p>
            </div>
          </div>
        </div>

        {/* Schlussbestimmungen */}
        <div className="glass rounded-2xl p-8 border border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Schlussbestimmungen</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Anwendbares Recht</h3>
              <p className="text-white/70 leading-relaxed">
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Salvatorische Klausel</h3>
              <p className="text-white/70 leading-relaxed">
                Sollten einzelne Bestimmungen dieser Nutzungsbedingungen unwirksam sein, bleibt die Wirksamkeit 
                der übrigen Bestimmungen unberührt.
              </p>
            </div>
          </div>
        </div>

        {/* Hinweis */}
        <div className="glass rounded-2xl p-6 border border-green-500/20 bg-green-500/5 mb-6">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white/60 leading-relaxed">
                <span className="font-semibold text-white">Wichtig:</span> Durch die Nutzung unserer Dienste 
                erklären Sie sich mit diesen Nutzungsbedingungen einverstanden. Bei Fragen oder Unklarheiten 
                kontaktieren Sie uns bitte.
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
