'use client'

import { useState } from 'react'
import { ArrowLeft, User, Lock, Loader2, Save } from 'lucide-react'
import Link from 'next/link'

export default function EinstellungenPage() {
  const [loading, setLoading] = useState(false)
  const [usernameData, setUsernameData] = useState({ newUsername: '' })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleUsernameChange = async (e) => {
    e.preventDefault()
    setLoading(true)

    const token = localStorage.getItem('adminToken')
    if (!token) {
      alert('❌ Nicht eingeloggt')
      return
    }

    try {
      const response = await fetch('/api/settings/username', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(usernameData)
      })

      const data = await response.json()

      if (response.ok) {
        alert('✅ Username erfolgreich geändert!')
        setUsernameData({ newUsername: '' })
      } else {
        alert('❌ Fehler: ' + (data.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('❌ Passwörter stimmen nicht überein')
      return
    }

    setLoading(true)

    const token = localStorage.getItem('adminToken')
    if (!token) {
      alert('❌ Nicht eingeloggt')
      return
    }

    try {
      const response = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      })

      const data = await response.json()

      if (response.ok) {
        alert('✅ Passwort erfolgreich geändert!')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        alert('❌ Fehler: ' + (data.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Netzwerkfehler')
    } finally {
      setLoading(false)
    }
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

        {/* Header */}
        <div className="backdrop-blur-lg bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Einstellungen
          </h1>
          <p className="text-purple-200">
            Verwalte deine Account-Einstellungen
          </p>
        </div>

        {/* Username Ändern */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">
              Username ändern
            </h2>
          </div>
          <form onSubmit={handleUsernameChange} className="space-y-4">
            <div>
              <label className="block text-white font-semibold mb-2">
                Neuer Username
              </label>
              <input
                type="text"
                value={usernameData.newUsername}
                onChange={(e) => setUsernameData({ newUsername: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                placeholder="Neuer Username"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Speichern
                </>
              )}
            </button>
          </form>
        </div>

        {/* Passwort Ändern */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">
              Passwort ändern
            </h2>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-white font-semibold mb-2">
                Aktuelles Passwort
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">
                Neues Passwort
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">
                Neues Passwort bestätigen
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Speichern
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
