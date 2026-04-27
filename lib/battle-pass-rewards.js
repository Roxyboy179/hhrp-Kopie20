// ============================================
// HHRP Battle Pass - Rewards Definition
// 30 Tiers mit Free + Premium Track
// ============================================

export const BATTLE_PASS_CONFIG = {
  COST_CREDITS: 1500,
  TIERS_COUNT: 30,
  DURATION_DAYS: 30,
};

// Alle möglichen Belohnungstypen
export const REWARD_TYPES = {
  CREDITS: 'credits',
  MONEY: 'money',
  ITEM: 'item',
  XP: 'xp',
  PASS: 'pass',
};

// Hardcoded Belohnungen für 30 Tiers
// Jeder Tier hat: free (für alle) und premium (nur Käufer)
// ⚠️ Free Credits wurden um 65% reduziert (auf 35% des Originals)
export const BATTLE_PASS_REWARDS = [
  // Tier 1
  {
    tier: 1,
    free: { type: REWARD_TYPES.CREDITS, amount: 18, label: '18 Credits' },
    premium: { type: REWARD_TYPES.MONEY, amount: 5000, label: '5.000€' },
  },
  // Tier 2
  {
    tier: 2,
    free: { type: REWARD_TYPES.XP, amount: 500, label: '500 XP' },
    premium: { type: REWARD_TYPES.CREDITS, amount: 200, label: '200 Credits' },
  },
  // Tier 3
  {
    tier: 3,
    free: { type: REWARD_TYPES.CREDITS, amount: 26, label: '26 Credits' },
    premium: { type: REWARD_TYPES.ITEM, item_id: 'führerschein_b', label: 'Führerschein B', alternativeCredits: 300 },
  },
  // Tier 4
  {
    tier: 4,
    free: { type: REWARD_TYPES.MONEY, amount: 3000, label: '3.000€' },
    premium: { type: REWARD_TYPES.CREDITS, amount: 250, label: '250 Credits' },
  },
  // Tier 5
  {
    tier: 5,
    free: { type: REWARD_TYPES.XP, amount: 750, label: '750 XP' },
    premium: { type: REWARD_TYPES.MONEY, amount: 10000, label: '10.000€' },
  },
  // Tier 6
  {
    tier: 6,
    free: { type: REWARD_TYPES.CREDITS, amount: 35, label: '35 Credits' },
    premium: { type: REWARD_TYPES.ITEM, item_id: 'führerschein_a', label: 'Führerschein A', alternativeCredits: 400 },
  },
  // Tier 7
  {
    tier: 7,
    free: { type: REWARD_TYPES.MONEY, amount: 4000, label: '4.000€' },
    premium: { type: REWARD_TYPES.CREDITS, amount: 300, label: '300 Credits' },
  },
  // Tier 8
  {
    tier: 8,
    free: { type: REWARD_TYPES.XP, amount: 1000, label: '1.000 XP' },
    premium: { type: REWARD_TYPES.ITEM, item_id: 'waffenschein_klein', label: 'Kleiner Waffenschein', alternativeCredits: 350 },
  },
  // Tier 9
  {
    tier: 9,
    free: { type: REWARD_TYPES.CREDITS, amount: 44, label: '44 Credits' },
    premium: { type: REWARD_TYPES.MONEY, amount: 15000, label: '15.000€' },
  },
  // Tier 10 - Meilenstein
  {
    tier: 10,
    free: { type: REWARD_TYPES.MONEY, amount: 5000, label: '5.000€' },
    premium: { type: REWARD_TYPES.PASS, pass_id: 'vip_premium_7d', label: '7 Tage VIP Premium', alternativeCredits: 500 },
  },
  // Tier 11
  {
    tier: 11,
    free: { type: REWARD_TYPES.XP, amount: 1250, label: '1.250 XP' },
    premium: { type: REWARD_TYPES.CREDITS, amount: 350, label: '350 Credits' },
  },
  // Tier 12
  {
    tier: 12,
    free: { type: REWARD_TYPES.CREDITS, amount: 53, label: '53 Credits' },
    premium: { type: REWARD_TYPES.MONEY, amount: 20000, label: '20.000€' },
  },
  // Tier 13
  {
    tier: 13,
    free: { type: REWARD_TYPES.MONEY, amount: 6000, label: '6.000€' },
    premium: { type: REWARD_TYPES.ITEM, item_id: 'führerschein_c', label: 'Führerschein C', alternativeCredits: 450 },
  },
  // Tier 14
  {
    tier: 14,
    free: { type: REWARD_TYPES.XP, amount: 1500, label: '1.500 XP' },
    premium: { type: REWARD_TYPES.CREDITS, amount: 400, label: '400 Credits' },
  },
  // Tier 15 - Meilenstein
  {
    tier: 15,
    free: { type: REWARD_TYPES.CREDITS, amount: 61, label: '61 Credits' },
    premium: { type: REWARD_TYPES.ITEM, item_id: 'waffenschein_gross', label: 'Großer Waffenschein', alternativeCredits: 500 },
  },
  // Tier 16
  {
    tier: 16,
    free: { type: REWARD_TYPES.MONEY, amount: 7000, label: '7.000€' },
    premium: { type: REWARD_TYPES.MONEY, amount: 25000, label: '25.000€' },
  },
  // Tier 17
  {
    tier: 17,
    free: { type: REWARD_TYPES.XP, amount: 1750, label: '1.750 XP' },
    premium: { type: REWARD_TYPES.CREDITS, amount: 450, label: '450 Credits' },
  },
  // Tier 18
  {
    tier: 18,
    free: { type: REWARD_TYPES.CREDITS, amount: 70, label: '70 Credits' },
    premium: { type: REWARD_TYPES.ITEM, item_id: 'versicherung_standard', label: 'Versicherung (Standard)', alternativeCredits: 400 },
  },
  // Tier 19
  {
    tier: 19,
    free: { type: REWARD_TYPES.MONEY, amount: 8000, label: '8.000€' },
    premium: { type: REWARD_TYPES.MONEY, amount: 30000, label: '30.000€' },
  },
  // Tier 20 - Großer Meilenstein
  {
    tier: 20,
    free: { type: REWARD_TYPES.XP, amount: 2000, label: '2.000 XP' },
    premium: { type: REWARD_TYPES.PASS, pass_id: 'vip_platinum_30d', label: '30 Tage VIP Platinum', alternativeCredits: 800 },
  },
  // Tier 21
  {
    tier: 21,
    free: { type: REWARD_TYPES.CREDITS, amount: 79, label: '79 Credits' },
    premium: { type: REWARD_TYPES.CREDITS, amount: 500, label: '500 Credits' },
  },
  // Tier 22
  {
    tier: 22,
    free: { type: REWARD_TYPES.MONEY, amount: 9000, label: '9.000€' },
    premium: { type: REWARD_TYPES.MONEY, amount: 35000, label: '35.000€' },
  },
  // Tier 23
  {
    tier: 23,
    free: { type: REWARD_TYPES.XP, amount: 2250, label: '2.250 XP' },
    premium: { type: REWARD_TYPES.ITEM, item_id: 'führerschein_ce', label: 'Führerschein CE', alternativeCredits: 550 },
  },
  // Tier 24
  {
    tier: 24,
    free: { type: REWARD_TYPES.CREDITS, amount: 88, label: '88 Credits' },
    premium: { type: REWARD_TYPES.MONEY, amount: 40000, label: '40.000€' },
  },
  // Tier 25 - Meilenstein
  {
    tier: 25,
    free: { type: REWARD_TYPES.MONEY, amount: 10000, label: '10.000€' },
    premium: { type: REWARD_TYPES.CREDITS, amount: 600, label: '600 Credits' },
  },
  // Tier 26
  {
    tier: 26,
    free: { type: REWARD_TYPES.XP, amount: 2500, label: '2.500 XP' },
    premium: { type: REWARD_TYPES.ITEM, item_id: 'flugschein', label: 'Flugschein', alternativeCredits: 700 },
  },
  // Tier 27
  {
    tier: 27,
    free: { type: REWARD_TYPES.CREDITS, amount: 96, label: '96 Credits' },
    premium: { type: REWARD_TYPES.MONEY, amount: 45000, label: '45.000€' },
  },
  // Tier 28
  {
    tier: 28,
    free: { type: REWARD_TYPES.MONEY, amount: 12000, label: '12.000€' },
    premium: { type: REWARD_TYPES.CREDITS, amount: 700, label: '700 Credits' },
  },
  // Tier 29
  {
    tier: 29,
    free: { type: REWARD_TYPES.XP, amount: 3000, label: '3.000 XP' },
    premium: { type: REWARD_TYPES.MONEY, amount: 50000, label: '50.000€' },
  },
  // Tier 30 - FINALE BELOHNUNG
  {
    tier: 30,
    free: { type: REWARD_TYPES.CREDITS, amount: 105, label: '105 Credits' },
    premium: { type: REWARD_TYPES.PASS, pass_id: 'vip_elite_plus_30d', label: '30 Tage VIP Elite+', alternativeCredits: 1000 },
  },
];

