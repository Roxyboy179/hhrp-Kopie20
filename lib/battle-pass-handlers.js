// Battle Pass API Handler Functions
import { NextResponse } from 'next/server';
import { 
  BATTLE_PASS_CONFIG, 
  BATTLE_PASS_REWARDS, 
  REWARD_TYPES,
  getRewardForTier 
} from '../../../lib/battle-pass-rewards.js';

// Hilfsfunktion: Aktuellen Season Monat/Jahr abrufen
function getCurrentSeason() {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // 1-12
    year: now.getFullYear(),
  };
}

// Hilfsfunktion: Kann User heute claimen?
function canClaimToday(lastClaimDate) {
  if (!lastClaimDate) return true;
  
  const last = new Date(lastClaimDate);
  const today = new Date();
  
  // Verschiedene Tage?
  return last.toDateString() !== today.toDateString();
}

// ============================================
// GET /api/battle-pass/current
// Aktuellen Battle Pass + User Progress abrufen
// ============================================
export async function handleBattlePassCurrent(request, { supabaseAdmin, user }) {
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  try {
    const { month, year } = getCurrentSeason();
    
    // User Progress abrufen
    const { data: progress, error: progressError } = await supabaseAdmin
      .from('user_battle_pass')
      .select('*')
      .eq('discord_user_id', user.discordUserId)
      .eq('season_month', month)
      .eq('season_year', year)
      .single();

    if (progressError && progressError.code !== 'PGRST116') { // PGRST116 = not found is OK
      console.error('[Battle Pass] Error fetching progress:', progressError);
      return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
    }

    // Falls kein Progress existiert, erstelle einen
    let userProgress = progress;
    if (!progress) {
      const { data: newProgress, error: insertError } = await supabaseAdmin
        .from('user_battle_pass')
        .insert({
          discord_user_id: user.discordUserId,
          season_month: month,
          season_year: year,
          current_tier: 0,
          purchased: false,
          claimed_tiers: [],
        })
        .select()
        .single();

      if (insertError) {
        console.error('[Battle Pass] Error creating progress:', insertError);
        return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
      }

      userProgress = newProgress;
    }

    // Season End Date berechnen
    const seasonEndDate = new Date(year, month, 0); // Letzter Tag des Monats

    // Response
    return NextResponse.json({
      season: { month, year },
      endDate: seasonEndDate.toISOString(),
      daysRemaining: Math.max(0, Math.ceil((seasonEndDate - new Date()) / (1000 * 60 * 60 * 24))),
      rewards: BATTLE_PASS_REWARDS,
      userProgress: {
        currentTier: userProgress.current_tier,
        claimedTiers: userProgress.claimed_tiers || [],
        purchased: userProgress.purchased,
        canClaimToday: canClaimToday(userProgress.last_claim_date),
        lastClaimDate: userProgress.last_claim_date,
      },
      config: BATTLE_PASS_CONFIG,
    });
  } catch (error) {
    console.error('[Battle Pass] Error in handleBattlePassCurrent:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

// ============================================
// POST /api/battle-pass/purchase
// Battle Pass kaufen (1500 Credits)
// ============================================
export async function handleBattlePassPurchase(request, { supabaseAdmin, user }) {
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  try {
    const { month, year } = getCurrentSeason();

    // User Progress abrufen
    const { data: progress, error: progressError } = await supabaseAdmin
      .from('user_battle_pass')
      .select('*')
      .eq('discord_user_id', user.discordUserId)
      .eq('season_month', month)
      .eq('season_year', year)
      .single();

    if (progressError) {
      console.error('[Battle Pass] Error fetching progress:', progressError);
      return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
    }

    // Bereits gekauft?
    if (progress.purchased) {
      return NextResponse.json({ error: 'Battle Pass bereits gekauft' }, { status: 400 });
    }

    // User Data laden für Credits-Check
    const { data: userData, error: userError } = await supabaseAdmin
      .from('user_data')
      .select('data')
      .eq('discord_user_id', user.discordUserId)
      .single();

    if (userError) {
      console.error('[Battle Pass] Error fetching user data:', userError);
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
    }

    let parsedData = userData.data;
    if (typeof parsedData === 'string') {
      parsedData = JSON.parse(parsedData);
    }

    const userCredits = parsedData.credits || 0;

    // Genug Credits?
    if (userCredits < BATTLE_PASS_CONFIG.COST_CREDITS) {
      return NextResponse.json({ 
        error: `Nicht genug Credits. Benötigt: ${BATTLE_PASS_CONFIG.COST_CREDITS}, Verfügbar: ${userCredits}` 
      }, { status: 400 });
    }

    // Credits abziehen
    parsedData.credits = userCredits - BATTLE_PASS_CONFIG.COST_CREDITS;

    // User Data updaten
    const { error: updateUserError } = await supabaseAdmin
      .from('user_data')
      .update({ 
        data: parsedData,
        updated_at: new Date().toISOString(),
      })
      .eq('discord_user_id', user.discordUserId);

    if (updateUserError) {
      console.error('[Battle Pass] Error updating user data:', updateUserError);
      return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
    }

    // Battle Pass Progress updaten
    const { error: updateProgressError } = await supabaseAdmin
      .from('user_battle_pass')
      .update({
        purchased: true,
        purchase_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('discord_user_id', user.discordUserId)
      .eq('season_month', month)
      .eq('season_year', year);

    if (updateProgressError) {
      console.error('[Battle Pass] Error updating progress:', updateProgressError);
      // Rollback Credits? (optional)
      return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
    }

    console.log(`[Battle Pass] User ${user.discordUserId} purchased battle pass for ${BATTLE_PASS_CONFIG.COST_CREDITS} credits`);

    return NextResponse.json({
      success: true,
      message: 'Battle Pass erfolgreich gekauft!',
      newCredits: parsedData.credits,
    });
  } catch (error) {
    console.error('[Battle Pass] Error in handleBattlePassPurchase:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

// ============================================
// POST /api/battle-pass/claim
// Tägliche Belohnung claimen
// ============================================
export async function handleBattlePassClaim(request, { supabaseAdmin, user }) {
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  try {
    const { month, year } = getCurrentSeason();

    // User Progress abrufen
    const { data: progress, error: progressError } = await supabaseAdmin
      .from('user_battle_pass')
      .select('*')
      .eq('discord_user_id', user.discordUserId)
      .eq('season_month', month)
      .eq('season_year', year)
      .single();

    if (progressError) {
      console.error('[Battle Pass] Error fetching progress:', progressError);
      return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
    }

    // Kann heute claimen?
    if (!canClaimToday(progress.last_claim_date)) {
      return NextResponse.json({ 
        error: 'Bereits heute geclaimt. Komm morgen wieder!' 
      }, { status: 400 });
    }

    // Nächsten Tier freischalten
    const nextTier = progress.current_tier + 1;
    if (nextTier > BATTLE_PASS_CONFIG.TIERS_COUNT) {
      return NextResponse.json({ 
        error: 'Battle Pass bereits komplett!' 
      }, { status: 400 });
    }

    // Belohnungen für diesen Tier
    const freeReward = getRewardForTier(nextTier, false);
    const premiumReward = progress.purchased ? getRewardForTier(nextTier, true) : null;

    // User Data laden
    const { data: userData, error: userError } = await supabaseAdmin
      .from('user_data')
      .select('data')
      .eq('discord_user_id', user.discordUserId)
      .single();

    if (userError) {
      console.error('[Battle Pass] Error fetching user data:', userError);
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
    }

    let parsedData = userData.data;
    if (typeof parsedData === 'string') {
      parsedData = JSON.parse(parsedData);
    }

    // Belohnungen anwenden
    const rewardsReceived = [];

    // Free Reward
    if (freeReward) {
      const result = await applyReward(freeReward, parsedData, supabaseAdmin, user.discordUserId);
      if (result.success) {
        rewardsReceived.push({ track: 'free', ...freeReward, received: result.received });
      }
    }

    // Premium Reward
    if (premiumReward && progress.purchased) {
      const result = await applyReward(premiumReward, parsedData, supabaseAdmin, user.discordUserId);
      if (result.success) {
        rewardsReceived.push({ track: 'premium', ...premiumReward, received: result.received });
      }
    }

    // User Data speichern
    const { error: updateUserError } = await supabaseAdmin
      .from('user_data')
      .update({ 
        data: parsedData,
        updated_at: new Date().toISOString(),
      })
      .eq('discord_user_id', user.discordUserId);

    if (updateUserError) {
      console.error('[Battle Pass] Error updating user data:', updateUserError);
      return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
    }

    // Progress updaten
    const claimedTiers = progress.claimed_tiers || [];
    claimedTiers.push(nextTier);

    const { error: updateProgressError } = await supabaseAdmin
      .from('user_battle_pass')
      .update({
        current_tier: nextTier,
        claimed_tiers: claimedTiers,
        last_claim_date: new Date().toISOString().split('T')[0], // Nur Datum
        updated_at: new Date().toISOString(),
      })
      .eq('discord_user_id', user.discordUserId)
      .eq('season_month', month)
      .eq('season_year', year);

    if (updateProgressError) {
      console.error('[Battle Pass] Error updating progress:', updateProgressError);
      return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
    }

    console.log(`[Battle Pass] User ${user.discordUserId} claimed tier ${nextTier}`);

    return NextResponse.json({
      success: true,
      newTier: nextTier,
      rewards: rewardsReceived,
      message: `Tier ${nextTier} freigeschaltet!`,
    });
  } catch (error) {
    console.error('[Battle Pass] Error in handleBattlePassClaim:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

// ============================================
// Hilfsfunktion: Belohnung anwenden
// ============================================
async function applyReward(reward, userData, supabaseAdmin, discordUserId) {
  try {
    switch (reward.type) {
      case REWARD_TYPES.CREDITS:
        userData.credits = (userData.credits || 0) + reward.amount;
        return { success: true, received: `${reward.amount} Credits` };

      case REWARD_TYPES.MONEY:
        userData.money = (userData.money || 0) + reward.amount;
        return { success: true, received: `${reward.amount}€` };

      case REWARD_TYPES.XP:
        userData.xp = (userData.xp || 0) + reward.amount;
        return { success: true, received: `${reward.amount} XP` };

      case REWARD_TYPES.ITEM:
        // Check if user already has item
        const items = userData.items || [];
        if (items.includes(reward.item_id)) {
          // Duplicate! Gib alternative Credits
          const altCredits = reward.alternativeCredits || 100;
          userData.credits = (userData.credits || 0) + altCredits;
          return { success: true, received: `${altCredits} Credits (Item bereits vorhanden)` };
        } else {
          items.push(reward.item_id);
          userData.items = items;
          return { success: true, received: reward.label };
        }

      case REWARD_TYPES.PASS:
        // Add pass to user's active passes
        const passes = userData.passes || [];
        // Check if already has this pass type
        const hasPass = passes.some(p => p.id === reward.pass_id && new Date(p.expiresAt) > new Date());
        if (hasPass) {
          // Duplicate! Gib alternative Credits
          const altCredits = reward.alternativeCredits || 200;
          userData.credits = (userData.credits || 0) + altCredits;
          return { success: true, received: `${altCredits} Credits (Pass bereits aktiv)` };
        } else {
          const duration = parseInt(reward.pass_id.match(/(\d+)d/)?.[1] || 30);
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + duration);
          
          passes.push({
            id: reward.pass_id,
            activatedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            source: 'battle_pass',
          });
          userData.passes = passes;
          return { success: true, received: reward.label };
        }

      default:
        return { success: false, received: 'Unbekannter Typ' };
    }
  } catch (error) {
    console.error('[Battle Pass] Error applying reward:', error);
    return { success: false, received: 'Fehler' };
  }
}
