import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase';
import { readStats, writeStats, incrementStat } from '@/lib/stats-file';
import { SHOP_ITEMS, CREDIT_PURCHASE_OPTIONS, BANK_LIMIT_UPGRADES, CREDIT_SPEND_ITEMS, CREDIT_CRATES } from '@/lib/shop-data';
import { findActivePromotion, findActiveCreditBonus, getCreditsSpendingDiscount } from '@/lib/shop-promotions';
import { calculateVipUpgradePrice } from '@/lib/vip-upgrade';
import { 
  createBewerbung, 
  getUserBewerbungen, 
  getBewerbungById, 
  getAllBewerbungen,
  updateBewerbung,
  deleteBewerbung,
  createAdminAccount,
  getAdminAccountByCredentials,
  getAllAdminAccounts,
  deleteAdminAccount,
  toggleAdminAccountStatus,
  getAdminAccountById,
  getBewerbungSettings,
  updateBewerbungSettings
} from '@/lib/supabase-helpers';
import { sendNewBewerbungNotification, sendStatusUpdateNotification, sendAccountStatusChangeNotification, sendPasswordChangeNotification, assignDiscordRole } from '@/lib/discord-bot';
import { logActivity, cleanupOldLogs, getLogs, getIpAddress, LOG_ACTIONS } from '@/lib/activity-logger';
import { createNotification, getUserNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications';

// Web Push Configuration
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:admin@hhrp.de',
    vapidPublicKey,
    vapidPrivateKey
  );
}

// ===== CONFIGURATION =====
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'hhrp-default-secret';
const REDIRECT_URI = `${BASE_URL}/api/auth/callback`;

// ===== ADMIN ROLE CONFIG =====
const ADMIN_ROLES = {
  '1273340696975380572': { name: 'Projektinhaber', level: 4, canCreateAccounts: true, canSeeAll: true },
  '1273340696975380571': { name: 'Stl. Projektinhaber', level: 3, canCreateAccounts: false, canSeeAll: true },
  '1374422438288560209': { name: 'Teamkoordination', level: 2, canCreateAccounts: false, canSeeAll: true },
  '1374422340858810459': { name: 'Qualitätsmanagement', level: 2, canCreateAccounts: false, canSeeAll: true },
  '1374421910301184140': { name: 'Teamvertretung', level: 1, canCreateAccounts: false, canSeeAll: false },
  '1273340696975380568': { name: 'Teamleitung', level: 1, canCreateAccounts: false, canSeeAll: false },
  '1273340696975380567': { name: 'Stl. Teamleitung', level: 1, canCreateAccounts: false, canSeeAll: false },
};

// ===== TEAM ROLES (Kein Admin-Zugriff, nur Uprank-Bewerbungen) =====
const TEAM_ROLES = {
  '1273340696975380565': { name: 'Roblox Manager', isTeamMember: true },
  '1273340696975380566': { name: 'Discord Manager', isTeamMember: true },
  '1273340696954273900': { name: 'Roblox Team', isTeamMember: true },
  '1273340696954273899': { name: 'Roblox Team', isTeamMember: true },
  '1273340696954273898': { name: 'Roblox Team', isTeamMember: true },
  '1273340696954273897': { name: 'Discord Team', isTeamMember: true },
  '1273340696954273896': { name: 'Discord Team', isTeamMember: true },
  '1273340696954273895': { name: 'Discord Team', isTeamMember: true },
};

// ===== JWT HELPERS =====
function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getUserFromRequest(request) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

function getAdminFromRequest(request) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

function getAdminContext(request) {
  // Admin-Login ist Pflicht! Nur admin_token prüfen (Credential-Login)
  const adminUser = getAdminFromRequest(request);
  if (adminUser) return adminUser;
  return null;
}

// ===== HELPER FUNCTIONS =====

// Convert snake_case to camelCase for frontend compatibility
function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Spezialfall: form_data ist ein JSON-String, muss geparst werden
    if (key === 'form_data' && typeof value === 'string') {
      try {
        result[camelKey] = JSON.parse(value);
      } catch (e) {
        console.error('[toCamelCase] Fehler beim Parsen von form_data:', e);
        result[camelKey] = value;
      }
    } else {
      result[camelKey] = typeof value === 'object' && value !== null ? toCamelCase(value) : value;
    }
  }
  return result;
}

// ===== DISCORD HELPERS =====
async function getGuildMember(userId) {
  try {
    console.log(`[DEBUG] Checking member: User=${userId}, Guild=${DISCORD_GUILD_ID}`);
    const res = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${userId}`, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
    });
    
    console.log(`[DEBUG] Discord API response status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[DEBUG] Discord API error:`, errorText);
      return null;
    }
    
    const member = await res.json();
    console.log(`[DEBUG] Member found:`, member.user?.username, `Roles:`, member.roles?.length);
    return member;
  } catch (error) {
    console.error('[DEBUG] Exception in getGuildMember:', error);
    return null;
  }
}

function getAdminRole(roles) {
  // Return the HIGHEST level role, not just the first match
  let bestRole = null;
  let bestRoleId = null;
  for (const roleId of roles) {
    if (ADMIN_ROLES[roleId]) {
      if (!bestRole || ADMIN_ROLES[roleId].level > bestRole.level) {
        bestRole = ADMIN_ROLES[roleId];
        bestRoleId = roleId;
      }
    }
  }
  return bestRole;
}

function isTeamMember(roles) {
  // Prüft ob User Team-Mitglied ist (KEIN Admin)
  for (const roleId of roles) {
    if (TEAM_ROLES[roleId]) {
      return TEAM_ROLES[roleId];
    }
  }
  return null;
}

// ===== SCHÖNE DISCORD EMBEDS =====
function getStatusColor(status) {
  switch (status) {
    case 'Eingereicht': return 3447003; // Blau
    case 'In Bearbeitung': return 16776960; // Gelb
    case 'Angenommen': return 5763719; // Grün
    case 'Abgelehnt': return 15548997; // Rot
    case 'Zurückgezogen': return 10070709; // Grau
    default: return 3447003;
  }
}

function getStatusEmoji(status) {
  switch (status) {
    case 'Eingereicht': return '📋';
    case 'In Bearbeitung': return '🔄';
    case 'Angenommen': return '✅';
    case 'Abgelehnt': return '❌';
    case 'Zurückgezogen': return '↩️';
    default: return '📄';
  }
}

async function sendDiscordEmbed(embed) {
  try {
    await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`
      },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error('Discord embed error:', error);
  }
}

async function sendUserDM(userId, embed) {
  try {
    // Create DM channel
    const dmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`
      },
      body: JSON.stringify({ recipient_id: userId })
    });
    
    if (!dmRes.ok) return false;
    const dmChannel = await dmRes.json();
    
    // Send message
    await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`
      },
      body: JSON.stringify({ embeds: [embed] })
    });
    
    return true;
  } catch (error) {
    console.error('Discord DM error:', error);
    return false;
  }
}

function createBewerbungEmbed(bewerbung, action = 'erstellt') {
  const status = bewerbung.status || 'Eingereicht';
  const username = bewerbung.username;
  const userId = bewerbung.discord_user_id;
  const bewerbungId = bewerbung.id.substring(0, 8);
  
  return {
    title: `${getStatusEmoji(status)} Bewerbung ${action}`,
    description: action === 'erstellt' 
      ? `**${username}** hat eine neue Bewerbung eingereicht.`
      : `Bewerbung von **${username}** wurde aktualisiert.`,
    color: getStatusColor(status),
    fields: [
      { name: '👤 Bewerber', value: username, inline: true },
      { name: '🆔 Bewerbungs-ID', value: `\`${bewerbungId}\``, inline: true },
      { name: '📊 Status', value: `${getStatusEmoji(status)} ${status}`, inline: true },
      ...(bewerbung.claimed_by_name ? [{ name: '👨‍💼 Bearbeitet von', value: bewerbung.claimed_by_name, inline: true }] : []),
      { name: '📅 Eingereicht am', value: new Date(bewerbung.created_at).toLocaleString('de-DE'), inline: false },
    ],
    thumbnail: {
      url: `https://cdn.discordapp.com/avatars/${userId}/a_1.png?size=256`
    },
    footer: {
      text: 'Hamburg Horizon RP - Bewerbungssystem',
      icon_url: 'https://cdn.discordapp.com/icons/1273340696916394076/a_1.png'
    },
    timestamp: new Date().toISOString()
  };
}

function createStatusChangeEmbed(bewerbung, oldStatus, newStatus) {
  const username = bewerbung.username;
  const bewerbungId = bewerbung.id.substring(0, 8);
  
  return {
    title: `${getStatusEmoji(newStatus)} Bewerbungsstatus geändert`,
    description: `Deine Bewerbung wurde von **${oldStatus}** zu **${newStatus}** geändert.`,
    color: getStatusColor(newStatus),
    fields: [
      { name: '📊 Alter Status', value: `${getStatusEmoji(oldStatus)} ${oldStatus}`, inline: true },
      { name: '📊 Neuer Status', value: `${getStatusEmoji(newStatus)} ${newStatus}`, inline: true },
      { name: '🆔 Bewerbungs-ID', value: `\`${bewerbungId}\``, inline: true },
      ...(newStatus === 'Angenommen' ? [{ 
        name: '🎉 Glückwunsch!', 
        value: 'Deine Bewerbung wurde angenommen! Ein Teammitglied wird sich in Kürze bei dir melden.', 
        inline: false 
      }] : []),
      ...(newStatus === 'Abgelehnt' ? [{ 
        name: '💬 Hinweis', 
        value: 'Deine Bewerbung wurde leider abgelehnt. Du kannst dich nach 30 Tagen erneut bewerben.', 
        inline: false 
      }] : []),
    ],
    thumbnail: {
      url: `https://cdn.discordapp.com/avatars/${bewerbung.discord_user_id}/a_1.png?size=256`
    },
    footer: {
      text: 'Hamburg Horizon RP - Bewerbungssystem',
      icon_url: 'https://cdn.discordapp.com/icons/1273340696916394076/a_1.png'
    },
    timestamp: new Date().toISOString()
  };
}

