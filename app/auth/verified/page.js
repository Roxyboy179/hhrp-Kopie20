'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function VerifiedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#080808]">
      <div className="w-full max-w-md">
        <div
          className="glass rounded-2xl p-8 border border-white/10 text-center"
          style={{ background: 'rgba(8, 8, 8, 0.85)', backdropFilter: 'blur(20px)' }}
        >
          <div
            className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '2px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">E-Mail bestätigt!</h1>
          <p className="text-sm text-white/60 mb-6">
            Deine E-Mail-Adresse wurde erfolgreich verifiziert. Du kannst dich jetzt mit
            deiner E-Mail und deinem Passwort anmelden.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition"
            style={{ background: 'var(--theme-accent)', color: '#000' }}
          >
            Zur Startseite
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
