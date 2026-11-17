# Open Decisions Register

**Purpose.** Every question the team must answer before the relevant work can
be done, in one place, with the evidence and a recommendation attached.

**Status:** Phase 1, planning. The hackathon runs 14 to 15 November 2026.
**Last updated:** 2026-11-14
**Maintained by:** the team. Decisions are recorded by amending this file and,
where a decision is architectural, by writing an ADR in this directory.

---

## How to use this document

1. Read the **Evidence** line under each decision. It points at the source.
2. Reply in the issue or in the team channel with the decision and any
   amendment to the recommendation.
3. Decisions marked **BLOCKING** have a hard deadline and cannot be deferred
   by silence.
4. Once decided, the decision is written into the relevant ADR, PRD or
   architecture document, and this register is updated to show it as closed.

**Contributors:** the three team members. Agents may prepare, analyse and
recommend, but the decisions are the team's.

---

## Decisions recorded

**All fifteen decisions were taken on 2026-11-14.** Three of them went against
the agent's recommendation, and all three add scope rather than removing it:
the prospective-farmer path is built, both user types are served, and the
comparison is fully qualitative.

The architectural decisions are recorded in
[`ADR-0011`](./ADR-0011-product-direction-after-field-interviews.md).

| ID | Decision taken |
| -- | -------------- |
| [D-01](#d-01) | **Apache-2.0.** Decision taken 2026-11-14. |
| [D-02](#d-02) | **Public.** Decision taken 2026-11-14. |
| [D-03](#d-03) | **Keep and build it.** The prospective path is in scope. Decision taken 2026-11-14. |
| [D-04](#d-04) | **Both.** The farmer and the adviser are both users. Decision taken 2026-11-14. |
| [D-05](#d-05) | **Qualitative only.** No composite score, no weights, no confidence percentage. Decision taken 2026-11-14. |
| [D-06](#d-06) | **Both, GPS as the default.** Decision taken 2026-11-14. |
| [D-07](#d-07) | **A seasonal risk outlook.** Never presented as a forecast. Decision taken 2026-11-14. |
| [D-08](#d-08) | **English operator chrome, Hausa field layer.** Decision taken 2026-11-14. |
| [D-09](#d-09) | **The parcel is the unit of analysis.** Decision taken 2026-11-14. |
| [D-10](#d-10) | **A trigger, with the farmer's own rule as an input.** Decision taken 2026-11-14. |
| [D-11](#d-11) | **Farmer-stated rules as a labelled source.** Decision taken 2026-11-14. |
| [D-12](#d-12) | **Names may be published.** Coordinates and contact details never are. Decision taken 2026-11-14. |
| [D-13](#d-13) | **Hybrid.** Pre-compute for the case studies, on demand for new areas. Decision taken 2026-11-14. |
| [D-14](#d-14) | **Alias table with an explicit unresolved list.** Decision taken 2026-11-14. |
| [D-15](#d-15) | **Both equally.** Neither user type is privileged as primary. Decision taken 2026-11-14. |

**Corrections.** All eight confirmed and applied.
**Consented GPS coordinates.** Still to be collected for Interviews 01 and 02,
see V-01 in Part E.

---

## Summary

| ID | Decision | Urgency | Recommendation | Status |
| -- | -------- | ------- | -------------- | ------ |
| [D-01](#d-01) | Open-source licence | **BLOCKING** | Apache-2.0 | Closed |
| [D-02](#d-02) | Repository visibility | **BLOCKING** | Public | Closed |
| [D-03](#d-03) | Is the prospective-farmer path in scope? | High | Drop it | Closed |
| [D-04](#d-04) | Who is the primary user: the farmer, or the adviser? | High | Adviser-facing, farmer as data subject | Closed |
| [D-05](#d-05) | Scoring: numeric or qualitative? | High | Hybrid, no composite score | Closed |
| [D-06](#d-06) | GPS point, drawn polygon, or both? | High | Both, GPS as default | Closed |
| [D-07](#d-07) | Are rainfall forecasts in scope? | High | Include a 30-day outlook | Closed |
| [D-08](#d-08) | Is a Hausa interface in scope? | High | Interface stays English, field layer Hausa | Closed |
| [D-09](#d-09) | Farm as one polygon or a set of parcels? | High | Multiple geometries per farm | Closed |
| [D-10](#d-10) | Is the planting recommendation a date or a trigger? | High | Trigger, per farmer | Closed |
| [D-11](#d-11) | Are farmer-stated rotation rules first-class engine inputs? | Medium | Yes | Closed |
| [D-12](#d-12) | Consent scope and what may be published | **BLOCKING** for publication | Confirm per farmer | Closed |
| [D-13](#d-13) | Pre-compute environmental data, or fetch on demand? | Medium | Pre-compute the validation area | Closed |
| [D-14](#d-14) | Local crop name aliases in the catalog | Medium | Yes, mandatory | Closed |
| [D-15](#d-15) | Is the extension officer the primary operator? | Medium | Yes, design for it | Closed |

**Corrections already identified and needing only confirmation** (no decision
required): the rotation strategy count is three in total including the existing
practice, not three alternatives plus it; the interview methodology is
semi-structured and already conducted, not a proposed questionnaire; farmer
information is an input to the comparison rather than profile data.

---

## Part A: Blocking decisions

### D-01: Open-source licence

**Question.** Which OSI-approved licence does DalaShift adopt?

**Evidence.** NASA Space Apps requires it. The Participant Terms and Conditions
state that original content must be *"freely available without restriction or
is licensed as open source as defined by the Open Source Initiative"*, and that
*"If you do not specify a specific OSI compliant license, NASA will distribute
your original content under an Apache 2.0 license."* This is a hard
requirement for Global Award eligibility, not a preference.
[`docs/hackathon/README.md` § 4.1](../hackathon/README.md) and
[`ADR-0001`](./ADR-0001-open-source-license.md).

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. Apache-2.0** | OSI approved. Explicit patent grant. Matches NASA's own default. Longer text. Permits closed commercial derivatives. |
| **B. MIT** | OSI approved. Shortest text. No explicit patent grant. Same permissiveness. |
| **C. AGPL-3.0** | OSI approved. Network use must publish the source. Compliance burden during a 48-hour build. May discourage adoption. |
| **D. GPL-3.0** | OSI approved. Copyleft for distributed use only. |

**Recommendation.** **Apache-2.0.** It is OSI approved, it is the licence
NASA would apply anyway, and it carries a patent grant that MIT does not. MIT
is equally acceptable and is the shorter alternative. Every dependency in the
tree has been verified compatible with both.

**Needed from the team.** A yes or no on Apache-2.0 versus MIT, and agreement
that the decision is unanimous so it can be recorded once.

**Deadline.** Before the submission closes on **15 November 2026, 23:59 local**.

---

### D-02: Repository visibility

**Question.** Does the repository go public?

**Evidence.** NASA judges must be able to open the code. The submission's
"Link to Final Project" field accepts a code repository. The repository is
currently **private**, created 13 November 2026.
[`ADR-0009`](./ADR-0009-repository-visibility.md).

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. Public** | Required for judging. The research and architecture reach the people they are written for. Everything becomes permanent. |
| **B. Private** | The team retains control. The submission link will not open for judges unless it is changed at the last minute, which is how mistakes happen. |

**Recommendation.** **Public**, and before the submission rather than during
it. The repository holds no secrets, no credentials, no real farmer audio
(the recordings were removed from tracking and purged from the git history on
13 November) and no identifying farmer data. The interview case studies are
anonymised, which settles the exposure discussed in **D-12**.

**Also note.** Branch protection on `main` is unavailable on a private
repository without GitHub Pro. Making it public enables it immediately.

**Needed from the team.** Agreement to go public, and a decision on D-12.

**Deadline.** Before the submission closes on **15 November 2026**.

---

### D-12: Consent scope and what may be published

**Question.** Which permissions did each farmer give, and what may appear in a
public artefact?

**Evidence.** All three interviews recorded a name and a location in the
research record, but the published case studies are anonymised: participants
are labelled A, B and C and no name, village, holding size or precise location
appears. Two of the three explicitly consented to GPS coordinates on the
record, but no coordinates are published here.

The review distinguishes five separate permissions: participate, record
personal information, capture photographs, collect precise coordinates, and
publish identifiable information. The first two and, for two participants, the
fourth are evidenced. The third and fifth were not raised in any interview.
Publication of identifiable information has not been granted, so the records
are anonymised by default.

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. Names in the public repository** | Strongest evidence for Local Impact. Requires confirmed publication consent. |
| **B. Pseudonymised in the repository, named internally** | Safe by default. Weaker as evidence. |
| **C. Case studies in a private repository, public summary only** | Safest, and splits the submission evidence. |

**Recommendation.** **Option B, pseudonymised in the repository, with
coordinates and contact details never published.** Publication consent was
not confirmed for every participant, so the case studies are published under
neutral labels. The anonymised records still carry the research evidence and
consent notes, and remain the strongest available evidence for the Local Impact
Award without exposing participants.

**Needed from the team.** The actual consent per participant, from whoever
conducted the interviews, kept in the internal research record.

**Deadline.** Before D-02, and before any case study is published.

---

## Part B: Scope decisions

### D-03: Is the prospective-farmer path in scope?

**Question.** Does DalaShift still serve a farmer who has land but has not
chosen a crop?

**Evidence.** The review's product is rotation comparison against an
**existing** sequence: *"The engine should compare at least three strategies in
total: 1. The farmer's existing crop sequence. 2. One evidence-supported
alternative. 3. Another evidence-supported alternative."* The review's
dashboard flow begins at *"Select or view a farmer case study"* and proceeds
from the existing practice. There is no prospective-farmer path in it.

The current PRD does have one, and it is substantial: FR-5.7, PRD § 9.4, and
Journey B in `docs/product/user-flows.md`, together with a crop suitability
assessment in the recommendation methodology.

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. Drop it** | Removes an entire engine branch, a dashboard path and a requirements block. The largest single time saving available. |
| **B. Keep it** | The suitability assessment engine must also be built, and it needs its own crop catalog breadth. |
| **C. Keep it as a documented future path** | No build cost now. The PRD describes the future. |

**Recommendation.** **Option C now, Option A if time is short.** The review
does not prohibit it, and the review's own § 2 says not to remove features
merely because they are not in the absolute minimum. But the engine that
builds the comparison should not be built twice. Document it as a post-hackathon
phase and take the time back.

**Needed from the team.** A decision.

---

### D-04: Who is the primary user: the farmer, or the adviser?

**Question.** Is DalaShift a tool the farmer opens, a tool the extension
officer uses on the farmer's behalf, or both?

**Evidence.** This is strongly evidenced in the interviews and it was not
obvious before.

**For the extension officer as the operator:**

> "If local lead farmers test it and succeed, others will naturally follow
> their example." (Interview 01)

> "People even come from neighboring towns asking about our crops and how to
> get the improved seeds, and I direct them to the agricultural extension
> officer (malamin gona) who works closely with us." (Interviewed smallholder B)

> "The research sector, like Bayero University, can invite agricultural
> extension experts to educate them. Then these agricultural experts can engage
> community leaders, village heads, religious leaders at mosques, and farmers'
> association leaders." (Interview 03)

**For the farmer as a direct user:**

> "We are ready and waiting for whatever you bring, we will accept it
> wholeheartedly." (Interview 02)

**Against a farmer-only design:**

> "But if you just send someone who doesn't speak Hausa to hand out materials
> and explain things, it will be hard to gain acceptance." (Interview 03)

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. Farmer-facing, self-service** | Full registration, authentication, self-service farm entry. Slowest to build, and weakest against the adoption evidence. |
| **B. Adviser-facing over case studies** | The extension officer loads a farmer, runs the comparison, and walks the farmer through it. Matches the evidence. Much less to build. |
| **C. Both** | Both. More to build. |

**Recommendation.** **Option B for the MVP.** The adoption evidence is
consistent across all three interviews and it points at the extension officer as
the hub of diffusion. Option B also removes most of the authentication and
self-service surface, which the review's § 5 explicitly deprioritises as
*"unnecessary user-management functionality"*. It makes the 30 day build
achievable.

**Needed from the team.** A decision. It changes the authentication model, the
dashboard structure and the case study data flow.

---

### D-07: Are rainfall forecasts in scope?

**Question.** Should DalaShift provide a rainfall forecast or outlook?

**Evidence.** This is a direct, explicit farmer request that the current PRD
excludes. PRD § 12 puts *"Real-time weather / forecasts"* out of scope, on the
reasoning that *"the platform observes the past; it does not forecast"*.

But the interviewer proposed exactly that to Interview 02:

> "That is exactly what the app will do: using satellite data and weather
> forecasts, it can show a chart or alert predicting rainfall for the next 30
> days so farmers can make informed decisions."

And her response:

> "If farmers get access to that, it will be tremendous."

She also described how farmers already get this advice, from radio forecasts
that advise early-maturing varieties or switching sorghum to cowpeas based on
expected rainfall. **The platform would be grounding in field data the advice
farmers already act on.** That is a much stronger product story than
inventing a new category of advice.

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. Out of scope, as the PRD says** | Honest, consistent with the "observe, do not predict" principle. Ignores an explicit farmer request. |
| **B. In scope, 30-day rainfall outlook** | Requires a forecast source, which is a different kind of API, a different error profile and a different validation story. |
| **C. In scope, but framed as a seasonal risk indicator, not a forecast** | Derived from POWER climatology plus the current season's record. No forecast API needed. Slower and less useful, but honest. |

**Recommendation.** **Option C for the hackathon, Option B afterwards.**
Option C is achievable from data already in hand: a seasonal outlook built
from the POWER climatology and the current rainfall record, framed explicitly
as a seasonal risk rather than a prediction. Option B is the right long-term
product and there is a usable source for it, but it adds an API dependency
and a correctness burden in a 48-hour build.

Whichever is chosen, the framing matters: an outlook derived from a climate
record is not a forecast and must not be presented as one.

**Needed from the team.** A decision, and confirmation of the framing if
Option C.

---

### D-08: Is a Hausa interface in scope?

**Question.** Does the interface ship in Hausa?

**Evidence.** PRD OQ-1 currently proposes deferring it, on the grounds that
no translation ships in the MVP and the field should therefore not be
collected.

The interviews make the case stronger than the PRD assumes:

> "But if you just send someone who doesn't speak Hausa to hand out materials
> and explain things, it will be hard to gain acceptance." (Interview 03)

> "We work with AI coding agents..." (not applicable)

The pattern across the interviews is that the **introducer** must be
Hausa-speaking and embedded in the community structure. If D-04 lands on an
adviser-facing tool, then the operator is the extension officer, who speaks
Hausa, and the interface language matters much less.

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. English only** | No translation cost. Risk: the tool is unusable by the person who introduces it if that person is not an English speaker. |
| **B. Full Hausa interface** | Best for adoption. Real translation and localisation work, and every screen needs review. |
| **C. English interface, Hausa field layer** | The farmer-facing content, the crop names, the recommendations and the explanations are in Hausa. The operator's chrome stays English. |

**Recommendation.** **Option C**, and it depends on D-04. If the tool is
adviser-facing (D-04 Option B), then Option A is defensible for the MVP and
Option C becomes the natural Phase 3 step. If the tool is farmer-facing, the
team should assume Option B is required and plan for it.

Either way, **local crop name aliases are required regardless** (D-14).

**Needed from the team.** A decision, after D-04.

---

## Part C: Architecture decisions

### D-05: Scoring, numeric or qualitative?

**Question.** Does the comparison engine produce numbers, or a qualitative
evidence-backed assessment?

**Evidence.** The review is explicit:

> "Do not introduce arbitrary numerical suitability scores, percentages,
> confidence values or unsupported weighting systems. The comparison should be
> qualitative, transparent and evidence-backed."

The current design contradicts this. ADR-0004 specifies hard constraints,
then per-dimension scores from 0 to 1, then a weighted total, then a verdict
threshold of 0.7, then a confidence value computed as a product of hand-picked
factors. `docs/product/recommendation-methodology.md` § 3.5 spells out the
formula.

Two things make the review right. First, the numbers are arbitrary, and the
project's own methodology document says so: *"Thresholds like 0.7 are
arbitrary until the ruleset has been tested against real farms."* Second, a
0.74 does not mean anything to an agronomist, and Interview 03's test is
whether a rural farmer can comprehend the output at all.

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. Fully qualitative** | No numbers anywhere. Ranking is ordinal with a stated basis and explicit ties. Honest, but comparison charts lose their magnitude. |
| **B. Numeric as it stands** | Contradicts the review. Arbitrary indices presented with false precision. |
| **C. Hybrid: keep measured values and cited thresholds, drop the composites** | The engine compares a **measured or modelled value against a sourced threshold**, for example rainfall of 620 mm against a requirement of 600 to 1200 mm. No composite score, no weights, no confidence percentage. Ranking is ordinal with a stated basis. Confidence becomes a qualitative band with a reason. |

**Recommendation.** **Option C.** It satisfies the review's instruction, which
is about *arbitrary* numbers, and it is not the same as removing numbers
entirely. The quantities that survive are measurements and cited thresholds,
which is precisely the distinction the review is drawing. The composites that
go are exactly the ones the project cannot defend.

**Consequence for the schema.** `recommendations.score` becomes null or
disappears, `confidence` becomes an enum with a reason, and `subscores` becomes
a set of per-dimension assessment records.

**Needed from the team.** A decision.

---

### D-06: GPS point, drawn polygon, or both?

**Question.** How does a farmer's location enter the platform?

**Evidence.** The review is clear that a GPS camera records a point and does
not establish a boundary, and that boundary mapping is not a mandatory initial
feature. All three farmers consented to GPS coordinates. One farmer's farm is
**not contiguous** (D-09).

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. GPS point only** | Matches the consent actually given and the hardware farmers have. Loses zonal statistics over the field. |
| **B. Drawn polygon only** | Best data. Highest friction, and it assumes a capability the review says farmers do not necessarily have. |
| **C. Both, GPS as the default** | A coordinate and its accuracy radius are captured automatically. Boundary drawing is an optional enhancement for farmers who can. |

**Recommendation.** **Option C**, with the point as the default path. It
matches what the farmers consented to and can actually do, and it keeps the
polygon available for the case studies where we can draw it ourselves.

**This changes ADR-0005.** The current aggregation strategy is polygon-centric,
with zonal statistics over the farm polygon as its core. With a point, the
rule becomes: sample at the point for coarse grids, and use the accuracy
radius to state how far the reading reaches.

**One concept must be added.** The GPS accuracy radius is the honest extent of
a coordinate. It is **different** from the dataset's spatial resolution and
different from the coverage fraction. Three separate fields:
`location_uncertainty_m`, `spatial_resolution_m` and `coverage_fraction`.

**Needed from the team.** A decision.

---

### D-09: Farm as one polygon, or a set of parcels?

**Question.** Can one farm hold more than one geometry?

**Evidence.** Participants described holdings made up of several separate
parcels, sometimes non-contiguous, with rotation and strip planning managed at
the plot level. Exact holding sizes, plot counts and verbatim descriptions are
withheld because they could identify participants.

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. One farm, one polygon** | Simple. Wrong for these cases: it loses the non-contiguous parcels entirely. |
| **B. Farm holds many geometries** | Correct. Every farm becomes a collection of parcels. The engine analyses per parcel and reports at farm level. |
| **C. Farm holds many geometries, and a parcel is the unit of analysis** | Correct and precise. More work. |

**Recommendation.** **Option C.** The data model now has `parcels` with
mandatory geometry as the unit of analysis (ADR-0011). The interviews show the
parcel is the real unit of management, with rotation and strip planning done
per parcel.

**Needed from the team.** A decision. It changes the schema, not just the
wording.

---

### D-10: Is the planting recommendation a date, or a trigger?

**Question.** What does the engine actually recommend when a farmer asks when
to plant?

**Evidence.** This is the most valuable product finding in the dataset, and it
is invisible without the interviews.

All three farmers described the same physical situation: **the rains start,
then dry spells follow**. All three responded to it, and **all three chose a
different trigger**.

| Participant | Stated rule |
| ----------- | ----------- |
| Interviewed smallholder A | **Wait** until the soil retains sufficient moisture from subsequent light showers. |
| Interviewed smallholder B | **Plant immediately** on the first rains, without waiting, because the season is short. |
| Interviewed smallholder C | **Prepare the land and plant quickly** once the soil has good moisture from the early rains. |

These are three coherent risk postures, not three contradictions: minimum
germination failure, maximum season length, and a balance between them.

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. A calendar date** | Simple, and wrong for every participant in the year they describe. Would have told one participant to do exactly what cost others their crop. |
| **B. A single trigger for everyone** | Better, but imposes one farmer's risk posture on the others. |
| **C. A trigger, with the farmer's own rule as an input** | The recommendation is expressed as a condition, and the farmer's stated preference is respected and adjustable. |

**Recommendation.** **Option C.** A date-based recommendation contradicts the
entire premise of the product, which is that the advice should be conditioned
on the farmer's field and their own practice. It also means the soil moisture
data stops being a background context and becomes **the trigger variable**,
which is a much stronger role for the NASA SMAP data and a much clearer
justification for the NASA integration in the submission.

**Needed from the team.** A decision. It is the highest-value product
question in this register.

---

### D-11: Are farmer-stated rotation rules first-class engine inputs?

**Question.** Does the rules catalog include rules the farmers stated, or only
rules from published agronomy?

**Evidence.** Two of the three participants stated a rotation rule in their own
words, and the two differ. One changes crop each season among cereals and
millets and brings the previous crop back later. The other cycles a cereal and
legume sequence across plots over a multi-year period. Exact crop lists and
cycle lengths are withheld in the anonymised records because they could
identify a participant.

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. Published agronomy only** | More defensible academically. Ignores the practice actually in the field, and the comparison has no valid baseline. |
| **B. Farmer-stated rules as a labelled first-class source** | The baseline is the real practice. Every rule carries its provenance, whether from a farmer or the literature. |
| **C. Farmer-stated rules only for the baseline** | A compromise, but it splits the rule space in two and makes the comparison harder to explain. |

**Recommendation.** **Option B.** The rules catalog already has a
`source_citations` field and a constraint that a crop cannot be inserted
without a citation. Extend the same treatment to rotation rules, with a
`source_type` of `farmer_report` or `literature`. This directly answers the
review's instruction not to assume a rule that is not supported, because each
rule carries its own support.

**Needed from the team.** Confirmation. This one is low-risk and high-value.

---

### D-13: Pre-compute environmental data, or fetch on demand?

**Question.** How does the MVP obtain environmental observations?

**Evidence.** The review states: *"Prefer processing and preparing environmental
information before the frontend consumes it. The frontend should work with
structured, validated data rather than performing complex satellite processing
itself."* The current design fetches on demand and caches in Supabase.

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. On demand with caching** | Current design. Always current. Risks the upstream failures already measured: the SoilGrids API is degraded and returns nulls at one of our two test coordinates. |
| **B. Pre-compute the validation area** | Matches the review. Removes upstream risk from the demo entirely. Data is fixed at build time. |
| **C. Hybrid: pre-compute for the case studies, on demand for new areas** | Both. More work. |

**Recommendation.** **Option C, with B as the MVP default.** For a demo and
for the case studies, pre-computed data is safer and faster. On-demand remains
necessary for the platform to work for a farmer outside the validation area,
which the review's § 6 requires.

**Needed from the team.** A decision.

---

### D-14: Local crop name aliases in the catalog

**Question.** Does the crop catalog hold local names and aliases?

**Evidence.** The interviews use several names for what may be the same or
different crops:

| Used across the interviews | Standard name |
| ------------------------- | ------------- |
| sorghum, guinea corn | Sorghum |
| beans, soybeans, white cowpeas | Cowpea / soybean, needs disambiguation |
| groundnuts, groundnut | Groundnut |
| millet, pearl millet, late millet, shinkawa if it appears | Millet, needs distinguishing |
| peppers, bell and chili peppers | Pepper |

Interview 03 explicitly needs the distinction: *"Clarify whether 'white
cowpeas' and 'soybeans' are the same crop in his practice or two varieties"*
is on his open items list.

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. Standard names only** | The farmer does not find their crop, and the engine does not map their words to a crop record. |
| **B. Alias table, with an explicit unresolved list** | The farmer finds their crop. Unresolved distinctions stay visibly unresolved rather than being guessed. |

**Recommendation.** **Option B**, mandatory regardless of the other
decisions. A crop the farmer cannot find in the list is a crop the engine
cannot evaluate for them. The alias table is small and belongs in the
versioned catalog.

**Needed from the team.** Confirmation. Low risk, high value.

---

### D-15: Is the extension officer the primary operator?

**Question.** Is the product designed for an adviser or extension officer
walking a farmer through it?

**Evidence.** See D-04. All three farmers describe the same structure:
community leaders, ward heads, religious leaders, extension officers, and
lead farmers demonstrating results. The extension officer appears in all three
interviews as the point of contact for new seeds and new practices.

**Options.**

| Option | Consequence |
| ------ | ----------- |
| **A. No. Farmer-facing only** | Simplest. Conflicts with the adoption evidence. |
| **B. Yes, adviser-facing as the primary flow** | Matches the evidence. Needs a case study data model rather than self-service registration. |
| **C. Yes, and the adviser view is the differentiator** | Same as B, and it becomes a distinct feature worth demonstrating. |

**Recommendation.** **Option C.** This is closely tied to D-04 and should be
decided with it. If the adviser view is primary, then a case study is a
first-class object with a farmer, a set of parcels, crops, priorities and
consent, and a comparison the adviser can walk through and share.

**Needed from the team.** A decision, with D-04.

---

## Part D: Corrections to apply

These need confirmation, not a decision. Each is a correction of an error in
the current documentation.

| # | Correction | Where it is wrong now |
| - | ---------- | ---------------------- |
| 1 | The rotation comparison is **three strategies in total**, including the existing practice. Two alternatives, not three. | `PRD.md` FR-8.2 states *"at least three alternative rotation strategies in addition to the existing one"*, and the same error appears in `docs/product/user-flows.md` and `docs/hackathon/README.md`. The challenge brief says *"at least three rotation strategies, including the existing rotation."* |
| 2 | The interview methodology is **semi-structured and already conducted**. | `docs/research/nigerian-agriculture.md` § 6 presents a 20-question guide as *"the interview guide the team should ask"*. Replace with a record of what was done. |
| 3 | Farmer information is an **input to the comparison**, not profile data. | Partly true in the PRD and methodology. Needs strengthening, and D-10, D-11 and D-15 are the concrete mechanisms. |
| 4 | GPS is a **point**, and farm boundaries are a separate, later capability. | ADR-0005 is polygon-centric. See D-06. |
| 5 | Environmental observations must carry their **actual** spatial resolution. | Already correct in the schema and the methodology. Verify the implementation follows it. |
| 6 | **Tofa LGA** is the confirmed initial case-study location. | Already consistent. No specific village is published. |
| 7 | Farmer reports must be **distinguished** from documented agronomic evidence and from environmental measurements. | The distinction exists in the methodology but needs to reach the case study documents, which it now does. |
| 8 | The PRD, architecture, methodology and implementation plan must **describe the same product**. | Requires the decisions above to land first. |

---

## Part E: Verification actions

Not decisions. Work the team can assign now.

| # | Action | Why it matters | Owner |
| - | ------ | -------------- | ----- |
| V-01 | Collect the consented GPS coordinates for Interviews 01 and 02 | The case studies cannot be linked to environmental data without them | |
| V-02 | Ask whether Interview 01 rotates between seasons or only intercrops | His rotation practice is currently unknown, and it is a baseline | |
| V-03 | Establish the local crop names and whether white cowpea and soybean are the same crop | See D-14 | |
| V-04 | Confirm the ridge length and plot dimensions for Interview 02 | Converts ridge ratios into areas | |
| V-05 | Confirm whether the well-water constraint in Interview 01 is local to his parcels | A groundwater constraint is directly checkable | |
| V-06 | Record what "quality" means to the inspecting buyer in Interview 02 | Quality gates the price, so it is an economic input | |
| V-07 | Ask all three farmers about a 30-day rainfall outlook | Tests D-07 directly with the people who would use it | |
| V-08 | Ask all three farmers what a good planting rule looks like on a phone | Tests D-10 and the comprehension constraint together | |

---

## Part F: The two findings that should shape the build

Recorded here so they are not lost among the decisions.

**1. The platform's honest core is the trigger, not the chart.** All three
farmers described the same climate pattern, and all three responded with a
different rule. The engine's job is to help a farmer decide *which* rule to
use on *this* field, *this* season. That is a comparison with a decision at
the end, conditioned on soil moisture, crop duration and the farmer's own
posture. It is not a dashboard of satellite imagery.

**2. The adoption path runs through people, not through the app.** The village
head, the ward head, the extension officer, the mosque leader, the farmers'
association leader, and the lead farmer whose visible success persuades the
neighbour. The platform's role is to make that lead farmer's result
convincing and shareable. Designing for that means treating the adviser
view as the primary flow (D-04, D-15) and keeping the farmer-facing output
simple enough to be understood on first contact (D-05, D-08).

Neither of these is in the current PRD. Both come straight from the
interviews.

---

## Related documents

| Document | Relevance |
| -------- | --------- |
| [`../research/field-interviews/README.md`](../research/field-interviews/README.md) | The interview methodology and how the case studies are used |
| [`../research/field-interviews/interview-01/case-study.md`](../research/field-interviews/interview-01/case-study.md) | Interviewed smallholder A (anonymous) |
| [`../research/field-interviews/interview-02/case-study.md`](../research/field-interviews/interview-02/case-study.md) | Interviewed smallholder B (anonymous) |
| [`../research/field-interviews/interview-03/case-study.md`](../research/field-interviews/interview-03/case-study.md) | Interviewed smallholder C (anonymous) |
| [`../product/recommendation-methodology.md`](../product/recommendation-methodology.md) | The method D-05 and D-10 change |
| [`../api/data-sources.md`](../api/data-sources.md) | The datasets the comparisons are built on |
| [`../hackathon/README.md`](../hackathon/README.md) | Rules, deadlines and submission requirements |
| [`ADR-0001`](./ADR-0001-open-source-license.md) | Open-source licence |
| [`ADR-0009`](./ADR-0009-repository-visibility.md) | Repository visibility |
