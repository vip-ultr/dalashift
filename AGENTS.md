# AGENTS.md

**Instructions for AI coding agents working on DalaShift.**
Read this file completely before doing any work in this repository. Then read the
documents relevant to the area you are touching.

> DalaShift is a **working project name**. It is not a final brand identity and
> must not be presented as one. See `docs/product/brand-and-naming.md`.

---

## 1. Project overview

DalaShift is an **agricultural intelligence platform** that turns NASA Earth
observation data and other environmental datasets into farm-specific, actionable
guidance for smallholder farmers.

A farmer registers, draws the boundary of their farm on an interactive map,
states what they grow or intend to grow, and receives environmental analysis
and crop recommendations for *that specific piece of land*.

**Field validation location:** Tofa Local Government Area, Kano State, Nigeria.
This is where the team has (or intends to have) contact with real farmers. It
is **not** the geographical limit of the product: the architecture is
geographically extensible, and it is **not** a claim of validation across
Nigeria or globally. State validation claims only for what has actually been
validated.

---

## 2. Product objectives

1. **Farm-specific, not regional.** Every insight must be tied to the farmer's
   own polygon and crop situation. A value read from a 0.5° grid cell is
   regional climate, not a farm measurement, and must be presented as such.
2. **Farmer-supplied ground truth.** The platform never guesses what a farmer
   grows. Crop identity comes from the farmer.
3. **Honest uncertainty.** When data is missing, coarse, modelled or stale, the
   product says so. It never invents an answer or hides a limitation.
4. **Actionable over impressive.** A farmer should leave with a decision, not a
   dashboard full of charts.
5. **Explainable recommendations.** Every recommendation traces to a named
   input, a named rule and a versioned ruleset.

### Non-goals

- Replacing the agronomist or extension officer.
- Yield prediction at field scale (not supportable with the available data).
- Replacing the Nigerian Meteorological Agency as an operational forecast source.
- Any claim of NASA endorsement or partnership.

---

## 3. Current development phase

**Phase 1. Research, product definition, architecture and repository
foundation. COMPLETE.**

**Phase 2. Build.** Active. Frontend and backend implementation is underway.

Phase 1 explicitly did **not** include product implementation. Phase 2 has
since added application features and database migrations. Inspect the current
code and changelog rather than treating the original Phase 1 exclusions as
the current product state.

When you start Phase 2 work, first check `docs/decisions/` for any ADR that
constrains your approach, and update `ARCHITECTURE_ESSENTIALS.md` if you change
a core rule.

---

## 4. Technology stack

**Approved baseline. Do not replace any of these without a team-approved ADR.**

| Layer            | Choice                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| Framework        | Next.js (App Router) + React + TypeScript                               |
| Styling          | Tailwind CSS + shadcn/ui + Lucide icons                                |
| Charts           | Recharts                                                                |
| Mapping          | MapLibre GL JS + a documented tile provider                            |
| Backend          | Next.js server-side logic and API routes (no separate backend service)   |
| Database         | Supabase (PostgreSQL) with PostGIS                                      |
| Auth             | First-party account auth and server-managed sessions                    |
| Storage          | Supabase Storage                                                        |
| Database security| Row Level Security                                                      |
| Hosting          | Vercel                                                                  |
| Tooling          | Node.js 22 LTS, pnpm workspaces, ESLint 9, Prettier 3, Vitest, Playwright |
| Source control   | GitHub (monorepo, `main` branch)                                         |

**Version policy:** dependency versions are pinned with caret ranges in
`package.json` and locked in `pnpm-lock.yaml`. Run `pnpm install`, never
`pnpm update` across the whole tree, in a routine change. Upgrades are
separate pull requests.

---

## 5. Architectural principles

1. **Server-side integration boundary.** Every external API call happens in
   `apps/web/src/lib/integrations/`, which is server-only. Client components
   never call NASA, Supabase service-role, or any other protected endpoint
   directly.
   Authenticated database access also stays server-side. The application
   verifies its own session and supplies a short-lived user-scoped JWT so
   PostgreSQL RLS remains the data authorization boundary.
2. **Never expose secrets.** The service-role key, JWT signing secret,
   Earthdata token, GEE credentials and provider keys are server-only. `NEXT_PUBLIC_` means
   "shipped to the browser". Never put a secret in one.
3. **PostGIS is the geospatial authority.** Polygons are stored with SRID 4326;
   all area, distance and containment computation happens in PostGIS
   (`ST_Area`, `ST_Intersects`), not in JavaScript approximations.
4. **Provenance is part of the data.** Every stored environmental value carries
   its source, spatial resolution, temporal resolution, observation date and
   whether it is measured or modelled. A value without provenance is not
   acceptable to store.
