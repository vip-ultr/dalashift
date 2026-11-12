# NASA Datasets — Research Notes

**Verification date: 2026-11-13.**

This document is the *decision layer* over the factual source catalogue in
[`../api/data-sources.md`](../api/data-sources.md). Here we ask the question
the catalogue does not answer: **for a given agronomic question, which NASA
product should we use, and what will it not tell us?**

---

## 1. Which NASA product answers which farmer question?

| Farmer's question                          | Primary source                   | Resolution | What it cannot tell you                                    |
| ------------------------------------------- | -------------------------------- | ---------- | ------------------------------------------------------------ |
| "Is this season wetter or drier than usual?" | NASA POWER climatology vs. current | ~55 km | Anything about a specific field. It is a regional climate figure. |
| "Has it rained much lately?"                | NASA POWER daily `PRECTOTCORR`, or GPM IMERG via POWER `IMERG_PRECTOT` | 55 km / 11 km | Field-level rainfall. It will not tell you it rained on *your* plot. |
| "When did the rains actually start here?"   | POWER daily rainfall series, onset detection | 55 km | The onset of rain on your farm, as opposed to in the cell. |
| "Should I plant now, or wait?"               | POWER rainfall onset + crop calendar | 55 km + calendar | Local microclimate. A farmer who knows their own land knows better. |
| "Is the soil dry?"                           | NASA SMAP L3 enhanced (9 km) or POWER `GWETROOT` | 9 km / 55 km | **This is the weakest claim we can make.** It is a neighbourhood-scale wetness indicator. |
| "Is my crop developing normally?"            | NASA MODIS NDVI (250 m) / Landsat NDVI (30 m) / Sentinel-2 (10 m, via GEE) | 250 m → 10 m | Crop *type* without the farmer telling us. Species discrimination from NDVI alone is unreliable. |
| "Is it too hot for my crop?"                 | POWER `T2M_MAX` + `GDD*` + `CDD*` | 55 km | Heat at the leaf. Air temperature ≠ surface temperature ≠ canopy temperature. |
| "How much water is the crop using?"          | POWER `EVPTRNS` / `EVLAND` (evapotranspiration) | 55 km | Field-level water use. It is a regional energy-balance estimate. |
| "How deep is the soil?"                      | NASA SRTM elevation | 30 m | Soil depth. Elevation is a proxy for depth, not a measurement of it. |
| "Is the groundwater falling?"                | NASA GRACE / GRACE-FO | ~300 km | **Cannot be used for a single farm.** GRACE's cell is roughly the size of a province. It is a regional water-storage trend only. |
| "Is my field hotter than my neighbour's?"   | MODIS land surface temperature (1 km) | 1 km | Field-level differences at 1 km. Meaningful for a district, not a plot. |

---

## 2. The NASA Space Apps "Field Shift" dataset list

The challenge statement names these explicitly:

> *"SMAP, ECOSTRESS, GPM, Landsat, MODIS, NASA POWER, GRACE and GRACE-FO, and
> SRTM or other NASA elevation products."*

**[Proposed]** We should engage with **at least four** of them so that the
submission's "NASA Data" field is substantive, and so that the Relevance
judging criterion — *"NASA data is integral to the project's success"* — is
genuinely satisfied rather than asserted.

| Product              | Use it for                        | Effort | Priority        |
| -------------------- | --------------------------------- | ------ | --------------- |
| **NASA POWER**       | Rainfall, temperature, radiation, evapotranspiration, growing degree days, soil wetness, climatology | **Low** — no auth, one API | **1 — the backbone** |
| **GPM / IMERG**      | Precipitation, via POWER's `IMERG_PRECTOT` (no auth) | Low | **2** |
| **MODIS**            | Vegetation index (250 m) and land surface temperature (1 km) | Medium — Earthdata or GEE | **3** |
| **Landsat**          | 30 m surface reflectance → NDVI. **The farm-scale source.** | Medium — GEE | **4** |
| **SMAP**             | Soil moisture (9 km) — with honest labelling | Medium — Earthdata or GEE | **5** |
| **SRTM**             | Elevation for the farm and for POWER's `site-elevation` correction | Medium — AppEEARS | 6 |
| **ECOSTRESS**        | Evapotranspiration and crop water stress at 70 m — **genuinely farm-scale**, and named in the challenge | **High** — not yet investigated | **[Open]** |
| **GRACE / GRACE-FO** | Regional groundwater trends | High, and the resolution is ~300 km | **Probably not — but the challenge names it** |

