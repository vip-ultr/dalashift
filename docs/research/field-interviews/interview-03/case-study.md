# Interview 03: Case Study

**Interviewee:** Abubakar, also known as **Dan Hajiya** in Doka
**Location:** Doka, Tofa Local Government Area, Kano State
**Farm size:** about 30 hectares, his own land
**Transcript:** [`transcript.md`](./transcript.md)
**Research context:** Bayero University climate change training participant.
Actively engaged in local agricultural practice.

> **Status.** Structured extraction from the translated interview. Every entry
> below is a **farmer report**, not an independently verified measurement.
> Items needing confirmation are marked. See
> [`../README.md`](../README.md) for the distinction between a farmer report,
> documented agronomic evidence and an environmental measurement.

---

## 1. Identity and farm

| Field | Value | Confidence |
| ----- | ----- | ---------- |
| Name | Abubakar (Dan Hajiya) | Stated directly |
| Village | Doka | Stated directly |
| LGA | Tofa, Kano State | Inferred from village, consistent with the other interviews |
| Farm size | **About 30 hectares** | Stated directly |
| Land tenure | **His own land, not rented** | Stated directly |
| Seasons | **Both rainy season and dry season farming** | Stated directly |
| Season balance | "The rainy season farming takes up more capacity" | Stated directly |
| Plot size | "Plots of about three hectares each around here" | Stated directly |

**He is the largest of the three cases by an order of magnitude.** The other
two farm 2 to 4 hectares. He farms roughly 30.

**Product implication.** The three farmers span **an order of magnitude in
scale**, and the platform must not assume a single scale. A rotation
recommendation for a 2 hectare intercropper is not the same recommendation as
for a 30 hectare farmer running three-hectare plots and a two-to-three-year
rotation across them. This also means the **plot-level** modelling has real
justification: his management unit is a three-hectare plot, not the whole
farm.

**[Open] Scale is also a risk factor.** A 30 hectare farm is a much larger
target for land disputes and for the disclosure of sensitive location
information than a 2 hectare plot. It sits on one GPS point or several, which
matters for the consent model.

## 2. Crops

| Crop | Season | Notes |
| ---- | ------ | ----- |
| Guinea corn (sorghum) | Rainy | The reference crop in his rotation rule |
| Beans | Rainy | "White cowpeas" also named |
| Groundnuts | Rainy | |
| White cowpeas | Rainy | |
| Maize | Rainy | Appears in the rotation rule |

**He uses local and common names interchangeably**: "beans", "soybeans" and
"white cowpeas" all appear across the three interviews. **A crop catalog
needs a name-alias layer**, or the farmer will not find their crop and the
engine will not map their words to a crop record. This is a concrete
requirement, not a hypothetical.

## 3. Rotation and intercropping: both, with an explicit rule

He states clearly that he does both.

**Intercropping:** "we plant sorghum and then sow soybeans in between the
sorghum rows, or cowpeas in between the sorghum rows."

**Rotation rule, in his own words:**

> "Wherever we plant sorghum and soybeans, next time that same spot gets
> white cowpeas or soybeans, or if it had white cowpeas or soybeans, it gets
> sorghum or maize, following a two-to-three-year crop rotation cycle."

**He also describes a simple annual swap:** "if we plant soybeans and sorghum
this year, by God's grace, next year the soybean plot changes to sorghum, and
the sorghum plot changes to soybeans."

**Product implication.** This is the **second independent farmer-stated
rotation rule** in the dataset, and the two differ:

| Farmer | Stated rule |
| ------ | ----------- |
| Amina Habibu | Change crop each season; rotate to sorghum, pearl millet or late millet; bring the previous crop back later. |
| Abubakar | Sorghum and soybean plots alternate with white cowpea or maize on a two-to-three-year cycle. |

Two farmers independently describing rotation, with different rules, is
exactly the input the comparison engine needs. It also gives a **ground truth
for the rotation ruleset**: the rules are not invented by the research team,
they are the practice in the field.

## 4. Climate change, variety change and dry-spell management

He attributes the change in practice directly to **Bayero University climate
change training**:

> "This training on climate change forced us to change the crop varieties we
> work with. Instead of traditional varieties, we shifted to modern ones."

**The duration change is specific:**

| | Duration |
|---|---|
| Traditional sorghum | **100 to 120 days** to mature |
| Modern varieties now planted | **80 to 90 days**, "about three months" |

**The dry-spell strategy, which is a third distinct position:**

> "Previously when the rains fell, you would plant, but then you might
> experience dry spells with no rain. Now, as a result of this training, once
> the soil gets good moisture from the early rains, we quickly prepare the
> land and plant. This way, we manage and mitigate dry spells and climate
> shifts."

**Product implication.** Across the three interviews there are now **three
distinct planting-trigger rules** for the same physical situation:

| Farmer | Trigger |
| ------ | ------- |
| Bello Yusuf Maitama | **Wait** until the soil retains sufficient moisture from light showers |
| Amina Habibu | **Plant immediately** on the first rains, without waiting |
| Abubakar | **Prepare the land and plant quickly** once the soil has good moisture |

**This is the single most valuable product finding in the dataset.** The
platform's planting recommendation cannot be a single calendar date, because
the farmers themselves use three different rules and each is defensible. The
recommendation has to be **parameterised by planting trigger**, and the
farmer's stated trigger has to be an input the engine respects.