// ===== DISCORD OAUTH =====
function handleDiscordAuth() {
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`;
  return NextResponse.redirect(authUrl, { status: 307 });
}

async function handleDiscordCallback(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const errorParam = url.searchParams.get('error');
  
  console.log('[OAUTH] ========== DISCORD CALLBACK ==========');
  console.log('[OAUTH] Code present:', !!code);
  console.log('[OAUTH] Error param:', errorParam);
  console.log('[OAUTH] Redirect URI:', REDIRECT_URI);
  
  // Discord sends error param if user denied
  if (errorParam) {
    console.log('[OAUTH] Discord returned error:', errorParam);
    return NextResponse.redirect(new URL(`/auth-callback?error=discord_denied`, BASE_URL));
  }
  
  if (!code) {
    console.log('[OAUTH] No code in callback');
    return NextResponse.redirect(new URL(`/auth-callback?error=no_code`, BASE_URL));
  }

  try {
    // Step 1: Exchange code for token
    console.log('[OAUTH] Step 1: Exchanging code for token...');
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[OAUTH] Token exchange failed:', tokenRes.status, errText);
      return NextResponse.redirect(new URL(`/auth-callback?error=token_failed`, BASE_URL));
    }
    const tokenData = await tokenRes.json();
    const { access_token } = tokenData;
    console.log('[OAUTH] Step 1 OK - Token received');

    // Step 2: Get Discord user info
    console.log('[OAUTH] Step 2: Getting user info...');
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!userRes.ok) {
      const errText = await userRes.text();
      console.error('[OAUTH] User fetch failed:', userRes.status, errText);
      return NextResponse.redirect(new URL(`/auth-callback?error=user_failed`, BASE_URL));
    }
    const discordUser = await userRes.json();
    console.log('[OAUTH] Step 2 OK - User:', discordUser.username, '(', discordUser.id, ')');

    // Step 3: Check guild membership
    console.log('[OAUTH] Step 3: Checking guild membership...');
    const member = await getGuildMember(discordUser.id);
    if (!member) {
      console.error('[OAUTH] User is NOT a member of guild', DISCORD_GUILD_ID);
      return NextResponse.redirect(new URL(`/auth-callback?error=not_member`, BASE_URL));
    }
    console.log('[OAUTH] Step 3 OK - Member found, roles:', member.roles?.length);

    // Step 4: Check admin roles (highest role wins)
    const adminRole = getAdminRole(member.roles || []);
    const teamRole = isTeamMember(member.roles || []);
    
    console.log('[OAUTH] Admin role:', adminRole?.name || 'none', 'Level:', adminRole?.level || 0);
    console.log('[OAUTH] Team role:', teamRole?.name || 'none');
    
    const user = {
      id: discordUser.id,
      username: discordUser.username,
      globalName: discordUser.global_name,
      avatar: discordUser.avatar,
      email: discordUser.email,
      createdAt: new Date(parseInt((BigInt(discordUser.id) >> 22n) + 1420070400000n)).toISOString(),
      adminLevel: adminRole?.level || 0,
      adminRole: adminRole?.name || null,
      canCreateAccounts: adminRole?.canCreateAccounts || false,
      canSeeAll: adminRole?.canSeeAll || false,
      isTeamMember: !!(adminRole || teamRole), // Admin ODER Team
      teamRole: teamRole?.name || null,
    };

    // Step 5: Create JWT and set cookie
    const token = createToken(user);
    console.log('[OAUTH] Step 5 - JWT created, redirecting to', BASE_URL);
    
    // LOG: User Login
    await logActivity({
      actionType: LOG_ACTIONS.USER_LOGIN,
      userId: user.id,
      username: user.username,
      details: {
        globalName: user.globalName,
        adminLevel: user.adminLevel,
        adminRole: user.adminRole,
        isTeamMember: user.isTeamMember,
        teamRole: user.teamRole,
      },
      ipAddress: getIpAddress(request),
    });
    
    const redirectUrl = new URL('/auth-callback', BASE_URL);
    redirectUrl.searchParams.set('auth', 'success');
    
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    console.log('[OAUTH] ========== CALLBACK SUCCESS ==========');
    return response;
  } catch (error) {
    console.error('[OAUTH] ========== CALLBACK ERROR ==========');
    console.error('[OAUTH] Error:', error.message);
    console.error('[OAUTH] Stack:', error.stack);
    return NextResponse.redirect(new URL(`/auth-callback?error=auth_failed`, BASE_URL));
  }
}

async function handleAuthMe(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ user: null });
  
  try {
    // LIVE Discord-Rollen prüfen
    const member = await getGuildMember(user.id);
    
    if (!member) {
      // User ist nicht mehr im Discord Server - Token löschen
      const response = NextResponse.json({ user: null });
      response.cookies.delete('auth_token');
      return response;
    }
    
    // Rollen neu berechnen
    const adminRole = getAdminRole(member.roles || []);
    const teamRole = isTeamMember(member.roles || []);
    
    // Aktualisierte User-Daten
    const updatedUser = {
      ...user,
      roles: member.roles || [], // Discord Rollen-IDs
      adminLevel: adminRole?.level || 0,
      adminRole: adminRole?.name || null,
      canCreateAccounts: adminRole?.canCreateAccounts || false,
      canSeeAll: adminRole?.canSeeAll || false,
      isTeamMember: !!(adminRole || teamRole),
      teamRole: teamRole?.name || null,
    };
    
    // Lade Lizenzen aus Supabase (data ist ein JSON-Feld)
    try {
      const { data: userProfile } = await supabaseAdmin
        .from('user_data')
        .select('data')
        .eq('discord_user_id', user.id)
        .single();
      
      if (userProfile?.data) {
        // Parse JSON wenn es ein String ist, sonst direkt verwenden
        const userData = typeof userProfile.data === 'string' 
          ? JSON.parse(userProfile.data) 
          : userProfile.data;
        
        updatedUser.licenses = userData?.licenses || [];
      } else {
        updatedUser.licenses = [];
      }
    } catch (licenseError) {
      console.error('[AUTH ME] Error loading licenses:', licenseError);
      updatedUser.licenses = [];
    }
    
    // Token aktualisieren
    const newToken = createToken(updatedUser);
    const response = NextResponse.json({ user: updatedUser });
    response.cookies.set('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 Tage
    });
    
    return response;
  } catch (error) {
    console.error('[AUTH ME] Error checking Discord roles:', error);
    // Bei Fehler: Altes Token-Daten zurückgeben
    return NextResponse.json({ user });
  }
}

async function handleLogout(request) {
  // BEIDE Cookies IMMER löschen - komplett abmelden (Discord + Admin)
  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  
  try {
    const user = getUserFromRequest(request);
    // LOG: User Logout
    if (user) {
      await logActivity({
        actionType: LOG_ACTIONS.USER_LOGOUT,
        userId: user.id,
        username: user.username || user.globalName,
        ipAddress: getIpAddress(request),
      });
    }
  } catch (error) {
    console.error('[LOGOUT] Logging error (cookies still deleted):', error);
  }
  
  return response;
}

// ===== BEWERBUNGEN HANDLERS =====
async function handleCreateBewerbung(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

  try {
    const { formData } = await request.json();
    const bewerbungType = formData?.bewerbungType || 'normal';
    
    // DEBUG: Log user and bewerbungType
    console.log('DEBUG - User:', JSON.stringify(user, null, 2));
    console.log('DEBUG - bewerbungType:', bewerbungType);
    console.log('DEBUG - user.isTeamMember:', user.isTeamMember, typeof user.isTeamMember);
    console.log('DEBUG - user.adminLevel:', user.adminLevel, typeof user.adminLevel);
    
    // Prüfe ob User bereits eine aktive Bewerbung hat
    const existingBewerbungen = await getUserBewerbungen(user.id);
    const activeBewerbung = existingBewerbungen.find(b => 
      b.status === 'Eingereicht' || b.status === 'In Bearbeitung'
    );
    
    if (activeBewerbung) {
      console.log('DEBUG - User already has active bewerbung:', activeBewerbung.id);
      return NextResponse.json({ 
        error: 'Du hast bereits eine aktive Bewerbung. Bitte warte, bis diese bearbeitet wurde.' 
      }, { status: 400 });
    }
    
    // Teamler dürfen KEINE normale/Praktikum Bewerbung schreiben
    if ((bewerbungType === 'normal' || bewerbungType === 'praktikum') && user.isTeamMember) {
      console.log('DEBUG - Blocking team member from normal/praktikum application');
      return NextResponse.json({ error: 'Du bist bereits im Team! Teamler können keine Team-Bewerbung einreichen.' }, { status: 403 });
    }
    
    // Nur Teamler dürfen Uprank-Bewerbungen schreiben
    if (bewerbungType === 'uprank' && !user.isTeamMember) {
      console.log('DEBUG - Blocking non-team-member from uprank application');
      return NextResponse.json({ error: 'Uprank-Bewerbungen sind nur für Teamler möglich.' }, { status: 403 });
    }
    
    console.log('DEBUG - Allowing application submission');

    const bewerbung = await createBewerbung({
      discordUserId: user.id,
      username: user.globalName || user.username,
      email: user.email,
      discordCreatedAt: user.createdAt,
      formData
    });

    // Discord Bot Benachrichtigung
    const username = user.globalName || user.username;
    const typeLabels = { normal: 'Team-Bewerbung', praktikum: 'Praktikum-Bewerbung', uprank: 'Uprank-Bewerbung' };
    const enrichedData = { ...formData, bewerbungTypeLabel: typeLabels[bewerbungType] || 'Bewerbung' };
    await sendNewBewerbungNotification(username, enrichedData);

    // LOG: Bewerbung eingereicht
    await logActivity({
      actionType: LOG_ACTIONS.BEWERBUNG_EINGEREICHT,
      userId: user.id,
      username: user.globalName || user.username,
      bewerbungId: bewerbung.id,
      details: {
        bewerbungType,
        bewerbungTypeLabel: typeLabels[bewerbungType],
      },
      ipAddress: getIpAddress(request),
    });

    return NextResponse.json({ bewerbung, success: true });
  } catch (error) {
    console.error('Create bewerbung error:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
  }
}

async function handleGetBewerbungen(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

  try {
    const bewerbungen = await getUserBewerbungen(user.id);
    return NextResponse.json({ bewerbungen: bewerbungen.map(toCamelCase) });
  } catch (error) {
    console.error('Get bewerbungen error:', error);
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}

async function handleGetBewerbungenStats(request) {
  try {
    const bewerbungen = await getAllBewerbungen();
    const stats = {
      total: bewerbungen.length,
      angenommen: bewerbungen.filter(b => b.status === 'Angenommen').length,
      inBearbeitung: bewerbungen.filter(b => b.status === 'In Bearbeitung').length,
      eingereicht: bewerbungen.filter(b => b.status === 'Eingereicht').length,
    };
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ total: 0, angenommen: 0, inBearbeitung: 0 });
  }
}

// ===== SETTINGS HANDLERS =====
async function handleUpdateUsername(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

  try {
    const { username } = await request.json();
    
    if (!username || username.trim().length < 3) {
      return NextResponse.json({ error: 'Benutzername muss mindestens 3 Zeichen lang sein' }, { status: 400 });
    }

    // Update in Supabase users table (falls vorhanden)
    // Für Discord-Auth ist der Username read-only, aber wir können einen Display-Namen speichern
    
    // Für jetzt returnen wir Success
    // In einer echten Implementierung würde man hier die User-Tabelle updaten
    
    return NextResponse.json({ success: true, username: username.trim() });
  } catch (error) {
    console.error('Update username error:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }
}

async function handleUpdatePassword(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await request.json();
    
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Neues Passwort muss mindestens 8 Zeichen lang sein' }, { status: 400 });
    }

    // Hinweis: Discord OAuth User haben kein Passwort in unserer DB
    // Diese Funktion ist eher für Admin-Accounts relevant
    
    // Für Discord-User returnen wir einen Hinweis
    if (user.id.length > 15) { // Discord IDs sind lang
      return NextResponse.json({ 
        error: 'Discord-Accounts können ihr Passwort nicht hier ändern. Bitte nutze Discord-Einstellungen.' 
      }, { status: 400 });
    }

    // Für Admin-Accounts würde man hier das Passwort in admin_accounts updaten
    // Das ist aber nur relevant wenn Admins sich ohne Discord einloggen können
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }
}

// ============ ADMIN EINSTELLUNGEN ============

async function handleAdminUpdateSettings(request) {
  const admin = getAdminContext(request);
  if (!admin) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

  try {
    const { field, value, currentPassword, newPassword } = await request.json();
    
    if (field === 'email') {
      if (!value || !value.includes('@')) {
        return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 });
      }
      const { error } = await supabaseAdmin
        .from('admin_accounts')
        .update({ email: value.trim() })
        .eq('discord_user_id', admin.discordUserId);
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'E-Mail wurde aktualisiert' });
    }
    
    if (field === 'password') {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Aktuelles Passwort erforderlich' }, { status: 400 });
      }
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'Neues Passwort muss mindestens 6 Zeichen lang sein' }, { status: 400 });
      }
      
      // Aktuelles Passwort prüfen
      const { data: account } = await supabaseAdmin
        .from('admin_accounts')
        .select('*')
        .eq('discord_user_id', admin.discordUserId)
        .single();
      
      if (!account) {
        return NextResponse.json({ error: 'Account nicht gefunden' }, { status: 404 });
      }
      
      // Passwort vergleichen (Klartext)
      const passwordValid = (account.password_hash === currentPassword || account.password === currentPassword);
      
      if (!passwordValid) {
        return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 401 });
      }
      
      // Neues Passwort speichern (Klartext)
      const { error } = await supabaseAdmin
        .from('admin_accounts')
        .update({ password_hash: newPassword })
        .eq('discord_user_id', admin.discordUserId);
      if (error) throw error;
      
      // Discord-Benachrichtigung senden
      await sendPasswordChangeNotification(
        admin.discordUsername || account.discord_username,
        account.mitarbeiter_nummer
      );
      
      // AUTOMATISCHE ABMELDUNG: Admin-Token löschen
      const response = NextResponse.json({ 
        success: true, 
        message: 'Passwort wurde aktualisiert. Du wirst automatisch abgemeldet.',
        forceLogout: true // Signal für Frontend
      });
      response.cookies.delete('admin_token');
      
      return response;
    }
    
    if (field === 'mitarbeiterNummer') {
      if (!value || value.trim().length < 2) {
        return NextResponse.json({ error: 'Mitarbeiter-Nummer muss mindestens 2 Zeichen lang sein' }, { status: 400 });
      }
      const { error } = await supabaseAdmin
        .from('admin_accounts')
        .update({ mitarbeiter_nummer: value.trim() })
        .eq('discord_user_id', admin.discordUserId);
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Mitarbeiter-Nummer wurde aktualisiert' });
    }

    return NextResponse.json({ error: 'Ungültiges Feld' }, { status: 400 });
  } catch (error) {
    console.error('Admin settings error:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren: ' + error.message }, { status: 500 });
  }
}

async function handleAdminGetSettings(request) {
  const admin = getAdminContext(request);
  if (!admin) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

  try {
    const { data: account } = await supabaseAdmin
      .from('admin_accounts')
      .select('email, mitarbeiter_nummer, discord_username, discord_user_id, role_name, created_at')
      .eq('discord_user_id', admin.discordUserId)
      .single();
    
    if (!account) {
      return NextResponse.json({ error: 'Account nicht gefunden' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      settings: {
        email: account.email,
        mitarbeiterNummer: account.mitarbeiter_nummer,
        discordUsername: account.discord_username,
        discordUserId: account.discord_user_id,
        roleName: account.role_name,
        createdAt: account.created_at,
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}

async function handleWithdrawBewerbung(request, id) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

  try {
    const bewerbung = await getBewerbungById(id);
    if (!bewerbung || bewerbung.discord_user_id !== user.id) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
    }

    if (bewerbung.status === 'Zurückgezogen') {
      return NextResponse.json({ error: 'Bereits zurückgezogen' }, { status: 400 });
    }

    const updated = await updateBewerbung(id, { status: 'Zurückgezogen' });

    // Discord Embed
    await sendDiscordEmbed(createBewerbungEmbed(updated, 'zurückgezogen'));

    // LOG: Bewerbung zurückgezogen
    await logActivity({
      actionType: LOG_ACTIONS.BEWERBUNG_ZURÜCKGEZOGEN,
      userId: user.id,
      username: user.username || user.globalName,
      bewerbungId: updated.id,
      details: {
        oldStatus: bewerbung.status,
      },
      ipAddress: getIpAddress(request),
    });

    return NextResponse.json({ bewerbung: updated, success: true });
  } catch (error) {
    console.error('Withdraw error:', error);
    return NextResponse.json({ error: 'Fehler beim Zurückziehen' }, { status: 500 });
  }
}

// ===== ADMIN HANDLERS =====
async function handleAdminLogin(request) {
  console.log('[DEBUG] ========== ADMIN LOGIN REQUEST ==========');
  
  try {
    const body = await request.json();
    const { mitarbeiterNummer, email, password } = body;
    
    console.log('[DEBUG] Login attempt:', { 
      mitarbeiterNummer, 
      email,
      passwordProvided: !!password 
    });

    // SCHRITT 1: Account in DB finden
    const account = await getAdminAccountByCredentials(mitarbeiterNummer, email, password);
    
    if (!account) {
      console.log('[DEBUG] ❌ Login failed: Invalid credentials');
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
    }
    
    // SCHRITT 1.5: Account-Status prüfen
    if (account.is_active === false) {
      console.log('[DEBUG] ❌ Login failed: Account deactivated');
      return NextResponse.json({ 
        error: 'Dein Account wurde vom Projektinhaber deaktiviert. Bitte kontaktiere die Projektleitung.' 
      }, { status: 403 });
    }

    console.log('[DEBUG] ✅ Account validated:', account.mitarbeiter_nummer);

    // SCHRITT 2: Discord-Rollen LIVE aus der Discord API laden (nicht nur DB)
    let liveRole = null;
    if (account.discord_user_id && account.discord_user_id !== 'temporary-id') {
      console.log('[DEBUG] Checking LIVE Discord roles for user:', account.discord_user_id);
      const member = await getGuildMember(account.discord_user_id);
      if (member) {
        liveRole = getAdminRole(member.roles || []);
        console.log('[DEBUG] LIVE Discord role:', liveRole?.name || 'none', 'Level:', liveRole?.level || 0);
        
        // Update role in database if changed
        if (liveRole && liveRole.name !== account.role_name) {
          console.log('[DEBUG] Role changed! DB:', account.role_name, '-> Discord:', liveRole.name);
          try {
            await supabaseAdmin
              .from('admin_accounts')
              .update({ role_name: liveRole.name })
              .eq('id', account.id);
            console.log('[DEBUG] ✅ Role updated in database');
          } catch (updateErr) {
            console.error('[DEBUG] Failed to update role in DB:', updateErr);
          }
        }
      } else {
        console.log('[DEBUG] Could not fetch Discord member, falling back to DB role');
      }
    }

    // Use live Discord role if available, otherwise fall back to DB role
    const roleName = liveRole?.name || account.role_name;
    
    // Rollen-Konfiguration basierend auf role_name (NUR echte Discord-Ränge)
    const roleConfig = {
      'Projektinhaber': { level: 4, canCreateAccounts: true, canSeeAll: true },
      'Stl. Projektinhaber': { level: 3, canCreateAccounts: false, canSeeAll: true },
      'Teamkoordination': { level: 2, canCreateAccounts: false, canSeeAll: true },
      'Qualitätsmanagement': { level: 2, canCreateAccounts: false, canSeeAll: true },
      'Teamvertretung': { level: 1, canCreateAccounts: false, canSeeAll: false },
      'Teamleitung': { level: 1, canCreateAccounts: false, canSeeAll: false },
      'Stl. Teamleitung': { level: 1, canCreateAccounts: false, canSeeAll: false }
    };
    
    const adminRole = liveRole || roleConfig[roleName] || { 
      name: roleName || 'Admin',
      level: 1, 
      canCreateAccounts: false, 
      canSeeAll: false 
    };
    
    if (!adminRole.name) adminRole.name = roleName;
    
    console.log('[DEBUG] Final admin role:', adminRole.name, 'Level:', adminRole.level);

    console.log('[DEBUG] Creating admin session...');
    const admin = {
      discordUserId: account.discord_user_id || 'temporary-id',
      discordUsername: account.discord_username || account.email,
      mitarbeiterNummer: account.mitarbeiter_nummer,
      roleName: adminRole.name,
      roleLevel: adminRole.level,
      canCreateAccounts: adminRole.canCreateAccounts,
      canSeeAll: adminRole.canSeeAll,
    };

    const token = createToken(admin);
    const response = NextResponse.json({ admin });
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    // LOG: Admin Login
    await logActivity({
      actionType: LOG_ACTIONS.ADMIN_LOGIN,
      userId: admin.discordUserId,
      username: admin.discordUsername,
      details: {
        mitarbeiterNummer: admin.mitarbeiterNummer,
        roleName: admin.roleName,
        roleLevel: admin.roleLevel,
      },
      ipAddress: getIpAddress(request),
    });

    console.log('[DEBUG] ✅ Login successful!');
    console.log('[DEBUG] ========== LOGIN COMPLETE ==========');
    return response;
  } catch (error) {
    console.error('[DEBUG] ❌ Admin login error:', error);
    return NextResponse.json({ error: 'Anmeldefehler: ' + error.message }, { status: 500 });
  }
}

async function handleAdminMe(request) {
  const admin = getAdminContext(request);
  if (!admin) return NextResponse.json({ admin: null });
  
  // Prüfe ob Account noch aktiv ist (LIVE aus DB)
  try {
    const { data: account } = await supabaseAdmin
      .from('admin_accounts')
      .select('is_active')
      .eq('discord_user_id', admin.discordUserId)
      .single();
    
    if (account && account.is_active === false) {
      // Account wurde deaktiviert - automatisch abmelden
      const response = NextResponse.json({ 
        admin: null,
        error: 'Dein Account wurde deaktiviert',
        forceLogout: true
      });
      response.cookies.delete('admin_token');
      return response;
    }
  } catch (error) {
    console.error('[ADMIN ME] Error checking account status:', error);
  }
  
  return NextResponse.json({ admin });
}

async function handleAdminLogout(request) {
  // BEIDE Cookies IMMER löschen - komplett abmelden (Admin + Discord)
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  
  try {
    const admin = getAdminContext(request);
    // LOG: Admin Logout
    if (admin) {
      await logActivity({
        actionType: LOG_ACTIONS.ADMIN_LOGOUT,
        userId: admin.discordUserId || admin.mitarbeiterNummer,
        username: admin.discordUsername,
        details: {
          roleName: admin.roleName,
          roleLevel: admin.roleLevel,
        },
        ipAddress: getIpAddress(request),
      });
    }
  } catch (error) {
    console.error('[ADMIN LOGOUT] Logging error (cookies still deleted):', error);
  }
  
  return response;
}

async function handleAdminGetBewerbungen(request) {
  const admin = getAdminContext(request);
  if (!admin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });

  try {
    const bewerbungen = await getAllBewerbungen();
    return NextResponse.json({ bewerbungen: bewerbungen.map(toCamelCase) });
  } catch (error) {
    console.error('Admin get bewerbungen error:', error);
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}

async function handleAdminUpdateBewerbung(request, id) {
  const admin = getAdminContext(request);
  if (!admin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });

  try {
    const body = await request.json();
    const bewerbung = await getBewerbungById(id);
    
    if (!bewerbung) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
    }

    // Uprank-Bewerbung: Eigene Bewerbung NICHT selbst bearbeiten
    const fd = typeof bewerbung.form_data === 'string' ? JSON.parse(bewerbung.form_data) : (bewerbung.form_data || {});
    if (fd.bewerbungType === 'uprank' && bewerbung.discord_user_id === admin.discordUserId) {
      return NextResponse.json({ error: 'Du kannst deine eigene Uprank-Bewerbung nicht selbst bearbeiten.' }, { status: 403 });
    }

    const oldStatus = bewerbung.status;
    let updates = {};

    if (body.action === 'claim') {
      updates = {
        status: 'In Bearbeitung',
        claimed_by: admin.discordUserId,
        claimed_by_name: admin.discordUsername
      };
    } else if (body.action === 'unclaim') {
      updates = {
        status: 'Eingereicht',
        claimed_by: null,
        claimed_by_name: null
      };
    } else if (body.status) {
      updates = { status: body.status };
      // Ablehnungsgrund speichern
      if (body.status === 'Abgelehnt' && body.reason) {
        updates.rejection_reason = body.reason;
      }
    }

    const updated = await updateBewerbung(id, updates);
    const newStatus = updated.status;

    // Automatische Discord-Rollen-Vergabe für Beta Tester bei Annahme
    const formData = typeof updated.form_data === 'string' ? JSON.parse(updated.form_data) : updated.form_data;
    if (newStatus === 'Angenommen' && formData?.bewerbungType === 'beta_tester') {
      try {
        console.log('[BETA TESTER] Vergebe Beta Tester Rolle...');
        console.log('[BETA TESTER] Discord User ID:', updated.discord_user_id);
        await assignDiscordRole(updated.discord_user_id, '1494434149623136276');
        console.log('[BETA TESTER] ✅ Rolle erfolgreich vergeben!');
      } catch (roleError) {
        console.error('[BETA TESTER] ❌ Fehler beim Vergeben der Rolle:', roleError);
        // Weiter machen, auch wenn Rollen-Vergabe fehlschlägt
      }
    }

    // DM + Channel-Nachricht bei Statusänderung (korrekte Argumente!)
    if (oldStatus !== newStatus) {
      await sendStatusUpdateNotification(
        updated.discord_user_id,  // userId
        updated.username,          // username
        newStatus,                 // neuer Status
        admin.discordUsername,     // bearbeitet von
        body.reason || null        // Ablehnungsgrund (nur bei Abgelehnt)
      );
      
      // In-App Benachrichtigung erstellen
      const statusMessages = {
        'In Bearbeitung': 'Deine Bewerbung wird jetzt bearbeitet!',
        'Angenommen': 'Herzlichen Glückwunsch! Deine Bewerbung wurde angenommen!',
        'Abgelehnt': body.reason 
          ? `Deine Bewerbung wurde abgelehnt. Grund: ${body.reason}` 
          : 'Deine Bewerbung wurde leider abgelehnt.',
        'Eingereicht': 'Deine Bewerbung wurde zurückgesetzt.',
      };
      const statusTitles = {
        'In Bearbeitung': 'Bewerbung in Bearbeitung',
        'Angenommen': 'Bewerbung Angenommen!',
        'Abgelehnt': 'Bewerbung Abgelehnt',
        'Eingereicht': 'Bewerbung Status Update',
      };
      try {
        await createNotification({
          userId: updated.discord_user_id,
          type: 'bewerbung_status',
          title: statusTitles[newStatus] || 'Bewerbung Update',
          message: statusMessages[newStatus] || `Status geändert: ${oldStatus} → ${newStatus}`,
          data: { bewerbungId: updated.id, oldStatus, newStatus, changedBy: admin.discordUsername },
        });
      } catch (notifErr) {
        console.error('[NOTIFICATION] Error creating notification:', notifErr);
      }
      
      // LOG: Bewerbungs-Status geändert
      await logActivity({
        actionType: LOG_ACTIONS.BEWERBUNG_STATUS_GEÄNDERT,
        userId: admin.discordUserId || admin.mitarbeiterNummer,
        username: admin.discordUsername,
        targetUserId: updated.discord_user_id,
        targetUsername: updated.username,
        bewerbungId: updated.id,
        details: {
          oldStatus,
          newStatus,
          action: body.action || 'status_change',
        },
        ipAddress: getIpAddress(request),
      });
    }

    return NextResponse.json({ bewerbung: toCamelCase(updated) });
  } catch (error) {
    console.error('Admin update error:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }
}

async function handleAdminGetAccounts(request) {
  const admin = getAdminContext(request);
  if (!admin || (!admin.canCreateAccounts && admin.roleLevel < 3)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }

  try {
    const accounts = await getAllAdminAccounts();
    return NextResponse.json({ accounts: accounts.map(toCamelCase) });
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}

async function handleAdminVerwarnungenSuche(request) {
  const admin = getAdminContext(request);
  if (!admin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').trim().toLowerCase();
    
    if (query.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    // Alle User-Daten laden
    const all = await _loadAllUserData();
    
    // Discord Members laden für Discord IDs
    const members = await _loadDiscordMembers();
    const memberMap = new Map();
    for (const m of members) {
      memberMap.set(m.user.id, m.user.username);
    }

    const results = [];
    const now = Date.now();
    const WARN_ACTIVE_WINDOW_MS = 60 * 24 * 60 * 60 * 1000; // 60 Tage

    for (const row of all) {
      const data = row.data || {};
      const char = data.character || {};
      const vorname = (char.vorname || '').toLowerCase();
      const nachname = (char.nachname || '').toLowerCase();
      const discordUserId = row.discord_user_id || '';
      const discordUsername = memberMap.get(discordUserId) || '';

      // Warnings laden
      const rawWarns = Array.isArray(data.warns) ? data.warns : [];
      const activeWarnings = rawWarns
        .filter(w => {
          if (w.removed) return false;
          const createdTs = w.createdAt ? new Date(w.createdAt).getTime() : 0;
          const isExpired = createdTs > 0 && (now - createdTs) >= WARN_ACTIVE_WINDOW_MS;
          return !isExpired;
        })
        .map(w => ({
          timestamp: w.createdAt || null,
          reason: w.reason || '',
          warnedBy: w.moderatorTag || w.moderator || 'Unbekannt'
        }))
        .sort((a, b) => {
          const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return tb - ta;
        });

      // Nur User mit Verwarnungen berücksichtigen
      if (activeWarnings.length === 0) continue;

      // Suchlogik: Vorname, Nachname, Discord User ID, Discord Username
      const matches = 
        vorname.includes(query) ||
        nachname.includes(query) ||
        discordUserId.includes(query) ||
        discordUsername.toLowerCase().includes(query);

      if (matches) {
        results.push({
          vorname: char.vorname || 'Unbekannt',
          nachname: char.nachname || '',
          discordUserId: discordUserId,
          discordId: discordUsername,
          warningCount: activeWarnings.length,
          warnings: activeWarnings
        });
      }
    }

    // Nach Anzahl der Verwarnungen sortieren (höchste zuerst)
    results.sort((a, b) => b.warningCount - a.warningCount);

    return NextResponse.json({ 
      success: true, 
      results: results.slice(0, 50) // Max 50 Ergebnisse
    });
  } catch (error) {
    console.error('Verwarnungen Suche error:', error);
    return NextResponse.json({ error: 'Fehler bei der Suche' }, { status: 500 });
  }
}

async function handleAdminCreateAccount(request) {
  const admin = getAdminContext(request);
  if (!admin || !admin.canCreateAccounts) {
    return NextResponse.json({ error: 'Nicht autorisiert - Nur Projektinhaber können Accounts erstellen' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Discord User prüfen
    const member = await getGuildMember(body.discordUserId);
    if (!member) {
      return NextResponse.json({ error: 'Discord-Benutzer nicht im Server gefunden' }, { status: 400 });
    }

    // Höchste Admin-Rolle automatisch erkennen
    const adminRole = getAdminRole(member.roles || []);
    if (!adminRole) {
      return NextResponse.json({ error: 'Dieser Discord-Benutzer hat keine Team-Rolle auf dem Server' }, { status: 400 });
    }
    
    console.log('[ADMIN] Creating account for', member.user.username, 'with role:', adminRole.name, 'Level:', adminRole.level);
    
    const account = await createAdminAccount({
      discordUserId: body.discordUserId,
      discordUsername: member.user.username,
      mitarbeiterNummer: body.mitarbeiterNummer,
      email: body.email,
      password: body.password,
      roleName: adminRole.name,
      createdBy: admin.discordUsername
    });

    // LOG: Admin-Account erstellt
    await logActivity({
      actionType: LOG_ACTIONS.ADMIN_ACCOUNT_ERSTELLT,
      userId: admin.discordUserId,
      username: admin.discordUsername,
      targetUserId: body.discordUserId,
      targetUsername: member.user.username,
      details: {
        mitarbeiterNummer: body.mitarbeiterNummer,
        email: body.email,
        roleName: adminRole.name,
        roleLevel: adminRole.level,
      },
      ipAddress: getIpAddress(request),
    });

    return NextResponse.json({ 
      account, 
      detectedRole: adminRole.name,
      roleLevel: adminRole.level 
    });
  } catch (error) {
    console.error('Create account error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Account existiert bereits' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Fehler beim Erstellen: ' + error.message }, { status: 500 });
  }
}

// Discord-Rolle für eine User-ID prüfen (für Account-Formular)
async function handleCheckDiscordRole(request) {
  const admin = getAdminContext(request);
  if (!admin || !admin.canCreateAccounts) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }

  try {
    const { discordUserId } = await request.json();
    if (!discordUserId) {
      return NextResponse.json({ error: 'Discord User ID fehlt' }, { status: 400 });
    }

    const member = await getGuildMember(discordUserId);
    if (!member) {
      return NextResponse.json({ error: 'Benutzer nicht auf dem Discord-Server gefunden', found: false }, { status: 404 });
    }

    const adminRole = getAdminRole(member.roles || []);
    
    return NextResponse.json({
      found: true,
      username: member.user.username,
      globalName: member.nick || member.user.global_name || member.user.username,
      avatar: member.user.avatar,
      role: adminRole ? {
        name: adminRole.name,
        level: adminRole.level,
        canCreateAccounts: adminRole.canCreateAccounts,
        canSeeAll: adminRole.canSeeAll,
      } : null,
      hasTeamRole: !!adminRole,
      allRoleIds: member.roles || [],
    });
  } catch (error) {
    console.error('Check role error:', error);
    return NextResponse.json({ error: 'Fehler beim Prüfen' }, { status: 500 });
  }
}

async function handleAdminDeleteAccount(request, id) {
  const admin = getAdminContext(request);
  if (!admin || !admin.canCreateAccounts) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }

  try {
    const targetAccount = await getAdminAccountById(id);
    
    await deleteAdminAccount(id);
    
    // LOG: Admin-Account gelöscht
    await logActivity({
      actionType: LOG_ACTIONS.ADMIN_ACCOUNT_GELÖSCHT,
      userId: admin.discordUserId,
      username: admin.discordUsername,
      targetUserId: targetAccount?.discord_user_id,
      targetUsername: targetAccount?.discord_username,
      details: {
        mitarbeiterNummer: targetAccount?.mitarbeiter_nummer,
        email: targetAccount?.email,
        roleName: targetAccount?.role_name,
      },
      ipAddress: getIpAddress(request),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
  }
}

async function handleAdminToggleAccountStatus(request, id) {
  const admin = getAdminContext(request);
  if (!admin || !admin.canCreateAccounts) {
    return NextResponse.json({ error: 'Nicht autorisiert - Nur Projektinhaber können Accounts deaktivieren' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { isActive } = body;
    
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive muss ein Boolean sein' }, { status: 400 });
    }
    
    const account = await toggleAdminAccountStatus(id, isActive);
    
    // Discord-Benachrichtigung senden
    await sendAccountStatusChangeNotification(
      account.discord_username || account.email,
      account.mitarbeiter_nummer,
      isActive,
      admin.discordUsername
    );
    
    // LOG: Admin-Account aktiviert/deaktiviert
    await logActivity({
      actionType: isActive ? LOG_ACTIONS.ADMIN_ACCOUNT_AKTIVIERT : LOG_ACTIONS.ADMIN_ACCOUNT_DEAKTIVIERT,
      userId: admin.discordUserId,
      username: admin.discordUsername,
      targetUserId: account.discord_user_id,
      targetUsername: account.discord_username,
      details: {
        mitarbeiterNummer: account.mitarbeiter_nummer,
        email: account.email,
        roleName: account.role_name,
        newStatus: isActive ? 'aktiv' : 'deaktiviert',
      },
      ipAddress: getIpAddress(request),
    });
    
    return NextResponse.json({ 
      success: true, 
      account,
      message: isActive ? 'Account wurde aktiviert' : 'Account wurde deaktiviert. Der Benutzer wird beim nächsten Request automatisch abgemeldet.'
    });
  } catch (error) {
    console.error('Toggle account status error:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }
}

async function handleGetBewerbungSettings(request) {
  try {
    const settings = await getBewerbungSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get bewerbung settings error:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen' }, { status: 500 });
  }
}

async function handleUpdateBewerbungSettings(request) {
  const admin = getAdminContext(request);
  
  // Nur Projektinhaber & Stl. Projektinhaber (Level 3+)
  if (!admin || admin.adminLevel < 3) {
    return NextResponse.json({ error: 'Nicht autorisiert - Nur Projektinhaber und Stl. Projektinhaber können Bewerbungen schließen' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { normalOpen, praktikumOpen, uprankOpen, betaTesterOpen } = body;
    
    const settings = await updateBewerbungSettings({
      normal_open: normalOpen,
      praktikum_open: praktikumOpen,
      uprank_open: uprankOpen,
      beta_tester_open: betaTesterOpen
    });
    
    // LOG: Bewerbungs-Settings geändert
    await logActivity({
      actionType: LOG_ACTIONS.BEWERBUNG_SETTINGS_GEÄNDERT,
      userId: admin.discordUserId || admin.mitarbeiterNummer,
      username: admin.discordUsername,
      details: {
        normalOpen,
        praktikumOpen,
        uprankOpen,
        betaTesterOpen,
        roleName: admin.roleName,
      },
      ipAddress: getIpAddress(request),
    });
    
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Update bewerbung settings error:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }
}

// ===== ROUTER =====
export async function GET(request) {
  const url = new URL(request.url);
  const p = url.pathname.replace('/api/', '');

  // DEBUG ENDPOINT - Supabase Test
  if (p === 'debug/test-supabase') {
    try {
      console.log('[DEBUG] Testing Supabase connection...');
      console.log('[DEBUG] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('[DEBUG] Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      
      const { data, error, status, statusText } = await supabaseAdmin
        .from('admin_accounts')
        .select('*');
      
      console.log('[DEBUG] Response status:', status, statusText);
      console.log('[DEBUG] Error:', error);
      console.log('[DEBUG] Data:', data);
      
      return NextResponse.json({ 
        success: !error,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        status,
        statusText,
        accounts: data?.map(a => ({ 
          id: a.id,
          mitarbeiter_nummer: a.mitarbeiter_nummer, 
          email: a.email,
          discord_username: a.discord_username,
          password_hash: a.password_hash // Klartext Passwort
        })),
        error: error?.message || error,
        rawError: error
      });
    } catch (e) {
      console.error('[DEBUG] Exception:', e);
      return NextResponse.json({ 
        error: e.message, 
        stack: e.stack,
        type: e.constructor.name 
      }, { status: 500 });
    }
  }

  // DEBUG ENDPOINT - Test Login
  if (p === 'debug/test-login') {
    try {
      const testResult = await getAdminAccountByCredentials('MA-001', 'roxyboy2474', 'Joellading1202');
      return NextResponse.json({
        success: !!testResult,
        account: testResult,
        message: testResult ? 'Login would succeed!' : 'Login would fail!'
      });
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: e.message,
        stack: e.stack
      });
    }
  }

  // ===== WEBSITE STATISTICS ROUTES =====
  
  // GET /api/stats - Website Statistiken abrufen (öffentlich)
  if (p === 'stats') {
    try {
      let stats = {
        totalVisits: 0,
        uniqueVisitors: 0,
        appInstalls: 0,
        pwaDownloads: 0,  // Renamed: Einmalige PWA-Downloads
        registeredUsers: 0
      };
      
      let source = 'file'; // Default
      
      // Versuche ZUERST Supabase
      try {
        const { data, error } = await supabaseAdmin
          .from('website_stats')
          .select('*');
        
        if (!error && data && data.length > 0) {
          // Supabase funktioniert! Verwende diese Daten
          data.forEach(stat => {
            const value = parseInt(stat.metric_value);
            if (stat.metric_name === 'total_visits') stats.totalVisits = value;
            if (stat.metric_name === 'unique_visitors') stats.uniqueVisitors = value;
            if (stat.metric_name === 'app_installs') stats.appInstalls = value;
            if (stat.metric_name === 'pwa_downloads') stats.pwaDownloads = value;
            // Legacy support
            if (stat.metric_name === 'pwa_users') stats.pwaDownloads = value;
          });
          
          source = 'supabase';
          console.log('[Stats] 📊 Daten aus Supabase geladen');
        } else {
          throw new Error('Supabase table not found or empty');
        }
      } catch (supabaseError) {
        // Fallback zu File
        console.log('[Stats] ⚠️ Supabase nicht verfügbar, verwende File');
        const fileStats = readStats();
        stats.totalVisits = fileStats.total_visits || 0;
        stats.uniqueVisitors = fileStats.unique_visitors || 0;
        stats.appInstalls = fileStats.app_installs || 0;
        stats.pwaDownloads = fileStats.pwa_downloads || fileStats.pwa_users || 0;
      }
      
      // Registrierte User IMMER aus user_data Tabelle
      try {
        const result = await supabaseAdmin
          .from('user_data')
          .select('*', { count: 'exact', head: true });
        
        stats.registeredUsers = result.count || 0;
      } catch (e) {
        console.error('[Stats] User count error:', e);
      }
      
      return NextResponse.json({
        success: true,
        stats,
        source // Zeigt an, woher die Daten kommen
      });
    } catch (e) {
      console.error('[Stats] Exception:', e);
      // Letzter Fallback: Nur File-Daten
      const fileStats = readStats();
      return NextResponse.json({
        success: true,
        stats: {
          totalVisits: fileStats.total_visits || 0,
          uniqueVisitors: fileStats.unique_visitors || 0,
          appInstalls: fileStats.app_installs || 0,
          pwaUsers: fileStats.pwa_users || 0,
          registeredUsers: 0
        },
        source: 'file'
      });
    }
  }

  // ===== ACTIVITY LOGS ROUTES =====
  
  // GET /api/logs - Alle Logs abrufen (Admin only)
  if (p === 'logs') {
    const admin = getAdminContext(request);
    if (!admin) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const actionType = url.searchParams.get('actionType') || null;
      const userId = url.searchParams.get('userId') || null;
      const bewerbungId = url.searchParams.get('bewerbungId') || null;
      const startDate = url.searchParams.get('startDate') || null;
      const endDate = url.searchParams.get('endDate') || null;

      const result = await getLogs({
        page,
        limit,
        actionType,
        userId,
        bewerbungId,
        startDate,
        endDate,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json(result);
    } catch (e) {
      console.error('Fehler beim Abrufen der Logs:', e);
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // GET /api/logs/cleanup - Alte Logs löschen (Admin only)
  if (p === 'logs/cleanup') {
    const admin = getAdminContext(request);
    if (!admin) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    try {
      const result = await cleanupOldLogs();
      
      // Log diese Admin-Aktion
      await logActivity({
        actionType: LOG_ACTIONS.ADMIN_ACCOUNT_GELÖSCHT,
        userId: admin.discordUserId || admin.mitarbeiterNummer,
        username: admin.username || admin.discordUsername,
        details: { action: 'Alte Logs gelöscht (>60 Tage)' },
        ipAddress: getIpAddress(request),
      });

      return NextResponse.json(result);
    } catch (e) {
      console.error('Fehler beim Cleanup:', e);
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // GET /api/logs/init - Tabelle initialisieren
  if (p === 'logs/init') {
    try {
      // Test-Insert zum Erstellen der Tabelle
      await logActivity({
        actionType: 'SYSTEM_INIT',
        userId: 'system',
        username: 'System',
        details: { message: 'Activity Logs System initialisiert' },
      });

      return NextResponse.json({ success: true, message: 'Logs-Tabelle initialisiert' });
    } catch (e) {
      console.error('Fehler bei Init:', e);
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ===== TEAM MEMBERS (PUBLIC) - Live von Discord =====
  if (p === 'team/members') {
    try {
      const GUILD_ID = process.env.DISCORD_GUILD_ID;
      const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
      
      // Alle Rollen sammeln
      const allRoleIds = { ...ADMIN_ROLES, ...TEAM_ROLES };
      const allRoleIdsList = Object.keys(allRoleIds);
      
      // Discord Guild Members abrufen (max 1000)
      let allMembers = [];
      let after = '0';
      let fetching = true;
      
      while (fetching) {
        const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000&after=${after}`, {
          headers: { 'Authorization': `Bot ${BOT_TOKEN}` },
        });
        
        if (!res.ok) {
          console.error('[TEAM] Discord API error:', res.status, await res.text());
          break;
        }
        
        const batch = await res.json();
        if (batch.length === 0) break;
        
        allMembers = allMembers.concat(batch);
        
        if (batch.length < 1000) {
          fetching = false;
        } else {
          after = batch[batch.length - 1].user.id;
        }
      }
      
      // Rollen-Struktur mit Levels (höher = wichtiger)
      const roles = [
        { name: 'Projektinhaber', level: 10, category: 'Leitung', desc: 'Gründer & Leitung des Projekts', icon: 'crown' },
        { name: 'Stl. Projektinhaber', level: 9, category: 'Leitung', desc: 'Stellvertretende Projektleitung', icon: 'crown' },
        { name: 'Teamkoordination', level: 8, category: 'Management', desc: 'Koordination des gesamten Teams', icon: 'star' },
        { name: 'Qualitätsmanagement', level: 7, category: 'Management', desc: 'Qualitätssicherung & Standards', icon: 'award' },
        { name: 'Teamvertretung', level: 6, category: 'Führung', desc: 'Vertretung der Teaminteressen', icon: 'shield' },
        { name: 'Teamleitung', level: 5, category: 'Führung', desc: 'Leitung einzelner Teambereiche', icon: 'shield' },
        { name: 'Stl. Teamleitung', level: 4, category: 'Führung', desc: 'Stellvertretende Teamleitung', icon: 'shield' },
        { name: 'Roblox Manager', level: 3, category: 'Roblox', desc: 'Verwaltung des Roblox-Bereichs', icon: 'gamepad' },
        { name: 'Discord Manager', level: 2, category: 'Discord', desc: 'Verwaltung des Discord-Servers', icon: 'headphones' },
        { name: 'Roblox Team', level: 1, category: 'Roblox', desc: 'Roblox-Teammitglieder', icon: 'gamepad' },
        { name: 'Discord Team', level: 0, category: 'Discord', desc: 'Discord-Teammitglieder', icon: 'headphones' },
      ];
      
      // Rollen-Map für schnellen Level-Zugriff
      const roleMap = {};
      roles.forEach(r => roleMap[r.name] = r.level);
      
      // Mitglieder sammeln - pro Discord-User nur die höchste Rolle
      const userHighestRole = {}; // discordId -> { role, level, userData }
      
      for (const member of allMembers) {
        if (!member.user || member.user.bot) continue;
        
        const memberRoles = member.roles || [];
        const discordId = member.user.id;
        
        // Finde die höchste Rolle dieses Users
        let highestRole = null;
        let highestLevel = -1;
        
        for (const roleId of memberRoles) {
          if (allRoleIds[roleId]) {
            const roleName = allRoleIds[roleId].name;
            const roleLevel = roleMap[roleName] ?? -1;
            
            if (roleLevel > highestLevel) {
              highestLevel = roleLevel;
              highestRole = roleName;
            }
          }
        }
        
        // Wenn User eine relevante Rolle hat, speichere nur die höchste
        if (highestRole && highestLevel >= 0) {
          const avatarUrl = member.user.avatar 
            ? `https://cdn.discordapp.com/avatars/${discordId}/${member.user.avatar}.png?size=128`
            : null;
          
          userHighestRole[discordId] = {
            username: member.user.global_name || member.user.username,
            discordUsername: member.user.username,
            discordId: discordId,
            avatar: avatarUrl,
            roleName: highestRole,
            roleLevel: highestLevel,
          };
        }
      }
      
      // Gruppiere nach Rollen
      const membersByRole = {};
      for (const userData of Object.values(userHighestRole)) {
        const roleName = userData.roleName;
        if (!membersByRole[roleName]) membersByRole[roleName] = [];
        membersByRole[roleName].push(userData);
      }
      
      // Flat member list
      const members = [];
      for (const [roleName, roleMembers] of Object.entries(membersByRole)) {
        for (const m of roleMembers) {
          members.push(m);
        }
      }
      
      return NextResponse.json({ members, roles, totalDiscordMembers: allMembers.length });
    } catch (error) {
      console.error('Team members error:', error);
      return NextResponse.json({ members: [], roles: [], error: error.message });
    }
  }

  // ===== NOTIFICATIONS ROUTES =====
  if (p === 'notifications') {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    try {
      const notifications = await getUserNotifications(user.id);
      const unreadCount = await getUnreadCount(user.id);
      return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
      console.error('Get notifications error:', error);
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }
  }

  if (p === 'notifications/unread-count') {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ unreadCount: 0 });
    try {
      const unreadCount = await getUnreadCount(user.id);
      return NextResponse.json({ unreadCount });
    } catch (error) {
      return NextResponse.json({ unreadCount: 0 });
    }
  }

  // === Cron: Check Cooldowns ===
  if (p === 'cron/check-cooldowns') {
    // Security: Check Cron Secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret-change-me';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      console.log('[Cron] Starting cooldown check...');
      
      // Get all users with cooldowns
      const { data: users, error: usersError } = await supabaseAdmin
        .from('user_data')
        .select('discord_user_id, data');

      if (usersError) {
        console.error('[Cron] Error fetching users:', usersError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      // Get all push subscriptions
      const { data: subscriptions, error: subError } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*');

      if (subError) {
        console.error('[Cron] Error fetching subscriptions:', subError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      const now = Date.now();
      let notificationsSent = 0;
      let errors = 0;

      // Check each user
      for (const user of users) {
        const userId = user.discord_user_id;
        const userData = user.data;
        const cooldowns = userData.cooldowns || {};
        const licenses = userData.licenses || [];

        const userSub = subscriptions.find(sub => sub.user_id === userId);
        if (!userSub) continue;

        for (const [cooldownKey, startTime] of Object.entries(cooldowns)) {
          let duration = 4 * 60 * 60 * 1000;
          
          if (cooldownKey === 'collect') {
            if (licenses.includes('vip_elite_plus') || licenses.includes('vip_ultimate')) {
              duration = 45 * 60 * 1000;
            } else if (licenses.includes('vip_platinum')) {
              duration = 1 * 60 * 60 * 1000;
            } else if (licenses.includes('vip_premium')) {
              duration = 2 * 60 * 60 * 1000;
            }
          } else if (cooldownKey === 'ueberfall') {
            duration = 24 * 60 * 60 * 1000;
          } else if (cooldownKey === 'elitePlusDaily') {
            duration = 24 * 60 * 60 * 1000;
          }

          const endTime = startTime + duration;
          const timeLeft = endTime - now;

          const cooldownNames = {
            collect: '💰 Gehalt abholen',
            ueberfall: '🔫 Überfall',
            elitePlusDaily: '⭐ Elite+ Daily',
            work: '💼 Arbeiten'
          };

          // Benachrichtigungs-Text je nach Cooldown-Typ
          const cooldownMessages = {
            collect: 'Dein Gehalt ist bereit! Hol es dir mit /collect ab! 💵',
            ueberfall: 'Du kannst wieder jemanden ausrauben! Nutze /rob! 🔫',
            elitePlusDaily: 'Dein Elite+ Daily Bonus ist verfügbar! ⭐',
            work: 'Du kannst wieder arbeiten! Nutze /work! 💼'
          };

          const notificationKey = `${userId}_${cooldownKey}_${startTime}`;
          
          // Zeitfenster: 5 Minuten vor bis 5 Minuten nach Ablauf
          if (timeLeft <= 300000 && timeLeft > -300000) {
            try {
              const { data: existing } = await supabaseAdmin
                .from('sent_notifications')
                .select('id')
                .eq('notification_key', notificationKey)
                .maybeSingle();

              if (!existing) {
                await webpush.sendNotification(
                  userSub.subscription,
                  JSON.stringify({
                    title: `✅ ${cooldownNames[cooldownKey] || cooldownKey} verfügbar!`,
                    body: cooldownMessages[cooldownKey] || 'Du kannst jetzt wieder den Command ausführen!',
                    icon: '/icon-512.png',
                    badge: '/icon-192.png',
                    tag: `cooldown_${cooldownKey}`,
                    url: '/profil',
                    requireInteraction: true
                  })
                );

                await supabaseAdmin
                  .from('sent_notifications')
                  .insert({
                    notification_key: notificationKey,
                    user_id: userId,
                    type: 'cooldown_ready',
                    sent_at: new Date().toISOString()
                  });

                notificationsSent++;
                console.log(`[Cron] ✅ Sent notification to ${userId} for ${cooldownKey}`);
              }
            } catch (pushError) {
              console.error(`[Cron] Error sending notification to ${userId}:`, pushError.message);
              
              if (pushError.statusCode === 410) {
                await supabaseAdmin
                  .from('push_subscriptions')
                  .delete()
                  .eq('user_id', userId);
                console.log(`[Cron] Removed invalid subscription for ${userId}`);
              }
              
              errors++;
            }
          }
        }
      }

      // === Daily Bonus Benachrichtigungen ===
      console.log('[Cron] Checking daily bonus availability...');
      
      // Prüfe für jeden User mit Push-Subscription ob Daily Bonus verfügbar ist
      for (const sub of subscriptions) {
        try {
          const userId = sub.user_id;
          const today = new Date().toISOString().split('T')[0];
          const notificationKey = `daily_bonus_${userId}_${today}`;

          // Prüfe ob heute schon eine Daily-Bonus-Notification gesendet wurde
          const { data: alreadySent } = await supabaseAdmin
            .from('sent_notifications')
            .select('id')
            .eq('notification_key', notificationKey)
            .maybeSingle();

          if (alreadySent) continue; // Schon benachrichtigt heute

          // Prüfe ob der User heute schon den Daily Bonus abgeholt hat
          const { data: todayReward } = await supabaseAdmin
            .from('rewards')
            .select('id')
            .eq('discord_user_id', userId)
            .eq('reward_type', 'daily_bonus')
            .gte('created_at', `${today}T00:00:00`)
            .limit(1);

          // Wenn KEIN Reward für heute → Daily Bonus ist verfügbar → Notification senden
          if (!todayReward || todayReward.length === 0) {
            // Prüfe ob der User gestern einen Daily Bonus hatte (nur benachrichtigen wenn er aktiv ist)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const { data: yesterdayReward } = await supabaseAdmin
              .from('rewards')
              .select('id')
              .eq('discord_user_id', userId)
              .eq('reward_type', 'daily_bonus')
              .gte('created_at', `${yesterday}T00:00:00`)
              .lt('created_at', `${today}T00:00:00`)
              .limit(1);

            // Nur benachrichtigen wenn der User gestern aktiv war (Daily Bonus abgeholt hat)
            if (yesterdayReward && yesterdayReward.length > 0) {
              // Nur ab 8 Uhr morgens benachrichtigen
              const currentHour = new Date().getHours();
              if (currentHour >= 8) {
                await webpush.sendNotification(
                  sub.subscription,
                  JSON.stringify({
                    title: '🎁 Dein Daily Bonus wartet!',
                    body: 'Hol dir deinen täglichen Bonus ab! Komm in die App und claim ihn! 💰',
                    icon: '/icon-512.png',
                    badge: '/icon-192.png',
                    tag: 'daily_bonus',
                    url: '/profil',
                    requireInteraction: false
                  })
                );

                await supabaseAdmin
                  .from('sent_notifications')
                  .insert({
                    notification_key: notificationKey,
                    user_id: userId,
                    type: 'daily_bonus_available',
                    sent_at: new Date().toISOString()
                  });

                notificationsSent++;
                console.log(`[Cron] ✅ Sent daily bonus notification to ${userId}`);
              }
            }
          }
        } catch (dailyErr) {
          console.error('[Cron] Error checking daily bonus:', dailyErr.message);
          if (dailyErr.statusCode === 410) {
            await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', sub.user_id);
          }
          errors++;
        }
      }

      // === Wartungs-Benachrichtigungen ===
      console.log('[Cron] Checking maintenance status...');
      
      // Get maintenance status
      const { data: systemStatus } = await supabaseAdmin
        .from('system_status')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (systemStatus) {
        const isActive = systemStatus.wartungsmodus;
        const hasGeplanteWartung = systemStatus.geplante_wartung;
        const wartungStart = systemStatus.wartung_start ? new Date(systemStatus.wartung_start).getTime() : null;
        const wartungEnde = systemStatus.wartung_ende ? new Date(systemStatus.wartung_ende).getTime() : null;
        const timeUntilStart = wartungStart ? wartungStart - now : null;

        // --- Geplante Wartung: 24h vorher (Fenster: 24h bis 22h vorher) ---
        if (hasGeplanteWartung && wartungStart && timeUntilStart !== null && timeUntilStart <= 24 * 60 * 60 * 1000 && timeUntilStart > 22 * 60 * 60 * 1000) {
          const notificationKey = `maintenance_24h_${wartungStart}`;
          const { data: existing } = await supabaseAdmin
            .from('sent_notifications')
            .select('id')
            .eq('notification_key', notificationKey)
            .maybeSingle();

          if (!existing) {
            console.log('[Cron] Sending 24h maintenance warning to all users...');
            
            for (const sub of subscriptions) {
              try {
                await webpush.sendNotification(
                  sub.subscription,
                  JSON.stringify({
                    title: '⚠️ Geplante Wartung in 24 Stunden',
                    body: `Hamburg Horizon RP wird morgen gewartet. ${systemStatus.wartung_nachricht || 'Bitte plane entsprechend.'}`,
                    icon: '/icon-512.png',
                    badge: '/icon-192.png',
                    tag: 'maintenance_24h',
                    url: '/',
                    requireInteraction: false
                  })
                );
                notificationsSent++;
              } catch (pushError) {
                console.error('[Cron] Error sending maintenance notification:', pushError.message);
                if (pushError.statusCode === 410) {
                  await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', sub.user_id);
                }
                errors++;
              }
            }

            await supabaseAdmin
              .from('sent_notifications')
              .insert({
                notification_key: notificationKey,
                user_id: 'all',
                type: 'maintenance_24h',
                sent_at: new Date().toISOString()
              });
          }
        }

        // --- Geplante Wartung: 1h vorher (Fenster: 1h bis 30min vorher) ---
        if (hasGeplanteWartung && wartungStart && timeUntilStart !== null && timeUntilStart <= 60 * 60 * 1000 && timeUntilStart > 30 * 60 * 1000) {
          const notificationKey = `maintenance_1h_${wartungStart}`;
          const { data: existing } = await supabaseAdmin
            .from('sent_notifications')
            .select('id')
            .eq('notification_key', notificationKey)
            .maybeSingle();

          if (!existing) {
            console.log('[Cron] Sending 1h maintenance warning to all users...');
            
            for (const sub of subscriptions) {
              try {
                await webpush.sendNotification(
                  sub.subscription,
                  JSON.stringify({
                    title: '⏰ Wartung startet in 1 Stunde!',
                    body: 'Hamburg Horizon RP wird in Kürze gewartet. Beende deine Aktivitäten rechtzeitig!',
                    icon: '/icon-512.png',
                    badge: '/icon-192.png',
                    tag: 'maintenance_1h',
                    url: '/',
                    requireInteraction: true
                  })
                );
                notificationsSent++;
              } catch (pushError) {
                console.error('[Cron] Error sending maintenance notification:', pushError.message);
                if (pushError.statusCode === 410) {
                  await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', sub.user_id);
                }
                errors++;
              }
            }

            await supabaseAdmin
              .from('sent_notifications')
              .insert({
                notification_key: notificationKey,
                user_id: 'all',
                type: 'maintenance_1h',
                sent_at: new Date().toISOString()
              });
          }
        }

        // --- Wartung aktiv: UNABHÄNGIG von geplante_wartung ---
        // Sendet Notification wenn wartungsmodus aktiv ist (egal ob Normal oder Geplant)
        if (isActive) {
          // Verwende stabile Notification-Key (wartungStart oder 'direct' für direkte Aktivierung)
          const activeKey = wartungStart ? `maintenance_active_${wartungStart}` : `maintenance_active_direct_${systemStatus.updated_at || 'unknown'}`;
          const { data: existing } = await supabaseAdmin
            .from('sent_notifications')
            .select('id')
            .eq('notification_key', activeKey)
            .maybeSingle();

          if (!existing) {
            // Prüfe ob wir NICHT schon eine sofortige Notification gesendet haben (aus handleUpdateSystemStatus)
            const { data: recentImmediate } = await supabaseAdmin
              .from('sent_notifications')
              .select('id')
              .eq('type', 'wartungsmodus_activated')
              .gte('sent_at', new Date(now - 5 * 60 * 1000).toISOString())
              .maybeSingle();

            if (!recentImmediate) {
              console.log('[Cron] Sending maintenance active notification to all users...');
              
              for (const sub of subscriptions) {
                try {
                  await webpush.sendNotification(
                    sub.subscription,
                    JSON.stringify({
                      title: '🔧 Wartung läuft',
                      body: systemStatus.wartung_nachricht || 'Hamburg Horizon RP befindet sich im Wartungsmodus. Wir sind bald zurück!',
                      icon: '/icon-512.png',
                      badge: '/icon-192.png',
                      tag: 'maintenance_active',
                      url: '/',
                      requireInteraction: false
                    })
                  );
                  notificationsSent++;
                } catch (pushError) {
                  console.error('[Cron] Error sending maintenance notification:', pushError.message);
                  if (pushError.statusCode === 410) {
                    await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', sub.user_id);
                  }
                  errors++;
                }
              }

              await supabaseAdmin
                .from('sent_notifications')
                .insert({
                  notification_key: activeKey,
                  user_id: 'all',
                  type: 'maintenance_active',
                  sent_at: new Date().toISOString()
                });
            } else {
              console.log('[Cron] Skipping maintenance_active - already sent via immediate notification');
            }
          }
        }

        // --- Wartung beendet: UNABHÄNGIG von geplante_wartung ---
        // Prüfe ob Wartungsmodus kürzlich deaktiviert wurde (updated_at in den letzten 10 Min und wartungsmodus=false)
        if (!isActive) {
          // Prüfe ob es eine kürzliche Deaktivierung gab
          const updatedAt = systemStatus.updated_at ? new Date(systemStatus.updated_at).getTime() : 0;
          const timeSinceUpdate = now - updatedAt;
          
          // Nur wenn die letzte Änderung in den letzten 15 Minuten war und Wartungsmodus jetzt aus ist
          if (timeSinceUpdate < 15 * 60 * 1000 && timeSinceUpdate > 0) {
            const endedKey = wartungStart ? `maintenance_ended_${wartungStart}` : `maintenance_ended_${updatedAt}`;
            const { data: existing } = await supabaseAdmin
              .from('sent_notifications')
              .select('id')
              .eq('notification_key', endedKey)
              .maybeSingle();

            // Prüfe ob vorher eine "aktiv" Notification gesendet wurde (dann ist das eine echte Beendigung)
            const { data: wasActive } = await supabaseAdmin
              .from('sent_notifications')
              .select('id')
              .in('type', ['maintenance_active', 'wartungsmodus_activated'])
              .gte('sent_at', new Date(now - 48 * 60 * 60 * 1000).toISOString())
              .limit(1)
              .maybeSingle();

            // Prüfe ob NICHT schon eine sofortige "ended" Notification gesendet wurde
            const { data: recentImmediate } = await supabaseAdmin
              .from('sent_notifications')
              .select('id')
              .eq('type', 'wartungsmodus_deactivated')
              .gte('sent_at', new Date(now - 5 * 60 * 1000).toISOString())
              .maybeSingle();

            if (!existing && wasActive && !recentImmediate) {
              console.log('[Cron] Sending maintenance ended notification to all users...');
              
              for (const sub of subscriptions) {
                try {
                  await webpush.sendNotification(
                    sub.subscription,
                    JSON.stringify({
                      title: '✅ Wartung abgeschlossen!',
                      body: 'Hamburg Horizon RP ist wieder online! Viel Spaß beim Spielen! 🎉',
                      icon: '/icon-512.png',
                      badge: '/icon-192.png',
                      tag: 'maintenance_ended',
                      url: '/',
                      requireInteraction: false
                    })
                  );
                  notificationsSent++;
                } catch (pushError) {
                  console.error('[Cron] Error sending maintenance notification:', pushError.message);
                  if (pushError.statusCode === 410) {
                    await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', sub.user_id);
                  }
                  errors++;
                }
              }

              await supabaseAdmin
                .from('sent_notifications')
                .insert({
                  notification_key: endedKey,
                  user_id: 'all',
                  type: 'maintenance_ended',
                  sent_at: new Date().toISOString()
                });
            }
          }
        }
      }

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from('sent_notifications')
        .delete()
        .lt('sent_at', sevenDaysAgo);

      console.log(`[Cron] Completed: ${notificationsSent} notifications sent, ${errors} errors`);

      return NextResponse.json({
        success: true,
        notificationsSent,
        errors,
        usersChecked: users.length
      });

    } catch (error) {
      console.error('[Cron] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: error.message },
        { status: 500 }
      );
    }
  }

  switch (p) {
    case 'auth/discord': return handleDiscordAuth();
    case 'auth/callback': return handleDiscordCallback(request);
    case 'auth/me': return handleAuthMe(request);
    case 'bewerbungen': return handleGetBewerbungen(request);
    case 'bewerbungen/stats': return handleGetBewerbungenStats(request);
    case 'bewerbung-settings': return handleGetBewerbungSettings(request);
    case 'settings/username': return handleUpdateUsername(request);
    case 'settings/password': return handleUpdatePassword(request);
    case 'admin/me': return handleAdminMe(request);
    case 'admin/bewerbungen': return handleAdminGetBewerbungen(request);
    case 'admin/accounts': return handleAdminGetAccounts(request);
    case 'admin/settings': return handleAdminGetSettings(request);
    case 'admin/verwarnungen-suche': return handleAdminVerwarnungenSuche(request);
    case 'team/members': return handleGetTeamMembers(request);
    case 'shop/items': return handleGetShopItems(request);
    case 'licenses/pending-actions': return handleGetPendingLicenseActions(request);
    case 'shop/pending-purchases': return handleGetPendingShopPurchases(request);
    case 'transfer/pending': return handleGetPendingTransfers(request);
    case 'credits/pending': return handleGetPendingCreditActions(request);
    case 'character/pending': return handleGetPendingCharacterActions(request);
    default: break;
  }

  // === System Status ===
  if (p === 'admin/system-status') {
    try {
      const admin = getAdminContext(request);
      if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get or create system_status table entry
      const { data, error } = await supabaseAdmin
        .from('system_status')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Get system_status error:', error);
        // Return default values if table doesn't exist yet
        return NextResponse.json({ 
          status: {
            wartungsmodus: false,
            geplante_wartung: false,
            wartung_start: '',
            wartung_ende: '',
            wartung_nachricht: 'Wir führen gerade Wartungsarbeiten durch.',
          }
        });
      }

      if (!data) {
        // No entry exists, create default
        const { data: newData, error: createError } = await supabaseAdmin
          .from('system_status')
          .insert({
            wartungsmodus: false,
            geplante_wartung: false,
            wartung_start: null,
            wartung_ende: null,
            wartung_nachricht: 'Wir führen gerade Wartungsarbeiten durch.',
          })
          .select()
          .single();

        if (createError) {
          console.error('Create system_status error:', createError);
          return NextResponse.json({ 
            status: {
              wartungsmodus: false,
              geplante_wartung: false,
              wartung_start: '',
              wartung_ende: '',
              wartung_nachricht: 'Wir führen gerade Wartungsarbeiten durch.',
            }
          });
        }

        return NextResponse.json({ status: newData });
      }

      return NextResponse.json({ status: data });
    } catch (error) {
      console.error('System status error:', error);
      return NextResponse.json({ 
        status: {
          wartungsmodus: false,
          geplante_wartung: false,
          wartung_start: '',
          wartung_ende: '',
          wartung_nachricht: 'Wir führen gerade Wartungsarbeiten durch.',
        }
      });
    }
  }

  // === Public System Status (for banner and maintenance mode) ===
  if (p === 'system-status/public') {
    try {
      const { data, error } = await supabaseAdmin
        .from('system_status')
        .select('wartungsmodus, geplante_wartung, wartung_start, wartung_ende, wartung_nachricht')
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json({ 
          wartungsmodus: false,
          geplante_wartung: false 
        });
      }

      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ 
        wartungsmodus: false,
        geplante_wartung: false 
      });
    }
  }

  // === User Rewards & Data ===
  if (p === 'user/rewards') {
    return handleGetUserRewards(request);
  }
  
  if (p === 'user/data') {
    return handleGetUserData(request);
  }

  // === Bot Status ===
  if (p === 'bot/status') {
    return handleBotStatus(request);
  }
  
  // === Check Daily Bonus ===
  if (p === 'check-daily') {
    return handleCheckDaily(request);
  }

  // === Meine Bewerbungen ===
  if (p === 'bewerbungen/me') {
    return handleGetMyBewerbungen(request);
  }

  // === Discord Server Stats ===
  if (p === 'discord/stats') {
    return handleGetDiscordStats(request);
  }

  // === Hamburg Horizon Bot Features (Level/Marktplatz/Charakter/Profil) ===
  if (p === 'hh/leaderboard') {
    return handleHHLeaderboard(request);
  }
  if (p === 'hh/my-level') {
    return handleHHMyLevel(request);
  }
  if (p === 'hh/marketplace') {
    return handleHHMarketplace(request);
  }
  if (p && p.startsWith('hh/character/')) {
    const userId = p.replace('hh/character/', '');
    return handleHHCharacter(request, userId);
  }
  if (p === 'hh/character-search') {
    return handleHHCharacterSearch(request);
  }
  if (p === 'hh/my-profile') {
    return handleHHMyProfile(request);
  }
  if (p === 'hh/my-warnings') {
    return handleHHMyWarnings(request);
  }
  if (p === 'hh/user-warnings') {
    return handleHHUserWarnings(request);
  }
  if (p === 'hh/tickets') {
    return handleHHTickets(request);
  }
  if (p && p.startsWith('hh/tickets/')) {
    const ticketId = p.replace('hh/tickets/', '').replace('/transcript', '');
    return handleHHTicketTranscript(request, ticketId);
  }

  // === Transfer: Empfänger-Suche (Vor-/Nachname) ===
  if (p === 'transfer/search-recipients') {
    return handleSearchRecipients(request);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(request) {
  const url = new URL(request.url);
  const p = url.pathname.replace('/api/', '');
  
  console.log('[POST] Path:', p);
  console.log('[POST] Full URL:', url.pathname);

  // ===== WEBSITE STATISTICS TRACKING =====
  
  // POST /api/stats/visit - Track page visit
  if (p === 'stats/visit') {
    try {
      const body = await request.json();
      const { visitorId } = body;
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      // Versuche ZUERST Supabase
      try {
        // Track Visitor in unique_visitors Tabelle
        if (visitorId) {
          await supabaseAdmin.rpc('track_visitor', {
            visitor_uuid: visitorId,
            user_agent_string: userAgent
          });
        }
        
        // Increment total_visits
        await supabaseAdmin.rpc('increment_stat', {
          stat_name: 'total_visits',
          increment_by: 1
        });
        
        console.log('[Stats] ✅ Visit getrackt (Supabase)');
        return NextResponse.json({ success: true, source: 'supabase' });
      } catch (supabaseError) {
        // Fallback zu File wenn Supabase fehlschlägt
        console.log('[Stats] ⚠️ Supabase failed, using File fallback');
        incrementStat('total_visits', 1);
        console.log('[Stats] ✅ Visit getrackt (File Fallback)');
        return NextResponse.json({ success: true, source: 'file' });
      }
    } catch (e) {
      console.error('[Stats] Visit exception:', e);
      return NextResponse.json({ success: true });
    }
  }
  
  // POST /api/stats/unique-visitor - Track unique visitor
  if (p === 'stats/unique-visitor') {
    try {
      // Versuche ZUERST Supabase
      try {
        await supabaseAdmin.rpc('increment_stat', {
          stat_name: 'unique_visitors',
          increment_by: 1
        });
        
        console.log('[Stats] ✅ Unique Visitor getrackt (Supabase)');
        return NextResponse.json({ success: true, source: 'supabase' });
      } catch (supabaseError) {
        // Fallback zu File
        incrementStat('unique_visitors', 1);
        console.log('[Stats] ✅ Unique Visitor getrackt (File Fallback)');
        return NextResponse.json({ success: true, source: 'file' });
      }
    } catch (e) {
      console.error('[Stats] Unique visitor exception:', e);
      return NextResponse.json({ success: true });
    }
  }
  
  // POST /api/stats/pwa-session - Track PWA Download (EINMALIG pro User!)
  if (p === 'stats/pwa-session') {
    try {
      const body = await request.json();
      const { visitorId } = body;
      
      // Versuche ZUERST Supabase
      try {
        if (visitorId) {
          await supabaseAdmin.rpc('mark_as_pwa_user', {
            visitor_uuid: visitorId
          });
        }
        
        // Increment pwa_downloads (nicht pwa_users, da es nur 1x pro User gezählt wird)
        await supabaseAdmin.rpc('increment_stat', {
          stat_name: 'pwa_downloads',
          increment_by: 1
        });
        
        console.log('[Stats] ✅ PWA-Download getrackt (Supabase) - EINMALIG');
        return NextResponse.json({ success: true, source: 'supabase' });
      } catch (supabaseError) {
        // Fallback zu File
        incrementStat('pwa_downloads', 1);
        console.log('[Stats] ✅ PWA-Download getrackt (File Fallback) - EINMALIG');
        return NextResponse.json({ success: true, source: 'file' });
      }
    } catch (e) {
      console.error('[Stats] PWA session exception:', e);
      return NextResponse.json({ success: true });
    }
  }
  
  // POST /api/stats/app-install - Track PWA installation
  if (p === 'stats/app-install') {
    try {
      // Versuche ZUERST Supabase
      try {
        await supabaseAdmin.rpc('increment_stat', {
          stat_name: 'app_installs',
          increment_by: 1
        });
        
        console.log('[Stats] ✅ App Install getrackt (Supabase)');
        return NextResponse.json({ success: true, source: 'supabase' });
      } catch (supabaseError) {
        // Fallback zu File
        incrementStat('app_installs', 1);
        console.log('[Stats] ✅ App Install getrackt (File Fallback)');
        return NextResponse.json({ success: true, source: 'file' });
      }
    } catch (e) {
      console.error('[Stats] App install exception:', e);
      return NextResponse.json({ success: true });
    }
  }

  // Notification routes
  if (p === 'notifications/read-all') {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    try {
      const count = await markAllNotificationsAsRead(user.id);
      return NextResponse.json({ success: true, count });
    } catch (error) {
      console.error('Mark all read error:', error);
      return NextResponse.json({ error: 'Fehler' }, { status: 500 });
    }
  }

  if (p.startsWith('notifications/') && p.endsWith('/read')) {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    const notifId = p.replace('notifications/', '').replace('/read', '');
    try {
      const notification = await markNotificationAsRead(user.id, notifId);
      return NextResponse.json({ success: true, notification });
    } catch (error) {
      console.error('Mark read error:', error);
      return NextResponse.json({ error: 'Fehler' }, { status: 500 });
    }
  }

  // === Push Notifications: Subscribe ===
  if (p === 'push/subscribe') {
    try {
      const { subscription, userId } = await request.json();

      if (!subscription || !userId) {
        return NextResponse.json(
          { error: 'Subscription und userId erforderlich' },
          { status: 400 }
        );
      }

      // Save subscription to Supabase
      const { error } = await supabaseAdmin
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          subscription: subscription,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[Push API] Error saving subscription:', error);
        return NextResponse.json(
          { error: 'Fehler beim Speichern der Subscription' },
          { status: 500 }
        );
      }

      // Send test notification
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: '🔔 Benachrichtigungen aktiviert!',
            body: 'Du erhältst jetzt Push-Benachrichtigungen, auch wenn die App geschlossen ist!',
            icon: '/icon-512.png',
            badge: '/icon-192.png',
            tag: 'test',
            url: '/profil'
          })
        );
      } catch (pushError) {
        console.error('[Push API] Error sending test notification:', pushError);
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('[Push API] Error:', error);
      return NextResponse.json(
        { error: 'Interner Serverfehler' },
        { status: 500 }
      );
    }
  }

  // === Push Notifications: Unsubscribe ===
  if (p === 'push/unsubscribe') {
    try {
      const { userId } = await request.json();
      if (!userId) {
        return NextResponse.json({ error: 'userId erforderlich' }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('[Push API] Error deleting subscription:', error);
        return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
      }

      console.log(`[Push API] Subscription deleted for user ${userId}`);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('[Push API] Unsubscribe error:', error);
      return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
    }
  }

  switch (p) {
    case 'auth/logout': return handleLogout(request);
    case 'bewerbungen': return handleCreateBewerbung(request);
    case 'bewerbung-settings': return handleUpdateBewerbungSettings(request);
    case 'admin/login': return handleAdminLogin(request);
    case 'admin/logout': return handleAdminLogout(request);
    case 'admin/accounts': return handleAdminCreateAccount(request);
    case 'admin/check-role': return handleCheckDiscordRole(request);
    case 'admin/settings': return handleAdminUpdateSettings(request);
    case 'admin/system-status': return handleUpdateSystemStatus(request); // Same as PUT
    case 'user/rewards/claim': return handleClaimReward(request);
    case 'user/rewards/daily': return handleDailyBonus(request);
    case 'user/rewards/reset-daily': return handleResetDaily(request);
    case 'daily-bonus': return handleDailyBonus(request);
    case 'check-daily': return handleCheckDaily(request);
    case 'bot/status': return handleBotStatus(request);
    case 'beta/feedback': return handleCreateBetaFeedback(request);
    case 'profile/stats': return handleGetProfileStats(request);
    case 'kredite': return handleGetKredite(request);
    case 'transfer': return handleTransferMoney(request);
    case 'transfer/debug': return handleTransferDebug(request);
    case 'shop/items': return handleGetShopItems(request);
    case 'shop/purchase': return handleShopPurchase(request);
    case 'shop/purchase-credits': return handlePurchaseCredits(request);
    case 'shop/upgrade-bank-limit': return handleUpgradeBankLimit(request);
    case 'shop/spend-credits': return handleSpendCredits(request);
    case 'shop/open-crate': return handleOpenCrate(request);
    case 'shop/check-recipient': 
      console.log('[DEBUG] check-recipient route hit!');
      return handleCheckRecipient(request);
    case 'shop/gift': return handleGiftItem(request);
    case 'licenses/action': return handleLicenseAction(request);
    case 'credits/repay': return handleCreditRepay(request);
    case 'credits/extend': return handleCreditExtend(request);
    case 'character/edit-request': return handleCharacterEditRequest(request);
    case 'character/delete-request': return handleCharacterDeleteRequest(request);
    default: return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

async function handleUpdateSystemStatus(request) {
  try {
    const admin = getAdminContext(request);
    // Nur Projektinhaber (Level 4) dürfen System-Status ändern
    if (!admin || admin.roleLevel < 4) {
      return NextResponse.json({ error: 'Unauthorized - Nur Projektinhaber' }, { status: 401 });
    }

    const body = await request.json();
    
    console.log('📥 Received system status update:', JSON.stringify(body, null, 2));
    console.log('📥 wartungsmodus type:', typeof body.wartungsmodus, 'value:', body.wartungsmodus);
    console.log('📥 geplante_wartung type:', typeof body.geplante_wartung, 'value:', body.geplante_wartung);
    
    // Update or insert system_status - immer nur EINE Zeile in dieser Tabelle
    const { data: existingRows, error: selectError } = await supabaseAdmin
      .from('system_status')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('❌ Select error:', selectError);
      return NextResponse.json({ error: 'Fehler beim Abrufen: ' + selectError.message }, { status: 500 });
    }

    const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;
    console.log('📊 Existing record:', existing ? `ID: ${existing.id}` : 'None');

    const updateData = {
      wartungsmodus: body.wartungsmodus === true || body.wartungsmodus === 'true',
      geplante_wartung: body.geplante_wartung === true || body.geplante_wartung === 'true',
      wartung_start: body.wartung_start || null,
      wartung_ende: body.wartung_ende || null,
      wartung_nachricht: body.wartung_nachricht || '',
      updated_at: new Date().toISOString(),
    };

    console.log('💾 Data to save:', JSON.stringify(updateData, null, 2));

    let result;
    if (existing) {
      console.log('🔄 Updating existing record ID:', existing.id);
      result = await supabaseAdmin
        .from('system_status')
        .update(updateData)
        .eq('id', existing.id)
        .select('*');
    } else {
      console.log('➕ Creating new record');
      const insertData = {
        wartungsmodus: body.wartungsmodus === true || body.wartungsmodus === 'true',
        geplante_wartung: body.geplante_wartung === true || body.geplante_wartung === 'true',
        wartung_start: body.wartung_start || null,
        wartung_ende: body.wartung_ende || null,
        wartung_nachricht: body.wartung_nachricht || '',
      };
      result = await supabaseAdmin
        .from('system_status')
        .insert(insertData)
        .select('*');
    }

    if (result.error) {
      console.error('❌ Database error:', JSON.stringify(result.error, null, 2));
      return NextResponse.json({ error: 'Fehler beim Speichern: ' + result.error.message }, { status: 500 });
    }

    console.log('✅ Saved successfully:', JSON.stringify(result.data, null, 2));

    // === SOFORTIGE PUSH-BENACHRICHTIGUNGEN BEI STATUSÄNDERUNG ===
    try {
      const oldWartungsmodus = existing?.wartungsmodus || false;
      const oldGeplanteWartung = existing?.geplante_wartung || false;
      const newWartungsmodus = updateData.wartungsmodus;
      const newGeplanteWartung = updateData.geplante_wartung;

      // Alle Push-Subscriptions laden
      const { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*');

      if (subscriptions && subscriptions.length > 0) {
        let pushTitle = null;
        let pushBody = null;
        let pushTag = null;
        let notificationType = null;

        // Fall 1: Wartungsmodus wurde AKTIVIERT (Normal oder bei geplanter Wartung)
        if (newWartungsmodus && !oldWartungsmodus) {
          pushTitle = '🔧 Wartungsarbeiten aktiv';
          pushBody = updateData.wartung_nachricht || 'Hamburg Horizon RP befindet sich im Wartungsmodus. Wir sind bald zurück!';
          pushTag = 'maintenance_active';
          notificationType = 'wartungsmodus_activated';
          console.log('[Push] Sending: Wartungsmodus activated notification');
        }
        // Fall 2: Geplante Wartung wurde AKTIVIERT (aber Wartungsmodus noch nicht aktiv)
        else if (newGeplanteWartung && !oldGeplanteWartung && !newWartungsmodus) {
          const startText = updateData.wartung_start 
            ? new Date(updateData.wartung_start).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '';
          const endeText = updateData.wartung_ende
            ? new Date(updateData.wartung_ende).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '';
          
          pushTitle = '⚠️ Geplante Wartungsarbeiten angekündigt';
          pushBody = updateData.wartung_nachricht || 'Es sind Wartungsarbeiten geplant.';
          if (startText) {
            pushBody += ` Start: ${startText}`;
          }
          if (endeText) {
            pushBody += ` | Ende: ${endeText}`;
          }
          pushTag = 'maintenance_planned';
          notificationType = 'geplante_wartung_activated';
          console.log('[Push] Sending: Geplante Wartung announced notification');
        }
        // Fall 3: Wartungsmodus wurde DEAKTIVIERT
        else if (!newWartungsmodus && oldWartungsmodus) {
          pushTitle = '✅ Wartung abgeschlossen!';
          pushBody = 'Hamburg Horizon RP ist wieder online! Viel Spaß beim Spielen! 🎉';
          pushTag = 'maintenance_ended';
          notificationType = 'wartungsmodus_deactivated';
          console.log('[Push] Sending: Wartungsmodus deactivated notification');
        }

        // Push-Notifications senden wenn es eine Statusänderung gab
        if (pushTitle && pushBody) {
          let pushSent = 0;
          let pushErrors = 0;

          for (const sub of subscriptions) {
            try {
              await webpush.sendNotification(
                sub.subscription,
                JSON.stringify({
                  title: pushTitle,
                  body: pushBody,
                  icon: '/icon-512.png',
                  badge: '/icon-192.png',
                  tag: pushTag,
                  url: '/',
                  requireInteraction: pushTag === 'maintenance_active'
                })
              );
              pushSent++;
            } catch (pushError) {
              console.error('[Push] Error sending maintenance notification:', pushError.message);
              // Ungültige Subscription entfernen (410 = Gone)
              if (pushError.statusCode === 410) {
                await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', sub.user_id);
                console.log(`[Push] Removed invalid subscription for ${sub.user_id}`);
              }
              pushErrors++;
            }
          }

          console.log(`[Push] Maintenance notifications sent: ${pushSent}, errors: ${pushErrors}`);

          // Notification-Key speichern um Duplikate im Cron zu vermeiden
          const notifKey = `immediate_${notificationType}_${Date.now()}`;
          await supabaseAdmin
            .from('sent_notifications')
            .insert({
              notification_key: notifKey,
              user_id: 'all',
              type: notificationType,
              sent_at: new Date().toISOString()
            })
            .then(() => {})
            .catch(err => console.error('[Push] Error saving notification key:', err));
        }
      }
    } catch (pushErr) {
      // Push-Fehler sollen den Status-Update nicht blockieren
      console.error('[Push] Error in maintenance push notifications:', pushErr.message);
    }

    // Log activity
    await logActivity({
      actionType: LOG_ACTIONS.SYSTEM_STATUS_GEÄNDERT || 'system_status_changed',
      userId: admin.discordUserId || admin.mitarbeiterNummer,
      username: admin.discordUsername,
      details: {
        wartungsmodus: updateData.wartungsmodus,
        geplante_wartung: updateData.geplante_wartung,
      },
      ipAddress: getIpAddress(request),
    });

    return NextResponse.json({ success: true, status: result.data?.[0] || result.data });
  } catch (error) {
    console.error('System status update error:', error);
    return NextResponse.json({ error: 'Fehler' }, { status: 500 });
  }
}

export async function PUT(request) {
  const url = new URL(request.url);
  const p = url.pathname.replace('/api/', '');

  // === Update System Status ===
  if (p === 'admin/system-status') {
    return handleUpdateSystemStatus(request);
  }

  switch (p) {
    case 'settings/username': return handleUpdateUsername(request);
    case 'settings/password': return handleUpdatePassword(request);
    default: break;
  }

  if (p.startsWith('admin/bewerbungen/')) {
    return handleAdminUpdateBewerbung(request, p.substring('admin/bewerbungen/'.length));
  }
  
  if (p.startsWith('admin/accounts/') && p.includes('/toggle-status')) {
    const id = p.substring('admin/accounts/'.length).replace('/toggle-status', '');
    return handleAdminToggleAccountStatus(request, id);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(request) {
  const url = new URL(request.url);
  const p = url.pathname.replace('/api/', '');

  if (p.startsWith('bewerbungen/')) {
    return handleWithdrawBewerbung(request, p.substring('bewerbungen/'.length));
  }
  
  if (p.startsWith('admin/accounts/')) {
    return handleAdminDeleteAccount(request, p.substring('admin/accounts/'.length));
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}


// ============================================
// USER REWARDS & DATA HANDLERS
// ============================================

async function handleGetUserRewards(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('rewards')
      .select('*')
      .eq('discord_user_id', user.id)
      .eq('claimed', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get rewards error:', error);
      return NextResponse.json({ error: 'Fehler beim Laden der Rewards' }, { status: 500 });
    }

    return NextResponse.json({ rewards: data || [] });
  } catch (error) {
    console.error('Get rewards exception:', error);
    return NextResponse.json({ error: 'Fehler' }, { status: 500 });
  }
}

async function handleGetUserData(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_data')
      .select('*')
      .eq('discord_user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Get user data error:', error);
      return NextResponse.json({ error: 'Fehler beim Laden der Daten' }, { status: 500 });
    }

    // Discord Role Checks:
    // Server Booster Role: 1274419855227093147
    // Nicht Verifiziert Role: 1273340696916394079
    const BOOSTER_ROLE_ID = '1274419855227093147';
    const NICHT_VERIFIZIERT_ROLE_ID = '1273340696916394079';
    let userData = data || null;
    let nichtVerifiziert = false;

    try {
      const member = await getGuildMember(user.id);
      if (member && member.roles) {
        // Nicht Verifiziert Check
        if (member.roles.includes(NICHT_VERIFIZIERT_ROLE_ID)) {
          nichtVerifiziert = true;
          console.log(`[UserData] User ${user.id} ist NICHT VERIFIZIERT (hat Rolle ${NICHT_VERIFIZIERT_ROLE_ID})`);
        }

        // Server Booster Check
        if (userData && userData.data) {
          const isBooster = member.roles.includes(BOOSTER_ROLE_ID);
          const licenses = userData.data.licenses || [];
          
          // Hilfsfunktion: Prüfe ob User eine Lizenz hat (unterstützt String UND Object Format)
          const hasLicense = (licenseId) => {
            return licenses.some(l => {
              if (!l) return false;
              if (typeof l === 'string') return l === licenseId;
              if (typeof l === 'object') return (l.name === licenseId || l.id === licenseId);
              return false;
            });
          };
          
          const hasServerBooster = hasLicense('server_booster');

          if (isBooster && !hasServerBooster) {
            // Füge server_booster als Objekt hinzu (konsistent mit neuem Format)
            userData = {
              ...userData,
              data: {
                ...userData.data,
                licenses: [...licenses, {
                  id: 'server_booster',
                  name: 'server_booster',
                  purchasedAt: new Date().toISOString(),
                  expiresAt: 0,
                  autoRenew: false,
                  owner: user.username || user.display_name
                }]
              }
            };
            console.log(`[UserData] Added server_booster for user ${user.id}`);
          } else if (!isBooster && hasServerBooster) {
            // Entferne server_booster (funktioniert mit String UND Object)
            userData = {
              ...userData,
              data: {
                ...userData.data,
                licenses: licenses.filter(l => {
                  if (!l) return false;
                  if (typeof l === 'string') return l !== 'server_booster';
                  if (typeof l === 'object') return l.name !== 'server_booster' && l.id !== 'server_booster';
                  return true;
                })
              }
            };
            console.log(`[UserData] Removed server_booster for user ${user.id}`);
          }
        } else if (!userData || !userData.data) {
          const isBooster = member.roles.includes(BOOSTER_ROLE_ID);
          if (isBooster) {
            userData = {
              discord_user_id: user.id,
              data: { licenses: ['server_booster'], cooldowns: {}, balance: 0 }
            };
          }
        }
      }
    } catch (roleCheckErr) {
      console.error('[UserData] Error checking Discord roles:', roleCheckErr.message);
    }

    return NextResponse.json({ data: userData, nichtVerifiziert });
  } catch (error) {
    console.error('Get user data exception:', error);
    return NextResponse.json({ error: 'Fehler' }, { status: 500 });
  }
}

async function handleClaimReward(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const body = await request.json();
    const { rewardId } = body;

    if (!rewardId) {
      return NextResponse.json({ error: 'Reward ID fehlt' }, { status: 400 });
    }

    // Markiere Reward als claimed
    const { data: reward, error } = await supabaseAdmin
      .from('rewards')
      .update({
        claimed: true,
        claimed_at: new Date().toISOString()
      })
      .eq('id', rewardId)
      .eq('discord_user_id', user.id)
      .eq('claimed', false)
      .select()
      .single();

    if (error || !reward) {
      console.error('Claim reward error:', error);
      return NextResponse.json({ 
        error: 'Reward konnte nicht beansprucht werden. Eventuell wurde er bereits beansprucht.' 
      }, { status: 400 });
    }

    // Notification erstellen
    await createNotification({
      userId: user.id,
      type: 'reward_claimed',
      title: 'Reward beansprucht!',
      message: `Du hast €${reward.amount} erfolgreich beansprucht. Der Bot wird dir das Geld in Kürze gutschreiben.`,
      relatedData: { rewardId: reward.id, amount: reward.amount }
    });

    return NextResponse.json({ 
      success: true, 
      reward,
      message: `€${reward.amount} wurden beansprucht! Der Bot wird dir das Geld in Kürze gutschreiben.`
    });
  } catch (error) {
    console.error('Claim reward exception:', error);
    return NextResponse.json({ error: 'Fehler' }, { status: 500 });
  }
}

async function handleGetMyBewerbungen(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    // Nutze die existierende Funktion
    const bewerbungen = await getUserBewerbungen(user.id);
    
    return NextResponse.json({ bewerbungen: bewerbungen || [] });
  } catch (error) {
    console.error('Get my bewerbungen exception:', error);
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}


async function handleDailyBonus(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    // Parse request body to check if PWA
    let isPWA = false;
    try {
      const body = await request.json();
      isPWA = body.isPWA || false;
    } catch (e) {
      // No body or invalid JSON, assume not PWA
      isPWA = false;
    }

    // Prüfe ob User heute bereits Daily Bonus geholt hat
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingReward, error: checkError } = await supabaseAdmin
      .from('rewards')
      .select('*')
      .eq('discord_user_id', user.id)
      .eq('reward_type', 'daily_bonus')
      .gte('created_at', `${today}T00:00:00`)
      .maybeSingle();

    if (existingReward) {
      return NextResponse.json({ 
        error: 'Du hast deinen Daily Bonus heute bereits abgeholt! Komm morgen wieder.' 
      }, { status: 400 });
    }

    // Daily Bonus Amount: PWA = €20.000, Browser = €5.000
    const dailyAmount = isPWA ? 20000 : 5000;

    // Erstelle neuen Daily Bonus Reward
    const { data: reward, error: insertError } = await supabaseAdmin
      .from('rewards')
      .insert({
        discord_user_id: user.id,
        reward_type: 'daily_bonus',
        amount: dailyAmount,
        claimed: true, // Sofort als claimed markieren
        processed: false,
        description: isPWA ? 'Täglicher Bonus (PWA 4x)' : 'Täglicher Bonus'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert daily bonus error:', insertError);
      return NextResponse.json({ error: 'Fehler beim Erstellen des Daily Bonus' }, { status: 500 });
    }

    // Notification erstellen (optional - wenn Funktion existiert)
    try {
      if (typeof createNotification === 'function') {
        await createNotification({
          userId: user.id,
          type: 'daily_bonus',
          title: '🎁 Daily Bonus erhalten!',
          message: `Du hast deinen täglichen Bonus von €${dailyAmount} erhalten! Der Bot wird dir das Geld in Kürze gutschreiben.`,
          relatedData: { rewardId: reward.id, amount: dailyAmount }
        });
      }
    } catch (notifError) {
      console.error('Notification error (non-critical):', notifError);
    }

    return NextResponse.json({ 
      success: true, 
      reward,
      amount: dailyAmount,
      message: `€${dailyAmount} Daily Bonus erhalten! Der Bot wird dir das Geld in Kürze gutschreiben.`
    });
  } catch (error) {
    console.error('Daily bonus exception:', error);
    return NextResponse.json({ error: 'Fehler beim Daily Bonus' }, { status: 500 });
  }
}



