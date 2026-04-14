'use client'

import { Users, FileText, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] opacity-50">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
          </div>
        </div>

        {/* Content */}
        <div className="relative px-6 py-24 sm:px-12 lg:px-24">
          <div className="max-w-7xl mx-auto">
            {/* Glass Card Hero */}
            <div className="backdrop-blur-lg bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-12 mb-16">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">
                  Hamburg Horizon RP
                </h1>
                <p className="text-2xl text-purple-200 mb-8">
                  Willkommen bei unserem Bewerbungssystem
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link
                    href="/bewerbung"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    <FileText className="w-5 h-5" />
                    Jetzt bewerben
                  </Link>
                  <Link
                    href="/meine-bewerbungen"
                    className="inline-flex items-center gap-2 px-8 py-4 backdrop-blur-lg bg-white/20 text-white rounded-xl font-semibold border border-white/30 shadow-lg hover:bg-white/30 hover:scale-105 transition-all duration-300"
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
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Professionelles Team
                </h3>
                <p className="text-purple-200">
                  Unser erfahrenes Administrations-Team prüft jede Bewerbung sorgfältig und gibt schnelles Feedback.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Einfacher Prozess
                </h3>
                <p className="text-purple-200">
                  Fülle das Bewerbungsformular aus und verfolge deinen Status in Echtzeit über dein Dashboard.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Discord Integration
                </h3>
                <p className="text-purple-200">
                  Erhalte automatische Benachrichtigungen über Discord, sobald sich dein Bewerbungsstatus ändert.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24">
          <div className="flex flex-wrap gap-6 justify-center text-purple-200">
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
          <p className="text-center text-purple-300 mt-4">
            © 2025 Hamburg Horizon RP. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  )
}
