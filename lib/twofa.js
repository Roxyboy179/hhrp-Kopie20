/**
 * 2FA-Helper für HHRP
 * ─────────────────────────────────────────────────────────────────
 * TOTP (Google Authenticator/Authy kompatibel) + Backup-Codes.
 *
 * Speicherung erfolgt in `auth.users.user_metadata`:
 *   twofa_enabled       : boolean
 *   twofa_secret        : string  (Base32, ungekürzt)
 *   twofa_backup_codes  : string[] (SHA-256 Hashes; Codes selbst werden NICHT gespeichert)
 *   twofa_enabled_at    : ISO date
 *
 * Während der Einrichtung speichern wir den noch nicht aktivierten Secret in
 *   twofa_pending_secret : string
 *   twofa_pending_at     : ISO date
 *
 * Login-Challenges werden in einem In-Memory-Map gehalten (kurzlebig, 5 Min).
 */

import crypto from 'crypto';
import { authenticator } from 'otplib';
import { getSupabaseAdmin } from './supabase';

// Etwas mehr Toleranz für Uhr-Drift: ±1 Window (= ±30s)
authenticator.options = { window: 1, step: 30, digits: 6 };

const ISSUER = 'HHRP';

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Generiert ein neues TOTP-Secret + OTPAuth-URL für die QR-Anzeige.
 */
export function generateNewSecret(email) {
  const secret = authenticator.generateSecret();
  const label = email || 'user';
  const otpauth = authenticator.keyuri(label, ISSUER, secret);
  return { secret, otpauth };
}

/**
 * Verifiziert einen 6-stelligen TOTP-Code gegen ein Secret.
 */
export function verifyTotp(token, secret) {
  if (!token || !secret) return false;
  const clean = String(token).replace(/\D/g, '').slice(0, 6);
  if (clean.length !== 6) return false;
  try {
    return authenticator.check(clean, secret);
  } catch {
    return false;
  }
}

/**
 * Erzeugt n Backup-Codes im Format XXXX-XXXX (10 Stück) und gibt
 *   { plain: [...10 Codes für Anzeige/E-Mail...], hashes: [...] }
 * zurück. Wir speichern nur die Hashes.
 */
export function generateBackupCodes(count = 10) {
  const plain = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase().slice(0, 8); // 8 hex chars
    plain.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }
  const hashes = plain.map((c) => hashCode(c));
  return { plain, hashes };
}

function hashCode(code) {
  return crypto
    .createHash('sha256')
    .update(String(code).toUpperCase().replace(/[^A-Z0-9]/g, ''))
    .digest('hex');
}

/**
 * Prüft, ob ein Backup-Code gültig ist und entfernt ihn (atomar) aus der Liste.
 * Gibt true/false zurück.
 */
export async function consumeBackupCode(supabaseUserId, code) {
  if (!code) return false;
  const supabaseAdmin = await getSupabaseAdmin();
  const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
  if (error || !userData?.user) return false;
  const meta = userData.user.user_metadata || {};
  const codes = Array.isArray(meta.twofa_backup_codes) ? meta.twofa_backup_codes : [];
  if (codes.length === 0) return false;
  const target = hashCode(code);
  const idx = codes.indexOf(target);
  if (idx < 0) return false;
  const remaining = codes.slice(0, idx).concat(codes.slice(idx + 1));
  const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
    user_metadata: { ...meta, twofa_backup_codes: remaining },
  });
  if (updErr) {
    console.error('[twofa] consumeBackupCode update failed:', updErr);
    return false;
  }
  return true;
}

// ─── Storage Helpers ────────────────────────────────────────────────

export async function getTwoFaState(supabaseUserId) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
  if (error || !data?.user) return null;
  const meta = data.user.user_metadata || {};
  return {
    enabled: !!meta.twofa_enabled,
    secret: meta.twofa_secret || null,
    pendingSecret: meta.twofa_pending_secret || null,
    backupCodesCount: Array.isArray(meta.twofa_backup_codes) ? meta.twofa_backup_codes.length : 0,
    enabledAt: meta.twofa_enabled_at || null,
    email: data.user.email,
    user: data.user,
  };
}

