# Data Sources: Verified Research

**Verification date: 2026-11-13.** Every endpoint, resolution, rate limit and
live behaviour below was checked against official documentation *and*, where
marked **live-verified**, by direct API calls from the research session.

> **How to read this file.** Each source has a fixed template. Anything that
> could not be confirmed is marked **UNVERIFIED**. Live HTTP observations are
> marked with the status code. **Do not treat this document as a substitute for
> re-checking a source before you depend on it.**

---

## 0. The headline finding

**No NASA satellite product in the candidate list resolves a 1 to 50 ha farm,
except Landsat (30 m) and, via Google Earth Engine, Sentinel-2 (10 m).**

| Product                | Native cell            | A 20 ha farm (0.2 km²) is…     | Usable for         |
| ---------------------- | ---------------------- | ------------------------------- | ------------------ |
| MODIS MOD13Q1 NDVI     | 250 m (6.25 ha)        | ~3 pixels                      | Field-scale, coarse |
| Landsat C2 L2 SR        | 30 m (0.09 ha)         | ~220 pixels ✅                  | **Farm-scale**     |
| Sentinel-2 L2A (via GEE)| 10 m (0.01 ha)         | ~2,000 pixels ✅                | **Farm-scale**     |
| SoilGrids 2.0          | 250 m                  | ~3 pixels                      | Field-scale, coarse |
| GPM IMERG              | 0.1° (11,132 m)        | **0.0016 %** of the cell        | District context   |
| SMAP L3 enhanced       | 9 km (81 km²)          | **0.0025 %** of the cell        | Neighbourhood context |
| NASA POWER met         | 0.5° × 0.625° (~55 km) | **0.0066 %** of the cell        | Regional context   |
| CHIRPS                 | 0.05° (~5.5 km)        | ~0.07 % of the cell             | District context   |

**Architectural consequence:** treat POWER / IMERG / SMAP / CHIRPS as **farm
*context* layers** (*is this farm in a wet or dry week? is this region in
drought?*) and Landsat / Sentinel-2 / MODIS as **farm *state* layers**. Never
present a context layer as "your field's value". This is the rule encoded in
[`ADR-0005`](./../decisions/ADR-0005-geospatial-resolution-and-aggregation-strategy.md).

### Three operational landmines found by live testing

1. **ISRIC SoilGrids REST API is degraded.** ISRIC's own documentation (updated
   2026-01-27) states the REST API is *"temporarily paused"* with *"no
   estimated timeline."* Live tests on 2026-11-13 returned HTTP 200 with
   `null` values at (8.5, 12.0), the exact brief coordinate, and ~60 % of
   requests timed out. It worked at (9.0, 12.5).
