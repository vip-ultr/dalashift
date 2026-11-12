# PostGIS Design

Companion to [`data-model.md`](./data-model.md). Everything spatial happens
here.

---

## 1. SRID and coordinate order

| Aspect           | Decision                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| **SRID**         | **4326 (WGS 84)** for all stored geometry. No other SRID is stored.            |
| **Storage order**| PostGIS 4326 is **(latitude, longitude)**.                                       |
| **Transport order** | GeoJSON and the MapLibre/Turf ecosystem use **(longitude, latitude)**.        |
| **Conversion point** | **Only at the system boundary** — the integration layer and the map feature. |

> ⚠️ **This is the classic bug source in geospatial applications.** Swapping
> the axes turns Kano (8.5°E, 12.0°N) into a point in Saudi Arabia. It will
> not throw an error — it will just be wrong, and the farm will appear in the
> wrong country.

**Mitigations:**

1. One conversion helper, used everywhere. Never hand-convert.
2. A unit test with a known coordinate: `(8.5, 12.0)` in GeoJSON must
   become `POINT(12.0 8.5)` in PostGIS.
3. A **plausibility check on write**: a farm whose longitude is outside
   [-180, 180] or whose latitude is outside [-90, 90] is rejected; and a
   "Nigeria" test — a farm in Kano must land within the Kano bounding box.

---

## 2. Geometry types used

| Table              | Column      | Geometry type                          | Notes                             |
| ------------------ | ----------- | -------------------------------------- | --------------------------------- |
| `farms`            | `boundary`  | `Polygon` or `MultiPolygon`            | The farm polygon                  |
| `farms`            | `centroid`  | `Point`                                | Generated from the boundary       |
| `farm_plots`       | `boundary`  | `Polygon` or `MultiPolygon`            | Optional                          |
| `grid_cells`       | `geometry`  | `Polygon`                              | The footprint of a coarse cell    |
| `soil_properties`  | `geometry`  | `Polygon`                              | 250 m SoilGrids cell              |
| `environmental_observations` | — | None — referenced via `cell_id` | The value carries `spatial_resolution_m` |

**[Proposed]** Why observations reference a cell rather than storing a point:
the whole point is that the value describes an *area*, not a location. Storing
the area is what lets the UI draw it.

---

## 3. The critical functions

### 3.1 Area — the one that is silently wrong if you get it wrong

```sql
-- ✅ CORRECT: spherical area on the real earth, returned in m²
SELECT ST_Area(boundary::geography) AS area_m2
FROM farms
WHERE id = $1;

-- ❌ WRONG: returns square DEGREES on a 4326 geometry
SELECT ST_Area(boundary) FROM farms WHERE id = $1;
```

`ST_Area` on a raw 4326 geometry returns square degrees. That number is not a
number of hectares and is not even proportional to one in a useful way — the
error varies with latitude. **Always cast to `geography`.**

The generated column makes this impossible to get wrong from the client:

```sql
area_ha numeric(10,3) GENERATED ALWAYS AS (ST_Area(boundary::geography) / 10000.0) STORED
```

`ST_Area` on `geography` (PostGIS 2.4+) computes the area on the WGS84
ellipsoid. For a small farm the difference from a spherical model is
negligible; the difference from the square-degrees error is enormous.

### 3.2 Centroid

```sql
centroid geometry GENERATED ALWAYS AS (ST_Centroid(boundary)) STORED
```

`ST_Centroid` on a polygon returns a point guaranteed to be inside the
polygon. `ST_PointOnSurface` is the alternative; for a concave farm shape the
two differ. Use `ST_Centroid` — a farm boundary drawn by a farmer is unlikely
to be dramatically concave.

### 3.3 Plot area within a farm

```sql
SELECT
    fp.id,
    fp.name,
    ST_Area(ST_Intersection(fp.boundary, f.boundary)::geography) / 10000.0 AS overlap_ha
FROM farm_plots fp
JOIN farms f ON f.id = fp.farm_id
WHERE fp.farm_id = $1;
```

**The intersection, not the plot's own area**, is what matters — a plot may
extend beyond the farm boundary as drawn.

### 3.4 Containment and intersection

```sql
-- Which farms fall inside this rainfall cell?
SELECT f.id, f.name
FROM farms f
JOIN grid_cells c ON c.source_id = $1 AND ST_Intersects(f.boundary, c.geometry);

-- Which farms contain this point?
SELECT f.id FROM farms f
WHERE ST_Contains(f.boundary, ST_SetSRID(ST_MakePoint($lon, $lat), 4326));
```

Note the explicit `ST_SetSRID(..., 4326)` — a point built without an SRID
raises *"geometry has no SRID"* when compared to an SRID-bearing column.

### 3.5 Nearest farm to a point

