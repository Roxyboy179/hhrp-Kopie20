'use client'

import { useState } from 'react'
import { Send, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function BewerbungPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    discordName: '',
    alter: '',
    warumServer: '',
    rpErfahrung: '',
    charakterGeschichte: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Discord User ID aus Discord Name extrahieren (vereinfacht)
      // In Produktion: Discord OAuth verwenden
      const discordUserId = '123456789' // Placeholder

      const response = await fetch('/api/bewerbung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          discordUserId
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('✅ Bewerbung erfolgreich eingereicht!')
        router.push('/meine-bewerbungen')
      } else {
        alert('❌ Fehler: ' + (data.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Fehler:', error)
      alert('❌ Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-purple-200 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück zur Startseite
        </Link>

        {/* Form Card */}
        <div className="backdrop-blur-lg bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Bewerbungsformular
          </h1>
          <p className="text-purple-200 mb-8">
            Fülle alle Felder sorgfältig aus. Deine Bewerbung wird von unserem Team geprüft.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Discord Name */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Discord Name
              </label>
              <input
                type="text"
                name="discordName"
                value={formData.discordName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                placeholder="Dein Discord Name#1234"
              />
            </div>

            {/* Alter */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Alter
              </label>
              <input
                type="number"
                name="alter"
                value={formData.alter}
                onChange={handleChange}
                required
                min="16"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                placeholder="Mindestalter: 16"
              />
            </div>

            {/* Warum Server */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Warum möchtest du auf Hamburg Horizon spielen?
              </label>
              <textarea
                name="warumServer"
                value={formData.warumServer}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm resize-none"
                placeholder="Erzähle uns, warum du Teil unserer Community werden möchtest..."
              />
            </div>

            {/* RP Erfahrung */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Hast du bereits Roleplay-Erfahrung?
              </label>
              <textarea
                name="rpErfahrung"
                value={formData.rpErfahrung}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm resize-none"
                placeholder="Beschreibe deine bisherigen RP-Erfahrungen..."
              />
            </div>

            {/* Charakter Geschichte */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Charakter Hintergrundgeschichte
              </label>
              <textarea
                name="charakterGeschichte"
                value={formData.charakterGeschichte}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm resize-none"
                placeholder="Erzähle die Geschichte deines Charakters..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Bewerbung absenden
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
