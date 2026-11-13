# ADR-0010: Dependency Update Policy and CI Action Runtime

| Field    | Value                                                             |
| -------- | ----------------------------------------------------------------- |
| Status   | Accepted                                                        |
| Date     | 2026-11-13                                                      |
| Deciders | Team                                                            |
| Related  | `ADR-0002` (monorepo and tooling), `.github/workflows/ci.yml`, `.github/dependabot.yml` |

---

## Context

Two separate problems surfaced on the same afternoon, and they have opposite
answers. Recording them together makes the distinction explicit, because
"leave the dependencies alone" and "take the action upgrades immediately" are
both correct, for different reasons.

### Problem 1: the CI actions were on a removed runtime

GitHub removed the **Node 20 runtime from GitHub-hosted runners on
16 September 2026**. Every action in the workflow that still targeted Node 20
was running only through a forced fallback, with this warning on every run:

> `Node.js 20 is deprecated. The following actions target Node.js 20 but are
> being forced to run on Node.js 24: actions/checkout@v4,
> actions/setup-node@v4, pnpm/action-setup@v4, gitleaks/gitleaks-action@v2`

The gitleaks action's own documentation states that from 16 September 2026
`gitleaks-action@v2` **stops working** regardless of any opt-out flag.

### Problem 2: the secret scan failed on every pull request

The `Secret scan` job failed on all eight open pull requests with:

> `RequestError [HttpError]: Resource not accessible by integration`

The cause was in our own workflow. `gitleaks-action` posts a comment on the
pull request when it finds something, and the workflow deliberately runs with
`permissions: contents: read`. The comment step therefore received a 403 and
failed the whole job. It passed on `push` to `main`, where the token is not
restricted the same way, which is why the problem only appeared on pull
requests.

### Problem 3: Dependabot proposed eight upgrades

Four of them were the action bumps from Problem 1. The other four were major
version bumps to the language toolchain:

| Proposal                  | Change             | Peer support                                      |
| ------------------------- | ------------------ | ------------------------------------------------- |
| `eslint`                  | 9.39.5 → 10.14.0   | `typescript-eslint@8.72.2` allows `^10.0.0`       |
| `@eslint/js`              | 9.39.5 → 10.0.1    | must match the `eslint` major                     |
| `typescript`              | 5.9.3 → 6.0.3      | `typescript-eslint@8.72.2` allows `>=4.8.4 <6.1.0`|
| `@types/node`             | 22.20.5 → 26.6.6   | no constraint, but the runtime is Node 22         |

All four passed the pipeline. The question was whether to take them.

---

## Options considered for the dependency majors

### Option A: Take all four

- **Advantages:** Current versions. No backlog. The peer ranges explicitly
  permit ESLint 10 and TypeScript 6.
- **Disadvantages:** `eslint-config-next@16.4.6`, the configuration Next.js
  itself ships, bundles `eslint-plugin-react`, `eslint-plugin-jsx-a11y` and
  `eslint-plugin-import`, all of which declare support for `eslint: ^9` only.
  We would be running an unsupported plugin combination, and the team would
  reach for `eslint-config-next` during the build, which is exactly the point
  at which it would break.
- **Risks:** A lint failure discovered mid-build, in the toolchain everyone
  depends on, hours from a deadline.

### Option B: Take none

- **Advantages:** Simplest. Nothing changes.
- **Disadvantages:** The four PRs stay open and Dependabot re-proposes them
  every week. The team has to decide the same thing repeatedly.

### Option C: Take none, and make that explicit and self-maintaining

- **Advantages:** The toolchain stays on the versions the Next.js 16
  ecosystem is tested against. The decision is encoded in
  `.github/dependabot.yml`, so it is visible to anyone who looks, and it does
  not need to be re-litigated every week.
- **Disadvantages:** The team stays on ESLint 9 and TypeScript 5.9 for now.
- **Risks:** None material.

---

## Decision

### GitHub Actions: take the upgrades immediately

| Action                    | From | To  |
| ------------------------- | ---- | --- |
| `actions/checkout`        | v4   | v7  |
| `actions/setup-node`      | v4   | v7  |
| `pnpm/action-setup`       | v4   | v6  |
| `gitleaks/gitleaks-action`| v2   | v3  |

