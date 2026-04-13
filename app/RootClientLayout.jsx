'use client';

import { AuthProvider, useAuth } from '@/components/providers/AuthProvider';
import { Navbar } from '@/components/shared/Navbar';
import Link from 'next/link';

export default function RootClientLayout({ children }) {
  return (
    <AuthProvider>
      <NavbarWrapper />
      <main className="pt-16 min-h-screen">{children}</main>
      <Footer />
    </AuthProvider>
  );
}

function NavbarWrapper() {
  const { user, loading } = useAuth();
  return <Navbar user={user} loading={loading} />;
}

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3">Hamburg Horizon RP</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Team-Bewerbungsportal für Hamburg Horizon Roleplay. Werde Teil unserer Community!
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Links</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-white/60 hover:text-white text-sm transition-colors">
                Startseite
              </Link>
              <Link href="/bewerbung" className="block text-white/60 hover:text-white text-sm transition-colors">
                Team-Bewerbung
              </Link>
              <Link href="/meine-bewerbungen" className="block text-white/60 hover:text-white text-sm transition-colors">
                Meine Bewerbungen
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Rechtliches</h3>
            <div className="space-y-2">
              <Link href="/datenschutz" className="block text-white/60 hover:text-white text-sm transition-colors">
                Datenschutzerklärung
              </Link>
              <Link href="/nutzungsbedingungen" className="block text-white/60 hover:text-white text-sm transition-colors">
                Nutzungsbedingungen
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-white/30 text-xs">
          © {new Date().getFullYear()} Hamburg Horizon RP. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
}
