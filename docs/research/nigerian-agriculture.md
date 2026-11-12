# Nigerian Agricultural Conditions — Research Notes

**Verification date: 2026-11-13.**

> ⚠️ **Read this with care.** This document deliberately contains **very few
> hard statistics**, because most Nigerian agricultural statistics that can be
> quoted from memory are unreliable or out of date. The verified facts are
> marked **[Verified]** with a source. Everything else is marked
> **[UNVERIFIED]** or **[To validate in Tofa]**.
>
> **The right source for the truth is a farmer in Tofa LGA.** A secondary
> source about Nigerian agriculture is a hypothesis; a farmer's account of
> their own farm is data.

---

## 1. Why this document exists

Two reasons:

1. **The product's agronomic rules need a regional anchor.** A rainfall
   requirement for millet that is right for Kansas is wrong for Kano. The
   ruleset must be calibrated to West African conditions, and the citation
   must be local or explicitly flagged as general.
2. **The team needs to know what to ask farmers.** Field validation is the
   difference between a product and a demo.

---

## 2. The Kano and Tofa context

**[Verified]** Tofa is a Local Government Area in Kano State, northern Nigeria.
**[Verified]** The Kano Space Apps Local Event is in-person at EHealth Africa,
Badawa, Kano — our field base for the hackathon weekend.

**[Verified]** The Kano event page itself describes the regional context:

> *"Northern Nigeria has a large agricultural economy. Space-based and
> Earth-observation data can contribute to solutions involving: Crop monitoring,
> Soil conditions, Drought, Irrigation, Agricultural productivity, Weather
> information, Food security"*

**[Verified]** The event page lists the priority problem areas for the region:
crop monitoring, soil conditions, drought, irrigation, agricultural
productivity, weather information and food security — plus flood monitoring,
drought prediction, desertification, extreme temperatures, climate adaptation,
water management and environmental monitoring.

**[Proposed]** This is our own team's first-party statement of regional
relevance. It is the best available local signal, and it aligns closely with
what we have built.

**[UNVERIFIED] — to be confirmed with the Local Lead and farmers:**

- Tofa LGA's specific agro-ecological zone.
- The dominant cropping systems and their typical sizes.
- Whether the area is predominantly rainfed or has irrigation.
- The main crops, by area.
- The typical planting and harvest months, locally.
- The main sources of agricultural information for farmers there.
- The biggest problem farmers would want solved.
- Whether there is an established extension service, and how farmers reach it.

---

## 3. What is known about Nigerian agriculture from public data

### 3.1 FAOSTAT — national statistics

**[Verified]** FAOSTAT provides national annual crop and livestock production,
yield, harvested area, trade and food-security indicators, from ~1961 to
present. The production domain code is `QCL`. API:
`https://faostatservices.fao.org/api/v1/`.

**[Verified] Limitations:**

- **National annual only. Not farm level, and not sub-national.** FAOSTAT
  cannot tell you about Tofa.
- **Licence: CC BY 4.0 plus FAO terms** — *"Datasets shall not be used for or
  in conjunction with the promotion of a commercial enterprise… or in any way
  that suggests that FAO endorses any specific company, products or
  services."*
- API V2 replaces V1; V1 calls are no longer supported.

**[Proposed] Use:** a national benchmark panel — *"Nigerian millet yields over
the last decade"* — and a citation for the national crop list. **Do not use
it as farm data.**

### 3.2 Nigeria NBS — state statistics

**[Verified]** The National Bureau of Statistics publishes statistical
abstracts and reports in PDF and Excel, including meteorological statistics
and state-level agricultural output.

**[UNVERIFIED]** No documented open API was found. The figures are annual and
periodic, not time series.

**[Proposed] Use:** background context for the Kano State profile in reports.
Not a data integration.

### 3.3 NiMet — the national meteorological agency

**[Verified]** Nigeria Meteorological Agency runs an AgroMet unit and publishes
an **Agrometeorological Bulletin every 10 days**, a Seasonal Climate
Prediction, a Seasonal Rainfall Prediction and 3-day forecasts. Its station
network includes **KANO**, KATSINA, KADUNA, GUSAU, NGURU, DUTSE, ILORIN,
ABUJA, BAUCHI, MAIDUGURI, MAKURDI.

**[Verified] Two access paths, both problematic:**

