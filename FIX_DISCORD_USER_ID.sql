-- ============================================
-- 🔥 KRITISCHER FIX - DISCORD USER ID KORRIGIEREN
-- ============================================

-- PROBLEM: discord_user_id ist "roxyboy2474" (Username)
-- MUSS SEIN: discord_user_id ist "1059408423726362695" (Numerische ID)

-- ============================================
-- FIX: Discord User ID korrigieren
-- ============================================

UPDATE admin_accounts
SET discord_user_id = '1059408423726362695'
WHERE mitarbeiter_nummer = 'MA-001';

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
  mitarbeiter_nummer,
  discord_user_id,
  discord_username,
  email,
  password_hash,
  is_active
FROM admin_accounts
WHERE mitarbeiter_nummer = 'MA-001';

-- ============================================
-- ERWARTETES ERGEBNIS:
-- ============================================
-- mitarbeiter_nummer: MA-001
-- discord_user_id: 1059408423726362695 (LANGE ZAHL!)
-- discord_username: roxyboy2474
-- email: roxyboy2474@icloud.com
-- password_hash: Joellading1202
-- is_active: true
-- ============================================

-- ============================================
-- WIE FINDE ICH MEINE DISCORD USER ID?
-- ============================================
-- Methode 1: Discord Developer Mode
-- 1. Discord öffnen
-- 2. Einstellungen → Erweitert → Entwicklermodus aktivieren
-- 3. Rechtsklick auf deinen Namen → Benutzer-ID kopieren
--
-- Methode 2: Online Tool
-- https://discord.id/
-- 
-- Methode 3: Im Discord selber
-- Schreibe: \@deinusername in einem Chat
-- Die ID wird angezeigt
-- ============================================
