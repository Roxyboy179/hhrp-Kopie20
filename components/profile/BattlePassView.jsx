'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import {
  Crown, Lock, Check, Clock, Gift, Sparkles, AlertTriangle,
  Coins, Banknote, Star, Ticket, Car, Bike, Truck, Crosshair, Shield, X, Zap, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Icon-Mapper
const REWARD_ICON = {
  credits: Coins,
  money: Banknote,
  xp: Star,
  item: Ticket,
  pass: Crown,
};

const ITEM_ICON_MAP = {
  führerschein_pkw: Car,
  führerschein_motorrad: Bike,
  führerschein_lkw: Truck,
  führerschein_bus: Truck,
  waffenschein: Crosshair,
  jagdschein: Crosshair,
  versicherung_rechtsschutz: Shield,
  versicherung_kranken: Shield,
  werkzeug_angel: Gift,
  vip_premium: Crown,
  vip_platinum: Crown,
  vip_elite_plus: Crown,
  credits_basic_pass: Ticket,
};

const REWARD_COLOR = {
  credits: 'text-yellow-400',
  money: 'text-emerald-400',
  xp: 'text-blue-400',
  item: 'text-purple-400',
  pass: 'text-yellow-400',
};

function getRewardIcon(reward) {
  if (!reward) return Gift;
  if (reward.type === 'item' && reward.item_id && ITEM_ICON_MAP[reward.item_id]) {
    return ITEM_ICON_MAP[reward.item_id];
  }
  return REWARD_ICON[reward.type] || Gift;
}

function getRewardColor(reward) {
  if (!reward) return 'text-white/50';
  return REWARD_COLOR[reward.type] || 'text-white/70';
}

// ✨ Confetti Animation (nur Confetti, kein Overlay)
function fireConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 } };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

// 🎉 Premium Kauf Animation (goldener Regen) - läuft bis Bot bestätigt
function startPremiumConfetti() {
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    confetti({
      ...defaults,
      particleCount: 25,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#FFD700', '#FFA500', '#FFFF00', '#FFE4B5'],
    });
    confetti({
      ...defaults,
      particleCount: 25,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#FFD700', '#FFA500', '#FFFF00', '#FFE4B5'],
    });
  }, 250);

  return interval; // Return interval so we can clear it
}

