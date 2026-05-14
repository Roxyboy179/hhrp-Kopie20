'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import AccountSettingsSection from '@/components/profile/AccountSettingsSection';

export default function MeinKontoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Discord-Login erforderlich
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?mode=discord&reason=register');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(135deg, #050505 0%, #0a0a0a 50%, #050505 100%)',
      }}
    >
      {/* Background glow */}
      <div className="fixed inset-0 -z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'rgba(var(--theme-accent-rgb), 0.3)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'rgba(34, 197, 94, 0.25)' }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Link
          href="/profil"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 md:mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Profil
        </Link>

        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Mein <span style={{ color: 'var(--theme-accent)' }}>Konto</span>
          </h1>
          <p className="text-sm md:text-base text-white/50">
            Verwalte deinen Login mit E-Mail-Adresse und Passwort
          </p>
        </div>

        <AccountSettingsSection discordEmail={user?.email} />
      </div>
    </div>
  );
}
