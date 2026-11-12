# DalaShift — Data Directory

Local staging area for geospatial and reference data.

**Status: Phase 1 (foundation).** No data files are committed yet.

## Directories

| Directory    | Contents                                                                | In Git? |
| ------------ | ----------------------------------------------------------------------- | ------- |
| `samples/`   | Small, curated, redistributable sample files used by tests and demos   | Yes, selectively |
| `processed/` | Generated outputs (zonal statistics, derived tiles, CSV extracts)       | No — gitignored |

## Rules

- **Raw satellite rasters never enter this repository.** GeoTIFF, NetCDF, HDF,
  COG, GeoPackage and MBTiles files are gitignored at the root `.gitignore`.
- `data/processed/` is ignored wholesale; use it as a local working directory.
- `data/samples/` may only contain files whose licence permits redistribution.
  Record the source and licence in `data/samples/README.md` for every file.
- Farm geometry and any farmer-identifying information must never be written
  here. Real farm data lives in Supabase under RLS.

## Provenance requirement

Every data file placed in this tree must be accompanied by a provenance record
(source URL, licence, retrieval date, spatial/temporal resolution) in
`docs/api/data-sources.md` or `docs/research/`.
