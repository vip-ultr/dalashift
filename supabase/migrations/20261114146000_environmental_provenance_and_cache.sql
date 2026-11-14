-- =============================================================================
-- Environmental source registry, grid cells, observations and durable cache.
--
-- Farmer observations remain read-only to authenticated clients. Only trusted
-- ingestion/administrative code writes these scientific records. The cache
-- has no authenticated policies and is only available to the service role.
-- =============================================================================

create table public.data_sources (
  source_key text primary key check (length(btrim(source_key)) > 0),
  name text not null check (length(btrim(name)) > 0),
  source_url text not null,
  licence text not null,
  attribution text not null,
  spatial_resolution_m integer not null check (spatial_resolution_m > 0),
  temporal_resolution text not null,
  is_modelled boolean not null,
  created_at timestamptz not null default now()
);

comment on table public.data_sources is
  'Attribution and resolution registry for every environmental observation source.';

insert into public.data_sources (
  source_key,
  name,
  source_url,
  licence,
  attribution,
  spatial_resolution_m,
  temporal_resolution,
  is_modelled
)
values
  (
    'nasa_power',
    'NASA POWER Agroclimatology',
    'https://power.larc.nasa.gov/docs/services/api/temporal/daily/',
    'NASA POWER terms; courtesy attribution required',
    'The data was obtained from NASA Langley Research Center''s POWER project, funded through the NASA Earth Science Division.',
    55000,
    'daily',
    true
  ),
  (
    'soilgrids',
    'ISRIC SoilGrids 2.0',
    'https://docs.isric.org/globaldata/soilgrids/',
    'CC BY 4.0',
    'SoilGrids 2.0, ISRIC World Soil Information, CC BY 4.0. Changes and access date must be stated.',
    250,
    'static',
    true
  )
on conflict (source_key) do update set
  name = excluded.name,
  source_url = excluded.source_url,
  licence = excluded.licence,
  attribution = excluded.attribution,
  spatial_resolution_m = excluded.spatial_resolution_m,
  temporal_resolution = excluded.temporal_resolution,
  is_modelled = excluded.is_modelled;

create table public.grid_cells (
  id uuid primary key default gen_random_uuid(),
  source_key text not null references public.data_sources (source_key),
  cell_key text not null check (length(btrim(cell_key)) > 0),
  geometry geometry(polygon, 4326) not null,
  created_at timestamptz not null default now(),
  constraint grid_cells_geometry_valid check (st_isvalid(geometry) and not st_isempty(geometry)),
  unique (source_key, cell_key)
);

create index grid_cells_geometry_gist on public.grid_cells using gist (geometry);

create table public.environmental_observations (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references public.parcels (id) on delete cascade,
  grid_cell_id uuid references public.grid_cells (id),
  source_key text not null references public.data_sources (source_key),
  variable text not null check (length(btrim(variable)) > 0),
  value double precision,
  unit text not null check (length(btrim(unit)) > 0),
  spatial_resolution_m integer not null check (spatial_resolution_m > 0),
  temporal_resolution text not null,
  observed_at timestamptz not null,
  retrieved_at timestamptz not null,
  is_modelled boolean not null,
  aggregation_method text not null
    check (aggregation_method in ('grid_cell', 'point_sample', 'zonal', 'interpolated_point')),
  quality_flag text not null default 'good'
    check (quality_flag in ('good', 'suspect', 'missing', 'partial')),
  coverage_fraction double precision check (coverage_fraction is null or coverage_fraction between 0 and 1),
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint observations_have_target check (parcel_id is not null or grid_cell_id is not null),
  constraint observations_missing_value_consistent check ((value is null) = (quality_flag = 'missing'))
);

create index environmental_observations_parcel_series_idx
  on public.environmental_observations (parcel_id, variable, observed_at desc)
  where parcel_id is not null;
create index environmental_observations_grid_series_idx
  on public.environmental_observations (grid_cell_id, variable, observed_at desc)
  where grid_cell_id is not null;
create index environmental_observations_source_idx
  on public.environmental_observations (source_key, variable, observed_at desc);
create unique index environmental_observations_parcel_value_unique
  on public.environmental_observations (
    parcel_id, source_key, variable, observed_at, aggregation_method
  ) where parcel_id is not null;
create unique index environmental_observations_grid_value_unique
  on public.environmental_observations (
    grid_cell_id, source_key, variable, observed_at, aggregation_method
  ) where grid_cell_id is not null and parcel_id is null;

comment on table public.environmental_observations is
  'Normalized environmental values with source, resolution, time and model provenance. Rasters are never stored here.';

create table public.external_cache (
  id uuid primary key default gen_random_uuid(),
  source_key text not null references public.data_sources (source_key),
  cache_key text not null check (length(btrim(cache_key)) > 0),
  normalized_payload jsonb not null,
  fetched_at timestamptz not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source_key, cache_key)
);

create index external_cache_expiry_idx on public.external_cache (expires_at)
  where expires_at is not null;

-- Reference data is readable, but only trusted ingestion code may write it.
alter table public.data_sources enable row level security;
create policy data_sources_read on public.data_sources for select using (true);

alter table public.grid_cells enable row level security;
create policy grid_cells_read on public.grid_cells for select using (true);

-- A shared cell-level value can be read by authenticated users. Parcel-linked
-- values are visible only to the owner of that parcel's farm.
alter table public.environmental_observations enable row level security;
create policy observations_read_shared_or_own
on public.environmental_observations
for select
using (
  parcel_id is null
  or exists (
    select 1
    from public.parcels p
    join public.farms f on f.id = p.farm_id
    where p.id = environmental_observations.parcel_id
      and f.farmer_id = auth.uid()
  )
);

-- No authenticated policies on observations or cache. Service role writes are
-- restricted to ingestion jobs and administrative operations.
alter table public.external_cache enable row level security;
