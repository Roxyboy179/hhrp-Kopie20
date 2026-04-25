'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  Crown, Lock, Check, Clock, Gift, Sparkles, ChevronRight,
  Coins, Banknote, Star, Ticket, Car, Bike, Truck, Crosshair,
  Shield, Plane,
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

// Icon-Mapper für Reward-Typen (Lucide Icons)
const REWARD_ICON = {
  credits: Coins,
  money: Banknote,
  xp: Star,
  item: Ticket,
  pass: Crown,
};

const ITEM_ICON_MAP = {
  führerschein_b: Car,
  führerschein_a: Bike,
  führerschein_c: Truck,
  führerschein_ce: Truck,
  waffenschein_klein: Crosshair,
  waffenschein_gross: Crosshair,
  versicherung_standard: Shield,
  flugschein: Plane,
  vip_premium_7d: Crown,
  vip_platinum_30d: Crown,
  vip_elite_plus_30d: Crown,
};

// Farb-Mapper basierend auf Reward-Typ
const REWARD_COLOR = {
  credits: 'text-yellow-300',
  money: 'text-emerald-300',
  xp: 'text-blue-300',
  item: 'text-purple-300',
  pass: 'text-yellow-300',
};

function getRewardIcon(reward) {
  if (!reward) return Gift;
  if (reward.type === 'item' && reward.item_id && ITEM_ICON_MAP[reward.item_id]) return ITEM_ICON_MAP[reward.item_id];
  if (reward.type === 'pass' && reward.pass_id && ITEM_ICON_MAP[reward.pass_id]) return ITEM_ICON_MAP[reward.pass_id];
  return REWARD_ICON[reward.type] || Gift;
}

function getRewardColor(reward) {
  if (!reward) return 'text-white/60';
  return REWARD_COLOR[reward.type] || 'text-white/60';
}

