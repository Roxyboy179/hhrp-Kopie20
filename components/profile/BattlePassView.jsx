'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import {
  Crown, Lock, Check, Clock, Gift, Sparkles, AlertTriangle,
  Coins, Banknote, Star, Ticket, Car, Bike, Truck, Crosshair, Shield, X, Zap, Loader2,
  TrendingUp, Award, Gem, Share2,
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

// 🎉 Premium Kauf Animation (goldener Regen) - 3 Sekunden Burst nach Erfolg
function firePremiumConfetti() {
  const defaults = { startVelocity: 35, spread: 360, ticks: 80, zIndex: 9999 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Initial großer Burst
  confetti({
    particleCount: 150,
    spread: 90,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#FFA500', '#FFFF00', '#FFE4B5', '#FFC107'],
  });

  // Goldener Regen über 3 Sekunden
  const end = Date.now() + 3000;
  const interval = setInterval(() => {
    if (Date.now() > end) {
      clearInterval(interval);
      return;
    }
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
  }, 200);
}

export default function BattlePassView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  // ✅ NEU: Welcher Pass wurde im Confirm-Dialog ausgewählt
  const [selectedPassType, setSelectedPassType] = useState(null);
  // ✅ NEU: Auto-Renew Wunsch beim Kauf (default TRUE - standardmäßig aktiviert)
  const [purchaseAutorenew, setPurchaseAutorenew] = useState(true);
  // ✅ NEU: Toggle für Auto-Renew nach Kauf (separater Loading-State)
  const [autorenewLoading, setAutorenewLoading] = useState(false);
  
  // 🆕 NEU: States für neue Features
  const [skipping, setSkipping] = useState(false);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [buyingAutoclaim, setBuyingAutoclaim] = useState(false);
  const [autoclaimConfirmOpen, setAutoclaimConfirmOpen] = useState(false);
  const [buyingLifetime, setBuyingLifetime] = useState(false);
  const [lifetimeConfirmOpen, setLifetimeConfirmOpen] = useState(false);
  
  const pollingRef = useRef(null);
  const queueCheckRef = useRef(null);
  const confettiIntervalRef = useRef(null);
  // ✅ Refs für Queue-IDs (damit Closure funktioniert)
  const purchaseQueueIdRef = useRef(null);
  const claimQueueIdsRef = useRef([]);
  const cancelQueueIdRef = useRef(null);
  // ✅ Timestamps für Timeout (30s)
  const purchaseStartedAtRef = useRef(null);
  const claimStartedAtRef = useRef(null);
  const cancelStartedAtRef = useRef(null);
  const POLLING_TIMEOUT_MS = 45000; // 45 Sekunden Timeout

  useEffect(() => {
    loadBattlePass();
    
    // ✅ Check Queue Status alle 2 Sekunden (schneller als Battle Pass reload)
    queueCheckRef.current = setInterval(checkQueueStatus, 2000);
    
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (queueCheckRef.current) clearInterval(queueCheckRef.current);
      if (confettiIntervalRef.current) clearInterval(confettiIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Nur einmal beim Mount
  
  // ✅ Prüft ob Queue-Einträge gelöscht wurden = Bot fertig
  const checkQueueStatus = async () => {
    // Purchase prüfen (mit Ref!)
    if (purchaseQueueIdRef.current) {
      // Timeout-Check: Bot offline?
      if (purchaseStartedAtRef.current && Date.now() - purchaseStartedAtRef.current > POLLING_TIMEOUT_MS) {
        console.warn('[BP] Purchase Timeout — Bot antwortet nicht');
        purchaseQueueIdRef.current = null;
        purchaseStartedAtRef.current = null;
        if (confettiIntervalRef.current) {
          clearInterval(confettiIntervalRef.current);
          confettiIntervalRef.current = null;
        }
        setPurchasing(false);
        toast.dismiss('premium-purchase');
        toast.error('⚠️ HHRP Server antwortet nicht. Bitte versuche es später erneut.', { duration: 6000 });
        return;
      }
      
      try {
        const res = await fetch(`/api/battle-pass/queue/${purchaseQueueIdRef.current}`);
        const json = await res.json();
        
        if (json.processed) {
          // ✅ Eintrag gelöscht = HHRP Server hat verarbeitet!
          purchaseQueueIdRef.current = null;
          purchaseStartedAtRef.current = null;
          
          setPurchasing(false);
          toast.dismiss('premium-purchase');
          toast.success('✨ Premium Battle Pass aktiviert!', {
            icon: '👑',
            duration: 5000,
          });
          
          // 🎉 Confetti ERST nach erfolgreichem Abschluss (goldener Regen)
          firePremiumConfetti();
          
          // Lade Battle Pass neu
          loadBattlePass();
        }
      } catch (e) {
        console.error('[BP] Queue check error:', e);
      }
    }
    
    // Claims prüfen (mit Ref!)
    if (claimQueueIdsRef.current.length > 0) {
      // Timeout-Check: HHRP Server offline?
      if (claimStartedAtRef.current && Date.now() - claimStartedAtRef.current > POLLING_TIMEOUT_MS) {
        console.warn('[BP] Claim Timeout — HHRP Server antwortet nicht');
        claimQueueIdsRef.current = [];
        claimStartedAtRef.current = null;
        setClaiming(false);
        toast.dismiss('tier-claim');
        toast.error('⚠️ HHRP Server antwortet nicht. Bitte versuche es später erneut.', { duration: 6000 });
        return;
      }
      
      try {
        const checks = await Promise.all(
          claimQueueIdsRef.current.map(id => fetch(`/api/battle-pass/queue/${id}`).then(r => r.json()))
        );
        
        // Wenn alle gelöscht = HHRP Server fertig
        if (checks.every(c => c.processed)) {
          claimQueueIdsRef.current = [];
          claimStartedAtRef.current = null;
          setClaiming(false);
          toast.dismiss('tier-claim');
          toast.success('🎁 Tier geclaimt!', {
            duration: 4000,
          });
          
          // 🎊 Confetti ERST nach erfolgreichem Abschluss
          fireConfetti();
          
          // Lade Battle Pass neu
          loadBattlePass();
        }
      } catch (e) {
        console.error('[BP] Queue check error:', e);
      }
    }
    
    // Cancel prüfen (mit Ref!)
    if (cancelQueueIdRef.current) {
      // Timeout-Check: HHRP Server offline?
      if (cancelStartedAtRef.current && Date.now() - cancelStartedAtRef.current > POLLING_TIMEOUT_MS) {
        console.warn('[BP] Cancel Timeout — HHRP Server antwortet nicht');
        cancelQueueIdRef.current = null;
        cancelStartedAtRef.current = null;
        setCancelling(false);
        toast.dismiss('premium-cancel');
        toast.error('⚠️ HHRP Server antwortet nicht. Bitte versuche es später erneut.', { duration: 6000 });
        return;
      }
      
      try {
        const res = await fetch(`/api/battle-pass/queue/${cancelQueueIdRef.current}`);
        const json = await res.json();
        
        if (json.processed) {
          // ✅ Eintrag gelöscht = HHRP Server hat verarbeitet!
          cancelQueueIdRef.current = null;
          cancelStartedAtRef.current = null;
          setCancelling(false);
          toast.dismiss('premium-cancel');
          toast.success('✅ Premium Battle Pass gekündigt', {
            duration: 5000,
          });
          
          // Lade Battle Pass neu
          loadBattlePass();
        }
      } catch (e) {
        console.error('[BP] Queue check error:', e);
      }
    }
  };

  const loadBattlePass = async () => {
    try {
      const res = await fetch('/api/battle-pass/current');
      const json = await res.json();
      if (res.ok) {
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

  const handlePurchaseClick = (passType = 'premium') => {
    // Setze ersten Tier als default wenn kein passType übergeben wird
    const firstTier = (tiers || [])[0]?.id || 'premium';
    setSelectedPassType(passType || firstTier);
    setPurchaseAutorenew(true); // ✅ default: Auto-Verlängerung aktiviert
    setConfirmOpen(true);
  };
  const handleCancelClick = () => setCancelConfirmOpen(true);

  const handleCancel = async () => {
    setCancelling(true);
    setCancelConfirmOpen(false);
    
    try {
      const res = await fetch('/api/battle-pass/cancel', { method: 'POST' });
      const json = await res.json();
      
      if (res.ok) {
        cancelQueueIdRef.current = json.queueId;
        cancelStartedAtRef.current = Date.now();
        
        toast.loading('Warte auf HHRP Server...', {
          duration: 60000,
          id: 'premium-cancel',
        });
      } else {
        setCancelling(false);
        toast.error(json.error || 'Kündigung fehlgeschlagen');
      }
    } catch (error) {
      console.error('[BP] Cancel Error:', error);
      setCancelling(false);
      toast.error('Verbindungsfehler beim Kündigen');
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    setConfirmOpen(false);

    const passTypeToBuy = selectedPassType || 'premium';

    try {
      const res = await fetch('/api/battle-pass/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passType: passTypeToBuy, autorenew: purchaseAutorenew }),
      });
      const json = await res.json();
      
      if (res.ok) {
        // ✅ Speichere Queue-ID in Ref (nicht State!)
        purchaseQueueIdRef.current = json.queueId;
        purchaseStartedAtRef.current = Date.now();
        
        // ⏳ Kein Confetti hier — erst nach erfolgreicher Bestätigung in checkQueueStatus
        toast.loading('Warte auf HHRP Server...', {
          duration: 60000,
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

  // ✅ NEU: Auto-Renew Toggle (aktivieren/deaktivieren nach dem Kauf)
  const handleAutorenewToggle = async (enable) => {
    setAutorenewLoading(true);
    try {
      const res = await fetch('/api/battle-pass/autorenew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !!enable }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(
          enable
            ? '✅ Auto-Verlängerung aktiviert — Pass läuft automatisch weiter'
            : '✅ Auto-Verlängerung deaktiviert — endet zum Monatsende',
          { duration: 4000 }
        );
        // Battle-Pass Daten neu laden (zeigt aktualisierten Zustand)
        setTimeout(() => loadBattlePass(), 1500);
      } else {
        toast.error(json.error || 'Konnte Auto-Verlängerung nicht ändern');
      }
    } catch (error) {
      console.error('[BP] Autorenew Error:', error);
      toast.error('Verbindungsfehler');
    } finally {
      setAutorenewLoading(false);
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    
    try {
      const res = await fetch('/api/battle-pass/claim', { method: 'POST' });
      const json = await res.json();
      
      if (res.ok) {
        // ✅ Speichere Queue-IDs in Ref (nicht State!)
        claimQueueIdsRef.current = json.queueIds || [];
        claimStartedAtRef.current = Date.now();
        
        // ⏳ Kein Confetti hier — erst nach erfolgreicher Bestätigung in checkQueueStatus
        toast.loading('Warte auf HHRP Server...', {
          duration: 60000,
          id: 'tier-claim',
        });
        
        // Queue-Check läuft automatisch
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


  // 🆕 NEU: Tier Skip Handler
  const handleSkipTier = async () => {
    setSkipping(true);
    setSkipConfirmOpen(false);
    
    try {
      const res = await fetch('/api/battle-pass/skip-tier', { method: 'POST' });
      const json = await res.json();
      
      if (res.ok) {
        toast.success(`✅ Tier ${json.newTier} übersprungen! (${json.creditsSpent} Credits)`);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        loadBattlePass();
      } else {
        toast.error(json.error || 'Skip fehlgeschlagen');
      }
    } catch (error) {
      console.error('[BP] Skip Error:', error);
      toast.error('Verbindungsfehler');
    } finally {
      setSkipping(false);
    }
  };

  // 🆕 NEU: Auto-Claim kaufen Handler
  const handleBuyAutoclaim = async () => {
    setBuyingAutoclaim(true);
    setAutoclaimConfirmOpen(false);
    
    try {
      const res = await fetch('/api/battle-pass/buy-autoclaim', { method: 'POST' });
      const json = await res.json();
      
      if (res.ok) {
        toast.success('✨ Auto-Claim aktiviert! Ab jetzt wird automatisch geclaimt.');
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 }
        });
        loadBattlePass();
      } else {
        toast.error(json.error || 'Kauf fehlgeschlagen');
      }
    } catch (error) {
      console.error('[BP] Buy Autoclaim Error:', error);
      toast.error('Verbindungsfehler');
    } finally {
      setBuyingAutoclaim(false);
    }
  };

  // 🆕 NEU: Lifetime Pass kaufen Handler
  const handleBuyLifetime = async () => {
    setBuyingLifetime(true);
    setLifetimeConfirmOpen(false);
    
    try {
      const res = await fetch('/api/battle-pass/buy-lifetime', { method: 'POST' });
      const json = await res.json();
      
      if (res.ok) {
        toast.success('🎉 Lifetime Pass aktiviert! Du bekommst jeden Monat automatisch den Pass!', {
          duration: 6000
        });
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.4 }
        });
        loadBattlePass();
      } else {
        toast.error(json.error || 'Kauf fehlgeschlagen');
      }
    } catch (error) {
      console.error('[BP] Buy Lifetime Error:', error);
      toast.error('Verbindungsfehler');
    } finally {
      setBuyingLifetime(false);
    }
  };

  // 🆕 NEU: Share Progress Handler
  const handleShareProgress = () => {
    const { currentTier } = data.userProgress;
    const text = `🎮 Ich bin bei Tier ${currentTier}/30 im HHRP Battle Pass! Hol dir auch einen Pass und sichere dir exklusive Rewards! 🔥`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      toast.success('📋 In Zwischenablage kopiert!');
    }).catch(() => {
      toast.error('Konnte nicht kopieren');
    });
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

  const { userProgress, rewards, season, daysRemaining, pricing, canPurchase, minDaysToPurchase, tiers, pricingByTier } = data;
  const { currentTier, purchased, canClaimToday, missedDays, cancelled, cancelledAt, passType, autorenew, auto_claim_enabled, lifetime_pass } = userProgress;
  const seasonName = `${season.month}/${season.year}`;
  const progress = (currentTier / 30) * 100;
  const allClaimed = currentTier >= 30;
  const nextTier = currentTier + 1;
  const purchaseBlocked = canPurchase === false; // weniger als 5 Tage übrig
  const currentPrice = pricing?.current ?? 1500;
  const originalPrice = pricing?.original ?? 1500;
  const discountPercent = pricing?.discountPercent ?? 0;

  // ✅ 50% Rabatt in den letzten 10 Tagen
  const lastDaysDiscount = daysRemaining <= 10 ? 50 : 0;
  const tiersWithDiscount = (tiers || []).map(tier => {
    const basePrice = tier.cost;
    const discountedPrice = lastDaysDiscount > 0 
      ? Math.round(basePrice * (1 - lastDaysDiscount / 100))
      : basePrice;
    
    return {
      ...tier,
      originalCost: basePrice,
      currentPrice: discountedPrice,
      discountPercent: lastDaysDiscount,
    };
  });

  return (
    <div className="space-y-6">
      {/* ==================== HEADER  ==================== */}
      <div className="glass rounded-2xl p-6 border border-white/[0.08]">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-purple-500/5 animate-pulse pointer-events-none"></div>
        
        <div className="relative z-10">
          {/* Title */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251, 191, 36, 0.35)'
                }}
              >
                <Crown className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-widest mb-1 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Season {seasonName}
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white">Battle Pass</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 🆕 Share Button */}
              <button
                onClick={handleShareProgress}
                className="glass rounded-xl px-4 py-2 border border-white/10 hover:border-blue-400/40 transition-all hover:scale-105 flex items-center gap-2"
                title="Progress teilen"
              >
                <Share2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white hidden sm:inline">Teilen</span>
              </button>
              <div className="text-right">
                <div className="text-xs text-white/40 font-semibold mb-0.5">Noch</div>
                <div className="text-2xl font-black text-white">{daysRemaining}d</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-white/60 font-semibold">Tier {currentTier} / 30</span>
              <span className="text-white font-bold tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden bg-white/10 border border-white/20">
              <div
                className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
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
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-md animate-pulse">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)'
                }}
              >
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-red-300">
                  {missedDays} Tag{missedDays > 1 ? 'e' : ''} verpasst!
                </p>
                <p className="text-xs text-red-200/80">Diese Tiers sind verloren</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Purchase + Claim Buttons für Free User */}
            {!purchased && !purchasing && !purchaseBlocked && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setConfirmOpen(true)}
                  className="flex-1 h-14 rounded-2xl font-bold text-base text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] relative overflow-hidden group"
                  style={{ 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fb7185 100%)',
                    boxShadow: '0 8px 32px rgba(251, 191, 36, 0.4)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="flex items-center gap-2 relative z-10">
                    <Crown className="w-5 h-5" />
                    Battle Pass kaufen
                  </span>
                </Button>

                {/* Claim Button auch für Free User */}
                {canClaimToday && !allClaimed && !claiming && (
                  <Button
                    onClick={handleClaim}
                    className="h-14 px-6 rounded-2xl font-bold text-base text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] relative overflow-hidden group whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="flex items-center gap-2 relative z-10">
                      <Zap className="w-5 h-5" />
                      Tier {nextTier} einlösen
                    </span>
                  </Button>
                )}
              </div>
            )}

            {!purchased && !purchasing && purchaseBlocked && (
              <div className="flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-orange-500/30 bg-orange-500/10 backdrop-blur-md shadow-lg flex-1">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-orange-400 flex-shrink-0" />
                <span className="text-orange-300 text-xs md:text-sm font-bold text-center">
                  Nur noch {daysRemaining}d — Premium-Kauf ab &lt; {minDaysToPurchase ?? 5} Tagen gesperrt
                </span>
              </div>
            )}

            {/* Free User: Claiming Status */}
            {claiming && !purchased && (
              <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl md:rounded-2xl border border-green-400/40 bg-green-400/10 backdrop-blur-md shadow-lg">
                <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                <span className="text-green-300 font-bold text-sm">Warte auf HHRP Server...</span>
              </div>
            )}

            {/* Free User: Bereits geclaimt */}
            {!canClaimToday && !allClaimed && !claiming && missedDays === 0 && !purchased && (
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl md:rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md shadow-lg">
                <Clock className="w-4 h-4 text-white/50 flex-shrink-0" />
                <span className="text-white/70 text-sm font-medium">
                  Bereits geclaimt — morgen wieder
                </span>
              </div>
            )}

            {/* Free User: Komplett */}
            {allClaimed && !purchased && (
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl md:rounded-2xl border border-green-400/30 bg-green-400/10 backdrop-blur-md shadow-lg">
                <Sparkles className="w-4 h-4 text-green-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                <span className="text-green-300 text-sm font-bold drop-shadow-md">
                  Komplett! Nächste Season bald
                </span>
              </div>
            )}

            {purchasing && (
              <div className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-yellow-400/40 bg-yellow-400/10 backdrop-blur-md shadow-lg flex-1 sm:flex-initial">
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 animate-spin" />
                <span className="text-yellow-300 font-bold text-xs md:text-sm whitespace-nowrap">Warte auf HHRP Server...</span>
              </div>
            )}

            {purchased && !purchasing && !cancelling && !cancelled && (() => {
              const tierMeta = (tiersWithDiscount || []).find((t) => t.id === passType) || { name: 'Premium Pass', id: 'premium' };
              const tierColor = passType === 'elite' ? 'violet' : passType === 'ultra' ? 'rose' : 'yellow';
              return (
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  {/* Status Card */}
                  <div className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border backdrop-blur-md shadow-lg flex-1 ${
                    tierColor === 'violet' ? 'border-violet-400/40 bg-violet-400/10' :
                    tierColor === 'rose' ? 'border-rose-400/40 bg-rose-400/10' :
                    'border-yellow-400/40 bg-yellow-400/10'
                  }`}>
                    <Crown className={`w-4 h-4 md:w-5 md:h-5 ${
                      tierColor === 'violet' ? 'text-violet-300 drop-shadow-[0_0_4px_rgba(167,139,250,0.8)]' :
                      tierColor === 'rose' ? 'text-rose-300 drop-shadow-[0_0_4px_rgba(251,113,133,0.8)]' :
                      'text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.8)]'
                    }`} />
                    <span className={`font-bold text-xs md:text-sm whitespace-nowrap drop-shadow-md ${
                      tierColor === 'violet' ? 'text-violet-200' :
                      tierColor === 'rose' ? 'text-rose-200' :
                      'text-yellow-300'
                    }`}>
                      {tierMeta.name} aktiv
                    </span>
                  </div>

                  {/* Claim Button direkt daneben */}
                  {canClaimToday && !allClaimed && !claiming && (
                    <Button
                      onClick={handleClaim}
                      className="h-10 md:h-12 px-3 md:px-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 relative overflow-hidden group whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <span className="flex items-center gap-1.5 relative z-10">
                        <Zap className="w-4 h-4" />
                        Tier {nextTier} einlösen
                      </span>
                    </Button>
                  )}

                  {/* Cancel Button */}
                  <Button
                    onClick={handleCancelClick}
                    variant="outline"
                    size="sm"
                    className="h-10 md:h-12 px-3 md:px-4 rounded-xl md:rounded-2xl border border-red-400/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 backdrop-blur-md shadow-lg font-semibold text-xs md:text-sm whitespace-nowrap"
                    title="Premium Battle Pass kündigen"
                  >
                    <X className="w-4 h-4 md:w-4 md:h-4 mr-1" />
                    Kündigen
                  </Button>
                </div>
              );
            })()}

            {/* ✅ Gekündigt-Status: Premium läuft bis Monatsende weiter */}
            {purchased && cancelled && !cancelling && (() => {
              const tierMeta = (tiersWithDiscount || []).find((t) => t.id === passType) || { name: 'Premium Pass', id: 'premium' };
              const tierColor = passType === 'elite' ? 'violet' : passType === 'ultra' ? 'rose' : 'yellow';
              return (
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  {/* Gekündigt Status Card */}
                  <div className="flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-orange-400/40 bg-gradient-to-r from-orange-500/10 to-amber-500/10 backdrop-blur-md shadow-lg flex-1">
                    <X className="w-4 h-4 md:w-5 md:h-5 text-orange-400 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-orange-200 font-bold text-xs md:text-sm whitespace-nowrap drop-shadow-md leading-tight">
                        Gekündigt
                      </span>
                      <span className="text-orange-300/80 text-[10px] md:text-xs leading-tight">
                        Premium läuft noch {daysRemaining}d
                      </span>
                    </div>
                  </div>

                  {/* Claim Button direkt daneben */}
                  {canClaimToday && !allClaimed && !claiming && (
                    <Button
                      onClick={handleClaim}
                      className="h-10 md:h-12 px-3 md:px-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 relative overflow-hidden group whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <span className="flex items-center gap-1.5 relative z-10">
                        <Zap className="w-4 h-4" />
                        Tier {nextTier} einlösen
                      </span>
                    </Button>
                  )}
                </div>
              );
            })()}

            {cancelling && (
              <div className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-red-400/40 bg-red-400/10 backdrop-blur-md shadow-lg flex-1 sm:flex-initial">
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-red-400 animate-spin" />
                <span className="text-red-300 font-bold text-xs md:text-sm whitespace-nowrap">Warte auf HHRP Server...</span>
              </div>
            )}

            {claiming && (
              <div className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-green-400/40 bg-green-400/10 backdrop-blur-md shadow-lg flex-1">
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 animate-spin" />
                <span className="text-green-300 font-bold text-xs md:text-sm whitespace-nowrap">Warte auf HHRP Server...</span>
              </div>
            )}

            {/* Premium User: Bereits geclaimt + Skip Button */}
            {!canClaimToday && !allClaimed && !claiming && missedDays === 0 && purchased && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md shadow-lg flex-1">
                  <Clock className="w-4 h-4 text-white/50 flex-shrink-0" />
                  <span className="text-white/70 text-xs md:text-sm font-medium">
                    Bereits geclaimt — morgen wieder
                  </span>
                </div>
                {/* 🆕 Tier-Skip Button */}
                {!skipping && (
                  <Button
                    onClick={() => setSkipConfirmOpen(true)}
                    className="h-10 md:h-12 px-3 md:px-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Skip (50 Credits)
                  </Button>
                )}
                {skipping && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-orange-400/40 bg-orange-400/10">
                    <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                  </div>
                )}
              </div>
            )}

            {allClaimed && purchased && (
              <div className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-green-400/30 bg-green-400/10 backdrop-blur-md shadow-lg">
                <Sparkles className="w-4 h-4 text-green-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                <span className="text-green-300 text-xs md:text-sm font-bold drop-shadow-md">
                  Komplett! Nächste Season bald
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🆕 ═══════════════════════════════════════════════════════════════
          PREMIUM FEATURES: Auto-Claim & Lifetime Pass
          ═══════════════════════════════════════════════════════════════ */}
      {/* DEBUG TEST BUTTON */}
      <button 
        onClick={() => {
          console.log('🔥 TEST BUTTON CLICKED!');
          alert('Test Button funktioniert!');
          setAutoclaimConfirmOpen(true);
        }}
        style={{ background: 'red', color: 'white', padding: '10px', borderRadius: '8px', fontWeight: 'bold' }}
      >
        🔥 DEBUG: Klick mich zum Testen
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Auto-Claim Feature Card */}
        {!auto_claim_enabled && passType !== 'ultra' && (
          <div className="glass rounded-2xl p-5 border border-blue-400/20 hover:border-blue-400/40 transition-all">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/15 border border-blue-400/30">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">Auto-Claim</h3>
                <p className="text-sm text-white/60 mt-1">
                  Jeden Tag automatisch claimen — nie wieder verpassen!
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-black text-white">
                100 <span className="text-sm text-white/50">Credits</span>
              </div>
              <Button
                onClick={() => setAutoclaimConfirmOpen(true)}
                disabled={buyingAutoclaim}
                className="rounded-xl font-bold"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
              >
                {buyingAutoclaim ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaufen'}
              </Button>
            </div>
            <div className="text-xs text-yellow-300 mt-2">
              ⭐ Ultra+ User haben Auto-Claim kostenlos!
            </div>
          </div>
        )}

        {/* Auto-Claim Active Status */}
        {(auto_claim_enabled || passType === 'ultra') && (
          <div className="glass rounded-2xl p-5 border border-green-400/30 bg-green-500/10">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-500/20 border border-green-400/40">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">Auto-Claim Aktiv ✨</h3>
                <p className="text-sm text-green-300 mt-1">
                  {passType === 'ultra' 
                    ? 'Als Ultra+ User hast du Auto-Claim kostenlos!' 
                    : 'Jeden Tag wird automatisch geclaimt!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lifetime Pass Feature Card */}
        {!lifetime_pass && (
          <div className="glass rounded-2xl p-5 border border-purple-400/20 hover:border-purple-400/40 transition-all">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/15 border border-purple-400/30">
                <Crown className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">Lifetime Pass 👑</h3>
                <p className="text-sm text-white/60 mt-1">
                  Einmalige Zahlung für <strong>alle zukünftigen Seasons</strong>!
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-black text-white">
                6000 <span className="text-sm text-white/50">Credits</span>
              </div>
              <Button
                onClick={() => setLifetimeConfirmOpen(true)}
                disabled={buyingLifetime}
                className="rounded-xl font-bold"
                style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' }}
              >
                {buyingLifetime ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaufen'}
              </Button>
            </div>
            <div className="text-xs text-emerald-300 mt-2">
              💎 Jeden Monat automatisch Ultra+ Pass!
            </div>
          </div>
        )}

        {/* Lifetime Pass Active Status */}
        {lifetime_pass && (
          <div className="glass rounded-2xl p-5 border border-purple-400/40 bg-purple-500/10">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/20 border border-purple-400/50">
                <Crown className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">Lifetime Pass Aktiv 👑</h3>
                <p className="text-sm text-purple-300 mt-1">
                  Du bekommst jeden Monat automatisch den Ultra+ Pass!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== TIER GRID (Mobile-Friendly) ==================== */}
      <div className="glass rounded-2xl p-6 border border-white/[0.08]">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-400" />
          Alle Belohnungen
        </h3>

        {/* Grid Layout - Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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

      {/* ==================== PURCHASE DIALOG - Mit Tier-Auswahl ==================== */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="glass border border-white/[0.12] max-w-lg mx-4">
          {(() => {
            const selectedTier = (tiersWithDiscount || []).find((t) => t.id === selectedPassType) || (tiersWithDiscount || [])[0];
            if (!selectedTier) return null;
            const tierPrice = selectedTier.currentPrice ?? selectedTier.cost;
            const tierDiscount = selectedTier.discountPercent ?? 0;
            const tierOriginal = selectedTier.originalCost || selectedTier.cost;
            
            // Tier-spezifische Farben
            const tierColors = {
              premium: { icon: Crown, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.35)' },
              elite: { icon: Gem, color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.35)' },
              ultra: { icon: Star, color: '#fb7185', bg: 'rgba(251, 113, 133, 0.15)', border: 'rgba(251, 113, 133, 0.35)' },
            };
            const tc = tierColors[selectedTier.id] || tierColors.premium;
            const TierIcon = tc.icon;
            
            return (
          <>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-white text-center mb-3">
              Battle Pass kaufen
            </AlertDialogTitle>
            
            {/* Tier-Auswahl Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(tiersWithDiscount || []).map((t) => {
                const isSelected = selectedPassType === t.id;
                const tColor = tierColors[t.id] || tierColors.premium;
                const TIcon = tColor.icon;
                
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedPassType(t.id)}
                    className={`relative rounded-xl p-3 transition-all duration-300 hover:scale-105 ${
                      isSelected ? 'ring-2' : ''
                    }`}
                    style={{
                      background: tColor.bg,
                      border: `2px solid ${isSelected ? tColor.color : tColor.border}`,
                      boxShadow: isSelected ? `0 4px 16px ${tColor.color}40` : 'none'
                    }}
                  >
                    <TIcon className="w-6 h-6 mx-auto mb-1" style={{ color: tColor.color }} />
                    <div className="text-xs font-bold" style={{ color: tColor.color }}>
                      {t.name.replace(' Pass', '')}
                    </div>
                  </button>
                );
              })}
            </div>

            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {/* Preis-Info */}
                <div className="glass rounded-xl border border-white/[0.08] px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70 font-medium">Kosten heute</span>
                    <span className="flex items-center gap-2 font-bold text-white text-base">
                      <Coins className="w-5 h-5" style={{ color: tc.color }} />
                      {tierPrice.toLocaleString('de-DE')} Credits
                    </span>
                  </div>
                  {tierDiscount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/50">Originalpreis</span>
                      <span className="line-through text-white/40 font-semibold">{tierOriginal.toLocaleString('de-DE')} Credits</span>
                    </div>
                  )}
                  {tierDiscount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-300 font-bold">Tages-Rabatt</span>
                      <span className="text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded-md border border-emerald-500/30">
                        −{tierDiscount}% ({(tierOriginal - tierPrice).toLocaleString('de-DE')} Credits gespart)
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                    <span className="text-white/50">Reward-Reduktion</span>
                    <span className="text-rose-300 font-bold bg-rose-500/20 px-1.5 py-0.5 rounded-md border border-rose-500/30">
                      −{selectedTier.reductionPercent}% auf alle Beträge
                    </span>
                  </div>
                </div>

                {/* Auto-Renew Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 backdrop-blur-md p-3 transition-colors">
                  <input
                    type="checkbox"
                    checked={purchaseAutorenew}
                    onChange={(e) => setPurchaseAutorenew(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-emerald-500 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1 text-sm">
                    <div className="font-bold text-emerald-300">Auto-Verlängerung aktivieren</div>
                    <div className="text-xs text-white/60 mt-0.5">
                      Pass läuft jeden Monat automatisch weiter — Discord-Rolle bleibt dauerhaft. Jederzeit kündbar.
                    </div>
                  </div>
                </label>

                {/* Vorteile */}
                <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-md p-4 text-sm text-white/90">
                  <div className="mb-2 font-bold text-white">Du erhältst:</div>
                  <ul className="space-y-2 text-xs font-medium">
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tc.color }} />
                      <span>Alle 30 Premium-Belohnungen (mit −{selectedTier.reductionPercent}% Reduktion)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Gift className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tc.color }} />
                      <span>Doppelte Belohnungen pro Claim (Free + Premium)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <TierIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tc.color }} />
                      <span>Exklusive Discord-Rolle für 1 Monat{purchaseAutorenew ? ' (verlängert sich automatisch)' : ''}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Ticket className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tc.color }} />
                      <span>Bei Item-Duplikaten → Alternative Credits!</span>
                    </li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-2">
            <AlertDialogCancel className="glass border border-white/[0.12] text-white hover:bg-white/5 font-semibold rounded-xl">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurchase}
              className="rounded-xl font-bold border-0"
              style={{
                background: tc.color.includes('#fbbf24') 
                  ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' 
                  : tc.color.includes('#a78bfa')
                  ? 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)'
                  : 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
                color: tc.color.includes('#fbbf24') ? '#1a1a1a' : '#fff',
                boxShadow: `0 8px 24px ${tc.color}60`
              }}
            >
              <TierIcon className="w-5 h-5 mr-2" />
              Für {tierPrice.toLocaleString('de-DE')} Credits kaufen
            </AlertDialogAction>
          </AlertDialogFooter>
          </>
            );
          })()}
        </AlertDialogContent>
      </AlertDialog>

      {/* ==================== CANCEL DIALOG ==================== */}
      <AlertDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <AlertDialogContent className="glass border border-white/[0.12] max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(251, 146, 60, 0.15)',
                  border: '1px solid rgba(251, 146, 60, 0.35)'
                }}
              >
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              Premium Battle Pass kündigen?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-3">
                <div className="glass rounded-xl border border-emerald-500/20 p-4 text-sm text-white/90">
                  <div className="mb-2 font-bold text-emerald-300 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Gute Nachricht — Du verlierst nichts:
                  </div>
                  <ul className="space-y-2 text-xs font-medium">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                      <span>Premium-Vorteile laufen <strong>bis Monatsende</strong> ({daysRemaining}d) weiter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                      <span>Du kannst weiterhin <strong>Free + Premium</strong> Rewards claimen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                      <span>Bereits eingelöste Belohnungen bleiben erhalten</span>
                    </li>
                  </ul>
                </div>
                <div className="glass rounded-xl border border-orange-500/20 p-3 text-xs text-orange-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-300 mt-0.5 flex-shrink-0" />
                  <span>Im neuen Monat startet die Saison automatisch <strong>ohne Premium</strong>. Die Credits werden nicht erstattet.</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-2 flex-col sm:flex-row">
            <AlertDialogCancel className="glass border border-white/[0.12] text-white hover:bg-white/5 font-semibold rounded-xl w-full sm:w-auto">
              Doch behalten
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="rounded-xl font-bold border-0 w-full sm:w-auto"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4)'
              }}
            >
              <X className="w-5 h-5 mr-2" />
              Ja, kündigen
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


      {/* 🆕 ═══════════════════════════════════════════════════════════════
          TIER-SKIP DIALOG
          ═══════════════════════════════════════════════════════════════ */}
      <AlertDialog open={skipConfirmOpen} onOpenChange={setSkipConfirmOpen}>
        <AlertDialogContent className="glass border border-white/[0.12] max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-orange-500/15 border border-orange-400/35">
                <Zap className="w-6 h-6 text-orange-400" />
              </div>
              Tier überspringen?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-3">
                <div className="glass rounded-xl border border-white/[0.08] p-4">
                  <p className="text-sm text-white/90">
                    Du kannst <strong>Tier {nextTier}</strong> für <strong className="text-orange-400">50 Credits</strong> überspringen.
                  </p>
                  <p className="text-xs text-white/60 mt-2">
                    ⚡ Dein Tier erhöht sich sofort, aber du erhältst <strong>keine Belohnungen</strong> für diesen Tier.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-2">
            <AlertDialogCancel className="glass border border-white/[0.12] text-white hover:bg-white/5 font-semibold rounded-xl">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSkipTier}
              className="rounded-xl font-bold border-0"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)'
              }}
            >
              <Zap className="w-5 h-5 mr-2" />
              Für 50 Credits überspringen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🆕 ═══════════════════════════════════════════════════════════════
          AUTO-CLAIM KAUFEN DIALOG
          ═══════════════════════════════════════════════════════════════ */}
      <AlertDialog open={autoclaimConfirmOpen} onOpenChange={setAutoclaimConfirmOpen}>
        <AlertDialogContent className="glass border border-white/[0.12] max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-500/15 border border-blue-400/35">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              Auto-Claim aktivieren?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-3">
                <div className="glass rounded-xl border border-white/[0.08] p-4">
                  <p className="text-sm text-white/90 mb-3">
                    <strong className="text-blue-400">Auto-Claim</strong> für <strong>100 Credits</strong> einmalig kaufen.
                  </p>
                  <ul className="space-y-2 text-xs font-medium">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
                      <span className="text-white/80">Jeden Tag <strong>automatisch claimen</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
                      <span className="text-white/80">Nie wieder Tiers verpassen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
                      <span className="text-white/80">Gilt für diese Season</span>
                    </li>
                  </ul>
                </div>
                <div className="text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-2">
                  ⭐ Ultra+ User haben Auto-Claim bereits kostenlos!
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-2">
            <AlertDialogCancel className="glass border border-white/[0.12] text-white hover:bg-white/5 font-semibold rounded-xl">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBuyAutoclaim}
              className="rounded-xl font-bold border-0"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
              }}
            >
              <Zap className="w-5 h-5 mr-2" />
              Für 100 Credits kaufen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🆕 ═══════════════════════════════════════════════════════════════
          LIFETIME PASS KAUFEN DIALOG
          ═══════════════════════════════════════════════════════════════ */}
      <AlertDialog open={lifetimeConfirmOpen} onOpenChange={setLifetimeConfirmOpen}>
        <AlertDialogContent className="glass border border-white/[0.12] max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-purple-500/15 border border-purple-400/35">
                <Crown className="w-6 h-6 text-purple-400" />
              </div>
              Lifetime Pass kaufen? 👑
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-3">
                <div className="glass rounded-xl border border-white/[0.08] p-4">
                  <p className="text-sm text-white/90 mb-3">
                    <strong className="text-purple-400">Lifetime Pass</strong> für <strong>6000 Credits</strong> einmalig kaufen.
                  </p>
                  <ul className="space-y-2 text-xs font-medium">
                    <li className="flex items-start gap-2">
                      <Crown className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0" />
                      <span className="text-white/80"><strong>Alle zukünftigen Seasons</strong> automatisch</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0" />
                      <span className="text-white/80">Jeden Monat <strong>Ultra+ Pass</strong> (beste Rewards)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0" />
                      <span className="text-white/80">Nie wieder kaufen müssen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0" />
                      <span className="text-white/80">Discord-Rolle dauerhaft</span>
                    </li>
                  </ul>
                </div>
                <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-2">
                  💎 Beste Investition! Spar Credits für andere Items.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-2">
            <AlertDialogCancel className="glass border border-white/[0.12] text-white hover:bg-white/5 font-semibold rounded-xl">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBuyLifetime}
              className="rounded-xl font-bold border-0"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                boxShadow: '0 8px 24px rgba(168, 85, 247, 0.4)'
              }}
            >
              <Crown className="w-5 h-5 mr-2" />
              Für 6000 Credits kaufen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

}
