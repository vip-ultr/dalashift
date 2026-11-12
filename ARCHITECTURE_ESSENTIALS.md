# Architecture Essentials — DalaShift

**Condensed reference. Read this before implementing anything.**
Full detail: [`ARCHITECTURE.md`](./ARCHITECTURE.md). Rules for agents:
[`AGENTS.md`](./AGENTS.md).

| Field        | Value                        |
| ------------ | ---------------------------- |
| Status       | Phase 2 — approved baseline  |
| Last updated | 2026-11-13                   |

---

## 1. Approved stack

| Layer             | Choice                                          | Version    |
| ----------------- | ----------------------------------------------- | ---------- |
| Framework         | Next.js (App Router)                            | 16.x       |
| UI library        | React                                           | 19.x       |
| Language          | TypeScript (strict)                             | 5.7+       |
| Styling           | Tailwind CSS                                    | 4.x        |
| Components        | shadcn/ui (new-york), Lucide icons             | —          |
| Charts            | Recharts                                        | 3.x        |
| Maps              | MapLibre GL JS + Terra Draw                     | 6.x / 1.x  |
| Backend           | Next.js server-side (Route Handlers, Actions)   | —          |
| Database          | Supabase PostgreSQL + PostGIS                   | —          |
| Auth              | Supabase Auth                                   | —          |
| Storage           | Supabase Storage (private buckets)              | —          |
| DB security       | Row Level Security                              | —          |
| Hosting           | Vercel                                          | —          |
| Tooling           | Node 22 LTS, pnpm 9.6, ESLint 9, Prettier 3     | —          |
| Testing           | Vitest, Playwright                              | 5.x / 1.x  |
| Repo              | GitHub monorepo, `main` branch                  | —          |

**Changing any of these requires a team-approved ADR.** Do not silently swap a
library.

---

## 2. Core principles — the short list

1. **External API calls happen only in `src/lib/integrations/`**, which is
   `import "server-only"`.
2. **No secret reaches the browser.** `NEXT_PUBLIC_*` means public.
3. **PostGIS computes all geometry.** `ST_Area(boundary::geography)` for area.
   Never trust a client-computed area.
4. **Provenance is mandatory.** Every environmental value carries source,
   licence, spatial resolution, temporal resolution, observation date,
   retrieved date and `isModelled`.
5. **The recommendation engine is deterministic and rules-based.** An LLM may
   paraphrase output only — never score, verdict or add a number.
6. **Missing data lowers confidence and is stated.** It is never a silent
   default and never a fabricated value.
7. **The database is the cache.** Serverless has no persistent disk.
8. **One application.** No separate API service or worker without an ADR.
9. **Document as you build.** A feature without documented sources and
   limitations is incomplete.

---

## 3. Application boundaries

| Boundary                      | Rule                                                                    |
| ----------------------------- | ----------------------------------------------------------------------- |
| Browser ↔ server              | The browser is untrusted. Validate everything server-side.             |
| `features/` ↔ `features/`     | No cross-feature internal imports. Share via `packages/shared` or the DB. |
| Client ↔ `lib/integrations/`  | Forbidden. Server-only.                                                 |
| Client ↔ Supabase             | Allowed for farmer-scoped reads/writes via the anon key. **RLS is the boundary.** |
| App ↔ upstream APIs           | Only through an integration module with timeout, retry, cache, provenance. |
| Service-role client           | Background jobs and admin only. Never for a user request.               |

### Integration module contract

Every file in `lib/integrations/<source>/` must expose:

- `fetch<Variable>(...)` → typed, **normalised** domain values.
- Provenance on every value (source, resolution, `observedAt`, `isModelled`).
- Explicit timeout; bounded retries (max 2) with backoff.
- Typed errors: `UpstreamError`, `UpstreamTimeout`, `RateLimitError`,
  `NoDataError`.
- Cache read/write through the shared cache layer.

---

## 4. Folder responsibilities

