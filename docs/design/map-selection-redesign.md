# Map Selection and Field Capture Redesign

**Status:** Proposed design, ready for implementation.

**Owner:** DalaShift team. **Date:** 2026-11-18.

**Companions:** `redesign-brief.md` sections 4.0, 7 and 10; `../decisions/ADR-0013-interface-language.md`.

---

## 1. Why this document exists

The team compared three screenshots: DalaShift on desktop, DalaShift on mobile, and OneSoil's map. The difference is not subtle.

| | DalaShift today | OneSoil |
| -- | --------------- | ------- |
| Map area | A small rectangle inside a white card, with a large white instruction card covering the centre and a big four-button toolbar covering the bottom | Near full-bleed satellite imagery; UI floats as small translucent pills |
| Controls | Solid white panels, large icons, large labels | Compact dark translucent pills, small icons, minimal labels |
| On a phone | The instruction card and toolbar cover most of the map; text wraps and the map is hard to read | The map stays dominant; controls sit at the edges |
| Field display | Selected-field styling is decorative | A clear white polygon outline with visible corner dots and a live measurement |

The user's direction is explicit: make the map the experience, shrink the controls, make the white translucent, and make field selection easy on every device. This document specifies how.

---

## 2. Research conclusions (accessed 2026-11-18)

### 2.1 We do not need Mapbox

OneSoil uses Mapbox, but the look is a design pattern, not an engine feature. MapLibre GL JS 6.18 already in this repo can deliver all of it.

- MapLibre supports custom markers, controls, 3D terrain, data-driven styling and WebGL layers. Drawing is provided by terra-draw 1.39, which we already integrate through a custom adapter.
- Mapbox GL JS requires an access token and bills map loads (50,000 free per month, then about $5 per 1,000) and geocoding. MapLibre has no token, no metering and no bill.
- Mapbox-only features (lights, shadows, model layers, raster particles) are irrelevant to a 2D farm selector.
- Bundle sizes are now comparable (roughly 300 KB gzip each), so size is not a deciding factor.