5. **The recommendation engine is deterministic and rules-based.** Not an LLM.
   An LLM may optionally rephrase engine output into plain language. It must
   never produce a score, verdict, number or agronomic claim of its own.
6. **Degrade, do not fabricate.** A missing or too-coarse input lowers
   confidence and is reported as a limitation. It never becomes a silent
   default value.
7. **Version the ruleset.** Recommendation logic carries a version string.
   Stored recommendations retain the version that produced them.
8. **The database is the cache.** Vercel serverless has no persistent
   filesystem and no long-lived process. Cached external responses live in
   Supabase with an explicit TTL, not in memory or on disk.
9. **One Next.js application.** Do not split into a separate API service or
   worker unless an ADR documents a genuine technical requirement.
10. **Documentation is part of the deliverable.** A feature without
    documentation of its data sources and limitations is incomplete.

---

## 6. Folder structure and responsibilities

```
dalashift/
├── AGENTS.md                      # this file, read first
├── CONTRIBUTING.md                # human setup, branch and PR conventions
├── PRD.md                         # product requirements
├── ARCHITECTURE.md                # full technical architecture
├── ARCHITECTURE_ESSENTIALS.md     # condensed reference, read often
├── SECURITY.md                    # vulnerability reporting
├── apps/web/                      # the Next.js application
├── packages/shared/               # types, Zod schemas, constants
├── packages/config/               # shared ESLint / TypeScript / Prettier config
├── scripts/                       # data ingestion, geospatial, validation
├── data/                          # small samples only; processed output ignored
└── docs/                          # detailed documentation
```

### `apps/web/src/`

| Directory        | Responsibility                                                       |
| ---------------- | -------------------------------------------------------------------- |
| `app/`           | App Router routes. `(marketing)`, `(auth)`, `(dashboard)` are route groups. `api/` holds route handlers. |
| `components/ui/`| shadcn/ui primitives, generated, not hand-edited.                  |
| `components/`    | Shared presentational components (`layout/`, `dashboard/`, `farms/`, `maps/`, `charts/`, `forms/`). |
| `features/`      | **Vertical slices**, the unit of product work. Each slice owns its UI, hooks, server actions and queries. |
| `lib/integrations/` | **Server-only.** One module per external data source. Owns fetching, caching, parsing, and error handling. |
| `lib/geospatial/`  | Geospatial computation shared across features (area, zonal stats, coordinate utilities). |
| `lib/supabase/`    | Server and browser Supabase clients, RLS-aware query helpers.   |
| `lib/utilities/`   | Generic helpers (`cn`, formatting). No domain logic.           |
| `hooks/`         | Shared React hooks.                                                 |
| `types/`         | App-local types. Shared types belong in `packages/shared/types`.    |
| `styles/`        | Styles not expressible in Tailwind utilities.                      |

**`features/` is where product code lives.** A feature slice should not import
another feature's internals. Cross-feature communication goes through
`packages/shared` or through the database.

### `packages/shared/`

Framework-agnostic. Types, Zod schemas, constants. Must not import Next.js,
React or Supabase client code. It may import `zod`.

### `docs/`

Read the relevant subdirectory before working in the matching area:

| Directory     | Read it before working on                                            |
| ------------- | --------------------------------------------------------------------- |
| `docs/api/`   | Any integration with an external service                             |
| `docs/database/` | Schema design, migrations, RLS, geospatial storage                 |
| `docs/product/` | Product behaviour, user flows, recommendation methodology          |
| `docs/design/`   | UI/UX work                                                      |
| `docs/research/` | Background on a data source or domain topic                      |
| `docs/hackathon/` | Participation requirements, rules, deadlines                      |
| `docs/decisions/` | Architecture decisions: **read all of these**                    |

---

## 7. Coding conventions

- **TypeScript strict mode.** `strict`, `noUncheckedIndexedAccess`,
  `noImplicitOverride` are on. No `any`: if you need one, you need a type.
- **`import type` for type-only imports** (`verbatimModuleSyntax`).
- **Server/client boundary:** mark server-only modules with
  `import "server-only";` at the top of `lib/integrations/*`.
- **Validation at the boundary.** Validate every external payload with a Zod
  schema before it enters the system. Never trust an upstream response.
- **Naming:** `PascalCase` for components and types, `camelCase` for functions
  and variables, `SCREAMING_SNAKE_CASE` for constants, `kebab-case` for files.
- **Formatting** is Prettier's job. Do not hand-format; run `pnpm format`.
- **Comments explain *why*.** The *what* is in the code.
- **No barrel files** unless they are genuinely stable public surfaces.
- **No dead code.** If it is not used by the end of the branch, delete it.

### Writing conventions

