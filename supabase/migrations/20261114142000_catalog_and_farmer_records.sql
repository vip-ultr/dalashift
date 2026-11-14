-- =============================================================================
-- The crop catalog, the rotation rule catalog, and the farmer's own records.
--
-- Decision D-07 (ADR-0011): the rules catalog holds rules from two labelled
-- sources, literature and farmer_report. The source type is required, so a
-- farmer's rule can never be presented as published agronomy.
--
-- Decision D-08: the crop catalog holds the local names and aliases the
-- farmers in the interviews actually use, so a farmer finds their crop by the
-- name they say.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- crops: the reference catalog
-- -----------------------------------------------------------------------------
-- Every agronomic value must cite its source. A crop without a citation
-- cannot be inserted.
create table public.crops (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(btrim(code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  -- The names the farmers use: "guinea corn", "white cowpeas", "late millet".
  aliases text[] not null default '{}',
  category text not null
    check (category in ('cereal', 'legume', 'vegetable', 'root', 'tuber', 'cash_crop')),
  applicable_regions text[] not null default '{}',
  -- { "min": 90, "max": 120 }
  growing_period_days jsonb not null,
  -- Temperature, rainfall, water demand, soil preferences, planting window.
  agronomic_requirements jsonb not null,
  -- Nitrogen contribution, residue load, disease break effect.
  rotation_traits jsonb not null,
  -- Array of { claim, value, unit, source_type, source_url, accessed_on, citation }.
  source_citations jsonb not null,
  -- Whether the crop needs chemical fertiliser, and how many applications.
  fertiliser jsonb not null default '{}'::jsonb,
  catalog_version text not null,
  created_at timestamptz not null default now(),

  constraint crops_have_citations check (jsonb_array_length(source_citations) > 0),
  constraint crops_growing_period_is_a_range check (
    jsonb_typeof(growing_period_days) = 'object'
    and (growing_period_days ->> 'min') is not null
    and (growing_period_days ->> 'max') is not null
  )
);

comment on column public.crops.source_citations is
  'Mandatory. Every agronomic value in the record cites the source it came from.';

create index crops_code_idx on public.crops (code);
create index crops_aliases_idx on public.crops using gin (aliases);

-- -----------------------------------------------------------------------------
-- rotation_rules: the rules catalog
-- -----------------------------------------------------------------------------
-- Two labelled sources. The farmer's own stated rule is a first-class input.
create table public.rotation_rules (
  id text primary key check (length(btrim(id)) > 0),
  statement text not null check (length(btrim(statement)) > 0),
  source_type text not null check (source_type in ('literature', 'farmer_report')),
  -- Who said it. Set for a farmer report, null for literature.
  attributed_to text,
  source_url text,
  accessed_on date not null,
  -- The crops the rule applies to, by code.
  applies_to text[] not null check (cardinality(applies_to) > 0),
  -- The crop the rule puts after the crop above, by code.
  follows text[] not null check (cardinality(follows) > 0),
  -- Why the rule holds, in the words of its source.
  mechanism text not null,
  created_at timestamptz not null default now()
);

comment on table public.rotation_rules is
  'Rotation rules with their provenance. A farmer report and a published rule are never merged.';

-- -----------------------------------------------------------------------------
-- farm_crops: the farmer's own crop records
-- -----------------------------------------------------------------------------
-- One table with a status, so the history stays queryable without a join.
create table public.farm_crops (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  -- The parcel the crop is on. Nullable, because a farmer may name a crop for
  -- the holding before it is mapped to a parcel.
  parcel_id uuid references public.parcels (id) on delete set null,
  crop_id uuid not null references public.crops (id),
  status text not null check (status in ('current', 'previous', 'planned')),
  planting_date date,
  expected_harvest_date date,
  harvest_date date,
  season text not null default 'unknown'
    check (season in ('rainy', 'dry', 'harmattan', 'year_round', 'unknown')),
  intended_use text not null default 'unknown'
    check (intended_use in ('commercial', 'household', 'both', 'unknown')),
  area_ha numeric(12, 3) check (area_ha is null or area_ha > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index farm_crops_farm_status_idx on public.farm_crops (farm_id, status);
create index farm_crops_crop_idx on public.farm_crops (crop_id);
create index farm_crops_parcel_idx on public.farm_crops (parcel_id);

create trigger farm_crops_set_updated_at
before update on public.farm_crops
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- farm_priorities: what the farmer said they want
-- -----------------------------------------------------------------------------
-- These are inputs to the comparison, not display preferences.
create table public.farm_priorities (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null unique references public.farms (id) on delete cascade,
  goals text[] not null default '{}',
  risk_tolerance numeric(3, 2) check (risk_tolerance is null or risk_tolerance between 0 and 1),
  open_to_change boolean,
  -- The planting rule the farmer states, in their own words. The engine
  -- recommends a condition, and this says which condition the farmer wants.
  planting_trigger text
    check (
      planting_trigger is null
      or planting_trigger in (
        'wait_for_confirmed_moisture',
        'plant_on_first_rains',
        'prepare_and_plant_quickly'
      )
    ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger farm_priorities_set_updated_at
before update on public.farm_priorities
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
-- crops and rotation_rules are reference data: readable by everyone, writable
-- by nobody through the client. The seed script writes them with the service
-- role.
alter table public.crops enable row level security;

create policy crops_read on public.crops for select using (true);

alter table public.rotation_rules enable row level security;

create policy rotation_rules_read on public.rotation_rules for select using (true);

-- farm_crops and farm_priorities inherit ownership from the parent farm.
alter table public.farm_crops enable row level security;

create policy farm_crops_all_own
on public.farm_crops
for all
using (
  exists (
    select 1
    from public.farms f
    where f.id = farm_crops.farm_id
      and f.farmer_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.farms f
    where f.id = farm_crops.farm_id
      and f.farmer_id = auth.uid()
  )
);

alter table public.farm_priorities enable row level security;

create policy farm_priorities_all_own
on public.farm_priorities
for all
using (
  exists (
    select 1
    from public.farms f
    where f.id = farm_priorities.farm_id
      and f.farmer_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.farms f
    where f.id = farm_priorities.farm_id
      and f.farmer_id = auth.uid()
  )
);
