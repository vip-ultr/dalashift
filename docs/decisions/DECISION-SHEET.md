# Decision Sheet

**Fill this in and hand it back.** Every question from
[`OPEN-DECISIONS.md`](./OPEN-DECISIONS.md), with the recommended option
marked.

**Fastest path.** If you agree with everything recommended, reply with:

```
ALL RECOMMENDED
```

and then change only the ones you disagree with:

```
D-01 B (everything else as recommended)
```

**Full answer block.** Copy, edit, send back:

```
D-01 A   licence
D-02 A   visibility
D-03 C   prospective path
D-04 B   primary user
D-05 C   scoring
D-06 C   geometry
D-07 C   forecasts
D-08 C   hausa
D-09 C   farm parcels
D-10 C   planting rule
D-11 B   farmer rules
D-12 A   consent
D-13 C   data mode
D-14 B   aliases
D-15 C   extension officer

Corrections: all confirmed
```

---

## The questions

### D-01: Open-source licence

**Evidence.** NASA requires an OSI-approved licence. Without one, NASA applies
Apache 2.0 anyway.

| | Option |
| - | ------ |
| **A** | **Apache-2.0** (recommended). OSI approved, explicit patent grant, matches NASA's default. |
| B | MIT. Same permissiveness, shorter text, no patent grant. |
| C | AGPL-3.0. Network use must publish source. Compliance burden. |
| D | GPL-3.0. Copyleft for distributed use only. |

---

### D-02: Repository visibility

**Evidence.** Judges must open the code. The repo is currently private.

| | Option |
| - | ------ |
| **A** | **Public** (recommended). Required for judging. |
| B | Private. The submission link will not open. |

---

### D-03: Is the prospective-farmer path in scope?

**Evidence.** The review's product is comparison against an *existing*
sequence. The current PRD also has a suitability assessment for farmers who
have not chosen a crop.

| | Option |
| - | ------ |
| A | Drop it. Removes an entire engine branch and a dashboard path. |
| **C** | **Document as a post-hackathon phase** (recommended). No build cost now. |
| B | Keep it and build it. |

---

### D-04: Who is the primary user?

**Evidence.** All three farmers point to the extension officer as the hub.
Amina: *"I direct them to the agricultural extension officer (malamin gona)."*
Abubakar: *"if you just send someone who doesn't speak Hausa to hand out
materials and explain things, it will be hard to gain acceptance."*

| | Option |
| - | ------ |
| A | Farmer-facing, self-service. Slowest to build, weakest against the evidence. |
| **B** | **Adviser-facing over case studies** (recommended). Matches the evidence, much less to build. |
| C | Both. |

---

### D-05: Scoring

**Evidence.** The review says no arbitrary scores, percentages, confidence
values or weights. Our own methodology doc calls the 0.7 thresholds
arbitrary.

| | Option |
| - | ------ |
| A | Fully qualitative. No numbers anywhere. |
| B | Numeric as it stands. Contradicts the review. |
| **C** | **Hybrid** (recommended). Keep measured values and cited thresholds. Drop the composite score, the weights and the confidence percentage. Ranking is ordinal with a stated basis. |

---

### D-06: GPS point, drawn polygon, or both?

**Evidence.** All three consented to GPS. Interview 01's land is not
contiguous. The review: a GPS camera records a point, not a boundary.

| | Option |
| - | ------ |
| A | GPS point only. Matches the consent and the hardware. |
| B | Drawn polygon only. Best data, highest friction. |
| **C** | **Both, GPS as the default** (recommended). |

---

### D-07: Are rainfall forecasts in scope?

**Evidence.** Our PRD excludes forecasts. Interview 02 asked for exactly that:
*"If farmers get access to that, it will be tremendous."*

| | Option |
| - | ------ |
| A | Out of scope, as the PRD says. Ignores an explicit farmer request. |
| B | In scope, 30-day forecast. Needs a new API and a new correctness burden. |
| **C** | **In scope as a seasonal risk outlook** (recommended). Built from the POWER climatology and the current record. No forecast API. Framed as an outlook, never as a prediction. |

---

### D-08: Is a Hausa interface in scope?

**Evidence.** Abubakar: a Hausa-speaking introducer is what makes acceptance
possible. PRD OQ-1 currently proposes deferring it.

| | Option |
| - | ------ |
| A | English only. No translation cost. |
| B | Full Hausa interface. Best for adoption, most work. |
| **C** | **English operator chrome, Hausa field layer** (recommended). Depends on D-04. |

---

### D-09: Farm as one polygon, or a set of parcels?

**Evidence.** Bello: *"they are not located in one single contiguous piece."*
Amina has three "hectares" plus two smaller plots. Abubakar rotates per
three-hectare plot.

