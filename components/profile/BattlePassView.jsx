'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import {
  Crown, Lock, Check, Clock, Gift, Sparkles, AlertTriangle,
  Coins, Banknote, Star, Ticket, Car, Bike, Truck, Crosshair, Shield, X, Zap, Loader2,
  TrendingUp, Award, Gem, Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const rewardsTrackRef = useRef(null);
  // ✅ Refs für Queue-IDs (damit Closure funktioniert)
  const purchaseQueueIdRef = useRef(null);
  const claimQueueIdsRef = useRef([]);
  const cancelQueueIdRef = useRef(null);
  const skipQueueIdRef = useRef(null);
  const autoclaimQueueIdRef = useRef(null);
  const lifetimeQueueIdRef = useRef(null);
  // ✅ Timestamps für Timeout (30s)
  const purchaseStartedAtRef = useRef(null);
  const claimStartedAtRef = useRef(null);
  const cancelStartedAtRef = useRef(null);
  const skipStartedAtRef = useRef(null);
  const autoclaimStartedAtRef = useRef(null);
  const lifetimeStartedAtRef = useRef(null);
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
          toast.success('Premium Battle Pass aktiviert!', {
            id: 'premium-purchase-success',
            icon: <Crown className="w-5 h-5 text-yellow-400" />,
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
          
          // ✅ Eindeutiger Success-Toast mit ID um Duplikate zu vermeiden
          toast.success('Tier geclaimt!', {
            id: 'tier-claim-success',
            duration: 4000,
            icon: <Gift className="w-5 h-5 text-purple-400" />,
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
          toast.success('Premium Battle Pass gekündigt', {
            id: 'premium-cancel-success',
            icon: <X className="w-5 h-5 text-red-400" />,
            duration: 5000,
          });
          
          // Lade Battle Pass neu
          loadBattlePass();
        }
      } catch (e) {
        console.error('[BP] Queue check error:', e);
      }
    }

    // 🆕 Skip-Tier prüfen
    if (skipQueueIdRef.current) {
      if (skipStartedAtRef.current && Date.now() - skipStartedAtRef.current > POLLING_TIMEOUT_MS) {
        console.warn('[BP] Skip Timeout — HHRP Server antwortet nicht');
        skipQueueIdRef.current = null;
        skipStartedAtRef.current = null;
        setSkipping(false);
        toast.dismiss('tier-skip');
        toast.error('⚠️ HHRP Server antwortet nicht. Bitte versuche es später erneut.', { duration: 6000 });
        return;
      }

      try {
        const res = await fetch(`/api/battle-pass/queue/${skipQueueIdRef.current}`);
        const json = await res.json();

        if (json.processed) {
          skipQueueIdRef.current = null;
          skipStartedAtRef.current = null;
          setSkipping(false);
          toast.dismiss('tier-skip');
          toast.success('Tier übersprungen!', { 
            id: 'tier-skip-success', 
            icon: <Zap className="w-5 h-5 text-orange-400" />,
            duration: 4000 
          });
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          loadBattlePass();
        }
      } catch (e) {
        console.error('[BP] Skip queue check error:', e);
      }
    }

    // 🆕 Auto-Claim Kauf prüfen
    if (autoclaimQueueIdRef.current) {
      if (autoclaimStartedAtRef.current && Date.now() - autoclaimStartedAtRef.current > POLLING_TIMEOUT_MS) {
        console.warn('[BP] Autoclaim Timeout — HHRP Server antwortet nicht');
        autoclaimQueueIdRef.current = null;
        autoclaimStartedAtRef.current = null;
        setBuyingAutoclaim(false);
        toast.dismiss('autoclaim-buy');
        toast.error('⚠️ HHRP Server antwortet nicht. Bitte versuche es später erneut.', { duration: 6000 });
        return;
      }

      try {
        const res = await fetch(`/api/battle-pass/queue/${autoclaimQueueIdRef.current}`);
        const json = await res.json();

        if (json.processed) {
          autoclaimQueueIdRef.current = null;
          autoclaimStartedAtRef.current = null;
          setBuyingAutoclaim(false);
          toast.dismiss('autoclaim-buy');
          toast.success('Auto-Claim aktiviert! Ab jetzt wird automatisch geclaimt.', { 
            id: 'autoclaim-buy-success',
            icon: <Zap className="w-5 h-5 text-blue-400" />,
            duration: 5000 
          });
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
          loadBattlePass();
        }
      } catch (e) {
        console.error('[BP] Autoclaim queue check error:', e);
      }
    }

    // 🆕 Lifetime Pass Kauf prüfen
    if (lifetimeQueueIdRef.current) {
      if (lifetimeStartedAtRef.current && Date.now() - lifetimeStartedAtRef.current > POLLING_TIMEOUT_MS) {
        console.warn('[BP] Lifetime Timeout — HHRP Server antwortet nicht');
        lifetimeQueueIdRef.current = null;
        lifetimeStartedAtRef.current = null;
        setBuyingLifetime(false);
        toast.dismiss('lifetime-buy');
        toast.error('⚠️ HHRP Server antwortet nicht. Bitte versuche es später erneut.', { duration: 6000 });
        return;
      }

      try {
        const res = await fetch(`/api/battle-pass/queue/${lifetimeQueueIdRef.current}`);
        const json = await res.json();

        if (json.processed) {
          lifetimeQueueIdRef.current = null;
          lifetimeStartedAtRef.current = null;
          setBuyingLifetime(false);
          toast.dismiss('lifetime-buy');
          toast.success('Lifetime Pass aktiviert! Du bekommst jeden Monat automatisch den Ultra+ Pass!', { 
            id: 'lifetime-buy-success',
            icon: <Crown className="w-5 h-5 text-purple-400" />,
            duration: 6000 
          });
          confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 } });
          loadBattlePass();
        }
      } catch (e) {
        console.error('[BP] Lifetime queue check error:', e);
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
        
        toast.dismiss('premium-cancel');
        toast.loading('Warte auf HHRP Server...', {
          duration: 60000,
          id: 'premium-cancel',
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
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
    if (purchasing) return; // ✅ Guard
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
        toast.dismiss('premium-purchase');
        toast.loading('Warte auf HHRP Server...', {
          duration: 60000,
          id: 'premium-purchase',
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
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
    if (claiming) return; // ✅ Guard: Verhindert doppelte Aufrufe
    setClaiming(true);
    
    try {
      const res = await fetch('/api/battle-pass/claim', { method: 'POST' });
      const json = await res.json();
      
      if (res.ok) {
        // ✅ Speichere Queue-IDs in Ref (nicht State!)
        claimQueueIdsRef.current = json.queueIds || [];
        claimStartedAtRef.current = Date.now();
        
        // ⏳ Kein Confetti hier — erst nach erfolgreicher Bestätigung in checkQueueStatus
        toast.dismiss('tier-claim'); // ✅ Dismiss any existing toast first
        toast.loading('Warte auf HHRP Server...', {
          duration: 60000,
          id: 'tier-claim',
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
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
        // ✅ Queue-Pattern: Bot verarbeitet asynchron
        if (json.queueId) {
          skipQueueIdRef.current = json.queueId;
          skipStartedAtRef.current = Date.now();
          toast.dismiss('tier-skip');
          toast.loading('Warte auf HHRP Server...', {
            duration: 60000,
            id: 'tier-skip',
            icon: <Loader2 className="w-4 h-4 animate-spin" />,
          });
        } else {
          // Fallback (sollte mit neuer API nicht mehr passieren)
          toast.success(`✅ Tier übersprungen! (${json.creditsSpent} Credits)`);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          setSkipping(false);
          loadBattlePass();
        }
      } else {
        setSkipping(false);
        toast.error(json.error || 'Skip fehlgeschlagen');
      }
    } catch (error) {
      console.error('[BP] Skip Error:', error);
      setSkipping(false);
      toast.error('Verbindungsfehler');
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
        if (json.queueId) {
          autoclaimQueueIdRef.current = json.queueId;
          autoclaimStartedAtRef.current = Date.now();
          toast.dismiss('autoclaim-buy');
          toast.loading('Warte auf HHRP Server...', {
            duration: 60000,
            id: 'autoclaim-buy',
            icon: <Loader2 className="w-4 h-4 animate-spin" />,
          });
        } else {
          toast.success('✨ Auto-Claim aktiviert! Ab jetzt wird automatisch geclaimt.');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
          setBuyingAutoclaim(false);
          loadBattlePass();
        }
      } else {
        setBuyingAutoclaim(false);
        toast.error(json.error || 'Kauf fehlgeschlagen');
      }
    } catch (error) {
      console.error('[BP] Buy Autoclaim Error:', error);
      setBuyingAutoclaim(false);
      toast.error('Verbindungsfehler');
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
        if (json.queueId) {
          lifetimeQueueIdRef.current = json.queueId;
          lifetimeStartedAtRef.current = Date.now();
          toast.dismiss('lifetime-buy');
          toast.loading('Warte auf HHRP Server...', {
            duration: 60000,
            id: 'lifetime-buy',
            icon: <Loader2 className="w-4 h-4 animate-spin" />,
          });
        } else {
          toast.success('🎉 Lifetime Pass aktiviert! Du bekommst jeden Monat automatisch den Pass!', {
            duration: 6000
          });
          confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 } });
          setBuyingLifetime(false);
          loadBattlePass();
        }
      } else {
        setBuyingLifetime(false);
        toast.error(json.error || 'Kauf fehlgeschlagen');
      }
    } catch (error) {
      console.error('[BP] Buy Lifetime Error:', error);
      setBuyingLifetime(false);
      toast.error('Verbindungsfehler');
    }
  };

  // 🆕 NEU: Share Progress Handler
  const handleShareProgress = () => {
    const { currentTier } = data.userProgress;
    const text = `🎮 Ich bin bei Tier ${currentTier}/30 im HHRP Battle Pass! Hol dir auch einen Pass und sichere dir exklusive Rewards! 🔥`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      toast.success('In Zwischenablage kopiert!', {
        icon: <Share2 className="w-5 h-5 text-blue-400" />,
      });
    }).catch(() => {
      toast.error('Konnte nicht kopieren');
    });
  };

  // 🆕 Auto-scroll to current tier in horizontal track
  // ⚠️ Hooks MÜSSEN vor Early Returns kommen (rules of hooks)
  const _currentTierForScroll = data?.userProgress?.currentTier;
  useEffect(() => {
    if (!rewardsTrackRef.current || !_currentTierForScroll) return;
    const el = rewardsTrackRef.current.querySelector(`[data-tier="${_currentTierForScroll}"]`);
    if (el) {
      const containerWidth = rewardsTrackRef.current.clientWidth;
      const cardLeft = el.offsetLeft;
      const cardWidth = el.clientWidth;
      const scrollTo = cardLeft - (containerWidth / 2) + (cardWidth / 2);
      rewardsTrackRef.current.scrollTo({ left: Math.max(0, scrollTo), behavior: 'smooth' });
    }
  }, [_currentTierForScroll]);

  // 🆕 Mausrad scrollt horizontal wenn Cursor über dem Track ist
  useEffect(() => {
    const el = rewardsTrackRef.current;
    if (!el || !data) return;
    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      // Nur intercepten wenn der Track horizontal scrollen kann
      const canScrollHorizontally = el.scrollWidth > el.clientWidth;
      if (!canScrollHorizontally) return;
      e.preventDefault();
      // Multiplier für angenehmes Scrollen
      el.scrollLeft += e.deltaY * 1.2;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [data]);

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
  const { currentTier, purchased, canClaimToday, missedDays, missedTiers, nextTier: nextTierFromBackend, cancelled, cancelledAt, passType, autorenew, auto_claim_enabled, lifetime_pass } = userProgress;
  const seasonName = `${season.month}/${season.year}`;
  const progress = (currentTier / 30) * 100;
  const allClaimed = currentTier >= 30;
  const nextTier = nextTierFromBackend || (currentTier + 1); // Fallback für alte API
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
    <div className="space-y-4 md:space-y-6">
      {/* ==================== TABS ==================== */}
      <Tabs defaultValue="battlepass" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-white/5 border border-white/10 p-1 rounded-xl md:rounded-2xl h-auto">
          <TabsTrigger 
            value="battlepass" 
            className="rounded-lg md:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:text-white text-white/60 font-bold py-2 md:py-3 text-sm md:text-base transition-all flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4 md:w-5 md:h-5" />
            <span>Battle Pass</span>
          </TabsTrigger>
          <TabsTrigger 
            value="benefits" 
            className="rounded-lg md:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-white text-white/60 font-bold py-2 md:py-3 text-sm md:text-base transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
            <span>Vorteile</span>
          </TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: BATTLE PASS ==================== */}
        <TabsContent value="battlepass" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
          <div className="relative">
            <div className="relative z-10 space-y-4 md:space-y-6">
          {/* ==================== PROGRESS BANNER (Real Battle Pass Look) ==================== */}
          <div
            className="rounded-xl border p-4 md:p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(168, 85, 247, 0.05))',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Top row: Current Tier + Days + Share */}
            <div className="flex items-start justify-between gap-3 mb-4 md:mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid rgba(251, 191, 36, 0.35)'
                  }}
                >
                  <Crown className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-white/40 text-[10px] md:text-xs uppercase tracking-widest mb-0.5 font-bold">
                    <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    Season {seasonName}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl md:text-3xl font-black text-white tabular-nums leading-none">Tier {currentTier}</span>
                    <span className="text-white/40 text-sm md:text-base font-medium">/ 30</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleShareProgress}
                  className="rounded-lg px-2.5 md:px-3 py-1.5 md:py-2 border border-white/10 hover:border-blue-400/40 hover:bg-white/5 transition-all flex items-center gap-1.5"
                  title="Progress teilen"
                  style={{ background: 'rgba(255, 255, 255, 0.04)' }}
                >
                  <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                  <span className="text-xs md:text-sm font-semibold text-white hidden sm:inline">Teilen</span>
                </button>
                <div className="text-right">
                  <div className="text-[10px] md:text-xs text-white/40 font-semibold mb-0.5 uppercase tracking-wider">Noch</div>
                  <div className="text-lg md:text-2xl font-black text-white tabular-nums leading-none">{daysRemaining}d</div>
                </div>
              </div>
            </div>

            {/* Progress Percentage */}
            <div className="flex items-center justify-between mb-2 md:mb-3 text-xs md:text-sm">
              <span className="text-white/50 font-semibold uppercase tracking-wider text-[10px] md:text-xs">Fortschritt</span>
              <span className="text-white font-black tabular-nums text-base md:text-lg">{Math.round(progress)}%</span>
            </div>

            {/* Battle Pass Track with Milestones */}
            <div className="relative pt-2 pb-8 md:pb-10">
              {/* Background track */}
              <div className="h-2 md:h-2.5 rounded-full bg-white/5 border border-white/10 relative overflow-hidden">
                {/* Filled portion */}
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #ef4444 100%)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer rounded-full"></div>
                </div>
              </div>

              {/* Milestone Markers */}
              {[1, 5, 10, 15, 20, 25, 30].map((m) => {
                const reached = currentTier >= m;
                const left = ((m - 1) / 29) * 100;
                return (
                  <div
                    key={m}
                    className="absolute top-2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{ left: `${left}%`, top: 'calc(0.5rem + 4px)' }}
                  >
                    <div
                      className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-2 transition-all duration-300 ${
                        reached
                          ? 'bg-amber-400 border-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                          : 'bg-white/[0.08] border-white/20'
                      }`}
                    />
                    <div className={`mt-2 text-[9px] md:text-[10px] font-bold tabular-nums ${reached ? 'text-amber-300' : 'text-white/40'}`}>
                      T{m}
                    </div>
                  </div>
                );
              })}

              {/* Animated Current Tier Marker (floating crown) */}
              {currentTier > 0 && currentTier < 30 && (
                <div
                  className="absolute -translate-x-1/2 transition-all duration-700"
                  style={{ left: `${progress}%`, top: 'calc(0.5rem - 6px)' }}
                >
                  <div className="relative w-5 h-5 md:w-6 md:h-6">
                    <div className="absolute inset-0 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_16px_rgba(251,191,36,0.8)] flex items-center justify-center animate-pulse">
                      <Crown className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-900" />
                    </div>
                  </div>
                </div>
              )}

              {/* Final Trophy at Tier 30 */}
              {currentTier >= 30 && (
                <div
                  className="absolute -translate-x-1/2"
                  style={{ left: '100%', top: 'calc(0.5rem - 8px)' }}
                >
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 border-2 border-white shadow-[0_0_20px_rgba(251,191,36,0.9)] flex items-center justify-center animate-pulse">
                    <Award className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                </div>
              )}
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
            {/* ✅ ENTFERNT: Duplikat "claiming" Block - wird weiter unten für ALLE User angezeigt (Zeile 1003) */}

            {/* ✅ ENTFERNT: Duplikat "Bereits geclaimt" Block - wird weiter unten für ALLE User angezeigt */}

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

                  {/* Cancel Button - NICHT für Lifetime Pass! */}
                  {!lifetime_pass && (
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
                  )}
                  
                  {/* Lifetime Info - Kann nicht gekündigt werden */}
                  {lifetime_pass && (
                    <div className="px-3 md:px-4 py-2 md:py-2.5 rounded-xl border border-purple-400/30 bg-purple-500/10 backdrop-blur-md">
                      <span className="text-purple-300 text-xs md:text-sm font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Lifetime aktiv
                      </span>
                    </div>
                  )}
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

            {/* Bereits geclaimt heute + Skip Button (für ALLE User) */}
            {!canClaimToday && !allClaimed && !claiming && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md shadow-lg flex-1">
                  <Clock className="w-4 h-4 text-white/50 flex-shrink-0" />
                  <span className="text-white/70 text-xs md:text-sm font-medium">
                    {missedDays > 0 ? `${missedDays} Tag${missedDays > 1 ? 'e' : ''} verpasst` : 'Bereits geclaimt — morgen wieder'}
                  </span>
                </div>
                {/* 🆕 Skip Button - Für ALLE User verfügbar (50 Credits) */}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Auto-Claim Feature Card */}
        {!auto_claim_enabled && passType !== 'ultra' && (
          <div className="glass rounded-xl md:rounded-2xl p-4 md:p-6 border border-blue-400/20 hover:border-blue-400/50 transition-all hover:shadow-xl hover:shadow-blue-500/20">
            <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-400/40 shadow-lg flex-shrink-0">
                <Zap className="w-6 h-6 md:w-7 md:h-7 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-lg md:text-xl mb-1 md:mb-1.5">Auto-Claim</h3>
                <p className="text-xs md:text-sm text-white/70 leading-relaxed">
                  Jeden Tag automatisch claimen — nie wieder verpassen!
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-baseline gap-1.5 md:gap-2">
                <span className="text-2xl md:text-3xl font-black text-white">100</span>
                <span className="text-xs md:text-sm text-white/50 font-medium">Credits</span>
              </div>
              <button
                onClick={() => {
                  console.log('🔥 Auto-Claim Button geklickt!');
                  setAutoclaimConfirmOpen(true);
                }}
                disabled={buyingAutoclaim}
                className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-sm md:text-base text-white transition-all hover:scale-105 disabled:opacity-50 shadow-lg hover:shadow-blue-500/50"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
              >
                {buyingAutoclaim ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaufen'}
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px] md:text-xs text-yellow-300 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-2.5 md:px-3 py-2">
              <Star className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span>Ultra+ User haben Auto-Claim kostenlos!</span>
            </div>
          </div>
        )}

        {/* Auto-Claim Active Status */}
        {(auto_claim_enabled || passType === 'ultra') && (
          <div className="glass rounded-xl md:rounded-2xl p-4 md:p-5 border border-green-400/30 bg-green-500/10">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-green-500/20 border border-green-400/40 flex-shrink-0">
                <Check className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-base md:text-lg flex items-center gap-2">
                  Auto-Claim Aktiv
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400" />
                </h3>
                <p className="text-xs md:text-sm text-green-300 mt-1">
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
          <div className="glass rounded-xl md:rounded-2xl p-4 md:p-6 border border-purple-400/20 hover:border-purple-400/50 transition-all hover:shadow-xl hover:shadow-purple-500/20">
            <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-400/40 shadow-lg flex-shrink-0">
                <Crown className="w-6 h-6 md:w-7 md:h-7 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-lg md:text-xl mb-1 md:mb-1.5 flex items-center gap-2">
                  Lifetime Pass
                  <Crown className="w-4 h-4 md:w-5 md:h-5 text-purple-400 flex-shrink-0" />
                </h3>
                <p className="text-xs md:text-sm text-white/70 leading-relaxed">
                  Einmalige Zahlung für <strong className="text-purple-300">alle zukünftigen Seasons</strong>!
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-baseline gap-1.5 md:gap-2">
                <span className="text-2xl md:text-3xl font-black text-white">6000</span>
                <span className="text-xs md:text-sm text-white/50 font-medium">Credits</span>
              </div>
              <button
                onClick={() => {
                  console.log('🔥 Lifetime Button geklickt!');
                  setLifetimeConfirmOpen(true);
                }}
                disabled={buyingLifetime}
                className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-sm md:text-base text-white transition-all hover:scale-105 disabled:opacity-50 shadow-lg hover:shadow-purple-500/50"
                style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' }}
              >
                {buyingLifetime ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaufen'}
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px] md:text-xs text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-2.5 md:px-3 py-2">
              <Gem className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span>Jeden Monat automatisch Ultra+ Pass!</span>
            </div>
          </div>
        )}

        {/* Lifetime Pass Active Status */}
        {lifetime_pass && (
          <div className="glass rounded-xl md:rounded-2xl p-4 md:p-5 border border-purple-400/40 bg-purple-500/10">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-purple-500/20 border border-purple-400/50 flex-shrink-0">
                <Crown className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-base md:text-lg flex items-center gap-2">
                  Lifetime Pass Aktiv
                  <Crown className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400 flex-shrink-0" />
                </h3>
                <p className="text-xs md:text-sm text-purple-300 mt-1">
                  Du bekommst jeden Monat automatisch den Ultra+ Pass!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== TIER TRACK (Real Battle Pass Look - Horizontal) ==================== */}
      <div className="glass rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
          <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <Gift className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            Alle Belohnungen
          </h3>
          <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-white/40 font-medium">
            <span className="hidden sm:inline">Mausrad oder Touch</span>
            <span className="sm:hidden">Wische</span>
            <span>↔</span>
          </div>
        </div>

        {/* Horizontal Scrollable Track */}
        <div
          ref={rewardsTrackRef}
          className="overflow-x-auto overflow-y-visible -mx-4 md:-mx-6 px-4 md:px-6 pb-3 scroll-smooth snap-x snap-mandatory cursor-default"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
        >
          <div className="flex gap-2 md:gap-3 w-max">
            {rewards.map((tier) => {
              const isMissed = (missedTiers || []).includes(tier.tier);
              const isUnlocked = tier.tier <= currentTier && !isMissed;
              const isCurrent = tier.tier === nextTier;
              const isLocked = tier.tier > nextTier && !isMissed;

              return (
                <div
                  key={tier.tier}
                  data-tier={tier.tier}
                  className="flex-shrink-0 w-[125px] sm:w-[140px] md:w-[155px] snap-center"
                >
                  <TierCard
                    tier={tier}
                    isUnlocked={isUnlocked}
                    isCurrent={isCurrent}
                    isLocked={isLocked}
                    isMissed={isMissed}
                    purchased={purchased}
                    canClaim={canClaimToday && isCurrent}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Legende unter dem Track */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-3 md:mt-4 text-[10px] md:text-xs text-white/60">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-yellow-400 bg-yellow-400/20"></div>
            <span>Aktuell</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-emerald-400/40 bg-emerald-500/20"></div>
            <span>Erhalten</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-red-500/40 bg-red-500/20"></div>
            <span>Verpasst</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-white/10 bg-white/5"></div>
            <span>Gesperrt</span>
          </div>
        </div>
      </div>

      {/* ==================== PURCHASE DIALOG - Mit Tier-Auswahl ==================== */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="glass border border-white/[0.12] max-w-[95vw] md:max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
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
            <AlertDialogTitle className="text-lg md:text-xl font-bold text-white text-center mb-2 md:mb-3">
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
          <AlertDialogFooter className="gap-2 md:gap-3 mt-2 flex-col-reverse sm:flex-row">
            <AlertDialogCancel className="glass border border-white/[0.12] text-white hover:bg-white/5 font-semibold rounded-xl w-full sm:w-auto">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurchase}
              className="rounded-xl font-bold border-0 w-full sm:w-auto text-sm md:text-base"
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
              <TierIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Für {tierPrice.toLocaleString('de-DE')} Credits kaufen
            </AlertDialogAction>
          </AlertDialogFooter>
          </>
            );
          })()}
        </AlertDialogContent>
      </AlertDialog>

      {/* 🆕 ═══════════════════════════════════════════════════════════════
          TIER-SKIP DIALOG
          ═══════════════════════════════════════════════════════════════ */}
      <AlertDialog open={skipConfirmOpen} onOpenChange={setSkipConfirmOpen}>
        <AlertDialogContent className="glass border border-white/[0.12] max-w-[95vw] md:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-bold text-white">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center bg-orange-500/15 border border-orange-400/35 flex-shrink-0">
                <Zap className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
              </div>
              Tier überspringen?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-3">
                <div className="glass rounded-xl border border-white/[0.08] p-4">
                  <p className="text-sm text-white/90">
                    Du kannst <strong>Tier {nextTier}</strong> für <strong className="text-orange-400">50 Credits</strong> überspringen.
                  </p>
                  <p className="text-xs text-white/60 mt-2 flex items-start gap-2">
                    <Zap className="w-4 h-4 text-orange-300 mt-0.5 flex-shrink-0" />
                    <span>Dein Tier erhöht sich sofort, aber du erhältst <strong>keine Belohnungen</strong> für diesen Tier.</span>
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 md:gap-3 mt-2 flex-col-reverse sm:flex-row">
            <AlertDialogCancel className="glass border border-white/[0.12] text-white hover:bg-white/5 font-semibold rounded-xl w-full sm:w-auto">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSkipTier}
              className="rounded-xl font-bold border-0 w-full sm:w-auto text-sm md:text-base"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)'
              }}
            >
              <Zap className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Für 50 Credits überspringen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🆕 ═══════════════════════════════════════════════════════════════
          AUTO-CLAIM KAUFEN DIALOG
          ═══════════════════════════════════════════════════════════════ */}
      <AlertDialog open={autoclaimConfirmOpen} onOpenChange={setAutoclaimConfirmOpen}>
        <AlertDialogContent className="glass border border-white/[0.12] max-w-[95vw] md:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-bold text-white">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center bg-blue-500/15 border border-blue-400/35 flex-shrink-0">
                <Zap className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
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
                <div className="text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-2 flex items-center gap-2">
                  <Star className="w-4 h-4 flex-shrink-0" />
                  <span>Ultra+ User haben Auto-Claim bereits kostenlos!</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 md:gap-3 mt-2 flex-col-reverse sm:flex-row">
            <AlertDialogCancel className="glass border border-white/[0.12] text-white hover:bg-white/5 font-semibold rounded-xl w-full sm:w-auto">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBuyAutoclaim}
              className="rounded-xl font-bold border-0 w-full sm:w-auto text-sm md:text-base"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
              }}
            >
              <Zap className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Für 100 Credits kaufen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🆕 ═══════════════════════════════════════════════════════════════
          LIFETIME PASS KAUFEN DIALOG
          ═══════════════════════════════════════════════════════════════ */}
      <AlertDialog open={lifetimeConfirmOpen} onOpenChange={setLifetimeConfirmOpen}>
        <AlertDialogContent className="glass border border-white/[0.12] max-w-[95vw] md:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-bold text-white flex-wrap">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center bg-purple-500/15 border border-purple-400/35 flex-shrink-0">
                <Crown className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
              </div>
              <span className="flex items-center gap-2">
                Lifetime Pass kaufen?
                <Crown className="w-4 h-4 md:w-5 md:h-5 text-purple-300 flex-shrink-0" />
              </span>
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
                <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-2 flex items-center gap-2">
                  <Gem className="w-4 h-4 flex-shrink-0" />
                  <span>Beste Investition! Spar Credits für andere Items.</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 md:gap-3 mt-2 flex-col-reverse sm:flex-row">
            <AlertDialogCancel className="glass border border-white/[0.12] text-white hover:bg-white/5 font-semibold rounded-xl w-full sm:w-auto">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBuyLifetime}
              className="rounded-xl font-bold border-0 w-full sm:w-auto text-sm md:text-base"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                boxShadow: '0 8px 24px rgba(168, 85, 247, 0.4)'
              }}
            >
              <Crown className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Für 6000 Credits kaufen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==================== CANCEL DIALOG ==================== */}
      <AlertDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <AlertDialogContent className="glass border border-white/[0.12] max-w-[95vw] md:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-bold text-white">
              <div
                className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(251, 146, 60, 0.15)',
                  border: '1px solid rgba(251, 146, 60, 0.35)'
                }}
              >
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
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
        </TabsContent> {/* Ende Battle Pass Tab */}
        
        {/* ==================== TAB 2: VORTEILE ==================== */}
        <TabsContent value="benefits" className="mt-4 md:mt-6">
          <BenefitsTab
            purchased={purchased}
            passType={passType}
            lifetime_pass={lifetime_pass}
            auto_claim_enabled={auto_claim_enabled}
            tiers={tiersWithDiscount}
          />
        </TabsContent>
        
      </Tabs> {/* Ende Tabs */}
    </div>
  );
}

// ==================== TIER CARD COMPONENT ==================== 
function TierCard({ tier, isUnlocked, isCurrent, isLocked, isMissed, purchased, canClaim }) {
  const freeReward = tier.free;
  const premiumReward = tier.premium;
  
  const FreeIcon = getRewardIcon(freeReward);
  const PremiumIcon = getRewardIcon(premiumReward);
  
  return (
    <div
      className={`
        relative rounded-xl md:rounded-2xl overflow-hidden border-2 transition-all duration-300 h-full flex flex-col
        ${isCurrent ? 'border-yellow-400 shadow-[0_0_24px_rgba(251,191,36,0.4)] z-10' : ''}
        ${isUnlocked && !isCurrent ? 'border-emerald-400/40' : ''}
        ${isMissed ? 'border-red-500/40 opacity-70' : ''}
        ${isLocked && !isMissed ? 'border-white/10' : ''}
      `}
      style={{
        background: isUnlocked 
          ? 'linear-gradient(135deg, rgba(16,185,129,0.10), rgba(5,150,105,0.04))' 
          : isCurrent 
          ? 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))'
          : isMissed
          ? 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(220,38,38,0.04))'
          : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
      }}
    >
      {/* === Header Row: Tier-Nummer + Status-Badge === */}
      <div className="flex items-center justify-between px-2 md:px-2.5 py-1.5 md:py-2 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] md:text-xs font-black tabular-nums ${
            isCurrent ? 'text-yellow-300' : isUnlocked ? 'text-emerald-300' : isMissed ? 'text-red-300' : 'text-white/50'
          }`}>
            TIER
          </span>
          <span className={`text-base md:text-lg font-black tabular-nums leading-none ${
            isCurrent ? 'text-yellow-300' : isUnlocked ? 'text-emerald-300' : isMissed ? 'text-red-300' : 'text-white'
          }`}>
            {tier.tier}
          </span>
        </div>
        {/* Status Icons */}
        {isUnlocked && (
          <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-500/90 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.6)]">
            <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
          </div>
        )}
        {isMissed && (
          <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-red-500/90 flex items-center justify-center">
            <X className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
          </div>
        )}
        {isCurrent && (
          <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-yellow-400/90 flex items-center justify-center animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]">
            <Crown className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-900" />
          </div>
        )}
        {isLocked && !isMissed && (
          <Lock className="w-3 h-3 md:w-3.5 md:h-3.5 text-white/30" />
        )}
      </div>

      {/* === Missed Overlay === */}
      {isMissed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 backdrop-blur-[1px] z-20 pt-7">
          <X className="w-5 h-5 md:w-6 md:h-6 text-red-400 mb-0.5" />
          <span className="text-[10px] md:text-xs font-bold text-red-300">Verpasst</span>
          <span className="text-[8px] md:text-[9px] text-red-200/80 mt-0.5">Skip möglich</span>
        </div>
      )}

      {/* === Content === */}
      <div className="p-1.5 md:p-2 space-y-1.5 md:space-y-2 flex-1 flex flex-col">
        {/* Free Reward - feste Min-Höhe für gleiche Card-Größe */}
        <div className="rounded-lg p-1.5 md:p-2 border border-white/8 flex flex-col min-h-[78px] md:min-h-[88px]" style={{ background: 'rgba(0,0,0,0.25)' }}>
          <div className="text-[8px] md:text-[9px] uppercase tracking-wider text-white/40 font-bold mb-1">
            Free
          </div>
          <div className="flex items-start gap-1.5 flex-1">
            <FreeIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${getRewardColor(freeReward)} flex-shrink-0 mt-0.5`} />
            <span className="text-[10px] md:text-[11px] text-white/85 font-semibold line-clamp-2 leading-tight">{freeReward.label}</span>
          </div>
          {/* Alt-Credits Zeile - immer reserviert für gleiche Card-Höhe */}
          <div className="text-[8px] md:text-[9px] text-white/40 mt-1 font-medium h-[10px] md:h-[11px] leading-none">
            {freeReward.alternativeCredits ? `Alt: ${freeReward.alternativeCredits}c` : '\u00A0'}
          </div>
        </div>

        {/* Premium Reward - feste Min-Höhe für gleiche Card-Größe */}
        <div 
          className={`relative rounded-lg p-1.5 md:p-2 border transition-all flex flex-col min-h-[78px] md:min-h-[88px] ${
            purchased 
              ? 'border-yellow-400/25' 
              : 'border-white/8'
          }`}
          style={{
            background: purchased 
              ? 'linear-gradient(135deg, rgba(251,191,36,0.06), rgba(251,191,36,0.02))' 
              : 'rgba(0,0,0,0.15)'
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Crown className={`w-2.5 h-2.5 md:w-3 md:h-3 ${purchased ? 'text-yellow-400' : 'text-white/30'}`} />
            <div className={`text-[8px] md:text-[9px] uppercase tracking-wider font-bold ${purchased ? 'text-yellow-300/80' : 'text-white/40'}`}>
              Premium
            </div>
          </div>
          {!purchased && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px] rounded-lg">
              <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/40" />
            </div>
          )}
          <div className="flex items-start gap-1.5 flex-1">
            <PremiumIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${purchased ? getRewardColor(premiumReward) : 'text-white/30'} flex-shrink-0 mt-0.5`} />
            <span className={`text-[10px] md:text-[11px] font-semibold line-clamp-2 leading-tight ${purchased ? 'text-white/90' : 'text-white/30'}`}>
              {premiumReward.label}
            </span>
          </div>
          {/* Alt-Credits Zeile - immer reserviert für gleiche Card-Höhe */}
          <div className="text-[8px] md:text-[9px] text-yellow-300/60 mt-1 font-medium h-[10px] md:h-[11px] leading-none">
            {purchased && premiumReward.alternativeCredits ? `Alt: ${premiumReward.alternativeCredits}c` : '\u00A0'}
          </div>
        </div>
      </div>
    </div>
  );
}