async function handleCheckDaily(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ canClaim: false, reason: 'not_logged_in' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Prüfe ob User heute schon Bonus bekommen hat
    const { data, error } = await supabaseAdmin
      .from('rewards')
      .select('id, created_at')
      .eq('discord_user_id', user.id)
      .eq('reward_type', 'daily_bonus')
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Check daily error:', error);
      return NextResponse.json({ canClaim: false, reason: 'error' });
    }

    // Wenn kein Reward für heute existiert, kann User claimen
    const canClaim = !data || data.length === 0;
    
    return NextResponse.json({ 
      canClaim,
      reason: canClaim ? 'available' : 'already_claimed',
      lastClaim: data && data.length > 0 ? data[0].created_at : null
    });
  } catch (error) {
    console.error('Check daily exception:', error);
    return NextResponse.json({ canClaim: false, reason: 'error' });
  }
}


async function handleResetDaily(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabaseAdmin
      .from('rewards')
      .delete()
      .eq('discord_user_id', user.id)
      .eq('reward_type', 'daily_bonus')
      .gte('created_at', `${today}T00:00:00`);

    if (error) {
      console.error('Reset daily error:', error);
      return NextResponse.json({ error: 'Fehler beim Zurücksetzen' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Daily Bonus wurde zurückgesetzt! Du kannst jetzt nochmal claimen.' 
    });
  } catch (error) {
    console.error('Reset daily exception:', error);
    return NextResponse.json({ error: 'Fehler' }, { status: 500 });
  }
}

