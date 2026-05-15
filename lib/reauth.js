/**
 * Reauthentication via Email-OTP
 * ────────────────────────────────────────────────────────────────
 * Wenn ein Account nach 3 fehlgeschlagenen Login-Versuchen gesperrt
 * wurde, kann der User über einen 6-stelligen Code per E-Mail
 * seine Identität bestätigen und den Account wieder freischalten.
 *
 * Speicherung in user_metadata:
 *   reauth_otp_hash         : sha256 hex
 *   reauth_otp_expires_at   : ISO date (15 Min Gültigkeit)
 *   reauth_otp_attempts     : number (max 5 Verify-Versuche)
 *   reauth_last_sent_at     : ISO date (Rate-Limit, 60s zwischen Mails)
 */

import crypto from 'crypto';
import { getSupabaseAdmin } from './supabase';
import { resetFailedAttempts } from './supabase-auth';

const OTP_TTL_MS = 15 * 60 * 1000; // 15 min
const OTP_MIN_INTERVAL_MS = 60 * 1000; // 60s zwischen Mails
const OTP_MAX_VERIFY_ATTEMPTS = 5;

function hashOtp(code) {
  return crypto
    .createHash('sha256')
    .update(String(code).trim())
    .digest('hex');
}

function generateNumericOtp(length = 6) {
  let s = '';
  while (s.length < length) {
    s += crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  }
  return s.slice(0, length);
}

/**
 * Findet User by Email via Supabase Admin. Gibt null zurück wenn nicht vorhanden.
 */
async function findUserByEmail(email) {
  const supabaseAdmin = await getSupabaseAdmin();
  // Workaround: kein direkter getByEmail in der Admin API → listUsers + filter
  // Wir verwenden den effizienteren Weg mit Filter über die internen Methoden.
  let page = 1;
  while (page <= 5) { // max 5 Seiten (1000 User pro Seite)
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error('[reauth] listUsers error:', error);
      return null;
    }
    const found = data?.users?.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (!data?.users || data.users.length < 1000) break;
    page++;
  }
  return null;
}

/**
 * Erzeugt einen neuen OTP, speichert hash + expiry und gibt den Klartext-Code
 * zurück (für die E-Mail). Bei Rate-Limit gibt es null zurück.
 *
 * @returns {Promise<{ code: string|null, alreadySentRecently: boolean, userExists: boolean, locked: boolean }>}
 */
export async function createReauthOtp(email) {
  const cleanEmail = String(email || '').toLowerCase().trim();
  if (!cleanEmail) return { code: null, alreadySentRecently: false, userExists: false, locked: false };

  const user = await findUserByEmail(cleanEmail);
  if (!user) {
    // Wir geben null zurück, der Caller schickt aber eine generische Erfolgsmeldung
    // (Anti-Enumeration). userExists:false ist nur für interne Logs.
    return { code: null, alreadySentRecently: false, userExists: false, locked: false };
  }

  const meta = user.user_metadata || {};
  const locked = !!meta.locked_at;

  // Rate-Limit: max 1 Mail pro 60s
  const lastSent = meta.reauth_last_sent_at ? new Date(meta.reauth_last_sent_at).getTime() : 0;
  if (Date.now() - lastSent < OTP_MIN_INTERVAL_MS) {
    return { code: null, alreadySentRecently: true, userExists: true, locked };
  }

  const code = generateNumericOtp(6);
  const supabaseAdmin = await getSupabaseAdmin();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...meta,
      reauth_otp_hash: hashOtp(code),
      reauth_otp_expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      reauth_otp_attempts: 0,
      reauth_last_sent_at: new Date().toISOString(),
    },
  });
  if (error) {
    console.error('[reauth] updateUserById error:', error);
    return { code: null, alreadySentRecently: false, userExists: true, locked };
  }

  return { code, alreadySentRecently: false, userExists: true, locked };
}

/**
 * Verifiziert einen OTP. Bei Erfolg wird das OTP entfernt UND die
 * Account-Sperre aufgehoben (failed_login_attempts → 0, locked_at → null).
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   reason?: 'NOT_FOUND'|'NO_OTP'|'EXPIRED'|'TOO_MANY_ATTEMPTS'|'INVALID',
 *   attemptsLeft?: number,
 *   email?: string
 * }>}
 */
export async function verifyReauthOtp(email, code) {
  const cleanEmail = String(email || '').toLowerCase().trim();
  if (!cleanEmail || !code) return { ok: false, reason: 'NOT_FOUND' };

  const user = await findUserByEmail(cleanEmail);
  if (!user) return { ok: false, reason: 'NOT_FOUND' };

  const meta = user.user_metadata || {};
  if (!meta.reauth_otp_hash || !meta.reauth_otp_expires_at) {
    return { ok: false, reason: 'NO_OTP' };
  }

  if (new Date(meta.reauth_otp_expires_at).getTime() < Date.now()) {
    // OTP abgelaufen → räumen wir auf
    const supabaseAdmin = await getSupabaseAdmin();
    const next = { ...meta };
    delete next.reauth_otp_hash;
    delete next.reauth_otp_expires_at;
    delete next.reauth_otp_attempts;
    await supabaseAdmin.auth.admin.updateUserById(user.id, { user_metadata: next });
    return { ok: false, reason: 'EXPIRED' };
  }

  const attempts = Number(meta.reauth_otp_attempts || 0);
  if (attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
    return { ok: false, reason: 'TOO_MANY_ATTEMPTS' };
  }

  const supabaseAdmin = await getSupabaseAdmin();
  const submitted = hashOtp(code);

  if (submitted !== meta.reauth_otp_hash) {
    const attemptsLeft = OTP_MAX_VERIFY_ATTEMPTS - (attempts + 1);
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...meta, reauth_otp_attempts: attempts + 1 },
    });
    return { ok: false, reason: 'INVALID', attemptsLeft: Math.max(attemptsLeft, 0) };
  }

  // Erfolg → OTP entfernen + Account entsperren (in user_metadata UND user_auth_links)
  const next = { ...meta };
  delete next.reauth_otp_hash;
  delete next.reauth_otp_expires_at;
  delete next.reauth_otp_attempts;
  delete next.reauth_last_sent_at;

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: next,
  });
  if (error) {
    console.error('[reauth] unlock updateUserById error:', error);
    return { ok: false, reason: 'INVALID' };
  }

  // Failed attempts + lock zurücksetzen (auch in user_auth_links Tabelle)
  try {
    await resetFailedAttempts(user.email);
  } catch (e) {
    console.warn('[reauth] resetFailedAttempts failed:', e?.message || e);
  }

  return { ok: true, email: user.email };
}
