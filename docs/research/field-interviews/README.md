# DalaShift Field Interviews

Anonymised research records from semi-structured farmer interviews conducted in
**Tofa Local Government Area, Kano State, Nigeria**.

These are the ground-truth case studies the platform is built to serve. They
are also the project's main defence against building something plausible but
wrong: every agronomic threshold, every interface assumption and every claim
about what a farmer actually needs has to survive contact with these records.

> **Anonymisation.** Three smallholders were interviewed. Their names, village,
> contact details, precise locations, holding sizes and plot-level details have
> been removed. Participants are labelled A, B and C for reference only. The
> records retain the research structure, the consent note and the aggregate
> findings, but no participant is identifiable from them.

---

## 1. What is in this directory

| Directory | Contents |
| --------- | -------- |
| [`interview-01/`](./interview-01/) | Interviewed smallholder A (anonymous). Multiple parcels, rainy season only. |
| [`interview-02/`](./interview-02/) | Interviewed smallholder B (anonymous). Rainy and dry season, wells for irrigation. |
| [`interview-03/`](./interview-03/) | Interviewed smallholder C (anonymous). Rainy and dry season, plot-level rotation. |

Each interview directory contains two documents:

| File | Purpose |
| ---- | ------- |
| `transcript.md` | The anonymised, translated interview record, section by section, as the interviewer structured it. |
| `case-study.md` | The structured extraction: practices, crop sequences, challenges, priorities, constraints and consent, with identifying details removed. |

**The audio itself is not in this repository.** See § 5. The original raw
translations were also removed because they could not be meaningfully
anonymised; these records are the committed artefacts.

---

## 2. Methodology

**Semi-structured individual farmer interviews.**

An interview guide was used as a starting point, with follow-up questions
depending on each participant's answers. The number of questions was not fixed
and participant records are not expected to contain identical responses.
Information was recorded as it arose naturally in the conversation.

That matters for how these documents should be read. A missing answer means
"not asked" or "not captured", **not** "the participant does not do this".

### The three information streams

These interviews supply the first of the platform's three input streams:

```
Farmer and farm information  ──┐
Environmental data (NASA)     ──┼──►  Rotation comparison engine  ──►  Dashboard
Agronomic knowledge base     ──┘
```

Farmer information is an **input to the comparison**, not supplementary
profile data. It establishes the baseline rotation, identifies which
alternatives are relevant, surfaces the practical risks, and sets how the
alternatives should be presented.

---

## 3. Distinguishing what kind of claim is being made

This distinction runs through every document here, and it is the one the
platform itself is built to respect.

| Source | Status | How it may be used |
| ------ | ------ | ------------------ |
| **Farmer report** | An observation, not a verified measurement | Establishes the case context, the baseline rotation, reported challenges and priorities. Must not be presented as scientific evidence. |
| **Documented agronomic evidence** | Cited, from the agronomic knowledge base | May support or contradict a rotation claim. Every claim carries its reference. |
| **Environmental observation** | A measurement or model output from a named dataset, with its real spatial resolution | Provides the geographical and climate context. Never implies farm-level precision it does not have. |

A participant saying "the rains came late this year" is a report. A NASA POWER
record showing the onset was 11 days later than the 1981 to 2025 median is a
measurement. **The two can agree, and where they do not, both are recorded.**

---

## 4. Consent

Consent was recorded per participant and is summarised in each `case-study.md`.
The permissions are tracked separately, because they are separate decisions:

| Permission | What it authorises |
| ---------- | ------------------ |
| Participate in the interview | Being interviewed and the content being used as research |
| Record personal information | Name, contact details and farm details held in the research record |
| Capture photographs | Photographs being taken and stored |
| Collect precise coordinates | GPS coordinates being recorded against the farm |
| Publish identifiable information | Name, photograph or precise location appearing in a public artefact |

**Internal research information and information authorised for public display
are different things.** The repository, the demo and the NASA submission are
public artefacts. The records published here are anonymised: no name, contact
detail or precise location appears.

---

## 5. Recording handling and privacy

**The audio is not committed to this repository.** It is excluded by
`.gitignore` along with every other audio format. Consent to be interviewed is
not consent to publish an identifiable recording, and this repository is
intended to be public for the NASA Space Apps submission.

The anonymised transcripts and structured case studies are the committed
artefacts. The original translations and any recordings were removed because
they could not be meaningfully anonymised.

The recordings were also briefly tracked by accident before the ignore rules
were added. They were removed from the working tree and purged from the git
history. See the commit history for the removal and the purge.

---

## 6. How these transcripts were produced

**The records are the team's own translations of the Hausa interviews**, not
machine transcriptions, and have since been anonymised. Section headings are
the interviewer's.

An automated transcription route was attempted first, using Whisper large-v3,
and was **abandoned**. The recordings were northern Nigerian Hausa, with
background noise, farm terminology and a partly mixed Hausa and English
register. The machine output was low to moderate quality: recognisable
structure, but frequent mishearings of exactly the content that matters here,
which is crop names, durations, ridge counts and place names. Rather than
publish a plausible-looking but unreliable transcript, the team's own
translated records were used.

**Consequence, stated plainly.** These records are a **translated secondary
record**, not a verbatim one, and they have been anonymised. The English is a
translation from Hausa, so the wording is the translator's rendering of what
was said.

What this means in practice:

- **Crop names and place names** carry the highest risk of error.
- **Numbers and durations** were stated precisely by the participants and were
  checked during translation because a slip changes the meaning materially.
  Where a figure could identify a participant, it has been withheld here.
- **Stated rules and their causal reasoning** are the most important content,
  because the whole comparison method rests on them.