**Never use an em dash (U+2014) anywhere in this repository.** Not in
documentation, comments, commit messages, code strings, issue templates, or
user-facing copy. Not a single one.

The em dash is the most recognisable sign that a document was generated rather
than written. A reviewer who spots one loses confidence in the whole
document, and the people this project is meant to serve, extension workers and
farmers, will read it as machine output. It is also simply easier to read
without.

Use these instead:

| Instead of an em dash          | Use                                                        |
| ------------------------------ | ---------------------------------------------------------- |
| An aside or explanation        | A full stop, or parentheses: `the farm (measured over 30 m pixels)` |
| Introducing an explanation     | A colon: `the binding constraint: soil pH`                  |
| A parenthetical aside          | A comma, if the sentence still reads correctly              |
| A strong break in a sentence   | Two sentences                                              |

**Rules:**

1. **Punctuation only.** When replacing an em dash, do not reword, rephrase or
   restructure the sentence beyond what the punctuation change requires. Keep
   the meaning, the links, the numbers, the table structure and the technical
   content exactly as they are.
2. **En dashes (U+2013) are permitted inside numeric ranges only**, where they
   are standard typography. Everywhere else, use a plain hyphen or the word
   "to". Verbatim quotations from external sources keep the punctuation the
   source used.
3. **A missing value in a table is written `n/a` or `None`,** never as an em
   dash. It is the same convention as writing "not applicable", and it keeps
   the rule absolute with no exceptions to remember.
4. **This is enforced mechanically.** `pnpm validate:style` fails the build if
   an em dash appears anywhere in a tracked text file, and it runs in CI. If
   it fails, fix the punctuation rather than skipping the check.
5. **Verbatim source records are exempt.** The interview transcripts in
   `docs/research/field-interviews/*/transcript.md` are the team's translated
   documents, kept unaltered so they remain a faithful record. Their
   punctuation is the translator's. The same applies to quoted material from
   external sources. Everything else, including every document we write, is
   covered by the rule without exception.

**[Proposed]** The same rule applies to the product's own user-facing copy.
Screen copy is read by farmers with limited formal education and by extension
workers under time pressure. Short sentences and plain punctuation are not
just a style preference here, they are a usability requirement.

### Commands

```bash
pnpm install          # install
pnpm dev              # run the app locally
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit across the workspace
pnpm test             # Vitest
pnpm format           # Prettier write
pnpm check            # format:check + lint + typecheck: run before pushing
pnpm validate:style   # writing convention check: no em dashes
pnpm validate:links   # relative Markdown link check
```

`pnpm validate:style` and `pnpm validate:links` both run in CI. If either
fails, fix the underlying file rather than skipping the check.

---

## 7a. Source control rules for agents (hard)

`main` is protected. Never try to work around it.

1. **Never commit, push, or merge directly to `main`.** Every change goes on a
   feature or fix branch and into a pull request against `main`.
2. **Check your branch before you start:** `git branch --show-current`. If it
   says `main`, create a branch first.
3. **Never force-push** to `main` or to a branch another person is using.
4. **Never merge your own pull request.** Open the PR, report that it is ready,
   and wait for a human reviewer.
5. **Never disable, skip, or weaken a CI check or branch protection** to get a
   change through. Fix the underlying problem in your branch instead.
6. **Finish the workflow.** Being done means the branch is pushed, the PR is
   open, and `pnpm check` and `pnpm test` pass locally. CI must pass on the PR.

See `CONTRIBUTING.md` section 3 for the workflow and branch naming.

---

## 8. Security requirements

1. **RLS is the access boundary.** Every table with farmer data has RLS
   policies enabled. A new table without policies is a security defect.
2. **Farmers may only read their own data.** Cross-farmer access is never
   allowed without an explicit, audited role.
3. **Service-role key is server-only.** Never in `NEXT_PUBLIC_*`, never in
   any browser module, never in a Client Component.
4. **No secrets in Git.** `.env*` is ignored; `.env.example` holds placeholders
   only.
5. **No real farmer data in Git.** Farm boundaries, names, phone numbers and
   photographs belong in Supabase, not the repository. Synthetic fixtures only.
6. **Validate and sanitise all input.** Zod at every route handler, action and
   external API boundary.
7. **Rate-limit** any endpoint that triggers external API calls, and cache
   aggressively so quota is never the failure mode.
8. **Parameterise every SQL query.** No string interpolation into SQL.
9. **Do not leak error internals** to the client. Log server-side, return a
   safe message.
10. **Report vulnerabilities** via `SECURITY.md`, not as a public issue.

---

## 9. Data handling rules

- **Classify data before storing it.** Personal data, farm geometry,
  agricultural data, public research data. The handling differs.
- **Never present modelled data as observed.** Every surface that shows a
  number must be able to state where it came from and how precise it is.
