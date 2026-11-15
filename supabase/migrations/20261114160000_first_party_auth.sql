-- First-party credentials and sessions. Farm data continues to use auth.uid()
-- through short-lived HS256 database tokens signed by the Next.js server.

create table public.local_accounts (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  password_hash text,
  created_at timestamptz not null default now()
);

-- Preserve existing account UUIDs and profile/farm ownership. Password hashes
-- cannot be read from Supabase Auth and are intentionally left unset.
insert into public.local_accounts (id, email, phone)
select
  p.id,
  lower(nullif(u.email, '')),
  nullif(u.phone, '')
from public.profiles p
left join auth.users u on u.id = p.id
on conflict (id) do nothing;

create unique index local_accounts_email_unique
  on public.local_accounts (email)
  where email is not null and password_hash is not null;
create unique index local_accounts_phone_unique
  on public.local_accounts (phone)
  where phone is not null and password_hash is not null;

alter table public.profiles
  drop constraint profiles_id_fkey,
  add constraint profiles_id_fkey
    foreign key (id) references public.local_accounts (id) on delete cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

comment on table public.local_accounts is
  'First-party sign-in identifiers and scrypt password hashes. Never expose through a client query.';
comment on column public.local_accounts.password_hash is
  'scrypt hash only. NULL indicates a preserved legacy Supabase Auth account requiring a verified password reset.';

create table public.local_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.local_accounts (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index local_sessions_user_id_idx on public.local_sessions (user_id);
create index local_sessions_expiry_idx on public.local_sessions (expires_at);

create table public.app_auth_rate_limits (
  bucket text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0)
);

create index app_auth_rate_limits_window_idx
  on public.app_auth_rate_limits (window_started_at);

alter table public.local_accounts enable row level security;
alter table public.local_sessions enable row level security;
alter table public.app_auth_rate_limits enable row level security;

revoke all on public.local_accounts, public.local_sessions, public.app_auth_rate_limits
  from public, anon, authenticated;
grant all on public.local_accounts, public.local_sessions, public.app_auth_rate_limits
  to service_role;

create or replace function public.consume_auth_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_now timestamptz := clock_timestamp();
begin
  if p_bucket !~ '^[0-9a-f]{64}$'
    or p_limit < 1 or p_limit > 100
    or p_window_seconds < 1 or p_window_seconds > 3600 then
    raise exception 'Invalid rate limit parameters';
  end if;

  delete from public.app_auth_rate_limits
  where window_started_at < v_now - interval '1 day';

  insert into public.app_auth_rate_limits (bucket, window_started_at, request_count)
  values (p_bucket, v_now, 1)
  on conflict (bucket) do update
  set
    window_started_at = case
      when public.app_auth_rate_limits.window_started_at
        <= v_now - make_interval(secs => p_window_seconds)
      then v_now
      else public.app_auth_rate_limits.window_started_at
    end,
    request_count = case
      when public.app_auth_rate_limits.window_started_at
        <= v_now - make_interval(secs => p_window_seconds)
      then 1
      else public.app_auth_rate_limits.request_count + 1
    end
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_auth_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_auth_rate_limit(text, integer, integer)
  to service_role;
