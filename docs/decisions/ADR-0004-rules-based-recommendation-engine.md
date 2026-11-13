# ADR-0004: Deterministic Rules-Based Recommendation Engine

| Field    | Value                                                              |
| -------- | ------------------------------------------------------------------ |
| Status   | Accepted                                                          |
| Date     | 2026-11-13                                                        |
| Deciders | Team                                                              |
| Related  | `ARCHITECTURE.md` § 9, `PRD.md` FR-5, `docs/product/recommendation-methodology.md` |

---

## Context

DalaShift must produce crop recommendations that combine three information
categories ([PRD](./../../PRD.md) § 4):

- **A.** Farmer-provided information: crops grown, intended, and managed.
- **B.** Farm-specific environmental information: rainfall, temperature, soil
  moisture, soil properties, vegetation condition.
- **C.** Agricultural knowledge: crop requirements, planting calendars,
  research.

The engine must be:

1. **Explainable**: a farmer (and a judge) can see why.
2. **Correctable**: when a threshold is wrong, the team fixes it in minutes.
3. **Deterministic**: the same inputs always give the same answer.
4. **Honest**: it states when it does not know.
5. **Non-fabricating**: it cannot invent an agronomic fact.

Additionally, the team has ~48 hours and no labelled training data.

### Decision criteria

| Criterion                     | Weight |
| ----------------------------- | ------ |
| Explainability and auditability | High |
| Correctability by the team    | High   |
| Determinism                   | High   |
| Time to build                 | High   |
| Quality of the output         | Medium |

## Options considered

### Option A: Deterministic, versioned rules engine

- **Description:** A catalog of crop requirements (temperature band, rainfall
  band, growing-period length, soil pH/texture/drainage preferences, water
  demand, planting window), each with a source citation. The engine applies
  hard constraints and weighted scoring dimensions to the farm's data and
  observations, producing a verdict, per-dimension sub-scores, a rationale, a
  limitations list and a confidence value.
- **Advantages:** Fully explainable: every verdict traces to a named input and
  a named rule. A wrong threshold is a one-line edit in a JSON file. Fully
  deterministic. Cannot hallucinate an agronomic requirement, because it can
  only use requirements present in the cited catalog. Fast to build and to
  debug. The output is inspectable by a judge, which matters for a hackathon
  demonstration.
- **Disadvantages:** The catalog must be built and cited (real work). The
  engine encodes the team's current agronomic understanding; if that
  understanding is wrong, the output is wrong. Coverage is limited to the
  crops in the catalog.
- **Risks:** The catalog becomes a hidden bottleneck. Mitigated by starting
  with the crops actually grown in the validation area.

### Option B: Machine-learning model trained on historical yield/observation data

- **Advantages:** Could capture interactions the rules miss.
- **Disadvantages:** Requires a labelled dataset of crop-environment-yield
  outcomes for the target region. None is available to the team at
  hackathon scale. Training, validation and explainability (SHAP at best) all
  consume the entire timeline. Model output would be unauditable by a
  farmer or judge.
- **Risks:** Total failure to deliver. Cannot be defended as "agricultural
  knowledge"; it is pattern-matching on someone else's data.

### Option C: LLM reasoning over the farm's data (retrieval-augmented)

- **Advantages:** Natural-language output; flexible reasoning; impressive in
  a demo.
- **Disadvantages:** **Non-deterministic.** May hallucinate crop requirements,
  invent thresholds, or give contradictory advice between runs. Cannot be
  guaranteed to state when it lacks data, the most important product
  requirement. Latency and cost. Unauditable. Its agronomic knowledge is
  generic, not local, and not citable.
- **Risks:** Produces confidently wrong recommendations, the worst possible
  failure for a farmer.

### Option D (Hybrid): rules engine for the verdict, LLM for the prose

- **Description:** The engine computes everything numerical and categorical.
  An LLM receives the structured result and rewrites it into plain language
  for the farmer.
- **Advantages:** Gets the strengths of both. The prose is the part where an
  LLM genuinely helps: turning "soil moisture 0.18 m³/m³, rainfall −15% vs
  climatology" into "the rains have been weaker than usual and the soil is
  drier than normal for this time of year".
- **Disadvantages:** Adds a dependency, a key, a cost and a failure mode.
- **Risks:** The LLM leaks into the verdict. Must be prevented structurally.

## Decision

**Option D, with Option A's engine as the load-bearing component and the LLM
strictly optional and structurally bounded.**

### The engine (required)

