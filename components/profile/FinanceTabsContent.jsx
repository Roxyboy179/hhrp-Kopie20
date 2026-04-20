// ===================================================
// SHOP PROCESSOR - Bot Integration
// ===================================================
// Verarbeitet Shop-Käufe von der Website
// Speichert in SUPABASE + LOKALE DATA/ DATEIEN

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Lade Config
const configPath = path.join(__dirname, '..', 'config.json');
const config = require(configPath);

// Supabase Setup
const supabaseUrl = config.supabase?.url || process.env.SUPABASE_URL;
const supabaseKey = config.supabase?.key || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE credentials fehlen in config.json!');
  process.exit(1);
}

console.log('[SHOP PROCESSOR] ✅ Supabase verbunden:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

// Pfade zu Bot-Daten
const dataDir = path.join(__dirname, '..', 'data');
const licensesPath = path.join(dataDir, 'licenses.json');
const banksPath = path.join(dataDir, 'banks.json');
const transactionsPath = path.join(dataDir, 'transactions.json');
const cardsPath = path.join(dataDir, 'cards.json');
const cooldownsPath = path.join(dataDir, 'cooldowns.json');
const pendingCreditsPath = path.join(dataDir, 'pendingCredits.json');

// Item-Durations (in Tagen) - muss mit Website-Shop übereinstimmen
const ITEM_DURATIONS = {
  'vip_premium': 60,
  'vip_platinum': 60,
  'vip_ultimate': 60,
  'vip_elite_plus': 60,
  'luxus_pass': 60,
  'werkzeug_angel': 30,
  'werkzeug_hacking': 30,
  'versicherung_rechtsschutz': 30,
  'versicherung_pkw': 30,
  'versicherung_lkw': 30,
  'versicherung_kranken': 30,
  'versicherung_hars': 30,
  'versicherung_diebstahl': 30,
  'schutzbrief_polizei': 0, // Nutzungsbasiert
  'schutzbrief_drk': 0,
  'schutzbrief_feuerwehr': 0,
  'schutzbrief_hars': 0
};

console.log('[SHOP PROCESSOR] 📁 Data Dir:', dataDir);

// Helper: JSON lesen
async function readJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
    return {};
  }
}

// Helper: JSON schreiben
async function writeJSON(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e);
    return false;
  }
}