const MONTH_NAMES_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export default function BattlePassView() {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [data, setData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadBattlePass();
  }, []);

  // Auto-Scroll zum aktuellen Tier
  useEffect(() => {
    if (data && scrollRef.current) {
      const tier = data.userProgress?.currentTier || 0;
      const target = scrollRef.current.querySelector(`[data-tier="${Math.max(1, tier)}"]`);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }, 250);
      }
    }
  }, [data]);

  const loadBattlePass = async () => {
    try {
      const res = await fetch('/api/battle-pass/current');
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        toast.error(json.error || 'Fehler beim Laden des Battle Pass');
      }
    } catch (error) {
      console.error('[BP] Load Error:', error);
      toast.error('Verbindungsfehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  // Öffnet das Confirm-Modal (kein Browser-confirm mehr)
  const handlePurchaseClick = () => {
    setConfirmOpen(true);
  };

  const handlePurchase = async () => {
    setConfirmOpen(false);
    setPurchasing(true);
    try {
      const res = await fetch('/api/battle-pass/purchase', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        if (json.pending) {
          toast.success('Battle Pass Kauf gestartet!', {
            description: 'Der Bot zieht gleich die Credits ab und aktiviert den Premium-Track. Bitte einen Moment Geduld…',
          });
          // Automatisch nach 5s, 10s und 20s neu laden, bis der Bot fertig ist
          setTimeout(() => loadBattlePass(), 5000);
          setTimeout(() => loadBattlePass(), 10000);
          setTimeout(() => loadBattlePass(), 20000);
        } else {
          toast.success('Battle Pass erfolgreich gekauft! Premium-Track aktiv.');
          await loadBattlePass();
        }
      } else {
        toast.error(json.error || 'Fehler beim Kauf');
      }
    } catch (error) {
      console.error('[BP] Purchase Error:', error);
      toast.error('Verbindungsfehler beim Kauf');
    } finally {
      setPurchasing(false);
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch('/api/battle-pass/claim', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        const granted = json.grantedRewards || [];
        const labels = granted.map(g => g.label).filter(Boolean).join(' • ');
        toast.success(`Tier ${json.newTier} freigeschaltet!`, {
          description: labels || 'Belohnung erhalten',
        });
        await loadBattlePass();
      } else {
        toast.error(json.error || 'Fehler beim Claimen');
      }
    } catch (error) {
      console.error('[BP] Claim Error:', error);
      toast.error('Verbindungsfehler beim Claimen');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-10 flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white/80"></div>
      </div>
    );
  }

  const rewards = data?.rewards || [];
  const progress = data?.userProgress || {};
  const currentTier = progress.currentTier || 0;
  const purchased = progress.purchased || false;
  const canClaim = progress.canClaimToday && currentTier < 30;
  const allClaimed = currentTier >= 30;
  const seasonName = data?.season ? `${MONTH_NAMES_DE[data.season.month - 1]} ${data.season.year}` : '';

  // Stunden bis Mitternacht (für nächsten Claim)
  const now = new Date();
  const hoursUntilMidnight = Math.max(1, 24 - now.getHours());

  return (
    <div className="space-y-4">
      {/* ==================== HEADER CARD ==================== */}
      <div className="glass rounded-2xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HHRP Battle Pass • Season {seasonName}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <Crown className="w-7 h-7 text-yellow-400 flex-shrink-0" />
              <span className="truncate">Tier-Belohnungen</span>
            </h2>
            <p className="text-white/50 text-sm mt-1">
              Noch <span className="text-white font-semibold">{data?.daysRemaining ?? 0}</span> Tage in dieser Season
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {purchased ? (
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-yellow-400/30 bg-yellow-400/10">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300 font-semibold text-sm whitespace-nowrap">Premium aktiv</span>
              </div>
            ) : (
              <Button
                onClick={handlePurchaseClick}
                disabled={purchasing}
                className="h-11 px-5 rounded-xl font-semibold text-black"
                style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
              >
                {purchasing ? 'Kaufe...' : (
                  <span className="flex items-center gap-2">
                    <Crown className="w-4 h-4" /> 1.500 Credits • Premium kaufen
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-white/60">Fortschritt</span>
            <span className="text-white font-semibold tabular-nums">{currentTier} / 30 Tiers</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${(currentTier / 30) * 100}%`,
                background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #ef4444 100%)',
                boxShadow: '0 0 12px rgba(251,191,36,0.5)',
              }}
            />
          </div>
        </div>

        {/* Action / Status */}
        <div className="mt-4">
          {canClaim && (
            <Button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full h-12 rounded-xl font-semibold text-white text-base"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              {claiming ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white"></div>
                  Wird geclaimt...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Tier {currentTier + 1} jetzt einlösen
                </span>
              )}
            </Button>
          )}

          {!canClaim && !allClaimed && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <Clock className="w-4 h-4 text-white/40" />
              <span className="text-white/60 text-sm">
                Heute bereits geclaimt — nächster Tier in <span className="text-white/80 font-medium">{hoursUntilMidnight}</span> Stunden
              </span>
            </div>
          )}

          {allClaimed && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-green-400/20 bg-green-400/5">
              <Sparkles className="w-5 h-5 text-green-400" />
              <span className="text-green-300 text-sm font-semibold">
                Battle Pass komplett! Komm im nächsten Monat zurück
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ==================== TIER PATH (Horizontal Scroll) ==================== */}
      <div className="glass rounded-2xl p-5 md:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-bold text-white">Tier-Pfad</h3>
          <div className="hidden sm:flex items-center gap-3 text-xs text-white/40">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/30"></span> Free
            </span>
            <span className="flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-yellow-400" /> Premium
            </span>
          </div>
        </div>

        {/* Track-Labels (Desktop sticky-like) */}
        <div className="hidden md:flex flex-col gap-2 mb-3 text-xs text-white/40">
          {/* placeholders aligned with rows */}
        </div>

        {/* Scrollable Tier Path */}
        <div ref={scrollRef} className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
          <div className="inline-flex flex-col gap-2 min-w-full">
            {/* Free Track Row */}
            <TrackRow
              label="Free"
              icon={null}
              rewards={rewards}
              currentTier={currentTier}
              purchased={purchased}
              isPremium={false}
            />

            {/* Tier Numbers Row */}
            <div className="flex items-center gap-2 px-1">
              {rewards.map((r) => {
                const isCurrent = r.tier === currentTier + 1;
                const isUnlocked = r.tier <= currentTier;
                return (
                  <div
                    key={`num-${r.tier}`}
                    data-tier={r.tier}
                    className="flex-shrink-0 w-[88px] flex items-center justify-center"
                  >
                    <div
                      className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                        isUnlocked
                          ? 'bg-yellow-400 border-yellow-300 text-black'
                          : isCurrent
                          ? 'bg-white/[0.06] border-yellow-400 text-yellow-300 animate-pulse'
                          : 'bg-white/[0.03] border-white/[0.08] text-white/40'
                      }`}
                    >
                      {r.tier}
                      {isUnlocked && (
                        <Check className="absolute -bottom-1 -right-1 w-4 h-4 p-0.5 rounded-full bg-green-500 text-white" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Premium Track Row */}
            <TrackRow
              label="Premium"
              icon={<Crown className="w-3 h-3 text-yellow-400" />}
              rewards={rewards}
              currentTier={currentTier}
              purchased={purchased}
              isPremium={true}
            />
          </div>
        </div>

        <p className="text-xs text-white/30 mt-3 text-center">
          ← Wische horizontal, um alle 30 Tiers zu sehen →
        </p>
      </div>

      {/* ==================== INFO CARD ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-400" />
            So funktioniert's
          </h3>
          <ul className="space-y-2 text-sm text-white/60">
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
              <span>Schalte <span className="text-white">jeden Tag 1 Tier</span> kostenlos frei</span>
            </li>
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
              <span>Mit dem <span className="text-yellow-300">Premium-Pass</span> bekommst du <span className="text-white">doppelte Rewards</span></span>
            </li>
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
              <span>Insgesamt <span className="text-white">30 Tiers</span> mit Credits, Geld, Items & VIP-Pässen</span>
            </li>
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
              <span>Ein <span className="text-white">neuer Pass</span> startet jeden Monat — verpasse keine Belohnung!</span>
            </li>
          </ul>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Premium-Vorteile
          </h3>
          <ul className="space-y-2 text-sm text-white/60">
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
              <span>Zugriff auf <span className="text-yellow-300">alle 30 Premium-Belohnungen</span></span>
            </li>
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
              <span>Exklusive <span className="text-white">VIP-Pässe</span> (Premium / Platinum / Elite+)</span>
            </li>
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
              <span>Führerscheine, Waffenscheine & <span className="text-white">Spezial-Items</span></span>
            </li>
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
              <span>Bei doppelten Items → <span className="text-white">Alternative Credits</span></span>
            </li>
          </ul>
        </div>
      </div>

      {/* ───────── Battle Pass Kauf Bestätigungs-Dialog ───────── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-white/10 bg-gradient-to-br from-yellow-950/95 via-black/95 to-black/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-yellow-300">
              <Crown className="w-5 h-5" />
              Premium Battle Pass kaufen?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
                  <span className="text-sm text-white/70">Kosten</span>
                  <span className="flex items-center gap-1.5 font-semibold text-yellow-300">
                    <Coins className="w-4 h-4" />
                    1.500 Credits
                  </span>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                  <div className="mb-1.5 font-medium text-white">Du erhältst:</div>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300 mt-0.5 flex-shrink-0" />
                      <span>Zugriff auf alle <span className="text-yellow-200">30 Premium-Tier-Belohnungen</span></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Gift className="w-3.5 h-3.5 text-yellow-300 mt-0.5 flex-shrink-0" />
                      <span>Doppelte Belohnungen pro Daily Claim (Free + Premium)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Crown className="w-3.5 h-3.5 text-yellow-300 mt-0.5 flex-shrink-0" />
                      <span>Exklusive Items, VIP-Pässe & große Geld-Boni</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-xs text-orange-200/80">
                  ⚠️ Der Bot prüft dein Guthaben und zieht die Credits dann automatisch ab. Aktivierung in wenigen Sekunden.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-white/5 hover:bg-white/10 border-white/10 text-white">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurchase}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-semibold border-0"
            >
              <Crown className="w-4 h-4 mr-1.5" />
              Jetzt für 1.500 Credits kaufen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== Sub-Component: Track Row ====================
function TrackRow({ label, icon, rewards, currentTier, purchased, isPremium }) {
  return (
    <div className="flex items-center gap-2 px-1">
      {rewards.map((r) => {
        const reward = isPremium ? r.premium : r.free;
        const isUnlocked = r.tier <= currentTier;
        const isCurrent = r.tier === currentTier + 1;
        const isLockedPremium = isPremium && !purchased;
        const RewardIconComp = getRewardIcon(reward);
        const colorClass = isLockedPremium ? 'text-white/30' : getRewardColor(reward);

        return (
          <div
            key={`${isPremium ? 'p' : 'f'}-${r.tier}`}
            className={`flex-shrink-0 w-[88px] aspect-square rounded-xl p-2 border flex flex-col items-center justify-center text-center transition-all ${
              isCurrent ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-black' : ''
            }`}
            style={{
              background: isUnlocked && !isLockedPremium
                ? 'rgba(16,185,129,0.08)'
                : isCurrent && !isLockedPremium
                ? 'rgba(251,191,36,0.10)'
                : isPremium
                ? 'rgba(251,191,36,0.04)'
                : 'rgba(255,255,255,0.02)',
              borderColor: isUnlocked && !isLockedPremium
                ? 'rgba(16,185,129,0.3)'
                : isCurrent && !isLockedPremium
                ? 'rgba(251,191,36,0.4)'
                : 'rgba(255,255,255,0.06)',
              opacity: isLockedPremium ? 0.5 : 1,
            }}
          >
            <div className="text-[9px] uppercase tracking-wider text-white/40 flex items-center gap-1 mb-1">
              {icon}
              {label}
            </div>
            <div className={`mb-1 flex items-center justify-center ${colorClass}`}>
              <RewardIconComp className="w-6 h-6" strokeWidth={1.8} />
            </div>
            <div className={`text-[10px] leading-tight line-clamp-2 ${
              isLockedPremium
                ? 'text-white/30'
                : isPremium
                ? 'text-yellow-200/80'
                : 'text-white/70'
            }`}>
              {reward?.label || '—'}
            </div>
            {isLockedPremium && (
              <Lock className="w-3 h-3 text-white/30 mt-1" />
            )}
            {isUnlocked && !isLockedPremium && (
              <Check className="w-3 h-3 text-green-400 mt-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}
