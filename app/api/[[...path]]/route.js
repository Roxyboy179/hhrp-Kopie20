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
  getAdminAccountById
} from '@/lib/supabase-helpers';
import { sendNewBewerbungNotification, sendStatusUpdateNotification, sendAccountStatusChangeNotification, sendPasswordChangeNotification } from '@/lib/discord-bot';

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
  return NextResponse.json({ user });
}

async function handleLogout() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth_token');
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

async function handleAdminLogout() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_token');
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
    await deleteAdminAccount(id);
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

  switch (p) {
    case 'auth/discord': return handleDiscordAuth();
    case 'auth/callback': return handleDiscordCallback(request);
    case 'auth/me': return handleAuthMe(request);
    case 'bewerbungen': return handleGetBewerbungen(request);
    case 'bewerbungen/stats': return handleGetBewerbungenStats(request);
    case 'settings/username': return handleUpdateUsername(request);
    case 'settings/password': return handleUpdatePassword(request);
    case 'admin/me': return handleAdminMe(request);
    case 'admin/bewerbungen': return handleAdminGetBewerbungen(request);
    case 'admin/accounts': return handleAdminGetAccounts(request);
    case 'admin/settings': return handleAdminGetSettings(request);
    default: return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function POST(request) {
  const url = new URL(request.url);
  const p = url.pathname.replace('/api/', '');

  switch (p) {
    case 'auth/logout': return handleLogout();
    case 'bewerbungen': return handleCreateBewerbung(request);
    case 'admin/login': return handleAdminLogin(request);
    case 'admin/logout': return handleAdminLogout();
    case 'admin/accounts': return handleAdminCreateAccount(request);
    case 'admin/check-role': return handleCheckDiscordRole(request);
    case 'admin/settings': return handleAdminUpdateSettings(request);
    default: return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function PUT(request) {
  const url = new URL(request.url);
  const p = url.pathname.replace('/api/', '');

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

