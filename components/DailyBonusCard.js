'use client';

import { useState, useEffect } from 'react';
import { Gift, Sparkles, TrendingUp, Loader2 } from 'lucide-react';

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
  const [canClaim, setCanClaim] = useState(true);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState(20000);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    // Nur in PWA anzeigen
    setShowCard(isPWA());
  }, []);

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);

    try {
      const response = await fetch('/api/daily-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAmount(data.amount || 20000);
        setClaimed(true);
        setCanClaim(false);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.error || 'Fehler beim Beanspruchen des Bonus');
        setCanClaim(false);
      }
    } catch (err) {
      console.error('Daily bonus error:', err);
      setError('Netzwerkfehler. Bitte versuche es später erneut.');
    } finally {
      setClaiming(false);
    }
  };

  // Nicht anzeigen wenn nicht in PWA
  if (!showCard) {
    return null;
  }

  // Don't show if already claimed
  if (!canClaim && !claimed) {
    return null;
  }

  return (
    <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/[0.08] overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-10 sm:-top-20 -left-10 sm:-left-20 w-32 sm:w-40 h-32 sm:h-40 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 sm:-bottom-20 -right-10 sm:-right-20 w-32 sm:w-40 h-32 sm:h-40 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative flex flex-col sm:flex-row items-center gap-3 sm:gap-4 md:gap-6">
        {/* Left Side - Info */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
          {/* Icon */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-md opacity-50 animate-pulse"></div>
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              {claimed ? (
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
              ) : (
                <Gift className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
              )}
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-0.5 sm:mb-1 truncate">
              {claimed ? 'Bonus erhalten!' : 'Täglicher Bonus'}
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-white/60 line-clamp-2">
              {claimed 
                ? `€${amount.toLocaleString('de-DE')} wurden gutgeschrieben!`
                : `Hol dir €${amount.toLocaleString('de-DE')} kostenlos jeden Tag ab!`
              }
            </p>
          </div>
        </div>

        {/* Right Side - Button */}
        <div className="w-full sm:w-auto sm:flex-shrink-0">
          {claimed ? (
            <div className="flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 w-full sm:w-auto">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
              <span className="text-sm sm:text-base font-semibold text-green-400 whitespace-nowrap">
                Erhalten! 🎉
              </span>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 whitespace-nowrap ${
                claiming
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600 shadow-lg hover:shadow-xl active:scale-95 touch-manipulation'
              }`}
            >
              {claiming ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                  <span>Wird abgeholt...</span>
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>Daily Bonus abholen</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-xs sm:text-sm leading-tight">{error}</p>
        </div>
      )}

      {/* PWA Badge */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
        <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-green-500/20 border border-green-500/30 rounded-full">
          <p className="text-[10px] sm:text-xs font-semibold text-green-400">PWA</p>
        </div>
      </div>
    </div>
  );
}
