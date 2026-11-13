# Contributing to DalaShift

DalaShift is built by a **three-person team** during a NASA Space Apps
hackathon, with AI coding agents assisting. This document is the shared
agreement for how work is done.

> **Read [`AGENTS.md`](./AGENTS.md) first.** It contains the architectural
> rules that every change must respect. This document covers the mechanical
> workflow.

---

## 1. Prerequisites

| Requirement | Version | Notes                                                          |
| ------------ | ------- | -------------------------------------------------------------- |
| Node.js      | 22 LTS  | `.nvmrc` is committed. Node 20.9+ works but 22 is the target. |
| pnpm        | 9.6.0   | Managed via Corepack. Do not install it globally by hand.     |
| Git         | 2.40+   | Any recent version.                                            |
| GitHub CLI  | optional| Only needed to create repositories or manage issues.          |
| Docker      | optional| Only needed if you run a local Supabase stack.                 |

### macOS

```bash
brew install node git
corepack enable
corepack prepare pnpm@9.6.0 --activate
```

### Linux (Debian/Ubuntu)

```bash
sudo apt-get update && sudo apt-get install -y git build-essential
# Install Node.js 22 via nvm (recommended):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install
nvm use          # reads .nvmrc
corepack enable
corepack prepare pnpm@9.6.0 --activate
```

### Windows (PowerShell)

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
corepack enable
corepack prepare pnpm@9.6.0 --activate
```

> **Windows note.** The repository uses LF line endings (enforced by
> `.editorconfig`). If Git reports whitespace warnings on Windows, run:
> `git config --global core.autocrlf false`.

---

## 2. Getting set up

```bash
# 1. Clone
git clone git@github.com:<owner>/dalashift.git
cd dalashift

# 2. Install the exact toolchain
corepack enable
pnpm install

