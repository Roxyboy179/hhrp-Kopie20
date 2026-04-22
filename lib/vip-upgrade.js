// VIP Upgrade Pricing System
// Identisch mit Discord Bot Logik (Zeile 18320+ in index.js)

import { SHOP_ITEMS } from './shop-data.js';

/**
 * VIP Hierarchie (niedrig → hoch)
 */
const VIP_HIERARCHY = {
  'vip_premium': 0,
  'vip_platinum': 1,
  'vip_ultimate': 2,
  'vip_elite_plus': 3,
  'luxus_pass': 4
};

const VIP_NAMES = {
  'vip_premium': 'VIP Premium',
  'vip_platinum': 'VIP Platinum',
  'vip_ultimate': 'VIP Ultimate',
  'vip_elite_plus': 'VIP ELITE PLUS',
  'luxus_pass': 'Luxus-Pass'
};

/**
 * Berechne Upgrade-Rabatt basierend auf verbleibenden Tagen
 * Identisch mit Discord Bot Logik
 */
function getUpgradeDiscount(daysLeft) {
  if (daysLeft >= 30) return 0.30; // 30% Rabatt
  if (daysLeft >= 20) return 0.15; // 15% Rabatt
  if (daysLeft >= 10) return 0.05; // 5% Rabatt
  return 0; // Kein Rabatt
}

/**
 * Finde den aktuell aktiven VIP-Pass eines Users
 * @param {Array} userLicenses - Array von Lizenzen des Users
 * @returns {Object|null} - { vipId, expiresAt, daysLeft, name, price } oder null
 */
export function findActiveVipPass(userLicenses) {
  if (!Array.isArray(userLicenses) || userLicenses.length === 0) {
    return null;
  }

  const now = Date.now();
  
  // Sortiere VIP-Pässe nach Hierarchie (höchster zuerst)
  const vipIds = Object.keys(VIP_HIERARCHY);
  const activeVips = [];

  for (const license of userLicenses) {
    let licenseId = null;
    let expiresAt = null;

    if (typeof license === 'string') {
      licenseId = license;
    } else if (typeof license === 'object' && license) {
      licenseId = license.id || license.name;
      expiresAt = license.expiresAt;
    }

    // Ist es ein VIP-Pass?
    if (!licenseId || !vipIds.includes(licenseId)) continue;

    // Ist er noch aktiv?
    const isActive = !expiresAt || expiresAt > now;
    if (!isActive) continue;

    activeVips.push({
      vipId: licenseId,
      expiresAt: expiresAt || 0,
      level: VIP_HIERARCHY[licenseId]
    });
  }

  if (activeVips.length === 0) return null;

  // Höchster VIP-Pass gewinnt
  activeVips.sort((a, b) => b.level - a.level);
  const activeVip = activeVips[0];

  // Verbleibende Tage berechnen
  let daysLeft = 0;
  if (activeVip.expiresAt && activeVip.expiresAt > 0) {
    daysLeft = Math.ceil((activeVip.expiresAt - now) / (24 * 60 * 60 * 1000));
  }

  const vipItem = SHOP_ITEMS[activeVip.vipId];
  
  return {
    vipId: activeVip.vipId,
    expiresAt: activeVip.expiresAt,
    daysLeft: daysLeft,
    name: VIP_NAMES[activeVip.vipId] || vipItem?.name || activeVip.vipId,
    price: vipItem?.price || 0,
    level: activeVip.level
  };
}

/**
 * Berechne VIP-Upgrade-Pricing für einen User
 * @param {string} targetVipId - Ziel-VIP-Pass (z.B. 'vip_platinum')
 * @param {Array} userLicenses - Lizenzen des Users
 * @returns {Object} - { isUpgrade, originalPrice, discountedPrice, discountPercent, discountAmount, daysLeft, currentVip }
 */
export function calculateVipUpgradePrice(targetVipId, userLicenses) {
  const targetItem = SHOP_ITEMS[targetVipId];
  if (!targetItem) {
    return {
      isUpgrade: false,
      originalPrice: 0,
      discountedPrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      daysLeft: 0,
      currentVip: null
    };
  }

  const originalPrice = targetItem.price;
  
  // Ist der Ziel-Pass überhaupt ein VIP-Pass?
  const targetLevel = VIP_HIERARCHY[targetVipId];
  if (targetLevel === undefined) {
    return {
      isUpgrade: false,
      originalPrice: originalPrice,
      discountedPrice: originalPrice,
      discountPercent: 0,
      discountAmount: 0,
      daysLeft: 0,
      currentVip: null
    };
  }

  // Hat der User einen aktiven VIP-Pass?
  const currentVip = findActiveVipPass(userLicenses);
  if (!currentVip) {
    return {
      isUpgrade: false,
      originalPrice: originalPrice,
      discountedPrice: originalPrice,
      discountPercent: 0,
      discountAmount: 0,
      daysLeft: 0,
      currentVip: null
    };
  }

  // Ist der Ziel-Pass höher als der aktuelle?
  if (targetLevel <= currentVip.level) {
    // Kein Upgrade (gleiche oder niedrigere Stufe)
    return {
      isUpgrade: false,
      originalPrice: originalPrice,
      discountedPrice: originalPrice,
      discountPercent: 0,
      discountAmount: 0,
      daysLeft: currentVip.daysLeft,
      currentVip: currentVip
    };
  }

  // ✅ ES IST EIN UPGRADE!
  // Rabatt-Staffelung anwenden
  const discountPercent = getUpgradeDiscount(currentVip.daysLeft);
  
  // WICHTIG: Rabatt auf ALTEN VIP-Preis anwenden (wie im Discord Bot)
  const discountAmount = Math.floor(currentVip.price * discountPercent);
  const discountedPrice = originalPrice - discountAmount;

  return {
    isUpgrade: true,
    originalPrice: originalPrice,
    discountedPrice: discountedPrice,
    discountPercent: discountPercent,
    discountAmount: discountAmount,
    daysLeft: currentVip.daysLeft,
    currentVip: currentVip
  };
}

/**
 * Kann ein User einen bestimmten VIP-Pass kaufen/upgraden?
 * @param {string} targetVipId - Ziel-VIP-Pass
 * @param {Array} userLicenses - Lizenzen des Users
 * @returns {boolean}
 */
export function canPurchaseVip(targetVipId, userLicenses) {
  const targetLevel = VIP_HIERARCHY[targetVipId];
  if (targetLevel === undefined) return true; // Kein VIP-Pass

  const currentVip = findActiveVipPass(userLicenses);
  if (!currentVip) return true; // Kein aktiver VIP

  // Kann nur höhere VIP-Stufen kaufen
  return targetLevel > currentVip.level;
}