The three positions are not contradictory. They are three risk postures:

- **Bello** minimises germination failure, at the cost of a shorter season.
- **Amina** maximises season length, at the cost of establishment risk.
- **Abubakar** balances the two by moving quickly once moisture is confirmed.

The engine can make that trade-off explicit. That is a far better product
than a date.

## 5. Soil fertility management

His account, in order:

1. **Clear bushes** and cut down excess growth before planting.
2. **Gather and burn it.**
3. **Apply organic manure** (locally *takin Hausa*, animal manure).

> "Burning organic matter so it settles into the soil adds nutrients and helps
> reduce diseases and unwanted pests."

**Product implication.** His fertility practice is **manure application
plus residue burning**, with disease and pest suppression as a stated
benefit of burning. That belongs in the **management requirements** dimension
of any comparison, and it is a practice the platform should describe rather
than contradict. A rotation recommendation that assumes residue retention
would be recommending a practice change he has not asked for.

**[Open]** Burning is a contested agronomic practice and also an emissions
topic. The engine should record what he does and why, and if it raises the
topic, it must do so as a farmer-facing consideration rather than a lecture.

## 6. Willingness to adopt technology

> "Yes, they will definitely accept it, but it depends entirely on the
> approach you use to introduce it."

His formulation is more precise than the other two:

> "If the approach helps the rural community truly understand what you have
> brought, they will accept it. But if you come with an approach that a rural
> farmer cannot comprehend, they won't trust it."

**He also distinguishes adopter types:**

> "Some people will adopt an innovation immediately when you bring it, while
> others will wait and adopt it only after seeing someone else succeed with
> it first."

**Product implication.** This is a **comprehension test**, not a features
test. The interface has to be understandable on first contact to a farmer
without prior exposure. That is a concrete design constraint on the map, the
charts and the language used, and it reinforces the decision to avoid
numeric suitability scores.

## 7. Community engagement and network connectivity

**The engagement structure he describes, in order:**

1. The research sector, in this case Bayero University, invites agricultural
   extension experts.
2. The extension experts engage community leaders, village heads, religious
   leaders at mosques, and farmers' association leaders.

> "But if you just send someone who doesn't speak Hausa to hand out materials
> and explain things, it will be hard to gain acceptance."

**Network connectivity:**

> "You go to one area and find MTN, and another area you find Airtel... We
> don't have major network problems; there is no issue."

**Product implication, two parts.**

**Language.** The single strongest statement about adoption in the whole
dataset is that a **Hausa-speaking introducer** is what makes acceptance
possible. This bears directly on PRD OQ-1, where the Hausa interface was
deferred. It also suggests the **extension officer is the primary operator**
of the tool, not the farmer.

**Connectivity.** Connectivity is **not** the blocker the team assumed. MTN and
Airtel coverage varies by area but is adequate, and towers are reachable near
the main road. A web application is viable. Offline-first is a **nice-to-have**,
not a prerequisite, and should not displace the rotation comparison work.

## 8. Consent

| Permission | Status |
| ---------- | ------ |
| Participate in the interview | **Given.** |
| Record name | **Given.** Name and local name recorded. |
| GPS coordinates | **Not raised in this interview.** Unconfirmed. |
| Photographs | Not raised. **Unconfirmed.** |
| Publish identifiable information | **Not raised. Unconfirmed.** See the open decisions register. |

**[Open]** He owns 30 hectares and did not consent to coordinates. The consent
question is more consequential at this scale, because the location of a large
landholding is more sensitive than the location of a 2 hectare plot.

## 9. Structured extract for the engine

| Field | Value |
| ----- | ----- |
| Cropping system | Strip cropping plus intercropping, soybeans or cowpeas sown between sorghum rows. Rotation across three-hectare plots. |
| Rotation practice | **Explicit.** Sorghum and soybean plots alternate with white cowpea or maize on a two-to-three-year cycle. |
| Farms | About 30 ha, owned. Plots of about 3 ha each. Rainy and dry season. |
| Rainy season crops | Sorghum (guinea corn), beans, groundnuts, white cowpeas, maize |
| Planting trigger | **Plant quickly once the soil has good moisture from the early rains.** |
| Seed strategy | Modern varieties. Sorghum reduced from 100 to 120 days to 80 to 90 days. |
| Fertiliser practice | Organic manure (*takin Hausa*) plus burning of cleared vegetation |
| Crop names used | Sorghum / guinea corn; beans / soybeans / white cowpeas. Alias handling required. |
| Adoption pathway | University, extension experts, village heads, mosque religious leaders, farmers' association leaders. **The introducer must speak Hausa.** |
| Adoption profile | Mixed: immediate adopters and wait-for-success adopters |
| Constraints | Dry spells after early rains. Maturity risk with long-duration varieties. Connectivity varies by carrier but is workable. |
| Priorities | Maturity within the available season, managing dry spells, adapting to the new climate pattern |

## 10. Open items for this case study

- [ ] Ask whether he consents to GPS coordinates, and at what spatial precision.
- [ ] Establish the dry-season crop list, which was not covered.
- [ ] Record which dry-season crops, if any, depend on irrigation.
- [ ] Record crop yields per plot if he has them.
- [ ] Clarify whether "white cowpeas" and "soybeans" are the same crop in his
      practice or two varieties.
- [ ] Record the manure source and rate.
- [ ] Ask about pest and disease problems, since burning is described as
      reducing them.
