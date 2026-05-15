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
  const supabaseAdmin = await getSupabaseAdmin();
  
  try {
    // Dekodiere den Token um die User-ID zu bekommen
    const { createClient } = await import('@supabase/supabase-js');
    const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Versuche den Token zu verifizieren
    const { data: { user }, error: verifyError } = await tempClient.auth.getUser(accessToken);
    
    if (verifyError || !user) {
      console.error('[updatePasswordWithToken] Token verification failed:', verifyError);
      throw new Error('Invalid or expired token');
    }
    
    // Passwort über Admin API aktualisieren
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );
    
    if (error) {
      console.error('[updatePasswordWithToken] Update error:', error);
      throw error;
    }
    
    console.log('[updatePasswordWithToken] ✅ Passwort aktualisiert für:', user.email);
    return { user: data.user };
  } catch (error) {
    console.error('[updatePasswordWithToken] Error:', error);
    throw error;
  }
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

/**
 * Sucht einen Supabase-Auth-User anhand der E-Mail.
 * Robuster Lookup:
 *   1. Erst via user_auth_links → supabase_user_id → admin.getUserById (O(1), indexed)
 *   2. Fallback: paginated listUsers() (für Orphan-User ohne Discord-Link)
 *
 * Gibt den User zurück oder null, falls nicht gefunden.
 */
export async function findAuthUserByEmail(email) {
  const supabaseAdmin = await getSupabaseAdmin();
  const lowerEmail = String(email || '').toLowerCase();
  if (!lowerEmail) return null;

  // 1. Schneller Pfad: user_auth_links (indexed auf email)
  try {
    const link = await getLinkByEmail(lowerEmail);
    if (link?.supabase_user_id) {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(link.supabase_user_id);
      if (!error && data?.user) {
        return data.user;
      }
    }
  } catch (e) {
    console.warn('[findAuthUserByEmail] link lookup failed:', e?.message || e);
  }

  // 2. Fallback: paginated listUsers (max 50 Seiten = 10.000 User)
  try {
    const perPage = 200;
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error('[findAuthUserByEmail] listUsers error:', error);
        break;
      }
      const list = data?.users || [];
      if (list.length === 0) break;
      const hit = list.find((u) => (u.email || '').toLowerCase() === lowerEmail);
      if (hit) return hit;
      if (list.length < perPage) break;
    }
  } catch (e) {
    console.error('[findAuthUserByEmail] paginated lookup failed:', e?.message || e);
  }

  return null;
}

// ─── Auto-Ban & Account Management ──────────────────────────────────

/**
 * Erhöht failed_login_attempts um 1 und sperrt den Account bei >= 3 Versuchen
 * Funktioniert für ALLE Supabase Auth User, auch ohne Discord-Link!
 */
export async function incrementFailedAttempts(email) {
  const supabaseAdmin = await getSupabaseAdmin();
  
  try {
    // 1. Supabase Auth User holen (robust: Link + paginated Fallback)
    const user = await findAuthUserByEmail(email);
    if (!user) {
      console.log('[incrementFailedAttempts] User nicht gefunden:', email);
      return null;
    }

    // 2. Failed Attempts aus user_metadata holen
    const currentAttempts = user.user_metadata?.failed_login_attempts || 0;
    const newCount = currentAttempts + 1;
    const shouldLock = newCount >= 3;

    // 3. User Metadata aktualisieren
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          failed_login_attempts: newCount,
          locked_at: shouldLock ? new Date().toISOString() : (user.user_metadata?.locked_at || null),
        },
      }
    );

    if (updateError) {
      console.error('[incrementFailedAttempts] Update error:', updateError);
      return null;
    }

    console.log(`[incrementFailedAttempts] ${email}: ${newCount} Fehlversuche${shouldLock ? ' → GESPERRT' : ''}`);

    // 4. Falls Link existiert, auch dort aktualisieren (Best-Effort, ignore errors falls Spalten fehlen)
    try {
      const link = await getLinkByEmail(email);
      if (link) {
        await supabaseAdmin
          .from('user_auth_links')
          .update({
            failed_login_attempts: newCount,
            locked_at: shouldLock ? new Date().toISOString() : link.locked_at,
          })
          .eq('email', email.toLowerCase());
      }
    } catch (linkErr) {
      // Tabelle hat ggf. die Spalten nicht – nicht kritisch.
      console.warn('[incrementFailedAttempts] link update skipped:', linkErr?.message || linkErr);
    }

    return {
      failed_login_attempts: newCount,
      locked_at: shouldLock ? new Date().toISOString() : null,
      email: user.email,
    };
  } catch (error) {
    console.error('[incrementFailedAttempts] error:', error);
    return null;
  }
}

/**
 * Setzt failed_login_attempts auf 0 und entfernt locked_at (Unban)
 */
export async function resetFailedAttempts(email) {
  const supabaseAdmin = await getSupabaseAdmin();
  
  try {
    const user = await findAuthUserByEmail(email);
    
    if (user) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          failed_login_attempts: 0,
          locked_at: null,
        },
      });
      console.log(`[resetFailedAttempts] ${email} → Entsperrt`);
    }

    // Falls Link existiert, auch dort zurücksetzen (Best-Effort)
    try {
      const link = await getLinkByEmail(email);
      if (link) {
        await supabaseAdmin
          .from('user_auth_links')
          .update({
            failed_login_attempts: 0,
            locked_at: null,
          })
          .eq('email', email.toLowerCase());
      }
    } catch (linkErr) {
      console.warn('[resetFailedAttempts] link update skipped:', linkErr?.message || linkErr);
    }
  } catch (error) {
    console.error('[resetFailedAttempts] error:', error);
  }
}

/**
 * Prüft ob ein Account gesperrt ist (aus user_metadata)
 */
export async function checkIfAccountLocked(email) {
  try {
    const user = await findAuthUserByEmail(email);
    if (!user) return false;
    const locked = !!user.user_metadata?.locked_at;
    if (locked) {
      console.log(`[checkIfAccountLocked] ${email} ist GESPERRT seit`, user.user_metadata.locked_at);
    }
    return locked;
  } catch (error) {
    console.error('[checkIfAccountLocked] error:', error);
    return false;
  }
}

/**
 * Löscht einen Supabase-User komplett (Auth + Link)
 */
export async function deleteSupabaseAccount(discordUserId) {
  const supabaseAdmin = await getSupabaseAdmin();
  const link = await getLinkByDiscordId(discordUserId);
  if (!link) throw new Error('ACCOUNT_NOT_FOUND');

  // 1. Auth-User löschen (CASCADE löscht automatisch den Link)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(link.supabase_user_id);
  if (error) throw error;

  return { success: true };
}