```
apps/web/src/
  app/                 Routes. (marketing) | (auth) | (dashboard) | api/
  components/ui/       shadcn primitives — generated, don't hand-edit
  components/          Shared presentational (layout, dashboard, farms, maps, charts, forms)
  features/            Vertical slices — the unit of product work
  lib/integrations/    SERVER-ONLY. One module per external data source
  lib/geospatial/      Area, zonal stats, coordinate utilities
  lib/supabase/        Browser + server clients, query helpers
  lib/utilities/       Generic helpers (cn, format). No domain logic
  hooks/               Shared React hooks
  types/               App-local types (shared ones go in packages/shared)
  styles/              Styles Tailwind can't express

packages/shared/       types/ schemas/ constants/ — framework-agnostic, zod allowed
packages/config/       eslint/ typescript/ prettier/ — shared configs
scripts/               data/ geospatial/ validation/ — run outside Next.js
data/                  samples/ (committed, small) + processed/ (gitignored)
docs/                  research/ api/ database/ product/ design/ hackathon/ decisions/
```

---

## 5. Main entities

| Entity                    | Key columns                                                     | Notes                                    |
| ------------------------- | --------------------------------------------------------------- | ---------------------------------------- |
| `profiles`                | `id` (=`auth.users.id`), `full_name`, `phone`, `role`          | Extends the auth user                    |
| `farms`                   | `farmer_id`, `name`, `centroid` (Point), `boundary` (Polygon), `area_ha` | `area_ha` computed by PostGIS   |
| `farm_plots`              | `farm_id`, `boundary`, `area_ha`                                 | Optional subdivision                     |
| `crops`                   | `code`, `name`, `agronomic_requirements` (jsonb)                | Seeded from the versioned catalog        |
| `farm_crops`              | `farm_id`, `plot_id?`, `crop_id`, `status`, `planting_date`, `intended_use` | `status` ∈ current/previous/planned |
| `data_sources`            | `name`, `provider`, `license`, `attribution`, `characteristics`  | Runtime index of every upstream          |
| `environmental_observations` | `source_id`, `variable`, `value`, `unit`, `location`, `spatial_resolution_m`, `temporal_resolution`, `observed_at`, `retrieved_at`, `is_modelled`, `coverage_fraction` | **Provenance is non-negotiable** |
| `analyses`                | `farm_id`, `kind`, `status`, `inputs` (jsonb), `code_version`   | Immutable snapshot of the inputs         |
| `recommendation_rulesets` | `version`, `content_hash`, `content` (jsonb)                    | Versioned                                |
| `recommendations`         | `analysis_id`, `crop_id`, `verdict`, `score`, `subscores`, `rationale`, `limitations`, `confidence`, `ruleset_version` | |
| `reports`                 | `farm_id`, `kind`, `params`, `storage_path`                      | File in Supabase Storage                 |
| `external_cache`          | `source_id`, `cache_key` (unique), `payload`, `expires_at`       | Durable cache across cold starts         |

---

## 6. Key data flows

### Farm save

Client draws polygon → Turf area (preview only) → `POST /api/farms` → Zod
validate → insert with `farmer_id = auth.uid()` → **PostGIS computes
`area_ha` and centroid** → return.

### Environmental read

Server action → environmental service → cache lookup
(`source_id` + `cache_key`) → miss → upstream call (timeout + retry) →
Zod-validate + normalise units/time → store cache + observation with
provenance → render with resolution notices.

### Recommendation

Server action → read observations + crop catalog → hard constraints →
per-dimension scores → verdict → confidence from completeness × resolution ×
recency → limitations list → persist with `ruleset_version` → render.

---

## 7. The resolution ladder — copy these numbers, not the source names

