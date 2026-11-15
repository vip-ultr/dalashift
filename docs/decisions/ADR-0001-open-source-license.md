# ADR-0001: Open-Source License

| Field    | Value                                                            |
| -------- | ---------------------------------------------------------------- |
| Status   | **Accepted**                                                     |
| Date     | 2026-11-13 (updated 2026-11-14 with the team decision)          |
| Deciders | All three team members (unanimous required)                     |
| Related  | `LICENSE`, `README.md` § License, `SECURITY.md`, `PRD.md` OQ-7, `docs/hackathon/README.md` § 4.1 |

---

## Context

**This is now a hard submission requirement, not a preference.**

NASA Space Apps Participant Terms & Conditions
(<https://www.spaceappschallenge.org/legal/>, updated 7 August 2026),
"Intellectual Property Rights in Solutions":

> *"All posted Solutions will be available for others to download or use. You
> agree that any original content (that is, content that you have created for
> the NASA Space Apps Challenge) is **freely available without restriction or
> is licensed as open source as defined by the Open Source Initiative (OSI)**."*

> *"**If you do not specify a specific OSI compliant license, NASA will
> distribute your original content under an Apache 2.0 license.**"*
> → <https://www.opensource.org/licenses/Apache-2.0>

And for third-party materials:

> *"Any licenses applicable to your Solution Materials must be identified in
> the documentation that you submit with your Solution. NASA will not accept or
> post any Solutions that do not include appropriate license documentation."*

### What this means concretely

1. **The repository must carry a complete, real OSI-approved licence text.**
   The current placeholder file is **not acceptable** for submission.
2. **Every dependency's licence must be identifiable** in the submission
   documentation. Our `docs/api/data-sources.md` attribution register covers
   the data sources; a `THIRD_PARTY_NOTICES.md` must cover the npm packages.
3. **A data source's licence is separate from the code's licence.** SoilGrids
   (CC BY 4.0) and Open-Meteo (CC BY 4.0) require attribution regardless of
   which code licence we pick.

### Deadline

**15 November 2026, 23:59 local**: the NASA project submission deadline. The
licence must be in place well before that. See
[`docs/hackathon/README.md`](../hackathon/README.md) § 7.

### Other constraints

- The licence must permit open-source participation (an OSI licence satisfies
  this by definition).
- It must be compatible with our dependencies (verified below).

### Dependency licence compatibility: verified

| Dependency group          | Licence                              | MIT/Apache-2.0-compatible? |
| ------------------------- | ------------------------------------ | -------------------------- |
| Next.js, React            | MIT                                  | Yes                        |
| Turf                      | MIT                                  | Yes                        |
| MapLibre GL JS            | BSD-3-Clause                         | Yes                        |
| PostGIS / PostgreSQL      | GPL-2.0 / PostgreSQL licence         | **Not linked**: used as a managed Supabase service, not distributed  |
| shadcn/ui + Radix         | MIT                                  | Yes                        |
| ISRIC SoilGrids **data**  | CC BY 4.0                            | N/A: attribution required, not a code licence  |
| Open-Meteo **data**       | CC BY 4.0                            | N/A: attribution required  |
| Copernicus Sentinel-2 **data** | Copernicus Sentinel Data Terms  | N/A: attribution expected  |

**Important:** PostGIS and PostgreSQL are consumed as a **hosted Supabase
service**, not linked into the repository. This does not impose GPL
obligations on DalaShift's own code. The same is true of Google Earth Engine
(platform Terms of Service) and the DAACs (data licences, not code).

## Options considered

### Option A: MIT

- **Advantages:** The most permissive and most common choice for hackathon and
  community projects. Maximum adoption. Very short text. No patent grant
  (though MIT's grant is broad in practice).
- **Disadvantages:** Permits a closed commercial derivative with no obligation
  to share changes. No explicit patent grant.
- **Risk:** A commercial agritech platform could republish the code with
  minimal changes and no obligation beyond the licence text.

### Option B: Apache-2.0

- **Advantages:** MIT-like permissiveness plus an **explicit patent grant** and
  a patent-retaliation clause. Widely accepted. **It is also NASA's own
  default licence** if a team specifies nothing, so choosing it explicitly
  means our licence and NASA's fallback agree.
- **Disadvantages:** Longer text (with the appendix). Same lack of
  reciprocity as MIT.
- **Risk:** Same closed-derivative risk as MIT.

### Option C: AGPL-3.0

- **Advantages:** Strong copyleft extended to network use. A hosted modified
  version must release its source. Prevents a closed SaaS fork while allowing
  private, unmodified use.
- **Disadvantages:** Discourages adoption by organisations that cannot
  contribute back. Requires careful compliance (source offer, "Powered by
  AGPL" notice). More complex for downstream users. **Must be checked against
  the official hackathon rules**; it *is* OSI-approved, so it satisfies the
  open-source requirement, but it adds compliance burden during a 48-hour
  build.
- **Risk:** May be read as hostile by judges evaluating adoption potential, and
  may complicate any third-party contribution.

### Option D: GPL-3.0

- **Advantages:** Strong copyleft for distributed derivatives. Familiar. OSI
  approved.
- **Disadvantages:** Does not reach network use: a hosted copy need not
  publish. Leaves the exact gap AGPL was designed to close.

### Option E: A restrictive / source-available licence

- **Description:** e.g. "Commons Clause", BUSL, or a custom licence that
  permits use but prohibits competing commercial services.
- **Advantages:** Maximum control for the team.
- **Disadvantages:** **Very likely to conflict with the open-source
  participation requirement.** A source-available licence is generally *not*
  open source by OSI definition. The Terms state the content must be
  *"freely available without restriction or is licensed as open source as
  defined by the OSI"*. A restrictive clause would fail that test.
- **Risk:** **Rejection of the solution.** Not acceptable.

## Decision

**Accepted on 14 November 2026, unanimously: DalaShift is licensed under
Apache License 2.0.**

The `LICENSE` file now contains the complete, unmodified official text of the
Apache License, Version 2.0, with the copyright line completed as
"Copyright 2026 DalaShift contributors". The SPDX identifier `Apache-2.0` is
set in the `license` field of the root `package.json` and in every workspace
package.

Rationale, as recorded in the recommendation above:

- It is **OSI approved**, so it satisfies the NASA requirement unambiguously.
- It is **NASA's own default**, so our licence and NASA's fallback agree.
- It includes an **explicit patent grant**, which MIT lacks: a genuine
  benefit for a team that may later incorporate third-party code.
- It is compatible with every dependency in our tree.

**MIT was the equally acceptable alternative** and remains a defensible choice
for a future revision. The difference is the patent grant and the longer
licence text. Apache-2.0 was chosen because it is the licence NASA would
apply anyway, so there is no divergence between what the team ships and what
the organiser distributes.

### What was executed

| Item                                                        | Status |
| ----------------------------------------------------------- | ------ |
| `LICENSE` replaced with the official Apache-2.0 text          | Done   |
| `package.json` `license` field set to `Apache-2.0`           | Done   |
| Workspace packages carry the SPDX identifier                  | Done   |
| `README.md` § License updated                                | Done   |
| `THIRD_PARTY_NOTICES.md` lists every dependency and data source | Done   |

**Data licensing remains separate from code licensing.** This licence grants
rights in the code only. SoilGrids (CC BY 4.0), Open-Meteo (CC BY 4.0) and
the NASA products carry their own terms, and the attribution obligations
recorded in [`docs/api/data-sources.md`](../api/data-sources.md) are
discharged by the in-product attribution panel and the generated reports,
not by this file.

### Revisit when

The team wants a shorter licence, or a future commercial release of the
platform needs a different distribution model. A change is a new ADR that
supersedes this one; the file is never edited in place to a different
licence.

## Reasoning

The decision is deferred to the team because it has genuine trade-offs in both
directions and the team's intent is not inferable from the brief:

- The team may value maximum adoption and openness (→ MIT / Apache-2.0).
- The team may value protecting the work from commercial capture (→ AGPL-3.0).
- The team's actual goals are not inferable from the brief.

What *is* now settled by the research is the constraint set: **OSI-approved or
freely available, with per-dependency licence documentation.** Option E is
eliminated. Apache-2.0 and MIT are both safe. AGPL-3.0 is safe but carries
compliance burden worth thinking about carefully in 48 hours.

The deadline makes this the highest-priority open decision in the repository.

## Consequences

### Negative

- **The repository cannot be submitted as an open-source project until this is
  resolved.** This is a blocking dependency for the 15 November submission.
- Teammates cannot safely share the repository publicly before the decision.

### Follow-up work

- [ ] **Team discussion; unanimous decision before 15 November.** Highest
      priority open item.
- [ ] Replace the `LICENSE` file with the full official text.
- [ ] Update the `License` section of `README.md`.
- [ ] Set the SPDX identifier in `package.json` (`"license": "Apache-2.0"`).
- [ ] Create `THIRD_PARTY_NOTICES.md` listing every direct dependency and
      data source with its licence: **required by the NASA Terms**
      (*"Any licenses applicable to your Solution Materials must be identified
      in the documentation that you submit with your Solution."*).
- [ ] Re-tag the release commit.

### Revisit when

Never, once accepted, a licence change after publication is legally
significant and requires the agreement of all contributors.