2. **NASA POWER's regional endpoint rejects any bbox smaller than 2° × 2°**
   (HTTP 422: *"Please provide at least a 2 degree range in latitude;
   otherwise use the point endpoint."*). Kano spans only ~2° of longitude, so
   **use the point endpoint per farm**.
3. **NiMet's documented API returns HTTP 404 on every documented route.**
   `api.nimet.gov.ng`: *do not build on it.*

---

## 1. NASA POWER: Tier 1, integrate first

| Property      | Value                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Provider      | NASA Langley Research Center                                                                       |
| Official docs | <https://power.larc.nasa.gov/docs/methodology/> · <https://power.larc.nasa.gov/parameters/>         |
| API reference | <https://power.larc.nasa.gov/docs/services/api/temporal/> · OpenAPI per endpoint                    |
| Authentication | **None.** *"All endpoints are publicly accessible with no authentication."* (official `llms.txt`)     |
| Licence       | Not a CC licence. NASA requests a courtesy citation; see below.                                       |
| Coverage      | Global, 1981-01-01 → present                                                                       |

### The grid: verified live

| Domain                            | Grid                                  |
| --------------------------------- | ------------------------------------- |
| Meteorological (MERRA-2 / GEOS FP-IT) | **0.5° lat × 0.625° lon** (~55 × 70 km) |
| Solar / radiation (CERES SYN1deg, SRB, FLASHFlux) | 1.0° × 1.0°                  |
| IMERG (high-resolution toggle)    | 0.1° (~10 km), daily, UTC only          |
| SMAP L4 (high-resolution toggle)   | ~0.09° (~9 km), daily, UTC only         |
| NEX-GDDP-CMIP6 (climate)          | ~0.25° (~25 km), daily                  |

**Live-verified 2026-11-13:** a regional request over 10 to 12.5 °N /
7.5 to 9.5 °E returned cell centres at longitudes `7.5, 8.125, 8.75, 9.375`
and latitudes `10.0, 10.5, 11.0 …`, i.e. **0.625° lon × 0.5° lat**. The
docs describe regional responses as *"a 0.5 x 0.5 degree grid"*; treat
**0.5° × 0.625°** as authoritative.

### Endpoints (exact)

Base: `https://power.larc.nasa.gov`

```
/api/temporal/hourly/point              (no regional)
/api/temporal/daily/point
/api/temporal/daily/regional
/api/temporal/monthly/point
/api/temporal/monthly/regional
/api/temporal/climatology/point
/api/temporal/climatology/regional
/api/temporal/{level}/configuration
/api/system/manager/parameters?community=AG&temporal=daily
```

OpenAPI specs: `https://power.larc.nasa.gov/api/temporal/{daily,monthly,climatology,hourly}/openapi.json`
Swagger UI: `https://power.larc.nasa.gov/api/pages/`

**Live-verified request (no auth, HTTP 200, ~0.6 s server time):**

```
https://power.larc.nasa.gov/api/temporal/daily/point
  ?parameters=PRECTOTCORR,T2M,T2M_MAX,RH2M,ALLSKY_SFC_SW_DWN,ALLSKY_SFC_PAR_TOT,WS2M,GWETROOT,IMERG_PRECTOT,TSOIL1
  &community=AG&longitude=8.5&latitude=12.0&start=20241101&end=20241103&format=JSON
```

### Response shape (live-verified)

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [8.5, 12.0, 442.08] },
  "properties": {
    "parameter": { "T2M": { "20241101": 20.39, "20241102": 19.69 } },
    "header": {
      "api": { "version": "v2.10.3", "name": "POWER Daily API" },
      "sources": ["MERRA2", "SYN1DEG", "POWER"],
      "fill_value": -999.0,
      "time_standard": "LST"
    },
    "messages": ["The IMERG Source Data is not available at the Local Solar Time (LST) standard."],
    "parameters": { "T2M": { "units": "C", "longname": "Temperature at 2 Meters" } },
    "times": { "data": 0.603, "process": 0.01 }
  }
}
```

Two practical gifts:

- **`geometry.coordinates[2]` is the grid-cell elevation in metres.** Useful
  context for the farmer, and a sanity check.
- **`fill_value: -999.0` is self-declared.** Strip it instead of averaging it.
  A naive mean over a series containing `-999` produces a garbage number. This
  is a real bug source.

### AG-community parameters (the agroclimatology set)

The `AG` community exposes **161 daily**, **1,388 monthly** and **1,634
climatology** keys. The most useful for DalaShift:

| Variable | Units | Why it matters |
| -------- | ----- | -------------- |
| `PRECTOTCORR` | mm/day | Bias-corrected precipitation: **the workhorse** |
| `IMERG_PRECTOT` | mm/day | Satellite-gauge precipitation at 0.1°: **requires `time-standard=UTC`** |
| `T2M`, `T2M_MAX`, `T2M_MIN` | °C | Temperature |
| `TSOIL1`…`TSOIL6` | °C | Soil temperature at 6 depths (0.018 to 10 m) |
| `GWETROOT` | 1 (0 to 1) | **Root-zone soil wetness, upper 1 m** |
| `GWETTOP` | 1 | Upper 5 cm |
| `RZMC`, `SFMC`, `PRMC` | m³ m⁻³ | Volumetric soil moisture (root zone / surface / profile) |
| `ALLSKY_SFC_SW_DWN` | MJ m⁻² day⁻¹ | Total shortwave irradiance |
| `ALLSKY_SFC_PAR_TOT` | MJ m⁻² day⁻¹ | **PAR: the photosynthesis driver** |
| `RH2M` | % | Relative humidity |
| `WS2M`, `WS10M`, `WS50M` | m s⁻¹ | Wind |
| `CLOUD_AMT` | % | Cloud amount |
| `GDD4_4`, `GDD10`, `GDD15_6` | degree-days | **Growing degree days**: directly usable in crop rules |
| `CDD0`/`CDD10`/`CDD18_3`, `HDD*` | days | Heat/cooling degree days |
| `FROST_DAYS` | days | Frost risk |
| `EVLAND`, `EVPTRNS` | mm/day | **Evapotranspiration**: water-balance input |
| `SWLAND`, `LWLAND` | mm | Surface/longwave radiation |
| `PS`, `SLP` | kPa | Pressure |
| `AOD_55`, `AOD_84` | n/a | Aerosol optical depth |

### Time standard: a live-verified gotcha

POWER defaults to **LST (Local Solar Time)**. IMERG is produced on **UTC** only.
Requesting `IMERG_PRECTOT` without `time-standard=UTC` returns `-999` plus
the message *"The IMERG Source Data is not available at the Local Solar Time
(LST) standard."* (live-verified).

### Limits: what is actually documented

| Limit | Value | Status |
| ----- | ----- | ------ |
| Auth | None | Documented |
| Parameters per point request | **≤ 20** | Documented + OpenAPI |
| Parameters per regional request | **1** | Documented |
| Parameters per hourly request | ≤ 15 | Documented |
| Regional bbox minimum | **≥ 2° lat AND ≥ 2° lon** | **Live-verified** (HTTP 422) |
| Requests per second / day | **Not published** | **UNVERIFIED** |

POWER's own guidance, which is a caching mandate:

> *"Please ensure you do not submit too many synchronous requests. If the
> server determines that you are negatively impacting performance, it may block
> your access."*

> *"with the 0.5° x 0.5° global grid you only need to submit one request per
> cell. If your application persists in requesting the same relative location,
> it will potentially be blocked."*

### Licence and attribution

Not a formal CC licence. POWER's Referencing Guide asks for a **service
reference** *and* a **data reference**:

> *"The data was obtained from National Aeronautics and Space Administration
> (NASA) Langley Research Center's Prediction Of Worldwide Energy Resources
> (POWER) project funded through the NASA Earth Science Division."*

> *"The data was obtained from the POWER Project's Hourly 2.x.x version on
> YYYY/MM/DD."*

It also asks to be notified of publications and onward transmission at
`larc-power-project@mail.nasa.gov`. Source:
<https://power.larc.nasa.gov/docs/referencing/>

### Limitations for our use

- **Grid mismatch is the dominant limitation.** A 20 ha farm is 0.07 % of a
  POWER cell. The value describes ~55 km × 70 km including urban Kano, the
  Sahel, and everything else in the cell.
- **The archive mutates.** *"The POWER Data Archive is a curated data set that
  is not static… the 2–3 months after the current date… become available and
  are used to supersede the quick look meteorological data products.
  Additionally, the POWER Data Archive actively changes/updates with bias
  corrections, model updates, and error fixes."*
  → **Do not cache the last 90 days of daily values as if final.**
- `site-elevation` (m) can be passed for pressure correction against the
  farm's *actual* elevation. The Kano grid cell reports 442 m, while the true
  farm may differ by hundreds of metres on the Nigerian Plateau. **Worth
  doing.**
- Daily point queries give no diurnal cycle. Use the hourly endpoint if VPD
  is ever needed.

---

## 2. NASA SMAP L3: soil moisture (9 km)

| Property      | Value                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Official docs | <https://smap.jpl.nasa.gov/data/> · <https://nsidc.org/data/spl3smp_e/versions/6>                |
| Product       | `SPL3SMP_E` v006: Enhanced L3 daily 9 km EASE-Grid 2.0. DOI `10.5067/M20OXIZHY3RJ`               |
| Depth         | **Top 5 cm** only                                                                                 |
| Authentication | Earthdata Login (NSIDC / PO.DAAC / Earthdata Cloud) **or** a GEE project                         |
| Licence       | Public domain. Citation expected (O'Neill et al.)                                                  |

### Product family

| Product | Short name | Grid | Notes |
| ------- | ---------- | ---- | ----- |
| Enhanced L3 daily | `SPL3SMP_E` v006 | **9 km** EASE-Grid 2.0 | Backus-Gilbert interpolation. **The one to use.** |
| Standard L3 daily | `SPL3SMP` | 36 km | Native radiometer posting |
| L4 root-zone | `L4_SM` | 9 km, 3-hourly | **Model-derived** root-zone moisture |
| NRT products | `L2_SM_P_NRT` | 36 km | *"latency of under 3 hours"*, not science-grade |

**Correction to a common misconception: there is no "36 km enhanced" product.**
The choice is **enhanced 9 km** vs **standard 36 km**. The 9 km grid is a
*posting* grid: the native radiometer footprint is ~33 km, so 9 km ≠ 9 km of
real information.

### Temporal and latency

- Daily composite from ascending (06:00 LST) and descending (18:00 LST) passes.
- Historical: v005 `2015-03-31 → 2023-12-02`; v006 from `2023-12-04` onward.
- JPL latency targets: L1 ≤ 12 h, L2 ≤ 24 h, **L3 ≤ 50 h**, L4 ≤ 7 days.

### Access paths

1. **Google Earth Engine**: `NASA/SMAP/SPL3SMP_E/006` (2023-12-04 → present)
   and `/005` (2015-03-31 → 2023-12-03). Bands `soil_moisture_am`,
   `soil_moisture_pm`. Public domain, no restriction.
2. **NSIDC DAAC**: direct, Earthdata Login. NSIDC is *"retiring access to its
   legacy, on-premises data archive and transitioning to the NASA Earthdata
   Cloud."*
3. **Earthdata CMR**: `has_spatial_subsetting: true`, `has_transforms: true`,
   `cloud_hosted: true`.

**Live-verified granule search:**

```
https://cmr.earthdata.nasa.gov/search/granules.json?short_name=SPL3SMP_E&version=006&bounding_box=8,11.5,9,12.5&page_size=20
```

⚠️ `limit` is **not** a valid CMR parameter (HTTP 400 *"Parameter [limit] was
not recognized"*); use **`page_size`**.

**There is no dedicated SMAP pixel-value REST API.** The practical options are
GEE, CMR + DAAC download, AppEEARS, or the PO.DAAC SDS archive.

### Licence and attribution

> *"This dataset is in the public domain and available for use and distribution
> without restriction"* (GEE catalogue)

Expected citation:

> O'Neill, P. E., S. Chan, E. G. Njoku, T. Jackson, R. Bindlish, J. Chaubell,
> and A. Colliander. SMAP Enhanced L3 Radiometer Global and Polar Grid Daily
> 9 km EASE-Grid Soil Moisture, Version 6. Boulder, Colorado USA. NASA National
> Snow and Ice Data Center DAAC. <https://doi.org/10.5067/M20OXIZHY3RJ>

### Limitations: the honest list

- **9 km is 81 km².** A 20 ha farm is 0.025 % of it.
- **Vegetation attenuation.** L-band sees through moderate canopy but
  sorghum/millet at peak growth biases retrievals, and the rainy season is
  exactly when vegetation is densest.
- **Failures over frozen, water and dense urban**; the Kano region is
  intensely cultivated, so mixed pixels are common.
- **Cloud and heavy-rain attenuation** of the L-band signal → flagged
  retrievals in the wet season.
- **Sparse African validation.** SMAP's in-situ network is thin over the Sahel,
  so uncertainty there is less well characterised than in North America.
- **Only 0 to 5 cm**: irrelevant for root-zone water balance. For root-zone
  moisture use `L4_SM` or POWER's `GWETROOT`/`RZMC`.

---

## 3. NASA GPM IMERG: precipitation (0.1°)

| Property      | Value                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------- |
| Official docs | <https://gpm.nasa.gov/data/imerg> · <https://disc.gsfc.nasa.gov/information/mission-project?title=IMERG> |
| Product       | V07B. DOI `10.5067/GPM/IMERG/3B-HH/07`                                                   |
| Resolution    | **0.1° × 0.1°**: GEE reports **11,132 m**                                                  |
| Temporal      | **30 minutes**                                                                             |
| History       | Jan 1998 → present (TRMM-era included)                                                     |
| Authentication | Earthdata Login (GES DISC) **or none via POWER's `IMERG_PRECTOT`** or GEE             |
| Licence       | *"All NASA-produced data from the GPM mission is made freely available for the public to use."* |

### The three runs: never mix them in one time series

| Run    | Method                                             | Latency        | GES DISC dataset IDs              |
| ------ | -------------------------------------------------- | -------------- | --------------------------------- |
| Early  | Forward propagation only, no gauge                 | **4 h**        | `GPM_3IMERGHHE_07`, `GPM_3IMERGDE_07` |
| Late   | Forward + backward propagation                     | **12 to 14 h** | `GPM_3IMERGHHL_07`, `GPM_3IMERGDL_07` |
| Final  | Full algorithm + **monthly gauge calibration**     | **3.5 months** | `GPM_3IMERGHH_07`, `GPM_3IMERGDF_07`, `GPM_3IMERGM_07` |

> *"Use the IMERG Run with the longest latency that fits your application."*

### Access paths

1. **NASA POWER `IMERG_PRECTOT`**: daily, 0.1°, mm/day, **no auth**. *Easiest
   path by far.*
2. **Google Earth Engine**: `NASA/GPM_L3/IMERG_V07` (30-min) and
   `NASA/GPM_L3/IMERG_MONTHLY_V07`. ⚠️ *The EE collection contains provisional
   products later replaced by the permanent version.*
3. **GES DISC**: HDF5, NetCDF, GeoTIFF, OPeNDAP; subsetting supported.
   Requires a free Earthdata account **linked** to GES DISC (`.netrc` +
   `.urs_cookies`).
4. **Giovanni in the Cloud: Time Series Service**: point time-series CSV API.
   Live-verified: `https://api.giovanni.earthdata.nasa.gov/configured-variables/`
   returns HTTP 200 JSON.
