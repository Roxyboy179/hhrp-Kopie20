// Shop Items - Exakt wie im Discord Bot
export const SHOP_ITEMS = {
  // Führerscheine (10.000€ - 20.000€, UNBEGRENZT)
  'führerschein_pkw': {
    id: 'führerschein_pkw',
    name: 'Führerschein (PKW)',
    description: 'Berechtigung zum Führen von PKW-Fahrzeugen',
    price: 10000,
    duration: 0,
    autoRenewable: false,
    emoji: '🚗',
    category: 'führerscheine'
  },
  'führerschein_motorrad': {
    id: 'führerschein_motorrad',
    name: 'Motorradschein',
    description: 'Berechtigung zum Führen von Motorrädern',
    price: 15000,
    duration: 0,
    autoRenewable: false,
    emoji: '🏍️',
    category: 'führerscheine'
  },
  'führerschein_lkw': {
    id: 'führerschein_lkw',
    name: 'LKW-Schein',
    description: 'Berechtigung zum Führen von LKW-Fahrzeugen',
    price: 20000,
    duration: 0,
    autoRenewable: false,
    emoji: '🚛',
    category: 'führerscheine'
  },
  
  // Waffenscheine (15.000€ - 25.000€, 30 Tage)
  'waffenschein': {
    id: 'waffenschein',
    name: 'Waffenschein',
    description: 'Berechtigung zum Tragen einer Waffe',
    price: 15000,
    duration: 30,
    autoRenewable: true,
    emoji: '🔫',
    category: 'waffen'
  },
  'jagdschein': {
    id: 'jagdschein',
    name: 'Jagdschein',
    description: 'Berechtigung zur Jagd mit Jagdwaffen',
    price: 25000,
    duration: 30,
    autoRenewable: true,
    emoji: '🎯',
    category: 'waffen'
  },
  
  // Versicherungen (10.000€ - 15.500€, 30 Tage)
  'versicherung_rechtsschutz': {
    id: 'versicherung_rechtsschutz',
    name: 'Rechtsschutzversicherung',
    description: 'Übernahme von Anwalts- und Gerichtskosten',
    price: 10000,
    duration: 30,
    autoRenewable: true,
    emoji: '⚖️',
    category: 'versicherungen'
  },
  'versicherung_pkw': {
    id: 'versicherung_pkw',
    name: 'PKW Versicherung',
    description: 'Unfallschäden für PKW werden übernommen (nur PD)',
    price: 12500,
    duration: 30,
    autoRenewable: true,
    emoji: '🚗',
    category: 'versicherungen'
  },
  'versicherung_lkw': {
    id: 'versicherung_lkw',
    name: 'LKW Versicherung',
    description: 'Unfallschäden für LKW werden übernommen (nur PD)',
    price: 15500,
    duration: 30,
    autoRenewable: true,
    emoji: '🚛',
    category: 'versicherungen'
  },
  'versicherung_kranken': {
    id: 'versicherung_kranken',
    name: 'Krankenversicherung',
    description: '25% Rabatt auf alle DRK-Kosten',
    price: 15000,
    duration: 30,
    autoRenewable: true,
    emoji: '🏥',
    category: 'versicherungen'
  },
  'versicherung_hars': {
    id: 'versicherung_hars',
    name: 'HARS Versicherung',
    description: '15% Rabatt auf alle HARS-Kosten (Pannenhilfe & Abschleppen)',
    price: 15000,
    duration: 30,
    autoRenewable: true,
    emoji: '🚗',
    category: 'versicherungen'
  },
  'versicherung_diebstahl': {
    id: 'versicherung_diebstahl',
    name: 'Diebstahlschutz',
    description: '🛡️ Schutz vor Überfällen - Räuber verliert das Doppelte!',
    price: 15000,
    duration: 30,
    autoRenewable: true,
    emoji: '🛡️',
    category: 'versicherungen'
  },
  
  // VIP & Premiums
  'vip_premium': {
    id: 'vip_premium',
    name: 'VIP Mitgliedschaft',
    description: '⭐ /collect nur 2h Cooldown statt 4h | 💸 -50% auf alle Überweisungsgebühren',
    price: 25000,
    duration: 30,
    autoRenewable: true,
    emoji: '⭐',
    category: 'vip_premiums'
  },
  'vip_platinum': {
    id: 'vip_platinum',
    name: 'VIP Platinum',
    description: '💎 /collect nur 1h Cooldown | 💸 -75% Überweisungsgebühren | 🛒 10% Shop-Rabatt | 🔄 -15% Auto-Verlängerung',
    price: 75000,
    duration: 60,
    autoRenewable: true,
    emoji: '💎',
    category: 'vip_premiums'
  },
  'vip_ultimate': {
    id: 'vip_ultimate',
    name: 'VIP Ultimate',
    description: '⚡ /collect nur 45min Cooldown | 💸 -90% Überweisungsgebühren | 🛒 20% Shop-Rabatt | 🎁 Alle Versicherungen KOSTENLOS | 🔄 -15% Auto-Verlängerung',
    price: 165000,
    duration: 60,
    autoRenewable: true,
    emoji: '⚡',
    category: 'vip_premiums'
  },
  'vip_elite_plus': {
    id: 'vip_elite_plus',
    name: 'VIP ELITE PLUS',
    description: '🏆 /collect 45min Cooldown + 2.000€ Gehaltsklasse (24h) | 💸 KEINE Überweisungsgebühren | 🛒 35% Shop-Rabatt | 🎁 Alle Versicherungen KOSTENLOS | 🔄 -15% Auto-Verlängerung',
    price: 200000,
    duration: 60,
    autoRenewable: true,
    emoji: '🏆',
    category: 'vip_premiums'
  },
  
  // Werkzeuge für /collect Bonus
  'werkzeug_angel': {
    id: 'werkzeug_angel',
    name: 'Angelschein & Angel',
    description: '🎣 +500-2.500€ extra bei /collect (Fische fangen)',
    price: 8000,
    duration: 30,
    autoRenewable: true,
    emoji: '🎣',
    category: 'werkzeuge'
  },
  'werkzeug_hacking': {
    id: 'werkzeug_hacking',
    name: 'Hacking-Tool',
    description: '💻 +1.000-5.000€ extra bei /collect (Daten verkaufen) | 15% Risiko: Strafzettel!',
    price: 18000,
    duration: 30,
    autoRenewable: true,
    emoji: '💻',
    category: 'werkzeuge'
  },
  
  // Schutzbriefe - 2 Nutzungen
  'schutzbrief_polizei': {
    id: 'schutzbrief_polizei',
    name: 'Polizei-Schutzbrief',
    description: '👮 2x Polizei-Strafzettel NICHT bezahlen müssen! (Akte-Eintrag bleibt)',
    price: 50000,
    duration: 0,
    autoRenewable: false,
    emoji: '👮',
    category: 'schutzbriefe',
    isSchutzbrief: true,
    maxNutzungen: 2,
    fraktion: 'polizei'
  },
  'schutzbrief_drk': {
    id: 'schutzbrief_drk',
    name: 'DRK-Schutzbrief',
    description: '🏥 2x DRK-Rechnungen NICHT bezahlen müssen!',
    price: 50000,
    duration: 0,
    autoRenewable: false,
    emoji: '🏥',
    category: 'schutzbriefe',
    isSchutzbrief: true,
    maxNutzungen: 2,
    fraktion: 'drk'
  },
  'schutzbrief_feuerwehr': {
    id: 'schutzbrief_feuerwehr',
    name: 'Feuerwehr-Schutzbrief',
    description: '🚒 2x Feuerwehr-Rechnungen NICHT bezahlen müssen!',
    price: 50000,
    duration: 0,
    autoRenewable: false,
    emoji: '🚒',
    category: 'schutzbriefe',
    isSchutzbrief: true,
    maxNutzungen: 2,
    fraktion: 'feuerwehr'
  },
  'schutzbrief_hars': {
    id: 'schutzbrief_hars',
    name: 'HARS-Schutzbrief',
    description: '🚗 2x HARS-Rechnungen NICHT bezahlen müssen!',
    price: 50000,
    duration: 0,
    autoRenewable: false,
    emoji: '🚗',
    category: 'schutzbriefe',
    isSchutzbrief: true,
    maxNutzungen: 2,
    fraktion: 'hars'
  }
};

