'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Info, Sparkles, X, CheckCircle2, Wrench, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BetaNotice() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenNotice = localStorage.getItem('hhrp-beta-notice-seen');
    
    if (!hasSeenNotice) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hhrp-beta-notice-seen', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
      {/* Enhanced Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-xl"
        style={{ background: 'rgba(0, 0, 0, 0.85)' }}
        onClick={handleClose}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
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
        className="relative w-full max-w-2xl rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 100px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 group z-10"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <X className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
        </button>

        {/* Header with Icon */}
        <div className="relative p-5 sm:p-8 pb-4 sm:pb-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          {/* Decorative gradient glow */}
          <div 
            className="absolute top-0 left-0 right-0 h-32 opacity-10 blur-3xl"
            style={{ background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent)' }}
          />
          
          <div className="relative flex items-start gap-3 sm:gap-5">
            {/* Icon Container with layers */}
            <div className="relative flex-shrink-0">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05))',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}
              >
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <Sparkles className="w-8 h-8 text-white relative z-10" strokeWidth={2} />
              </div>
              {/* Pulse rings */}
              <div className="absolute inset-[-4px] rounded-2xl border animate-pulse" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              <div className="absolute inset-[-8px] rounded-2xl border animate-pulse" style={{ borderColor: 'rgba(255, 255, 255, 0.05)', animationDelay: '0.5s' }} />
            </div>

            {/* Text */}
            <div className="flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-3xl font-black text-white tracking-tight">
                  HHRP Beta
                </h2>
                <span 
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.08))',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }}
                >
                  Version 0.9
                </span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                Willkommen zur Beta-Version unserer Community-Plattform
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8 space-y-6">
          {/* Info Box */}
          <div 
            className="p-5 rounded-xl border backdrop-blur-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="flex items-start gap-3 mb-3">
              <Info className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-white mb-2">
                  Was bedeutet das?
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  HHRP befindet sich aktuell in der <span className="text-white font-medium">Beta-Phase</span>. 
                  Das bedeutet, dass wir aktiv an Verbesserungen arbeiten und neue Features entwickeln, 
                  um dir die beste Erfahrung zu bieten.
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon: Wrench,
                title: 'In Entwicklung',
                desc: 'Neue Features werden hinzugefügt'
              },
              {
                icon: Zap,
                title: 'Updates',
                desc: 'Regelmäßige Verbesserungen'
              },
              {
                icon: CheckCircle2,
                title: 'Feedback',
                desc: 'Deine Meinung zählt'
              }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl border transition-all hover:scale-[1.02] cursor-default group"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <Icon className="w-5 h-5 text-white/80" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-white/40 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Warning Notice */}
          <div 
            className="flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <AlertTriangle className="w-5 h-5 text-white/50 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-white/50 leading-relaxed">
              <span className="font-semibold text-white/70">Hinweis:</span> Es können gelegentlich 
              kleinere Fehler oder Änderungen auftreten. Wir arbeiten kontinuierlich daran, 
              die Plattform zu optimieren.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <Button
            onClick={handleClose}
            className="w-full h-12 rounded-xl font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.1))',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            }}
          >
            Verstanden, weiter zur Plattform
          </Button>
          
          <p className="text-center text-xs text-white/30 mt-4">
            Diese Nachricht wird nur einmal angezeigt
          </p>
        </div>

        {/* Bottom Decoration */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.15), transparent)' }}
        />
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
