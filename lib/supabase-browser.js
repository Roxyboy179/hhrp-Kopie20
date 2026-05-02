'use client';

import { createClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client (public anon key).
 * Wird ausschließlich client-seitig verwendet – z. B. für Realtime-Subscriptions
 * auf postgres_changes, damit Änderungen an der user_data-Tabelle sofort im UI
 * sichtbar werden, ohne Neuladen.
 *
 * WICHTIG: Damit die Realtime-Events kommen, muss in Supabase unter
 * Database → Replication die Tabelle `user_data` für `supabase_realtime`
 * aktiviert sein.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client = null;

export function getSupabaseBrowser() {
  if (typeof window === 'undefined') return null;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[supabase-browser] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return null;
  }
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 5,
        },
      },
    });
  }
  return _client;
}

export default getSupabaseBrowser;
