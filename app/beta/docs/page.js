'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, FileText, BookOpen, CheckCircle2, Info, ArrowLeft, HelpCircle } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { toast } from 'sonner';

export default function BetaDocsPage() {
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

  const docs = [
    {
      title: 'Willkommen als Beta Tester',
      icon: <BookOpen className="w-6 h-6" />,
      content: 'Als Beta Tester hast du die einzigartige Möglichkeit, neue Features vor allen anderen zu testen und direkten Einfluss auf die Entwicklung zu nehmen.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Deine Aufgaben',
      icon: <CheckCircle2 className="w-6 h-6" />,
      content: 'Teste neue Features gründlich, melde Bugs über das Feedback-System, schlage Verbesserungen vor und teile deine Erfahrungen mit dem Team.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Feedback geben',
      icon: <HelpCircle className="w-6 h-6" />,
      content: 'Nutze das Feedback-System unter "Bug Reports & Feedback". Wähle zwischen Bug-Reports, Verbesserungsvorschlägen oder allgemeinem Feedback. Sei so detailliert wie möglich.',
      gradient: 'from-green-500 to-emerald-500'
    }
  ];

  const guidelines = [
    {
      title: 'Wie melde ich einen Bug?',
      steps: [
        'Gehe zu "Bug Reports & Feedback"',
        'Wähle "Bug melden" als Feedback-Typ',
        'Gib einen aussagekräftigen Titel an',
        'Beschreibe das Problem detailliert',
        'Füge Schritte zur Reproduktion hinzu',
        'Wähle die passende Priorität'
      ]
    },
    {
      title: 'Best Practices',
      steps: [
        'Teste Features auf verschiedenen Geräten',
        'Dokumentiere alle Schritte, die zum Fehler führen',
        'Mache Screenshots bei visuellen Problemen',
        'Sei konstruktiv und respektvoll',
        'Prüfe, ob der Bug bereits gemeldet wurde'
      ]
    }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[150px] opacity-30"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
        />
      </div>

      <div className="relative px-4 sm:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          
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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Beta Tester Dokumentation</h1>
                <p className="text-white/50 text-sm">Alles was du wissen musst</p>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {docs.map((doc, index) => (
              <GlassCard 
                key={index} 
                className="p-6 animate-fade-in-up"
                style={{ animationDelay: `${0.1 + index * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${doc.gradient} flex items-center justify-center mb-4`}>
                  {doc.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{doc.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{doc.content}</p>
              </GlassCard>
            ))}
          </div>

          {/* Guidelines */}
          <div className="space-y-6">
            {guidelines.map((guide, index) => (
              <GlassCard 
                key={index} 
                className="p-8 animate-fade-in-up"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Info className="w-6 h-6 text-blue-400" />
                  {guide.title}
                </h2>
                <div className="space-y-3">
                  {guide.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">{idx + 1}</span>
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>

          {/* CTA */}
          <GlassCard className="p-8 mt-12 text-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-2xl font-semibold text-white mb-3">Bereit loszulegen?</h3>
            <p className="text-white/70 text-sm mb-6">Starte jetzt mit dem Testen und hilf uns, die beste Plattform zu bauen.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/beta/testing"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
              >
                Zum Test-Bereich
              </Link>
              <Link
                href="/beta/feedback"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all hover:scale-105 shadow-lg shadow-purple-500/30"
              >
                Feedback geben
              </Link>
            </div>
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
