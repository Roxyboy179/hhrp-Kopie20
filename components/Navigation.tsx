'use client'

import { Home, FileText, User, Shield, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Navigation() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [discordUser, setDiscordUser] = useState(null)

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken')
    setIsAdmin(!!token)

    // Check Discord user from localStorage
    const user = localStorage.getItem('discordUser')
    if (user) {
      try {
        setDiscordUser(JSON.parse(user))
      } catch (e) {
        console.error('Failed to parse discord user:', e)
      }
    }
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('discordUser')
    setIsAdmin(false)
    setDiscordUser(null)
    window.location.href = '/'
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <nav className="glass-apple-dark border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-white" />
            <span className="text-xl font-bold text-white">Hamburg Horizon RP</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive('/')
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Startseite</span>
            </Link>

            <Link
              href="/bewerbung"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive('/bewerbung')
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Bewerben</span>
            </Link>

            {discordUser && (
              <Link
                href="/meine-bewerbungen"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive('/meine-bewerbungen')
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Meine Bewerbungen</span>
              </Link>
            )}

            {isAdmin && (
              <>
                <Link
                  href="/admin/bewerbungen"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive('/admin/bewerbungen')
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin Panel</span>
                </Link>

                <Link
                  href="/admin/accounts"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive('/admin/accounts')
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Accounts</span>
                </Link>

                <Link
                  href="/einstellungen"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive('/einstellungen')
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Einstellungen</span>
                </Link>
              </>
            )}

            {/* User/Logout */}
            {(isAdmin || discordUser) && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-300 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Abmelden</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
