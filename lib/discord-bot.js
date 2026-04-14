const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID

if (!DISCORD_BOT_TOKEN) {
  console.error('DISCORD_BOT_TOKEN ist nicht gesetzt!')
}

if (!DISCORD_CHANNEL_ID) {
  console.error('DISCORD_CHANNEL_ID ist nicht gesetzt!')
}

/**
 * Sendet eine Nachricht in einen Discord Channel
 */
export async function sendDiscordChannelMessage(embed) {
  try {
    console.log('[DISCORD] Sende Channel Message an:', DISCORD_CHANNEL_ID)
    
    const response = await fetch(
      `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed]
        }),
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      console.error('[DISCORD] Channel Message Fehler:', response.status, data)
      throw new Error(`Discord API Error: ${response.status}`)
    }

    console.log('[DISCORD] Channel Message gesendet:', data.id)
    return data
  } catch (error) {
    console.error('[DISCORD] Fehler beim Senden:', error)
    throw error
  }
}

/**
 * Sendet eine DM an einen Discord User
 */
export async function sendDiscordDM(userId, embed) {
  try {
    console.log('[DISCORD] Sende DM an User:', userId)
    
    // 1. DM Channel erstellen
    const dmChannelResponse = await fetch(
      'https://discord.com/api/v10/users/@me/channels',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipient_id: userId }),
      }
    )

    const dmChannel = await dmChannelResponse.json()
    
    if (!dmChannelResponse.ok) {
      console.error('[DISCORD] DM Channel Fehler:', dmChannelResponse.status, dmChannel)
      throw new Error(`Failed to create DM channel`)
    }

    // 2. Nachricht senden
    const messageResponse = await fetch(
      `https://discord.com/api/v10/channels/${dmChannel.id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ embeds: [embed] }),
      }
    )

    const message = await messageResponse.json()
    
    if (!messageResponse.ok) {
      console.error('[DISCORD] DM Senden Fehler:', messageResponse.status, message)
      throw new Error(`Failed to send DM`)
    }

    console.log('[DISCORD] DM gesendet:', message.id)
    return message
  } catch (error) {
    console.error('[DISCORD] DM Fehler:', error)
    throw error
  }
}

/**
 * Erstellt ein Embed für neue Bewerbungen
 * @param {string} username - Discord Username des Bewerbers
 * @param {object} formData - Formulardaten (vorname, alter, warumTeam, etc.)
 */
export function createApplicationEmbed(username, formData) {
  return {
    title: '📋 Neue Bewerbung eingegangen',
    color: 0x3b82f6,
    fields: [
      {
        name: '👤 Discord Name',
        value: username || '-',
        inline: true
      },
      {
        name: '📝 Vorname',
        value: formData?.vorname || '-',
        inline: true
      },
      {
        name: '🔥 Alter',
        value: String(formData?.alter || '-'),
        inline: true
      },
      {
        name: '⏰ Status',
        value: 'Eingereicht',
        inline: true
      },
      {
        name: '🎮 Roblox-Name',
        value: formData?.robloxName || '-',
        inline: true
      },
      {
        name: '⏱️ Spielzeit',
        value: formData?.spielzeit || '-',
        inline: true
      },
      {
        name: '💬 Warum ins Team?',
        value: (formData?.warumTeam || '-').substring(0, 1024),
        inline: false
      },
      {
        name: '🎭 Fraktion',
        value: formData?.fraktion || '-',
        inline: true
      },
      {
        name: '📅 Stunden/Woche',
        value: formData?.stundenProWoche || '-',
        inline: true
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Hamburg Horizon RP • Bewerbungssystem'
    }
  }
}

/**
 * Erstellt ein Embed für Status Updates
 * @param {string} username - Discord Username
 * @param {string} newStatus - Neuer Status (Eingereicht, In Bearbeitung, Angenommen, Abgelehnt, etc.)
 * @param {string} bearbeitetVon - Name des Bearbeiters (optional)
 */
export function createStatusUpdateEmbed(username, newStatus, bearbeitetVon) {
  const statusColors = {
    'Eingereicht': 0x3b82f6,
    'In Bearbeitung': 0xf59e0b,
    'Angenommen': 0x10b981,
    'Abgelehnt': 0xef4444,
    'Freigegeben': 0x6366f1,
    'Zurückgezogen': 0x6b7280,
  }

  const statusEmojis = {
    'Eingereicht': '📥',
    'In Bearbeitung': '⏳',
    'Angenommen': '✅',
    'Abgelehnt': '❌',
    'Freigegeben': '🔓',
    'Zurückgezogen': '↩️',
  }

  const fields = [
    {
      name: '👤 Discord Name',
      value: username || '-',
      inline: true
    },
    {
      name: '⏰ Neuer Status',
      value: `${statusEmojis[newStatus] || '📋'} ${newStatus}`,
      inline: true
    }
  ]

  if (bearbeitetVon) {
    fields.push({
      name: '🛡️ Bearbeitet von',
      value: bearbeitetVon,
      inline: true
    })
  }

  return {
    title: `${statusEmojis[newStatus] || '📋'} Bewerbungsstatus Update`,
    description: `Die Bewerbung von **${username || 'Unbekannt'}** wurde auf **${newStatus}** gesetzt.`,
    color: statusColors[newStatus] || 0x3b82f6,
    fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Hamburg Horizon RP • Bewerbungssystem'
    }
  }
}

/**
 * Sendet eine Benachrichtigung für neue Bewerbungen in den Channel
 * @param {string} username - Discord Username
 * @param {object} formData - Formulardaten
 */
export async function sendNewBewerbungNotification(username, formData) {
  try {
    const embed = createApplicationEmbed(username, formData)
    return await sendDiscordChannelMessage(embed)
  } catch (error) {
    console.error('[DISCORD] Bewerbungs-Benachrichtigung Fehler:', error)
    // Nicht werfen - Bewerbung soll trotzdem gespeichert werden
  }
}

/**
 * Sendet eine DM UND Channel-Nachricht bei Status-Update
 * @param {string} userId - Discord User ID
 * @param {string} username - Discord Username
 * @param {string} newStatus - Neuer Status
 * @param {string} bearbeitetVon - Name des Bearbeiters
 */
export async function sendStatusUpdateNotification(userId, username, newStatus, bearbeitetVon) {
  const embed = createStatusUpdateEmbed(username, newStatus, bearbeitetVon)
  
  // 1. In Channel posten
  try {
    await sendDiscordChannelMessage(embed)
    console.log('[DISCORD] Status-Update Channel-Nachricht gesendet')
  } catch (error) {
    console.error('[DISCORD] Status-Update Channel Fehler:', error)
  }
  
  // 2. DM an User senden
  try {
    await sendDiscordDM(userId, embed)
    console.log('[DISCORD] Status-Update DM gesendet')
  } catch (error) {
    console.error('[DISCORD] Status-Update DM Fehler:', error)
  }
}
