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
      const discordUserId = '123456789'

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
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30'
      case 'In Bearbeitung':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
      case 'Akzeptiert':
        return 'bg-green-500/10 text-green-300 border-green-500/30'
      case 'Abgelehnt':
        return 'bg-red-500/10 text-red-300 border-red-500/30'
      default:
        return 'bg-gray-500/10 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-12 px-6">
      <div className="max-w-6xl mx-auto">
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
          <h1 className="text-4xl font-bold text-white mb-2">
            Meine Bewerbungen
          </h1>
          <p className="text-gray-400">
            Verfolge hier den Status deiner eingereichten Bewerbungen.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && bewerbungen.length === 0 && (
          <div className="glass-apple rounded-2xl p-12 text-center">
            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Keine Bewerbungen vorhanden
            </h3>
            <p className="text-gray-400 mb-6">
              Du hast noch keine Bewerbung eingereicht.
            </p>
            <Link
              href="/bewerbung"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:scale-105 transition-transform"
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
                className="glass-apple rounded-2xl shadow-xl p-6 hover:shadow-2xl hover:shadow-gray-900/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(bewerbung.status)}
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Bewerbung #{bewerbung.id}
                      </h3>
                      <p className="text-sm text-gray-400">
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
                    <p className="text-sm text-gray-500 mb-1">Discord Name</p>
                    <p className="text-white font-semibold">{bewerbung.formData?.discordName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Alter</p>
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
