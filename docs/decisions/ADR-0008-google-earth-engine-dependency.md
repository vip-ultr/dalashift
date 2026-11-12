# ADR-0008 — Google Earth Engine as an Optional Dependency

| Field    | Value                                                             |
| -------- | ----------------------------------------------------------------- |
| Status   | **Proposed — awaiting team decision**                            |
| Date     | 2026-11-13                                                       |
| Deciders | Team                                                             |
| Related  | `docs/api/google-earth-engine.md`, `ADR-0005`, `docs/api/data-sources.md` |

---

## Context

Google Earth Engine (GEE) is the only route to **10–30 m farm-scale pixels**
available for free:

| Product                    | Resolution | Farm-scale for a 1.4 ha field?      |
| -------------------------- | ---------- | ----------------------------------- |
| Sentinel-2 (via GEE)       | 10 m       | **Yes**                              |
| Landsat (via GEE)          | 30 m       | **Yes**                              |
| MODIS (via GEE)            | 250 m      | No, but accessible                   |
| SMAP (via GEE)             | 9 km       | No, but accessible                   |
| IMERG (via GEE)            | 11 km      | No, but accessible                   |

**[Verified]** The rules changed on 2026-04-27. All noncommercial projects
now have a monthly **EECU-hour** quota:

| Tier          | Quota                            | Eligibility                                              |
| ------------- | -------------------------------- | -------------------------------------------------------- |
| **Community** | **150 EECU-hours/month**         | All **verified** noncommercial projects                   |
| **Contributor** | **1,000 EECU-hours/month**     | Verified noncommercial **+ a billing account** (not charged for EE) |
| **Partner**   | 100,000 EECU-hours/month         | Separate application; approval may take weeks             |

**[Verified]** Noncommercial access requires **project verification through a
questionnaire**, at registration and **annually** thereafter. Since
2025-09-26, all noncommercial projects must have completed it or access is
paused. Misrepresenting the project's nature risks immediate revocation.

**[Verified]** The questionnaire may classify a project with commercial
intent as commercial, which would force a paid plan **mid-hackathon**.

**[Verified]** Fixed platform limits: 40 concurrent requests, 100 req/s,
**2 average concurrent batch tasks**, 250 GB asset storage, 10,000 assets,
10 MB query payload, 100 MiB aggregation cache, 3,000 READY tasks.

**[Verified]** M2M access to Landsat via the USGS API requires a manual
approval that takes *"a couple of days"* — **not viable in 48 hours**.

---

## Options considered

### Option A — No GEE. Use only no-auth, low-friction sources

- **Description:** NASA POWER (no auth), SoilGrids (no auth, but degraded),
  Open-Meteo (no auth), plus Earthdata CMR/AppEEARS for SMAP and MODIS.
- **Advantages:** Zero setup. No verification gate. No quota to reason about.
  Nothing can go wrong during the build.
- **Disadvantages:** **No farm-scale vegetation product.** The best
  farm-resolution source becomes Landsat via AppEEARS (async, Earthdata
  login, cloud-limited in the wet season) — if it is available at all.
- **Risks:** The product's strongest claim — "we can measure your field" — is
  weakened.

### Option B — GEE as the primary raster path

- **Description:** All raster work through GEE: Sentinel-2, Landsat, MODIS,
  SMAP, IMERG.
- **Advantages:** The full catalogue. Farm-scale vegetation. One integration
  covers five products.
- **Disadvantages:** A hard dependency on registration, verification and
  quota. The verification questionnaire can classify the project as commercial.
  Community Tier allows only **2 concurrent batch tasks**.
- **Risks:** **If verification fails or is slow, the product has no
  farm-scale data at all.** This is a real possibility in a 48-hour window.

### Option C — GEE as an optional enhancement with a documented fallback

- **Description:** The MVP path works without GEE. GEE is registered at hour
  zero, and if it lands, it is switched on as an enhancement. The
  architecture treats the raster provider as a swappable dependency.
- **Advantages:** The demo cannot fail because of a GEE problem. The
  upside, if verification succeeds, is substantial — Sentinel-2 at 10 m is
  the difference between "an estimate for your area" and "measured over your
  field".
- **Disadvantages:** Two code paths for the raster work. The fallback must
  actually work, which takes effort that could have gone into one good path.
- **Risks:** The fallback may be neglected. Mitigation: build the fallback
  first.

### Option D — Self-hosted raster pipeline

- **Description:** Download tiles, process with GDAL / rasterio, store
  zonal statistics.
