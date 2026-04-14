'use client'

import { Users, FileText, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] opacity-30">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-gray-600 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
            <div className="absolute top-0 -right-4 w-96 h-96 bg-gray-700 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gray-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000" />
          </div>
        </div>

        {/* Content */}
        <div className="relative px-6 py-24 sm:px-12 lg:px-24">
          <div className="max-w-7xl mx-auto">
            {/* Glass Card Hero */}
            <div className="glass-apple rounded-3xl shadow-2xl p-12 mb-16 hover:shadow-gray-900/50 transition-all duration-300">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">
                  Hamburg Horizon RP
                </h1>
                <p className="text-2xl text-gray-300 mb-8">
                  Willkommen bei unserem Bewerbungssystem
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link
                    href="/bewerbung"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    <FileText className="w-5 h-5" />
                    Jetzt bewerben
                  </Link>
                  <Link
                    href="/meine-bewerbungen"
                    className="inline-flex items-center gap-2 px-8 py-4 glass-apple text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-all duration-300"
                  >
                    <Clock className="w-5 h-5" />
                    Meine Bewerbungen
                  </Link>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="glass-apple rounded-2xl p-8 hover:shadow-xl hover:shadow-gray-900/50 transition-all duration-300 group">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Professionelles Team
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Unser erfahrenes Administrations-Team prüft jede Bewerbung sorgfältig und gibt schnelles Feedback.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-apple rounded-2xl p-8 hover:shadow-xl hover:shadow-gray-900/50 transition-all duration-300 group">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Einfacher Prozess
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Fülle das Bewerbungsformular aus und verfolge deinen Status in Echtzeit über dein Dashboard.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-apple rounded-2xl p-8 hover:shadow-xl hover:shadow-gray-900/50 transition-all duration-300 group">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Discord Integration
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Erhalte automatische Benachrichtigungen über Discord, sobald sich dein Bewerbungsstatus ändert.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24">
          <div className="flex flex-wrap gap-6 justify-center text-gray-400">
            <Link href="/datenschutz" className="hover:text-white transition-colors">
              Datenschutz
            </Link>
            <Link href="/nutzungsbedingungen" className="hover:text-white transition-colors">
              Nutzungsbedingungen
            </Link>
            <Link href="/admin/bewerbungen" className="hover:text-white transition-colors">
              Admin Login
            </Link>
          </div>
          <p className="text-center text-gray-500 mt-4">
            © 2025 Hamburg Horizon RP. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  )
}
