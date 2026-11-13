# Product Requirements Document: DalaShift

| Field             | Value                                                      |
| ----------------- | ---------------------------------------------------------- |
| Document status   | Draft for team review: Phase 1                             |
| Version           | 0.1.0                                                      |
| Last updated      | 2026-11-13                                                 |
| Working name      | **DalaShift**: provisional, not a final brand              |
| Related documents | `ARCHITECTURE.md`, `ARCHITECTURE_ESSENTIALS.md`, `docs/`   |

---

## How to read this document

Every requirement is tagged:

| Tag                    | Meaning                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| **[Confirmed]**         | Explicitly agreed in the team brief. Build against it.                |
| **[Proposed]**         | This document's recommendation. Reasonable, not yet agreed.           |
| **[Open]**              | Genuinely unresolved. Needs a decision before the relevant work starts. |

Nothing tagged **[Proposed]** or **[Open]** should be treated as committed
scope.

---

## 1. Executive summary

DalaShift is a web platform that gives a farmer, **for their own land**, an
understanding of the growing conditions and practical guidance on what to
plant and how to manage it.

The raw environmental information already exists: NASA satellite observations
of soil moisture, rainfall, temperature and vegetation; soil property maps;
agronomic research on crop requirements. What does not exist, for a
smallholder farmer in northern Nigeria, is that information turned into an
answer about *their* field, in language they act on.

DalaShift does that conversion. A farmer registers their farm, draws its
boundary on a map, states what they grow or plan to grow, and receives
environmental analysis and crop guidance tied to that polygon and that crop
situation, plus the explicit caveats that go with any figure derived from
satellite data at coarse resolution.

**The differentiator is specificity and honesty**, not imagery. Most
agricultural data tools stop at "here is a map". DalaShift's job is to answer
"what does this mean for my field, and how much should I trust it?"

---

## 2. Problem statement

### 2.1 The farmer's problem

A smallholder farmer in Kano State makes decisions that materially affect their
household income (what to plant, when to plant, whether to irrigate, whether
to change crops) with very little information beyond local observation,
memory, and advice from other farmers.

**[Confirmed]** The information that exists covers several specific gaps:

- **Soil moisture and soil conditions**: no access to the NASA SMAP or
  equivalent soil-moisture record, and no way to interpret it for their field.
- **Rainfall and precipitation patterns**: no access to accumulated rainfall,
  onset timing, or anomalies.
- **Temperature and environmental conditions**: no access to the climate
  record for their location.
- **Vegetation health**: cannot see whether their field is developing
  differently from their neighbour's.
- **Crop suitability**: if they have land but no decision, no way to know what
  would do well there.
- **Planting periods and seasonal patterns**: planting dates are often
  transmitted socially rather than derived from the local rainfall record.
- **Risk**: no early warning of drought, flood, heat stress or pest pressure.

### 2.2 The information-access problem

**[Confirmed]** These are not primarily *data availability* problems. The data
exists. The problems are:

1. **Scale mismatch.** The farmer's field is 0.5 to 20 hectares. The datasets
   are 250 m to 50 km. A soil-moisture pixel covers roughly a 9 km × 9 km
   square, over 80 km², potentially containing hundreds of farms. Delivering
   that value to a farmer as "your soil moisture" is a misrepresentation,
   whether or not the underlying number is correct.
2. **Fragmentation.** Rainfall, temperature, soil and vegetation data live in
   different services with different formats, resolutions, latencies and
   authentication.
3. **No translation to practice.** A dataset does not tell a farmer what to do
   with it.
4. **No ground truth.** Most tools infer what is being grown from location.
   Northern Nigeria's monsoon pattern means location alone cannot distinguish
   a field of millet from a field of rice, or a fallow field from a newly
   sown one.
5. **Low literacy of the interfaces.** Tools designed for analysts are not
   usable by the people the information is for.

### 2.3 What the product must not be

- A satellite image viewer with a layer switcher.
- A location-based crop guesser.
- A generic agro-advisory chatbot that answers without farm-specific data.

---

## 3. Proposed solution

A web platform where a farmer:

1. **Registers** and creates a farmer profile. **[Confirmed]**
2. **Registers one or more farms.** **[Confirmed]**
3. **Searches for their farm location** on an interactive map. **[Confirmed]**
4. **Draws the actual geographical boundary** of the farm. **[Confirmed]**
5. **Provides information about their farming activities.** **[Confirmed]**
6. **Identifies crops** currently grown, previously grown, or intended.
   **[Confirmed]**
7. **Receives environmental and satellite-based insights** specific to the
   farm. **[Confirmed]**
8. **Receives crop recommendations** based on crops, location, environmental
   conditions and agricultural knowledge. **[Confirmed]**
9. **Monitors the farm** over time. **[Confirmed]**
10. **Generates reports.** **[Confirmed]**

**[Confirmed]** The platform must prioritise practical agricultural value over
displaying satellite imagery or scientific datasets.

---

## 4. Target users

### 4.1 Primary

**[Confirmed]** **Farmers, particularly smallholder farmers**, who may not have
access to advanced agricultural information systems.

### 4.2 Secondary (post-MVP)

**[Proposed]** Agricultural researchers, agricultural extension workers, farm
managers, agricultural organisations. **[Open]** Whether any of these are
served in the MVP, or whether they are a later phase, is unresolved. The MVP
is designed so that these roles can be added without reworking the data model
(the role already exists in the access-control model), but no secondary-user
workflow is designed yet.

