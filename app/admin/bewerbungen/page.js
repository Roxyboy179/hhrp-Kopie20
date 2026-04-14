'use client'

import { useState, useEffect } from 'react'
import { LogIn, Loader2, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminBewerbungenPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bewerbungen, setBewerbungen] = useState([])
  
  // Login State
  const [loginData, setLoginData] = useState({
    mitarbeiterNummer: '',
    password: ''
  })

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsAuthenticated(true)
      fetchBewerbungen(token)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('adminToken', data.token)
        setIsAuthenticated(true)
        fetchBewerbungen(data.token)
      } else {
        alert('❌ ' + (data.error || 'Login fehlgeschlagen'))
      }
    } catch (error) {
      console.error('Login Error:', error)
      alert('❌ Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  const fetchBewerbungen = async (token) => {
    try {
      const response = await fetch('/api/admin/bewerbungen', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setBewerbungen(data.bewerbungen || [])
      } else if (response.status === 401) {
        // Token expired
        localStorage.removeItem('adminToken')
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Fetch Error:', error)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    const token = localStorage.getItem('adminToken')
    
    try {
      const response = await fetch(`/api/admin/bewerbungen/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (response.ok) {
        // Update local state - MIT KORREKTEM PARSING!
        setBewerbungen(prev => 
          prev.map(b => {
            if (b.id === id) {
              // WICHTIG: formData korrekt parsen
              const updatedBewerbung = data.bewerbung
              if (updatedBewerbung.formData && typeof updatedBewerbung.formData === 'string') {
                try {
                  updatedBewerbung.formData = JSON.parse(updatedBewerbung.formData)
                } catch (e) {
                  console.error('Failed to parse formData:', e)
                }
              }
              return updatedBewerbung
            }
            return b
          })
        )
        alert('✅ Status aktualisiert!')
      } else {
        alert('❌ Fehler: ' + (data.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Status Update Error:', error)
      alert('❌ Netzwerkfehler')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
    setBewerbungen([])
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

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
        <div className="backdrop-blur-lg bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-12 w-full max-w-md">
          <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white text-center mb-8">
            Admin Login
          </h1>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-white font-semibold mb-2">
                Mitarbeiter-Nummer
              </label>
              <input
                type="text"
                value={loginData.mitarbeiterNummer}
                onChange={(e) => setLoginData(prev => ({ ...prev, mitarbeiterNummer: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                placeholder="MA-001"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Passwort
              </label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Wird eingeloggt...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Einloggen
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="backdrop-blur-lg bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Admin Panel
              </h1>
              <p className="text-purple-200">
                Bewerbungen verwalten und bearbeiten
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl font-semibold hover:bg-red-500/30 transition-all"
            >
              Abmelden
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 p-6">
            <p className="text-purple-300 text-sm mb-1">Gesamt</p>
            <p className="text-4xl font-bold text-white">{bewerbungen.length}</p>
          </div>
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 p-6">
            <p className="text-blue-300 text-sm mb-1">Eingereicht</p>
            <p className="text-4xl font-bold text-white">
              {bewerbungen.filter(b => b.status === 'Eingereicht').length}
            </p>
          </div>
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 p-6">
            <p className="text-yellow-300 text-sm mb-1">In Bearbeitung</p>
            <p className="text-4xl font-bold text-white">
              {bewerbungen.filter(b => b.status === 'In Bearbeitung').length}
            </p>
          </div>
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 p-6">
            <p className="text-green-300 text-sm mb-1">Akzeptiert</p>
            <p className="text-4xl font-bold text-white">
              {bewerbungen.filter(b => b.status === 'Akzeptiert').length}
            </p>
          </div>
        </div>

        {/* Bewerbungen Table */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-200">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-200">Discord Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-200">Alter</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-200">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-200">Datum</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-200">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {bewerbungen.map((bewerbung) => (
                  <tr key={bewerbung.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white font-mono text-sm">
                      #{bewerbung.id}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {bewerbung.formData?.discordName || '-'}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {bewerbung.formData?.alter || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg border text-sm font-semibold ${getStatusColor(bewerbung.status)}`}>
                        {bewerbung.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-purple-300 text-sm">
                      {new Date(bewerbung.createdAt).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(bewerbung.id, 'In Bearbeitung')}
                          className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 rounded-lg text-sm font-semibold hover:bg-yellow-500/30 transition-all"
                        >
                          Übernehmen
                        </button>
                        <button
                          onClick={() => handleStatusChange(bewerbung.id, 'Akzeptiert')}
                          className="px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg text-sm font-semibold hover:bg-green-500/30 transition-all"
                        >
                          Akzeptieren
                        </button>
                        <button
                          onClick={() => handleStatusChange(bewerbung.id, 'Abgelehnt')}
                          className="px-3 py-1 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-all"
                        >
                          Ablehnen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
