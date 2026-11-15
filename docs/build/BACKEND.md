# Backend

The data platform, the external integrations, the engine contract, and the
environment keys the build needs.

---

## 1. Platform

Supabase provides PostgreSQL with PostGIS, Storage and Row Level Security.
The schema is owned through versioned migrations in `supabase/migrations/`.
The dashboard table editor is never used to create anything.

Authentication is first-party rather than Supabase Auth. See
[`ADR-0012`](../decisions/ADR-0012-first-party-authentication.md).

---

## 2. Migrations, in order

Each migration carries its table and its policies together. A table and its
policies land together or not at all.

| Migration | Creates |
| --------- | ------- |
| `20261114140000_extensions_and_profiles.sql` | PostGIS extension, `profiles` |
| `20261114141000_farms_and_parcels.sql` | `farms`, `parcels` |
| `20261114142000_catalog_and_farmer_records.sql` | `crops`, `rotation_rules`, `farm_crops`, `farm_priorities` |
| `20261114143000_case_studies.sql` | `case_studies` |
| `20261114144000_parcel_write_and_read_path.sql` | The parcel write path, RLS policies, the `auth.uid()` identity anchor |
| `20261114145000_seed_farmer_rotation_rules.sql` | Seed: the rotation rules the farmers stated, labelled `farmer_report` |
| `20261114146000_environmental_provenance_and_cache.sql` | `data_sources`, `grid_cells`, `environmental_observations`, `external_cache` |
| `20261114147000_validate_crop_parcel_ownership.sql` | Ownership validation between crop records and parcels |
| `20261114150000_crop_identity_and_unresolved_names.sql` | `unresolved_crop_names` |
| `20261114151000_analyses_recommendations_and_reports.sql` | `recommendation_rulesets`, `analyses`, `recommendations`, `rotation_strategies`, `rotation_legs`, `reports` |
| `20261114152000_seed_catalog_sources_and_case_studies.sql` | Seed: crop catalog with citations, data sources, the three case studies |
| `20261114153000_storage_buckets_and_rls.sql` | Private Storage buckets and their policies |
| `20261114154000_observations_upsert_indexes.sql` | Non-partial unique indexes so PostgREST upserts work for parcel-scoped and cell-scoped observations |
| `20261114155000_open_meteo_and_appeears_sources.sql` | Register the Open-Meteo and AppEEARS sources |
| `20261114160000_first_party_auth.sql` | `local_accounts`, `local_sessions`, `app_auth_rate_limits` |

### The geospatial rules

- Every stored geometry is SRID 4326. GeoJSON is `(lng, lat)`; PostGIS is
  `(lat, lng)`. Normalise at the boundary and test it.
- Area is `ST_Area(boundary::geography) / 10000`. `ST_Area` on a raw 4326
  geometry returns square degrees, which is wrong.
- `area_ha` is a generated column. The client cannot write it.
- A parcel carries `location_uncertainty_m` from the GPS fix. This is
  different from the dataset's `spatial_resolution_m` and different from
  `coverage_fraction`. Three separate concepts, never conflated.

### The RLS rules

RLS is the authorisation boundary. Application checks are a convenience.
Every farmer-scoped table has policies, and a table without policies is a
defect.

| Table | Access for the `authenticated` role |
| ----- | ------------------------------------ |
| `farms`, `parcels`, `farm_crops`, `farm_priorities` | Full access to rows the farmer owns |
| `crops`, `rotation_rules`, `data_sources`, `recommendation_rulesets` | Read only. These are reference data |
| `environmental_observations` | Read only. The farmer's own inputs are theirs to edit; the observations are ours |
| `analyses`, `recommendations`, `rotation_strategies` | Read only |
| `external_cache`, `grid_cells` | No access. The service role bypasses RLS |

---

## 3. Integrations

Every module lives under `apps/web/src/lib/integrations/`, is marked
`import "server-only"`, and exposes the same contract: typed, normalised
values with full provenance, an explicit timeout, at most two retries with
backoff, typed errors, and a cache read and write.

| Module | Provides | Auth | Notes |
| ------ | -------- | ---- | ----- |
| `nasa-power/` | Precipitation, temperature, root-zone soil wetness, radiation, growing degree days | **None** | Point and regional endpoints. The regional endpoint needs a bounding box of at least 2 degrees by 2 degrees, so the point endpoint is used for Kano. The fill value is `-999` and is stripped, never averaged. |
| `soilgrids/` | pH, clay, sand, silt, organic carbon, bulk density | **None** | Carries the model's own 90 percent interval: `q05`, `q50`, `q95` and the uncertainty ratio. Rate limited to 5 calls a minute, so the validation region is pre-computed rather than fetched live. |
| `open-meteo/` | Forecast and historical weather | **None** | Used for the seasonal outlook. Framed as an outlook, never as a forecast. |
| `appeears/` | SMAP, MODIS, Landsat and ECOSTRESS point and area samples | Earthdata Login | The tier 2 path. |
| `nasa-cmr/` | Granule and collection discovery | Metadata search needs no token | The discovery primitive, decoupled from any single archive's interface. |

### The pre-computed validation region

`scripts/data/precompute-validation-region.mjs` bakes the validation region
before the demo, so the demo never depends on a live upstream call.

| Setting | Value |
| ------- | ----- |
| Centre | 12.05 N, 8.27 E (Doka village, Tofa LGA) |
| Bounding box | 8.2 to 8.35 E, 12.0 to 12.1 N |
| POWER grid cell | `nasa_power:12.0000:8.1250` |
| SMAP grid cell | `smap_l3_enhanced:12.0600:8.2800` |

The script is idempotent and writes only to `data/processed/`, which is
gitignored.

### The cache

