# Recommendation Methodology

**Status: qualitative method accepted in ADR-0011.**

Companion: [ADR-0004](../decisions/ADR-0004-rules-based-recommendation-engine.md), [ADR-0011](../decisions/ADR-0011-product-direction-after-field-interviews.md), [data sources](../api/data-sources.md), [PRD](../../PRD.md) FR-5.

## 1. What an assessment contains

A crop assessment contains a verdict, a rationale, limitations, a ruleset version, and one record for each assessed dimension. Each dimension record carries the environmental value, its unit and source, observation date, the cited crop requirement, a status and an explanation.

Values may appear only when they are measurements or sourced requirements. The engine never combines them into a composite score. It has no weights, confidence percentage, or numeric verdict threshold.

Evidence strength is strong, moderate or weak, always with a reason. Missing, stale, modelled, coarse or partial evidence is named in the limitations. If the available evidence cannot support a conclusion, the verdict is insufficient information.

## 2. Inputs

The engine combines three labelled kinds of input:

1. Farmer-provided information: crops, planting dates, seasons, farming and irrigation methods, priorities and the farmer's own planting trigger.
2. Environmental observations: rainfall, temperature, soil moisture and soil properties, each with complete provenance and resolution.
3. Cited agricultural knowledge: crop requirements and rotation rules, each linked to its source.

Farmer reports are not presented as published agronomy. The platform never guesses the farmer's crops.

## 3. Dimension assessment and verdict

Each value is compared independently with a cited requirement. The result is pass, fail, uncertain or not assessed. Missing values are not replaced with zero. A missing crop requirement is not treated as evidence that a crop passes.

Hard constraints are evaluated first. A clear failure with adequate evidence can produce not suitable. A failure with coarse or uncertain evidence produces conditional and explains the uncertainty. Missing evidence for a required hard constraint produces insufficient information. If all required hard constraints pass, the verdict can be suitable. No result in another dimension overrides a clear hard-constraint failure.

The dimensions are rainfall, temperature, water availability, soil match, season length, vegetation condition, rotation fit and management requirements. A dimension is assessed only when the needed observation and a cited requirement are available.

## 4. Evidence strength and limitations

Evidence strength is a qualitative label, not a calculation. Its reason names the evidence used and its gaps. The ruleset must not assign a percentage or quietly convert resolution into a score.

Every assessment carries limitations that describe the actual gaps. These can include coarse resolution, missing data, stale observations, modelled values, partial coverage, unknown farmer input, an uncited or non-local requirement, or a need for local review. A POWER value describes a regional grid cell, not a small farm measurement. SoilGrids values are model predictions, not soil samples.

## 5. Farmer priorities and ordering

Farmer priorities affect which dimensions are surfaced first and can inform the stated ordering basis for alternatives. They do not change measurements, statuses or verdicts. The output explains the connection, for example, that a strategy is listed first because the farmer said water conservation matters.

When available evidence and stated goals cannot separate two candidates, the engine reports a tie and says what additional evidence could help. It does not use an arbitrary numeric margin.

For rotation comparison, the engine first considers the least suitable crop
assessment in each strategy, then compares dimension statuses in the order
derived from the farmer's supported goals. A pass may separate two strategies.
Fail and not assessed are both limitations and do not create a favorable
ordering. Goals without relevant evidence are named as limitations and do not
affect the rank.

## 6. Suitability assessment

A farmer who has not chosen a crop receives a suitability assessment, not an assumed crop recommendation. Candidate crops come from the cited catalog and are filtered by applicable region. Every candidate is assessed with the same dimension rules. The output is an ordinal shortlist with its ordering basis. If the catalog has no locally applicable, cited requirement, the engine reports insufficient information instead of filling the gap.

## 7. Rotation comparison

The existing farmer-reported practice is included as the baseline. Alternatives are generated only from explicit rotation rules and crop catalog entries. Each strategy explains why it was suggested, what evidence supports it, possible benefits, information gaps and risks needing local review.

Every crop in every strategy uses the same assessment logic. Farmer-reported rotation rules remain labelled as farmer reports. The engine does not claim a yield increase or assume an agronomic mechanism that its source did not establish.

The planting recommendation is a condition, never a date. The farmer's stated trigger selects and orders the planting strategy: wait for confirmed moisture, plant on the first rains, or prepare and plant quickly. The output states the risk trade-off.

## 8. Crop catalog and ruleset

The crop catalog is versioned and stored in the repository before it is seeded into Supabase. Every agronomic value must carry a claim, source type, source URL, access date and citation. General references are identified as such and are not described as locally validated.

A ruleset has an immutable version identifier. Every assessment and stored comparison retains the version that produced it. Changes to comparison rules require a version change. Farmer reports and literature remain separate source types.

The catalog currently has no agronomic values seeded. The interviews establish crop names, aliases and farmer practices, but they do not establish all temperature, rainfall, soil or water requirements. Those values must wait for cited sources.

## 9. What the engine does not do

- Predict yield at field scale.
- Recommend a specific variety without local trial evidence.
- Diagnose disease from imagery.
- Give a spray or input schedule.
- Present a seasonal risk outlook as a weather forecast.
- Use an LLM to create a score, verdict, number or agronomic claim. An LLM may only rephrase engine output.

## 10. Validation

Before recommendations are used with farmers, compare the recorded baseline with the farmer's actual practice, ask farmers to explain the assessment in their own words, and record disagreements as ruleset issues. Field validation claims remain limited to the Tofa LGA work actually completed.