### 4.3 Explicit non-users for the MVP

**[Proposed]** Large commercial agritech, commodity traders, insurance
underwriting, government planning agencies. These users need different data
densities, export formats, and accuracy expectations. Serving them would
compromise the smallholder-first goal.

---

## 5. User personas

### 5.1 Mariam: the established smallholder farmer

**[Proposed persona, informed by typical northern Nigerian smallholder
practice. Must be validated with real farmers in Tofa LGA during Phase 2:
treat every attribute as a hypothesis until then.**

- **Location:** Tofa LGA, Kano State. Farm roughly 1.5 ha.
- **Crops:** millet, maize, cowpea, some vegetables in the rainy season.
- **Season:** relies on the rains. Planting timing is social, not calibrated.
- **Resources:** a smartphone with intermittent data. Does not read English
  fluently. Will not use a desktop.
- **Knowledge:** deep practical knowledge of her own land (where water
  collects, which soils crack, which pest arrives when). Does not use
  satellite data and does not need to.
- **Need:** early warning of a dry spell during establishment; an idea of
  whether this year's rains started early or late; confirmation that her
  millet field is developing normally.
- **Will not use:** a dashboard with twelve charts. Dense tables. Anything that
  requires precise typing on a small screen.
- **Success looks like:** she opens the app, sees one clear statement about
  her millet field, and changes one thing about how she farms it.

### 5.2 Usman: the prospective farmer

- **Location:** Tofa LGA. Owns or has access to 3 ha of land, currently
  fallow or under-uncertain use.
- **Crops:** undecided. Considering maize, but has heard groundnut does
  better in his sandy soil.
- **Resources:** a smartphone; occasional access to a computer.
- **Need:** which crops suit this land, given the rainfall pattern, the soil,
  and the months available.
- **Success looks like:** he gets a ranked, explained shortlist with the
  reasoning and the caveats, not a single answer presented as truth.

### 5.3 Fatima: the extension worker **[Proposed, post-MVP]**

- **Location:** covers several villages.
- **Need:** aggregate environmental context across many farms for targeted
  advice and early-warning outreach.
- **MVP status:** the data model supports this from day one. The workflow
  does not exist in the MVP.

---

## 6. Product objectives

| # | Objective                                              | How it is measured (proposed)                          |
| - | ------------------------------------------------------ | ----------------------------------------------------- |
| O1 | A farmer gets a farm-specific answer, not a regional one | Every surfaced value has a stated source and resolution |
| O2 | Recommendations traceable to inputs and rules         | 100% of recommendations carry a ruleset version and cited inputs |
| O3 | The product never overstates precision                 | 100% of environmental values carry resolution metadata; reviewed in PR |
| O4 | Usable on a mid-range Android phone on a slow connection | Core flows complete at 3G-equivalent latency; map and insights fit a 360 px viewport |
| O5 | Field validation is grounded in real farmer contact    | Structured interviews with farmers in Tofa LGA; findings documented |

**[Proposed]** O1 to O4 are engineering-quality objectives. O5 is the
validation objective. No quantitative engagement targets are set; see
§ 17 for why, and what would be needed to set them.

---

## 7. Functional requirements

### FR-1: Farmer registration and profile

| ID       | Requirement                                                                                    | Status     |
| -------- | --------------------------------------------------------------------------------------------- | ---------- |
| FR-1.1   | A visitor can create an account and authenticate.                                               | [Confirmed] |
| FR-1.2   | The platform records a farmer profile: full name, contact details, account credentials.         | [Confirmed] |
| FR-1.3   | The profile may record a preferred language.                                                   | [Confirmed] |
| FR-1.4   | The profile may record general farming experience.                                             | [Confirmed] |
| FR-1.5   | Only information with a clear product purpose is collected; the form must state why each field is asked. | [Proposed] |
| FR-1.6   | A farmer can access and edit their own profile, and can delete their account.                  | [Proposed] |
| FR-1.7   | Authentication is via Supabase Auth.                                                            | [Confirmed] |

**[Proposed] Scope note.** "Preferred language" is collected in Phase 2, but
**no translation of the interface is committed for the MVP**; the platform's
working language is English. Collecting a language preference with no effect
on the experience is a privacy cost with no user benefit. Either the MVP
ships a Hausa interface, or the field is deferred to Phase 3. See
[§ 19, OQ-1](#19-assumptions-and-open-questions).

**[Confirmed]** Account credentials are handled by Supabase Auth. DalaShift
stores no passwords.

### FR-2: Farm registration and geographical selection

| ID       | Requirement                                                                                              | Status     |
| -------- | --------------------------------------------------------------------------------------------------------- | ---------- |
| FR-2.1   | A farmer can register and manage **multiple** farms.                                                     | [Confirmed] |
| FR-2.2   | A farm has a name.                                                                                        | [Confirmed] |
| FR-2.3   | A farm has a location, expressed as geographic coordinates.                                                | [Confirmed] |
| FR-2.4   | A farm has a boundary polygon.                                                                            | [Confirmed] |
| FR-2.5   | A farm has a size in hectares.                                                                            | [Confirmed] |
| FR-2.6   | A farm records its farming method and irrigation method.                                                  | [Confirmed] |
| FR-2.7   | A farm may record soil information where known.                                                           | [Confirmed] |
| FR-2.8   | A farm may carry photographs and relevant documents.                                                      | [Confirmed] |
| FR-2.9   | The farmer can search for a location using the interactive map.                                          | [Confirmed] |
| FR-2.10  | The farmer can draw the farm boundary and review the calculated area before saving.                        | [Confirmed] |
| FR-2.11  | Required and optional fields are visually distinguished, and the platform states which information it is missing. | [Proposed] |
| FR-2.12  | A farm supports multiple plots within it, each with its own crop and cultivation information.              | [Confirmed (investigate)], see [§ 9.3](#93-plot-support) |
| FR-2.13  | A farmer can state their **priorities** for the farm, what they want the rotation or plan to achieve (soil health, water conservation, income, food security). | [Confirmed by the NASA Space Apps "Field Shift" challenge brief, which requires *"farmer priorities"*] |

**[Confirmed]** The farm's actual coordinates and polygon boundary are the
**primary reference** for all environmental analysis. Selecting an LGA does
not determine environmental conditions.

**[Proposed] Data model for required vs optional:**

*Required:* farm name, boundary polygon (or coordinates if polygon drawing is
abandoned), at least one crop or an explicit "no crop selected" state.
*Optional:* irrigation method, soil notes, photographs, documents, farming
method, preferred language, experience.

**[Proposed] Field-by-field justification**: required because the brief
requires only collecting information with a clear purpose:

| Field                     | Collected | Purpose                                                    |
| ------------------------- | --------- | ---------------------------------------------------------- |
| Full name                 | Yes       | Personalises reports; identifies the farm owner            |
| Contact (phone/email)     | Yes       | Account recovery; report delivery; field follow-up        |
| Password                  | Yes       | Account security (held by Supabase Auth)                   |
| Preferred language        | **No** (MVP) | No interface translation in the MVP; see OQ-1          |
| Farming experience        | Optional  | Allows the platform to calibrate explanation depth         |
| Farm name                 | Yes       | Distinguishes multiple farms; used in reports              |
| Location / coordinates    | Yes       | Links the farm to environmental data                       |
| Boundary polygon          | Yes       | Required for spatial aggregation; see FR-2.13              |
| Area (hectares)           | Yes (derived) | Computed from the polygon, not typed; see FR-2.14      |
| Farming method            | Optional  | Interacts with suitability rules (rainfed vs irrigated)    |
| Irrigation method         | Optional  | Determines whether rainfall sufficiency is the binding constraint |
| Soil information          | Optional  | Allows farmer-observed soil to override the coarse model   |
| Photographs / documents   | Optional  | Visual record; future evidence for crop identification     |

### FR-3: Crop information

| ID       | Requirement                                                                            | Status     |
| -------- | --------------------------------------------------------------------------------------- | ---------- |
| FR-3.1   | A farmer identifies crops they **currently** cultivate.                                | [Confirmed] |
| FR-3.2   | A farmer identifies crops they **previously** cultivated.                              | [Confirmed] |
| FR-3.3   | A farmer identifies crops they **intend to** cultivate.                                | [Confirmed] |
| FR-3.4   | A farmer may record planting dates or expected planting periods.                       | [Confirmed] |
| FR-3.5   | A farmer may record harvest periods where known.                                        | [Confirmed] |
| FR-3.6   | A farmer may record the farming season.                                                | [Confirmed] |
| FR-3.7   | A farmer may record the intended use, commercial production or household consumption.  | [Confirmed] |
| FR-3.8   | A farm may contain multiple crops.                                                       | [Confirmed] |
| FR-3.9   | A farm may contain multiple plots, each with its own crop information.                  | [Confirmed (investigate)] |

### FR-4: Environmental analysis

| ID       | Requirement                                                                                        | Status     |
| -------- | ---------------------------------------------------------------------------------------------------- | ---------- |
| FR-4.1   | The platform retrieves environmental observations for the farm's polygon or centroid from NASA sources. | [Confirmed] |
| FR-4.2   | Environmental analysis covers soil moisture, rainfall/precipitation, temperature, and vegetation condition. | [Confirmed] |
| FR-4.3   | The analysis is specific to the farm's coordinates, not to the administrative area the farm lies in. | [Confirmed] |
| FR-4.4   | Every environmental value presented to the user states its source, spatial resolution and observation date. | [Proposed] |
| FR-4.5   | Values that are modelled or interpolated are labelled as such, distinct from direct observation.    | [Confirmed] |
| FR-4.6   | Where a source's resolution is much coarser than the farm, the interface says so explicitly.        | [Proposed] |
| FR-4.7   | Retrieved observations are cached, with the observation date preserved through the cache.            | [Proposed] |
| FR-4.8   | The farm can be monitored over time, showing how conditions change.                                 | [Confirmed] |

**[Proposed] The honesty requirement (FR-4.4 to FR-4.6) is the product's
central technical constraint.** The interface design must make "how precise is
this?" a first-class piece of information, not a footnote in a methodology
page. A farmer looking at a 9 km soil-moisture pixel must understand that it
describes their neighbourhood, not their plot.

### FR-5: Recommendations

| ID       | Requirement                                                                                          | Status     |
| -------- | -------------------------------------------------------------------------------------------------------- | ---------- |
| FR-5.1   | Recommendations are based on **farmer-provided information**, what is grown, intended, and how it is managed. | [Confirmed] |
| FR-5.2   | Recommendations are based on **farm-specific environmental information**.                                | [Confirmed] |
| FR-5.3   | Recommendations are based on **agricultural knowledge**, crop requirements, planting calendars, research. | [Confirmed] |
| FR-5.4   | The three categories are **combined**, not drawn from a single dataset.                                  | [Confirmed] |
| FR-5.5   | If a farmer grows maize, maize-related insights are prioritised.                                        | [Confirmed] |
| FR-5.6   | If a farmer intends to plant rice, relevant environmental conditions are assessed against rice requirements. | [Confirmed] |
| FR-5.7   | If no crop is selected, the platform provides a crop suitability assessment with clearly stated limitations. | [Confirmed] |
| FR-5.8   | If information is insufficient for a reliable recommendation, the platform **communicates that limitation** rather than inventing an answer. | [Confirmed] |
| FR-5.9   | Recommendations are differentiated between **existing farmers** and **prospective farmers**.             | [Confirmed] |
| FR-5.10  | Every recommendation cites the inputs and rules that produced it.                                       | [Proposed] |
| FR-5.11  | Recommendations record the ruleset version that produced them.                                           | [Proposed] |
| FR-5.12  | The product never claims NASA directly provides crop recommendations.                                    | [Confirmed] |

**[Proposed] The two recommendation scenarios are treated as distinct product
paths**, not a toggle:

| | Existing farmer | Prospective farmer |
|---|---|---|
| Question | "How do I do this better?" | "What should I do?" |
| Input | Confirmed crops | No crop selected |
| Output | Per-crop management guidance | Ranked crop shortlist |
| Temporal frame | Current season | Next season |
| Primary uncertainty | Management quality | Whether the crop will succeed at all |

### FR-6: Reports

| ID       | Requirement                                                                  | Status     |
| -------- | ---------------------------------------------------------------------------- | ---------- |
| FR-6.1   | The platform generates reports containing farm information and analysis.      | [Confirmed] |
| FR-6.2   | A report covers a defined farm and period.                                   | [Proposed] |
| FR-6.3   | A report includes the environmental analysis and current recommendations.     | [Proposed] |
| FR-6.4   | A report includes source attribution for all data used.                      | [Proposed] |
| FR-6.5   | A report is downloadable or printable and shareable with a farmer who is not a registered user. | [Proposed] |

**[Proposed]** FR-6.5 matters: the most likely real-world use of the report is
a farmer or extension worker printing it and handing it to someone else.
A report that only exists inside an authenticated session has limited value.

### FR-7: Monitoring

| ID       | Requirement                                                                    | Status     |
| -------- | ------------------------------------------------------------------------------ | ---------- |
| FR-7.1   | The farmer can see how conditions on their farm change over time.               | [Confirmed] |
| FR-7.2   | Historical comparisons are framed against the farm's own record and against a climate baseline. | [Proposed] |
| FR-7.3   | Where a source has limited historical depth, the interface does not imply a longer record exists. | [Proposed] |

**[Proposed]** FR-7.2's "climate baseline" is the climatology product (multi-year
average for the grid cell), which is what makes a single wet or dry year
interpretable. A 2026 rainfall bar chart on its own is not actionable.

---

## 8. Non-functional requirements

### 8.1 Performance

| ID      | Requirement                                                                   | Status     |
| ------- | ----------------------------------------------------------------------------- | ---------- |
| NFR-P1  | Map interaction stays responsive on a mid-range Android device.               | [Proposed] |
| NFR-P2  | Initial page load is usable over a slow (3G-equivalent) connection.            | [Proposed] |
| NFR-P3  | An analysis that requires external API calls completes within a defined timeout, with a clear progress state. | [Proposed] |
| NFR-P4  | Repeated requests for the same farm/period return from cache in under 1 second. | [Proposed] |
| NFR-P5  | Map drawing does not re-request environmental data; the boundary is drawn locally and the area computed on the client for preview, then confirmed in PostGIS. | [Proposed] |

### 8.2 Usability and accessibility

| ID      | Requirement                                                                  | Status     |
| ------- | ---------------------------------------------------------------------------- | ---------- |
| NFR-U1  | The interface works across desktop, laptop, tablet and mobile.               | [Confirmed] |
| NFR-U2  | Mobile is the primary target, not an afterthought.                            | [Proposed] |
| NFR-U3  | Colour contrast meets WCAG 2.1 AA for text and meaningful graphics.          | [Proposed] |
| NFR-U4  | All interactive elements are keyboard reachable with a visible focus state.  | [Proposed] |
| NFR-U5  | Every data view has a clear loading, error and empty state.                   | [Proposed] |
| NFR-U6  | Charts have accessible text alternatives conveying the same information.      | [Proposed] |
| NFR-U7  | The map has a non-map fallback path for core information (list/table view).   | [Proposed] |

**[Proposed] NFR-U7 matters.** Map-based interaction is a known barrier for
users with low digital literacy and for users on very low-end devices. If the
only way to see rainfall for a farm is to draw a polygon on a slippy map, the
product fails its primary user.

### 8.3 Security and privacy

| ID      | Requirement                                                                  | Status     |
| ------- | ---------------------------------------------------------------------------- | ---------- |
| NFR-S1  | Row Level Security restricts every farmer to their own records.               | [Confirmed] |
| NFR-S2  | No secret reaches the client bundle.                                          | [Confirmed] |
| NFR-S3  | All external inputs are validated server-side.                                 | [Proposed] |
| NFR-S4  | No personal data or farm geometry is committed to the repository.              | [Confirmed] |
| NFR-S5  | External data sources carry documented licence and attribution obligations, and attribution is rendered in-product. | [Proposed] |

### 8.4 Integrity and honesty

| ID      | Requirement                                                                                | Status     |
| ------- | ---------------------------------------------------------------------------------------------- | ---------- |
| NFR-H1  | No environmental value is presented without its source, spatial resolution, temporal resolution and observation date. | [Proposed] |
| NFR-H2  | Modelled/interpolated values are labelled distinctly from direct observation.                 | [Confirmed] |
| NFR-H3  | Validation claims are scoped to where field validation actually occurred.                     | [Confirmed] |
| NFR-H4  | The platform never implies NASA endorsement or partnership.                                  | [Proposed] |
| NFR-H5  | The recommendation engine is deterministic; the same inputs always produce the same output.    | [Proposed] |

### 8.5 Maintainability

| ID      | Requirement                                                                           | Status     |
| ------- | ----------------------------------------------------------------------------------------- | ---------- |
| NFR-M1  | The repository builds, lints, type-checks and tests green from a clean clone.          | [Proposed] |
| NFR-M2  | All external API calls are behind a single integration module per source, with timeouts, retries and caching. | [Proposed] |
| NFR-M3  | Database schema changes are applied only through versioned migrations in the repository. | [Proposed] |
| NFR-M4  | The codebase follows the conventions in `AGENTS.md`.                                    | [Proposed] |

---

## 9. Detailed domain considerations

### 9.1 The two recommendation scenarios

**[Confirmed]** These are not identical. See the comparison table in FR-5.

**[Proposed]** Product structure: a farmer reaches a decision point during
onboarding (*"Do you already farm this land?"*) and the dashboard is
organised differently from then on. An existing farmer lands on "your farms and
their current condition"; a prospective farmer lands on "choose a field, see
what suits it". **[Open]** Whether this is a hard fork in the onboarding flow or
a self-selected toggle on the dashboard; see OQ-2.

### 9.2 Crop lifecycle modelling

**[Proposed]** A crop record carries a **status** (`current`, `previous`,
`planned`) rather than three separate tables, plus a planting date, an expected
or actual harvest date, and the intended use. This keeps history queryable
without a join table and lets a single record move from `planned` → `current`
→ `previous` over time.

**[Proposed]** `intended_use` (`commercial`, `household`, `both`) affects the
recommendation weighting: a commercial grower is more exposed to yield
variability and therefore benefits more from risk framing; a household grower
may have a different risk tolerance entirely (food security). **[Open]** How
strongly this should affect the output; see OQ-3.

### 9.3 Plot support

**[Confirmed as "investigate"]**: whether to support multiple plots within one
farm.

**[Proposed]** Yes, at the data-model level, from day one. The cost is one extra
entity (`farm_plots`) and a nullable `plot_id` on the crop record. The
alternative (adding plots later) requires backfilling crop records and
recomputing every historical analysis, which is materially more work during a
hackathon than carrying an extra nullable column now.

**[Proposed]** The MVP *interface* can expose plot-level entry as a simple
repeated row ("Plot 1, 0.8 ha, millet") without a dedicated map-drawing mode
per plot. Plots can be added to the map as additional polygons in a later
phase.

### 9.4 The farmer-context problem in a multi-crop, multi-plot farm

**[Proposed]** When a farm has several crops across different plots, a single
"farm rainfall" number is ambiguous. The analysis should be computed **per
crop context** (the plot, or the centroid of the crops concerned) and presented
as "for your millet plot" rather than "for your farm". This is a meaningful
design constraint on the dashboard, not a detail.

**[Proposed]** Where crops span plots with different conditions, the platform
should present the farm-level value as a range across plots, not a single
average. An average over 20 km of farms is less meaningful than the spread.

### FR-8: Crop rotation strategy comparison

> **Added after reading the official NASA Space Apps 2026 "Field Shift:
> Adapting Farms with NASA Data" challenge statement** (verified 2026-11-13,
> <https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/>).
>
> The challenge requires: *"You may compare at least three rotation strategies,
> including the existing rotation. For each strategy, you may explain why it was
> suggested, what evidence supports it, what benefits it may offer, where
> information gaps exist, and any risks that would need local review by
> farmers or agricultural experts."*
>
> This was **not** in the original Phase 1 scope and is now a hard requirement
> of the challenge we are entering.

| ID       | Requirement                                                                                                    | Status     |
| -------- | ---------------------------------------------------------------------------------------------------------------- | ---------- |
| FR-8.1   | The platform identifies the farmer's **existing rotation** from their crop history, current, previous and planned crops on the farm. | [Confirmed] |
| FR-8.2   | The platform generates **at least three alternative rotation strategies** in addition to the existing one.            | [Confirmed] |
| FR-8.3   | Each strategy states **why it was suggested**, the evidence from the farm's environment, the crop requirements and the farmer's stated priorities. | [Confirmed] |
| FR-8.4   | Each strategy states **what benefits it may offer**, e.g. improved soil organic carbon, better water use, spread rainfall risk, a different harvest window. | [Confirmed] |
| FR-8.5   | Each strategy states **where information gaps exist**, the explicit limitations of the evidence behind it.          | [Confirmed] |
| FR-8.6   | Each strategy states **any risks that would need local review** (by farmers or agricultural experts).                | [Confirmed] |
| FR-8.7   | The existing rotation is presented **on equal terms** with the alternatives, not as a baseline to beat.           | [Proposed] |
| FR-8.8   | Strategies are ranked, but the ranking is accompanied by the farmer's stated priorities, and the farmer can change what they optimise for. | [Proposed] |
| FR-8.9   | A rotation strategy is expressible as an ordered sequence of crops across seasons, optionally over multiple plots. | [Proposed] |

**[Proposed] Why this fits the existing architecture.** A rotation is a set of
crop assessments plus rotation-specific rules. The rules engine already scores
a crop against a farm's conditions; a rotation strategy adds:

1. **Sequence rules**: e.g. a legume following a cereal may contribute to soil
   nitrogen; a cereal after a cereal may draw down soil nitrogen.
2. **Seasonal fit**: every crop in the sequence must fit the local growing
   calendar.
3. **Portfolio effects**: e.g. staggering planting dates spreads the risk of
   a single dry spell hitting every crop at once.
4. **Priority weighting**: the farmer's stated goals (FR-2.13) shift the
   weights between dimensions.

This is an **extension of the recommendation engine**, not a new subsystem.
**[Proposed]** The MVP should support **two- or three-season rotations** with
a fixed crop sequence. A full multi-year rotation optimiser is out of scope.

**[Proposed] Risk.** Rotation advice is the most agronomically demanding thing
this product can say. A wrong rotation recommendation could cost a farmer a
season. Mitigations, in order of importance:

- Every rotation claim cites the crop requirements it used, and those
  requirements are individually sourced.
- The **existing rotation** is always shown first, and the interface never
  implies the alternatives are better, only *different*.
- Every strategy carries the mandatory "requires local review by an
  agricultural expert" statement. This is required by the challenge brief and
  is also the honest thing to say.
- The rotation's **limitations are stated explicitly**, not buried.

---

## 10. User journeys

### 10.1 Journey A: Mariam, an established farmer

1. **Arrives** at the landing page; creates an account with name and phone.
2. **Onboards.** Is asked what she farms (millet, maize, cowpea), whether she
   has land already in use, and her preferred language.
3. **Adds a farm.** Names it, searches for the location on the map, drops a
   pin at her field, draws the boundary, and sees **1.4 hectares** calculated
   and offered for confirmation.
4. **Adds her crops.** Selects millet and cowpea, records that millet was
   planted in May and expects harvest in August, marks cowpea as intended.
5. **Sees her farm.** A single page: conditions for her millet plot, how the
   season is tracking, one or two actionable notes, and a clear statement of
   what is known and what is not.
6. **Returns in July.** The page shows how the season has developed and whether
   the rainfall has been unusual.
7. **Generates a report.** A printable summary of her farm, its conditions and
   its recommendations, with source attribution, which she takes to the
   extension worker.

### 10.2 Journey B: Usman, a prospective farmer

1. **Arrives** at the landing page; creates an account.
2. **Onboards.** States he has land but has not decided what to plant.
3. **Adds a farm.** Draws the boundary of his 3 ha of fallow land.
4. **Receives a suitability assessment.** A ranked shortlist of crops that suit
   his land, each with: the reasoning, the confidence, and the caveats, for
   example "soil moisture is a regional estimate at 9 km resolution, so this
   ranking may shift once you tell us how you irrigate."
5. **Refines.** He adds that the land is rainfed, and the assessment updates.
6. **Decides** to plant groundnut and registers it as a planned crop.
7. **Returns next season** to monitor it.

### 10.3 Journey C: the farmer with insufficient data

1. **Marius** adds a farm boundary in a region where the vegetation product has
   a long gap in coverage.
2. **The platform says:** "Satellite vegetation data for this area is missing
   between March and June 2026. Rainfall and temperature are available."
3. It presents what it has, marks the gap, and adjusts the confidence of the
   recommendation accordingly, rather than showing a flat line that implies
   no change.

**This journey is a first-class requirement, not an edge case.** It is the
journey that proves the product is honest.

---

## 11. MVP scope

### 11.1 In scope

**[Confirmed]** unless marked otherwise.

| # | Capability                                                                | Notes                                        |
| - | ------------------------------------------------------------------------- | -------------------------------------------- |
| 1 | Farmer registration and authentication                                    | Supabase Auth                               |
| 2 | Farmer profile                                                            | Name, contact, language, experience         |
| 3 | Farm registration: name, location, boundary polygon, derived area         | Map-based                                   |
| 4 | Farm details: farming method, irrigation, soil notes, photographs         | Optional fields clearly marked              |
| 5 | Crop records: current / previous / planned, planting date, season, intended use | Multiple crops per farm                  |
| 6 | Plot support at the data-model level                                      | [Proposed]                                  |
| 7 | Environmental analysis: soil moisture, rainfall, temperature, vegetation  | NASA sources                                |
| 8 | Time series of environmental conditions for a farm                        |                                            |
| 9 | Crop recommendations for existing farmers                                 | Deterministic rules engine                 |
| 10 | Crop suitability assessment for prospective farmers                        | Ranked shortlist                            |
| 11 | Limitations and confidence surfaced in every recommendation                |                                            |
| 12 | Farm reports                                                              | Printable/shareable                         |
| 13 | Map: search, draw boundary, area preview                                  | MapLibre                                    |
| 14 | Responsive, accessible interface                                          | Mobile-first                                |
| **15** | **Crop rotation strategy comparison**: existing rotation plus ≥ 3 alternatives, each with evidence, benefits, information gaps and risks | **Required by the "Field Shift" challenge brief** |
| **16** | **Farmer priorities** captured and used to weight the recommendations    | **Required by the challenge brief**          |

### 11.2 Explicitly out of scope for the MVP

**[Proposed]**: items that could plausibly be mistaken for in-scope:

| Excluded                                    | Why                                                                   |
| ------------------------------------------- | --------------------------------------------------------------------- |
| Real-time weather / forecasts               | The platform observes the past; it does not forecast. Adding a forecast source is a separate product with different validation needs. |
| Yield prediction                            | Not supportable at field scale with these data sources.               |
| Automated crop detection from imagery       | Requires labelled training data for Sahelian cropping systems; a research project, not a hackathon feature. |
| Marketplace, payments, insurance            | A different product.                                                   |
| Offline / SMS delivery                      | High value for the target user, but a separate channel requiring a provider account and budget. **[Open]**: see OQ-4. |
| Multi-user farm teams and roles             | [Proposed] defer; the role model supports adding them.                 |
| Native mobile applications                  | Responsive web is sufficient for the MVP.                              |
| Automated hardware / IoT sensor ingestion  | No hardware in scope.                                                  |
| Full i18n of the interface                  | See OQ-1.                                                             |
| Advanced machine-learning recommendations   | The rules engine is auditable and fast to correct; ML is not needed and would be harder to justify to a farmer. |

**[Proposed]** Automated crop detection is worth calling out: it is the feature
most likely to be requested by a judge and the one most likely to produce a
wrong answer. It is explicitly excluded so that nobody attempts it during the
hackathon with no labelled training data.

---

## 12. Future possibilities

**[Proposed]**: not committed, listed so the architecture does not exclude
them:

- SMS and USSD delivery of recommendations for low-connectivity farmers.
- Offline-first mobile storage with background sync.
- Automated crop-type detection from Sentinel-2 time series.
- Extension-worker dashboards with multi-farm aggregation.
- Cooperative and agritourism use cases.
- Yield modelling for specific crops at specific scales, with the limitations
  stated.
- Integration with agro-dealer networks for input recommendations.
- Localised planting calendars refined with farmer-submitted observations.
- Local-language voice guidance.
- API access for third-party agricultural applications.

---

## 13. Data sources: product requirements

**[Confirmed]** The platform uses NASA Earth observation data and other
environmental and agricultural datasets.

**[Confirmed]** NASA provides relevant Earth observation data and scientific
products. It does **not** provide crop recommendations; those require
agricultural knowledge, an appropriate methodology, and local validation.

**[Proposed]** The product-facing requirement is that the farmer never has to
think about NASA or DAACs. The platform resolves the right source, applies the
right aggregation, and presents the result in agricultural terms.

**[Open]** The specific source set for the MVP is not yet fixed. The research
in `docs/api/data-sources.md` evaluates the candidates; the selection is a
team decision recorded as an ADR. See OQ-5.

---

## 14. Non-goals

**[Proposed]**:

- Not a NASA-branded product, and no NASA endorsement is claimed or implied.
- Not a replacement for the agronomist or extension officer.
- Not a global agricultural platform on day one: Tofa LGA is the validation
  site, not the coverage map.
- Not a precision-agriculture tool for industrial farming.
- Not a data provider; the platform consumes open data.

---

## 15. Constraints

**[Confirmed]**

- The hackathon timeline is ~48 hours.
- The team is three people.
- The stack is fixed: Next.js, TypeScript, Tailwind, shadcn/ui, Supabase with
  PostGIS, Vercel, pnpm, MapLibre.
- The backend lives inside the Next.js application.

**[Proposed]** Constraints implied by the timeline:

- Anything requiring a new paid account, a quota negotiation or a multi-day
  approval process is out of scope for the MVP.
- Anything requiring a labelled training dataset is out of scope.
- Prefer sources with no authentication friction for the MVP path, and
  pre-compute what can be pre-computed.

---

## 16. Success metrics

**[Proposed]**

### 16.1 Technical

| Metric                                            | Target                |
| ------------------------------------------------- | --------------------- |
| Every environmental value carries full provenance  | 100%                  |
| Recommendations cite inputs and rules              | 100%                  |
| Analysis correctness against manual ground truth  | Verified on the validation farms |
| Build, lint, typecheck, test green                | Always                |
| External API failure rate on the demo path         | < 1%                  |

### 16.2 Validation (the metrics that actually matter)

| Metric                                                        | How measured                     |
| ------------------------------------------------------------- | -------------------------------- |
| Farmers who can find and open their own farm without help     | Observed during field sessions  |
| Farmers who correctly interpret what the platform tells them  | Ask them to explain it back     |
| Recommended actions farmers say they would actually take     | Interview response              |
| Time to first useful insight after registration              | Observed                        |
| Whether the information changes a decision                    | Interview response              |

**[Open]** Quantitative engagement targets (DAU, retention) are deliberately
not set. With a 48-hour build, a validation cohort of a handful of farmers and
no deployment runway, any number would be fabricated. Setting them would
contradict NFR-H3 and the honesty principle. If the team wants them, the
prerequisites are: a defined cohort size, a measurement method, and a
follow-up window; see OQ-6.

---

## 17. Risks

| Risk                                                                   | Impact | Likelihood | Mitigation                                                          |
| ---------------------------------------------------------------------- | ------ | ---------- | -------------------------------------------------------------------- |
| Coarse resolution presented as farm-precise                           | High   | High       | Mandatory provenance on every value; explicit resolution notices in the UI |
| Farmer misinterprets a regional value as a field measurement           | High   | High       | Plain-language resolution statements, not just metadata; validation sessions |
| Recommendations wrong for local practice (e.g. a locally adapted variety) | High | Medium     | Confidence gating, explicit "validate locally" framing, farmer-feedback loop |
| External API outage or quota exhaustion during the demo                | High   | Medium     | Aggressive caching in Supabase, pre-warmed demo data, graceful degradation |
| No auth access to a DAAC in time                                       | High   | Medium     | Verify access in Phase 1/2 day 1; prefer no-auth sources for the demo path |
| Scope creep in a 48-hour build                                         | High   | High       | Hard MVP list; anything else is cut, not deferred into the same weekend |
| Weather or access disruption at the venue                              | High   | Low        | Work offline-capable; keep data cached locally                          |
| Basemap provider blocks or rate-limits the demo                        | Medium | Medium     | Provider fallback strategy; self-hostable tiles as a backup             |
| Overclaiming validation breadth to judges                              | Medium | Medium     | Validation scoping written into the product and the pitch                |
| Building the map before the analysis                                    | Medium | Medium     | Analysis first; the map is an input device, not the product             |

---

## 18. Traceability

| Requirement group | Architecture section                                    | Database entities                                  |
| ----------------- | ------------------------------------------------------- | -------------------------------------------------- |
| FR-1              | Authentication and authorization                        | `profiles`, `farmer_roles`                         |
| FR-2              | Geospatial architecture; Database architecture          | `farms`, `farm_plots`                              |
| FR-3              | Database architecture                                   | `crops`, `farm_crops`, `growing_seasons`           |
| FR-4              | External API integration architecture; Data ingestion   | `data_sources`, `environmental_observations`        |
| FR-5              | Recommendation system architecture                      | `analyses`, `recommendations`, `recommendation_rulesets` |
| FR-6              | Storage strategy; Deployment architecture              | `reports`                                          |
| FR-7              | Data ingestion and processing                           | `environmental_observations` (time series)         |
| **FR-8**          | **Recommendation system architecture (rotation strategies)** | **`crops`, `farm_crops`, `recommendations`, `rotation_strategies`** |

---

## 19. Assumptions and open questions

### Assumptions

**[Proposed]**: these are working assumptions, not confirmed facts:

| ID       | Assumption                                                                 | If it is wrong                              |
| -------- | --------------------------------------------------------------------------- | ------------------------------------------- |
| A-1      | A farmer can access a smartphone and the internet, at least intermittently. | Channel strategy changes (SMS/USSD becomes primary) |
| A-2      | Farmers can draw a polygon, or can identify the field boundary well enough for us to correct it. | Needs an assisted data-entry flow; weakens spatial accuracy |
| A-3      | Earth observation data covering West Africa is available and current. | Core product premise fails |
| A-4      | English is workable for the MVP interface.                                   | Hausa interface becomes required, not optional |
| A-5      | Farmers will share crop and plot information if it produces something useful for them. | Adoption problem; the whole product depends on it |
| A-6      | The team's Supabase and NASA credentials can be obtained before the demo.   | Demo runs on cached/pre-computed data only |

### Open questions

| ID       | Question                                                                                       | Needs decision by             | Owner |
| -------- | ----------------------------------------------------------------------------------------------- | ---------------------------- | ----- |
| **OQ-1** | Is a Hausa interface in the MVP, or is the preferred-language field deferred?                    | Before Phase 2 build          | Team  |
| **OQ-2** | Is the existing/prospective split a hard onboarding fork or a dashboard toggle?                 | Before Phase 2 build          | Team  |
| **OQ-3** | How strongly does `intended_use` (commercial vs household) change the recommendation output?     | Before the rules engine is written | Team |
| **OQ-4** | Is SMS/USSD delivery a stretch goal or out of scope entirely?                                  | Before Phase 2 build          | Team  |
| **OQ-5** | Which specific data sources constitute the MVP source set?                                      | Before Phase 2 integration   | Team  |
| **OQ-6** | Do we set quantitative engagement targets, and if so with what cohort and window?               | Phase 3                       | Team  |
| **OQ-7** | What is the open-source license?                                                              | Before submission             | Team  |
| **OQ-8** | Is the repository public or private?                                                          | Before publication            | Team  |
| **OQ-9** | Who are the three GitHub accounts, and who owns the repository?                                | Before publication            | Team  |
| **OQ-10**| Which NASA Space Apps challenge(s) is the team entering, and which rules apply?                 | Before submission             | Team  |
| **OQ-11**| What is the final product name?                                                              | Before submission             | Team  |

**[Open]** The questions marked with **bold** are blocking for specific
deliverables and are listed in `docs/decisions/` as open ADRs.

---

## 20. Glossary

| Term                | Meaning in this document                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Farm**            | A polygon of land with one owner in this platform, with a name and metadata.                |
| **Plot**            | A sub-division of a farm that carries its own crop information.                             |
| **LGA**             | Local Government Area: a Nigerian administrative district.                                  |
| **Crop**            | A plant species/cultivar group a farmer grows or intends to grow.                           |
| **Observation**     | A value read from an external dataset for a location and time, with provenance.              |
| **Analysis**        | A computation over a farm's observations, e.g. "is rainfall sufficient for millet this season". |
| **Recommendation**  | A conclusion with reasoning, confidence and stated limitations.                              |
| **Ruleset**         | A versioned set of agronomic rules that turns inputs into recommendations.                   |
| **Provenance**      | Source, licence, spatial resolution, temporal resolution, observation date, retrieval date. |
| **Confidence**      | How much weight the recommendation deserves, given data completeness, resolution and staleness. |
| **Modelled**        | Derived by a physical/statistical model rather than directly measured.                       |
