# DalaShift: Scripts

Operational and analysis scripts that run **outside** the Next.js application
process: data ingestion, geospatial processing and validation.

**Status: Phase 1 (foundation).** The directories exist; the scripts that will
populate them are Phase 2 deliverables and are specified in
[`docs/api/data-retrieval-strategy.md`](../docs/api/data-retrieval-strategy.md)
and [`docs/database/data-model.md`](../docs/database/data-model.md).

## Directories

| Directory      | Responsibility                                                          |
| -------------- | ----------------------------------------------------------------------- |
| `data/`        | Seed/import scripts for reference data (crops, seasons, rulesets)        |
| `geospatial/`  | Raster/vector preprocessing, zonal statistics, tile generation           |
| `validation/`  | Data-quality and integrity checks (schema validation, provenance checks) |

## Conventions

- Scripts are executed with `tsx` and must be runnable from the repository root:
  `pnpm tsx scripts/<group>/<script>.ts`.
- Scripts are idempotent and safe to re-run. They must never mutate production
  data without an explicit `--apply` flag; by default they report differences.
- Scripts must not commit large rasters to Git. Use `.gitignore` rules in
  `data/processed/`.
