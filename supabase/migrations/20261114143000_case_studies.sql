-- =============================================================================
-- The published farmer case studies.
--
-- Decision D-10 (ADR-0011): the farmers gave their names on the record, so the
-- case studies are committed with names. Precise coordinates and contact
-- details never appear here: they live in the database, in the farms and
-- parcels tables, behind row level security.
--
-- The content is a copy of the records in docs/research/field-interviews, so
-- the published artefact and the research record cannot drift apart. The seed
-- script reads the markdown from the repository and writes it here.
-- =============================================================================

create table public.case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (length(btrim(slug)) > 0),
  farmer_name text not null check (length(btrim(farmer_name)) > 0),
  village text not null,
  lga text not null,
  state text not null,
  farming_experience text,
  -- A short, plain summary for the list screen.
  summary text not null,
  -- The full case study, as markdown.
  body text not null,
  -- The crops the farmer grows, as codes.
  crop_codes text[] not null default '{}',
  -- The planting rule the farmer stated, in their own terms.
  planting_trigger text
    check (
      planting_trigger is null
      or planting_trigger in (
        'wait_for_confirmed_moisture',
        'plant_on_first_rains',
        'prepare_and_plant_quickly'
      )
    ),
  -- The consent the farmer gave, recorded exactly as it was given.
  consented_to_publication boolean not null default false,
  consented_to_gps boolean not null default false,
  -- Only published rows are readable through the client.
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.case_studies is
  'The published farmer case studies. No geometry and no contact details live here.';

create index case_studies_published_idx on public.case_studies (published);

create trigger case_studies_set_updated_at
before update on public.case_studies
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
-- A case study is public material. The rows that are not published stay
-- invisible to the client, and nobody writes through the client: the seed
-- script uses the service role.
alter table public.case_studies enable row level security;

create policy case_studies_read_published
on public.case_studies
for select
using (published = true);
