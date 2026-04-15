'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { 
  FileText, Users, CheckCircle2, Clock, ArrowRight, 
  Zap, Target, Loader2, ChevronDown, Sparkles, UserCircle
} from 'lucide-react';

function AnimatedCounter({ value, suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const end = parseInt(value) || 0;
    if (end === 0) { setCount(0); return; }
    let start = 0;
    const increment = end / 40;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{count}{suffix}</span>;
}

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({ total: 0, angenommen: 0, inBearbeitung: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/bewerbungen/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-accent)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Ambient Glow */}
      {!isMobile && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[150px]"
            style={{ background: 'rgba(var(--theme-accent-rgb), 0.06)' }}
          />
        </div>
      )}

      {/* === HERO === */}
      <section className="relative px-6 pt-28 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          
          <div className={isMobile ? "" : "animate-fade-in-down"} style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass"
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--theme-accent)' }} />
              <span className="text-xs tracking-wider uppercase font-medium" style={{ color: 'rgba(var(--theme-accent-rgb), 0.7)' }}>Bewerbungen offen</span>
            </div>
          </div>
          
          <h1 className={`mt-8 text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight ${!isMobile ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <span className="text-white">Werde Teil</span>
            <br />
            <span style={{ color: 'var(--theme-accent)', opacity: 0.6 }}>unseres Teams</span>
          </h1>
          
          <p className={`mt-6 text-lg md:text-xl max-w-xl mx-auto leading-relaxed ${!isMobile ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.4s', animationFillMode: 'both', color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
            Bewirb dich für das Team von Hamburg Horizon Roleplay und gestalte gemeinsam mit uns die Community.
          </p>

          <div className={`mt-10 flex flex-col sm:flex-row gap-4 justify-center ${!isMobile ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
            {user ? (
              <>
                <Button 
                  size="lg"
                  onClick={() => router.push('/bewerbung')}
                  className="rounded-2xl h-16 px-12 text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ 
                    background: 'var(--theme-accent)', 
                    color: '#000',
                    boxShadow: '0 25px 50px -12px rgba(var(--theme-accent-rgb), 0.2)'
                  }}
                >
                  <FileText className="w-6 h-6 mr-3" />
                  Jetzt bewerben
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/profil')}
                  className="rounded-2xl h-16 px-12 text-lg transition-all glass"
                  style={{ 
                    borderColor: 'rgba(var(--theme-accent-rgb), 0.15)',
                    color: 'rgba(var(--theme-accent-rgb), 0.6)'
                  }}
                >
                  <UserCircle className="w-6 h-6 mr-3" />
                  Zu Meinem Profil
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/meine-bewerbungen')}
                  className="rounded-2xl h-16 px-12 text-lg transition-all glass"
                  style={{ 
                    borderColor: 'rgba(var(--theme-accent-rgb), 0.15)',
                    color: 'rgba(var(--theme-accent-rgb), 0.6)'
                  }}
                >
                  <Clock className="w-6 h-6 mr-3" />
                  Meine Bewerbungen
                </Button>
              </>
            ) : (
              <button
                onClick={() => { window.location.href = '/api/auth/discord'; }}
                className="inline-flex items-center justify-center gap-3 px-12 py-5 rounded-2xl text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  background: 'var(--theme-accent)',
                  color: '#000',
                  boxShadow: '0 25px 50px -12px rgba(var(--theme-accent-rgb), 0.25)'
                }}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Mit Discord anmelden
              </button>
            )}
          </div>

          <div className="mt-16 animate-float">
            <ChevronDown className="w-5 h-5 mx-auto" style={{ color: 'rgba(var(--theme-accent-rgb), 0.2)' }} />
          </div>
        </div>
      </section>

      {/* === STATS === */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="h-px mb-16" style={{ background: `linear-gradient(to right, transparent, rgba(var(--theme-accent-rgb), 0.15), transparent)` }} />
          
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: <FileText className="w-5 h-5" />, value: stats.total, label: 'Bewerbungen' },
              { icon: <CheckCircle2 className="w-5 h-5" />, value: stats.angenommen, label: 'Angenommen' },
              { icon: <Clock className="w-5 h-5" />, value: stats.inBearbeitung, label: 'In Bearbeitung' },
            ].map((stat, i) => (
              <GlassCard key={i} className="p-6 text-center animate-fade-in-up" hover>
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ 
                    background: 'rgba(var(--theme-accent-rgb), 0.08)',
                    border: '1px solid rgba(var(--theme-accent-rgb), 0.12)',
                    color: 'var(--theme-accent)'
                  }}
                >
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white tabular-nums">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-sm tracking-wider uppercase font-medium mt-2" style={{ color: 'rgba(var(--theme-accent-rgb), 0.35)' }}>{stat.label}</div>
              </GlassCard>
            ))}
          </div>
          
          <div className="h-px mt-16" style={{ background: `linear-gradient(to right, transparent, rgba(var(--theme-accent-rgb), 0.15), transparent)` }} />
        </div>
      </section>

      {/* === FEATURES === */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Warum bei uns?</h2>
            <p className="text-lg" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>Was dich als Teil unseres Teams erwartet</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: <Zap className="w-6 h-6" />, title: 'Schnelle Bearbeitung', desc: 'Deine Bewerbung wird zügig und professionell von unserem Team geprüft.' },
              { icon: <Users className="w-6 h-6" />, title: 'Starke Community', desc: 'Werde Teil eines engagierten Teams mit einer wachsenden Community.' },
              { icon: <Target className="w-6 h-6" />, title: 'Faire Chancen', desc: 'Jede Bewerbung wird fair und transparent von uns bewertet.' },
            ].map((f, i) => (
              <GlassCard key={i} className="p-7 animate-fade-in-up" hover>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300"
                  style={{ 
                    background: 'rgba(var(--theme-accent-rgb), 0.08)',
                    border: '1px solid rgba(var(--theme-accent-rgb), 0.12)',
                    color: 'rgba(var(--theme-accent-rgb), 0.6)'
                  }}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* === STEPS === */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">So funktioniert's</h2>
            <p className="text-lg" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>In 3 einfachen Schritten</p>
          </div>

          <div className="space-y-4">
            {[
              { step: '01', title: 'Mit Discord anmelden', desc: 'Melde dich mit deinem Discord-Account an, damit wir dich kontaktieren können.' },
              { step: '02', title: 'Bewerbung ausfüllen', desc: 'Fülle das Bewerbungsformular mit deinen Informationen und Erfahrungen aus.' },
              { step: '03', title: 'Antwort erhalten', desc: 'Unser Team prüft deine Bewerbung und meldet sich per Discord bei dir.' },
            ].map((item, i) => (
              <GlassCard key={i} className="flex items-start gap-6 p-6 animate-fade-in-left" hover>
                <span className="text-5xl font-bold shrink-0 tabular-nums select-none" style={{ color: 'rgba(var(--theme-accent-rgb), 0.12)' }}>{item.step}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>{item.desc}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <GlassCard className="text-center p-12 md:p-16 animate-scale-in">
            <Sparkles className="w-8 h-8 mx-auto mb-6" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }} />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Bereit durchzustarten?</h2>
            <p className="text-lg mb-10 max-w-md mx-auto" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
              Bewirb dich jetzt und werde Teil unseres Teams.
            </p>
            {user ? (
              <Button 
                size="lg"
                onClick={() => router.push('/bewerbung')}
                className="rounded-2xl h-16 px-12 text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  background: 'var(--theme-accent)', 
                  color: '#000',
                  boxShadow: '0 25px 50px -12px rgba(var(--theme-accent-rgb), 0.2)'
                }}
              >
                Bewerbung starten <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            ) : (
              <button
                onClick={() => { window.location.href = '/api/auth/discord'; }}
                className="inline-flex items-center justify-center gap-3 px-12 py-5 rounded-2xl text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  background: 'var(--theme-accent)',
                  color: '#000',
                  boxShadow: '0 25px 50px -12px rgba(var(--theme-accent-rgb), 0.25)'
                }}
              >
                Mit Discord anmelden <ArrowRight className="w-6 h-6 ml-1" />
              </button>
            )}
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
