-- ============================================
-- PASSWORT AUF KLARTEXT ÄNDERN (OHNE HASH)
-- ============================================
-- Dieses SQL im Supabase SQL Editor ausführen!

-- Login-Daten:
-- Mitarbeiter-Nummer: MA-001
-- E-Mail: roxyboy2474@icloud.com
-- Passwort: Joellading1202

UPDATE admin_accounts 
SET password_hash = 'Joellading1202'
WHERE mitarbeiter_nummer = 'MA-001';

-- ============================================
-- VERIFICATION: Account prüfen
-- ============================================
SELECT 
  mitarbeiter_nummer,
  email,
  discord_username,
  password_hash,
  is_active
FROM admin_accounts
WHERE mitarbeiter_nummer = 'MA-001';
