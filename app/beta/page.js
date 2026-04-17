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
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const betaFeatures = [
    {
      title: 'Bug Reports & Feedback',
      description: 'Melde Bugs, schlage Verbesserungen vor oder teile allgemeines Feedback',
      icon: <Bug className="w-8 h-8" />,
      href: '/beta/feedback',
      gradient: 'from-red-500 via-orange-500 to-red-600',
      accentColor: 'rgba(239, 68, 68, 0.15)'
    },
    {
      title: 'Test-Bereich',
      description: 'Teste neue Features und experimentelle Funktionen',
      icon: <FlaskConical className="w-8 h-8" />,
      href: '/beta/testing',
      gradient: 'from-blue-500 via-cyan-500 to-blue-600',
      accentColor: 'rgba(59, 130, 246, 0.15)'
    },
    {
      title: 'Dokumentation',
      description: 'Anleitungen und Informationen für Beta Tester',
      icon: <FileText className="w-8 h-8" />,
      href: '/beta/docs',
      gradient: 'from-green-500 via-emerald-500 to-green-600',
      accentColor: 'rgba(34, 197, 94, 0.15)'
    }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[150px] opacity-30"
          style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Badge */}
          <div className="flex justify-center mb-6 animate-fade-in-down">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-sm">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">Beta Tester Portal</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
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
                <GlassCard className="h-full p-6 hover:scale-105 transition-all duration-300 overflow-hidden">
                  {/* Gradient Background */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(135deg, ${feature.accentColor}, transparent)` }}
                  />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
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
                </GlassCard>
              </Link>
            ))}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">Beta</div>
              <p className="text-white/50 text-sm">Dein Status</p>
            </GlassCard>
            
            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-green-400 mb-2">Aktiv</div>
              <p className="text-white/50 text-sm">Account Status</p>
            </GlassCard>
            
            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-2">Alle</div>
              <p className="text-white/50 text-sm">Verfügbare Features</p>
            </GlassCard>
          </div>

        </div>
      </section>

      {/* Add CSS animations */}
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
