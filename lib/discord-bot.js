// Discord Bot Utilities - Keine Emojis, nur Icons in Embeds

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

/**
 * Sendet eine Nachricht an den Discord-Kanal (Neue Bewerbung)
 */
export async function sendNewBewerbungNotification(bewerbung, user) {
  if (!DISCORD_BOT_TOKEN || !DISCORD_CHANNEL_ID) {
    console.warn('[Discord] Bot Token oder Channel ID fehlt');
    return;
  }

  try {
    const embed = {
      title: '📋 Neue Team-Bewerbung eingereicht',
      color: 0x3B82F6, // Blau
      fields: [
        {
          name: '👤 Bewerber',
          value: `**${user.username || user.globalName}**\n<@${user.id}>`,
          inline: true
        },
        {
          name: '📧 E-Mail',
          value: user.email || 'Nicht verfügbar',
          inline: true
        },
        {
          name: '📅 Eingereicht',
          value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
          inline: true
        },
        {
          name: '🎮 Roblox Name',
          value: bewerbung.formData?.robloxName || 'Nicht angegeben',
          inline: true
        },
        {
          name: '👥 Gewünschte Fraktion',
          value: bewerbung.formData?.fraktion || 'Nicht angegeben',
          inline: true
        },
        {
          name: '⏰ Verfügbarkeit',
          value: bewerbung.formData?.stundenProWoche ? `${bewerbung.formData.stundenProWoche} Stunden/Woche` : 'Nicht angegeben',
          inline: true
        },
        {
          name: '💬 Motivation',
          value: bewerbung.formData?.warumTeam 
            ? (bewerbung.formData.warumTeam.length > 200 
                ? bewerbung.formData.warumTeam.substring(0, 200) + '...' 
                : bewerbung.formData.warumTeam)
            : 'Nicht angegeben',
          inline: false
        }
      ],
      footer: {
        text: `Bewerbungs-ID: ${bewerbung.id.substring(0, 8)}`
      },
      timestamp: new Date().toISOString()
    };

    const response = await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [embed]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Discord] Fehler beim Senden:', error);
    } else {
      console.log('[Discord] Neue Bewerbung gesendet an Kanal');
    }
  } catch (error) {
    console.error('[Discord] Exception:', error);
  }
}

/**
 * Sendet eine DM an den User (Status-Änderung)
 */
export async function sendStatusUpdateDM(userId, status, bewerbungId) {
  if (!DISCORD_BOT_TOKEN) {
    console.warn('[Discord] Bot Token fehlt');
    return;
  }

  try {
    // Schritt 1: DM Channel erstellen
    const dmResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient_id: userId
      })
    });

    if (!dmResponse.ok) {
      console.error('[Discord] DM Channel konnte nicht erstellt werden');
      return;
    }

    const dmChannel = await dmResponse.json();

    // Schritt 2: Embed erstellen basierend auf Status
    let color, title, description;
    
    switch (status) {
      case 'Angenommen':
        color = 0x10B981; // Grün
        title = '✅ Deine Bewerbung wurde angenommen!';
        description = `Herzlichen Glückwunsch! Deine Bewerbung für unser Team wurde **angenommen**.\n\nWir freuen uns, dich bald in unserem Team begrüßen zu dürfen! Ein Admin wird sich in Kürze bei dir melden.`;
        break;
      case 'Abgelehnt':
        color = 0xEF4444; // Rot
        title = '❌ Deine Bewerbung wurde abgelehnt';
        description = `Leider müssen wir dir mitteilen, dass deine Bewerbung **abgelehnt** wurde.\n\nDu kannst dich gerne zu einem späteren Zeitpunkt erneut bewerben. Viel Erfolg!`;
        break;
      case 'In Bearbeitung':
        color = 0xF59E0B; // Gelb
        title = '⏳ Deine Bewerbung wird bearbeitet';
        description = `Deine Bewerbung wird aktuell von unserem Team **bearbeitet**.\n\nWir melden uns bald bei dir mit einer Entscheidung!`;
        break;
      default:
        color = 0x6B7280; // Grau
        title = `Status-Update: ${status}`;
        description = `Der Status deiner Bewerbung wurde auf **${status}** geändert.`;
    }

    const embed = {
      title,
      description,
      color,
      fields: [
        {
          name: '🆔 Bewerbungs-ID',
          value: bewerbungId.substring(0, 8),
          inline: true
        },
        {
          name: '📅 Aktualisiert',
          value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
          inline: true
        }
      ],
      footer: {
        text: 'Hamburg Horizon RP - Team-Bewerbungen'
      },
      timestamp: new Date().toISOString()
    };

    // Schritt 3: Nachricht senden
    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [embed]
      })
    });

    if (!messageResponse.ok) {
      const error = await messageResponse.text();
      console.error('[Discord] Fehler beim Senden der DM:', error);
    } else {
      console.log(`[Discord] Status-Update DM gesendet an User ${userId}`);
    }
  } catch (error) {
    console.error('[Discord] Exception bei DM:', error);
  }
}
