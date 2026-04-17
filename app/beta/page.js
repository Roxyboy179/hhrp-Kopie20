'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Bug, FlaskConical, FileText, Shield, ChevronRight } from 'lucide-react';
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
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      title: 'Test-Bereich',
      description: 'Teste neue Features und experimentelle Funktionen',
      icon: <FlaskConical className="w-8 h-8" />,
      href: '/beta/testing',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Dokumentation',
      description: 'Anleitungen und Informationen für Beta Tester',
      icon: <FileText className="w-8 h-8" />,
      href: '/beta/docs',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Beta Tester Portal</h1>
              <p className="text-white/50 text-lg">Willkommen zurück, {user?.globalName || user?.username}</p>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <h3 className="text-lg font-semibold text-white mb-2">Deine Rolle als Beta Tester</h3>
            <p className="text-white/70 leading-relaxed">
              Als Beta Tester bist du ein wichtiger Teil unserer Entwicklung. Dein Feedback hilft uns, 
              die Plattform zu verbessern und neue Features zu optimieren, bevor sie für alle verfügbar sind.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {betaFeatures.map((feature, index) => (
            <Link
              key={index}
              href={feature.href}
              className={`group p-6 rounded-2xl ${feature.bgColor} border ${feature.borderColor} backdrop-blur-sm transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20`}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm mb-4">{feature.description}</p>
              
              <div className="flex items-center gap-2 text-white/40 group-hover:text-white/80 transition-colors">
                <span className="text-sm font-medium">Öffnen</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="text-3xl font-bold text-white mb-2">Beta</div>
            <p className="text-white/50 text-sm">Dein Status</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="text-3xl font-bold text-purple-400 mb-2">Aktiv</div>
            <p className="text-white/50 text-sm">Account Status</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="text-3xl font-bold text-green-400 mb-2">Alle</div>
            <p className="text-white/50 text-sm">Verfügbare Features</p>
          </div>
        </div>
      </div>
    </div>
  );
}