- **Every environmental value carries provenance:** source, licence,
  spatial resolution, temporal resolution, observation date, retrieval date,
  and an `is_modelled` flag.
- **Resolution honesty:** SMAP is ~9 km, POWER is ~0.5° (~50 km), CHIRPS is
  ~5 km, SoilGrids is 250 m, MODIS NDVI is 250 m to 1 km, Landsat is 30 m.
  State the real number. Do not round a 9 km soil-moisture pixel down to
  "your farm".
- **Attribution is mandatory** for NASA data, ISRIC SoilGrids, basemap tiles
  and any other source. Record it in `docs/api/data-sources.md` and render it
  in-product where the data appears.
- **Cache with provenance**, so a stale cached value still reports when it was
  observed.

---

## 10. Testing expectations

- **Unit tests** for pure logic: recommendation scoring rules, geospatial
  calculations, unit conversions, Zod schemas, date/season logic. This is where
  the highest value is: these are deterministic and easy to test.
- **Integration tests** for external integrations, with the upstream response
  **recorded as a fixture** (sanitised, trimmed). Never call the real API in
  the test suite.
- **Component tests** for form validation and state transitions.
- **End-to-end tests** (Playwright) for the two critical journeys: register a
  farm and draw a boundary; read a recommendation.
- Target: the recommendation ruleset and the geospatial utilities must have
  meaningful coverage before the demo. A chart component does not.
- Fixtures must be synthetic. Never commit a real farm's coordinates.

---

## 11. Documentation expectations

- **New external data source** → add an entry in `docs/api/data-sources.md`
  with URL, licence, resolution, auth, limits and attribution, plus a note in
  `docs/api/data-retrieval-strategy.md`.
- **New architectural decision** → add an ADR in `docs/decisions/` using the
  template. Update `ARCHITECTURE_ESSENTIALS.md` if it changes a core rule.
- **New product behaviour** → update `PRD.md` and the relevant file in
  `docs/product/`.
- **Schema change** → update `docs/database/data-model.md`. Migrations are
  written in `supabase/migrations/` with a matching doc.
- **Any claim about data accuracy** → update the relevant research note and
  keep the wording honest.
- Prefer updating an existing document over creating a near-duplicate. Do not
  create a document that restates another.

---

## 12. Handling proposed architectural changes

If a task requires a change to the approved stack, the data model, the
deployment model or the recommendation methodology:

1. **Do not implement it silently.**
2. Write an ADR in `docs/decisions/` (use `ADR-0000-template.md`): context,
   options considered, decision, reasoning, consequences.
3. For anything beyond a local, reversible choice, mark the ADR as
   `Status: Proposed` and raise it with the team for approval.
4. Update `ARCHITECTURE.md` and `ARCHITECTURE_ESSENTIALS.md` once approved.
5. Never silently replace an agreed technology. Never remove an ADR: supersede
   it.

---

## 13. Hard rules: do not violate these

1. **Do not invent API endpoints, response shapes, rate limits or credentials.**
   If you have not read it in official documentation, you do not know it. Use
   the web tools and cite the URL and the date you checked.
2. **Do not invent dataset capabilities.** Spatial resolution, temporal
   frequency and coverage must come from the provider's documentation.
3. **Do not invent hackathon rules.** Official NASA Space Apps sources only.
4. **Do not invent agronomic facts.** Crop requirements come from a cited
   source recorded in the crop reference catalog.
5. **Do not claim NASA provides crop recommendations.** NASA provides Earth
   observation data. Recommendations require agricultural knowledge, a
   methodology and local validation.
6. **Do not overstate validation.** Field validation covers Tofa LGA. Not
   Nigeria. Not Africa. Not globally.
7. **Do not overstate resolution.** See § 9.
8. **Do not commit secrets or real farmer data.**
9. **Do not start Phase 2 implementation work while Phase 2 is not open.**
10. **Do not leave research undocumented.** If you researched it, it belongs in
    `docs/` with a source and a date.

---

## 14. Quick reference

| I want to…                    | Read                                                |
| ----------------------------- | --------------------------------------------------- |
| Add a NASA/external data source | `docs/api/data-sources.md`, `docs/api/data-retrieval-strategy.md` |
| Change the database schema    | `docs/database/data-model.md`, `docs/database/postgis-design.md` |
| Change a recommendation rule   | `docs/product/recommendation-methodology.md`         |
| Build a UI screen              | `docs/design/design-system.md`                      |
| Understand the whole system    | `ARCHITECTURE.md`                                   |
| Get set up                     | `CONTRIBUTING.md`                                   |
| Know what is decided           | `docs/decisions/`                                   |
| Know the hackathon rules       | `docs/hackathon/README.md`                          |
