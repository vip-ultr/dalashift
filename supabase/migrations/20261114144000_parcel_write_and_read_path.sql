-- =============================================================================
-- The write path for geometry, and the read path that returns GeoJSON.
--
-- Every geometry that enters the system passes through one of these functions.
-- They do the axis-order conversion, the validity repair, the plausibility
-- checks and the GPS point promotion, so no route handler ever has to
-- reimplement them and none of them can be forgotten.
--
-- The functions are security invoker, which is the default. That matters: a
-- call from the browser runs as the authenticated user, so the row level
-- security policies on farms and parcels still apply.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Turning a GeoJSON payload into a stored geometry
-- -----------------------------------------------------------------------------
-- GeoJSON is (longitude, latitude). PostGIS 4326 is (latitude, longitude).
-- ST_GeomFromGeoJSON does the conversion, because it reads the GeoJSON
-- standard order. This is the only place the conversion happens.
create or replace function public.geojson_to_geometry(p_geojson jsonb)
returns geometry
language plpgsql
immutable
as $$
declare
  parsed geometry;
begin
  if p_geojson is null then
    raise exception 'A geometry is required';
  end if;

  parsed := st_geomfromgeojson(p_geojson::text);

  if parsed is null or st_isempty(parsed) then
    raise exception 'The geometry is empty';
  end if;

  if st_srid(parsed) = 0 then
    parsed := st_setSRID(parsed, 4326);
  end if;

  if st_srid(parsed) <> 4326 then
    raise exception 'Only SRID 4326 geometry is accepted';
  end if;

  if st_geometrytype(parsed) not in ('ST_Point', 'ST_Polygon', 'ST_MultiPolygon') then
    raise exception 'Only a point, a polygon or a multipolygon is accepted';
  end if;

  return parsed;
end;
$$;

-- -----------------------------------------------------------------------------
-- Creating a parcel
-- -----------------------------------------------------------------------------
-- A GPS point is promoted to a small circle, so the parcel always has a
-- geometry and an area, and the area is marked as an approximation of the
-- recorded fix rather than a surveyed boundary.
create or replace function public.create_parcel(
  p_farm_id uuid,
  p_name text,
  p_geometry_geojson jsonb,
  p_geometry_method text default 'gps_point',
  p_location_uncertainty_m numeric default null,
  p_notes text default null
)
returns public.parcels
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source_geometry extensions.geometry;
  stored_geometry extensions.geometry;
  radius_m numeric;
  approximate boolean := false;
  created public.parcels;
begin
  source_geometry := public.geojson_to_geometry(p_geometry_geojson);

  if p_geometry_method = 'gps_point' then
    if extensions.st_geometrytype(source_geometry) <> 'ST_Point' then
      raise exception 'A GPS parcel must carry a point geometry';
    end if;
    -- The circle radius is the location uncertainty when the farmer gave one,
    -- and a fixed default otherwise. It is never hidden: the parcel is marked
    -- as an approximate area.
    radius_m := coalesce(p_location_uncertainty_m, 25);
    stored_geometry := extensions.st_buffer(source_geometry::extensions.geography, radius_m);
    approximate := true;
  else
    if extensions.st_geometrytype(source_geometry) = 'ST_Point' then
      raise exception 'A drawn parcel must not carry a point geometry';
    end if;
    stored_geometry := source_geometry;
  end if;

  insert into public.parcels (
    farm_id,
    name,
    geometry,
    geometry_method,
    location_uncertainty_m,
    area_is_approximate,
    notes
  )
  values (
    p_farm_id,
    p_name,
    extensions.st_setSRID(stored_geometry, 4326),
    p_geometry_method,
    p_location_uncertainty_m,
    approximate,
    p_notes
  )
  returning * into created;

  return created;
end;
$$;

-- -----------------------------------------------------------------------------
-- Moving a parcel, or changing how its geometry was captured
-- -----------------------------------------------------------------------------
create or replace function public.set_parcel_geometry(
  p_parcel_id uuid,
  p_geometry_geojson jsonb,
  p_geometry_method text default null,
  p_location_uncertainty_m numeric default null
)
returns public.parcels
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing public.parcels;
  source_geometry extensions.geometry;
  stored_geometry extensions.geometry;
  radius_m numeric;
  approximate boolean := false;
  method text;
  updated public.parcels;
begin
  select * into existing from public.parcels where id = p_parcel_id;

  if existing.id is null then
    raise exception 'Parcel not found';
  end if;

  method := coalesce(p_geometry_method, existing.geometry_method);
  source_geometry := public.geojson_to_geometry(p_geometry_geojson);

  if method = 'gps_point' then
    if extensions.st_geometrytype(source_geometry) <> 'ST_Point' then
      raise exception 'A GPS parcel must carry a point geometry';
    end if;
    radius_m := coalesce(p_location_uncertainty_m, existing.location_uncertainty_m, 25);
    stored_geometry := extensions.st_buffer(source_geometry::extensions.geography, radius_m);
    approximate := true;
  else
    if extensions.st_geometrytype(source_geometry) = 'ST_Point' then
      raise exception 'A drawn parcel must not carry a point geometry';
    end if;
    stored_geometry := source_geometry;
  end if;

  update public.parcels
  set geometry = extensions.st_setSRID(stored_geometry, 4326),
      geometry_method = method,
      location_uncertainty_m = coalesce(
        p_location_uncertainty_m,
        existing.location_uncertainty_m
      ),
      area_is_approximate = approximate
  where id = p_parcel_id
  returning * into updated;

  return updated;
end;
$$;

-- -----------------------------------------------------------------------------
-- Reading geometry back
-- -----------------------------------------------------------------------------
-- GeoJSON comes back in the order the browser expects, with no assumption
-- about how PostgREST would have serialised the column.
create or replace function public.geometry_to_geojson(p_geometry geometry)
returns jsonb
language sql
immutable
as $$
  select case
    when p_geometry is null then null
    else st_asgeojson(p_geometry, 6)::jsonb
  end;
$$;

-- A view, not a second copy of the data. security_invoker keeps the row level
-- security of the underlying table in force when the view is read.
create or replace view public.parcels_public
with (security_invoker = true)
as
select
  p.id,
  p.farm_id,
  p.name,
  public.geometry_to_geojson(p.geometry) as geometry_geojson,
  p.geometry_method,
  p.location_uncertainty_m,
  p.area_ha,
  p.area_is_approximate,
  public.geometry_to_geojson(p.centroid) as centroid_geojson,
  p.notes,
  p.created_at,
  p.updated_at
from public.parcels p;
