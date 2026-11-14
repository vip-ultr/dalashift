# Interview 02: Case Study

**Interviewee:** Amina Habibu
**Location:** Doka, Tofa Local Government Area, Kano State
**Farming experience:** approximately 35 years
**Transcript:** [`transcript.md`](./transcript.md)
**Research context:** Bayero University partner farmer, Doka. Delivers extension
training to other farmers in groups.

> **Status.** Structured extraction from the translated interview. Every entry
> below is a **farmer report**, not an independently verified measurement.
> Items needing confirmation are marked. See
> [`../README.md`](../README.md) for the distinction between a farmer report,
> documented agronomic evidence and an environmental measurement.

---

## 1. Identity and farm

| Field | Value | Confidence |
| ----- | ----- | ---------- |
| Name | Amina Habibu | Stated directly |
| Village | Doka | Stated directly |
| LGA | Tofa, Kano State | Inferred from village, consistent with the other interviews |
| Farming experience | About 35 years | Stated directly |
| Farm size | **Roughly 4 hectares** in total | Stated directly, with the local unit explained |
| Land tenure | Not asked | **Gap** |

**Her unit of area is important and unusual.** A "large farm, what we call a
hectare", is defined locally as **"from one electric pole to the next"**, and
there are smaller plots on top of that. Her breakdown:

- **Three large farms** ("hectares")
- **Two smaller plots**, which together equal about one large plot
- Total: **roughly four hectares**

**Product implication.** The platform cannot assume the farmer knows their area
in hectares, and it cannot assume the farmer's hectare equals the official
hectare. A **direct area estimate, confirmed on the map**, is more reliable
than either. This is a third independent reason the engine must work from
drawn or GPS geometry rather than a typed area field.

## 2. Crops

| Crop | Season | Role and agronomic note |
| ---- | ------ | ----------------------- |
| Maize | Rainy, and dry season | **Requires fertiliser. About three applications between planting and harvest.** |
| Soybeans | Rainy, and dry season | "A very neat growth habit", **does not require chemical fertiliser**, "doesn't mix well with fertilizer". Does fine if weeded and tended. |
| Groundnuts | Rainy, more than usual this year | **Requires fertiliser.** |
| Peppers, bell and chili | Rainy | High water demand. |
| Tomatoes | Rainy | Did not mature fully this year. |

**The soybean fertiliser observation is a specific, useful agronomic input.**
A legume that fixes nitrogen and does not want fertiliser has different
management requirements and a different place in a rotation from one that does.
The engine's crop catalog needs per-crop fertiliser requirement, not just
water and soil.

**Maize needing three fertiliser applications** is a cost and labour input
that belongs in the economic dimension of any comparison, and it is the
opposite of soybean in that dimension.

## 3. The farming system: strip cropping by ridge

**This is the most precisely documented cropping system in the dataset.** She
describes the strip composition of each farm individually, in ridges.

| Farm | Ridge composition |
| ---- | ----------------- |
| One | **Three ridges sorghum + three ridges soybeans**, separated by a boundary line of millet |
| Another | **Four ridges sorghum + three ridges groundnuts** |
| Another | **Four ridges sorghum + four ridges soybeans** |

**Sequence:** after harvest, the land is cleared and harrowed; once the rains
fall, ridges are made; then the strips are planted.

**The millet boundary line** (locally *kalankuwa*) is planted to separate the
strips inside the farm.

**Product implication.** This is a **structured, repeatable layout**, not a
loose description. A farmer's strip plan can be represented as an ordered
list of strips with a crop, a ridge count and a proportion. That makes the
rotation comparison concrete: the engine can evaluate **replacing the
groundnut strip with cowpea**, or **changing the ridge ratio**, and say what
that changes.

**The local name *kalankuwa* is itself a data point.** Local terminology for
farming structures has to survive into the crop catalog and the interface, or
the farmer will not recognise the system being described back to them.

## 4. Crop rotation: explicit, learned, and stated as a rule

She is unambiguous that rotation is understood and practised:

> "Any farmer who has learned modern farming understands that crop rotation is
> what brings real yield. If you plant on a farm this year, when the next
> season comes, you change it and replace it with a different crop."

**Her stated rotation rule:**

> "If you plant on a farm this year, next season you rotate to sorghum, pearl
> millet, or late millet, and then bring the previous crop back later."

**She attributes this to University of Bayero training, about four years
ago**, and links it directly to a measured outcome:

> "Last year's harvest was better than the years before, and this year's
> harvest doubled last year's."

**Product implication.** She has supplied a **crop-level rotation rule in her
own words**. The engine should encode farmer-stated rules as a first-class
category alongside literature-derived ones, and label them by source. The
comparison then has a defensible baseline: "this is what you currently do,
here is what you said the rule is, here are alternatives consistent with it."

## 5. Economics of farming

> "For us, farming has become almost like a salaried job with a company. It
> is our primary capital. It feeds us, gives us water to drink, funds our
> children's weddings and family events, and allows us to save reserves for
> the future."

**The marketing chain she describes:** when the rainy season ends you call a
buyer; if the produce is of good quality they inspect it and pay a lump sum,
then take it to process in their factories.

**Product implication.** The economic dimension of the comparison has a
concrete local structure: a **quality-dependent lump-sum sale to an
inspecting buyer**, not a spot market. Any economic reasoning in the engine
should reflect that produce quality gates the price.

## 6. Climate, adaptation and the failed season