export default function BattlePassView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pollingRef = useRef(null);
  const confettiIntervalRef = useRef(null);

  useEffect(() => {
    loadBattlePass();
    
    // ✅ Auto-Refresh alle 3 Sekunden (für schnellere Bot-Updates)
    pollingRef.current = setInterval(loadBattlePass, 3000);
    
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (confettiIntervalRef.current) clearInterval(confettiIntervalRef.current);
    };
  }, []);

  const loadBattlePass = async () => {
    try {
      const res = await fetch('/api/battle-pass/current');
      const json = await res.json();
      if (res.ok) {
        const oldPurchased = data?.userProgress?.purchased;
        const newPurchased = json.userProgress.purchased;
        
        // ✅ Wenn Premium gerade aktiviert wurde, stoppe Gold-Regen
        if (!oldPurchased && newPurchased && confettiIntervalRef.current) {
          clearInterval(confettiIntervalRef.current);
          confettiIntervalRef.current = null;
          setPurchasing(false);
          toast.success('✨ Premium Battle Pass aktiviert!', {
            icon: '👑',
            duration: 5000,
          });
        }
        
        // ✅ Wenn Tier geclaimt wurde, stoppe Claim-Animation
        const oldTier = data?.userProgress?.currentTier || 0;
        const newTier = json.userProgress.currentTier;
        if (claiming && newTier > oldTier) {
          setClaiming(false);
        }
        
        setData(json);
      } else {
        if (!data) {
          toast.error(json.error || 'Fehler beim Laden des Battle Pass');
        }
      }
    } catch (error) {
      console.error('[BP] Load Error:', error);
      if (!data) {
        toast.error('Verbindungsfehler beim Laden');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = () => setConfirmOpen(true);

  const handlePurchase = async () => {
    setPurchasing(true);
    setConfirmOpen(false);
    
    try {
      const res = await fetch('/api/battle-pass/purchase', { method: 'POST' });
      const json = await res.json();
      
      if (res.ok) {
        // 🎉 Starte Premium-Kauf Animation (läuft bis Bot bestätigt)
        confettiIntervalRef.current = startPremiumConfetti();
        
        toast.loading('Warte auf Bot-Bestätigung...', {
          duration: 30000,
          id: 'premium-purchase',
        });
      } else {
        setPurchasing(false);
        toast.error(json.error || 'Kauf fehlgeschlagen');
      }
    } catch (error) {
      console.error('[BP] Purchase Error:', error);
      setPurchasing(false);
      toast.error('Verbindungsfehler beim Kauf');
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    
    try {
      const res = await fetch('/api/battle-pass/claim', { method: 'POST' });
      const json = await res.json();
      
      if (res.ok) {
        // 🎊 Nur Confetti, kein Overlay
        fireConfetti();
        
        toast.loading('Warte auf Bot-Bestätigung...', {
          duration: 30000,
          id: 'tier-claim',
        });
        
        // Warte auf Bot-Bestätigung (Polling läuft weiter)
      } else {
        setClaiming(false);
        toast.error(json.error || 'Claim fehlgeschlagen');
      }
    } catch (error) {
      console.error('[BP] Claim Error:', error);
      setClaiming(false);
      toast.error('Verbindungsfehler beim Claimen');
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 flex items-center justify-center min-h-[300px] shadow-2xl">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-white/20 border-t-yellow-400"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gradient-to-br from-red-500/10 to-red-900/10 backdrop-blur-xl border border-red-500/20 rounded-3xl p-6 md:p-10 text-center shadow-2xl">
        <X className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-300 font-semibold">Battle Pass konnte nicht geladen werden</p>
      </div>
    );
  }

  const { userProgress, rewards, season, daysRemaining } = data;
  const { currentTier, purchased, canClaimToday, missedDays } = userProgress;
  const seasonName = `${season.month}/${season.year}`;
  const progress = (currentTier / 30) * 100;
  const allClaimed = currentTier >= 30;
  const nextTier = currentTier + 1;

  return (
    <div className="space-y-4 md:space-y-6 relative">
      {/* ==================== HEADER  ==================== */}
      <div className="relative bg-gradient-to-br from-yellow-500/20 via-purple-500/10 to-blue-500/10 backdrop-blur-2xl border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-purple-500/5 animate-pulse pointer-events-none"></div>
        
        <div className="relative z-10">
          {/* Title */}
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div>
              <div className="flex items-center gap-2 text-white/50 text-[10px] md:text-xs uppercase tracking-widest mb-1 font-bold">
                <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" />
                Season {seasonName}
              </div>
              <h2 className="text-xl md:text-3xl font-black text-white flex items-center gap-2 md:gap-3 drop-shadow-lg">
                <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                <span>Battle Pass</span>
              </h2>
            </div>
            <div className="text-right">
              <div className="text-[10px] md:text-xs text-white/50 font-semibold mb-0.5">Noch</div>
              <div className="text-lg md:text-2xl font-black text-white drop-shadow-md">{daysRemaining}d</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3 md:mb-4">
            <div className="flex items-center justify-between mb-2 text-xs md:text-sm">
              <span className="text-white/60 font-semibold">Tier {currentTier} / 30</span>
              <span className="text-white font-bold tabular-nums drop-shadow-md">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 md:h-4 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #ef4444 100%)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Missed Days Warning */}
          {missedDays > 0 && (
            <div className="mb-3 md:mb-4 flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-md shadow-lg animate-pulse">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-300 text-xs md:text-sm font-bold">
                ⚠️ {missedDays} Tag{missedDays > 1 ? 'e' : ''} verpasst! Diese Tiers sind verloren.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            {!purchased && !purchasing && (
              <Button
                onClick={handlePurchaseClick}
                className="h-11 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-black shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex-1 relative overflow-hidden group"
                style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="flex items-center gap-2 relative z-10">
                  <Crown className="w-4 h-4 md:w-5 md:h-5" /> Premium kaufen
                </span>
              </Button>
            )}

            {purchasing && (
              <div className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-yellow-400/40 bg-yellow-400/10 backdrop-blur-md shadow-lg flex-1 sm:flex-initial">
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 animate-spin" />
                <span className="text-yellow-300 font-bold text-xs md:text-sm whitespace-nowrap">Warte auf Bot...</span>
              </div>
            )}

            {purchased && !purchasing && (
              <div className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-yellow-400/40 bg-yellow-400/10 backdrop-blur-md shadow-lg flex-1 sm:flex-initial animate-pulse">
                <Crown className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.8)]" />
                <span className="text-yellow-300 font-bold text-xs md:text-sm whitespace-nowrap drop-shadow-md">Premium aktiv</span>
              </div>
            )}

            {canClaimToday && !allClaimed && !claiming && (
              <Button
                onClick={handleClaim}
                className="h-11 md:h-12 rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex-1 relative overflow-hidden group"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="flex items-center gap-2 relative z-10">
                  <Zap className="w-4 h-4 md:w-5 md:h-5" />
                  Tier {nextTier} einlösen
                </span>
              </Button>
            )}

            {claiming && (
              <div className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-green-400/40 bg-green-400/10 backdrop-blur-md shadow-lg flex-1">
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 animate-spin" />
                <span className="text-green-300 font-bold text-xs md:text-sm whitespace-nowrap">Warte auf Bot...</span>
              </div>
            )}

            {!canClaimToday && !allClaimed && !claiming && missedDays === 0 && (
              <div className="flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md shadow-lg flex-1">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-white/50 flex-shrink-0" />
                <span className="text-white/70 text-xs md:text-sm font-medium text-center">
                  Bereits geclaimt — morgen wieder
                </span>
              </div>
            )}

            {allClaimed && (
              <div className="flex items-center justify-center gap-2 px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl border border-green-400/30 bg-green-400/10 backdrop-blur-md shadow-lg flex-1">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-green-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                <span className="text-green-300 text-xs md:text-sm font-bold drop-shadow-md text-center">
                  Komplett! Nächste Season bald
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== TIER GRID (Mobile-Friendly) ==================== */}
      <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-2xl border border-white/20 rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-pink-500/5 pointer-events-none"></div>
        
        <h3 className="relative z-10 text-base md:text-xl font-bold text-white mb-3 md:mb-4 drop-shadow-md px-1 md:px-0">Alle Belohnungen</h3>

        {/* Grid Layout - Responsive */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
          {rewards.map((tier) => {
            const isUnlocked = tier.tier <= currentTier;
            const isCurrent = tier.tier === nextTier;
            const isLocked = tier.tier > currentTier;

            return (
              <TierCard
                key={tier.tier}
                tier={tier}
                isUnlocked={isUnlocked}
                isCurrent={isCurrent}
                isLocked={isLocked}
                purchased={purchased}
                canClaim={canClaimToday && isCurrent}
              />
            );
          })}
        </div>
      </div>

      {/* ==================== PURCHASE DIALOG ==================== */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-white/20 bg-gradient-to-br from-yellow-950/90 via-black/90 to-black/90 backdrop-blur-3xl shadow-2xl max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-yellow-300 text-lg md:text-xl font-bold drop-shadow-md">
              <Crown className="w-5 h-5 md:w-6 md:h-6 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)] animate-pulse" />
              Premium Battle Pass kaufen?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between rounded-xl border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-md px-3 md:px-4 py-2 md:py-3 shadow-lg">
                  <span className="text-xs md:text-sm text-white/80 font-medium">Kosten</span>
                  <span className="flex items-center gap-1.5 md:gap-2 font-bold text-yellow-300 drop-shadow-md text-sm md:text-base">
                    <Coins className="w-4 h-4 md:w-5 md:h-5" />
                    1.500 Credits
                  </span>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-md p-3 md:p-4 text-xs md:text-sm text-white/90 shadow-lg">
                  <div className="mb-2 font-bold text-white drop-shadow-md">Du erhältst:</div>
                  <ul className="space-y-1.5 md:space-y-2 text-[10px] md:text-xs font-medium">
                    <li className="flex items-start gap-1.5 md:gap-2">
                      <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                      <span>Alle 30 Premium-Belohnungen</span>
                    </li>
                    <li className="flex items-start gap-1.5 md:gap-2">
                      <Gift className="w-3 h-3 md:w-4 md:h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                      <span>Doppelte Belohnungen pro Claim</span>
                    </li>
                    <li className="flex items-start gap-1.5 md:gap-2">
                      <Crown className="w-3 h-3 md:w-4 md:h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                      <span>Exklusive VIP-Pässe & Items</span>
                    </li>
                    <li className="flex items-start gap-1.5 md:gap-2">
                      <Ticket className="w-3 h-3 md:w-4 md:h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                      <span>Bei Duplikaten → Alternative Credits!</span>
                    </li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 md:gap-3 mt-2 flex-col sm:flex-row">
            <AlertDialogCancel className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md font-semibold rounded-xl shadow-lg w-full sm:w-auto">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurchase}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold border-0 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 w-full sm:w-auto relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <Crown className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2 relative z-10" />
              <span className="relative z-10">Für 1.500 Credits kaufen</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== TIER CARD COMPONENT ==================== 
function TierCard({ tier, isUnlocked, isCurrent, isLocked, purchased, canClaim }) {
  const freeReward = tier.free;
  const premiumReward = tier.premium;
  
  const FreeIcon = getRewardIcon(freeReward);
  const PremiumIcon = getRewardIcon(premiumReward);
  
  return (
    <div
      className={`
        relative rounded-xl md:rounded-2xl overflow-hidden border-2 transition-all duration-300
        ${isCurrent ? 'border-yellow-400 ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-black scale-105' : ''}
        ${isUnlocked && !isCurrent ? 'border-green-400/40' : ''}
        ${isLocked ? 'border-white/10' : ''}
      `}
      style={{
        background: isUnlocked 
          ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))' 
          : isCurrent 
          ? 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.15))'
          : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
      }}
    >
      {/* Tier Number */}
      <div className="absolute top-1 left-1 md:top-1.5 md:left-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-1.5 py-0.5 md:px-2 md:py-1 border border-white/20 z-10">
        <span className="text-[10px] md:text-xs font-black text-white drop-shadow-md">T{tier.tier}</span>
      </div>

      {/* Unlocked Badge */}
      {isUnlocked && (
        <div className="absolute top-1 right-1 md:top-1.5 md:right-1.5 z-10 animate-bounce">
          <Check className="w-4 h-4 md:w-5 md:h-5 p-0.5 md:p-1 rounded-full bg-green-500 text-white shadow-lg shadow-green-500/50" />
        </div>
      )}

      {/* Content */}
      <div className="p-2 md:p-3 space-y-1.5 md:space-y-2">
        {/* Free Reward */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-1.5 md:p-2 border border-white/10">
          <div className="flex items-center gap-1 mb-1">
            <div className="text-[8px] md:text-[9px] uppercase tracking-wider text-white/50 font-bold">Free</div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <FreeIcon className={`w-4 h-4 md:w-5 md:h-5 ${getRewardColor(freeReward)} flex-shrink-0`} />
            <span className="text-[10px] md:text-xs text-white/80 font-semibold line-clamp-2">{freeReward.label}</span>
          </div>
          {/* Alternative Credits Hinweis */}
          {freeReward.alternativeCredits && (
            <div className="text-[8px] md:text-[9px] text-yellow-300/70 mt-1 font-medium">
              Alt: {freeReward.alternativeCredits} Credits
            </div>
          )}
        </div>

        {/* Premium Reward */}
        <div className={`relative rounded-lg p-1.5 md:p-2 border transition-all ${purchased ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-black/20 border-white/10'}`}>
          <div className="flex items-center gap-1 mb-1">
            <Crown className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-400" />
            <div className="text-[8px] md:text-[9px] uppercase tracking-wider text-yellow-300/70 font-bold">Premium</div>
          </div>
          {!purchased && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-lg">
              <Lock className="w-4 h-4 md:w-5 md:h-5 text-white/40" />
            </div>
          )}
          <div className="flex items-center gap-1.5 md:gap-2">
            <PremiumIcon className={`w-4 h-4 md:w-5 md:h-5 ${purchased ? getRewardColor(premiumReward) : 'text-white/30'} flex-shrink-0`} />
            <span className={`text-[10px] md:text-xs font-semibold line-clamp-2 ${purchased ? 'text-yellow-200' : 'text-white/30'}`}>
              {premiumReward.label}
            </span>
          </div>
          {/* Alternative Credits Hinweis */}
          {purchased && premiumReward.alternativeCredits && (
            <div className="text-[8px] md:text-[9px] text-yellow-300/70 mt-1 font-medium">
              Alt: {premiumReward.alternativeCredits} Credits
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