# 3. Create your local environment file
cp .env.example apps/web/.env.local
# then edit apps/web/.env.local and fill in real values.
```

> `.env.local` lives in `apps/web/` because Next.js only reads environment
> variables from the application directory. It is gitignored. **Never commit
> real values.**

### Environment variables

`.env.example` is the authoritative list of every variable the platform
expects, grouped by provider, with a comment explaining each one. Read it
before requesting access to any service.

Minimum set for local development:

| Variable                        | Why                                              |
| ------------------------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Database, auth and storage                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client (safe: RLS is the real boundary)   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-side admin operations: **server only**    |
| `NEXT_PUBLIC_MAP_STYLE_URL`     | MapLibre basemap style                           |

Additional variables are needed for external data sources. See
`docs/api/data-sources.md` for which ones and how to obtain them.

### Verify the setup

```bash
pnpm check   # format:check + lint + typecheck
pnpm dev     # http://localhost:3000
```

### Supabase project setup (Phase 2)

The Phase 1 repository intentionally contains **no migrations**. When Phase 2
opens, the first task is to write the schema described in
`docs/database/data-model.md` into `supabase/migrations/`, enable PostGIS, and
apply the RLS policies. Do not create ad-hoc tables in the Supabase dashboard.
Schema changes go through migrations in the repository.

---

## 3. Branching

`main` is always deployable and always green. Never commit directly to `main`
except for documentation-only fixes.

| Branch type | Pattern                    | Example                        |
| ----------- | -------------------------- | ------------------------------ |
| Feature     | `feat/<area>-<short-desc>` | `feat/farms-polygon-drawing`   |
| Fix         | `fix/<area>-<short-desc>`  | `fix/geo-area-calculation`      |
| Research    | `research/<topic>`         | `research/chirps-vs-gpm`       |
| Docs        | `docs/<topic>`             | `docs/api-soilgrids`           |
| Chore       | `chore/<short-desc>`       | `chore/eslint-config`          |
| Hackathon   | `hack/<day>-<short-desc>`  | `hack/d1-map-basemap`          |

`<area>` is one of: `auth`, `farms`, `crops`, `env`, `recommendations`,
`reports`, `maps`, `db`, `infra`, `ui`.

### Parallel work during the hackathon

To avoid three people editing the same files, split by **area**, not by
feature:

- **Owner A: Data & backend:** `apps/web/src/lib/integrations/**`,
  `apps/web/src/lib/geospatial/**`, `packages/shared/**`, `supabase/**`,
  `scripts/**`
- **Owner B: Product UI:** `apps/web/src/features/**`,
  `apps/web/src/components/**`, `apps/web/src/app/**`
- **Owner C: Map, charts, reports:** `apps/web/src/components/maps/**`,
  `apps/web/src/components/charts/**`, `apps/web/src/features/reports/**`

When two people must touch the same file, agree it in the pull request before
starting. Coordinate in the team channel, not in code comments.

---

## 4. Commits

**Conventional Commits.** The commit subject is the primary record of intent.

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

| Type       | Use for                                                       |
| ---------- | ------------------------------------------------------------- |
| `feat`     | New user-visible capability                                   |
| `fix`      | Bug fix                                                       |
| `docs`     | Documentation only                                            |
| `research` | Investigation, data-source evaluation, findings              |
| `refactor` | Behaviour-preserving restructure                              |
| `perf`     | Performance improvement                                       |
| `test`     | Tests only                                                    |
| `chore`    | Tooling, config, dependencies                                  |
| `build`    | Build system                                                  |
| `ci`       | CI configuration                                               |

Scopes mirror the branch areas: `auth`, `farms`, `crops`, `env`,
`recommendations`, `reports`, `maps`, `db`, `infra`, `ui`, `docs`, `deps`.

Examples:

```
feat(farms): add polygon drawing with area preview
fix(geo): use PostGIS ST_Area for farm size instead of turf
research(env): document CHIRPS vs GPM IMERG resolution trade-off
docs(api): record SoilGrids attribution requirement
```

Rules:

- Imperative mood, no trailing period, ≤ 72 characters for the subject.
- One logical change per commit.
- Never commit WIP to a shared branch. Use a local `wip/` branch or a draft PR.
- Reference issues in the body: `Closes #42`.

---

## 5. Pull requests

1. Branch from an up-to-date `main`.
2. Make your change.
3. Run `pnpm check && pnpm test` locally.
4. Open a PR using the template in `.github/PULL_REQUEST_TEMPLATE.md`.
5. Fill in the template honestly: the "Claim integrity" and "Data and API
   changes" sections exist to catch overstated accuracy claims before review.

**Branch protection.** `main` should require: 1 approving review, passing CI
(Prettier, ESLint, TypeScript, tests), and no unresolved conversations. With
three people, "1 approving review" means a different person authored the change.

### Merge strategy

- **Squash merge** for feature and fix branches. The PR title becomes the
  commit subject, so write it in Conventional Commit form.
- Rebase or merge `main` into your branch before merging if `main` has moved.
- **Never force-push to `main`.** Never force-push a branch someone else is
  working from.

---

## 6. Code review

Reviewers check, in this order:

1. **Correctness**: does it do what the PR says?
2. **Claim integrity**: are accuracy and resolution statements accurate? Is
   any NASA endorsement implied? Is validation scope overstated?
3. **Security**: are secrets server-side? Is RLS updated? Is input validated?
4. **Boundaries**: does external I/O stay in `lib/integrations`? Is the
   recommendation logic still deterministic?
5. **Documentation**: is `docs/` updated? Is an ADR needed?
6. **Tests**: is the new behaviour covered?

Review comments should be prefixed to indicate severity:

- `blocking:` must change before merge
- `suggestion:` should change, author's call
- `nit:` optional, non-blocking
- `question:` asking for clarification, not a change request

**Review turnaround:** within a few hours during the hackathon, end of day
otherwise. If a PR is blocking someone, say so in the team channel; do not
sit on it.

---

## 7. Testing requirements

| Change type                        | Minimum requirement                              |
| ---------------------------------- | ------------------------------------------------ |
| Recommendation / scoring rule      | Unit test per rule, including boundary and no-data cases |
| Geospatial calculation             | Unit test with known coordinates and expected values |
| External integration               | Test with a recorded, sanitised fixture response |
| API route or server action        | Test for validation failure and authorisation failure |
| UI component                       | Test the meaningful behaviour, not the markup     |
| Documentation                       | No test required; check links and accuracy        |

Rules:

- The test suite must not call live external APIs. Use fixtures.
- Fixtures must be synthetic. Never commit a real farm's coordinates.
- Tests that require credentials must be skipped, not faked, when the
  credentials are absent.
- `pnpm test` must pass before opening a PR.

---

## 8. Contribution standards

### Do

- Cite sources with a URL and the date you verified them.
- Say "unverified" when something is unverified.
- Prefer a smaller correct change over a larger speculative one.
- Update the docs in the same PR as the code.
- Ask in the team channel when two ways of doing something are both reasonable.
- **Use plain punctuation.** No em dashes, anywhere. See the writing
  conventions in `AGENTS.md` § 7.

### Don't

- Don't commit real farmer data, farm polygons, photographs or phone numbers.
- Don't commit secrets, tokens or `.env` files.
- Don't commit large rasters or generated tiles.
- Don't change the approved technology stack without an ADR and team approval.
- Don't remove or rewrite an existing ADR. Supersede it.
- Don't write a new document that duplicates an existing one.
- Don't claim the platform is validated somewhere it has not been validated.
- **Don't use an em dash (U+2014).** It is the clearest tell that a document was
  machine generated, and reviewers read it that way. Use a full stop, a
  colon, a comma or parentheses. This is enforced by `pnpm validate:style`
  in CI.

---

## 9. Code of conduct

Be respectful and constructive. Assume good faith. Technical disagreement is
settled with evidence (a citation, a measurement, a reproducible test), not
with seniority. Reviews are about the code, not the person.

---

## 10. Reporting security issues

**Do not open a public issue.** Follow [`SECURITY.md`](./SECURITY.md).
