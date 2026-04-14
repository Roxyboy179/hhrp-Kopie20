'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function MeineBewerbungenPage() {
  const [bewerbungen, setBewerbungen] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBewerbungen()
  }, [])

  const fetchBewerbungen = async () => {
    try {
      // In Produktion: Discord User ID aus Auth Context holen
      const discordUserId = '123456789' // Placeholder

      const response = await fetch(`/api/meine-bewerbungen?discordUserId=${discordUserId}`)
      const data = await response.json()

      if (response.ok) {
        setBewerbungen(data.bewerbungen || [])
      }
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Eingereicht':
        return <Clock className="w-5 h-5 text-blue-400" />
      case 'In Bearbeitung':
        return <FileText className="w-5 h-5 text-yellow-400" />
      case 'Akzeptiert':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'Abgelehnt':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Eingereicht':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50'
      case 'In Bearbeitung':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
      case 'Akzeptiert':
        return 'bg-green-500/20 text-green-300 border-green-500/50'
      case 'Abgelehnt':
        return 'bg-red-500/20 text-red-300 border-red-500/50'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-purple-200 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück zur Startseite
        </Link>

        {/* Header */}
        <div className="backdrop-blur-lg bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Meine Bewerbungen
          </h1>
          <p className="text-purple-200">
            Verfolge hier den Status deiner eingereichten Bewerbungen.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && bewerbungen.length === 0 && (
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 p-12 text-center">
            <FileText className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Keine Bewerbungen vorhanden
            </h3>
            <p className="text-purple-200 mb-6">
              Du hast noch keine Bewerbung eingereicht.
            </p>
            <Link
              href="/bewerbung"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              <FileText className="w-5 h-5" />
              Jetzt bewerben
            </Link>
          </div>
        )}

        {/* Bewerbungen Liste */}
        {!loading && bewerbungen.length > 0 && (
          <div className="space-y-6">
            {bewerbungen.map((bewerbung) => (
              <div
                key={bewerbung.id}
                className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-xl p-6 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(bewerbung.status)}
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Bewerbung #{bewerbung.id}
                      </h3>
                      <p className="text-sm text-purple-300">
                        Eingereicht am {new Date(bewerbung.createdAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-xl border font-semibold ${getStatusColor(bewerbung.status)}`}>
                    {bewerbung.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-purple-300 mb-1">Discord Name</p>
                    <p className="text-white font-semibold">{bewerbung.formData?.discordName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-300 mb-1">Alter</p>
                    <p className="text-white font-semibold">{bewerbung.formData?.alter || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
