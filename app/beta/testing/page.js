'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, FlaskConical, CheckCircle2, AlertCircle, ArrowLeft, 
  Sparkles, Zap, TrendingUp, Activity, Clock, Award
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
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

  const testCategories = [
    {
      name: 'UI/UX Testing',
      description: 'Teste die Benutzeroberfläche und das Design',
      features: [
        'Navbar Navigation und Dropdown',
        'Responsive Design auf verschiedenen Geräten',
        'Animationen und Übergänge',
        'Formular-Validierung'
      ],
      gradient: 'from-blue-500 to-cyan-500',
      icon: <Sparkles className="w-5 h-5" />
    },
    {
      name: 'Funktionale Tests',
      description: 'Überprüfe die Funktionalität der Features',
      features: [
        'Bewerbungssystem (Team, Praktikum, Beta)',
        'Admin-Dashboard und Verwaltung',
        'Profil und Einstellungen',
        'Discord Integration'
      ],
      gradient: 'from-purple-500 to-pink-500',
      icon: <Zap className="w-5 h-5" />
    },
    {
      name: 'Performance Testing',
      description: 'Teste Geschwindigkeit und Stabilität',
      features: [
        'Ladezeiten der Seiten',
        'API-Response-Zeiten',
        'Große Datenmengen',
        'Gleichzeitige Aktionen'
      ],
      gradient: 'from-orange-500 to-red-500',
      icon: <Activity className="w-5 h-5" />
    }
  ];

  const recentUpdates = [
    {
      date: 'Heute',
      title: 'Beta Portal Redesign',
      description: 'Neues Design im Stil der Startseite mit Animationen',
      status: 'new'
    },
    {
      date: 'Heute',
      title: 'Navbar Zentrierung',
      description: 'Navigation ist jetzt perfekt zentriert',
      status: 'new'
    },
    {
      date: 'Heute',
      title: 'Profil-Dropdown',
      description: 'Neues Dropdown-Menü mit Animationen',
      status: 'new'
    }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[150px] opacity-30"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' }}
        />
      </div>

      <div className="relative px-4 sm:px-6 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Back Button */}
          <Link 
            href="/beta"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Zurück zum Beta Portal</span>
          </Link>

          {/* Header */}
          <div className="mb-12 animate-fade-in-down">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Test-Bereich</h1>
                <p className="text-white/50 text-sm">Teste neue Features und gib Feedback</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Dein Status', value: 'Beta Tester', icon: <Award className="w-5 h-5" />, color: 'from-purple-500 to-pink-500' },
              { label: 'Verfügbar', value: 'Alle Features', icon: <CheckCircle2 className="w-5 h-5" />, color: 'from-green-500 to-emerald-500' },
              { label: 'Updates', value: 'Täglich', icon: <Clock className="w-5 h-5" />, color: 'from-blue-500 to-cyan-500' },
              { label: 'Priorität', value: 'Hoch', icon: <TrendingUp className="w-5 h-5" />, color: 'from-orange-500 to-red-500' }
            ].map((stat, index) => (
              <GlassCard 
                key={index} 
                className="p-4 animate-fade-in-up"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-white/50">{stat.label}</div>
              </GlassCard>
            ))}
          </div>

          {/* Test Categories */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              Test-Bereiche
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testCategories.map((category, index) => (
                <GlassCard 
                  key={index} 
                  className="p-6 animate-fade-in-up hover:scale-105 transition-all"
                  style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-4`}>
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                  <p className="text-white/60 text-sm mb-4">{category.description}</p>
                  <div className="space-y-2">
                    {category.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-white/50">
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Recent Updates */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              Neueste Updates
            </h2>
            <div className="space-y-4">
              {recentUpdates.map((update, index) => (
                <GlassCard 
                  key={index} 
                  className="p-6 animate-fade-in-up"
                  style={{ animationDelay: `${0.8 + index * 0.05}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">{update.title}</h3>
                        {update.status === 'new' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            Neu
                          </span>
                        )}
                      </div>
                      <p className="text-white/60 text-sm mb-2">{update.description}</p>
                      <p className="text-white/40 text-xs">{update.date}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* CTA */}
          <GlassCard className="p-8 text-center animate-fade-in-up" style={{ animationDelay: '1s' }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">Bug oder Problem gefunden?</h3>
            <p className="text-white/70 text-sm mb-6 max-w-2xl mx-auto">
              Dein Feedback ist wertvoll! Melde Bugs, schlage Verbesserungen vor oder teile deine Gedanken mit uns.
            </p>
            <Link
              href="/beta/feedback"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all hover:scale-105 shadow-lg shadow-purple-500/30"
            >
              Jetzt Feedback geben
            </Link>
          </GlassCard>

        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
