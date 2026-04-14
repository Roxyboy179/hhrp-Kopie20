'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { 
  FileText, Users, CheckCircle2, Clock, ArrowRight, 
  Shield, Zap, Target, Loader2, AlertTriangle, X
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, authError, clearError } = useAuth();
  const [stats, setStats] = useState({ total: 0, angenommen: 0, inBearbeitung: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/bewerbungen/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Stats fetch error:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Auth Error Banner */}
      {authError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-fade-in-down">
          <div className="bg-red-500/15 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-2xl shadow-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-200 text-sm font-medium">Anmeldung fehlgeschlagen</p>
              <p className="text-red-300/80 text-sm mt-1">{authError}</p>
            </div>
            <button 
              onClick={clearError} 
              className="text-red-400/60 hover:text-red-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="px-6 py-20 md:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">Hamburg Horizon Roleplay</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Werde Teil unseres
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Team & Community
              </span>
            </h1>
            
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Bewirb dich jetzt für unser Team und gestalte gemeinsam mit uns die beste Roleplay-Erfahrung in Hamburg!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              {user ? (
                <>
                  <Button 
                    size="lg"
                    onClick={() => router.push('/bewerbung')}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl h-12 px-8 text-lg"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Jetzt bewerben
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/meine-bewerbungen')}
                    className="rounded-xl h-12 px-8 text-lg border-white/10"
                  >
                    <Clock className="w-5 h-5 mr-2" />
                    Meine Bewerbungen
                  </Button>
                </>
              ) : (
                <Button 
                  size="lg"
                  onClick={() => router.push('/api/auth/discord')}
                  className="bg-[#5865F2] hover:bg-[#4752C4] rounded-xl h-12 px-8 text-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Mit Discord anmelden
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4 mt-16 max-w-4xl mx-auto">
            <GlassCard className="p-6 text-center">
              <FileText className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">{stats.total}</div>
              <div className="text-white/60 text-sm">Bewerbungen eingereicht</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">{stats.angenommen}</div>
              <div className="text-white/60 text-sm">Teammitglieder</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">{stats.inBearbeitung}</div>
              <div className="text-white/60 text-sm">In Bearbeitung</div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Warum bei uns bewerben?
            </h2>
            <p className="text-white/60 text-lg">
              Wir bieten dir die beste Team-Erfahrung im Roleplay
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard className="p-8">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Schnelle Bearbeitung</h3>
              <p className="text-white/60">
                Deine Bewerbung wird schnell und professionell von unserem Team bearbeitet.
              </p>
            </GlassCard>

            <GlassCard className="p-8">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Starke Community</h3>
              <p className="text-white/60">
                Werde Teil eines engagierten Teams mit einer großartigen Community.
              </p>
            </GlassCard>

            <GlassCard className="p-8">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Faire Chancen</h3>
              <p className="text-white/60">
                Jede Bewerbung wird fair und transparent von uns geprüft.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Bereit durchzustarten?
            </h2>
            <p className="text-white/60 text-lg mb-8">
              Bewirb dich jetzt und werde Teil unseres Teams!
            </p>
            {user ? (
              <Button 
                size="lg"
                onClick={() => router.push('/bewerbung')}
                className="bg-blue-600 hover:bg-blue-700 rounded-xl h-12 px-8"
              >
                Bewerbung starten
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button 
                size="lg"
                onClick={() => router.push('/api/auth/discord')}
                className="bg-[#5865F2] hover:bg-[#4752C4] rounded-xl h-12 px-8"
              >
                Mit Discord anmelden
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