### Recording characteristics

Measured before processing, one-second RMS windows. Individual recordings are
labelled A, B and C; no participant is identified.

| Recording | Noise floor | Speech level | Estimated SNR | Assessment |
| --------- | ----------- | ------------ | ------------- | ----------- |
| Interview A | -40.5 dB | -27.4 dB | 13.1 dB | Clean |
| Interview B | -36.4 dB | -25.5 dB | 10.9 dB | Clean |
| Interview C | **-26.4 dB** | -17.1 dB | **9.4 dB** | **Noisy** |

Recording C has a noise floor 10 to 14 dB above the other two and is roughly
10 dB louder overall. No recording was clipped.

---

## 7. What the interviews establish

Three smallholders, all farming in **Tofa LGA**, interviewed on the same
research programme. The findings below are the aggregate, anonymised findings
drawn from the case studies.

### 7.1 Holdings differ in scale and structure

Participants manage holdings of differing sizes, but exact figures are
withheld. All manage land as more than one parcel, and all include a rainy
season enterprise. Some also farm in the dry season using wells.

An order of magnitude separates the largest and smallest holdings. **A
recommendation for one is not a recommendation for another.** The platform
cannot assume a single scale, and the unit of management is the parcel or plot,
not the holding.

### 7.2 The participants use different planting rules

All describe the same physical situation, the rains starting and then dry
spells following. They respond to it differently.

| Participant | Stated rule |
| ----------- | ----------- |
| Interviewed smallholder A | **Wait** until the soil retains sufficient moisture from light showers. |
| Interviewed smallholder B | **Plant immediately** on the first rains, without waiting, because the season is short. |
| Interviewed smallholder C | **Prepare the land and plant quickly** once the soil has good moisture from the early rains. |

These are three coherent risk postures. Minimum germination failure, maximum
season length, and a balance between the two. **The engine's job is to help a
farmer choose between them for this field, this season.** That is a comparison
with a decision at the end. It is not a dashboard.

### 7.3 They described their own rotation rules

Two of the three stated a rotation rule in their own words, and the two differ.
One changes crop each season and rotates among cereals and millets, bringing an
earlier crop back later. The other cycles a cereal and legume sequence across
plots over a multi-year period. Specific crop lists and cycle lengths are
withheld in the anonymised records.

**These are the baseline.** The comparison engine's starting point should be
the practice actually in the field, not a rule invented by the research team.

### 7.4 Strip cropping is the system, and it is structured

Strip cropping is reported with cereals and legumes in alternate strips, in one
case separated by a millet boundary line known locally as *kalankuwa*. A stated
reason is weed suppression, soil surface protection and pest-cycle disruption,
because pests cannot find large uniform blocks of a single host crop. **That
third reason is a stated mechanism and it is testable.** It is the kind of
evidence a comparison engine needs.

Exact strip compositions and ridge counts are withheld because they could
identify a participant.

### 7.5 Adoption runs through people, and through the Hausa language

All three describe the same structure: village head, ward head, extension
officer, religious leaders, farmers' association leaders, and lead farmers
whose visible success persuades their neighbours. One participant stated that
someone who does not speak Hausa would struggle to gain acceptance.

**The extension officer appears in all three interviews as the hub.** See
[D-15](../../decisions/OPEN-DECISIONS.md#d-15-is-the-extension-officer-the-primary-operator).

### 7.6 Connectivity is not the blocker

Coverage varies by carrier but was reported as adequate. Offline-first is a
nice-to-have, not a prerequisite.

### 7.7 What they asked for

One participant responded to the idea of a 30-day rainfall outlook with strong
interest. They also described the advice farmers already act on from radio
forecasts: plant early-maturing varieties, or switch from sorghum to cowpeas,
based on expected rainfall.

**The platform would be grounding in field data the advice farmers already
act on.** See [D-07](../../decisions/OPEN-DECISIONS.md#d-07-are-rainfall-forecasts-in-scope).

---

## 8. How these records feed the product

| Interview content | Where it is used |
| ----------------- | ----------------- |
| Existing crop sequence and rotation practice | The baseline strategy in the comparison engine |
| Main crops and locally used names | The candidate set for alternatives, and the crop catalog's local names |
| Planting and harvest timing | Calibrating the locally derived planting calendar against reality |
| Reported rainfall variability and challenges | Practical risk context, and the farmer priority weighting |
| Stated production priorities | How the alternatives are ordered and explained |
| Practical constraints (seed, labour, land) | Which alternatives are realistic for this farmer |
| Willingness to consider change | Whether an alternative is presented as an option or only as background |
| Precise coordinates | The environmental context for the farm, with its real resolution. Never published. |

---

## 9. Related documentation

| Document | Relevance |
| -------- | --------- |
| [`../../product/recommendation-methodology.md`](../../product/recommendation-methodology.md) | How farmer input, environmental data and agronomic evidence combine |
| [`../../research/nigerian-agriculture.md`](../../research/nigerian-agriculture.md) | The wider regional context and its verification status |
| [`../../research/crop-calendars.md`](../../research/crop-calendars.md) | Where the planting calendar comes from and how farmer reports refine it |
| [`../../decisions/ADR-0006-data-retention-and-consent.md`](../../decisions/ADR-0006-data-retention-and-consent.md) | Data retention and consent policy |

---

## 10. Open items

- [ ] Confirm which permissions each participant granted, in particular for
      public display of a name, photograph and location. No identifying
      information is published in this repository.
- [ ] Extract the local crop names into the crop catalog so farmers can find
      their crop by the name they actually use.
- [ ] Add the remaining interview guide topics that were not covered, if a
      follow-up session is possible.
