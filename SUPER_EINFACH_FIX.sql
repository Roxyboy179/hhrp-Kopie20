-- ============================================
-- 🔥 SUPER EINFACHES FIX - KOPIERE UND FÜHRE AUS!
-- ============================================

-- SCHRITT 1: Alles löschen
DELETE FROM admin_accounts WHERE mitarbeiter_nummer = 'MA-001';

-- SCHRITT 2: Neu erstellen (OHNE discord_user_id erstmal!)
INSERT INTO admin_accounts (
  mitarbeiter_nummer,
  discord_username,
  email,
  password_hash,
  role_name,
  is_active,
  created_by
) VALUES (
  'MA-001',
  'roxyboy2474',
  'roxyboy2474@icloud.com',
  'Joellading1202',
  'Admin',
  true,
  'system'
);

-- SCHRITT 3: Prüfen
SELECT 
  mitarbeiter_nummer,
  discord_username,
  email,
  password_hash,
  LENGTH(password_hash) as password_length,
  is_active
FROM admin_accounts
WHERE mitarbeiter_nummer = 'MA-001';

-- ============================================
-- ERWARTETES ERGEBNIS:
-- ============================================
-- mitarbeiter_nummer: MA-001
-- discord_username: roxyboy2474
-- email: roxyboy2474@icloud.com
-- password_hash: Joellading1202
-- password_length: 14
-- is_active: true
-- ============================================

-- ============================================
-- LOGIN TESTEN MIT:
-- ============================================
-- Mitarbeiter-Nummer: MA-001
-- E-Mail/Username: roxyboy2474
-- Passwort: Joellading1202
-- ============================================
