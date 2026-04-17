'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Bug, FlaskConical, FileText, Shield, ChevronRight, Sparkles, Zap, Target } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { toast } from 'sonner';

export default function BetaHomePage() {
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

  const betaFeatures = [
    {
      title: 'Bug Reports & Feedback',
      description: 'Melde Bugs, schlage Verbesserungen vor oder teile allgemeines Feedback',
      icon: <Bug className="w-8 h-8" />,
      href: '/beta/feedback'
    },
    {
      title: 'Test-Bereich',
      description: 'Teste neue Features und experimentelle Funktionen',
      icon: <FlaskConical className="w-8 h-8" />,
      href: '/beta/testing'
    },
    {
      title: 'Dokumentation',
      description: 'Anleitungen und Informationen für Beta Tester',
      icon: <FileText className="w-8 h-8" />,
      href: '/beta/docs'
    }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Ambient Glow - Monochrome */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[150px] opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)' }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Badge */}
          <div className="flex justify-center mb-6 animate-fade-in-down">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
              <Shield className="w-4 h-4 text-white/80" />
              <span className="text-sm font-medium text-white/90">Beta Tester Portal</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                Willkommen zurück
              </span>
              <br />
              <span className="text-white/90">{user?.globalName || user?.username}</span>
            </h1>
            <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Als Beta Tester bist du ein wichtiger Teil unserer Entwicklung. Dein Feedback hilft uns, 
              die Plattform zu verbessern.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {betaFeatures.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="group relative animate-fade-in-up"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <div 
                  className="h-full p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 overflow-hidden relative"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Hover glow */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                    style={{ background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.1), transparent 70%)' }}
                  />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      <div className="text-white">{feature.icon}</div>
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/60 text-sm mb-4 leading-relaxed">{feature.description}</p>
                    
                    {/* Arrow */}
                    <div className="flex items-center gap-2 text-white/40 group-hover:text-white/80 group-hover:gap-3 transition-all">
                      <span className="text-sm font-medium">Öffnen</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            {[
              { icon: Sparkles, label: 'Beta', sublabel: 'Dein Status', value: 'Beta' },
              { icon: Zap, label: 'Aktiv', sublabel: 'Account Status', value: 'Aktiv' },
              { icon: Target, label: 'Alle', sublabel: 'Verfügbare Features', value: 'Alle' }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={i}
                  className="p-6 text-center rounded-2xl border backdrop-blur-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02))',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <Icon className="w-6 h-6 text-white/80" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <p className="text-white/50 text-sm">{stat.sublabel}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      <style jsx global>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
