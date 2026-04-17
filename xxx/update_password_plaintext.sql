-- ============================================
-- ADMIN ACCOUNT KOMPLETT NEU ERSTELLEN
-- ============================================
-- Dieses SQL im Supabase SQL Editor ausführen!

-- WICHTIG: Zuerst alten Account löschen (falls vorhanden)
DELETE FROM admin_accounts WHERE mitarbeiter_nummer = 'MA-001';

-- Neuen Account mit Klartext-Passwort erstellen
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
-- VERIFICATION: Account prüfen
-- ============================================
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
-- discord_username: roxyboy2474
-- password_hash: Joellading1202 (KLARTEXT, KEIN HASH!)
-- is_active: true
-- role_name: Projektinhaber
-- ============================================

-- Login-Daten:
-- Mitarbeiter-Nummer: MA-001
-- E-Mail: roxyboy2474@icloud.com
-- Username: roxyboy2474
-- Passwort: Joellading1202
-- ============================================

