import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ===== CONFIGURATION =====
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'hhrp-default-secret';
const REDIRECT_URI = `${BASE_URL}/api/auth/callback`;
const DATA_DIR = path.join(process.cwd(), 'data');

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
  const token = request.cookies.get('hhrp_session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

function getAdminFromRequest(request) {
  const token = request.cookies.get('hhrp_admin')?.value;
  if (!token) return null;
  return verifyToken(token);
}

function getAdminContext(request) {
  const adminUser = getAdminFromRequest(request);
  if (adminUser) return adminUser;
  const user = getUserFromRequest(request);
  if (user && user.adminLevel > 0) {
    return {
      discordUserId: user.id,
      discordUsername: user.globalName || user.username,
      roleName: user.adminRole,
      roleLevel: user.adminLevel,
      canCreateAccounts: user.canCreateAccounts,
      canSeeAll: user.canSeeAll,
      viaDiscord: true,
    };
  }
  return null;
}

// ===== FILE STORAGE HELPERS =====
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveBewerbung(userId, bewerbung) {
  const dir = path.join(DATA_DIR, 'users', userId);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, `${bewerbung.id}.json`), JSON.stringify(bewerbung, null, 2));
}

function getUserBewerbungen(userId) {
  const dir = path.join(DATA_DIR, 'users', userId);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')); }
      catch { return null; }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getBewerbungById(userId, id) {
  const filePath = path.join(DATA_DIR, 'users', userId, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
  catch { return null; }
}

function getAllBewerbungen() {
  const usersDir = path.join(DATA_DIR, 'users');
  if (!fs.existsSync(usersDir)) return [];
  const result = [];
  try {
    for (const userId of fs.readdirSync(usersDir)) {
      const userDir = path.join(usersDir, userId);
      try {
        if (fs.statSync(userDir).isDirectory()) {
          for (const file of fs.readdirSync(userDir)) {
            if (file.endsWith('.json')) {
              try {
                const data = JSON.parse(fs.readFileSync(path.join(userDir, file), 'utf-8'));
                result.push(data);
              } catch {}
            }
          }
        }
      } catch {}
    }
  } catch {}
  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function updateBewerbung(userId, id, updates) {
  const filePath = path.join(DATA_DIR, 'users', userId, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const updated = { ...data, ...updates, updatedAt: new Date().toISOString() };
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
    return updated;
  } catch { return null; }
}

function saveAccount(account) {
  const dir = path.join(DATA_DIR, 'accounts', account.id);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, 'anmeldedaten.json'), JSON.stringify(account, null, 2));
}

function getAccounts() {
  const dir = path.join(DATA_DIR, 'accounts');
  if (!fs.existsSync(dir)) return [];
  const result = [];
  try {
    for (const accountId of fs.readdirSync(dir)) {
      const filePath = path.join(dir, accountId, 'anmeldedaten.json');
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          result.push({ ...data, password: undefined, salt: undefined });
        } catch {}
      }
    }
  } catch {}
  return result;
}

function getAccountByCredentials(mitarbeiterNr, email, password) {
  const dir = path.join(DATA_DIR, 'accounts');
  if (!fs.existsSync(dir)) return null;
  try {
    for (const accountId of fs.readdirSync(dir)) {
      const filePath = path.join(dir, accountId, 'anmeldedaten.json');
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (data.mitarbeiterNummer === mitarbeiterNr && (data.email === email || data.username === email)) {
            const hashedInput = crypto.createHash('sha256').update(password + data.salt).digest('hex');
            if (hashedInput === data.password) return data;
          }
        } catch {}
      }
    }
  } catch {}
  return null;
}

function deleteAccount(accountId) {
  const dir = path.join(DATA_DIR, 'accounts', accountId);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
    return true;
  }
  return false;
}

// ===== DISCORD API HELPERS =====
async function exchangeCode(code) {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  });
  const res = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  return res.json();
}

async function getDiscordUser(accessToken) {
  const res = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  return res.json();
}

