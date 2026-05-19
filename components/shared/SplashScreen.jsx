'use client';

import { useState, useCallback, useEffect } from 'react';
import { Gamepad2, Briefcase, Zap, Shield, Users, CheckCircle } from 'lucide-react';
import { LAUNCHER_NAME, LAUNCHER_TAGLINE } from '@/lib/launcher';

export function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0); // 0=logo, 1=text, 2=subtitle, 3=bar, 4=success, 5=fade
  const [isPWA, setIsPWA] = useState(false);
  const [loadingText, setLoadingText] = useState('Initialisierung...');

  useEffect(() => {
    // Check if running as PWA (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true;
    
    setIsPWA(isStandalone);

    // Skip splash if not PWA
    if (!isStandalone) {
      onComplete();
      return;
    }

    // Check if already shown this session
    if (sessionStorage.getItem('hhrp-splash-shown')) {
      onComplete();
      return;
    }

    // Phase timing - SCHNELL (3 Sekunden total)
    const t1 = setTimeout(() => setPhase(1), 300);     // Show title
    const t2 = setTimeout(() => setPhase(2), 800);     // Show subtitle
    const t3 = setTimeout(() => setPhase(3), 1200);    // Start progress
    const t4 = setTimeout(() => setPhase(4), 2500);    // Success animation
    const t5 = setTimeout(() => setPhase(5), 2800);    // Start fade
    const t6 = setTimeout(() => {
      sessionStorage.setItem('hhrp-splash-shown', 'true');
      onComplete();
    }, 3000); // 3 Sekunden total

    return () => { 
      clearTimeout(t1); 
      clearTimeout(t2); 
      clearTimeout(t3); 
      clearTimeout(t4); 
      clearTimeout(t5);
      clearTimeout(t6); 
    };
  }, [onComplete]);

  // Progress animation
  useEffect(() => {
    if (phase < 3) return;
    const start = Date.now();
    const duration = 1300; // 1,3 Sekunden Progress (von 1.2s bis 2.5s)
    const animate = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      
      // Schnelle Loading-Texte
      if (p < 20) setLoadingText('Verbindung wird aufgebaut...');
      else if (p < 40) setLoadingText('Daten werden geladen...');
      else if (p < 60) setLoadingText('Interface wird initialisiert...');
      else if (p < 80) setLoadingText('Fast fertig...');
      else setLoadingText(`Willkommen im ${LAUNCHER_NAME}!`);
      
      if (p < 100) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [phase]);

  // Don't render if not PWA
  if (!isPWA) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-700 ${
        phase >= 5 ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}
    >
      {/* Ambient glow */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full blur-[250px] transition-all duration-[4000ms]"
        style={{ 
          background: `rgba(var(--theme-accent-rgb, 99, 102, 241), ${phase >= 1 ? 0.12 : 0})`,
          transform: `scale(${phase >= 4 ? 2.5 : phase >= 3 ? 1.8 : 0.6})`,
          opacity: phase >= 4 ? 0.2 : 1
        }}
      />

      {/* Success Particles */}
      {phase >= 4 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-ping"
              style={{
                background: 'rgba(var(--theme-accent-rgb), 0.6)',
                top: '50%',
                left: '50%',
                animation: `ping 1s cubic-bezier(0, 0, 0.2, 1) ${i * 0.1}s`,
                transform: `rotate(${i * 30}deg) translateX(${100 + i * 20}px)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Decorative Grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      <div className={`relative text-center px-6 transition-all duration-700 ${
        phase >= 4 ? 'scale-95' : 'scale-100'
      }`}>
        {/* Server Logo */}
        <div 
          className={`transition-all duration-1200 ${
            phase >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          } ${phase >= 4 ? 'scale-110' : ''}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <div className="relative w-32 h-32 mx-auto mb-8">
            {/* Server Icon */}
            <img 
              src="/icon-192.png" 
              alt="Hamburg Horizon RP" 
              className={`w-full h-full rounded-3xl shadow-2xl transition-all duration-700 ${
                phase >= 4 ? 'brightness-125 saturate-150' : ''
              }`}
              style={{
                boxShadow: `0 20px 80px rgba(var(--theme-accent-rgb, 99, 102, 241), ${phase >= 4 ? 0.6 : 0.3})`,
              }}
            />
            
            {/* Success Checkmark */}
            {phase >= 4 && (
              <div 
                className="absolute inset-0 flex items-center justify-center animate-scale-in"
                style={{
                  animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-2xl">
                  <CheckCircle className="w-12 h-12 text-white" strokeWidth={3} />
                </div>
              </div>
            )}
            
            {/* Rotating ring */}
            <div 
              className={`absolute inset-[-6px] rounded-3xl border-2 border-dashed transition-all duration-700 ${
                phase >= 4 ? 'animate-spin-fast opacity-0' : 'animate-spin'
              }`}
              style={{ 
                borderColor: 'rgba(var(--theme-accent-rgb, 99, 102, 241), 0.2)', 
                animationDuration: phase >= 4 ? '0.5s' : '12s'
              }} 
            />
            
            {/* Pulse ring */}
            <div 
              className={`absolute inset-[-12px] rounded-3xl border transition-all duration-700 ${
                phase >= 4 ? 'scale-150 opacity-0' : 'animate-pulse'
              }`}
              style={{ 
                borderColor: 'rgba(var(--theme-accent-rgb, 99, 102, 241), 0.1)',
                animationDuration: '3s'
              }} 
            />

            {/* Success Ring Burst */}
            {phase >= 4 && (
              <>
                <div 
                  className="absolute inset-[-20px] rounded-full border-4 border-green-400/30 animate-ping"
                  style={{ animationDuration: '1s' }}
                />
                <div 
                  className="absolute inset-[-30px] rounded-full border-2 border-green-300/20 animate-ping"
                  style={{ animationDuration: '1.2s', animationDelay: '0.1s' }}
                />
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <div className={`transition-all duration-1000 delay-300 ${
          phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        } ${phase >= 4 ? 'scale-105 opacity-0 -translate-y-4' : ''}`}>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
            {phase >= 4 ? 'Bereit!' : LAUNCHER_NAME}
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-12 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(var(--theme-accent-rgb), 0.5))' }} />
            <p className={`text-base font-light tracking-[0.3em] uppercase transition-all duration-500 ${
              phase >= 4 ? 'text-green-400' : 'text-white/50'
            }`}>
              {phase >= 4 ? 'Vollständig geladen' : LAUNCHER_TAGLINE}
            </p>
            <div className="w-12 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(var(--theme-accent-rgb), 0.5))' }} />
          </div>
        </div>

        {/* Subtitle mit mehr Info */}
        <div className={`transition-all duration-1000 delay-500 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-sm text-white/40 mb-3">
            Deine Community-Plattform
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-white/30">
            <div className="flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Erlebe das Roleplay</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Werde Teil des Teams</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`mt-12 transition-all duration-700 delay-700 ${
          phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        } ${phase >= 4 ? 'opacity-0 scale-95' : ''}`}>
          {/* Progress Container */}
          <div className="w-72 max-w-full mx-auto">
            <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(var(--theme-accent-rgb, 99, 102, 241), 0.08)' }}>
              <div 
                className="h-full rounded-full transition-none"
                style={{ 
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, rgba(var(--theme-accent-rgb), 0.6) 0%, rgba(var(--theme-accent-rgb), 1) 100%)',
                  boxShadow: `0 0 20px rgba(var(--theme-accent-rgb, 99, 102, 241), 0.5)`,
                }}
              />
            </div>
            
            {/* Loading Text mit Animation */}
            <div className="relative h-6">
              <p 
                className="absolute inset-x-0 text-xs font-medium tracking-wider transition-all duration-500" 
                style={{ color: 'rgba(var(--theme-accent-rgb, 99, 102, 241), 0.5)' }}
                key={loadingText}
              >
                {loadingText}
              </p>
            </div>
            
            {/* Progress Percentage */}
            <p className="text-[10px] text-white/10 tracking-[0.2em] uppercase mt-2">
              {Math.floor(progress)}% abgeschlossen
            </p>
          </div>
        </div>

        {/* Feature Pills */}
        <div className={`mt-8 flex flex-wrap gap-2 justify-center transition-all duration-1000 delay-1000 ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {[
            { icon: Users, label: 'Discord Integration' },
            { icon: Zap, label: 'Live Sync' },
            { icon: Shield, label: 'Team Portal' }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div 
                key={feature.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium tracking-wide uppercase"
                style={{
                  background: 'rgba(var(--theme-accent-rgb, 99, 102, 241), 0.05)',
                  border: '1px solid rgba(var(--theme-accent-rgb, 99, 102, 241), 0.1)',
                  color: 'rgba(var(--theme-accent-rgb, 99, 102, 241), 0.4)',
                  animationDelay: `${i * 200}ms`
                }}
              >
                <Icon className="w-3 h-3" />
                <span>{feature.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3">
        <div className="w-64 h-px" style={{ background: `linear-gradient(to right, transparent, rgba(var(--theme-accent-rgb, 99, 102, 241), 0.2), transparent)` }} />
        <p className="text-[10px] text-white/10 tracking-[0.3em] uppercase">
          {LAUNCHER_NAME}
        </p>
      </div>
    </div>
  );
}
