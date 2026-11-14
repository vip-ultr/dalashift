# ADR-0011: Product Direction After the Field Interviews

| Field    | Value                                                             |
| -------- | ----------------------------------------------------------------- |
| Status   | Accepted                                                        |
| Date     | 2026-11-14                                                      |
| Deciders | Team                                                            |
| Related  | `ADR-0004` (rules engine, **partially superseded**), `ADR-0005` (geospatial, **partially superseded**), `ADR-0006`, `docs/decisions/OPEN-DECISIONS.md`, `docs/research/field-interviews/` |

---

## Context

Phase 1 produced a research, architecture and documentation foundation, and
then the team interviewed **three farmers in Doka village, Tofa LGA, Kano
State**. A separate architecture review challenged parts of the design. The
evidence from the interviews and the points from the review together required
a set of product decisions.

All fifteen decisions are recorded in
[`OPEN-DECISIONS.md`](./OPEN-DECISIONS.md), with the evidence and the
options. This ADR records the ones that change the architecture. The
remainder (licence, visibility, consent, data mode, aliases) are recorded
where they belong and do not need an ADR.

**The three case studies that drove this:**

| Farmer | Farm | Rotation | Planting rule |
| ------ | ---- | -------- | ------------- |
| Bello Yusuf Maitama | 2 to 4 ha, not contiguous | Strip cropping, rotation not established | **Waits** for soil moisture |
| Amina Habibu | About 4 ha, ridge-based strip plans | Explicit, learned from University training | **Plants immediately** on the first rains |
| Abubakar (Dan Hajiya) | About 30 ha owned, 3 ha plots | Explicit, two-to-three-year cycle | **Plants quickly** once the soil has good moisture |

All three describe the same physical situation: the rains start, then dry
spells follow. All three respond to it differently, and each response is
coherent.

---

## Decisions

### 1. Both the farmer and the adviser are users

The tool is not adviser-only. Farmers use it themselves, and advisers and
extension officers use it on farmers' behalf.

**Evidence.** All three farmers describe the extension officer as the hub of
adoption: Amina directs visitors to *"the agricultural extension officer
(malamin gona)"*, and Abubakar describes the chain from University to
extension experts to village heads, mosque leaders and association leaders.
But each of them also says they will use it themselves: *"We are ready and
waiting for whatever you bring."*

**Consequence.** Both surfaces are built. The adviser view and the farmer view
are the same data with different emphasis, not two products.

### 2. The extension officer has no privileged primary role

Neither user type is the "primary" one. The adoption structure is handled by
the **community entry protocol**, not by privileging one persona in the app.

**Consequence.** Introduction is a documented workflow around the tool: village
head, ward head, extension officer, mosque and association leaders, and lead
farmers whose visible results persuade neighbours. The product's job is to
make a lead farmer's result **convincing and shareable**.

### 3. The prospective-farmer path is in scope

The crop suitability assessment for a farmer who has land but has not chosen
a crop is built, not deferred.

**Consequence.** Two engine paths: the rotation comparison against an
existing sequence, and the suitability assessment for a prospective farmer.
They share the crop catalog, the environmental service and the evidence
format. The suitability path additionally needs a **candidate crop set** and a
way to say that the data cannot separate the top candidates.

**Risk.** This is the largest single piece of work in the build. It is
sequenced last in the implementation plan so that the core comparison ships
first if time runs short.

### 4. The comparison is qualitative. No numbers.

There is **no composite suitability score, no weighting system, no confidence
percentage and no verdict threshold**. The engine compares a measured or
modelled value against a **cited threshold**, and states the evidence.

**Evidence.** The architecture review is explicit, and the project's own
methodology document already conceded the point: *"Thresholds like 0.7 are
arbitrary until the ruleset has been tested against real farms."* Abubakar's
adoption test is comprehension: *"if you come with an approach that a rural
farmer cannot comprehend, they won't trust it."*

**What replaces the numbers.**

