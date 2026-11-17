# Agent Prompts

A ready-to-paste prompt for each person's coding agent. Each one starts from
the same rules and then narrows to one area of the codebase.

Before using any of these, read [`AGENTS.md`](../../AGENTS.md) in full. It is
the binding contract. The prompts below add area-specific context; they do
not replace it.

---

## 0. The shared preamble

Paste this into every prompt, before the area section.

```
You are working in the DalaShift repository, a farm-level agricultural
decision-support platform for the NASA Space Apps Challenge. The product
turns NASA Earth observation data into crop rotation guidance for
smallholder farmers in Tofa LGA, Kano State, Nigeria.

Read AGENTS.md in full before doing anything. Then read the documents for
the area you are touching. The rules there are binding.

The five rules that are violated most often:

1. Never call an external API from the client. All upstream calls live in
   apps/web/src/lib/integrations/ and are marked import "server-only".
2. Every environmental value carries provenance: source, licence, real
   spatial resolution, temporal resolution, observation date, retrieval
   date, whether it is modelled, and the coverage fraction. A value
   without provenance is not acceptable to store or to display.
3. PostGIS computes all geometry. ST_Area(boundary::geography) for area.
   Never trust a client-computed area.
4. The engine is deterministic and rules-based. There is no composite
   score, no weighting system, no confidence percentage and no verdict
   threshold. It compares a measured or modelled value against a cited
   threshold and states the evidence. A language model may paraphrase the
   output. It never scores and never adds a number.
5. Never write an em dash (U+2014) in any tracked text file. Run
   pnpm validate:style before you finish.

Do not expand the scope. Do not refactor code you were not asked to touch.
Do not add a dependency without checking it against the licences in
THIRD_PARTY_NOTICES.md.

When you are done, run: pnpm format:check, pnpm lint, pnpm typecheck,
pnpm test, pnpm validate:links, pnpm validate:style.

If a decision is genuinely yours to make, make it and say what you did.
If it belongs to the team, list it and move on.
```

---

## 1. Ammar: data, platform and engine

```
Your area is the data layer, the platform and the engine.

You own:
  apps/web/src/lib/integrations/**
  apps/web/src/lib/geospatial/**
  apps/web/src/lib/supabase/**
  packages/shared/**
  supabase/**
  scripts/**
  apps/web/src/features/recommendations/engine/**
  apps/web/src/features/outlook/**

Context you need:
  docs/build/BACKEND.md          The schema, the integrations, the engine
                                 contract and the cache keys.
  docs/api/data-sources.md       The attribution register.
  docs/api/data-retrieval-strategy.md
                                 The normalisation rules, including the six
                                 that matter: strip fill values, normalise
                                 units, record the POWER time standard
                                 rather than converting it, apply the
                                 SoilGrids d_factor, preserve the IMERG
                                 run identifier, and never fabricate a
                                 missing value.
  docs/database/data-model.md    The authoritative schema.
  docs/database/rls-policies.md  The access model.
  docs/product/recommendation-methodology.md
                                 The method, in the qualitative form.
  docs/research/evidence-register.csv
                                 The agronomic citations. Every crop
                                 requirement cites a row here.

The rules that matter most in this area:

  An integration module exposes the same contract as every other one:
  typed and normalised values, full provenance, an explicit timeout, at
  most two retries with backoff, typed errors, and a cache read and write.
  Nothing crosses the integration boundary without provenance.

  Never store a raster in PostgreSQL and never commit one. Store the
  statistics.

  Row Level Security is the authorisation boundary. Every farmer-scoped
  table has policies, and the WITH CHECK clause on every INSERT and
  UPDATE policy is what stops a farmer reassigning their farm to someone
  else. A table and its policies belong in the same migration.

  For a gridded product, key the cache on the rounded grid cell, not on
  the exact coordinate.

  A hard constraint whose evidence is weak downgrades to uncertain. It
  never produces a decisive verdict.

  The soil data carries the model's own 90 percent interval. Surface it.
  Do not report a SoilGrids pH without the range around it.
```

---

## 2. Hamza: farms, parcels and case studies

