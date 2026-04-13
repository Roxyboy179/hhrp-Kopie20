'use client';

import { useRef, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { GlassCard } from '@/components/shared/GlassCard';
import {
  Shield, Users, Heart, BookOpen, Scale, Gamepad2,
  LogIn, Sparkles, ChevronRight, Star, Trophy, Target,
  Zap, Radio, Headphones, Crosshair, MessageSquare,
  ShieldCheck, Building2, Siren, Flame, Stethoscope,
  UserCheck, CircleDot, Map, FileText, Play,
  BadgeCheck, ArrowRight, CheckCircle2, AlertTriangle, X
} from 'lucide-react';

const DiscordIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

function AnimatedSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function ErrorModal({ error, onClose }) {
  const getErrorContent = () => {
    switch (error) {
      case 'not_member':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-yellow-400" />,
          title: 'Nicht auf dem Discord-Server',
          message: 'Du musst Mitglied unseres Discord-Servers sein, um dich anzumelden und eine Bewerbung einzureichen.',
          action: 'Discord beitreten',
          actionUrl: 'https://discord.gg/cFQUWrzpC',
          color: 'yellow'
        };
      case 'auth_failed':
        return {
          icon: <X className="w-12 h-12 text-red-400" />,
          title: 'Anmeldung fehlgeschlagen',
          message: 'Die Anmeldung mit Discord ist fehlgeschlagen. Bitte versuche es erneut.',
          action: 'Erneut versuchen',
          actionUrl: '/api/auth/discord',
          color: 'red'
        };
      default:
        return {
          icon: <AlertTriangle className="w-12 h-12 text-orange-400" />,
          title: 'Ein Fehler ist aufgetreten',
          message: 'Es gab ein Problem bei der Anmeldung. Bitte versuche es später erneut.',
          action: 'Schließen',
          actionUrl: null,
          color: 'orange'
        };
    }
  };

  const content = getErrorContent();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-md w-full animate-scale-in">
        <GlassCard className="p-8 border border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-6">
            <div className={`w-20 h-20 rounded-3xl bg-${content.color}-500/10 border border-${content.color}-500/20 flex items-center justify-center mx-auto`}>
              {content.icon}
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
              <p className="text-white/60 leading-relaxed">{content.message}</p>
            </div>

            <div className="flex flex-col gap-3">
              {content.actionUrl ? (
                <a
                  href={content.actionUrl}
                  target={content.actionUrl.startsWith('http') ? '_blank' : undefined}
                  rel={content.actionUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`flex items-center justify-center gap-2 ${
                    content.color === 'yellow' 
                      ? 'bg-[#5865F2] hover:bg-[#4752C4]' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95`}
                >
                  {content.color === 'yellow' && <DiscordIcon size={18} />}
                  {content.action}
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <button
                  onClick={onClose}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  {content.action}
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white text-sm transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function ErrorHandler({ showError, setShowError }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setShowError(error);
      // Remove error from URL without page reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, setShowError]);

  return showError ? <ErrorModal error={showError} onClose={() => setShowError(null)} /> : null;
}

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showError, setShowError] = useState(null);

  const handleLogin = () => { window.location.replace('/api/auth/discord'); };

  return (
    <div className="space-y-0 pb-0 overflow-hidden">
      <Suspense fallback={null}>
        <ErrorHandler showError={showError} setShowError={setShowError} />
      </Suspense>
      
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-600/[0.06] rounded-full blur-[150px] animate-pulse-glow" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/[0.04] rounded-full blur-[120px] animate-float-slow" />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-500/[0.04] rounded-full blur-[100px] animate-float-reverse" />
          <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-blue-400/30 rounded-full animate-float" />
          <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 bg-cyan-400/20 rounded-full animate-float-slow" />
          <div className="absolute top-[60%] left-[20%] w-1 h-1 bg-blue-300/25 rounded-full animate-float-reverse" />
          <div className="absolute top-[40%] right-[25%] w-2.5 h-2.5 bg-indigo-400/15 rounded-full animate-float" />
          <div className="absolute bottom-[30%] left-[40%] w-1.5 h-1.5 bg-blue-400/20 rounded-full animate-float-slow" />
          <div className="absolute top-[70%] right-[10%] w-1 h-1 bg-cyan-300/30 rounded-full animate-float" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          <div className="animate-fade-in-down inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-blue-500/20 text-blue-300 text-sm font-medium">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <Gamepad2 className="w-4 h-4" />
            Spiel: Notruf Hamburg
            <span className="text-white/30">|</span>
            <span className="text-white/50">Online seit 2024</span>
          </div>

          <h1 className="animate-fade-in-up text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight">
            <span className="text-gradient">Hamburg</span>
            <br />
            <span className="text-gradient">Horizon RP</span>
          </h1>

          <p className="animate-fade-in-up delay-200 text-xl md:text-2xl lg:text-3xl text-white/40 font-light tracking-wide" style={{animationDelay: '200ms'}}>
            Realismus. Spannung. <span className="text-blue-400/80">Deine Story.</span>
          </p>

          <p className="animate-fade-in-up delay-300 text-base md:text-lg text-white/25 max-w-2xl mx-auto leading-relaxed" style={{animationDelay: '400ms'}}>
            Du willst echtes Roleplay ohne Chaos, ohne FailRP und ohne unnötigen Stress?
            Dann erlebe ein RP-System, das auf <span className="text-white/40">Qualität</span>, <span className="text-white/40">Struktur</span> und <span className="text-white/40">Immersion</span> setzt.
          </p>

          <div className="animate-fade-in-up delay-500 flex flex-col sm:flex-row flex-wrap justify-center gap-4 pt-4" style={{animationDelay: '600ms'}}>
            <button
              className="group flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 animate-gradient text-white px-8 py-4 rounded-2xl text-base font-semibold shadow-2xl shadow-blue-600/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.03] active:scale-[0.98]"
              onClick={() => window.open('https://discord.gg/cFQUWrzpC', '_blank')}
            >
              <DiscordIcon size={20} />
              Discord beitreten
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              href={user ? '/bewerbung' : '#'}
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  window.location.href = '/api/auth/discord';
                }
              }}
              className="group flex items-center justify-center gap-3 glass border border-white/10 text-white px-8 py-4 rounded-2xl text-base font-medium hover:bg-white/[0.06] hover:border-blue-500/20 transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              {user ? <Sparkles className="w-5 h-5 text-blue-400" /> : <LogIn className="w-5 h-5 text-blue-400" />}
              {user ? 'Jetzt bewerben' : 'Anmelden & Bewerben'}
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="animate-fade-in-up delay-700 pt-8" style={{animationDelay: '1000ms'}}>
            <div className="flex flex-col items-center gap-2 text-white/20">
              <span className="text-xs tracking-widest uppercase">Scroll</span>
              <div className="w-5 h-8 rounded-full border border-white/10 flex justify-center pt-1.5">
                <div className="w-1 h-2 bg-blue-400/50 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATS BAR ========== */}
      <AnimatedSection className="relative -mt-20 z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="glass-strong rounded-3xl p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: <Users className="w-5 h-5" />, value: 'Aktiv', label: 'Community', color: 'from-blue-500 to-blue-600' },
              { icon: <Shield className="w-5 h-5" />, value: '7+', label: 'Fraktionen', color: 'from-cyan-500 to-cyan-600' },
              { icon: <Star className="w-5 h-5" />, value: '24/7', label: 'Support', color: 'from-indigo-500 to-indigo-600' },
              { icon: <Trophy className="w-5 h-5" />, value: 'Top', label: 'Qualität', color: 'from-purple-500 to-purple-600' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 md:gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-white/35">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ========== WAS DICH ERWARTET ========== */}
      <section className="py-28 md:py-36 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16 md:mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-blue-300 text-xs font-medium uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" /> Features
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Was dich <span className="text-gradient">erwartet</span>
            </h2>
            <p className="text-white/30 text-base md:text-lg max-w-2xl mx-auto">
              Wir bieten dir eine einzigartige Roleplay-Erfahrung mit höchsten Ansprüchen an Qualität, Immersion und Gemeinschaft.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {[
              { icon: <ShieldCheck className="w-7 h-7" />, title: 'Realistisches Roleplay', desc: 'Tauche ein in eine glaubwürdige Welt voller Details. Jede deiner Entscheidungen hat echte Konsequenzen – genau wie im echten Leben. Kein FailRP, keine unrealistischen Situationen.', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/10' },
              { icon: <Building2 className="w-7 h-7" />, title: 'Organisierte Fraktionen', desc: 'Polizei, Feuerwehr, Rettungsdienst und weitere Fraktionen mit klaren Hierarchien, realistischen Abläufen und echtem Teamplay. Strukturen, die funktionieren.', color: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/10' },
              { icon: <Heart className="w-7 h-7" />, title: 'Hilfsbereite Community', desc: 'Bei uns findest du keine toxische Umgebung. Unsere Community besteht aus Spielern, die Roleplay lieben und sich gegenseitig unterstützen – ob Neuling oder Veteran.', color: 'from-pink-500/20 to-pink-600/10', border: 'border-pink-500/10' },
              { icon: <BookOpen className="w-7 h-7" />, title: 'Dynamische Storylines', desc: 'Jeder Einsatz erzählt eine Geschichte. Ob Verfolgungsjagd, Rettungsmission oder dramatische Verhandlung – bei uns wird jeder Moment zur epischen Story.', color: 'from-indigo-500/20 to-indigo-600/10', border: 'border-indigo-500/10' },
              { icon: <Scale className="w-7 h-7" />, title: 'Faire Regeln & Team', desc: 'Unser erfahrenes Team sorgt für klare Strukturen und transparente Entscheidungen. Support auf Augenhöhe, schnelle Reaktionszeiten und faire Behandlung für alle.', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/10' },
              { icon: <Radio className="w-7 h-7" />, title: 'Spannende Einsätze', desc: 'Von Routinekontrollen bis hin zu Großeinsätzen mit mehreren Fraktionen. Koordiniere dich mit deinem Team und erlebe Adrenalin pur in Hamburg.', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/10' },
            ].map((f, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <GlassCard hover className={`p-7 h-full border ${f.border}`}>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 text-white`}>
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-3">{f.title}</h3>
                  <p className="text-white/35 text-sm leading-relaxed">{f.desc}</p>
                </GlassCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="py-28 md:py-36 px-4 sm:px-6 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/[0.06] rounded-full blur-[150px]" />
        </div>
        <AnimatedSection className="max-w-4xl mx-auto relative">
          <div className="glass-strong rounded-[2rem] p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.06] via-transparent to-cyan-500/[0.04] pointer-events-none" />
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/[0.03] rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/[0.03] rounded-full translate-x-1/2 translate-y-1/2" />
            <div className="relative z-10 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 mb-8 animate-float">
                <Gamepad2 className="w-9 h-9" />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                Bereit für dein <span className="text-gradient">Abenteuer</span>?
              </h2>
              <p className="text-white/30 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
                Hamburg Horizon RP – Dein Leben. Deine Entscheidungen. Deine Stadt.
                <br />Werde jetzt Teil unserer wachsenden Community!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <button
                  className="group flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 rounded-2xl text-base font-semibold shadow-2xl shadow-[#5865F2]/25 hover:shadow-[#5865F2]/40 transition-all hover:scale-[1.03] active:scale-[0.98]"
                  onClick={() => window.open('https://discord.gg/cFQUWrzpC', '_blank')}
                >
                  <DiscordIcon size={20} />
                  Direkt beitreten
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <Link
                  href={user ? '/bewerbung' : '#'}
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      window.location.href = '/api/auth/discord';
                    }
                  }}
                  className="group flex items-center justify-center gap-3 glass border border-white/10 text-white px-8 py-4 rounded-2xl text-base font-medium hover:bg-white/[0.06] transition-all hover:scale-[1.03] active:scale-[0.98]"
                >
                  <FileText className="w-5 h-5 text-blue-400" />
                  Bewerbung schreiben
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-white/[0.04] pt-12 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold">HHRP</p>
                  <p className="text-xs text-white/25">Hamburg Horizon RP</p>
                </div>
              </div>
              <p className="text-sm text-white/25 leading-relaxed">
                Dein Leben. Deine Entscheidungen. Deine Stadt. Das ultimative Roleplay-Erlebnis in Notruf Hamburg.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white/50">Navigation</h4>
              <div className="space-y-2">
                <Link href="/" className="block text-sm text-white/25 hover:text-white/50 transition-colors">Startseite</Link>
                <Link href="/bewerbung" className="block text-sm text-white/25 hover:text-white/50 transition-colors">Bewerbung</Link>
                <button onClick={() => window.open('https://discord.gg/cFQUWrzpC', '_blank')} className="block text-sm text-white/25 hover:text-white/50 transition-colors">Discord</button>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white/50">Fraktionen</h4>
              <div className="space-y-2">
                {['Polizei', 'Rettungsdienst', 'Feuerwehr', 'Zivilisten'].map(f => (
                  <p key={f} className="text-sm text-white/25">{f}</p>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white/50">Community</h4>
              <button
                onClick={() => window.open('https://discord.gg/cFQUWrzpC', '_blank')}
                className="flex items-center gap-2 text-sm text-[#5865F2] hover:text-[#7289DA] transition-colors"
              >
                <DiscordIcon size={14} /> Discord Server
              </button>
              <p className="text-sm text-white/25">Spiel: Notruf Hamburg</p>
              <p className="text-sm text-white/25">Plattform: Roblox</p>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-white/20 text-xs">
            <p>&copy; 2025 Hamburg Horizon RP. Alle Rechte vorbehalten.</p>
            <p>Made with <span className="text-red-400">♥</span> für die Community</p>
          </div>
        </div>
      </footer>
    </div>
  );
}