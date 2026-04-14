import { NextResponse } from 'next/server'
import { supabase, toCamelCase, parseFormData } from '@/lib/supabase'
import { createToken, requireAuth } from '@/lib/auth'
import {
  sendDiscordChannelMessage,
  sendDiscordDM,
  createApplicationEmbed,
  createStatusUpdateEmbed
} from '@/lib/discord-bot'

// ==================== ADMIN LOGIN ====================
export async function POST(request) {
  const url = new URL(request.url)
  const path = url.pathname

  // Admin Login
  if (path === '/api/admin/login') {
    try {
      const body = await request.json()
      const { mitarbeiterNummer, password } = body

      console.log('🔐 Admin Login Versuch:', { mitarbeiterNummer })

      // Admin aus DB holen
      const { data: admin, error } = await supabase
        .from('admin_accounts')
        .select('*')
        .eq('mitarbeiter_nummer', mitarbeiterNummer)
        .single()

      if (error || !admin) {
        console.log('❌ Admin nicht gefunden:', error)
        return NextResponse.json(
          { error: 'Ungültige Anmeldedaten' },
          { status: 401 }
        )
      }

      // Plaintext Password Check (wie in der Handoff beschrieben)
      if (admin.password_hash !== password) {
        console.log('❌ Falsches Passwort')
        return NextResponse.json(
          { error: 'Ungültige Anmeldedaten' },
          { status: 401 }
        )
      }

      // Token erstellen
      const token = createToken({
        mitarbeiterNummer: admin.mitarbeiter_nummer,
        email: admin.email,
        role: admin.role_name
      })

      console.log('✅ Admin Login erfolgreich')

      return NextResponse.json({
        token,
        user: {
          mitarbeiterNummer: admin.mitarbeiter_nummer,
          email: admin.email,
          discordUsername: admin.discord_username,
          role: admin.role_name
        }
      })
    } catch (error) {
      console.error('❌ Admin Login Error:', error)
      return NextResponse.json(
        { error: 'Server Fehler' },
        { status: 500 }
      )
    }
  }

  // Bewerbung einreichen
  if (path === '/api/bewerbung') {
    try {
      const body = await request.json()
      const { formData, discordUserId } = body

      console.log('📝 Neue Bewerbung:', { discordUserId })

      // Bewerbung in DB speichern (formData als JSON String)
      const { data: bewerbung, error } = await supabase
        .from('bewerbungen')
        .insert({
          form_data: JSON.stringify(formData),
          status: 'Eingereicht',
          discord_user_id: discordUserId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ DB Error:', error)
        return NextResponse.json(
          { error: 'Bewerbung konnte nicht gespeichert werden' },
          { status: 500 }
        )
      }

      console.log('✅ Bewerbung gespeichert:', bewerbung.id)

      // Discord Channel Benachrichtigung senden
      try {
        const embed = createApplicationEmbed(formData, 'Eingereicht')
        await sendDiscordChannelMessage(embed)
        console.log('✅ Discord Channel Benachrichtigung gesendet')
      } catch (discordError) {
        console.error('⚠️ Discord Channel Benachrichtigung fehlgeschlagen:', discordError)
        // Nicht kritisch, Bewerbung ist trotzdem gespeichert
      }

      return NextResponse.json({
        success: true,
        bewerbung: toCamelCase(bewerbung)
      })
    } catch (error) {
      console.error('❌ Bewerbung Error:', error)
      return NextResponse.json(
        { error: 'Server Fehler' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}

// ==================== GET REQUESTS ====================
export async function GET(request) {
  const url = new URL(request.url)
  const path = url.pathname

  // Meine Bewerbungen abrufen
  if (path === '/api/meine-bewerbungen') {
    try {
      const discordUserId = url.searchParams.get('discordUserId')

      if (!discordUserId) {
        return NextResponse.json(
          { error: 'Discord User ID fehlt' },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from('bewerbungen')
        .select('*')
        .eq('discord_user_id', discordUserId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ DB Error:', error)
        return NextResponse.json(
          { error: 'Fehler beim Abrufen der Bewerbungen' },
          { status: 500 }
        )
      }

      const bewerbungen = data.map(toCamelCase)

      return NextResponse.json({ bewerbungen })
    } catch (error) {
      console.error('❌ Meine Bewerbungen Error:', error)
      return NextResponse.json(
        { error: 'Server Fehler' },
        { status: 500 }
      )
    }
  }

  // Admin: Alle Bewerbungen abrufen
  if (path === '/api/admin/bewerbungen') {
    try {
      // Auth Check
      const { authorized } = requireAuth(request)
      if (!authorized) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const { data, error } = await supabase
        .from('bewerbungen')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ DB Error:', error)
        return NextResponse.json(
          { error: 'Fehler beim Abrufen der Bewerbungen' },
          { status: 500 }
        )
      }

      const bewerbungen = data.map(toCamelCase)

      return NextResponse.json({ bewerbungen })
    } catch (error) {
      console.error('❌ Admin Bewerbungen Error:', error)
      return NextResponse.json(
        { error: 'Server Fehler' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}

// ==================== PUT REQUESTS ====================
export async function PUT(request) {
  const url = new URL(request.url)
  const path = url.pathname

  // Admin: Bewerbung Status ändern
  if (path.startsWith('/api/admin/bewerbungen/')) {
    try {
      // Auth Check
      const { authorized } = requireAuth(request)
      if (!authorized) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const id = path.split('/').pop()
      const body = await request.json()
      const { status } = body

      console.log('🔄 Status Update:', { id, status })

      // Status in DB aktualisieren
      const { data: bewerbung, error } = await supabase
        .from('bewerbungen')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('❌ DB Error:', error)
        return NextResponse.json(
          { error: 'Status konnte nicht aktualisiert werden' },
          { status: 500 }
        )
      }

      console.log('✅ Status aktualisiert')

      // Discord DM an User senden
      if (bewerbung.discord_user_id) {
        try {
          const formData = parseFormData(bewerbung.form_data)
          const embed = createStatusUpdateEmbed(formData, status)
          await sendDiscordDM(bewerbung.discord_user_id, embed)
          console.log('✅ Discord DM gesendet')
        } catch (discordError) {
          console.error('⚠️ Discord DM fehlgeschlagen:', discordError)
          // Nicht kritisch
        }
      }

      return NextResponse.json({
        success: true,
        bewerbung: toCamelCase(bewerbung)
      })
    } catch (error) {
      console.error('❌ Status Update Error:', error)
      return NextResponse.json(
        { error: 'Server Fehler' },
        { status: 500 }
      )
    }
  }

  // Settings: Username ändern
  if (path === '/api/settings/username') {
    try {
      const { authorized, user } = requireAuth(request)
      if (!authorized) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const body = await request.json()
      const { newUsername } = body

      const { error } = await supabase
        .from('admin_accounts')
        .update({ email: newUsername })
        .eq('mitarbeiter_nummer', user.mitarbeiterNummer)

      if (error) {
        console.error('❌ DB Error:', error)
        return NextResponse.json(
          { error: 'Username konnte nicht aktualisiert werden' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('❌ Username Update Error:', error)
      return NextResponse.json(
        { error: 'Server Fehler' },
        { status: 500 }
      )
    }
  }

  // Settings: Passwort ändern
  if (path === '/api/settings/password') {
    try {
      const { authorized, user } = requireAuth(request)
      if (!authorized) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const body = await request.json()
      const { currentPassword, newPassword } = body

      // Current Password prüfen
      const { data: admin } = await supabase
        .from('admin_accounts')
        .select('password_hash')
        .eq('mitarbeiter_nummer', user.mitarbeiterNummer)
        .single()

      if (admin.password_hash !== currentPassword) {
        return NextResponse.json(
          { error: 'Aktuelles Passwort ist falsch' },
          { status: 400 }
        )
      }

      // Neues Passwort setzen
      const { error } = await supabase
        .from('admin_accounts')
        .update({ password_hash: newPassword })
        .eq('mitarbeiter_nummer', user.mitarbeiterNummer)

      if (error) {
        console.error('❌ DB Error:', error)
        return NextResponse.json(
          { error: 'Passwort konnte nicht aktualisiert werden' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('❌ Password Update Error:', error)
      return NextResponse.json(
        { error: 'Server Fehler' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}