---

## 3. ECOSTRESS — the most interesting unexplored option

**[Open] Not yet researched in depth. Flagged here because it may be the best
fit in the whole list.**

ECOSTRESS is NASA's **EcoSystem Spaceborne Thermal Radiometer Experiment on
Space Station**, launched 2018. It measures **evapotranspiration** — the water
plants actually transpire — at **70 m**, from the International Space Station.

**[Proposed] Why this may matter more than anything else in the list:**

- It is **70 m** — genuinely farm-scale, comparable to MODIS but much finer.
- It measures **crop water stress directly**, which is what a farmer in a dry
  spell actually needs to know. Soil moisture is a proxy; evapotranspiration
  is the thing itself.
- It is **named in the challenge statement.**
- It has a **diurnal cycle** — it overpasses at different local times across
  its orbit, which lets you see how a plant's behaviour changes through the
  day, and build a daily ET time series.

**[Proposed] The risks, which are the reason this is still an open question:**

- It is a **very different beast** to the gridded archive products. Access is
  through the LAADS DAAC (which was refusing to issue tokens when checked)
  and through GEE.
- Its revisit is **not a fixed 16-day cycle** — it follows the ISS orbit and
  the local overpass time shifts across the 16-day cycle. This is a real
  complexity in building a consistent time series.
- It only covers the ISS ground track, so coverage is a set of narrow swaths
  rather than a global grid. For a specific farm, whether a usable overpass
  exists at all is a question to answer before committing.

**[Open] Investigation task, if the team has a spare pair of hands:**
1. Confirm the current ECOSTRESS L2/L4 product IDs and their resolution.
2. Confirm GEE availability and the dataset ID.
3. Check whether usable overpasses exist over Kano in a 30-day window.
4. Assess whether the diurnal sampling can be turned into an ET daily series.

---

## 4. The traps, in order of how much damage they do

### 4.1 Fill values

POWER declares `fill_value: -999.0` in the response header. **A naive mean
over a daily series containing `-999` produces a number that is not just
wrong — it is wrong by a factor of several hundred.** This is the single most
likely implementation bug in the whole project.

```typescript
// WRONG
const mean = values.reduce((a, b) => a + b, 0) / values.length;

// RIGHT
const valid = values.filter((v) => v !== -999 && Number.isFinite(v));
const coverageFraction = valid.length / values.length;
const mean = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
```

The coverage fraction must be stored alongside the value. That is why
`coverage_fraction` is a column on `environmental_observations`.

### 4.2 POWER's time standard

POWER defaults to **LST (Local Solar Time)**. IMERG is produced on **UTC**
only. Requesting `IMERG_PRECTOT` without `time-standard=UTC` returns `-999`
plus a message. **The fill-value trap and the time-standard trap compound.**

### 4.3 The POWER regional endpoint minimum bbox

A regional request over a box smaller than 2° × 2° returns **HTTP 422**.
Kano spans about 2° of longitude, so **the regional endpoint is unusable for
our validation area.** Use the point endpoint per farm — and cache per grid
cell.

### 4.4 SoilGrids mapped units

Values come back as integers in *mapped units*, with a `d_factor`:

| Property | Raw value | d_factor | Correct value |
| -------- | --------- | -------- | ------------- |
| `phh2o`   | 67        | 10       | **6.7 pH**    |
| `clay`    | 137       | 100      | **13.7 %**    |
| `soc`     | 79        | 10       | **7.9 g/kg**  |

