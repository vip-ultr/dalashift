-- =============================================================================
-- Private Supabase Storage buckets (`farm-reports` and `farm-attachments`),
-- per-farmer / per-farm storage RLS policies, and PostGIS search-path
-- qualification for parcel trigger/helper functions.
--
-- Architecture reference: ARCHITECTURE.md § 12, ADR-0003, ADR-0006, and
-- docs/database/rls-policies.md.
--
-- Storage path convention:
--   {farmer_id}/{farm_id}/{filename}
-- Every object is private and accessed only by the owning farmer or through a
-- short-lived signed URL generated after RLS verification.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Qualify PostGIS functions in parcel trigger/helper functions so calls from
--    `create_parcel` and `set_parcel_geometry` (which run with `search_path = ''`)
--    always resolve `extensions.*` cleanly.
-- -----------------------------------------------------------------------------
create or replace function public.geojson_to_geometry(p_geojson jsonb)
returns extensions.geometry
language plpgsql
immutable
set search_path = ''
as $$
declare
  parsed extensions.geometry;
begin
  if p_geojson is null then
    raise exception 'A geometry is required';
  end if;

  parsed := extensions.st_geomfromgeojson(p_geojson::text);

  if parsed is null or extensions.st_isempty(parsed) then
    raise exception 'The geometry is empty';
  end if;

  if extensions.st_srid(parsed) = 0 then
    parsed := extensions.st_setsrid(parsed, 4326);
  end if;

  if extensions.st_srid(parsed) <> 4326 then
    raise exception 'Only SRID 4326 geometry is accepted';
  end if;

  if extensions.st_geometrytype(parsed) not in ('ST_Point', 'ST_Polygon', 'ST_MultiPolygon') then
    raise exception 'Only a point, a polygon or a multipolygon is accepted';
  end if;

  return parsed;
end;
$$;

create or replace function public.geometry_to_geojson(p_geometry extensions.geometry)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case
    when p_geometry is null then null
    else extensions.st_asgeojson(p_geometry, 6)::jsonb
  end;
$$;

create or replace function public.normalise_parcel_geometry()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  repaired extensions.geometry;
begin
  repaired := extensions.st_collectionextract(extensions.st_makevalid(new.geometry), 3);
  if repaired is null or extensions.st_isempty(repaired) then
    raise exception 'Parcel geometry is empty or cannot be repaired';
  end if;
  new.geometry := extensions.st_setsrid(extensions.st_multi(repaired), 4326);
  return new;
end;
$$;

create or replace function public.refresh_farm_geometry()
returns trigger
language plpgsql
set search_path = ''
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
        select extensions.st_centroid(extensions.st_collect(p.geometry))
        from public.parcels p
        where p.farm_id = target_farm_id
      ),
      updated_at = now()
  where f.id = target_farm_id;

  return null;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Private Supabase Storage buckets (ARCHITECTURE.md § 12)
-- -----------------------------------------------------------------------------
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'farm-reports',
    'farm-reports',
    false,
    10485760,
    array['application/json', 'application/pdf', 'text/html', 'text/markdown']
  ),
  (
    'farm-attachments',
    'farm-attachments',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- 3. Helper function to check whether a storage object path
--    `{farmer_id}/{farm_id}/{filename}` belongs to a farm owned by `auth.uid()`.
-- -----------------------------------------------------------------------------
create or replace function public.user_owns_storage_farm_path(p_object_name text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce((storage.foldername(p_object_name))[1], '') = auth.uid()::text
    and exists (
      select 1
      from public.farms f
      where f.id::text = coalesce((storage.foldername(p_object_name))[2], '')
        and f.farmer_id = auth.uid()
    );
$$;

comment on function public.user_owns_storage_farm_path(text) is
  'Verifies that a Storage object key follows {farmer_id}/{farm_id}/... and that the authenticated user owns the referenced farm.';

-- -----------------------------------------------------------------------------
-- 4. RLS policies on `storage.objects` for `farm-reports` and `farm-attachments`
-- -----------------------------------------------------------------------------
drop policy if exists farm_storage_select_own on storage.objects;
create policy farm_storage_select_own
on storage.objects
for select
to authenticated
using (
  bucket_id in ('farm-reports', 'farm-attachments')
  and public.user_owns_storage_farm_path(name)
);

drop policy if exists farm_storage_insert_own on storage.objects;
create policy farm_storage_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('farm-reports', 'farm-attachments')
  and public.user_owns_storage_farm_path(name)
);

drop policy if exists farm_storage_update_own on storage.objects;
create policy farm_storage_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id in ('farm-reports', 'farm-attachments')
  and public.user_owns_storage_farm_path(name)
)
with check (
  bucket_id in ('farm-reports', 'farm-attachments')
  and public.user_owns_storage_farm_path(name)
);

drop policy if exists farm_storage_delete_own on storage.objects;
create policy farm_storage_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('farm-reports', 'farm-attachments')
  and public.user_owns_storage_farm_path(name)
);