5. **PMM Publisher API**: <https://gpm.nasa.gov/precip-apps> → 1/3/7-day
   GeoTIFF for IMERG Late Run. **Only the most recent 60 days.**
6. **AWS Open Data**: `registry.opendata.aws/nasa-gpm3imergde`. Bucket is
   **controlled access**; Earthdata creds still required.

### A classic unit trap

> *"Please note the 'Units' field: certain datasets are presented as a
> rainfall rate (mm/hr) while others are an accumulation (mm)."*
>
> Source: GES DISC product documentation. The source's em dash has been
> rendered as a colon to match this project's punctuation convention. The
> wording is otherwise unchanged.

Half-hourly granules are **mm/hr**; daily products are **mm accumulation**.
GeoTIFF versions are scaled ×10 (0.1 mm).

### Limitations

- 0.1° is 11 km, a district-scale rainfall number, not a farm number.
- Lower skill over frozen surfaces, complex terrain and coastal zones (less of
  an issue for inland Kano).
- **The changing GPM constellation** may introduce artifacts in multi-year
  trend work.
- Early and Late are only *climatologically* concluding-calibrated; Final sums
  to the monthly satellite-gauge combination.
- Half-hourly IMERG is noisy. Most 30-minute cells have **zero or one**
  microwave overpass. *Accumulate to the scale of the application.*
- **Final Run's 3.5-month latency makes it useless for a live dashboard**,
  which is exactly the point: the Final Run is the right product for
  *historical* analysis.

---

## 4. NASA MODIS: vegetation indices and land surface temperature

| Property      | Value                                                                          |
| ------------- | ------------------------------------------------------------------------------ |
| Official docs | <https://modis.gsfc.nasa.gov/data/dataprod/mod13.php> · <https://www.earthdata.nasa.gov/data/catalog/lpcloud-mod13q1-061> |
| Dataset       | MOD13 V061 (`10.5067/MODIS/MOD13Q1.061`) and MOD11 V061                         |
| Licence       | *"MODIS data and products acquired through the LP DAAC have no restrictions on subsequent use, sale, or redistribution."* |

### Vegetation indices

| Product | Satellite | Spatial | Temporal |
| ------- | --------- | ------- | -------- |
| **MOD13Q1** / MYD13Q1 | Terra / Aqua | **250 m** | 16 days |
| MOD13A1 / MYD13A1 | Terra / Aqua | 500 m | 16 days |
| **MOD13A2** / MYD13A2 | Terra / Aqua | 1 km | 16 days |
| MOD13A3 / MYD13A3 | Terra / Aqua | 1 km | month |
| MOD13C1 / MYD13C1 | Terra / Aqua | 0.05° (~5.6 km) | 16 days |

- MOD13Q1: 250 m, HDF-EOS2, MODIS Sinusoidal tiling, 10°×10° tiles,
  **2000-02-18 → present**, 92.6 MB per granule.
- Compositing: daily L2G surface reflectance (MOD09) → QA-based cloud, snow
  and aerosol masking → a **constrained view-angle** approach picks the pixel
  closest to nadir among the two highest NDVI values.
- Terra crosses the equator ~10:30, Aqua ~13:30; the products are phased
  8 days apart, so **combining Terra + Aqua gives a nominal 8-day cadence**.

### Land surface temperature

| Product | Temporal | Spatial |
| ------- | -------- | ------- |
| **MOD11A2** | **8-day** | 1 km |
| MOD11A1 | daily | 1 km |
| MOD11A3 | 8-day | monthly |

MOD11A2's pixel value is a **simple average** of the corresponding MOD11A1
pixels in the 8-day window. Day and night LST plus emissivity and QA bands are
provided.

### Bands and QA: use these

| Band | Scale | Offset | Notes |
| ---- | ----- | ------ | ----- |
| `NDVI_250m` (MOD13Q1) / `NDVI` (MOD13A2) | ×0.0001 | n/a | int16 |
| `EVI_250m` / `EVI` | ×0.0001 | n/a | int16 |
| `SummaryQA` | n/a | n/a | **Bits 0 to 1**: `0` good, `1` marginal, `2` snow/ice, `3` cloudy. **Filter on this; never average raw NDVI.** |
| `LST_Day_1km`, `LST_Night_1km` | ×0.02 | −273.15 | MOD11A2 |
| `Emissivity_Day_1km`, `Emissivity_Night_1km` | n/a | n/a | |
| `QC_Day`, `QC_Night` | bitmask | n/a | |

### Access

1. **LP DAAC (Earthdata Cloud)**: official home of V061. `cloud_hosted: true`.
2. **LAADS DAAC**: hosts MODIS plus the authoritative file specs at
   <https://ladsweb.modaps.eosdis.nasa.gov/filespec/MODIS/61/MOD13Q1>.
   Requires a LAADS token *or* an Earthdata Login token; LAADS notes EDL works
   but *"download performance from the LAADS DAAC can be much slower."*
   ⚠️ When checked, the LAADS token generator returned *"We are currently
   unable to generate a LAADS DAAC token."*
3. **Google Earth Engine**: `MODIS/061/MOD13Q1` (bands `NDVI_250m`,
   `EVI_250m`, `SummaryQA`), `MODIS/061/MOD13A2`, `MODIS/061/MOD11A2`,
   `MODIS/061/MOD11A1`. MOD13Q1 availability 2000-02-18 → 2026-09-30.
4. **AppEEARS**, **Earthdata CMR** granule search (live-verified over Kano).

### Limitations

