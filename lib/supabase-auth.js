/**
 * Supabase Auth Helpers für HHRP
 * ─────────────────────────────────────────────────────────────────
 * Verwaltet Email/Passwort-Auth (zusätzlich zur bestehenden Discord-OAuth).
 * Verknüpft jeden Supabase-User mit seiner Discord-ID via `user_auth_links`.
 */

import { getSupabaseAdmin } from './supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Anon-Client (Server-Side) – wird für signInWithPassword / resetPasswordForEmail
 * benötigt, da der Service-Role-Client diese „User-flow"-Methoden nicht direkt
 * unterstützt bzw. keine E-Mails verschickt.
 */
let _anonClient = null;
async function getSupabaseAnon() {
  if (_anonClient) return _anonClient;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }
  const { createClient } = await import('@supabase/supabase-js');
  _anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return _anonClient;
}

// ─── Link-Helfer (user_auth_links Tabelle) ──────────────────────────

export async function getLinkByDiscordId(discordUserId) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('user_auth_links')
    .select('*')
    .eq('discord_user_id', discordUserId)
    .maybeSingle();
  if (error) {
    console.error('[supabase-auth] getLinkByDiscordId error:', error);
    return null;
  }
  return data;
}

export async function getLinkBySupabaseId(supabaseUserId) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('user_auth_links')
    .select('*')
    .eq('supabase_user_id', supabaseUserId)
    .maybeSingle();
  if (error) {
    console.error('[supabase-auth] getLinkBySupabaseId error:', error);
    return null;
  }
  return data;
}

export async function getLinkByEmail(email) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('user_auth_links')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  if (error) {
    console.error('[supabase-auth] getLinkByEmail error:', error);
    return null;
  }
  return data;
}

export async function createLink({ discordUserId, supabaseUserId, email }) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('user_auth_links')
    .insert([{
      discord_user_id: discordUserId,
      supabase_user_id: supabaseUserId,
      email: email.toLowerCase(),
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Supabase Auth Actions ──────────────────────────────────────────

/**
 * Legt einen neuen Auth-User an. E-Mail wird NICHT vorab bestätigt –
 * Supabase verschickt automatisch die Confirm-Mail (sofern in den
 * Auth-Einstellungen „Email Confirm" aktiviert ist).
 */
export async function signUpSupabaseUser({ email, password, discordUserId }) {
  const supabase = await getSupabaseAnon();
  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase(),
    password,
    options: {
      data: { discord_user_id: discordUserId },
      // Nach Klick in Bestätigungs-Mail kommt der User hier her:
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verified`,
    },
  });
  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
      throw new Error('EMAIL_ALREADY_REGISTERED');
    }
    throw error;
  }
  return data;
}

/**
 * Email + Passwort Login (Server-Side).
 * Gibt das Supabase-User-Objekt zurück oder wirft Error mit Code:
 *   INVALID_CREDENTIALS, EMAIL_NOT_CONFIRMED
 */
export async function signInWithPassword({ email, password }) {
  const supabase = await getSupabaseAnon();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  });
  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
      throw new Error('EMAIL_NOT_CONFIRMED');
    }
    if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
      throw new Error('INVALID_CREDENTIALS');
    }
    throw error;
  }
  return data; // { user, session }
}

export async function sendPasswordResetEmail(email) {
  const supabase = await getSupabaseAnon();
  const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/update-password`,
  });
  if (error) throw error;
}

export async function resendVerificationEmail(email) {
  const supabase = await getSupabaseAnon();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.toLowerCase(),
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verified`,
    },
  });
  if (error) throw error;
}

/**
 * Setzt das Passwort eines Users über das Reset-Token aus der Mail.
 * Der Token kommt als access_token aus dem Recovery-Link.
 */
export async function updatePasswordWithToken(accessToken, newPassword) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase env vars missing');
  }
  const { createClient } = await import('@supabase/supabase-js');
  // Eigener Client mit dem User-Access-Token
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data, error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

/**
 * Passwort ändern, wenn der User bereits eingeloggt ist (kennt sein aktuelles PW).
 * Wir re-authentifizieren über signInWithPassword und nutzen dann admin.updateUserById.
 */
export async function changePasswordWithCurrent({ email, currentPassword, newPassword }) {
  // 1. Re-authenticate, um currentPassword zu prüfen
  await signInWithPassword({ email, password: currentPassword }); // wirft bei falschem PW
  // 2. Passwort via Admin-API ändern
  const supabaseAdmin = await getSupabaseAdmin();
  const link = await getLinkByEmail(email);
  if (!link) throw new Error('LINK_NOT_FOUND');
  const { error } = await supabaseAdmin.auth.admin.updateUserById(link.supabase_user_id, {
    password: newPassword,
  });
  if (error) throw error;
}

/**
 * Lädt Auth-Status eines Supabase-Users (für Profil-UI).
 */
export async function getSupabaseAuthStatus(supabaseUserId) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
  if (error) {
    console.error('[supabase-auth] getSupabaseAuthStatus error:', error);
    return null;
  }
  return data?.user || null;
}
