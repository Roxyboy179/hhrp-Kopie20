-- ============================================
-- ADMIN-ACCOUNT ERSTELLEN (MA-001)
-- ============================================
-- WICHTIG: Dieses SQL im Supabase SQL Editor ausführen!

-- Login-Daten:
-- Mitarbeiter-Nummer: MA-001
-- E-Mail: roxyboy2474@icloud.com
-- Passwort: HHRP2025!Temp

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
  'Roxyboy2474',
  'MA-001',
  'roxyboy2474@icloud.com',
  '$2b$10$L4IAyFt/LiyijXsk3142DO1cLRAr0bpgKqs60ODkQ2fKsduNqBz/q',
  'Projektinhaber',
  'system',
  true
)
ON CONFLICT (discord_user_id) DO UPDATE
SET password_hash = '$2b$10$L4IAyFt/LiyijXsk3142DO1cLRAr0bpgKqs60ODkQ2fKsduNqBz/q';

-- ============================================
-- Wenn der Account bereits existiert, Update:
-- ============================================
UPDATE admin_accounts 
SET password_hash = '$2b$10$L4IAyFt/LiyijXsk3142DO1cLRAr0bpgKqs60ODkQ2fKsduNqBz/q'
WHERE mitarbeiter_nummer = 'MA-001';

-- ============================================
-- Login-Daten:
-- ============================================
-- Mitarbeiter-Nummer: MA-001
-- E-Mail: roxyboy2474@icloud.com
-- Passwort: HHRP2025!Temp
-- ============================================