// Discord Server Stats - Mitglieder, Online, Teamler
async function handleGetDiscordStats(request) {
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}?with_counts=true`, {
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    const guild = await response.json();
    
    // Count team members from role IDs
    const teamRoleIds = Object.keys({ ...ADMIN_ROLES, ...TEAM_ROLES });
    
    // Fetch guild members with roles to count team members
    const membersResponse = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members?limit=1000`, {
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      },
    });
    
    let teamCount = 0;
    if (membersResponse.ok) {
      const members = await membersResponse.json();
      teamCount = members.filter(member => 
        member.roles.some(roleId => teamRoleIds.includes(roleId))
      ).length;
    }

    return NextResponse.json({
      memberCount: guild.approximate_member_count || 0,
      onlineCount: guild.approximate_presence_count || 0,
      teamCount: teamCount,
      name: guild.name,
      icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
    });
  } catch (error) {
    console.error('Discord stats error:', error);
    // Return fallback data
    return NextResponse.json({
      memberCount: 0,
      onlineCount: 0,
      teamCount: 0,
      error: 'Fehler beim Laden der Discord Statistiken'
    });
  }
}

// Bot Status Check - prüft ob Bot Daten in Supabase hat UND ob sie aktuell sind
async function handleBotStatus(request) {
  try {
    // Prüfe ob Bot-Daten in Supabase vorhanden sind
    const { data, error } = await supabaseAdmin
      .from('user_data')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Bot status check error:', error);
      return NextResponse.json({ 
        isOnline: false,
        status: 'error',
        message: 'Fehler beim Prüfen des Bot-Status',
        checkedAt: new Date().toISOString()
      });
    }
    
    // Wenn keine Daten vorhanden = Bot war noch nie online
    if (!data || data.length === 0) {
      return NextResponse.json({ 
        isOnline: false,
        status: 'offline',
        message: 'Discord Bot ist offline (keine Daten)',
        checkedAt: new Date().toISOString()
      });
    }
    
    // Prüfe wie alt die Daten sind
    const lastUpdate = new Date(data[0].updated_at);
    const minutesSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
    
    // Bot synct alle 5 Minuten - wenn Daten älter als 10 Minuten = Bot ist offline
    const MAX_AGE_MINUTES = 10;
    const isOnline = minutesSinceUpdate < MAX_AGE_MINUTES;
    
    let message;
    if (isOnline) {
      if (minutesSinceUpdate < 1) {
        message = 'Discord Bot ist online (Daten gerade eben aktualisiert)';
      } else {
        message = `Discord Bot ist online (Letzte Sync vor ${Math.round(minutesSinceUpdate)} Min.)`;
      }
    } else {
      message = `Discord Bot ist offline (Letzte Sync vor ${Math.round(minutesSinceUpdate)} Min.)`;
    }
    
    return NextResponse.json({ 
      isOnline,
      status: isOnline ? 'online' : 'offline',
      message,
      lastUpdate: lastUpdate.toISOString(),
      minutesSinceUpdate: Math.round(minutesSinceUpdate),
      checkedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('Bot status error:', e);
    return NextResponse.json({ 
      isOnline: false,
      status: 'error',
      message: 'Unbekannter Fehler',
      checkedAt: new Date().toISOString()
    }, { status: 500 });
  }
}

// Beta Tester Feedback Handler
async function handleCreateBetaFeedback(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    // Beta-Feedback für alle eingeloggten User verfügbar
    // (Rollen-Prüfung entfernt)

    const body = await request.json();
    const { type, title, description, priority, page } = body;

    if (!type || !title || !description || !priority) {
      return NextResponse.json({ error: 'Fehlende Felder' }, { status: 400 });
    }

    // Sende Discord Webhook
    const webhookUrl = 'https://discord.com/api/webhooks/1494644222119383130/4QqLC8P_QGYwxNApmaEetihygaCPcO1y6do75zuze4RTXUeTjtsewtfhoYwhbPfkbFBb';
    
    const typeEmoji = {
      'bug': '🐛',
      'improvement': '💡',
      'feedback': '💬'
    };

    const priorityColor = {
      'low': 0x808080,
      'medium': 0x3b82f6,
      'high': 0xf97316,
      'critical': 0xef4444
    };

    const typeLabel = {
      'bug': 'Bug',
      'improvement': 'Verbesserung',
      'feedback': 'Feedback'
    };

    const priorityLabel = {
      'low': 'Niedrig',
      'medium': 'Mittel',
      'high': 'Hoch',
      'critical': 'Kritisch'
    };

    const embed = {
      title: `${typeEmoji[type]} ${title}`,
      description: description,
      color: priorityColor[priority],
      fields: [
        { name: 'Typ', value: typeLabel[type], inline: true },
        { name: 'Priorität', value: priorityLabel[priority], inline: true },
        { name: 'Seite', value: page || 'Nicht angegeben', inline: true },
        { name: 'Beta Tester', value: user.globalName || user.username || 'Unbekannt', inline: true },
        { name: 'User ID', value: user.id, inline: true },
        { name: 'Gesendet am', value: new Date().toLocaleString('de-DE'), inline: true }
      ],
      footer: {
        text: 'Beta Tester Feedback System'
      },
      timestamp: new Date().toISOString()
    };

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (!webhookResponse.ok) {
        throw new Error('Discord Webhook fehlgeschlagen');
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Feedback erfolgreich gesendet'
      });

    } catch (webhookError) {
      console.error('Discord webhook error:', webhookError);
      return NextResponse.json({ error: 'Fehler beim Senden des Feedbacks' }, { status: 500 });
    }

  } catch (e) {
    console.error('Create beta feedback error:', e);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// Get Kredite Handler
async function handleGetKredite(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    // Lade Kredite aus Bot-Daten
    const fs = require('fs');
    const path = require('path');
    const krediteFile = path.join(process.cwd(), 'discord-bot/data/pendingCredits.json');
    
    if (!fs.existsSync(krediteFile)) {
      return NextResponse.json({ 
        kredite: [], 
        stats: { totalKredite: 0, aktiv: 0, abgeschlossen: 0, offenerBetrag: 0 }
      });
    }

    const krediteData = JSON.parse(fs.readFileSync(krediteFile, 'utf8'));
    
    // Filtere Kredite für diesen User
    const userKredite = Object.values(krediteData).filter(k => k.userId === user.id);
    
    // Berechne Statistiken
    const stats = {
      totalKredite: userKredite.length,
      aktiv: userKredite.filter(k => k.status === 'aktiv' || k.status === 'pending').length,
      abgeschlossen: userKredite.filter(k => k.status === 'abgeschlossen').length,
      offenerBetrag: userKredite
        .filter(k => k.status === 'aktiv' || k.status === 'pending')
        .reduce((sum, k) => sum + (k.rueckzahlungsBetrag || 0), 0)
    };

    // Sortiere: Aktive zuerst, dann nach Datum
    userKredite.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      if (a.status === 'aktiv' && b.status !== 'aktiv') return -1;
      if (a.status !== 'aktiv' && b.status === 'aktiv') return 1;
      return new Date(b.beantragtAm || b.genehmigtAm) - new Date(a.beantragtAm || a.genehmigtAm);
    });

    return NextResponse.json({ 
      kredite: userKredite,
      stats
    });

  } catch (e) {
    console.error('Get kredite error:', e);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// ===== TRANSFER MONEY HANDLER =====
// Debug Endpoint für Transfer-Troubleshooting
async function handleTransferDebug(request) {
  try {
    const decoded = verifyToken(request.cookies.get('auth_token')?.value);
    if (!decoded) {
      return NextResponse.json({ error: 'Ungültiges Token' }, { status: 401 });
    }
    // Token enthält 'id', nicht 'userId'!
    const userId = decoded.id || decoded.userId;

    // Get user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from('user_data')
      .select('*')
      .eq('discord_user_id', userId)
      .single();

    // Get all users with account numbers
    const { data: allUsers } = await supabaseAdmin
      .from('user_data')
      .select('discord_user_id, data');

    const usersWithAccounts = allUsers?.map(u => {
      const parsedData = typeof u.data === 'string' ? JSON.parse(u.data) : (u.data || {});
      return {
        discord_id: u.discord_user_id,
        accountNumber: parsedData.cards?.[0]?.accountNumber || 'KEIN KONTO',
        bankBalance: parsedData.money?.bank || 0,
        bankId: parsedData.cards?.[0]?.bankId || 'keine'
      };
    }) || [];

    const currentUserData = typeof userData?.data === 'string' 
      ? JSON.parse(userData.data) 
      : (userData?.data || {});

    return NextResponse.json({
      currentUser: {
        discord_id: userId,
        found: !!userData,
        error: userError?.message,
        accountNumber: currentUserData.cards?.[0]?.accountNumber,
        bankBalance: currentUserData.money?.bank,
        hasCards: !!currentUserData.cards?.length
      },
      allUsersInDB: usersWithAccounts,
      totalUsers: usersWithAccounts.length
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


async function handleTransferMoney(request) {
  try {
    const decoded = verifyToken(request.cookies.get('auth_token')?.value);
    if (!decoded) {
      return NextResponse.json({ error: 'Ungültiges Token' }, { status: 401 });
    }
    // Token enthält 'id', nicht 'userId'!
    const userId = decoded.id || decoded.userId;
    console.log('[TRANSFER] 🔐 User ID aus Token:', userId);
    console.log('[TRANSFER] 🔐 Token Payload:', JSON.stringify(decoded));

    // Get user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from('user_data')
      .select('*')
      .eq('discord_user_id', userId)
      .single();

    console.log('[TRANSFER] 📊 User Data gefunden:', !!userData);
    console.log('[TRANSFER] ❌ User Error:', userError?.message);
    console.log('[TRANSFER] 🔍 Suche nach discord_user_id:', userId);

    if (userError || !userData) {
      // Prüfe, welche User IDs überhaupt in der DB sind
      const { data: allUserIds } = await supabaseAdmin
        .from('user_data')
        .select('discord_user_id');
      
      console.log('[TRANSFER] 👥 Alle discord_user_ids in DB:', allUserIds?.map(u => u.discord_user_id));
      console.log('[TRANSFER] ⚠️ FEHLER: Sender User nicht in Datenbank gefunden!');
      
      return NextResponse.json({ 
        error: 'Dein Account nicht gefunden',
        details: `Token User ID: ${userId}. Dein Discord-Account hat noch keine Spieldaten. Verbinde dich mit dem Discord Bot.`,
        debug: {
          tokenUserId: userId,
          dbUserIds: allUserIds?.map(u => u.discord_user_id)
        }
      }, { status: 404 });
    }

    const body = await request.json();
    const { kontonummer, betrag } = body;

    // Validierung
    if (!kontonummer || kontonummer.length !== 9) {
      return NextResponse.json({ 
        error: 'Ungültige Kontonummer',
        details: 'Die Kontonummer muss 9 Ziffern haben.'
      }, { status: 400 });
    }

    if (!betrag || betrag <= 0) {
      return NextResponse.json({ 
        error: 'Ungültiger Betrag',
        details: 'Der Betrag muss größer als 0 sein.'
      }, { status: 400 });
    }

    // User Bank Info - Parse data if it's a JSON string
    const userDataObj = typeof userData.data === 'string' 
      ? JSON.parse(userData.data) 
      : (userData.data || {});
    
    console.log('[TRANSFER] 📦 userData.data type:', typeof userData.data);
    console.log('[TRANSFER] 📦 userDataObj keys:', Object.keys(userDataObj));
    
    // Kontonummer aus cards - heißt 'accountNumber', nicht 'cardNumber'!
    const userCard = userDataObj.cards?.[0] || {};
    const senderAccountNumber = userCard.accountNumber;
    const bankId = userCard.bankId || 'hamburg_horizon';
    
    // Guthaben aus money.bank
    const bankBalance = userDataObj.money?.bank || 0;

    console.log('[TRANSFER API] senderAccountNumber:', senderAccountNumber);
    console.log('[TRANSFER API] bankBalance:', bankBalance);
    console.log('[TRANSFER API] bankId:', bankId);

    if (!senderAccountNumber) {
      return NextResponse.json({ 
        error: 'Kein Bankkonto',
        details: 'Du hast noch kein Bankkonto. Erstelle eins im Discord Bot.'
      }, { status: 400 });
    }

    // Eigenes Konto?
    if (senderAccountNumber === kontonummer) {
      return NextResponse.json({ 
        error: 'Ungültige Überweisung',
        details: 'Du kannst nicht an dich selbst überweisen.'
      }, { status: 400 });
    }

    // Bank Gebühren
    const BANKS = {
      hamburg_horizon: { fee: 0.20 },
      nordic_capital: { fee: 0.30 },
      metrova_trust: { fee: 0.15 },
      elite_federal: { fee: 0.40 }
    };

    const bank = BANKS[bankId] || BANKS['hamburg_horizon'];
    let feeRate = bank.fee;

    // VIP Discount - aus licenses Array ermitteln
    const licenses = userDataObj.licenses || [];
    let vipType = null;
    
    // Hilfsfunktion: Prüfe ob User eine Lizenz hat (unterstützt String UND Object Format)
    const hasLicense = (licenseId) => {
      return licenses.some(l => {
        if (!l) return false;
        if (typeof l === 'string') return l === licenseId;
        if (typeof l === 'object') {
          const id = l.name || l.id;
          if (id !== licenseId) return false;
          // Prüfe ob Lizenz noch gültig ist
          if (l.expiresAt && l.expiresAt !== 0 && l.expiresAt < Date.now()) {
            console.log(`[TRANSFER] License ${licenseId} expired (expiresAt: ${l.expiresAt})`);
            return false;
          }
          return true;
        }
        return false;
      });
    };
    
    if (hasLicense('luxus_pass')) {
      vipType = 'luxus_pass';
    } else if (hasLicense('vip_elite_plus')) {
      vipType = 'elite_plus';
    } else if (hasLicense('vip_ultimate')) {
      vipType = 'ultimate';
    } else if (hasLicense('vip_platinum')) {
      vipType = 'platinum';
    } else if (hasLicense('vip_premium')) {
      vipType = 'premium';
    }
    
    console.log('[TRANSFER API] vipType:', vipType);
    
    const VIP_DISCOUNTS = {
      'luxus_pass': 1.0,  // 100% = keine Gebühren
      'premium': 0.5,     // 50%
      'platinum': 0.75,   // 75%
      'ultimate': 0.9,    // 90%
      'elite_plus': 1.0   // 100% = keine Gebühren
    };

    if (vipType && VIP_DISCOUNTS[vipType]) {
      const discount = VIP_DISCOUNTS[vipType];
      feeRate = discount === 1.0 ? 0 : feeRate * (1 - discount);
    }

    // Gebühren-Bypass prüfen (aus Credit-Shop)
    const activeBuffs = userDataObj.activeBuffs || {};
    const gebuehrenBypassUntil = activeBuffs.gebuehrenBypassUntil || 0;
    const now = Date.now();
    
    if (gebuehrenBypassUntil > now) {
      // Gebühren-Bypass aktiv - keine Gebühren!
      feeRate = 0;
      console.log('[TRANSFER] 💸 Gebühren-Bypass aktiv! Keine Gebühren.');
    }

    const fee = Math.ceil(betrag * feeRate);
    const totalCost = betrag + fee;

    // Guthaben prüfen
    if (bankBalance < totalCost) {
      return NextResponse.json({ 
        error: 'Nicht genug Guthaben',
        details: `Du benötigst ${totalCost.toLocaleString('de-DE')}€ (Betrag: ${betrag.toLocaleString('de-DE')}€ + Gebühr: ${fee.toLocaleString('de-DE')}€). Verfügbar: ${bankBalance.toLocaleString('de-DE')}€`
      }, { status: 400 });
    }

    // Empfänger suchen
    console.log('[TRANSFER] 🔍 Suche Empfänger mit Kontonummer:', kontonummer);
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('user_data')
      .select('discord_user_id, data');

    if (allUsersError) {
      console.error('[TRANSFER] ❌ Error fetching users:', allUsersError);
      return NextResponse.json({ error: 'Fehler beim Suchen des Empfängers' }, { status: 500 });
    }

    console.log('[TRANSFER] 👥 Anzahl User in DB:', allUsers?.length || 0);

    let receiverDiscordId = null;
    for (const u of allUsers) {
      // Parse data if it's a JSON string
      const receiverDataObj = typeof u.data === 'string' 
        ? JSON.parse(u.data) 
        : (u.data || {});
      
      // Empfänger-Kontonummer aus cards - heißt 'accountNumber'!
      const receiverCard = receiverDataObj?.cards?.[0];
      const receiverAccountNum = receiverCard?.accountNumber;
      console.log('[TRANSFER] 🔎 Prüfe User:', u.discord_user_id, 'Kontonummer:', receiverAccountNum);
      
      if (receiverCard && receiverCard.accountNumber === kontonummer) {
        receiverDiscordId = u.discord_user_id;
        console.log('[TRANSFER] ✅ Empfänger gefunden:', receiverDiscordId);
        break;
      }
    }

    if (!receiverDiscordId) {
      console.log('[TRANSFER] ⚠️ FEHLER: Kein User mit Kontonummer', kontonummer, 'gefunden');
      return NextResponse.json({ 
        error: 'Empfänger nicht gefunden',
        details: `Kein Konto mit der Nummer ${kontonummer} gefunden.`
      }, { status: 404 });
    }

    // Transfer in Supabase erstellen
    const { data: transfer, error: transferError } = await supabaseAdmin
      .from('pending_transfers')
      .insert({
        sender_discord_id: userId,
        sender_account_number: senderAccountNumber,
        receiver_discord_id: receiverDiscordId,
        receiver_account_number: kontonummer,
        amount: betrag,
        fee: fee,
        total_cost: totalCost,
        sender_bank_id: bankId,
        sender_vip_status: vipType || null,
        fee_rate: feeRate,
        status: 'pending',
        initiated_from: 'website'
      })
      .select()
      .single();

    if (transferError) {
      console.error('Transfer insert error:', transferError);
      return NextResponse.json({ error: 'Fehler beim Erstellen der Überweisung' }, { status: 500 });
    }

    console.log(`[TRANSFER] Created pending transfer: ${transfer.id}`);
    console.log(`[TRANSFER] From ${senderAccountNumber} to ${kontonummer}: ${betrag}€ (Fee: ${fee}€)`);

    return NextResponse.json({ 
      success: true,
      transfer: {
        id: transfer.id,
        amount: betrag,
        fee: fee,
        total: totalCost,
        receiver: kontonummer,
        status: 'pending'
      }
    });

  } catch (e) {
    console.error('Transfer error:', e);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}





// ===================================================
// SHOP SYSTEM - Handlers
// ===================================================

// GET /api/shop/items - Alle Shop Items abrufen
async function handleGetShopItems(request) {
  try {
    return NextResponse.json({
      success: true,
      items: SHOP_ITEMS,
      creditOptions: CREDIT_PURCHASE_OPTIONS,
      bankLimitUpgrades: BANK_LIMIT_UPGRADES,
      creditSpendItems: CREDIT_SPEND_ITEMS,
      creditCrates: Object.values(CREDIT_CRATES).map(c => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        creditCost: c.creditCost,
        color: c.color,
        maxPayout: c.maxPayout,
        description: c.description
        // rewards absichtlich NICHT exponiert (Anti-Abuse / Spannung)
      }))
    });
  } catch (e) {
    console.error('Get shop items error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/shop/purchase - Item kaufen
async function handleShopPurchase(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { itemId } = await request.json();

    if (!itemId || !SHOP_ITEMS[itemId]) {
      return NextResponse.json({ error: 'Item nicht gefunden' }, { status: 400 });
    }

    const item = SHOP_ITEMS[itemId];

    // Hole User Data aus Supabase
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('user_data')
      .select('*')
      .eq('discord_user_id', user.id)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
    }

    const userDataObj = typeof userData.data === 'string' 
      ? JSON.parse(userData.data) 
      : userData.data;

    const currentBalance = userDataObj?.money?.bank || 0;

    // VIP-Status prüfen und Rabatt berechnen
    // WICHTIG: licenses ist ein ARRAY (nicht Object) – siehe ShopView.jsx
    // Supports: ['vip_premium', ...] oder [{ id/name: 'vip_premium', expiresAt }, ...]
    const userLicensesArray = Array.isArray(userDataObj?.licenses)
      ? userDataObj.licenses
      : (userDataObj?.licenses ? Object.values(userDataObj.licenses) : []);
    const now = Date.now();

    const hasLicense = (licenseId) => {
      if (!licenseId) return false;
      return userLicensesArray.some((l) => {
        if (!l) return false;
        // String-Format
        if (typeof l === 'string') return l === licenseId;
        // Object-Format: matche auf id/name + optional Ablauf prüfen
        if (typeof l === 'object') {
          const matches = l.name === licenseId || l.id === licenseId;
          if (!matches) return false;
          const expires = l.expiresAt || 0;
          // 0 = unbegrenzt, sonst muss es in der Zukunft liegen
          return expires === 0 || expires > now;
        }
        return false;
      });
    };

    console.log('[SHOP] Checking VIP licenses in array:', userLicensesArray.length, 'entries');

    // VIP-Hierarchie: Nimm den höchsten aktiven Rang
    let vipType = null;
    if (hasLicense('luxus_pass')) vipType = 'luxus_pass';
    else if (hasLicense('vip_elite_plus')) vipType = 'elite_plus';
    else if (hasLicense('vip_ultimate')) vipType = 'ultimate';
    else if (hasLicense('vip_platinum')) vipType = 'platinum';
    else if (hasLicense('vip_premium')) vipType = 'premium';

    if (vipType) console.log(`[SHOP] VIP ${vipType} erkannt`);

    // VIP-Rabatt nur für Nicht-Credit-Items und Nicht-VIP-Items
    // (VIP-Items bekommen keinen VIP-Rabatt auf sich selbst)
    let finalPrice = item.price;
    const VIP_SHOP_DISCOUNTS = {
      luxus_pass: 0.50, // 50% Luxus-Pass
      elite_plus: 0.35, // 35%
      ultimate:   0.20, // 20%
      platinum:   0.10, // 10%
      premium:    0.00  //  0% (kein Rabatt für Premium)
    };

    const isVipItem = typeof itemId === 'string' && (itemId.startsWith('vip_') || itemId === 'luxus_pass');

    // 🚀 VIP UPGRADE PRICING: Prüfe ob das ein Upgrade ist (höhere VIP-Stufe mit aktivem niedrigerem VIP)
    const vipUpgradeInfo = isVipItem ? calculateVipUpgradePrice(itemId, userLicensesArray) : null;
    const isVipUpgrade = vipUpgradeInfo?.isUpgrade || false;
    
    // VIP-Rabatt-Prozent ermitteln (nur auf Nicht-VIP-Items)
    let vipDiscountPercent = 0;
    if (vipType && VIP_SHOP_DISCOUNTS[vipType] > 0 && item.category !== 'credits' && !isVipItem) {
      vipDiscountPercent = VIP_SHOP_DISCOUNTS[vipType];
    }

    // 🎉 Promo-Rabatt: kann auch auf VIP-Items greifen (z.B. 30% VIP-Aktion für Nicht-VIPs)
    // In SHOP_PROMOTIONS ist eligibility 'non_vip' wenn userHighestVIP < 0.
    // vipType gesetzt ⇒ User hat VIP ⇒ Non-VIP-Promo fällt weg.
    const userHighestVIPForPromo = vipType ? 0 : -1;
    let promoDiscountPercent = 0;
    let activePromo = null;
    if (item.category !== 'credits') {
      activePromo = findActivePromotion(item, itemId, userHighestVIPForPromo);
      if (activePromo) promoDiscountPercent = activePromo.discount;
    }

    // 💎 WICHTIG: VIP-Upgrade hat Priorität vor allen anderen Rabatten
    let bestDiscount = 0;
    let appliedDiscountSource = null;
    let upgradeDiscountAmount = 0;
    
    if (isVipUpgrade && vipUpgradeInfo) {
      // Upgrade-Rabatt hat absolute Priorität
      finalPrice = vipUpgradeInfo.discountedPrice;
      upgradeDiscountAmount = vipUpgradeInfo.discountAmount;
      appliedDiscountSource = 'vip_upgrade';
      console.log(
        `[SHOP] 💎 VIP UPGRADE: ${vipUpgradeInfo.currentVip.name} (${vipUpgradeInfo.daysLeft} Tage) → ${item.name} | ` +
        `${item.price}€ - ${upgradeDiscountAmount}€ = ${finalPrice}€ (-${(vipUpgradeInfo.discountPercent * 100).toFixed(0)}%)`
      );
    } else {
      // Normale Rabatt-Logik: Besserer Rabatt gewinnt (VIP vs. Promo)
      bestDiscount = Math.max(vipDiscountPercent, promoDiscountPercent);
      appliedDiscountSource =
        bestDiscount === 0 ? null :
        (promoDiscountPercent > vipDiscountPercent ? 'promo' : 'vip');

      if (bestDiscount > 0) {
        finalPrice = Math.floor(item.price * (1 - bestDiscount));
        console.log(
          `[SHOP] ✅ Rabatt angewendet (${appliedDiscountSource}): ` +
          `${item.price}€ → ${finalPrice}€ (-${(bestDiscount * 100).toFixed(0)}%) ` +
          `[vip:${vipType || 'none'}, promo:${activePromo?.id || 'none'}]`
        );
      } else {
        console.log(`[SHOP] ❌ Kein Rabatt: vipType=${vipType}, category=${item.category}, isVipItem=${isVipItem}`);
      }
    }

    // Prüfe ob genug Geld vorhanden
    if (currentBalance < finalPrice) {
      return NextResponse.json({ 
        error: 'Nicht genug Guthaben',
        required: finalPrice,
        current: currentBalance
      }, { status: 400 });
    }

    // Metadata für den Kauf
    const purchaseMetadata = {};
    if (isVipUpgrade && vipUpgradeInfo) {
      purchaseMetadata.original_price = item.price;
      purchaseMetadata.vip_upgrade = true;
      purchaseMetadata.upgrade_from = vipUpgradeInfo.currentVip.vipId;
      purchaseMetadata.upgrade_from_name = vipUpgradeInfo.currentVip.name;
      purchaseMetadata.days_left = vipUpgradeInfo.daysLeft;
      purchaseMetadata.upgrade_discount_percent = vipUpgradeInfo.discountPercent;
      purchaseMetadata.upgrade_discount_amount = upgradeDiscountAmount;
      purchaseMetadata.applied_discount = 'vip_upgrade';
      purchaseMetadata.applied_discount_percent = vipUpgradeInfo.discountPercent;
    } else {
      if (vipType) {
        purchaseMetadata.original_price = item.price;
        purchaseMetadata.vip_status = vipType;
        purchaseMetadata.vip_discount = VIP_SHOP_DISCOUNTS[vipType];
      }
      if (activePromo) {
        purchaseMetadata.original_price = item.price;
        purchaseMetadata.promo_id = activePromo.id;
        purchaseMetadata.promo_discount = activePromo.discount;
      }
      if (appliedDiscountSource) {
        purchaseMetadata.applied_discount = appliedDiscountSource;
        purchaseMetadata.applied_discount_percent = bestDiscount;
      }
    }

    // Erstelle Eintrag in pending_shop_purchases
    const { data: purchase, error: insertError } = await supabaseAdmin
      .from('pending_shop_purchases')
      .insert({
        buyer_discord_id: user.id,
        item_id: itemId,
        item_name: item.name,
        item_category: item.category,
        price: finalPrice,  // Rabatt bereits angewendet
        status: 'pending',
        initiated_from: 'website',
        metadata: purchaseMetadata
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Fehler beim Erstellen des Kaufs' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: isVipUpgrade ? 'VIP-Upgrade wird verarbeitet...' : 'Kauf wird verarbeitet...',
      purchase: {
        id: purchase.id,
        item: item.name,
        price: finalPrice,
        originalPrice: (appliedDiscountSource || isVipUpgrade) ? item.price : undefined,
        isUpgrade: isVipUpgrade,
        upgradeFrom: isVipUpgrade ? vipUpgradeInfo.currentVip.name : undefined,
        upgradeDiscount: isVipUpgrade ? upgradeDiscountAmount : undefined,
        vipDiscount: appliedDiscountSource === 'vip' ? vipDiscountPercent : undefined,
        promoDiscount: appliedDiscountSource === 'promo' ? promoDiscountPercent : undefined,
        promoId: activePromo?.id,
        status: 'pending'
      }
    });

  } catch (e) {
    console.error('Shop purchase error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/shop/purchase-credits - Credits kaufen mit Geld
async function handlePurchaseCredits(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { optionIndex } = await request.json();

    if (optionIndex === undefined || !CREDIT_PURCHASE_OPTIONS[optionIndex]) {
      return NextResponse.json({ error: 'Ungültige Option' }, { status: 400 });
    }

    const option = CREDIT_PURCHASE_OPTIONS[optionIndex];

    // Hole User Data
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('user_data')
      .select('*')
      .eq('discord_user_id', user.id)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
    }

    const userDataObj = typeof userData.data === 'string' 
      ? JSON.parse(userData.data) 
      : userData.data;

    const currentBalance = userDataObj?.money?.bank || 0;

    // Prüfe Guthaben
    if (currentBalance < option.cost) {
      return NextResponse.json({ 
        error: 'Nicht genug Guthaben',
        required: option.cost,
        current: currentBalance
      }, { status: 400 });
    }

    // 🎉 Credit-Bonus prüfen: Credits-Pässe haben Vorrang vor zeitbasierten Promotions
    const userLicenses = userDataObj?.licenses || [];
    const bonusResult = findActiveCreditBonus(option.credits, -1, userLicenses);
    const finalCredits = bonusResult ? bonusResult.totalCredits : option.credits;
    const bonusCredits = bonusResult ? bonusResult.bonusCredits : 0;
    const activePromo = bonusResult?.promo || null;

    const itemName = bonusResult
      ? `${option.credits} Credits + ${bonusCredits} Bonus (${Math.round(activePromo.bonusPercent * 100)}% ${activePromo.id.includes('pass') ? 'Pass' : 'Aktion'})`
      : `${option.credits} Credits`;

    if (bonusResult) {
      console.log(
        `[SHOP] 🎁 Credit-Bonus: ${option.credits} → ${finalCredits} (+${bonusCredits}) ` +
        `[source:${activePromo.id}]`
      );
    }

    // Erstelle Special Purchase für Credits
    // item_id enthält die FINALEN Credits (inkl. Bonus) – Bot verarbeitet das direkt
    const { data: purchase, error: insertError } = await supabaseAdmin
      .from('pending_shop_purchases')
      .insert({
        buyer_discord_id: user.id,
        item_id: `credits_${finalCredits}`,
        item_name: itemName,
        item_category: 'credits',
        price: option.cost,
        status: 'pending',
        initiated_from: 'website',
        metadata: bonusResult ? {
          original_credits: option.credits,
          bonus_credits: bonusCredits,
          final_credits: finalCredits,
          promo_id: activePromo.id,
          promo_bonus_percent: activePromo.bonusPercent,
        } : {}
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Fehler beim Erstellen des Kaufs' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: bonusResult
        ? `${finalCredits} Credits werden gutgeschrieben (${option.credits} + ${bonusCredits} Bonus)!`
        : `${option.credits} Credits werden gutgeschrieben...`,
      purchase: {
        id: purchase.id,
        credits: finalCredits,
        originalCredits: bonusResult ? option.credits : undefined,
        bonusCredits: bonusResult ? bonusCredits : undefined,
        cost: option.cost,
        promoId: activePromo?.id,
        status: 'pending'
      }
    });

  } catch (e) {
    console.error('Purchase credits error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/shop/upgrade-bank-limit - Bank Limit mit Credits erhöhen
async function handleUpgradeBankLimit(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { upgradeIndex } = await request.json();

    if (upgradeIndex === undefined || !BANK_LIMIT_UPGRADES[upgradeIndex]) {
      return NextResponse.json({ error: 'Ungültige Option' }, { status: 400 });
    }

    const upgrade = BANK_LIMIT_UPGRADES[upgradeIndex];

    // Hole User Data
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('user_data')
      .select('*')
      .eq('discord_user_id', user.id)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
    }

    const userDataObj = typeof userData.data === 'string' 
      ? JSON.parse(userData.data) 
      : userData.data;

    const currentCredits = userDataObj?.credits || 0;

    // ── Credits-Pass Rabatt anwenden (5%/15%/25%/35%) ──
    const userLicensesBL = Array.isArray(userDataObj?.licenses) ? userDataObj.licenses : [];
    const creditsDiscountBL = getCreditsSpendingDiscount(userLicensesBL, new Date());
    const baseCostBL = upgrade.creditCost;
    const finalCostBL = Math.max(1, Math.ceil(baseCostBL * (1 - creditsDiscountBL)));

    // Prüfe Credits
    if (currentCredits < finalCostBL) {
      return NextResponse.json({ 
        error: 'Nicht genug Credits',
        required: finalCostBL,
        current: currentCredits
      }, { status: 400 });
    }

    // Erstelle Special Purchase für Bank Limit
    const { data: purchase, error: insertError } = await supabaseAdmin
      .from('pending_shop_purchases')
      .insert({
        buyer_discord_id: user.id,
        item_id: `bank_limit_${upgrade.addLimit}`,
        item_name: upgrade.label,
        item_category: 'bank_limit',
        price: 0, // Kosten in Credits, nicht Geld
        status: 'pending',
        initiated_from: 'website',
        metadata: { creditCost: finalCostBL, baseCreditCost: baseCostBL, creditsDiscount: creditsDiscountBL }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Fehler beim Erstellen des Upgrades' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: creditsDiscountBL > 0
        ? `Bank Limit wird um ${upgrade.addLimit.toLocaleString('de-DE')}€ erhöht... (${Math.round(creditsDiscountBL * 100)}% Credits-Pass Rabatt)`
        : `Bank Limit wird um ${upgrade.addLimit.toLocaleString('de-DE')}€ erhöht...`,
      purchase: {
        id: purchase.id,
        addLimit: upgrade.addLimit,
        creditCost: finalCostBL,
        baseCreditCost: baseCostBL,
        creditsDiscount: creditsDiscountBL,
        status: 'pending'
      }
    });

  } catch (e) {
    console.error('Upgrade bank limit error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/shop/spend-credits - Credit-Extra kaufen (Custom Kontonummer, Boosts, etc.)
// PRE-CHECKS (wie der Discord Bot): Aktive Buffs blockieren Kauf, dynamischer Preis,
// Kontonummer-Uniqueness werden VOR Credit-Abzug geprüft.
async function handleSpendCredits(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { itemId, customValue } = body || {};

    const item = CREDIT_SPEND_ITEMS.find(i => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: 'Extra nicht gefunden' }, { status: 400 });
    }

    // Hole User Data
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('user_data')
      .select('*')
      .eq('discord_user_id', user.id)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
    }

    const userDataObj = typeof userData.data === 'string' ? JSON.parse(userData.data) : userData.data;
    const currentCredits = userDataObj?.credits || 0;
    const buffs = userDataObj?.activeBuffs || {};
    const now = Date.now();

    // ── Dynamischer Preis (wie Bot: base * 1.10^purchases) ──
    const purchases = buffs?.creditPurchases?.[item.id] || 0;
    const basePrice = Math.ceil(item.creditCost * Math.pow(1.10, purchases));

    // ── Credits-Pass Rabatt anwenden (5%/15%/25%/35% via credits_*_pass) ──
    const userLicenses = Array.isArray(userDataObj?.licenses) ? userDataObj.licenses : [];
    const creditsDiscount = getCreditsSpendingDiscount(userLicenses, new Date(now));
    const dynamicPrice = Math.max(1, Math.ceil(basePrice * (1 - creditsDiscount)));

    // ── Pre-Check: Ist der Buff bereits aktiv? (= kein doppelter Kauf) ──
    const activeFlagMap = {
      double_xp:            { key: 'doubleXpUntil',        label: 'Double XP Boost' },
      collect_boost:        { key: 'collectBoostUntil',    label: 'Collect Boost' },
      gehaltsbonus:         { key: 'gehaltsbonusUntil',    label: 'Gehaltsbonus' },
      steuerbefreiung:      { key: 'steuerfreiUntil',      label: 'Steuerbefreiung' },
      premium_badge:        { key: 'premiumBadgeUntil',    label: 'Premium Badge' },
      ueberweisungs_bypass: { key: 'gebuehrenBypassUntil', label: 'Gebühren-Bypass' },
      konto_schutz:         { key: 'kontoSchutzUntil',     label: 'Konto-Schutz' },
      zinsen_boost:         { key: 'zinsenBoostUntil',     label: 'Zinsen-Boost' },
      exklusiver_titel:     { key: 'customTitleUntil',     label: 'Custom Titel' }
    };
    const af = activeFlagMap[item.id];
    if (af) {
      const until = buffs?.[af.key] || 0;
      if (until && until > now) {
        return NextResponse.json({
          error: `${af.label} ist bereits aktiv`,
          activeUntil: until,
          hoursLeft: Math.ceil((until - now) / (60 * 60 * 1000))
        }, { status: 409 });
      }
    }

    // Einmal-Flag: gehalt_multiplikator (darf nicht doppelt gekauft werden, solange nicht eingelöst)
    if (item.id === 'gehalt_multiplikator' && buffs?.gehaltMultiplikatorNext) {
      return NextResponse.json({
        error: 'Du hast bereits einen ungenutzten Gehalt-x2 – löse ihn erst mit /collect ein.'
      }, { status: 409 });
    }

    // Cooldown-Items
    if (item.id === 'custom_kontonummer') {
      const last = buffs?.lastKontonummerChange || 0;
      const cd = 48 * 60 * 60 * 1000;
      if (last && now - last < cd) {
        const left = cd - (now - last);
        return NextResponse.json({
          error: 'Kontonummer-Änderung hat noch 48h Cooldown',
          cooldownUntil: last + cd,
          hoursLeft: Math.ceil(left / (60 * 60 * 1000))
        }, { status: 409 });
      }
      // Custom Input validieren
      const nr = String(customValue || '').trim();
      if (!/^[0-9]{9}$/.test(nr)) {
        return NextResponse.json({
          error: 'Kontonummer ungültig – bitte genau 9 Ziffern angeben'
        }, { status: 400 });
      }
      // Prüfe ob es bereits die aktuelle Kontonummer ist
      const currentAccountNumber = buffs?.accountNumber || userDataObj?.bankAccount?.accountNumber;
      if (currentAccountNumber === nr) {
        return NextResponse.json({
          error: `${nr} ist bereits deine aktuelle Kontonummer`
        }, { status: 400 });
      }
      // Uniqueness-Check gegen alle anderen User
      try {
        const { data: allUsers } = await supabaseAdmin
          .from('user_data')
          .select('discord_user_id, data');
        const taken = (allUsers || []).some(u => {
          if (u.discord_user_id === user.id) return false;
          const d = typeof u.data === 'string' ? (() => { try { return JSON.parse(u.data); } catch { return {}; } })() : (u.data || {});
          // Prüfe beide mögliche Speicherorte der Kontonummer
          const existingAccountNumber = d?.activeBuffs?.accountNumber || d?.bankAccount?.accountNumber;
          return existingAccountNumber === nr;
        });
        if (taken) {
          return NextResponse.json({
            error: `Die Kontonummer ${nr} ist bereits vergeben`
          }, { status: 409 });
        }
      } catch (e) {
        console.warn('[spend-credits] Uniqueness check failed, bot will re-check:', e.message);
      }
    }

    // Bank-PIN ändern
    if (item.id === 'bank_pin_change') {
      const last = buffs?.lastPinChange || 0;
      const cd = 48 * 60 * 60 * 1000;
      if (last && now - last < cd) {
        const left = cd - (now - last);
        return NextResponse.json({
          error: 'PIN-Änderung hat noch 48h Cooldown',
          cooldownUntil: last + cd,
          hoursLeft: Math.ceil(left / (60 * 60 * 1000))
        }, { status: 409 });
      }
      // Custom Input validieren (3-stellig) - nur wenn customValue vorhanden
      if (customValue !== null && customValue !== undefined) {
        const newPin = String(customValue).trim();
        if (!/^[0-9]{3}$/.test(newPin)) {
          return NextResponse.json({
            error: 'Neue PIN ungültig – bitte genau 3 Ziffern angeben'
          }, { status: 400 });
        }
        // Prüfe ob neue PIN = alte PIN
        const currentPin = userDataObj?.bankAccount?.pin || buffs?.bankPin;
        if (currentPin === newPin) {
          return NextResponse.json({
            error: `${newPin} ist bereits deine aktuelle PIN`
          }, { status: 400 });
        }
      }
    }

    if (item.id === 'cooldown_reset') {
      const last = buffs?.lastCooldownReset || 0;
      const cd = 24 * 60 * 60 * 1000;
      if (last && now - last < cd) {
        const left = cd - (now - last);
        return NextResponse.json({
          error: 'Cooldown-Reset: nur 1x pro 24h',
          cooldownUntil: last + cd,
          hoursLeft: Math.ceil(left / (60 * 60 * 1000))
        }, { status: 409 });
      }
    }

    // Credits-Check (mit dynamischem Preis)
    if (currentCredits < dynamicPrice) {
      return NextResponse.json({
        error: 'Nicht genug Credits',
        required: dynamicPrice,
        current: currentCredits
      }, { status: 400 });
    }

    // Custom Title-Validierung
    const meta = { price: dynamicPrice, basePrice, creditsDiscount };
    if (item.id === 'custom_kontonummer') {
      meta.customKontonummer = String(customValue).trim();
    } else if (item.id === 'bank_pin_change') {
      meta.newPin = String(customValue).trim();
    } else if (item.id === 'exklusiver_titel') {
      const t = String(customValue || '').trim();
      if (t.length < 2 || t.length > 20) {
        return NextResponse.json({
          error: 'Titel muss 2–20 Zeichen lang sein'
        }, { status: 400 });
      }
      meta.customTitle = t;
    }

    // Schutzbrief-Upgrade: User muss einen haben
    if (item.id === 'schutzbrief_upgrade') {
      const sb = Object.keys(userDataObj?.licenses || {}).find(k => k.startsWith('schutzbrief_'));
      if (!sb) {
        return NextResponse.json({
          error: 'Du besitzt keinen Schutzbrief zum Upgraden'
        }, { status: 400 });
      }
      meta.targetLicense = sb;
    }

    const { data: purchase, error: insertError } = await supabaseAdmin
      .from('pending_shop_purchases')
      .insert({
        buyer_discord_id: user.id,
        item_id: `spend_${item.id}`,
        item_name: item.label,
        item_category: 'credit_spend',
        price: 0,
        status: 'pending',
        initiated_from: 'website',
        metadata: meta
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Fehler beim Erstellen des Kaufs' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: creditsDiscount > 0
        ? `${item.label} wird aktiviert... (${Math.round(creditsDiscount * 100)}% Credits-Pass Rabatt)`
        : `${item.label} wird aktiviert...`,
      purchase: {
        id: purchase.id,
        item: item.label,
        creditCost: dynamicPrice,
        basePrice,
        creditsDiscount,
        status: 'pending'
      }
    });
  } catch (e) {
    console.error('Spend credits error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/shop/open-crate - Mystery Box öffnen (Credits abgezogen, Gewinn vom Bot gerollt)
async function handleOpenCrate(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { crateId } = body || {};

    const crate = CREDIT_CRATES[crateId];
    if (!crate) {
      return NextResponse.json({ error: 'Box nicht gefunden' }, { status: 400 });
    }

    // Hole User Data
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('user_data')
      .select('*')
      .eq('discord_user_id', user.id)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
    }

    const userDataObj = typeof userData.data === 'string' ? JSON.parse(userData.data) : userData.data;
    const currentCredits = userDataObj?.credits || 0;

    // ── Credits-Pass Rabatt anwenden (5%/15%/25%/35%) ──
    const userLicensesCrate = Array.isArray(userDataObj?.licenses) ? userDataObj.licenses : [];
    const creditsDiscountCrate = getCreditsSpendingDiscount(userLicensesCrate, new Date());
    const baseCostCrate = crate.creditCost;
    const finalCostCrate = Math.max(1, Math.ceil(baseCostCrate * (1 - creditsDiscountCrate)));

    if (currentCredits < finalCostCrate) {
      return NextResponse.json({
        error: 'Nicht genug Credits',
        required: finalCostCrate,
        current: currentCredits
      }, { status: 400 });
    }

    const { data: purchase, error: insertError } = await supabaseAdmin
      .from('pending_shop_purchases')
      .insert({
        buyer_discord_id: user.id,
        item_id: `crate_${crate.id}`,
        item_name: crate.name,
        item_category: 'mystery_box',
        price: 0, // Kosten in Credits
        status: 'pending',
        initiated_from: 'website',
        metadata: { creditCost: finalCostCrate, baseCreditCost: baseCostCrate, creditsDiscount: creditsDiscountCrate }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Fehler beim Öffnen der Box' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: creditsDiscountCrate > 0
        ? `${crate.name} wird geöffnet... (${Math.round(creditsDiscountCrate * 100)}% Credits-Pass Rabatt)`
        : `${crate.name} wird geöffnet...`,
      purchase: {
        id: purchase.id,
        crate: crate.name,
        creditCost: finalCostCrate,
        baseCreditCost: baseCostCrate,
        creditsDiscount: creditsDiscountCrate,
        status: 'pending'
      }
    });
  } catch (e) {
    console.error('Open crate error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/shop/check-recipient - Prüfe Empfänger anhand Vor- und Nachname
async function handleCheckRecipient(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { firstName, lastName } = await request.json();

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Vor- und Nachname erforderlich' }, { status: 400 });
    }

    // Suche User anhand Name im character-Objekt
    const searchName = `${firstName.trim()} ${lastName.trim()}`;
    
    console.log('[CHECK RECIPIENT] Searching for:', searchName);
    
    // Hole alle User und filtere im Code (weil name in JSONB data->character->name ist)
    const { data: allUsers, error: fetchError } = await supabaseAdmin
      .from('user_data')
      .select('*');
    
    if (fetchError) {
      console.error('[CHECK RECIPIENT] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
    }
    
    // Filtere nach character.name
    const recipientData = allUsers.filter(u => {
      try {
        const userData = typeof u.data === 'string' ? JSON.parse(u.data) : u.data;
        const characterName = userData?.character?.name || '';
        const vorname = userData?.character?.vorname || '';
        const nachname = userData?.character?.nachname || '';
        
        // Prüfe verschiedene Kombinationen
        const fullName = characterName.toLowerCase();
        const searchLower = searchName.toLowerCase();
        const vornameMatch = vorname.toLowerCase() === firstName.trim().toLowerCase();
        const nachnameMatch = nachname.toLowerCase() === lastName.trim().toLowerCase();
        
        return fullName === searchLower || (vornameMatch && nachnameMatch);
      } catch (e) {
        return false;
      }
    });

    if (!recipientData || recipientData.length === 0) {
      console.log('[CHECK RECIPIENT] Not found:', searchName);
      return NextResponse.json({ error: `Empfänger "${searchName}" nicht gefunden` }, { status: 404 });
    }

    const recipient = recipientData[0];
    const recipientUserData = typeof recipient.data === 'string' ? JSON.parse(recipient.data) : recipient.data;
    
    console.log('[CHECK RECIPIENT] Found:', recipientUserData?.character?.name);

    // Prüfe ob man sich selbst prüft
    if (recipient.discord_user_id === user.id) {
      return NextResponse.json({ error: 'Du kannst dir nicht selbst etwas schenken' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      recipient: {
        id: recipient.discord_user_id,
        displayName: recipientUserData?.character?.name || 'Unbekannt',
        username: recipient.discord_username || '',
        licenses: recipientUserData?.licenses || []
      }
    });

  } catch (e) {
    console.error('[CHECK RECIPIENT ERROR]', e);
    console.error('[CHECK RECIPIENT ERROR STACK]', e.stack);
    return NextResponse.json({ error: `Server error: ${e.message}` }, { status: 500 });
  }
}

// POST /api/shop/gift - Item an anderen User verschenken
async function handleGiftItem(request) {
  try {
    console.log('[GIFT] 🎁 Gift request received');
    const user = await getUserFromRequest(request);
    if (!user) {
      console.log('[GIFT] ❌ User not authenticated');
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }
    console.log('[GIFT] ✅ User:', user.id, user.username);

    const { itemId, recipientId } = await request.json();
    console.log('[GIFT] 📦 Request data:', { itemId, recipientId });

    if (!itemId || !recipientId) {
      console.log('[GIFT] ❌ Missing data');
      return NextResponse.json({ error: 'Fehlende Daten' }, { status: 400 });
    }

    const item = SHOP_ITEMS[itemId];
    if (!item) {
      console.log('[GIFT] ❌ Item not found:', itemId);
      return NextResponse.json({ error: 'Item nicht gefunden' }, { status: 404 });
    }
    console.log('[GIFT] ✅ Item found:', item.name);

    // Hole Sender User Data
    console.log('[GIFT] 📊 Fetching sender data...');
    const { data: senderData, error: senderFetchError } = await supabaseAdmin
      .from('user_data')
      .select('*')
      .eq('discord_user_id', user.id)
      .single();

    if (senderFetchError || !senderData) {
      console.log('[GIFT] ❌ Sender not found:', senderFetchError);
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
    }
    console.log('[GIFT] ✅ Sender data found');

    const senderDataObj = typeof senderData.data === 'string'
      ? JSON.parse(senderData.data)
      : senderData.data;

    // VIP-Status & Rabatt server-seitig berechnen (Client darf den Preis NICHT vorgeben)
    const userLicensesArray = Array.isArray(senderDataObj?.licenses)
      ? senderDataObj.licenses
      : (senderDataObj?.licenses ? Object.values(senderDataObj.licenses) : []);
    const nowGift = Date.now();
    const hasLicense = (licenseId) => {
      if (!licenseId) return false;
      return userLicensesArray.some((l) => {
        if (!l) return false;
        if (typeof l === 'string') return l === licenseId;
        if (typeof l === 'object') {
          const matches = l.name === licenseId || l.id === licenseId;
          if (!matches) return false;
          const expires = l.expiresAt || 0;
          return expires === 0 || expires > nowGift;
        }
        return false;
      });
    };

    let vipType = null;
    if (hasLicense('luxus_pass')) vipType = 'luxus_pass';
    else if (hasLicense('vip_elite_plus')) vipType = 'elite_plus';
    else if (hasLicense('vip_ultimate')) vipType = 'ultimate';
    else if (hasLicense('vip_platinum')) vipType = 'platinum';
    else if (hasLicense('vip_premium')) vipType = 'premium';

    const VIP_SHOP_DISCOUNTS = {
      luxus_pass: 0.50, // 50% Luxus-Pass
      elite_plus: 0.35,
      ultimate:   0.20,
      platinum:   0.10,
      premium:    0.00
    };
    const isVipItem = typeof itemId === 'string' && (itemId.startsWith('vip_') || itemId === 'luxus_pass');
    let finalPrice = item.price;

    // VIP-Rabatt-Prozent
    let vipDiscountPercent = 0;
    if (vipType && VIP_SHOP_DISCOUNTS[vipType] > 0 && item.category !== 'credits' && !isVipItem) {
      vipDiscountPercent = VIP_SHOP_DISCOUNTS[vipType];
    }

    // 🎉 Aktions-Rabatt kann AUCH auf VIP-Items greifen (z.B. 30% VIP-Aktion für Nicht-VIPs)
    const userHighestVIPForPromo = vipType ? 0 : -1;
    let promoDiscountPercent = 0;
    let activePromo = null;
    if (item.category !== 'credits') {
      activePromo = findActivePromotion(item, itemId, userHighestVIPForPromo);
      if (activePromo) promoDiscountPercent = activePromo.discount;
    }

    // Besserer Rabatt gewinnt
    const bestDiscount = Math.max(vipDiscountPercent, promoDiscountPercent);
    const appliedDiscountSource =
      bestDiscount === 0 ? null :
      (promoDiscountPercent > vipDiscountPercent ? 'promo' : 'vip');

    if (bestDiscount > 0) {
      finalPrice = Math.floor(item.price * (1 - bestDiscount));
      console.log(
        `[GIFT] ✅ Rabatt (${appliedDiscountSource}): ${item.price}€ → ${finalPrice}€ ` +
        `(-${(bestDiscount * 100).toFixed(0)}%) [vip:${vipType || 'none'}, promo:${activePromo?.id || 'none'}]`
      );
    }
    const price = finalPrice;

    const senderBalance = senderDataObj?.money?.bank || 0;
    console.log('[GIFT] 💰 Sender balance:', senderBalance, 'Required:', price);

    // Prüfe Guthaben
    if (senderBalance < price) {
      console.log('[GIFT] ❌ Insufficient funds');
      return NextResponse.json({
        error: 'Nicht genug Guthaben',
        required: price,
        current: senderBalance
      }, { status: 400 });
    }

    // Hole Empfänger-Daten
    console.log('[GIFT] 👤 Fetching recipient data...');
    const { data: recipientData, error: recipientFetchError } = await supabaseAdmin
      .from('user_data')
      .select('*')
      .eq('discord_user_id', recipientId)
      .single();

    if (recipientFetchError || !recipientData) {
      console.log('[GIFT] ❌ Recipient not found:', recipientFetchError);
      return NextResponse.json({ error: 'Empfänger nicht gefunden' }, { status: 404 });
    }
    console.log('[GIFT] ✅ Recipient data found');

    // Prüfe ob man sich selbst etwas schenken will
    if (recipientId === user.id) {
      console.log('[GIFT] ❌ Cannot gift to self');
      return NextResponse.json({ error: 'Du kannst dir nicht selbst etwas schenken' }, { status: 400 });
    }

    // Erstelle Geschenk-Kauf
    console.log('[GIFT] 💾 Inserting gift purchase...');
    const { data: purchase, error: insertError } = await supabaseAdmin
      .from('pending_shop_purchases')
      .insert({
        buyer_discord_id: user.id,
        recipient_discord_id: recipientId,
        item_id: itemId,
        item_name: item.name,
        item_category: item.category,
        price: price,
        status: 'pending',
        initiated_from: 'website',
        is_gift: true,
        metadata: {
          originalPrice: item.price,
          vipType,
          discount: item.price - price,
          applied_discount: appliedDiscountSource,
          applied_discount_percent: bestDiscount,
          promo_id: activePromo?.id || null,
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('[GIFT] ❌ Insert error:', insertError);
      return NextResponse.json({ error: 'Fehler beim Erstellen des Geschenks', details: insertError.message }, { status: 500 });
    }

    console.log('[GIFT] ✅ Gift purchase created:', purchase.id);
    return NextResponse.json({
      success: true,
      message: `${item.name} wird an ${recipientData.discord_display_name} verschenkt...`,
      purchase: {
        id: purchase.id,
        itemName: item.name,
        recipient: recipientData.discord_display_name,
        price: price,
        status: 'pending'
      }
    });

  } catch (e) {
    console.error('[GIFT] ❌ Gift item error:', e);
    console.error('[GIFT] Stack:', e.stack);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}

// =============================================================
// ===== LICENSE MANAGEMENT (Auto-Renew / Cancel) =========
// =============================================================
// POST /api/licenses/action - User verwaltet eigene Lizenzen
// Body: { licenseId: string, action: 'enable_autorenew' | 'disable_autorenew' | 'cancel' }
// Speichert Aktion in pending_shop_purchases mit is_license_action=true.
// Discord Bot (shop-processor) holt diese Aktionen ab und aktualisiert userData.
async function handleLicenseAction(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { licenseId, action } = await request.json();
    const ALLOWED = ['enable_autorenew', 'disable_autorenew', 'cancel', 'expire'];
    if (!licenseId || !ALLOWED.includes(action)) {
      return NextResponse.json({ error: 'Ungültige Parameter' }, { status: 400 });
    }

    console.log(`[LICENSE-ACTION] User ${user.id} → ${action} on "${licenseId}"`);

    // Hole aktuelle User-Daten (prüfe ob Lizenz wirklich existiert)
    const { data: userRow, error: userErr } = await supabaseAdmin
      .from('user_data')
      .select('*')
      .eq('discord_user_id', user.id)
      .single();

    if (userErr || !userRow) {
      return NextResponse.json({ error: 'Userdaten nicht gefunden' }, { status: 404 });
    }

    const dataObj = typeof userRow.data === 'string' ? JSON.parse(userRow.data) : userRow.data;
    const licensesArr = Array.isArray(dataObj?.licenses) ? dataObj.licenses : [];

    // Prüfe ob Lizenz existiert
    const hasLicense = licensesArr.some((l) => {
      if (!l) return false;
      if (typeof l === 'string') return l === licenseId;
      if (typeof l === 'object') return (l.name === licenseId || l.id === licenseId);
      return false;
    });

    if (!hasLicense) {
      return NextResponse.json({ error: 'Lizenz nicht gefunden' }, { status: 404 });
    }

    // Schreibe Action in pending_shop_purchases → der Bot verarbeitet es
    const { data: purchase, error: insertErr } = await supabaseAdmin
      .from('pending_shop_purchases')
      .insert({
        buyer_discord_id: user.id,
        recipient_discord_id: user.id, // Eigene Aktion
        item_id: licenseId,
        item_name: `License Action: ${action}`,
        item_category: 'license_management',
        price: 0,
        status: 'pending',
        initiated_from: 'website',
        is_gift: false,
        metadata: {
          license_action: action,
          license_id: licenseId,
          triggered_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[LICENSE-ACTION] ❌ Insert error:', insertErr);
      return NextResponse.json({ error: 'Fehler beim Speichern', details: insertErr.message }, { status: 500 });
    }

    console.log(`[LICENSE-ACTION] ✅ Queued: purchase_id=${purchase.id}`);
    return NextResponse.json({
      success: true,
      action,
      licenseId,
      queuedId: purchase.id,
      message: 'Aktion wurde gespeichert und wird vom Discord Bot verarbeitet.'
    });

  } catch (e) {
    console.error('[LICENSE-ACTION] ❌ Error:', e);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}

// =============================================================
// ===== KREDIT-VERWALTUNG (Rückzahlung / Verlängerung) =====
// =============================================================

// Kredit-Config (Spiegel des Bot-Configs)
const KREDIT_EXTENSION_OPTIONS = {
  2: 0.05,  // 2 Tage = 5% Gebühr
  4: 0.06,  // 4 Tage = 6%
  6: 0.08,  // 6 Tage = 8%
  8: 0.10   // 8 Tage = 10%
};

// POST /api/credits/repay - Kredit frühzeitig zurückzahlen
// Body: { kreditId }
// Erstellt pending_shop_purchases-Eintrag, Bot verarbeitet tatsächliche Abbuchung.
async function handleCreditRepay(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

    const body = await request.json();
    const { kreditId } = body || {};
    if (!kreditId) {
      return NextResponse.json({ error: 'kreditId fehlt' }, { status: 400 });
    }

    // Kredit aus user_data laden
    const { data: userRow } = await supabaseAdmin
      .from('user_data')
      .select('data')
      .eq('discord_user_id', user.id)
      .single();

    const kredite = userRow?.data?.kredite || [];
    const kredit = kredite.find(k => k.kreditId === kreditId);

    if (!kredit) {
      return NextResponse.json({ error: 'Kredit nicht gefunden' }, { status: 404 });
    }
    if (kredit.status !== 'aktiv') {
      return NextResponse.json({ error: 'Kredit ist nicht aktiv' }, { status: 400 });
    }

    // Duplikat-Check: gibt es schon eine pending Rückzahlung für diesen Kredit?
    const { data: existingRepay } = await supabaseAdmin
      .from('pending_shop_purchases')
      .select('id')
      .eq('buyer_discord_id', user.id)
      .eq('item_category', 'credit_repayment')
      .eq('item_id', kreditId)
      .in('status', ['pending', 'processing'])
      .limit(1);

    if (existingRepay && existingRepay.length > 0) {
      return NextResponse.json({ error: 'Rückzahlung für diesen Kredit läuft bereits' }, { status: 409 });
    }

    // Pending-Eintrag erstellen
    const { data: insertData, error: insertErr } = await supabaseAdmin
      .from('pending_shop_purchases')
      .insert({
        buyer_discord_id: user.id,
        recipient_discord_id: user.id,
        item_id: kreditId,
        item_name: `Kredit-Rückzahlung: ${kredit.name || kreditId}`,
        item_category: 'credit_repayment',
        price: kredit.rueckzahlungsBetrag || 0,
        status: 'pending',
        initiated_from: 'website',
        is_gift: false,
        metadata: {
          kredit_id: kreditId,
          action: 'repay',
          rueckzahlungs_betrag: kredit.rueckzahlungsBetrag || 0,
          kredit_name: kredit.name || null,
          triggered_at: new Date().toISOString()
        }
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('[CREDIT-REPAY] ❌ Insert error:', insertErr);
      return NextResponse.json({ error: 'Konnte nicht anlegen', details: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      queuedId: insertData.id,
      kreditId,
      action: 'repay',
      message: 'Rückzahlung wird vom Discord-Bot gleich verarbeitet.'
    });
  } catch (e) {
    console.error('[CREDIT-REPAY] ❌ Error:', e);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}

// POST /api/credits/extend - Kredit um X Tage verlängern
// Body: { kreditId, days: 2|4|6|8 }
async function handleCreditExtend(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

    const body = await request.json();
    const { kreditId, days } = body || {};
    if (!kreditId) {
      return NextResponse.json({ error: 'kreditId fehlt' }, { status: 400 });
    }

    const daysInt = parseInt(days);
    if (!KREDIT_EXTENSION_OPTIONS[daysInt]) {
      return NextResponse.json({
        error: 'Ungültige Verlängerungsdauer',
        allowed: Object.keys(KREDIT_EXTENSION_OPTIONS).map(Number)
      }, { status: 400 });
    }

    // Kredit laden
    const { data: userRow } = await supabaseAdmin
      .from('user_data')
      .select('data')
      .eq('discord_user_id', user.id)
      .single();

    const kredite = userRow?.data?.kredite || [];
    const kredit = kredite.find(k => k.kreditId === kreditId);

    if (!kredit) return NextResponse.json({ error: 'Kredit nicht gefunden' }, { status: 404 });
    if (kredit.status !== 'aktiv') return NextResponse.json({ error: 'Kredit ist nicht aktiv' }, { status: 400 });
    if (kredit.verlaengert) {
      return NextResponse.json({ error: 'Kredit wurde bereits einmal verlängert' }, { status: 400 });
    }

    const gebuehrProzent = KREDIT_EXTENSION_OPTIONS[daysInt];
    const verlaengerungsGebuehr = Math.ceil((kredit.rueckzahlungsBetrag || 0) * gebuehrProzent);

    // Duplikat-Check
    const { data: existingExt } = await supabaseAdmin
      .from('pending_shop_purchases')
      .select('id')
      .eq('buyer_discord_id', user.id)
      .eq('item_category', 'credit_extension')
      .eq('item_id', kreditId)
      .in('status', ['pending', 'processing'])
      .limit(1);

    if (existingExt && existingExt.length > 0) {
      return NextResponse.json({ error: 'Verlängerung für diesen Kredit läuft bereits' }, { status: 409 });
    }

    const { data: insertData, error: insertErr } = await supabaseAdmin
      .from('pending_shop_purchases')
      .insert({
        buyer_discord_id: user.id,
        recipient_discord_id: user.id,
        item_id: kreditId,
        item_name: `Kredit-Verlängerung +${daysInt} Tage: ${kredit.name || kreditId}`,
        item_category: 'credit_extension',
        price: verlaengerungsGebuehr,
        status: 'pending',
        initiated_from: 'website',
        is_gift: false,
        metadata: {
          kredit_id: kreditId,
          action: 'extend',
          days: daysInt,
          gebuehr_prozent: gebuehrProzent,
          verlaengerungs_gebuehr: verlaengerungsGebuehr,
          kredit_name: kredit.name || null,
          triggered_at: new Date().toISOString()
        }
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('[CREDIT-EXTEND] ❌ Insert error:', insertErr);
      return NextResponse.json({ error: 'Konnte nicht anlegen', details: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      queuedId: insertData.id,
      kreditId,
      action: 'extend',
      days: daysInt,
      gebuehr: verlaengerungsGebuehr,
      message: `Verlängerung um ${daysInt} Tage wird vom Discord-Bot gleich verarbeitet.`
    });
  } catch (e) {
    console.error('[CREDIT-EXTEND] ❌ Error:', e);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}

// GET /api/credits/pending - Holt pending Credit-Aktionen (Repay/Extend) des Users
// Wird vom Frontend gepollt, um zu sehen ob Bot schon verarbeitet hat
async function handleGetPendingCreditActions(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('pending_shop_purchases')
      .select('id, item_id, item_name, item_category, price, status, metadata, created_at')
      .eq('buyer_discord_id', user.id)
      .in('item_category', ['credit_repayment', 'credit_extension'])
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CREDITS-PENDING] ❌ Fetch error:', error);
      return NextResponse.json({ error: 'DB error', details: error.message }, { status: 500 });
    }

    const pending = (data || []).map(row => ({
      queuedId: row.id,
      kreditId: row.item_id,
      action: row.metadata?.action || (row.item_category === 'credit_repayment' ? 'repay' : 'extend'),
      category: row.item_category,
      name: row.item_name,
      price: row.price,
      days: row.metadata?.days || null,
      status: row.status,
      queuedAt: row.created_at
    }));

    return NextResponse.json({ pending });
  } catch (e) {
    console.error('[CREDITS-PENDING] ❌ Error:', e);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}

// GET /api/licenses/pending-actions - Holt noch nicht verarbeitete License-Actions des Users
// Nutzung: Das Frontend pollt diese Route, um zu sehen, ob der Bot eine Action schon verarbeitet hat.

// ══════════════════════════════════════════════════════════════════════════
// CHARACTER MANAGEMENT: Bearbeiten & Löschen mit Antrag-System
// ══════════════════════════════════════════════════════════════════════════

// POST /api/character/edit-request - Antrag zum Bearbeiten des Charakters
async function handleCharacterEditRequest(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

    const body = await request.json();
    const { vorname, nachname, herkunft, geschlecht, grund } = body || {};

    // Validierung
    if (!grund || (!vorname && !nachname && !herkunft && !geschlecht)) {
      return NextResponse.json({ 
        error: 'Bitte fülle mindestens ein Feld aus und gib eine Begründung an' 
      }, { status: 400 });
    }

    // Hole aktuelle Charakterdaten
    const { data: userRow } = await supabaseAdmin
      .from('user_data')
      .select('data')
      .eq('discord_user_id', user.id)
      .single();

    const currentData = userRow?.data || {};
    
    // Erstelle Request ID wie im Bot
    const requestId = `EDIT-${Date.now().toString(36).toUpperCase()}`;
    
    // Speichere in Supabase (Bridge zwischen Website und Bot)
    const { data: insertData, error: insertErr } = await supabaseAdmin
      .from('pending_shop_purchases')
      .insert({
        buyer_discord_id: user.id,
        recipient_discord_id: user.id,
        item_id: requestId,
        item_name: 'Charakter-Bearbeitung',
        item_category: 'character_edit',
        price: 0,
        status: 'pending',
        metadata: {
          source: 'web',
          currentChar: {
            name: currentData.characterName || 'Unbekannt',
            vorname: currentData.characterName?.split(' ')[0] || '',
            nachname: currentData.characterName?.split(' ').slice(1).join(' ') || '',
            herkunft: currentData.origin || 'Unbekannt',
            geschlecht: currentData.gender || 'Unbekannt'
          },
          newVorname: vorname || null,
          newNachname: nachname || null,
          newHerkunft: herkunft || null,
          newGeschlecht: geschlecht || null,
          grund,
          createdAt: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    console.log(`[CHAR-EDIT-REQUEST] ✅ Antrag ${requestId} für User ${user.id} in Supabase erstellt`);

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Antrag wurde erstellt. Ein Admin wird ihn im Discord prüfen.'
    });
  } catch (e) {
    console.error('[CHAR-EDIT-REQUEST] ❌ Error:', e);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}

// POST /api/character/delete-request - Antrag zum Löschen des Charakters
async function handleCharacterDeleteRequest(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

    const body = await request.json();
    const { confirmText, reason } = body || {};

    // Sicherheits-Bestätigung
    if (confirmText !== 'LÖSCHEN') {
      return NextResponse.json({ 
        error: 'Bestätigung fehlerhaft. Bitte tippe "LÖSCHEN" ein.' 
      }, { status: 400 });
    }

    // Hole Charakterdaten für Backup
    const { data: userRow } = await supabaseAdmin
      .from('user_data')
      .select('data')
      .eq('discord_user_id', user.id)
      .single();

    const userData = userRow?.data || {};
    const requestId = `DELETE-${Date.now().toString(36).toUpperCase()}`;

    // Erstelle Lösch-Antrag in Supabase
    const { data: insertData, error: insertErr } = await supabaseAdmin
      .from('pending_shop_purchases')
      .insert({
        buyer_discord_id: user.id,
        recipient_discord_id: user.id,
        item_id: requestId,
        item_name: 'Charakter-Löschung',
        item_category: 'character_delete',
        price: 0,
        status: 'pending',
        metadata: {
          source: 'web',
          character_backup: {
            characterName: userData.characterName,
            origin: userData.origin,
            gender: userData.gender,
            birthPlace: userData.birthPlace,
            money: userData.money,
            credits: userData.credits
          },
          reason: reason || 'Keine Begründung angegeben',
          requested_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    console.log(`[CHAR-DELETE-REQUEST] ⚠️ Lösch-Antrag ${requestId} für User ${user.id} erstellt`);

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Lösch-Antrag wurde erstellt. Ein Admin wird deinen Antrag prüfen. ACHTUNG: Bei Genehmigung werden ALLE Daten gelöscht!'
    });
  } catch (e) {
    console.error('[CHAR-DELETE-REQUEST] ❌ Error:', e);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}


// GET /api/character/pending - Holt pending Character-Änderungen aus Supabase
async function handleGetPendingCharacterActions(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('pending_shop_purchases')
      .select('id, item_id, item_name, item_category, status, metadata, created_at')
      .eq('buyer_discord_id', user.id)
      .in('item_category', ['character_edit', 'character_delete'])
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CHAR-PENDING] ❌ Fetch error:', error);
      return NextResponse.json({ error: 'DB error', details: error.message }, { status: 500 });
    }

    const pending = (data || []).map(row => ({
      requestId: row.item_id,
      type: row.item_category === 'character_edit' ? 'edit' : 'delete',
      status: row.status,
      metadata: row.metadata,
      requestedAt: row.created_at
    }));

    return NextResponse.json({ pending });
  } catch (e) {
    console.error('[CHAR-PENDING] ❌ Error:', e);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}

// Sobald ein Eintrag fehlt (= vom Bot gelöscht), gilt die Action als abgeschlossen.
async function handleGetPendingLicenseActions(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('pending_shop_purchases')
      .select('id, item_id, status, metadata, created_at')
      .eq('buyer_discord_id', user.id)
      .eq('item_category', 'license_management')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[LICENSE-PENDING] ❌ Fetch error:', error);
      return NextResponse.json({ error: 'DB error', details: error.message }, { status: 500 });
    }

    const pending = (data || []).map(row => ({
      queuedId: row.id,
      licenseId: row.metadata?.license_id || row.item_id,
      action: row.metadata?.license_action || null,
      status: row.status,
      queuedAt: row.created_at
    })).filter(p => p.action);

    return NextResponse.json({ pending });
  } catch (e) {
    console.error('[LICENSE-PENDING] ❌ Error:', e);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}

// GET /api/shop/pending-purchases - Holt noch nicht verarbeitete Shop-Käufe des Users
// Nutzung: Shop-View sperrt Karten, die aktuell vom Bot verarbeitet werden.
async function handleGetPendingShopPurchases(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    // Alle Pending-Einträge des Users, aber OHNE license_management (das hat eigenen Endpoint)
    const { data, error } = await supabaseAdmin
      .from('pending_shop_purchases')
      .select('id, item_id, item_name, item_category, status, is_gift, recipient_discord_id, metadata, created_at')
      .eq('buyer_discord_id', user.id)
      .neq('item_category', 'license_management')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[SHOP-PENDING] ❌ Fetch error:', error);
      return NextResponse.json({ error: 'DB error', details: error.message }, { status: 500 });
    }

    const pending = (data || []).map(row => ({
      queuedId: row.id,
      itemId: row.item_id,
      itemName: row.item_name,
      category: row.item_category,
      status: row.status,
      isGift: row.is_gift === true,
      recipientId: row.recipient_discord_id,
      queuedAt: row.created_at
    }));

    return NextResponse.json({ pending });
  } catch (e) {
    console.error('[SHOP-PENDING] ❌ Error:', e);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}

// GET /api/transfer/pending - Holt noch nicht verarbeitete Überweisungen des Users
// Der Bot löscht den Eintrag aus pending_transfers nach Abarbeitung.
async function handleGetPendingTransfers(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('pending_transfers')
      .select('id, sender_account_number, receiver_account_number, amount, fee, total_cost, status, created_at')
      .eq('sender_discord_id', user.id)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[TRANSFER-PENDING] ❌ Fetch error:', error);
      return NextResponse.json({ error: 'DB error', details: error.message }, { status: 500 });
    }

    const pending = (data || []).map(row => ({
      queuedId: row.id,
      senderAccount: row.sender_account_number,
      receiverAccount: row.receiver_account_number,
      amount: row.amount,
      fee: row.fee,
      totalCost: row.total_cost,
      status: row.status,
      queuedAt: row.created_at
    }));

    return NextResponse.json({ pending });
  } catch (e) {
    console.error('[TRANSFER-PENDING] ❌ Error:', e);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}

// =============================================================
// ===== HAMBURG HORIZON - Bot-Features auf der Webseite =====
// =============================================================
// Lesen aus der Supabase user_data-Tabelle (vom Bot befüllt)
// Alles read-only – Schreibaktionen laufen weiterhin über den Bot

// Helper: Lade alle user_data aus Supabase (mit Cache)
let _hhCache = { data: null, ts: 0 };
async function _loadAllUserData(forceRefresh = false) {
  const now = Date.now();
  // 30 Sekunden Cache
  if (!forceRefresh && _hhCache.data && (now - _hhCache.ts) < 30000) {
    return _hhCache.data;
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('user_data')
      .select('discord_user_id, data, last_sync');
    if (error) {
      console.error('[HH] Load all user_data error:', error);
      return [];
    }
    // Parse data wenn string
    const parsed = (data || []).map(row => {
      let d = row.data;
      if (typeof d === 'string') {
        try { d = JSON.parse(d); } catch { d = {}; }
      }
      return {
        discord_user_id: row.discord_user_id,
        data: d || {},
        last_sync: row.last_sync
      };
    });
    _hhCache = { data: parsed, ts: now };
    return parsed;
  } catch (e) {
    console.error('[HH] Load error:', e);
    return [];
  }
}

// Discord Member Cache - für Avatare & Usernames (gilt für ganze Guild)
let _hhMembersCache = { map: null, ts: 0 };
async function _loadDiscordMembers(forceRefresh = false) {
  const now = Date.now();
  // 5 Minuten Cache
  if (!forceRefresh && _hhMembersCache.map && (now - _hhMembersCache.ts) < 300000) {
    return _hhMembersCache.map;
  }
  try {
    const allMembers = {};
    let after = '0';
    let fetched = 0;
    // Paginate bis alle Member geholt sind (max 10 Pages = 10.000 Member, safety)
    for (let i = 0; i < 10; i++) {
      const res = await fetch(
        `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members?limit=1000&after=${after}`,
        { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
      );
      if (!res.ok) {
        console.error('[HH] Discord members fetch failed:', res.status);
        break;
      }
      const members = await res.json();
      if (!Array.isArray(members) || members.length === 0) break;

      for (const m of members) {
        if (!m.user?.id) continue;
        const uid = m.user.id;
        allMembers[uid] = {
          id: uid,
          username: m.user.global_name || m.user.username,
          discordUsername: m.user.username,
          avatar: m.user.avatar
            ? `https://cdn.discordapp.com/avatars/${uid}/${m.user.avatar}${m.user.avatar.startsWith('a_') ? '.gif' : '.png'}?size=128`
            : `https://cdn.discordapp.com/embed/avatars/${(parseInt(uid) >> 22) % 6}.png`,
          nick: m.nick || null,
        };
        fetched++;
      }
      after = members[members.length - 1].user.id;
      if (members.length < 1000) break; // Letzte Page
    }
    console.log(`[HH] Cached ${fetched} Discord members`);
    _hhMembersCache = { map: allMembers, ts: now };
    return allMembers;
  } catch (e) {
    console.error('[HH] Load Discord members error:', e);
    return _hhMembersCache.map || {};
  }
}

// XP-Tabelle wie im Discord Bot (src/index.js):
//   LEVEL_CONFIG.getXpForLevel: (level) => level * 100
// XP, die benötigt werden um vom aktuellen Level auf das nächste zu kommen.
function _xpForLevel(level) {
  // Discord-Bot-Formel: xp_needed = current_level * 100
  // (z.B. Level 14 -> Level 15 benötigt 14 * 100 = 1400 XP)
  const lvl = Math.max(1, parseInt(level) || 1);
  return lvl * 100;
}
function _progressToNextLevel(level, xp) {
  // xp = XP innerhalb des aktuellen Levels (wie im Bot: levels[userId].xp)
  const needed = _xpForLevel(level);
  const safeXp = Math.max(0, parseInt(xp) || 0);
  const pct = needed > 0
    ? Math.min(100, Math.max(0, Math.floor((safeXp / needed) * 100)))
    : 0;
  return { needed, pct };
}

// GET /api/hh/leaderboard?limit=50
async function handleHHLeaderboard(request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

    const [all, members] = await Promise.all([
      _loadAllUserData(),
      _loadDiscordMembers()
    ]);
    const entries = all
      .map(row => {
        const s = row.data?.stats || {};
        const c = row.data?.character || {};
        const m = members[row.discord_user_id] || null;
        return {
          discord_user_id: row.discord_user_id,
          level: s.level || 1,
          xp: s.xp || 0,
          totalXp: s.totalXp || 0,
          messages: s.messages || 0,
          username: s.username || m?.username || null,
          avatar: m?.avatar || null,
          displayName: m?.nick || m?.username || null,
          character: {
            name: c.name || (c.vorname && c.nachname ? `${c.vorname} ${c.nachname}` : null),
            vorname: c.vorname || null,
            nachname: c.nachname || null,
            faction: c.faction || null,
            job: c.job || null,
          }
        };
      })
      .filter(e => (e.level > 0 || e.xp > 0 || e.totalXp > 0))
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
        return b.xp - a.xp;
      });

    // Rang setzen
    entries.forEach((e, i) => { e.rank = i + 1; });

    // Eigenen Rang finden
    const currentUser = getUserFromRequest(request);
    let myEntry = null;
    if (currentUser) {
      myEntry = entries.find(e => e.discord_user_id === currentUser.id) || null;
    }

    return NextResponse.json({
      success: true,
      total: entries.length,
      leaderboard: entries.slice(0, limit),
      me: myEntry
    });
  } catch (e) {
    console.error('[HH] Leaderboard error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET /api/hh/my-level  – Level-Details + Rang für eingeloggten User
async function handleHHMyLevel(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

    const all = await _loadAllUserData();
    const sorted = all
      .map(row => ({
        id: row.discord_user_id,
        level: row.data?.stats?.level || 1,
        xp: row.data?.stats?.xp || 0,
      }))
      .sort((a, b) => (b.level !== a.level ? b.level - a.level : b.xp - a.xp));

    const idx = sorted.findIndex(s => s.id === user.id);
    const rank = idx >= 0 ? idx + 1 : null;

    const mine = all.find(r => r.discord_user_id === user.id);
    const stats = mine?.data?.stats || { level: 1, xp: 0, messages: 0 };
    const prog = _progressToNextLevel(stats.level || 1, stats.xp || 0);

    return NextResponse.json({
      success: true,
      level: stats.level || 1,
      xp: stats.xp || 0,
      messages: stats.messages || 0,
      rank,
      totalUsers: sorted.length,
      xpNeeded: prog.needed,
      progressPct: prog.pct
    });
  } catch (e) {
    console.error('[HH] MyLevel error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET /api/hh/marketplace?search=&page=1&pageSize=24
async function handleHHMarketplace(request) {
  try {
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') || '').toLowerCase().trim();
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const pageSize = Math.min(100, parseInt(url.searchParams.get('pageSize') || '24'));

    const [all, members] = await Promise.all([
      _loadAllUserData(),
      _loadDiscordMembers()
    ]);

    // Alle aktiven Listings aus allen Usern zusammenführen
    const listings = [];
    for (const row of all) {
      const userListings = row.data?.marketplace || [];
      if (!Array.isArray(userListings)) continue;
      const char = row.data?.character || {};
      const m = members[row.discord_user_id] || null;
      const sellerName = char.name || (char.vorname && char.nachname
        ? `${char.vorname} ${char.nachname}` : null);

      for (const l of userListings) {
        if (!l || l.status !== 'active') continue;
        // Abgelaufene Listings überspringen
        if (l.expiresAt && new Date(l.expiresAt).getTime() < Date.now()) continue;
        listings.push({
          id: l.id,
          itemId: l.itemId,
          itemName: l.itemName,
          itemEmoji: l.itemEmoji,
          price: l.price,
          allowOffers: l.allowOffers,
          createdAt: l.createdAt,
          expiresAt: l.expiresAt,
          seller: {
            discord_user_id: row.discord_user_id,
            characterName: sellerName,
            discordUsername: m?.username || null,
            avatar: m?.avatar || null,
          }
        });
      }
    }

    // Search-Filter
    const filtered = search
      ? listings.filter(l =>
          (l.itemName || '').toLowerCase().includes(search) ||
          (l.seller.characterName || '').toLowerCase().includes(search) ||
          (l.seller.discordUsername || '').toLowerCase().includes(search))
      : listings;

    // Sortieren nach createdAt DESC
    filtered.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return NextResponse.json({
      success: true,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      listings: paged
    });
  } catch (e) {
    console.error('[HH] Marketplace error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET /api/hh/character/:userId – öffentliches Charakterprofil
async function handleHHCharacter(request, userId) {
  try {
    if (!userId) return NextResponse.json({ error: 'userId fehlt' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('user_data')
      .select('discord_user_id, data, last_sync')
      .eq('discord_user_id', userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Charakter nicht gefunden' }, { status: 404 });
    }
    let parsed = data.data;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { parsed = {}; }
    }

    const c = parsed?.character || null;
    if (!c) return NextResponse.json({ error: 'Kein Charakter erstellt' }, { status: 404 });

    const s = parsed?.stats || {};
    // Discord-Info laden
    const members = await _loadDiscordMembers();
    const m = members[userId] || null;

    // Anzahl Listings des Users als öffentliche Info
    const listings = (parsed?.marketplace || []).filter(l => l?.status === 'active').length;
    const licenses = (parsed?.licenses || []).filter(l => l && !(l.name || '').startsWith('credits_'));

    return NextResponse.json({
      success: true,
      character: {
        name: c.name || (c.vorname && c.nachname ? `${c.vorname} ${c.nachname}` : null),
        vorname: c.vorname || null,
        nachname: c.nachname || null,
        age: c.age || c.alter || null,
        herkunft: c.herkunft || null,
        geschlecht: c.geschlecht || null,
        job: c.job || null,
        faction: c.faction || null,
      },
      discord: m ? {
        username: m.username,
        discordUsername: m.discordUsername,
        avatar: m.avatar,
        nick: m.nick,
      } : null,
      stats: {
        level: s.level || 1,
        xp: s.xp || 0,
        totalXp: s.totalXp || 0,
        messages: s.messages || 0,
      },
      activeListings: listings,
      licensesCount: licenses.length,
      discord_user_id: data.discord_user_id,
      last_sync: data.last_sync
    });
  } catch (e) {
    console.error('[HH] Character error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET /api/hh/character-search?q=Name
async function handleHHCharacterSearch(request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').toLowerCase().trim();
    if (q.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const [all, members] = await Promise.all([
      _loadAllUserData(),
      _loadDiscordMembers()
    ]);
    const results = [];
    for (const row of all) {
      const c = row.data?.character;
      const m = members[row.discord_user_id] || null;
      // Matching auf Char-Name UND Discord-Username
      const charName = c ? (c.name || (c.vorname && c.nachname ? `${c.vorname} ${c.nachname}` : '') || '').toLowerCase() : '';
      const charVn = (c?.vorname || '').toLowerCase();
      const charNn = (c?.nachname || '').toLowerCase();
      const discUser = (m?.username || '').toLowerCase();
      const discReal = (m?.discordUsername || '').toLowerCase();

      if (!c && !m) continue;
      if (charName.includes(q) || charVn.includes(q) || charNn.includes(q)
          || discUser.includes(q) || discReal.includes(q)) {
        if (!c) continue; // Nur mit Charakter zeigen
        results.push({
          discord_user_id: row.discord_user_id,
          name: c.name || `${c.vorname || ''} ${c.nachname || ''}`.trim(),
          faction: c.faction || null,
          job: c.job || null,
          level: row.data?.stats?.level || 1,
          avatar: m?.avatar || null,
          discordUsername: m?.username || null,
        });
      }
      if (results.length >= 25) break;
    }

    return NextResponse.json({ success: true, results });
  } catch (e) {
    console.error('[HH] Character search error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET /api/hh/my-profile – Zentrale Statistik-Seite
async function handleHHMyProfile(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('user_data')
      .select('discord_user_id, data, last_sync')
      .eq('discord_user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[HH] MyProfile DB error:', error);
      return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
    }

    let parsed = data?.data || {};
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { parsed = {}; }
    }

    const stats = parsed.stats || { level: 1, xp: 0, messages: 0 };
    const money = parsed.money || { cash: 0, bank: 0, savings: 0 };
    const prog = _progressToNextLevel(stats.level || 1, stats.xp || 0);

    // Rang im Leaderboard
    const all = await _loadAllUserData();
    const sorted = all
      .map(r => ({ id: r.discord_user_id, lvl: r.data?.stats?.level || 1, xp: r.data?.stats?.xp || 0 }))
      .sort((a, b) => (b.lvl !== a.lvl ? b.lvl - a.lvl : b.xp - a.xp));
    const idx = sorted.findIndex(s => s.id === user.id);
    const rank = idx >= 0 ? idx + 1 : null;

    // Lizenzen ohne credits_*
    const licenses = (parsed.licenses || []).filter(l => {
      const n = typeof l === 'string' ? l : (l?.name || '');
      return n && !n.startsWith('credits_') && !n.startsWith('credit_');
    });

    // Achievements: einfache Meilensteine basierend auf Daten
    const achievements = [];
    if ((stats.level || 1) >= 5) achievements.push({ id: 'lvl5', name: 'Erfahrener Spieler', desc: 'Level 5 erreicht', icon: '⭐' });
    if ((stats.level || 1) >= 10) achievements.push({ id: 'lvl10', name: 'Veteran', desc: 'Level 10 erreicht', icon: '🌟' });
    if ((stats.level || 1) >= 25) achievements.push({ id: 'lvl25', name: 'Elite', desc: 'Level 25 erreicht', icon: '💫' });
    if ((stats.level || 1) >= 50) achievements.push({ id: 'lvl50', name: 'Legende', desc: 'Level 50 erreicht', icon: '👑' });
    if ((stats.messages || 0) >= 1000) achievements.push({ id: 'msg1k', name: 'Plauderer', desc: '1.000+ Nachrichten', icon: '💬' });
    if ((stats.messages || 0) >= 10000) achievements.push({ id: 'msg10k', name: 'Quasselstrippe', desc: '10.000+ Nachrichten', icon: '📢' });
    if (parsed.character) achievements.push({ id: 'char', name: 'Rollenspieler', desc: 'Charakter erstellt', icon: '🎭' });
    if (licenses.length >= 3) achievements.push({ id: 'lic3', name: 'Sammler', desc: '3+ Lizenzen besessen', icon: '📜' });
    if ((money.bank || 0) >= 100000) achievements.push({ id: 'money100k', name: 'Wohlhabend', desc: '100k+ auf der Bank', icon: '💰' });
    if ((money.bank || 0) >= 1000000) achievements.push({ id: 'millionär', name: 'Millionär', desc: '1M+ auf der Bank', icon: '💎' });
    if ((parsed.marketplace || []).some(m => m?.status === 'active')) achievements.push({ id: 'seller', name: 'Händler', desc: 'Aktives Listing im Marktplatz', icon: '🛒' });
    if (rank && rank <= 10) achievements.push({ id: 'top10', name: 'Top 10', desc: `Rang ${rank} im Leaderboard`, icon: '🏆' });
    if (rank === 1) achievements.push({ id: 'top1', name: 'Nummer 1', desc: '#1 im Leaderboard', icon: '👑' });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username || user.display_name,
        avatar: user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}${user.avatar.startsWith('a_') ? '.gif' : '.png'}?size=128`
          : `https://cdn.discordapp.com/embed/avatars/${(parseInt(user.id) >> 22) % 6}.png`,
      },
      stats: {
        ...stats,
        rank,
        totalUsers: sorted.length,
        xpNeeded: prog.needed,
        progressPct: prog.pct
      },
      money,
      credits: parsed.credits || 0,
      bankLimit: parsed.bankLimit || 1000000,
      character: parsed.character || null,
      licenses,
      licensesCount: licenses.length,
      marketplaceActive: (parsed.marketplace || []).filter(m => m?.status === 'active').length,
      marketplaceSold: (parsed.marketplace || []).filter(m => m?.status === 'sold').length,
      transactions: (parsed.transactions || []).length,
      invoices: (parsed.invoices || []).length,
      personalakte: (parsed.personalakte || []).length,
      kredite: (parsed.kredite || []).length,
      achievements,
      lastSync: data?.last_sync || null
    });
  } catch (e) {
    console.error('[HH] MyProfile error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// =============================================================
// ===== HH: Meine Server-Verwarnungen (warns.json vom Bot) =====
// =============================================================
// Bot-Regel (src/index.js): Verwarnung ist AKTIV, solange sie nicht entfernt
// wurde UND jünger als 30 Tage ist. Ab 4 aktiven Warns folgen Maßnahmen.
const WARN_ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 Tage
const WARN_MAX_ACTIVE = 4;

async function handleHHMyWarnings(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_data')
      .select('data, last_sync')
      .eq('discord_user_id', user.id)
      .single();

    // PGRST116 = no rows -> User hat noch keine Daten (auch keine Warns)
    if (error && error.code !== 'PGRST116') {
      console.error('[HH] MyWarnings DB error:', error);
      return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
    }

    let parsed = data?.data || {};
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { parsed = {}; }
    }

    const rawWarns = Array.isArray(parsed?.warns) ? parsed.warns : [];
    const now = Date.now();

    // Anreichern mit Status: active / expired / removed
    const warnings = rawWarns.map(w => {
      const createdTs = w.createdAt ? new Date(w.createdAt).getTime() : 0;
      const expiresAt = createdTs ? createdTs + WARN_ACTIVE_WINDOW_MS : 0;
      const isRemoved = !!w.removed;
      const isExpired = !isRemoved && createdTs > 0 && (now - createdTs) >= WARN_ACTIVE_WINDOW_MS;
      const isActive = !isRemoved && !isExpired;

      let status = 'active';
      if (isRemoved) status = 'removed';
      else if (isExpired) status = 'expired';

      return {
        id: w.id || null,
        reason: w.reason || '',
        moderator: w.moderator || null,
        moderatorTag: w.moderatorTag || null,
        createdAt: w.createdAt || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        daysLeft: isActive && expiresAt
          ? Math.max(0, Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000)))
          : 0,
        status,
        removedAt: w.removedAt || null,
        removedBy: w.removedBy || null,
        removedByTag: w.removedByTag || null,
        removeReason: w.removeReason || null
      };
    })
    // Neueste zuerst
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    const activeCount = warnings.filter(w => w.status === 'active').length;
    const expiredCount = warnings.filter(w => w.status === 'expired').length;
    const removedCount = warnings.filter(w => w.status === 'removed').length;

    return NextResponse.json({
      success: true,
      warnings,
      counts: {
        total: warnings.length,
        active: activeCount,
        expired: expiredCount,
        removed: removedCount
      },
      maxActive: WARN_MAX_ACTIVE,
      activeWindowDays: 30,
      lastSync: data?.last_sync || null
    });
  } catch (e) {
    console.error('[HH] MyWarnings error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Admin: Verwarnungen eines bestimmten Users abrufen
async function handleHHUserWarnings(request) {
  try {
    // Nur Admins dürfen diese Route nutzen
    const admin = getAdminContext(request);
    if (!admin) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId Parameter fehlt' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_data')
      .select('data')
      .eq('discord_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[HH] UserWarnings DB error:', error);
      return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
    }

    let parsed = data?.data || {};
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { parsed = {}; }
    }

    const rawWarns = Array.isArray(parsed?.warns) ? parsed.warns : [];
    const now = Date.now();

    // Nur aktive Warns für Admin-Ansicht
    const warnings = rawWarns
      .filter(w => {
        if (w.removed) return false;
        const createdTs = w.createdAt ? new Date(w.createdAt).getTime() : 0;
        const isExpired = createdTs > 0 && (now - createdTs) >= WARN_ACTIVE_WINDOW_MS;
        return !isExpired;
      })
      .map(w => ({
        date: w.createdAt || null,
        reason: w.reason || '',
        admin: w.moderatorTag || w.moderator || 'Unbekannt'
      }))
      .sort((a, b) => {
        const ta = a.date ? new Date(a.date).getTime() : 0;
        const tb = b.date ? new Date(b.date).getTime() : 0;
        return tb - ta;
      });

    return NextResponse.json({
      success: true,
      warnings,
      total: warnings.length
    });
  } catch (e) {
    console.error('[HH] UserWarnings error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

async function handleSearchRecipients(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').toLowerCase().trim();
    if (q.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const [all, members] = await Promise.all([
      _loadAllUserData(),
      _loadDiscordMembers()
    ]);

    const results = [];
    for (const row of all) {
      // Sich selbst ausschließen
      if (row.discord_user_id === user.id) continue;

      const c = row.data?.character;
      if (!c) continue;
      const vorname = (c.vorname || '').toLowerCase();
      const nachname = (c.nachname || '').toLowerCase();
      const fullName = (c.name || (vorname && nachname ? `${vorname} ${nachname}` : '') || '').toLowerCase();

      // Match-Logik: q kann "Vorname", "Nachname" oder "Vorname Nachname" sein
      const parts = q.split(/\s+/).filter(Boolean);
      let matches = false;
      if (parts.length === 1) {
        matches = vorname.includes(parts[0]) || nachname.includes(parts[0]) || fullName.includes(parts[0]);
      } else {
        // Mehrere Teile: alle müssen irgendwo matchen
        matches = parts.every(p =>
          vorname.includes(p) || nachname.includes(p) || fullName.includes(p)
        );
      }
      if (!matches) continue;

      // Kontonummer ermitteln
      const cards = row.data?.cards || [];
      const card = Array.isArray(cards) ? cards[0] : null;
      const accountNumber = card?.accountNumber;
      if (!accountNumber) continue; // Kein Konto → kann nicht überwiesen werden

      const m = members[row.discord_user_id] || null;
      results.push({
        discord_user_id: row.discord_user_id,
        characterName: c.name || `${c.vorname || ''} ${c.nachname || ''}`.trim(),
        vorname: c.vorname || null,
        nachname: c.nachname || null,
        accountNumber,
        bankId: card?.bankId || null,
        avatar: m?.avatar || null,
        discordUsername: m?.username || null,
        faction: c.faction || null,
      });

      if (results.length >= 20) break;
    }

    return NextResponse.json({ success: true, results });
  } catch (e) {
    console.error('[Transfer-Search] Error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// =============================================================
// ===== HAMBURG HORIZON: Tickets + Transcripts =====
// =============================================================
// GET /api/hh/tickets  → Liste aller eigenen Tickets
async function handleHHTickets(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('user_data')
      .select('data')
      .eq('discord_user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[HH-Tickets] DB error:', error);
      return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
    }

    let parsed = data?.data || {};
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { parsed = {}; }
    }

    const ticketsObj = parsed.tickets || {};
    // tickets kann Array oder Object sein
    const ticketsArr = Array.isArray(ticketsObj)
      ? ticketsObj
      : Object.values(ticketsObj);

    const tickets = ticketsArr
      .filter(t => t && t.id)
      .map(t => ({
        id: t.id,
        type: t.type || 'Support',
        category: t.category || null,
        status: t.status || 'open',
        createdAt: t.createdAt || null,
        closedAt: t.closedAt || null,
        closedByTag: t.closedByTag || null,
        claimedBy: t.claimedBy || null,
        hasTranscript: Boolean(t.transcriptHtml) || Boolean(t.transcriptPath),
        messagesCount: Array.isArray(t.messages) ? t.messages.length : 0,
      }))
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });

    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open' || t.status === 'claimed').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      withTranscript: tickets.filter(t => t.hasTranscript).length,
    };

    return NextResponse.json({ success: true, stats, tickets });
  } catch (e) {
    console.error('[HH-Tickets] Error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET /api/hh/tickets/:id/transcript  → HTML-Vorschau
async function handleHHTicketTranscript(request, ticketId) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    if (!ticketId) return NextResponse.json({ error: 'Ticket-ID fehlt' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('user_data')
      .select('data')
      .eq('discord_user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Ticket nicht gefunden' }, { status: 404 });
    }
    let parsed = data.data;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { parsed = {}; }
    }

    const ticketsObj = parsed?.tickets || {};
    const ticketsArr = Array.isArray(ticketsObj) ? ticketsObj : Object.values(ticketsObj);
    const ticket = ticketsArr.find(t => t && t.id === ticketId);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket gehört nicht dir oder existiert nicht' }, { status: 404 });
    }

    if (ticket.transcriptHtml) {
      return NextResponse.json({
        success: true,
        id: ticket.id,
        type: ticket.type || 'Support',
        status: ticket.status,
        createdAt: ticket.createdAt,
        closedAt: ticket.closedAt,
        transcriptHtml: ticket.transcriptHtml
      });
    }

    // Fallback: Wenn keine HTML vorhanden, aus messages eine einfache HTML generieren
    if (Array.isArray(ticket.messages) && ticket.messages.length > 0) {
      const html = _buildFallbackTranscript(ticket);
      return NextResponse.json({
        success: true,
        id: ticket.id,
        type: ticket.type || 'Support',
        status: ticket.status,
        createdAt: ticket.createdAt,
        closedAt: ticket.closedAt,
        transcriptHtml: html,
        generated: true
      });
    }

    return NextResponse.json({
      error: 'Kein Transkript verfügbar',
      hint: 'Der Bot muss das Transkript beim Schließen in user_data.tickets[id].transcriptHtml speichern.'
    }, { status: 404 });
  } catch (e) {
    console.error('[HH-Ticket-Transcript] Error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function _escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function _buildFallbackTranscript(ticket) {
  const msgs = (ticket.messages || []).map(m => {
    const ts = m.createdAt ? new Date(m.createdAt).toLocaleString('de-DE') : '';
    return `
      <div class="hh-msg">
        <div class="hh-msg-meta">
          <span class="hh-author">${_escapeHtml(m.authorTag || m.author || 'Unbekannt')}</span>
          <span class="hh-time">${_escapeHtml(ts)}</span>
        </div>
        <div class="hh-content">${_escapeHtml(m.content || '')}</div>
      </div>`;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="de"><head>
<meta charset="UTF-8">
<title>Ticket ${_escapeHtml(ticket.id)}</title>
<style>
  body { font-family: -apple-system, Segoe UI, sans-serif; background: #18181b; color: #e4e4e7; padding: 20px; margin:0; }
  .hh-msg { padding: 12px; background: #27272a; border-radius: 8px; margin-bottom: 8px; }
  .hh-msg-meta { display: flex; gap: 12px; font-size: 12px; color: #a1a1aa; margin-bottom: 6px; }
  .hh-author { font-weight: 600; color: #fafafa; }
  .hh-content { white-space: pre-wrap; font-size: 14px; }
  h1 { font-size: 18px; border-bottom: 1px solid #3f3f46; padding-bottom: 10px; }
</style></head><body>
<h1>Ticket #${_escapeHtml(ticket.id)} – ${_escapeHtml(ticket.type || 'Support')}</h1>
<p style="color:#a1a1aa; font-size:13px;">Erstellt: ${_escapeHtml(ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('de-DE') : '?')}
${ticket.closedAt ? ` • Geschlossen: ${_escapeHtml(new Date(ticket.closedAt).toLocaleString('de-DE'))}` : ''}</p>
${msgs || '<p style="color:#71717a">Keine Nachrichten gespeichert.</p>'}
</body></html>`;
}




