'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BetaTesterRecruitmentModal({ user }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [betaTesterOpen, setBetaTesterOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (user && !checking) {
      setChecking(true);
      checkBetaTesterStatus();
    }
  }, [user]);

  const checkBetaTesterStatus = async () => {
    try {
      const res = await fetch('/api/bewerbung-settings');
      const data = await res.json();
      
      const isBetaTester = user?.roles?.includes('1494434149623136276');
      const hasSeenToday = localStorage.getItem('betaTesterPopupSeen') === new Date().toDateString();
      
      if (data.settings?.beta_tester_open && user && !isBetaTester && !hasSeenToday) {
        setBetaTesterOpen(true);
        setTimeout(() => setIsOpen(true), 3000);
      }
    } catch (e) {
      console.error('❌ Fehler beim Laden der Beta Tester Settings:', e);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('betaTesterPopupSeen', new Date().toDateString());
  };

  const handleApply = () => {
    handleClose();
    router.push('/bewerbung?type=beta_tester');
  };

  if (!isOpen || !betaTesterOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in-0 duration-300">
      {/* Enhanced Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-xl" 
        style={{ background: 'rgba(0, 0, 0, 0.85)' }}
        onClick={handleClose}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-3xl border p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(40, 40, 40, 0.95) 0%, rgba(15, 15, 15, 0.98) 100%)',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 100px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <X className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
        </button>

        {/* Icon with glow */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <Sparkles className="w-10 h-10 text-white relative z-10 animate-pulse" />
            </div>
            {/* Pulse rings */}
            <div className="absolute inset-[-4px] rounded-full border animate-pulse" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }} />
            <div className="absolute inset-[-8px] rounded-full border animate-pulse" style={{ borderColor: 'rgba(255, 255, 255, 0.08)', animationDelay: '0.5s' }} />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-3">
            Wir suchen Beta Tester
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            Sei einer der Ersten, die neue Features testen! Als Beta Tester hilfst du uns, 
            die Plattform zu verbessern und bekommst exklusiven Zugang zu kommenden Updates.
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-8">
          {[
            'Exklusiver Zugang zu neuen Features',
            'Beta Tester Rolle & Badge',
            'Direkten Einfluss auf die Entwicklung',
            'Community-Events & Belohnungen'
          ].map((benefit, i) => (
            <div 
              key={i} 
              className="flex items-center gap-3 text-sm text-white/80 p-3 rounded-lg transition-all hover:bg-white/5"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <CheckCircle2 className="w-5 h-5 text-white/60 flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleApply}
            className="w-full py-6 rounded-xl text-base font-semibold shadow-lg transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.12))',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
            }}
          >
            Jetzt als Beta Tester bewerben
            <ArrowRight className="w-5 h-5 ml-2 inline" />
          </Button>
          
          <button
            onClick={handleClose}
            className="w-full text-white/50 hover:text-white/80 text-sm py-2 transition-colors"
          >
            Vielleicht später
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(10px, -10px); }
          50% { transform: translate(-5px, 5px); }
          75% { transform: translate(-10px, -5px); }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
}