| | Option |
| - | ------ |
| A | One farm, one polygon. Wrong for at least one of the three. |
| B | A farm holds many geometries. Correct. |
| **C** | **A farm holds many geometries, and the parcel is the unit of analysis** (recommended). |

---

### D-10: Is the planting recommendation a date, or a trigger?

**Evidence.** All three farmers describe the same situation and give three
different rules. Bello waits for soil moisture. Amina plants immediately.
Abubakar plants quickly once moisture is confirmed.

| | Option |
| - | ------ |
| A | A calendar date. Wrong for every farmer in the dataset, in the year they describe. |
| B | One trigger for everyone. Imposes one farmer's risk posture on the others. |
| **C** | **A trigger, with the farmer's own rule as an input** (recommended). |

---

### D-11: Are farmer-stated rotation rules first-class engine inputs?

**Evidence.** Two farmers stated a rotation rule in their own words, and they
differ. The rules catalog already requires a citation for every crop.

| | Option |
| - | ------ |
| A | Published agronomy only. No valid baseline. |
| **B** | **Farmer-stated rules as a labelled source** (recommended). Each rule carries `source_type`: `farmer_report` or `literature`. |
| C | Farmer-stated rules for the baseline only. Splits the rule space. |

---

### D-12: Consent scope and what may be published

**Evidence.** Names recorded for all three. GPS explicitly consented by
Interview 01 and 02. Interview 03 did not raise it, and he owns 30 ha.
Photographs and publication consent were not raised in any interview.

| | Option |
| - | ------ |
| **A** | **Names in the public repository** (recommended, subject to actual consent). Strongest evidence for Local Impact. |
| B | Pseudonymised in the repository, named internally. Safe by default, weaker as evidence. |
| C | Case studies private, public summary only. Safest, splits the evidence. |

**Needed from you, per farmer:** what was actually consented for publication.
If you do not know, say so and I will pseudonymise and set a follow-up
question for the field visit.

---

### D-13: Environmental data mode

**Evidence.** The review prefers processing before the frontend consumes it.
The SoilGrids API is degraded and returns nulls at one of our two test
coordinates.

| | Option |
| - | ------ |
| A | On demand with caching. Always current, exposed to upstream failure. |
| B | Pre-compute the validation area only. |
| **C** | **Hybrid** (recommended). Pre-compute for the case studies, on demand for new areas. |

---

### D-14: Local crop name aliases

**Evidence.** The interviews use sorghum and guinea corn, and beans, soybeans
and white cowpeas. A crop the farmer cannot find is a crop the engine cannot
evaluate for them.

| | Option |
| - | ------ |
| A | Standard names only. |
| **B** | **Alias table with an explicit unresolved list** (recommended). |

---

### D-15: Is the extension officer the primary operator?

**Evidence.** The extension officer appears in all three interviews as the
point of contact for new seeds and new practices.

| | Option |
| - | ------ |
| A | No. Farmer-facing only. Conflicts with the adoption evidence. |
| B | Yes, adviser-facing as the primary flow. |
| **C** | **Yes, and the adviser view becomes the differentiating feature** (recommended). Decide with D-04. |

---

## Part D: Corrections to confirm

These are errors in the current documentation, not choices. Confirm them, or
flag any you disagree with.

| # | Correction |
| - | ---------- |
| 1 | The rotation comparison is **three strategies in total** including the existing practice. Two alternatives, not three. |
| 2 | The interview methodology is **semi-structured and already conducted**. The 20-question guide in the research notes is replaced by a record of what was done. |
| 3 | Farmer information is an **input to the comparison**, not profile data. |
| 4 | GPS is a **point**. Farm boundaries are a separate, later capability. |
| 5 | Environmental observations carry their **actual** spatial resolution. |
| 6 | **Tofa LGA**, and **Doka** specifically, is the confirmed case-study location. |
| 7 | Farmer reports are **distinguished** from agronomic evidence and from environmental measurements. |
| 8 | The PRD, architecture, methodology and implementation plan describe **the same product**. |

**Reply:** `Corrections: all confirmed`, or list the numbers you dispute.

---

## Part E: Verification actions to assign

Not decisions. Tell me who takes each, or do it yourself.

| # | Action |
| - | ------ |
| V-01 | Collect the consented GPS coordinates for Interviews 01 and 02 |
| V-02 | Ask Interview 01 whether he rotates between seasons or only intercrops |
| V-03 | Establish the local crop names, and whether white cowpea and soybean are the same crop |
| V-04 | Record ridge length and plot dimensions for Interview 02 |
| V-05 | Confirm whether the well-water constraint is local to Interview 01's parcels |
| V-06 | Record what "quality" means to the inspecting buyer |
| V-07 | Ask all three farmers about a 30-day rainfall outlook |
| V-08 | Ask all three farmers what a good planting rule looks like on a phone |
