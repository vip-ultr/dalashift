# Interview 03: Case Study (anonymised)

**Participant:** Interviewed smallholder C (anonymous)
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
size, tenure, plot size and exact boundaries are deliberately not recorded.
The relevant research finding is that holdings in the validation area span a
wide range of scales and that management happens at the plot level, so the
platform must not assume a single scale.

| Field | Value |
| ----- | ----- |
| Participant | Interviewed smallholder C (anonymous) |
| Location | Tofa LGA, Kano State (village withheld) |
| Holding | Withheld; holdings vary between participants |
| Land tenure | Not recorded |
| Seasons | Both rainy and dry season farming reported |

**Product implication.** Smallholders in the area span a wide range of scales.
A rotation recommendation for one is not automatically a recommendation for
another, and the **plot-level** modelling has real justification because the
management unit is the plot, not the whole holding. Scale is also a consent
consideration: larger holdings are more sensitive to disclose, so precise
location is never published in this record.

## 2. Crops

| Crop | Season | Notes |
| ---- | ------ | ----- |
| Sorghum (guinea corn) | Rainy | The reference crop in the rotation rule |
| Beans | Rainy | Local name, identity unresolved |
| Groundnuts | Rainy | |
| White cowpeas | Rainy | Reported seed descriptor, identity under cowpea |
| Maize | Rainy | Appears in the rotation rule |

**Local and common names are used interchangeably** across the interviews. A
crop catalog needs a name-alias layer, or the farmer will not find their crop
and the engine will not map their words to a crop record. This is a concrete
requirement, not a hypothetical.

## 3. Rotation and intercropping: both, with an explicit rule

The participant stated that both rotation and intercropping are practised.
Intercropping was described as sowing a legume between cereal rows.

A crop-level rotation rule was supplied in the participant's own words: a
cereal and legume sequence cycles across plots on a multi-year basis, with a
legume or cereal following the previous crop. Exact cycle lengths and plot
sizes are withheld as identifying detail. A simpler annual swap between two
crops was also described.

**Product implication.** This is the second independent farmer-stated rotation
rule in the dataset, and it differs from the first. Two participants
independently describing rotation with different rules is exactly the input the
comparison engine needs. It also gives a ground truth for the rotation ruleset:
the rules are not invented by the research team, they are the practice in the
field.

## 4. Climate change, variety change and dry-spell management

The change in practice was attributed to agricultural training received through
the university partnership. Traditional varieties were reported as replaced by
modern, shorter-duration ones. Specific maturity day counts are withheld as
identifying detail.

The dry-spell strategy, a third distinct position, was to prepare the land and
plant quickly once the soil has good moisture from the early rains, so as to
manage later dry spells.

**Product implication.** Across the three interviews there are now **three
distinct planting-trigger rules** for the same physical situation. These are
recorded in aggregate in the field-interviews README. The platform's planting
recommendation cannot be a single calendar date, because the farmers themselves
use different rules and each is defensible. The recommendation has to be
**parameterised by planting trigger**, and the participant's stated trigger has
to be an input the engine respects.

The three positions are not contradictory. They are three risk postures:
minimising germination failure, maximising season length, and balancing the two
by acting quickly once moisture is confirmed.

## 5. Soil fertility management

The participant's account, in order, was to clear and cut back vegetation
before planting, gather and burn it, and apply organic manure. Burning was
described as adding nutrients and reducing disease and pests.

**Product implication.** The fertility practice is manure application plus
residue burning, with disease and pest suppression as a stated benefit of
burning. That belongs in the **management requirements** dimension of any
comparison, and it is a practice the platform should describe rather than
contradict. A rotation recommendation that assumes residue retention would be
recommending a change that was not asked for.

Burning is a contested agronomic practice and also an emissions topic. If the
topic is raised, it must be as a farmer-facing consideration rather than a
lecture.

## 6. Willingness to adopt technology

The participant said innovations will be accepted, but that acceptance depends
entirely on the approach used to introduce them. An approach a rural farmer
cannot comprehend will not be trusted. They also distinguished immediate
adopters from those who wait to see someone else succeed first.

**Product implication.** This is a **comprehension test**, not a features test.
The interface has to be understandable on first contact to a farmer without
prior exposure. That is a concrete design constraint on the map, the charts and
the language used, and it reinforces the decision to avoid numeric suitability
scores.

## 7. Community engagement and network connectivity

The engagement structure described runs from the research sector and
agricultural extension experts through community leaders, village heads,
religious leaders and farmers' association leaders. The participant stressed
that an introducer who does not speak Hausa will struggle to gain acceptance.

Network coverage varies by carrier but was reported as workable, so
connectivity is not the blocker the team assumed. A web application is viable;
offline-first is a nice-to-have, not a prerequisite, and should not displace the
rotation comparison work.

**Product implication.** The single strongest statement about adoption in the
dataset is that a **Hausa-speaking introducer** is what makes acceptance
possible. This bears directly on the Hausa interface scope question and suggests
the extension officer is the primary operator of the tool, not the farmer.

## 8. Consent

Consent was recorded for participation and for use of the content in research.
The participant is anonymous in this record: no name, contact detail or precise
location is published.

| Permission | Status |
| ---------- | ------ |
| Participate in the interview | Given |
| Use of the anonymous research record | Given |
| Collect precise coordinates | Not raised; coordinates not published |
| Capture photographs | Not raised; not published |
| Publish identifiable information | Not granted; this record is anonymised |

## 9. Structured extract for the engine

| Field | Value |
| ----- | ----- |
| Cropping system | Strip cropping plus intercropping, legumes sown between cereal rows. Plot-level rotation. |
| Rotation practice | Explicit farmer-stated rule: a cereal and legume sequence cycles across plots over a multi-year period. |
| Parcels | Multiple plots; holdings and plot sizes withheld. Rainy and dry season. |
| Rainy season crops | Sorghum (guinea corn), beans, groundnuts, white cowpeas, maize |
| Planting trigger | Plant quickly once the soil has good moisture from the early rains. |
| Seed strategy | Modern, shorter-duration varieties. Exact durations withheld. |
| Fertiliser practice | Organic manure plus burning of cleared vegetation |
| Crop names used | Sorghum / guinea corn; beans / soybeans / white cowpeas. Alias handling required. |
| Adoption pathway | Research sector, extension experts, village and religious leaders, farmers' association leaders. The introducer must speak Hausa. |
| Adoption profile | Mixed: immediate adopters and wait-for-success adopters |
| Constraints | Dry spells after early rains. Maturity risk with long-duration varieties. Connectivity varies by carrier but is workable. |
| Priorities | Maturity within the available season, managing dry spells, adapting to the new climate pattern |

## 10. Open items for this case study

- [ ] Confirm the dry-season crop list, which was not covered.
- [ ] Record which dry-season crops, if any, depend on irrigation.
- [ ] Clarify whether "white cowpeas" and "soybeans" are the same crop in local
      practice or two varieties.
- [ ] Record the manure source and rate.
- [ ] Ask about pest and disease problems, since burning is described as
      reducing them.
