-- ============================================================
-- HHRP – Supabase Auth Verknüpfung mit Discord
-- Bitte EINMAL im Supabase Dashboard → SQL Editor ausführen
-- ============================================================

-- Verlinkt einen Supabase Auth User (auth.users) mit der Discord-ID
create table if not exists public.user_auth_links (
  id                uuid primary key default gen_random_uuid(),
  discord_user_id   text not null unique,
  supabase_user_id  uuid not null unique references auth.users(id) on delete cascade,
  email             text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists user_auth_links_supabase_user_id_idx
  on public.user_auth_links (supabase_user_id);
create index if not exists user_auth_links_email_idx
  on public.user_auth_links (email);

-- Trigger: updated_at automatisch setzen
create or replace function public.set_user_auth_links_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_user_auth_links_updated_at on public.user_auth_links;
create trigger trg_user_auth_links_updated_at
  before update on public.user_auth_links
  for each row execute function public.set_user_auth_links_updated_at();

-- WICHTIG: Im Supabase Dashboard → Authentication → URL Configuration:
--   Site URL:       https://hhrp24.de
--   Redirect URLs:  https://hhrp24.de/auth/update-password
--                   https://hhrp24.de/auth/verified
