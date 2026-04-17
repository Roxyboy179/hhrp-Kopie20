-- ============================================
-- 🚨 KRITISCHER FIX - discord_user_id FEHLT!
-- ============================================

-- SCHRITT 1: Prüfen ob die Spalte überhaupt existiert
SELECT 
  id,
  mitarbeiter_nummer,
  discord_user_id,  -- Diese Spalte!
  discord_username,
  email,
  password_hash,
  role_name,
  is_active,
  created_at
FROM admin_accounts
WHERE mitarbeiter_nummer = 'MA-001';

-- SCHRITT 2: Falls discord_user_id NULL ist, setze sie!
-- WICHTIG: Ersetze 'DEINE_DISCORD_ID' mit deiner echten Discord User ID!
-- Beispiel: '1059408423726362695'

UPDATE admin_accounts
SET discord_user_id = 'DEINE_DISCORD_ID_HIER_EINFÜGEN'
WHERE mitarbeiter_nummer = 'MA-001';

-- SCHRITT 3: Nochmal prüfen
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
-- ERWARTETES ERGEBNIS NACH UPDATE:
-- ============================================
-- {
--   "mitarbeiter_nummer": "MA-001",
--   "discord_user_id": "1059408423726362695",  <-- MUSS HIER SEIN!
--   "discord_username": "roxyboy2474",
--   "email": "roxyboy2474@icloud.com",
--   "password_hash": "Joellading1202",
--   "is_active": true
-- }
-- ============================================

-- ============================================
-- WIE FINDE ICH MEINE DISCORD USER ID?
-- ============================================
-- Methode 1: Discord Developer Mode
-- 1. Discord öffnen
-- 2. Einstellungen (Zahnrad unten links)
-- 3. Erweitert → Entwicklermodus AKTIVIEREN
-- 4. Zurück zu Discord
-- 5. Rechtsklick auf DEINEN Namen → "Benutzer-ID kopieren"
-- 
-- Methode 2: Discord ID Lookup
-- - Gehe zu: https://discord.id/
-- - Gib deinen Tag ein: roxyboy2474
-- 
-- Methode 3: Im Chat
-- - Schreibe in einem Discord-Chat: \@roxyboy2474
-- - Die Nummer in <@123456789> ist deine ID
-- ============================================

-- ============================================
-- FALLS DIE SPALTE NICHT EXISTIERT (Fehler beim SELECT)
-- ============================================
-- Dann muss die Tabelle repariert werden:

ALTER TABLE admin_accounts
ADD COLUMN IF NOT EXISTS discord_user_id TEXT;

-- Dann nochmal SCHRITT 2 ausführen!
-- ============================================
