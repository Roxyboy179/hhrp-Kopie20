'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FlaskConical, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BetaTestingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBetaTester();
  }, []);

  const checkBetaTester = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      if (!data.user) {
        router.push('/');
        return;
      }

      const isBetaTester = data.user.roles?.includes('1494434149623136276');
      
      if (!isBetaTester) {
        toast.error('Keine Berechtigung', { 
          description: 'Diese Seite ist nur für Beta Tester zugänglich.' 
        });
        router.push('/');
        return;
      }

      setUser(data.user);
    } catch (e) {
      console.error(e);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const testFeatures = [
    {
      name: 'Neue Navbar Navigation',
      status: 'available',
      description: 'Teste die neue Navbar mit zentrierter Navigation und Profil-Dropdown'
    },
    {
      name: 'Beta Tester Feedback System',
      status: 'available',
      description: 'Melde Bugs und Verbesserungen direkt über das neue Feedback-System'
    },
    {
      name: 'Bewerbungs-Verwaltung',
      status: 'available',
      description: 'Teste die Admin-Funktion zum Öffnen/Schließen von Bewerbungen'
    },
    {
      name: 'Kommende Features',
      status: 'coming_soon',
      description: 'Weitere Test-Features werden in Kürze verfügbar sein'
    }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Test-Bereich</h1>
              <p className="text-white/50 text-sm">Experimentelle Features testen</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-8">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            Wichtige Hinweise
          </h3>
          <ul className="text-white/70 text-sm space-y-2 ml-7">
            <li>Teste alle Features ausgiebig und melde gefundene Bugs</li>
            <li>Experimentelle Features können instabil sein</li>
            <li>Dein Feedback ist sehr wertvoll für die Entwicklung</li>
          </ul>
        </div>

        {/* Test Features List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Verfügbare Test-Features</h2>
          
          {testFeatures.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{feature.name}</h3>
                    {feature.status === 'available' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verfügbar
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        Bald verfügbar
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Feature gefunden, das nicht funktioniert?</h3>
          <p className="text-white/70 text-sm mb-4">
            Melde es uns über das Feedback-System, damit wir es schnell beheben können.
          </p>
          <a
            href="/beta/feedback"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
          >
            Feedback senden
          </a>
        </div>
      </div>
    </div>
  );
}
