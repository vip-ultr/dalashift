# Map Tile Providers: Research and Options

**Verification date: 2026-11-13.** This document informs
[`ADR-0007`](../decisions/ADR-0007-map-tile-provider.md).

---

## 1. What we need from a basemap

| Need                        | Why                                                            |
| --------------------------- | -------------------------------------------------------------- |
| A MapLibre-compatible style | We use MapLibre GL JS, not Mapbox GL JS.                         |
| Adequate zoom coverage      | A farmer should be able to zoom to their field boundary.        |
| Attribution compliance      | It must be renderable in-product with the correct credit.       |
| A usage policy that permits a public demo | **The demo may be shown to judges and to farmers.** |
| No surprise cost or rate limit during a live pitch | A blocked tile server mid-demo is a disaster. |
| Work in Nigeria             | Tile CDNs with poor West African coverage are a practical risk. |

**Note on OpenStreetMap's public tile servers.** The brief is right to warn
about this. `tile.openstreetmap.org` operates under the
[OpenStreetMap Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/),
which requires a valid HTTP `Referer` or `User-Agent` identifying the
application, prohibits bulk downloading and offline use, and prohibits
"heavy use" such as a project that generates a large number of tiles. It is
fine for light development use. **It is not a production basemap for a public
application**, and depending on it for the demo risks both a policy breach and
a rate limit at exactly the wrong moment.

---

## 2. Candidate providers

**[Proposed]** The map style is a runtime configuration
(`NEXT_PUBLIC_MAP_STYLE_URL`), not hardcoded, so the provider can be changed
without a code change or a redeploy.

### 2.1 OpenFreeMap

| Aspect         | Detail                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| Type           | Free vector tiles, no API key, no rate limit                                                    |
| Licence        | Open source (the tiles are built from OpenMapTiles data, itself ODbL)                        |
| Hosting        | Public instance at `https://tiles.openfreemap.org` (or self-host)                             |
| Styles         | `https://tiles.openfreemap.org/styles/bright`, `/liberty`, `/positron`                       |
| Attribution    | Required: *"© OpenMapTiles © OpenStreetMap contributors"*                                    |
| Fit            | **Excellent default.** No key, no signup, no quota, no rate limit to trip during a pitch.     |

**[Proposed]** This is the recommended MVP default. The absence of a
rate limit removes a whole class of demo-day failure.

### 2.2 Protomaps

| Aspect         | Detail                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| Type           | Self-hostable vector tiles; hosted demo instances available                                   |
| Licence        | Open source; tile data derived from OpenMapTiles/Natural Earth (ODbL / public domain)          |
| Hosting        | `https://demo.protomaps.com` for evaluation; self-host via static files or PMTiles           |
| Attribution    | Required                                                                                      |
| Fit            | Strong if we want a basemap we fully control. Static hosting on a CDN has no per-request quota. |

**[Proposed]** The fallback if the public OpenFreeMap instance is slow from
Kano (self-hosted PMTiles served from a CDN we control, or from a static
host).

### 2.3 Stadia Maps

| Aspect         | Detail                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| Type           | Raster and vector tiles; hosted basemaps (Alidade Smooth, Alidade Satellite, Stamen Terrain)  |
| Licence        | Free tier for non-commercial and development use; commercial use requires a paid plan         |
| Authentication | **API key required**: `NEXT_PUBLIC_MAP_STYLE_URL`                                            |
| Attribution    | Required                                                                                      |
| Rate limits    | Free tier has a monthly tile quota                                                          |
| Fit            | Good quality; the API key is the friction                                                    |

### 2.4 MapTiler

| Aspect         | Detail                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| Type           | Vector and raster tiles, many styles; satellite and terrain                                   |
| Licence        | Free tier with a monthly tile quota; commercial use requires a plan                          |
| Authentication | **API key required**                                                                          |
| Attribution    | Required, including a link back for some plans                                               |
| Rate limits    | Free tier: ~50,000 tiles/month (verify the current figure)                                   |
| Fit            | Good, and the satellite imagery is attractive for a farm product                              |

### 2.5 CARTO Basemaps

| Aspect         | Detail                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| Type           | Vector raster tiles (Positron, Voyager, Dark Matter)                                         |
| Licence        | Free for non-commercial use with attribution; commercial use requires a paid plan            |
| Authentication | Optional for light use; a key is needed for commercial terms                                 |
| Attribution    | Required                                                                                      |
| Fit            | Reasonable. Style is pleasant and neutral: fits our "professional, not decorative" direction |

