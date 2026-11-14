-- A crop record may only reference a parcel within the same farm. RLS on the
-- parent farm remains the ownership boundary; this trigger protects the
-- relationship between the farmer's crop record and its parcel.
create or replace function public.validate_farm_crop_parcel_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parcel_id is not null and not exists (
    select 1
    from public.parcels p
    where p.id = new.parcel_id
      and p.farm_id = new.farm_id
  ) then
    raise exception 'Parcel must belong to the same farm as the crop record';
  end if;

  return new;
end;
$$;

create trigger farm_crops_validate_parcel
before insert or update of farm_id, parcel_id on public.farm_crops
for each row execute function public.validate_farm_crop_parcel_ownership();
