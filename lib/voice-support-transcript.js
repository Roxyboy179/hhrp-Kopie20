// ─────────────────────────────────────────────────────────────────────
// Voice Support Transcript – HTML Builder
//
// Nimmt eine Voice-Support-Session und rendert ein hübsches
// Apple-Glass/Discord-Style HTML-Transkript, das als Attachment an den
// Discord-Webhook gesendet wird.
// ─────────────────────────────────────────────────────────────────────

const SERVER_NAME = 'Hamburg Horizon RP';
const SERVER_ICON = 'https://cdn.discordapp.com/icons/1273340696954273877/4f7e7e3e6e7e7e3e6e7e7e3e.png'; // Fallback - wird notfalls ausgeblendet
const BOT_NAME = 'HHRP Voice Support';

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateDE(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('de-DE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return '—';
  const s = Math.floor((new Date(endIso) - new Date(startIso)) / 1000);
  if (isNaN(s) || s < 0) return '—';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d > 0) parts.push(`${d} Tag${d !== 1 ? 'e' : ''}`);
  if (h > 0) parts.push(`${h} Std.`);
  if (m > 0) parts.push(`${m} Min.`);
  if (sec > 0 && d === 0) parts.push(`${sec} Sek.`);
  return parts.length ? parts.join(' ') : '< 1 Sek.';
}

