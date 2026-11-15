# Team Plan

**Status: the build is live.** This document records who owns which part of
the DalaShift codebase, the workflow the team used during the NASA Space Apps
build, and the standard every change must meet.

Companion documents:

| Document | Purpose |
| -------- | ------- |
| [`PAGES.md`](./PAGES.md) | Every route in the application and what is on it |
| [`BACKEND.md`](./BACKEND.md) | Schema, integrations, the engine contract, the keys |
| [`BRAND.md`](./BRAND.md) | Palette, typography, components, logo and favicon |
| [`AGENT-PROMPTS.md`](./AGENT-PROMPTS.md) | A ready-to-paste prompt for each person's agent |

---

## 1. Ownership

Ownership is by **area**, not by feature, so that two people rarely touch the
same file.

| Owner | Area | Paths |
| ----- | ---- | ----- |
| **Ammar** | Data, platform and engine | `apps/web/src/lib/integrations/**`, `apps/web/src/lib/geospatial/**`, `apps/web/src/lib/supabase/**`, `packages/shared/**`, `supabase/**`, `scripts/**`, `apps/web/src/features/recommendations/engine/**`, `apps/web/src/features/outlook/**` |
| **Hamza** | Farms, parcels and case studies | `apps/web/src/features/farms/**`, `apps/web/src/features/parcels/**`, `apps/web/src/features/cases/**`, `apps/web/src/components/maps/**`, `apps/web/src/components/farms/**`, `apps/web/src/app/(dashboard)/farms/**` |
| **Khaleel** | Comparison, environment and reporting | `apps/web/src/components/dashboard/**`, `apps/web/src/components/charts/**`, `apps/web/src/features/reports/**`, `apps/web/src/app/(dashboard)/cases/**`, `apps/web/src/app/(dashboard)/reports/**`, `apps/web/src/app/(marketing)/**` |

**Shared surfaces.** `packages/shared/types`, `packages/shared/schemas` and
`packages/shared/constants` are the contract between the three areas. Changes
there are agreed in the pull request before anyone builds on them, because a
type change in one area breaks the other two.

---

## 2. Workflow used during the build

### Branching

| Branch type | Pattern | Example |
| ----------- | ------- | ------- |
| Feature | `feat/<area>-<short-desc>` | `feat/farms-parcel-capture` |
| Fix | `fix/<area>-<short-desc>` | `fix/compare-ordering` |
| Research | `research/<topic>` | `research/soilgrids-uncertainty` |
| Docs | `docs/<topic>` | `docs/evidence-register` |
| Chore | `chore/<short-desc>` | `chore/ci-link-check` |

`<area>` is one of: `auth`, `farms`, `parcels`, `crops`, `env`, `engine`,
`reports`, `maps`, `db`, `infra`, `ui`, `brand`.

### Commits

Conventional Commits, `<type>(<scope>): <subject>`, imperative mood, no
trailing period, subject at most 72 characters.

```
feat(engine): add planting trigger assessment for parcel moisture
fix(db): qualify geometry functions in the parcel migration
docs(hackathon): update presentation slides
```

### Pull requests

1. Branch from an up-to-date `main`.
2. Run `pnpm check && pnpm test` locally.
3. Open a pull request using the repository template.
4. Fill in the **Claim integrity** and **Data and API changes** sections
   honestly. They exist to catch overstated accuracy claims before review.
5. One approving review from a different person. With three people, that means
   the author cannot be the approver.
6. Squash merge. The pull request title becomes the commit subject, so write
   it in Conventional Commit form.

**Never force-push to `main`.** Never force-push a branch another person is
working from.

---

## 3. Definition of done

A change is done when all of the following are true.

- [ ] `pnpm format:check`, `pnpm lint`, `pnpm typecheck` and `pnpm test` pass.
- [ ] `pnpm validate:links` and `pnpm validate:style` pass. These run in CI
      and they fail the build, so fix the file rather than skipping the check.
- [ ] No secrets, and no secret in a `NEXT_PUBLIC_` variable.
- [ ] No real farmer data, farm polygons or personal information in the
      repository.
- [ ] New external data sources are recorded in
      [`docs/api/data-sources.md`](../api/data-sources.md) with licence,
      resolution and attribution.
- [ ] Every environmental value shown to a user carries its source, its real
      spatial resolution, its observation date and whether it is modelled.
- [ ] Accuracy and resolution wording is accurate. No claim is broader than
      the data behind it.
- [ ] Row Level Security is updated if a table was added.
- [ ] An ADR is written if the architecture changed.
- [ ] Documentation is updated in the same pull request as the code.

### Minimum test coverage by change type

| Change type | Minimum requirement |
| ----------- | ------------------- |
| Recommendation or scoring rule | One unit test per rule, including the boundary case and the no-data case |
| Geospatial calculation | One unit test with known coordinates and expected values |
| External integration | One test against a recorded, sanitised fixture. The suite never calls a live API |
| API route or server action | One test for the validation failure and one for the authorisation failure |
| UI component | One test of the meaningful behaviour, not of the markup |
| Documentation | No test. Check the links and the accuracy |

Fixtures must be synthetic. Never commit a real farm's coordinates. A test
that needs a credential is skipped when the credential is absent, never faked.

---

## 4. Rules that are not negotiable

1. **External API calls happen only in `apps/web/src/lib/integrations/`**,
   which is `import "server-only"`. A client component never calls NASA.
2. **No secret reaches the browser.** `NEXT_PUBLIC_` means shipped.
3. **PostGIS computes all geometry.** `ST_Area(boundary::geography)` for
   area. A client-computed area is a preview, never the truth.
4. **Provenance is mandatory.** A value without a source, a resolution and an
   observation date is not acceptable to store or to display.
5. **The engine is deterministic and rules-based.** A language model may
   paraphrase output. It never scores, never sets a verdict and never adds a
   number.
6. **Missing data lowers confidence and is stated.** It is never a silent
   default and never a fabricated value.
7. **The database is the cache.** There is no persistent disk in serverless.
8. **One application.** No separate API service or worker without an ADR.
9. **No em dash (U+2014) anywhere in a tracked text file.** This is enforced
   mechanically by `pnpm validate:style`.
10. **Never write an ADR out of order, and never delete one.** Supersede it.

---

## 5. What is still open

| Item | Where it is tracked |
| ---- | ------------------ |
| Map tile provider | [`ADR-0007`](../decisions/ADR-0007-map-tile-provider.md) |
| Google Earth Engine dependency | [`ADR-0008`](../decisions/ADR-0008-google-earth-engine-dependency.md) |
| Data retention and consent | [`ADR-0006`](../decisions/ADR-0006-data-retention-and-consent.md) |
| Verification actions V-01 to V-08 | [`OPEN-DECISIONS.md`](../decisions/OPEN-DECISIONS.md) Part E |
