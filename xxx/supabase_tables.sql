-- ============================================
-- HAMBURG HORIZON RP - SUPABASE TABELLEN
-- ============================================

-- 1. BEWERBUNGEN TABELLE
CREATE TABLE IF NOT EXISTS bewerbungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  discord_created_at TIMESTAMPTZ,
  
  -- Bewerbungsdaten
  form_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'Eingereicht',
  
  -- Admin-Zuordnung
  claimed_by TEXT,
  claimed_by_name TEXT,
  
  -- Zeitstempel
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('Eingereicht', 'In Bearbeitung', 'Angenommen', 'Abgelehnt', 'Zurückgezogen'))
);

-- Index für schnelle Suche
CREATE INDEX IF NOT EXISTS idx_bewerbungen_discord_user_id ON bewerbungen(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_bewerbungen_status ON bewerbungen(status);
CREATE INDEX IF NOT EXISTS idx_bewerbungen_created_at ON bewerbungen(created_at DESC);

-- Echtzeit aktivieren für bewerbungen
ALTER TABLE bewerbungen REPLICA IDENTITY FULL;

-- 2. ADMIN ACCOUNTS TABELLE
CREATE TABLE IF NOT EXISTS admin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_user_id TEXT NOT NULL UNIQUE,
  discord_username TEXT,
  mitarbeiter_nummer TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  
  -- Admin-Rolle (optional, kann auch über Discord-Rollen gesteuert werden)
  role_name TEXT,
  
  -- Zeitstempel
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT DEFAULT 'system',
  
  -- Aktiv-Status
  is_active BOOLEAN DEFAULT true
);

-- Index für Login
CREATE INDEX IF NOT EXISTS idx_admin_accounts_mitarbeiter_nummer ON admin_accounts(mitarbeiter_nummer);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_email ON admin_accounts(email);

-- Echtzeit aktivieren für admin_accounts
ALTER TABLE admin_accounts REPLICA IDENTITY FULL;

-- 3. TRIGGER FÜR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bewerbungen_updated_at
  BEFORE UPDATE ON bewerbungen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. ROW LEVEL SECURITY (RLS) - Optional
-- ALTER TABLE bewerbungen ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder kann seine eigenen Bewerbungen sehen
-- CREATE POLICY "Users can view own bewerbungen"
--   ON bewerbungen FOR SELECT
--   USING (discord_user_id = auth.uid()::text);

-- Policy: Service Role kann alles
-- CREATE POLICY "Service role has full access"
--   ON bewerbungen FOR ALL
--   USING (true);

-- ============================================
-- FERTIG! Tabellen wurden erstellt.
-- ============================================
-- Nächste Schritte:
-- 1. Gehen Sie zum Supabase Dashboard
-- 2. SQL Editor öffnen
-- 3. Dieses SQL ausführen
-- 4. Database > Tables überprüfen
-- ============================================
