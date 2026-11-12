# Google Earth Engine — Assessment and Recommendation

**Verification date: 2026-11-13.** Companion to
[`data-sources.md`](./data-sources.md).

**Status: OPTIONAL. Not load-bearing.** See
[`ADR-0008`](./../decisions/ADR-0008-google-earth-engine-dependency.md).

---

## 1. What it is

A cloud platform for server-side geospatial analysis over NASA, USGS, ESA,
JAXA and community datasets, with JavaScript and Python APIs and an `ee`-backed
REST service.

**Why we care:** it is the only route to **10–30 m farm-scale pixels for
free**. Without it, our best farm-scale source is Landsat at 30 m, which is
compromised by cloud in the Kano wet season (one usable scene every 3–6 weeks).
With it, Sentinel-2 at 10 m with a 5-day revisit is available.

---

## 2. The rules changed in 2026 — and the timing matters

Since **2026-04-27**, all noncommercial Earth Engine projects have a recurring
monthly quota of **EECU-hours** (Earth Engine Compute Units), applied at the
**project level**, resetting on the 1st of each calendar month at midnight PT.

| Tier          | Quota                              | Eligibility                                                                    |
| ------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| **Community** | **150 EECU-hours/month** (540,000 EECU-s) | Available to all **verified** noncommercial projects. No additional requirements. *"Supports the majority of noncommercial Earth Engine usage."* |
| **Contributor** | **1,000 EECU-hours/month** (3,600,000 EECU-s) | Verified noncommercial **+ an active billing account is required** (used as an identity signal; *"you won't be charged for Google Earth Engine noncommercial usage"*). Recommended for *"graduate students, nonprofits, and scientific researchers."* |
| **Partner**   | **100,000 EECU-hours/month**      | Separate application with project + impact details; **approval may take several weeks**; nonprofits/NGOs, university and government research groups; climate mitigation/adaptation/protection projects qualify. |

Source: <https://developers.google.com/earth-engine/guides/noncommercial_tiers>

**There is still a free tier for hackers** — but only if the project passes the
noncommercial questionnaire:

> *"If you complete the verification questionnaire and your project is
> determined to be commercial, you won't be eligible to use Earth Engine
> without paying."*

### Verification — the biggest hackathon risk

> *"Because Earth Engine grants unpaid access to a large amount of compute
> resources, Google requires **verification of each project** that is
> registered for noncommercial access. The verification process is done as a
> part of registration."*

- Projects registered before 2025-04-15 must verify; **since 2025-09-26 all
  noncommercial projects must have completed the questionnaire or access is
  paused.**
- **All noncommercial projects must reverify annually.**
- Identity verification uses your true identity and organisational affiliation.
  **Impersonation or false information ⇒ immediate revocation and possible
  permanent suspension.** Partner Tier applicants are *"strongly encouraged to
  apply using your individual institutional email address."*
- **Risk for a hackathon team building a product:** the questionnaire may
  classify the project as commercial, forcing a paid plan mid-event.
  **Mitigation:** register a Contributor Tier project (a billing account is
  required but you are not charged for EE) or a commercial project on the
  Limited plan from hour zero.

**Action: do this at hour 0, before writing any code.**

---

## 3. Authentication

1. Google account + **Google Cloud Project** with the **Earth Engine API
   enabled**.
2. Project registered for **noncommercial or commercial** use (Cloud Console →
   Earth Engine configuration).
3. Server-side: **OAuth** or a **service account** key. For Vercel serverless,
   a service account JSON in environment variables is the standard pattern.
   `ee.Initialize(project='your-project-id')`.

Sources: <https://developers.google.com/earth-engine/guides/access> ·
<https://developers.google.com/earth-engine/guides/cloud/projects>

**[Proposed]** Our `.env.example` already reserves
`GEE_PROJECT_ID`, `GEE_SERVICE_ACCOUNT_EMAIL` and `GEE_PRIVATE_KEY` for this.

---

## 4. Quotas and limits

Source: <https://developers.google.com/earth-engine/guides/usage>

### Adjustable, per project

| Quota                          | Default          |
| ------------------------------ | ---------------- |
| Max concurrent requests (standard endpoint) | **40** |
| Max concurrent requests (high-volume endpoint) | **40** |
| Max rate of requests (per project) | **100 req/s** (6,000/min) |
| Max rate of requests (per account) | **100 req/s** (6,000/min) |
| Average concurrent batch tasks | **2 tasks** |
| Max asset storage              | **250 GB**       |
| Max number of assets           | **10,000**       |
| EECU-time per day              | Unlimited (settable via `earthengine.googleapis.com/daily_eecu_usage_time`) |

