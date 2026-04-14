const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID

if (!DISCORD_BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN ist nicht gesetzt!')
}

if (!DISCORD_CHANNEL_ID) {
  console.error('❌ DISCORD_CHANNEL_ID ist nicht gesetzt!')
}

/**
 * Sendet eine Nachricht in einen Discord Channel
 */
export async function sendDiscordChannelMessage(embed) {
  try {
    console.log('🚀 Sende Discord Channel Message...')
    console.log('Channel ID:', DISCORD_CHANNEL_ID)
    console.log('Bot Token vorhanden:', !!DISCORD_BOT_TOKEN)
    
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
      console.error('❌ Discord Channel Message Fehler:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      })
      throw new Error(`Discord API Error: ${response.status} - ${JSON.stringify(data)}`)
    }

    console.log('✅ Discord Channel Message erfolgreich gesendet:', data.id)
    return data
  } catch (error) {
    console.error('❌ Fehler beim Senden der Discord Channel Message:', error)
    throw error
  }
}

/**
 * Sendet eine DM an einen Discord User
 */
export async function sendDiscordDM(userId, embed) {
  try {
    console.log('🚀 Sende Discord DM...')
    console.log('User ID:', userId)
    
    // 1. DM Channel erstellen
    const dmChannelResponse = await fetch(
      'https://discord.com/api/v10/users/@me/channels',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_id: userId
        }),
      }
    )

    const dmChannel = await dmChannelResponse.json()
    
    if (!dmChannelResponse.ok) {
      console.error('❌ DM Channel Erstellung Fehler:', {
        status: dmChannelResponse.status,
        error: dmChannel
      })
      throw new Error(`Failed to create DM channel: ${JSON.stringify(dmChannel)}`)
    }

    console.log('✅ DM Channel erstellt:', dmChannel.id)

    // 2. Nachricht in DM Channel senden
    const messageResponse = await fetch(
      `https://discord.com/api/v10/channels/${dmChannel.id}/messages`,
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

    const message = await messageResponse.json()
    
    if (!messageResponse.ok) {
      console.error('❌ DM Senden Fehler:', {
        status: messageResponse.status,
        error: message
      })
      throw new Error(`Failed to send DM: ${JSON.stringify(message)}`)
    }

    console.log('✅ Discord DM erfolgreich gesendet:', message.id)
    return message
  } catch (error) {
    console.error('❌ Fehler beim Senden der Discord DM:', error)
    throw error
  }
}

/**
 * Erstellt ein Embed für neue Bewerbungen
 */
export function createApplicationEmbed(formData, status = 'Eingereicht') {
  const statusColors = {
    'Eingereicht': 0x3b82f6,      // blue
    'In Bearbeitung': 0xf59e0b,   // amber
    'Akzeptiert': 0x10b981,       // green
    'Abgelehnt': 0xef4444,        // red
  }

  return {
    title: '📋 Neue Bewerbung eingegangen',
    color: statusColors[status] || 0x3b82f6,
    fields: [
      {
        name: '👤 Discord Name',
        value: formData.discordName || '-',
        inline: true
      },
      {
        name: '🎂 Alter',
        value: formData.alter || '-',
        inline: true
      },
      {
        name: '⏰ Status',
        value: status,
        inline: true
      },
      {
        name: '💬 Warum Hamburg Horizon?',
        value: (formData.warumServer || '-').substring(0, 1024),
        inline: false
      },
      {
        name: '🎮 Roleplay Erfahrung',
        value: (formData.rpErfahrung || '-').substring(0, 1024),
        inline: false
      },
      {
        name: '📖 Charakter Geschichte',
        value: (formData.charakterGeschichte || '-').substring(0, 1024),
        inline: false
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
 */
export function createStatusUpdateEmbed(formData, newStatus) {
  const statusColors = {
    'In Bearbeitung': 0xf59e0b,
    'Akzeptiert': 0x10b981,
    'Abgelehnt': 0xef4444,
  }

  const statusEmojis = {
    'In Bearbeitung': '⏳',
    'Akzeptiert': '✅',
    'Abgelehnt': '❌',
  }

  return {
    title: `${statusEmojis[newStatus] || '📋'} Bewerbungsstatus Update`,
    description: `Deine Bewerbung wurde auf **${newStatus}** gesetzt.`,
    color: statusColors[newStatus] || 0x3b82f6,
    fields: [
      {
        name: '👤 Discord Name',
        value: formData.discordName || '-',
        inline: true
      },
      {
        name: '⏰ Neuer Status',
        value: newStatus,
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
 * Sendet eine Benachrichtigung für neue Bewerbungen
 * (Wrapper für sendDiscordChannelMessage mit Embed-Erstellung)
 */
export async function sendNewBewerbungNotification(formData) {
  try {
    const embed = createApplicationEmbed(formData, 'Eingereicht')
    return await sendDiscordChannelMessage(embed)
  } catch (error) {
    console.error('❌ Fehler beim Senden der Bewerbungs-Benachrichtigung:', error)
    throw error
  }
}

/**
 * Sendet eine DM bei Status-Update
 * (Wrapper für sendDiscordDM mit Embed-Erstellung)
 */
export async function sendStatusUpdateDM(userId, formData, newStatus) {
  try {
    const embed = createStatusUpdateEmbed(formData, newStatus)
    return await sendDiscordDM(userId, embed)
  } catch (error) {
    console.error('❌ Fehler beim Senden der Status-Update DM:', error)
    throw error
  }
}