**Decision:** keep MapLibre GL JS with Esri World Imagery raster tiles. Do not add a Mapbox dependency or token. Sources: [MapLibre](https://maplibre.org/projects/gl-js/), [MapLibre from Mapbox comparison](https://makewithmaplibre.com/from-mapbox/), [Mapbox pricing](https://www.mapbox.com/pricing).

### 2.2 Search should be Kano-first and offline-capable

Do not depend on a public geocoder as the only search.

- Nominatim's public server allows at most 1 request per second application-wide, forbids client-side autocomplete, and may withdraw access. It supports `viewbox`, `bounded=1`, `countrycodes=ng` and `accept-language`, but is fragile as a production dependency.
- Photon supports autocomplete and `bbox` with no key, but gives no availability guarantee.
- Mapbox Geocoding supports a strict `bbox` and Hausa/English through `language`, but needs a token; permanent geocoding has no free tier, which matters because we store farm locations.
- A small bundled gazetteer of Kano's 44 LGAs and major towns, with Hausa and English aliases and centroid coordinates, works offline, instantly, with no cost or rate limit and full control over results.

**Decision:** build a two-layer search. Primary is a bundled static Kano gazetteer with local prefix and typo-tolerant matching, constrained to the Kano bounding box `7.693, 10.565, 9.339, 12.575`. Optional fallback is a server-proxied geocoder with the same hard bounding box, added later if coverage proves insufficient. Always offer "Use my current location". Sources: [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/), [Photon](https://photon.komoot.io/), [Mapbox Geocoding](https://docs.mapbox.com/api/search/geocoding/), [Kano State profile](https://acresal.gov.ng/states/kano/).

### 2.3 Attribution is mandatory

- Esri World Imagery currently reports: "Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community". Esri requires "Powered by Esri" to be displayed, clearly visible and not covered by other UI, when using its technology through a third-party library such as MapLibre.
- OpenStreetMap requires "© OpenStreetMap contributors" linked to `https://www.openstreetmap.org/copyright` where OSM data or results appear.

Both belong in a small bottom-right attribution control that stays discoverable. Sources: [Esri attribution](https://developers.arcgis.com/documentation/esri-and-data-attribution/interactive-maps/), [World Imagery metadata](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer?f=pjson), [OSMF attribution guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines).

### 2.4 Mobile map patterns

- Map runs edge to edge; controls float on top and should not cover more than about 40 percent of the map at rest.
- High-contrast translucent pills over imagery, not solid white cards.
- Touch targets at least 44 by 44 px; larger drawn shapes need larger hit areas.
- Bottom sheets with a peek and half state for field detail, so the polygon stays visible.
- Selected state shown by size and colour, not a subtle outline.
- Tap to add a point, drag to refine, tap the first point or a Done control to close, then name and save.

Sources: [Map UI Patterns](https://mapuipatterns.com/mobile-map/), [NN/g bottom sheets](https://www.nngroup.com/articles/bottom-sheet/), [mobile map UI patterns](https://www.mobileappdesign.io/blog/map-ui-design).

---

## 3. Target design

### 3.1 Structure

The map becomes a full-bleed canvas. Every control is a floating overlay with a translucent ink or white surface, small icons and minimal labels.

```
+----------------------------------------------------------+
| [Field 2 v] pill              [Search Kano...] [Layers]  |  top edge
|                                                          |
|                                                          |
|                    satellite imagery                     |
|                    field polygon in white                |
|                    vertex dots                           |
|                                             [ + ]         |
|                                             [ - ]         |  right edge
|                                             [locate]      |
|                                                          |
|            [Area: 2.4 ha | Perimeter: 640 m]              |  bottom centre, drawing only
|                                     [i] Esri, OSM         |  bottom right
+----------------------------------------------------------+
```

### 3.2 Overlay specification

| Overlay | Position | Appearance | Behaviour |
| ------- | -------- | ---------- | --------- |
| Field selector | Top left | Translucent white `bg-surface-card/85`, hairline border, `backdrop-blur`, text 14px, chevron; max width 60 percent on mobile | Opens a sheet of the farm's fields; choosing one flies the camera to it |
| Search | Top right | Translucent white pill, `bg-surface-card/85`, small search icon, placeholder "Search Kano" | Opens the location search sheet; hidden when there is no room on very small screens, replaced by an icon |
| Layers | Top right, beside search | Small translucent pill with a layers icon | Opens the Layers sheet (satellite/streets, data layer, footprint) |
| Zoom and locate | Right edge, vertically stacked | Circular translucent buttons, 44 px hit area, 20 px icon, 6 px gap | Zoom in, zoom out, go to my location |
| Status card | Top centre, only while drawing or capturing | One short line, translucent ink `bg-[#111827]/80`, white 14px text, small Done and Cancel text buttons | "Tap each corner, then press Done" |
| Measurement chip | Bottom centre, only while drawing | Translucent ink pill, white 14px tabular text | Live area in hectares and perimeter in metres |
| Attribution | Bottom right | Compact pill, 12px, `bg-white/65`, Esri string and OSM link | Never covered by another control |
| Field detail | Bottom sheet | Translucent white sheet, rounded top, drag handle | Field name, area, crop summary, "Set as active", "Close"; keeps polygon visible |

Rules:

- No large solid white instruction card over the map.
- No wide four-button toolbar across the bottom. Primary actions move to small pills; the only bottom-centre element is the live measurement chip while drawing.
- Icons are at most 20 px in the map; labels appear only on the field selector, search and status line.
- Every control has `touch-action: manipulation` and a 44 px hit area, while the painted icon stays small.
- Translucent surfaces use the existing surface tokens at 80 to 85 percent opacity; no new colours, no blue, no bright green.
- Reduced motion: camera moves are instant, no pulses.

### 3.3 Drawing and selection

- Default mode is Select. Tapping a field selects it, flies the camera to it and opens the peek sheet.
- Draw mode uses the existing Terra Draw polygon mode. Points are added by tapping, shown as white dots with a small dark ring. The polygon is a 3 px white outline with a translucent green fill.
- Done closes the polygon programmatically through the existing synthetic-click path; Undo removes the last point; Clear starts over. All three are small controls in the top status card, not a bottom toolbar.
- The measurement chip updates on every `change` event using turf area and length, and disappears when the shape is finished.
- Location mode drops a pin with a large white halo and an accuracy circle. "How sure are you?" uses Small, Medium and Large, mapped to 50, 250 and 1,000 metres.
- Tap-to-select is disabled while drawing so a stray tap cannot change the active field.
- Overlapping fields show a small chooser instead of silently selecting the first.

---

## 4. Implementation plan

### Phase A: foundation (no visual change yet)

1. Extract map overlay pieces into small components in `apps/web/src/components/maps/`: `MapFieldPill`, `MapSearchPill`, `MapControlStack`, `MapMeasurementChip`, `MapStatusCard`, `MapFieldSheet`, `MapAttribution`. Keep `HonestyMapCanvas` as the orchestrator.
2. Add the Kano gazetteer at `data/kano-places.json` or `packages/shared/geo/kano-places.ts`: 44 LGAs plus major towns, with English and Hausa names and centroid coordinates. Add a pure `searchKanoPlaces(query)` helper with prefix matching and simple typo tolerance, tested with Vitest.
3. Add a `useMapSelection` hook if state grows; otherwise keep mode and active field in the canvas.

### Phase B: map chrome (the visible redesign)

4. Rewrite the overlay markup in `honesty-map-canvas.tsx` to the structure and tokens in section 3.2. Remove the current large instruction card and bottom toolbar markup; keep their callbacks in the new small controls.
5. Keep the existing map lifecycle fix, tile `maxzoom`, attribution and quiet tile-error handling.
6. Add the measurement chip driven by the existing `change` event and turf helpers.
7. Add the field detail sheet with peek and half states; keep the polygon visible above it.

### Phase C: search and location

8. Wire the search pill to `searchKanoPlaces`. Results show name plus "Kano" qualifier and fly the camera to the centroid. Add a clear "Use my current location" action.
9. Add the optional server proxy later, only if gazetteer coverage is insufficient. Keep it behind an environment flag and with the hard Kano bounding box. Never expose a geocoding token to the browser.

### Phase D: verification

10. Capture screenshots at 390, 768 and 1440 px for Select, Draw and Location modes and compare against the target layout.
11. Run a real-user session with at least five farmers and one extension worker: find your farm, select the right field, draw a boundary, correct it, and save. Record time and failure points.
12. Run `pnpm check`, both validators, the test suite and a production build.

---

## 5. Acceptance criteria

- The map occupies at least 70 percent of the available viewport at 390 px in all modes.
- No single overlay covers more than 40 percent of the map at rest.
- All interactive controls have a 44 px hit area; visible map icons are at most 20 px.
- Every field can be selected by tapping it on the map or in the field pill.
- A farmer can draw, undo, clear and finish a polygon on a touch device without a keyboard.
- Area and perimeter are visible while drawing and match PostGIS area within the stated coarse-resolution caveat.
- Search finds any of Kano's 44 LGAs offline; results cannot leave the Kano bounding box.
- Esri and OSM attribution are visible and not covered by controls.
- Screenshots at 390, 768 and 1440 px are attached to the implementation pull request.

---

## 6. Out of scope

- Mapbox migration, vector basemaps and 3D terrain.
- Search beyond Kano State.
- Street-address geocoding; smallholder farms rarely have addresses.
- Redesign of the wizard outside the map surface; that was covered by the creation-flow fix.

---

## 7. Open questions

1. Should the field detail sheet open on first selection, or only after a second tap on the selected field?
2. Should the accuracy choice (Small, Medium, Large) also apply to drawn polygons, or only GPS pins?
3. What Hausa terms should the search gazetteer include for each LGA beyond the common English spellings?
