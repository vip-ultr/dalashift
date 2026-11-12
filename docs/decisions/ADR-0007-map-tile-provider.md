# ADR-0007 — Map Tile Provider Strategy

| Field    | Value                                                             |
| -------- | ----------------------------------------------------------------- |
| Status   | **Proposed — awaiting team decision**                            |
| Date     | 2026-11-13                                                       |
| Deciders | Team                                                             |
| Related  | `docs/api/map-tile-providers.md`, `ARCHITECTURE.md` § 3.4        |

---

## Context

DalaShift needs a basemap for two jobs:

1. **Farm selection** — the farmer finds and draws their land.
2. **Context** — the farmer sees their field against imagery, and (crucially)
   sees the **grid cell** of any coarse environmental value drawn over it.

The brief is explicit that OpenStreetMap's public tile servers should not be
assumed suitable for production use. They are operated under a
[Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
that prohibits bulk downloading and heavy use, and depends on a donation-funded
service. Depending on them for a public demo risks both a policy breach and a
rate limit at exactly the wrong moment.

**[Confirmed]** MapLibre GL JS is the chosen mapping library.

**[Open]** The specific provider is a team decision, and it must be settled
before the demo — a blank grey map during judging is an avoidable loss.

---

## Options considered

### Option A — OpenStreetMap public tile servers (`tile.openstreetmap.org`)

- **Advantages:** Zero setup. No key. No cost.
- **Disadvantages:** **The policy explicitly prohibits the use we would be
  making** — a public application serving an unbounded number of users is
  "heavy use". Also no SLA, and an unpredictable block during the demo.
- **Risks:** Policy breach; rate limiting at the worst moment.
- **Verdict:** Development only. **Not for the demo.**

### Option B — OpenFreeMap

- **Advantages:** Free vector tiles, **no API key, no rate limit**, no
  signup. Multiple styles. Openly licensed.
- **Disadvantages:** A public instance is a shared resource; no SLA. Style
  choice is limited to what they publish.
- **Risks:** Instance availability. Low.
- **Verdict:** **Recommended MVP default.**

### Option C — Protomaps, self-hosted

- **Advantages:** Fully under our control. Static PMTiles on a CDN have no
  per-request quota. Openly licensed. Vector tiles at any zoom.
- **Disadvantages:** Requires a build and hosting step. Adds deployment
  complexity to a 48-hour build.
- **Risks:** Time. Moderate.
- **Verdict:** **Recommended fallback**, and the right long-term answer.

### Option D — A keyed provider (MapTiler, Stadia, CARTO)

- **Advantages:** High-quality, well-documented styles. Satellite imagery
  available. Reliable SLAs on paid tiers.
- **Disadvantages:** Requires an API key (another secret to manage). Free
  tiers have quotas. Usage terms restrict commercial use on some plans.
- **Risks:** Key misconfiguration; quota exhaustion; terms restricting the
  commercial path later.
- **Verdict:** **Good quality, but the key and quota are unnecessary friction
  for a 48-hour build.**

### Option E — Esri World Imagery as the satellite layer

- **Advantages:** The best-known satellite imagery, no key needed for the
  standard endpoint, correct attribution available. Very legible for a farm
  product.
- **Disadvantages:** Esri's terms restrict some commercial uses. Standard
  resolution (~15 m) is coarser than Sentinel-2.
- **Risks:** Terms. Low for non-commercial hackathon use.
- **Verdict:** **Recommended as the satellite layer**, subject to a terms
  check.

### Option F — NASA GIBS as a NASA-imagery layer

- **Advantages:** It is **NASA's own** imagery tile service, free and
  unauthenticated. Directly strengthens the NASA-data requirement and the
  challenge's Relevance criterion.
- **Disadvantages:** MODIS resolution is coarse (~250 m–1 km) compared with
  Esri. It is a research-and-education product, not a consumer basemap.
- **Risks:** Availability. Low.
- **Verdict:** **Recommended as an additional layer**, not as the base map.

---

## Decision

**Proposed, pending team approval:**

### The layer stack

| Layer            | Provider              | Key needed | Fallback                     |
| ---------------- | --------------------- | ---------- | ---------------------------- |
| **Base**         | OpenFreeMap           | No         | Self-hosted Protomaps        |
| **Satellite**    | Esri World Imagery    | No         | Sentinel-2 Cloudless (EOX)   |
| **NASA imagery**| NASA GIBS             | No         | Hide the layer               |
| **Farm polygon** | DalaShift (rendered)  | —          | Always available             |
| **Grid cell**    | DalaShift (rendered)  | —          | Always available             |

### The architectural rules

1. **The basemap style is runtime configuration**, not hardcoded:
   `NEXT_PUBLIC_MAP_STYLE_URL`. Switching providers is a configuration
   change, not a code change.
2. **Tiles are fetched directly from the provider by the browser.** They are
   never proxied through our server — that would burn Vercel bandwidth and
   create a self-inflicted rate limit.
3. **Attribution is rendered from a single source of truth**, so a provider
   change cannot leave a stale or missing credit. This is a licence
   obligation, not a nicety.
4. **The satellite and NASA layers are optional at runtime.** If a tile host
   is unreachable, the base layer still works and the farm polygon is still
   drawn.
5. **The farm polygon and the grid-cell overlay are ours, not the provider's.**
   They must render regardless of the imagery underneath.
6. **Geocoding is optional and off the critical path.** Pan-and-draw must work
   with no geocoder at all.

### The grid-cell overlay — the signature decision

**[Proposed]** When a coarse environmental value is displayed (SMAP 9 km,
POWER 55 km, IMERG 11 km), the map draws the **source grid cell boundary**
over the farm, with a caption naming its size.

*This is the single most effective honesty device in the product.* The visual
proportion — a 9 km square around a 1.4 ha field — communicates the resolution
limit better than any sentence. It is a design decision with a technical
consequence, and it should be treated as a core feature, not a decoration.

---

## Reasoning

The decision criteria for a 48-hour hackathon are, in order:

1. **It will not fail during the pitch.** A provider that rate-limits or
   blocks is a catastrophe at exactly the wrong moment. This eliminates
   Option A and strongly disfavours keyed free tiers.
2. **No account setup or key management.** This eliminates Option D for the
   MVP.
3. **It works from Nigeria.** Latency to a European CDN may be poor; the demo
   must be verified on the venue's connection.
4. **The attribution is correct.** A licence obligation.

OpenFreeMap wins on 1 and 2 — no key, no quota, no account — which is why it
is the recommended default. Protomaps self-hosted is the same benefit with
more control, at the cost of a build step, and is the fallback if the public
instance is slow from Kano.

Esri and NASA GIBS are layers rather than base maps because they add
information rather than structure, and both are free and unauthenticated.

The grid-cell overlay sits in this ADR rather than the design document because
it has a real technical dependency: the `grid_cells` table must store the
geometry of every cell we reference, and the map feature must be able to
fetch and render it. That is a schema and API requirement.

---

## Consequences

### Positive

- The demo cannot fail because of a tile rate limit.
- No API key to misconfigure or leak.
- The NASA layer strengthens the NASA-data requirement and the Relevance
  judging criterion.
- The grid-cell overlay makes the resolution limitation visible, which is the
  product's core differentiator.
- Switching providers is a configuration change.

### Negative / accepted costs

- Two providers (OpenFreeMap + Esri) means two attribution strings and two
  failure modes to handle.
- OpenFreeMap has no SLA.
- The grid-cell overlay requires the `grid_cells` table to be populated
  before the map can draw it — an ordering dependency in Phase 2.
- Esri's terms warrant a check before any commercial use.

### Follow-up work

- [ ] Team decision on the provider stack.
- [ ] Verify tile latency from the Kano venue for each shortlisted provider.
- [ ] Implement the attribution registry and the `MapAttribution` component.
- [ ] Populate `grid_cells` and implement the cell overlay.
- [ ] Check Esri's and OpenFreeMap's terms for the intended use.
- [ ] Build the Protomaps fallback **if time permits** — it is the safety net.
- [ ] Confirm the NASA GIBS WMTS endpoint and layer list.

### Revisit when

- The product is used commercially, at which point a paid provider with an
  SLA may be worth it.
- The product needs offline tiles, which requires self-hosting regardless.
