import { supabaseAdmin } from './supabase';
import { RT } from './realtime-bus';

// Log-Typen Definition
export const LOG_ACTIONS = {
  // User Aktionen
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  BEWERBUNG_EINGEREICHT: 'BEWERBUNG_EINGEREICHT',
  BEWERBUNG_ZURÜCKGEZOGEN: 'BEWERBUNG_ZURÜCKGEZOGEN',
  
  // Admin Aktionen
  BEWERBUNG_STATUS_GEÄNDERT: 'BEWERBUNG_STATUS_GEÄNDERT',
  BEWERBUNG_GELÖSCHT: 'BEWERBUNG_GELÖSCHT',
  BEWERBUNG_SETTINGS_GEÄNDERT: 'BEWERBUNG_SETTINGS_GEÄNDERT',
  ADMIN_ACCOUNT_ERSTELLT: 'ADMIN_ACCOUNT_ERSTELLT',
  ADMIN_ACCOUNT_GELÖSCHT: 'ADMIN_ACCOUNT_GELÖSCHT',
  ADMIN_ACCOUNT_DEAKTIVIERT: 'ADMIN_ACCOUNT_DEAKTIVIERT',
  ADMIN_ACCOUNT_AKTIVIERT: 'ADMIN_ACCOUNT_AKTIVIERT',
  PASSWORT_GEÄNDERT: 'PASSWORT_GEÄNDERT',
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  ADMIN_LOGOUT: 'ADMIN_LOGOUT',
};

// Haupt-Logging-Funktion
export async function logActivity({
  actionType,
  userId,
  username,
  targetUserId = null,
  targetUsername = null,
  bewerbungId = null,
  details = {},
  ipAddress = null,
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        action_type: actionType,
        user_id: userId,
        username: username,
        target_user_id: targetUserId,
        target_username: targetUsername,
        bewerbung_id: bewerbungId,
        details: details,
        ip_address: ipAddress,
      });

    if (error) {
      console.error('Fehler beim Logging:', error);
      return { success: false, error };
    }

    // Realtime → Admin-Logs live updaten
    try {
      RT.logCreated({
        actionType,
        userId,
        username,
        targetUserId,
        targetUsername,
        bewerbungId,
        createdAt: new Date().toISOString(),
      });
    } catch (e) { /* noop */ }

    return { success: true, data };
  } catch (err) {
    console.error('Fehler beim Logging:', err);
    return { success: false, error: err.message };
  }
}

// Cleanup-Funktion: Löscht Logs die älter als 60 Tage sind
export async function cleanupOldLogs() {
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .delete()
      .lt('created_at', sixtyDaysAgo.toISOString());

    if (error) {
      console.error('Fehler beim Cleanup alter Logs:', error);
      return { success: false, error };
    }

    console.log(`✅ Alte Logs gelöscht (älter als 60 Tage)`);
    return { success: true, deletedCount: data?.length || 0 };
  } catch (err) {
    console.error('Fehler beim Cleanup:', err);
    return { success: false, error: err.message };
  }
}

// Logs abrufen mit Filter & Pagination
export async function getLogs({
  page = 1,
  limit = 50,
  actionType = null,
  userId = null,
  bewerbungId = null,
  startDate = null,
  endDate = null,
}) {
  try {
    let query = supabaseAdmin
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filter anwenden
    if (actionType) {
      query = query.eq('action_type', actionType);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (bewerbungId) {
      query = query.eq('bewerbung_id', bewerbungId);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Fehler beim Abrufen der Logs:', error);
      return { success: false, error };
    }

    return {
      success: true,
      logs: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  } catch (err) {
    console.error('Fehler beim Abrufen der Logs:', err);
    return { success: false, error: err.message };
  }
}

// Helper: IP-Adresse aus Request extrahieren
export function getIpAddress(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIp || 'unknown';
}