`external_cache` is keyed on `(source_id, cache_key)`. For gridded products
the key is the **rounded grid cell**, not the exact coordinate, so many
parcels in one cell share one row.

| Product | Cache key | Lifetime |
| ------- | --------- | -------- |
| POWER climatology | `point:{lat}:{lon}:{parameter}:{period}` | Never expires |
| POWER daily | `point:{lat}:{lon}:{parameter}:{date}` | Rolling for recent dates, permanent for closed periods |
| SoilGrids | `cell:{lat}:{lon}:{property}:{depth}` | Never expires. The values are static predictions |
| Open-Meteo | `forecast:{lat}:{lon}:{run_date}` | One hour |
| SMAP | `cell:{lat}:{lon}:{variable}:{date}` | Seven days |

A cached value keeps the observation date it was retrieved with. Staleness is
shown, not hidden.

---

## 4. The engine contract

Source: `apps/web/src/features/recommendations/engine/`.

The engine is deterministic, versioned and rules-based. It produces **no
composite score, no weighting system, no confidence percentage and no
verdict threshold**. See
[`ADR-0011`](../decisions/ADR-0011-product-direction-after-field-interviews.md).

### The pipeline

```
AssessmentInputs
  -> hard constraints, with the uncertain case downgraded rather than failed
  -> per-dimension assessment: measured value against a cited threshold
  -> evidence strength: strong, moderate or weak, always with the reason
  -> ordinal ordering with the basis stated, and explicit ties
  -> rationale, evidence, benefits, information gaps, local-review risks
```

### Hard constraints

A hard constraint is a threshold outside which the crop is not viable. The
catalog marks a rule as a hard constraint with a boolean flag.

| Rule | Outcome when it fails with strong evidence | Outcome when the evidence is weak |
| ---- | ----------------------------------------- | ------------------------------------ |
| Soil pH outside the crop's range | `not_suitable` | `uncertain`, which produces `conditional` |
| Soil texture unsuitable | `not_suitable` | `conditional` |
| Annual rainfall below the minimum | `not_suitable` | `conditional` |
| Temperature outside the range | `not_suitable` | `conditional` |
| Growing season too short | `not_suitable` | `conditional` |
| Water demand unmet, given the irrigation method | `not_suitable` | `conditional` |

**A constraint whose evidence is uncertain must never be decisive.** This is
the rule that keeps the system honest.

### The dimensions

| Dimension | Measures | Primary inputs |
| --------- | -------- | -------------- |
| Climate match | Rainfall and temperature against the crop's band | POWER climatology and the catalog |
| Season timing | The planting window against the locally derived onset | POWER rainfall record, the crop calendar |
| Water availability | Supply against demand, given the irrigation method | POWER rainfall and the parcel's irrigation method |
| Soil match | Texture, pH and organic carbon against the crop's preference | SoilGrids and the catalog |
| Vegetation condition | The current vegetation index against the expected stage | MODIS, Landsat |
| Risk exposure | Drought, flood and heat exposure over the relevant period | The POWER time series |
| Rotation fit | How the crop sits in the existing rotation | The catalog's rotation traits and the farm history |

### The rotation strategy

A strategy is the comparison unit. It carries the four fields the NASA
challenge brief asks for, one for one.

| Field | The brief asks for |
| ----- | ------------------ |
| `rationale` | Why it was suggested |
| `evidence` | What evidence supports it |
| `benefits` | What benefits it may offer |
| `informationGaps` | Where information gaps exist |
| `localReviewRisks` | Risks that need local review by farmers or agricultural experts |

The existing practice is always presented first and on equal terms. The
interface never labels it as the inferior option. No strategy claims a yield
improvement, because the data does not support one.

### The planting trigger

The engine never recommends a date. It recommends a condition.

| Strategy | Condition | Risk profile |
| -------- | --------- | ------------ |
| Wait for confirmed moisture | The soil retains sufficient moisture across several days | Lowest establishment risk, shortest remaining season |
| Plant on the first rains | Rainfall onset is confirmed | Longest season, highest establishment risk |
| Prepare and plant quickly | Moisture is confirmed, then act fast | Balanced |

The farmer's own stated rule selects and orders these. The engine explains
the trade-off rather than hiding it.

---

## 5. Keys the build needs

| Variable | Scope | Why |
| -------- | ----- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | The Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Safe, because RLS is the boundary |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Bypasses RLS. Never in a `NEXT_PUBLIC_` variable |
| `SUPABASE_JWT_SECRET` | **server only** | Signs the session JWT for the first-party auth layer. Required on Vercel |
| `NEXT_PUBLIC_APP_URL` | public | The canonical URL, used for auth redirects |
| `NEXT_PUBLIC_MAP_STYLE_URL` | public | The MapLibre style |
| `NEXT_PUBLIC_MAP_ATTRIBUTION` | public | The attribution string. Required for every provider |
| `NASA_EARTHDATA_USERNAME` | server | For the AppEEARS and CMR tier |
| `NASA_EARTHDATA_TOKEN` | server | For the AppEEARS and CMR tier |

**None of the demo path needs a key beyond Supabase.** NASA POWER,
SoilGrids and Open-Meteo are all reachable without authentication. That is a
deliberate risk reduction: the demo must not depend on an account approval
landing in time.

The full list, with placeholders only, is in [`.env.example`](../../.env.example).

---

## 6. Data sources

The attribution register, with licences and citation strings for every
source, is [`docs/api/data-sources.md`](../api/data-sources.md). Every
dependency and data source with its licence is listed in
[`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).

The crop requirements are cited in
[`docs/research/evidence-register.csv`](../research/evidence-register.csv).
Every row records the source, the study location, the limitations and the
confidence for Tofa. A requirement with no citation is a defect.
