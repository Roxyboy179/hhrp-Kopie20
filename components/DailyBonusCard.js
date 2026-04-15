'use client';

import { useState, useEffect } from 'react';
import { Gift, Sparkles, TrendingUp, Loader2, Clock } from 'lucide-react';

// Prüfe ob User die PWA nutzt (nicht Browser)
const isPWA = () => {
  if (typeof window === 'undefined') return false;
  
  // Prüfe verschiedene PWA-Indikatoren
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOS = window.navigator.standalone === true;
  const isAndroid = document.referrer.includes('android-app://');
  
  return isStandalone || isIOS || isAndroid;
};

export default function DailyBonusCard({ userId, onSuccess }) {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [canClaim, setCanClaim] = useState(true);
  const [error, setError] = useState(null);
  const [isPWAUser, setIsPWAUser] = useState(false);
  const [amount, setAmount] = useState(5000);

  useEffect(() => {
    // Prüfe ob PWA und setze Betrag entsprechend
    const pwaStatus = isPWA();
    setIsPWAUser(pwaStatus);
    setAmount(pwaStatus ? 20000 : 5000);
    
    // Prüfe ob schon geclaimt
    checkIfClaimed();
  }, []);

  const checkIfClaimed = async () => {
    try {
      const res = await fetch('/api/check-daily');
      if (res.ok) {
        const data = await res.json();
        if (!data.canClaim && data.reason === 'already_claimed') {
          setAlreadyClaimed(true);
          setCanClaim(false);
        }
      }
    } catch (e) {
      console.error('Check claimed error:', e);
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);

    try {
      const response = await fetch('/api/daily-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPWA: isPWAUser })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAmount(data.amount || (isPWAUser ? 20000 : 5000));
        setClaimed(true);
        setCanClaim(false);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.error || 'Fehler beim Beanspruchen des Bonus');
        setAlreadyClaimed(true);
        setCanClaim(false);
      }
    } catch (err) {
      console.error('Daily bonus error:', err);
      setError('Netzwerkfehler. Bitte versuche es später erneut.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/[0.08] overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-8 sm:-top-12 -left-8 sm:-left-12 w-24 sm:w-32 h-24 sm:h-32 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-8 sm:-bottom-12 -right-8 sm:-right-12 w-24 sm:w-32 h-24 sm:h-32 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        {/* Left Side - Info */}
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          {/* Icon */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-sm opacity-40 animate-pulse"></div>
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
              {claimed ? (
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : alreadyClaimed ? (
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white mb-0.5 truncate">
              {claimed ? 'Bonus erhalten!' : alreadyClaimed ? 'Bereits abgeholt' : 'Täglicher Bonus'}
            </h3>
            <p className="text-xs sm:text-sm text-white/60 line-clamp-2">
              {claimed 
                ? `€${amount.toLocaleString('de-DE')} wurden gutgeschrieben!`
                : alreadyClaimed
                ? 'Komm morgen wieder für deinen nächsten Bonus!'
                : `Hol dir €${amount.toLocaleString('de-DE')} kostenlos jeden Tag ab!`
              }
            </p>
          </div>
        </div>

        {/* Right Side - Button */}
        <div className="w-full sm:w-auto sm:flex-shrink-0">
          {claimed ? (
            <div className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 w-full sm:w-auto">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-green-400 whitespace-nowrap">
                Erhalten! 🎉
              </span>
            </div>
          ) : alreadyClaimed ? (
            <div className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 w-full sm:w-auto">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-orange-400 whitespace-nowrap">
                Morgen wieder
              </span>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
                claiming
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600 shadow-md hover:shadow-lg active:scale-95 touch-manipulation'
              }`}
            >
              {claiming ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin flex-shrink-0" />
                  <span>Wird abgeholt...</span>
                </>
              ) : (
                <>
                  <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Daily Bonus abholen</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 sm:mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-xs leading-tight">{error}</p>
        </div>
      )}

      {/* PWA Badge - Nur für PWA Nutzer und nur wenn nicht claimed */}
      {isPWAUser && !alreadyClaimed && (
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
          <div className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-400/40 rounded-full shadow-sm">
            <p className="text-[9px] sm:text-[10px] font-bold text-green-300">PWA 4x</p>
          </div>
        </div>
      )}
    </div>
  );
}