| Removed | Replacement |
| ------- | ----------- |
| Composite suitability score | Per-dimension **measured value against cited threshold**, for example rainfall of 620 mm against a requirement of 600 to 1200 mm |
| Per-dimension weights | An **ordinal ranking** with a stated basis, and explicit ties where the evidence does not separate |
| Confidence percentage | A **qualitative evidence strength** of strong, moderate or weak, **with the reason** |
| Verdict thresholds of 0.7 and 0.6 | **Hard constraints** as pass or fail, each with its citation |
| Suitability score on the prospective path | **Ranked shortlist** with the ordering basis stated, and an explicit statement where the evidence cannot separate candidates |

**Consequence for the schema.** `recommendations.score` is dropped.
`confidence` becomes an enum with a reason. `subscores` becomes a set of
per-dimension assessment records, each carrying a value, a threshold, a
citation and a status.

**This supersedes the scoring half of [ADR-0004](./ADR-0004-rules-based-recommendation-engine.md).** The rest of ADR-0004 stands: the engine stays deterministic, rules-based, versioned and explainable, and an LLM remains confined to paraphrasing.

### 5. Geometry: a farm holds parcels, and the parcel is the unit of analysis

**[Partially supersedes ADR-0005.]** A farm is a collection of **parcels**,
each with its own geometry. Environmental analysis and rotation comparison
happen **per parcel**. A GPS point and a drawn polygon are both accepted, with
the GPS point as the default path.

**Evidence.** Bello: *"they are not located in one single contiguous piece."*
Amina counts three large "hectares" plus two smaller plots as one holding.
Abubakar rotates per three-hectare plot.

**Consequence.** `farms` keeps the holding. `farm_plots` becomes a
**parcel** with mandatory geometry, and becomes the unit of analysis.
`farms.area_ha` is the sum of its parcels.

**Three distinct spatial concepts, kept separate.**

| Field | Meaning |
| ----- | ------- |
| `location_uncertainty_m` | How far the recorded location may be off. From the GPS fix. |
| `spatial_resolution_m` | How fine the environmental dataset is. From the source. |
| `coverage_fraction` | How much of the target geometry the dataset actually covered. |

**Consequence for ADR-0005.** The aggregation strategy becomes: sample at
the point for coarse grids, zonal statistics over the parcel where the
raster is finer than the parcel, and the grid cell drawn over the parcel for
the honesty device.

### 6. The planting recommendation is a trigger, and the farmer's rule is an input

The engine never recommends a **date**. It recommends a **condition**, and the
farmer's own stated rule is an input that shapes it.

**Evidence.** See the three rules in the context table. A date-based
recommendation would have told Bello to do exactly what cost other farmers
their crop that year.

**Consequence.** This is the most significant change in the product, and it
elevates soil moisture from background context to **the trigger variable**.
That gives the NASA SMAP integration a central, load-bearing role rather than
a decorative one.

The engine holds a small set of **planting trigger strategies**, each with a
condition, and each with a stated risk profile:

| Strategy | Condition | Risk profile |
| -------- | --------- | ------------ |
| Wait for confirmed moisture | The soil retains sufficient moisture across several days | Lowest establishment risk, shortest remaining season |
| Plant on the first rains | Rainfall onset is confirmed | Longest season, highest establishment risk |
| Prepare and plant quickly | Moisture is confirmed, then act fast | Balanced |

**The farmer's stated rule selects and orders these.** The engine explains
the trade-off rather than hiding it.

### 7. Farmer-stated rotation rules are first-class engine inputs

The rules catalog holds rules from **two labelled sources**: `literature` and
`farmer_report`. Every rule carries its source.

**Evidence.** Amina and Abubakar each stated a rotation rule in their own
words, and the two differ. The catalog already required a citation for every
crop; the same treatment extends to rotation rules.

**Consequence.** The baseline in every comparison is the practice actually in
the field, carrying the farmer's own provenance. This directly answers the
review's instruction not to assume a rule that is not supported: each rule
carries its own support.

### 8. The crop catalog holds local names and aliases

Sorghum and guinea corn. Beans, soybeans and white cowpeas. Pearl millet,
late millet, millet. Every crop record holds its aliases.

