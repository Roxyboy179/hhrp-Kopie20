-- ─────────────────────────────────────────────────────────────────────
-- HHRP Voice Support – Supabase Tabelle
-- Einmal in Supabase SQL Editor ausführen
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.voice_support_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User der den Support angefordert hat
  user_id        TEXT NOT NULL,
  user_name      TEXT,
  user_avatar    TEXT,

  -- Grund/Beschreibung
  reason         TEXT,

  -- Status: 'waiting' | 'active' | 'ended'
  status         TEXT NOT NULL DEFAULT 'waiting',

  -- Supporter (Admin)
  supporter_id          TEXT,
  supporter_name        TEXT,
  supporter_avatar      TEXT,

  -- Admin-Notizen (vom Supporter editierbar)
  notes          TEXT,

  -- Heartbeats: gibt an, ob die Seite noch offen ist
  user_heartbeat       TIMESTAMPTZ DEFAULT NOW(),
  supporter_heartbeat  TIMESTAMPTZ,

  -- Webhook-Tracking
  webhook_message_id   TEXT,

  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  ended_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS voice_support_sessions_user_id_idx ON public.voice_support_sessions (user_id);
CREATE INDEX IF NOT EXISTS voice_support_sessions_status_idx  ON public.voice_support_sessions (status);
CREATE INDEX IF NOT EXISTS voice_support_sessions_created_idx ON public.voice_support_sessions (created_at DESC);

-- RLS aus, weil wir alles serverseitig mit service_role machen
ALTER TABLE public.voice_support_sessions DISABLE ROW LEVEL SECURITY;

-- Realtime aktivieren (für Live-Updates ohne Reload)
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_support_sessions;
ALTER TABLE public.voice_support_sessions REPLICA IDENTITY FULL;

-- Bestätigen
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'voice_support_sessions';