**Reasoning:** this is not a preference. The Node 20 runtime was removed from
GitHub-hosted runners on 16 September 2026, and the actions' own documentation
says the current versions will stop working. Staying put means the pipeline
fails at an unpredictable moment, with no diagnostic, during the build. There
is no counter-argument.

The `gitleaks-action` version is also upgraded for a second reason: v2 posts
a pull request comment, which needs a token that can write to pull requests.
The workflow runs with read-only permissions on purpose, so **PR commenting is
now disabled**:

```yaml
GITLEAKS_ENABLE_COMMENTS: "false"
```

The scan itself still runs, and still fails the job when it finds a secret.
Least privilege is kept, and the job stops failing for a reason that has
nothing to do with whether a secret was committed.

### npm dependencies: hold the majors, take the rest

**`eslint`, `@eslint/js`, `typescript` and `@types/node` stay on their
current majors.**

The reasoning differs for each, and the differences matter:

| Dependency  | Why not the major                                                                   |
| ----------- | ------------------------------------------------------------------------------------ |
| `eslint`    | `eslint-config-next` and its bundled plugins support `eslint: ^9` only. We use that config. |
| `typescript`| TypeScript 6 applies stricter defaults than 5.9. This team works with AI coding agents, which write idiomatic TypeScript 5. Stricter rules would fight the tools rather than help them. |
| `@types/node` | Node 26 types describe APIs that do not exist in the Node 22 runtime pinned in `.nvmrc`. Types that do not match the runtime let code type-check and then fail in production. |

**Minor and patch updates are still taken automatically.** Only the three
majors are held back.

### Making the decision self-maintaining

`.github/dependabot.yml` now encodes the decision as `ignore` rules, so the
policy lives in the repository rather than in anyone's memory:

```yaml
ignore:
  - dependency-name: "eslint"
    update-types: ["version-update:semver-major"]
  - dependency-name: "typescript"
    update-types: ["version-update:semver-major"]
  - dependency-name: "@types/node"
    update-types: ["version-update:semver-major"]
```

Dependabot will keep proposing minor and patch updates, and will stop
proposing these three majors. Nobody has to remember why.

---

## Reasoning

The two halves of this ADR come from opposite considerations, and the
distinction is the point.

**Runtime removals are forced.** A date on which GitHub deletes a runtime is
not a judgement call. The only question is whether we find out from a warning
or from a broken pipeline. We take the action upgrades now, and CI is green on
the new versions.

**Dependency majors are a judgement call, and the cost of being wrong is
asymmetric.** Taking ESLint 10 saves nothing. Not taking it costs nothing.
The same is true of TypeScript 6. Both would land in a toolchain the team
uses every hour of a two-day build, at the cost of a lint rule set that the
surrounding ecosystem has not caught up with. There is no prize for being on
the newest major. There is only a prize for the pipeline working.

**The `@types/node` case is a different kind of mistake entirely.** It is not
about tooling maturity, it is about types that do not describe the runtime.
That one is wrong on its own terms, independent of any schedule.

**Recording the reasoning matters more than the decision.** A future team
member who reads "we are on ESLint 9" should not have to guess whether it was
oversight or a decision. The `ignore` rules in `dependabot.yml` point at this
ADR, and this ADR explains the reasoning.

---

## Consequences

### Positive

- CI runs on actions that are supported and will not stop working on a date.
- The secret scan works on pull requests as well as pushes.
- The dependency backlog is empty, and the remaining majors will not keep
  reappearing.
- The policy is discoverable in the repository, not in a conversation.

### Negative / accepted costs

- The team stays on ESLint 9, TypeScript 5.9 and Node 22 types.
- Three upgrades are deliberately deferred rather than declined outright.

### Follow-up work

- [x] Upgrade the four GitHub Actions.
- [x] Disable gitleaks PR commenting.
- [x] Encode the dependency policy in `.github/dependabot.yml`.
- [x] Revert the toolchain majors and verify the full pipeline.
- [ ] **After the hackathon**, test the deferred majors properly on a branch:
      ESLint 10 with `eslint-config-next` once Next ships a version that
      supports it, and TypeScript 6 with the AI-assisted workflow in place.
- [ ] Add `pnpm audit` to CI once the dependency set settles.

### Revisit when

- Next.js ships an `eslint-config-next` that declares ESLint 10 support.
- The team has a stable period after the hackathon to test a major upgrade.
