import { supabaseAdmin } from './supabase';

// ===== ACTIVITY LOGS TABELLE INITIALISIEREN =====
export async function initializeActivityLogsTable() {
  try {
    // Prüfe ob Tabelle existiert, wenn nicht, erstelle sie
    const { data: tables } = await supabaseAdmin
      .from('activity_logs')
      .select('id')
      .limit(1);
    
    console.log('✅ Activity Logs Tabelle existiert bereits');
  } catch (error) {
    if (error.code === '42P01') {
      console.log('📝 Erstelle activity_logs Tabelle...');
      // Tabelle existiert nicht - wird beim ersten INSERT automatisch erstellt
    }
  }
}

// ===== BEWERBUNGEN =====

export async function createBewerbung(data) {
  const { data: bewerbung, error } = await supabaseAdmin
    .from('bewerbungen')
    .insert([{
      discord_user_id: data.discordUserId,
      username: data.username,
      email: data.email,
      discord_created_at: data.discordCreatedAt,
      form_data: data.formData,
      status: 'Eingereicht'
    }])
    .select()
    .single();

  if (error) throw error;
  return bewerbung;
}

export async function getUserBewerbungen(discordUserId) {
  const { data, error } = await supabaseAdmin
    .from('bewerbungen')
    .select('*')
    .eq('discord_user_id', discordUserId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getBewerbungById(id) {
  const { data, error } = await supabaseAdmin
    .from('bewerbungen')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getAllBewerbungen() {
  const { data, error } = await supabaseAdmin
    .from('bewerbungen')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateBewerbung(id, updates) {
  const { data, error } = await supabaseAdmin
    .from('bewerbungen')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBewerbung(id) {
  const { error } = await supabaseAdmin
    .from('bewerbungen')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// ===== ADMIN ACCOUNTS =====

export async function createAdminAccount(data) {
  // Plaintext Password (wie im System verwendet)
  const passwordHash = data.password;

  const { data: account, error } = await supabaseAdmin
    .from('admin_accounts')
    .insert([{
      discord_user_id: data.discordUserId,
      discord_username: data.discordUsername,
      mitarbeiter_nummer: data.mitarbeiterNummer,
      email: data.email,
      password_hash: passwordHash,
      role_name: data.roleName,
      created_by: data.createdBy || 'system'
    }])
    .select()
    .single();

  if (error) throw error;
  return account;
}

export async function getAdminAccountByCredentials(mitarbeiterNummer, emailOrUsername, password) {
  console.log('[DEBUG] ========== ADMIN LOGIN START ==========');
  console.log('[DEBUG] Input:', { 
    mitarbeiterNummer, 
    emailOrUsername, 
    passwordLength: password?.length 
  });
  
  try {
    // SCHRITT 1: Query Supabase
    console.log('[DEBUG] Step 1: Querying Supabase...');
    const { data: accounts, error } = await supabaseAdmin
      .from('admin_accounts')
      .select('*')
      .eq('mitarbeiter_nummer', mitarbeiterNummer)
      .eq('is_active', true);

    if (error) {
      console.error('[DEBUG] Supabase ERROR:', error);
      return null;
    }

    console.log('[DEBUG] Query result:', accounts?.length || 0, 'accounts found');
    
    if (!accounts || accounts.length === 0) {
      console.log('[DEBUG] ❌ No accounts found for MA-Nummer:', mitarbeiterNummer);
      return null;
    }

    // SCHRITT 2: Filter by email OR username (case-insensitive)
    console.log('[DEBUG] Step 2: Filtering by email/username...');
    const emailOrUsernameLower = emailOrUsername.toLowerCase().trim();
    
    const account = accounts.find(a => {
      const emailMatch = a.email?.toLowerCase().trim() === emailOrUsernameLower;
      const usernameMatch = a.discord_username?.toLowerCase().trim() === emailOrUsernameLower;
      
      console.log('[DEBUG] Checking:', {
        email: a.email,
        emailMatch,
        username: a.discord_username,
        usernameMatch
      });
      
      return emailMatch || usernameMatch;
    });

    if (!account) {
      console.log('[DEBUG] ❌ No matching email/username');
      console.log('[DEBUG] Searched for:', emailOrUsername);
      console.log('[DEBUG] Available accounts:', accounts.map(a => ({
        email: a.email,
        username: a.discord_username
      })));
      return null;
    }

    console.log('[DEBUG] ✅ Account found:', account.mitarbeiter_nummer);

    // SCHRITT 3: Password check (KLARTEXT)
    console.log('[DEBUG] Step 3: Password check...');
    const isValid = account.password_hash === password;
    
    console.log('[DEBUG] Password comparison:');
    console.log('[DEBUG]   Expected:', account.password_hash);
    console.log('[DEBUG]   Got:', password);
    console.log('[DEBUG]   Match:', isValid);
    
    if (!isValid) {
      console.log('[DEBUG] ❌ Password mismatch!');
      return null;
    }

    console.log('[DEBUG] ✅ Password correct!');
    console.log('[DEBUG] ========== LOGIN SUCCESS ==========');
    return account;
    
  } catch (e) {
    console.error('[DEBUG] Exception in getAdminAccountByCredentials:', e);
    return null;
  }
}

export async function getAllAdminAccounts() {
  const { data, error } = await supabaseAdmin
    .from('admin_accounts')
    .select('id, discord_user_id, discord_username, mitarbeiter_nummer, email, role_name, created_at, created_by, is_active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteAdminAccount(id) {
  const { error } = await supabaseAdmin
    .from('admin_accounts')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function toggleAdminAccountStatus(id, isActive) {
  const { data, error } = await supabaseAdmin
    .from('admin_accounts')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAdminAccountById(id) {
  const { data, error } = await supabaseAdmin
    .from('admin_accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// ===== BEWERBUNGS-STATUS (Offen/Geschlossen) =====

export async function getBewerbungSettings() {
  const { data, error } = await supabaseAdmin
    .from('bewerbung_settings')
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Keine Settings vorhanden - erstelle default
      return {
        normal_open: true,
        praktikum_open: true,
        uprank_open: true
      };
    }
    throw error;
  }
  return data;
}

export async function updateBewerbungSettings(settings) {
  // Prüfe ob Einstellungen existieren
  const { data: existing } = await supabaseAdmin
    .from('bewerbung_settings')
    .select('id')
    .single();

  if (existing) {
    // Update
    const { data, error } = await supabaseAdmin
      .from('bewerbung_settings')
      .update(settings)
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Insert
    const { data, error } = await supabaseAdmin
      .from('bewerbung_settings')
      .insert([settings])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

// ===== ECHTZEIT SUBSCRIPTIONS =====

export function subscribeToBewerbungen(callback) {
  const channel = supabaseAdmin
    .channel('bewerbungen-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bewerbungen'
      },
      callback
    )
    .subscribe();

  return channel;
}