// 🆕 NEU: Vorteile Tab Content - Zeigt Benefits je nach Pass-Typ
function BenefitsTab({ purchased, passType, lifetime_pass, auto_claim_enabled, tiers }) {
  // ✅ Dynamische Preise aus Backend (statt hardcoded)
  const tierMap = {};
  (tiers || []).forEach((t) => {
    tierMap[t.id] = {
      original: t.originalCost ?? t.cost,
      current: t.currentPrice ?? t.cost,
      discount: t.discountPercent ?? 0,
    };
  });
  const fmt = (n) => (n != null ? n.toLocaleString('de-DE') : '—');
  const premiumPrice = tierMap.premium?.original;
  const elitePrice = tierMap.elite?.original;
  const ultraPrice = tierMap.ultra?.original;

  const getBenefits = () => {
    if (lifetime_pass) {
      return {
        title: 'Lifetime Pass',
        titleIcon: <Crown className="w-7 h-7 md:w-8 md:h-8 text-purple-300" />,
        color: 'purple',
        benefits: [
          { icon: <Crown />, title: 'Jeden Monat Ultra+ Pass', desc: 'Automatisch bei jedem Season-Reset' },
          { icon: <Zap />, title: 'Auto-Claim kostenlos', desc: 'Nie wieder manuell claimen' },
          { icon: <Gem />, title: 'Beste Langzeit-Investition', desc: 'Einmal zahlen, für immer profitieren' },
          { icon: <TrendingUp />, title: '30% Rewards + Extra Lizenzen', desc: 'Optimiert für Langzeit-Spieler' },
          { icon: <Shield />, title: 'Kann nicht gekündigt werden', desc: 'Lifetime bleibt für immer aktiv' },
        ],
      };
    }
    
    if (!purchased) {
      return {
        title: 'Free Track',
        titleIcon: <Gift className="w-7 h-7 md:w-8 md:h-8 text-gray-300" />,
        color: 'gray',
        benefits: [
          { icon: <Gift />, title: 'Tägliche kostenlose Rewards', desc: 'XP, Credits, Geld und Items' },
          { icon: <Clock />, title: 'Einmal pro Tag claimen', desc: '24h Cooldown zwischen Claims' },
          { icon: <Lock />, title: 'Premium Rewards gesperrt', desc: 'Kaufe einen Pass für doppelte Belohnungen!' },
        ],
        upgrade: true,
      };
    }
    
    switch (passType) {
      case 'ultra':
        return {
          title: 'Ultra+ Pass',
          titleIcon: <Gem className="w-7 h-7 md:w-8 md:h-8 text-rose-300" />,
          color: 'rose',
          benefits: [
            { icon: <Crown />, title: 'Ultra+ Tier', desc: 'Bester Premium Pass verfügbar' },
            { icon: <TrendingUp />, title: '30% Rewards + Extra Lizenzen', desc: 'Weniger Geld/XP aber mehr wertvolle Lizenzen' },
            { icon: <Zap />, title: 'Auto-Claim kostenlos', desc: 'Nie wieder manuell claimen müssen' },
            { icon: <Gem />, title: 'Beste Preise', desc: 'Niedrigste Kosten pro Season' },
            { icon: <Award />, title: 'Exklusive Ultra+ Items', desc: 'Einzigartige Belohnungen nur für Ultra+' },
          ],
        };
      
      case 'elite':
        return {
          title: 'Elite+ Pass',
          titleIcon: <Star className="w-7 h-7 md:w-8 md:h-8 text-violet-300" />,
          color: 'violet',
          benefits: [
            { icon: <Crown />, title: 'Elite+ Tier', desc: 'Mittlerer Premium Pass' },
            { icon: <TrendingUp />, title: '50% Rewards', desc: 'Halbe Rewards für reduzierten Preis' },
            { icon: <Coins />, title: 'Reduzierte Preise', desc: 'Günstiger als Premium Pass' },
            { icon: <Gift />, title: 'Free + Premium Rewards', desc: 'Beide Tracks gleichzeitig' },
            { icon: <Sparkles />, title: 'Elite+ Items', desc: 'Spezielle Belohnungen für Elite+' },
          ],
        };
      
      default: // premium
        return {
          title: 'Premium Pass',
          titleIcon: <Crown className="w-7 h-7 md:w-8 md:h-8 text-yellow-300" />,
          color: 'yellow',
          benefits: [
            { icon: <Crown />, title: 'Premium Tier', desc: 'Basis Premium Pass' },
            { icon: <TrendingUp />, title: '70% Rewards', desc: 'Meiste Rewards für fairen Preis' },
            { icon: <Gift />, title: 'Free + Premium Rewards', desc: 'Beide Tracks gleichzeitig claimen' },
            { icon: <Coins />, title: 'Gutes Preis-Leistungs-Verhältnis', desc: 'Beste Balance zwischen Kosten und Rewards' },
            { icon: <Award />, title: 'Premium Items', desc: 'Exklusive Premium Belohnungen' },
          ],
        };
    }
  };
  
  const { title, titleIcon, color, benefits, upgrade } = getBenefits();
  
  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-400/30',
    rose: 'from-rose-500/20 to-rose-600/10 border-rose-400/30',
    violet: 'from-violet-500/20 to-violet-600/10 border-violet-400/30',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-400/30',
    gray: 'from-gray-500/20 to-gray-600/10 border-gray-400/30',
  };
  
  return (
    <div className="space-y-4 md:space-y-6">
      <div className={`glass rounded-xl md:rounded-2xl p-4 md:p-8 border bg-gradient-to-br ${colorClasses[color]}`}>
        <h2 className="text-xl md:text-3xl font-black text-white mb-1.5 md:mb-2 flex items-center gap-2 md:gap-3">
          {titleIcon}
          <span>{title}</span>
        </h2>
        <p className="text-white/60 text-xs md:text-base mb-4 md:mb-6">
          {upgrade ? 'Upgrade jetzt für exklusive Vorteile!' : 'Deine aktuellen Vorteile'}
        </p>
        
        <div className="grid gap-3 md:gap-5">
          {benefits.map((benefit, idx) => (
            <div 
              key={idx}
              className="flex items-start gap-3 md:gap-4 p-3 md:p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/20">
                {React.cloneElement(benefit.icon, { className: 'w-5 h-5 md:w-6 md:h-6 text-white' })}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm md:text-lg mb-0.5 md:mb-1">{benefit.title}</h3>
                <p className="text-white/60 text-xs md:text-base leading-relaxed">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
        
        {upgrade && (
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/10">
            <p className="text-white/70 text-center text-xs md:text-base mb-3 md:mb-4 flex items-center justify-center gap-2">
              <Gift className="w-4 h-4 md:w-5 md:h-5 text-pink-300 flex-shrink-0" />
              <span>Upgrade jetzt und erhalte sofort Zugriff auf Premium Rewards!</span>
            </p>
            <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
              <span className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 font-bold text-xs md:text-sm">
                Premium: ab {fmt(premiumPrice)}c
              </span>
              <span className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-violet-500/20 border border-violet-400/30 text-violet-300 font-bold text-xs md:text-sm">
                Elite+: ab {fmt(elitePrice)}c
              </span>
              <span className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-rose-500/20 border border-rose-400/30 text-rose-300 font-bold text-xs md:text-sm">
                Ultra+: ab {fmt(ultraPrice)}c
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Vergleichstabelle */}
      <div className="glass rounded-xl md:rounded-2xl p-4 md:p-8 border border-white/10">
        <h3 className="text-lg md:text-2xl font-black text-white mb-3 md:mb-6 flex items-center gap-2 md:gap-3">
          <Award className="w-5 h-5 md:w-7 md:h-7 text-blue-300" />
          <span>Pass-Vergleich</span>
        </h3>
        {/* Mobile-Hint */}
        <p className="md:hidden text-[10px] text-white/40 mb-2 italic">← Wische für mehr →</p>
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <div className="min-w-[560px] md:min-w-0">
            <table className="w-full text-xs md:text-base">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/60 font-bold pb-3 md:pb-4 pr-2 md:pr-4">Feature</th>
                  <th className="text-center text-white/60 font-bold pb-3 md:pb-4 px-1 md:px-2">Free</th>
                  <th className="text-center text-yellow-300 font-bold pb-3 md:pb-4 px-1 md:px-2">Premium</th>
                  <th className="text-center text-violet-300 font-bold pb-3 md:pb-4 px-1 md:px-2">Elite+</th>
                  <th className="text-center text-rose-300 font-bold pb-3 md:pb-4 px-1 md:px-2">Ultra+</th>
                </tr>
              </thead>
              <tbody className="text-white">
                <tr className="border-b border-white/5">
                  <td className="py-3 md:py-4 pr-2 md:pr-4">Free Track Rewards</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2"><Check className="w-4 h-4 md:w-5 md:h-5 text-green-400 mx-auto" /></td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2"><Check className="w-4 h-4 md:w-5 md:h-5 text-green-400 mx-auto" /></td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2"><Check className="w-4 h-4 md:w-5 md:h-5 text-green-400 mx-auto" /></td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2"><Check className="w-4 h-4 md:w-5 md:h-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 md:py-4 pr-2 md:pr-4">Premium Track Rewards</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2"><X className="w-4 h-4 md:w-5 md:h-5 text-red-400 mx-auto" /></td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2">70%</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2">50%</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2">30% + Lizenzen</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 md:py-4 pr-2 md:pr-4">Auto-Claim</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2">100c</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2">100c</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2">100c</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2"><Check className="w-4 h-4 md:w-5 md:h-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 md:py-4 pr-2 md:pr-4">Skip Feature</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2">50c/Tier</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2">50c/Tier</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2">50c/Tier</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2">50c/Tier</td>
                </tr>
                <tr>
                  <td className="py-3 md:py-4 pr-2 md:pr-4 font-bold">Saison-Preis</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2 font-bold text-green-400">Gratis</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2 font-bold">{fmt(premiumPrice)}c</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2 font-bold">{fmt(elitePrice)}c</td>
                  <td className="text-center py-3 md:py-4 px-1 md:px-2 font-bold">{fmt(ultraPrice)}c</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}