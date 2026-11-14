# Interview 01: Case Study

**Interviewee:** Bello Yusuf Maitama
**Location:** Doka, Tofa Local Government Area, Kano State
**Farming experience:** approximately 30 to 35 years, following the family
**Transcript:** [`transcript.md`](./transcript.md)
**Research context:** Bayero University students, under Professor Aminu Fagge

> **Status.** Structured extraction from the translated interview. Every entry
> below is a **farmer report**, not an independently verified measurement.
> Items needing confirmation are marked. See
> [`../README.md`](../README.md) for the distinction between a farmer report,
> documented agronomic evidence and an environmental measurement.

---

## 1. Identity and farm

| Field | Value | Confidence |
| ----- | ----- | ---------- |
| Name | Bello Yusuf Maitama | Stated directly |
| Village | Doka | Stated directly |
| LGA | Tofa, Kano State | Stated directly |
| Farming experience | About 30 to 35 years, independently, following the family | Stated directly |
| Farm size | Roughly 2 to 4 hectares in total | Stated as an estimate |
| Land tenure | Not asked | **Gap** |
| Farm layout | **Not contiguous.** "They are not located in one single contiguous piece" | Stated directly |

**Consequence for the product:** this farmer's farm is a **set of parcels, not
one polygon.** A single farm-boundary polygon is the wrong model for him. The
data model needs a farm to hold **multiple geometries**, or the engine treats
each parcel as a separate unit of analysis. This is the first concrete
evidence that the farm must not be modelled as one location.

## 2. Crops and roles

| Crop | Season | Role as described |
| ---- | ------ | ----------------- |
| Sorghum | Rainy | **Cereal, primarily for family consumption and food security** |
| Maize | Rainy | **Cereal, primarily for family consumption and food security** |
| Cowpeas | Rainy | **Legume, a cash crop** |
| Groundnuts | Rainy | **Legume, a cash crop** |
| Tomatoes | Rainy | Not assigned a role in the interview |

**The cereal/legume split is explicit.** Legumes are grown for cash, cereals
for food. That is a *farmer's own* framing of what the two functional groups
do, and it maps directly onto the two families the rotation engine reasons
about. It is also the strongest local justification for intercropping a cereal
with a legume, and it should be recorded as a **farmer report** rather than
presented as an agronomic principle.

**Dry-season farming: suspended.** He used to farm in the dry season using
irrigation, but stopped because **the wells dropped and the water is needed
for community drinking and livestock**. Dry-season groundnut in particular was
the most profitable, so this is a genuine loss of income driven by a
**local groundwater constraint**.

This is a directly checkable claim and a good candidate for a
hydrogeology/groundwater data source. It is also the reason a "dry season"
context for Kano may not be uniform across the area.

## 3. The farming system: strip cropping

**Strip cropping is the primary system.** Cereals and legumes are grown in
alternate rows or strips.

- Usually intercropped. **Exception: pure maize** is planted on its own.
- Stated benefits, in his own account:
  1. **Suppresses weeds.**
  2. **Protects the soil surface.**
  3. **Disrupts pest cycles**, because pests cannot find large uniform blocks
     of a single host crop.

**Point 3 is agronomically substantive and testable.** It is a stated
mechanism, not a general claim, and it is the kind of evidence the rotation
comparison engine needs: it explains *why* a mixed strip layout can be
preferable to a pure block even when the crops are the same ones.

**Gap:** he was asked about rotation and answered about intercropping. Whether
he also rotates between seasons is **not established** by this interview. His
rotation practice should be treated as **unknown, not as absent**.

## 4. Climate and adaptation

**The pattern he describes: the rains started early, then stopped.**

> "The rains started early, but then we experienced prolonged dry spells
> (drought pockets). Those who rushed to plant without caution suffered losses
> when the rains stopped temporarily."

**His own response was to wait:**

> "I waited and delayed planting until the soil retained sufficient moisture
> from subsequent light showers, which allowed my crops to germinate
> successfully and survive the season."

**This is the most important single finding in the dataset for the product's
core logic.** It is a *soil-moisture-triggered planting decision*. He did not
plant on a calendar; he waited for the soil to hold enough moisture.

That is precisely the decision the platform claims to support. And it means the
engine's planting recommendation must be expressed as a **trigger condition**
("the soil holds enough moisture"), not as a **calendar date**. A date-based
recommendation would tell him the wrong thing in the exact year he describes.

**Seed choice:** he relies on **early-maturing and resilient varieties**,
because of the climate shifts.

**Note the tension with Interview 02**, where the strategy is to plant
immediately on the first rains. Both farmers describe the same physical
reality, and they make opposite decisions from it. See the cross-interview
analysis.

## 5. Willingness to adopt technology

He is positive but conditioned on **how it is introduced**.

His stated pathway:

1. **Village head (maigari)**
2. **Ward head (mai unguwa)**
3. **Agricultural extension officer (malamin gona)**

> "If local lead farmers test it and succeed, others will naturally follow
> their example."

**Product implication.** Adoption depends on a **community entry protocol**,
not on a farmer-facing app alone. A tool that only a farmer can open, with no
route through the ward and village leadership, does not clear this bar.

This suggests a **sharing and endorsement surface** in the product: something a
lead farmer's result can be shown to neighbours, and something the extension
officer can use in a group session.

## 6. Consent

| Permission | Status |
| ---------- | ------ |
| Participate in the interview | **Given.** |
| Record name | **Given.** Name stated and recorded. |
| GPS coordinates of the farm | **Given explicitly.** "We are completely ready. Whenever you are ready to take the GPS coordinates of the farm, we will lead you there directly." |
| Photographs | Not raised in this interview. **Unconfirmed.** |
| Publish identifiable information | **Not raised. Unconfirmed.** See the open decisions register. |

**GPS coordinates have not yet been collected.** The consent is given but the
data does not exist yet.

## 7. Structured extract for the engine

| Field | Value |
| ----- | ----- |
| Cropping system | Strip cropping, cereals with legumes in alternate rows. Pure maize occasionally. |
| Rotation practice | **Unknown.** Intercropping confirmed, rotation not established. |
| Farms | Multiple, non-contiguous parcels. Total 2 to 4 ha. |
| Rainy season crops | Sorghum, maize, cowpeas, groundnuts, tomatoes |
| Dry season crops | **None currently.** Suspended due to falling well water levels. |
| Water source | Wells (previously for dry-season irrigation) |
| Planting trigger | **Soil moisture.** Wait until the soil retains sufficient moisture from light showers. |
| Seed strategy | Early-maturing, resilient varieties |
| Fertiliser practice | Not asked. **Gap.** |
| Stated strip-cropping benefits | Weed suppression, soil surface protection, pest-cycle disruption |
| Cash crops | Cowpeas, groundnuts |
| Food security crops | Sorghum, maize |
| Adoption pathway | maigari, mai unguwa, malamin gona, then lead farmer demonstration |
| Constraints | Groundwater competition (community and livestock), non-contiguous land, early rains followed by dry spells |
| Priorities | Implicit: crop survival through dry spells, maintaining food security and cash income |

## 8. Open items for this case study

- [ ] Collect the GPS coordinates that were consented to.
- [ ] Establish whether he rotates crops between seasons or only intercrops.
- [ ] Record fertiliser practice.
- [ ] Record land tenure and whether the parcels are rented or owned.
- [ ] Confirm whether the well-water constraint is specific to his parcels or
      general to Doka.
- [ ] Ask whether the yield improvement from strip cropping has been measured
      or is an impression.
