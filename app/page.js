'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { ScrollProgressBar } from '@/components/shared/ScrollProgressBar';
import { LoginModal } from '@/components/LoginModal';
import WebsiteStatsTracker from '@/components/WebsiteStatsTracker';
import { PromoBanner } from '@/components/shop/PromoBanner';
import { getActiveBannerPromotions } from '@/lib/shop-promotions';
import { 
  FileText, Users, CheckCircle2, Clock, ArrowRight, 
  Zap, Target, Loader2, ChevronDown, Sparkles, UserCircle,
  Gamepad2, Shield, TrendingUp, Heart, Scale, Siren, 
  Eye, Download, UserPlus, Activity, Smartphone
} from 'lucide-react';

function AnimatedCounter({ value, suffix = '', showDiff = false, format = false }) {
  const [count, setCount] = useState(0);
  const [prevCount, setPrevCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    const end = parseInt(value) || 0;
    if (end === 0) { setCount(0); return; }
    
    // Animation wenn sich der Wert ändert
    if (end !== prevCount && prevCount !== 0) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
    
    let start = count;
    const increment = (end - start) / 40;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { 
        setCount(end); 
        setPrevCount(end);
        clearInterval(timer); 
      } else {
        setCount(Math.floor(start));
      }
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  
  const diff = count - prevCount;
  
  // Formatierung für große Zahlen (1000 -> 1k, 1000000 -> 1M)
  const formatNumber = (num) => {
    if (!format) return num.toLocaleString('de-DE');
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return num.toString();
  };
  
  return (
    <span className={`inline-block transition-all duration-300 ${isAnimating ? 'scale-110 text-green-400' : ''}`}>
      {formatNumber(count)}
      {suffix}
      {showDiff && diff > 0 && isAnimating && (
        <span className="ml-2 text-sm text-green-400 animate-bounce">
          +{diff}
        </span>
      )}
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({ total: 0, angenommen: 0, inBearbeitung: 0 });
  const [discordStats, setDiscordStats] = useState({ memberCount: 0, onlineCount: 0, teamCount: 0 });
  const [websiteStats, setWebsiteStats] = useState({ 
    totalVisits: 0, 
    uniqueVisitors: 0, 
    appInstalls: 0,
    pwaDownloads: 0,  // Renamed: Einmalige PWA-Downloads
    registeredUsers: 0 
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  // 🎉 Alle aktuell aktiven Shop-Aktionen (für den Landingpage-Banner-Slider)
  // Auf der Landingpage zeigen wir die Aktionen allen Besuchern (auch VIPs)
  // als Marketing-Hinweis – die Eligibility-Prüfung erfolgt im Shop.
  const [bannerPromos, setBannerPromos] = useState([]);

  useEffect(() => {
    setBannerPromos(getActiveBannerPromotions());
    const id = setInterval(() => setBannerPromos(getActiveBannerPromotions()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    // Priorität 1: Schnelle Stats sofort laden
    fetchStats();
    fetchWebsiteStats();
    
    // Priorität 2: Langsame Stats verzögert laden (nicht blockend)
    setTimeout(() => {
      fetchDiscordStats();
      fetchTeamPreview();
    }, 100);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/bewerbungen/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchDiscordStats = async () => {
    try {
      const res = await fetch('/api/discord/stats');
      if (res.ok) setDiscordStats(await res.json());
    } catch (e) { console.error(e); }
  };
  
  const fetchWebsiteStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWebsiteStats(data.stats);
        }
      }
    } catch (e) { console.error('Stats fetch error:', e); }
  };

  // Auto-refresh stats alle 10 Sekunden
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWebsiteStats();
    }, 10000); // 10 Sekunden
    
    return () => clearInterval(interval);
  }, []);

  const fetchTeamPreview = async () => {
    try {
      const res = await fetch('/api/team/members');
      if (res.ok) {
        const data = await res.json();
        // Get first 6 members for preview
        setTeamMembers((data.members || []).slice(0, 6));
      }
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
      {/* Stats Tracker - Aktiviert! */}
      <WebsiteStatsTracker />
      
      {/* Scroll Progress Bar */}
      <ScrollProgressBar />

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
      <section className="relative px-4 sm:px-6 pt-24 pb-16 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Badge */}
          <div className="text-center mb-8">
            <div className={isMobile ? "" : "animate-fade-in-down"} style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--theme-accent)' }} />
                <span className="text-xs tracking-wider uppercase font-medium" style={{ color: 'rgba(var(--theme-accent-rgb), 0.7)' }}>Bewerbungen offen</span>
              </div>
            </div>
          </div>
          
          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight ${!isMobile ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <span className="text-white">Werde Teil</span>
              <br />
              <span style={{ color: 'var(--theme-accent)', opacity: 0.6 }}>unseres Teams</span>
            </h1>
          </div>
          
          {/* Subtitle */}
          <div className="text-center mb-12">
            <p className={`text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed px-4 ${!isMobile ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.4s', animationFillMode: 'both', color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
              Bewirb dich für das Team von Hamburg Horizon Roleplay und gestalte gemeinsam mit uns die Community.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className={`flex flex-col items-center gap-4 max-w-4xl mx-auto px-4 ${!isMobile ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
            {user ? (
              <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-center gap-4">
                {/* Primary Button */}
                <Button 
                  size="lg"
                  onClick={() => router.push('/bewerbung')}
                  className="rounded-2xl h-14 lg:h-16 px-8 lg:px-12 text-base lg:text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] w-full lg:w-auto"
                  style={{ 
                    background: 'var(--theme-accent)', 
                    color: '#000',
                    boxShadow: '0 25px 50px -12px rgba(var(--theme-accent-rgb), 0.25)'
                  }}
                >
                  <FileText className="w-5 h-5 lg:w-6 lg:h-6 mr-2" />
                  Jetzt bewerben
                </Button>

                {/* Secondary Buttons Row */}
                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 w-full lg:w-auto">
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/profil')}
                    className="rounded-2xl h-14 lg:h-16 px-6 lg:px-10 text-base lg:text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98] glass w-full sm:flex-1 lg:w-auto"
                    style={{ 
                      borderColor: 'rgba(var(--theme-accent-rgb), 0.15)',
                      color: 'rgba(var(--theme-accent-rgb), 0.7)'
                    }}
                  >
                    <UserCircle className="w-5 h-5 lg:w-6 lg:h-6 mr-2" />
                    Mein Profil
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/meine-bewerbungen')}
                    className="rounded-2xl h-14 lg:h-16 px-6 lg:px-10 text-base lg:text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98] glass w-full sm:flex-1 lg:w-auto"
                    style={{ 
                      borderColor: 'rgba(var(--theme-accent-rgb), 0.15)',
                      color: 'rgba(var(--theme-accent-rgb), 0.7)'
                    }}
                  >
                    <Clock className="w-5 h-5 lg:w-6 lg:h-6 mr-2" />
                    Bewerbungen
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="inline-flex items-center justify-center gap-3 px-10 py-4 lg:px-12 lg:py-5 rounded-2xl text-base lg:text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  background: 'var(--theme-accent)',
                  color: '#000',
                  boxShadow: '0 25px 50px -12px rgba(var(--theme-accent-rgb), 0.25)'
                }}
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Mit Discord anmelden
              </button>
            )}
          </div>

          {/* Scroll Indicator */}
          <div className="mt-16 lg:mt-20 text-center animate-float">
            <ChevronDown className="w-5 h-5 mx-auto" style={{ color: 'rgba(var(--theme-accent-rgb), 0.2)' }} />
          </div>
        </div>
      </section>

      {/* === 🎉 AKTIONS-BANNER (Slider: rotiert durch alle aktiven Aktionen) === */}
      {bannerPromos.length > 0 && (
        <section className="px-4 sm:px-6 pb-4 md:pb-0">
          <div className={`max-w-5xl mx-auto ${!isMobile ? 'animate-fade-in-up' : ''}`}>
            <PromoBanner
              promos={bannerPromos}
              variant="landing"
              onClick={() => {
                if (user) router.push('/profil?tab=shop');
                else setLoginModalOpen(true);
              }}
            />
          </div>
        </section>
      )}

      {/* === STATS === */}
      <section className="px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          {/* Top Divider */}
          <div className="h-px mb-12 md:mb-16" style={{ background: `linear-gradient(to right, transparent, rgba(var(--theme-accent-rgb), 0.15), transparent)` }} />
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6">
            {[
              { icon: <FileText className="w-5 h-5" />, value: stats.total, label: 'Bewerbungen' },
              { icon: <CheckCircle2 className="w-5 h-5" />, value: stats.angenommen, label: 'Angenommen' },
              { icon: <Clock className="w-5 h-5" />, value: stats.inBearbeitung, label: 'In Bearbeitung' },
            ].map((stat, i) => (
              <GlassCard key={i} className="p-6 md:p-8 text-center animate-fade-in-up" hover>
                <div 
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-300"
                  style={{ 
                    background: 'rgba(var(--theme-accent-rgb), 0.08)',
                    border: '1px solid rgba(var(--theme-accent-rgb), 0.12)',
                    color: 'var(--theme-accent)'
                  }}
                >
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tabular-nums mb-2">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-xs md:text-sm tracking-wider uppercase font-medium" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
                  {stat.label}
                </div>
              </GlassCard>
            ))}
          </div>
          
          {/* Website Stats Grid - NEU mit Icons & Animationen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {[
              { 
                icon: Eye, 
                value: websiteStats.totalVisits, 
                label: 'Webseiten-Besuche', 
                gradient: 'from-blue-500 to-cyan-500',
                bgGlow: 'rgba(59, 130, 246, 0.15)'
              },
              { 
                icon: UserPlus, 
                value: websiteStats.registeredUsers, 
                label: 'Registrierte User', 
                gradient: 'from-purple-500 to-pink-500',
                bgGlow: 'rgba(168, 85, 247, 0.15)'
              },
              { 
                icon: Smartphone, 
                value: websiteStats.pwaDownloads, 
                label: 'PWA-Downloads', 
                gradient: 'from-green-500 to-emerald-500',
                bgGlow: 'rgba(34, 197, 94, 0.15)'
              },
            ].map((stat, i) => {
              const IconComponent = stat.icon;
              return (
                <GlassCard 
                  key={i} 
                  className="p-6 md:p-8 text-center animate-fade-in-up relative overflow-hidden group" 
                  hover
                >
                  {/* Glow Effect on Hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                    style={{ background: stat.bgGlow }}
                  />
                  
                  <div className="relative z-10">
                    <div 
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 bg-gradient-to-br ${stat.gradient} group-hover:scale-110 group-hover:rotate-6`}
                      style={{ 
                        boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
                      }}
                    >
                      <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    
                    <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tabular-nums mb-2">
                      <AnimatedCounter value={stat.value} showDiff={true} format={true} />
                    </div>
                    
                    <div className="text-xs md:text-sm tracking-wider uppercase font-medium text-white/40">
                      {stat.label}
                    </div>
                    
                    {/* Live Indicator */}
                    <div className="flex items-center justify-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[10px] text-green-400 uppercase tracking-wider">Live</span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
          
          {/* Bottom Divider */}
          <div className="h-px mt-12 md:mt-16" style={{ background: `linear-gradient(to right, transparent, rgba(var(--theme-accent-rgb), 0.15), transparent)` }} />
        </div>
      </section>

      {/* === FEATURES === */}
      <section className="px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4">Warum bei uns?</h2>
            <p className="text-base md:text-lg" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
              Was dich als Teil unseres Teams erwartet
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { icon: <Zap className="w-6 h-6" />, title: 'Schnelle Bearbeitung', desc: 'Deine Bewerbung wird zügig und professionell von unserem Team geprüft.' },
              { icon: <Users className="w-6 h-6" />, title: 'Starke Community', desc: 'Werde Teil eines engagierten Teams mit einer wachsenden Community.' },
              { icon: <Target className="w-6 h-6" />, title: 'Faire Chancen', desc: 'Jede Bewerbung wird fair und transparent von uns bewertet.' },
            ].map((f, i) => (
              <GlassCard key={i} className="p-6 md:p-8 animate-fade-in-up" hover>
                <div 
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 md:mb-5 transition-all duration-300 group-hover:scale-110"
                  style={{ 
                    background: 'rgba(var(--theme-accent-rgb), 0.08)',
                    border: '1px solid rgba(var(--theme-accent-rgb), 0.12)',
                    color: 'rgba(var(--theme-accent-rgb), 0.7)'
                  }}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">{f.title}</h3>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
                  {f.desc}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* === DISCORD STATS + TEAM PREVIEW (2-spaltig) === */}
      <section className="px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            
            {/* Discord Stats (Links) */}
            <GlassCard className="p-6 md:p-8" hover>
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'rgba(88,101,242,0.1)',
                    border: '1px solid rgba(88,101,242,0.2)',
                  }}
                >
                  <svg className="w-6 h-6" fill="#5865F2" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">Discord Server</h3>
                  <p className="text-sm" style={{ color: 'rgba(var(--theme-accent-rgb), 0.5)' }}>Live Statistiken</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(var(--theme-accent-rgb), 0.05)' }}>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5" style={{ color: 'rgba(var(--theme-accent-rgb), 0.7)' }} />
                    <span className="text-sm md:text-base" style={{ color: 'rgba(var(--theme-accent-rgb), 0.6)' }}>Mitglieder</span>
                  </div>
                  <span className="text-xl md:text-2xl font-bold text-white tabular-nums">
                    <AnimatedCounter value={discordStats.memberCount} />
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(var(--theme-accent-rgb), 0.05)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm md:text-base" style={{ color: 'rgba(var(--theme-accent-rgb), 0.6)' }}>Online</span>
                  </div>
                  <span className="text-xl md:text-2xl font-bold text-white tabular-nums">
                    <AnimatedCounter value={discordStats.onlineCount} />
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(var(--theme-accent-rgb), 0.05)' }}>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5" style={{ color: 'rgba(var(--theme-accent-rgb), 0.7)' }} />
                    <span className="text-sm md:text-base" style={{ color: 'rgba(var(--theme-accent-rgb), 0.6)' }}>Teamler</span>
                  </div>
                  <span className="text-xl md:text-2xl font-bold text-white tabular-nums">
                    <AnimatedCounter value={discordStats.teamCount} />
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Team Preview (Rechts) */}
            <GlassCard className="p-6 md:p-8" hover>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">Unser Team</h3>
                  <p className="text-sm mt-1" style={{ color: 'rgba(var(--theme-accent-rgb), 0.5)' }}>Die Menschen hinter HHRP</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/team')}
                  className="text-sm"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  Alle anzeigen →
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                {teamMembers.length > 0 ? teamMembers.map((member, i) => (
                  <div key={i} className="text-center">
                    <div className="relative mb-3">
                      <div 
                        className="w-16 h-16 md:w-20 md:h-20 rounded-xl mx-auto overflow-hidden"
                        style={{ 
                          background: 'rgba(var(--theme-accent-rgb), 0.1)',
                          border: '2px solid rgba(var(--theme-accent-rgb), 0.15)'
                        }}
                      >
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UserCircle className="w-8 h-8 md:w-10 md:h-10" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }} />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--theme-accent-rgb), 0.2)', border: '2px solid #080808' }}>
                        <Shield className="w-3 h-3" style={{ color: 'var(--theme-accent)' }} />
                      </div>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-white truncate">{member.username}</p>
                    <p className="text-xs truncate" style={{ color: 'rgba(var(--theme-accent-rgb), 0.5)' }}>{member.roleName}</p>
                  </div>
                )) : (
                  <div className="col-span-3 text-center py-8" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Lade Team...</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* === WAS MACHT HHRP BESONDERS? (2-spaltig) === */}
      <section className="px-4 sm:px-6 py-16 md:py-24" style={{ background: 'rgba(var(--theme-accent-rgb), 0.02)' }}>
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
              <span className="text-xs tracking-wider uppercase font-medium" style={{ color: 'rgba(var(--theme-accent-rgb), 0.7)' }}>Hamburg Horizon RP</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4">Was macht uns besonders?</h2>
            <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
              Erlebe Realismus, Spannung und deine eigene Story im besten RP-Erlebnis auf <strong style={{ color: 'var(--theme-accent)' }}>Notruf Hamburg</strong>
            </p>
          </div>

          {/* Features Grid (2 Spalten auf Desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {[
              { 
                icon: <Gamepad2 className="w-6 h-6" />, 
                title: 'Realistisches & ernsthaftes Roleplay', 
                desc: 'Tauche ein in eine glaubwürdige Welt, in der deine Entscheidungen Konsequenzen haben.' 
              },
              { 
                icon: <Shield className="w-6 h-6" />, 
                title: 'Strukturierte & organisierte Fraktionen', 
                desc: 'Polizei, Feuerwehr, Rettungsdienst und weitere – mit klaren Abläufen und echtem Teamplay.' 
              },
              { 
                icon: <Heart className="w-6 h-6" />, 
                title: 'Aktive & hilfsbereite Community', 
                desc: 'Kein toxisches Umfeld – sondern Spieler, die wirklich RP leben wollen.' 
              },
              { 
                icon: <Siren className="w-6 h-6" />, 
                title: 'Spannende Einsätze & dynamische Storylines', 
                desc: 'Jeder Einsatz erzählt eine Geschichte – vielleicht schon bald deine.' 
              },
              { 
                icon: <Scale className="w-6 h-6" />, 
                title: 'Faire Regeln & erfahrenes Team', 
                desc: 'Klare Strukturen, transparente Entscheidungen und Support auf Augenhöhe.' 
              },
              { 
                icon: <TrendingUp className="w-6 h-6" />, 
                title: 'Deine Rolle. Deine Entscheidung.', 
                desc: 'Werde Polizist, Sanitäter, Feuerwehrkraft oder Zivilist – jede Handlung beeinflusst deine Geschichte.' 
              },
            ].map((f, i) => (
              <GlassCard key={i} className="p-6 md:p-7 flex items-start gap-4 md:gap-5" hover>
                <div 
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
                  style={{ 
                    background: 'rgba(var(--theme-accent-rgb), 0.08)',
                    border: '1px solid rgba(var(--theme-accent-rgb), 0.12)',
                    color: 'rgba(var(--theme-accent-rgb), 0.7)'
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm md:text-base leading-relaxed" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
                    {f.desc}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* === STEPS === */}
      <section className="px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4">So funktioniert's</h2>
            <p className="text-base md:text-lg" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
              In 3 einfachen Schritten
            </p>
          </div>

          {/* Steps List */}
          <div className="space-y-4 md:space-y-5">
            {[
              { step: '01', title: 'Mit Discord anmelden', desc: 'Melde dich mit deinem Discord-Account an, damit wir dich kontaktieren können.' },
              { step: '02', title: 'Bewerbung ausfüllen', desc: 'Fülle das Bewerbungsformular mit deinen Informationen und Erfahrungen aus.' },
              { step: '03', title: 'Antwort erhalten', desc: 'Unser Team prüft deine Bewerbung und meldet sich per Discord bei dir.' },
            ].map((item, i) => (
              <GlassCard key={i} className="flex items-start gap-4 md:gap-6 p-5 md:p-7 animate-fade-in-left" hover>
                <span 
                  className="text-4xl md:text-5xl lg:text-6xl font-bold shrink-0 tabular-nums select-none leading-none" 
                  style={{ color: 'rgba(var(--theme-accent-rgb), 0.12)' }}
                >
                  {item.step}
                </span>
                <div className="pt-1">
                  <h3 className="text-base md:text-lg lg:text-xl font-semibold text-white mb-1 md:mb-2">{item.title}</h3>
                  <p className="text-sm md:text-base leading-relaxed" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
                    {item.desc}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="px-4 sm:px-6 py-16 md:py-24 lg:py-28">
        <div className="max-w-3xl mx-auto">
          <GlassCard className="text-center p-8 md:p-12 lg:p-16 animate-scale-in">
            {/* Icon */}
            <Sparkles className="w-7 h-7 md:w-8 md:h-8 mx-auto mb-5 md:mb-6" style={{ color: 'rgba(var(--theme-accent-rgb), 0.5)' }} />
            
            {/* Heading */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">
              Bereit durchzustarten?
            </h2>
            
            {/* Description */}
            <p className="text-base md:text-lg mb-8 md:mb-10 max-w-lg mx-auto leading-relaxed" style={{ color: 'rgba(var(--theme-accent-rgb), 0.45)' }}>
              Bewirb dich jetzt und werde Teil unseres Teams.
            </p>
            
            {/* CTA Button */}
            {user ? (
              <Button 
                size="lg"
                onClick={() => router.push('/bewerbung')}
                className="rounded-2xl h-14 md:h-16 px-10 md:px-12 text-base md:text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  background: 'var(--theme-accent)', 
                  color: '#000',
                  boxShadow: '0 25px 50px -12px rgba(var(--theme-accent-rgb), 0.25)'
                }}
              >
                Bewerbung starten <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2" />
              </Button>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="inline-flex items-center justify-center gap-3 px-10 md:px-12 py-4 md:py-5 rounded-2xl text-base md:text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  background: 'var(--theme-accent)',
                  color: '#000',
                  boxShadow: '0 25px 50px -12px rgba(var(--theme-accent-rgb), 0.25)'
                }}
              >
                Mit Discord anmelden <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-1" />
              </button>
            )}
          </GlassCard>
        </div>
      </section>

      {/* Login Modal */}
      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </div>
  );
}
