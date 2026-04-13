'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Shield, Users, Heart, BookOpen, Scale, Gamepad2,
  LogIn, LogOut, FileText, Settings,
  Send, Eye, ArrowLeft, Clock, CheckCircle2, XCircle,
  AlertTriangle, Loader2, User, Mail, Calendar,
  Lock, UserPlus, Trash2, RefreshCw, Menu, X,
  Zap, Star, Trophy, Target, Radio, Headphones,
  MessageSquare, ChevronRight, Sparkles, Globe,
  Siren, Flame, Stethoscope, UserCheck,
  ArrowRight, Play, BadgeCheck, ShieldCheck,
  CircleDot, Crosshair, Map, Building2
} from 'lucide-react';

// ===== HELPERS =====
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function getStatusColor(status) {
  switch (status) {
    case 'Eingereicht': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'In Bearbeitung': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'Angenommen': return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'Abgelehnt': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'Zur\u00fcckgezogen': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
}
function StatusIcon({ status }) {
  switch (status) {
    case 'Eingereicht': return <Clock className="w-3.5 h-3.5" />;
    case 'In Bearbeitung': return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    case 'Angenommen': return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'Abgelehnt': return <XCircle className="w-3.5 h-3.5" />;
    case 'Zur\u00fcckgezogen': return <AlertTriangle className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
}

const DiscordIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

// ===== ANIMATED SECTION WRAPPER =====
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

// ===== GLASS CARD =====
function GlassCard({ children, className = '', onClick, hover = false }) {
  return (
    <div
      className={`glass rounded-2xl shadow-2xl ${hover ? 'glass-card-hover cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ===== NAVBAR =====
function Navbar({ user, view, setView, loading }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogin = () => { window.location.href = '/api/auth/discord'; };
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  };

  const navItems = [
    { id: 'landing', label: 'Startseite', icon: <Globe className="w-4 h-4" />, show: true },
    { id: 'bewerbung', label: 'Team-Bewerbung', icon: <FileText className="w-4 h-4" />, show: true },
    { id: 'meine-bewerbungen', label: 'Meine Bewerbungen', icon: <Eye className="w-4 h-4" />, show: !!user },
    { id: 'admin', label: 'Admin', icon: <Settings className="w-4 h-4" />, show: user?.adminLevel > 0 },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-slate-950/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl shadow-black/20' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={() => setView('landing')}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all group-hover:scale-105">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg tracking-tight">HHRP</span>
            <span className="text-[10px] text-white/30 block -mt-1">Hamburg Horizon RP</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-white/[0.03] backdrop-blur-xl rounded-2xl p-1 border border-white/[0.06]">
          {navItems.filter(n => n.show).map(n => (
            <button
              key={n.id}
              onClick={() => {
                if (n.id === 'bewerbung' && !user) { handleLogin(); return; }
                setView(n.id);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                view === n.id
                  ? 'bg-blue-500/20 text-blue-300 shadow-inner shadow-blue-500/10'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
              }`}
            >
              {n.icon}<span className="hidden lg:inline">{n.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                {user.avatar ? (
                  <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`} alt="" className="w-7 h-7 rounded-full ring-2 ring-blue-500/20" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center"><User className="w-3.5 h-3.5" /></div>
                )}
                <span className="text-sm text-white/70 max-w-[100px] truncate">{user.globalName || user.username}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/30 hover:text-white hover:bg-white/[0.06] rounded-xl h-9 w-9">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg shadow-[#5865F2]/25 hover:shadow-[#5865F2]/40 transition-all hover:scale-105 active:scale-95"
            >
              <DiscordIcon size={14} />
              <span className="hidden sm:inline">Anmelden</span>
            </button>
          )}
          <button className="md:hidden text-white/50 hover:text-white p-2 rounded-xl hover:bg-white/[0.04] transition-all" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass-strong mx-4 mb-4 rounded-2xl p-2 animate-fade-in-down space-y-1">
          {navItems.filter(n => n.show).map(n => (
            <button
              key={n.id}
              onClick={() => {
                if (n.id === 'bewerbung' && !user) { handleLogin(); return; }
                setView(n.id);
                setMobileOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm text-white/70 hover:bg-white/[0.06] transition-all flex items-center gap-3"
            >
              {n.icon}{n.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ===== LANDING PAGE =====
function LandingPage({ user, setView }) {
  const handleLogin = () => { window.location.href = '/api/auth/discord'; };

  return (
    <div className="space-y-0 pb-0 overflow-hidden">

      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center justify-center text-center px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-600/[0.06] rounded-full blur-[150px] animate-pulse-glow" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/[0.04] rounded-full blur-[120px] animate-float-slow" />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-500/[0.04] rounded-full blur-[100px] animate-float-reverse" />

          {/* Floating particles */}
          <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-blue-400/30 rounded-full animate-float" />
          <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 bg-cyan-400/20 rounded-full animate-float-slow" />
          <div className="absolute top-[60%] left-[20%] w-1 h-1 bg-blue-300/25 rounded-full animate-float-reverse" />
          <div className="absolute top-[40%] right-[25%] w-2.5 h-2.5 bg-indigo-400/15 rounded-full animate-float" />
          <div className="absolute bottom-[30%] left-[40%] w-1.5 h-1.5 bg-blue-400/20 rounded-full animate-float-slow" />
          <div className="absolute top-[70%] right-[10%] w-1 h-1 bg-cyan-300/30 rounded-full animate-float" />

          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="animate-fade-in-down inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-blue-500/20 text-blue-300 text-sm font-medium">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <Gamepad2 className="w-4 h-4" />
            Spiel: Notruf Hamburg
            <span className="text-white/30">|</span>
            <span className="text-white/50">Online seit 2024</span>
          </div>

          {/* Main Title */}
          <h1 className="animate-fade-in-up text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight">
            <span className="text-gradient">Hamburg</span>
            <br />
            <span className="text-gradient">Horizon RP</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up delay-200 text-xl md:text-2xl lg:text-3xl text-white/40 font-light tracking-wide" style={{animationDelay: '200ms'}}>
            Realismus. Spannung. <span className="text-blue-400/80">Deine Story.</span>
          </p>

          {/* Description */}
          <p className="animate-fade-in-up delay-300 text-base md:text-lg text-white/25 max-w-2xl mx-auto leading-relaxed" style={{animationDelay: '400ms'}}>
            Du willst echtes Roleplay ohne Chaos, ohne FailRP und ohne unn&ouml;tigen Stress?
            Dann erlebe ein RP-System, das auf <span className="text-white/40">Qualit&auml;t</span>, <span className="text-white/40">Struktur</span> und <span className="text-white/40">Immersion</span> setzt.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up delay-500 flex flex-col sm:flex-row flex-wrap justify-center gap-4 pt-4" style={{animationDelay: '600ms'}}>
            <button
              className="group flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 animate-gradient text-white px-8 py-4 rounded-2xl text-base font-semibold shadow-2xl shadow-blue-600/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.03] active:scale-[0.98]"
              onClick={() => window.open('https://discord.gg/cFQUWrzpC', '_blank')}
            >
              <DiscordIcon size={20} />
              Discord beitreten
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              className="group flex items-center justify-center gap-3 glass border border-white/10 text-white px-8 py-4 rounded-2xl text-base font-medium hover:bg-white/[0.06] hover:border-blue-500/20 transition-all hover:scale-[1.03] active:scale-[0.98]"
              onClick={() => user ? setView('bewerbung') : handleLogin()}
            >
              {user ? <Sparkles className="w-5 h-5 text-blue-400" /> : <LogIn className="w-5 h-5 text-blue-400" />}
              {user ? 'Jetzt bewerben' : 'Anmelden & Bewerben'}
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Scroll indicator */}
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
              { icon: <Trophy className="w-5 h-5" />, value: 'Top', label: 'Qualit\u00e4t', color: 'from-purple-500 to-purple-600' },
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
              Wir bieten dir eine einzigartige Roleplay-Erfahrung mit h&ouml;chsten Anspr&uuml;chen an Qualit&auml;t, Immersion und Gemeinschaft.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {[
              { icon: <ShieldCheck className="w-7 h-7" />, title: 'Realistisches Roleplay', desc: 'Tauche ein in eine glaubw\u00fcrdige Welt voller Details. Jede deiner Entscheidungen hat echte Konsequenzen \u2013 genau wie im echten Leben. Kein FailRP, keine unrealistischen Situationen.', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/10' },
              { icon: <Building2 className="w-7 h-7" />, title: 'Organisierte Fraktionen', desc: 'Polizei, Feuerwehr, Rettungsdienst und weitere Fraktionen mit klaren Hierarchien, realistischen Abl\u00e4ufen und echtem Teamplay. Strukturen, die funktionieren.', color: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/10' },
              { icon: <Heart className="w-7 h-7" />, title: 'Hilfsbereite Community', desc: 'Bei uns findest du keine toxische Umgebung. Unsere Community besteht aus Spielern, die Roleplay lieben und sich gegenseitig unterst\u00fctzen \u2013 ob Neuling oder Veteran.', color: 'from-pink-500/20 to-pink-600/10', border: 'border-pink-500/10' },
              { icon: <BookOpen className="w-7 h-7" />, title: 'Dynamische Storylines', desc: 'Jeder Einsatz erz\u00e4hlt eine Geschichte. Ob Verfolgungsjagd, Rettungsmission oder dramatische Verhandlung \u2013 bei uns wird jeder Moment zur epischen Story.', color: 'from-indigo-500/20 to-indigo-600/10', border: 'border-indigo-500/10' },
              { icon: <Scale className="w-7 h-7" />, title: 'Faire Regeln & Team', desc: 'Unser erfahrenes Team sorgt f\u00fcr klare Strukturen und transparente Entscheidungen. Support auf Augenh\u00f6he, schnelle Reaktionszeiten und faire Behandlung f\u00fcr alle.', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/10' },
              { icon: <Radio className="w-7 h-7" />, title: 'Spannende Eins\u00e4tze', desc: 'Von Routinekontrollen bis hin zu Gro\u00dfeins\u00e4tzen mit mehreren Fraktionen. Koordiniere dich mit deinem Team und erlebe Adrenalin pur in Hamburg.', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/10' },
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

      {/* ========== FRAKTIONEN / ROLLEN ========== */}
      <section className="py-28 md:py-36 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <AnimatedSection className="text-center mb-16 md:mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-blue-300 text-xs font-medium uppercase tracking-wider">
              <Target className="w-3.5 h-3.5" /> Fraktionen
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Deine Rolle. <span className="text-gradient">Deine Entscheidung.</span>
            </h2>
            <p className="text-white/30 text-base md:text-lg max-w-2xl mx-auto">
              Werde Teil der Stadt Hamburg &ndash; als Polizist, Sanit&auml;ter, Feuerwehrkraft oder Zivilist.
              <br className="hidden md:block" />
              Jede Handlung beeinflusst den Verlauf deiner Geschichte.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {[
              {
                icon: <Siren className="w-8 h-8" />,
                emoji: '\uD83D\uDC6E',
                title: 'Polizei',
                desc: 'Sorge f\u00fcr Recht und Ordnung. F\u00fchre Verkehrskontrollen durch, kl\u00e4re Verbrechen auf und sch\u00fctze die B\u00fcrger Hamburgs.',
                tasks: ['Streifendienst', 'Ermittlungen', 'SEK-Eins\u00e4tze'],
                color: 'from-blue-500 to-blue-700',
                glow: 'shadow-blue-500/20',
              },
              {
                icon: <Stethoscope className="w-8 h-8" />,
                emoji: '\uD83D\uDE91',
                title: 'Rettungsdienst',
                desc: 'Rette Leben und versorge Verletzte. Sei der Held im Notfall und bringe Patienten sicher ins Krankenhaus.',
                tasks: ['Notfalleins\u00e4tze', 'Erste Hilfe', 'Krankentransport'],
                color: 'from-red-500 to-red-700',
                glow: 'shadow-red-500/20',
              },
              {
                icon: <Flame className="w-8 h-8" />,
                emoji: '\uD83D\uDE92',
                title: 'Feuerwehr',
                desc: 'Bek\u00e4mpfe Br\u00e4nde und rette Menschen aus Gefahren. Technische Hilfeleistung und Brandschutz sind dein Alltag.',
                tasks: ['Brandschutz', 'Rettungseins\u00e4tze', 'Technische Hilfe'],
                color: 'from-orange-500 to-orange-700',
                glow: 'shadow-orange-500/20',
              },
              {
                icon: <UserCheck className="w-8 h-8" />,
                emoji: '\uD83C\uDFD9\uFE0F',
                title: 'Zivilist',
                desc: 'Lebe dein eigenes Leben in Hamburg. Gestalte deine Story, baue Beziehungen auf und erlebe den Alltag in der Stadt.',
                tasks: ['Freies RP', 'Jobs & Berufe', 'Eigene Storylines'],
                color: 'from-emerald-500 to-emerald-700',
                glow: 'shadow-emerald-500/20',
              },
            ].map((r, i) => (
              <AnimatedSection key={i} delay={i * 120}>
                <GlassCard hover className="p-6 md:p-7 h-full group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${r.color} opacity-[0.04] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-[0.08] transition-opacity`} />
                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white mb-5 shadow-xl ${r.glow} group-hover:scale-110 transition-transform duration-300`}>
                      {r.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{r.title}</h3>
                    <p className="text-white/35 text-sm leading-relaxed mb-4">{r.desc}</p>
                    <div className="space-y-2">
                      {r.tasks.map((t, j) => (
                        <div key={j} className="flex items-center gap-2 text-xs text-white/30">
                          <CircleDot className="w-3 h-3 text-blue-400/50" />
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WIE FUNKTIONIERT ES ========== */}
      <section className="py-28 md:py-36 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16 md:mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-blue-300 text-xs font-medium uppercase tracking-wider">
              <Map className="w-3.5 h-3.5" /> So startest du
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              In <span className="text-gradient">3 Schritten</span> dabei
            </h2>
            <p className="text-white/30 text-base md:text-lg max-w-xl mx-auto">
              Der Einstieg bei Hamburg Horizon RP ist einfach. Folge diesen Schritten und starte dein Abenteuer.
            </p>
          </AnimatedSection>

          <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-6 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-[4.5rem] left-[16%] right-[16%] h-px bg-gradient-to-r from-blue-500/20 via-blue-400/40 to-blue-500/20" />

            {[
              { step: '01', icon: <DiscordIcon size={24} />, title: 'Discord beitreten', desc: 'Tritt unserem Discord-Server bei und werde Teil der Community. Lerne die anderen Spieler kennen und informiere dich \u00fcber die Regeln.' },
              { step: '02', icon: <FileText className="w-6 h-6" />, title: 'Bewerbung schreiben', desc: 'F\u00fclle das Bewerbungsformular aus. Erz\u00e4hle uns \u00fcber dich, deine RP-Erfahrung und warum du Teil unseres Teams werden willst.' },
              { step: '03', icon: <Play className="w-6 h-6" />, title: 'Loslegen & spielen', desc: 'Nach der Best\u00e4tigung deiner Bewerbung kannst du sofort loslegen. W\u00e4hle deine Fraktion und starte dein RP-Abenteuer in Hamburg!' },
            ].map((s, i) => (
              <AnimatedSection key={i} delay={i * 150}>
                <div className="text-center relative">
                  <div className="relative z-10 w-20 h-20 mx-auto mb-6 rounded-3xl glass-strong flex items-center justify-center text-blue-400 animate-border-glow">
                    {s.icon}
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-bold flex items-center justify-center shadow-lg">{s.step}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                  <p className="text-white/30 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WARUM WIR? ========== */}
      <section className="py-28 md:py-36 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/30 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <AnimatedSection className="text-center mb-16 md:mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-blue-300 text-xs font-medium uppercase tracking-wider">
              <BadgeCheck className="w-3.5 h-3.5" /> Vorteile
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Warum <span className="text-gradient">Hamburg Horizon?</span>
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            {[
              { icon: <Headphones className="w-6 h-6" />, title: 'Erfahrenes Support-Team', desc: 'Unser Team steht dir 24/7 zur Seite. Egal ob Fragen, Probleme oder Vorschl\u00e4ge \u2013 wir sind immer f\u00fcr dich da und helfen schnell und kompetent.' },
              { icon: <Crosshair className="w-6 h-6" />, title: 'Regelm\u00e4\u00dfige Events', desc: 'Gro\u00dfeins\u00e4tze, Server-Events und spannende Storylines sorgen daf\u00fcr, dass es nie langweilig wird. Jede Woche gibt es neue Abenteuer zu erleben.' },
              { icon: <MessageSquare className="w-6 h-6" />, title: 'Offene Kommunikation', desc: 'Transparenz ist uns wichtig. Entscheidungen werden offen kommuniziert und die Community wird bei wichtigen \u00c4nderungen mit einbezogen.' },
              { icon: <Sparkles className="w-6 h-6" />, title: 'St\u00e4ndige Verbesserungen', desc: 'Wir entwickeln unseren Server konstant weiter. Neue Features, verbesserte Systeme und frischer Content \u2013 basierend auf dem Feedback unserer Spieler.' },
            ].map((v, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <GlassCard hover className="p-6 md:p-8 flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    {v.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">{v.title}</h3>
                    <p className="text-white/30 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </GlassCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== REGELN HIGHLIGHT ========== */}
      <section className="py-28 md:py-36 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16 md:mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-blue-300 text-xs font-medium uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" /> Regelwerk
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Unsere <span className="text-gradient">Grunds&auml;tze</span>
            </h2>
            <p className="text-white/30 text-base md:text-lg max-w-xl mx-auto">
              F\u00fcr ein faires und spa&szlig;iges Miteinander gelten bei uns klare Regeln.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[
              { icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, text: 'Realistisches RP ist Pflicht \u2013 kein FailRP, kein PowerRP' },
              { icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, text: 'Respektvoller Umgang miteinander \u2013 immer und \u00fcberall' },
              { icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, text: 'Teamplay steht an erster Stelle \u2013 gemeinsam sind wir stark' },
              { icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, text: 'Support-Entscheidungen werden akzeptiert und respektiert' },
              { icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, text: 'Keine Werbung f\u00fcr andere Server oder Projekte' },
              { icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, text: 'Aktive Teilnahme am Server-Leben wird erwartet' },
            ].map((r, i) => (
              <AnimatedSection key={i} delay={i * 80}>
                <div className="glass rounded-xl p-4 flex items-start gap-3 hover:bg-white/[0.04] transition-all">
                  {r.icon}
                  <span className="text-sm text-white/50 leading-relaxed">{r.text}</span>
                </div>
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
                Bereit f&uuml;r dein <span className="text-gradient">Abenteuer</span>?
              </h2>
              <p className="text-white/30 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
                Hamburg Horizon RP &ndash; Dein Leben. Deine Entscheidungen. Deine Stadt.
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
                <button
                  className="group flex items-center justify-center gap-3 glass border border-white/10 text-white px-8 py-4 rounded-2xl text-base font-medium hover:bg-white/[0.06] transition-all hover:scale-[1.03] active:scale-[0.98]"
                  onClick={() => user ? setView('bewerbung') : handleLogin()}
                >
                  <FileText className="w-5 h-5 text-blue-400" />
                  Bewerbung schreiben
                </button>
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
                {['Startseite', 'Bewerbung', 'Discord'].map(l => (
                  <button key={l} onClick={() => l === 'Discord' ? window.open('https://discord.gg/cFQUWrzpC', '_blank') : setView(l === 'Startseite' ? 'landing' : 'bewerbung')} className="block text-sm text-white/25 hover:text-white/50 transition-colors">
                    {l}
                  </button>
                ))}
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
            <p>Made with <span className="text-red-400">&hearts;</span> f&uuml;r die Community</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ===== FORM HELPERS (unchanged) =====
function FormSection({ number, title, emoji, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold flex items-center gap-2 text-white/90">
        <span className="text-lg">{emoji}</span>
        <span className="text-blue-400">{number}.</span> {title}
      </h3>
      <div className="space-y-4 pl-7 border-l-2 border-blue-500/20">{children}</div>
    </div>
  );
}
function FormField({ label, required, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-white/60 text-sm">{label} {required && <span className="text-red-400">*</span>}</Label>
      {children}
    </div>
  );
}
function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 py-1.5">
      <span className="text-white/40 text-sm">{label}</span>
      <span className="text-white/80 text-sm whitespace-pre-wrap">{value || '-'}</span>
    </div>
  );
}
const inputClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-blue-500/20 rounded-xl";

// ===== BEWERBUNG FORM =====
function BewerbungForm({ user, setView }) {
  const [formData, setFormData] = useState({
    vorname: '', alter: '', robloxName: '',
    spielzeit: '', fraktion: '', andererServer: '', bannWarn: '',
    warumTeam: '', geduldig: '', stundenProWoche: '',
    failRpLoesung: '', streitLoesung: '',
    hatMikro: false, kenntRegeln: false, bleibtNett: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/bewerbungen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ formData }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Einreichen');
      setSubmitted(true);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 text-center animate-scale-in">
        <GlassCard className="p-12">
          <div className="w-20 h-20 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Bewerbung eingereicht!</h2>
          <p className="text-white/40 mb-8 text-sm">Deine Bewerbung wurde erfolgreich eingereicht und wird an das Discord-Team gesendet.</p>
          <Button onClick={() => setView('meine-bewerbungen')} className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2">
            <Eye className="w-4 h-4" /> Meine Bewerbungen ansehen
          </Button>
        </GlassCard>
      </div>
    );
  }

  const discordSince = user?.createdAt ? formatDate(user.createdAt) : '-';

  return (
    <div className="max-w-3xl mx-auto px-4 animate-fade-in-up">
      <GlassCard className="p-6 md:p-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-1">Bewerbung f&uuml;r das Server-Team</h2>
          <p className="text-white/30 text-sm">HHRP &ndash; Hamburg Horizon RP</p>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent mt-6" />
        </div>

        <div className="mb-8 p-4 rounded-xl bg-[#5865F2]/[0.08] border border-[#5865F2]/20">
          <h3 className="text-xs font-semibold text-blue-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
            <DiscordIcon size={14} /> Discord-Daten (automatisch)
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm"><User className="w-3.5 h-3.5 text-white/30" /><span className="text-white/50">Name:</span><span className="text-white/90 truncate">{user?.globalName || user?.username}</span></div>
            <div className="flex items-center gap-2 text-sm"><Mail className="w-3.5 h-3.5 text-white/30" /><span className="text-white/50">E-Mail:</span><span className="text-white/90 truncate">{user?.email || 'N/A'}</span></div>
            <div className="flex items-center gap-2 text-sm"><Calendar className="w-3.5 h-3.5 text-white/30" /><span className="text-white/50">Seit:</span><span className="text-white/90">{discordSince}</span></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <FormSection number="1" title={"\u00dcBER MICH"} emoji={"\uD83D\uDC4B"}>
            <FormField label="Dein Vorname" required><Input value={formData.vorname} onChange={e => setFormData({...formData, vorname: e.target.value})} placeholder="Max" className={inputClass} required /></FormField>
            <FormField label="Wie alt bist du?" required><Input value={formData.alter} onChange={e => setFormData({...formData, alter: e.target.value})} placeholder="18" className={inputClass} required /></FormField>
            <FormField label="Dein Roblox-Name" required><Input value={formData.robloxName} onChange={e => setFormData({...formData, robloxName: e.target.value})} placeholder="Dein Roblox-Benutzername" className={inputClass} required /></FormField>
          </FormSection>
          <FormSection number="2" title="MEIN ZOCKEN IN EH" emoji={"\uD83C\uDFAE"}>
            <FormField label="Wie lange spielst du schon auf unserem Server?" required><Input value={formData.spielzeit} onChange={e => setFormData({...formData, spielzeit: e.target.value})} placeholder="z.B. 3 Monate" className={inputClass} required /></FormField>
            <FormField label="In welcher Fraktion bist du am meisten (Polizei, FW, RD)?" required><Input value={formData.fraktion} onChange={e => setFormData({...formData, fraktion: e.target.value})} placeholder="z.B. Polizei" className={inputClass} required /></FormField>
            <FormField label="Hast du schon mal auf einem anderen Server geholfen?" required><Input value={formData.andererServer} onChange={e => setFormData({...formData, andererServer: e.target.value})} placeholder="Ja/Nein - wenn ja, wo?" className={inputClass} required /></FormField>
            <FormField label="Hattest du hier schon mal einen Bann oder Warn?" required><Input value={formData.bannWarn} onChange={e => setFormData({...formData, bannWarn: e.target.value})} placeholder="Ja/Nein - wenn ja, wof\u00fcr?" className={inputClass} required /></FormField>
          </FormSection>
          <FormSection number="3" title="WARUM WILLST DU INS TEAM?" emoji={"\uD83D\uDEE0\uFE0F"}>
            <FormField label="Warum hast du Bock, bei uns im Team zu helfen?" required><Textarea value={formData.warumTeam} onChange={e => setFormData({...formData, warumTeam: e.target.value})} placeholder="Schreib hier kurz was dazu..." className={`${inputClass} min-h-[100px]`} required /></FormField>
            <FormField label="Bist du geduldig, auch wenn jemand nervt?" required><Textarea value={formData.geduldig} onChange={e => setFormData({...formData, geduldig: e.target.value})} placeholder="Schreib hier kurz was dazu..." className={`${inputClass} min-h-[100px]`} required /></FormField>
            <FormField label="Wie viele Stunden bist du pro Woche auf dem Server?" required><Input value={formData.stundenProWoche} onChange={e => setFormData({...formData, stundenProWoche: e.target.value})} placeholder="z.B. 10-15 Stunden" className={inputClass} required /></FormField>
          </FormSection>
          <FormSection number="4" title="WAS MACHST DU IN DIESER SITUATION?" emoji={"\u2696\uFE0F"}>
            <FormField label="Ein Spieler macht Fail-RP (z.B. f\u00e4hrt mit 3 Reifen weiter). Was sagst du ihm?" required><Textarea value={formData.failRpLoesung} onChange={e => setFormData({...formData, failRpLoesung: e.target.value})} placeholder="Deine L\u00f6sung..." className={`${inputClass} min-h-[100px]`} required /></FormField>
            <FormField label="Zwei Leute streiten sich im Support-Chat voll heftig. Wie kl\u00e4rst du das?" required><Textarea value={formData.streitLoesung} onChange={e => setFormData({...formData, streitLoesung: e.target.value})} placeholder="Deine L\u00f6sung..." className={`${inputClass} min-h-[100px]`} required /></FormField>
          </FormSection>
          <FormSection number="5" title="KURZER CHECK" emoji={"\uD83C\uDF99\uFE0F"}>
            <div className="space-y-4">
              {[
                { id: 'mikro', key: 'hatMikro', label: 'Ich habe ein Mikro (f\u00fcr Support-Gespr\u00e4che).' },
                { id: 'regeln', key: 'kenntRegeln', label: 'Ich kenne unsere Server-Regeln gut.' },
                { id: 'nett', key: 'bleibtNett', label: 'Ich bleibe immer nett zu den Spielern.' },
              ].map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <Checkbox id={c.id} checked={formData[c.key]} onCheckedChange={(checked) => setFormData({...formData, [c.key]: checked === true})} className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" />
                  <Label htmlFor={c.id} className="text-white/70 cursor-pointer text-sm">{c.label}</Label>
                </div>
              ))}
            </div>
          </FormSection>
          {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Wird eingereicht...</> : <><Send className="w-4 h-4" /> Bewerbung einreichen</>}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

// ===== MEINE BEWERBUNGEN =====
function MeineBewerbungen({ user }) {
  const [bewerbungen, setBewerbungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchBewerbungen = async () => {
    setLoading(true);
    try { const res = await fetch('/api/bewerbungen'); const data = await res.json(); setBewerbungen(data.bewerbungen || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchBewerbungen(); }, []);

  const handleWithdraw = async (id) => {
    if (!confirm('M\u00f6chtest du diese Bewerbung wirklich zur\u00fcckziehen?')) return;
    try { const res = await fetch(`/api/bewerbungen/${id}`, { method: 'DELETE' }); if (res.ok) { fetchBewerbungen(); if (selected?.id === id) setSelected(null); } }
    catch (e) { console.error(e); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;

  if (selected) {
    const fd = selected.formData || {};
    return (
      <div className="max-w-3xl mx-auto px-4 animate-fade-in-up">
        <Button variant="ghost" onClick={() => setSelected(null)} className="text-white/50 hover:text-white mb-4 gap-2 rounded-xl"><ArrowLeft className="w-4 h-4" /> Zur&uuml;ck</Button>
        <GlassCard className="p-6 md:p-10 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div><h2 className="text-xl font-bold">Bewerbung #{selected.id.substring(0, 8)}</h2><p className="text-sm text-white/35 mt-1">Eingereicht am {formatDateTime(selected.createdAt)}</p></div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(selected.status)}`}><StatusIcon status={selected.status} />{selected.status}</span>
          </div>
          {selected.claimedByName && <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm flex items-center gap-2"><User className="w-4 h-4" />Wird bearbeitet von: {selected.claimedByName}</div>}
          <Separator className="bg-white/[0.06]" />
          <div className="space-y-1">{['Vorname:vorname','Alter:alter','Roblox-Name:robloxName','Spielzeit:spielzeit','Fraktion:fraktion','Anderer Server:andererServer','Bann/Warn:bannWarn','Warum Team?:warumTeam','Geduldig?:geduldig','Stunden/Woche:stundenProWoche','Fail-RP L\u00f6sung:failRpLoesung','Streit-L\u00f6sung:streitLoesung'].map(r => { const [l,k] = r.split(':'); return <DetailRow key={k} label={l} value={fd[k]} />; })}<DetailRow label="Mikro" value={fd.hatMikro ? 'Ja' : 'Nein'} /><DetailRow label="Kennt Regeln" value={fd.kenntRegeln ? 'Ja' : 'Nein'} /><DetailRow label="Bleibt nett" value={fd.bleibtNett ? 'Ja' : 'Nein'} /></div>
          {(selected.status === 'Eingereicht' || selected.status === 'In Bearbeitung') && (<><Separator className="bg-white/[0.06]" /><div className="flex justify-end"><Button variant="destructive" onClick={() => handleWithdraw(selected.id)} className="gap-2 rounded-xl"><AlertTriangle className="w-4 h-4" /> Zur&uuml;ckziehen</Button></div></>)}
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meine Bewerbungen</h2>
        <Button variant="ghost" onClick={fetchBewerbungen} className="text-white/40 hover:text-white gap-2 rounded-xl" size="sm"><RefreshCw className="w-4 h-4" /></Button>
      </div>
      {bewerbungen.length === 0 ? (
        <GlassCard className="p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4"><FileText className="w-8 h-8 text-white/15" /></div>
          <p className="text-white/40 mb-2">Keine Bewerbungen vorhanden</p>
          <p className="text-white/20 text-sm">Schreibe deine erste Bewerbung, um Teil des Teams zu werden.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">{bewerbungen.map(b => (
          <GlassCard key={b.id} hover className="p-5" onClick={() => setSelected(b)}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3"><span className="font-semibold text-sm">#{b.id.substring(0, 8)}</span><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(b.status)}`}><StatusIcon status={b.status} />{b.status}</span></div>
                <p className="text-xs text-white/30">{formatDateTime(b.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                {(b.status === 'Eingereicht' || b.status === 'In Bearbeitung') && (<Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleWithdraw(b.id); }} className="text-red-400/70 hover:text-red-300 hover:bg-red-500/10 text-xs rounded-lg h-7">Zur&uuml;ckziehen</Button>)}
                <ChevronRight className="w-4 h-4 text-white/20" />
              </div>
            </div>
          </GlassCard>
        ))}</div>
      )}
    </div>
  );
}

// ===== ADMIN PANEL =====
function AdminPanel({ user }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('bewerbungen');
  const [loginForm, setLoginForm] = useState({ mitarbeiterNummer: '', email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    (async () => { try { const res = await fetch('/api/admin/me'); const data = await res.json(); if (data.admin) setAdmin(data.admin); } catch (e) { console.error(e); } finally { setLoading(false); } })();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginLoading(true); setLoginError('');
    try { const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginForm) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); setAdmin(data.admin); }
    catch (e) { setLoginError(e.message); } finally { setLoginLoading(false); }
  };
  const handleLogout = async () => { await fetch('/api/admin/logout', { method: 'POST' }); setAdmin(null); };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;

  if (!admin) {
    return (
      <div className="max-w-md mx-auto px-4 animate-fade-in-up">
        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4"><Lock className="w-8 h-8 text-blue-400" /></div>
            <h2 className="text-2xl font-bold">Admin Panel</h2>
            <p className="text-white/40 text-sm mt-2">Melde dich mit deinen Anmeldedaten an</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2"><Label className="text-white/60 text-sm">Mitarbeiter Nummer</Label><Input value={loginForm.mitarbeiterNummer} onChange={e => setLoginForm({...loginForm, mitarbeiterNummer: e.target.value})} placeholder="z.B. MA-001" className={inputClass} required /></div>
            <div className="space-y-2"><Label className="text-white/60 text-sm">E-Mail / Benutzername</Label><Input value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} placeholder="deine@email.de" className={inputClass} required /></div>
            <div className="space-y-2"><Label className="text-white/60 text-sm">Passwort</Label><Input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" className={inputClass} required /></div>
            {loginError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{loginError}</div>}
            <button type="submit" disabled={loginLoading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition-all">
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} Anmelden
            </button>
          </form>
          {user && user.adminLevel > 0 && (
            <div className="mt-6 text-center">
              <Separator className="bg-white/[0.06] mb-6" />
              <p className="text-white/30 text-sm mb-3">Angemeldet als <span className="text-blue-300 font-medium">{user.adminRole}</span></p>
              <Button variant="outline" className="border-blue-500/20 text-blue-300 hover:bg-blue-500/10 rounded-xl"
                onClick={() => setAdmin({ discordUserId: user.id, discordUsername: user.globalName || user.username, roleName: user.adminRole, roleLevel: user.adminLevel, canCreateAccounts: user.canCreateAccounts, canSeeAll: user.canSeeAll, viaDiscord: true })}>
                Mit Discord-Rolle fortfahren
              </Button>
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-bold">Admin Panel</h2><p className="text-white/40 text-sm mt-1">Rolle: <span className="text-blue-300">{admin.roleName}</span>{admin.discordUsername && ` | ${admin.discordUsername}`}</p></div>
        <Button variant="ghost" onClick={handleLogout} className="text-white/40 hover:text-white gap-2 rounded-xl"><LogOut className="w-4 h-4" /> Abmelden</Button>
      </div>
      <div className="flex gap-2 bg-white/[0.02] p-1 rounded-xl border border-white/[0.04] w-fit">
        <button onClick={() => setTab('bewerbungen')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === 'bewerbungen' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:text-white'}`}><FileText className="w-4 h-4" /> Bewerbungen</button>
        {(admin.canCreateAccounts || admin.roleLevel >= 3) && (
          <button onClick={() => setTab('accounts')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === 'accounts' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:text-white'}`}><UserPlus className="w-4 h-4" /> Accounts</button>
        )}
      </div>
      {tab === 'bewerbungen' && <AdminBewerbungen admin={admin} />}
      {tab === 'accounts' && <AdminAccounts admin={admin} />}
    </div>
  );
}

// ===== ADMIN BEWERBUNGEN =====
function AdminBewerbungen({ admin }) {
  const [bewerbungen, setBewerbungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const fetchData = async () => { setLoading(true); try { const res = await fetch('/api/admin/bewerbungen'); const data = await res.json(); setBewerbungen(data.bewerbungen || []); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id, action, status) => {
    try {
      const body = action ? { action } : { status };
      const res = await fetch(`/api/admin/bewerbungen/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) { fetchData(); if (selected?.id === id) setSelected(data.bewerbung); } else { alert(data.error || 'Fehler'); }
    } catch (e) { console.error(e); }
  };

  const filtered = bewerbungen.filter(b => filter === 'all' || b.status === filter);
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;

  if (selected) {
    const fd = selected.formData || {};
    return (
      <div className="space-y-4 animate-fade-in-up">
        <Button variant="ghost" onClick={() => setSelected(null)} className="text-white/50 hover:text-white gap-2 rounded-xl"><ArrowLeft className="w-4 h-4" /> Zur&uuml;ck</Button>
        <GlassCard className="p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div><h3 className="text-xl font-bold">Bewerbung #{selected.id.substring(0, 8)}</h3><p className="text-white/35 text-sm">Von: {selected.globalName || selected.username} | {formatDateTime(selected.createdAt)}</p></div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(selected.status)}`}><StatusIcon status={selected.status} />{selected.status}</span>
          </div>
          {selected.claimedByName && <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">&Uuml;bernommen von: {selected.claimedByName}</div>}
          <div className="p-4 rounded-xl bg-[#5865F2]/[0.08] border border-[#5865F2]/20">
            <h4 className="text-xs font-semibold text-blue-300 mb-2 uppercase tracking-wider">Discord-Daten</h4>
            <div className="grid sm:grid-cols-3 gap-2 text-sm">
              <div><span className="text-white/40">Name:</span> <span className="text-white/80">{selected.username}</span></div>
              <div><span className="text-white/40">E-Mail:</span> <span className="text-white/80">{selected.email || '-'}</span></div>
              <div><span className="text-white/40">Seit:</span> <span className="text-white/80">{selected.discordCreatedAt ? formatDate(selected.discordCreatedAt) : '-'}</span></div>
            </div>
          </div>
          <Separator className="bg-white/[0.06]" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">Bewerbungsdaten</h4>
            {['Vorname:vorname','Alter:alter','Roblox-Name:robloxName','Spielzeit:spielzeit','Fraktion:fraktion','Anderer Server:andererServer','Bann/Warn:bannWarn','Warum Team?:warumTeam','Geduldig?:geduldig','Stunden/Woche:stundenProWoche','Fail-RP L\u00f6sung:failRpLoesung','Streit-L\u00f6sung:streitLoesung'].map(r => { const [l,k] = r.split(':'); return <DetailRow key={k} label={l} value={fd[k]} />; })}
            <DetailRow label="Mikro" value={fd.hatMikro ? 'Ja' : 'Nein'} /><DetailRow label="Kennt Regeln" value={fd.kenntRegeln ? 'Ja' : 'Nein'} /><DetailRow label="Bleibt nett" value={fd.bleibtNett ? 'Ja' : 'Nein'} />
          </div>
          {selected.status !== 'Zur\u00fcckgezogen' && (
            <><Separator className="bg-white/[0.06]" />
            <div className="flex flex-wrap gap-3">
              {!selected.claimedBy && <Button onClick={() => handleAction(selected.id, 'claim')} className="bg-blue-600 hover:bg-blue-700 gap-2 rounded-xl"><User className="w-4 h-4" /> &Uuml;bernehmen</Button>}
              {selected.claimedBy === admin.discordUserId && <Button onClick={() => handleAction(selected.id, 'unclaim')} variant="outline" className="border-white/10 text-white gap-2 rounded-xl">Freigeben</Button>}
              {(selected.claimedBy === admin.discordUserId || admin.canSeeAll) && selected.status !== 'Angenommen' && <Button onClick={() => handleAction(selected.id, null, 'Angenommen')} className="bg-green-600 hover:bg-green-700 gap-2 rounded-xl"><CheckCircle2 className="w-4 h-4" /> Annehmen</Button>}
              {(selected.claimedBy === admin.discordUserId || admin.canSeeAll) && selected.status !== 'Abgelehnt' && <Button onClick={() => handleAction(selected.id, null, 'Abgelehnt')} variant="destructive" className="gap-2 rounded-xl"><XCircle className="w-4 h-4" /> Ablehnen</Button>}
            </div></>
          )}
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap bg-white/[0.02] p-1 rounded-xl border border-white/[0.04]">
          {['all', 'Eingereicht', 'In Bearbeitung', 'Angenommen', 'Abgelehnt', 'Zur\u00fcckgezogen'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-blue-600 text-white' : 'text-white/35 hover:text-white/60'}`}>
              {f === 'all' ? 'Alle' : f} <span className="opacity-40 ml-0.5">({f === 'all' ? bewerbungen.length : bewerbungen.filter(b => b.status === f).length})</span>
            </button>
          ))}
        </div>
        <Button variant="ghost" onClick={fetchData} className="text-white/40 hover:text-white gap-2 rounded-xl" size="sm"><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>
      {filtered.length === 0 ? (
        <GlassCard className="p-14 text-center"><FileText className="w-12 h-12 text-white/15 mx-auto mb-4" /><p className="text-white/40">Keine Bewerbungen gefunden.</p></GlassCard>
      ) : (
        <div className="space-y-2.5">{filtered.map(b => (
          <GlassCard key={b.id} hover className="p-4" onClick={() => setSelected(b)}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {b.avatar ? <img src={`https://cdn.discordapp.com/avatars/${b.userId}/${b.avatar}.png?size=40`} alt="" className="w-9 h-9 rounded-full ring-2 ring-white/5" /> : <div className="w-9 h-9 rounded-full bg-blue-600/20 flex items-center justify-center"><User className="w-4 h-4 text-blue-300" /></div>}
                <div><p className="font-medium text-sm">{b.globalName || b.username}</p><p className="text-xs text-white/30">#{b.id.substring(0, 8)} | {formatDateTime(b.createdAt)}</p></div>
              </div>
              <div className="flex items-center gap-2.5">
                {b.claimedByName && <span className="text-xs text-yellow-300/80 bg-yellow-500/10 px-2 py-0.5 rounded-lg">{b.claimedByName}</span>}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(b.status)}`}><StatusIcon status={b.status} />{b.status}</span>
              </div>
            </div>
          </GlassCard>
        ))}</div>
      )}
    </div>
  );
}

// ===== ADMIN ACCOUNTS =====
function AdminAccounts({ admin }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ discordUserId: '', discordUsername: '', mitarbeiterNummer: '', email: '', password: '' });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchAccounts = async () => { setLoading(true); try { const res = await fetch('/api/admin/accounts'); const data = await res.json(); setAccounts(data.accounts || []); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { fetchAccounts(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setCreateLoading(true); setCreateError('');
    try { const res = await fetch('/api/admin/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); setShowCreate(false); setForm({ discordUserId: '', discordUsername: '', mitarbeiterNummer: '', email: '', password: '' }); fetchAccounts(); }
    catch (e) { setCreateError(e.message); } finally { setCreateLoading(false); }
  };
  const handleDelete = async (id) => { if (!confirm('Account wirklich l\u00f6schen?')) return; try { await fetch(`/api/admin/accounts/${id}`, { method: 'DELETE' }); fetchAccounts(); } catch (e) { console.error(e); } };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Admin Accounts</h3>
        {admin.canCreateAccounts && <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"><UserPlus className="w-4 h-4" /> Neuer Account</button>}
      </div>
      {showCreate && (
        <GlassCard className="p-6 animate-fade-in-down">
          <h4 className="font-semibold mb-4 text-sm">Neuen Account erstellen</h4>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-white/60 text-sm">Discord User-ID</Label><Input value={form.discordUserId} onChange={e => setForm({...form, discordUserId: e.target.value})} placeholder="z.B. 123456789012345678" className={inputClass} required /></div>
              <div className="space-y-2"><Label className="text-white/60 text-sm">Discord Username</Label><Input value={form.discordUsername} onChange={e => setForm({...form, discordUsername: e.target.value})} placeholder="Username" className={inputClass} /></div>
              <div className="space-y-2"><Label className="text-white/60 text-sm">Mitarbeiter Nummer</Label><Input value={form.mitarbeiterNummer} onChange={e => setForm({...form, mitarbeiterNummer: e.target.value})} placeholder="z.B. MA-001" className={inputClass} required /></div>
              <div className="space-y-2"><Label className="text-white/60 text-sm">E-Mail</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="admin@hhrp.de" className={inputClass} required /></div>
              <div className="space-y-2 sm:col-span-2"><Label className="text-white/60 text-sm">Passwort</Label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Sicheres Passwort" className={inputClass} required /></div>
            </div>
            {createError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{createError}</div>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="text-white/50 rounded-xl">Abbrechen</Button>
              <button type="submit" disabled={createLoading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">{createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Erstellen</button>
            </div>
          </form>
        </GlassCard>
      )}
      {accounts.length === 0 ? (
        <GlassCard className="p-14 text-center"><UserPlus className="w-12 h-12 text-white/15 mx-auto mb-4" /><p className="text-white/40">Noch keine Accounts erstellt.</p></GlassCard>
      ) : (
        <div className="space-y-2.5">{accounts.map(a => (
          <GlassCard key={a.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5"><span className="font-medium text-sm">{a.discordUsername || 'Unbekannt'}</span><Badge variant="outline" className="text-blue-300 border-blue-500/30 text-xs">{a.roleName}</Badge></div>
                <p className="text-xs text-white/30">MA: {a.mitarbeiterNummer} | {a.email}</p>
              </div>
              {admin.canCreateAccounts && <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="text-red-400/60 hover:text-red-300 hover:bg-red-500/10 rounded-xl h-8 w-8"><Trash2 className="w-4 h-4" /></Button>}
            </div>
          </GlassCard>
        ))}</div>
      )}
    </div>
  );
}

// ===== MAIN APP =====
export default function App() {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => { try { const res = await fetch('/api/auth/me'); const data = await res.json(); if (data.user) setUser(data.user); } catch (e) { console.error(e); } finally { setLoading(false); } })();
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
      const msgs = { 'auth_failed': 'Anmeldung fehlgeschlagen.', 'token_failed': 'Token-Austausch fehlgeschlagen.', 'user_failed': 'Benutzer konnte nicht abgerufen werden.', 'not_member': 'Du bist kein Mitglied des Hamburg Horizon RP Discord-Servers. Bitte trete zuerst bei: https://discord.gg/cFQUWrzpC', 'server_error': 'Ein Serverfehler ist aufgetreten.' };
      setTimeout(() => alert(msgs[err] || 'Ein Fehler ist aufgetreten.'), 500);
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('login') === 'success') window.history.replaceState({}, '', window.location.pathname);
  }, []);

  // Scroll to top on view change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [view]);

  return (
    <div className="min-h-screen">
      <Navbar user={user} view={view} setView={setView} loading={loading} />
      <main className={view === 'landing' ? '' : 'pt-24 pb-8'}>
        {view === 'landing' && <LandingPage user={user} setView={setView} />}
        {view === 'bewerbung' && user && <BewerbungForm user={user} setView={setView} />}
        {view === 'bewerbung' && !user && !loading && (
          <div className="max-w-md mx-auto px-4 text-center animate-scale-in">
            <GlassCard className="p-12">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4"><LogIn className="w-8 h-8 text-blue-400" /></div>
              <h2 className="text-xl font-bold mb-3">Anmeldung erforderlich</h2>
              <p className="text-white/40 mb-6 text-sm">Bitte melde dich mit Discord an, um eine Bewerbung einzureichen.</p>
              <button onClick={() => window.location.href = '/api/auth/discord'} className="flex items-center justify-center gap-2 mx-auto bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-[#5865F2]/20 transition-all hover:scale-105">
                <DiscordIcon size={14} /> Mit Discord anmelden
              </button>
            </GlassCard>
          </div>
        )}
        {view === 'meine-bewerbungen' && user && <MeineBewerbungen user={user} />}
        {view === 'admin' && <AdminPanel user={user} />}
      </main>
    </div>
  );
}
