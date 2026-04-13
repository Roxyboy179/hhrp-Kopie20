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

export async function getAdminAccountByCredentials(mitarbeiterNummer, email, password) {
  const { data: account, error } = await supabaseAdmin
    .from('admin_accounts')
    .select('*')
    .eq('mitarbeiter_nummer', mitarbeiterNummer)
    .eq('email', email)
    .eq('is_active', true)
    .single();

  if (error || !account) return null;

  const isValid = await bcrypt.compare(password, account.password_hash);
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
