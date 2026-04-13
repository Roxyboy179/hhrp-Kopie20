-- ============================================
-- 🔥 KOMPLETTES ADMIN-ACCOUNT FIX SQL
-- ============================================
-- Kopiere dieses KOMPLETTE SQL in deinen Supabase SQL Editor!
-- Führe es Schritt für Schritt aus!

-- ============================================
-- SCHRITT 1: PRÜFEN WAS AKTUELL IN DER DB IST
-- ============================================
SELECT 
  'AKTUELLER STAND:' as info,
  id,
  mitarbeiter_nummer,
  discord_user_id,
  discord_username,
  email,
  password_hash,
  role_name,
  is_active,
  created_at
FROM admin_accounts
WHERE mitarbeiter_nummer = 'MA-001'
ORDER BY created_at DESC;

-- ============================================
-- SCHRITT 2: ALLE ALTEN MA-001 ACCOUNTS LÖSCHEN
-- ============================================
DELETE FROM admin_accounts 
WHERE mitarbeiter_nummer = 'MA-001';

-- Verification: Sollte 0 Zeilen zurückgeben
SELECT COUNT(*) as deleted_count 
FROM admin_accounts 
WHERE mitarbeiter_nummer = 'MA-001';

-- ============================================
-- SCHRITT 3: NEUEN ACCOUNT ERSTELLEN (KLARTEXT PASSWORT!)
-- ============================================
INSERT INTO admin_accounts (
  discord_user_id,
  discord_username,
  mitarbeiter_nummer,
  email,
  password_hash,
  role_name,
  created_by,
  is_active
) VALUES (
  '1059408423726362695',
  'roxyboy2474',
  'MA-001',
  'roxyboy2474@icloud.com',
  'Joellading1202',
  'Projektinhaber',
  'system',
  true
);

-- ============================================
-- SCHRITT 4: VERIFICATION - MUSS GENAU SO AUSSEHEN!
-- ============================================
SELECT 
  '✅ NEUER ACCOUNT:' as info,
  mitarbeiter_nummer,
  discord_user_id,
  discord_username,
  email,
  password_hash,
  role_name,
  is_active,
  created_at
FROM admin_accounts
WHERE mitarbeiter_nummer = 'MA-001';

-- ============================================
-- ERWARTETES ERGEBNIS:
-- ============================================
-- mitarbeiter_nummer: MA-001
-- discord_user_id: 1059408423726362695
-- discord_username: roxyboy2474 (ALLES KLEINBUCHSTABEN!)
-- email: roxyboy2474@icloud.com
-- password_hash: Joellading1202 (KLARTEXT! KEIN $2b$10$...)
-- role_name: Projektinhaber
-- is_active: true
-- ============================================

-- ============================================
-- SCHRITT 5: ALLE ADMIN ACCOUNTS ANZEIGEN
-- ============================================
SELECT 
  mitarbeiter_nummer,
  discord_username,
  email,
  LEFT(password_hash, 20) as password_preview,
  role_name,
  is_active
FROM admin_accounts
ORDER BY created_at DESC;

-- ============================================
-- 🎯 LOGIN-DATEN ZUM TESTEN:
-- ============================================
-- Nach diesem SQL kannst du dich einloggen mit:
--
-- Mitarbeiter-Nummer: MA-001
-- E-Mail/Username: roxyboy2474 (oder Roxyboy2474 oder roxyboy2474@icloud.com)
-- Passwort: Joellading1202
--
-- WICHTIG: Passwort EXAKT so eingeben, Case-Sensitive!
-- ============================================

-- ============================================
-- 🔍 DEBUG: Falls Login immer noch nicht geht
-- ============================================
-- Führe dies aus um zu sehen was die App sieht:
SELECT 
  mitarbeiter_nummer,
  discord_username,
  email,
  password_hash,
  LENGTH(password_hash) as password_length,
  is_active
FROM admin_accounts
WHERE mitarbeiter_nummer = 'MA-001';

-- ERWARTETE WERTE:
-- password_hash: Joellading1202
-- password_length: 14
-- is_active: true
-- ============================================
