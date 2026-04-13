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
  deleteAdminAccount
} from '@/lib/supabase-helpers';

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
    result[camelKey] = typeof value === 'object' && value !== null ? toCamelCase(value) : value;
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
  for (const roleId of roles) {
    if (ADMIN_ROLES[roleId]) return ADMIN_ROLES[roleId];
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
  if (!code) return NextResponse.redirect(`${BASE_URL}/?error=no_code`);

  try {
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

    if (!tokenRes.ok) return NextResponse.redirect(`${BASE_URL}/?error=token_failed`);
    const { access_token } = await tokenRes.json();

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!userRes.ok) return NextResponse.redirect(`${BASE_URL}/?error=user_failed`);
    const discordUser = await userRes.json();

    const member = await getGuildMember(discordUser.id);
    if (!member) return NextResponse.redirect(`${BASE_URL}/?error=not_member`);

    const adminRole = getAdminRole(member.roles || []);
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
    };

    const token = createToken(user);
    const response = NextResponse.redirect(BASE_URL);
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${BASE_URL}/?error=auth_failed`);
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

    const bewerbung = await createBewerbung({
      discordUserId: user.id,
      username: user.globalName || user.username,
      email: user.email,
      discordCreatedAt: user.createdAt,
      formData
    });

    // Schönes Discord Embed senden
    await sendDiscordEmbed(createBewerbungEmbed(bewerbung, 'erstellt'));

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

    console.log('[DEBUG] ✅ Account validated:', account.mitarbeiter_nummer);

    // SCHRITT 2: Discord Member Check (OPTIONAL - kann später aktiviert werden)
    // ERSTMAL DEAKTIVIERT FÜR TESTING!
    /*
    console.log('[DEBUG] Checking Discord member...');
    const member = await getGuildMember(account.discord_user_id);
    if (!member) {
      console.log('[DEBUG] Discord member not found');
      return NextResponse.json({ error: 'Discord-Mitgliedschaft nicht gefunden' }, { status: 403 });
    }

    const adminRole = getAdminRole(member.roles || []);
    if (!adminRole) {
      console.log('[DEBUG] No admin role found');
      return NextResponse.json({ error: 'Keine Admin-Berechtigung auf Discord' }, { status: 403 });
    }
    */

    // TEMPORÄR: Default Role wenn Discord-Check deaktiviert
    const adminRole = {
      name: account.role_name || 'Admin',
      level: 4,
      canCreateAccounts: true,
      canSeeAll: true
    };

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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
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

    // Discord Embed im Channel
    await sendDiscordEmbed(createBewerbungEmbed(updated, 'aktualisiert'));

    // DM an User bei Statusänderung
    if (oldStatus !== newStatus && (newStatus === 'Angenommen' || newStatus === 'Abgelehnt')) {
      const dmEmbed = createStatusChangeEmbed(updated, oldStatus, newStatus);
      await sendUserDM(updated.discord_user_id, dmEmbed);
    }

    return NextResponse.json({ bewerbung: updated });
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
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    const member = await getGuildMember(body.discordUserId);
    if (!member) {
      return NextResponse.json({ error: 'Discord-Benutzer nicht im Server' }, { status: 400 });
    }

    const adminRole = getAdminRole(member.roles || []);
    
    const account = await createAdminAccount({
      discordUserId: body.discordUserId,
      discordUsername: body.discordUsername || member.user.username,
      mitarbeiterNummer: body.mitarbeiterNummer,
      email: body.email,
      password: body.password,
      roleName: adminRole?.name,
      createdBy: admin.discordUsername
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Create account error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Account existiert bereits' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
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
          password_hash: a.password_hash // Zeigen für Debug
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
    case 'admin/me': return handleAdminMe(request);
    case 'admin/bewerbungen': return handleAdminGetBewerbungen(request);
    case 'admin/accounts': return handleAdminGetAccounts(request);
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
    default: return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function PUT(request) {
  const url = new URL(request.url);
  const p = url.pathname.replace('/api/', '');

  if (p.startsWith('admin/bewerbungen/')) {
    return handleAdminUpdateBewerbung(request, p.substring('admin/bewerbungen/'.length));
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