| Path                            | Status on 2026-11-13                                                     |
| ------------------------------- | ------------------------------------------------------------------------ |
| Documented free API (`api.nimet.gov.ng`) | **Every documented route returned HTTP 404**, including `GET /`. **Unusable.** |
| Formal data request form        | **Priced in Naira**, with client categories including NGO and Researcher. **Not instant, and not free by default.** |

**[Verified]** NiMet has a published data policy document.

**[Proposed] Two actions:**

1. **Request access.** The NGO/researcher category may be free or heavily
   discounted, and if it comes through, Kano station observations would be the
   single best local data source we could have — an actual measurement near
   the farm, rather than a 55 km grid cell. **Do this in the week after the
   hackathon; do not depend on it for the MVP.**
2. **Keep the adapter behind the integration-module interface** so it can be
   switched on without touching anything else.

### 3.4 FAO Nigeria land cover

**[Verified]** FAO Agro-informatics published 30 m Sentinel-2-based Random
Forest land cover for Nigeria, with 83 % overall accuracy and a national
legend adapted from the West African Land Cover Reference System.

**[Verified] Coverage: Kebbi, Niger, Ondo and Cross River — NOT Kano.**

**[Proposed] Use:** interesting if the pilot moves to Niger State, which borders
Kano. Not for the MVP.

### 3.5 Overture Maps and GRID3 — geography

**[Verified]** Overture Maps provides monthly OSM-derived releases with
`land_use` subtypes including **farmland, orchard, plant_nursery**,
`buildings` including farm buildings, and `places` including Farm nodes. The
requested attribution is *"Overture Maps Foundation, overturemaps.org"*.

**[Verified] Limitation:** OSM land use in rural northern Nigeria is **sparse**.

**[Proposed] Use:** to *validate* farmer-supplied polygons — e.g. flagging a
boundary that overlaps a mapped orchard — not as the primary geometry. The
farmer's drawn boundary is always authoritative.

**[Verified]** GRID3 NGA (CIESIN) provides Nigeria roads and settlement
extents under permissive terms (DOI `10.7916/b42r-6w17`).

**[Proposed] Use:** last-mile access and market distance in a future feature.

### 3.6 NASRDA

**[Verified]** Nigeria's National Space Research and Development Agency is one
of the **17 Space Agency Partners** for NASA Space Apps 2026.

**[Proposed] This is the most strategically valuable local relationship
available to us.** A Nigeria-based space agency partner is exactly who could
support a farmer-facing Earth observation product in Nigeria. **Contacting
NASRDA after the hackathon is the highest-value follow-up in this document.**

---

## 4. Regional crops — what to check

**[UNVERIFIED — to validate in Tofa]** The crop list for the ruleset must come
from the farmers, not from a national list. The national list is a starting
point for the catalog.

**Proposed] The process:**

1. Take the national crop list from FAOSTAT and the FAO land cover legend as
   a **starting candidate set**.
2. Ask farmers in Tofa what they actually grow, and in what proportions.
3. **Build the catalog from the intersection** — the crops the farmers name,
   restricted to what the regional evidence supports.
4. For each crop, record the **local name**, the scientific name, the
   varieties used, and the sowing and harvest months **as the farmers
   describe them**.

**[Proposed] The local name matters.** A catalog keyed on "millet" may miss
"shinkawa" or "katsala"; a farmer searching for their crop must find it. This
is a small, high-value detail that most platforms get wrong.

---

## 5. The growing calendar — the hard question

**[Verified]** NASA POWER gives us the **rainfall series** from 1981, which
lets us **derive** the local rainy-season onset and length for any cell.
This is the most reliable calendar we have, because it is derived from the
actual rainfall record rather than from a general statement about the Sahel.

**[Verified]** Sacks et al. (2010) provides published planting and harvesting
dates for 19 crops at 5-minute (~9 km) and 0.5° resolution, from
<https://sage.nelson.wisc.edu/data-and-models/datasets/crop-calendar-dataset>.

**[UNVERIFIED]** Whether the Sacks dataset has usable coverage over Kano
State. The dataset's readme publishes regional observation counts but **no
Nigeria-specific coverage figure**. **Download the netCDF and check for
non-null values at 12 °N / 8.5 °E before relying on it.**

**[UNVERIFIED]** IIASA agro-climatic calendars and GCPE (Global Crop
Phenology) could not be verified as publicly accessible.

**[Proposed] The resolution:** use **three** sources, and say which was used
for any given claim:

