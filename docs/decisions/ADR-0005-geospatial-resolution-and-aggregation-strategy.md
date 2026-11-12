# ADR-0005 — Geospatial Resolution and Aggregation Strategy

| Field    | Value                                                              |
| -------- | ------------------------------------------------------------------ |
| Status   | Accepted                                                          |
| Date     | 2026-11-13                                                        |
| Deciders | Team                                                              |
| Related  | `ARCHITECTURE.md` § 6, `docs/database/postgis-design.md`, `docs/api/data-sources.md` |

---

## Context

Every environmental dataset DalaShift can use is coarser than a smallholder
farm. This is the central technical constraint of the product, and the
architecture must handle it without misleading anyone.

### The resolution reality

| Product              | Spatial resolution          | Temporal           | Coverage of a 1.4 ha farm |
| -------------------- | --------------------------- | ------------------ | -------------------------- |
| NASA POWER (gridded) | ~0.5° × 0.625° (≈55×70 km) | daily/monthly/clim | ~0.003% of one grid cell   |
| NASA SMAP L3         | 9 km (36 km enhanced)       | ~3-hour overpass   | ~0.0017% of one pixel      |
| NASA GPM IMERG       | 0.1° (≈11 km)               | 30-minute          | ~0.0001% of one cell       |
| CHIRPS               | 0.05° (≈5.5 km)             | daily              | ~0.0005% of one cell       |
| ISRIC SoilGrids      | 250 m                       | static             | ~2.2% of one cell          |
| NASA MODIS NDVI      | 250 m / 1 km                | 16-day composite   | ~22% of one cell (250 m)   |
| NASA Landsat C2      | 30 m                        | 16-day revisit     | ~15,500 pixels cover 1.4 ha |

(Percentages are computed as farm area ÷ cell area and are indicative; they are
included to make the order of magnitude impossible to miss.)

### Decision criteria

| Criterion                                          | Weight |
| -------------------------------------------------- | ------ |
| Not misrepresenting resolution                     | **Highest** |
| Maximum usable information per unit of build effort | High   |
| Works within the 48-hour budget                    | High   |
| No raster storage in the transactional database     | High   |
| Reproducible and auditable                         | Medium |

## Options considered

### Option A — Treat every source as a point lookup at the farm centroid

- **Advantages:** Simplest. Every source is treated identically. One code
  path.
- **Disadvantages:** Throws away real information for the raster sources.
  Landsat at 30 m genuinely resolves a 1.4 ha farm into thousands of pixels —
  reducing that to a centroid sample discards the best data the product can
  access. Also discards partial-coverage information.
- **Risks:** The product would under-deliver on the sources that can actually
  support farm-level claims.

### Option B — True zonal statistics over every source

- **Advantages:** The most information from every source.
- **Disadvantages:** Requires downloading and processing rasters for every
  request. Infeasible in a 48-hour build, and it puts rasters in the request
  path.
- **Risks:** Performance, quota and complexity.

### Option C — **Adaptive: source-appropriate aggregation with mandatory
disclosure** (chosen)

- **Description:** Each source is aggregated according to its own geometry
  and resolution, and every result carries the resolution it was computed at.
  The interface distinguishes three cases: *measured over your farm* (zonal),
  *nearest pixel value* (sampled), *estimated* (interpolated/modelled).
- **Advantages:** Uses the full information content of every source. Keeps
  the strong sources (Landsat, MODIS, SoilGrids) genuinely farm-level where
  they can be. Makes coarse sources honestly coarse. One rule — "the source's
  geometry determines the aggregation" — is simple enough to explain and to
  implement in a day.
- **Disadvantages:** More than one code path. Requires careful UI work to
  communicate the distinction without confusing the farmer.