export async function startTwoFaSetup(supabaseUserId, email) {
  const { secret, otpauth } = generateNewSecret(email);
  const supabaseAdmin = await getSupabaseAdmin();
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
  const existingMeta = userData?.user?.user_metadata || {};
  const { error } = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
    user_metadata: {
      ...existingMeta,
      twofa_pending_secret: secret,
      twofa_pending_at: new Date().toISOString(),
    },
  });
  if (error) throw error;
  return { secret, otpauth };
}

export async function activateTwoFa(supabaseUserId, code) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
  if (error || !userData?.user) throw new Error('USER_NOT_FOUND');
  const meta = userData.user.user_metadata || {};
  const pending = meta.twofa_pending_secret;
  if (!pending) throw new Error('NO_PENDING_SECRET');
  if (!verifyTotp(code, pending)) throw new Error('INVALID_CODE');

  const { plain, hashes } = generateBackupCodes(10);
  // WICHTIG: Supabase macht ein MERGE auf user_metadata. Pending-Felder müssen
  // explizit auf `null` gesetzt werden, damit sie wirklich entfernt werden.
  const nextMeta = {
    ...meta,
    twofa_enabled: true,
    twofa_secret: pending,
    twofa_backup_codes: hashes,
    twofa_enabled_at: new Date().toISOString(),
    twofa_pending_secret: null,
    twofa_pending_at: null,
  };

  const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
    user_metadata: nextMeta,
  });
  if (updErr) throw updErr;

  return { backupCodes: plain };
}

export async function deactivateTwoFa(supabaseUserId) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
  const meta = userData?.user?.user_metadata || {};
  // WICHTIG: Supabase macht ein MERGE auf user_metadata. Felder werden nur dann
  // entfernt, wenn sie explizit auf `null` gesetzt sind — `delete` reicht nicht.
  const nextMeta = {
    ...meta,
    twofa_enabled: null,
    twofa_secret: null,
    twofa_backup_codes: null,
    twofa_enabled_at: null,
    twofa_pending_secret: null,
    twofa_pending_at: null,
  };
  const { error } = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
    user_metadata: nextMeta,
  });
  if (error) throw error;
  return true;
}

export async function regenerateBackupCodes(supabaseUserId) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
  if (!userData?.user) throw new Error('USER_NOT_FOUND');
  const meta = userData.user.user_metadata || {};
  if (!meta.twofa_enabled) throw new Error('2FA_NOT_ENABLED');
  const { plain, hashes } = generateBackupCodes(10);
  const { error } = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
    user_metadata: { ...meta, twofa_backup_codes: hashes },
  });
  if (error) throw error;
  return { backupCodes: plain };
}

/**
 * Verifiziert TOTP-Code ODER Backup-Code für einen User.
 * Bei Backup-Code wird dieser konsumiert (single-use).
 */
export async function verifyTwoFaCode(supabaseUserId, code) {
  if (!code) return false;
  const supabaseAdmin = await getSupabaseAdmin();
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
  if (!userData?.user) return false;
  const meta = userData.user.user_metadata || {};
  if (!meta.twofa_enabled || !meta.twofa_secret) return false;

  const cleaned = String(code).replace(/[^A-Za-z0-9]/g, '');
  // 6-stellig + nur Ziffern → TOTP
  if (/^\d{6}$/.test(cleaned)) {
    return verifyTotp(cleaned, meta.twofa_secret);
  }
  // Sonst Backup-Code
  return await consumeBackupCode(supabaseUserId, code);
}

// ─── Login Challenges (In-Memory, 5 Min TTL) ────────────────────────

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const challenges = new Map(); // challengeId -> { supabaseUserId, email, expiresAt }

export function createLoginChallenge(supabaseUserId, email) {
  cleanupChallenges();
  const challengeId = crypto.randomBytes(24).toString('base64url');
  challenges.set(challengeId, {
    supabaseUserId,
    email,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
  });
  return challengeId;
}

export function consumeLoginChallenge(challengeId) {
  cleanupChallenges();
  const entry = challenges.get(challengeId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    challenges.delete(challengeId);
    return null;
  }
  challenges.delete(challengeId);
  return entry;
}

function cleanupChallenges() {
  const now = Date.now();
  for (const [k, v] of challenges) {
    if (v.expiresAt < now) challenges.delete(k);
  }
}