- **250 m = 6.25 ha.** A 1 to 2 ha plot is entirely sub-pixel. For smallholder
  maize/sorghum in Kano State this is a serious mismatch; consider Sentinel-2.
- **16-day compositing hides intra-season events**: a 10-day dry spell or a
  single heavy storm can be invisible.
- **NDVI/EVI are already masked** for water, clouds, heavy aerosols and cloud
  shadows, so gaps are *informative*, not errors. **Treat masked pixels as "no
  data", never as zero.**
- **MOD13 V6 was decommissioned 2023-07-31**; use V6.1.
- **MOD11 LST is a *surface* temperature**, not air temperature. It will differ
  from POWER `T2M` by several °C in the afternoon. Never present them as the
  same thing.
- A ~2 % ingest/archive migration interruption at PO.DAAC, ASF DAAC and GES
  DISC was scheduled for **28 to 30 October 2026** (Earthdata alert).

---

## 5. NASA/USGS Landsat Collection 2 Level 2: the farm-scale source

| Property      | Value                                                                            |
| ------------- | -------------------------------------------------------------------------------- |
| Official docs | <https://www.usgs.gov/landsat-missions/landsat-data-access> · GEE catalogue entries |
| Resolution    | **30 m, all bands**                                                             |
| Revisit       | 16 days per satellite; ~8 days with two operational satellites                  |
| History       | Landsat 5 from 1984, Landsat 7 from 1999 (SLC-off gaps from 2003), Landsat 8 from 2013-03, Landsat 9 from 2021-10-31 |
| Licence       | *"Landsat datasets are federally created data and therefore reside in the public domain and may be used, transferred, or reproduced without copyright restriction."* Attribution **requested**, not required. |

### Scene and processing

Scene ≈ 170 km × 183 km on a standardised reference grid. Surface reflectance
uses the **LaSRC** algorithm; surface temperature uses the joint RIT / NASA JPL
single-channel algorithm. Processing levels: `L2SP` (SR + ST) and `L2SR`
(SR only, thermal bands present but empty). Collection category `T1`.

### Bands: exact names, scales, offsets

| Band | Scale | Offset | Wavelength | Use |
| ---- | ----- | ------ | ---------- | --- |
| `SR_B1` | 2.75e-05 | −0.2 | 0.435 to 0.451 µm | Ultra blue (coastal aerosol) |
| `SR_B2` | 2.75e-05 | −0.2 | 0.452 to 0.512 µm | Blue |
| `SR_B3` | 2.75e-05 | −0.2 | 0.533 to 0.590 µm | Green |
| **`SR_B4`** | 2.75e-05 | −0.2 | 0.636 to 0.673 µm | **Red → NDVI** |
| **`SR_B5`** | 2.75e-05 | −0.2 | 0.851 to 0.879 µm | **NIR → NDVI** |
| `SR_B6` | 2.75e-05 | −0.2 | 1.566 to 1.651 µm | SWIR 1 |
| `SR_B7` | 2.75e-05 | −0.2 | 2.107 to 2.294 µm | SWIR 2 |
| `ST_B10` | 0.00341802 | 149 | 10.60 to 11.19 µm | Surface temperature (K) |
| `ST_ATRAN`, `ST_DRAD`, `ST_EMIS`, `ST_EMSD`, `ST_QA`, `ST_TRAD`, `ST_URAD`, `ST_CDIST` | n/a | n/a | n/a | ST intermediates |
| `SR_QA_AEROSOL` | n/a | n/a | n/a | Aerosol attributes (bits 6 to 7 = level) |
| `QA_PIXEL` | n/a | n/a | n/a | CFMASK: bit 1 dil. cloud, 2 cirrus, 3 cloud, 4 cloud shadow, 5 snow, 6 clear, 7 water; 8 to 9 cloud conf., 10 to 11 shadow conf., 12 to 13 snow conf., 14 to 15 cirrus conf. |
| `QA_RADSAT` | n/a | n/a | n/a | Saturation QA; bit 3 = terrain occlusion |

### NDVI computation: the official snippet

```js
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true).addBands(thermalBands, null, true);
}
```

> ⚠️ **Band offsets differ across sensors.** Landsat 9 has no band 8; NIR is
> `SR_B5`. For Landsat 7 (LE07) the equivalents are `SR_B4` (NIR) and `SR_B3`
> (red). **Do not hard-code band indices.**

### Access paths

1. **Google Earth Engine**: `LANDSAT/LC09/C02/T1_L2` (also LC08, LE07, LT05).
   Landsat 9 availability 2021-10-31 → 2026-11-07 (live-verified).
