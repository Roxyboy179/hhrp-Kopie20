'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Info, Sparkles, X, CheckCircle2, Wrench, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BetaNotice() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Prüfe ob der Benutzer die Beta-Notice bereits gesehen hat
    const hasSeenNotice = localStorage.getItem('hhrp-beta-notice-seen');
    
    if (!hasSeenNotice) {
      // Zeige Notice nach 2 Sekunden (nach Splash Screen)
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl glass rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%)',
          boxShadow: '0 25px 100px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group z-10"
        >
          <X className="w-5 h-5 text-white/60 group-hover:text-white" />
        </button>

        {/* Header with Icon */}
        <div className="relative p-5 sm:p-8 pb-4 sm:pb-6 border-b border-white/[0.06]">
          {/* Decorative gradient */}
          <div 
            className="absolute top-0 left-0 right-0 h-24 sm:h-32 opacity-20 blur-3xl"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)' }}
          />
          
          <div className="relative flex items-start gap-3 sm:gap-5">
            {/* Icon Container */}
            <div className="relative flex-shrink-0">
              <div 
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-xl"
              >
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={2} />
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-[-3px] sm:inset-[-4px] rounded-xl sm:rounded-2xl border border-white/5 animate-pulse" />
            </div>

            {/* Text */}
            <div className="flex-1 pt-0.5 sm:pt-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5 sm:mb-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  HHRP Beta
                </h2>
                <span 
                  className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.9)'
                  }}
                >
                  Version 0.9
                </span>
              </div>
              <p className="text-white/50 text-xs sm:text-sm leading-relaxed">
                Willkommen zur Beta-Version unserer Community-Plattform
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8 space-y-5 sm:space-y-6">
          {/* Info Box */}
          <div 
            className="p-4 sm:p-5 rounded-lg sm:rounded-xl border"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              borderColor: 'rgba(255,255,255,0.08)'
            }}
          >
            <div className="flex items-start gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-1.5 sm:mb-2">
                  Was bedeutet das?
                </h3>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
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
                  className="p-3.5 sm:p-4 rounded-lg sm:rounded-xl border transition-all hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(255,255,255,0.06)'
                  }}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-2.5 sm:mb-3">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white mb-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Warning Notice */}
          <div 
            className="flex items-start gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-lg sm:rounded-xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-white/50 leading-relaxed">
              <span className="font-semibold text-white/70">Hinweis:</span> Es können gelegentlich 
              kleinere Fehler oder Änderungen auftreten. Wir arbeiten kontinuierlich daran, 
              die Plattform zu optimieren.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 pt-0">
          <Button
            onClick={handleClose}
            className="w-full h-11 sm:h-12 rounded-xl font-semibold text-sm sm:text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(255,255,255,0.1)'
            }}
          >
            Verstanden, weiter zur Plattform
          </Button>
          
          <p className="text-center text-[10px] sm:text-xs text-white/30 mt-3 sm:mt-4">
            Diese Nachricht wird nur einmal angezeigt
          </p>
        </div>

        {/* Bottom Decoration */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }}
        />
      </div>
    </div>
  );
}