- **Advantages:** No platform dependency. Full control. No quota.
- **Disadvantages:** Requires GDAL, a raster-processing service, a storage
  bucket, and a compute step. Far beyond 48 hours.
- **Risks:** Not viable for the MVP.

---

## Decision

**Option C — GEE as an optional enhancement, with a documented fallback. The
MVP must not depend on it.**

### The rules

1. **The raster provider is an interface, not an implementation.**
   `lib/geospatial/` defines the contract; the GEE adapter and the non-GEE
   adapter are two implementations of it.
2. **The MVP path is POWER + SoilGrids + Open-Meteo.** All three need no
   account beyond Supabase. The demo works with those alone.
3. **Register GEE at hour zero**, before writing any code, because
   verification is the gate.
4. **Prefer the Contributor tier** (a billing account is required but EE usage
   is not charged) or a commercial Limited project, to remove the risk of the
   questionnaire classifying the project as commercial mid-hackathon.
5. **Store statistics, never imagery.** Zonal statistics computed in GEE are
   written to `environmental_observations` with full provenance. The raster
   never enters PostgreSQL or Git. (Consistent with ADR-0005.)
6. **Batch per farm, not per pixel.** One composite per farm, then cache.

### The fallback table

**[Proposed]** If GEE is unavailable, these substitute — and each substitute
has a **coarser resolution that must be reflected in the resolution label**:

| Wanted                        | Fallback                                                    | Resolution |
| ----------------------------- | ----------------------------------------------------------- | ---------- |
| Farm-scale NDVI (10 m)        | Landsat via AppEEARS or CMR                                   | 30 m       |
| Moderate NDVI                 | MODIS MOD13Q1 via AppEEARS/CMR                                | 250 m      |
| Soil moisture                 | NASA POWER `GWETROOT` / `RZMC` (root zone, 1 m)               | 55 km      |
| Precipitation                 | NASA POWER `PRECTOTCORR` and `IMERG_PRECTOT`; CHIRPS via ERDDAP | 55 / 11 km |
| Elevation                     | NASA POWER `site-elevation`; SRTM via AppEEARS                | 55 km / 30 m |
| Timeseries of anything        | NASA POWER daily and monthly series                          | 55 km      |

**[Proposed]** The fallback set is sufficient for a credible demo. GEE makes
the demo better; it does not make it possible. That is the deciding argument.

---

## Reasoning

The decision criteria for a 48-hour build are:

1. **The demo must not depend on an approval that might not arrive.** Option B
   violates this directly.
2. **The upside must be worth the setup cost.** Sentinel-2 at 10 m with a
   5-day revisit is genuinely transformative for the product's honesty story
   — it is one of only two or three sources that resolve a farm.
3. **The integration must not be a dead end.** Treating the raster provider
   as an interface keeps the door open.

Option C satisfies all three, and its cost is essentially the same work as
Option A plus a small extra: the fallback is built first anyway, and the GEE
adapter is additive.

The real argument against GEE is not technical. It is **procedural**: the
verification questionnaire asks about the project's nature, and a team
building a product is a genuinely ambiguous case. If the questionnaire answers
"commercial", the Community tier is unavailable and a paid plan is needed —
a purchase decision in the middle of a hackathon. Choosing Contributor or
commercial-Limited up front removes that cliff edge.

---

## Consequences

### Positive

- The demo cannot fail because of a GEE verification issue.
- If GEE lands, the product gains a genuinely farm-scale vegetation product.
- The raster provider stays swappable.
- Nothing about the architecture is blocked on Google's decisions.

### Negative / accepted costs

- Two raster code paths to build and maintain.
- The non-GEE path is coarser, so the product's farm-scale claims are weaker
  without GEE.
- GEE verification is a manual, unverifiable task that one team member must
  own.
- GEE has a quota and a "restricted mode" when it is exhausted.

### Follow-up work

- [ ] Team decision on this ADR.
- [ ] **Hour zero:** create the Cloud Project, enable the EE API, register the
      project, complete the questionnaire (or register commercial Limited),
      create the service account, and record the outcome in the commit
      message.
- [ ] Define the raster-provider interface in `lib/geospatial/`.
- [ ] Implement the GEE adapter for Sentinel-2 NDVI zonal statistics.
- [ ] Implement the non-GEE fallback via AppEEARS/CMR.
- [ ] Verify the GEE dataset IDs listed in
      [`docs/api/google-earth-engine.md`](../api/google-earth-engine.md) § 6.

### Revisit when

- The product needs bulk raster processing that neither the fallback nor GEE's
  Community Tier can serve.
- The project is commercial and GEE's paid tier becomes cost-effective.
- A different raster service becomes available.