async function getGuildMember(userId) {
  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${userId}`, {
      headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function sendDiscordEmbed(embed) {
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ embeds: [embed] }),
    });
    return res.json();
  } catch (e) {
    console.error('Discord embed send error:', e);
    return null;
  }
}

function getAdminRole(memberRoles) {
  let highestRole = null;
  for (const roleId of memberRoles) {
    if (ADMIN_ROLES[roleId]) {
      if (!highestRole || ADMIN_ROLES[roleId].level > highestRole.level) {
        highestRole = { ...ADMIN_ROLES[roleId], roleId };
      }
    }
  }
  return highestRole;
}

function snowflakeToDate(snowflake) {
  try {
    const DISCORD_EPOCH = 1420070400000n;
    const timestamp = (BigInt(snowflake) >> 22n) + DISCORD_EPOCH;
    return new Date(Number(timestamp));
  } catch {
    return new Date();
  }
}

// ===== PATH HELPER =====
function getPath(params) {
  return params?.path?.join('/') || '';
}

// ===== AUTH HANDLERS =====
async function handleDiscordAuth() {
  const scopes = 'identify email';
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scopes)}`;
  return NextResponse.redirect(url);
}

async function handleDiscordCallback(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${BASE_URL}?error=auth_failed`);
  }

  try {
    const tokenData = await exchangeCode(code);
    if (tokenData.error) {
      console.error('Token exchange error:', tokenData);
      return NextResponse.redirect(`${BASE_URL}?error=token_failed`);
    }

    const discordUser = await getDiscordUser(tokenData.access_token);
    if (!discordUser.id) {
      console.error('User fetch error:', discordUser);
      return NextResponse.redirect(`${BASE_URL}?error=user_failed`);
    }

    const member = await getGuildMember(discordUser.id);
    if (!member) {
      return NextResponse.redirect(`${BASE_URL}?error=not_member`);
    }

    const adminRole = getAdminRole(member.roles || []);
    const createdAt = snowflakeToDate(discordUser.id).toISOString();

    const sessionPayload = {
      id: discordUser.id,
      username: discordUser.username,
      globalName: discordUser.global_name,
      email: discordUser.email,
      avatar: discordUser.avatar,
      createdAt,
      roles: member.roles || [],
      adminRole: adminRole ? adminRole.name : null,
      adminLevel: adminRole ? adminRole.level : 0,
      canCreateAccounts: adminRole ? adminRole.canCreateAccounts : false,
      canSeeAll: adminRole ? adminRole.canSeeAll : false,
    };

    const token = createToken(sessionPayload);
    const response = NextResponse.redirect(`${BASE_URL}?login=success`);
    response.cookies.set('hhrp_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    return response;
  } catch (e) {
    console.error('Discord callback error:', e);
    return NextResponse.redirect(`${BASE_URL}?error=server_error`);
  }
}

async function handleGetMe(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user });
}

async function handleLogout() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('hhrp_session', '', { maxAge: 0, path: '/' });
  return response;
}

// ===== BEWERBUNGEN HANDLERS =====
async function handleGetBewerbungen(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  const bewerbungen = getUserBewerbungen(user.id);
  return NextResponse.json({ bewerbungen });
}

async function handleGetBewerbung(request, id) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  const bewerbung = getBewerbungById(user.id, id);
  if (!bewerbung) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  return NextResponse.json({ bewerbung });
}

async function handleSubmitBewerbung(request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

  try {
    const body = await request.json();
    const id = uuidv4();

    const bewerbung = {
      id,
      userId: user.id,
      username: user.username,
      globalName: user.globalName,
      email: user.email,
      discordCreatedAt: user.createdAt,
      avatar: user.avatar,
      status: 'Eingereicht',
      claimedBy: null,
      claimedByName: null,
      formData: body.formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveBewerbung(user.id, bewerbung);

    try {
      await sendDiscordEmbed({
        title: 'Neue Bewerbung eingegangen!',
        color: 3447003,
        fields: [
          { name: 'Bewerber', value: user.globalName || user.username, inline: true },
          { name: 'Bewerbungs-ID', value: id.substring(0, 8), inline: true },
          { name: 'Status', value: 'Eingereicht', inline: true },
          { name: 'Discord', value: `<@${user.id}>`, inline: true },
          { name: 'Vorname', value: body.formData?.vorname || '-', inline: true },
          { name: 'Roblox-Name', value: body.formData?.robloxName || '-', inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Hamburg Horizon RP - Bewerbungssystem' },
      });
    } catch (e) {
      console.error('Discord send error:', e);
    }

    return NextResponse.json({ bewerbung, success: true });
  } catch (e) {
    console.error('Submit error:', e);
    return NextResponse.json({ error: 'Fehler beim Einreichen' }, { status: 500 });
  }
}

async function handleWithdrawBewerbung(request, id) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });

  const bewerbung = getBewerbungById(user.id, id);
  if (!bewerbung) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  if (bewerbung.status === 'Zurückgezogen') {
    return NextResponse.json({ error: 'Bereits zurückgezogen' }, { status: 400 });
  }

  const updated = updateBewerbung(user.id, id, { status: 'Zurückgezogen' });

  try {
    await sendDiscordEmbed({
      title: 'Bewerbung zurückgezogen',
      color: 15105570,
      fields: [
        { name: 'Bewerber', value: user.globalName || user.username, inline: true },
        { name: 'Bewerbungs-ID', value: id.substring(0, 8), inline: true },
        { name: 'Status', value: 'Zurückgezogen', inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'Hamburg Horizon RP - Bewerbungssystem' },
    });
  } catch (e) {
    console.error('Discord send error:', e);
  }

  return NextResponse.json({ bewerbung: updated, success: true });
}

// ===== ADMIN HANDLERS =====
async function handleAdminLogin(request) {
  try {
    const { mitarbeiterNummer, email, password } = await request.json();

    const account = getAccountByCredentials(mitarbeiterNummer, email, password);
    if (!account) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
    }

    const member = await getGuildMember(account.discordUserId);
    if (!member) {
      return NextResponse.json({ error: 'Discord-Mitgliedschaft nicht gefunden' }, { status: 403 });
    }

    const adminRole = getAdminRole(member.roles || []);
    if (!adminRole) {
      return NextResponse.json({ error: 'Keine Admin-Berechtigung auf Discord' }, { status: 403 });
    }

    const sessionPayload = {
      accountId: account.id,
      discordUserId: account.discordUserId,
      discordUsername: account.discordUsername,
      mitarbeiterNummer: account.mitarbeiterNummer,
      roleName: adminRole.name,
      roleLevel: adminRole.level,
      canCreateAccounts: adminRole.canCreateAccounts,
      canSeeAll: adminRole.canSeeAll,
    };

    const token = createToken(sessionPayload);
    const response = NextResponse.json({ success: true, admin: sessionPayload });
    response.cookies.set('hhrp_admin', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });
    return response;
  } catch (e) {
    console.error('Admin login error:', e);
    return NextResponse.json({ error: 'Fehler bei der Anmeldung' }, { status: 500 });
  }
}

async function handleAdminGetMe(request) {
  const admin = getAdminContext(request);
  if (!admin) return NextResponse.json({ admin: null });
  return NextResponse.json({ admin });
}

async function handleAdminLogout() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('hhrp_admin', '', { maxAge: 0, path: '/' });
  return response;
}

async function handleAdminGetBewerbungen(request) {
  const admin = getAdminContext(request);
  if (!admin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });

  let bewerbungen = getAllBewerbungen();

  if (!admin.canSeeAll) {
    bewerbungen = bewerbungen.filter(b =>
      !b.claimedBy || b.claimedBy === admin.discordUserId
    );
  }

  return NextResponse.json({ bewerbungen });
}

async function handleAdminGetBewerbung(request, id) {
  const admin = getAdminContext(request);
  if (!admin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });

  const all = getAllBewerbungen();
  const bewerbung = all.find(b => b.id === id);
  if (!bewerbung) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

  if (!admin.canSeeAll && bewerbung.claimedBy && bewerbung.claimedBy !== admin.discordUserId) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }

  return NextResponse.json({ bewerbung });
}

async function handleAdminUpdateBewerbung(request, id) {
  const admin = getAdminContext(request);
  if (!admin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });

  try {
    const body = await request.json();
    const all = getAllBewerbungen();
    const bewerbung = all.find(b => b.id === id);
    if (!bewerbung) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

    if (body.action === 'claim' && bewerbung.claimedBy && bewerbung.claimedBy !== admin.discordUserId) {
      return NextResponse.json({ error: 'Bereits von einem anderen Teammitglied übernommen' }, { status: 400 });
    }

    let updates = {};
    if (body.action === 'claim') {
      updates = {
        claimedBy: admin.discordUserId,
        claimedByName: admin.discordUsername || 'Admin',
        status: 'In Bearbeitung',
      };
    } else if (body.action === 'unclaim') {
      updates = {
        claimedBy: null,
        claimedByName: null,
        status: 'Eingereicht',
      };
    } else if (body.status) {
      updates = { status: body.status };
    }

    const updated = updateBewerbung(bewerbung.userId, id, updates);

    const statusColors = {
      'In Bearbeitung': 16776960,
      'Angenommen': 5763719,
      'Abgelehnt': 15548997,
      'Eingereicht': 3447003,
    };

    try {
      await sendDiscordEmbed({
        title: 'Bewerbung aktualisiert',
        color: statusColors[updated.status] || 3447003,
        fields: [
          { name: 'Bewerber', value: updated.globalName || updated.username, inline: true },
          { name: 'Bewerbungs-ID', value: id.substring(0, 8), inline: true },
          { name: 'Neuer Status', value: updated.status, inline: true },
          { name: 'Bearbeiter', value: admin.discordUsername || 'Admin', inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Hamburg Horizon RP - Bewerbungssystem' },
      });
    } catch (e) {
      console.error('Discord send error:', e);
    }

    return NextResponse.json({ bewerbung: updated, success: true });
  } catch (e) {
    console.error('Update error:', e);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }
}

async function handleAdminGetAccounts(request) {
  const admin = getAdminContext(request);
  if (!admin || admin.roleLevel < 3) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }
  const accounts = getAccounts();
  return NextResponse.json({ accounts });
}

async function handleCreateAccount(request) {
  const admin = getAdminContext(request);
  if (!admin || !admin.canCreateAccounts) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }

  try {
    const { discordUserId, discordUsername, mitarbeiterNummer, email, password } = await request.json();

    if (!discordUserId || !mitarbeiterNummer || !email || !password) {
      return NextResponse.json({ error: 'Alle Felder sind erforderlich' }, { status: 400 });
    }

    const member = await getGuildMember(discordUserId);
    if (!member) {
      return NextResponse.json({ error: 'Discord-Benutzer nicht auf dem Server' }, { status: 400 });
    }

    const adminRole = getAdminRole(member.roles || []);
    if (!adminRole) {
      return NextResponse.json({ error: 'Benutzer hat keine Admin-Rolle auf Discord' }, { status: 400 });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.createHash('sha256').update(password + salt).digest('hex');

    const account = {
      id: uuidv4(),
      discordUserId,
      discordUsername: discordUsername || 'Unbekannt',
      mitarbeiterNummer,
      email,
      username: email,
      password: hashedPassword,
      salt,
      roleName: adminRole.name,
      createdAt: new Date().toISOString(),
      createdBy: admin.discordUserId,
    };

    saveAccount(account);

    return NextResponse.json({
      success: true,
      account: { ...account, password: undefined, salt: undefined },
    });
  } catch (e) {
    console.error('Create account error:', e);
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
  }
}

async function handleDeleteAccount(request, id) {
  const admin = getAdminContext(request);
  if (!admin || !admin.canCreateAccounts) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }
  const deleted = deleteAccount(id);
  if (!deleted) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  return NextResponse.json({ success: true });
}

// ===== MAIN ROUTE HANDLERS =====
export async function GET(request, { params }) {
  const p = getPath(params);

  switch (p) {
    case 'auth/discord': return handleDiscordAuth();
    case 'auth/callback': return handleDiscordCallback(request);
    case 'auth/me': return handleGetMe(request);
    case 'bewerbungen': return handleGetBewerbungen(request);
    case 'admin/me': return handleAdminGetMe(request);
    case 'admin/bewerbungen': return handleAdminGetBewerbungen(request);
    case 'admin/accounts': return handleAdminGetAccounts(request);
    default:
      if (p.startsWith('bewerbungen/') && p !== 'bewerbungen/') {
        return handleGetBewerbung(request, p.substring('bewerbungen/'.length));
      }
      if (p.startsWith('admin/bewerbungen/') && p !== 'admin/bewerbungen/') {
        return handleAdminGetBewerbung(request, p.substring('admin/bewerbungen/'.length));
      }
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function POST(request, { params }) {
  const p = getPath(params);

  switch (p) {
    case 'auth/logout': return handleLogout();
    case 'bewerbungen': return handleSubmitBewerbung(request);
    case 'admin/login': return handleAdminLogin(request);
    case 'admin/logout': return handleAdminLogout();
    case 'admin/accounts': return handleCreateAccount(request);
    default:
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function PUT(request, { params }) {
  const p = getPath(params);

  if (p.startsWith('admin/bewerbungen/') && p !== 'admin/bewerbungen/') {
    return handleAdminUpdateBewerbung(request, p.substring('admin/bewerbungen/'.length));
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(request, { params }) {
  const p = getPath(params);

  if (p.startsWith('bewerbungen/') && p !== 'bewerbungen/') {
    return handleWithdrawBewerbung(request, p.substring('bewerbungen/'.length));
  }
  if (p.startsWith('admin/accounts/') && p !== 'admin/accounts/') {
    return handleDeleteAccount(request, p.substring('admin/accounts/'.length));
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
