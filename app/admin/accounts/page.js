'use client'

import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2, Loader2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminAccountsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState('')
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const [newAdmin, setNewAdmin] = useState({
    mitarbeiterNummer: '',
    email: '',
    discordUsername: '',
    password: '',
    roleName: 'Moderator'
  })

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/bewerbungen')
      return
    }
    
    setIsAuthenticated(true)
    fetchAdmins(token)
    checkUserRole(token)
  }, [])

  const checkUserRole = async (token) => {
    try {
      // Hier würden wir normalerweise die Rolle vom Server holen
      // Für jetzt: MA-001 ist Super Admin
      const response = await fetch('/api/admin/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentUserRole(data.role || 'Admin')
      }
    } catch (error) {
      console.error('Error checking role:', error)
      // Fallback: MA-001 is Super Admin
      setCurrentUserRole('Super Admin')
    }
  }

  const fetchAdmins = async (token) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (response.ok) {
        setAdmins(data.admins || [])
      }
    } catch (error) {
      console.error('Fetch Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    
    // Nur Super Admin kann Accounts erstellen
    if (currentUserRole !== 'Super Admin') {
      alert('❌ Nur Super Admins können neue Accounts erstellen!')
      return
    }

    const token = localStorage.getItem('adminToken')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAdmin)
      })

      const data = await response.json()

      if (response.ok) {
        alert('✅ Admin Account erfolgreich erstellt!')
        setShowCreateForm(false)
        setNewAdmin({
          mitarbeiterNummer: '',
          email: '',
          discordUsername: '',
          password: '',
          roleName: 'Moderator'
        })
        fetchAdmins(token)
      } else {
        alert('❌ Fehler: ' + (data.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Create Error:', error)
      alert('❌ Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAdmin = async (mitarbeiterNummer) => {
    // Nur Super Admin kann Accounts löschen
    if (currentUserRole !== 'Super Admin') {
      alert('❌ Nur Super Admins können Accounts löschen!')
      return
    }

    if (!confirm('Möchten Sie diesen Admin Account wirklich löschen?')) {
      return
    }

    const token = localStorage.getItem('adminToken')

    try {
      const response = await fetch(`/api/admin/accounts/${mitarbeiterNummer}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('✅ Admin Account gelöscht!')
        fetchAdmins(token)
      } else {
        const data = await response.json()
        alert('❌ Fehler: ' + (data.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Delete Error:', error)
      alert('❌ Netzwerkfehler')
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-red-500/10 text-red-300 border-red-500/30'
      case 'Admin':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30'
      case 'Moderator':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30'
      default:
        return 'bg-gray-500/10 text-gray-300 border-gray-500/30'
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-apple rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Admin Accounts Verwaltung
              </h1>
              <p className="text-gray-400">
                Verwalte Teammitglieder und Berechtigungen
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Ihre Rolle: <span className={`px-2 py-1 rounded ${getRoleBadgeColor(currentUserRole)}`}>{currentUserRole}</span>
              </p>
            </div>
            {currentUserRole === 'Super Admin' && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:scale-105 transition-transform"
              >
                <Plus className="w-5 h-5" />
                Neuer Admin
              </button>
            )}
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="glass-apple rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <UserPlus className="w-6 h-6" />
              Neuen Admin Account erstellen
            </h2>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Mitarbeiter-Nummer
                  </label>
                  <input
                    type="text"
                    value={newAdmin.mitarbeiterNummer}
                    onChange={(e) => setNewAdmin({ ...newAdmin, mitarbeiterNummer: e.target.value })}
                    required
                    placeholder="MA-002"
                    className="w-full px-4 py-3 glass-apple-dark rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Email/Username
                  </label>
                  <input
                    type="text"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    required
                    placeholder="admin@example.com"
                    className="w-full px-4 py-3 glass-apple-dark rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Discord Username
                  </label>
                  <input
                    type="text"
                    value={newAdmin.discordUsername}
                    onChange={(e) => setNewAdmin({ ...newAdmin, discordUsername: e.target.value })}
                    required
                    placeholder="username#1234"
                    className="w-full px-4 py-3 glass-apple-dark rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Passwort
                  </label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 glass-apple-dark rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Rolle
                </label>
                <select
                  value={newAdmin.roleName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, roleName: e.target.value })}
                  className="w-full px-4 py-3 glass-apple-dark rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gray-600"
                >
                  <option value="Moderator">Moderator</option>
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Wird erstellt...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Account erstellen
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 glass-apple-dark text-gray-300 rounded-xl font-semibold hover:bg-white/5 transition-all"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admins List */}
        <div className="glass-apple rounded-2xl overflow-hidden">
          {loading && admins.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Mitarbeiter-Nr.</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Discord</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Rolle</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                    {currentUserRole === 'Super Admin' && (
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Aktionen</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {admins.map((admin) => (
                    <tr key={admin.mitarbeiterNummer} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-mono text-sm">
                        {admin.mitarbeiterNummer}
                      </td>
                      <td className="px-6 py-4 text-white">
                        {admin.email}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {admin.discordUsername || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg border text-sm font-semibold ${getRoleBadgeColor(admin.roleName)}`}>
                          {admin.roleName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg border text-sm font-semibold ${
                          admin.isActive 
                            ? 'bg-green-500/10 text-green-300 border-green-500/30'
                            : 'bg-red-500/10 text-red-300 border-red-500/30'
                        }`}>
                          {admin.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      {currentUserRole === 'Super Admin' && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteAdmin(admin.mitarbeiterNummer)}
                            disabled={admin.roleName === 'Super Admin'}
                            className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-sm font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                            Löschen
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
