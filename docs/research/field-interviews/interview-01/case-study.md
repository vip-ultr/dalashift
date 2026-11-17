# Interview 01: Case Study (anonymised)

**Participant:** Interviewed smallholder A (anonymous)
**Location:** Tofa LGA, Kano State (village withheld)
**Transcript:** [`transcript.md`](./transcript.md)
**Research context:** Semi-structured interview conducted as part of
university-led field research in the validation area.

> **Status.** Structured extraction from the translated interview. Every entry
> below is a **farmer report**, not an independently verified measurement. The
> participant is anonymous and identifying details have been removed. See
> [`../README.md`](../README.md) for the distinction between a farmer report,
> documented agronomic evidence and an environmental measurement.

---

## 1. Identity and farm

The participant is an anonymous smallholder in Tofa LGA, Kano State. Holding
size, plot counts, tenure and exact boundaries are deliberately not recorded.
The research finding that matters is that smallholders in the area manage more
than one parcel, so the data model must support multiple parcels rather than a
single farm polygon.

| Field | Value |
| ----- | ----- |
| Participant | Interviewed smallholder A (anonymous) |
| Location | Tofa LGA, Kano State (village withheld) |
| Holding | Withheld; holdings vary between participants |
| Land tenure | Not recorded |

**Consequence for the product:** the unit of management is the parcel, not one
farm polygon. The data model needs a holding to contain multiple parcel
geometries, or the engine must treat each parcel as a separate unit of analysis.
This is the first concrete evidence that a farm must not be modelled as one
location.

## 2. Crops and roles

| Crop | Season | Role as described |
| ---- | ------ | ----------------- |
| Sorghum | Rainy | Cereal, primarily for family consumption and food security |
| Maize | Rainy | Cereal, primarily for family consumption and food security |
| Cowpeas | Rainy | Legume, a cash crop |
| Groundnuts | Rainy | Legume, a cash crop |
| Tomatoes | Rainy | Role not recorded |

**The cereal/legume split is explicit.** Legumes are grown for cash, cereals
for food. This is a farmer framing of the two functional groups and it maps onto
the two families the rotation engine reasons about. It is recorded as a farmer
report, not presented as an agronomic principle.

**Dry-season farming: suspended in this account.** Dry-season irrigation was
reported as abandoned because well water had declined and was needed for
community drinking and livestock. This is reported as a local water constraint,
not as a general property of the validation area.

## 3. The farming system: strip cropping

Strip cropping is described as the primary system, with cereals and legumes
grown in alternate rows or strips. Pure maize is an exception.

Reported benefits, as a farmer account:

1. Suppresses weeds.
2. Protects the soil surface.
3. Disrupts pest cycles, because pests cannot find large uniform blocks of a
   single host crop.

Point 3 is a stated, testable mechanism and is the kind of evidence the rotation
comparison engine needs: it explains why a mixed strip layout can be preferable
to a pure block even with the same crops. Whether crops are also rotated between
seasons is not established by this interview and is treated as unknown, not
absent.

## 4. Climate and adaptation

The account describes rains starting early and then dry spells following. The
stated response was to delay planting until the soil retained sufficient
moisture from later showers, so that crops would germinate and survive. This is
a soil-moisture-triggered planting decision, not a calendar decision.

This is the central finding for the product's core logic. The planting
recommendation must be expressed as a **trigger condition** ("the soil holds
enough moisture"), not as a **calendar date**. A date-based recommendation would
tell this farmer the wrong thing in the exact year described. Early-maturing and
resilient varieties were also reported.

The account contrasts with another participant's strategy of planting
immediately on the first rains. Both describe the same physical reality and
make different decisions from it.

## 5. Willingness to adopt technology

The participant was positive about adopting a new tool, but conditioned on how
it is introduced. The reported pathway runs through village and ward leadership,
the agricultural extension officer, and lead-farmer demonstration.

**Product implication.** Adoption depends on a **community entry protocol**, not
on a farmer-facing app alone. This suggests a sharing and endorsement surface in
the product: something a lead farmer's result can be shown to neighbours, and
something the extension officer can use in a group session.

## 6. Consent

Consent was recorded for participation, for use of the content in research, and
for the taking of photographs and GPS coordinates. The participant is anonymous
in this record: no name, contact detail or precise location is published.

| Permission | Status |
| ---------- | ------ |
| Participate in the interview | Given |
| Use of the anonymous research record | Given |
| Capture photographs | Recorded in the consent register |
| Collect precise coordinates | Consent recorded; coordinates not published |
| Publish identifiable information | Not granted; this record is anonymised |

## 7. Structured extract for the engine

| Field | Value |
| ----- | ----- |
| Cropping system | Strip cropping, cereals with legumes in alternate rows. Pure maize occasionally. |
| Rotation practice | Unknown. Intercropping confirmed, rotation not established. |
| Parcels | Multiple parcels; holdings withheld. |
| Rainy season crops | Sorghum, maize, cowpeas, groundnuts, tomatoes |
| Dry season crops | None currently, reported as suspended due to falling well water |
| Water source | Wells |
| Planting trigger | Soil moisture. Wait until the soil retains sufficient moisture. |
| Seed strategy | Early-maturing, resilient varieties |
| Fertiliser practice | Not recorded |
| Stated strip-cropping benefits | Weed suppression, soil surface protection, pest-cycle disruption |
| Cash crops | Cowpeas, groundnuts |
| Food security crops | Sorghum, maize |
| Adoption pathway | Village and ward leadership, extension officer, lead-farmer demonstration |
| Constraints | Water competition, multiple parcels, early rains followed by dry spells |
| Priorities | Crop survival through dry spells, food security and cash income |

## 8. Open items for this case study

- [ ] Confirm whether parcels are rented or owned.
- [ ] Establish whether crops are rotated between seasons or only intercropped.
- [ ] Record fertiliser practice.
