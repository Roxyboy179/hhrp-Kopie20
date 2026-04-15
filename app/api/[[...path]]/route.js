import { NextResponse } from 'next/server';
import crypto from 'crypto';
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
import { sendNewBewerbungNotification, sendStatusUpdateNotification, sendAccountStatusChangeNotification, sendPasswordChangeNotification } from '@/lib/discord-bot';
import { logActivity, cleanupOldLogs, getLogs, getIpAddress, LOG_ACTIONS } from '@/lib/activity-logger';
import { createNotification, getUserNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications';

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
    return NextResponse.redirect(new URL(`/?error=discord_denied`, BASE_URL));
  }
  
  if (!code) {
    console.log('[OAUTH] No code in callback');
    return NextResponse.redirect(new URL(`/?error=no_code`, BASE_URL));
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
      return NextResponse.redirect(new URL(`/?error=token_failed`, BASE_URL));
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
      return NextResponse.redirect(new URL(`/?error=user_failed`, BASE_URL));
    }
    const discordUser = await userRes.json();
    console.log('[OAUTH] Step 2 OK - User:', discordUser.username, '(', discordUser.id, ')');

    // Step 3: Check guild membership
    console.log('[OAUTH] Step 3: Checking guild membership...');
    const member = await getGuildMember(discordUser.id);
    if (!member) {
      console.error('[OAUTH] User is NOT a member of guild', DISCORD_GUILD_ID);
      return NextResponse.redirect(new URL(`/?error=not_member`, BASE_URL));
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
    
    const redirectUrl = new URL('/', BASE_URL);
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
    return NextResponse.redirect(new URL(`/?error=auth_failed`, BASE_URL));
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
      adminLevel: adminRole?.level || 0,
      adminRole: adminRole?.name || null,
      canCreateAccounts: adminRole?.canCreateAccounts || false,
      canSeeAll: adminRole?.canSeeAll || false,
      isTeamMember: !!(adminRole || teamRole),
      teamRole: teamRole?.name || null,
    };
    
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
    const { normalOpen, praktikumOpen, uprankOpen } = body;
    
    const settings = await updateBewerbungSettings({
      normal_open: normalOpen,
      praktikum_open: praktikumOpen,
      uprank_open: uprankOpen
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
      const admin = await verifyAdminToken(request);
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

  // === Public System Status (for banner) ===
  if (p === 'system-status/public') {
    try {
      const { data, error } = await supabaseAdmin
        .from('system_status')
        .select('geplante_wartung, wartung_start, wartung_ende, wartung_nachricht')
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json({ 
          geplante_wartung: false 
        });
      }

      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ geplante_wartung: false });
    }
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

  // === System Status ===
  if (p === 'admin/system-status') {
    try {
      const admin = await verifyAdminToken(request);
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

  // === Public System Status (for banner) ===
  if (p === 'system-status/public') {
    try {
      const { data, error } = await supabaseAdmin
        .from('system_status')
        .select('geplante_wartung, wartung_start, wartung_ende, wartung_nachricht')
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json({ 
          geplante_wartung: false 
        });
      }

      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ geplante_wartung: false });
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
    default: return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

// Handler for updating system status (used by both POST and PUT)
async function handleUpdateSystemStatus(request) {
  try {
    const admin = await verifyAdminToken(request);
    // Nur Projektinhaber (Level 4) dürfen System-Status ändern
    if (!admin || admin.roleLevel < 4) {
      return NextResponse.json({ error: 'Unauthorized - Nur Projektinhaber' }, { status: 401 });
    }

    const body = await request.json();
    
    // Update or insert system_status
    const { data: existing } = await supabaseAdmin
      .from('system_status')
      .select('id')
      .single();

    let result;
    if (existing) {
      result = await supabaseAdmin
        .from('system_status')
        .update({
          wartungsmodus: body.wartungsmodus || false,
          geplante_wartung: body.geplante_wartung || false,
          wartung_start: body.wartung_start || null,
          wartung_ende: body.wartung_ende || null,
          wartung_nachricht: body.wartung_nachricht || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      result = await supabaseAdmin
        .from('system_status')
        .insert({
          wartungsmodus: body.wartungsmodus || false,
          geplante_wartung: body.geplante_wartung || false,
          wartung_start: body.wartung_start || null,
          wartung_ende: body.wartung_ende || null,
          wartung_nachricht: body.wartung_nachricht || '',
        });
    }

    if (result.error) {
      console.error('Update system_status error:', result.error);
      return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
    }

    // Log activity
    await logActivity({
      adminId: admin.id,
      action: 'update_system_status',
      details: `Wartungsmodus: ${body.wartungsmodus ? 'AN' : 'AUS'}, Geplante Wartung: ${body.geplante_wartung ? 'AN' : 'AUS'}`,
      ipAddress: getIpAddress(request),
    });

    return NextResponse.json({ success: true });
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