| Product              | Spatial resolution        | Temporal          | Honest description                                     |
| -------------------- | ------------------------- | ----------------- | ------------------------------------------------------ |
| NASA POWER           | ~0.5° × 0.625° (≈55×70 km) | daily/monthly/clim | **Regional climate cell.** Not farm weather.             |
| NASA SMAP L3         | 9 km (36 km enhanced)     | ~3-hour overpass  | Neighbourhood-scale wetness indicator.                 |
| NASA GPM IMERG       | 0.1° (≈11 km)             | 30-minute         | Sub-daily rainfall over an 11 km cell.                 |
| CHIRPS               | 0.05° (≈5.5 km)           | daily             | Daily rainfall over a 5.5 km cell.                      |
| ISRIC SoilGrids      | 250 m                     | static            | Soil property interpolated to a 250 m cell.             |
| NASA MODIS NDVI      | 250 m / 1 km              | 16-day composite  | Vegetation condition over the composite period.        |
| MODIS land surface T | 1 km                      | daily             | Surface temperature over a 1 km cell.                   |
| NASA Landsat C2      | 30 m                      | 16-day revisit    | Surface reflectance over the scene.                     |

A 1.4 ha farm is **far smaller than one pixel** in POWER, SMAP, GPM and CHIRPS.
Never write "your farm's soil moisture".

---

## 8. Security rules

- RLS on every farmer-scoped table. A table without policies is a defect.
- `SUPABASE_SERVICE_ROLE_KEY` → server only, never `NEXT_PUBLIC_*`.
- NASA Earthdata token, GEE keys, provider keys → server only.
- Zod validation on every input **and** every upstream response.
- Parameterised SQL only.
- Rate-limit endpoints that call upstreams; cache so quota is not the failure mode.
- No real farmer data, farm polygons or PII in Git. Synthetic fixtures only.
- No `.env` files committed. `.env.example` holds placeholders only.
- Report vulnerabilities via `SECURITY.md`, not a public issue.

---

## 9. Implementation constraints

1. **Never call an external API from the client.** Not even a "temporary" one.
2. **Never store a raster in PostgreSQL.** Use an on-the-fly API or pre-compute.
3. **Never commit rasters, tiles or large derived files.** `.gitignore` handles
   it; do not work around it.
4. **Never hardcode a basemap provider.** `NEXT_PUBLIC_MAP_STYLE_URL`.
5. **Never infer what a farmer grows.** Only from the farmer.
6. **Never assert NASA provides crop recommendations.** It provides Earth
   observation data. Recommendations need agricultural knowledge, methodology
   and local validation.
7. **Never overstate validation.** Field validation is Tofa LGA. Not Nigeria.
   Not Africa. Not globally.
8. **Never present modelled data as observed.** Use the `isModelled` flag.
9. **Never let an LLM produce a number or verdict.** Paraphrase only.
10. **Never skip provenance.** A value without source/resolution/date is not
    acceptable to store or display.
11. **Never write an ADR out of order** — supersede, don't delete.
12. **Never implement ahead of the current phase** without saying so.

---

## 10. Before you open a pull request

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
```

And confirm:

- [ ] No secrets or `NEXT_PUBLIC_` secrets.
- [ ] No real farmer data.
- [ ] New upstream source documented in `docs/api/data-sources.md`.
- [ ] Accuracy/resolution wording is accurate.
- [ ] RLS updated if a table was added.
- [ ] ADR added if the architecture changed.
- [ ] Docs updated alongside the code.

---

## 11. Where to look next

| Task                          | Read                                                            |
| ----------------------------- | --------------------------------------------------------------- |
| Adding a data source          | `docs/api/data-sources.md`, `docs/api/data-retrieval-strategy.md` |
| Changing the schema           | `docs/database/data-model.md`, `docs/database/postgis-design.md`  |
| Changing a recommendation rule| `docs/product/recommendation-methodology.md`                      |
| UI work                       | `docs/design/design-system.md`                                   |
| Map work                      | `docs/api/map-tile-providers.md`                                 |
| Understanding the whole system| `ARCHITECTURE.md`                                                |
| Hackathon rules and deadlines | `docs/hackathon/README.md`                                       |
| What has been decided         | `docs/decisions/`                                                 |
