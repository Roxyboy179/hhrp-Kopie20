-- ============================================
-- 🔍 SCHRITT 1: PRÜFEN WAS IN DER DATENBANK IST
-- ============================================
-- Führe dieses SQL zuerst aus um zu sehen was aktuell in der DB steht!

SELECT 
  id,
  mitarbeiter_nummer,
  email,
  discord_username,
  password_hash,
  role_name,
  is_active,
  created_at
FROM admin_accounts
WHERE mitarbeiter_nummer = 'MA-001';

-- ============================================
-- 🗑️ SCHRITT 2: ALTEN ACCOUNT KOMPLETT LÖSCHEN
-- ============================================
-- Wenn oben ein Account angezeigt wird, lösche ihn:

DELETE FROM admin_accounts WHERE mitarbeiter_nummer = 'MA-001';

-- ============================================
-- ➕ SCHRITT 3: NEUEN ACCOUNT MIT KLARTEXT ERSTELLEN
-- ============================================
-- WICHTIG: discord_username muss KLEIN geschrieben sein!

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
-- ✅ SCHRITT 4: VERIFICATION
-- ============================================
-- Prüfe ob der Account richtig angelegt wurde:

SELECT 
  mitarbeiter_nummer,
  email,
  discord_username,
  password_hash,
  is_active,
  role_name
FROM admin_accounts
WHERE mitarbeiter_nummer = 'MA-001';

-- ============================================
-- ERWARTETES ERGEBNIS:
-- ============================================
-- mitarbeiter_nummer: MA-001
-- email: roxyboy2474@icloud.com
-- discord_username: roxyboy2474 (ALLES KLEIN!)
-- password_hash: Joellading1202 (KLARTEXT, KEIN $2b$...)
-- is_active: true
-- role_name: Projektinhaber
-- ============================================

-- ============================================
-- 🎯 LOGIN-DATEN ZUM TESTEN:
-- ============================================
-- Nach diesem SQL kannst du dich einloggen mit:
--
-- Mitarbeiter-Nummer: MA-001
-- E-Mail/Username: roxyboy2474 ODER Roxyboy2474 ODER roxyboy2474@icloud.com
-- Passwort: Joellading1202
-- ============================================