### Fixed, platform-level

| Limit                          | Value                  |
| ------------------------------ | ---------------------- |
| Single query payload           | **10 MB**              |
| Aggregation result cache       | **100 MiB** (*"Computed value too large"*) |
| Task queue (READY)             | **3,000 tasks** per project |
| BigQuery slot-time per day     | **1,260,000 slot-seconds (350 slot-hours)** |
| Concurrent aggregations        | Limited, unchangeable  |

**Restricted mode:** when the monthly quota is exhausted, *"your requests, EE
Apps and tasks will still run"* but with lower parallelism and reduced
throughput.

---

## 5. Is it practical in 48 hours?

**Yes, with conditions.**

| Factor | Assessment |
| ------ | ---------- |
| Community Tier's 150 EECU-hours/month | **Generous for a demo.** A few hundred small farm-scale reductions cost seconds each. |
| Python API + `geemap` in Colab | **Fastest path**; no infrastructure to manage. |
| Registration + noncommercial verification | **Hard gate.** Budget 1–2 hours at the start, and have a fallback. |
| Community Tier concurrency | **Only 2 concurrent batch tasks.** Do not plan on batch exports. |
| Service-account auth on Vercel | Needs care: the Cloud Project must have EE enabled **and** the service account must hold the EE role. |
| Running GEE from the browser | **Never** for anything secret. Use the server-side API in route handlers. |

---

## 6. Datasets we would use

| Dataset ID                     | Product               | Resolution / cadence        | NASA? |
| ------------------------------ | --------------------- | --------------------------- | ----- |
| `NASA/SMAP/SPL3SMP_E/006`      | SMAP L3 enhanced 9 km daily | 9 km, 1 day (AM + PM) | **Yes** |
| `NASA/SMAP/SPL3SMP_E/005`      | SMAP L3 enhanced 9 km (historical) | 2015-03-31 → 2023-12-03 | **Yes** |
| `NASA/GPM_L3/IMERG_V07`         | IMERG half-hourly     | 11,132 m, 30 min            | **Yes** |
| `NASA/GPM_L3/IMERG_MONTHLY_V07` | IMERG monthly         | 11,132 m, 1 month           | **Yes** |
| `MODIS/061/MOD13Q1`             | MODIS VI 250 m        | 250 m, 16 days               | **Yes** |
| `MODIS/061/MOD13A2`             | MODIS VI 1 km         | 1 km, 16 days                | **Yes** |
| `MODIS/061/MOD11A2`             | MODIS LST 8-day       | 1 km, 8 days                 | **Yes** |
| `LANDSAT/LC09/C02/T1_L2`        | Landsat 9 L2          | 30 m, 16 days                | **Yes** |
| `COPERNICUS/S2_SR_HARMONIZED`   | Sentinel-2 L2A        | 10/20/60 m, 5 days           | No (Copernicus) |

**The NASA Space Apps requirement is satisfied by the NASA rows.** Sentinel-2
is an *enhancement*, never the only source — and it carries Copernicus terms
rather than NASA terms.

---

## 7. Example: farm-scale NDVI via GEE

```python
# Sentinel-2 NDVI, 10 m — the best free farm-scale vegetation index for Nigeria
def ndvi_for_farm(geometry, start, end):
    collection = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(geometry)
        .filterDate(start, end)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
    )
    def add_ndvi(image):
        scaled = image.multiply(0.0001)
        ndvi = scaled.normalizedDifference(["B8", "B4"]).rename("NDVI")
        return image.addBands(ndvi)
    composite = collection.map(add_ndvi).median()
    stats = composite.reduceRegion(
        reducer=ee.Reducer.percentile([10, 50, 90]),
        geometry=geometry,
        scale=10,
        maxPixels=1e13,
    )
    return stats
```

**[Proposed]** The equivalent in the Next.js server would call the Earth
Engine REST API (`computePixels` / `getDownloadURL`) — **or**, more practically
for a Vercel serverless deployment, run a small Python sidecar. **[Open]** Which
of these the team should build is an implementation decision for Phase 2.

