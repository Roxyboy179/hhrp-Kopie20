'use client';

import { useState, useEffect } from 'react';

export function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0); // 0=logo, 1=text, 2=bar, 3=fade

  useEffect(() => {
    // Check if already shown this session
    if (sessionStorage.getItem('hhrp-splash-shown')) {
      onComplete();
      return;
    }

    // Phase timing
    const t1 = setTimeout(() => setPhase(1), 600);   // Show text
    const t2 = setTimeout(() => setPhase(2), 1400);  // Start progress
    const t3 = setTimeout(() => setPhase(3), 7500);  // Start fade
    const t4 = setTimeout(() => {
      sessionStorage.setItem('hhrp-splash-shown', 'true');
      onComplete();
    }, 8500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  // Progress animation
  useEffect(() => {
    if (phase < 2) return;
    const start = Date.now();
    const duration = 5500;
    const animate = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [phase]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-1000 ${phase >= 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: '#050505' }}
    >
      {/* Ambient glow */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full blur-[200px] transition-all duration-[3000ms]"
        style={{ 
          background: `rgba(var(--theme-accent-rgb, 255,255,255), ${phase >= 1 ? 0.08 : 0})`,
          transform: `scale(${phase >= 2 ? 1.5 : 0.8})`,
        }}
      />

      <div className="relative text-center">
        {/* Logo */}
        <div 
          className={`transition-all duration-1000 ${phase >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <div 
            className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-8 relative"
            style={{ 
              background: 'rgba(var(--theme-accent-rgb, 255,255,255), 0.08)',
              border: '1px solid rgba(var(--theme-accent-rgb, 255,255,255), 0.15)',
              boxShadow: `0 0 80px rgba(var(--theme-accent-rgb, 255,255,255), 0.1)`,
            }}
          >
            <span className="text-4xl font-black tracking-tighter" style={{ color: 'var(--theme-accent, #fff)' }}>H</span>
            {/* Rotating ring */}
            <div className="absolute inset-[-4px] rounded-3xl border border-dashed animate-spin" style={{ borderColor: 'rgba(var(--theme-accent-rgb, 255,255,255), 0.1)', animationDuration: '8s' }} />
          </div>
        </div>

        {/* Text */}
        <div className={`transition-all duration-700 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
            Hamburg Horizon
          </h1>
          <p className="text-lg font-light tracking-[0.3em] uppercase" style={{ color: 'rgba(var(--theme-accent-rgb, 255,255,255), 0.4)' }}>
            Roleplay
          </p>
        </div>

        {/* Progress */}
        <div className={`mt-12 transition-all duration-500 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="w-48 h-0.5 mx-auto rounded-full overflow-hidden" style={{ background: 'rgba(var(--theme-accent-rgb, 255,255,255), 0.06)' }}>
            <div 
              className="h-full rounded-full transition-none"
              style={{ 
                width: `${progress}%`,
                background: 'var(--theme-accent, #fff)',
                boxShadow: `0 0 20px rgba(var(--theme-accent-rgb, 255,255,255), 0.4)`,
              }}
            />
          </div>
          <p className="mt-4 text-xs tracking-widest uppercase" style={{ color: 'rgba(var(--theme-accent-rgb, 255,255,255), 0.2)' }}>
            {progress < 30 ? 'Wird geladen...' : progress < 60 ? 'Vorbereitung...' : progress < 90 ? 'Fast fertig...' : 'Willkommen!'}
          </p>
        </div>
      </div>

      {/* Bottom particles */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, rgba(var(--theme-accent-rgb, 255,255,255), 0.1), transparent)` }} />
    </div>
  );
}
