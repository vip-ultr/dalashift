# Changelog

All notable changes to DalaShift are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
the project uses [semantic versioning](https://semver.org/spec/v2.0.0.html)
for the published packages.

**During the NASA Space Apps build (14 to 15 November 2026)** the changelog is
updated with every push to `main`, because the repository is the evidence of
the build.

---

## [Unreleased]

### Map interaction and place search (19 November 2026)

- Fixed drawn polygons not painting by bundling the MapLibre worker in `apps/web/public/` and setting its URL explicitly.
- Done and Undo now work while drawing. Done closes and saves the polygon and leaves draw mode; Undo removes the last placed corner through Terra Draw mode-level history. The drawing status bar and its buttons are smaller.
- All map overlays now use translucent glass, including the Esri attribution. The attribution starts collapsed and opens only when the farmer taps its info button. Removed the decorative chevron from the field pill.
- Added offline Kano place search backed by 1,085 LGAs, towns and villages (curated data plus GeoNames populated places). Results are ranked, deduplicated by name and fly the camera to the chosen place. The search panel follows the map width on phones and uses a faded placeholder.
- The map is full-bleed on mobile and taller for easier navigation (62vh, with a 420px minimum and 560px cap). The Layers sheet and icon controls are compact on small screens. Hover tooltips label the search, Layers, zoom, location and draw buttons.

### Interface language

- English remains the default and Hausa is available on every view. Added a 553-key EN/HA dictionary in `packages/shared/i18n/messages.ts` and wired the map, wizard, farms, landing, workspace, reports, authentication, methodology and layout chrome through `useLanguage()`.
- "Add farm" is translated as "Kara Gona". Planting trigger titles, generated field names and data-state errors follow the active language, including when the language changes after data has loaded.
- Removed the duplicate language switcher from the dashboard top bar. The sidebar and menu keep the single switcher.

### Mobile form controls

- Water supply is now a dropdown on all devices instead of a stacked segmented control. Select menus and segmented controls are compact on phones while keeping text at 12px or larger.
- Localised the accessibility skip link.

### Verification

- `pnpm check`, `pnpm validate:style`, `pnpm validate:links`, `pnpm test` (25 shared and 28 web tests) and `pnpm build` all pass.
- Browser checks at 390, 768 and 1440 widths found no overflow, no sub-12px text, no hydration errors and no console errors.

### Mapping and Geospatial Visualisation

- Reworked the interactive MapLibre honesty canvas (`honesty-map-canvas.tsx`):
  - Parcels now render their real geometry (GPS points or drawn polygons) instead of a decorative rectangle; the resolution footprint is derived from the selected source's real spatial resolution.
  - Added real polygon drawing with Terra Draw through a custom MapLibre adapter, so farmers can trace a field boundary. Client area is a labelled preview; PostGIS remains the authority on stored area.
  - GPS capture uses high-accuracy `getCurrentPosition`, flies the camera to the acquired point, and shows an explicit message on denial. No demo coordinate is ever captured silently as a fallback.
  - Selecting a parcel now flies the camera to it, and the map is no longer destroyed and rebuilt on every parent render.
  - Configured satellite source `maxzoom` so deep zoom does not return missing tiles.

### Repository compliance

- Adopted the **Apache License 2.0**. The `LICENSE` file now carries the
  complete, unmodified official text, and the SPDX identifier `Apache-2.0` is
  set in the root `package.json` and in every workspace package.
  [`ADR-0001`](./docs/decisions/ADR-0001-open-source-license.md) is
  Accepted.
- Recorded the repository visibility decision. The repository is **public**,
  as the NASA submission requires. [`ADR-0009`](./docs/decisions/ADR-0009-repository-visibility.md)
  is Accepted.
- Restored the three CI gates that were failing on `main`:
  - **Link check.** The five handoff documents under `docs/build/` were
    referenced from `README.md` and `ARCHITECTURE.md` but had never been
    committed. The cause was a `build/` rule in `.gitignore` that silently
    excluded the whole directory. The rule is now negated for `docs/build/`
    and the documents are tracked.
  - **Writing style.** The verbatim-record exemption in the style checker
    matched a POSIX path pattern against `path.relative()`, which returns
    backslashes on Windows. The path is now normalised before matching, so
    the exemption applies on every platform.
  - **Formatting.** Added a `.gitattributes` that pins line endings to LF on
    every platform, and set `core.autocrlf=false` for this repository. A
    Windows checkout with the default `core.autocrlf=true` was rewriting
    every tracked text file to CRLF, which made `pnpm format:check` fail
    locally while passing in CI.
- Rewrote the `README.md` to describe the shipped product rather than the
  planned one: the live status, the requirement-by-requirement position
  against the NASA challenge brief, the actual engine contract, the three
  Tofa field case studies, and the corrected licence and visibility records.

### Authentication

- Replaced Supabase Auth signup and sign-in with first-party account endpoints.
  Passwords use scrypt hashes, opaque session cookies are HttpOnly and
  time-limited, and farm data remains protected by `auth.uid()`-based RLS.
- Preserved existing account UUIDs and farm ownership. Existing password hashes
  cannot be migrated; a verified legacy-account reset flow remains required.
- Added Vercel configuration for the server-only `SUPABASE_JWT_SECRET`.
  Email and phone verification are not available in this release.

### Frontend Handoff Completed

- Sign-in and registration use Supabase Auth with validation and explicit
  consent.
- Farm onboarding creates the holding, parcels, crop records and priorities
  through the existing authenticated endpoints, then requests an analysis.
  Partial saves are surfaced instead of silently discarded.
- Registered holdings load from the signed-in farmer's API response.
  Case-study pages continue to use published examples, and unknown farm IDs no
  longer fall back to a public demo.
- Registered-farm workspaces and reports use backend data, run comparisons and
  generate printable reports with source attribution and coordinate redaction.
- Profile language preference loads from and saves to `/api/profile`; workspace
  perspective remains session-only, and coordinate redaction is always enforced.
- Web dev, build and start commands load the repository-root `.env.local`,
  preserve deployment-injected values, and exclude Supabase CLI credentials.
- Inter and Geologica are bundled locally, removing build-time Google Fonts
  requests. Web development and production builds use Webpack because the
  Next.js 16.4.6 Turbopack report route panicked during local verification.
- Verification passed: Web production build, TypeScript, ESLint, all 13
  Vitest tests, formatting, writing-style and Markdown-link checks. Route smoke
  tests returned 200, and unauthenticated `GET /api/farms` returned 401.

### Fixed

- Added non-partial unique indexes on `public.environmental_observations`
  (`20261114154000_observations_upsert_indexes.sql`) so PostgREST upserts work
  for both parcel-scoped and grid-cell-scoped observations, and configured IPv4
  DNS resolution in Next.js server instrumentation (`apps/web/src/instrumentation.ts`)
  and data scripts to avoid Happy Eyeballs connection timeouts on high-RTT
  networks.
- Qualified PostGIS geometry types and functions in the parcel migration so
  its empty search path works when the migration is applied.

### Added

- Frontend design system, OneSoil-inspired workspace shell, and full page suite
  in `apps/web/src`:
  - `Geologica` + `Inter` typography pairing (`app/layout.tsx`) and warm sand
    (`#f6f4ef`), action green (`#00b159`), deep forest (`#0a4232`), terracotta
    (`#ab6a43`), and dark obsidian HUD (`rgba(17, 19, 21, 0.84)`) design tokens
    (`app/globals.css`, `docs/design/design-system.md`).
  - Core UI primitives (`components/ui/button.tsx`, `input.tsx`, `label.tsx`,
    `textarea.tsx`, `badge.tsx`, `segmented-control.tsx`, `underline-tabs.tsx`,
    `skeleton.tsx`) and resolution honesty / Hausa crop formatters
    (`lib/utilities/format.ts`, `lib/utilities/cn.ts`).
  - Shared domain, map, and chart components: `ProvenanceLine`,
    `DataStateBoundary`, `SituationBanner`, `PlantingTriggerCard`,
    `DimensionThresholdRow`, `RotationStrategyCard`, `SuitabilityShortlistCard`,
    `SeasonalOutlookPanel`, `ParcelVectorThumbnail`, `HonestyMapCanvas`,
    `HonestyTimeSeriesChart`, `ParcelWorkspaceView`, and `PrintableFieldSheet`.
  - Desktop `56px` vertical icon rail (`WorkspaceRail`), `288px` collapsible
    parcel and case study drawer (`ParcelSidebarDrawer`), and public header
    (`PublicNavbar`).
  - Application pages for `/` (landing page with the validation-area case
    studies and resolution honesty comparison), `/login` and `/register` (`AuthCard`),
    `/cases` and `/cases/[slug]` (public Tofa LGA case studies), `/farms`,
    `/farms/new` (3-step onboarding wizard with Hausa crop aliases, `"beans"`
    ambiguity guardrail, and GPS point / polygon support), `/farms/[farmId]`,
    `/reports` and `/farms/[farmId]/reports` (printable A4 field sheets with
    redacted coordinates), `/methodology`, and `/profile`.
- Server-only Open-Meteo integration (`lib/integrations/open-meteo/index.ts`) for
  7-to-16 day weather, evapotranspiration and volumetric soil moisture
  forecasts (`0-1 cm` and `9-27 cm`), plus the NASA AppEEARS point-extraction
  client (`lib/integrations/appeears/index.ts`) for `MOD13Q1.061` (250 m NDVI),
  `MOD11A2.061` (1 km LST), `SPL3SMP_E.006` (9 km SMAP soil moisture),
  `SRTMGL1_NC.003` (30 m DEM) and `L09.002` (30 m Landsat 9 surface
  reflectance), registered in `public.data_sources` via
  `20261114155000_open_meteo_and_appeears_sources.sql`.
- Extended `scripts/data/precompute-validation-region.mjs` to fetch NASA POWER
  daily and climatology observations plus NASA CMR granule metadata (`SPL3SMP_E`
  v006 SMAP and `MOD13Q1` v061 MODIS NDVI) for Tofa LGA (`12.05 N, 8.27 E`) and
  seed `public.grid_cells`, `public.external_cache` and
  `public.environmental_observations` on the live Supabase database.
- Private Supabase Storage bucket migration (`farm-reports` and
  `farm-attachments`) with per-farmer and per-farm prefix RLS policies on
  `storage.objects`, server-only storage helpers (`lib/supabase/storage.ts`,
  `lib/supabase/admin.ts`) for uploading report artifacts and generating
  short-lived signed URLs, and the `/api/profile` endpoint.
- Backend API endpoints for single-farm and single-parcel CRUD
  (`/api/farms/{farmId}`, `/api/farms/{farmId}/parcels/{parcelId}`), crop
  catalog search (`/api/catalog/crops`), parcel environmental
  observations (`/api/farms/{farmId}/environment`), qualitative rotation and
  suitability comparison (`/api/farms/{farmId}/compare`) and printable farm
  reports (`/api/farms/{farmId}/reports`).
- Printable farm report builder (`buildFarmReportPayload`) with mandatory NASA
  POWER, ISRIC SoilGrids and Earth observation attributions and redacted parcel
  coordinates by default (ADR-0011 D-12), plus the Tofa LGA validation-region
  pre-computation script (`scripts/data/precompute-validation-region.mjs`).
- Catalog-to-engine crop input builder, three-strategy rotation builder
  (existing practice plus literature and farmer-report alternatives),
  prospective farmer suitability engine with explicit ties, planting trigger
  condition engine, and seasonal risk outlook engine.
- Migrations for `recommendation_rulesets`, `analyses`, qualitative
  `recommendations`, `rotation_strategies`, `rotation_legs` and `reports` with
  Row Level Security, plus seeding for the verified research crop catalog,
  literature rotation evidence, additional NASA/open data sources and the
  published anonymised Tofa LGA case studies.
- Server-only service-role Supabase client helper, deterministic grid-cell
  geospatial utilities, and a request-coalescing read-through cache and
  observation persistence layer.
- NASA POWER climatology point adapter, ISRIC SoilGrids 2.0 adapter with
  `d_factor` unit conversion and null-void handling, and NASA Earthdata CMR
  granule metadata search.
- Agronomy research artifacts for the crop catalog and rotation comparison:
  claim-level evidence register, source-backed reference data with unknowns
  left unset, rotation evidence and CDA review questions.
- Crop catalog identity fields distinguish scientific identity, farmer-reported
  names, cultivar, seed/market class and verified aliases. Soybean remains
  distinct; “beans” stays unresolved, and “white cowpeas” is retained as a
  reported cowpea descriptor pending Tofa farmer and CDA clarification.
- Supabase CLI project setup and crop identity migration, including a
  provenance-aware farmer-name catalog and unresolved local crop names.
- Server-only NASA POWER daily point adapter for precipitation, air
  temperature and root-zone wetness, with response validation, fill-value
  handling, bounded retries and per-value provenance.
- Authenticated farm list and create endpoints at `/api/farms`.
- Authenticated parcel list and create endpoints at `/api/farms/{farmId}/parcels`.
  Parcel writes use the PostGIS RPC, and farm ownership comes from the verified
  session and database RLS.
- Initial Supabase migrations for profiles, farms, parcels, crop and rotation
  catalogs, farmer records, case studies, and parcel geometry read/write.
- Two sourced farmer-reported rotation rules, kept distinct from published
  agronomic guidance.
- Environmental source registry, grid-cell geometry, provenance-complete
  observations, and a durable normalized-response cache schema with RLS.
- Shared observation contracts support an explicit missing value with a
  matching `missing` quality flag.
- Qualitative crop assessment engine that compares supplied observations to
  cited per-dimension requirements without scores or invented thresholds.
- Farmer crop history and priorities APIs with session authentication, request
  validation, RLS-backed access and same-farm parcel reference enforcement.
- Crop records support update and delete operations, including the farmer's
  actual harvest date.
- Rotation comparison orders supplied strategies by crop verdict and the
  dimension statuses tied to supported farmer goals, with explicit ties.
- Request-scoped Supabase browser and server clients using the public key and
  the signed-in user's RLS context.
- `packages/shared`: the qualitative comparison engine vocabulary. Evidence
  strengths, assessment statuses, assessment dimensions, rule source types,
  planting triggers, farmer goals, limitation kinds and evidence kinds.
- `packages/shared`: the domain types for the qualitative engine. A
  `DimensionAssessment` carries a measured value, a cited threshold, a status
  and a plain-language explanation. A `CropAssessment` carries dimension
  assessments, limitations, an evidence strength and its reason. A
  `RotationStrategy` carries the rationale, the evidence, the benefits, the
  information gaps and the local review risks.
- `packages/shared`: the parcel model. A `Farm` is a holding and a `Parcel` is
  the unit of analysis, with a `geometryMethod` recording whether the geometry
  came from a GPS point or a drawn polygon.
- `packages/shared`: Zod schemas for every new boundary. Parcels, farmer
  priorities, dimension assessments, limitations, evidence items, crop
  requirements and rotation rules.

### Changed

- `packages/shared/types`: `Recommendation` no longer carries `score`,
  `subscores` or a numeric `confidence`. Per ADR-0011 decision D-05 there is
  no composite score, no weighting system and no confidence percentage.
- `packages/shared/constants`: added the qualitative engine vocabulary. The
  existing constants are unchanged.

### Notes

- The engine compares a measured value against a cited threshold. It does not
  produce a suitability index, and nothing in the interface may imply one.
- Farmer reports and published agronomy are kept apart by a required
  `sourceType` on every rule and every requirement.

---

## [0.1.0] - 2026-11-13

### Added

- The Phase 1 foundation: research, product definition, architecture, the
  database design, the repository skeleton, tooling and CI.
- The NASA Space Apps participation reference, with every rule verified
  against official sources on 2026-11-13.
- ADR-0001 to ADR-0010, covering the licence, the monorepo, the data
  platform, the rules engine, the geospatial strategy, data retention, the map
  tile provider, Google Earth Engine, repository visibility and the dependency
  policy.
- The shared package skeleton: constants, types, Zod schemas and their tests.

### Changed

- The writing convention: no em dash anywhere in a tracked text file, checked
  mechanically by `pnpm validate:style`.
- The CI workflow moved to Node 24 actions and the secret scan stopped
  commenting on pull requests.

---

[Unreleased]: https://github.com/vip-ultr/dalashift/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/vip-ultr/dalashift/releases/tag/v0.1.0
