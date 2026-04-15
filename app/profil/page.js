'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import DailyBonusCard from '@/components/DailyBonusCard';
import AnimatedValue from '@/components/AnimatedValue';
import { 
  Wallet, CreditCard, Trophy, Gift, User, Award, Clock, TrendingUp, 
  Check, Loader2, FileText, Calendar, Mail, ExternalLink, LayoutDashboard, IdCard, ClipboardList,
  Building2, Hash, Key, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getDiscordAvatarUrl } from '@/lib/discord-utils';

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
  const [rewards, setRewards] = useState([]);
  const [bewerbungen, setBewerbungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
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
        
        // Bot ist online, Daten sind da
        setBotStatus({ isOnline: true, checking: false, error: null });
        setUserData(actualData);
        console.log('User data loaded:', actualData);
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
    { id: 'cards', label: 'Meine Dokumente', icon: IdCard },
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

        {/* Tab Navigation */}
        <div className="glass rounded-2xl p-2 border border-white/[0.08]">
          <div className="flex flex-col sm:flex-row gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 sm:px-4 rounded-xl transition-all text-sm sm:text-base ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

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
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Bargeld</p>
                      <p className="text-2xl font-bold text-white">
                        <AnimatedValue 
                          value={money.cash || 0}
                          prefix="€"
                          storageKey={`cash_${user?.id}`}
                        />
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
        {activeTab === 'cards' && (
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
      </div>
    </div>
  );
}
