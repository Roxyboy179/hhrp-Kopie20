'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, FlaskConical, CheckCircle2, AlertCircle, ArrowLeft, 
  Sparkles, Zap, TrendingUp, Activity, Clock, Award
} from 'lucide-react';
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
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
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
      icon: <Activity className="w-5 h-5" />
    }
  ];

  const recentUpdates = [
    {
      date: 'Heute',
      title: 'Beta Portal Redesign',
      description: 'Neues Schwarz/Grau Glassmorphism Design',
      status: 'new'
    },
    {
      date: 'Heute',
      title: 'PWA Loading Optimierung',
      description: 'Ladezeiten um 90% reduziert',
      status: 'new'
    },
    {
      date: 'Heute',
      title: 'Zahlenformatierung',
      description: 'Stats werden jetzt als 1k, 1M angezeigt',
      status: 'new'
    }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[150px] opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)' }}
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
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
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
              { label: 'Dein Status', value: 'Beta Tester', icon: <Award className="w-5 h-5" /> },
              { label: 'Verfügbar', value: 'Alle Features', icon: <CheckCircle2 className="w-5 h-5" /> },
              { label: 'Updates', value: 'Täglich', icon: <Clock className="w-5 h-5" /> },
              { label: 'Priorität', value: 'Hoch', icon: <TrendingUp className="w-5 h-5" /> }
            ].map((stat, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl border backdrop-blur-sm animate-fade-in-up"
                style={{ 
                  animationDelay: `${0.1 + index * 0.05}s`,
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Test Categories */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              Test-Bereiche
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testCategories.map((category, index) => (
                <div
                  key={index}
                  className="p-6 rounded-2xl border backdrop-blur-sm animate-fade-in-up hover:scale-105 transition-all"
                  style={{ 
                    animationDelay: `${0.4 + index * 0.1}s`,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                  <p className="text-white/60 text-sm mb-4">{category.description}</p>
                  <div className="space-y-2">
                    {category.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-white/50">
                        <CheckCircle2 className="w-4 h-4 text-white/40 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                <div
                  key={index}
                  className="p-6 rounded-2xl border backdrop-blur-sm animate-fade-in-up"
                  style={{ 
                    animationDelay: `${0.8 + index * 0.05}s`,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))',
                        border: '1px solid rgba(255, 255, 255, 0.15)'
                      }}
                    >
                      <Sparkles className="w-5 h-5 text-white/80" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">{update.title}</h3>
                        {update.status === 'new' && (
                          <span 
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: 'rgba(255, 255, 255, 0.9)'
                            }}
                          >
                            Neu
                          </span>
                        )}
                      </div>
                      <p className="text-white/60 text-sm mb-2">{update.description}</p>
                      <p className="text-white/40 text-xs">{update.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div 
            className="p-8 text-center rounded-2xl border backdrop-blur-sm animate-fade-in-up" 
            style={{ 
              animationDelay: '1s',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
            >
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">Bug oder Problem gefunden?</h3>
            <p className="text-white/70 text-sm mb-6 max-w-2xl mx-auto">
              Dein Feedback ist wertvoll! Melde Bugs, schlage Verbesserungen vor oder teile deine Gedanken mit uns.
            </p>
            <Link
              href="/beta/feedback"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.12))',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
              }}
            >
              Jetzt Feedback geben
            </Link>
          </div>

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