### 2.6 Esri World Imagery

| Aspect         | Detail                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| Type           | Satellite imagery raster tiles                                                              |
| Licence        | Free for non-commercial use through Esri's basemap service, with attribution. Commercial use has conditions. |
| Authentication | None for the standard tile endpoint, but Esri's terms are explicit about acceptable use      |
| Attribution    | Required                                                                                      |
| Fit            | **The best-looking satellite option for a farm product.** Pairs well with an agricultural narrative. |

**[Proposed]** Use Esri World Imagery as the **satellite layer toggle** over a
neutral vector basemap. A farmer's own field against a satellite image is
immediately legible; against a street map it is not.

### 2.7 Sentinel-2 Cloudless (EOX)

| Aspect         | Detail                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| Type           | Cloudless Sentinel-2 mosaic tiles: **10 m, far better than Esri's imagery for crop fields**    |
| Licence        | Free for non-commercial use; the underlying data is Copernicus Sentinel (see the Sentinel terms) |
| Attribution    | Required: Copernicus Sentinel data, EOX, and the applicable processing statement             |
| Fit            | **Technically the best fit for a farm product**: 10 m true-colour, cloudless, refreshed regularly |

**[Proposed]** Worth evaluating against Esri for the satellite layer, because
10 m resolves smallholdings far better than 15 m Esri imagery. **[Open]** The
exact tiling endpoint and current usage terms should be confirmed before
relying on it.

### 2.8 NASA GIBS: Global Imagery Browse Services

| Aspect         | Detail                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| Type           | **NASA's own** imagery tile service: MODIS, VIIRS, and derived products, updated daily       |
| Licence        | NASA open data                                                                              |
| Authentication | None for the public WMTS endpoints                                                          |
| Attribution    | Required: cite the NASA product and the GIBS service                                        |
| Fit            | **Strategically valuable**: it is NASA data in the map. Using it strengthens the NASA-data requirement and the challenge's Relevance criterion. |

**[Proposed]** Use NASA GIBS as the **NASA layer** over the basemap: a
MODIS true-colour or vegetation-index tile. It directly supports the
"NASA data is integral to the project" claim that the challenge's Relevance
criterion rewards.

**[Open]** The exact WMTS endpoint template and the current layer list must be
confirmed from the GIBS documentation before implementation. The service
publishes a WMTS `GetCapabilities` document listing all layers; that is the
authoritative source.

### 2.9 Geocoding and place search

The brief requires a farmer to "search for their farm location". Two options:

| Option                | Notes                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------- |
| **Nominatim** (OpenStreetMap) | Free, no key, but a strict usage policy: max 1 request/second, must identify the application, no heavy use. |
| **Provider geocoder** (MapTiler, Stadia, Photon, Geoapify) | Usually needs a key; higher quality and better coverage in Nigeria. |

**[Proposed]** Make geocoding **optional and non-blocking**. The primary flow
must be **pan and draw**, which works with no geocoder at all. This removes a
failure mode and avoids a policy-sensitive dependency on the critical path.
A place-name search is an enhancement.

---

## 3. Comparison

| Provider            | Key needed | Cost      | Rate limit risk | Nigeria latency | Notes                              |
| ------------------- | ---------- | --------- | --------------- | --------------- | ---------------------------------- |
| **OpenFreeMap**     | No         | Free      | **None**        | Good            | **Recommended MVP default**        |
| Protomaps (self-host) | No       | Hosting cost | Low           | Under our control | Strong fallback; PMTiles from a CDN |
| NASA GIBS           | No         | Free      | Low            | Good            | NASA layer: high strategic value   |
| Esri World Imagery  | No*        | Free (non-commercial) | Medium | Good    | Satellite layer                    |
| Sentinel-2 Cloudless| No         | Free (non-commercial) | Medium | Good | Best 10 m imagery                 |
| Stadia Maps         | Yes        | Free tier | Medium         | Good            | Good quality; key friction         |
| MapTiler            | Yes        | Free tier | Medium         | Good            | Good quality; key friction         |
| CARTO Basemaps      | Optional   | Free (non-commercial) | Medium | Good | Pleasant, neutral styles          |
| **OSM public tiles**| No         | Free      | **High**       | Unknown        | **Do not use in production**        |
| Nominatim           | No         | Free      | High (1 req/s)  | Unknown        | Optional; policy-sensitive          |