```
Your area is the farmer's land: holdings, parcels, the map, and the
published case studies.

You own:
  apps/web/src/features/farms/**
  apps/web/src/features/parcels/**
  apps/web/src/features/cases/**
  apps/web/src/components/maps/**
  apps/web/src/components/farms/**
  apps/web/src/app/(dashboard)/farms/**

Context you need:
  docs/build/PAGES.md             Every route and what is on it.
  docs/build/BRAND.md             The component rules and the map rules.
  docs/research/field-interviews/ The three Tofa case studies, their
                                 transcripts, and the consent record.
  docs/product/user-flows.md      The farmer-facing behaviour.
  docs/database/postgis-design.md
                                 The area and centroid rules.

The rules that matter most in this area:

  A farm is a holding of parcels. The parcel is the unit of analysis.
  The interviewed smallholders manage their land as separate parcels.
  Individual holding sizes and plot counts are withheld.

  Capture the location honestly. A GPS point carries its accuracy radius
  in location_uncertainty_m. That is a different number from the
  dataset's spatial resolution and different from the coverage fraction.
  Never conflate them.

  The area the farmer sees must be the area that is stored. Turf gives a
  preview while drawing. PostGIS computes the truth. If they disagree,
  tell the farmer and show the database value.

  When a coarse value is shown, draw the grid cell over the parcel with a
  caption naming its size. This is the single most effective honesty
  device in the product.

  The case studies are anonymised. Participants are labelled, not named.
  Precise coordinates and contact details are never published.
  Coordinates live in the database.

  The farmer's local terms matter. Keep them. "Guinea corn", "white
  cowpeas" and "kalankuwa" are data, not noise.
```

---

## 3. Khaleel: comparison, environment and reporting

```
Your area is the output: the comparison, the environment panels, the
outlook and the report.

You own:
  apps/web/src/components/dashboard/**
  apps/web/src/components/charts/**
  apps/web/src/features/reports/**
  apps/web/src/app/(dashboard)/cases/**
  apps/web/src/app/(dashboard)/reports/**
  apps/web/src/app/(marketing)/**

Context you need:
  docs/build/PAGES.md             Every route and what is on it.
  docs/build/BRAND.md             The palette, the type, the component
                                 rules, the accessibility requirements.
  docs/product/recommendation-methodology.md
                                 The method, and the four fields every
                                 rotation strategy must carry.
  docs/design/design-system.md    The visual rationale.
  docs/hackathon/README.md        The challenge brief and what the
                                 submission requires.

The rules that matter most in this area:

  The farm page is the product. Its order is: the header with the name
  and the area, then one sentence about the situation, then the
  measurements, then the advice, then the rotations, then the secondary
  material.

  That one sentence at the top is the hardest and most valuable element.
  It is generated from the analysis, never written by hand, and it never
  claims more precision than the data supports.

  Every data card carries a provenance line. Source, resolution in plain
  words, observation date. Not optional.

  Every recommendation shows its limitations beside its verdict, not
  below the fold. An uncertain constraint is stated as uncertain.

  The existing rotation is presented first and on equal terms. Never
  label the farmer's current practice as the inferior option.

  The seasonal outlook is an outlook, never a forecast. It is framed as
  a risk indicator.

  Never claim a yield improvement. The data does not support one.

  Every data view has four states: loading, empty, error and stale. They
  are different, and the empty state says what would appear and how to
  get it.

  A missing value is a visible gap. A flat line through a gap is a lie.
```

---

## 4. Before you push

Every prompt ends with the same check. Do not skip it.

```
Before you open the pull request:

  pnpm format:check
  pnpm lint
  pnpm typecheck
  pnpm test
  pnpm validate:links
  pnpm validate:style

And confirm:

  - No secret, and no secret in a NEXT_PUBLIC_ variable.
  - No real farmer data, farm polygons or personal information added.
  - Any new external data source recorded in docs/api/data-sources.md
    with its licence, resolution and attribution.
  - Every resolution and accuracy statement is accurate and no broader
    than the data behind it.
  - RLS updated if a table was added.
  - An ADR written if the architecture changed.
  - Documentation updated in the same pull request as the code.

If a check fails, fix the file. Do not skip the check and do not weaken
the rule to make it pass.
```

---

## 5. A note on the NASA Super Intelligence rules

NASA requires the submission to describe how AI tools were used. That
disclosure is in [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md)
§ 6.

Two rules follow from it and apply to every agent working on this
repository.

1. **AI must not have originated the idea.** The product concept, the
   agronomic methodology and the field validation are human work. Agents
   assist with implementation, documentation and research synthesis.
2. **No NASA branding or design elements** may appear in anything
   AI-generated, including imagery in this repository.
