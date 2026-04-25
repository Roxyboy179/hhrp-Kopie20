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
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 flex items-center justify-center min-h-[300px] shadow-2xl">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
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
    <div className="space-y-6">
      {/* ==================== HEADER CARD - Apple Glass Style ==================== */}
      <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
        {/* Decorative Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-widest mb-2 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HHRP Battle Pass • Season {seasonName}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3 drop-shadow-lg">
              <Crown className="w-8 h-8 text-yellow-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
              <span className="truncate">Tier-Belohnungen</span>
            </h2>
            <p className="text-white/60 text-sm mt-2">
              Noch <span className="text-white font-bold drop-shadow-md">{data?.daysRemaining ?? 0}</span> Tage in dieser Season
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {purchased ? (
              <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 backdrop-blur-md shadow-lg">
                <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.8)]" />
                <span className="text-yellow-300 font-bold text-sm whitespace-nowrap drop-shadow-md">Premium aktiv</span>
              </div>
            ) : (
              <Button
                onClick={handlePurchaseClick}
                disabled={purchasing}
                className="h-12 px-6 rounded-2xl font-bold text-black shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
              >
                {purchasing ? 'Kaufe...' : (
                  <span className="flex items-center gap-2">
                    <Crown className="w-5 h-5" /> 1.500 Credits • Premium kaufen
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar - Glass Style */}
        <div className="relative z-10 mt-6">
          <div className="flex items-center justify-between mb-2.5 text-sm">
            <span className="text-white/60 font-medium">Fortschritt</span>
            <span className="text-white font-bold tabular-nums drop-shadow-md">{currentTier} / 30 Tiers</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${(currentTier / 30) * 100}%`,
                background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #ef4444 100%)',
                boxShadow: '0 0 20px rgba(251,191,36,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
            />
          </div>
        </div>

        {/* Action / Status */}
        <div className="relative z-10 mt-5">
          {canClaim && (
            <Button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full h-14 rounded-2xl font-bold text-white text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              {claiming ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/40 border-t-white"></div>
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
            <div className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md shadow-lg">
              <Clock className="w-5 h-5 text-white/50" />
              <span className="text-white/70 text-sm font-medium">
                Heute bereits geclaimt — nächster Tier in <span className="text-white font-bold">{hoursUntilMidnight}</span> Stunden
              </span>
            </div>
          )}

          {allClaimed && (
            <div className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-green-400/30 bg-green-400/10 backdrop-blur-md shadow-lg">
              <Sparkles className="w-5 h-5 text-green-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
              <span className="text-green-300 text-sm font-bold drop-shadow-md">
                Battle Pass komplett! Komm im nächsten Monat zurück
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ==================== TIER PATH - Apple Glass Style ==================== */}
      <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-pink-500/5 pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center justify-between mb-5">
          <h3 className="text-lg md:text-xl font-bold text-white drop-shadow-md">Tier-Pfad</h3>
          <div className="hidden sm:flex items-center gap-4 text-xs text-white/50 font-medium">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white/40 shadow-sm"></span> Free
            </span>
            <span className="flex items-center gap-2">
              <Crown className="w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]" /> Premium
            </span>
          </div>
        </div>

        {/* Scrollable Tier Path */}
        <div ref={scrollRef} className="relative z-10 overflow-x-auto pb-3 -mx-2 px-2 scrollbar-thin">
          <div className="inline-flex flex-col gap-3 min-w-full">
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
                      className={`relative w-11 h-11 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all shadow-lg ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-300 text-black shadow-yellow-400/50'
                          : isCurrent
                          ? 'bg-white/10 border-yellow-400 text-yellow-300 animate-pulse shadow-yellow-400/30 backdrop-blur-md'
                          : 'bg-white/5 border-white/20 text-white/50 backdrop-blur-sm'
                      }`}
                    >
                      {r.tier}
                      {isUnlocked && (
                        <Check className="absolute -bottom-1 -right-1 w-5 h-5 p-0.5 rounded-full bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg shadow-green-500/50" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Premium Track Row */}
            <TrackRow
              label="Premium"
              icon={<Crown className="w-3.5 h-3.5 text-yellow-400" />}
              rewards={rewards}
              currentTier={currentTier}
              purchased={purchased}
              isPremium={true}
            />
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/40 mt-4 text-center font-medium">
          ← Wische horizontal, um alle 30 Tiers zu sehen →
        </p>
      </div>

      {/* ==================== INFO CARDS - Apple Glass Style ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none"></div>
          <h3 className="relative z-10 text-base font-bold text-white mb-4 flex items-center gap-2 drop-shadow-md">
            <Gift className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]" />
            So funktioniert's
          </h3>
          <ul className="relative z-10 space-y-2.5 text-sm text-white/70 font-medium">
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-yellow-400/60 flex-shrink-0 mt-0.5" />
              <span>Schalte <span className="text-white font-bold">jeden Tag 1 Tier</span> kostenlos frei</span>
            </li>
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-yellow-400/60 flex-shrink-0 mt-0.5" />
              <span>Mit dem <span className="text-yellow-300 font-bold">Premium-Pass</span> bekommst du <span className="text-white font-bold">doppelte Rewards</span></span>
            </li>
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-yellow-400/60 flex-shrink-0 mt-0.5" />
              <span>Insgesamt <span className="text-white font-bold">30 Tiers</span> mit Credits, Geld, Items & VIP-Pässen</span>
            </li>
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-yellow-400/60 flex-shrink-0 mt-0.5" />
              <span>Ein <span className="text-white font-bold">neuer Pass</span> startet jeden Monat — verpasse keine Belohnung!</span>
            </li>
          </ul>
        </div>

        <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none"></div>
          <h3 className="relative z-10 text-base font-bold text-white mb-4 flex items-center gap-2 drop-shadow-md">
            <Sparkles className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]" />
            Premium-Vorteile
          </h3>
          <ul className="relative z-10 space-y-2.5 text-sm text-white/70 font-medium">
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-yellow-400/60 flex-shrink-0 mt-0.5" />
              <span>Zugriff auf <span className="text-yellow-300 font-bold">alle 30 Premium-Belohnungen</span></span>
            </li>
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-yellow-400/60 flex-shrink-0 mt-0.5" />
              <span>Exklusive <span className="text-white font-bold">VIP-Pässe</span> (Premium / Platinum / Elite+)</span>
            </li>
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-yellow-400/60 flex-shrink-0 mt-0.5" />
              <span>Führerscheine, Waffenscheine & <span className="text-white font-bold">Spezial-Items</span></span>
            </li>
            <li className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-yellow-400/60 flex-shrink-0 mt-0.5" />
              <span>Bei doppelten Items → <span className="text-white font-bold">Alternative Credits</span></span>
            </li>
          </ul>
        </div>
      </div>

      {/* ───────── Battle Pass Kauf Bestätigungs-Dialog - Apple Glass ───────── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-white/20 bg-gradient-to-br from-yellow-950/90 via-black/90 to-black/90 backdrop-blur-3xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-yellow-300 text-xl font-bold drop-shadow-md">
              <Crown className="w-6 h-6 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
              Premium Battle Pass kaufen?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between rounded-2xl border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-md px-4 py-3 shadow-lg">
                  <span className="text-sm text-white/80 font-medium">Kosten</span>
                  <span className="flex items-center gap-2 font-bold text-yellow-300 drop-shadow-md">
                    <Coins className="w-5 h-5" />
                    1.500 Credits
                  </span>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md p-4 text-sm text-white/90 shadow-lg">
                  <div className="mb-2 font-bold text-white drop-shadow-md">Du erhältst:</div>
                  <ul className="space-y-2 text-xs font-medium">
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]" />
                      <span>Zugriff auf alle <span className="text-yellow-200 font-bold">30 Premium-Tier-Belohnungen</span></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Gift className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]" />
                      <span>Doppelte Belohnungen pro Daily Claim (Free + Premium)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Crown className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]" />
                      <span>Exklusive Items, VIP-Pässe & große Geld-Boni</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 backdrop-blur-md px-4 py-3 text-xs text-orange-200 font-medium shadow-lg">
                  ⚠️ Der Bot prüft dein Guthaben und zieht die Credits dann automatisch ab. Aktivierung in wenigen Sekunden.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-2">
            <AlertDialogCancel className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md font-semibold rounded-xl shadow-lg">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurchase}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold border-0 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              <Crown className="w-5 h-5 mr-2" />
              Jetzt für 1.500 Credits kaufen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== Sub-Component: Track Row - Apple Glass Style ====================
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
            className={`flex-shrink-0 w-[88px] aspect-square rounded-2xl p-2 border flex flex-col items-center justify-center text-center transition-all backdrop-blur-md shadow-lg ${
              isCurrent ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black/50' : ''
            }`}
            style={{
              background: isUnlocked && !isLockedPremium
                ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))'
                : isCurrent && !isLockedPremium
                ? 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))'
                : isPremium
                ? 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.05))'
                : 'rgba(255,255,255,0.04)',
              borderColor: isUnlocked && !isLockedPremium
                ? 'rgba(16,185,129,0.4)'
                : isCurrent && !isLockedPremium
                ? 'rgba(251,191,36,0.5)'
                : 'rgba(255,255,255,0.15)',
              opacity: isLockedPremium ? 0.5 : 1,
              boxShadow: isUnlocked && !isLockedPremium
                ? '0 4px 20px rgba(16,185,129,0.2)'
                : isCurrent && !isLockedPremium
                ? '0 4px 20px rgba(251,191,36,0.3)'
                : 'none',
            }}
          >
            <div className="text-[9px] uppercase tracking-wider text-white/50 flex items-center gap-1 mb-1 font-bold">
              {icon}
              {label}
            </div>
            <div className={`mb-1 flex items-center justify-center ${colorClass} drop-shadow-md`}>
              <RewardIconComp className="w-6 h-6" strokeWidth={2} />
            </div>
            <div className={`text-[10px] leading-tight line-clamp-2 font-medium ${
              isLockedPremium
                ? 'text-white/30'
                : isPremium
                ? 'text-yellow-200 font-semibold'
                : 'text-white/80'
            }`}>
              {reward?.label || '—'}
            </div>
            {isLockedPremium && (
              <Lock className="w-3.5 h-3.5 text-white/40 mt-1 drop-shadow-md" />
            )}
            {isUnlocked && !isLockedPremium && (
              <Check className="w-3.5 h-3.5 text-green-400 mt-1 drop-shadow-[0_0_4px_rgba(34,197,94,0.8)]" />
            )}
          </div>
        );
      })}
    </div>
  );
}
