'use client';

import { useState, useEffect } from 'react';
import { X, Gift, Coins, Sparkles, TrendingUp } from 'lucide-react';

export default function DailyBonusModal({ onClose }) {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [amount, setAmount] = useState(20000);
  const [error, setError] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Animation beim Mount
    setTimeout(() => setShow(true), 100);
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
        
        // Confetti-Effekt
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        setError(data.error || 'Fehler beim Beanspruchen des Bonus');
      }
    } catch (err) {
      console.error('Daily bonus error:', err);
      setError('Netzwerkfehler. Bitte versuche es später erneut.');
    } finally {
      setClaiming(false);
    }
  };

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className={`relative bg-gradient-to-br from-gray-900 via-purple-900/50 to-pink-900/50 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-white/10 transition-all duration-500 ${
          show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10 active:scale-95"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </button>

        <div className="relative p-6 sm:p-8 text-center">
          {!claimed ? (
            <>
              {/* Icon */}
              <div className="mb-4 sm:mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 p-4 sm:p-6 rounded-full">
                    <Gift className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
                Täglicher Bonus!
              </h2>
              <p className="text-white/70 text-base sm:text-lg mb-4 sm:mb-6 px-2">
                Willkommen zurück! Claim deinen täglichen Bonus
              </p>

              {/* Amount */}
              <div className="bg-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                  <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
                  <span className="text-3xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                    €20.000
                  </span>
                </div>
                <p className="text-white/60 text-xs sm:text-sm">Wird deinem Konto gutgeschrieben</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-lg sm:rounded-xl">
                  <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                </div>
              )}

              {/* Button */}
              <button
                onClick={handleClaim}
                disabled={claiming}
                className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 active:scale-95 ${
                  claiming
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 shadow-lg hover:shadow-xl'
                }`}
              >
                {claiming ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Wird beansprucht...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    Bonus beanspruchen
                  </span>
                )}
              </button>

              <p className="text-white/40 text-xs mt-3 sm:mt-4">
                Einmal pro Tag verfügbar
              </p>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="mb-4 sm:mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 p-4 sm:p-6 rounded-full animate-bounce">
                    <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  </div>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
                Bonus erhalten! 🎉
              </h2>
              <p className="text-white/70 text-base sm:text-lg mb-4 sm:mb-6 px-2">
                Dein Konto wurde gutgeschrieben
              </p>

              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-500/30">
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                  <span className="text-3xl sm:text-5xl font-bold text-green-400">
                    +€{amount.toLocaleString('de-DE')}
                  </span>
                </div>
                <p className="text-white/60 text-xs sm:text-sm">Der Bot schreibt dir das Geld gleich gut!</p>
              </div>

              <p className="text-white/40 text-xs sm:text-sm mt-4 sm:mt-6">
                Komm morgen wieder für deinen nächsten Bonus! 💰
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