**This year the rainy season did not last.** They "nearly faced a crisis due
to lack of rain", and **there was no rain in August.** The late rains that did
arrive "are what saved us".

**The response was a collective decision, not an individual one:**

> "This year, we consulted among ourselves as farmers... Because of that, we
> agreed to switch to early-maturing (short-duration) seed varieties rather
> than long-duration ones."

**Consequences she observed:** long-duration sorghum and maize did not fully
mature; tomatoes stayed small; peppers were harvested early and sorted into
damaged and good.

**Her stated planting rule, which contradicts Interview 01:**

> "We realized that as soon as the first rains fall, we must start planting
> immediately rather than waiting, because of the climate pattern we have
> entered."

**The counterfactual she offers** is directly useful:

> "If we had planted cowpeas (beans), they wouldn't have needed as much water
> as peppers do. We have an early-maturing cowpea variety that matures in 40
> days, you harvest it, and it continues producing for another month."

**Product implication.** She has described a crop substitution on the basis of
water demand, with a named duration. This is exactly the reasoning the
comparison engine performs. The engine needs **crop duration** (days to
maturity) as a first-class catalog attribute, because it appears in both the
maturity risk and the rotation-length reasoning.

## 7. What she wants from the tool

The interviewer proposed a 30-day rainfall forecast chart. Her response:

> "If farmers get access to that, it will be tremendous."

**She described how farmers currently get this advice:** from **radio
weather forecasts**, which advise planting early-maturing seeds instead of
long-duration ones, or switching from sorghum to cowpeas based on expected
rainfall.

**Product implication.** This is a direct request for a **30-day rainfall
forecast and alert**, which the current PRD explicitly excludes as out of
scope. This is now a documented farmer need and is carried into the open
decisions register as a scope question, not a footnote.

Note also that the advice she already receives is **exactly the kind of
decision the platform would make**: switch to a shorter-duration variety, or
substitute a lower water-demand crop. The platform is not inventing a new
category of advice; it is grounding advice farmers already act on in their own
field's data.

## 8. Willingness to adopt

> "They will definitely accept it. Whenever something beneficial comes along
> and you try it and see results, you naturally share it with others."

**Evidence of the sharing behaviour:** people come from neighbouring towns
such as **Gwarzo** asking about their crops and how to get improved seeds. She
directs them to the **agricultural extension officer (malamin gona)**, who works
closely with them and helps source quality seeds through the University.

> "We are ready and waiting for whatever you bring, we will accept it
> wholeheartedly."

**Product implication.** The extension officer is already the **hub** of the
diffusion network. An adviser-facing view of the tool, and a shareable result
that the extension officer can walk a group through, are more valuable here
than a broader feature set.

## 9. Consent

| Permission | Status |
| ---------- | ------ |
| Participate in the interview | **Given.** |
| Record name | **Given.** Name stated and recorded. |
| GPS coordinates of the farms | **Given explicitly.** "We are completely ready. Whenever you come, we will lead you directly to the farms. They aren't far, just a short walk from here." |
| Photographs | Not raised in this interview. **Unconfirmed.** |
| Publish identifiable information | **Not raised. Unconfirmed.** See the open decisions register. |

**GPS coordinates have not yet been collected.** The consent is given and the
farms are close, so collection is straightforward.

## 10. Structured extract for the engine

| Field | Value |
| ----- | ----- |
| Cropping system | Strip cropping with ridge-based strip plans, separated by millet boundary lines (*kalankuwa*) |
| Rotation practice | **Explicit.** Change crop each season; rotate to sorghum, pearl millet or late millet; bring the previous crop back later. Learned from University training. |
| Farms | Three large "hectares" plus two smaller plots. Total roughly 4 ha. |
| Area unit | "One hectare" is defined locally as pole-to-pole. Needs map confirmation. |
| Rainy season crops | Maize, soybeans, groundnuts, peppers, tomatoes |
| Dry season crops | Maize, soybeans. Irrigated from wells, no dam available. |
| Water source | Wells |
| Planting trigger | **Plant immediately on the first rains.** Conflicts with Interview 01. |
| Seed strategy | Switched to early-maturing and short-duration varieties after this year's crisis |
| Fertiliser practice | Maize about three applications per season. Groundnuts and maize need it. Soybeans do not. |
| Cash crops | Soybeans, groundnuts, peppers, tomatoes |
| Food security crops | Maize |
| Marketing | Quality-inspected lump-sum sale to a buyer who processes in their factories |
| Adoption pathway | Extension officer (malamin gona) as the hub; see-result-then-share; visitors from neighbouring towns |
| Constraints | No dam for dry-season irrigation, wells only. Short and failing rainy season. No August rain. Labour for three maize fertiliser applications. |
| Priorities | Maturity reliability under a shortening season, cash income, food security |
| Requested feature | **30-day rainfall forecast and alert** |

## 11. Open items for this case study

- [ ] Collect the GPS coordinates that were consented to.
- [ ] Confirm the four-hectare total against the map.
- [ ] Record the ridge length and plot dimensions so ridge ratios convert to
      areas.
- [ ] Establish which soybean and cowpea varieties she uses and their
      durations.
- [ ] Confirm the current dry-season crop list and whether it is still active.
- [ ] Ask what "quality" means to the inspecting buyer, since it gates the
      price.
- [ ] Ask what her baseline yield was before the University training, to
      understand the basis of the "doubled" claim.