2. **EarthExplorer**: <https://earthexplorer.usgs.gov> (manual).
3. **USGS M2M API**: <https://m2m.cr.usgs.gov/api/docs/reference/>.
   Endpoints: `login`, `login-token`, `dataset-search`, `dataset-filters`,
   `scene-search`, `scene-list-add`, `permissions`, `download-options`,
   `download-request`, `download-retrieve`, `download-search`, `logout`.
   Dataset aliases `landsat_ot_c2_l1`, `landsat_ot_c2_l2`.
   **Requires:** an EROS Registration Service account, a **manual access request**
   for MACHINE access (<https://ers.cr.usgs.gov/profile/access>), and, per the
   community API client docs, *"wait a couple of days before acceptance."*
   The `login` endpoint was deprecated 2025-02-26; use **`login-token`** with a
   64-bit application token.
   → **Not viable inside 48 hours.** Use GEE or AWS instead.
4. **AWS**: `gs://gee-public-data-landsat` (**requester-pays**) plus a
   BigQuery index `earth-engine-public-data.geo_index.landsat_c2_index`.
5. **AppEEARS**: Landsat 8 SR point and area requests.
6. **Harmony / Earthdata CMR** for subsetting.

### Limitations

- **Cloud is the binding constraint in Kano.** June to September is cloudy;
  with a 16-day revisit you may get **one usable scene every 3 to 6 weeks** in
  the wet season. Use a multi-scene median composite over a season, or
  Sentinel-2 (5-day revisit).
- **Landsat ST has systematic gaps** because it depends on the ASTER GED
  emissivity climatology (2000 to 2008, clear-sky only): *"The missing Landsat
  ST pixels will be consistent through time (1982-present)."* **Do not build a
  trend on `ST_B10`.**
- `L2SR`-only scenes exist; check `PROCESSING_LEVEL`.
- 30 m is good for ≥ 5 ha fields and marginal for 1 to 2 ha plots in northern
  Kano's fragmented holdings.

---

## 6. ISRIC SoilGrids 2.0: soil properties (250 m)

| Property      | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Official docs | <https://docs.isric.org/globaldata/soilgrids/> · <https://rest.isric.org/soilgrids/v2.0/docs> |
| REST base     | `https://rest.isric.org/soilgrids/v2.0`                                     |
| OpenAPI       | `https://rest.isric.org/soilgrids/v2.0/openapi.json`                        |
| Authentication | **None**                                                                   |
| Licence       | **CC BY 4.0 since 2019**: attribution required                             |
| Rate limit    | **Fair Use Policy: 5 API calls per 1 minute**                              |

### Properties, depths, values

Properties: `bdod`, `cec`, `cfvo`, **`clay`**, `nitrogen`, `ocd`, **`phh2o`**,
**`sand`**, **`silt`**, **`soc`**, `wv0010`, `wv0033`, `wv1500`, plus derived
`ocs` (organic carbon stock 0 to 30 cm).

Depths (6 standard layers): `0-5cm`, `5-15cm`, `15-30cm`, `30-60cm`,
`60-100cm`, `100-200cm`.

Values: `Q0.05`, `Q0.5`, `Q0.95`, `mean`, `uncertainty`, where
`uncertainty = (Q0.95 − Q0.05) / Q0.50`, the 90 % prediction-interval width
ratio. **Use it.** It is designed for exactly our honesty problem.

### Resolution and projection

Primary: **250 m**. 1 km and 5 km are coarser/legacy aggregations (exact
current availability in the 2.0 release is **partially UNVERIFIED**).
Projection: **equal-area (Interrupted Goode Homolosine)**, WGS84 datum: ESRI
:54052, pseudo-EPSG **152160** (`+proj=igh +datum=WGS84`). WMS/WCS also publish
in EPSG:4326, :54009 (Mollweide) and :54012 (Eckert IV).

### Endpoints

```
GET https://rest.isric.org/soilgrids/v2.0/properties/query
 ?lon=8.5&lat=12.0
 &property=clay&property=sand&property=silt&property=phh2o&property=soc&property=bdod
 &depth=0-5cm&depth=5-15cm
 &value=mean&value=Q0.05&value=Q0.95
GET https://rest.isric.org/soilgrids/v2.0/properties/layers
GET https://rest.isric.org/soilgrids/v2.0/classification/query?lon=8.5&lat=12.0
```

**Live-verified response (2026-11-13):**

```json
{"type":"Feature","geometry":{"type":"Point","coordinates":[8.5,12.0]},
 "properties":{"layers":[
   {"name":"phh2o","unit_measure":{"d_factor":10,"mapped_units":"pH*10","target_units":"-"},
    "depths":[{"range":{"top_depth":0,"bottom_depth":5,"unit_depth":"cm"},"label":"0-5cm",
               "values":{"mean":67}}]}]},
 "query_time_s":1.30}
```

⚠️ **Values are integers in *mapped units*.** Apply `d_factor`:
`phh2o` 67 → **6.7 pH**; `clay` 137 → **13.7 %**; `soc` 79 → **7.9 g/kg**;
`bdod` → kg/dm³ from cg/cm³ (×100). The `soilDB` R package does this
conversion. **Getting this wrong is a silent 10× error.**

### 🚨 Live-verified degradation: the highest operational risk

ISRIC's own documentation (updated 2026-01-27):

> *"Unfortunately, we are currently experiencing issues with the REST API for
> SoilGrids, and have decided to temporarily pause the service… we cannot
> provide an estimated timeline for when the service will be restored."*

Live tests on 2026-11-13:

| Request | Result |
| ------- | ------ |
| `/properties/layers` | ✅ HTTP 200, full layer structure |
| `/properties/query` (5.4, 51.9) clay 0 to 5 | ✅ clay = 382 (38.2 %) |
| `/properties/query` (8.5, 12.05) clay 0 to 5 | ✅ clay = 137 (13.7 %) |
| `/properties/query` (9.0, 12.5) | ✅ phh2o = 67 (6.7), soc = 79 (7.9 g/kg) |
| **`/properties/query` (8.5, 12.0)** | ⚠️ **HTTP 200 but `"mean": null`**, twice, for `mean` and `Q0.5` |
| 6 further Kano-area points | ❌ **timeouts** |
| `/classification/query` | ❌ timeout |

**Interpretation:** the service is live but flaky (~60 % timeout rate), **and**
there appears to be a genuine **data void at (8.5, 12.0)**, the exact brief
coordinate.

### Alternatives (ISRIC's own recommendations)

1. **WCS**: `https://maps.isric.org/mapserv?map=/map/clay.map&service=WCS&version=2.0.1&request=GetCoverage&coverageId=clay_0-5cm_mean&format=image/tiff&subset=Lat(11.9,12.1)&subset=Long(8.4,8.6)`.
   ⚠️ **Live test returned HTTP 400**: *"Raster size out of range, width and
   height of resulting coverage must be positive."* → the subset syntax for
   small AOIs needs adjustment. **UNVERIFIED.**
2. **WebDAV / VRT**: `https://files.isric.org/soilgrids/latest/data/`.
   Full global maps; **~5 GB per map**; ~120 GB for one property × 6 depths ×
   4 quantiles.
3. **Google Earth Engine**: SoilGrids predictions exist as a
   community-contributed dataset. **Asset ID UNVERIFIED.**
4. **CDN-hosted Cloud-Optimized GeoTIFF**: `soilDB` fetches directly from
   `files.isric.org`.

**Recommendation:** use SoilGrids as a **static, pre-baked lookup keyed on the
250 m grid cell**, not a live call. This solves the rate limit, the flakiness
and the void problem in one move. See
[`data-retrieval-strategy.md`](./data-retrieval-strategy.md).

### Licence and attribution

CC BY 4.0 since 2019: *"SoilGrids products are provided under the CC BY 4.0
(publicly accessible environmental data)."* Required attribution:

> SoilGrids 2.0. Hengl, T., et al. / ISRIC World Soil Information. Map of
> soil properties. CC BY 4.0. [link] (accessed YYYY-MM-DD).

Under CC BY 4.0 you must credit the source, provide a licence notice, and
indicate changes.

### Limitations

- **Predictions, not measurements.** The 90 % prediction intervals are wide in
  weakly-observed regions.
- **Nigeria-specific caveat:** SoilGrids is trained on WoSIS profiles, which
  are **sparse in Nigeria**. The prediction at Kano may be driven by a handful
  of profiles extrapolated over hundreds of km. **Treat it as soil *potential*
  and textural class, not as a measured value for a specific plot.**
- 250 m → the value applies to ~6.25 ha. Fine for ≥ 5 ha, meaningless for 1 ha.
- **Attribute the uncertainty to the farmer rather than hiding it.** The
  `uncertainty` value is literally designed for this.

---

## 7. Google Earth Engine: the farm-scale enabler (optional)

See [`google-earth-engine.md`](./google-earth-engine.md) for the full
assessment, quotas, licensing and the 48-hour feasibility analysis.

Summary: GEE is the only route to **10 to 30 m farm-scale pixels for free**
(Sentinel-2 at 10 m, Landsat at 30 m), plus SMAP, MODIS and IMERG. It is
**optional** in our architecture; see
[`ADR-0008`](./../decisions/ADR-0008-google-earth-engine-dependency.md).

---

## 8. Other sources

### 8.1 NASA AppEEARS

- **What:** subsetting/sampling service over LP DAAC and other federal
  archives. Point or area (polygon) requests; returns values, quality flags and
  summary statistics; CSV (point) / GeoTIFF (area).
- **Products include:** ECOSTRESS, GEDI, Landsat 8 SR, MODIS, VIIRS, **SMAP**,
  Daymet, GPWv4, SRTM.
- **API pattern (from official NASA tutorials):** `POST {API_URL}/login` →
  bearer token; `POST {API_URL}/task` with a JSON task object; `GET
  {API_URL}/task/{id}` polled **every ~20 seconds**; `POST {API_URL}/logout`.
  Task JSON fields: `taskName`, `taskType` (`"point"` | `"area"`),
  `startDate`/`endDate` (`MM-DD-YYYY`), `coordinates`, `layers`, `projection`,
  `outFormat` (`"geotiff"`).
  Base URL `https://appeears.earthdatacloud.nasa.gov/api`: **UNVERIFIED**
  (the tutorials use a placeholder `API_URL`).
- **Auth:** Earthdata Login required. **Rate limits:** UNVERIFIED.
- **Licence:** Open data; *"Users are encouraged to cite both the AppEEARS
  software and data products. All citations are included in the 'Data Product
  Citations' and 'Software Citation' sections of the README.md generated for
  each request."*
- **Use for:** point-extracting SMAP / MODIS LST / Landsat SR at farm centroids
  for a handful of farms (our exact use case), and it returns quality flags.
- <https://www.earthdata.nasa.gov/data/tools/appeears>

### 8.2 NASA Giovanni

- **Time Series Service**: point-subsetting time series, CSV out.
  Live-verified: `https://api.giovanni.earthdata.nasa.gov/configured-variables/`
  → HTTP 200 JSON. Endpoints `proxy-timeseries` (browser) and `timeseries`
  (programmatic; needs `.netrc` + `.urs_cookies`).
- **GES DISC Subsetter**: spatial/temporal/variable subsetting with regridding
  and daily min/max/mean.
- **Auth:** Earthdata Login linked to GES DISC. **Rate limits:** UNVERIFIED.
- **Use for:** an IMERG time series at a farm centroid without touching GEE.
- <https://disc.gsfc.nasa.gov/information/howto?title=Giovanni%20In%20The%20Cloud:%20Time%20Series%20Service>

### 8.3 Earthdata CMR: the hidden backbone, and our discovery primitive

- **What:** the metadata search API behind Earthdata Search. Works for **every**
  NASA DAAC product. **No auth for metadata search.**
- **Live-verified:**
  ```
  https://cmr.earthdata.nasa.gov/search/collections.json?short_name=SPL3SMP_E&version=006
  https://cmr.earthdata.nasa.gov/search/granules.json?short_name=MOD13Q1&version=061&bounding_box=8,11.5,9,12.5&page_size=20
  ```
- Response fields confirmed: `time_start`, `time_end`, `dataset_id`,
  `data_center`, `granule_size`, `cloud_cover`, `online_access_flag`, `polygons`,
  and `links[]` with direct download `href`s.
- ⚠️ `limit` is not valid; use **`page_size`**.
- **Use for:** discovery, plus a stable "find the granules for my farm bbox"
  primitive that is decoupled from any single DAAC's interface.
- <https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html>

### 8.4 Copernicus Sentinel-2 L2A: the best free farm-scale vegetation index

- **GEE dataset:** `COPERNICUS/S2_SR_HARMONIZED` (Level-2A surface reflectance).
- Availability **2017-03-28 → 2026-11-12**; **revisit 5 days**; extent −56°
  to 83° lat (covers Kano).
- **Pixel size: 10 m for B2/B3/B4/B8; 20 m for B5/B6/B7/B8A/B11/B12; 60 m for
  B1/B9.** Scale **0.0001**.
- **NDVI = (B8 − B4) / (B8 + B4)** → **10 m = 1 ha pixels.** A 1 ha plot ≈ 1
  pixel; a 20 ha plot ≈ 20 pixels. **This is the best free farm-scale
  vegetation index available for Nigeria.**
- `SCL` scene classification (20 m): 4 Vegetation, 5 Bare Soils, 3 Cloud
  Shadows, 6 Water, 7/8/9 cloud probability, 10 Cirrus, 11 Snow/Ice.
  `CLOUDY_PIXEL_PERCENTAGE` for pre-filtering. Companions:
  `COPERNICUS/S2_CLOUD_PROBABILITY`, `GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED`.
- **Harmonization:** post-2022-01-25, `PROCESSING_BASELINE 04.00+` scenes have
  DN shifted by +1000; the HARMONIZED collection corrects this.
- ⚠️ *"2017-2018 L2 coverage in the EE collection is not yet global."*
- **Licence:** **Copernicus Sentinel Data Terms and Conditions**, *not* a CC
  licence; free, but attribution expected.
  <https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice>
- ⚠️ **Sentinel-2 is not NASA data.** Using it does **not** satisfy the "at
  least one NASA data or resource" requirement. **We must use NASA data too**:
  POWER, SMAP, IMERG, MODIS or Landsat.

### 8.5 CHIRPS: gauge-corrected rainfall (0.05°)

- **CHIRPS v3** (operational since January 2025): **0.05°**, 60°N to 60°S,
  1981 → present. v3 **Preliminary** published **2 days after each pentad**
  (2nd, 7th, 12th, 17th, 22nd, 27th of each month). **CHIRPS v2 continues in
  parallel through December 2026.**
- Readme: `https://data.chc.ucsb.edu/products/CHIRPS/v3.0/daily/readme.txt`.
- **Important semantic note from CHC:** *"the date associated with a daily
  CHIRPS value should be interpreted as a consistent date label assigned
  during the disaggregation process, rather than as representing a uniform
  observation window across all contributing station datasets."* **CHIRPS daily
  is disaggregated from pentads; do not treat it as an independent daily
  observation.**
- **Station sparsity:** CHC publishes per-pixel station-density maps
  precisely because the station inputs do most of the non-guesswork. In rural
  Kano, station density is low, so daily values lean on the satellite IR
  climatology.
- **Access:** CHC direct NetCDF/GeoTIFF/CSV; exact v3 file naming
  **UNVERIFIED** (guessed paths returned 404/429). **NOAA ERDDAP**:
  `https://coastwatch.pfeg.noaa.gov/erddap/griddap/chirps20GlobalDailyP05`
  (documented and stable; live request timed out; the server is slow, not
  missing). GEE community dataset `UCSB-CHG/CHIRPS/DAILY`: **UNVERIFIED**.
- **Licence:** CHC *"waived all copyright and related or neighbouring rights
  to CHIRPS3"*, with a required data citation (DOI `10.15780/G2JQ0P`). NOAA's
  data.gov record for **CHIRPS v2** lists **CC BY 4.0**; ERDDAP/data.gov
  entries list CC0. **Treat as: attribution required, permissive, but confirm
  the exact licence for the version and host you ship.**
- **Why it matters:** at 0.05° (~5.5 km) it is **2× finer than IMERG** and
  **gauge-corrected**, which is exactly what West Africa needs.

### 8.6 Open-Meteo: forecasts, and the most actionable API in the list

- **Real, free, verified.** Open source (AGPLv3), self-hostable, backed by
  national weather service model data.
- **No API key, no sign-up, no credit card** for non-commercial use.
  Live-verified 2026-11-13: HTTP 200 from
  `https://api.open-meteo.com/v1/forecast?latitude=12.0&longitude=8.5&current=...&daily=precipitation_sum&timezone=Africa/Lagos&forecast_days=2`,
  response includes `elevation: 485.0` m and `timezone: "Africa/Lagos"`.
- **Rate limits (from live response headers, `x-ratelimit-limit: 600.0`):**
  **600 calls/min, 5,000/hour, 10,000/day, 300,000/month** (free tier).
  ⚠️ *"Rate limits are applied by IP addresses and application. If you are
  using providers like **Vercel, Netlify, Render, or Google Sheets** you might
  be rate-limited earlier than expected. Consider using Cloudflare Workers, as
  we apply limits per Cloudflare user."* **Directly relevant to a Vercel
  deployment.**
- **Commercial use is NOT allowed on the free tier**; needs a paid plan.
- **Licence:** all API data is **CC BY 4.0: attribution required** (*"Data is
  provided by Open-Meteo"*). Source code AGPLv3.
- **Resolution:** *"Resolution ranges from 1 to 2 km (regional mesoscale) to
  9 to 11 km (global). All output is normalised to hourly resolution."*
- **Coverage:** 30+ models (ECMWF, NOAA, DWD, Météo-France, JMA, KMA, KNMI,
  DMI); forecasts to 16 days; historical from 1940.
- ⚠️ **Contradiction in Open-Meteo's own docs:** the pricing table lists
  "Historical Weather API ✅" under Free/Open-Access, but the body text states
  *"Historical, climate, ensemble, and satellite radiation APIs require the
  Professional API Plan or higher."* **UNVERIFIED: test before relying on
  it.**
- **Use for:** the "what should I do this week" panel: spray windows,
  irrigation timing, drying windows. **This is the most farm-*actionable* API
  in the entire list, and the easiest.**

> **Note on the quotations above.** Two dashes inside quoted Open-Meteo text
> have been rendered as colons or the word "to" to match this project's
> punctuation convention. The wording is otherwise unchanged, and the source
> is <https://open-meteo.com/en/docs>.

### 8.7 FAOSTAT

- **What:** national annual crop and livestock production, yield, harvested
  area; trade; food-security indicators; land use. **~1961 → present.**
- **API:** `https://faostatservices.fao.org/api/v1/` (production);
  `https://api-faostat.dev.fao.org/api/v1/` (dev). OpenAPI/Redoc at
  <https://www.fao.org/faostat/en/docs/redoc-static.html>. Endpoints include
  `/bulkdownloads/{domain_code}/`, `/en/definitions/domain/{domain_code}`,
  `/en/data/`, `/en/codes`, `/en/groups`, `/en/search`, `/en/documents`,
  `/en/suggestions`.
- **Domain `QCL`** = Crops and livestock products (Production).
- ⚠️ **API V2 replaces V1.** *"V1 API calls will no longer be supported."*
  Confirm the V2 endpoint shape before coding.
- **Licence:** **CC BY 4.0** + FAO Statistical Database Terms of Use. Extra
  terms: *"Datasets shall not be used for or in conjunction with the
  promotion of a commercial enterprise… or in any way that suggests that FAO
  endorses any specific company, products or services."* A set citation ending
  *"Licence: CC-BY-4.0."* is required.
- **Granularity: national annual, NOT farm level.** Use for context (Nigeria
  millet/sorghum yields, Kano State output) and a national benchmark panel.
- Regional mirror: HDX
  <https://data.humdata.org/dataset/nga-faostat-crops-livestock-production>.

### 8.8 Nigeria Meteorological Agency (NiMet)

- **What:** Nigeria's national meteorological agency; runs an AgroMet unit;
  publishes an **Agrometeorological Bulletin every 10 days**, Seasonal Climate
  Prediction, Seasonal Rainfall Prediction and 3-day forecasts. Stations
  include **KANO**, KATSINA, KADUNA, GUSAU, NGURU, DUTSE, ILORIN, ABUJA,
  BAUCHI, MAIDUGURI, MAKURDI.
- **Data request:** <https://nimet.gov.ng/datarequest>, **priced in Naira**,
  with client categories (BSc, MSc, PhD, Small/Medium/Large Scale Company,
  Lecturers, Researchers, MoU, NGO, Staff). NGO/researcher categories may be
  cheap or free. **Not instant.**
- 🚨 **Free API currently non-functional.** <https://nimet.gov.ng/weatherapi>
  documents `GET /forecaststation`, `GET /forecast/:location`,
  `GET /temperature?state=`, `GET /srp?state=`, `GET /historical-data/:date`.
  **Live test 2026-11-13: every route returned HTTP 404**, including `GET /`.
  → **Do not build on it.**
- **Policy:** <https://nimet.gov.ng/admin/uploads/NIMET%20DATA%20POLICY-2SUUFhcs-6.pdf>.
- **If it returns**, it would be the single best local source (Kano station
  observations + LGA-level SRP). **[Proposed]** Keep the adapter behind the
  integration-module interface so it can be enabled without changing anything
  else.

### 8.9 Nigeria NBS

- <https://www.nigerianstat.gov.ng/>: statistical abstracts and reports
  (PDF/Excel). **No documented open API found; UNVERIFIED.** Useful for
  background statistics (population, state agriculture output), not farm
  time-series.

### 8.10 Land cover and farm geometry

**FAO Agro-informatics "New land cover data for Nigeria"** (2026-01-30): 30 m
Sentinel-2-based Random Forest land cover, **83 % overall accuracy**, national
legend adapted from the West African Land Cover Reference System.
⚠️ **Covers Kebbi, Niger, Ondo and Cross River, NOT Kano.**
<https://data.apps.fao.org/?lang=en&share=f-06e9ea55-704c-4e3c-8bc7-785dab86906c>

**Overture Maps**: OSM-derived, global, **monthly release**. The most
practical source for farm-level geometry and attributes:
- Themes: `base` (`land_use`, `land_cover`, `land`, `water`,
  `infrastructure`, `bathymetry`), `places`, `buildings`, `addresses`,
  `divisions`, `transportation`.
- `land_use` subtypes include **farmland, orchard, plant_nursery,
  greenhouse_horticulture, meadow/grass, forest/wood, vineyard, aquaculture**,
  brownfield/greenfield. `buildings` includes farm buildings; `place` includes
  Farm nodes.
- **Access:** GeoParquet on S3
  `s3://overturemaps-us-west-2/release/<RELEASE>/theme=base/type=land_use/*.parquet`;
  Azure mirror; CLI `overturemaps download --type=land_use --bbox=8.4,11.8,8.6,12.2 -f geojson`;
  DuckDB over Parquet for server-side filtering.
- **Licence:** per-feature `sources[].license` (CC0 1.0 → CC BY 4.0 and
  national open licences). Requested attribution: *"Overture Maps Foundation,
  overturemaps.org"*. Underlying OSM is ODbL.
- ⚠️ **Coverage caveat: OSM land use in rural northern Nigeria is sparse.**
  Use it to *validate* farmer-supplied polygons, not as the primary geometry.

**GRID3 NGA** (CIESIN): Nigeria roads and settlement extents, GeoPackage,
DOI `10.7916/b42r-6w17`, permissive terms ("free to download, store, access,
use, copy, adapt"). Good for last-mile access and market distance.

### 8.11 Crop calendars

**Sacks et al. 2010** (Univ. Wisconsin-Madison, SAGE), *the* standard public
crop-calendar dataset:
- 19 crops; gridded planting and harvesting dates at **5-minute (~9 km)** and
  **0.5° (~55 km)** resolution; netCDF and ArcINFO ASCII.
- Variables per crop: `plant.start`, `plant`, `plant.end`, `harvest.start`,
  `harvest`, `harvest.end` plus `.range` variants.
- Download: <https://sage.nelson.wisc.edu/data-and-models/datasets/crop-calendar-dataset>
  → files at `https://sage-public-files.s3.amazonaws.com/crop-calendar-dataset/`
  (e.g. `Maize.crop.calendar.tif`, `Maize.2.crop.calendar.tif`).
  R: `geodata::crop_calendar_sacks("maize", path=...)`.
- **Courtesy requirement:** *"If you download this dataset, please email Bill
  Sacks at wsacks@gmail.com."*
- ⚠️ **Nigeria coverage may be thin.** The dataset's readme publishes regional
  observation counts but **no Nigeria-specific coverage figure; UNVERIFIED
  for Kano.** Blank cells are common where a crop has no observations.
- **Licence:** the dataset page is CC BY 4.0 per the OasisHUB mirror; the
  primary page's terms are less explicit. **Treat as CC BY 4.0: verify and
  attribute** Sacks et al. (2010), doi:10.1111/j.1466-8238.2010.00551.x.

**MIRCA2000**: 26 crops, **irrigated vs rainfed** distinction, monthly
planting/harvest months, circa 2000 (1998 to 2002 average). Better coverage in
Africa than Sacks but coarser temporally. **UNVERIFIED: current public
download URL unconfirmed.**

**IIASA agro-climatic calendars**: **UNVERIFIED.** Could not reach or verify
an IIASA-published dataset. Treat as a research lead, not an integration
target.

**GCPE (Global Crop Phenology)**: referenced in the agronomy literature
(agrmet 79(3), 2023) as *agro-climatically estimated* calendars for areas
where cropland does not yet exist. **UNVERIFIED: public access unconfirmed.**

---

## 9. Master comparison table

| Source | Auth | Resolution | Temporal | Latency | History | Rate limits | Licence |
| ------ | ---- | ---------- | -------- | ------- | ------- | ----------- | ------- |
| **NASA POWER** | **None** | 0.5°×0.625° met; 1° solar; 0.1° IMERG | daily/hourly/monthly/clim | NRT; archive mutates 2 to 3 mo | **1981→now** | No published number; ≤20 params/point; regional = 1 param; bbox ≥ 2° | NASA courtesy citation |
| **SMAP L3 enhanced** | Earthdata or GEE | **9 km** | daily (AM/PM) | L3 ≤ 50 h | 2015→now | UNVERIFIED | Public domain; citation |
| **GPM IMERG Early** | Earthdata; none via POWER | **0.1° (11,132 m)** | 30 min | **4 h** | 1998→now | UNVERIFIED | Free; citation + DOI |
| **GPM IMERG Late** | Earthdata; none via POWER | 0.1° | 30 min | 12 to 14 h | 1998→now | UNVERIFIED | Free; citation + DOI |
| **GPM IMERG Final** | Earthdata | 0.1° | 30 min/daily/monthly | **3.5 mo** | 1998→now | UNVERIFIED | Free; citation + DOI |
| **MODIS MOD13Q1** | Earthdata or GEE | **250 m** | 16 days | days | 2000-02→now | UNVERIFIED | No use/sale/redistribution restriction |
| **MODIS MOD11A2 (LST)** | Earthdata or GEE | 1 km | 8 days | days | 2000-02→now | UNVERIFIED | No restrictions |
| **Landsat C2 L2** | Earthdata, GEE, or M2M (ERS + **manual approval ~days**) | **30 m** | 16 days | hours to 1 day | 1984→now | UNVERIFIED | Public domain; credit requested |
| **Sentinel-2 L2A** | GEE (or CDSE) | **10 m** | 5 days | 1 to 3 d | 2015→now | GEE quotas | **Copernicus Sentinel terms (not CC)** |
| **ISRIC SoilGrids 2.0** | **None** | **250 m** | static | n/a | current release | **5 calls/min** | **CC BY 4.0** |
| **Google Earth Engine** | Google acct + Cloud Project + EE enabled + noncommercial verification | inherits dataset | inherits dataset | seconds | inherits | 40 concurrent; 100 req/s; 2 batch tasks; 250 GB assets; **150/1,000/100,000 EECU-hr per month** | EE ToS + tier rules |
| **NASA AppEEARS** | Earthdata | per product | per product | **async, poll ~20 s** | per product | UNVERIFIED | Open; cite software + products |
| **NASA Giovanni TSS** | Earthdata + `.netrc` + cookies | per collection | per collection | per collection | per collection | UNVERIFIED | Open; cite GES DISC + DOI |
| **Earthdata CMR** | **None** for search | n/a | n/a | seconds | full archive | UNVERIFIED | Metadata; products keep their licences |
| **USGS M2M** | ERS + manual MACHINE approval + app token | 30 m | 16 d | 1 to 3 d | 1984→now | UNVERIFIED | Public domain |
| **CHIRPS v3 / v2** | None (CHC, NOAA ERDDAP) | **0.05° (~5.5 km)** | daily (disaggregated from pentads) | v3 prelim +2 d after pentad | **1981→now** | UNVERIFIED | Attribution required; CC BY 4.0 (v2 NOAA record) |
| **Open-Meteo** | **None** (free tier) | 1 to 2 km regional / 9 to 11 km global | hourly; daily; 16 d forecast | near-real-time | 1940→now | **600/min, 5,000/hr, 10,000/day, 300,000/mo**, per IP + per app; **Vercel may be limited earlier** | **CC BY 4.0**; commercial needs paid plan |
| **FAOSTAT** | None | **National annual** | annual | annual release | 1961→now | UNVERIFIED | **CC BY 4.0** + FAO terms (no commercial promotion) |
| **NiMet** | Manual paid (₦) / free API (**404**) | Station point | hourly/daily/monthly | NRT | 100+ years | n/a | NiMet Data Policy: **not open** |
| **Nigeria NBS** | None (PDF/Excel) | State/national | annual | periodic | varies | n/a | UNVERIFIED |
| **Sacks crop calendar** | None (S3) | **5-min (~9 km) & 0.5°** | static windows | n/a | circa 2000 | n/a | CC BY 4.0 (verify) + citation + courtesy email |
| **MIRCA2000** | None | global gridded, monthly | monthly | n/a | ~2000 | n/a | UNVERIFIED |
| **Overture Maps** | None | vector | monthly release | days | full OSM history | n/a | per-feature; attribution requested |
| **FAO Nigeria land cover** | None | 30 m | static (2024) | n/a | 2024 | n/a | FAO open data; **not Kano** |

---

## 10. Attribution register

**[Proposed]** Every entry below must appear in the NASA Space Apps
submission's **References** field: *"all resources, even open source
resources, must be cited."* See
[`docs/hackathon/README.md` § 4.4](./../hackathon/README.md#44-citation-is-mandatory--including-for-open-source-resources).

| Source | Required wording |
| ------ | ---------------- |
| **NASA POWER** | *"The data was obtained from National Aeronautics and Space Administration (NASA) Langley Research Center's Prediction Of Worldwide Energy Resources (POWER) project funded through the NASA Earth Science Division."* + *"The data was obtained from the POWER Project's Hourly 2.x.x version on YYYY/MM/DD."* |
| **Landsat** | *"Landsat data courtesy of the U.S. Geological Survey"* |
| **MODIS** | LP DAAC "Citing Our Data" page + DOI `10.5067/MODIS/MOD13Q1.061` |
| **SMAP** | O'Neill et al. + DOI `10.5067/M20OXIZHY3RJ` |
| **IMERG** | Huffman et al. + DOI `10.5067/GPM/IMERG/3B-HH/07` |
| **Sentinel-2** | *"Contains modified Copernicus Sentinel data 2026, processed by …"* |
| **SoilGrids** | *"SoilGrids 2.0, ISRIC World Soil Information, CC BY 4.0"* + licence link + access date + note any unit conversion |
| **Open-Meteo** | *"Data provided by Open-Meteo"* + licence link |
| **CHIRPS** | *"CHIRPS v3, Climate Hazards Center (UCSB), DOI 10.15780/G2JQ0P"* + access date |
| **FAOSTAT** | *"Source: FAO, FAOSTAT (2026). Licence: CC-BY-4.0."* |
| **Overture Maps** | *"Overture Maps Foundation, overturemaps.org"* |
| **AppEEARS** | Cite software + data products (auto-generated README) |
| **Sacks crop calendar** | *"Sacks, W.J., Deryng, D., Foley, J.A. & Ramankutty, N. (2010). Crop planting dates: an analysis of global patterns. Global Ecology and Biogeography 19:607–620."* + email wsacks@gmail.com |

**[Proposed]** Build an in-product **"About / Data sources"** panel that lists
each source with its licence and attribution. It is cheap (one component plus
one table), it discharges the attribution obligations, and it doubles as a
demonstrable feature for judges.

---

## 11. Open questions before building

| # | Question                                                                    | Where to check                                    | Blocking? |
| - | --------------------------------------------------------------------------- | ------------------------------------------------- | --------- |
| 1 | Does the SoilGrids REST API work reliably enough, or must we pre-bake from `files.isric.org`? | Re-test the 5-point Kano grid hourly for a day | **YES: highest risk** |
| 2 | Will the GEE noncommercial questionnaire accept a hackathon team intending a product? | <https://console.cloud.google.com/earth-engine/configuration> | **YES: do at hour 0** |
| 3 | Is Open-Meteo's Historical Weather endpoint actually free, or Professional-only? | open-meteo.com/en/pricing + a live call | No, forecast suffices |
| 4 | Correct WCS `subset=` syntax for small AOIs? | ISRIC WCS examples, `soilDB` source | No, if pre-baking |
| 5 | Exact CHIRPS v3 NetCDF file naming on `data.chc.ucsb.edu` | data.chc.ucsb.edu/products/CHIRPS/v3.0/ | No |
| 6 | Is the NiMet free API back up? | api.nimet.gov.ng | No |
| 7 | SoilGrids in GEE: the community dataset asset ID | docs.isric.org SoilGrids access page | No, alternative exists |
| 8 | AppEEARS API base URL | AppEEARS API Documentation | No |
| 9 | IIASA / GCPE crop calendars: public, citable URLs? | IIASA / GCPE portals | No, Sacks + MIRCA suffice |
| 10 | Does the Sacks crop calendar have usable coverage over Kano State? | Download the netCDF, check `plant.start` at 12 °N / 8.5 °E | No |
| 11 | Do ECOSTRESS, GRACE/GRACE-FO and SRTM (named in the Field Shift challenge) add value, and are they accessible? | NASA Earthdata catalogue | **Medium**: challenge-named datasets may be expected |
