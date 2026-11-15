# ADR-0009: Repository Visibility

| Field    | Value                                                             |
| -------- | ----------------------------------------------------------------- |
| Status   | **Accepted**                                                      |
| Date     | 2026-11-13 (updated 2026-11-14 with the team decision)           |
| Deciders | Team                                                             |
| Related  | `ADR-0001`, `SECURITY.md`, `docs/hackathon/README.md`             |

---

## Context

The repository holds the project's source code, architecture, research and
documentation. The NASA Space Apps challenge requires:

> *"All posted Solutions will be available for others to download or use."*
> Source: <https://www.spaceappschallenge.org/legal/>

and requires an OSI-approved licence or freely available content
(see [`ADR-0001`](./ADR-0001-open-source-license.md)).

**[Confirmed]** The brief states: *"The repository is intended to be publicly
accessible."*

**[Confirmed]** The brief also states: *"The repository should be public only
if the team has agreed to public visibility. Otherwise, create it as private
and document the visibility decision for confirmation."*

**[Open]** The team has **not** recorded an explicit decision. This ADR
records the options and the reasoning so that the decision can be made
knowingly.

---

## Options considered

### Option A: Public

- **Advantages:**
  - **Required for the NASA submission.** The judge needs to reach the code.
    A private repository cannot be browsed by a judge who is not a
    collaborator.
  - Maximum visibility for a project whose whole point is impact.
  - The architecture and research documents are genuinely useful to other
    teams working on the same problem, and to the wider agricultural
    development community.
  - Enables external contributors and forks.
  - The documentation contains no real farmer data, no secrets and no
    proprietary content, so there is nothing to protect.
- **Disadvantages:**
  - Everything is permanent. Code and research become publicly attributable.
  - The project becomes visible to potential competitors, which matters more
    if the team intends to build a commercial agricultural product.
  - A security mistake is public. Mitigated by the security review in
    `SECURITY.md`.
- **Risks:** Low, provided the licence question in ADR-0001 is resolved first.

### Option B: Private

- **Advantages:**
  - The team retains full control over who sees the work and for how long.
  - Keeps commercial options open.
  - Lets the team keep the research internal.
- **Disadvantages:**
  - **Blocks the NASA submission.** The "Link to Final Project" field
    accepts *"a code repository"*, but a private GitHub repository is not
    publicly accessible, and the submission is judged by people who are not
    collaborators. The team would have to make it public at submission time
    anyway, or publish a separate public copy.
  - The documentation and research (the parts with the most value to others)
    stay hidden.
  - It contradicts the brief's stated intent.
- **Risks:** A decision that must be reversed under deadline pressure.

### Option C: Public, with the licence unresolved

- **Advantages:** The repository is visible immediately.
- **Disadvantages:** **The `LICENSE` placeholder means the content is
  "all rights reserved by default"**: the team owns it, but nobody else may
  reuse it. That technically conflicts with the NASA requirement that
  original content be *"freely available without restriction or licensed as
  open source"*.
- **Risks:** A submission whose licensing position is ambiguous.

---

## Decision

**Accepted on 14 November 2026: the repository is PUBLIC.**

The conditions attached to this decision were met before the flip:

1. **ADR-0001 is resolved first**: `LICENSE` now carries the complete
   official Apache-2.0 text, and the SPDX identifier is set in every
   `package.json`. The repository carries a real, OSI-approved licence.
2. **A security review passes**: the `SECURITY.md` § "Known gaps" list was
   reviewed. The known gaps are documented and tracked rather than hidden.
   The `.gitignore` covers environment files, geospatial raster formats,
   audio recordings and derived tiles.
3. **No real farmer data, no secrets, no large binaries** are committed. The
   committed case studies carry the farmers' names and the recorded
   interview material; precise coordinates live in the database, not in the
   repository. Audio recordings are excluded and were purged from the git
   history.

**The repository is live at <https://github.com/vip-ultr/dalashift>.**

### What was executed

| Item                                                   | Status |
| ------------------------------------------------------ | ------ |
| Repository visibility set to public                     | Done   |
| `LICENSE` carries the official Apache-2.0 text           | Done   |
| `.gitignore` covers env files, rasters, audio, tiles    | Done   |
| `SECURITY.md` published with the repository              | Done   |
| gitleaks secret scan runs in CI                          | Done   |

### Revisit when

The team decides to publish a separate artefacts-only repository, or a
commercial release requires a more restrictive distribution model. Either
would be a new ADR that supersedes this one.

---

## Reasoning

Three considerations decide this.

**First, the NASA requirement is decisive.** The judge-facing "Link to Final
Project" field explicitly accepts a code repository. A private repository
would need to be made public at the moment of judging, which is a decision
taken under time pressure, with a licence that may still be unresolved, on a
team that is exhausted. **Deciding now and getting it right once is better
than deferring a decision that will be forced anyway.**

**Second, there is genuinely little to protect.** The repository contains:

| Content                         | Sensitive?                                   |
| ------------------------------- | -------------------------------------------- |
| Source code                     | Not sensitive. It is meant to be open source. |
| Architecture and research docs  | Not sensitive: this is the most valuable part, and it is written to be read by other teams. |
| Data source findings            | Not sensitive. All public information.        |
| Secrets, keys, farmer data      | **Must not be there.** Verified by the review. |

A `.env.example` with placeholders, a `.gitignore` covering every geospatial
and secret file type, a gitleaks scan in CI, and a manual review of the
initial commit are sufficient. The `SECURITY.md` policy is published with it,
which is the professional thing to do for a public repository.

**Third, the brief is explicit.** *"The repository is intended to be publicly
accessible."* That is a statement of intent from the team. The purpose of this
ADR is not to overturn it; it is to make sure the decision is recorded
explicitly rather than assumed, and to confirm the preconditions.

**The commercial concern is real but secondary.** If the team later intends
to build a commercial product from this, an Apache-2.0 or MIT licence still
permits that: open source does not prevent commercial use, it requires
attribution. **The decision that protects the commercial option is the
licence choice (ADR-0001), not the visibility choice.**

---

## Consequences

### Positive

- The repository can be linked directly in the NASA submission.
- The documentation reaches the people it is written for.
- External contributions and forks become possible.
- Branch protection and CI are straightforward on a public repository.

### Negative / accepted costs

- The work is publicly attributable and permanent.
- A security mistake would be public.
- The research and architecture become available to anyone, including
  potential competitors. Accepted: the value to the project and to the
  agricultural development community outweighs this.

### Follow-up work

- [ ] **Team decision: before the repository is created.**
- [ ] Resolve [`ADR-0001`](./ADR-0001-open-source-license.md) and write the
      real licence text.
- [ ] Run the secret scan and review the initial commit's contents.
- [ ] Create the repository with the agreed visibility.
- [ ] Confirm the remote and branch after the push.
- [ ] Configure branch protection on `main`: 1 approving review, CI passing,
      no unresolved conversations.
      **[Verified 2026-11-13]** This is currently **not possible on a private
      repository without GitHub Pro**: the API returns *"Upgrade to GitHub Pro
      or make this repository public to enable this feature."* Making the
      repository public enables it immediately; otherwise the team needs a Pro
      plan. Until then, the protection is a **team convention** enforced by
      `CONTRIBUTING.md`, not a GitHub setting.
- [ ] Add the repository URL to `README.md` and to the NASA submission's
      "Link to Final Project" field.

### Revisit when

Never for the initial publication. Visibility can be changed later, but the
history is public either way.