\* Esri's terms, not a technical key requirement.

---

## 4. Recommendation

**[Proposed] A two-layer map:**

1. **Base layer:** OpenFreeMap (or self-hosted Protomaps) in a neutral style.
   No key, no quota, no demo-day rate limit.
2. **Satellite / NASA layer:** Esri World Imagery, plus NASA GIBS as the
   explicit NASA layer. Both are toggleable and both carry correct
   attribution.

**Architecture consequences:**

- `NEXT_PUBLIC_MAP_STYLE_URL` holds the MapLibre style JSON URL. Switching
  providers is a configuration change.
- Attribution is **rendered in the map corner from a single source of truth**
  (a `map-attribution` table or a constant in the map feature), so a provider
  change cannot leave a stale or missing credit.
- **The satellite layer is optional at runtime.** If the satellite tile host
  is unreachable, the base layer still works and the map still functions.
  Nothing in the core flow depends on imagery.
- The **farm polygon is always rendered above the basemap** in a high-contrast
  colour, so the farm is legible regardless of the imagery underneath.
- Tiles are fetched **directly from the provider by the browser**, never
  proxied through our server. Proxying would burn our Vercel bandwidth and
  create a self-inflicted rate limit.

**Fallback plan for the venue:** download the demo region's tiles in advance
or verify the basemap loads on the venue's connection before the pitch. A
blank grey map during judging is an avoidable loss.

---

## 5. Attribution obligations to implement

| Provider            | Required credit                                                                    |
| ------------------- | ---------------------------------------------------------------------------------- |
| OpenFreeMap         | *"© OpenMapTiles © OpenStreetMap contributors"*                                      |
| Protomaps           | OpenMapTiles / Natural Earth attribution                                            |
| Esri World Imagery  | Esri attribution: *"Powered by Esri"* and the applicable source credit             |
| Sentinel-2 Cloudless| *"Contains modified Copernicus Sentinel data [year], processed by [processing]"*   |
| NASA GIBS           | The NASA product credit and the GIBS service                                         |
| CARTO               | *"© OpenStreetMap contributors © CARTO"*                                            |
| Stadia Maps         | Stadia Maps attribution and, for Stamen-derived styles, the Stamen credit         |
| MapTiler            | *"© MapTiler © OpenStreetMap contributors"*                                         |
| Nominatim           | *"© OpenStreetMap contributors"*                                                     |

**[Proposed]** Implement this as a single `MapAttribution` component reading
from a shared constant, so the credit list is correct by construction and
cannot drift from the provider actually in use.

---

## 6. Open items

| # | Item                                                                  | Resolve by                                    |
| - | --------------------------------------------------------------------- | --------------------------------------------- |
| 1 | Confirm the current NASA GIBS WMTS endpoint template and layer list   | Before implementing the NASA layer            |
| 2 | Confirm Sentinel-2 Cloudless (EOX) endpoint and current usage terms    | Before adopting it over Esri                  |
| 3 | Verify tile latency from the Kano venue for each shortlisted provider  | Before the pitch                              |
| 4 | Confirm the current free-tier quotas for Stadia, MapTiler and CARTO   | Before adopting a keyed provider              |
| 5 | Decide whether to add a geocoder, and under which policy              | Phase 3: not on the MVP critical path         |

---

## 7. Sources

| URL | Used for |
| --- | -------- |
| <https://operations.osmfoundation.org/policies/tiles/> | OSM Tile Usage Policy |
| <https://openfreemap.org/> | OpenFreeMap terms and styles |
| <https://protomaps.com/> | Protomaps licensing and self-hosting |
| <https://docs.stadiamaps.com/> | Stadia authentication and free-tier terms |
| <https://cloud.maptiler.com/account/keys/> | MapTiler key and quota |
| <https://github.com/CartoDB/CartoCSS> | CARTO basemap styles and attribution |
| <https://developers.arcgis.com/rest/services/reference/world-imagery-service/> | Esri World Imagery |
| <https://eox.atlassian.net/wiki/spaces/EOX/pages/25309423/Sentinel-2-Cloudless> | EOX Sentinel-2 Cloudless |
| <https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml> | NASA GIBS capabilities (verify) |
| <https://wiki.openstreetmap.org/wiki/Elements#Names_of_nominatim_features_-_names_of_searchable_place_names_etc | Nominatim usage policy |