// Main: Process Shop Purchases
async function processShopPurchases() {
  console.log('[SHOP PROCESSOR] Starting...');

  try {
    // 1. Hole pending purchases aus Supabase
    const { data: purchases, error } = await supabase
      .from('pending_shop_purchases')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[ERROR] Supabase query failed:', error);
      return;
    }

    if (!purchases || purchases.length === 0) {
      console.log('[INFO] Keine pending shop purchases.');
      return;
    }

    console.log(`[INFO] ${purchases.length} purchase(s) gefunden.`);

    // 2. Lade Bot lokale Daten
    const licenses = await readJSON(licensesPath);
    const banks = await readJSON(banksPath);
    const transactions = await readJSON(transactionsPath);
    const cards = await readJSON(cardsPath);
    const cooldowns = await readJSON(cooldownsPath);
    const pendingCredits = await readJSON(pendingCreditsPath);

    // 3. Verarbeite jeden Kauf
    for (const purchase of purchases) {
      console.log(`\n[SHOP] Processing ${purchase.id}...`);
      console.log(`  Buyer: ${purchase.buyer_discord_id}`);
      
      // ===== LICENSE MANAGEMENT (Auto-Renew / Cancel) =====
      // Sonderbehandlung: Keine echte Bestellung, sondern nur Lizenz-Verwaltung
      if (purchase.item_category === 'license_management' && purchase.metadata?.license_action) {
        try {
          await processLicenseAction(purchase);
          // ✅ Nach erfolgreicher Verarbeitung Eintrag KOMPLETT entfernen
          const { error: delErr } = await supabase
            .from('pending_shop_purchases')
            .delete()
            .eq('id', purchase.id);
          if (delErr) {
            console.warn(`  ⚠️ Delete fehlgeschlagen, fallback auf completed:`, delErr.message);
            await supabase
              .from('pending_shop_purchases')
              .update({ status: 'completed', completed_at: new Date().toISOString() })
              .eq('id', purchase.id);
          } else {
            console.log(`  🗑️  Eintrag ${purchase.id} aus pending_shop_purchases entfernt.`);
          }
          console.log(`  ✅ License action ${purchase.metadata.license_action} für ${purchase.item_id} abgeschlossen.`);
        } catch (laErr) {
          console.error(`  ❌ License action error:`, laErr);
          await supabase
            .from('pending_shop_purchases')
            .update({ status: 'failed', error_message: laErr.message })
            .eq('id', purchase.id);
        }
        continue; // Überspringe normale Kauflogik
      }
      
      // Check if gift
      const isGift = purchase.is_gift === true;
      const recipientId = isGift ? purchase.recipient_discord_id : purchase.buyer_discord_id;
      
      if (isGift) {
        console.log(`  🎁 GIFT MODE - Recipient: ${recipientId}`);
      }
      
      console.log(`  Item: ${purchase.item_name} (${purchase.item_id})`);
      console.log(`  Price: ${purchase.price}€`);

      try {
        // Hole BUYER Data (für Geld abbuchen)
        const { data: buyerData, error: buyerFetchError } = await supabase
          .from('user_data')
          .select('*')
          .eq('discord_user_id', purchase.buyer_discord_id)
          .single();

        if (buyerFetchError || !buyerData) {
          throw new Error('Buyer nicht in Datenbank gefunden');
        }

        const buyerDataObj = typeof buyerData.data === 'string' 
          ? JSON.parse(buyerData.data) 
          : buyerData.data;
        
        // Hole RECIPIENT Data (für Item geben - bei Gift unterschiedlich!)
        let recipientData = buyerData;
        let recipientDataObj = buyerDataObj;
        
        if (isGift) {
          const { data: recData, error: recFetchError } = await supabase
            .from('user_data')
            .select('*')
            .eq('discord_user_id', recipientId)
            .single();
          
          if (recFetchError || !recData) {
            throw new Error('Recipient nicht in Datenbank gefunden');
          }
          
          recipientData = recData;
          recipientDataObj = typeof recData.data === 'string' 
            ? JSON.parse(recData.data) 
            : recData.data;
          
          console.log(`  ✅ Recipient gefunden: ${recipientData.discord_display_name}`);
        }

        const timestamp = new Date().toISOString();

        // === SPECIAL: Credits Kauf ===
        if (purchase.item_category === 'credits') {
          const creditsMatch = purchase.item_id.match(/credits_(\d+)/);
          if (!creditsMatch) throw new Error('Ungültige Credits');
          
          const creditsAmount = parseInt(creditsMatch[1]);
          
          // Prüfe Guthaben (BUYER zahlt!)
          if (buyerDataObj.money.bank < purchase.price) {
            throw new Error(`Nicht genug Guthaben`);
          }

          // Geld abbuchen (BUYER), Credits gutschreiben (RECIPIENT)
          buyerDataObj.money.bank -= purchase.price;
          if (!recipientDataObj.credits) recipientDataObj.credits = 0;
          recipientDataObj.credits += creditsAmount;

          console.log(`  💎 ${creditsAmount} Credits gutgeschrieben!`);
          if (isGift) console.log(`  🎁 An: ${recipientId}`);
        }
        // === SPECIAL: Bank Limit Upgrade ===
        else if (purchase.item_category === 'bank_limit') {
          const limitMatch = purchase.item_id.match(/bank_limit_(\d+)/);
          if (!limitMatch) throw new Error('Ungültiges Bank Limit');
          
          const addLimit = parseInt(limitMatch[1]);
          
          // Credits-Kosten berechnen (aus BANK_LIMIT_UPGRADES)
          const upgradeCosts = [
            { addLimit: 500000, creditCost: 120 },
            { addLimit: 1500000, creditCost: 420 },
            { addLimit: 4000000, creditCost: 1140 },
            { addLimit: 9000000, creditCost: 4320 },
            { addLimit: 14000000, creditCost: 15000 },
            { addLimit: 24000000, creditCost: 54000 }
          ];
          
          const upgrade = upgradeCosts.find(u => u.addLimit === addLimit);
          if (!upgrade) throw new Error('Upgrade nicht gefunden');
          
          // Credits abbuchen (RECIPIENT - der hat sie!)
          if (!recipientDataObj.credits || recipientDataObj.credits < upgrade.creditCost) {
            throw new Error(`Nicht genug Credits`);
          }

          // Credits abbuchen, Bank Limit erhöhen (RECIPIENT)
          recipientDataObj.credits -= upgrade.creditCost;
          if (!recipientDataObj.bankLimit) recipientDataObj.bankLimit = 1000000;
          recipientDataObj.bankLimit += addLimit;

          console.log(`  📈 Bank Limit um ${addLimit.toLocaleString('de-DE')}€ erhöht!`);
          if (isGift) console.log(`  🎁 Für: ${recipientId}`);
        }
        // === SPECIAL: Credit Spend (Boosts, Custom Kontonummer, Glücksrad etc.) ===
        // WICHTIG: Flags leben auf banks[userId] (wie der Bot intern). Bei bereits
        // aktivem Buff wird der Kauf abgebrochen → KEINE Credits abgezogen.
        else if (purchase.item_category === 'credit_spend') {
          const buyerId = purchase.buyer_discord_id;
          const spendId = (purchase.item_id || '').replace(/^spend_/, '');
          const meta = purchase.metadata || {};
          const now = Date.now();

          // Basiskosten + dynamische Preiserhöhung (wie Bot: base * 1.10^käufe)
          const baseCostMap = {
            custom_kontonummer: 500,  bank_pin_change: 500,    cooldown_reset: 150,  steuerbefreiung: 200,
            double_xp: 300,           collect_boost: 250,      gehaltsbonus: 400,
            premium_badge: 1000,      schutzbrief_upgrade: 600, ueberweisungs_bypass: 350,
            konto_schutz: 450,        zinsen_boost: 800,       gluecksrad: 200,
            lotto_bundle: 300,        gehalt_multiplikator: 500, exklusiver_titel: 2000
          };
          const baseCost = baseCostMap[spendId];
          if (!baseCost) throw new Error(`Unbekanntes Credit-Extra: ${spendId}`);

          // Hole aktuelles Bank-Objekt (Source of Truth)
          const userBank = banks[buyerId];
          if (!userBank) throw new Error('Kein Bankkonto vorhanden – bitte /karte erstellen');

          // Verwende den Preis aus purchase (enthält bereits VIP-Rabatt!)
          const price = purchase.price || 0;
          console.log(`  [SPEND] Preis aus Supabase: ${price}€`);

          if (!userBank.creditPurchases) userBank.creditPurchases = {};
          const purchaseCount = userBank.creditPurchases[spendId] || 0;

          // ─── Duplikat / Cooldown prüfen (kein Credit-Abzug bei Fehler!) ───
          const activeFlagMap = {
            double_xp:            'doubleXpUntil',
            collect_boost:        'collectBoostUntil',
            gehaltsbonus:         'gehaltsbonusUntil',
            steuerbefreiung:      'steuerfreiUntil',
            premium_badge:        'premiumBadgeUntil',
            ueberweisungs_bypass: 'gebuehrenBypassUntil',
            konto_schutz:         'kontoSchutzUntil',
            zinsen_boost:         'zinsenBoostUntil',
            exklusiver_titel:     'customTitleUntil'
          };
          const flag = activeFlagMap[spendId];
          if (flag && userBank[flag] && userBank[flag] > now) {
            throw new Error(`Bereits aktiv bis ${new Date(userBank[flag]).toLocaleString('de-DE')}`);
          }
          if (spendId === 'gehalt_multiplikator' && userBank.gehaltMultiplikatorNext) {
            throw new Error('Du hast bereits einen ungenutzten Gehalt-x2');
          }
          if (spendId === 'custom_kontonummer') {
            const cd = 48 * 3600 * 1000;
            if (userBank.lastKontonummerChange && (now - userBank.lastKontonummerChange) < cd) {
              throw new Error('Kontonummer-Änderung steht noch im 48h-Cooldown');
            }
            const neueNr = String(meta.customKontonummer || '').trim();
            if (!/^\d{9}$/.test(neueNr)) throw new Error('Kontonummer ungültig');
            // Prüfe ob es bereits die aktuelle Kontonummer ist
            if (userBank.accountNumber === neueNr) {
              throw new Error(`${neueNr} ist bereits deine aktuelle Kontonummer`);
            }
            // Prüfe ob Nummer bereits von anderem User verwendet wird
            for (const [uid, acc] of Object.entries(banks)) {
              if (uid !== buyerId && acc.accountNumber === neueNr) {
                throw new Error(`Kontonummer ${neueNr} bereits vergeben`);
              }
            }
          }

          // Bank-PIN ändern (3-stellig)
          if (spendId === 'bank_pin_change') {
            const cd = 48 * 3600 * 1000;
            if (userBank.lastPinChange && (now - userBank.lastPinChange) < cd) {
              throw new Error('PIN-Änderung steht noch im 48h-Cooldown');
            }
            const neuePin = String(meta.newPin || '').trim();
            if (!/^\d{3}$/.test(neuePin)) throw new Error('PIN ungültig (muss 3 Ziffern sein)');
            // Prüfe ob neue PIN = alte PIN
            const altePin = userBank.pin || (cards[buyerId] && cards[buyerId].code);
            if (altePin === neuePin) {
              throw new Error(`${neuePin} ist bereits deine aktuelle PIN`);
            }
          }
          if (spendId === 'cooldown_reset') {
            const cd = 24 * 3600 * 1000;
            if (userBank.lastCooldownReset && (now - userBank.lastCooldownReset) < cd) {
              throw new Error('Cooldown-Reset: nur 1x pro 24h');
            }
          }

          // Credits-Check
          if ((userBank.credits || 0) < price) {
            throw new Error(`Nicht genug Credits (${userBank.credits || 0}/${price})`);
          }

          // ─── Jetzt erst Credits abbuchen + Effekt anwenden ───
          userBank.credits -= price;
          userBank.creditPurchases[spendId] = purchaseCount + 1;

          let effectDesc = `${spendId} aktiviert`;

          if (spendId === 'custom_kontonummer') {
            const alteNummer = userBank.accountNumber;
            const neueNr = String(meta.customKontonummer);
            userBank.accountNumber = neueNr;
            userBank.lastKontonummerChange = now;
            // Auch Cards aktualisieren
            if (cards[buyerId]) cards[buyerId].accountNumber = neueNr;
            effectDesc = `Kontonummer ${alteNummer} → ${neueNr}`;
          } else if (spendId === 'bank_pin_change') {
            const neuePin = String(meta.newPin);
            userBank.pin = neuePin;
            userBank.lastPinChange = now;
            // Auch in cards.json aktualisieren (als 'code')
            if (cards[buyerId]) cards[buyerId].code = neuePin;
            effectDesc = `Bank-PIN geändert`;
          } else if (spendId === 'cooldown_reset') {
            userBank.lastCooldownReset = now;
            // Cooldown in cooldowns.json zurücksetzen
            if (cooldowns[buyerId]) {
              cooldowns[buyerId].collect = 0; // Setze /collect Cooldown zurück
            }
            effectDesc = '/collect Cooldown zurückgesetzt';
          } else if (spendId === 'steuerbefreiung') {
            userBank.steuerfreiUntil = now + 8 * 3600 * 1000;
          } else if (spendId === 'double_xp') {
            userBank.doubleXpUntil = now + 4 * 3600 * 1000;
          } else if (spendId === 'collect_boost') {
            userBank.collectBoostUntil = now + 6 * 3600 * 1000;
          } else if (spendId === 'gehaltsbonus') {
            userBank.gehaltsbonusUntil = now + 24 * 3600 * 1000;
          } else if (spendId === 'premium_badge') {
            userBank.premiumBadgeUntil = now + 30 * 24 * 3600 * 1000;
          } else if (spendId === 'ueberweisungs_bypass') {
            userBank.gebuehrenBypassUntil = now + 24 * 3600 * 1000;
          } else if (spendId === 'konto_schutz') {
            userBank.kontoSchutzUntil = now + 24 * 3600 * 1000;
          } else if (spendId === 'zinsen_boost') {
            userBank.zinsenBoostUntil = now + 7 * 24 * 3600 * 1000;
          } else if (spendId === 'gehalt_multiplikator') {
            userBank.gehaltMultiplikatorNext = true;
          } else if (spendId === 'schutzbrief_upgrade') {
            const target = meta.targetLicense
              || Object.keys(licenses[buyerId] || {}).find(k => k.startsWith('schutzbrief_'));
            if (!target || !licenses[buyerId]?.[target]) {
              throw new Error('Kein Schutzbrief zum Upgraden vorhanden');
            }
            licenses[buyerId][target].nutzungen = (licenses[buyerId][target].nutzungen || 0) + 2;
            licenses[buyerId][target].maxNutzungen = (licenses[buyerId][target].maxNutzungen || 2) + 2;
            effectDesc = `${target}: +2 Nutzungen`;
          } else if (spendId === 'gluecksrad') {
            const win = Math.floor(Math.random() * 50001);
            userBank.balance = (userBank.balance || 0) + win;
            effectDesc = `Glücksrad: +${win}€`;
          } else if (spendId === 'lotto_bundle') {
            userBank.lottoTickets = (userBank.lottoTickets || 0) + 5;
            effectDesc = '+5 Lotto-Tickets';
          } else if (spendId === 'exklusiver_titel') {
            userBank.customTitle = String(meta.customTitle || '');
            userBank.customTitleUntil = now + 30 * 24 * 3600 * 1000;
            effectDesc = `Titel: "${userBank.customTitle}"`;
          }

          console.log(`  ⚡ Credit-Extra: ${effectDesc} (-${price} Credits)`);

          // Supabase-Mirror aktualisieren, damit Update auf user_data konsistent ist
          buyerDataObj.credits = userBank.credits;
          if (buyerDataObj.money) buyerDataObj.money.bank = userBank.balance || 0;
          if (!buyerDataObj.activeBuffs) buyerDataObj.activeBuffs = {};
          for (const k of ['doubleXpUntil','collectBoostUntil','gehaltsbonusUntil','steuerfreiUntil','premiumBadgeUntil','gebuehrenBypassUntil','kontoSchutzUntil','zinsenBoostUntil','customTitle','customTitleUntil','lastKontonummerChange','lastCooldownReset','gehaltMultiplikatorNext','accountNumber']) {
            if (userBank[k] !== undefined) buyerDataObj.activeBuffs[k] = userBank[k];
          }
          buyerDataObj.activeBuffs.creditPurchases = { ...userBank.creditPurchases };
        }
        // === SPECIAL: Mystery Box / Crate ===
        else if (purchase.item_category === 'mystery_box') {
          const buyerId = purchase.buyer_discord_id;
          const CRATES = {
            bronze:  { cost: 100,  rewards: [
              { chance: 0.40, type: 'money',   min: 1000,   max: 5000 },
              { chance: 0.30, type: 'money',   min: 5000,   max: 15000 },
              { chance: 0.20, type: 'money',   min: 15000,  max: 30000 },
              { chance: 0.08, type: 'money',   min: 30000,  max: 50000 },
              { chance: 0.02, type: 'credits', min: 5,      max: 20 }
            ]},
            silber:  { cost: 500,  rewards: [
              { chance: 0.30, type: 'money',   min: 5000,   max: 20000 },
              { chance: 0.30, type: 'money',   min: 20000,  max: 50000 },
              { chance: 0.20, type: 'money',   min: 50000,  max: 100000 },
              { chance: 0.15, type: 'money',   min: 100000, max: 200000 },
              { chance: 0.05, type: 'credits', min: 50,     max: 100 }
            ]},
            gold:    { cost: 2000, rewards: [
              { chance: 0.25, type: 'money',   min: 50000,   max: 100000 },
              { chance: 0.30, type: 'money',   min: 100000,  max: 250000 },
              { chance: 0.25, type: 'money',   min: 250000,  max: 500000 },
              { chance: 0.15, type: 'money',   min: 500000,  max: 1000000 },
              { chance: 0.05, type: 'credits', min: 500,     max: 1000 }
            ]},
            diamond: { cost: 10000, rewards: [
              { chance: 0.20, type: 'money',   min: 200000,   max: 500000 },
              { chance: 0.30, type: 'money',   min: 500000,   max: 1500000 },
              { chance: 0.25, type: 'money',   min: 1500000,  max: 3000000 },
              { chance: 0.15, type: 'money',   min: 3000000,  max: 5000000 },
              { chance: 0.10, type: 'credits', min: 2000,     max: 5000 }
            ]}
          };
          const crateId = (purchase.item_id || '').replace(/^crate_/, '');
          const crate = CRATES[crateId];
          if (!crate) throw new Error(`Unbekannte Box: ${crateId}`);

          const userBank = banks[buyerId];
          if (!userBank) throw new Error('Kein Bankkonto – bitte /karte erstellen');

          if ((userBank.credits || 0) < crate.cost) {
            throw new Error(`Nicht genug Credits (${userBank.credits || 0}/${crate.cost})`);
          }

          // Gewinn rollen
          const rnd = Math.random();
          let cum = 0;
          let picked = crate.rewards[0];
          for (const r of crate.rewards) {
            cum += r.chance;
            if (rnd < cum) { picked = r; break; }
          }
          const amount = Math.floor(Math.random() * (picked.max - picked.min + 1)) + picked.min;

          userBank.credits -= crate.cost;
          if (picked.type === 'money') {
            userBank.balance = (userBank.balance || 0) + amount;
          } else if (picked.type === 'credits') {
            userBank.credits += amount;
          }

          // Supabase-Mirror
          buyerDataObj.credits = userBank.credits;
          if (buyerDataObj.money) buyerDataObj.money.bank = userBank.balance || 0;
          if (!buyerDataObj.activeBuffs) buyerDataObj.activeBuffs = {};
          buyerDataObj.activeBuffs.lastCrateResult = {
            crate: crateId, type: picked.type, amount, timestamp
          };

          console.log(`  🎁 Mystery Box ${crateId} → ${picked.type} +${amount}`);
        }
        // === SPECIAL: CREDIT REPAYMENT (Kredit früher zurückzahlen) ===
        else if (purchase.item_category === 'credit_repayment') {
          const buyerId = purchase.buyer_discord_id;
          const kreditId = purchase.metadata?.kredit_id || purchase.item_id;
          
          console.log(`  💰 [CREDIT-REPAY] Verarbeite Rückzahlung für Kredit ${kreditId}`);
          
          // Hole Kredite aus buyerDataObj
          if (!Array.isArray(buyerDataObj.kredite)) {
            throw new Error('Keine Kredite vorhanden');
          }
          
          const kredit = buyerDataObj.kredite.find(k => k.kreditId === kreditId);
          if (!kredit) {
            throw new Error(`Kredit ${kreditId} nicht gefunden`);
          }
          
          if (kredit.status !== 'aktiv') {
            throw new Error(`Kredit ist nicht aktiv (Status: ${kredit.status})`);
          }
          
          const rueckzahlungsBetrag = kredit.rueckzahlungsBetrag || 0;
          
          // Guthaben prüfen
          if (buyerDataObj.money.bank < rueckzahlungsBetrag) {
            throw new Error(`Nicht genug Guthaben (${buyerDataObj.money.bank} < ${rueckzahlungsBetrag})`);
          }
          
          // Geld abbuchen
          buyerDataObj.money.bank -= rueckzahlungsBetrag;
          
          // Kredit auf 'abgeschlossen' setzen
          kredit.status = 'abgeschlossen';
          kredit.abgeschlossenAm = timestamp;
          kredit.rueckgezahltAm = timestamp;
          
          // Auch in pendingCredits.json aktualisieren
          if (pendingCredits[kreditId]) {
            pendingCredits[kreditId].status = 'abgeschlossen';
            pendingCredits[kreditId].abgeschlossenAm = timestamp;
            pendingCredits[kreditId].rueckgezahltAm = timestamp;
          }
          
          // Bank aktualisieren
          if (banks[buyerId]) {
            banks[buyerId].balance = buyerDataObj.money.bank;
          }
          
          console.log(`  ✅ Kredit ${kreditId} zurückgezahlt: ${rueckzahlungsBetrag.toLocaleString('de-DE')}€`);
        }
        // === SPECIAL: CREDIT EXTENSION (Kredit verlängern) ===
        else if (purchase.item_category === 'credit_extension') {
          const buyerId = purchase.buyer_discord_id;
          const kreditId = purchase.metadata?.kredit_id || purchase.item_id;
          const days = purchase.metadata?.days || 0;
          const gebuehr = purchase.metadata?.verlaengerungs_gebuehr || purchase.price;
          
          console.log(`  ⏰ [CREDIT-EXTEND] Verlängere Kredit ${kreditId} um ${days} Tage`);
          
          // Hole Kredite aus buyerDataObj
          if (!Array.isArray(buyerDataObj.kredite)) {
            throw new Error('Keine Kredite vorhanden');
          }
          
          const kredit = buyerDataObj.kredite.find(k => k.kreditId === kreditId);
          if (!kredit) {
            throw new Error(`Kredit ${kreditId} nicht gefunden`);
          }
          
          if (kredit.status !== 'aktiv') {
            throw new Error(`Kredit ist nicht aktiv (Status: ${kredit.status})`);
          }
          
          if (kredit.verlaengert) {
            throw new Error('Kredit wurde bereits einmal verlängert');
          }
          
          // Guthaben prüfen
          if (buyerDataObj.money.bank < gebuehr) {
            throw new Error(`Nicht genug Guthaben für Gebühr (${buyerDataObj.money.bank} < ${gebuehr})`);
          }
          
          // Gebühr abbuchen
          buyerDataObj.money.bank -= gebuehr;
          
          // Rückzahlungsdatum verlängern
          if (kredit.rueckzahlungsDatum) {
            const rueckzahlungDate = new Date(kredit.rueckzahlungsDatum);
            rueckzahlungDate.setDate(rueckzahlungDate.getDate() + days);
            kredit.rueckzahlungsDatum = rueckzahlungDate.toISOString();
          }
          
          // Flags setzen
          kredit.verlaengert = true;
          kredit.verlaengerungTage = days;
          kredit.verlaengerungGebuehr = gebuehr;
          kredit.verlaengertAm = timestamp;
          
          // Auch in pendingCredits.json aktualisieren
          if (pendingCredits[kreditId]) {
            if (pendingCredits[kreditId].rueckzahlungsDatum) {
              const pendingDate = new Date(pendingCredits[kreditId].rueckzahlungsDatum);
              pendingDate.setDate(pendingDate.getDate() + days);
              pendingCredits[kreditId].rueckzahlungsDatum = pendingDate.toISOString();
            }
            pendingCredits[kreditId].verlaengert = true;
            pendingCredits[kreditId].verlaengerungTage = days;
            pendingCredits[kreditId].verlaengerungGebuehr = gebuehr;
            pendingCredits[kreditId].verlaengertAm = timestamp;
          }
          
          // Bank aktualisieren
          if (banks[buyerId]) {
            banks[buyerId].balance = buyerDataObj.money.bank;
          }
          
          console.log(`  ✅ Kredit ${kreditId} um ${days} Tage verlängert (Gebühr: ${gebuehr.toLocaleString('de-DE')}€)`);
          console.log(`  📅 Neues Fälligkeitsdatum: ${kredit.rueckzahlungsDatum}`);
        }
        // === NORMAL: Shop Item ===
        else {
          // Prüfe Guthaben (BUYER zahlt!)
          if (buyerDataObj.money.bank < purchase.price) {
            throw new Error(`Nicht genug Guthaben`);
          }

          // Geld abbuchen (BUYER)
          buyerDataObj.money.bank -= purchase.price;

          // Item zu Lizenzen/Inventory hinzufügen (RECIPIENT bekommt!)
          if (!recipientDataObj.licenses) recipientDataObj.licenses = {};
          if (!recipientDataObj.inventory) recipientDataObj.inventory = {};

          // Füge Item hinzu (mit Ablaufdatum falls duration > 0)
          const itemData = {
            acquired: timestamp,
            price: purchase.price
          };

          // Wenn Item eine Duration hat, berechne Ablaufdatum
          if (purchase.item_id.includes('versicherung') || purchase.item_id.includes('vip') || 
              purchase.item_id.includes('waffenschein') || purchase.item_id.includes('jagdschein') ||
              purchase.item_id.includes('werkzeug')) {
            // Diese Items haben 30 oder 60 Tage Laufzeit
            const duration = purchase.item_id.includes('platinum') || purchase.item_id.includes('ultimate') || 
                           purchase.item_id.includes('elite') ? 60 : 30;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + duration);
            itemData.expiresAt = expiresAt.toISOString();
            itemData.active = true;
          }

          // Schutzbriefe haben Nutzungen
          if (purchase.item_id.includes('schutzbrief')) {
            itemData.nutzungen = 2;
            itemData.maxNutzungen = 2;
          }

          recipientDataObj.licenses[purchase.item_id] = itemData;

          console.log(`  🎁 Item "${purchase.item_name}" hinzugefügt!`);
          if (isGift) console.log(`  🎁 An: ${recipientId}`);
        }

        // Transaktion hinzufügen (BUYER zahlt = Buyer bekommt Transaction)
        if (!buyerDataObj.transactions) buyerDataObj.transactions = [];
        buyerDataObj.transactions.push({
          type: isGift ? 'SHOP_GIFT' : 'SHOP_PURCHASE',
          amount: -purchase.price,
          timestamp,
          details: isGift 
            ? `Geschenk: ${purchase.item_name} an ${recipientData.discord_display_name}`
            : `Shop: ${purchase.item_name}`,
          id: `shop_${purchase.id}`
        });
        
        // Bei Geschenken: Recipient bekommt auch Transaction (ohne Betrag)
        if (isGift) {
          if (!recipientDataObj.transactions) recipientDataObj.transactions = [];
          recipientDataObj.transactions.push({
            type: 'SHOP_GIFT_RECEIVED',
            amount: 0,
            timestamp,
            details: `Geschenk erhalten: ${purchase.item_name} von ${buyerData.discord_display_name}`,
            id: `shop_gift_${purchase.id}`
          });
        }

        // === SUPABASE: Speichern (BUYER Update) ===
        const { error: buyerUpdateError } = await supabase
          .from('user_data')
          .update({
            data: buyerDataObj,
            updated_at: timestamp
          })
          .eq('discord_user_id', purchase.buyer_discord_id);

        if (buyerUpdateError) {
          throw new Error(`Fehler beim Buyer Update: ${buyerUpdateError.message}`);
        }
        
        // === SUPABASE: Speichern (RECIPIENT Update - bei Gift unterschiedlich!) ===
        if (isGift) {
          const { error: recipientUpdateError } = await supabase
            .from('user_data')
            .update({
              data: recipientDataObj,
              updated_at: timestamp
            })
            .eq('discord_user_id', recipientId);

          if (recipientUpdateError) {
            throw new Error(`Fehler beim Recipient Update: ${recipientUpdateError.message}`);
          }
          console.log(`  ✅ Recipient Data updated`);
        }

        // === LOKALE DATEIEN: Speichern (Bot-Format) ===
        
        // 1. Licenses – nur für echte Item-Käufe (kein Credit-Spend / keine Mystery Box)
        const isVirtualPurchase = (
          purchase.item_category === 'credits' ||
          purchase.item_category === 'bank_limit' ||
          purchase.item_category === 'credit_spend' ||
          purchase.item_category === 'mystery_box'
        );

        if (!isVirtualPurchase) {
          if (!licenses[recipientId]) {
            licenses[recipientId] = {};
          }

          // Konvertiere zu Bot-Format
          const itemDuration = ITEM_DURATIONS[purchase.item_id] || 0;
          const durationMs = itemDuration > 0 ? itemDuration * 24 * 60 * 60 * 1000 : 0;
          
          const licenseData = {
            purchasedAt: timestamp,
            expiresAt: durationMs > 0 ? Date.now() + durationMs : 0, // ✅ KORREKT: Duration aus ITEM_DURATIONS
            autoRenew: true, // ✅ NEU: Standardmäßig auf true (User kann später deaktivieren)
            owner: recipientDataObj.characterName || (isGift ? `Geschenk von ${buyerData.discord_display_name}` : 'Website User'),
            giftedBy: isGift ? purchase.buyer_discord_id : null
          };
          
          console.log(`[SHOP PROCESSOR] Creating license for ${purchase.item_id}: duration=${itemDuration} days, expiresAt=${licenseData.expiresAt}, autoRenew=true`);

          // Für Schutzbriefe: Nutzungen
          if (purchase.item_category === 'schutzbriefe') {
            licenseData.nutzungen = recipientDataObj.licenses?.[purchase.item_id]?.nutzungen || 2;
            licenseData.maxNutzungen = 2;
          }

          licenses[recipientId][purchase.item_id] = licenseData;
          
          // VIP Ultimate, Elite Plus und Luxus-Pass BONUS: Alle Versicherungen KOSTENLOS hinzufügen
          if (purchase.item_id === 'vip_ultimate' || purchase.item_id === 'vip_elite_plus' || purchase.item_id === 'luxus_pass') {
            const bonusVersicherungen = ['versicherung_rechtsschutz', 'versicherung_pkw', 'versicherung_lkw', 'versicherung_kranken', 'versicherung_hars', 'versicherung_diebstahl'];
            const bonusTag = purchase.item_id === 'luxus_pass' ? 'LUXUS_PASS_BONUS' : (purchase.item_id === 'vip_elite_plus' ? 'VIP_ELITE_PLUS_BONUS' : 'VIP_ULTIMATE_BONUS');
            
            for (const versId of bonusVersicherungen) {
              // Nur hinzufügen, wenn nicht vorhanden oder abgelaufen
              const existing = licenses[recipientId][versId];
              const isExpiredOrMissing = !existing || (existing.expiresAt !== 0 && existing.expiresAt <= Date.now());
              
              if (isExpiredOrMissing) {
                licenses[recipientId][versId] = {
                  purchasedAt: timestamp,
                  expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 Tage
                  autoRenew: true,
                  owner: recipientDataObj.characterName || 'Website User',
                  giftedBy: bonusTag
                };
                console.log(`[SHOP PROCESSOR] 🎁 Added bonus ${versId} for ${purchase.item_id}`);
              }
            }
          }
        }

        // 2. Banks - Update für BUYER (Geld) und RECIPIENT (Item/Credits)
        // BUYER Bank Update
        if (!banks[purchase.buyer_discord_id]) {
          banks[purchase.buyer_discord_id] = {
            balance: buyerDataObj.money?.bank || 0,
            accountNumber: buyerDataObj.bankAccount?.number || '000000000',
            bankId: 'elite_federal'
          };
        }
        banks[purchase.buyer_discord_id].balance = buyerDataObj.money?.bank || 0;
        
        // RECIPIENT Bank Update (bei Gift unterschiedlich!)
        if (!banks[recipientId]) {
          banks[recipientId] = {
            balance: recipientDataObj.money?.bank || 0,
            accountNumber: recipientDataObj.bankAccount?.number || '000000000',
            bankId: 'elite_federal'
          };
        }
        banks[recipientId].balance = recipientDataObj.money?.bank || 0;
        banks[recipientId].credits = recipientDataObj.credits || 0;
        banks[recipientId].bankLimit = recipientDataObj.bankLimit || 1000000;

        // 3. Transactions
        if (!transactions[purchase.buyer_discord_id]) {
          transactions[purchase.buyer_discord_id] = [];
        }
        transactions[purchase.buyer_discord_id].push({
          type: isGift ? 'SHOP_GIFT' : 'SHOP_PURCHASE',
          amount: -purchase.price,
          timestamp,
          details: `Shop: ${purchase.item_name}`
        });

        await writeJSON(licensesPath, licenses);
        await writeJSON(banksPath, banks);
        await writeJSON(transactionsPath, transactions);
        await writeJSON(cardsPath, cards);
        await writeJSON(cooldownsPath, cooldowns);
        await writeJSON(pendingCreditsPath, pendingCredits);

        // === USER_DATA: Speichere geänderte Kredite in Supabase ===
        // Nur wenn es eine Credit-Aktion war, aktualisiere die user_data
        if (purchase.item_category === 'credit_repayment' || purchase.item_category === 'credit_extension') {
          console.log(`  💾 Speichere geänderte Kredite in Supabase user_data...`);
          
          // Buyer (derjenige, der die Aktion ausgeführt hat)
          await supabase
            .from('user_data')
            .update({
              data: buyerDataObj,
              last_sync: new Date().toISOString()
            })
            .eq('discord_user_id', purchase.buyer_discord_id);
          
          console.log(`  ✅ user_data für ${purchase.buyer_discord_id} aktualisiert`);
        }

        // === PENDING_SHOP_PURCHASES: Eintrag löschen ===
        const { error: deleteError } = await supabase
          .from('pending_shop_purchases')
          .delete()
          .eq('id', purchase.id);

        if (deleteError) {
          console.error(`[WARNING] Konnte Purchase ${purchase.id} nicht löschen:`, deleteError);
        } else {
          console.log(`[SUCCESS] Purchase ${purchase.id} erfolgreich! ✅`);
          console.log(`  📊 Supabase: Gespeichert`);
          console.log(`  💾 Lokale Dateien: gespeichert in ${dataDir}`);
          console.log(`  🗑️ Eintrag aus pending_shop_purchases gelöscht`);
        }

      } catch (err) {
        console.error(`[ERROR] Purchase ${purchase.id} fehlgeschlagen:`, err.message);

        // Bei Fehler: Status auf "failed" setzen
        await supabase
          .from('pending_shop_purchases')
          .update({
            status: 'failed',
            error_message: err.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', purchase.id);
      }
    }

    console.log('\n[SHOP PROCESSOR] Fertig!');

  } catch (e) {
    console.error('[FATAL ERROR]', e);
  }
}