**[Proposed]** Whatever is chosen, the **resulting statistics** (median, p10,
p90, valid-pixel fraction) are what we store — not the imagery. This keeps
the raster out of the database and out of Git, per ADR-0005.

---

## 8. Licensing

- **Noncommercial:** free, for research/education/nonprofit, under the Google
  Earth Engine Terms of Service and the noncommercial use criteria.
- **Commercial:** paid plans (`Standard`, `Professional`, `Enterprise`).
  *"Projects associated with a billing account on a Limited plan can be switched
  back to noncommercial use, provided the project remains eligible."*
- **Data licences are separate from the platform licence.** NASA = public
  domain; Landsat = public domain with attribution requested; **Sentinel =
  Copernicus Sentinel Data Terms and Conditions**; SoilGrids = CC BY 4.0.
- **Multiple-account / multi-project quota farming is a Terms-of-Service
  violation** and can trigger blocking of batch task initiation. **One
  project, one account set, documented.**

---

## 9. Recommendation

**Adopt GEE as an optional enhancement, with a hard fallback. Do not make the
MVP depend on it.**

| Decision | Rationale                                                        |
| -------- | ---------------------------------------------------------------- |
| **Register at hour 0** | Verification is the gate. Do it before it becomes urgent.        |
| **Tier: Contributor, or commercial Limited** | Removes the risk of the questionnaire classifying the project as commercial mid-hackathon. A billing account is required but EE usage is not charged. |
| **Do not build the MVP on it** | If registration or verification fails, the demo still works using POWER + SoilGrids + Open-Meteo. |
| **Use it for farm-scale vegetation** | Sentinel-2 NDVI at 10 m is the single most valuable addition to the product's honesty story — it is the one source that genuinely resolves a farm. |
| **Store statistics, not imagery** | Honours ADR-0005 and keeps rasters out of Postgres and Git. |
| **Batch per farm, not per pixel** | 2 concurrent batch tasks on Community Tier. One composite per farm. |

**Fallback if GEE is unavailable:**

| Wanted                              | Fallback                                                    |
| ----------------------------------- | ----------------------------------------------------------- |
| Farm-scale NDVI (10 m)              | Landsat 30 m via GEE-less paths, or MODIS 250 m via AppEEARS/CMR |
| Soil moisture                       | POWER `GWETROOT` / `RZMC` (root zone, 1 m) — no auth, coarser |
| Precipitation                       | POWER `PRECTOTCORR` + `IMERG_PRECTOT`; CHIRPS via ERDDAP     |
| Elevation                           | POWER `site-elevation` / grid elevation; SRTM via AppEEARS    |

**The fallback set is sufficient for a credible demo.** GEE makes the demo
better; it does not make it possible.

---

## 10. Verification checklist for hour 0

- [ ] Create the Google Cloud Project.
- [ ] Enable the Earth Engine API.
- [ ] Register the project for Earth Engine access (Community or Contributor).
- [ ] Complete the noncommercial questionnaire (or register a commercial
      Limited project).
- [ ] Create a service account with the Earth Engine role.
- [ ] Store `GEE_PROJECT_ID`, `GEE_SERVICE_ACCOUNT_EMAIL`, `GEE_PRIVATE_KEY`
      in the Vercel environment.
- [ ] Run one trivial query — e.g. `ee.Image("COPERNICUS/S2_SR_HARMONIZED").first()` —
      and time it. The first call can take 10–30 s while the Python API and
      auth handshake warm up.
- [ ] Confirm the dataset IDs listed in § 6 resolve.
- [ ] **Record the result here and in the commit message:** ☐ works ☐ blocked ☐ pending

---

## 11. Sources

| URL | Used for |
| --- | -------- |
| <https://developers.google.com/earth-engine/guides/noncommercial_tiers> | Tiers, quotas, eligibility |
| <https://developers.google.com/earth-engine/guides/access> | Authentication |
| <https://developers.google.com/earth-engine/guides/cloud/projects> | Cloud Project setup |
| <https://developers.google.com/earth-engine/guides/usage> | Quotas and platform limits |
| <https://developers.google.com/earth-engine/guides/noncommercial_verify> | Verification requirement |
| GEE dataset catalogue entries for `NASA/SMAP/*`, `NASA/GPM_L3/*`, `MODIS/061/*`, `LANDSAT/LC09/*`, `COPERNICUS/S2_SR_HARMONIZED` | Dataset IDs, bands, availability |

All verified **2026-11-13**.