- **Risks:** A farmer may not absorb the distinction. Mitigated by plain
  language ("this value describes the area around your farm, about 9 km
  across") rather than technical metadata.

### Option D — Apply spatial disaggregation (downscaling) to coarse products

- **Advantages:** Would genuinely produce finer-resolution rainfall.
- **Disadvantages:** Requires validated bias-correction models trained on
  local data, gauge networks and terrain covariates. Not feasible in 48 hours,
  and the output would be a model, not an observation — which must then be
  labelled as such, adding a second layer of complexity without resolving the
  honesty problem.
- **Risks:** High risk of a confident, wrong, fine-grained product.

### Option E — Restrict the product to sources that can genuinely resolve a farm

- **Advantages:** Every claim is exact.
- **Disadvantages:** Would restrict the product to Landsat/MODIS/SoilGrids,
  removing the soil-moisture and rainfall products that farmers most need, and
  removing most of the NASA value proposition. It would also make the product
  much weaker than the brief requires.
- **Risks:** Product scope unacceptable.

## Decision

**Option C — adaptive, source-appropriate aggregation with mandatory
disclosure.**

### Aggregation rules per source class

| Source class                            | Aggregation                                          | Stored with                                                    |
| --------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| **Grid-cell products** (POWER, CHIRPS, GPM) | The value of the grid cell containing the farm centroid. Store the **cell geometry**, not just the point, so the cell can be visualised. | The cell's bounding box, so the UI can show "this is the 55 km cell" |
| **Point-sample products** (SoilGrids, SMAP) | The value at the centroid. SoilGrids uses the WCS raster's interpolated value at that coordinate. | The native pixel/raster resolution                                  |
| **Raster products finer than the farm** (MODIS, Landsat) | **Zonal statistics over the farm polygon**: mean, p10, p90, min, max, and **valid-pixel fraction**. | Pixel count, valid fraction, and the statistics                 |
| **Raster products comparable to the farm** | Single-pixel value, **plus** an explicit "one pixel covers this farm" notice. | Pixel footprint geometry                                         |
| **Raster products far coarser than the farm** | Centroid sample, **plus** a mandatory notice that the value represents the surrounding area. | Pixel footprint geometry                                         |

### Mandatory rules

1. **Every value carries provenance**: `source_id`, `spatial_resolution_m`,
   `temporal_resolution`, `observed_at`, `retrieved_at`, `is_modelled`,
   `coverage_fraction`.
2. **`coverage_fraction` is stored.** If 40% of a farm polygon falls over
   cloud or a data gap, the interface says so and confidence drops.
3. **No interpolation beyond what the source provides.** SoilGrids provides
   interpolated values at a point — those are used. DalaShift does not
   invent finer spatial detail.
4. **Rasters are never stored in PostgreSQL.** Zonal statistics are either
   computed on-the-fly via a raster API (GEE — see ADR-0008) or **pre-computed
   once and cached** in `environmental_observations` with provenance. See
   `docs/api/data-retrieval-strategy.md`.
5. **PostGIS computes the geometry.** Farm area, plot area, intersections and
   containment are computed in the database with `ST_Area(...::geography)` and
   spatial indexes — never in JavaScript. The client-side Turf area is a
   drawing-time **preview only**; the PostGIS value is authoritative on save.
6. **Polygon vs centroid is an explicit product choice per source.** Where a
   grid cell contains several farms, each farm stores the *same* cell value —
   and the UI must not imply otherwise.

## Reasoning

The decision is driven by the fact that **the information content of these
sources differs by three orders of magnitude**, and a uniform treatment either
wastes the good data or overstates the coarse data.

Two concrete cases make the reasoning concrete:

- **Landsat at 30 m over a 1.4 ha farm.** A zonal mean over ~15,500 valid
  pixels is a genuine measurement of that field's reflectance. This is the
  one source where a farm-level claim is defensible, and Option A would throw
  it away.
- **SMAP at 9 km over the same farm.** The value describes roughly 81 km² of
  land — possibly several hundred farms, different soils, different crops. It
  is a neighbourhood-scale wetness indicator. Presenting it as the farm's
  soil moisture is false, regardless of whether the number is correct.

A single uniform rule ("sample at the centroid") would treat these two
identically, and would be wrong for both: too lossy for Landsat, too confident
for SMAP. A single uniform rule ("zonal statistics everywhere") would be
worse still — it would make POWER's 0.5° cell into a meaningless "mean over
your farm" that happened to equal the cell value anyway, while implying a
precision that does not exist.

Option C's rule is therefore: **the source's own geometry determines the
aggregation, and the result is labelled with the geometry it was computed
at.** That is both honest and implementable.

Option D (downscaling) was rejected not because it is wrong but because it
is a research project. It also does not solve the honesty problem — it
substitutes a model for a measurement, which is better but must still be
labelled, and the label is harder for a farmer to interpret than "this is a
9 km pixel".

## Consequences

### Positive

- The product extracts the maximum real information from every source.
- No claim exceeds its source's resolution.
- The `coverage_fraction` field gives a principled basis for confidence
  scoring.
- The farm's real polygon is used, not just a point — so the product
  genuinely responds to farm size and shape.
- The distinction between "measured over your farm" and "estimated for your
  area" is a defensible, explainable product feature.
- The approach degrades gracefully: if a fine source is unavailable, the
  coarse one still works, with the appropriate label.

### Negative / accepted costs

- Multiple aggregation code paths — more to build and to test.
- The UI must communicate the distinction without confusing farmers. This is
  real design work, not a label.
- Some analyses require a raster service (GEE) or a pre-computation pipeline,
  which is the largest build risk in the project. Mitigated by making the
  MVP path depend on the point-sample sources.
- Storing the grid-cell geometry adds a row per distinct cell — needs a
  reference table rather than a geometry column on every observation.

### Follow-up work

- [ ] Add a `grid_cells` reference table (provider, cell id, geometry,
      resolution) so observations can reference a cell rather than repeat it.
- [ ] Implement the zonal-statistics path for the chosen raster sources.
- [ ] Design the plain-language resolution notices with the design phase.
- [ ] Write the cross-account isolation test and the area-computation test
      with known coordinates.

### Revisit when

- A validated downscaling model for West African rainfall becomes available.
- The team can afford a raster processing pipeline.
