// ─────────────────────────────────────────────────────────────────────
// Voice Support – Backend Helpers
// Discord Webhook + Embed + Role Ping + Auto-Cleanup
// ─────────────────────────────────────────────────────────────────────

import { supabaseAdmin } from './supabase';

const VOICE_SUPPORT_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1500198545196712166/ZcOAyAALsQDbDuZbMgOjHU63ISe2HODnqDSDGwcsZX8b0h4q4EBB4tt8v6awQg-k-BsV';
const VOICE_SUPPORT_ROLE_ID = '1273340696954273901';

// Heartbeat-TTL: Wenn ein Heartbeat älter als das ist, gilt die Person als
// offline und die Session wird automatisch beendet.
export const VOICE_SUPPORT_HEARTBEAT_TTL_MS = 30_000; // 30 Sekunden

// ─────────────────────────────────────────────────────────────────────
// Discord Webhook senden – Embed + Role Ping
// ─────────────────────────────────────────────────────────────────────
export async function sendVoiceSupportWebhook(session) {
  try {
    const embed = {
      title: '📞 Neue Voice Support Anfrage',
      description:
        `<@${session.user_id}> benötigt **Voice Support**.\n` +
        `Bitte zeitnah übernehmen!`,
      color: 0xf59e0b, // amber
      thumbnail: session.user_avatar
        ? { url: session.user_avatar }
        : undefined,
      fields: [
        {
          name: '👤 User',
          value: `${session.user_name || 'Unbekannt'}\n\`${session.user_id}\``,
          inline: true,
        },
        {
          name: '📅 Erstellt',
          value: `<t:${Math.floor(new Date(session.created_at).getTime() / 1000)}:R>`,
          inline: true,
        },
        ...(session.reason
          ? [{ name: '📝 Grund', value: session.reason.substring(0, 1000), inline: false }]
          : []),
        {
          name: '🆔 Session-ID',
          value: `\`${session.id}\``,
          inline: false,
        },
      ],
      footer: { text: 'HHRP Voice Support · Bitte über das Admin-Panel beitreten' },
      timestamp: new Date().toISOString(),
    };

    const body = {
      content: `<@&${VOICE_SUPPORT_ROLE_ID}> 🔔`,
      embeds: [embed],
      allowed_mentions: {
        roles: [VOICE_SUPPORT_ROLE_ID],
        users: [session.user_id],
      },
    };

    const res = await fetch(`${VOICE_SUPPORT_WEBHOOK_URL}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('[VoiceSupport] Webhook failed:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data?.id || null;
  } catch (e) {
    console.error('[VoiceSupport] Webhook error:', e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Webhook bei Status-Änderung updaten (claim/end)
// ─────────────────────────────────────────────────────────────────────
export async function updateVoiceSupportWebhook(session) {
  if (!session.webhook_message_id) return;

  try {
    const isEnded = session.status === 'ended';
    const isActive = session.status === 'active';

    const embed = {
      title: isEnded
        ? '✅ Voice Support beendet'
        : isActive
        ? '🟢 Voice Support aktiv'
        : '📞 Voice Support Anfrage',
      description: isEnded
        ? `Session beendet.`
        : isActive
        ? `Session läuft – <@${session.supporter_id}> betreut <@${session.user_id}>.`
        : `<@${session.user_id}> wartet auf Support.`,
      color: isEnded ? 0x6b7280 : isActive ? 0x22c55e : 0xf59e0b,
      thumbnail: session.user_avatar ? { url: session.user_avatar } : undefined,
      fields: [
        {
          name: '👤 User',
          value: `${session.user_name || 'Unbekannt'}\n\`${session.user_id}\``,
          inline: true,
        },
        ...(session.supporter_id
          ? [
              {
                name: '🛟 Supporter',
                value: `${session.supporter_name || 'Unbekannt'}\n\`${session.supporter_id}\``,
                inline: true,
              },
            ]
          : []),
        ...(session.reason
          ? [{ name: '📝 Grund', value: session.reason.substring(0, 1000), inline: false }]
          : []),
        ...(isEnded && session.ended_at
          ? [
              {
                name: '⏱️ Beendet',
                value: `<t:${Math.floor(new Date(session.ended_at).getTime() / 1000)}:R>`,
                inline: true,
              },
            ]
          : []),
      ],
      footer: { text: `Session ID: ${session.id}` },
      timestamp: new Date().toISOString(),
    };

    const body = {
      content: isEnded
        ? `~~<@&${VOICE_SUPPORT_ROLE_ID}>~~ ✅ Erledigt`
        : isActive
        ? `<@&${VOICE_SUPPORT_ROLE_ID}> – übernommen ✅`
        : `<@&${VOICE_SUPPORT_ROLE_ID}> 🔔`,
      embeds: [embed],
      allowed_mentions: { parse: [] },
    };

    const url = `${VOICE_SUPPORT_WEBHOOK_URL}/messages/${session.webhook_message_id}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('[VoiceSupport] Webhook update failed:', res.status, await res.text());
    }
  } catch (e) {
    console.error('[VoiceSupport] Webhook update error:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Auto-Cleanup: alle Sessions, deren User ODER Supporter (wenn aktiv)
// Heartbeat zu alt ist, werden beendet.
// Wird bei jedem List/Me-Call ausgeführt.
// ─────────────────────────────────────────────────────────────────────
export async function cleanupStaleSessions() {
  try {
    const cutoff = new Date(Date.now() - VOICE_SUPPORT_HEARTBEAT_TTL_MS).toISOString();

    // Hol alle aktiven/wartenden Sessions
    const { data: sessions, error } = await supabaseAdmin
      .from('voice_support_sessions')
      .select('*')
      .in('status', ['waiting', 'active']);

    if (error || !sessions) return;

    const toEnd = [];
    for (const s of sessions) {
      const userOffline = s.user_heartbeat && new Date(s.user_heartbeat).toISOString() < cutoff;

      // Supporter-Heartbeat zählt nur wenn Session aktiv
      const supporterOffline =
        s.status === 'active' &&
        s.supporter_heartbeat &&
        new Date(s.supporter_heartbeat).toISOString() < cutoff;

      if (userOffline || supporterOffline) {
        toEnd.push({ id: s.id, reason: userOffline ? 'user_left' : 'supporter_left', session: s });
      }
    }

    for (const { id, reason, session } of toEnd) {
      // Webhook updaten (best effort)
      try {
        await updateVoiceSupportWebhook({ ...session, status: 'ended', ended_at: new Date().toISOString() });
      } catch {}

      // Aus der DB LÖSCHEN (User-Anforderung)
      await supabaseAdmin.from('voice_support_sessions').delete().eq('id', id);
      console.log(`[VoiceSupport] Auto-ended & deleted session ${id} (${reason})`);
    }

    return toEnd.length;
  } catch (e) {
    console.error('[VoiceSupport] cleanup error:', e);
    return 0;
  }
}