Missing this is a **10× error**. The `soilDB` R package does it correctly and
is the reference implementation.

### 4.5 MODIS NDVI quality flags

`SummaryQA` bits 0–1: `0` good, `1` marginal, `2` snow/ice, `3` cloudy.
**Averaging raw NDVI without filtering on QA mixes cloud values into the
mean.** NDVI is already masked for clouds, water, heavy aerosol and cloud
shadows — so masked pixels are "no data", never zero.

### 4.6 Landsat band indices are not stable across sensors

Landsat 9 has no band 8; NIR is `SR_B5`. For Landsat 7, the equivalents are
`SR_B4` (NIR) and `SR_B3` (red). **Do not hard-code band indices.** Look up
the band mapping by sensor.

### 4.7 MODIS land surface temperature is not air temperature

MOD11 LST is a **surface** temperature. POWER `T2M` is an **air** temperature.
They differ by several °C in the afternoon. Presenting them in the same chart
without saying which is which would be a serious misrepresentation.

### 4.8 The POWER archive mutates

> *"the 2–3 months after the current date… become available and are used to
> supersede the quick look meteorological data products."*

**Do not cache the last 90 days of daily values as if final.** Refresh them on
a rolling basis; freeze anything older.

### 4.9 Mixing IMERG runs

Early (4 h), Late (12–14 h) and Final (3.5 months) are **different products**.
Never mix them in one time series. Store the run identifier.

### 4.10 SMAP's 9 km grid is a posting grid

The native radiometer footprint is ~33 km. The 9 km grid is an interpolation of
antenna temperatures. **9 km is the posting resolution, not the true
resolution.** There is no "36 km enhanced" product — it is enhanced 9 km or
standard 36 km.

### 4.11 Landsat surface temperature has systematic gaps

It depends on the ASTER GED emissivity climatology (2000–2008, clear-sky
only), and the missing pixels are **consistent through time, 1982–present**.
**Do not build a trend on `ST_B10`.**

### 4.12 The NASA CMR `limit` parameter

`limit` is **not** a valid CMR parameter (HTTP 400 *"Parameter [limit] was not
recognized"*). Use **`page_size`**.

---

## 5. What is actually farm-scale, honestly stated

| Product        | Resolution | Farm-scale for a 1.4 ha field?                       |
| -------------- | ---------- | ----------------------------------------------------- |
| Sentinel-2 (GEE) | 10 m     | **Yes** — ~14 pixels across                            |
| Landsat C2 L2  | 30 m      | **Yes** — ~5 pixels across, ~150 in area              |
| ECOSTRESS     | 70 m      | **Yes** — ~2 pixels across                             |
| MODIS MOD13Q1 | 250 m     | No — the farm is 0.2% of one pixel                    |
| SoilGrids     | 250 m     | No — the farm is 0.2% of one cell                     |
| CHIRPS        | 5.5 km    | No — 0.005%                                           |
| SMAP L3       | 9 km      | No — 0.002%                                           |
| GPM IMERG     | 11 km     | No — 0.001%                                           |
| NASA POWER    | 55 km     | No — 0.00005%                                         |

**[Proposed]** Three sources genuinely resolve a farm: Sentinel-2, Landsat and
ECOSTRESS. Two of the three require Google Earth Engine, and ECOSTRESS
requires investigation. **This is the strongest argument for getting GEE
working** — and also the strongest argument for the resolution-honest framing,
because the farm-scale sources answer only the *vegetation and water-stress*
questions, not the rainfall or soil questions.

---

## 6. Sources

- [`../api/data-sources.md`](../api/data-sources.md) — the full factual
  catalogue with URLs, verification dates and live-verified behaviour.
- [`../api/data-retrieval-strategy.md`](../api/data-retrieval-strategy.md) —
  how we call, cache and fail over.
- [`../hackathon/README.md`](../hackathon/README.md) — the challenge statement
  that names the NASA datasets.
