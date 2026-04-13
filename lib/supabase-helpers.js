import { supabaseAdmin } from './supabase';
import bcrypt from 'bcryptjs';

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
  const passwordHash = await bcrypt.hash(data.password, 10);

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
  console.log('[DEBUG] Looking for account:', { mitarbeiterNummer, emailOrUsername });
  
  // Suche mit E-Mail ODER Benutzername
  const { data: accounts, error } = await supabaseAdmin
    .from('admin_accounts')
    .select('*')
    .eq('mitarbeiter_nummer', mitarbeiterNummer)
    .eq('is_active', true);

  console.log('[DEBUG] Supabase query result:', error ? `Error: ${error.message}` : `Found ${accounts?.length} accounts`);
  
  if (error) {
    console.log('[DEBUG] Supabase error:', error);
    return null;
  }
  
  if (!accounts || accounts.length === 0) {
    console.log('[DEBUG] No accounts found');
    return null;
  }

  // Filter by email OR username (case-insensitive)
  const emailOrUsernameLower = emailOrUsername.toLowerCase();
  const account = accounts.find(a => 
    a.email?.toLowerCase() === emailOrUsernameLower || 
    a.discord_username?.toLowerCase() === emailOrUsernameLower
  );

  if (!account) {
    console.log('[DEBUG] No matching account for email/username');
    console.log('[DEBUG] Searched for:', emailOrUsername, 'in', accounts.map(a => ({ email: a.email, username: a.discord_username })));
    return null;
  }

  console.log('[DEBUG] Found account:', account.mitarbeiter_nummer);
  console.log('[DEBUG] Comparing password...');
  
  // TEMPORÄR: Plain-Text Passwort-Vergleich
  const isValid = account.password_hash === password;
  
  console.log('[DEBUG] Password valid:', isValid);
  console.log('[DEBUG] Expected:', account.password_hash);
  console.log('[DEBUG] Got:', password);
  
  if (!isValid) return null;

  return account;
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