**Consequence.** A farmer finds their crop by the name they use, and the
engine maps their words to a crop record. Where two names may be the same crop
or two varieties, the catalog holds an **explicit unresolved list** rather
than a guess. See V-03 in the open decisions register.

### 9. A seasonal risk outlook replaces a forecast

The tool presents a **seasonal outlook** derived from the climate record and
the current season, explicitly framed as a risk indicator and **never as a
forecast or a prediction**.

**Evidence.** Amina asked for a 30-day forecast and called it *"tremendous"*.
But the current PRD excludes forecasts, and a forecast is a different kind of
data with a different correctness burden. A seasonal outlook built from
POWER climatology and the current rainfall record is achievable from data
already in hand, and it carries the same decision value: whether the season
is likely to support a long-duration crop.

**Consequence.** The outlook is a first-class panel and it feeds the planting
trigger logic and the crop suitability path. If a forecast source is added
later, it slots in behind the same interface.

### 10. Consent: names may be published

Farmer names may appear in public artefacts. **Precise coordinates and
contact details never do.** Photographs and publication consent were not
raised in the interviews, so they remain unconfirmed and are not published.

**Evidence.** All three farmers gave their names on the record. Two explicitly
consented to GPS coordinates. All are research participants in a University of
Bayero programme.

**Consequence.** The case studies are committed with names. The consent table
in each case study records exactly what was given. Coordinates live in the
database, not the repository.

---

## Build-time consequences

Three of these decisions add scope rather than removing it: the prospective
farmer path, both user types, and both surfaces for the extension officer.
The build plan sequences accordingly.

**The implementation order in [`ARCHITECTURE.md`](../../ARCHITECTURE.md) § 19 is
updated so that the core comparison ships first.** If time runs out, what
survives is a working rotation comparison with real farmers' real practices,
rather than a half-built suitability engine.

**Where the risk sits:**

| Risk | Why | Mitigation |
| ---- | --- | -------- |
| The suitability engine is not finished | Largest single item | Sequenced last, shares the catalog and environmental service |
| Two user surfaces double the UI work | D-04 | The farmer view and the adviser view are one data set with different emphasis |
| The qualitative rewrite invalidates work already done | D-05 | ADR-0004's scoring half is superseded before any engine code is written, not after |
| The parcel model changes the schema | D-09 | Schema is written once, before any migration is applied |

---

## Consequences

### Positive

- The product is grounded in what three farmers actually do, not in what the
  team assumed.
- The comparison baseline is a real practice with a real provenance.
- The NASA soil moisture data has a central role rather than a decorative one.
- Every number shown is a measurement or a cited threshold. Nothing is a
  fabricated index.
- The adoption path is a documented workflow around the tool, not an
  assumption inside it.

### Negative / accepted costs

- More build than the minimum: two engine paths and two user surfaces.
- The qualitative engine is harder to compare at a glance. Comparison charts
  must chart the **underlying evidence**, never a composite.
- The parcel model complicates the schema.
- The three farmer planting rules are a small set today. More strategies may be
  needed as the catalogue grows.

---

## Follow-up work

- [ ] Rewrite `docs/product/recommendation-methodology.md` for the qualitative
      engine. **Before** any engine code is written.
- [ ] Update `PRD.md` for the confirmed corrections and for decisions 1 to 9.
- [ ] Update the database design for parcels as the unit of analysis.
- [ ] Update `ARCHITECTURE.md` § 19 with the new implementation order.
- [ ] Seed the crop catalog with the aliases and the unresolved list.
- [ ] Collect the consented GPS coordinates for Interviews 01 and 02.
- [ ] Establish the farmer-stated rotation rules in the catalog with
      `source_type: farmer_report`.
- [ ] Ask each farmer about the seasonal outlook and the planting rule, using
      V-07 and V-08.

---

## Revisit when

- The prospective path proves too costly, in which case it is deferred rather
  than half-built.
- The crop catalogue grows enough that a farm's parcels need a shared
  geometry model.
- A farmer states a planting strategy that the three-strategy set does not
  cover.
