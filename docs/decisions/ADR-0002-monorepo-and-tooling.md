# ADR-0002 — Monorepo Structure and Tooling

| Field    | Value                                                             |
| -------- | ----------------------------------------------------------------- |
| Status   | Accepted                                                        |
| Date     | 2026-11-13                                                      |
| Deciders | Team                                                            |
| Related  | `ARCHITECTURE.md` § 2, `AGENTS.md`, `CONTRIBUTING.md`, `PRD.md` § 15 |

---

## Context

Three people must build one product in roughly 48 hours, with AI coding
agents working alongside them. The repository must:

- Hold a Next.js application, shared types, and operational scripts.
- Let three people work in parallel without colliding on files.
- Support a monorepo layout **if** that is the right structure — the brief
  proposed it, but the structure must serve the timeline, not precede it.
- Be type-safe end to end, with a single source of truth for shared types.
- Install reproducibly on macOS, Linux and Windows.

### Decision criteria

| Criterion                          | Weight |
| ---------------------------------- | ------ |
| Time to onboard a teammate         | High   |
| Parallel work without file conflicts| High   |
| Type sharing without duplication   | High   |
| Deployment simplicity              | High   |
| Tooling overhead                   | Low    |

## Options considered

### Option A — pnpm workspaces monorepo, as proposed in the brief

- **Advantages:** One repo, one lockfile, one `pnpm install`. Workspace
  packages give real TypeScript path resolution with no build step.
  `packages/shared` holds types used by both the app and the scripts.
  Directory boundaries map cleanly onto the "who owns what" split needed for
  three-person parallelism.
- **Disadvantages:** Requires disciplined boundary enforcement (a feature
  slice must not import another feature's internals). Root scripts need to
  fan out correctly.
- **Risks:** Boundary erosion under deadline pressure — the main risk,
  mitigated by `AGENTS.md` and by the file-ownership split in
  `CONTRIBUTING.md`.

### Option B — Single Next.js application, no workspaces

- **Advantages:** Simplest possible. One `package.json`, no workspace
  configuration.
- **Disadvantages:** No clean home for shared types used by both the app and
  the `scripts/` directory; scripts would have to import across a path
  boundary. The proposed structure explicitly calls for `packages/shared`.
- **Risks:** Types drift between the app and the analysis scripts — exactly
  where a provenance or unit mismatch would be expensive.

### Option C — Turborepo / Nx on top of pnpm workspaces

- **Advantages:** Task caching, affected-only builds, a dependency graph.
- **Disadvantages:** Adds a build orchestrator, a config file, and a
  conceptual layer — for a project with one application and two small
  packages.
- **Risks:** Configuration time competing against feature time. Caching adds
  little when the workspace is this small.

### Option D — Nx with integrated tooling

- **Advantages:** Strong conventions, generators, enforced boundaries.
- **Disadvantages:** Heavy for the scale. Significant learning curve.
- **Risks:** Time sink.

## Decision

**Option A — a pnpm workspaces monorepo.**

```
apps/web/          the Next.js application
packages/shared/   types, Zod schemas, constants
packages/config/   shared ESLint, TypeScript, Prettier configuration
scripts/           operational scripts
data/              small samples (committed) + processed output (ignored)
docs/              documentation
```

**Tooling:**

| Concern         | Choice                                                  | Rationale                                         |
| --------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Package manager | pnpm 9.6.0 via Corepack                                 | Fast, strict, shared lockfile, workspace support |
| Node            | 22 LTS, pinned in `.nvmrc`                              | Current LTS, matches Vercel's runtime             |
| TypeScript      | Strict + `noUncheckedIndexedAccess`                    | Matches the codebase's data-handling reality      |
| ESLint          | v9 flat config, shared via `packages/config/eslint`    | One config, no per-package drift                  |
| Prettier        | v3, shared via `packages/config/prettier`              | Formatting decisions made once                    |
| Formatting      | Prettier only — no ESLint formatting rules              | Avoids conflicting formatters                     |
| Unit testing    | Vitest                                                  | Fast, native ESM, good TS support                 |
| E2E             | Playwright                                              | Cross-browser, mobile device emulation            |
| CI              | GitHub Actions                                          | Format, lint, typecheck, test, secret scan        |

**No Turborepo or Nx.** Revisit if the workspace grows beyond a handful of
packages or if build times become a bottleneck.

**Lockfile:** `pnpm-lock.yaml` is committed. CI installs with
`--frozen-lockfile`.

## Reasoning

The monorepo is worth it here for a concrete reason rather than as a matter of
taste: **the same domain types must be used by the application, the shared
package and the ingestion scripts**, and the spatial-resolution and unit
metadata are exactly the kind of thing that drifts between copies. One
`packages/shared` removes a whole class of bug.

At the same time, the orchestrator question has a clear answer at this scale:
three packages, one of which is the only real build target. Turborepo would
add configuration and a cache layer to save seconds. The time is better spent
on the product.

The file-ownership split in `CONTRIBUTING.md` is a deliberate part of this
decision — a monorepo that forces three people into the same files during a
48-hour build is worse than three repositories.

## Consequences

### Positive

- A single `pnpm install` sets up the whole repository for a new teammate.
- Shared types and schemas have exactly one definition.
- The directory structure mirrors the product's conceptual structure, so a new
  contributor (human or agent) can navigate it from `AGENTS.md`.
- The ownership split makes parallel work safe.

### Negative / accepted costs

- Boundary discipline must be maintained by convention and review.
- `pnpm-workspace.yaml` must list nested package globs (`packages/config/*`) —
  a mistake already made once during setup.
- Workspace dependency resolution adds a layer when debugging installs.

### Follow-up work

- [ ] Add a boundary check that fails CI if a feature slice imports another
      feature's internals.
- [ ] Consider `eslint-plugin-import` `no-restricted-paths` rules to enforce
      the server-only boundary mechanically.

### Revisit when

- The workspace exceeds ~8 packages.
- CI times exceed ~10 minutes and caching becomes material.
- A second application (e.g. a worker or a public API) is added.
