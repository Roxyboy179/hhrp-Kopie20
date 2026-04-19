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
  const bewerbungType = formData?.bewerbungType || 'normal';
  const typeColors = {
    'normal': 0x3b82f6,      // Blau
    'praktikum': 0xf59e0b,   // Orange
    'uprank': 0x8b5cf6,      // Lila
    'beta_tester': 0xa855f7  // Purpur
  };
  const typeLabels = {
    'normal': 'Team-Bewerbung',
    'praktikum': 'Praktikum-Bewerbung',
    'uprank': 'Uprank-Bewerbung',
    'beta_tester': 'Beta Tester Bewerbung'
  };
  
  const color = typeColors[bewerbungType] || 0x3b82f6;
  const label = formData?.bewerbungTypeLabel || typeLabels[bewerbungType] || 'Bewerbung';
  
  const baseFields = [
    {
      name: 'Bewerbungstyp',
      value: label,
      inline: true
    },
    {
      name: 'Discord Name',
      value: username || '-',
      inline: true
    },
    {
      name: 'Status',
      value: 'Eingereicht',
      inline: true
    }
  ];
  
  // Felder je nach Bewerbungstyp
  if (bewerbungType === 'beta_tester') {
    baseFields.push(
      {
        name: 'Name',
        value: formData?.name || '-',
        inline: true
      },
      {
        name: 'Alter',
        value: String(formData?.alter || '-'),
        inline: true
      },
      {
        name: 'Verfügbarkeit',
        value: formData?.verfuegbarkeit || '-',
        inline: true
      },
      {
        name: '💫 Motivation',
        value: (formData?.warum || '-').substring(0, 1024),
        inline: false
      },
      {
        name: '🛠️ Testing-Erfahrung',
        value: (formData?.erfahrung || '-').substring(0, 1024),
        inline: false
      },
      {
        name: '✨ Stärken',
        value: (formData?.staerken || '-').substring(0, 500),
        inline: true
      },
      {
        name: '⚠️ Schwächen',
        value: (formData?.schwaechen || '-').substring(0, 500),
        inline: true
      }
    );
  } else if (bewerbungType === 'uprank') {
    baseFields.push(
      {
        name: 'Seit wann im Team',
        value: formData?.seitWannImTeam || '-',
        inline: true
      },
      {
        name: 'Gewünschter Rang',
        value: formData?.gewuenschterRang || '-',
        inline: true
      },
      {
        name: 'Stunden/Woche',
        value: formData?.stundenProWoche || '-',
        inline: true
      },
      {
        name: 'Warum Uprank?',
        value: (formData?.warumUprank || '-').substring(0, 1024),
        inline: false
      },
      {
        name: 'Aktuelle Aufgaben',
        value: (formData?.aktuelleAufgaben || '-').substring(0, 1024),
        inline: false
      }
    );
  } else if (bewerbungType === 'praktikum') {
    baseFields.push(
      {
        name: 'Vorname',
        value: formData?.vorname || '-',
        inline: true
      },
      {
        name: 'Alter',
        value: String(formData?.alter || '-'),
        inline: true
      },
      {
        name: 'Roblox-Name',
        value: formData?.robloxName || '-',
        inline: true
      },
      {
        name: 'Fraktion',
        value: formData?.fraktion || '-',
        inline: true
      },
      {
        name: 'Spielzeit/Erfahrung',
        value: (formData?.spielzeit || '-').substring(0, 200),
        inline: true
      },
      {
        name: 'Stunden/Woche',
        value: formData?.stundenProWoche || '-',
        inline: true
      },
      {
        name: 'Warum Praktikum?',
        value: (formData?.warumTeam || '-').substring(0, 1024),
        inline: false
      }
    );
  } else {
    // Normal
    baseFields.push(
      {
        name: 'Vorname',
        value: formData?.vorname || '-',
        inline: true
      },
      {
        name: 'Alter',
        value: String(formData?.alter || '-'),
        inline: true
      },
      {
        name: 'Roblox-Name',
        value: formData?.robloxName || '-',
        inline: true
      },
      {
        name: 'Spielzeit',
        value: formData?.spielzeit || '-',
        inline: true
      },
      {
        name: 'Fraktion',
        value: formData?.fraktion || '-',
        inline: true
      },
      {
        name: 'Stunden/Woche',
        value: formData?.stundenProWoche || '-',
        inline: true
      },
      {
        name: 'Warum ins Team?',
        value: (formData?.warumTeam || '-').substring(0, 1024),
        inline: false
      }
    );
  }
  
  return {
    title: `Neue ${label}`,
    color: color,
    fields: baseFields,
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
export function createStatusUpdateEmbed(username, newStatus, bearbeitetVon, rejectionReason = null) {
  const statusColors = {
    'Eingereicht': 0x3b82f6,
    'In Bearbeitung': 0xf59e0b,
    'Angenommen': 0x10b981,
    'Abgelehnt': 0xef4444,
    'Freigegeben': 0x6366f1,
    'Zurückgezogen': 0x6b7280,
  }

  const fields = [
    {
      name: 'Discord Name',
      value: username || '-',
      inline: true
    },
    {
      name: 'Neuer Status',
      value: newStatus,
      inline: true
    }
  ]

  if (bearbeitetVon) {
    fields.push({
      name: 'Bearbeitet von',
      value: bearbeitetVon,
      inline: true
    })
  }

  // Ablehnungsgrund hinzufügen
  if (newStatus === 'Abgelehnt' && rejectionReason) {
    fields.push({
      name: 'Grund',
      value: rejectionReason,
      inline: false
    })
  }

  let description = `Die Bewerbung von **${username || 'Unbekannt'}** wurde auf **${newStatus}** gesetzt.`
  if (newStatus === 'Abgelehnt' && rejectionReason) {
    description += `\n\n**Grund:** ${rejectionReason}`
  }

  return {
    title: 'Bewerbungsstatus Update',
    description,
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
export async function sendStatusUpdateNotification(userId, username, newStatus, bearbeitetVon, rejectionReason = null) {
  const embed = createStatusUpdateEmbed(username, newStatus, bearbeitetVon, rejectionReason)
  
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

/**
 * Sendet eine Benachrichtigung wenn ein Account deaktiviert/aktiviert wurde
 * @param {string} targetUsername - Name des betroffenen Accounts
 * @param {string} mitarbeiterNummer - MA-Nummer
 * @param {boolean} isActive - Neuer Status
 * @param {string} executedBy - Name des Projektinhabers der die Aktion ausgeführt hat
 */
export async function sendAccountStatusChangeNotification(targetUsername, mitarbeiterNummer, isActive, executedBy) {
  const embed = {
    title: isActive ? 'Account aktiviert' : 'Account deaktiviert',
    description: `Der Account **${targetUsername}** (${mitarbeiterNummer}) wurde ${isActive ? 'aktiviert' : 'deaktiviert'}.`,
    color: isActive ? 0x10b981 : 0xef4444,
    fields: [
      {
        name: 'Betroffener Account',
        value: `${targetUsername} (${mitarbeiterNummer})`,
        inline: true
      },
      {
        name: 'Neuer Status',
        value: isActive ? 'Aktiv' : 'Deaktiviert',
        inline: true
      },
      {
        name: 'Ausgeführt von',
        value: executedBy || 'System',
        inline: true
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Hamburg Horizon RP • Admin-System'
    }
  }

  try {
    await sendDiscordChannelMessage(embed)
    console.log('[DISCORD] Account-Status-Änderung Benachrichtigung gesendet')
  } catch (error) {
    console.error('[DISCORD] Account-Status-Änderung Fehler:', error)
  }
}

/**
 * Sendet eine Benachrichtigung wenn ein Admin sein Passwort ändert
 * @param {string} adminUsername - Name des Admins
 * @param {string} mitarbeiterNummer - MA-Nummer
 */
export async function sendPasswordChangeNotification(adminUsername, mitarbeiterNummer) {
  const embed = {
    title: 'Passwort geändert',
    description: `**${adminUsername}** (${mitarbeiterNummer}) hat sein Passwort erfolgreich geändert.`,
    color: 0x3b82f6,
    fields: [
      {
        name: 'Account',
        value: `${adminUsername} (${mitarbeiterNummer})`,
        inline: true
      },
      {
        name: 'Zeitpunkt',
        value: new Date().toLocaleString('de-DE'),
        inline: true
      },
      {
        name: 'Sicherheit',
        value: 'Account wurde automatisch abgemeldet',
        inline: false
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Hamburg Horizon RP • Admin-System'
    }
  }

  try {
    await sendDiscordChannelMessage(embed)
    console.log('[DISCORD] Passwort-Änderung Benachrichtigung gesendet')
  } catch (error) {
    console.error('[DISCORD] Passwort-Änderung Fehler:', error)
  }
}


/**
 * Vergibt eine Discord-Rolle an einen User
 */
export async function assignDiscordRole(userId, roleId) {
  const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
  
  try {
    console.log(`[DISCORD] Vergebe Rolle ${roleId} an User ${userId}`);
    
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      console.error('[DISCORD] Rollen-Vergabe Fehler:', response.status, data);
      throw new Error(`Discord API Error: ${response.status}`);
    }

    console.log('[DISCORD] Rolle erfolgreich vergeben');
    return true;
  } catch (error) {
    console.error('[DISCORD] Fehler beim Vergeben der Rolle:', error);
    throw error;
  }
}

/**
 * Entfernt eine Discord-Rolle von einem User
 */
export async function removeDiscordRole(userId, roleId) {
  const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
  
  try {
    console.log(`[DISCORD] Entferne Rolle ${roleId} von User ${userId}`);
    
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      console.error('[DISCORD] Rollen-Entfernung Fehler:', response.status, data);
      throw new Error(`Discord API Error: ${response.status}`);
    }

    console.log('[DISCORD] Rolle erfolgreich entfernt');
    return true;
  } catch (error) {
    console.error('[DISCORD] Fehler beim Entfernen der Rolle:', error);
    throw error;
  }
}
