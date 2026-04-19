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

// Credits System – Kauf-Optionen (identisch mit Discord Bot)
export const CREDIT_PURCHASE_OPTIONS = [
  { label: '5 Credits', credits: 5, cost: 5000, discount: 0 },
  { label: '10 Credits', credits: 10, cost: 10000, discount: 0 },
  { label: '25 Credits', credits: 25, cost: 24375, discount: 2.5 },
  { label: '50 Credits', credits: 50, cost: 47500, discount: 5 },
  { label: '75 Credits', credits: 75, cost: 67500, discount: 10 },
  { label: '100 Credits', credits: 100, cost: 90000, discount: 10 },
  { label: '150 Credits', credits: 150, cost: 127500, discount: 15 },
  { label: '200 Credits', credits: 200, cost: 170000, discount: 15 },
  { label: '250 Credits', credits: 250, cost: 200000, discount: 20 },
  { label: '350 Credits', credits: 350, cost: 280000, discount: 20 },
  { label: '500 Credits', credits: 500, cost: 375000, discount: 25 },
  { label: '750 Credits', credits: 750, cost: 525000, discount: 30 },
  { label: '1.000 Credits', credits: 1000, cost: 700000, discount: 30 },
  { label: '1.500 Credits', credits: 1500, cost: 975000, discount: 35 },
  { label: '2.000 Credits', credits: 2000, cost: 1300000, discount: 35 },
  { label: '2.500 Credits', credits: 2500, cost: 1500000, discount: 40 },
  { label: '3.000 Credits', credits: 3000, cost: 1800000, discount: 40 },
  { label: '4.000 Credits', credits: 4000, cost: 2200000, discount: 45 },
  { label: '5.000 Credits', credits: 5000, cost: 2750000, discount: 45 },
  { label: '7.500 Credits', credits: 7500, cost: 3750000, discount: 50 },
  { label: '10.000 Credits', credits: 10000, cost: 5000000, discount: 50 },
  { label: '15.000 Credits', credits: 15000, cost: 6750000, discount: 55 },
  { label: '25.000 Credits', credits: 25000, cost: 10000000, discount: 60 },
  { label: '50.000 Credits', credits: 50000, cost: 17500000, discount: 65 },
  { label: '100.000 Credits', credits: 100000, cost: 30000000, discount: 70 }
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

// Credits-Ausgaben Optionen (identisch mit Discord Bot)
export const CREDIT_SPEND_ITEMS = [
  // ── Basis-Extras ──
  { id: 'custom_kontonummer', label: 'Custom Kontonummer', description: 'Eigene 9-stellige Kontonummer wählen (48h Cooldown)', creditCost: 500, emoji: '🔢', group: 'Basis' },
  { id: 'bank_pin_change', label: 'Bank-PIN ändern', description: 'Neue 3-stellige Bank-PIN festlegen (48h Cooldown)', creditCost: 500, emoji: '🔐', group: 'Basis' },
  { id: 'cooldown_reset', label: 'Cooldown-Reset', description: '/collect Cooldown sofort zurücksetzen (1x pro Tag)', creditCost: 150, emoji: '⏰', group: 'Basis' },
  { id: 'steuerbefreiung', label: 'Steuerbefreiung', description: 'Keine Steuern bei /collect für 8 Stunden', creditCost: 200, emoji: '📋', group: 'Basis' },
  // ── Boosts ──
  { id: 'double_xp', label: 'Double XP Boost', description: '2x XP bei allen Aktionen für 4 Stunden', creditCost: 300, emoji: '✨', group: 'Boosts' },
  { id: 'collect_boost', label: 'Collect Boost', description: '+50% mehr Geld bei /collect für 6 Stunden', creditCost: 250, emoji: '💸', group: 'Boosts' },
  { id: 'gehaltsbonus', label: 'Gehaltsbonus', description: '+2.000€ extra pro /collect für 24 Stunden', creditCost: 400, emoji: '💼', group: 'Boosts' },
  // ── Exklusiv ──
  { id: 'premium_badge', label: 'Premium Badge', description: 'Exklusives Premium-Abzeichen für 30 Tage', creditCost: 1000, emoji: '🏅', group: 'Exklusiv' },
  { id: 'schutzbrief_upgrade', label: 'Schutzbrief+', description: 'Einen Schutzbrief um +2 Nutzungen erweitern', creditCost: 600, emoji: '🛡️', group: 'Exklusiv' },
  { id: 'ueberweisungs_bypass', label: 'Gebühren-Bypass', description: 'Keine Überweisungsgebühren für 24 Stunden', creditCost: 350, emoji: '🔓', group: 'Exklusiv' },
  { id: 'konto_schutz', label: 'Konto-Schutz', description: '24h Schutz vor Überfällen (/überfallen)', creditCost: 450, emoji: '🔐', group: 'Exklusiv' },
  { id: 'zinsen_boost', label: 'Zinsen-Boost', description: 'Doppelte Sparkonto-Zinsen für 7 Tage', creditCost: 800, emoji: '📈', group: 'Exklusiv' },
  { id: 'gluecksrad', label: 'Glücksrad-Spin', description: 'Zufallspreis: 0€ bis 50.000€ Gewinn!', creditCost: 200, emoji: '🎰', group: 'Exklusiv' },
  { id: 'lotto_bundle', label: 'Lotto-Bundle (5x)', description: '5 Lotterie-Tickets auf einmal kaufen', creditCost: 300, emoji: '🎟️', group: 'Exklusiv' },
  { id: 'gehalt_multiplikator', label: 'Gehalt x2', description: 'Nächstes /collect gibt doppeltes Gehalt (1x)', creditCost: 500, emoji: '🔥', group: 'Exklusiv' },
  { id: 'exklusiver_titel', label: 'Custom Titel', description: 'Eigenen Titel vor dem Namen setzen (30 Tage)', creditCost: 2000, emoji: '👑', group: 'Exklusiv' }
];

// Mystery Boxes (identisch mit Discord Bot)
export const CREDIT_CRATES = {
  bronze: {
    id: 'bronze',
    name: 'Bronze Box',
    emoji: '🟫',
    creditCost: 100,
    color: '#CD7F32',
    maxPayout: 50000,
    description: 'Kleiner Einstieg – bis 50.000€ Gewinn möglich',
    rewards: [
      { chance: 0.40, type: 'money', min: 1000, max: 5000, label: 'Kleiner Gewinn' },
      { chance: 0.30, type: 'money', min: 5000, max: 15000, label: 'Mittlerer Gewinn' },
      { chance: 0.20, type: 'money', min: 15000, max: 30000, label: 'Großer Gewinn' },
      { chance: 0.08, type: 'money', min: 30000, max: 50000, label: 'Mega Gewinn' },
      { chance: 0.02, type: 'credits', min: 5, max: 20, label: 'Credit-Rückgewinn' }
    ]
  },
  silber: {
    id: 'silber',
    name: 'Silber Box',
    emoji: '⬜',
    creditCost: 500,
    color: '#C0C0C0',
    maxPayout: 200000,
    description: 'Solide Chancen – bis 200.000€ Gewinn möglich',
    rewards: [
      { chance: 0.30, type: 'money', min: 5000, max: 20000, label: 'Kleiner Gewinn' },
      { chance: 0.30, type: 'money', min: 20000, max: 50000, label: 'Mittlerer Gewinn' },
      { chance: 0.20, type: 'money', min: 50000, max: 100000, label: 'Großer Gewinn' },
      { chance: 0.15, type: 'money', min: 100000, max: 200000, label: 'Mega Gewinn' },
      { chance: 0.05, type: 'credits', min: 50, max: 100, label: 'Credit-Rückgewinn' }
    ]
  },
  gold: {
    id: 'gold',
    name: 'Gold Box',
    emoji: '🟨',
    creditCost: 2000,
    color: '#FFD700',
    maxPayout: 1000000,
    description: 'Große Gewinne – bis 1.000.000€ möglich',
    rewards: [
      { chance: 0.25, type: 'money', min: 50000, max: 100000, label: 'Kleiner Gewinn' },
      { chance: 0.30, type: 'money', min: 100000, max: 250000, label: 'Mittlerer Gewinn' },
      { chance: 0.25, type: 'money', min: 250000, max: 500000, label: 'Großer Gewinn' },
      { chance: 0.15, type: 'money', min: 500000, max: 1000000, label: 'Mega Gewinn' },
      { chance: 0.05, type: 'credits', min: 500, max: 1000, label: 'Credit-Rückgewinn' }
    ]
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond Box',
    emoji: '💠',
    creditCost: 10000,
    color: '#00FFFF',
    maxPayout: 5000000,
    description: 'Jackpot-Chance – bis 5.000.000€ möglich',
    rewards: [
      { chance: 0.20, type: 'money', min: 200000, max: 500000, label: 'Kleiner Gewinn' },
      { chance: 0.30, type: 'money', min: 500000, max: 1500000, label: 'Mittlerer Gewinn' },
      { chance: 0.25, type: 'money', min: 1500000, max: 3000000, label: 'Großer Gewinn' },
      { chance: 0.15, type: 'money', min: 3000000, max: 5000000, label: 'Mega Gewinn' },
      { chance: 0.10, type: 'credits', min: 2000, max: 5000, label: 'Credit-Rückgewinn' }
    ]
  }
};

export const CATEGORY_NAMES = {
  'führerscheine': 'Führerscheine',
  'waffen': 'Waffenscheine',
  'versicherungen': 'Versicherungen',
  'vip_premiums': 'VIP Mitgliedschaften',
  'werkzeuge': 'Werkzeuge',
  'schutzbriefe': 'Schutzbriefe',
  'credits': 'Credits',
  'bank_limit': 'Bank Limit',
  'credit_spend': 'Credits-Extras',
  'mystery_box': 'Mystery Boxes'
};
