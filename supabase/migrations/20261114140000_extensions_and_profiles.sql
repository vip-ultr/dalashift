-- =============================================================================
-- Extensions, shared trigger helpers and the profile table.
--
-- Decision D-09 (ADR-0011): a farm is a holding made of parcels. The parcel is
-- the unit of analysis, so the geometry lives on the parcel, not on the farm.
--
-- Every farmer-scoped table is created in the same migration as its RLS
-- policies. A table without policies is a security defect, not a to-do.
-- =============================================================================

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------
-- One trigger function for every table that carries an updated_at column.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
-- The profile row IS the auth user: profiles.id = auth.users.id. There is no
-- separate identity mapping to get wrong, and auth.uid() is the RLS anchor.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  phone text,
  preferred_language text not null default 'en',
  farming_experience text,
  role text not null default 'farmer'
    check (role in ('farmer', 'extension_worker', 'researcher', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated user. The id is the auth user id, so auth.uid() is the row key.';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- The profile is created by a trigger, not by the client.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'Farmer'), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
-- A user reads and updates only their own profile. There is no insert policy:
-- the profile row is created by the security-definer trigger above, and an
-- insert policy would let a user create a profile for somebody else.
alter table public.profiles enable row level security;

create policy profiles_select_own
on public.profiles
for select
using (id = auth.uid());

create policy profiles_update_own
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());
