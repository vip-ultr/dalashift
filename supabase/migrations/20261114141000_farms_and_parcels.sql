-- =============================================================================
-- Farms and parcels.
--
-- Decision D-05 (ADR-0011): a farm is a holding, not a single field. The
-- farmer in interview 01 said it directly: "they are not located in one single
-- contiguous piece". So the geometry lives on the parcel, and the parcel is
-- the unit of analysis for every environmental reading and every comparison.
--
-- Decision D-06: a parcel geometry is captured either as a GPS point or as a
-- drawn polygon. Both are accepted. The GPS point is the default path, because
-- it is what the farmers actually carry.
--
-- The three spatial concepts are kept separate, as the ADR requires:
--   location_uncertainty_m  how far the recorded fix may be off (from the GPS)
--   spatial_resolution_m    how fine an environmental dataset is (from the source)
--   coverage_fraction       how much of the parcel a dataset actually covered
-- Only the first one lives here.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- farms
-- -----------------------------------------------------------------------------
-- The holding. It has no geometry of its own: its area and its centre are the
-- sum and the centre of its parcels, maintained by the trigger below.
create table public.farms (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  farming_method text not null default 'unknown'
    check (farming_method in ('rainfed', 'irrigated', 'mixed', 'unknown')),
  irrigation_method text not null default 'unknown'
    check (
      irrigation_method in (
        'none',
        'rainfed',
        'hand_irrigation',
        'furrow',
        'sprinkler',
        'drip',
        'well',
        'river',
        'unknown'
      )
    ),
  soil_notes text,
  elevation_m numeric(7, 2) check (elevation_m is null or elevation_m between -500 and 9000),
  -- Maintained by refresh_farm_geometry() from the farm's parcels.
  area_ha numeric(12, 3) not null default 0 check (area_ha >= 0),
  centroid geometry(point, 4326),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.farms.area_ha is
  'Total area of the farm in hectares, the sum of its parcels. Maintained by a trigger.';
comment on column public.farms.centroid is
  'Centre of the farm, the centroid of the union of its parcels. Maintained by a trigger.';

create index farms_farmer_id_idx on public.farms (farmer_id);
create index farms_centroid_gist on public.farms using gist (centroid);

create trigger farms_set_updated_at
before update on public.farms
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- parcels
-- -----------------------------------------------------------------------------
-- The unit of analysis. One geometry, always present.
create table public.parcels (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  -- SRID 4326 for every stored geometry, as the PostGIS design requires.
  geometry geometry not null,
  geometry_method text not null default 'gps_point'
    check (geometry_method in ('gps_point', 'drawn_polygon')),
  -- How far the recorded location may be off, in metres. From the GPS fix.
  location_uncertainty_m numeric(8, 1)
    check (location_uncertainty_m is null or location_uncertainty_m between 0 and 5000),
  -- The area is computed by PostGIS on the real earth, never in JavaScript.
  area_ha numeric(12, 3)
    generated always as (st_area(geometry::geography) / 10000.0) stored,
  centroid geometry(point, 4326)
    generated always as (st_centroid(geometry)) stored,
  -- True when the parcel was promoted from a GPS point, so the area is an
  -- approximation of the recorded fix rather than a surveyed boundary.
  area_is_approximate boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint parcels_geometry_not_empty check (not st_isempty(geometry)),
  constraint parcels_geometry_valid check (st_isvalid(geometry)),
  constraint parcels_geometry_srid check (st_srid(geometry) = 4326),
  constraint parcels_geometry_type check (
    st_geometrytype(geometry) in ('ST_Polygon', 'ST_MultiPolygon')
  ),
  constraint parcels_area_sane check (area_ha > 0 and area_ha < 100000)
);

comment on table public.parcels is
  'One geometry inside a farm, and the unit the engine analyses. The area and the centre are computed by PostGIS.';

create index parcels_farm_id_idx on public.parcels (farm_id);
create index parcels_geometry_gist on public.parcels using gist (geometry);

create trigger parcels_set_updated_at
before update on public.parcels
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Geometry normalisation on write
-- -----------------------------------------------------------------------------
-- A farmer dragging a vertex across another produces a self-intersecting
-- polygon. ST_MakeValid repairs it and ST_CollectionExtract keeps only the
-- polygonal parts, because MakeValid can return a GeometryCollection.
create or replace function public.normalise_parcel_geometry()
returns trigger
language plpgsql
as $$
declare
  repaired geometry;
begin
  repaired := st_collectionextract(st_makevalid(new.geometry), 3);
  if repaired is null or st_isempty(repaired) then
    raise exception 'Parcel geometry is empty or cannot be repaired';
  end if;
  new.geometry := st_set_srid(st_multi(repaired), 4326);
  return new;
end;
$$;

create trigger parcels_normalise_geometry
before insert or update of geometry on public.parcels
for each row execute function public.normalise_parcel_geometry();

-- -----------------------------------------------------------------------------
-- Keeping the farm's area and centre in step with its parcels
-- -----------------------------------------------------------------------------
-- The farm's area is the sum of its parcels. It cannot be a generated column,
-- because a generated column may not read another table.
create or replace function public.refresh_farm_geometry()
returns trigger
language plpgsql
as $$
declare
  target_farm_id uuid;
begin
  target_farm_id := coalesce(new.farm_id, old.farm_id);

  update public.farms f
  set area_ha = coalesce(
        (
          select sum(p.area_ha)
          from public.parcels p
          where p.farm_id = target_farm_id
        ),
        0
      ),
      centroid = (
        select st_centroid(st_collect(p.geometry))
        from public.parcels p
        where p.farm_id = target_farm_id
      ),
      updated_at = now()
  where f.id = target_farm_id;

  return null;
end;
$$;

create trigger parcels_refresh_farm
after insert or update or delete on public.parcels
for each row execute function public.refresh_farm_geometry();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
-- farms: anchored on farmer_id, which is the auth user id.
alter table public.farms enable row level security;

create policy farms_select_own
on public.farms
for select
using (farmer_id = auth.uid());

create policy farms_insert_own
on public.farms
for insert
with check (farmer_id = auth.uid());

create policy farms_update_own
on public.farms
for update
using (farmer_id = auth.uid())
with check (farmer_id = auth.uid());

create policy farms_delete_own
on public.farms
for delete
using (farmer_id = auth.uid());

-- parcels: no farmer_id of their own, so ownership is inherited from the
-- parent farm. The EXISTS subquery is the inheritance mechanism.
alter table public.parcels enable row level security;

create policy parcels_all_own
on public.parcels
for all
using (
  exists (
    select 1
    from public.farms f
    where f.id = parcels.farm_id
      and f.farmer_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.farms f
    where f.id = parcels.farm_id
      and f.farmer_id = auth.uid()
  )
);
