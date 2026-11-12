# Pull Request Template — DalaShift

## Summary

<!-- What does this PR change, and why? Link the issue it closes: Closes #123 -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / internal change
- [ ] Documentation only
- [ ] Research or data-source investigation

## Area of the codebase

<!-- e.g. apps/web/src/features/farms, packages/shared/schemas, docs/research -->

- [ ] `apps/web` — application
- [ ] `packages/shared` — shared types/schemas/constants
- [ ] `scripts/` — ingestion/geospatial/validation
- [ ] `docs/` — documentation only
- [ ] `data/` — sample/reference data

## Checklist

- [ ] `pnpm format:check` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (or tests added for new behaviour)
- [ ] Tests added/updated for changed behaviour
- [ ] Documentation updated (`ARCHITECTURE.md`, `docs/`, ADR) where relevant
- [ ] New ADR added in `docs/decisions/` if this changes architecture
- [ ] No secrets, API keys, or `.env` values committed
- [ ] No real farmer data, farm boundaries, or personal information included
- [ ] Any new external data source has a documented source URL, licence and attribution
- [ ] Claims about data resolution/accuracy are accurate and not overstated

## Data and API changes

<!-- If this PR adds or changes an external integration, complete the table. -->

| Source | Endpoint | Auth | Cache TTL | Licence / attribution |
| ------ | -------- | ---- | --------- | --------------------- |
|        |          |      |           |                       |

## Screenshots

<!-- For UI changes: desktop and mobile. Before/after where relevant. -->

## Reviewer notes

<!-- Anything a reviewer should know: trade-offs, known gaps, deliberate omissions. -->