```sql
SELECT id, name, ST_Distance(centroid::geography, ST_SetSRID(ST_MakePoint($lon,$lat),4326)::geography) AS distance_m
FROM farms
ORDER BY centroid <-> ST_SetSRID(ST_MakePoint($lon,$lat),4326)
LIMIT 1;
```

The `<->` operator uses the GIST index — a KNN search, which is orders of
magnitude faster than `ORDER BY ST_Distance(...)`.

### 3.6 Grid cell lookup for a point

```sql
SELECT c.id, c.cell_key, c.resolution_label
FROM grid_cells c
WHERE c.source_id = $1
  AND ST_Contains(c.geometry, ST_SetSRID(ST_MakePoint($lon,$lat),4326));
```

### 3.7 Validity and repair

```sql
-- Reject an invalid polygon on write
CHECK (ST_IsValid(boundary))
```

Self-intersecting polygons are a common result of a farmer dragging a vertex
across another. The write path should normalise before inserting:

```sql
ST_MakeValid(ST_CollectionExtract(ST_MakeValid(boundary), 3))
```

`ST_MakeValid` can return a `GeometryCollection`; extracting type 3 keeps only
the polygonal parts. **[Proposed]** Do this in the write path (a
`BEFORE INSERT OR UPDATE` trigger or the route handler), and reject the
geometry if the resulting area is empty.

---

## 4. Indexing

```sql
CREATE INDEX idx_farms_boundary_gist  ON farms USING GIST (boundary);
CREATE INDEX idx_farms_centroid_gist  ON farms USING GIST (centroid);
CREATE INDEX idx_plots_boundary_gist  ON farm_plots USING GIST (boundary);
CREATE INDEX idx_cells_geometry_gist  ON grid_cells USING GIST (geometry);
CREATE INDEX idx_soil_geometry_gist   ON soil_properties USING GIST (geometry);

CREATE INDEX idx_farms_farmer_id      ON farms (farmer_id);
CREATE INDEX idx_plots_farm_id        ON farm_plots (farm_id);
CREATE INDEX idx_farm_crops_farm      ON farm_crops (farm_id, status);
CREATE INDEX idx_farm_crops_crop      ON farm_crops (crop_id);
CREATE INDEX idx_obs_source_var_time  ON environmental_observations (source_id, variable, observed_at DESC);
CREATE INDEX idx_obs_farm_var_time   ON environmental_observations (farm_id, variable, observed_at DESC);
CREATE INDEX idx_obs_analysis         ON environmental_observations (analysis_id);
CREATE INDEX idx_analyses_farm_time   ON analyses (farm_id, created_at DESC);
CREATE INDEX idx_recs_farm_crop       ON recommendations (farm_id, crop_id, created_at DESC);
CREATE INDEX idx_rotations_farm       ON rotation_strategies (farm_id, created_at DESC);
CREATE INDEX idx_cache_source_key     ON external_cache (source_id, cache_key);
```

**Why GIST and not the default B-tree:** B-tree indexes work on scalar values.
Spatial predicates (`ST_Contains`, `ST_Intersects`, `ST_DWithin`) need the
GIST operator class. `geometry` columns should also have an
`ST_GeometryType` check constraint, since Postgres allows storing a `Point` in
a `Polygon`-typed column.

---

## 5. Aggregating coarse products over a farm

This is the heart of the spatial strategy (see
[`ADR-0005`](../decisions/ADR-0005-geospatial-resolution-and-aggregation-strategy.md)).

### 5.1 Grid-cell products (POWER, CHIRPS, IMERG)

```sql
-- The cell containing the farm centroid
SELECT c.id, c.cell_key, c.resolution_m, c.resolution_label
FROM grid_cells c
JOIN farms f ON f.id = $1
WHERE c.source_id = $2
  AND ST_Contains(c.geometry, f.centroid);
```

Store the observation with `cell_id` set and `aggregation_method = 'grid_cell'`.
**The value is the cell's value — every farm in that cell gets the same number,
and the UI must say so.**

### 5.2 Point-sample products (SoilGrids, SMAP)

```sql
-- SoilGrids: the pre-baked cell containing the farm centroid
SELECT * FROM soil_properties
WHERE cell_key = $1 AND property = $2 AND depth = $3;
```

The SoilGrids value is interpolated by ISRIC at 250 m; store it with
`is_modelled = true` and `spatial_resolution_m = 250`.

### 5.3 Raster products finer than the farm (Landsat, Sentinel-2, MODIS)

Zonal statistics are computed by the raster API (Google Earth Engine) because
the raster is not in PostgreSQL:

```
reduceRegion(
  geometry = farm_polygon,
  reducer = ee.Reducer.percentile([10, 50, 90]).combine({p10, p50, p90}, mean, min, max, stdDev, count),
  scale = native_resolution,
  maxPixels = 1e13
)
```

**Store the statistics, not the imagery.** The observation row holds:

| Field               | Value                                         |
| ------------------- | --------------------------------------------- |
| `value`             | The median (or chosen statistic)               |
| `aggregation_method`| `zonal`                                        |
| `coverage_fraction` | `valid_pixel_count / total_pixel_count`        |
| `raw_metadata`      | `{ p10, p50, p90, mean, min, max, stdDev, pixelCount, validPixelCount }` |

**`coverage_fraction` is the honesty mechanism.** If 40 % of the farm polygon
is under cloud, the UI says so and the confidence drops. A zonal mean over
60 % of a field is a different claim from a zonal mean over 100 %.

### 5.4 Raster products far coarser than the farm (SMAP, IMERG at 9–11 km)

```sql
-- The 9 km SMAP cell containing the farm
SELECT c.id, c.cell_key FROM grid_cells c
WHERE c.source_id = $1
  AND ST_Intersects(f.boundary, c.geometry);
```

Sample at the centroid and **store the cell geometry** so the UI can draw
*"this 9 km cell"* over the farm. For a farm in a cell shared with hundreds of
others, that picture is worth more than the number.

---

## 6. Zonal statistics without a raster service

**[Proposed]** If Google Earth Engine is unavailable, a limited version is
possible for the vector-based products:

```sql
-- Mean soil pH over the farm, weighted by the fraction of the farm in each
-- SoilGrids cell (only meaningful when the farm spans several cells)
SELECT sp.property, sp.depth,
       SUM(sp.mean * overlap_fraction) / SUM(overlap_fraction) AS weighted_mean,
       SUM(sp.uncertainty * overlap_fraction) / SUM(overlap_fraction) AS weighted_uncertainty
FROM ...
```

This is only worth doing for a farm that genuinely spans multiple 250 m cells
(a farm larger than ~6 ha). For smaller farms, the centroid sample is correct
and simpler.

---

## 7. Geometry simplification for the client

**[Proposed]** Farm polygons sent to the browser are simplified. A farmer
drawing a 200-point polygon does not need 200 points rendered at 100 %.

```sql
ST_Simplify(boundary, $tolerance_metres / 111320.0)
```

**`ST_Simplify` takes tolerance in the units of the SRID**, which for 4326 is
*degrees* — so the tolerance must be divided by ~111,320 (metres per degree) to
express it in metres. At the equator, 1° of longitude ≈ 111,320 m; the figure
varies with latitude, which is acceptable for a simplification tolerance.

**The stored geometry is never simplified.** Only the copy sent to the browser
is. Area is always computed from the full-precision geometry.

---

## 8. Geometry validation checklist

Run this against every geometry before it is stored:

| Check                     | Why                                                     |
| ------------------------- | ------------------------------------------------------- |
| `ST_IsValid`              | Self-intersections from freehand drawing               |
| `NOT ST_IsEmpty`          | A click with no drag                                    |
| Geometry type is Polygon/MultiPolygon | A stray Point would break area computation      |
| Area within a sane range  | `< 1000 ha` for a smallholder farm                       |
| Ring is closed            | PostGIS tolerates unclosed rings; they break area maths |
| No duplicate consecutive points | A double-click produces a zero-length segment      |
| Coordinate range valid    | Longitude within ±180, latitude within ±90               |
| **Plausibility for the region** | A farm in Saudi Arabia means the axes were swapped |

---

## 9. Testing strategy

| Test                                                    | What it proves                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| Known polygon → known area                              | `ST_Area(...::geography)` is correct, and the square-degrees bug is caught |
| Coordinate round-trip `(8.5, 12.0)` → PostGIS → back    | The axis order is not swapped                                        |
| A farm in Kano lands inside the Kano bounding box       | Plausibility                                                        |
| Intersection area of two overlapping plots              | Correct, and never larger than either plot                          |
| Cell lookup for a point returns exactly one cell        | The grid reference table is correct                                 |
| Zonal statistics on a synthetic raster-like grid        | Coverage fraction is computed correctly                             |

**Use a real, published polygon as the fixture.** A synthetic square is easy
to reason about but hides orientation errors — a square is symmetric under
rotation. Use an irregular polygon whose area is known.

---

## 10. Sources

| URL | Used for |
| --- | -------- |
| <https://postgis.net/docs/ST_Area.html> | `ST_Area` and the geography cast |
| <https://postgis.net/docs/ST_Intersects.html> | `ST_Intersects` |
| <https://postgis.net/docs/ST_Contains.html> | `ST_Contains` |
| <https://postgis.net/docs/ST_Simplify.html> | `ST_Simplify` tolerance units |
| <https://postgis.net/docs/ST_MakeValid.html> | `ST_MakeValid` |
| <https://postgis.net/docs/ST_Distance.html> | `ST_Distance` on geography |
| <https://postgis.net/workshops/postgis-intro/indexing.html> | GIST indexing |

All consulted **2026-11-13**.
