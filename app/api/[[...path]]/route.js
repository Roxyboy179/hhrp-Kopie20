import { NextResponse } from 'next/server';
import crypto from 'crypto';
import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase';
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
    }

    const updated = await updateBewerbung(id, updates);
    const newStatus = updated.status;

    // Automatische Discord-Rollen-Vergabe für Beta Tester bei Annahme
    if (newStatus === 'Angenommen' && updated.form_data?.bewerbungstyp === 'beta_tester') {
      try {
        console.log('[BETA TESTER] Vergebe Beta Tester Rolle...');
        await assignDiscordRole(updated.discord_user_id, '1494434149623136276');
        console.log('[BETA TESTER] Rolle erfolgreich vergeben!');
      } catch (roleError) {
        console.error('[BETA TESTER] Fehler beim Vergeben der Rolle:', roleError);
        // Weiter machen, auch wenn Rollen-Vergabe fehlschlägt
      }
    }

    // DM + Channel-Nachricht bei Statusänderung (korrekte Argumente!)
    if (oldStatus !== newStatus) {
      await sendStatusUpdateNotification(
        updated.discord_user_id,  // userId
        updated.username,          // username
        newStatus,                 // neuer Status
        admin.discordUsername      // bearbeitet von
      );
      
      // In-App Benachrichtigung erstellen
      const statusMessages = {
        'In Bearbeitung': 'Deine Bewerbung wird jetzt bearbeitet!',
        'Angenommen': 'Herzlichen Glückwunsch! Deine Bewerbung wurde angenommen!',
        'Abgelehnt': 'Deine Bewerbung wurde leider abgelehnt.',
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
    case 'team/members': return handleGetTeamMembers(request);
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

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(request) {
  const url = new URL(request.url);
  const p = url.pathname.replace('/api/', '');

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

          if (isBooster && !licenses.includes('server_booster')) {
            userData = {
              ...userData,
              data: {
                ...userData.data,
                licenses: [...licenses, 'server_booster']
              }
            };
            console.log(`[UserData] Added server_booster for user ${user.id}`);
          } else if (!isBooster && licenses.includes('server_booster')) {
            userData = {
              ...userData,
              data: {
                ...userData.data,
                licenses: licenses.filter(l => l !== 'server_booster')
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

    // Check if user is Beta Tester (Role ID: 1494434149623136276)
    const isBetaTester = user.roles?.includes('1494434149623136276');
    if (!isBetaTester) {
      return NextResponse.json({ error: 'Nur Beta Tester können Feedback einreichen' }, { status: 403 });
    }

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

