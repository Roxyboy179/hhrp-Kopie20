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
  TrendingUpIcon, BarChart2
} from 'lucide-react';
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

function SkeletonCard({ className = "" }) {
  return (
    <div className={`glass rounded-xl p-6 border border-white/[0.08] animate-pulse ${className}`}>
      <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-white/10 rounded w-2/3"></div>
    </div>
  );
}

function BotStatusCard({ status, onRetry }) {
  // Zeige immer nur die gelbe Error-Karte, keine blaue Loading-Karte
  if (!status.isOnline || status.error || status.checking) {
    // Error State - NUR GELBE KARTE
    return (
      <div className="glass rounded-2xl p-8 border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-yellow-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white">Verbindungsproblem</h3>
            <p className="text-white/70 max-w-lg">
              Wir haben derzeit Probleme, die Daten vom Discord Bot Server zu laden.
            </p>
            {status.error && (
              <div className="glass rounded-lg p-4 border border-white/10 bg-white/5">
                <p className="text-sm text-white/50">{status.error}</p>
              </div>
            )}
          </div>

          <div className="space-y-3 w-full max-w-md">
            {/* Automatischer Retry Hinweis */}
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-300">Automatische Prüfung läuft</p>
                <p className="text-xs text-blue-400/60">Versucht alle 15 Sekunden erneut zu verbinden...</p>
              </div>
            </div>
            
            <p className="text-xs text-white/40">
              💡 Die Seite wird automatisch aktualisiert, sobald der Bot wieder online ist.
            </p>
            
            {/* Manueller Retry Button (optional) */}
            <Button
              onClick={onRetry}
              variant="outline"
              className="w-full border-white/10 hover:bg-white/5"
            >
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              Jetzt manuell versuchen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function DriversLicenseCard({ character, avatarUrl, userId, licenses = [] }) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Prüfe welche Führerscheine vorhanden sind
  const hasPKW = licenses.some(l => l.includes('führerschein_pkw'));
  const hasMotorrad = licenses.some(l => l.includes('führerschein_motorrad') || l.includes('motorradschein'));
  const hasLKW = licenses.some(l => l.includes('führerschein_lkw') || l.includes('lkw'));
  
  const hasAnyLicense = hasPKW || hasMotorrad || hasLKW;
  
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
  const issueDate = new Date(2021, 5, 10);

  return (
    <div className="w-full perspective-1000">
      <div 
        className="relative w-full aspect-[1.586/1] cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className={`relative w-full h-full transition-transform duration-700 transform-style-3d`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* VORDERSEITE */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Wasserzeichen */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <span className="text-[160px] font-black tracking-wider rotate-[-20deg] select-none">
                {hasAnyLicense ? 'HHRP' : 'HHRP'}
              </span>
            </div>

            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-700/20 rounded-full translate-y-24 -translate-x-24"></div>

            <div className="relative h-full p-4 sm:p-6 flex flex-col text-white">
              {/* Header */}
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div>
                  <p className="text-[8px] sm:text-[10px] uppercase tracking-widest opacity-70 mb-1">Bundesrepublik HHRP</p>
                  <h2 className="text-sm sm:text-base font-bold">FÜHRERSCHEIN</h2>
                </div>
                <img src="/icon-192.png" alt="HHRP" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
              </div>

              {hasAnyLicense ? (
                <>
                  {/* Foto & Info */}
                  <div className="flex gap-3 sm:gap-4 flex-1">
                    <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gray-700 rounded overflow-hidden flex-shrink-0 border-2 border-gray-600">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                          <User className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-xs">
                      <div>
                        <p className="text-[10px] opacity-60 uppercase">Nachname</p>
                        <p className="font-semibold text-xs">{character?.nachname || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] opacity-60 uppercase">Vorname</p>
                        <p className="font-semibold text-xs">{character?.vorname || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] opacity-60 uppercase">Geburtsdatum</p>
                        <p className="font-semibold text-xs">{birthDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Führerschein-Klassen */}
                  <div className="pt-3 border-t border-white/20 mt-auto">
                    <p className="text-[10px] opacity-70 uppercase mb-2">Klassen</p>
                    <div className="flex gap-2 flex-wrap">
                      {hasPKW && (
                        <span className="px-2.5 py-1 bg-white/20 rounded text-[10px] font-bold">B (PKW)</span>
                      )}
                      {hasMotorrad && (
                        <span className="px-2.5 py-1 bg-white/20 rounded text-[10px] font-bold">A (Motorrad)</span>
                      )}
                      {hasLKW && (
                        <span className="px-2.5 py-1 bg-white/20 rounded text-[10px] font-bold">C (LKW)</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold mb-1">Kein Führerschein</p>
                  <p className="text-[10px] opacity-60">Nicht im Besitz</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/20 mt-auto">
                <div className="text-[10px] opacity-70">
                  {hasAnyLicense ? (
                    <><span className="font-semibold">Erstellt am:</span> {issueDate.toLocaleDateString('de-DE')}</>
                  ) : (
                    <span className="opacity-50">Keine Lizenz vorhanden</span>
                  )}
                </div>
                <div className="text-[10px] opacity-40">
                  Klicken zum Umdrehen
                </div>
              </div>
            </div>
          </div>

          {/* RÜCKSEITE */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl overflow-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <span className="text-[160px] font-black tracking-wider rotate-[20deg] select-none">
                HHRP
              </span>
            </div>

            <div className="relative h-full p-4 sm:p-6 flex flex-col justify-between text-white">
              {hasAnyLicense ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] opacity-60 uppercase mb-2">Führerschein-Nummer</p>
                      <p className="text-sm font-mono font-bold tracking-wider">{userId?.slice(0, 12) || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-[10px] opacity-60 uppercase mb-2">Ausgestellt am</p>
                      <p className="font-semibold text-xs">{issueDate.toLocaleDateString('de-DE')}</p>
                    </div>

                    <div>
                      <p className="text-[10px] opacity-60 uppercase mb-2">Ausstellende Behörde</p>
                      <p className="text-xs font-semibold">Hamburg Horizon RP</p>
                      <p className="text-[10px] opacity-50">Straßenverkehrsamt Hamburg</p>
                    </div>

                    <div className="pt-3 border-t border-white/20">
                      <p className="text-xs text-green-400 font-semibold flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Unbegrenzt gültig
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <p className="text-sm opacity-70 mb-2">Dieses Dokument ist nicht im Besitz</p>
                  <p className="text-xs opacity-50">Besuche den Discord Bot Shop</p>
                </div>
              )}

              <div className="pt-4 border-t border-white/20">
                <div className="flex items-center justify-between text-[10px] opacity-60 mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium">HHRP Führerschein</span>
                  </div>
                  <span className="opacity-40">Klicken zum Umdrehen</span>
                </div>
                <p className="text-[10px] opacity-40 leading-relaxed">
                  Dieser Führerschein ist Eigentum von Hamburg Horizon RP. Bei Verlust oder Diebstahl unverzüglich melden.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeaponsLicenseCard({ character, avatarUrl, userId, licenses = [] }) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Prüfe welche Waffenscheine vorhanden sind
  const hasWaffenschein = licenses.some(l => l.includes('waffenschein'));
  const hasJagdschein = licenses.some(l => l.includes('jagdschein'));
  
  const hasAnyLicense = hasWaffenschein || hasJagdschein;
  
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
  const issueDate = new Date(2021, 8, 15);
  const expiryDate = new Date(2025, 8, 15);

  return (
    <div className="w-full perspective-1000">
      <div 
        className="relative w-full aspect-[1.586/1] cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className={`relative w-full h-full transition-transform duration-700 transform-style-3d`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* VORDERSEITE */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Wasserzeichen */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <span className="text-[160px] font-black tracking-wider rotate-[-20deg] select-none">
                {hasAnyLicense ? 'WS' : 'HHRP'}
              </span>
            </div>

            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-700/20 rounded-full translate-y-24 -translate-x-24"></div>

            <div className="relative h-full p-4 sm:p-6 flex flex-col text-white">
              {/* Header */}
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div>
                  <p className="text-[8px] sm:text-[10px] uppercase tracking-widest opacity-70 mb-1">Bundesrepublik HHRP</p>
                  <h2 className="text-sm sm:text-base font-bold">WAFFENSCHEIN</h2>
                </div>
                <img src="/icon-192.png" alt="HHRP" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
              </div>

              {hasAnyLicense ? (
                <>
                  {/* Foto & Info */}
                  <div className="flex gap-3 sm:gap-4 flex-1">
                    <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gray-700 rounded overflow-hidden flex-shrink-0 border-2 border-gray-600">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                          <User className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-xs">
                      <div>
                        <p className="text-[10px] opacity-60 uppercase">Nachname</p>
                        <p className="font-semibold text-sm">{character?.nachname || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] opacity-60 uppercase">Vorname</p>
                        <p className="text-sm font-semibold">{character?.vorname || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] opacity-60 uppercase">Geburtsdatum</p>
                        <p className="text-sm font-semibold">{birthDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Waffenschein-Typen */}
                  <div className="pt-3 border-t border-white/20 mt-auto">
                    <p className="text-[10px] opacity-70 uppercase mb-2">Berechtigungen</p>
                    <div className="flex gap-2 flex-wrap">
                      {hasWaffenschein && (
                        <span className="px-2.5 py-1 bg-white/20 rounded text-[10px] font-bold">Waffenschein</span>
                      )}
                      {hasJagdschein && (
                        <span className="px-2.5 py-1 bg-white/20 rounded text-[10px] font-bold">Jagdschein</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold mb-1">Kein Waffenschein</p>
                  <p className="text-xs opacity-60">Nicht im Besitz</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/20 mt-auto">
                <div className="text-[10px] opacity-70">
                  {hasAnyLicense ? (
                    <><span className="font-semibold">Erstellt am:</span> {issueDate.toLocaleDateString('de-DE')}</>
                  ) : (
                    <span className="opacity-50">Keine Lizenz vorhanden</span>
                  )}
                </div>
                <div className="text-[10px] opacity-40">
                  Klicken zum Umdrehen
                </div>
              </div>
            </div>
          </div>

          {/* RÜCKSEITE */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl overflow-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <span className="text-[160px] font-black tracking-wider rotate-[20deg] select-none">
                WS
              </span>
            </div>

            <div className="relative h-full p-4 sm:p-6 flex flex-col justify-between text-white">
              {hasAnyLicense ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] opacity-60 uppercase mb-2">Waffenschein-Nummer</p>
                      <p className="text-sm font-mono font-bold tracking-wider">WS-{userId?.slice(0, 10) || 'N/A'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] opacity-60 uppercase mb-2">Ausgestellt am</p>
                        <p className="font-semibold text-xs">{issueDate.toLocaleDateString('de-DE')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] opacity-60 uppercase mb-2">Gültig bis</p>
                        <p className="font-semibold text-xs">{expiryDate.toLocaleDateString('de-DE')}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] opacity-60 uppercase mb-2">Ausstellende Behörde</p>
                      <p className="text-xs font-semibold">Hamburg Horizon RP</p>
                      <p className="text-[10px] opacity-50">Waffenbehörde Hamburg</p>
                    </div>

                    <div className="pt-3 border-t border-white/20">
                      <p className="text-[10px] opacity-60 uppercase mb-2">Hinweise</p>
                      <p className="text-xs opacity-70 leading-relaxed">
                        • Waffe muss registriert sein<br/>
                        • Nur für Selbstverteidigung<br/>
                        • Bei Verlust sofort melden
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <p className="text-sm opacity-70 mb-2">Dieses Dokument ist nicht im Besitz</p>
                  <p className="text-xs opacity-50">Besuche den Discord Bot Shop</p>
                </div>
              )}

              <div className="pt-4 border-t border-white/20">
                <div className="flex items-center justify-between text-[10px] opacity-60 mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium">HHRP Waffenschein</span>
                  </div>
                  <span className="opacity-40">Klicken zum Umdrehen</span>
                </div>
                <p className="text-[10px] opacity-40 leading-relaxed">
                  Dieser Waffenschein ist Eigentum von Hamburg Horizon RP. Verlängerung alle 30 Tage erforderlich.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IDCard({ character, avatarUrl, userId }) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Berechne Geburtsdatum aus Alter - FEST basierend auf User-ID
  const calculateBirthDate = (age, userId) => {
    if (!age) return 'N/A';
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;
    
    // Verwende User-ID als Seed für konsistente "zufällige" Werte
    const seed = parseInt(userId?.slice(0, 8) || '12345678', 10);
    const day = (seed % 28) + 1; // Tag zwischen 1-28
    const month = (seed % 12) + 1; // Monat zwischen 1-12
    
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${birthYear}`;
  };

  const birthDate = calculateBirthDate(character?.age, userId);
  const issueDate = new Date(2020, 3, 15); // Beispiel: 15.04.2020

  return (
    <div className="w-full perspective-1000">
      <div 
        className="relative w-full aspect-[1.586/1] cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className={`relative w-full h-full transition-transform duration-700 transform-style-3d`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* VORDERSEITE */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Wasserzeichen */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <span className="text-[160px] font-black tracking-wider rotate-[-20deg] select-none">
                HHRP
              </span>
            </div>

            {/* Decorative waves */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-700/20 rounded-full translate-y-24 -translate-x-24"></div>

            <div className="relative h-full p-4 sm:p-6 flex flex-col text-white">
              {/* Header */}
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div>
                  <p className="text-[8px] sm:text-[10px] uppercase tracking-widest opacity-70 mb-1">Bundesrepublik HHRP</p>
                  <h2 className="text-sm sm:text-base font-bold">PERSONALAUSWEIS</h2>
                </div>
                <img src="/icon-192.png" alt="HHRP" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
              </div>

              {/* Content Grid */}
              <div className="flex gap-3 sm:gap-4 flex-1">
                {/* Photo */}
                <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gray-700 rounded overflow-hidden flex-shrink-0 border-2 border-gray-600">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-2 text-xs">
                  <div>
                    <p className="text-[10px] opacity-60 uppercase">Nachname</p>
                    <p className="font-semibold text-sm">{character?.nachname || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-60 uppercase">Vorname</p>
                    <p className="font-semibold text-xs">{character?.vorname || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] opacity-60 uppercase">Geburtsdatum</p>
                      <p className="font-semibold text-xs">{birthDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-60 uppercase">Geschlecht</p>
                      <p className="font-semibold text-xs">{character?.geschlecht || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-60 uppercase">Wohnort</p>
                    <p className="font-semibold text-xs">{character?.herkunft || 'Hamburg'}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/20 mt-auto">
                <div className="text-[10px] opacity-70">
                  <span className="font-semibold">Erstellt am:</span> {issueDate.toLocaleDateString('de-DE')}
                </div>
                <div className="text-[10px] opacity-40">
                  Klicken zum Umdrehen
                </div>
              </div>
            </div>
          </div>

          {/* RÜCKSEITE */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl overflow-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            {/* Wasserzeichen */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <span className="text-[160px] font-black tracking-wider rotate-[20deg] select-none">
                HHRP
              </span>
            </div>

            {/* Decorative waves */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>

            <div className="relative h-full p-4 sm:p-6 flex flex-col justify-between text-white">
              {/* Barcode Area */}
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] opacity-60 uppercase mb-2">Ausweis-Nummer</p>
                  <p className="text-lg font-mono font-bold tracking-wider">{userId?.slice(0, 12) || 'N/A'}</p>
                </div>

                {/* Barcode */}
                <div className="bg-white/95 rounded-lg p-3">
                  <div className="flex gap-[1px] h-14">
                    {[...Array(30)].map((_, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-gray-800"
                        style={{ opacity: Math.random() > 0.3 ? 1 : 0.3 }}
                      ></div>
                    ))}
                  </div>
                  <p className="text-center text-[10px] text-gray-800 font-mono mt-2">{userId?.slice(0, 16) || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-[10px] opacity-60 uppercase mb-2">Ausgestellt am</p>
                  <p className="font-semibold text-sm">{issueDate.toLocaleDateString('de-DE')}</p>
                </div>

                <div>
                  <p className="text-[10px] opacity-60 uppercase mb-2">Ausstellende Behörde</p>
                  <p className="text-xs font-semibold">Hamburg Horizon RP</p>
                  <p className="text-[10px] opacity-50">Bürgerbüro Hamburg</p>
                </div>

                <div className="pt-3 border-t border-white/20">
                  <p className="text-xs text-green-400 font-semibold flex items-center gap-2">
                    <Check className="w-3.5 h-3.5" />
                    Unbegrenzt gültig
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/20">
                <div className="flex items-center justify-between text-[10px] opacity-60 mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="font-medium">HHRP ID</span>
                  </div>
                  <span className="opacity-40">Klicken zum Umdrehen</span>
                </div>
                <p className="text-[10px] opacity-40 leading-relaxed">
                  Dieser Ausweis ist Eigentum von Hamburg Horizon RP. Bei Verlust oder Diebstahl unverzüglich melden.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BankCard({ card, userName }) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  const bankNames = {
    'elite_federal': 'Elite Federal Bank',
    'hamburg_horizon': 'Hamburg Horizon Bank',
    'deutsche_bank': 'Deutsche Bank',
    'sparkasse': 'Sparkasse Hamburg'
  };

  const bankName = bankNames[card.bankId] || 'Hamburg Bank';

  const formatCardNumber = (num) => {
    if (!num) return '0000 0000 0000 0000';
    const str = num.toString();
    if (str.length <= 12) {
      return str.match(/.{1,4}/g)?.join(' ') || str;
    }
    const padded = str.padStart(16, '0');
    return padded.match(/.{1,4}/g)?.join(' ') || str;
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert!`);
  };

  return (
    <div className="w-full max-w-md mx-auto perspective-1000">
      <div 
        className="relative w-full aspect-[1.586/1] cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* 3D Container */}
        <div 
          className={`relative w-full h-full transition-transform duration-700 transform-style-3d`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* VORDERSEITE */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Wasserzeichen HHRP */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <span className="text-[160px] font-black tracking-wider rotate-[-20deg] select-none">
                HHRP
              </span>
            </div>

            {/* Decorative waves */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gray-700/20 rounded-full translate-y-32 -translate-x-32"></div>

            {/* Card Content */}
            <div className="relative h-full p-5 sm:p-6 flex flex-col justify-between text-white">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs font-semibold">{bankName}</span>
                  </div>
                  <p className="text-[10px] opacity-70">Hamburg Horizon RP</p>
                </div>
                {/* HHRP Logo statt Mastercard */}
                <div className="flex items-center gap-2">
                  <img src="/icon-192.png" alt="HHRP" className="w-10 h-10 rounded-lg" />
                </div>
              </div>

              {/* Chip & Contactless */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300/95 to-yellow-400/95 shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[1px] p-1">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="bg-yellow-600/50 rounded-[1px]"></div>
                    ))}
                  </div>
                </div>
                {/* Contactless Icon */}
                <svg className="w-6 h-6 opacity-90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0"/>
                  <path d="M6.5 10.5c0-3.03 2.47-5.5 5.5-5.5v2c-1.93 0-3.5 1.57-3.5 3.5H6.5z"/>
                  <path d="M9 10.5c0-1.66 1.34-3 3-3v2c-.55 0-1 .45-1 1H9z"/>
                  <path d="M11.5 10.5c0-.28.22-.5.5-.5v1h-.5z"/>
                </svg>
              </div>

              {/* Card Number */}
              <div className="space-y-1">
                <div className="flex items-center justify-between group/copy">
                  <p className="text-xl sm:text-2xl font-mono tracking-[0.25em] font-light">
                    {formatCardNumber(card.accountNumber)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(card.accountNumber, 'Kartennummer');
                    }}
                    className="opacity-0 group-hover/copy:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Details */}
              <div className="flex items-end justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] opacity-60 uppercase tracking-wider">Card Holder</p>
                  <p className="text-sm font-medium uppercase tracking-wider">{userName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] opacity-60">Erstellt am</p>
                  <p className="text-[10px] font-semibold">15.04.2020</p>
                </div>
              </div>
            </div>
          </div>

          {/* RÜCKSEITE */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl overflow-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            {/* Wasserzeichen HHRP */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <span className="text-[140px] font-black tracking-wider rotate-[20deg] select-none">
                HHRP
              </span>
            </div>

            {/* Card Content Back */}
            <div className="relative h-full flex flex-col text-white">
              {/* Magnetic Stripe */}
              <div className="w-full h-12 bg-gradient-to-b from-gray-900 to-black mt-4"></div>

              {/* Signature & CVV Area */}
              <div className="px-5 sm:px-6 py-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Signature Strip */}
                  <div>
                    <p className="text-[10px] opacity-60 mb-1.5 uppercase tracking-wide">Unterschrift</p>
                    <div className="bg-white/95 h-10 rounded flex items-center px-3">
                      <div className="flex-1 flex items-center">
                        <span className="text-sm text-gray-700 italic font-semibold">{userName?.slice(0, 20)}</span>
                      </div>
                    </div>
                  </div>

                  {/* PIN Box */}
                  <div className="bg-white/95 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Key className="w-3.5 h-3.5 text-slate-600" />
                          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide">Karten-PIN</p>
                        </div>
                        <p className="text-2xl font-mono font-bold text-slate-800 tracking-wider">{card.code || '•••'}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (card.code) copyToClipboard(card.code, 'PIN');
                        }}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                      Gib diesen Code niemals weiter
                    </p>
                  </div>

                  {/* Card Info */}
                  {(card.identification || card.transferNumber) && (
                    <div className="space-y-1.5 text-xs">
                      {card.identification && (
                        <div className="flex items-center justify-between py-2 border-t border-white/20">
                          <div className="flex items-center gap-1.5 opacity-70">
                            <Hash className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-wide">ID-Nr:</span>
                          </div>
                          <div className="flex items-center gap-2 group/copy">
                            <span className="font-mono font-semibold text-xs">{card.identification}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(card.identification, 'ID');
                              }}
                              className="opacity-0 group-hover/copy:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                      {card.transferNumber && (
                        <div className="flex items-center justify-between py-2 border-t border-white/20">
                          <div className="flex items-center gap-1.5 opacity-70">
                            <Hash className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-wide">Transfer:</span>
                          </div>
                          <div className="flex items-center gap-2 group/copy">
                            <span className="font-mono font-semibold text-xs">{card.transferNumber}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(card.transferNumber, 'Transfer-Nr');
                              }}
                              className="opacity-0 group-hover/copy:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-center justify-between text-[10px] opacity-70 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="font-medium">{bankName}</span>
                    </div>
                    <button 
                      className="hover:opacity-100 transition-opacity flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Umdrehen</span>
                    </button>
                  </div>
                  <p className="text-[9px] opacity-50 leading-relaxed">
                    Diese Karte ist Eigentum von Hamburg Horizon RP. Bei Verlust oder Diebstahl bitte sofort melden.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  const [bewerbungen, setBewerbungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
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

  // Tab-Konfiguration mit Kategorien
  const mainTabs = [
    { id: 'overview', label: 'Übersicht', icon: LayoutDashboard },
    { id: 'benefits', label: 'Meine Vorteile', icon: Gift, hasSubTabs: true },
    { id: 'finance', label: 'Finanzen', icon: Wallet, hasSubTabs: true },
    { id: 'documents', label: 'Dokumente', icon: IdCard, hasSubTabs: true },
    { id: 'marketplace', label: 'Marktplatz', icon: ShoppingCart },
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
    ]
  };

  // Handler für Haupt-Tab Wechsel
  const handleMainTabChange = (tabId) => {
    setActiveTab(tabId);
    // Setze Default Sub-Tab wenn Kategorie Sub-Tabs hat
    if (subTabs[tabId]) {
      setActiveSubTab(subTabs[tabId][0].id);
    }
  };
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

  const loadData = async () => {
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
          error: 'Der Discord Bot ist derzeit offline. Deine Profildaten können nicht geladen werden.' 
        });
        setLoading(false);
        return;
      }
      
      // 2. Bot ist online, lade die Daten
      const [userRes, rewardsRes, bewerbungenRes] = await Promise.all([
        fetch('/api/user/data', { cache: 'no-store' }),
        fetch('/api/user/rewards', { cache: 'no-store' }),
        fetch('/api/bewerbungen/me', { cache: 'no-store' })
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
  
  // licenses und cards sind bereits Arrays von der Sync-Funktion
  const licenses = Array.isArray(userData?.licenses) ? userData.licenses : [];
  const cards = Array.isArray(userData?.cards) ? userData.cards : [];
  const stats = userData?.stats || {};

  const totalMoney = (money.cash || 0) + (money.bank || 0) + (money.savings || 0);

  const statusColors = {
    'Eingereicht': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'In Bearbeitung': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Angenommen': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Abgelehnt': 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: LayoutDashboard },
    { id: 'transfer', label: 'Überweisung', icon: ArrowLeftRight },
    { id: 'cards', label: 'Meine Dokumente', icon: IdCard },
    { id: 'transactions', label: 'Transaktionen', icon: TrendingUp },
    { id: 'invoices', label: 'Meine Rechnungen', icon: FileText },
    { id: 'personalakte', label: 'Meine Personalakte', icon: Award },
    { id: 'marketplace', label: 'Marktplatz', icon: ShoppingCart },
    { id: 'savings', label: 'Sparkonto', icon: PiggyBank },
    { id: 'tax', label: 'Steuer-Records', icon: Receipt },
    { id: 'applications', label: 'Bewerbungen', icon: ClipboardList }
  ];

  return (
    <div className="min-h-screen px-4 py-8 pt-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header mit Discord Avatar */}
        <div className="glass rounded-2xl p-4 sm:p-6 border border-white/[0.08]">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-white break-all">{user.username}</h1>
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
        {/* Tab Navigation - Haupt-Tabs */}
        <div className="glass rounded-2xl p-2 border border-white/[0.08]">
          {/* Mobile: Horizontal Scrollable */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleMainTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm whitespace-nowrap snap-center flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border border-white/20 shadow-lg'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* Desktop: Grid Layout */}
          <div className="hidden lg:grid grid-cols-5 gap-2">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleMainTabChange(tab.id)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all text-base ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
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
        {activeTab === 'overview' && (
          <>
            {/* Bot Status Check - zeige Error wenn Bot offline (auch während checking) */}
            {!botStatus.isOnline ? (
              <BotStatusCard status={botStatus} onRetry={loadData} />
            ) : (
              <>
                {/* Daily Bonus Card */}
                <DailyBonusCard 
                  userId={user?.id}
                  onSuccess={() => {
                    // Reload data after claiming
                    loadData();
                  }}
                />

            {/* Money Overview */}
            {!botStatus.isOnline ? null : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="glass rounded-xl p-6 border border-white/[0.08]">
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

                <div className="glass rounded-xl p-6 border border-white/[0.08]">
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

                <div className="glass rounded-xl p-6 border border-white/[0.08] sm:col-span-2 md:col-span-1">
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
              <div className="glass rounded-2xl p-6 border border-white/[0.08]">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-white/60" />
                  <h2 className="text-xl font-bold text-white">Aktive Cooldowns</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(userData.cooldowns).map(([key, timestamp]) => {
                    // VIP-Status prüfen für dynamische Cooldown-Zeiten
                    const licenses = userData?.licenses || [];
                    const hasVipElitePlus = licenses.includes('vip_elite_plus');
                    const hasVipUltimate = licenses.includes('vip_ultimate');
                    const hasVipPlatinum = licenses.includes('vip_platinum');
                    const hasVipPremium = licenses.includes('vip_premium');
                    
                    // Collect Cooldown basierend auf VIP-Status
                    let collectCooldown = 4 * 60 * 60 * 1000; // 4h Standard
                    if (hasVipElitePlus || hasVipUltimate) {
                      collectCooldown = 45 * 60 * 1000; // 45 Minuten für Elite+ / Ultimate
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
                <div className="glass rounded-2xl p-6 border border-white/[0.08]">
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
                <div className="glass rounded-2xl p-6 border border-white/[0.08]">
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

            {/* Licenses */}
            {licenses.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/[0.08]">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-6 h-6 text-white/60" />
                  <h2 className="text-xl font-bold text-white">Lizenzen & Versicherungen</h2>
                  <span className="px-2 py-1 rounded-full bg-white/10 text-white/50 text-xs">
                    {licenses.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {licenses.map((license, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm"
                    >
                      {license.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
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
                      <div>
                        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Bankkarte
                        </h3>
                        <div className="max-w-md">
                          {cards.length > 0 ? (
                            <BankCard 
                              card={cards[0]} 
                              userName={character?.name || user.username}
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
                      <div>
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
                      <div>
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
                      <div>
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
            <div className={`glass rounded-2xl p-6 border ${isPWA ? 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10' : 'border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-yellow-500/10'}`}>
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
            <div className="glass rounded-2xl p-6 border border-white/[0.08]">
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
              <div className="glass rounded-2xl p-6 border border-blue-500/15 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
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
                <div className="glass rounded-2xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-6">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <h2 className="text-xl font-bold text-white">Dein VIP-Status</h2>
                  </div>

                  {(() => {
                    const licenses = userData?.licenses || [];
                    const hasVipElitePlus = licenses.includes('vip_elite_plus');
                    const hasVipUltimate = licenses.includes('vip_ultimate');
                    const hasVipPlatinum = licenses.includes('vip_platinum');
                    const hasVipPremium = licenses.includes('vip_premium');

                    let vipStatus = null;
                    if (hasVipElitePlus) {
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
                                    <p className="text-sm text-white/40">Elite+ Daily Bonus</p>
                                  </div>
                                  <p className="text-lg font-semibold text-white">{vipStatus.bonus}</p>
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
                <div className={`glass rounded-2xl p-6 border ${userData?.licenses?.includes('server_booster') ? 'border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-purple-500/10' : 'border-white/[0.08]'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-2xl ${userData?.licenses?.includes('server_booster') ? 'bg-pink-500/20' : 'bg-white/[0.04]'} flex items-center justify-center flex-shrink-0`}>
                      <Rocket className={`w-8 h-8 ${userData?.licenses?.includes('server_booster') ? 'text-pink-400' : 'text-white/20'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-xl font-bold ${userData?.licenses?.includes('server_booster') ? 'text-pink-400' : 'text-white/40'}`}>Server Booster</h3>
                        {userData?.licenses?.includes('server_booster') ? (
                          <BadgeCheck className="w-5 h-5 text-pink-400" />
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] font-bold text-white/30 uppercase tracking-wider">Inaktiv</span>
                        )}
                      </div>
                      {userData?.licenses?.includes('server_booster') ? (
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
                <div className="glass rounded-2xl p-6 border border-white/[0.08]">
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
                      const licenses = userData?.licenses || [];
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
                    <div className={`group p-4 rounded-xl border transition-all ${userData?.licenses?.includes('server_booster') ? 'border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/8' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${userData?.licenses?.includes('server_booster') ? 'bg-pink-500/15' : 'bg-white/[0.06]'} flex items-center justify-center flex-shrink-0`}>
                          <Rocket className={`w-5 h-5 ${userData?.licenses?.includes('server_booster') ? 'text-pink-400' : 'text-white/30'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">Booster Bonus</h3>
                          <p className="text-xs text-white/50 mt-0.5">+5.000 bei jedem /collect als Server Booster</p>
                          <div className="flex items-center gap-1 mt-2">
                            {userData?.licenses?.includes('server_booster') ? (
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
                    <div className={`group p-4 rounded-xl border transition-all ${userData?.licenses?.includes('vip_elite_plus') ? 'border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/8' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${userData?.licenses?.includes('vip_elite_plus') ? 'bg-purple-500/15' : 'bg-white/[0.06]'} flex items-center justify-center flex-shrink-0`}>
                          <Gem className={`w-5 h-5 ${userData?.licenses?.includes('vip_elite_plus') ? 'text-purple-400' : 'text-white/30'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">Elite+ Daily Bonus</h3>
                          <p className="text-xs text-white/50 mt-0.5">+2.000 täglich als VIP Elite+ Mitglied</p>
                          <div className="flex items-center gap-1 mt-2">
                            {userData?.licenses?.includes('vip_elite_plus') ? (
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
                <div className="glass rounded-2xl p-6 border border-white/[0.08]">
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
                <div className="glass rounded-2xl p-6 border border-white/[0.08]">
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

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                          <div className="text-2xl font-bold text-white">{cash.toLocaleString('de-DE')} €</div>
                          <div className="text-xs text-white/40 mt-1">Bargeld</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                          <div className="text-2xl font-bold text-white">{bank.toLocaleString('de-DE')} €</div>
                          <div className="text-xs text-white/40 mt-1">Bank</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                          <div className="text-2xl font-bold text-white">{savings.toLocaleString('de-DE')} €</div>
                          <div className="text-xs text-white/40 mt-1">Sparkonto</div>
                        </div>
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                          <div className="text-2xl font-bold text-red-400">{totalSchulden.toLocaleString('de-DE')} €</div>
                          <div className="text-xs text-red-400/60 mt-1">Schulden</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vermögensaufteilung */}
                  <div className="glass rounded-2xl p-6 border border-white/[0.08]">
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
                    <div className="glass rounded-2xl p-6 border border-red-500/20 bg-red-500/5">
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
                  <div className="glass rounded-2xl p-6 border border-white/[0.08]">
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
        {activeTab === 'transfer' && (
          <TransferMoneyView 
            userData={userData}
            onTransferComplete={() => {
              // Reload data nach erfolgreicher Überweisung
              loadData();
            }}
          />
        )}

        {/* Statistiken Tab - NEU */}
        {activeTab === 'finance' && activeSubTab === 'statistics' && (
          <FinanzStatistikenView userData={userData} />
        )}

        {/* Transaktionen Tab */}
        {activeTab === 'finance' && activeSubTab === 'transactions' && (
          <ErweiterteTransaktionenView 
            userData={userData} 
            filter={transactionFilter}
            setFilter={setTransactionFilter}
          />
        )}

        {/* Rechnungen Tab */}
        {activeTab === 'finance' && activeSubTab === 'invoices' && (
          <div className="space-y-6">
            {!botStatus.isOnline ? (
              <BotStatusCard status={botStatus} onRetry={loadData} />
            ) : loading ? (
              <SkeletonCard />
            ) : (
              <div className="glass rounded-2xl p-4 sm:p-6 border border-white/[0.08]">
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
              <div className="glass rounded-2xl p-4 sm:p-6 border border-white/[0.08]">
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

        {/* Marktplatz Tab */}
        {activeTab === 'marketplace' && (
          <div className="glass rounded-2xl p-4 sm:p-6 border border-white/[0.08]">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingCart className="w-6 h-6 text-white/60" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Marktplatz</h2>
              {userData?.marketplace?.length > 0 && (
                <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                  {userData.marketplace.length}
                </span>
              )}
            </div>
            {userData?.marketplace && userData.marketplace.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userData.marketplace
                    .slice((marketplacePage - 1) * itemsPerPage, marketplacePage * itemsPerPage)
                    .map((item, index) => (
                    <div key={index} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-white mb-1">{item.itemName || 'Item'}</h3>
                          {item.description && (
                            <p className="text-sm text-white/60">{item.description}</p>
                          )}
                        </div>
                        <span className="text-lg font-bold text-green-400 ml-2">
                          {item.price?.toLocaleString('de-DE')} €
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                        {item.quantity && (
                          <span>Anzahl: {item.quantity}</span>
                        )}
                        {item.createdAt && (
                          <span>{new Date(item.createdAt).toLocaleDateString('de-DE')}</span>
                        )}
                        {item.status && (
                          <span className={`px-2 py-0.5 rounded-full ${
                            item.status === 'sold' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {item.status === 'sold' ? 'Verkauft' : 'Verfügbar'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination 
                  currentPage={marketplacePage}
                  totalItems={userData.marketplace.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setMarketplacePage}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-lg font-bold text-white mb-2">Keine Listings</h3>
                <p className="text-sm text-white/40">Du hast keine aktiven Listings im Marktplatz.</p>
              </div>
            )}
          </div>
        )}

        {/* Sparkonto Tab - NEU */}
        {activeTab === 'finance' && activeSubTab === 'savings' && (
          <SparkontoManagementView 
            userData={userData}
            savingsGoal={savingsGoal}
            setSavingsGoal={setSavingsGoal}
          />
        )}

        {/* Kredite Tab - NEU */}
        {activeTab === 'finance' && activeSubTab === 'kredite' && (
          <KrediteDetailView userData={userData} />
        )}

        {/* Steuer-Records Tab */}
        {/* Steuer-Records Tab */}
        {activeTab === 'finance' && activeSubTab === 'tax' && (
          <div className="space-y-6">
            {/* Steuer-Übersicht Card */}
            {userData?.taxSummary && userData.taxSummary.gesamtGezahlt > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/[0.08]">
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
            <div className="glass rounded-2xl p-4 sm:p-6 border border-white/[0.08]">
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
              <div className="glass rounded-2xl p-6 border border-white/[0.08]">
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
              <div className="glass rounded-2xl p-12 text-center border border-white/[0.08]">
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
          <div className="space-y-6">

            {/* === DARSTELLUNG === */}
            <div className="glass rounded-2xl p-6 border border-white/[0.08]">
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

            {/* === HINTERGRUNDBILD === */}
            {(() => {
              const licenses = userData?.licenses || [];
              const hasVipForCustomBg = licenses.includes('vip_platinum') || licenses.includes('vip_ultimate') || licenses.includes('vip_elite_plus');
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
                <div className="glass rounded-2xl p-6 border border-white/[0.08]">
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
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
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
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 opacity-40 pointer-events-none">
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
                                Du benötigst VIP Platinum, VIP Ultimate oder VIP Elite Plus um zusätzliche Hintergrundbilder und eigene Uploads zu nutzen.
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
            {isPWA && (
              <div className="glass rounded-2xl p-6 border border-white/[0.08]">
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
            <div className="glass rounded-2xl p-6 border border-white/[0.08]">
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
                      setCustomBg(null);
                      setKompaktModus(false);
                      setNotificationStyle('normal');
                      setAnimationen(true);
                      setTextGroesse('normal');
                      setDatensparmodus(false);
                      setSchnellstart(false);
                      setAutoSync(true);
                      setOfflineModus(false);
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
                          notificationStyle: 'normal'
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

          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