// Credits System
export const CREDIT_PURCHASE_OPTIONS = [
  { label: '5 Credits', credits: 5, cost: 5000, discount: 0 },
  { label: '10 Credits', credits: 10, cost: 10000, discount: 0 },
  { label: '25 Credits', credits: 25, cost: 24375, discount: 2.5 },
  { label: '50 Credits', credits: 50, cost: 47500, discount: 5 },
  { label: '75 Credits', credits: 75, cost: 67500, discount: 10 },
  { label: '100 Credits', credits: 100, cost: 90000, discount: 10 },
  { label: '150 Credits', credits: 150, cost: 127500, discount: 15 },
  { label: '200 Credits', credits: 200, cost: 160000, discount: 20 },
  { label: '500 Credits', credits: 500, cost: 375000, discount: 25 }
];

// Bank Limit Upgrades
export const BANK_LIMIT_UPGRADES = [
  { label: '+500.000€ Limit', addLimit: 500000, creditCost: 120, description: '+500.000€ für 120 Credits' },
  { label: '+1.500.000€ Limit', addLimit: 1500000, creditCost: 420, description: '+1.500.000€ für 420 Credits' },
  { label: '+4.000.000€ Limit', addLimit: 4000000, creditCost: 1140, description: '+4.000.000€ für 1.140 Credits' },
  { label: '+9.000.000€ Limit', addLimit: 9000000, creditCost: 4320, description: '+9.000.000€ für 4.320 Credits' },
  { label: '+14.000.000€ Limit', addLimit: 14000000, creditCost: 15000, description: '+14.000.000€ für 15.000 Credits' },
  { label: '+24.000.000€ Limit', addLimit: 24000000, creditCost: 54000, description: '+24.000.000€ für 54.000 Credits' }
];

export const CATEGORY_NAMES = {
  'führerscheine': 'Führerscheine',
  'waffen': 'Waffenscheine',
  'versicherungen': 'Versicherungen',
  'vip_premiums': 'VIP Mitgliedschaften',
  'werkzeuge': 'Werkzeuge',
  'schutzbriefe': 'Schutzbriefe',
  'credits': 'Credits',
  'bank_limit': 'Bank Limit'
};