// Hilfsfunktion: Belohnung für Tier abrufen
export function getRewardForTier(tier, isPremium = false) {
  const tierData = BATTLE_PASS_REWARDS.find(t => t.tier === tier);
  if (!tierData) return null;
  return isPremium ? tierData.premium : tierData.free;
}

// Hilfsfunktion: Alle Belohnungen für Track abrufen
export function getAllRewardsForTrack(isPremium = false) {
  return BATTLE_PASS_REWARDS.map(t => ({
    tier: t.tier,
    reward: isPremium ? t.premium : t.free,
  }));
}

// Gesamtwert berechnen (für Marketing)
// WICHTIG: 1 Credit = 1.000€ Wert
export function calculateTotalValue() {
  let freeValue = 0;
  let premiumValue = 0;

  BATTLE_PASS_REWARDS.forEach(tier => {
    if (tier.free.type === REWARD_TYPES.CREDITS) freeValue += tier.free.amount;
    if (tier.free.type === REWARD_TYPES.MONEY) freeValue += tier.free.amount / 1000; // 1.000€ = 1 Credit Wert
    
    if (tier.premium.type === REWARD_TYPES.CREDITS) premiumValue += tier.premium.amount;
    if (tier.premium.type === REWARD_TYPES.MONEY) premiumValue += tier.premium.amount / 1000;
    if (tier.premium.alternativeCredits) premiumValue += tier.premium.alternativeCredits;
  });

  return {
    free: Math.round(freeValue),
    premium: Math.round(premiumValue + freeValue),
    savings: Math.round((premiumValue + freeValue) - BATTLE_PASS_CONFIG.COST_CREDITS),
  };
}