| Source              | Use                                                                 |
| ------------------- | -------------------------------------------------------------------- |
| **POWER-derived**   | The default. Rainfall onset and season length from the actual record. |
| **Sacks et al.**    | Where available and non-null — an independently published calendar.    |
| **Farmer-reported** | **The tiebreaker.** Where a farmer says they plant in May, that is the ground truth for their farm. |

**[Proposed]** Every planting window in the product should carry its source:
*"Planting window: derived from the 1981–2025 rainfall record for this area."*
or *"…from Sacks et al. (2010)."* or *"…as reported by the farmer."*

---

## 6. Validation questions for Tofa

**[Proposed] The interview guide.** These are the questions the team should
ask farmers. They map directly onto product requirements, so the answers
become product decisions.

### About the farm

1. How big is your farm? How do you measure it — hectares, acres, or
   something else?
2. Do you farm it as one piece, or in separate plots? Do the plots grow
   different crops?
3. Do you own the land or rent it? (Affects whether rotation advice is
   actionable across seasons.)
4. Is it rainfed, or do you irrigate? From where — a well, a river, a
   borehole? How often?

### About the crops

5. What did you plant this season? What did you plant last season? What
   before that?
6. **When did you plant?** Did you follow a rule (rainfall, calendar, advice)
   or a habit? *(This tests our planting-window logic against reality.)*
7. When do you expect to harvest?
8. Is this crop for the market, for the family, or both?
9. What is the local name of the crop? Do you grow more than one variety?
10. Why did you choose this crop? What made you choose it?

### About the environment

11. **When did the rains start this year?** Compared with last year?
    *(This is the single most valuable question — it tests our onset
    detection directly.)*
12. Do you know when the rains normally start?
13. Is there a period in the season when you are most worried about drought?
    When?
14. Do you know what your soil is like — sandy, clayey? Do you know the
    water-holding capacity of your soil?
15. Is there anywhere on your farm that holds water longer than elsewhere?
    *(A farmer's own micro-topography is data we cannot get from any
    satellite.)*

### About information and advice

16. How do you currently decide what to plant and when?
17. Who do you ask for advice? How do you reach them?
18. What information would be genuinely useful to you? What have you tried
    that was useless?
19. **Would you use something on your phone? What would you need it to do?**
20. Would you be willing to show us your farm on a map and talk about what
    you see?

**[Proposed]** The last two are the most important. The team's own
enthusiasm for the product is not evidence that a farmer wants it.

---

## 7. What to do with what we learn

| Finding                                              | Product change                                         |
| ---------------------------------------------------- | ------------------------------------------------------ |
| Farmers cannot draw their farm accurately            | Add the centroid + radius fallback (also fixes keyboard accessibility) |
| Farmers plant at different times than our calendar says | Add a per-farm planting-date override that supersedes the calendar |
| Farmers use local crop names                          | Add local names and aliases to the crop catalog         |
| Farmers cannot read the resolution labels            | Rewrite them in plainer language; test with them        |
| Farmers say the soil data is wrong for their land     | Add prominence to the farmer's own soil notes, and let farmer input override the model |
| Farmers want SMS, not the web                         | Scope the SMS/USSD channel (PRD OQ-4)                   |
| Farmers want their own information more than advice  | Add the "monitoring" flow more prominently              |

**[Proposed] Record every finding in `docs/product/`** as a product decision
with the date and who was interviewed, so the reasoning survives the
hackathon weekend.

---

## 8. Sources

| URL | Used for | Status |
| --- | -------- | ------ |
| <https://faostatservices.fao.org/api/v1/> | FAOSTAT API | Verified |
| <https://www.fao.org/faostat/en/docs/redoc-static.html> | FAOSTAT docs | Verified |
| <https://www.nigerianstat.gov.ng/> | Nigeria NBS | Verified |
| <https://nimet.gov.ng/datarequest> | NiMet data request | Verified |
| <https://nimet.gov.ng/weatherapi> | NiMet API docs | Verified — **all routes 404** |
| <https://data.apps.fao.org/?lang=en&share=f-06e9ea55-704c-4e3c-8bc7-785dab86906c> | FAO Nigeria land cover | Verified — **not Kano** |
| <https://central.nasrda.gov.ng/> | NASRDA | Verified — Space Agency Partner |
| <https://overturemaps.org/> | Overture Maps | Verified |
| <https://sage.nelson.wisc.edu/data-and-models/datasets/crop-calendar-dataset> | Sacks crop calendar | Verified |
| <https://www.spaceappschallenge.org/2026/local-events/kano/> | Kano event context | Verified |
