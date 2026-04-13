-- ============================================
-- ADMIN-ACCOUNT ERSTELLEN (MA-001)
-- ============================================
-- WICHTIG: Dieses SQL im Supabase SQL Editor ausführen!
-- Das Passwort MUSS nach dem ersten Login geändert werden!

-- Temporäres Passwort: HHRP2025!Temp
-- Passwort-Hash für: HHRP2025!Temp
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
  '$2a$10$rOQJvS9LQm5uJYxF8qKOXeYGJvS9LQm5uJYxF8qKOXeYGJvS9LQm5u', -- Hash für 'HHRP2025!Temp'
  'Projektinhaber',
  'system',
  true
)
ON CONFLICT (discord_user_id) DO NOTHING;

-- ============================================
-- Login-Daten:
-- ============================================
-- Mitarbeiter-Nummer: MA-001
-- E-Mail: roxyboy2474@icloud.com
-- Passwort: HHRP2025!Temp
-- 
-- WICHTIG: Ändern Sie das Passwort nach dem ersten Login!
-- ============================================

-- Optional: Weitere Admin-Accounts erstellen
-- Kopieren Sie einfach den INSERT-Block oben und ändern Sie die Werte