function discordAvatar(userId, avatarHash) {
  if (userId && avatarHash) {
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=128`;
  }
  if (userId) {
    const idx = Number(BigInt(userId) % 5n);
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  }
  return '';
}

// ─── Message Renderer ───
function renderMessage(msg) {
  const authorColor = msg.isStaff ? 'is-staff' : msg.isTicketCreator ? 'is-creator' : msg.isBot ? 'is-bot' : '';
  const badges = [];
  if (msg.isBot) {
    badges.push(`<span class="badge badge-bot">🤖 Bot</span>`);
  }
  if (msg.isStaff && !msg.isBot) {
    badges.push(`<span class="badge badge-staff">🛡 Team</span>`);
  }
  if (msg.isTicketCreator) {
    badges.push(`<span class="badge badge-creator">👤 Ersteller</span>`);
  }

  const embedsHtml = (msg.embeds || []).map((embed) => {
    const color = embed.color || 'blue';
    const authorRow = embed.author
      ? `<div class="embed-author-row">${embed.author.iconUrl ? `<img class="embed-author-icon" src="${escapeHtml(embed.author.iconUrl)}" alt="">` : ''}<span class="embed-author-name">${escapeHtml(embed.author.name)}</span></div>`
      : '';
    const title = embed.title
      ? `<div class="embed-title">${escapeHtml(embed.title)}</div>`
      : '';
    const desc = embed.description
      ? `<div class="embed-desc">${escapeHtml(embed.description)}</div>`
      : '';
    const fields = embed.fields && embed.fields.length
      ? `<div class="embed-fields">${embed.fields.map((f) => `<div class="embed-field${f.inline ? ' inline' : ''}"><div class="embed-field-name">${escapeHtml(f.name)}</div><div class="embed-field-value">${escapeHtml(f.value)}</div></div>`).join('')}</div>`
      : '';
    const footer = embed.footer
      ? `<div class="embed-footer-row"><span class="embed-footer-text">${escapeHtml(embed.footer.text)}</span></div>`
      : '';
    return `<div class="embed c-${color}">${authorRow}${title}${desc}${fields}${footer}</div>`;
  }).join('');

  return `
    <div class="message ${authorColor}">
      <div class="msg-avatar">
        ${msg.avatar ? `<img src="${escapeHtml(msg.avatar)}" alt="${escapeHtml(msg.author)}" onerror="this.style.display='none'">` : ''}
      </div>
      <div class="msg-body">
        <div class="msg-meta">
          <span class="msg-author">${escapeHtml(msg.author)}</span>
          ${badges.join('')}
          <span class="msg-time">🕐 ${formatDateDE(msg.timestamp)}</span>
        </div>
        ${msg.content ? `<div class="msg-text">${escapeHtml(msg.content)}</div>` : ''}
        ${embedsHtml}
      </div>
    </div>
  `;
}

// ─── Hauptfunktion: Build HTML ───
export function buildVoiceSupportTranscriptHtml(session, opts = {}) {
  const {
    serverName = SERVER_NAME,
    serverIcon = SERVER_ICON,
    botName = BOT_NAME,
  } = opts;

  const createdAt = session.created_at;
  const endedAt = session.ended_at || new Date().toISOString();
  const claimedAt = session.claimed_at || session.updated_at || null;
  const duration = formatDuration(createdAt, endedAt);

  // Timeline-Messages zusammenbauen (simulieren das Chat-Transkript)
  const messages = [];

  // 1) User erstellt Session
  messages.push({
    author: session.user_name || 'Unbekannt',
    avatar: session.user_avatar,
    timestamp: createdAt,
    isTicketCreator: true,
    content: session.reason
      ? `📞 Voice Support angefragt:\n\n${session.reason}`
      : '📞 Voice Support angefragt (ohne Begründung).',
  });

  // 2) Bot: Support Ping
  messages.push({
    author: botName,
    avatar: null,
    timestamp: createdAt,
    isBot: true,
    embeds: [{
      color: 'orange',
      title: '🔔 Support-Team benachrichtigt',
      description: 'Das Voice-Support-Team wurde informiert. Bitte habe einen Moment Geduld, während sich ein Supporter für dich Zeit nimmt.',
      fields: [
        { name: 'Status', value: 'Wartend', inline: true },
        { name: 'Session-ID', value: `\`${session.id}\``, inline: true },
      ],
    }],
  });

  // 3) Supporter übernommen (falls vorhanden)
  if (session.supporter_id && claimedAt) {
    messages.push({
      author: botName,
      avatar: null,
      timestamp: claimedAt,
      isBot: true,
      embeds: [{
        color: 'green',
        title: '✅ Session übernommen',
        description: `**${session.supporter_name || 'Ein Supporter'}** hat die Session übernommen und spricht nun mit dem User per Voice.`,
        fields: [
          { name: 'Supporter', value: session.supporter_name || 'Unbekannt', inline: true },
          { name: 'Supporter-ID', value: `\`${session.supporter_id}\``, inline: true },
        ],
      }],
    });
  }

  // 4) Notizen vom Supporter
  if (session.notes && session.notes.trim()) {
    messages.push({
      author: session.supporter_name || 'Supporter',
      avatar: session.supporter_avatar,
      timestamp: claimedAt || createdAt,
      isStaff: true,
      content: `📝 Notizen:\n\n${session.notes}`,
    });
  }

  // 5) Session beendet
  messages.push({
    author: botName,
    avatar: null,
    timestamp: endedAt,
    isBot: true,
    embeds: [{
      color: 'red',
      title: '🔒 Voice Support beendet',
      description: `Die Session wurde beendet.\n\n**Dauer:** ${duration}`,
      fields: [
        { name: 'Beendet am', value: formatDateDE(endedAt), inline: true },
        { name: 'Dauer', value: duration, inline: true },
      ],
    }],
  });

  const messageList = messages.map((m) => ({ ...m, attachments: [] }));
  const messageCount = messageList.length;

  const ticket = {
    id: session.id,
    typeName: 'Voice Support',
    categoryName: 'Audio-Support',
    subject: session.reason ? session.reason.substring(0, 100) : 'Voice Support Anfrage',
    createdAt: createdAt,
    closedAt: endedAt,
    userTag: `${session.user_name || 'Unbekannt'} (${session.user_id})`,
    claimedByTag: session.supporter_id
      ? `${session.supporter_name || 'Unbekannt'} (${session.supporter_id})`
      : null,
    closedByTag: session.supporter_id
      ? `${session.supporter_name || 'Unbekannt'} (${session.supporter_id})`
      : `${session.user_name || 'User'} (${session.user_id})`,
  };

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice Support Transcript – ${escapeHtml(ticket.id)}</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --bg: #070d1c; --surface: #0c1528;
            --border: rgba(59,130,246,0.14); --border-mid: rgba(59,130,246,0.25);
            --blue-1: #1d4ed8; --blue-2: #3b82f6; --blue-3: #60a5fa; --blue-4: #93c5fd;
            --teal: #0ea5e9; --green: #6ee7b7; --red: #fca5a5;
            --text-1: #ffffff; --text-2: rgba(255,255,255,0.72);
            --text-3: rgba(255,255,255,0.42); --text-4: rgba(255,255,255,0.20);
            --r-sm: 8px; --r-md: 12px; --r-lg: 18px; --r-xl: 24px;
        }
        body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text-1); min-height: 100vh; overflow-x: hidden; }
        body::before {
            content: ''; position: fixed; inset: 0; z-index: 0;
            background:
                radial-gradient(ellipse 60% 50% at 80% 10%, rgba(29,78,216,0.18) 0%, transparent 70%),
                radial-gradient(ellipse 40% 40% at 10% 80%, rgba(14,165,233,0.12) 0%, transparent 70%),
                radial-gradient(ellipse 30% 30% at 60% 90%, rgba(59,130,246,0.08) 0%, transparent 70%);
            pointer-events: none;
        }
        .page { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 24px 16px 100px; }
        .top-bar { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; padding: 14px 20px; background: rgba(12,21,40,0.85); border: 1px solid var(--border); border-radius: var(--r-xl); backdrop-filter: blur(16px); flex-wrap: wrap; }
        .top-logo { width: 48px; height: 48px; border-radius: var(--r-md); overflow: hidden; flex-shrink: 0; background: rgba(29,78,216,0.35); border: 1.5px solid var(--border-mid); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: var(--blue-4); }
        .top-logo img { width: 100%; height: 100%; object-fit: cover; }
        .top-info { flex: 1; min-width: 120px; }
        .top-info h1 { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .top-info p { font-size: 11px; color: var(--text-3); margin-top: 3px; font-family: 'DM Mono', monospace; }
        .top-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .top-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 50px; font-size: 11px; font-weight: 500; font-family: 'DM Mono', monospace; background: rgba(29,78,216,0.22); color: var(--blue-4); border: 1px solid var(--border-mid); }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.6); }
        .layout { display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: start; }
        .chat-panel { background: rgba(12,21,40,0.75); border: 1px solid var(--border); border-radius: var(--r-xl); overflow: hidden; backdrop-filter: blur(12px); }
        .chat-header { padding: 13px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: linear-gradient(90deg, rgba(29,78,216,0.08) 0%, transparent 100%); }
        .chat-header-left { display: flex; align-items: center; gap: 8px; }
        .chat-header-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-3); font-weight: 500; }
        .chat-count { font-size: 11px; font-family: 'DM Mono', monospace; color: var(--blue-3); background: rgba(59,130,246,0.12); padding: 3px 10px; border-radius: 50px; border: 1px solid rgba(59,130,246,0.22); }
        .chat-scroll { max-height: 580px; overflow-y: auto; padding: 14px; scrollbar-width: thin; scrollbar-color: rgba(59,130,246,0.35) transparent; }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.35); border-radius: 10px; }
        .message { display: flex; gap: 10px; padding: 11px 13px; margin-bottom: 7px; border-radius: var(--r-md); border: 1px solid transparent; transition: background 0.15s, border-color 0.15s; }
        .message:hover { background: rgba(59,130,246,0.04); border-color: rgba(59,130,246,0.1); }
        .message.is-staff { background: rgba(29,78,216,0.08); border-color: rgba(59,130,246,0.18); }
        .message.is-creator { background: rgba(14,165,233,0.07); border-color: rgba(14,165,233,0.16); }
        .message.is-bot { background: rgba(88,101,242,0.06); border-color: rgba(88,101,242,0.18); }
        .msg-avatar { width: 36px; height: 36px; border-radius: 10px; background: rgba(29,78,216,0.3); flex-shrink: 0; overflow: hidden; }
        .msg-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .msg-body { flex: 1; min-width: 0; }
        .msg-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; flex-wrap: wrap; }
        .msg-author { font-size: 12px; font-weight: 600; color: var(--text-1); }
        .is-staff .msg-author { color: var(--blue-4); }
        .is-creator .msg-author { color: #7dd3fc; }
        .is-bot .msg-author { color: #818cf8; }
        .badge { font-size: 9px; padding: 2px 6px; border-radius: 5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 3px; }
        .badge-staff { background: rgba(29,78,216,0.35); color: var(--blue-4); }
        .badge-creator { background: rgba(14,165,233,0.3); color: #7dd3fc; }
        .badge-bot { background: rgba(88,101,242,0.35); color: #a5b4fc; }
        .msg-time { margin-left: auto; font-size: 10px; font-family: 'DM Mono', monospace; color: var(--text-4); display: flex; align-items: center; gap: 4px; }
        .msg-text { font-size: 13px; color: var(--text-2); word-wrap: break-word; white-space: pre-wrap; line-height: 1.5; }
        .embed { margin-top: 7px; border-left: 3px solid #5865f2; border-radius: 3px 7px 7px 3px; background: rgba(10,16,36,0.85); padding: 10px 13px; max-width: 420px; }
        .embed.c-green { border-left-color: #57f287; }
        .embed.c-red { border-left-color: #ed4245; }
        .embed.c-yellow { border-left-color: #fee75c; }
        .embed.c-orange { border-left-color: #f57731; }
        .embed.c-blue { border-left-color: #3b82f6; }
        .embed.c-gray { border-left-color: #99aab5; }
        .embed-author-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
        .embed-author-icon { width: 16px; height: 16px; border-radius: 50%; object-fit: cover; }
        .embed-author-name { font-size: 11px; font-weight: 600; color: var(--text-2); }
        .embed-title { font-size: 12px; font-weight: 700; color: var(--text-1); margin-bottom: 4px; }
        .embed-desc { font-size: 11px; color: var(--text-3); white-space: pre-wrap; word-wrap: break-word; line-height: 1.45; }
        .embed-fields { display: grid; gap: 5px; margin-top: 6px; }
        .embed-field.inline { display: inline-block; margin-right: 12px; }
        .embed-field-name { font-size: 10px; font-weight: 700; color: var(--text-2); margin-bottom: 1px; }
        .embed-field-value { font-size: 10px; color: var(--text-3); white-space: pre-wrap; }
        .embed-footer-row { display: flex; align-items: center; gap: 5px; margin-top: 7px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.06); clear: both; }
        .embed-footer-text { font-size: 10px; color: var(--text-4); }
        .info-card { background: rgba(12,21,40,0.9); border: 1px solid var(--border); border-radius: var(--r-xl); overflow: hidden; backdrop-filter: blur(16px); position: sticky; top: 20px; }
        .info-card-header { padding: 16px 18px 13px; border-bottom: 1px solid var(--border); background: linear-gradient(135deg, rgba(29,78,216,0.18) 0%, rgba(14,165,233,0.08) 100%); }
        .info-card-header-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .info-card-logo { width: 40px; height: 40px; border-radius: 11px; overflow: hidden; background: rgba(29,78,216,0.35); border: 1.5px solid var(--border-mid); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: var(--blue-4); flex-shrink: 0; }
        .info-card-logo img { width: 100%; height: 100%; object-fit: cover; }
        .info-card-server-name { font-size: 14px; font-weight: 700; background: linear-gradient(135deg, #fff 0%, var(--blue-4) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .info-card-server-sub { font-size: 10px; color: var(--text-3); margin-top: 2px; }
        .info-ticket-id { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--blue-3); background: rgba(59,130,246,0.1); padding: 4px 10px; border-radius: 50px; border: 1px solid rgba(59,130,246,0.22); display: inline-flex; align-items: center; gap: 5px; }
        .info-body { padding: 14px 18px; }
        .info-section-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-4); font-weight: 600; margin-bottom: 8px; margin-top: 14px; padding-bottom: 5px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 5px; }
        .info-section-label:first-child { margin-top: 0; }
        .info-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .info-row:last-child { border-bottom: none; }
        .info-row-label { font-size: 11px; color: var(--text-3); flex-shrink: 0; padding-top: 1px; display: flex; align-items: center; gap: 5px; }
        .info-row-value { font-size: 11px; font-weight: 500; color: var(--text-1); text-align: right; word-break: break-word; }
        .info-row-value.blue { color: var(--blue-3); }
        .info-row-value.teal { color: var(--teal); }
        .info-row-value.green { color: var(--green); }
        .info-row-value.red { color: var(--red); }
        .info-row-value.mono { font-family: 'DM Mono', monospace; font-size: 10px; }
        .closed-badge { display: flex; align-items: center; gap: 6px; background: rgba(239,68,68,0.12); color: var(--red); padding: 5px 12px; border-radius: var(--r-sm); font-size: 11px; font-weight: 600; border: 1px solid rgba(239,68,68,0.2); width: fit-content; }
        .footer { margin-top: 20px; padding: 16px 22px; background: rgba(12,21,40,0.7); border: 1px solid var(--border); border-radius: var(--r-xl); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        .footer-left { display: flex; align-items: center; gap: 8px; }
        .footer-logo-sm { width: 22px; height: 22px; border-radius: 7px; overflow: hidden; background: rgba(29,78,216,0.35); display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; color: var(--blue-4); flex-shrink: 0; }
        .footer-logo-sm img { width: 100%; height: 100%; object-fit: cover; }
        .footer-brand { font-size: 12px; font-weight: 600; background: linear-gradient(135deg, var(--blue-3) 0%, var(--blue-4) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .footer-center { font-size: 10px; color: var(--text-4); text-align: center; line-height: 1.7; display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .footer-right { font-size: 10px; color: var(--text-4); font-family: 'DM Mono', monospace; text-align: right; display: flex; flex-direction: column; gap: 2px; align-items: flex-end; }
        .watermark-badge { position: fixed; bottom: 18px; right: 18px; z-index: 999; display: flex; align-items: center; gap: 8px; background: rgba(8,14,32,0.92); border: 1px solid rgba(59,130,246,0.28); border-radius: 50px; padding: 7px 14px 7px 7px; backdrop-filter: blur(16px); box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 20px rgba(29,78,216,0.1); }
        .watermark-logo { width: 26px; height: 26px; border-radius: 50%; overflow: hidden; background: rgba(29,78,216,0.4); border: 1px solid var(--border-mid); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: var(--blue-4); flex-shrink: 0; }
        .watermark-logo img { width: 100%; height: 100%; object-fit: cover; }
        .watermark-text { display: flex; flex-direction: column; line-height: 1.3; }
        .watermark-made { font-size: 9px; color: var(--text-4); }
        .watermark-name { font-size: 11px; font-weight: 600; color: var(--blue-4); }
        @media (max-width: 720px) {
            .layout { grid-template-columns: 1fr; }
            .info-card { position: static; }
            .chat-scroll { max-height: 420px; }
            .footer { flex-direction: column; text-align: center; }
            .footer-right { text-align: center; align-items: center; }
            .watermark-badge { bottom: 12px; right: 12px; }
        }
    </style>
</head>
<body>
<div class="page">
    <div class="top-bar">
        <div class="top-logo">
            <img src="${escapeHtml(serverIcon)}" alt="${escapeHtml(serverName)}" onerror="this.style.display='none'; this.parentElement.textContent='HH'">
        </div>
        <div class="top-info">
            <h1>🎧 Voice Support Transcript</h1>
            <p>${escapeHtml(serverName)} &nbsp;•&nbsp; Voice Support System</p>
        </div>
        <div class="top-right">
            <div class="top-badge">
                <span class="status-dot"></span>
                Geschlossen &nbsp;|&nbsp; ${escapeHtml(ticket.typeName)}
            </div>
        </div>
    </div>

    <div class="layout">
        <div class="chat-panel">
            <div class="chat-header">
                <div class="chat-header-left">
                    <span class="chat-header-title">💬 Session-Verlauf</span>
                </div>
                <span class="chat-count">${messageCount} Einträge</span>
            </div>
            <div class="chat-scroll">
                ${messageList.map(renderMessage).join('')}
            </div>
        </div>

        <div class="info-card">
            <div class="info-card-header">
                <div class="info-card-header-top">
                    <div class="info-card-logo">
                        <img src="${escapeHtml(serverIcon)}" alt="${escapeHtml(serverName)}" onerror="this.style.display='none'; this.parentElement.textContent='HH'">
                    </div>
                    <div>
                        <div class="info-card-server-name">${escapeHtml(serverName)}</div>
                        <div class="info-card-server-sub">Voice Support System</div>
                    </div>
                </div>
                <div class="info-ticket-id"># ${escapeHtml(ticket.id)}</div>
            </div>

            <div class="info-body">
                <div class="info-section-label">⚡ Status</div>
                <div class="closed-badge">🔒 Session beendet</div>

                <div class="info-section-label">ℹ️ Session-Informationen</div>
                <div class="info-row">
                    <span class="info-row-label">🏷️ Typ</span>
                    <span class="info-row-value blue">${escapeHtml(ticket.typeName)}</span>
                </div>
                <div class="info-row">
                    <span class="info-row-label">📁 Kategorie</span>
                    <span class="info-row-value blue">${escapeHtml(ticket.categoryName)}</span>
                </div>
                <div class="info-row">
                    <span class="info-row-label">📝 Anliegen</span>
                    <span class="info-row-value">${escapeHtml(ticket.subject)}</span>
                </div>

                <div class="info-section-label">👥 Beteiligte Personen</div>
                <div class="info-row">
                    <span class="info-row-label">👤 Erstellt von</span>
                    <span class="info-row-value">${escapeHtml(ticket.userTag)}</span>
                </div>
                <div class="info-row">
                    <span class="info-row-label">✅ Bearbeitet von</span>
                    <span class="info-row-value teal">${escapeHtml(ticket.claimedByTag || '—')}</span>
                </div>
                <div class="info-row">
                    <span class="info-row-label">🔒 Geschlossen von</span>
                    <span class="info-row-value red">${escapeHtml(ticket.closedByTag || '—')}</span>
                </div>

                <div class="info-section-label">🕐 Zeitangaben</div>
                <div class="info-row">
                    <span class="info-row-label">📅 Erstellt am</span>
                    <span class="info-row-value mono">${escapeHtml(formatDateDE(createdAt))}</span>
                </div>
                <div class="info-row">
                    <span class="info-row-label">🏁 Geschlossen am</span>
                    <span class="info-row-value mono">${escapeHtml(formatDateDE(endedAt))}</span>
                </div>
                <div class="info-row">
                    <span class="info-row-label">⏱️ Bearbeitungszeit</span>
                    <span class="info-row-value green">${escapeHtml(duration)}</span>
                </div>
                <div class="info-row">
                    <span class="info-row-label">💬 Einträge</span>
                    <span class="info-row-value blue">${messageCount}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="footer">
        <div class="footer-left">
            <div class="footer-logo-sm">
                <img src="${escapeHtml(serverIcon)}" alt="" onerror="this.style.display='none'; this.parentElement.textContent='HH'">
            </div>
            <span class="footer-brand">${escapeHtml(serverName)}</span>
        </div>
        <div class="footer-center">
            <div>🖥️ Bereitgestellt vom Voice-Support-System von ${escapeHtml(serverName)}</div>
            <div>⚡ Powered by ${escapeHtml(botName)} · Dieses Dokument ist vertraulich</div>
        </div>
        <div class="footer-right">
            <div>© ${new Date().getFullYear()} ${escapeHtml(serverName)}</div>
            <div>📅 ${escapeHtml(formatDateDE(new Date().toISOString()))}</div>
        </div>
    </div>
</div>

<div class="watermark-badge">
    <div class="watermark-logo">
        <img src="${escapeHtml(serverIcon)}" alt="${escapeHtml(serverName)}" onerror="this.style.display='none'; this.parentElement.textContent='HH'">
    </div>
    <div class="watermark-text">
        <span class="watermark-made">Made with</span>
        <span class="watermark-name">${escapeHtml(serverName)}</span>
    </div>
</div>
</body>
</html>`;

  return html;
}

export function voiceSupportTranscriptFilename(session) {
  const safeId = String(session.id || 'unknown').replace(/[^a-z0-9-]/gi, '');
  return `voice-support-${safeId}.html`;
}