// ==================================================================
// LICENSE MANAGEMENT: User verwaltet eigene Lizenzen von der Website
// ==================================================================
// Actions:
//   'enable_autorenew'  → setzt autoRenew = true
//   'disable_autorenew' → setzt autoRenew = false
//   'cancel'            → setzt autoRenew = false + canceledAt = now
//
// Wird NUR in der Supabase user_data geschrieben. Der Discord-Bot liest
// bei seinen regelmäßigen Checks (expired-licenses, luxus-monthly-bonus)
// diese Felder und handelt entsprechend.
async function processLicenseAction(purchase) {
  const userId = purchase.buyer_discord_id;
  const licenseId = purchase.metadata.license_id || purchase.item_id;
  const action = purchase.metadata.license_action;

  console.log(`  🔧 LICENSE ACTION: ${action} on "${licenseId}" for user ${userId}`);

  // Hole Userdaten
  const { data: userRow, error: fetchErr } = await supabase
    .from('user_data')
    .select('*')
    .eq('discord_user_id', userId)
    .single();

  if (fetchErr || !userRow) {
    throw new Error(`User ${userId} nicht in DB gefunden`);
  }

  const dataObj = typeof userRow.data === 'string' ? JSON.parse(userRow.data) : userRow.data;
  if (!Array.isArray(dataObj.licenses)) {
    dataObj.licenses = [];
  }

  // Finde Lizenz (unterstützt String- und Objekt-Format)
  let found = false;
  dataObj.licenses = dataObj.licenses.map((l) => {
    if (!l) return l;
    const matches = (typeof l === 'string' && l === licenseId) ||
                    (typeof l === 'object' && (l.name === licenseId || l.id === licenseId));
    if (!matches) return l;
    found = true;

    // String → zu Objekt konvertieren (keine Daten bekannt → Default)
    if (typeof l === 'string') {
      const obj = {
        name: l,
        id: l,
        expiresAt: 0,
        autoRenew: false
      };
      if (action === 'enable_autorenew') obj.autoRenew = true;
      if (action === 'disable_autorenew') obj.autoRenew = false;
      if (action === 'cancel') {
        obj.autoRenew = false;
        obj.canceledAt = new Date().toISOString();
      }
      return obj;
    }

    // Objekt → Felder setzen
    const updated = { ...l };
    if (action === 'enable_autorenew') {
      updated.autoRenew = true;
      delete updated.canceledAt; // Bei Reaktivierung Canceled-Flag entfernen
    }
    if (action === 'disable_autorenew') {
      updated.autoRenew = false;
    }
    if (action === 'cancel') {
      updated.autoRenew = false;
      updated.canceledAt = new Date().toISOString();
    }
    return updated;
  });

  if (!found) {
    console.warn(`  ⚠️ Lizenz "${licenseId}" nicht in user ${userId} gefunden — ignoriere.`);
    return;
  }

  // Supabase speichern
  const { error: updateErr } = await supabase
    .from('user_data')
    .update({ data: dataObj, last_sync: new Date().toISOString() })
    .eq('discord_user_id', userId);

  if (updateErr) {
    throw new Error(`Supabase-Update fehlgeschlagen: ${updateErr.message}`);
  }

  // Zusätzlich lokale JSON-Files synchronisieren
  // ── 1) data/licenses.json (Haupt-Lizenz-Store des Bots) ──
  try {
    const localLicenses = await readJSON(licensesPath);
    if (!localLicenses[userId]) localLicenses[userId] = {};
    const userLicenses = localLicenses[userId];
    const existing = userLicenses[licenseId] || null;

    if (action === 'enable_autorenew') {
      userLicenses[licenseId] = {
        ...(existing || {}),
        autoRenew: true
      };
      // Bei Reaktivierung canceledAt entfernen
      if (userLicenses[licenseId].canceledAt) delete userLicenses[licenseId].canceledAt;
    } else if (action === 'disable_autorenew') {
      userLicenses[licenseId] = {
        ...(existing || {}),
        autoRenew: false
      };
    } else if (action === 'cancel') {
      userLicenses[licenseId] = {
        ...(existing || {}),
        autoRenew: false,
        canceledAt: new Date().toISOString()
      };
    }

    await writeJSON(licensesPath, localLicenses);
    console.log(`  💾 Lokale licenses.json aktualisiert: ${userId} → ${licenseId} (${action})`);
  } catch (fsErr) {
    console.warn(`  ⚠️ licenses.json-Sync fehlgeschlagen (nicht kritisch):`, fsErr.message);
  }

  // ── 2) data/userData.json (falls vorhanden, für Legacy-Kompatibilität) ──
  try {
    const pathMod = require('path');
    const fsSync = require('fs');
    const userDataFile = pathMod.join(__dirname, '..', 'data', 'userData.json');
    if (fsSync.existsSync(userDataFile)) {
      const localUserData = JSON.parse(fsSync.readFileSync(userDataFile, 'utf8'));
      if (localUserData[userId]) {
        localUserData[userId].licenses = dataObj.licenses;
        fsSync.writeFileSync(userDataFile, JSON.stringify(localUserData, null, 2));
        console.log(`  💾 Lokale userData.json aktualisiert für ${userId}`);
      }
    }
  } catch (fsErr) {
    console.warn(`  ⚠️ userData.json-Sync fehlgeschlagen (nicht kritisch):`, fsErr.message);
  }

  console.log(`  ✅ LICENSE ACTION "${action}" auf "${licenseId}" erfolgreich.`);
}


// Cleanup: Alte fehlerhafte Purchases löschen
async function cleanupOldPurchases() {
  console.log('[CLEANUP] Lösche alte fehlerhafte Purchases...');

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('pending_shop_purchases')
      .delete()
      .eq('status', 'failed')
      .lt('processed_at', oneHourAgo)
      .select();

    if (error) {
      console.error('[CLEANUP ERROR]', error);
      return;
    }

    if (data && data.length > 0) {
      console.log(`[CLEANUP] ${data.length} alte Purchase(s) gelöscht.`);
    } else {
      console.log('[CLEANUP] Keine alten Purchases zum Löschen.');
    }

  } catch (e) {
    console.error('[CLEANUP FATAL ERROR]', e);
  }
}

// Execute
if (require.main === module) {
  processShopPurchases().then(() => process.exit(0));
}

module.exports = { processShopPurchases, cleanupOldPurchases };
