-- ═══════════════════════════════════════════════════════════════════════════
-- HHRP: Automatisches Leeren der Tabellen `unique_visitors` & `sent_notifications`
-- alle 5 Minuten via Supabase pg_cron
-- ═══════════════════════════════════════════════════════════════════════════
--
-- SO FÜHRST DU DAS AUS:
-- 1. Öffne dein Supabase Projekt → SQL Editor (linkes Menü)
-- 2. Klick "New query"
-- 3. Kopiere den gesamten Inhalt dieser Datei rein
-- 4. Klick "Run"
-- 5. Fertig! Ab jetzt werden beide Tabellen alle 5 Minuten geleert.
--
-- ZUM STOPPEN / ENTFERNEN des Cron-Jobs später, siehe unten "DEAKTIVIEREN".
-- ═══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- SCHRITT 1: Extensions aktivieren (einmalig, idempotent)
-- ──────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ──────────────────────────────────────────────────────────────────────────
-- SCHRITT 2: Wrapper-Funktion erstellen (TRUNCATE beider Tabellen)
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.hhrp_cleanup_tracking_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- TRUNCATE ist schneller als DELETE und setzt Auto-Increment zurück
  TRUNCATE TABLE public.unique_visitors RESTART IDENTITY;
  TRUNCATE TABLE public.sent_notifications RESTART IDENTITY;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────────
-- SCHRITT 3: Alten Cron-Job entfernen (falls bereits vorhanden) und neu anlegen
-- ──────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  job_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'hhrp-cleanup-tracking-5min'
  ) INTO job_exists;

  IF job_exists THEN
    PERFORM cron.unschedule('hhrp-cleanup-tracking-5min');
  END IF;
END $$;

-- Neuen Cron-Job einplanen: alle 5 Minuten
SELECT cron.schedule(
  'hhrp-cleanup-tracking-5min',            -- Name
  '*/5 * * * *',                           -- alle 5 Minuten
  $$SELECT public.hhrp_cleanup_tracking_tables();$$
);

-- ──────────────────────────────────────────────────────────────────────────
-- VERIFIKATION: Anzeigen, ob der Job geplant ist
-- ──────────────────────────────────────────────────────────────────────────
SELECT jobid, jobname, schedule, active, command
FROM cron.job
WHERE jobname = 'hhrp-cleanup-tracking-5min';

-- Die letzten 5 Ausführungen anzeigen (nach der ersten Ausführung verfügbar)
-- SELECT jobid, runid, status, return_message, start_time, end_time
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'hhrp-cleanup-tracking-5min')
-- ORDER BY start_time DESC LIMIT 5;


-- ═══════════════════════════════════════════════════════════════════════════
-- OPTIONAL: SOFORT MANUELL TESTEN (einmal ausführen, ohne auf Cron zu warten)
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT public.hhrp_cleanup_tracking_tables();


-- ═══════════════════════════════════════════════════════════════════════════
-- DEAKTIVIEREN (falls du den Cron-Job später stoppen willst)
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT cron.unschedule('hhrp-cleanup-tracking-5min');
-- DROP FUNCTION IF EXISTS public.hhrp_cleanup_tracking_tables();
