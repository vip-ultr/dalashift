# Interview 02: Case Study (anonymised)

**Participant:** Interviewed smallholder B (anonymous)
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
The relevant research finding is that the local unit of area is not the standard
hectare, so a direct area estimate confirmed on the map is more reliable than a
typed area field. This is a reason the engine must work from drawn or GPS
geometry rather than a typed area.

| Field | Value |
| ----- | ----- |
| Participant | Interviewed smallholder B (anonymous) |
| Location | Tofa LGA, Kano State (village withheld) |
| Holding | Withheld; holdings vary between participants |
| Land tenure | Not recorded |

## 2. Crops

| Crop | Season | Role and agronomic note |
| ---- | ------ | ----------------------- |
| Maize | Rainy and dry season | Requires fertiliser. |
| Soybeans | Rainy and dry season | Reported not to require chemical fertiliser. |
| Groundnuts | Rainy | Requires fertiliser. |
| Peppers | Rainy | High water demand. |
| Tomatoes | Rainy | Did not mature fully in the season described. |

**The soybean fertiliser observation is a useful agronomic input.** A legume
reported to fix nitrogen and not to want fertiliser has different management
requirements and a different place in a rotation from one that does. The crop
catalog needs a per-crop fertiliser requirement, not just water and soil.
Fertiliser demand is also a cost and labour input that belongs in the economic
dimension of a comparison.

## 3. The farming system: structured strip cropping

Strip cropping is described as a structured, repeatable layout, with cereals and
legumes in strips separated by a millet boundary line known locally as
*kalankuwa*. Specific strip compositions and ridge counts are withheld because
they could identify the participant.

**Sequence:** after harvest, the land is cleared and harrowed; once the rains
fall, ridges are made; then the strips are planted.

**Product implication.** A strip plan can be represented as an ordered list of
strips with a crop, a ridge count and a proportion. That makes the rotation
comparison concrete: the engine can evaluate substituting a legume strip or
changing a strip ratio, and say what that changes. The local name *kalankuwa* is
itself data and must survive into the crop catalog and the interface.

## 4. Crop rotation: explicit and stated as a rule

The participant was unambiguous that rotation is understood and practised, and
supplied a crop-level rotation rule in their own words. The rule is a farmer
report, labelled as such, and forms a defensible baseline for comparison.

The participant attributed the practice to agricultural training received
through the university partnership and linked it to a reported improvement in
harvest. Exact durations and yield figures are withheld as identifying detail.

**Product implication.** Farmer-stated rules should be encoded as a first-class
category alongside literature-derived ones, and labelled by source. The
comparison can then say: this is the practice you described, here is your stated
rule, here are alternatives consistent with it.

## 5. Economics of farming

Farming was described as the household's primary capital, funding consumption,
family events and savings. The marketing chain reported is a buyer who inspects
produce at the end of the rainy season and pays a lump sum, then processes it.

**Product implication.** The economic dimension has a concrete local structure:
a **quality-dependent lump-sum sale to an inspecting buyer**, not a spot market.
Produce quality gates the price, and any economic reasoning should reflect that.

## 6. Climate, adaptation and the failed season

The season described was short, with a long dry spell and no rain in the month
expected to be wet. The response was a collective decision among farmers to
switch to early-maturing, short-duration varieties rather than long-duration
ones. Long-duration crops did not fully mature and some produce was harvested
early and sorted.

The stated planting rule was to plant immediately on the first rains rather than
wait. This contradicts the rule described in Interview 01, and both are
recorded: they are two coherent responses to the same physical situation.

A useful counterfactual was offered: a shorter-duration legume would have needed
less water than the high-demand crop actually planted. This is a crop
substitution reasoned on water demand and duration, exactly the reasoning the
comparison engine performs. It supports **crop duration**, in days to maturity,
as a first-class catalog attribute.

## 7. What the participant wants from the tool

The idea of a 30-day rainfall outlook was received with strong interest. The
advice farmers already act on comes from radio weather forecasts: plant
early-maturing varieties, or switch from sorghum to cowpeas, based on expected
rainfall.

**Product implication.** There is a documented farmer interest in a 30-day
outlook, carried into the open decisions register as a scope question. The
platform is not inventing a new category of advice; it is grounding advice
farmers already act on in their own field's data.

## 8. Willingness to adopt

The participant said beneficial innovations are shared once results are seen,
and that visitors from neighbouring areas ask about crops and improved seeds.
They direct such visitors to the agricultural extension officer, who helps
source quality seeds. They expressed readiness to adopt the tool.

**Product implication.** The extension officer is already the **hub** of the
diffusion network. An adviser-facing view and a shareable result the extension
officer can walk a group through are more valuable than a broader feature set.

## 9. Consent

Consent was recorded for participation, for use of the content in research, and
for GPS coordinates. The participant is anonymous in this record: no name,
contact detail or precise location is published.

| Permission | Status |
| ---------- | ------ |
| Participate in the interview | Given |
| Use of the anonymous research record | Given |
| Capture photographs | Recorded in the consent register |
| Collect precise coordinates | Consent recorded; coordinates not published |
| Publish identifiable information | Not granted; this record is anonymised |

## 10. Structured extract for the engine

| Field | Value |
| ----- | ----- |
| Cropping system | Structured strip cropping with millet boundary lines (*kalankuwa*) |
| Rotation practice | Explicit farmer-stated rule: change crop each season and bring an earlier crop back later. |
| Parcels | Multiple parcels; holdings and local area units withheld. |
| Rainy season crops | Maize, soybeans, groundnuts, peppers, tomatoes |
| Dry season crops | Maize, soybeans. Irrigated from wells, no dam available. |
| Water source | Wells |
| Planting trigger | Plant immediately on the first rains. Conflicts with Interview 01. |
| Seed strategy | Switched to early-maturing and short-duration varieties |
| Fertiliser practice | Maize and groundnuts need fertiliser; soybeans reported not to. Application counts withheld. |
| Cash crops | Soybeans, groundnuts, peppers, tomatoes |
| Food security crops | Maize |
| Marketing | Quality-inspected lump-sum sale to a buyer who processes the produce |
| Adoption pathway | Extension officer as the hub; see-result-then-share |
| Constraints | No dam for dry-season irrigation, wells only. Short and failing rainy season. |
| Priorities | Maturity reliability under a shortening season, cash income, food security |
| Requested feature | 30-day rainfall outlook and alert |

## 11. Open items for this case study

- [ ] Confirm holding area against the map rather than a typed value.
- [ ] Record strip ratios in a form that does not identify the participant.
- [ ] Establish which soybean and cowpea varieties are used and their durations.
- [ ] Confirm the current dry-season crop list and whether it is still active.
- [ ] Ask what "quality" means to the inspecting buyer, since it gates the price.