- **Deterministic and versioned.** Every recommendation stores the
  `ruleset_version` that produced it.
- **Structure:** hard constraints → per-dimension scores (0 to 1) → weighted
  total → verdict (`suitable` / `conditional` / `not_suitable` /
  `insufficient_information`) → confidence → limitations.
- **Confidence is computed separately from score.** A high score with poor
  data is not a confident answer.
- **Confidence inputs:** data completeness × resolution factor × recency
  factor × constraint certainty.
- **The catalog is versioned in the repository** as JSON/TypeScript and seeded
  into the `crops` table: auditable, diffable, correctable, and available
  offline so the demo never depends on a third-party catalog API.
- **Every value in the catalog cites a source.** An uncited requirement is a
  defect.

### The LLM (optional, bounded)

The LLM is allowed to **paraphrase**. It is not allowed to:

- produce or alter a score, a verdict or a confidence value;
- introduce a number that is not in the structured input;
- introduce an agronomic claim that is not in the input or the cited catalog.

**This is enforced structurally, not by convention:**

1. The engine returns a structured `Recommendation` object.
2. The LLM receives only that object's fields plus a strict instruction.
3. The LLM has **no tools and no data access**.
4. Its output is validated against a schema that **cannot express a number or
   a verdict**: prose only.
5. If validation fails, the raw structured output renders instead.
6. A unit test asserts the LLM path cannot change `verdict`, `score` or
   `confidence`.

**When the LLM is unavailable, the structured output renders directly.** The
product is fully functional without it.

### Explicitly not done

- No machine-learning model.
- No LLM in the scoring path.
- No LLM-generated crop requirements.
- No "chat with the farm" surface in the MVP. **[Proposed]**: it is the most
  tempting scope addition and the one most likely to produce an untraceable
  agronomic claim.

## Reasoning

The deciding factor is **auditability under a 48-hour deadline**.

A rules engine and an LLM differ not in output quality but in **where the
correction happens**. With rules, when a farmer in Tofa tells us our millet
rainfall requirement is wrong for the region, the fix is a number in a JSON
file, reviewed and merged in ten minutes. With an LLM, the same correction
requires prompt engineering, a re-test against a moving target, and an
acceptance of whatever the model says next time. During a 48-hour build with
three people and real field feedback, only the first option is viable.

The second factor is the **"state the limitation" requirement** ([PRD](./../../PRD.md)
FR-5.8). A rules engine can be *structurally* unable to produce a verdict
when a required input is missing; it is a code path, not a hope. An LLM
given the same situation will usually still produce a confident answer, with
a caveat appended. That is exactly the behaviour the product must not have.

The third factor is **judge-facing integrity**. A hackathon reviewer can read
`crops.json`, see the cited thresholds, and evaluate whether the reasoning is
sound. "We built a rules engine with a cited agronomic catalog" is a stronger
and more honest answer than "we prompted a model with satellite data".

The LLM is kept only where it is genuinely better than the alternative:
turning structured technical output into language a farmer will act on. That
is a real and non-trivial task, and it is the one place where "creative" is
an advantage rather than a risk, because the facts are already fixed and
verifiable.

## Consequences

### Positive

- Every recommendation is explainable and traceable to cited inputs and rules.
- The team can correct agronomic thresholds within minutes.
- Deterministic output: same farm, same answer, testable.
- The engine cannot produce a confident recommendation from insufficient data;
  it has a code path for that.
- The catalog is inspectable and diffable: a judge can audit it.
- The product works without any LLM provider.

### Negative / accepted costs

- The crop catalog is real work and a maintenance obligation.
- The engine encodes the team's agronomic understanding; if that is thin, the
  output is thin. Mitigated by citing sources and by conservative confidence.
- Coverage is limited to catalogued crops.
- The LLM boundary requires a schema that structurally cannot express a
  verdict: a design constraint on the output type.
- Writing the catalog's source citations takes time that does not scale with
  the number of crops; it is a per-crop cost of roughly 20 to 40 minutes with
  research.

### Follow-up work

- [ ] Build the crop catalog for the crops grown in the validation area.
- [ ] Source and cite every requirement.
- [ ] Implement the engine with the hard-constraint / score / confidence
      structure above.
- [ ] Write the LLM-boundary schema and the test that enforces it.
- [ ] Write the `insufficient_information` path before the happy path.

### Revisit when

- Labelled regional data becomes available (then a *validated* ML model may be
  layered on top of the rules engine as a feature, not a replacement).
- The catalog grows past a size where rules cannot cover the crop diversity of
  a region.
