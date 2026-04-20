// ═══════════════════════════════════════════════════════════════
// 🎉 SHOP-AKTIONEN / RABATT-KAMPAGNEN — Shared Logic
// ═══════════════════════════════════════════════════════════════
// Wird sowohl vom Frontend (ShopView, Landingpage) als auch vom
// Backend (/api/shop/purchase, /api/shop/gift) importiert, damit die
// Preisberechnung überall EXAKT gleich ist und der angezeigte
// Rabatt auch tatsächlich abgezogen wird.
//
// Neue Aktion anlegen: einfach Eintrag zu SHOP_PROMOTIONS hinzufügen.
//
// eligibility:
//   - 'non_vip'  → nur User OHNE aktives VIP oder Luxus-Pass
//   - 'all'      → alle User
//
// appliesTo:
//   - categories: Liste der SHOP_ITEMS.category, auf die der Rabatt greift
//   - itemIds:    (optional) konkrete Item-IDs
//
// discount:            Prozent als Dezimalzahl (0.25 = 25% Rabatt)
// startDate/endDate:   ISO-Date-Strings (inkl. Uhrzeit)
// ═══════════════════════════════════════════════════════════════

export const SHOP_PROMOTIONS = [
  {
    id: 'fuehrerschein_fruehjahr_2026',
    title: 'Frühjahrs-Aktion: Führerscheine',
    description: '25% Rabatt auf ALLE Führerscheine',
    iconName: 'Car',
    discount: 0.25,
    startDate: '2026-04-01T00:00:00',
    endDate:   '2026-05-21T23:59:59',
    eligibility: 'non_vip',
    appliesTo: { categories: ['führerscheine'] },
    badgeLabel: '-25% Aktion',
    notEligibleReason: 'Nur für Nutzer ohne VIP oder Luxus-Pass',
  },
  {
    id: 'vip_fruehjahr_2026',
    title: 'Frühjahrs-Aktion: VIP Platinum & höher',
    description: '30% Rabatt auf VIP Platinum, Ultimate, Elite Plus und Luxus-Pass',
    iconName: 'Gem',
    discount: 0.30,
    startDate: '2026-04-01T00:00:00',
    endDate:   '2026-05-21T23:59:59',
    eligibility: 'non_vip',
    appliesTo: {
      itemIds: ['vip_platinum', 'vip_ultimate', 'vip_elite_plus', 'luxus_pass'],
    },
    badgeLabel: '-30% Aktion',
    notEligibleReason: 'Nur für Nutzer ohne VIP oder Luxus-Pass',
  },
];

// Hilfsfunktion: prüft ob User qualifiziert
// userHighestVIP: -1 = kein VIP, 0+ = hat irgendeinen VIP/Luxus-Pass
const isUserEligible = (promo, userHighestVIP) => {
  if (!promo || !promo.eligibility) return true;
  if (promo.eligibility === 'all') return true;
  if (promo.eligibility === 'non_vip') return userHighestVIP < 0;
  return false;
};

// Aktions-Match für ein bestimmtes Item (für calculatePrice).
// `item` muss ein SHOP_ITEMS-Objekt sein (mit .category).
// `now` ist optional (Default = aktuelle Zeit) – nützlich für Tests.
export const findActivePromotion = (item, itemId, userHighestVIP, now = new Date()) => {
  if (!item) return null;
  for (const promo of SHOP_PROMOTIONS) {
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    if (now < start || now > end) continue;

    const inIds = promo.appliesTo?.itemIds?.includes(itemId);
    const inCats = promo.appliesTo?.categories?.includes(item.category);
    if (!inIds && !inCats) continue;

    if (!isUserEligible(promo, userHighestVIP)) continue;

    return promo;
  }
  return null;
};

// Aktive Aktion (ohne Item-Filter) für den Banner.
// Wenn `userHighestVIP` nicht übergeben wird (undefined), wird die
// Eligibility NICHT geprüft (hilfreich auf der Landingpage für Gäste).
export const getActiveBannerPromotion = (userHighestVIP, now = new Date()) => {
  const checkEligibility = typeof userHighestVIP === 'number';
  for (const promo of SHOP_PROMOTIONS) {
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    if (now < start || now > end) continue;
    if (checkEligibility && !isUserEligible(promo, userHighestVIP)) continue;
    return promo;
  }
  return null;
};

// Liefert ALLE aktuell aktiven Aktionen für den Banner-Slider.
// Gleiche Eligibility-Logik wie `getActiveBannerPromotion`.
export const getActiveBannerPromotions = (userHighestVIP, now = new Date()) => {
  const checkEligibility = typeof userHighestVIP === 'number';
  const result = [];
  for (const promo of SHOP_PROMOTIONS) {
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    if (now < start || now > end) continue;
    if (checkEligibility && !isUserEligible(promo, userHighestVIP)) continue;
    result.push(promo);
  }
  return result;
};

// Formatiert ein Datum für die Anzeige (DD.MM.YYYY)
export const formatPromoDate = (iso) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
};

// Countdown-Berechnung: Liefert { days, hours, minutes, expired }
export const getPromoCountdown = (promo, now = new Date()) => {
  if (!promo) return null;
  const end = new Date(promo.endDate);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes, expired: false };
};
