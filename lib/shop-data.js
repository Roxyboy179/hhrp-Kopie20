// Shop Items - Exakt wie im Discord Bot
export const SHOP_ITEMS = {
  // Führerscheine (10.000€ - 25.000€, UNBEGRENZT)
  'führerschein_pkw': {
    id: 'führerschein_pkw',
    name: 'Führerschein (PKW)',
    description: 'Vorteile:\n1. Berechtigung zum Führen von PKW-Fahrzeugen\n2. Unbegrenzt gültig\n3. Keine monatlichen Kosten',
    price: 10000,
    duration: 0,
    autoRenewable: false,
    icon: 'Car',
    category: 'führerscheine'
  },
  'führerschein_motorrad': {
    id: 'führerschein_motorrad',
    name: 'Motorradschein',
    description: 'Vorteile:\n1. Berechtigung zum Führen von Motorrädern\n2. Unbegrenzt gültig\n3. Keine monatlichen Kosten',
    price: 15000,
    duration: 0,
    autoRenewable: false,
    icon: 'Bike',
    category: 'führerscheine'
  },
  'führerschein_lkw': {
    id: 'führerschein_lkw',
    name: 'LKW-Schein',
    description: 'Vorteile:\n1. Berechtigung zum Führen von LKW-Fahrzeugen\n2. Unbegrenzt gültig\n3. Keine monatlichen Kosten',
    price: 20000,
    duration: 0,
    autoRenewable: false,
    icon: 'Truck',
    category: 'führerscheine'
  },
  'führerschein_bus': {
    id: 'führerschein_bus',
    name: 'Bus Führerschein',
    description: 'Vorteile:\n1. Berechtigung zum Führen von Bussen\n2. Unbegrenzt gültig\n3. Keine monatlichen Kosten',
    price: 25000,
    duration: 0,
    autoRenewable: false,
    icon: 'Bus',
    category: 'führerscheine'
  },
  
  // Waffenscheine (15.000€ - 25.000€, 30 Tage)
  'waffenschein': {
    id: 'waffenschein',
    name: 'Waffenschein',
    description: 'Vorteile:\n1. Berechtigung zum Tragen einer Waffe\n2. 30 Tage Laufzeit\n3. Automatisch verlängerbar',
    price: 15000,
    duration: 30,
    autoRenewable: true,
    icon: 'Shield',
    category: 'waffen'
  },
  'jagdschein': {
    id: 'jagdschein',
    name: 'Jagdschein',
    description: 'Vorteile:\n1. Berechtigung zur Jagd mit Jagdwaffen\n2. 30 Tage Laufzeit\n3. Automatisch verlängerbar',
    price: 25000,
    duration: 30,
    autoRenewable: true,
    icon: 'Crosshair',
    category: 'waffen'
  },
  
  // Versicherungen (10.000€ - 15.500€, 30 Tage)
  'versicherung_rechtsschutz': {
    id: 'versicherung_rechtsschutz',
    name: 'Rechtsschutzversicherung',
    description: 'Vorteile:\n1. Übernahme von Anwalts- und Gerichtskosten\n2. 30 Tage Laufzeit\n3. Automatisch verlängerbar',
    price: 10000,
    duration: 30,
    autoRenewable: true,
    icon: 'Scale',
    category: 'versicherungen'
  },
  'versicherung_pkw': {
    id: 'versicherung_pkw',
    name: 'PKW Versicherung',
    description: 'Vorteile:\n1. Unfallschäden für PKW werden übernommen (nur PD)\n2. 30 Tage Laufzeit\n3. Automatisch verlängerbar',
    price: 12500,
    duration: 30,
    autoRenewable: true,
    icon: 'Car',
    category: 'versicherungen'
  },
  'versicherung_lkw': {
    id: 'versicherung_lkw',
    name: 'LKW Versicherung',
    description: 'Vorteile:\n1. Unfallschäden für LKW werden übernommen (nur PD)\n2. 30 Tage Laufzeit\n3. Automatisch verlängerbar',
    price: 15500,
    duration: 30,
    autoRenewable: true,
    icon: 'Truck',
    category: 'versicherungen'
  },
  'versicherung_kranken': {
    id: 'versicherung_kranken',
    name: 'Krankenversicherung',
    description: 'Vorteile:\n1. 25% Rabatt auf alle DRK-Kosten\n2. 30 Tage Laufzeit\n3. Automatisch verlängerbar',
    price: 15000,
    duration: 30,
    autoRenewable: true,
    icon: 'Heart',
    category: 'versicherungen'
  },
  'versicherung_hars': {
    id: 'versicherung_hars',
    name: 'HARS Versicherung',
    description: 'Vorteile:\n1. 15% Rabatt auf alle HARS-Kosten\n2. Pannenhilfe und Abschleppen günstiger\n3. 30 Tage Laufzeit\n4. Automatisch verlängerbar',
    price: 15000,
    duration: 30,
    autoRenewable: true,
    icon: 'Wrench',
    category: 'versicherungen'
  },
  'versicherung_diebstahl': {
    id: 'versicherung_diebstahl',
    name: 'Diebstahlschutz',
    description: 'Vorteile:\n1. Schutz vor Überfällen\n2. Räuber verliert das Doppelte\n3. 30 Tage Laufzeit\n4. Automatisch verlängerbar',
    price: 15000,
    duration: 30,
    autoRenewable: true,
    icon: 'Shield',
    category: 'versicherungen'
  },
  
  // VIP & Premiums
  'vip_premium': {
    id: 'vip_premium',
    name: 'VIP Mitgliedschaft',
    description: 'Vorteile:\n1. /collect nur 2h Cooldown statt 4h\n2. 50% Rabatt auf alle Überweisungsgebühren\n3. 30 Tage Laufzeit\n4. Automatisch verlängerbar',
    price: 25000,
    duration: 30,
    autoRenewable: true,
    icon: 'Sparkles',
    category: 'vip_premiums'
  },
  'vip_platinum': {
    id: 'vip_platinum',
    name: 'VIP Platinum',
    description: 'Vorteile:\n1. /collect nur 1h Cooldown\n2. 75% Rabatt auf Überweisungsgebühren\n3. 10% Shop-Rabatt\n4. 15% Rabatt auf Auto-Verlängerung\n5. 60 Tage Laufzeit\n6. Automatisch verlängerbar',
    price: 75000,
    duration: 60,
    autoRenewable: true,
    icon: 'Gem',
    category: 'vip_premiums'
  },
  'vip_ultimate': {
    id: 'vip_ultimate',
    name: 'VIP Ultimate',
    description: 'Vorteile:\n1. /collect nur 45min Cooldown\n2. 90% Rabatt auf Überweisungsgebühren\n3. 20% Shop-Rabatt\n4. Alle Versicherungen KOSTENLOS\n5. 15% Rabatt auf Auto-Verlängerung\n6. 60 Tage Laufzeit\n7. Automatisch verlängerbar',
    price: 165000,
    duration: 60,
    autoRenewable: true,
    icon: 'Zap',
    category: 'vip_premiums'
  },
  'vip_elite_plus': {
    id: 'vip_elite_plus',
    name: 'VIP ELITE PLUS',
    description: 'Vorteile:\n1. /collect 45min Cooldown + 2.000€ Gehaltsklasse (24h)\n2. KEINE Überweisungsgebühren\n3. 35% Shop-Rabatt\n4. Alle Versicherungen KOSTENLOS\n5. 15% Rabatt auf Auto-Verlängerung\n6. 60 Tage Laufzeit\n7. Automatisch verlängerbar',
    price: 200000,
    duration: 60,
    autoRenewable: true,
    icon: 'Award',
    category: 'vip_premiums'
  },
  
  // Luxus-Pass
  'luxus_pass': {
    id: 'luxus_pass',
    name: 'Luxus-Pass',
    description: 'Vorteile:\n1. /collect 45min + 8.000€ Gehaltsklasse (24h)\n2. KEINE Überweisungsgebühren\n3. 50% Shop-Rabatt\n4. Alle Versicherungen KOSTENLOS\n5. 15% Rabatt auf Auto-Verlängerung\n6. 80.000€ + 250 Credits monatlich\n7. +5% Zinsen\n8. 60 Tage Laufzeit\n9. Automatisch verlängerbar',
    price: 500000,
    duration: 60,
    autoRenewable: true,
    icon: 'Crown',
    category: 'vip_premiums'
  },
  
  // ═══════════════════════════════════════════════════════════════
  // CREDITS PÄSSE - Spezielle Pässe mit Credits-Vorteilen
  // ═══════════════════════════════════════════════════════════════
  
  // 1. Free Pass - 7 Tage, Einmalig pro User
  'credits_free_pass': {
    id: 'credits_free_pass',
    name: '7 Tage Free Pass',
    description: 'Vorteile:\n1. 20 Credits Bonus beim Kauf\n2. 5% Rabatt beim Ausgeben von Credits\n3. Nur einmal pro Account verfügbar\n4. 7 Tage Laufzeit',
    price: 0,
    duration: 7,
    autoRenewable: false,
    icon: 'Gift',
    category: 'credits_passes',
    metadata: {
      bonusCreditsOnPurchase: 20,
      creditsSpendingDiscount: 0.05,
      creditsPurchaseBonus: 0,
      monthlyCredits: 0,
      oneTimeOnly: true
    }
  },
  
  // 2. Basic Pass
  'credits_basic_pass': {
    id: 'credits_basic_pass',
    name: 'Credits Basic Pass',
    description: 'Vorteile:\n1. 100 Credits monatlich automatisch\n2. 50 Credits Bonus beim Kauf\n3. 15% Rabatt beim Ausgeben von Credits\n4. 30 Tage Laufzeit\n5. Monatlich verlängerbar',
    price: 75000,
    duration: 30,
    autoRenewable: true,
    icon: 'CreditCard',
    category: 'credits_passes',
    metadata: {
      bonusCreditsOnPurchase: 50,
      creditsSpendingDiscount: 0.15,
      creditsPurchaseBonus: 0,
      monthlyCredits: 100
    }
  },
  
  // 3. Standard Pass
  'credits_standard_pass': {
    id: 'credits_standard_pass',
    name: 'Credits Standard Pass',
    description: 'Vorteile:\n1. 175 Credits monatlich automatisch\n2. 150 Credits Bonus beim Kauf\n3. 25% Rabatt beim Ausgeben von Credits\n4. +15% Bonus beim Credits-Kauf\n5. 30 Tage Laufzeit\n6. Monatlich verlängerbar',
    price: 190000,
    duration: 30,
    autoRenewable: true,
    icon: 'Star',
    category: 'credits_passes',
    metadata: {
      bonusCreditsOnPurchase: 150,
      creditsSpendingDiscount: 0.25,
      creditsPurchaseBonus: 0.15,
      monthlyCredits: 175
    }
  },
  
  // 4. Elite+ Pass
  'credits_elite_plus_pass': {
    id: 'credits_elite_plus_pass',
    name: 'Credits Elite+ Pass',
    description: 'Vorteile:\n1. 250 Credits monatlich automatisch\n2. 215 Credits Bonus beim Kauf\n3. 35% Rabatt beim Ausgeben von Credits\n4. +25% Bonus beim Credits-Kauf\n5. 30 Tage Laufzeit\n6. Monatlich verlängerbar',
    price: 345000,
    duration: 30,
    autoRenewable: true,
    icon: 'Crown',
    category: 'credits_passes',
    metadata: {
      bonusCreditsOnPurchase: 215,
      creditsSpendingDiscount: 0.35,
      creditsPurchaseBonus: 0.25,
      monthlyCredits: 250
    }
  },
  
  // Werkzeuge für /collect Bonus
  'werkzeug_angel': {
    id: 'werkzeug_angel',
    name: 'Angelschein & Angel',
    description: 'Vorteile:\n1. +500-2.500€ extra bei /collect\n2. Fische fangen als Bonus\n3. 30 Tage Laufzeit\n4. Automatisch verlängerbar',
    price: 8000,
    duration: 30,
    autoRenewable: true,
    icon: 'Fish',
    category: 'werkzeuge'
  },
  'werkzeug_hacking': {
    id: 'werkzeug_hacking',
    name: 'Hacking-Tool',
    description: 'Vorteile:\n1. +1.000-5.000€ extra bei /collect\n2. Daten verkaufen als Bonus\n3. 15% Risiko: Strafzettel\n4. 30 Tage Laufzeit\n5. Automatisch verlängerbar',
    price: 18000,
    duration: 30,
    autoRenewable: true,
    icon: 'Laptop',
    category: 'werkzeuge'
  },
  
  // Schutzbriefe - 2 Nutzungen
  'schutzbrief_polizei': {
    id: 'schutzbrief_polizei',
    name: 'Polizei-Schutzbrief',
    description: 'Vorteile:\n1. 2x Polizei-Strafzettel NICHT bezahlen\n2. Akte-Eintrag bleibt bestehen\n3. Unbegrenzt gültig\n4. Keine monatlichen Kosten',
    price: 50000,
    duration: 0,
    autoRenewable: false,
    icon: 'Shield',
    category: 'schutzbriefe',
    isSchutzbrief: true,
    maxNutzungen: 2,
    fraktion: 'polizei'
  },
  'schutzbrief_drk': {
    id: 'schutzbrief_drk',
    name: 'DRK-Schutzbrief',
    description: 'Vorteile:\n1. 2x DRK-Rechnungen NICHT bezahlen\n2. Unbegrenzt gültig\n3. Keine monatlichen Kosten',
    price: 50000,
    duration: 0,
    autoRenewable: false,
    icon: 'Ambulance',
    category: 'schutzbriefe',
    isSchutzbrief: true,
    maxNutzungen: 2,
    fraktion: 'drk'
  },
  'schutzbrief_feuerwehr': {
    id: 'schutzbrief_feuerwehr',
    name: 'Feuerwehr-Schutzbrief',
    description: 'Vorteile:\n1. 2x Feuerwehr-Rechnungen NICHT bezahlen\n2. Unbegrenzt gültig\n3. Keine monatlichen Kosten',
    price: 50000,
    duration: 0,
    autoRenewable: false,
    icon: 'Flame',
    category: 'schutzbriefe',
    isSchutzbrief: true,
    maxNutzungen: 2,
    fraktion: 'feuerwehr'
  },
  'schutzbrief_hars': {
    id: 'schutzbrief_hars',
    name: 'HARS-Schutzbrief',
    description: 'Vorteile:\n1. 2x HARS-Rechnungen NICHT bezahlen\n2. Unbegrenzt gültig\n3. Keine monatlichen Kosten',
    price: 50000,
    duration: 0,
    autoRenewable: false,
    icon: 'Wrench',
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
