'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import DailyBonusCard from '@/components/DailyBonusCard';
import AnimatedValue from '@/components/AnimatedValue';
import Pagination from '@/components/Pagination';
import { Countdown } from '@/components/Countdown';
import { PWANotifications } from '@/components/PWANotifications';
import { 
  Wallet, CreditCard, Trophy, Gift, User, Award, Clock, 
  TrendingUp, TrendingDown, Check, Loader2, FileText, Calendar, 
  Mail, ExternalLink, LayoutDashboard, IdCard, ClipboardList,
  Building2, Hash, Key, Copy, ArrowUpRight, ArrowDownRight, 
  AlertCircle, AlertTriangle, Shield, Star, MessageSquare, Ban, 
  ChevronUp, ShieldCheck, CheckCircle, DollarSign, RefreshCw,
  ShoppingCart, PiggyBank, Receipt, Heart, Smartphone, Bell, 
  Zap, Download, Crown, Sparkles, Rocket, Wifi, WifiOff, Globe, 
  Timer, Lock, Gem, PartyPopper, Handshake, Monitor, BadgeCheck, 
  CircleDollarSign, BellRing, AppWindow, Settings, ImagePlus, 
  Trash2, Upload, BellOff, ZoomIn, ZoomOut, PieChart, BarChart3,
  Lightbulb, Filter, Search, ArrowLeftRight, Target, Calculator,
  TrendingUpIcon, BarChart2, Send, XCircle, Infinity, Car, Coins,
  ChevronDown, ChevronRight, Palette, Wand2, Activity, Eye, EyeOff,
  MousePointer2, Layers, Gauge, Percent, ArrowRight
} from 'lucide-react';
import { LicenseBadge } from '@/components/profile/LicenseBadge';
import { LevelProgress } from '@/components/profile/LevelProgress';
import { StatsCard } from '@/components/profile/StatsCard';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getDiscordAvatarUrl } from '@/lib/discord-utils';
import { format, parseISO, subDays, isAfter, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { KrediteDetailView, FinanzStatistikenView } from '@/components/profile/FinanceTabsContent';
import { ErweiterteTransaktionenView, SparkontoManagementView } from '@/components/profile/FinanceTabsContent2';
import { TransferMoneyView } from '@/components/profile/TransferMoneyView';
import { ShopView } from '@/components/profile/ShopView';
import { CharacterManagementView } from '@/components/profile/CharacterManagementView';
import BattlePassView from '@/components/profile/BattlePassView';
import HamburgHorizonTab from '@/components/profile/HamburgHorizonTab';
import LicensesView from '@/components/profile/LicensesView';
import ProfileTour, { TourStartButton, hasCompletedProfileTour } from '@/components/profile/ProfileTour';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { useRealtime } from '@/hooks/useRealtime';
import { RealtimeIndicator } from '@/components/shared/RealtimeIndicator';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

function SkeletonCard({ className = "" }) {
  return (
    <div className={`glass rounded-xl p-6 border border-white/[0.08] animate-pulse ${className}`}>
      <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-white/10 rounded w-2/3"></div>
    </div>
  );
}

function BotStatusCard({ status, onRetry }) {
  // Zeige immer nur die rote Error-Karte, keine blaue Loading-Karte
  if (!status.isOnline || status.error || status.checking) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/40 via-zinc-950/60 to-zinc-950/80 backdrop-blur-xl shadow-2xl shadow-red-900/20 animate-fade-in-scale">
        {/* Animierter Hintergrund-Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(239,68,68,0.15),transparent_50%)] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-8 md:p-12">
          <div className="flex flex-col items-center text-center space-y-8 max-w-xl mx-auto">
            {/* Icon mit Pulse-Ring */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500/30 to-red-600/20 border border-red-500/30 flex items-center justify-center backdrop-blur-sm">
                <svg
                  className="w-12 h-12 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 5.636L5.636 18.364m0-12.728l12.728 12.728"
                  />
                </svg>
              </div>
            </div>

            {/* Titel */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300">Connection Error</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Verbindung fehlgeschlagen
              </h3>
              <p className="text-white/60 text-base md:text-lg leading-relaxed">
                We could not connect to the HHRP server.
              </p>
            </div>

            {/* Error Code Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-black/40 border border-red-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-red-500/60 animate-pulse" style={{ animationDelay: '200ms' }} />
                <span className="w-2 h-2 rounded-full bg-red-500/30 animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
              <code className="text-sm font-mono text-red-300 tracking-widest font-semibold">
                CODE: HHRP Server 404
              </code>
            </div>

            {/* Status-Zeile */}
            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                <div className="relative shrink-0">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-white/90">Automatische Wiederverbindung</p>
                  <p className="text-xs text-white/40 mt-0.5">Nächster Versuch in wenigen Sekunden …</p>
                </div>
              </div>

              <Button
                onClick={onRetry}
                variant="outline"
                className="w-full h-12 rounded-xl border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 text-white/80 hover:text-white transition-all duration-200 group"
              >
                <svg
                  className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Jetzt manuell verbinden
              </Button>
            </div>

            {/* Footer Hint */}
            <p className="text-[11px] text-white/30 tracking-wide">
              Die Seite aktualisiert sich automatisch, sobald die Verbindung wiederhergestellt ist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Wird angezeigt, wenn der Battle Pass vom Website-Betreiber deaktiviert wurde.
function BattlePassBlockedCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-zinc-950/60 to-zinc-950/80 backdrop-blur-xl shadow-2xl shadow-amber-900/20 animate-fade-in-scale">
      {/* Animierter Hintergrund */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.12),transparent_55%)] pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Diagonale Schraffur-Overlay (Baustellen-Look) */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #f59e0b 0 10px, transparent 10px 20px)',
        }}
      />

      <div className="relative p-8 md:p-14">
        <div className="flex flex-col items-center text-center space-y-8 max-w-2xl mx-auto">
          {/* Icon */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse" />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-amber-500/25 to-amber-600/15 border border-amber-500/30 flex items-center justify-center backdrop-blur-sm">
              <svg
                className="w-14 h-14 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
              <span className="relative rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-300">
              Feature deactivated
            </span>
          </div>

          {/* Titel */}
          <div className="space-y-4">
            <h3 className="text-3xl md:text-5xl font-bold text-white tracking-tight bg-gradient-to-br from-white via-white to-amber-200/80 bg-clip-text text-transparent">
              Battle Pass nicht verfügbar
            </h3>
            <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
              We're sorry, but the connection to the HHRP server has been blocked by the website operator.
              Therefore, the <span className="text-amber-300 font-semibold">Battle Pass</span> is no longer active and no longer works.
            </p>
          </div>

          {/* Info-Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-white/90 mb-0.5">Server-Verbindung</p>
              <p className="text-[11px] text-white/40">Blockiert</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-white/90 mb-0.5">Battle Pass</p>
              <p className="text-[11px] text-white/40">Inaktiv</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-white/90 mb-0.5">Betreiber</p>
              <p className="text-[11px] text-white/40">Entscheidung</p>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full pt-4 border-t border-white/[0.06]">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-black/40 border border-amber-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-amber-500/60 animate-pulse" style={{ animationDelay: '200ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-500/30 animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
              <code className="text-sm font-mono text-amber-300 tracking-widest font-semibold">
                CODE: FEATURE_BLOCKED
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function IDCard({ character, avatarUrl, userId }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const calculateBirthDate = (age, userId) => {
    if (!age) return 'N/A';
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;
    const seed = parseInt(userId?.slice(0, 8) || '12345678', 10);
    const day = (seed % 28) + 1;
    const month = (seed % 12) + 1;
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${birthYear}`;
  };

  const birthDate = calculateBirthDate(character?.age, userId);
  const issueDate = '15.04.2020';
  const expiryDate = 'Unbegrenzt gültig';

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        className="relative p-6 rounded-2xl border overflow-hidden cursor-pointer group transition-all hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
          borderColor: 'rgba(255, 255, 255, 0.15)'
        }}
        onClick={() => setShowDetails(true)}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-40"
          style={{ mixBlendMode: 'overlay' }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider">Bundesrepublik HHRP</p>
              <p className="text-sm font-bold text-white">PERSONALAUSWEIS</p>
            </div>
            <IdCard className="w-6 h-6 text-white/60" />
          </div>

          <div className="flex gap-4 mb-6">
            <div className="w-20 h-24 rounded-lg overflow-hidden border-2 border-white/20 flex-shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-white/40" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <p className="text-[10px] text-white/50 uppercase">Name</p>
                <p className="text-lg font-bold text-white">{character?.vorname} {character?.nachname}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-white/50">Geboren</p>
                  <p className="text-white font-medium">{birthDate}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/50">Alter</p>
                  <p className="text-white font-medium">{character?.age || 'N/A'} Jahre</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-[10px] text-white/40 text-center">
              Klicke für Details • {expiryDate}
            </p>
          </div>
        </div>

        {/* Server Logo */}
        <div className="absolute bottom-4 right-4 w-12 h-12 rounded-lg overflow-hidden opacity-50 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="HHRP" className="w-full h-full object-contain" />
        </div>

        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.02)' }} />
      </div>

      {showDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowDetails(false)}
        >
          <div 
            className="w-full max-w-md p-6 rounded-2xl border"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Personalausweis</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <XCircle className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Vorname</span>
                <span className="text-white font-medium">{character?.vorname || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Nachname</span>
                <span className="text-white font-medium">{character?.nachname || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Geburtsdatum</span>
                <span className="text-white font-medium">{birthDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Alter</span>
                <span className="text-white font-medium">{character?.age || 'N/A'} Jahre</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Geschlecht</span>
                <span className="text-white font-medium">{character?.geschlecht || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Ausgestellt</span>
                <span className="text-white font-medium">{issueDate}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-white/50">Gültig bis</span>
                <span className="text-green-400 font-medium">{expiryDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DriversLicenseCard({ character, avatarUrl, userId, licenses = [] }) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Hilfsfunktion: Prüfe ob User eine Lizenz hat
  const hasLicense = (licenseId) => {
    return licenses.some(l => {
      if (!l) return false;
      if (typeof l === 'string') return l === licenseId || l.includes(licenseId);
      if (typeof l === 'object') return (l.name === licenseId || l.id === licenseId || l.name?.includes(licenseId) || l.id?.includes(licenseId));
      return false;
    });
  };
  
  // Prüfe welche Führerscheine vorhanden sind
  const hasPKW = hasLicense('führerschein_pkw');
  const hasMotorrad = hasLicense('führerschein_motorrad') || hasLicense('motorradschein');
  const hasLKW = hasLicense('führerschein_lkw') || hasLicense('lkw');
  const hasBus = hasLicense('führerschein_bus') || hasLicense('bus');
  
  const hasAnyLicense = hasPKW || hasMotorrad || hasLKW || hasBus;
  
  const calculateBirthDate = (age, userId) => {
    if (!age) return 'N/A';
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;
    const seed = parseInt(userId?.slice(0, 8) || '12345678', 10);
    const day = (seed % 28) + 1;
    const month = (seed % 12) + 1;
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${birthYear}`;
  };

  const birthDate = calculateBirthDate(character?.age, userId);
  const issueDate = '10.06.2021';
  const expiryDate = 'Unbegrenzt gültig';

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Moderner Führerschein - Glasmorphism Style */}
      <div 
        className="relative p-6 rounded-2xl border overflow-hidden cursor-pointer group transition-all hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
          borderColor: 'rgba(255, 255, 255, 0.15)'
        }}
        onClick={() => setShowDetails(true)}
      >
        {/* Gradient Overlay */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${hasAnyLicense ? 'from-green-500/20 to-emerald-500/20' : 'from-gray-500/20 to-gray-600/20'} opacity-40`}
          style={{ mixBlendMode: 'overlay' }}
        />
        
        {/* Card Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider">Bundesrepublik HHRP</p>
              <p className="text-sm font-bold text-white">FÜHRERSCHEIN</p>
            </div>
            <Car className="w-6 h-6 text-white/60" />
          </div>

          {hasAnyLicense ? (
            <>
              {/* Main Info */}
              <div className="flex gap-4 mb-6">
                {/* Avatar */}
                <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-white/20 flex-shrink-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-white/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-[10px] text-white/50 uppercase">Name</p>
                    <p className="text-base font-bold text-white">{character?.vorname} {character?.nachname}</p>
                  </div>
                  <div className="text-xs">
                    <p className="text-[10px] text-white/50">Geboren</p>
                    <p className="text-white font-medium">{birthDate}</p>
                  </div>
                </div>
              </div>

              {/* Klassen */}
              <div className="space-y-2">
                <p className="text-xs text-white/50 uppercase">Klassen</p>
                <div className="flex flex-wrap gap-2">
                  {hasPKW && (
                    <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
                      <span className="text-sm font-bold text-white">B</span>
                      <span className="text-[10px] text-white/50 ml-1">PKW</span>
                    </div>
                  )}
                  {hasMotorrad && (
                    <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
                      <span className="text-sm font-bold text-white">A</span>
                      <span className="text-[10px] text-white/50 ml-1">Motorrad</span>
                    </div>
                  )}
                  {hasLKW && (
                    <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
                      <span className="text-sm font-bold text-white">C</span>
                      <span className="text-[10px] text-white/50 ml-1">LKW</span>
                    </div>
                  )}
                  {hasBus && (
                    <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
                      <span className="text-sm font-bold text-white">D</span>
                      <span className="text-[10px] text-white/50 ml-1">Bus</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-white/60 text-sm mb-2">Kein Führerschein</p>
              <p className="text-white/40 text-xs">Erwerbe einen im Discord Bot</p>
            </div>
          )}

          {/* Hint */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-[10px] text-white/40 text-center">
              {hasAnyLicense ? `Klicke für Details • ${expiryDate}` : 'Keine Fahrerlaubnis vorhanden'}
            </p>
          </div>
        </div>

        {/* Server Logo */}
        <div className="absolute bottom-4 right-4 w-12 h-12 rounded-lg overflow-hidden opacity-50 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="HHRP" className="w-full h-full object-contain" />
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.02)' }} />
      </div>

      {/* Detail Modal */}
      {showDetails && hasAnyLicense && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowDetails(false)}
        >
          <div 
            className="w-full max-w-md p-6 rounded-2xl border"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Führerschein</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <XCircle className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Vorname</span>
                <span className="text-white font-medium">{character?.vorname || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Nachname</span>
                <span className="text-white font-medium">{character?.nachname || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Geburtsdatum</span>
                <span className="text-white font-medium">{birthDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Ausgestellt</span>
                <span className="text-white font-medium">{issueDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Gültig bis</span>
                <span className="text-green-400 font-medium">{expiryDate}</span>
              </div>
              <div className="py-2">
                <span className="text-white/50 block mb-2">Klassen</span>
                <div className="flex flex-wrap gap-2">
                  {hasPKW && <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30">B - PKW</span>}
                  {hasMotorrad && <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30">A - Motorrad</span>}
                  {hasLKW && <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold border border-orange-500/30">C - LKW</span>}
                  {hasBus && <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold border border-purple-500/30">D - Bus</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeaponsLicenseCard({ character, avatarUrl, userId, licenses = [] }) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Hilfsfunktion: Prüfe ob User eine Lizenz hat
  const hasLicense = (licenseId) => {
    return licenses.some(l => {
      if (!l) return false;
      if (typeof l === 'string') return l === licenseId || l.includes(licenseId);
      if (typeof l === 'object') return (l.name === licenseId || l.id === licenseId || l.name?.includes(licenseId) || l.id?.includes(licenseId));
      return false;
    });
  };
  
  // Prüfe ob User einen Waffenschein hat
  const hasWeaponsLicense = hasLicense('waffenschein') || hasLicense('waffen');
  
  // Finde die Waffenschein-Lizenz um das Ausstellungsdatum zu bekommen
  const weaponsLicenseData = licenses.find(l => {
    if (!l) return false;
    const name = typeof l === 'string' ? l : (l.name || l.id);
    return name === 'waffenschein' || name === 'waffen';
  });
  
  const calculateBirthDate = (age, userId) => {
    if (!age) return 'N/A';
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;
    const seed = parseInt(userId?.slice(0, 8) || '12345678', 10);
    const day = (seed % 28) + 1;
    const month = (seed % 12) + 1;
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${birthYear}`;
  };

  const birthDate = calculateBirthDate(character?.age, userId);
  
  // Berechne Ablaufdatum: 30 Tage nach Ausstellung
  const issueDate = '20.08.2022';
  const calculateExpiryDate = () => {
    if (weaponsLicenseData && typeof weaponsLicenseData === 'object' && weaponsLicenseData.purchasedAt) {
      const issued = new Date(weaponsLicenseData.purchasedAt);
      const expiry = new Date(issued);
      expiry.setDate(expiry.getDate() + 30);
      return expiry.toLocaleDateString('de-DE');
    }
    // Fallback: 30 Tage nach issueDate
    const issued = new Date('2022-08-20');
    const expiry = new Date(issued);
    expiry.setDate(expiry.getDate() + 30);
    return expiry.toLocaleDateString('de-DE');
  };
  const expiryDate = calculateExpiryDate();

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Moderner Waffenschein - Glasmorphism Style */}
      <div 
        className="relative p-6 rounded-2xl border overflow-hidden cursor-pointer group transition-all hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
          borderColor: 'rgba(255, 255, 255, 0.15)'
        }}
        onClick={() => setShowDetails(true)}
      >
        {/* Gradient Overlay */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${hasWeaponsLicense ? 'from-red-500/20 to-orange-500/20' : 'from-gray-500/20 to-gray-600/20'} opacity-40`}
          style={{ mixBlendMode: 'overlay' }}
        />
        
        {/* Card Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider">Bundesrepublik HHRP</p>
              <p className="text-sm font-bold text-white">WAFFENSCHEIN</p>
            </div>
            <Shield className="w-6 h-6 text-white/60" />
          </div>

          {hasWeaponsLicense ? (
            <>
              {/* Main Info */}
              <div className="flex gap-4 mb-6">
                {/* Avatar */}
                <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-white/20 flex-shrink-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-white/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-[10px] text-white/50 uppercase">Name</p>
                    <p className="text-base font-bold text-white">{character?.vorname} {character?.nachname}</p>
                  </div>
                  <div className="text-xs">
                    <p className="text-[10px] text-white/50">Geboren</p>
                    <p className="text-white font-medium">{birthDate}</p>
                  </div>
                </div>
              </div>

              {/* Berechtigung */}
              <div className="space-y-2">
                <p className="text-xs text-white/50 uppercase">Berechtigung</p>
                <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/20">
                  <p className="text-sm font-semibold text-white">Führen von Schusswaffen</p>
                  <p className="text-xs text-white/50 mt-1">Gültig im gesamten HHRP-Gebiet</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-white/60 text-sm mb-2">Kein Waffenschein</p>
              <p className="text-white/40 text-xs">Erwerbe einen im Discord Bot</p>
            </div>
          )}

          {/* Hint */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-[10px] text-white/40 text-center">
              {hasWeaponsLicense ? `Klicke für Details • Gültig bis ${expiryDate}` : 'Keine Waffenberechtigung vorhanden'}
            </p>
          </div>
        </div>

        {/* Server Logo */}
        <div className="absolute bottom-4 right-4 w-12 h-12 rounded-lg overflow-hidden opacity-50 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="HHRP" className="w-full h-full object-contain" />
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.02)' }} />
      </div>

      {/* Detail Modal */}
      {showDetails && hasWeaponsLicense && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowDetails(false)}
        >
          <div 
            className="w-full max-w-md p-6 rounded-2xl border"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Waffenschein</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <XCircle className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Vorname</span>
                <span className="text-white font-medium">{character?.vorname || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Nachname</span>
                <span className="text-white font-medium">{character?.nachname || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Geburtsdatum</span>
                <span className="text-white font-medium">{birthDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Ausgestellt</span>
                <span className="text-white font-medium">{issueDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Gültig bis</span>
                <span className="text-green-400 font-medium">{expiryDate}</span>
              </div>
              <div className="py-2">
                <span className="text-white/50 block mb-2">Berechtigung</span>
                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm font-semibold text-red-400">Führen von Schusswaffen</p>
                  <p className="text-xs text-white/50 mt-1">Kategorie: Alle Handfeuerwaffen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BankCard({ card, userName, userData }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const bankNames = {
    'elite_federal': 'ELITE FEDERAL',
    'hamburg_horizon': 'HAMBURG HORIZON',
    'deutsche_bank': 'DEUTSCHE BANK',
    'sparkasse': 'SPARKASSE HAMBURG',
    'nordic_capital': 'NORDIC CAPITAL',
    'metrova_trust': 'METROVA TRUST'
  };

  const bankColors = {
    'elite_federal': 'from-yellow-500/20 to-orange-500/20',
    'hamburg_horizon': 'from-blue-500/20 to-cyan-500/20',
    'deutsche_bank': 'from-blue-600/20 to-indigo-600/20',
    'sparkasse': 'from-red-500/20 to-pink-500/20',
    'nordic_capital': 'from-purple-500/20 to-pink-500/20',
    'metrova_trust': 'from-green-500/20 to-emerald-500/20'
  };

  const bankName = bankNames[card.bankId] || 'HAMBURG BANK';
  const bankColor = bankColors[card.bankId] || 'from-blue-500/20 to-cyan-500/20';
  
  // Guthaben aus userData
  const totalBalance = (userData?.money?.bank || 0) + (userData?.money?.cash || 0) + (userData?.money?.savings || 0);
  const bankBalance = userData?.money?.bank || 0;
  const cashBalance = userData?.money?.cash || 0;
  const savingsBalance = userData?.money?.savings || 0;

  const formatCardNumber = (num) => {
    if (!num) return '••• ••• •••';
    const str = num.toString();
    // Letzten 3 Ziffern zeigen, Rest maskieren
    if (str.length >= 9) {
      return `••• ••• ${str.slice(-3)}`;
    }
    return str.match(/.{1,3}/g)?.join(' ') || str;
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert!`);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Moderne Bank Card - Glasmorphism Style */}
      <div 
        className="relative p-6 rounded-2xl border overflow-hidden cursor-pointer group transition-all hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
          borderColor: 'rgba(255, 255, 255, 0.15)'
        }}
        onClick={() => setShowDetails(true)}
      >
        {/* Gradient Overlay */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${bankColor} opacity-40`}
          style={{ mixBlendMode: 'overlay' }}
        />
        
        {/* Card Content */}
        <div className="relative z-10">
          {/* Bank Name & Logo */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-white/60" />
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider">Bank</p>
                <p className="text-sm font-bold text-white">{bankName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/50">Inhaber</p>
              <p className="text-sm font-semibold text-white truncate max-w-[120px]">{userName}</p>
            </div>
          </div>

          {/* Kontonummer - Chip Style */}
          <div className="mb-6">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <CreditCard className="w-3.5 h-3.5 text-white/60" />
              <span className="text-sm font-mono text-white tracking-wider">
                {formatCardNumber(card.accountNumber)}
              </span>
            </div>
          </div>

          {/* Guthaben */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-white/50 mb-1">Gesamt-Guthaben</p>
              <p className="text-3xl font-bold text-white tracking-tight">
                <AnimatedNumber value={totalBalance} />€
              </p>
            </div>
            
            {/* Breakdown */}
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3 h-3 text-white/40" />
                <span className="text-white/60"><AnimatedNumber value={bankBalance} duration={700} />€</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-white/40" />
                <span className="text-white/60"><AnimatedNumber value={cashBalance} duration={700} />€</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PiggyBank className="w-3 h-3 text-white/40" />
                <span className="text-white/60"><AnimatedNumber value={savingsBalance} duration={700} />€</span>
              </div>
            </div>
          </div>

          {/* Hint */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-[10px] text-white/40 text-center">
              Klicke für Details • Limit: {(card.limit || 1000000).toLocaleString('de-DE')}€
            </p>
          </div>
        </div>

        {/* Server Logo statt Chip Decoration */}
        <div className="absolute bottom-4 right-4 w-12 h-12 rounded-lg overflow-hidden opacity-50 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="HHRP" className="w-full h-full object-contain" />
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.02)' }} />
      </div>

      {/* Detail Modal */}
      {showDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowDetails(false)}
        >
          <div 
            className="w-full max-w-md p-6 rounded-2xl border"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Karten-Details</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <XCircle className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Bank</span>
                <span className="text-white font-medium">{bankName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Kontonummer</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">{card.accountNumber}</span>
                  <button
                    onClick={() => copyToClipboard(card.accountNumber, 'Kontonummer')}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <Copy className="w-3.5 h-3.5 text-white/40" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Bank-PIN</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">{card.code || card.pin || '•••'}</span>
                  {(card.code || card.pin) && (
                    <button
                      onClick={() => copyToClipboard(card.code || card.pin, 'Bank-PIN')}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <Copy className="w-3.5 h-3.5 text-white/40" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Limit</span>
                <span className="text-white font-medium">{(card.limit || 1000000).toLocaleString('de-DE')}€</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Inhaber</span>
                <span className="text-white font-medium">{userName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Bank-Guthaben</span>
                <span className="text-white font-medium">{bankBalance.toLocaleString('de-DE')}€</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Bargeld</span>
                <span className="text-white font-medium">{cashBalance.toLocaleString('de-DE')}€</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/50">Sparkonto</span>
                <span className="text-white font-medium">{savingsBalance.toLocaleString('de-DE')}€</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-white/50">Gesamt</span>
                <span className="text-green-400 font-bold text-lg">{totalBalance.toLocaleString('de-DE')}€</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function ProfilPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [nichtVerifiziert, setNichtVerifiziert] = useState(false);
  const [rewards, setRewards] = useState([]);
  
  // Einstellungen States
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [customBg, setCustomBg] = useState(null);
  const [bgUploading, setBgUploading] = useState(false);
  const [kompaktModus, setKompaktModus] = useState(false);
  const [notificationStyle, setNotificationStyle] = useState('normal'); // 'normal' oder 'glass'
  const [animationen, setAnimationen] = useState(true);
  const [textGroesse, setTextGroesse] = useState('normal');
  const [datensparmodus, setDatensparmodus] = useState(false);
  const [schnellstart, setSchnellstart] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [offlineModus, setOfflineModus] = useState(false);
  // ────────── Erweiterte UI-Effekte ──────────
  const [fxShimmer, setFxShimmer]             = useState(true);
  const [fxHoverGlow, setFxHoverGlow]         = useState(true);
  const [fxAnimNumbers, setFxAnimNumbers]     = useState(true);
  const [fxGradBorders, setFxGradBorders]     = useState(true);
  const [fxGlassStrength, setFxGlassStrength] = useState('medium');
  const [fxCardShine, setFxCardShine]         = useState(true);
  const [fxParallax, setFxParallax]           = useState(false);
  const [fxBotPulse, setFxBotPulse]           = useState(true);
  const [fxRipple, setFxRipple]               = useState(false);
  const [fxTabSlide, setFxTabSlide]           = useState(true);
  const [fxProgressSmooth, setFxProgressSmooth] = useState(true);
  const [fxSuccessAnim, setFxSuccessAnim]     = useState(true);
  const [fxTopLoader, setFxTopLoader]         = useState(true);
  // Einstellungen-UI-States
  const [settingsSection, setSettingsSection] = useState('appearance');
  const [settingsSearch, setSettingsSearch]   = useState('');
  const [bewerbungen, setBewerbungen] = useState([]);
  const [battlePassData, setBattlePassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  // Optional: Ziel-Kategorie für den Shop-Tab (wird beim Tab-Wechsel gesetzt, z.B. Free-Pass-Banner)
  const [shopJumpToCategory, setShopJumpToCategory] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('transactions'); // Default Sub-Tab
  
  // Filter States für Transaktionen
  const [transactionFilter, setTransactionFilter] = useState({
    dateRange: 'all', // all, 7days, 30days, year, custom
    type: 'all', // all, income, expense
    searchTerm: '',
    sortBy: 'date', // date, amount
    sortOrder: 'desc' // asc, desc
  });
  
  // Sparkonto Ziel
  const [savingsGoal, setSavingsGoal] = useState(null);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [personalaktePage, setPersonalaktePage] = useState(1);
  const [marketplacePage, setMarketplacePage] = useState(1);
  const [savingsPage, setSavingsPage] = useState(1);
  const [taxPage, setTaxPage] = useState(1);
  const itemsPerPage = 20;

  // Filter States
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
  const [invoiceFraktionFilter, setInvoiceFraktionFilter] = useState('all');
  const [strafakteStatusFilter, setStrafakteStatusFilter] = useState('all');

  // PWA Detection
  const [isPWA, setIsPWA] = useState(false);
  
  // Tour State
  const [tourRunning, setTourRunning] = useState(false);
  
  useEffect(() => {
    // Check if app is installed as PWA
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || window.navigator.standalone 
        || document.referrer.includes('android-app://');
      setIsPWA(isStandalone);
    };
    
    checkPWA();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkPWA);
    
    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkPWA);
    };
  }, []);

  // Auto-Start der Tour beim ersten Besuch (erst wenn User geladen & verifiziert ist)
  useEffect(() => {
    if (!user || nichtVerifiziert || loading) return;
    if (!hasCompletedProfileTour()) {
      const t = setTimeout(() => setTourRunning(true), 1500);
      return () => clearTimeout(t);
    }
  }, [user, nichtVerifiziert, loading]);

  // Tab-Konfiguration mit Kategorien
  const mainTabs = [
    { id: 'overview', label: 'Übersicht', icon: LayoutDashboard },
    { id: 'benefits', label: 'Meine Vorteile', icon: Gift, hasSubTabs: true },
    { id: 'finance', label: 'Finanzen', icon: Wallet, hasSubTabs: true },
    { id: 'documents', label: 'Dokumente', icon: IdCard, hasSubTabs: true },
    { id: 'shop', label: 'Shop', icon: ShoppingCart },
    { id: 'battle-pass', label: 'Battle Pass', icon: Crown },
    { id: 'character', label: 'Charakter-Verwaltung', icon: User },
    { id: 'hamburg-horizon', label: 'Mein Profil', icon: Sparkles, hasSubTabs: true },
    { id: 'applications', label: 'Bewerbungen', icon: ClipboardList },
    { id: 'settings', label: 'Einstellungen', icon: Settings }
  ];

  const subTabs = {
    benefits: [
      { id: 'pwa', label: 'PWA Vorteile', icon: Smartphone },
      { id: 'discord', label: 'Discord Vorteile', icon: Crown }
    ],
    finance: [
      { id: 'overview', label: 'Übersicht', icon: BarChart3 },
      { id: 'transfer', label: 'Überweisung', icon: Send },
      { id: 'statistics', label: 'Statistiken', icon: BarChart2 },
      { id: 'transactions', label: 'Transaktionen', icon: ArrowLeftRight },
      { id: 'invoices', label: 'Rechnungen', icon: FileText },
      { id: 'savings', label: 'Sparkonto', icon: PiggyBank },
      { id: 'kredite', label: 'Kredite', icon: CreditCard },
      { id: 'tax', label: 'Steuer-Records', icon: Receipt }
    ],
    documents: [
      { id: 'cards', label: 'Ausweise', icon: IdCard },
      { id: 'personalakte', label: 'Personalakte', icon: Award }
    ],
    'hamburg-horizon': [
      { id: 'overview', label: 'Übersicht', icon: Sparkles },
      { id: 'licenses', label: 'Lizenzen', icon: ShieldCheck }
    ]
  };

  // Handler für Haupt-Tab Wechsel
  const handleMainTabChange = (tabId) => {
    // Prüfe ob User einen Charakter hat - wenn nicht, sind alle Tabs außer 'overview' gesperrt
    const hasChar = !!(userData?.character?.name || userData?.characterName);
    if (!hasChar && tabId !== 'overview') {
      toast.error('🔒 Kein Charakter vorhanden', {
        description: 'Du musst erst einen Charakter erstellen (im Discord mit /charakter-erstellen), um diesen Bereich zu nutzen.'
      });
      return;
    }
    setActiveTab(tabId);
    // Setze Default Sub-Tab wenn Kategorie Sub-Tabs hat
    if (subTabs[tabId]) {
      setActiveSubTab(subTabs[tabId][0].id);
    }
  };

  // Auto-Redirect: Wenn User keinen Charakter hat und gerade auf gesperrtem Tab ist
  useEffect(() => {
    if (!userData || loading) return; // WARTEN bis Loading fertig - verhindert Flackern
    const hasChar = !!(userData?.character?.name || userData?.characterName);
    if (!hasChar && activeTab !== 'overview') {
      setActiveTab('overview');
    }
  }, [userData, activeTab, loading]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [botStatus, setBotStatus] = useState({ isOnline: true, checking: true, error: null });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  // Echtzeit: Profil live updaten bei User/Bewerbungs/Notification-Events
  const { connected: realtimeConnected } = useRealtime({
    'user.updated': (evt) => {
      if (!user) return;
      if (evt.data?.userId && evt.data.userId !== user.id) return;
      loadData(true);
    },
    'user.notification': (evt) => {
      if (!user) return;
      if (evt.data?.title) {
        toast.message(evt.data.title, { description: evt.data.message });
      }
      loadData(true);
    },
    'bewerbung.updated': (evt) => {
      if (!user) return;
      if (evt.data?.userId && evt.data.userId !== user.id) return;
      loadData(true);
      if (evt.data?.byAdmin && evt.data?.status) {
        if (evt.data.status === 'Angenommen') toast.success('Deine Bewerbung wurde angenommen! 🎉');
        else if (evt.data.status === 'Abgelehnt') toast.error('Deine Bewerbung wurde abgelehnt');
        else if (evt.data.status === 'In Bearbeitung') toast.info('Bewerbung wird bearbeitet');
      }
    },
    'bewerbung.created': (evt) => {
      if (!user || evt.data?.userId !== user.id) return;
      loadData(true);
    },
    'bewerbung.deleted': (evt) => {
      if (!user) return;
      if (evt.data?.userId && evt.data.userId !== user.id) return;
      loadData(true);
    },
    'system.status.updated': () => {
      // Optional: Wartungsmodus-Änderungen nicht aggressiv neu laden
    },
  });

  // ──────────────────────────────────────────────────────────────────────
  // Supabase Realtime: user_data Tabelle live beobachten
  // Damit werden Änderungen (z. B. via Discord-Bot, SQL, Dashboard) sofort
  // im Profil reflektiert, OHNE dass der Nutzer neu laden muss.
  //
  // Voraussetzung: In Supabase Dashboard → Database → Replication muss die
  // Tabelle `user_data` für `supabase_realtime` aktiviert sein.
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const client = getSupabaseBrowser();
    if (!client) {
      console.warn('[Supabase Realtime] client not available');
      return;
    }

    console.log('[Supabase Realtime] Setting up subscription for user:', user.id);

    let reloadTimer = null;
    const scheduleReload = (source, payload) => {
      if (reloadTimer) clearTimeout(reloadTimer);
      console.log('[Supabase Realtime] 🔔 Event received:', source, payload);
      // Debounce: innerhalb von 400ms mehrere Changes → 1 Reload
      reloadTimer = setTimeout(() => {
        console.log('[Supabase Realtime] 🔄 Reloading data (force=true)');
        // force=true → bypasst den 30s Server-Cache,
        // damit externe Änderungen sofort sichtbar sind.
        loadData(true);
      }, 400);
    };

    const channel = client
      .channel(`user_data_profile_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_data',
          filter: `discord_user_id=eq.${user.id}`,
        },
        (payload) => {
          scheduleReload(`user_data.${payload?.eventType || 'change'}`, payload);
        }
      )
      // Fallback: ohne Filter horchen (falls Filter wegen Typ-Mismatch nicht greift)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_data',
        },
        (payload) => {
          const rowDiscordId = String(payload?.new?.discord_user_id ?? payload?.old?.discord_user_id ?? '');
          if (rowDiscordId && rowDiscordId === String(user.id)) {
            scheduleReload(`user_data.${payload?.eventType || 'change'} (unfiltered-match)`, payload);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[Supabase Realtime] channel status:', status, err || '');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('[Supabase Realtime] ❌ Subscription issue:', status, err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase Realtime] ✅ Live-Updates aktiv für user_data (discord_user_id=' + user.id + ')');
        }
      });

    return () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      try {
        client.removeChannel(channel);
      } catch (e) {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ──────────────────────────────────────────────────────────────────────
  // Polling-Fallback: alle 30 Sekunden automatisch frische Daten holen.
  // Ergänzt Supabase Realtime (falls WebSocket mal abbricht, verpasstes
  // Event, etc.). Pausiert wenn Tab im Hintergrund ist → spart Egress.
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const POLL_MS = 30_000;
    let intervalId = null;

    const tick = () => {
      // Nur pollen wenn Tab sichtbar ist
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      loadData(true);
    };

    const start = () => {
      if (intervalId) return;
      intervalId = setInterval(tick, POLL_MS);
    };

    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Sofort einmal aktualisieren wenn Tab wieder in den Vordergrund kommt
        loadData(true);
        start();
      } else {
        stop();
      }
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Lade Einstellungen aus localStorage
  useEffect(() => {
    // Custom Background
    const savedBg = localStorage.getItem('hhrp-custom-bg');
    if (savedBg) setCustomBg(savedBg);

    // Kompaktmodus
    const savedKompakt = localStorage.getItem('hhrp-kompakt');
    if (savedKompakt === 'true') setKompaktModus(true);

    // Benachrichtigungsstil
    const savedNotificationStyle = localStorage.getItem('hhrp-notification-style');
    if (savedNotificationStyle) setNotificationStyle(savedNotificationStyle);

    // Animationen
    const savedAnim = localStorage.getItem('hhrp-animationen');
    if (savedAnim === 'false') setAnimationen(false);

    // Text-Größe
    const savedTextGroesse = localStorage.getItem('hhrp-textgroesse');
    if (savedTextGroesse) setTextGroesse(savedTextGroesse);

    // Datensparmodus
    const savedDatensparmodus = localStorage.getItem('hhrp-datensparmodus');
    if (savedDatensparmodus === 'true') setDatensparmodus(true);

    // Schnellstart (PWA)
    const savedSchnellstart = localStorage.getItem('hhrp-schnellstart');
    if (savedSchnellstart === 'true') setSchnellstart(true);

    // Auto-Sync (PWA)
    const savedAutoSync = localStorage.getItem('hhrp-autosync');
    if (savedAutoSync === 'false') setAutoSync(false);

    // Offline-Modus (PWA)
    const savedOfflineModus = localStorage.getItem('hhrp-offline');
    if (savedOfflineModus === 'true') setOfflineModus(true);

    // Erweiterte UI-Effekte laden (mit Defaults)
    const loadFxBool = (k, def) => {
      const v = localStorage.getItem(k);
      return v === null ? def : v === 'true';
    };
    setFxShimmer(loadFxBool('hhrp-fx-shimmer', true));
    setFxHoverGlow(loadFxBool('hhrp-fx-hover-glow', true));
    setFxAnimNumbers(loadFxBool('hhrp-fx-anim-numbers', true));
    setFxGradBorders(loadFxBool('hhrp-fx-grad-borders', true));
    const savedGlass = localStorage.getItem('hhrp-fx-glass-strength');
    if (savedGlass) setFxGlassStrength(savedGlass);
    setFxCardShine(loadFxBool('hhrp-fx-card-shine', true));
    setFxParallax(loadFxBool('hhrp-fx-parallax', false));
    setFxBotPulse(loadFxBool('hhrp-fx-bot-pulse', true));
    setFxRipple(loadFxBool('hhrp-fx-ripple', false));
    setFxTabSlide(loadFxBool('hhrp-fx-tab-slide', true));
    setFxProgressSmooth(loadFxBool('hhrp-fx-progress-smooth', true));
    setFxSuccessAnim(loadFxBool('hhrp-fx-success-anim', true));
    setFxTopLoader(loadFxBool('hhrp-fx-top-loader', true));

    // Push Notification Status
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Auto-Retry: Prüfe alle 15 Sekunden im Hintergrund ob Bot wieder online ist
  useEffect(() => {
    if (!user || authLoading) return;

    const retryInterval = setInterval(() => {
      // Nur neu laden wenn Bot offline ist
      if (!botStatus.isOnline && !botStatus.checking) {
        console.log('[Auto-Retry] Bot offline - versuche erneut...');
        loadData();
      }
    }, 15000); // Alle 15 Sekunden

    return () => clearInterval(retryInterval);
  }, [user, authLoading, botStatus.isOnline, botStatus.checking]);

  const loadData = async (force = false) => {
    try {
      // Behalte den vorherigen isOnline Status, setze nur checking auf true
      setBotStatus(prev => ({ ...prev, checking: true }));
      
      // 1. ZUERST: Prüfe ob Bot online ist
      const botStatusRes = await fetch('/api/bot/status', { cache: 'no-store' });
      const botStatusData = await botStatusRes.json();
      
      console.log('[Bot Status]', botStatusData);
      
      // Wenn Bot offline ist, zeige Error und stoppe
      if (!botStatusData.isOnline) {
        setBotStatus({ 
          isOnline: false, 
          checking: false, 
          error: null
        });
        setLoading(false);
        return;
      }
      
      // 2. Bot ist online, lade die Daten
      const nocache = force ? '?nocache=1' : '';
      const headers = force ? { 'Cache-Control': 'no-cache' } : {};
      const [userRes, rewardsRes, bewerbungenRes, battlePassRes] = await Promise.all([
        fetch(`/api/user/data${nocache}`, { cache: 'no-store', headers }),
        fetch(`/api/user/rewards${nocache}`, { cache: 'no-store', headers }),
        fetch(`/api/bewerbungen/me${nocache}`, { cache: 'no-store', headers }),
        fetch(`/api/battle-pass/current${nocache}`, { cache: 'no-store', headers }).catch(() => null)
      ]);

      if (userRes.ok) {
        const json = await userRes.json();
        const actualData = json.data?.data || json.data || null;
        
        // Nicht Verifiziert Status vom Bot
        setNichtVerifiziert(json.nichtVerifiziert === true);
        
        // Bot ist online, Daten sind da
        setBotStatus({ isOnline: true, checking: false, error: null });
        setUserData(actualData);
        console.log('User data loaded:', actualData, 'nichtVerifiziert:', json.nichtVerifiziert);
      } else {
        // Bot ist online, aber API-Fehler
        setBotStatus({ 
          isOnline: true, 
          checking: false, 
          error: 'Fehler beim Laden der Daten. Bitte versuche es später erneut.' 
        });
      }

      if (rewardsRes.ok) {
        const json = await rewardsRes.json();
        setRewards(json.rewards || []);
      }

      if (bewerbungenRes.ok) {
        const json = await bewerbungenRes.json();
        setBewerbungen(json.bewerbungen || []);
      }

      // ✅ Battle Pass laden (für Übersicht-Karte)
      if (battlePassRes && battlePassRes.ok) {
        try {
          const bpJson = await battlePassRes.json();
          setBattlePassData(bpJson);
        } catch (e) {
          console.warn('[BP] Konnte Battle Pass Daten nicht parsen:', e?.message);
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
      setBotStatus({ 
        isOnline: false, 
        checking: false, 
        error: 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (rewardId) => {
    try {
      setClaiming(rewardId);
      
      const res = await fetch('/api/user/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Reward beansprucht!', {
          description: data.message || 'Der Bot wird dir das Geld in Kürze gutschreiben.'
        });
        setRewards(rewards.filter(r => r.id !== rewardId));
      } else {
        toast.error('Fehler', { description: data.error });
      }
    } catch (error) {
      toast.error('Fehler beim Beanspruchen');
    } finally {
      setClaiming(null);
    }
  };

  if (authLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  const avatarUrl = getDiscordAvatarUrl(user, 256);
  const money = userData?.money || {};
  const character = userData?.character || {};
  const bankLimit = userData?.bankLimit || 1000000; // Lese bankLimit aus userData
  
  // licenses und cards sind bereits Arrays von der Sync-Funktion
  // WICHTIG: Filtere Credits-Käufe raus (credits_5, credits_25, etc.)
  // Licenses sind jetzt Objekte mit Details (expiresAt, autoRenew, etc.)
  const licenses = userData?.licenses 
    ? (Array.isArray(userData.licenses) 
        ? userData.licenses 
        : Object.entries(userData.licenses).map(([key, val]) => ({
            id: key,
            name: val.name || key,
            expiresAt: val.expiresAt || 0,
            autoRenew: val.autoRenew || false,
            purchasedAt: val.purchasedAt || null,
            giftedBy: val.giftedBy || null
          }))
      ).filter(l => {
        if (!l) return false;
        const name = typeof l === 'string' ? l : (l.name || l.id);
        if (!name || typeof name !== 'string') return false;
        // Credits-Bundles (credits_10, credits_50) ausblenden – aber Credits-Pässe BEHALTEN
        if (name.startsWith('credits_') && !name.includes('_pass')) return false;
        if (name.startsWith('credit_') && !name.includes('_pass')) return false;
        return true;
      })
    : [];
  
  // Cards mit dynamischem Limit
  const cards = Array.isArray(userData?.cards) 
    ? userData.cards.map(card => ({
        ...card,
        limit: card.limit || bankLimit // Verwende card.limit oder bankLimit
      }))
    : [];
  
  const stats = userData?.stats || {};
  
  // Globale Hilfsfunktion für Lizenz-Checks (String und Object Format)
  const userHasLicense = (licenseId) => {
    if (!licenses || !licenseId) return false;
    return licenses.some(l => {
      if (!l) return false; // Sicherheitscheck
      if (typeof l === 'string') return l === licenseId;
      if (typeof l === 'object') return (l.name === licenseId || l.id === licenseId);
      return false;
    });
  };

  const totalMoney = (money.cash || 0) + (money.bank || 0) + (money.savings || 0);

  const statusColors = {
    'Eingereicht': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'In Bearbeitung': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Angenommen': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Abgelehnt': 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  return (
    <div className="min-h-screen px-4 py-8 pt-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header mit Discord Avatar */}
        <div data-tour="profile-header" className="glass rounded-2xl p-4 sm:p-6 border border-white/[0.08]">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={user.username}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-2 ring-white/10"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl sm:text-3xl font-bold">
                {user.username?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white break-all">{user.username}</h1>
                <RealtimeIndicator connected={realtimeConnected} />
              </div>
              <p className="text-white/40 text-xs sm:text-sm break-all">Discord ID: {user.id}</p>
            </div>
            {userData?.lastSync && (
              <div className="text-center sm:text-right w-full sm:w-auto">
                <p className="text-xs text-white/30">Letzte Sync</p>
                <p className="text-xs text-white/50">
                  {new Date(userData.lastSync).toLocaleString('de-DE')}
                </p>
              </div>
            )}
            {!nichtVerifiziert && (
              <TourStartButton onStart={() => setTourRunning(true)} />
            )}
          </div>
        </div>

        {/* NICHT VERIFIZIERT BLOCKADE */}
        {nichtVerifiziert && (
          <div className="glass rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-orange-500/10 overflow-hidden">
            <div className="p-8 sm:p-12 flex flex-col items-center text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mb-6">
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-red-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-red-400 mb-3">Nicht Verifiziert</h2>
              <p className="text-white/60 max-w-md mb-6 leading-relaxed">
                Dein Account ist noch nicht verifiziert. Du musst dich zuerst auf dem Discord Server verifizieren, um auf dein Profil zugreifen zu können.
              </p>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] max-w-sm w-full mb-6">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">So verifizierst du dich:</p>
                    <p className="text-xs text-white/40 mt-0.5">Gehe auf den Discord Server und folge den Anweisungen im Verifizierungs-Kanal</p>
                  </div>
                </div>
              </div>
              <a 
                href="https://discord.gg/E5sPAyGC86" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl font-medium transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Zum Discord Server
              </a>
            </div>
          </div>
        )}

        {/* Profil-Inhalte NUR wenn verifiziert */}
        {!nichtVerifiziert && (
        <>
        {/* Character-Locked-Warning Banner - NUR wenn Loading fertig UND wirklich kein Charakter vorhanden (verhindert Flackern beim Laden) */}
        {!loading && userData && !(userData?.character?.name || userData?.characterName) && (
          <div 
            className="glass rounded-2xl p-5 border"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.08), rgba(234, 88, 12, 0.05))',
              borderColor: 'rgba(251, 146, 60, 0.3)'
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1">🔒 Kein Charakter vorhanden</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  Du hast noch keinen Charakter auf dem Server. Alle Bereiche außer der <span className="font-semibold text-white">Übersicht</span> sind daher gesperrt.
                </p>
                <p className="text-xs text-white/50 mt-2">
                  💡 Erstelle deinen Charakter im Discord mit dem Command <code className="px-1.5 py-0.5 rounded bg-white/10 text-orange-300 font-mono">/charakter-erstellen</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation - Haupt-Tabs */}
        <div data-tour="main-tabs" className="glass rounded-2xl p-2 border border-white/[0.08]">
          {/* Mobile: Horizontal Scrollable */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const hasChar = !!(userData?.character?.name || userData?.characterName);
              // Während Loading NIEMALS sperren (verhindert Flackern)
              const isLocked = !loading && userData && !hasChar && tab.id !== 'overview';
              const DisplayIcon = isLocked ? Lock : Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleMainTabChange(tab.id)}
                  disabled={isLocked}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm whitespace-nowrap snap-center flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border border-white/20 shadow-lg'
                      : isLocked
                      ? 'bg-orange-500/5 text-orange-300/50 border border-orange-500/20 cursor-not-allowed'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <DisplayIcon className={`w-4 h-4 flex-shrink-0 ${isLocked ? 'text-orange-400/60' : ''}`} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* Desktop: Grid Layout */}
          <div className="hidden lg:grid grid-cols-5 gap-2">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const hasChar = !!(userData?.character?.name || userData?.characterName);
              const isLocked = !loading && userData && !hasChar && tab.id !== 'overview';
              const DisplayIcon = isLocked ? Lock : Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleMainTabChange(tab.id)}
                  disabled={isLocked}
                  title={isLocked ? 'Charakter erforderlich – erstelle einen im Discord' : tab.label}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all text-base ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border border-white/20'
                      : isLocked
                      ? 'bg-orange-500/5 text-orange-300/50 border border-orange-500/20 cursor-not-allowed'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  <DisplayIcon className={`w-5 h-5 flex-shrink-0 ${isLocked ? 'text-orange-400/60' : ''}`} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-Tabs (nur wenn Haupt-Tab Sub-Tabs hat) */}
        {subTabs[activeTab] && (
          <div className="glass rounded-2xl p-2 border border-white/[0.08]">
            {/* Mobile: Horizontal Scrollable */}
            <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {subTabs[activeTab].map((subTab) => {
                const Icon = subTab.icon;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveSubTab(subTab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs whitespace-nowrap flex-shrink-0 ${
                      activeSubTab === subTab.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30'
                        : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium">{subTab.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Desktop: Flex Layout */}
            <div className="hidden lg:flex gap-2 justify-center">
              {subTabs[activeTab].map((subTab) => {
                const Icon = subTab.icon;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveSubTab(subTab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm ${
                      activeSubTab === subTab.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30'
                        : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{subTab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Rewards Section */}
        {rewards.length > 0 && (
          <div className="glass rounded-2xl p-6 border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Verfügbare Rewards</h2>
              <span className="px-2 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-bold">
                {rewards.length}
              </span>
            </div>
            <div className="space-y-3">
              {rewards.map(reward => (
                <div 
                  key={reward.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-green-400">
                        €{reward.amount.toLocaleString()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                        {reward.reward_type}
                      </span>
                    </div>
                    {reward.description && (
                      <p className="text-sm text-white/50">{reward.description}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleClaimReward(reward.id)}
                    disabled={claiming === reward.id}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    {claiming === reward.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Wird beansprucht...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Jetzt claimen
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div data-tour="overview-content" className="space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Bot Status Check - zeige Error wenn Bot offline (auch während checking) */}
            {!botStatus.isOnline ? (
              <BotStatusCard status={botStatus} onRetry={loadData} />
            ) : (
              <>
                {/* ═══════════════════════════════════════════════════════════════
                    🎁 GRATIS 7-TAGE FREE-PASS PROMO-BANNER
                    Variante A: User hatte den Pass NOCH NIE → Promo "Jetzt gratis holen"
                    Variante B: User HATTE den Pass schon → Hinweis + Upsell zu anderen Pässen
                    ═══════════════════════════════════════════════════════════════ */}
                {(() => {
                  // Prüfen: Hat der User den Free Pass jemals gehabt? (auch abgelaufen)
                  const hadFreePass = licenses.some(l => {
                    if (!l) return false;
                    const name = typeof l === 'string' ? l : (l?.name || l?.id);
                    return name === 'credits_free_pass';
                  });

                  // Charakter-Check (nur wenn Char vorhanden, macht der Pass Sinn)
                  const hasChar = !!(userData?.character?.name || userData?.characterName);
                  if (!hasChar) return null;

                  // ───── Variante B: User HATTE den Pass schon ─────
                  if (hadFreePass) {
                    // Prüfen, ob User aktuell einen anderen Credits-Pass aktiv hat
                    const activeCreditsPass = licenses.find(l => {
                      if (!l) return false;
                      const name = typeof l === 'string' ? l : (l?.name || l?.id);
                      return ['credits_starter_pass', 'credits_power_pass', 'credits_elite_pass'].includes(name);
                    });
                    // Wenn bereits ein anderer Credits-Pass aktiv ist → Banner nicht mehr nötig
                    if (activeCreditsPass) return null;

                    return (
                      <div
                        data-tour-card="Credits Pässe|Der 7-Tage Free Pass ist einmalig pro Account. Schau dir unsere anderen Credits-Pässe mit noch mehr Vorteilen an."
                        className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border group cursor-pointer transition-all hover:scale-[1.01]"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(100, 116, 139, 0.15), rgba(71, 85, 105, 0.08), rgba(59, 130, 246, 0.06))',
                          borderColor: 'rgba(148, 163, 184, 0.25)',
                          boxShadow:
                            '0 0 30px rgba(100, 116, 139, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                        }}
                        onClick={() => {
                          setShopJumpToCategory('credits_passes');
                          setActiveTab('shop');
                        }}
                      >
                        {/* Info-Badge top-right */}
                        <div
                          className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 shadow-md"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(100, 116, 139, 0.6), rgba(71, 85, 105, 0.5))',
                            color: '#fff',
                            border: '1px solid rgba(148, 163, 184, 0.4)',
                          }}
                        >
                          <Check className="w-3 h-3" strokeWidth={3} />
                          Bereits genutzt
                        </div>

                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                          {/* Icon (gedämpft) */}
                          <div
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                            style={{
                              background:
                                'linear-gradient(135deg, rgba(100, 116, 139, 0.35), rgba(71, 85, 105, 0.25))',
                              border: '1px solid rgba(148, 163, 184, 0.35)',
                              boxShadow: '0 0 16px rgba(100, 116, 139, 0.2)',
                            }}
                          >
                            <Gift className="w-7 h-7 sm:w-8 sm:h-8 text-slate-200" strokeWidth={2} />
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0 pr-24 sm:pr-32">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300/80">
                                Tipp · Andere Credits-Pässe verfügbar
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-white/90 leading-tight mb-1.5">
                              7 Tage Free Pass bereits eingelöst
                            </h3>
                            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                              Du hast die <span className="text-white/80 font-semibold">kostenlose 7-Tage Testversion</span> bereits beansprucht und kannst sie nicht erneut nutzen. Schau dir unsere anderen <span className="text-blue-300 font-semibold">Credits-Pässe</span> mit noch mehr Vorteilen an.
                            </p>
                          </div>

                          {/* CTA (Desktop) */}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShopJumpToCategory('credits_passes');
                              setActiveTab('shop');
                            }}
                            className="hidden sm:flex rounded-xl h-11 px-5 font-semibold items-center gap-2 transition-all flex-shrink-0"
                            style={{
                              background:
                                'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.2))',
                              color: '#fff',
                              border: '1px solid rgba(99, 102, 241, 0.45)',
                            }}
                          >
                            Pässe ansehen
                            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                          </Button>
                        </div>

                        {/* Mobile CTA */}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShopJumpToCategory('credits_passes');
                            setActiveTab('shop');
                          }}
                          className="sm:hidden w-full mt-4 rounded-xl h-11 font-semibold flex items-center justify-center gap-2"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.2))',
                            color: '#fff',
                            border: '1px solid rgba(99, 102, 241, 0.45)',
                          }}
                        >
                          Andere Pässe ansehen
                          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                        </Button>
                      </div>
                    );
                  }

                  // ───── Variante A: User hatte den Pass noch NIE → Promo ─────
                  return (
                    <div
                      data-tour-card="Gratis 7-Tage Pass|Hole dir kostenlos einen 7-Tage-Pass mit +20 Bonus-Credits beim Kauf und 5% Rabatt beim Ausgeben. Einmalig pro Account."
                      className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border group cursor-pointer transition-all hover:scale-[1.01]"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(147, 51, 234, 0.18), rgba(236, 72, 153, 0.12), rgba(59, 130, 246, 0.08))',
                        borderColor: 'rgba(168, 85, 247, 0.45)',
                        boxShadow:
                          '0 0 40px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                      }}
                      onClick={() => {
                        setShopJumpToCategory('credits_passes');
                        setActiveTab('shop');
                      }}
                    >
                      {/* Animierte Schimmer-Overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-50"
                        style={{
                          background:
                            'radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.18), transparent 60%), radial-gradient(ellipse at bottom left, rgba(236, 72, 153, 0.2), transparent 60%)',
                        }}
                      />

                      {/* GRATIS-Badge (top-right) */}
                      <div
                        className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1 shadow-lg"
                        style={{
                          background:
                            'linear-gradient(135deg, #fbbf24, #f59e0b)',
                          color: '#1a1a1a',
                          border: '1px solid rgba(253, 224, 71, 0.8)',
                        }}
                      >
                        <Sparkles className="w-3 h-3" strokeWidth={3} />
                        Gratis
                      </div>

                      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                        {/* Icon */}
                        <div
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-6"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(168, 85, 247, 0.5), rgba(236, 72, 153, 0.4))',
                            border: '1px solid rgba(253, 224, 71, 0.5)',
                            boxShadow: '0 0 24px rgba(168, 85, 247, 0.5)',
                          }}
                        >
                          <Gift className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0 pr-20 sm:pr-24">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-300">
                              Exklusiv · Einmalig pro Account
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-black text-white leading-tight mb-1.5">
                            7 Tage Credits Free Pass{' '}
                            <span className="text-yellow-300">Gratis</span>
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-white/80">
                            <span className="flex items-center gap-1.5">
                              <Coins className="w-3.5 h-3.5 text-yellow-400" />
                              <span>
                                <b className="text-white">+20</b> Bonus-Credits pro Kauf
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Percent className="w-3.5 h-3.5 text-green-400" />
                              <span>
                                <b className="text-white">-5%</b> beim Credit-Ausgeben
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-400" />
                              <span>
                                <b className="text-white">7 Tage</b> Laufzeit
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* CTA (Desktop) */}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShopJumpToCategory('credits_passes');
                            setActiveTab('shop');
                          }}
                          className="hidden sm:flex rounded-xl h-11 px-5 font-bold items-center gap-2 shadow-lg transition-all hover:shadow-xl flex-shrink-0"
                          style={{
                            background:
                              'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            color: '#1a1a1a',
                            border: '1px solid rgba(253, 224, 71, 0.8)',
                          }}
                        >
                          Jetzt holen
                          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                        </Button>
                      </div>

                      {/* Mobile CTA (unter dem Text) */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShopJumpToCategory('credits_passes');
                          setActiveTab('shop');
                        }}
                        className="sm:hidden w-full mt-4 rounded-xl h-11 font-bold flex items-center justify-center gap-2 shadow-lg"
                        style={{
                          background:
                            'linear-gradient(135deg, #fbbf24, #f59e0b)',
                          color: '#1a1a1a',
                          border: '1px solid rgba(253, 224, 71, 0.8)',
                        }}
                      >
                        Jetzt gratis holen
                        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                      </Button>
                    </div>
                  );
                })()}

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* Battle Pass Karte (direkt unter dem 7-Tage Pass)              */}
                {/* Adaptiv: Promo / Premium aktiv / Gekündigt                    */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {(() => {
                  const bp = battlePassData;
                  if (!bp || !bp.userProgress) return null;

                  const bpUp = bp.userProgress || {};
                  const bpRewardsArr = Array.isArray(bp.rewards) ? bp.rewards : [];
                  const bpDaysLeft = typeof bp.daysRemaining === 'number' ? bp.daysRemaining : 0;
                  const bpPriceCredits = bp.pricing?.priceCredits ?? 1500;
                  const bpCanPurchase = bp.canPurchase !== false;
                  const bpMaxTier = bpRewardsArr.length || 30;
                  const bpCurrentTier = bpUp.currentTier || 0;
                  const bpProgressPct = Math.max(0, Math.min(100, Math.round((bpCurrentTier / bpMaxTier) * 100)));
                  const isPurchased = bpUp.purchased === true;
                  const isCancelled = bpUp.cancelled === true;

                  const goToBattlePass = (e) => {
                    if (e) e.stopPropagation();
                    setActiveTab('battle-pass');
                  };

                  // ───── Variante: Premium aktiv und gekündigt → Hinweis-Karte (Orange) ─────
                  if (isPurchased && isCancelled) {
                    return (
                      <div
                        data-tour-card="Battle Pass · Gekündigt|Dein Premium Battle Pass wurde gekündigt, läuft aber noch bis zum Monatsende. Beanspruche deine restlichen Belohnungen rechtzeitig."
                        className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border group cursor-pointer transition-all hover:scale-[1.01]"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(249, 115, 22, 0.18), rgba(244, 63, 94, 0.10), rgba(234, 88, 12, 0.08))',
                          borderColor: 'rgba(249, 115, 22, 0.45)',
                          boxShadow:
                            '0 0 40px rgba(249, 115, 22, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                        }}
                        onClick={goToBattlePass}
                      >
                        <div
                          className="absolute inset-0 pointer-events-none opacity-50"
                          style={{
                            background:
                              'radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.14), transparent 60%), radial-gradient(ellipse at bottom left, rgba(244, 63, 94, 0.18), transparent 60%)',
                          }}
                        />

                        {/* GEKÜNDIGT-Badge */}
                        <span
                          className="absolute top-4 right-4 z-20 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg whitespace-nowrap"
                          style={{
                            background:
                              'linear-gradient(135deg, #fb923c, #ef4444)',
                            color: '#fff',
                            border: '1px solid rgba(254, 215, 170, 0.6)',
                            width: 'max-content',
                          }}
                        >
                          <XCircle className="w-3 h-3" strokeWidth={3} />
                          Gekündigt
                        </span>

                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                          <div
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-6"
                            style={{
                              background:
                                'linear-gradient(135deg, rgba(249, 115, 22, 0.5), rgba(244, 63, 94, 0.4))',
                              border: '1px solid rgba(254, 215, 170, 0.5)',
                              boxShadow: '0 0 24px rgba(249, 115, 22, 0.5)',
                            }}
                          >
                            <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2} />
                          </div>

                          <div className="flex-1 min-w-0 pr-24 sm:pr-28">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-300">
                                Premium läuft aus · noch {bpDaysLeft} Tage
                              </span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-white leading-tight mb-1.5">
                              Battle Pass{' '}
                              <span className="text-orange-300">gekündigt</span>
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-white/80">
                              <span className="flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                                <span>
                                  Aktuelles Tier <b className="text-white">{bpCurrentTier}</b>/{bpMaxTier}
                                </span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-orange-400" />
                                <span>
                                  Endet am <b className="text-white">Monatsende</b>
                                </span>
                              </span>
                            </div>
                          </div>

                          <Button
                            onClick={goToBattlePass}
                            className="hidden sm:flex rounded-xl h-11 px-5 font-bold items-center gap-2 shadow-lg transition-all hover:shadow-xl flex-shrink-0"
                            style={{
                              background:
                                'linear-gradient(135deg, #fb923c, #f97316)',
                              color: '#1a1a1a',
                              border: '1px solid rgba(254, 215, 170, 0.8)',
                            }}
                          >
                            Belohnungen sichern
                            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                          </Button>
                        </div>

                        <Button
                          onClick={goToBattlePass}
                          className="sm:hidden w-full mt-4 rounded-xl h-11 font-bold flex items-center justify-center gap-2 shadow-lg"
                          style={{
                            background:
                              'linear-gradient(135deg, #fb923c, #f97316)',
                            color: '#1a1a1a',
                            border: '1px solid rgba(254, 215, 170, 0.8)',
                          }}
                        >
                          Belohnungen sichern
                          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                        </Button>
                      </div>
                    );
                  }

                  // ───── Variante: Premium aktiv → Status-Karte (Gold) ─────
                  if (isPurchased) {
                    return (
                      <div
                        data-tour-card="Premium Battle Pass aktiv|Dein Premium Battle Pass ist aktiv. Sammle XP, schalte Tiers frei und beanspruche exklusive Belohnungen."
                        className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border group cursor-pointer transition-all hover:scale-[1.01]"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(250, 204, 21, 0.18), rgba(245, 158, 11, 0.12), rgba(168, 85, 247, 0.10))',
                          borderColor: 'rgba(253, 224, 71, 0.55)',
                          boxShadow:
                            '0 0 40px rgba(250, 204, 21, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.10)',
                        }}
                        onClick={goToBattlePass}
                      >
                        <div
                          className="absolute inset-0 pointer-events-none opacity-50"
                          style={{
                            background:
                              'radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.22), transparent 60%), radial-gradient(ellipse at bottom left, rgba(168, 85, 247, 0.20), transparent 60%)',
                          }}
                        />

                        {/* PREMIUM-Badge (klein, top-right) — exakt wie 7-Tage Pass GRATIS-Badge */}
                        <span
                          className="absolute top-4 right-4 z-20 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg whitespace-nowrap"
                          style={{
                            background:
                              'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            color: '#1a1a1a',
                            border: '1px solid rgba(253, 224, 71, 0.8)',
                            width: 'max-content',
                          }}
                        >
                          <Crown className="w-3 h-3" strokeWidth={3} />
                          Premium
                        </span>

                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                          <div
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-6"
                            style={{
                              background:
                                'linear-gradient(135deg, rgba(250, 204, 21, 0.5), rgba(245, 158, 11, 0.45))',
                              border: '1px solid rgba(253, 224, 71, 0.6)',
                              boxShadow: '0 0 24px rgba(250, 204, 21, 0.6)',
                            }}
                          >
                            <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-[0_0_4px_rgba(250,204,21,0.8)]" strokeWidth={2} />
                          </div>

                          <div className="flex-1 min-w-0 pr-20 sm:pr-24">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-300">
                                Premium aktiv · noch {bpDaysLeft} Tage
                              </span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-white leading-tight mb-2">
                              Battle Pass{' '}
                              <span className="text-yellow-300">Tier {bpCurrentTier}</span>
                              <span className="text-white/50 font-bold">/{bpMaxTier}</span>
                            </h3>
                            {/* Mini-Progress-Bar */}
                            <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                              <div
                                className="h-full transition-all"
                                style={{
                                  width: `${bpProgressPct}%`,
                                  background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #ec4899)',
                                  boxShadow: '0 0 12px rgba(250, 204, 21, 0.5)',
                                }}
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-white/80">
                              <span className="flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                                <span>
                                  <b className="text-white">{bpProgressPct}%</b> Fortschritt
                                </span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Gift className="w-3.5 h-3.5 text-pink-400" />
                                <span>
                                  <b className="text-white">{bpRewardsArr.length}</b> Tiers gesamt
                                </span>
                              </span>
                            </div>
                          </div>

                          <Button
                            onClick={goToBattlePass}
                            className="hidden sm:flex rounded-xl h-11 px-5 font-bold items-center gap-2 shadow-lg transition-all hover:shadow-xl flex-shrink-0"
                            style={{
                              background:
                                'linear-gradient(135deg, #fbbf24, #f59e0b)',
                              color: '#1a1a1a',
                              border: '1px solid rgba(253, 224, 71, 0.8)',
                            }}
                          >
                            Pass öffnen
                            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                          </Button>
                        </div>

                        <Button
                          onClick={goToBattlePass}
                          className="sm:hidden w-full mt-4 rounded-xl h-11 font-bold flex items-center justify-center gap-2 shadow-lg"
                          style={{
                            background:
                              'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            color: '#1a1a1a',
                            border: '1px solid rgba(253, 224, 71, 0.8)',
                          }}
                        >
                          Pass öffnen
                          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                        </Button>
                      </div>
                    );
                  }

                  // ───── Variante: Nicht gekauft → Promo-Karte (Gold) ─────
                  return (
                    <div
                      data-tour-card="Battle Pass · Premium|Schalte den Premium Battle Pass frei und sichere dir 30 Tiers exklusiver Belohnungen — Credits, VIP-Zeiten, Custom-Rollen und mehr."
                      className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border group cursor-pointer transition-all hover:scale-[1.01]"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(250, 204, 21, 0.16), rgba(245, 158, 11, 0.10), rgba(168, 85, 247, 0.10))',
                        borderColor: 'rgba(253, 224, 71, 0.45)',
                        boxShadow:
                          '0 0 40px rgba(250, 204, 21, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                      }}
                      onClick={goToBattlePass}
                    >
                      <div
                        className="absolute inset-0 pointer-events-none opacity-50"
                        style={{
                          background:
                            'radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.20), transparent 60%), radial-gradient(ellipse at bottom left, rgba(168, 85, 247, 0.18), transparent 60%)',
                        }}
                      />

                      {/* NEU-Badge (top-right) */}
                      <span
                        className="absolute top-4 right-4 z-20 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg whitespace-nowrap"
                        style={{
                          background:
                            'linear-gradient(135deg, #fbbf24, #f59e0b)',
                          color: '#1a1a1a',
                          border: '1px solid rgba(253, 224, 71, 0.8)',
                          width: 'max-content',
                        }}
                      >
                        <Sparkles className="w-3 h-3" strokeWidth={3} />
                        Neu
                      </span>

                      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                        <div
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-6"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(250, 204, 21, 0.5), rgba(168, 85, 247, 0.4))',
                            border: '1px solid rgba(253, 224, 71, 0.5)',
                            boxShadow: '0 0 24px rgba(250, 204, 21, 0.5)',
                          }}
                        >
                          <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2} />
                        </div>

                        <div className="flex-1 min-w-0 pr-20 sm:pr-24">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-300">
                              Saison aktiv · {bpDaysLeft} Tage übrig
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-black text-white leading-tight mb-1.5">
                            Premium Battle Pass{' '}
                            <span className="text-yellow-300">freischalten</span>
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-white/80">
                            <span className="flex items-center gap-1.5">
                              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                              <span>
                                <b className="text-white">{bpMaxTier} Tiers</b> exklusive Rewards
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Coins className="w-3.5 h-3.5 text-amber-400" />
                              <span>
                                Nur <b className="text-white">{bpPriceCredits.toLocaleString('de-DE')}</b> Credits
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Gift className="w-3.5 h-3.5 text-pink-400" />
                              <span>
                                <b className="text-white">VIP</b> + Custom-Rollen
                              </span>
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={goToBattlePass}
                          disabled={!bpCanPurchase}
                          className="hidden sm:flex rounded-xl h-11 px-5 font-bold items-center gap-2 shadow-lg transition-all hover:shadow-xl flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{
                            background:
                              'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            color: '#1a1a1a',
                            border: '1px solid rgba(253, 224, 71, 0.8)',
                          }}
                        >
                          {bpCanPurchase ? 'Battle Pass entdecken' : 'Saison endet bald'}
                          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                        </Button>
                      </div>

                      <Button
                        onClick={goToBattlePass}
                        disabled={!bpCanPurchase}
                        className="sm:hidden w-full mt-4 rounded-xl h-11 font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{
                          background:
                            'linear-gradient(135deg, #fbbf24, #f59e0b)',
                          color: '#1a1a1a',
                          border: '1px solid rgba(253, 224, 71, 0.8)',
                        }}
                      >
                        {bpCanPurchase ? 'Battle Pass entdecken' : 'Saison endet bald'}
                        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                      </Button>
                    </div>
                  );
                })()}

                {/* Daily Bonus Card */}
                <div data-tour-card="Täglicher Bonus|Hole jeden Tag deinen kostenlosen Bonus ab. Je länger dein Streak, desto höher die Belohnung – plus spezielle VIP-Bonis für Premium-Mitglieder." className="relative">
                {(() => {
                  const hasChar = !!(userData?.character?.name || userData?.characterName);
                  // Während Loading NIE das Lock-Overlay zeigen (verhindert Flackern)
                  const showLock = !loading && userData && !hasChar;
                  return (
                    <>
                      <div className={showLock ? 'pointer-events-none select-none' : ''}>
                        <DailyBonusCard 
                          userId={user?.id}
                          onSuccess={() => {
                            // Reload data after claiming
                            loadData();
                          }}
                        />
                      </div>
                      {showLock && (
                        <div
                          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl"
                          style={{
                            background: 'rgba(10, 11, 15, 0.88)',
                            backdropFilter: 'blur(6px)',
                            border: '1px solid rgba(251, 146, 60, 0.3)'
                          }}
                        >
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                            <Lock className="w-7 h-7 text-white" />
                          </div>
                          <div className="text-center px-4 max-w-sm">
                            <p className="text-sm font-bold text-white">Täglicher Bonus gesperrt</p>
                            <p className="text-xs text-white/60 mt-1 leading-snug">
                              Erstelle deinen Charakter im Discord mit <code className="px-1 py-0.5 rounded bg-white/10 text-orange-300 font-mono">/charakter-erstellen</code>
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
                </div>

            {/* Money Overview */}
            {!botStatus.isOnline ? null : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div data-tour-card="Bank-Limit|Das maximale Guthaben, das deine Bank halten kann. VIP-Mitglieder haben höhere Limits." className="glass rounded-xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Bank Limit</p>
                      <p className="text-2xl font-bold text-white">
                        {(userData?.bankLimit || 1000000).toLocaleString('de-DE')} €
                      </p>
                    </div>
                  </div>
                </div>

                <div data-tour-card="Bank-Guthaben|Dein aktuelles Geld auf der Bank. Hier parkst du dein Vermögen sicher und verdienst bei VIP-Zinsen." className="glass rounded-xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Bank</p>
                      <p className="text-2xl font-bold text-white">
                        <AnimatedValue 
                          value={money.bank || 0}
                          prefix="€"
                          storageKey={`bank_${user?.id}`}
                        />
                      </p>
                    </div>
                  </div>
                </div>

                <div data-tour-card="Gesamtvermögen|Dein komplettes Vermögen: Bargeld, Bank und Sparkonto zusammen. So siehst du auf einen Blick, wie reich du wirklich bist." className="glass rounded-xl p-6 border border-white/[0.08] sm:col-span-2 md:col-span-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Gesamt</p>
                      <p className="text-2xl font-bold text-white">
                        <AnimatedValue 
                          value={totalMoney}
                          prefix="€"
                          storageKey={`total_${user?.id}`}
                        />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cooldowns Section */}
            {userData?.cooldowns && Object.keys(userData.cooldowns).length > 0 && (
              <div data-tour-card="Aktive Cooldowns|Hier siehst du alle laufenden Wartezeiten (z. B. bis du wieder deinen Collect-Bonus abholen kannst). VIPs haben kürzere Cooldowns." className="glass rounded-2xl p-6 border border-white/[0.08]">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-white/60" />
                  <h2 className="text-xl font-bold text-white">Aktive Cooldowns</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(userData.cooldowns).map(([key, timestamp]) => {
                    // VIP-Status prüfen für dynamische Cooldown-Zeiten
                    const licenses = (userData?.licenses || [])
                      .filter(l => l) // Filtere null/undefined
                      .map(l => typeof l === 'string' ? l : (l.name || l.id)) // Extrahiere Name
                      .filter(l => l && typeof l === 'string') // Nur Strings behalten
                      .filter(l => !l.startsWith('credits_') && !l.startsWith('credit_')); // Keine Credits
                    const hasLuxusPass = licenses.includes('luxus_pass');
                    const hasVipElitePlus = licenses.includes('vip_elite_plus');
                    const hasVipUltimate = licenses.includes('vip_ultimate');
                    const hasVipPlatinum = licenses.includes('vip_platinum');
                    const hasVipPremium = licenses.includes('vip_premium');
                    
                    // Collect Cooldown basierend auf VIP-Status
                    let collectCooldown = 4 * 60 * 60 * 1000; // 4h Standard
                    if (hasLuxusPass || hasVipElitePlus || hasVipUltimate) {
                      collectCooldown = 45 * 60 * 1000; // 45 Minuten für Luxus / Elite+ / Ultimate
                    } else if (hasVipPlatinum) {
                      collectCooldown = 1 * 60 * 60 * 1000; // 1 Stunde für Platinum
                    } else if (hasVipPremium) {
                      collectCooldown = 2 * 60 * 60 * 1000; // 2 Stunden für Premium
                    }
                    
                    // Cooldown-Namen, Icons und Dauer mapping
                    const cooldownConfig = {
                      collect: { label: 'Gehalt abholen', icon: Gift, color: 'green', duration: collectCooldown },
                      daily: { label: 'Daily Bonus', icon: Trophy, color: 'blue', duration: 24 * 60 * 60 * 1000 },
                      ueberfall: { label: 'Überfall', icon: AlertCircle, color: 'red', duration: 24 * 60 * 60 * 1000 },
                      rob: { label: 'Rob', icon: AlertCircle, color: 'red', duration: 24 * 60 * 60 * 1000 },
                      elitePlusDaily: { label: 'Elite+ Daily', icon: Star, color: 'purple', duration: 24 * 60 * 60 * 1000 },
                      luxusPassDaily: { label: 'Luxus-Pass Daily', icon: Crown, color: 'yellow', duration: 24 * 60 * 60 * 1000 },
                      work: { label: 'Arbeiten', icon: Building2, color: 'orange', duration: 1 * 60 * 60 * 1000 }
                    };
                    
                    const config = cooldownConfig[key] || { 
                      label: key.charAt(0).toUpperCase() + key.slice(1), 
                      icon: Clock, 
                      color: 'gray',
                      duration: 1 * 60 * 60 * 1000 // Default 1h
                    };
                    
                    // Berechne End-Timestamp (Start + Dauer)
                    const endTimestamp = timestamp + config.duration;
                    
                    const IconComponent = config.icon;
                    
                    return (
                      <div key={key} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg bg-${config.color}-500/20 flex items-center justify-center`}>
                              <IconComponent className={`w-4 h-4 text-${config.color}-400`} />
                            </div>
                            <span className="text-sm font-medium text-white">{config.label}</span>
                          </div>
                        </div>
                        <Countdown targetTimestamp={endTimestamp} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Character Info */}
              {!botStatus.isOnline ? null : loading ? (
                <SkeletonCard />
              ) : character && Object.keys(character).length > 0 ? (
                <div data-tour-card="Charakter|Die Stammdaten deines Ingame-Charakters: Name, Vorname, Alter, Geschlecht, Herkunft, Job und Fraktion." className="glass rounded-2xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="w-6 h-6 text-white/60" />
                    <h2 className="text-xl font-bold text-white">Charakter</h2>
                  </div>
                  <div className="space-y-3">
                    {character.name && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Name</span>
                        <span className="text-white font-medium">{character.name}</span>
                      </div>
                    )}
                    {character.vorname && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Vorname</span>
                        <span className="text-white font-medium">{character.vorname}</span>
                      </div>
                    )}
                    {character.nachname && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Nachname</span>
                        <span className="text-white font-medium">{character.nachname}</span>
                      </div>
                    )}
                    {character.age && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Alter</span>
                        <span className="text-white font-medium">{character.age}</span>
                      </div>
                    )}
                    {character.geschlecht && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Geschlecht</span>
                        <span className="text-white font-medium">{character.geschlecht}</span>
                      </div>
                    )}
                    {character.herkunft && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Herkunft</span>
                        <span className="text-white font-medium">{character.herkunft}</span>
                      </div>
                    )}
                    {character.job && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Job</span>
                        <span className="text-white font-medium">{character.job}</span>
                      </div>
                    )}
                    {character.faction && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Fraktion</span>
                        <span className="text-white font-medium">{character.faction}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Stats */}
              {!botStatus.isOnline ? null : loading ? (
                <SkeletonCard />
              ) : stats && Object.keys(stats).length > 0 ? (
                <div data-tour-card="Statistiken|Level, XP, Nachrichten und weitere Stats deines Charakters. Je aktiver du bist, desto mehr sammelst du an." className="glass rounded-2xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="w-6 h-6 text-white/60" />
                    <h2 className="text-xl font-bold text-white">Statistiken</h2>
                  </div>
                  <div className="space-y-3">
                    {stats.level !== undefined && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Level</span>
                        <span className="text-white font-medium">
                          <AnimatedValue 
                            value={stats.level}
                            prefix="Level "
                            storageKey={`level_${user?.id}`}
                          />
                        </span>
                      </div>
                    )}
                    {stats.xp !== undefined && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">XP</span>
                        <span className="text-white font-medium">
                          <AnimatedValue 
                            value={stats.xp}
                            suffix=" XP"
                            storageKey={`xp_${user?.id}`}
                          />
                        </span>
                      </div>
                    )}
                    {stats.messages !== undefined && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Nachrichten</span>
                        <span className="text-white font-medium">{stats.messages.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Licenses - Detaillierte Ansicht mit Ablaufdaten */}
            {licenses.length > 0 && (
              <div data-tour-card="Lizenzen & Versicherungen|Alle deine aktiven Lizenzen (Führerschein, Waffenschein, VIP-Status, etc.) mit Ablaufdaten und Details." className="glass rounded-2xl p-6 border border-white/[0.08]">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-6 h-6 text-white/60" />
                  <h2 className="text-xl font-bold text-white">Lizenzen & Versicherungen</h2>
                  <span className="px-2 py-1 rounded-full bg-white/10 text-white/50 text-xs">
                    {licenses.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {licenses.map((license, i) => {
                    // Unterstützung für alte (String) und neue (Object) Formate
                    const isObject = typeof license === 'object';
                    const licenseName = isObject ? (license.name || license.id) : license;
                    const expiresAt = isObject ? license.expiresAt : 0;
                    const autoRenew = isObject ? license.autoRenew : false;
                    const purchasedAt = isObject ? license.purchasedAt : null;
                    const giftedBy = isObject ? license.giftedBy : null;
                    
                    // Status berechnen
                    const now = Date.now();
                    const isExpired = expiresAt > 0 && expiresAt < now;
                    const isExpiringSoon = expiresAt > 0 && expiresAt > now && (expiresAt - now) < (7 * 24 * 60 * 60 * 1000); // 7 Tage
                    const neverExpires = expiresAt === 0;
                    
                    // Zeitberechnung
                    const timeLeft = expiresAt > 0 ? expiresAt - now : 0;
                    const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
                    const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                    
                    // Name formatieren
                    const displayName = licenseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    
                    // Status-Farben & Icons
                    let statusColor = 'bg-green-500/10 border-green-500/20 text-green-300';
                    let StatusIcon = CheckCircle;
                    let statusText = 'Aktiv';
                    
                    if (isExpired) {
                      statusColor = 'bg-red-500/10 border-red-500/20 text-red-300';
                      StatusIcon = XCircle;
                      statusText = 'Abgelaufen';
                    } else if (isExpiringSoon) {
                      statusColor = 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300';
                      StatusIcon = AlertTriangle;
                      statusText = 'Läuft bald ab';
                    } else if (neverExpires) {
                      statusColor = 'bg-blue-500/10 border-blue-500/20 text-blue-300';
                      StatusIcon = Infinity;
                      statusText = 'Unbegrenzt';
                    }
                    
                    return (
                      <div 
                        key={i}
                        className={`p-4 rounded-xl border ${statusColor} transition-all hover:scale-[1.02]`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-sm">{displayName}</h3>
                            {giftedBy && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Gift className="w-3 h-3 text-white/40" />
                                <p className="text-xs text-white/40">Geschenk</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className="w-4 h-4" />
                            {autoRenew && !isExpired && (
                              <RefreshCw className="w-3.5 h-3.5" title="Automatische Verlängerung aktiv" />
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-white/50">Status:</span>
                            <span className="font-medium">{statusText}</span>
                          </div>
                          
                          {!neverExpires && (
                            <div className="flex items-center justify-between">
                              <span className="text-white/50">Ablauf:</span>
                              <span className="font-medium">
                                {isExpired ? (
                                  'Abgelaufen'
                                ) : (
                                  <>
                                    {daysLeft > 0 && `${daysLeft}d `}
                                    {hoursLeft}h
                                  </>
                                )}
                              </span>
                            </div>
                          )}
                          
                          {!neverExpires && expiresAt > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-white/50">Datum:</span>
                              <span className="font-medium text-xs">
                                {new Date(expiresAt).toLocaleDateString('de-DE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                          
                          {autoRenew && !isExpired && (
                            <div className="pt-1.5 border-t border-white/[0.06] flex items-center gap-1.5">
                              <RefreshCw className="w-3 h-3 text-white/40" />
                              <span className="text-white/40 text-xs">
                                Verlängert sich automatisch
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Data Placeholder */}
            {!loading && !userData && (
              <div className="glass rounded-2xl p-12 text-center border border-white/[0.08]">
                <Clock className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-xl font-bold text-white mb-2">Keine Daten verfügbar</h3>
                <p className="text-white/40 max-w-md mx-auto">
                  Deine Daten werden vom Bot synchronisiert. Spiele im Server und deine Daten erscheinen hier!
                </p>
              </div>
            )}
              </>
            )}
          </>
        )}

        {/* Bankkarten Tab */}
        {activeTab === 'documents' && activeSubTab === 'cards' && (
          <>
            {/* Bot Status Check - zeige Error wenn Bot offline (auch während checking) */}
            {!botStatus.isOnline ? (
              <BotStatusCard status={botStatus} onRetry={loadData} />
            ) : (
              <div className="space-y-6">
                {!botStatus.isOnline ? null : loading ? (
                  <SkeletonCard />
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <IdCard className="w-6 h-6 text-white/60" />
                      <h2 className="text-xl font-bold text-white">Meine Dokumente</h2>
                      <span className="px-2 py-1 rounded-full bg-white/10 text-white/50 text-xs">
                        4 Dokumente
                      </span>
                    </div>

                    {/* Grid: Bankkarte & Personalausweis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Bankkarte */}
                      <div data-tour-card="Bankkarte|Deine digitale Bankkarte mit Kartennummer, Inhaber-Name und Guthaben. Dreh sie um, um die Details zu sehen.">
                        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Bankkarte
                        </h3>
                        <div className="max-w-md">
                          {cards.length > 0 ? (
                            <BankCard 
                              card={cards[0]} 
                              userName={character?.name || user.username}
                              userData={userData}
                            />
                          ) : (
                            <div className="glass rounded-2xl p-8 text-center border border-white/[0.08]">
                              <CreditCard className="w-12 h-12 mx-auto mb-3 text-white/20" />
                              <p className="text-sm text-white/50">Keine Bankkarte</p>
                              <p className="text-xs text-white/30 mt-1">Erstelle eine im Discord Bot</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Personalausweis */}
                      <div data-tour-card="Personalausweis|Dein digitaler Personalausweis mit allen Stammdaten (Name, Alter, Geschlecht, Herkunft). Musst du bei Polizei-Kontrollen vorzeigen.">
                        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                          <IdCard className="w-4 h-4" />
                          Personalausweis
                        </h3>
                        <div className="max-w-md">
                          <IDCard 
                            character={character}
                            avatarUrl={avatarUrl}
                            userId={user.id}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Grid: Führerschein & Waffenschein */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      {/* Führerschein */}
                      <div data-tour-card="Führerschein|Dein Führerschein mit allen Fahrzeug-Klassen. Ohne gültigen Schein drohen bei Polizei-Kontrollen Bußgelder.">
                        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Führerschein
                        </h3>
                        <div className="max-w-md">
                          <DriversLicenseCard 
                            character={character}
                            avatarUrl={avatarUrl}
                            userId={user.id}
                            licenses={licenses}
                          />
                        </div>
                      </div>

                      {/* Waffenschein */}
                      <div data-tour-card="Waffenschein|Berechtigt dich zum Besitz und Tragen von Schusswaffen. Ohne gültigen Waffenschein drohen bei Polizei-Kontrollen schwere Strafen.">
                        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Waffenschein
                        </h3>
                        <div className="max-w-md">
                          <WeaponsLicenseCard 
                            character={character}
                            avatarUrl={avatarUrl}
                            userId={user.id}
                            licenses={licenses}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ========================================= */}
        {/* BENEFITS TAB - PWA Vorteile */}
        {/* ========================================= */}
        {activeTab === 'benefits' && activeSubTab === 'pwa' && (
          <div className="space-y-6">
            {/* PWA Notifications Component */}
            <PWANotifications userData={userData} isPWA={isPWA} discordUserId={user?.id} />
            
            {/* PWA Status Card */}
            <div data-tour-card="PWA-Status|Zeigt dir an, ob du Hamburg Horizon als App auf deinem Gerät installiert hast. Falls nicht, kannst du die App direkt hier installieren." className={`glass rounded-2xl p-6 border ${isPWA ? 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10' : 'border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-yellow-500/10'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-2xl ${isPWA ? 'bg-green-500/20' : 'bg-orange-500/20'} flex items-center justify-center flex-shrink-0`}>
                  {isPWA ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <Smartphone className="w-8 h-8 text-orange-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`text-xl font-bold ${isPWA ? 'text-green-400' : 'text-orange-400'}`}>
                      {isPWA ? 'PWA Aktiv' : 'PWA Nicht Installiert'}
                    </h3>
                    {isPWA && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-[10px] font-bold text-green-300 uppercase tracking-wider">Aktiv</span>
                    )}
                  </div>
                  <p className="text-white/60 mb-4">
                    {isPWA 
                      ? 'Du nutzt Hamburg Horizon als App! Alle PWA-Vorteile sind aktiv.' 
                      : 'Installiere Hamburg Horizon als App auf deinem Gerät und erhalte exklusive Vorteile!'}
                  </p>
                  
                  {!isPWA && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all">
                        <Download className="w-4 h-4" />
                        <span>App installieren</span>
                      </button>
                      <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg font-medium transition-all border border-white/10">
                        <ExternalLink className="w-4 h-4" />
                        <span>Anleitung ansehen</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PWA Vorteile Liste */}
            <div data-tour-card="Exklusive PWA-Vorteile|Alle Bonis, die du durch die App-Installation erhältst: Push-Nachrichten, Offline-Modus, tägliche Extra-Boni und mehr." className="glass rounded-2xl p-6 border border-white/[0.08]">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Exklusive PWA-Vorteile</h2>
                {isPWA && (
                  <span className="ml-auto px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/25 text-xs font-semibold text-green-400">
                    Alle freigeschaltet
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vorteil 1: 20k Daily */}
                <div className={`group p-4 rounded-xl border transition-all hover:scale-[1.01] ${isPWA ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${isPWA ? 'bg-green-500/20' : 'bg-purple-500/20'} flex items-center justify-center flex-shrink-0`}>
                      <CircleDollarSign className={`w-5 h-5 ${isPWA ? 'text-green-400' : 'text-purple-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">20.000 Täglich</h3>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isPWA ? 'bg-green-500/20 text-green-300' : 'bg-purple-500/20 text-purple-300'}`}>4x BONUS</span>
                      </div>
                      <p className="text-sm text-white/60">Statt 5.000 bekommst du als PWA-Nutzer den vierfachen Daily Bonus</p>
                      {isPWA ? (
                        <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Freigeschaltet</p>
                      ) : (
                        <p className="text-xs text-white/30 mt-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Nur mit PWA</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vorteil 2: Push Benachrichtigungen */}
                <div className={`group p-4 rounded-xl border transition-all hover:scale-[1.01] ${isPWA ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${isPWA ? 'bg-green-500/20' : 'bg-orange-500/20'} flex items-center justify-center flex-shrink-0`}>
                      <BellRing className={`w-5 h-5 ${isPWA ? 'text-green-400' : 'text-orange-400'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Push-Benachrichtigungen</h3>
                      <p className="text-sm text-white/60">Werde benachrichtigt wenn Cooldowns fertig sind, Daily Bonus bereit ist oder Wartungen anstehen</p>
                      {isPWA ? (
                        <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Automatisch aktiv</p>
                      ) : (
                        <p className="text-xs text-white/30 mt-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Nur mit PWA</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vorteil 3: Offline Modus */}
                <div className={`group p-4 rounded-xl border transition-all hover:scale-[1.01] ${isPWA ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${isPWA ? 'bg-green-500/20' : 'bg-indigo-500/20'} flex items-center justify-center flex-shrink-0`}>
                      <Wifi className={`w-5 h-5 ${isPWA ? 'text-green-400' : 'text-indigo-400'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Offline-Modus</h3>
                      <p className="text-sm text-white/60">Profil und Daten sind auch ohne Internetverbindung abrufbar</p>
                      {isPWA ? (
                        <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Freigeschaltet</p>
                      ) : (
                        <p className="text-xs text-white/30 mt-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Nur mit PWA</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vorteil 4: Schneller Zugriff */}
                <div className={`group p-4 rounded-xl border transition-all hover:scale-[1.01] ${isPWA ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${isPWA ? 'bg-green-500/20' : 'bg-blue-500/20'} flex items-center justify-center flex-shrink-0`}>
                      <AppWindow className={`w-5 h-5 ${isPWA ? 'text-green-400' : 'text-blue-400'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Nativer App-Zugriff</h3>
                      <p className="text-sm text-white/60">App-Icon direkt auf deinem Homescreen, startet im Fullscreen ohne Browser-Leiste</p>
                      {isPWA ? (
                        <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Freigeschaltet</p>
                      ) : (
                        <p className="text-xs text-white/30 mt-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Nur mit PWA</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Installations-Anleitung für Nicht-PWA User */}
            {!isPWA && (
              <div data-tour-card="App-Installation|Schritt-für-Schritt-Anleitung, wie du Hamburg Horizon als App auf deinem Handy installierst. In 3 Schritten erledigt." className="glass rounded-2xl p-6 border border-blue-500/15 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
                <div className="flex items-center gap-3 mb-5">
                  <Monitor className="w-6 h-6 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">So installierst du die App</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03]">
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-400">1</div>
                    <p className="text-sm text-white/70">Öffne die Seite in Chrome oder Safari auf deinem Handy</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03]">
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-400">2</div>
                    <p className="text-sm text-white/70">Tippe auf das Teilen-Symbol und wähle &quot;Zum Homescreen hinzufügen&quot;</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03]">
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-400">3</div>
                    <p className="text-sm text-white/70">Öffne die App über das neue Icon und alle Vorteile werden automatisch aktiviert</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* BENEFITS TAB - Discord Vorteile */}
        {/* ========================================= */}
        {activeTab === 'benefits' && activeSubTab === 'discord' && (
          <div className="space-y-6">
            {!botStatus.isOnline ? (
              <BotStatusCard status={botStatus} onRetry={loadData} />
            ) : loading ? (
              <SkeletonCard />
            ) : (
              <>
                {/* VIP Status Card */}
                <div data-tour-card="VIP-Status|Dein aktueller VIP-Rang (Premium, Platinum, Ultimate oder Elite+). Jede Stufe bringt kürzere Cooldowns, höhere Boni und exklusive Perks." className="glass rounded-2xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-6">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <h2 className="text-xl font-bold text-white">Dein VIP-Status</h2>
                  </div>

                  {(() => {
                    const licenses = (userData?.licenses || [])
                      .filter(l => l)
                      .map(l => typeof l === 'string' ? l : (l.name || l.id))
                      .filter(l => l && typeof l === 'string')
                      .filter(l => l && !l.startsWith('credits_') && !l.startsWith('credit_'));
                    const hasLuxusPass = licenses.includes('luxus_pass');
                    const hasVipElitePlus = licenses.includes('vip_elite_plus');
                    const hasVipUltimate = licenses.includes('vip_ultimate');
                    const hasVipPlatinum = licenses.includes('vip_platinum');
                    const hasVipPremium = licenses.includes('vip_premium');

                    let vipStatus = null;
                    if (hasLuxusPass) {
                      vipStatus = { name: 'Luxus-Pass', color: 'gold', cooldown: '45 Min', bonus: '8.000', icon: Crown };
                    } else if (hasVipElitePlus) {
                      vipStatus = { name: 'VIP ELITE PLUS', color: 'purple', cooldown: '45 Min', bonus: '2.000', icon: Gem };
                    } else if (hasVipUltimate) {
                      vipStatus = { name: 'VIP Ultimate', color: 'blue', cooldown: '45 Min', bonus: null, icon: Star };
                    } else if (hasVipPlatinum) {
                      vipStatus = { name: 'VIP Platinum', color: 'cyan', cooldown: '1 Std', bonus: null, icon: Shield };
                    } else if (hasVipPremium) {
                      vipStatus = { name: 'VIP Premium', color: 'yellow', cooldown: '2 Std', bonus: null, icon: Award };
                    }

                    return vipStatus ? (
                      <div className={`p-6 rounded-xl bg-gradient-to-br from-${vipStatus.color}-500/10 to-${vipStatus.color}-600/10 border border-${vipStatus.color}-500/20`}>
                        <div className="flex items-start gap-4">
                          <div className={`w-16 h-16 rounded-2xl bg-${vipStatus.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                            <vipStatus.icon className={`w-8 h-8 text-${vipStatus.color}-400`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className={`text-2xl font-bold text-${vipStatus.color}-400`}>{vipStatus.name}</h3>
                              <BadgeCheck className={`w-5 h-5 text-${vipStatus.color}-400`} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                              <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                                <div className="flex items-center gap-2 mb-1">
                                  <Timer className="w-3.5 h-3.5 text-white/40" />
                                  <p className="text-sm text-white/40">Collect Cooldown</p>
                                </div>
                                <p className="text-lg font-semibold text-white">{vipStatus.cooldown}</p>
                              </div>
                              {vipStatus.bonus && (
                                <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CircleDollarSign className="w-3.5 h-3.5 text-white/40" />
                                    <p className="text-sm text-white/40">{hasLuxusPass ? 'Luxus-Pass Daily Bonus' : 'Elite+ Daily Bonus'}</p>
                                  </div>
                                  <p className="text-lg font-semibold text-white">{vipStatus.bonus}€</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                            <Crown className="w-7 h-7 text-white/20" />
                          </div>
                          <div>
                            <p className="text-white/60 font-medium">Du hast aktuell keinen VIP-Status</p>
                            <p className="text-sm text-white/35 mt-1">Besuche den Shop auf Discord um VIP zu werden</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Server Booster Status - vom Bot geprüft */}
                <div data-tour-card="Server Booster|Boostest du den Discord-Server, siehst du hier deine zusätzlichen Boni: +5.000 bei jedem /collect plus eine exklusive Booster-Rolle." className={`glass rounded-2xl p-6 border ${userHasLicense('server_booster') ? 'border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-purple-500/10' : 'border-white/[0.08]'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-2xl ${userHasLicense('server_booster') ? 'bg-pink-500/20' : 'bg-white/[0.04]'} flex items-center justify-center flex-shrink-0`}>
                      <Rocket className={`w-8 h-8 ${userHasLicense('server_booster') ? 'text-pink-400' : 'text-white/20'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-xl font-bold ${userHasLicense('server_booster') ? 'text-pink-400' : 'text-white/40'}`}>Server Booster</h3>
                        {userHasLicense('server_booster') ? (
                          <BadgeCheck className="w-5 h-5 text-pink-400" />
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] font-bold text-white/30 uppercase tracking-wider">Inaktiv</span>
                        )}
                      </div>
                      {userHasLicense('server_booster') ? (
                        <>
                          <p className="text-white/60 mb-3">Danke, dass du unseren Server boostest! Deine Vorteile sind aktiv.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                              <CircleDollarSign className="w-4 h-4 text-pink-400 flex-shrink-0" />
                              <p className="text-sm text-white/80">
                                <span className="font-semibold text-pink-400">+5.000</span> beim /collect
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                              <Star className="w-4 h-4 text-pink-400 flex-shrink-0" />
                              <p className="text-sm text-white/80">
                                <span className="font-semibold text-pink-400">Exklusive</span> Booster-Rolle
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-white/40 text-sm">Booste den Discord Server und erhalte +5.000 bei jedem /collect und eine exklusive Rolle!</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ========= DISCORD SERVER VORTEILE ========= */}
                <div data-tour-card="Discord Server Vorteile|Übersicht aller Commands und Vorteile, die du im Discord-Server nutzen kannst: /collect, Giveaways, Spiele und mehr." className="glass rounded-2xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-6 h-6 text-indigo-400" />
                    <h2 className="text-xl font-bold text-white">Discord Server Vorteile</h2>
                  </div>
                  <p className="text-sm text-white/40 mb-5 ml-9">Vorteile die du auf unserem Discord Server erhältst</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* /collect Command */}
                    <div className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                          <CircleDollarSign className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">/collect Gehalt</h3>
                          <p className="text-xs text-white/50 mt-0.5">Sammle regelmäßig dein Gehalt ein. VIP = kürzerer Cooldown</p>
                          <div className="flex items-center gap-1 mt-2">
                            <BadgeCheck className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-[11px] text-green-400 font-medium">Verfügbar</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* /rob Überfall */}
                    <div className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">/rob Überfall</h3>
                          <p className="text-xs text-white/50 mt-0.5">Raube andere Nutzer aus und stiehl ihr Geld</p>
                          <div className="flex items-center gap-1 mt-2">
                            <BadgeCheck className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-[11px] text-green-400 font-medium">Verfügbar</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* /work Arbeiten */}
                    <div className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">/work Arbeiten</h3>
                          <p className="text-xs text-white/50 mt-0.5">Arbeite und verdiene Geld für dein Konto</p>
                          <div className="flex items-center gap-1 mt-2">
                            <BadgeCheck className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-[11px] text-green-400 font-medium">Verfügbar</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* VIP Vorteile */}
                    {(() => {
                      const licenses = (userData?.licenses || [])
                        .filter(l => l)
                      .map(l => typeof l === 'string' ? l : (l.name || l.id))
                      .filter(l => l && typeof l === 'string')
                        .filter(l => l && !l.startsWith('credits_') && !l.startsWith('credit_'));
                      const hasVip = licenses.some(l => l.startsWith('vip_'));
                      return (
                        <div className={`group p-4 rounded-xl border transition-all ${hasVip ? 'border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/8' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg ${hasVip ? 'bg-yellow-500/15' : 'bg-white/[0.06]'} flex items-center justify-center flex-shrink-0`}>
                              <Timer className={`w-5 h-5 ${hasVip ? 'text-yellow-400' : 'text-white/30'}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-sm">Reduzierter Cooldown</h3>
                              <p className="text-xs text-white/50 mt-0.5">Kürzere Wartezeit bei /collect als VIP-Mitglied</p>
                              <div className="flex items-center gap-1 mt-2">
                                {hasVip ? (
                                  <>
                                    <BadgeCheck className="w-3.5 h-3.5 text-yellow-400" />
                                    <span className="text-[11px] text-yellow-400 font-medium">Aktiv</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3 h-3 text-white/25" />
                                    <span className="text-[11px] text-white/30 font-medium">VIP benötigt</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Server Booster Bonus */}
                    <div className={`group p-4 rounded-xl border transition-all ${userHasLicense('server_booster') ? 'border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/8' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${userHasLicense('server_booster') ? 'bg-pink-500/15' : 'bg-white/[0.06]'} flex items-center justify-center flex-shrink-0`}>
                          <Rocket className={`w-5 h-5 ${userHasLicense('server_booster') ? 'text-pink-400' : 'text-white/30'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">Booster Bonus</h3>
                          <p className="text-xs text-white/50 mt-0.5">+5.000 bei jedem /collect als Server Booster</p>
                          <div className="flex items-center gap-1 mt-2">
                            {userHasLicense('server_booster') ? (
                              <>
                                <BadgeCheck className="w-3.5 h-3.5 text-pink-400" />
                                <span className="text-[11px] text-pink-400 font-medium">Aktiv</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-white/25" />
                                <span className="text-[11px] text-white/30 font-medium">Boost benötigt</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Elite+ Daily */}
                    <div className={`group p-4 rounded-xl border transition-all ${userHasLicense('vip_elite_plus') ? 'border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/8' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${userHasLicense('vip_elite_plus') ? 'bg-purple-500/15' : 'bg-white/[0.06]'} flex items-center justify-center flex-shrink-0`}>
                          <Gem className={`w-5 h-5 ${userHasLicense('vip_elite_plus') ? 'text-purple-400' : 'text-white/30'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">Elite+ Daily Bonus</h3>
                          <p className="text-xs text-white/50 mt-0.5">+2.000 täglich als VIP Elite+ Mitglied</p>
                          <div className="flex items-center gap-1 mt-2">
                            {userHasLicense('vip_elite_plus') ? (
                              <>
                                <BadgeCheck className="w-3.5 h-3.5 text-purple-400" />
                                <span className="text-[11px] text-purple-400 font-medium">Aktiv</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-white/25" />
                                <span className="text-[11px] text-white/30 font-medium">Elite+ benötigt</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ========= WEBSEITE VORTEILE ========= */}
                <div data-tour-card="Webseite Vorteile|Features, die du exklusiv auf dieser Webseite nutzen kannst: Profil-Dashboard, Transaktions-Verlauf, Sparkonto und Bewerbungen." className="glass rounded-2xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-xl font-bold text-white">Webseite Vorteile</h2>
                  </div>
                  <p className="text-sm text-white/40 mb-5 ml-9">Vorteile die du auf unserer Webseite erhältst</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Profil Dashboard */}
                    <div className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                          <LayoutDashboard className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">Profil Dashboard</h3>
                          <p className="text-xs text-white/50 mt-0.5">Übersicht über dein Konto, Kontostand und Statistiken</p>
                          <div className="flex items-center gap-1 mt-2">
                            <BadgeCheck className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-[11px] text-cyan-400 font-medium">Verfügbar</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transaktions-Verlauf */}
                    <div className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">Transaktions-Verlauf</h3>
                          <p className="text-xs text-white/50 mt-0.5">Alle Ein- und Ausgänge im Detail einsehen</p>
                          <div className="flex items-center gap-1 mt-2">
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] text-emerald-400 font-medium">Verfügbar</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sparkonto */}
                    <div className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                          <PiggyBank className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">Sparkonto Übersicht</h3>
                          <p className="text-xs text-white/50 mt-0.5">Dein Sparkonto verwalten und Zinsen verfolgen</p>
                          <div className="flex items-center gap-1 mt-2">
                            <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[11px] text-amber-400 font-medium">Verfügbar</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Daily Bonus */}
                    <div className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                          <Gift className="w-5 h-5 text-violet-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">Täglicher Bonus</h3>
                          <p className="text-xs text-white/50 mt-0.5">Jeden Tag einen Bonus abholen, direkt auf der Webseite</p>
                          <div className="flex items-center gap-1 mt-2">
                            <BadgeCheck className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-[11px] text-violet-400 font-medium">Verfügbar</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bewerbungssystem */}
                    <div className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                          <ClipboardList className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">Team Bewerbungen</h3>
                          <p className="text-xs text-white/50 mt-0.5">Bewirb dich direkt auf der Webseite für das Team</p>
                          <div className="flex items-center gap-1 mt-2">
                            <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[11px] text-blue-400 font-medium">Verfügbar</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Steuer-Records */}
                    <div className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                          <Receipt className="w-5 h-5 text-rose-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">Steuer-Records</h3>
                          <p className="text-xs text-white/50 mt-0.5">Steuerbescheide und Abzüge im Überblick</p>
                          <div className="flex items-center gap-1 mt-2">
                            <BadgeCheck className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-[11px] text-rose-400 font-medium">Verfügbar</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aktive Events Card */}
                <div data-tour-card="Aktive Events|Laufende Events mit Sonderboni, Rabatten oder Aktionen. Schau immer mal rein – Events sind oft zeitlich begrenzt." className="glass rounded-2xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="w-6 h-6 text-orange-400" />
                    <h2 className="text-xl font-bold text-white">Aktive Events</h2>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <Handshake className="w-6 h-6 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-orange-400">Sozialwoche</h3>
                          <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-[10px] font-bold text-orange-300 uppercase tracking-wider">Aktiv</span>
                        </div>
                        <p className="text-sm text-white/60">Arbeitslosengeld VERDOPPELT für alle ohne Job!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}


        {/* Vermögens-Übersicht Tab */}
        {activeTab === 'finance' && activeSubTab === 'overview' && (
          <div className="space-y-6">
            {(() => {
              // Debug: Log userData structure
              console.log('🔍 userData:', userData);
              console.log('🔍 userData.money:', userData?.money);
              console.log('🔍 userData.balance:', userData?.balance);
              
              // Berechne Vermögen
              const cash = userData?.money?.cash || 0;
              const bank = userData?.money?.bank || 0;
              const savings = userData?.money?.savings || 0;
              
              // Berechne Schulden (Kredite + offene Rechnungen)
              const kreditSchulden = (userData?.kredite || [])
                .filter(k => k.status === 'aktiv' || k.status === 'pending')
                .reduce((sum, k) => sum + (k.rueckzahlungsBetrag || 0), 0);
              
              const rechnungSchulden = (userData?.invoices || [])
                .filter(inv => inv.status === 'pending')
                .reduce((sum, inv) => sum + (inv.amount || 0), 0);
              
              const totalSchulden = kreditSchulden + rechnungSchulden;
              const totalVermögen = cash + bank + savings - totalSchulden;
              const bruttoVermögen = cash + bank + savings;

              // Berechne Prozente für Visualisierung
              const cashPercent = bruttoVermögen > 0 ? (cash / bruttoVermögen * 100).toFixed(1) : 0;
              const bankPercent = bruttoVermögen > 0 ? (bank / bruttoVermögen * 100).toFixed(1) : 0;
              const savingsPercent = bruttoVermögen > 0 ? (savings / bruttoVermögen * 100).toFixed(1) : 0;

              return (
                <>
                  {/* Hauptkarte - Gesamtvermögen */}
                  <div className="glass rounded-3xl p-8 border border-white/[0.08] relative overflow-hidden">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-blue-500/10 pointer-events-none" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                          <Wallet className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-white/60">Gesamtvermögen</h2>
                          <p className="text-sm text-white/40">Nach Abzug aller Schulden</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                          {totalVermögen.toLocaleString('de-DE')} €
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {totalVermögen >= 0 ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-green-400" />
                              <span className="text-green-400">Positiv</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-4 h-4 text-red-400" />
                              <span className="text-red-400">Negativ</span>
                            </>
                          )}
                        </div>
                      </div>


                      {/* Führerschein-Badges */}
                      {userData.licenses && userData.licenses.filter(l => {
                        const id = typeof l === 'string' ? l : l.id;
                        return id?.startsWith('license_');
                      }).length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Führerscheine
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {userData.licenses
                              .filter(l => {
                                const id = typeof l === 'string' ? l : l.id;
                                return id?.startsWith('license_');
                              })
                              .map((license, idx) => (
                                <LicenseBadge key={idx} licenseId={license} index={idx} />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Level/XP Progress */}
                      {(userData.level || userData.xp) && (
                        <div className="mt-6">
                          <LevelProgress 
                            level={userData.level || 1}
                            xp={userData.xp || 0}
                            nextLevelXP={userData.nextLevelXP || 1000}
                          />
                        </div>
                      )}

                      {/* Quick Stats mit neuen Komponenten */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                        <StatsCard 
                          icon={DollarSign}
                          value={`${(cash + bank + savings).toLocaleString('de-DE')}€`}
                          label="Vermögen"
                          color="green"
                        />
                        <StatsCard 
                          icon={Coins}
                          value={(userData.credits || 0).toLocaleString('de-DE')}
                          label="Credits"
                          color="blue"
                        />
                        <StatsCard 
                          icon={Car}
                          value={userData.vehicles?.length || 0}
                          label="Fahrzeuge"
                          color="purple"
                        />
                        <StatsCard 
                          icon={Shield}
                          value={userData.vipTier || 'Keine'}
                          label="VIP Status"
                          color="gold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vermögensaufteilung */}
                  <div data-tour-card="Vermögensaufteilung|Visualisiert, wie sich dein Vermögen auf Bargeld, Bank und Sparkonto verteilt. Progress-Bars zeigen dir auf einen Blick die Verteilung." className="glass rounded-2xl p-6 border border-white/[0.08]">
                    <div className="flex items-center gap-3 mb-6">
                      <PieChart className="w-6 h-6 text-white/60" />
                      <h3 className="text-xl font-bold text-white">Vermögensaufteilung</h3>
                    </div>

                    {/* Visual Progress Bars */}
                    <div className="space-y-4">
                      {/* Bargeld */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-white/70">Bargeld</span>
                          <span className="text-white font-semibold">{cash.toLocaleString('de-DE')} € ({cashPercent}%)</span>
                        </div>
                        <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${cashPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Bank */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-white/70">Bank-Konto</span>
                          <span className="text-white font-semibold">{bank.toLocaleString('de-DE')} € ({bankPercent}%)</span>
                        </div>
                        <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${bankPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Sparkonto */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-white/70">Sparkonto</span>
                          <span className="text-white font-semibold">{savings.toLocaleString('de-DE')} € ({savingsPercent}%)</span>
                        </div>
                        <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${savingsPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gesamt */}
                    <div className="mt-6 pt-6 border-t border-white/[0.08]">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 font-medium">Brutto-Vermögen</span>
                        <span className="text-2xl font-bold text-white">{bruttoVermögen.toLocaleString('de-DE')} €</span>
                      </div>
                    </div>
                  </div>

                  {/* Schulden-Übersicht */}
                  {totalSchulden > 0 && (
                    <div data-tour-card="Offene Schulden|Deine aktuellen Schulden aus Krediten und Rechnungen. Behalte sie im Auge und bezahle sie zeitnah, um Mahngebühren zu vermeiden." className="glass rounded-2xl p-6 border border-red-500/20 bg-red-500/5">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Offene Schulden</h3>
                          <p className="text-sm text-white/50">Gesamt: {totalSchulden.toLocaleString('de-DE')} €</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Kredite */}
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                          <div className="flex items-center gap-3 mb-2">
                            <CreditCard className="w-5 h-5 text-orange-400" />
                            <span className="text-sm text-white/60">Kredite</span>
                          </div>
                          <div className="text-2xl font-bold text-orange-400">{kreditSchulden.toLocaleString('de-DE')} €</div>
                          <div className="text-xs text-white/40 mt-1">
                            {(userData?.kredite || []).filter(k => k.status === 'aktiv' || k.status === 'pending').length} aktiv
                          </div>
                        </div>

                        {/* Rechnungen */}
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-red-400" />
                            <span className="text-sm text-white/60">Offene Rechnungen</span>
                          </div>
                          <div className="text-2xl font-bold text-red-400">{rechnungSchulden.toLocaleString('de-DE')} €</div>
                          <div className="text-xs text-white/40 mt-1">
                            {(userData?.invoices || []).filter(inv => inv.status === 'pending').length} offen
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Finanz-Tipps */}
                  <div data-tour-card="Finanz-Tipps|Personalisierte Tipps basierend auf deiner finanziellen Situation. Zum Beispiel Hinweise zu hohen Schulden oder zu wenig Sparguthaben." className="glass rounded-2xl p-6 border border-white/[0.08]">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb className="w-6 h-6 text-yellow-400" />
                      <h3 className="text-lg font-bold text-white">Finanz-Tipps</h3>
                    </div>
                    <div className="space-y-3">
                      {totalSchulden > bruttoVermögen * 0.5 && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                          <p className="text-sm text-red-300">
                            ⚠️ Deine Schulden sind sehr hoch ({((totalSchulden/bruttoVermögen)*100).toFixed(0)}% vom Vermögen). Versuche sie schnell abzubauen.
                          </p>
                        </div>
                      )}
                      {savings < bruttoVermögen * 0.1 && bruttoVermögen > 0 && (
                        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                          <p className="text-sm text-yellow-300">
                            💡 Du hast wenig auf dem Sparkonto. Überlege, 10-20% deines Vermögens zu sparen.
                          </p>
                        </div>
                      )}
                      {totalSchulden === 0 && bruttoVermögen > 100000 && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                          <p className="text-sm text-green-300">
                            ✅ Glückwunsch! Du bist schuldenfrei und hast ein solides Vermögen aufgebaut.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Überweisung Tab */}
        {activeTab === 'finance' && activeSubTab === 'transfer' && (
          <div data-tour-card="Geld überweisen|Sende Geld an andere Spieler. Wähle den Empfänger, gib den Betrag ein und optional einen Verwendungszweck. Schnell und sicher.">
          <TransferMoneyView 
            userData={userData}
            onTransferComplete={() => {
              // Reload data nach erfolgreicher Überweisung
              loadData();
            }}
          />
          </div>
        )}

        {/* Statistiken Tab - NEU */}
        {activeTab === 'finance' && activeSubTab === 'statistics' && (
          <div data-tour-card="Finanz-Statistiken|Detaillierte Charts und Auswertungen zu deinen Einnahmen und Ausgaben über Zeit.">
          <FinanzStatistikenView userData={userData} />
          </div>
        )}

        {/* Transaktionen Tab */}
        {activeTab === 'finance' && activeSubTab === 'transactions' && (
          <div data-tour-card="Transaktionen|Alle deine Ein- und Ausgänge. Filtere nach Typ, Datum oder Betrag und sieh dir Details zu jeder Buchung an.">
          <ErweiterteTransaktionenView 
            userData={userData} 
            filter={transactionFilter}
            setFilter={setTransactionFilter}
          />
          </div>
        )}

        {/* Rechnungen Tab */}
        {activeTab === 'finance' && activeSubTab === 'invoices' && (
          <div className="space-y-6">
            {!botStatus.isOnline ? (
              <BotStatusCard status={botStatus} onRetry={loadData} />
            ) : loading ? (
              <SkeletonCard />
            ) : (
              <div data-tour-card="Meine Rechnungen|Alle deine offenen und bezahlten Rechnungen (Polizei, Feuerwehr, Rettungsdienst, Staat). Filtere nach Status und Fraktion." className="glass rounded-2xl p-4 sm:p-6 border border-white/[0.08]">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white/60" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">Meine Rechnungen</h2>
                  {userData?.invoices?.length > 0 && (
                    <span className="px-2 py-1 rounded-full bg-white/10 text-white/50 text-xs">
                      {userData.invoices.length}
                    </span>
                  )}
                </div>

                {/* Filter */}
                <div className="mb-6 flex flex-col sm:flex-row gap-3">
                  <select
                    value={invoiceStatusFilter}
                    onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
                  >
                    <option value="all">Alle Status</option>
                    <option value="offen">Offen</option>
                    <option value="paid">Bezahlt</option>
                    <option value="cancelled">Storniert</option>
                  </select>
                  <select
                    value={invoiceFraktionFilter}
                    onChange={(e) => setInvoiceFraktionFilter(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
                  >
                    <option value="all">Alle Fraktionen</option>
                    <option value="Polizei">Polizei</option>
                    <option value="Feuerwehr">Feuerwehr</option>
                    <option value="Rettungsdienst">Rettungsdienst</option>
                    <option value="Staat">Staat</option>
                  </select>
                </div>

                {userData?.invoices && userData.invoices.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {userData.invoices
                        .filter(inv => {
                          // Status filter
                          if (invoiceStatusFilter !== 'all' && inv.status !== invoiceStatusFilter) {
                            return false;
                          }
                          // Fraktion filter
                          if (invoiceFraktionFilter !== 'all' && inv.fraktion !== invoiceFraktionFilter) {
                            return false;
                          }
                          return true;
                        })
                        .slice((invoicesPage - 1) * itemsPerPage, invoicesPage * itemsPerPage)
                        .map((invoice, index) => {
                          const isNew = invoice.createdAt && 
                            (new Date() - new Date(invoice.createdAt)) < 24 * 60 * 60 * 1000;
                          const isPaid = invoice.paidAt || invoice.status === 'paid';
                          const isCancelled = invoice.status === 'cancelled';
                          const isPending = invoice.status === 'pending' || invoice.status === 'offen';
                          
                          return (
                            <div 
                              key={index}
                              className={`p-4 sm:p-5 rounded-xl border transition-all ${
                                isNew 
                                  ? 'bg-blue-500/10 border-blue-500/30 animate-pulse-slow' 
                                  : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
                              }`}
                            >
                              <div className="flex items-start gap-3 sm:gap-4">
                                {/* Icon */}
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  isCancelled
                                    ? 'bg-gray-500/20'
                                    : isPaid 
                                    ? 'bg-green-500/20' 
                                    : 'bg-yellow-500/20'
                                }`}>
                                  {isCancelled ? (
                                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                  ) : isPaid ? (
                                    <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                                  ) : (
                                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                                  )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <span className="text-sm sm:text-base font-bold text-white">
                                      {invoice.bürgerName || 'Rechnung'}
                                    </span>
                                    {isNew && (
                                      <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold animate-bounce">
                                        NEU
                                      </span>
                                    )}
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                                      isCancelled
                                        ? 'bg-gray-500/20 text-gray-400'
                                        : isPaid 
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                      {isCancelled ? 'Storniert' : isPaid ? 'Bezahlt' : 'Offen'}
                                    </span>
                                  </div>
                                  
                                  {/* Strafen Liste */}
                                  {invoice.strafen && invoice.strafen.length > 0 && (
                                    <div className="mb-3 space-y-1">
                                      {invoice.strafen.map((strafe, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white/[0.03] px-3 py-2 rounded-lg">
                                          <span className="text-xs sm:text-sm text-white/90">{strafe.name}</span>
                                          <span className="text-xs sm:text-sm text-white font-medium">{strafe.price?.toLocaleString?.()}€</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {invoice.versicherungsTyp && (
                                    <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3" />
                                      {invoice.versicherungsTyp}
                                    </p>
                                  )}
                                  
                                  {invoice.paidBySchutzbrief && (
                                    <p className="text-xs text-blue-400 mb-2 flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      Bezahlt durch Schutzbrief
                                    </p>
                                  )}
                                </div>
                                
                                <div className="text-right">
                                  <p className="text-lg sm:text-xl font-bold text-white mb-1">
                                    {invoice.totalAmount?.toLocaleString?.()}€
                                  </p>
                                  {invoice.refunded && invoice.refundAmount > 0 && (
                                    <p className="text-xs text-green-400">
                                      +{invoice.refundAmount?.toLocaleString?.()}€ erstattet
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/50">
                                {invoice.beamterTag && (
                                  <div className="flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    <span>Beamter: {invoice.beamterTag}</span>
                                  </div>
                                )}
                                {invoice.createdAt && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(invoice.createdAt).toLocaleDateString('de-DE', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}</span>
                                  </div>
                                )}
                                {invoice.paidAt && (
                                  <div className="flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    <span>Bezahlt: {new Date(invoice.paidAt).toLocaleDateString('de-DE')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  
                  <Pagination 
                    currentPage={invoicesPage}
                    totalItems={userData.invoices.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setInvoicesPage}
                  />
                </>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-white/20" />
                    <h3 className="text-base sm:text-lg font-bold text-white mb-2">Keine Rechnungen</h3>
                    <p className="text-sm text-white/40 max-w-md mx-auto">
                      Hier werden deine Rechnungen vom Discord Bot angezeigt.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Personalakte Tab */}
        {activeTab === 'documents' && activeSubTab === 'personalakte' && (
          <div className="space-y-6">
            {!botStatus.isOnline ? (
              <BotStatusCard status={botStatus} onRetry={loadData} />
            ) : loading ? (
              <SkeletonCard />
            ) : (
              <div data-tour-card="Personalakte|Alle Einträge in deiner Personalakte: Strafen, Vermerke, Auszeichnungen und besondere Vorkommnisse. Mit Filter nach Status." className="glass rounded-2xl p-4 sm:p-6 border border-white/[0.08]">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white/60" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">Meine Personalakte</h2>
                  {userData?.personalakte?.length > 0 && (
                    <span className="px-2 py-1 rounded-full bg-white/10 text-white/50 text-xs">
                      {userData.personalakte.length}
                    </span>
                  )}
                </div>

                {/* Filter */}
                <div className="mb-6">
                  <select
                    value={strafakteStatusFilter}
                    onChange={(e) => setStrafakteStatusFilter(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
                  >
                    <option value="all">Alle Status</option>
                    <option value="storniert">Storniert</option>
                    <option value="bezahlt">Bezahlt</option>
                    <option value="offen">Offen</option>
                  </select>
                </div>

                {userData?.personalakte && userData.personalakte.length > 0 ? (
                  <>
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-white/20 via-white/10 to-transparent"></div>
                      
                      <div className="space-y-4 sm:space-y-6">
                        {userData.personalakte
                          .filter(record => {
                            // Status filter
                            if (strafakteStatusFilter !== 'all' && record.status !== strafakteStatusFilter) {
                              return false;
                            }
                            return true;
                          })
                          .slice((personalaktePage - 1) * itemsPerPage, personalaktePage * itemsPerPage)
                          .map((record, index) => {
                        const isNew = (record.createdAt || record.date) && 
                          (new Date() - new Date(record.createdAt || record.date)) < 24 * 60 * 60 * 1000;
                        
                        // Determine type - support both old and new format
                        const recordType = (record.typ || record.type || '').toLowerCase();
                        
                        const typeConfig = {
                          strafzettel: {
                            icon: AlertCircle,
                            color: 'red',
                            label: 'Strafzettel',
                            bgClass: 'bg-red-500/20',
                            borderClass: 'border-red-500',
                            textClass: 'text-red-400'
                          },
                          warning: { 
                            icon: AlertCircle, 
                            color: 'yellow', 
                            label: 'Verwarnung',
                            bgClass: 'bg-yellow-500/20',
                            borderClass: 'border-yellow-500',
                            textClass: 'text-yellow-400'
                          },
                          verwarnung: { 
                            icon: AlertCircle, 
                            color: 'yellow', 
                            label: 'Verwarnung',
                            bgClass: 'bg-yellow-500/20',
                            borderClass: 'border-yellow-500',
                            textClass: 'text-yellow-400'
                          },
                          promotion: { 
                            icon: ChevronUp, 
                            color: 'green', 
                            label: 'Beförderung',
                            bgClass: 'bg-green-500/20',
                            borderClass: 'border-green-500',
                            textClass: 'text-green-400'
                          },
                          beförderung: { 
                            icon: ChevronUp, 
                            color: 'green', 
                            label: 'Beförderung',
                            bgClass: 'bg-green-500/20',
                            borderClass: 'border-green-500',
                            textClass: 'text-green-400'
                          },
                          note: { 
                            icon: MessageSquare, 
                            color: 'blue', 
                            label: 'Notiz',
                            bgClass: 'bg-blue-500/20',
                            borderClass: 'border-blue-500',
                            textClass: 'text-blue-400'
                          },
                          notiz: { 
                            icon: MessageSquare, 
                            color: 'blue', 
                            label: 'Notiz',
                            bgClass: 'bg-blue-500/20',
                            borderClass: 'border-blue-500',
                            textClass: 'text-blue-400'
                          },
                          suspension: { 
                            icon: Ban, 
                            color: 'red', 
                            label: 'Suspendierung',
                            bgClass: 'bg-red-500/20',
                            borderClass: 'border-red-500',
                            textClass: 'text-red-400'
                          },
                          achievement: {
                            icon: Star,
                            color: 'purple',
                            label: 'Auszeichnung',
                            bgClass: 'bg-purple-500/20',
                            borderClass: 'border-purple-500',
                            textClass: 'text-purple-400'
                          }
                        };
                        
                        const config = typeConfig[recordType] || { 
                          icon: FileText, 
                          color: 'gray', 
                          label: record.typ || record.type || 'Eintrag',
                          bgClass: 'bg-white/10',
                          borderClass: 'border-white/30',
                          textClass: 'text-white/70'
                        };
                        
                        const IconComponent = config.icon;
                        
                        // Extract title from strafen array if available
                        const title = record.strafen && record.strafen.length > 0
                          ? record.strafen.map(s => s.name).join(', ')
                          : (record.title || record.reason || 'Ohne Titel');
                        
                        return (
                          <div key={index} className="relative pl-14 sm:pl-16">
                            {/* Timeline Dot with Icon */}
                            <div className={`absolute left-2 sm:left-3 top-1 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${config.bgClass} border-2 ${config.borderClass}`}>
                              <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${config.textClass}`} />
                            </div>
                            
                            {/* Content Card */}
                            <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
                              isNew 
                                ? 'bg-blue-500/10 border-blue-500/30 animate-pulse-slow' 
                                : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
                            }`}>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${config.bgClass} ${config.textClass}`}>
                                      {config.label}
                                    </span>
                                    {isNew && (
                                      <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold animate-bounce">
                                        NEU
                                      </span>
                                    )}
                                    {record.status && (
                                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium ${
                                        record.status === 'bezahlt' 
                                          ? 'bg-green-500/30 text-green-300'
                                          : record.status === 'storniert'
                                          ? 'bg-gray-500/30 text-gray-300'
                                          : record.status === 'offen'
                                          ? 'bg-yellow-500/30 text-yellow-300'
                                          : 'bg-blue-500/30 text-blue-300'
                                      }`}>
                                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                      </span>
                                    )}
                                    {(record.severity || (record.strafen && record.strafen.length > 2)) && (
                                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium ${
                                        record.severity === 'high' || record.severity === 'hoch' || (record.strafen && record.strafen.length > 2)
                                          ? 'bg-red-500/30 text-red-300'
                                          : record.severity === 'medium' || record.severity === 'mittel'
                                          ? 'bg-yellow-500/30 text-yellow-300'
                                          : 'bg-blue-500/30 text-blue-300'
                                      }`}>
                                        {record.strafen && record.strafen.length > 2 ? 'Schwer' :
                                         record.severity === 'high' || record.severity === 'hoch' ? 'Schwer' :
                                         record.severity === 'medium' || record.severity === 'mittel' ? 'Mittel' : 'Leicht'}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-sm sm:text-base font-bold text-white mb-2">
                                    {title}
                                  </h3>
                                  {(record.id || record.aktennummer || record.invoiceId) && (
                                    <p className="text-xs text-white/40 mb-2">
                                      ID: {record.id || record.aktennummer || record.invoiceId}
                                    </p>
                                  )}
                                  {record.betrag && (
                                    <p className="text-xs text-orange-400 mb-2 font-medium flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      Betrag: {record.betrag.toLocaleString('de-DE')} €
                                    </p>
                                  )}
                                  {record.points && (
                                    <p className="text-xs text-orange-400 mb-2 font-medium">
                                      Strafpunkte: {record.points}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Strafen Details */}
                              {record.strafen && record.strafen.length > 0 && (
                                <div className="mb-3 p-3 bg-white/[0.03] rounded-lg">
                                  <p className="text-xs font-semibold text-white/60 mb-2">Verstöße:</p>
                                  <div className="space-y-1">
                                    {record.strafen.map((strafe, i) => (
                                      <div key={i} className="flex items-center justify-between text-xs">
                                        <span className="text-white/70">{strafe.name}</span>
                                        <span className="text-red-400 font-medium">{strafe.price?.toLocaleString('de-DE')} €</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {record.description && (
                                <p className="text-sm text-white/70 mb-3 break-words leading-relaxed bg-white/[0.03] p-3 rounded-lg">
                                  {record.description}
                                </p>
                              )}
                              
                              {record.duration && (
                                <div className="mb-3 p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                  <p className="text-xs text-orange-300 font-medium">
                                    Dauer: {record.duration}
                                  </p>
                                </div>
                              )}
                              
                              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/50">
                                {(record.beamter || record.admin_name) && (
                                  <div className="flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    <span>Beamter: {record.beamter || record.admin_name}</span>
                                  </div>
                                )}
                                {(record.createdAt || record.date) && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{new Date(record.createdAt || record.date).toLocaleDateString('de-DE', { 
                                      day: '2-digit', 
                                      month: '2-digit', 
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}</span>
                                  </div>
                                )}
                                {record.updatedAt && record.updatedAt !== record.createdAt && (
                                  <div className="flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Aktualisiert: {new Date(record.updatedAt).toLocaleDateString('de-DE', { 
                                      day: '2-digit', 
                                      month: '2-digit'
                                    })}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <Pagination 
                      currentPage={personalaktePage}
                      totalItems={userData.personalakte.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setPersonalaktePage}
                    />
                  </div>
                </>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <Award className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-white/20" />
                    <h3 className="text-base sm:text-lg font-bold text-white mb-2">Keine Einträge</h3>
                    <p className="text-sm text-white/40 max-w-md mx-auto">
                      Hier werden deine Personalakten-Einträge vom Discord Bot angezeigt.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Shop Tab */}
        {activeTab === 'shop' && (
          <div data-tour-card="Hamburg Horizon RP Shop|Exklusive Items, Premium-Pakete und Sonderangebote. Mit deinen Rewards & Bonuspunkten kannst du dir hier besondere Vorteile sichern." className="glass rounded-2xl p-4 sm:p-6 border border-white/[0.08]">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingCart className="w-6 h-6 text-white/60" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Hamburg Horizon RP Shop</h2>
            </div>
            <ShopView 
              user={user} 
              userData={userData} 
              onRefresh={loadData}
              jumpToCategory={shopJumpToCategory}
              onJumpHandled={() => setShopJumpToCategory(null)}
            />
          </div>
        )}

        {/* Battle Pass Tab */}
        {activeTab === 'battle-pass' && (
          <div data-tour-card="HHRP Battle Pass|Schalte täglich neue Belohnungen frei! Premium für doppelte Rewards. Credits, Geld, Items und mehr warten auf dich.">
            <BattlePassBlockedCard />
          </div>
        )}

        {/* Charakter-Verwaltung Tab */}
        {activeTab === 'character' && (
          <div data-tour-card="Charakter-Verwaltung|Bearbeite oder lösche deinen Charakter. Alle Änderungen müssen von einem Admin genehmigt werden.">
            <CharacterManagementView 
              userData={userData} 
              onRefresh={loadData}
            />
          </div>
        )}

        {/* Hamburg Horizon Tab - Übersicht */}
        {activeTab === 'hamburg-horizon' && activeSubTab === 'overview' && (
          <div data-tour-card="Hamburg Horizon|Die komplette Server-Welt: Stadtkarte, Fraktionen, Events, Statistiken und aktuelle News aus Hamburg Horizon.">
          <HamburgHorizonTab currentUser={user} />
          </div>
        )}

        {/* Hamburg Horizon Tab - Lizenzen */}
        {activeTab === 'hamburg-horizon' && activeSubTab === 'licenses' && (
          <div data-tour-card="Meine Lizenzen|Verwalte alle deine aktiven Lizenzen: Auto-Verlängerung ein/ausschalten oder Lizenzen kündigen. Der Discord Bot übernimmt die Änderung in Sekunden.">
          <LicensesView userData={userData} refreshUserData={loadData} />
          </div>
        )}

        {/* Sparkonto Tab - NEU */}
        {activeTab === 'finance' && activeSubTab === 'savings' && (
          <div data-tour-card="Sparkonto|Dein Sparkonto mit Zinsen. Setze dir Sparziele, zahle ein oder hebe Geld ab. Je länger du sparst, desto mehr Zinsen gibt's.">
          <SparkontoManagementView 
            userData={userData}
            savingsGoal={savingsGoal}
            setSavingsGoal={setSavingsGoal}
          />
          </div>
        )}

        {/* Kredite Tab - NEU */}
        {activeTab === 'finance' && activeSubTab === 'kredite' && (
          <div data-tour-card="Kredite|Deine laufenden Kredite mit Laufzeit, Zinssatz und Rückzahlungsplan. Hier kannst du auch Sondertilgungen machen.">
          <KrediteDetailView userData={userData} onRefresh={loadData} />
          </div>
        )}

        {/* Steuer-Records Tab */}
        {/* Steuer-Records Tab */}
        {activeTab === 'finance' && activeSubTab === 'tax' && (
          <div className="space-y-6">
            {/* Steuer-Übersicht Card */}
            {userData?.taxSummary && userData.taxSummary.gesamtGezahlt > 0 && (
              <div data-tour-card="Steuer-Übersicht|Wie viel Steuern du bereits gezahlt hast und wie viel du per Steuererklärung zurückbekommen kannst (bis zu 45%)." className="glass rounded-2xl p-6 border border-white/[0.08]">
                <div className="flex items-center gap-3 mb-6">
                  <Receipt className="w-6 h-6 text-white/60" />
                  <h2 className="text-xl font-bold text-white">Steuer-Übersicht</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Gesamt gezahlt */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20">
                    <p className="text-sm text-white/60 mb-1">Gesamt gezahlt</p>
                    <p className="text-2xl font-bold text-red-400">
                      {userData.taxSummary.gesamtGezahlt.toLocaleString('de-DE')} €
                    </p>
                  </div>
                  
                  {/* Mögliche Rückerstattung (45% von gesamt) */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <p className="text-sm text-white/60 mb-1">Mögliche Rückerstattung</p>
                    <p className="text-2xl font-bold text-green-400">
                      {Math.floor(userData.taxSummary.gesamtGezahlt * 0.45).toLocaleString('de-DE')} €
                    </p>
                    <p className="text-xs text-green-400/60 mt-1">45% zurück</p>
                    {Math.floor(userData.taxSummary.gesamtGezahlt * 0.45) < 50000 && (
                      <p className="text-xs text-orange-400 mt-1">⚠️ Mind. 50.000€ nötig</p>
                    )}
                  </div>
                  
                  {/* Letzte Erklärung */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                    <p className="text-sm text-white/60 mb-1">Letzte Erklärung</p>
                    {userData.taxSummary.letzteErklaerung ? (
                      <p className="text-lg font-bold text-white">
                        {new Date(userData.taxSummary.letzteErklaerung).toLocaleDateString('de-DE')}
                      </p>
                    ) : (
                      <p className="text-lg font-bold text-blue-400">Noch keine</p>
                    )}
                  </div>
                </div>
                
                {/* Info-Box */}
                <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white mb-1">Steuererklärung einreichen</p>
                      <p className="text-xs text-white/60 leading-relaxed mb-2">
                        Reiche deine Steuererklärung beim Bot ein (<code className="px-1 py-0.5 rounded bg-white/10">/steuererklaerung</code>) um 45% deiner gezahlten Steuern zurückzuerhalten!
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-300">
                          ✓ 45% Rückerstattung
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-300">
                          ⚠️ Mind. 50.000€ nötig
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300">
                          ⏱️ 1x pro Monat
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Steuer-Records Liste */}
            <div data-tour-card="Steuereinträge|Jeder einzelne Steuer-Eintrag: Wann du Steuer gezahlt hast, wofür (Collect, Bank, Shop) und wie viel." className="glass rounded-2xl p-4 sm:p-6 border border-white/[0.08]">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-white/60" />
                <h2 className="text-lg sm:text-xl font-bold text-white">Alle Steuereinträge</h2>
                {userData?.taxRecords?.length > 0 && (
                  <span className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold">
                    {userData.taxRecords.length}
                  </span>
                )}
              </div>
            {userData?.taxRecords && userData.taxRecords.length > 0 ? (
              <>
                <div className="space-y-3">
                  {userData.taxRecords
                    .slice((taxPage - 1) * itemsPerPage, taxPage * itemsPerPage)
                    .map((record, index) => {
                      // Type-Mapping für Icons und Farben
                      const typeConfig = {
                        collect_steuer: {
                          icon: TrendingUp,
                          color: 'orange',
                          label: 'Steuer auf /collect'
                        },
                        bank_gebuehr: {
                          icon: CreditCard,
                          color: 'blue',
                          label: 'Bankgebühr'
                        },
                        shop_gebuehr: {
                          icon: ShoppingCart,
                          color: 'purple',
                          label: 'Shop-Gebühr'
                        }
                      };
                      
                      const config = typeConfig[record.type] || {
                        icon: Receipt,
                        color: 'gray',
                        label: record.type || 'Gebühr'
                      };
                      
                      const IconComponent = config.icon;
                      
                      return (
                        <div key={index} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-${config.color}-500/20`}>
                                <IconComponent className={`w-5 h-5 text-${config.color}-400`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-white mb-1">
                                  {record.description || config.label}
                                </h3>
                                <p className="text-xs text-white/50">
                                  {config.label}
                                </p>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-red-400 ml-2 shrink-0">
                              -{record.amount?.toLocaleString('de-DE')} €
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/50 mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(record.timestamp || record.date).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <Pagination 
                  currentPage={taxPage}
                  totalItems={userData.taxRecords.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setTaxPage}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-lg font-bold text-white mb-2">Keine Steuer-Records</h3>
                <p className="text-sm text-white/40">Du hast noch keine Steueraufzeichnungen.</p>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Bewerbungen Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            {!botStatus.isOnline ? null : loading ? (
              <SkeletonCard />
            ) : bewerbungen.length > 0 ? (
              <div data-tour-card="Meine Bewerbungen|Alle deine eingereichten Bewerbungen (Polizei, Feuerwehr, Rettungsdienst, Staat) mit Status, Typ (Normal/Praktikum/Uprank) und Bearbeiter." className="glass rounded-2xl p-6 border border-white/[0.08]">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-white/60" />
                  <h2 className="text-xl font-bold text-white">Meine Bewerbungen</h2>
                  <span className="px-2 py-1 rounded-full bg-white/10 text-white/50 text-xs">
                    {bewerbungen.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {bewerbungen.map((bew) => (
                    <div 
                      key={bew.id}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{bew.typ === 'normal' ? 'Team-Bewerbung' : bew.typ === 'praktikum' ? 'Praktikum' : 'Uprank'}</h3>
                          <p className="text-xs text-white/40">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(bew.eingereichtAm).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[bew.status] || 'bg-white/10 text-white/50 border-white/20'}`}>
                          {bew.status}
                        </span>
                      </div>
                      {bew.bearbeitetVon && (
                        <p className="text-xs text-white/30">
                          Bearbeitet von: {bew.bearbeitetVon}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div data-tour-card="Keine Bewerbungen|Noch keine Bewerbung eingereicht? Klicke auf Jetzt bewerben und starte bei Polizei, Feuerwehr, Rettungsdienst oder Staat." className="glass rounded-2xl p-12 text-center border border-white/[0.08]">
                <FileText className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-xl font-bold text-white mb-2">Keine Bewerbungen</h3>
                <p className="text-white/40 max-w-md mx-auto mb-4">
                  Du hast noch keine Bewerbungen eingereicht.
                </p>
                <Button
                  onClick={() => router.push('/bewerbung')}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Jetzt bewerben
                </Button>
              </div>
            )}
          </div>
        )}

        {/* EINSTELLUNGEN TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 tab-content">

            {/* ═══════════════════════════════════════════════════════════
                SETTINGS HEADER - Sidebar-Nav + Suche
                ═══════════════════════════════════════════════════════════ */}
            <div className="glass rounded-2xl p-4 border border-white/[0.08] mb-6">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                {/* Suche */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Einstellung suchen..."
                    value={settingsSearch}
                    onChange={(e) => setSettingsSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/25"
                  />
                </div>
                {/* Sektion-Tabs */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide snap-x">
                  {[
                    { id: 'appearance',  label: 'Darstellung', icon: Palette,    color: 'cyan' },
                    { id: 'effects',     label: 'Effekte',     icon: Wand2,      color: 'purple' },
                    { id: 'background',  label: 'Hintergrund', icon: ImagePlus,  color: 'indigo' },
                    ...(isPWA ? [{ id: 'pwa', label: 'PWA', icon: AppWindow, color: 'blue' }] : []),
                    { id: 'about',       label: 'Über',        icon: Globe,      color: 'gray' },
                  ].map(s => {
                    const Icon = s.icon;
                    const isActive = settingsSection === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSettingsSection(s.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap snap-center flex-shrink-0 transition-all ${isActive ? 'bg-white/15 text-white shadow-md' : 'bg-white/[0.02] text-white/50 hover:bg-white/[0.06] hover:text-white/80'}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filter helper */}
            {(() => { 
              // Globale Filter-Hilfe: wenn Suche aktiv, zeige nur Sektionen mit Match
              return null; 
            })()}

            {/* === DARSTELLUNG (Grundlagen) === */}
            {(settingsSection === 'appearance' || settingsSearch) && (
            <div data-tour-card="Darstellung|Personalisiere das Aussehen: Kompaktmodus, Textgröße, Benachrichtigungs-Stil und weitere visuelle Optionen." className="glass rounded-2xl p-6 border border-white/[0.08]">
              <div className="flex items-center gap-3 mb-6">
                <Monitor className="w-6 h-6 text-cyan-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">Darstellung</h2>
                  <p className="text-xs text-white/35">Passe das Aussehen der Seite an</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Kompaktmodus */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${kompaktModus ? 'bg-cyan-500/15' : 'bg-white/[0.06]'} flex items-center justify-center`}>
                      <LayoutDashboard className={`w-5 h-5 ${kompaktModus ? 'text-cyan-400' : 'text-white/30'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">Kompaktmodus</p>
                      <p className="text-xs text-white/40">Weniger Abstände und kleinere Elemente</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newVal = !kompaktModus;
                      setKompaktModus(newVal);
                      localStorage.setItem('hhrp-kompakt', newVal.toString());
                      window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { kompakt: newVal } }));
                      toast.success(newVal ? 'Kompaktmodus aktiviert' : 'Kompaktmodus deaktiviert');
                    }}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${kompaktModus ? 'bg-cyan-500' : 'bg-white/10'} cursor-pointer`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${kompaktModus ? 'left-7' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Animationen */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${animationen ? 'bg-purple-500/15' : 'bg-white/[0.06]'} flex items-center justify-center`}>
                      <Sparkles className={`w-5 h-5 ${animationen ? 'text-purple-400' : 'text-white/30'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">Animationen</p>
                      <p className="text-xs text-white/40">Übergänge und Hover-Effekte</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newVal = !animationen;
                      setAnimationen(newVal);
                      localStorage.setItem('hhrp-animationen', newVal.toString());
                      window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { animationen: newVal } }));
                      toast.success(newVal ? 'Animationen aktiviert' : 'Animationen deaktiviert');
                    }}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${animationen ? 'bg-purple-500' : 'bg-white/10'} cursor-pointer`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${animationen ? 'left-7' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Datensparmodus */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${datensparmodus ? 'bg-green-500/15' : 'bg-white/[0.06]'} flex items-center justify-center`}>
                      <Zap className={`w-5 h-5 ${datensparmodus ? 'text-green-400' : 'text-white/30'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">Datensparmodus</p>
                      <p className="text-xs text-white/40">Reduziert Animationen & Hintergrundbilder</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newVal = !datensparmodus;
                      setDatensparmodus(newVal);
                      localStorage.setItem('hhrp-datensparmodus', newVal.toString());
                      window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { datensparmodus: newVal } }));
                      toast.success(newVal ? 'Datensparmodus aktiviert' : 'Datensparmodus deaktiviert');
                    }}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${datensparmodus ? 'bg-green-500' : 'bg-white/10'} cursor-pointer`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${datensparmodus ? 'left-7' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Text-Größe */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-white/40" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">Text-Größe</p>
                      <p className="text-xs text-white/40">Passe die Schriftgröße an</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {[
                      { id: 'klein', label: 'Klein', icon: <ZoomOut className="w-5 h-5" /> },
                      { id: 'normal', label: 'Normal', icon: <FileText className="w-5 h-5" /> },
                      { id: 'gross', label: 'Groß', icon: <ZoomIn className="w-5 h-5" /> }
                    ].map((size) => (
                      <button
                        key={size.id}
                        onClick={() => {
                          setTextGroesse(size.id);
                          localStorage.setItem('hhrp-textgroesse', size.id);
                          window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { textgroesse: size.id } }));
                          toast.success(`Text-Größe: ${size.label}`);
                        }}
                        className={`flex-1 p-3 rounded-lg border transition-all ${textGroesse === size.id ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.05]'}`}
                      >
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2" style={{ color: textGroesse === size.id ? '#3b82f6' : 'rgba(255,255,255,0.4)' }}>
                            {size.icon}
                          </div>
                          <p className="text-xs font-medium">{size.label}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Benachrichtigungsstil */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white/40" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">Benachrichtigungsstil</p>
                      <p className="text-xs text-white/40">Wähle das Design für Toast-Nachrichten</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {[
                      { id: 'normal', label: 'Normal', icon: <Bell className="w-5 h-5" />, desc: 'Standard-Design' },
                      { id: 'glass', label: 'Glasmorphism', icon: <Sparkles className="w-5 h-5" />, desc: 'Moderner Glas-Effekt' }
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setNotificationStyle(style.id);
                          localStorage.setItem('hhrp-notification-style', style.id);
                          window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { notificationStyle: style.id } }));
                          toast.success(`Benachrichtigungsstil: ${style.label}`);
                        }}
                        className={`flex-1 p-4 rounded-lg border transition-all ${notificationStyle === style.id ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.05]'}`}
                      >
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2" style={{ color: notificationStyle === style.id ? '#3b82f6' : 'rgba(255,255,255,0.4)' }}>
                            {style.icon}
                          </div>
                          <p className="text-sm font-medium mb-1">{style.label}</p>
                          <p className="text-[10px] text-white/30">{style.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            )}
            {/* ENDE Darstellung */}

            {/* ═══════════════════════════════════════════════════════════
                EFFEKTE – Visuelle Feinheiten (NEU)
                ═══════════════════════════════════════════════════════════ */}
            {(settingsSection === 'effects' || settingsSearch) && (() => {
              // Wiederverwendbarer Toggle
              const Toggle = ({ on, color = 'purple', icon: Icon, title, desc, onToggle, search }) => {
                if (search && !(`${title} ${desc}`.toLowerCase().includes(search.toLowerCase()))) return null;
                return (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${on ? `bg-${color}-500/15` : 'bg-white/[0.06]'} flex items-center justify-center transition-all`}>
                        <Icon className={`w-5 h-5 ${on ? `text-${color}-400` : 'text-white/30'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{title}</p>
                        <p className="text-xs text-white/40">{desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={onToggle}
                      className={`relative w-14 h-7 rounded-full transition-all duration-300 ${on ? `bg-${color}-500` : 'bg-white/10'} cursor-pointer`}
                    >
                      <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${on ? 'left-7' : 'left-0.5'}`} />
                    </button>
                  </div>
                );
              };
              const fx = (key, val, stateSetter) => () => {
                stateSetter(val);
                localStorage.setItem(key, val.toString());
                window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { [key.replace('hhrp-fx-', 'fx').replace(/-([a-z])/g, (m, c) => c.toUpperCase()).replace('fx', 'fx')]: val } }));
              };
              return (
                <div className="glass rounded-2xl p-6 border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Wand2 className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Visuelle Effekte</h2>
                        <p className="text-xs text-white/35">Micro-Animationen, Glow & Card-Effekte</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // Reset nur Effekte auf Defaults
                        const defaults = {
                          'hhrp-fx-shimmer': 'true', 'hhrp-fx-hover-glow': 'true',
                          'hhrp-fx-anim-numbers': 'true', 'hhrp-fx-grad-borders': 'true',
                          'hhrp-fx-glass-strength': 'medium', 'hhrp-fx-card-shine': 'true',
                          'hhrp-fx-parallax': 'false', 'hhrp-fx-bot-pulse': 'true',
                          'hhrp-fx-ripple': 'false', 'hhrp-fx-tab-slide': 'true',
                          'hhrp-fx-progress-smooth': 'true', 'hhrp-fx-success-anim': 'true',
                          'hhrp-fx-top-loader': 'true'
                        };
                        Object.entries(defaults).forEach(([k, v]) => localStorage.setItem(k, v));
                        setFxShimmer(true); setFxHoverGlow(true); setFxAnimNumbers(true);
                        setFxGradBorders(true); setFxGlassStrength('medium'); setFxCardShine(true);
                        setFxParallax(false); setFxBotPulse(true); setFxRipple(false);
                        setFxTabSlide(true); setFxProgressSmooth(true); setFxSuccessAnim(true);
                        setFxTopLoader(true);
                        window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: {
                          fxShimmer: true, fxHoverGlow: true, fxAnimNumbers: true, fxGradBorders: true,
                          fxGlassStrength: 'medium', fxCardShine: true, fxParallax: false, fxBotPulse: true,
                          fxRipple: false, fxTabSlide: true, fxProgressSmooth: true, fxSuccessAnim: true,
                          fxTopLoader: true
                        }}));
                        toast.success('Effekte zurückgesetzt');
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/10 transition-all"
                    >
                      Standard
                    </button>
                  </div>

                  {/* Kategorie: Animationen */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-purple-500/30 to-transparent" />
                      <span className="text-[10px] font-bold text-purple-400/70 uppercase tracking-widest">Animationen</span>
                      <div className="h-px flex-1 bg-gradient-to-l from-purple-500/30 to-transparent" />
                    </div>
                    <div className="space-y-2.5">
                      <Toggle on={fxShimmer} color="purple" icon={Sparkles} title="Shimmer-Skeletons" desc="Schimmernder Effekt auf Ladeplatzhaltern" search={settingsSearch}
                        onToggle={() => { const v = !fxShimmer; setFxShimmer(v); localStorage.setItem('hhrp-fx-shimmer', v); window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { fxShimmer: v }})); toast.success(v ? 'Shimmer aktiviert' : 'Shimmer deaktiviert'); }} />
                      <Toggle on={fxAnimNumbers} color="blue" icon={Activity} title="Animierte Zahlen" desc="Counter-Up-Effekt bei Beträgen & Statistiken" search={settingsSearch}
                        onToggle={() => { const v = !fxAnimNumbers; setFxAnimNumbers(v); localStorage.setItem('hhrp-fx-anim-numbers', v); window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { fxAnimNumbers: v }})); toast.success(v ? 'Animierte Zahlen an' : 'Animierte Zahlen aus'); }} />
                      <Toggle on={fxTabSlide} color="cyan" icon={ArrowLeftRight} title="Tab-Slide" desc="Sanfter Slide-In bei Tab-Wechseln" search={settingsSearch}
                        onToggle={() => { const v = !fxTabSlide; setFxTabSlide(v); localStorage.setItem('hhrp-fx-tab-slide', v); window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { fxTabSlide: v }})); toast.success(v ? 'Tab-Slide aktiviert' : 'Tab-Slide deaktiviert'); }} />
                      <Toggle on={fxProgressSmooth} color="green" icon={Gauge} title="Smooth Progress-Bars" desc="Fortschrittsbalken füllen sich sanft" search={settingsSearch}
                        onToggle={() => { const v = !fxProgressSmooth; setFxProgressSmooth(v); localStorage.setItem('hhrp-fx-progress-smooth', v); window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { fxProgressSmooth: v }})); toast.success(v ? 'Smooth Progress an' : 'Smooth Progress aus'); }} />
                      <Toggle on={fxSuccessAnim} color="emerald" icon={CheckCircle} title="Erfolgs-Animation" desc="Checkmark-Bounce nach erfolgreichen Aktionen" search={settingsSearch}
                        onToggle={() => { const v = !fxSuccessAnim; setFxSuccessAnim(v); localStorage.setItem('hhrp-fx-success-anim', v); window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { fxSuccessAnim: v }})); toast.success(v ? 'Success-Anim aktiviert' : 'Success-Anim deaktiviert'); }} />
                    </div>
                  </div>

                  {/* Kategorie: Card & Glow */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-pink-500/30 to-transparent" />
                      <span className="text-[10px] font-bold text-pink-400/70 uppercase tracking-widest">Cards & Glow</span>
                      <div className="h-px flex-1 bg-gradient-to-l from-pink-500/30 to-transparent" />
                    </div>
                    <div className="space-y-2.5">
                      <Toggle on={fxHoverGlow} color="pink" icon={Sparkles} title="Hover-Glow" desc="Cards leuchten dezent beim Überfahren" search={settingsSearch}
                        onToggle={() => { const v = !fxHoverGlow; setFxHoverGlow(v); localStorage.setItem('hhrp-fx-hover-glow', v); window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { fxHoverGlow: v }})); toast.success(v ? 'Hover-Glow an' : 'Hover-Glow aus'); }} />
                      <Toggle on={fxCardShine} color="yellow" icon={Zap} title="Card-Shine" desc="Glanz-Effekt beim Hover über Cards" search={settingsSearch}
                        onToggle={() => { const v = !fxCardShine; setFxCardShine(v); localStorage.setItem('hhrp-fx-card-shine', v); window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { fxCardShine: v }})); toast.success(v ? 'Card-Shine an' : 'Card-Shine aus'); }} />
                      <Toggle on={fxGradBorders} color="orange" icon={Crown} title="Premium-Gradient-Borders" desc="Animierter Rainbow-Border auf Premium-Items" search={settingsSearch}
                        onToggle={() => { const v = !fxGradBorders; setFxGradBorders(v); localStorage.setItem('hhrp-fx-grad-borders', v); window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { fxGradBorders: v }})); toast.success(v ? 'Gradient-Borders an' : 'Gradient-Borders aus'); }} />

                      {/* Glassmorphism Stärke */}
                      {(!settingsSearch || 'glass glassmorphism stärke'.toLowerCase().includes(settingsSearch.toLowerCase())) && (
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">Glassmorphism-Stärke</p>
                            <p className="text-xs text-white/40">Intensität des Glas-Effekts</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'low',    label: 'Leicht', desc: 'Minimal' },
                            { id: 'medium', label: 'Mittel', desc: 'Standard' },
                            { id: 'high',   label: 'Stark',  desc: 'Maximum' },
                          ].map(g => (
                            <button
                              key={g.id}
                              onClick={() => {
                                setFxGlassStrength(g.id);
                                localStorage.setItem('hhrp-fx-glass-strength', g.id);
                                window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { fxGlassStrength: g.id }}));
                                toast.success(`Glas: ${g.label}`);
                              }}
                              className={`p-2.5 rounded-lg border transition-all ${fxGlassStrength === g.id ? 'border-indigo-500/50 bg-indigo-500/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.05]'}`}
                            >
                              <p className="text-xs font-medium">{g.label}</p>
                              <p className="text-[10px] text-white/30 mt-0.5">{g.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      )}
                    </div>
                  </div>

                  {/* Kategorie: Interaktion */}
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent" />
                      <span className="text-[10px] font-bold text-blue-400/70 uppercase tracking-widest">Interaktion & Status</span>
                      <div className="h-px flex-1 bg-gradient-to-l from-blue-500/30 to-transparent" />
                    </div>
                    <div className="space-y-2.5">
                      <Toggle on={fxRipple} color="blue" icon={MousePointer2} title="Ripple-Effekt" desc="Wellen-Effekt beim Klicken auf Buttons" search={settingsSearch}
                        onToggle={() => { const v = !fxRipple; setFxRipple(v); localStorage.setItem('hhrp-fx-ripple', v); window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { fxRipple: v }})); toast.success(v ? 'Ripple aktiviert' : 'Ripple deaktiviert'); }} />
                      <Toggle on={fxBotPulse} color="green" icon={Activity} title="Bot-Status Pulse" desc="Grüner Status-Dot pulsiert, wenn Bot online" search={settingsSearch}
                        onToggle={() => { const v = !fxBotPulse; setFxBotPulse(v); localStorage.setItem('hhrp-fx-bot-pulse', v); window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { fxBotPulse: v }})); toast.success(v ? 'Bot-Pulse an' : 'Bot-Pulse aus'); }} />
                      <Toggle on={fxParallax} color="violet" icon={Eye} title="Parallax-Effekt" desc="Subtile Tiefenwirkung beim Scrollen (experimentell)" search={settingsSearch}
                        onToggle={() => { const v = !fxParallax; setFxParallax(v); localStorage.setItem('hhrp-fx-parallax', v); window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { fxParallax: v }})); toast.success(v ? 'Parallax aktiviert' : 'Parallax deaktiviert'); }} />
                      <Toggle on={fxTopLoader} color="cyan" icon={TrendingUp} title="Top-Progress-Loader" desc="Farbiger Balken oben bei Seitenwechseln" search={settingsSearch}
                        onToggle={() => { const v = !fxTopLoader; setFxTopLoader(v); localStorage.setItem('hhrp-fx-top-loader', v); window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { fxTopLoader: v }})); toast.success(v ? 'Top-Loader an' : 'Top-Loader aus'); }} />
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <p className="text-xs text-blue-300/70 leading-relaxed flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Tipp: Aktiviere <b>Datensparmodus</b> oder deaktiviere <b>Animationen</b> (Darstellung), um alle Effekte auf einmal auszuschalten.</span>
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* === HINTERGRUNDBILD === */}
            {(settingsSection === 'background' || settingsSearch) && (() => {
              const licenses = (userData?.licenses || [])
                .filter(l => l)
                      .map(l => typeof l === 'string' ? l : (l.name || l.id))
                      .filter(l => l && typeof l === 'string')
                .filter(l => l && !l.startsWith('credits_') && !l.startsWith('credit_'));
              const hasVipForCustomBg = licenses.includes('vip_platinum') || licenses.includes('vip_ultimate') || licenses.includes('vip_elite_plus') || licenses.includes('luxus_pass');
              const isStandardBgActive = customBg === 'standard';
              const isPresetBg = customBg && customBg.startsWith('preset:');
              const isCustomBgActive = customBg && customBg !== 'standard' && !isPresetBg;

              const presetBackgrounds = [
                { id: 'preset:city-1', src: '/bg-city-1.webp', name: 'City Skyline' },
                { id: 'preset:city-2', src: '/bg-city-2.webp', name: 'Aerial Night' },
                { id: 'preset:city-3', src: '/bg-city-3.webp', name: 'Dark Metropole' },
                { id: 'preset:neon-1', src: '/bg-neon-1.webp', name: 'Neon Streets' },
                { id: 'preset:neon-2', src: '/bg-neon-2.webp', name: 'Green Neon' }
              ];

              // Auto-Entfernung: Wenn kein VIP Platinum+ aber custom/preset BG vorhanden
              if (!hasVipForCustomBg && (isCustomBgActive || isPresetBg)) {
                setTimeout(() => {
                  localStorage.removeItem('hhrp-custom-bg');
                  setCustomBg(null);
                  window.dispatchEvent(new CustomEvent('hhrp-bg-change', { detail: { bg: null } }));
                  toast.info('Hintergrundbild entfernt', { description: 'Du benötigst VIP Platinum oder höher.' });
                }, 100);
              }

              return (
                <div data-tour-card="Hintergrundbild|Wähle aus verschiedenen Hintergründen oder lade dein eigenes hoch. Premium-Nutzer haben Zugriff auf exklusive Designs." className="glass rounded-2xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-5">
                    <ImagePlus className="w-6 h-6 text-purple-400" />
                    <div>
                      <h2 className="text-xl font-bold text-white">Hintergrundbild</h2>
                      <p className="text-xs text-white/35">Wähle dein Hintergrundbild für die Seite</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Standard Hintergrundbild - für ALLE Nutzer */}
                    <div>
                      <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Für alle Nutzer</p>
                      <div 
                        onClick={() => {
                          if (isStandardBgActive) {
                            localStorage.removeItem('hhrp-custom-bg');
                            setCustomBg(null);
                            window.dispatchEvent(new CustomEvent('hhrp-bg-change', { detail: { bg: null } }));
                            toast.success('Hintergrundbild deaktiviert');
                          } else {
                            localStorage.setItem('hhrp-custom-bg', 'standard');
                            setCustomBg('standard');
                            window.dispatchEvent(new CustomEvent('hhrp-bg-change', { detail: { bg: 'standard' } }));
                            toast.success('Standard-Hintergrund aktiviert!');
                          }
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${isStandardBgActive ? 'border-green-500/30 bg-green-500/5 ring-1 ring-green-500/20' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-14 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                            <img src="/hhrp-standard-bg.webp" alt="Standard" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white text-sm">Hamburg Horizon RP</h3>
                              {isStandardBgActive && <BadgeCheck className="w-4 h-4 text-green-400" />}
                            </div>
                            <p className="text-xs text-white/40">Standard Hintergrundbild</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* VIP Platinum+ Hintergrundbilder */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-xs font-medium text-white/50 uppercase tracking-wider">VIP Platinum+ Exklusiv</p>
                        {!hasVipForCustomBg && (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
                            Gesperrt
                          </span>
                        )}
                      </div>

                      {hasVipForCustomBg ? (
                        <div className="space-y-4">
                          {/* Vorinstallierte Bilder Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {presetBackgrounds.map((bg) => (
                              <div
                                key={bg.id}
                                onClick={() => {
                                  if (customBg === bg.id) {
                                    localStorage.removeItem('hhrp-custom-bg');
                                    setCustomBg(null);
                                    window.dispatchEvent(new CustomEvent('hhrp-bg-change', { detail: { bg: null } }));
                                    toast.success('Hintergrundbild deaktiviert');
                                  } else {
                                    localStorage.setItem('hhrp-custom-bg', bg.id);
                                    setCustomBg(bg.id);
                                    window.dispatchEvent(new CustomEvent('hhrp-bg-change', { detail: { bg: bg.id } }));
                                    toast.success(`${bg.name} aktiviert!`);
                                  }
                                }}
                                className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-[4/3] ${customBg === bg.id ? 'border-purple-500 ring-2 ring-purple-500/30 scale-[1.02]' : 'border-white/10 hover:border-white/25 hover:scale-[1.02]'}`}
                              >
                                <img src={bg.src} alt={bg.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <p className="absolute bottom-1.5 left-2 text-[10px] text-white/70 font-medium">{bg.name}</p>
                                {customBg === bg.id && (
                                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Eigenes Bild Upload */}
                          <div className={`p-4 rounded-xl border ${isCustomBgActive ? 'border-purple-500/30 bg-purple-500/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                            <div className="flex items-center gap-3 mb-3">
                              <Upload className="w-5 h-5 text-purple-400" />
                              <div>
                                <h3 className="font-semibold text-white text-sm">Eigenes Logo / GIF hochladen</h3>
                                <p className="text-xs text-white/40">PNG, JPG, WebP, GIF (max. 10 MB)</p>
                              </div>
                              {isCustomBgActive && <BadgeCheck className="w-4 h-4 text-purple-400 ml-auto" />}
                            </div>

                            {isCustomBgActive && (
                              <div className="relative rounded-lg overflow-hidden border border-white/[0.08] mb-3">
                                <img src={customBg} alt="Eigenes Bild" className="w-full h-28 object-cover" />
                                <button
                                  onClick={() => {
                                    localStorage.removeItem('hhrp-custom-bg');
                                    setCustomBg(null);
                                    window.dispatchEvent(new CustomEvent('hhrp-bg-change', { detail: { bg: null } }));
                                    toast.success('Eigenes Hintergrundbild entfernt');
                                  }}
                                  className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-red-500/80 hover:bg-red-500 text-white text-[10px] rounded-md transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Entfernen
                                </button>
                              </div>
                            )}

                            <label className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-purple-500/30 hover:border-purple-500/50 bg-purple-500/5 cursor-pointer transition-all">
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (file.size > 10 * 1024 * 1024) {
                                    toast.error('Datei zu groß', { description: 'Maximale Größe: 10 MB' });
                                    return;
                                  }
                                  if (!file.type.startsWith('image/')) {
                                    toast.error('Ungültiges Format', { description: 'Nur Bilder erlaubt.' });
                                    return;
                                  }
                                  setBgUploading(true);
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    try {
                                      localStorage.setItem('hhrp-custom-bg', event.target.result);
                                      setCustomBg(event.target.result);
                                      window.dispatchEvent(new CustomEvent('hhrp-bg-change', { detail: { bg: event.target.result } }));
                                      toast.success('Eigenes Hintergrundbild gespeichert!');
                                    } catch (err) {
                                      toast.error('Speicherfehler', { description: 'Bild zu groß. Versuche ein kleineres.' });
                                    }
                                    setBgUploading(false);
                                  };
                                  reader.onerror = () => { toast.error('Fehler'); setBgUploading(false); };
                                  reader.readAsDataURL(file);
                                  e.target.value = '';
                                }}
                              />
                              {bgUploading ? (
                                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 text-purple-400" />
                              )}
                              <span className="text-sm text-purple-400 font-medium">{isCustomBgActive ? 'Anderes Bild wählen' : 'Bild hochladen'}</span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Gesperrte Vorschau */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 opacity-40 pointer-events-none">
                            {presetBackgrounds.map((bg) => (
                              <div key={bg.id} className="relative rounded-xl overflow-hidden border border-white/10 aspect-[4/3]">
                                <img src={bg.src} alt={bg.name} className="w-full h-full object-cover blur-[2px]" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Lock className="w-4 h-4 text-white/40" />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-white/20 flex-shrink-0" />
                              <p className="text-xs text-white/35">
                                Du benötigst VIP Platinum, VIP Ultimate, VIP Elite Plus oder Luxus-Pass um zusätzliche Hintergrundbilder und eigene Uploads zu nutzen.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* === PWA EINSTELLUNGEN === */}
            {(settingsSection === 'pwa' || settingsSearch) && isPWA && (
              <div data-tour-card="PWA-Einstellungen|Optimierungen für die App-Nutzung: Schnellstart, Offline-Modus, Datenspar-Modus und Push-Benachrichtigungen." className="glass rounded-2xl p-6 border border-white/[0.08]">
                <div className="flex items-center gap-3 mb-5">
                  <AppWindow className="w-6 h-6 text-blue-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">PWA Einstellungen</h2>
                    <p className="text-xs text-white/35">Optimierungen für App-Nutzung</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Schnellstart */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${schnellstart ? 'bg-orange-500/15' : 'bg-white/[0.06]'} flex items-center justify-center`}>
                        <Rocket className={`w-5 h-5 ${schnellstart ? 'text-orange-400' : 'text-white/30'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">Schnellstart</p>
                        <p className="text-xs text-white/40">Reduziert Ladezeiten beim Start</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newVal = !schnellstart;
                        setSchnellstart(newVal);
                        localStorage.setItem('hhrp-schnellstart', newVal.toString());
                        window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { schnellstart: newVal } }));
                        toast.success(newVal ? 'Schnellstart aktiviert' : 'Schnellstart deaktiviert');
                      }}
                      className={`relative w-14 h-7 rounded-full transition-all duration-300 ${schnellstart ? 'bg-orange-500' : 'bg-white/10'} cursor-pointer`}
                    >
                      <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${schnellstart ? 'left-7' : 'left-0.5'}`} />
                    </button>
                  </div>

                  {/* Auto-Sync */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${autoSync ? 'bg-blue-500/15' : 'bg-white/[0.06]'} flex items-center justify-center`}>
                        <RefreshCw className={`w-5 h-5 ${autoSync ? 'text-blue-400' : 'text-white/30'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">Auto-Sync</p>
                        <p className="text-xs text-white/40">Daten automatisch im Hintergrund synchronisieren</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newVal = !autoSync;
                        setAutoSync(newVal);
                        localStorage.setItem('hhrp-autosync', newVal.toString());
                        window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { autosync: newVal } }));
                        toast.success(newVal ? 'Auto-Sync aktiviert' : 'Auto-Sync deaktiviert');
                      }}
                      className={`relative w-14 h-7 rounded-full transition-all duration-300 ${autoSync ? 'bg-blue-500' : 'bg-white/10'} cursor-pointer`}
                    >
                      <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${autoSync ? 'left-7' : 'left-0.5'}`} />
                    </button>
                  </div>

                  {/* Offline-Modus bevorzugen */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${offlineModus ? 'bg-indigo-500/15' : 'bg-white/[0.06]'} flex items-center justify-center`}>
                        <WifiOff className={`w-5 h-5 ${offlineModus ? 'text-indigo-400' : 'text-white/30'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">Offline-Modus bevorzugen</p>
                        <p className="text-xs text-white/40">Nutze gecachte Daten wenn möglich</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newVal = !offlineModus;
                        setOfflineModus(newVal);
                        localStorage.setItem('hhrp-offline', newVal.toString());
                        window.dispatchEvent(new CustomEvent('hhrp-settings-change', { detail: { offline: newVal } }));
                        toast.success(newVal ? 'Offline-Modus aktiviert' : 'Offline-Modus deaktiviert');
                      }}
                      className={`relative w-14 h-7 rounded-full transition-all duration-300 ${offlineModus ? 'bg-indigo-500' : 'bg-white/10'} cursor-pointer`}
                    >
                      <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${offlineModus ? 'left-7' : 'left-0.5'}`} />
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <p className="text-xs text-blue-300/60 leading-relaxed">
                      💡 Diese Einstellungen sind nur in der PWA-Version (App) verfügbar und helfen bei langsameren Verbindungen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* === ÜBER === */}
            {(settingsSection === 'about' || settingsSearch) && (
            <div data-tour-card="Über|Informationen zur App-Version, dem Modus (PWA/Browser) und Optionen zum Zurücksetzen deiner Einstellungen." className="glass rounded-2xl p-6 border border-white/[0.08]">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-white/40" />
                <h2 className="text-xl font-bold text-white">Über</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                  <span className="text-sm text-white/50">Version</span>
                  <span className="text-sm text-white/70 font-mono">2.0.0</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                  <span className="text-sm text-white/50">Modus</span>
                  <span className={`text-sm font-medium ${isPWA ? 'text-green-400' : 'text-white/70'}`}>{isPWA ? 'PWA (App)' : 'Browser'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                  <span className="text-sm text-white/50">Einstellungen zurücksetzen</span>
                  <button
                    onClick={() => {
                      localStorage.removeItem('hhrp-custom-bg');
                      localStorage.removeItem('hhrp-kompakt');
                      localStorage.removeItem('hhrp-notification-style');
                      localStorage.removeItem('hhrp-animationen');
                      localStorage.removeItem('hhrp-textgroesse');
                      localStorage.removeItem('hhrp-datensparmodus');
                      localStorage.removeItem('hhrp-schnellstart');
                      localStorage.removeItem('hhrp-autosync');
                      localStorage.removeItem('hhrp-offline');
                      // Effekte zurücksetzen
                      ['hhrp-fx-shimmer','hhrp-fx-hover-glow','hhrp-fx-anim-numbers','hhrp-fx-grad-borders',
                       'hhrp-fx-glass-strength','hhrp-fx-card-shine','hhrp-fx-parallax','hhrp-fx-bot-pulse',
                       'hhrp-fx-ripple','hhrp-fx-tab-slide','hhrp-fx-progress-smooth','hhrp-fx-success-anim',
                       'hhrp-fx-top-loader'].forEach(k => localStorage.removeItem(k));
                      setCustomBg(null);
                      setKompaktModus(false);
                      setNotificationStyle('normal');
                      setAnimationen(true);
                      setTextGroesse('normal');
                      setDatensparmodus(false);
                      setSchnellstart(false);
                      setAutoSync(true);
                      setOfflineModus(false);
                      setFxShimmer(true); setFxHoverGlow(true); setFxAnimNumbers(true);
                      setFxGradBorders(true); setFxGlassStrength('medium'); setFxCardShine(true);
                      setFxParallax(false); setFxBotPulse(true); setFxRipple(false);
                      setFxTabSlide(true); setFxProgressSmooth(true); setFxSuccessAnim(true);
                      setFxTopLoader(true);
                      window.dispatchEvent(new CustomEvent('hhrp-bg-change', { detail: { bg: null } }));
                      window.dispatchEvent(new CustomEvent('hhrp-settings-change', { 
                        detail: { 
                          kompakt: false, 
                          animationen: true, 
                          textgroesse: 'normal',
                          datensparmodus: false,
                          schnellstart: false,
                          autosync: true,
                          offline: false,
                          notificationStyle: 'normal',
                          fxShimmer: true, fxHoverGlow: true, fxAnimNumbers: true, fxGradBorders: true,
                          fxGlassStrength: 'medium', fxCardShine: true, fxParallax: false,
                          fxBotPulse: true, fxRipple: false, fxTabSlide: true, fxProgressSmooth: true,
                          fxSuccessAnim: true, fxTopLoader: true
                        } 
                      }));
                      toast.success('Alle Einstellungen zurückgesetzt');
                    }}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg border border-red-500/20 transition-all"
                  >
                    Zurücksetzen
                  </button>
                </div>
              </div>
            </div>
            )}
            {/* ENDE Über */}

          </div>
        )}
        </div>
        </>
        )}
      </div>

      {/* Profile Tour */}
      <ProfileTour
        run={tourRunning}
        onClose={() => setTourRunning(false)}
        setActiveTab={setActiveTab}
        setActiveSubTab={setActiveSubTab}
      />
    </div>
  );
}
