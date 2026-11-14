-- =============================================================================
-- Non-partial unique indexes on public.environmental_observations so PostgREST
-- upsert (ON CONFLICT) works for both parcel-scoped and grid-cell-scoped rows.
-- =============================================================================

create unique index if not exists environmental_observations_parcel_uq
  on public.environmental_observations (
    parcel_id, source_key, variable, observed_at, aggregation_method
  );

create unique index if not exists environmental_observations_grid_parcel_uq
  on public.environmental_observations (
    grid_cell_id, parcel_id, source_key, variable, observed_at, aggregation_method
  ) nulls not distinct;
