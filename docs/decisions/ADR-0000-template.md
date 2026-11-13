# ADR-0000: ADR Template

Copy this file to `docs/decisions/ADR-NNNN-short-slug.md` and fill it in.

**Rules for ADRs in this repository:**

1. **Never delete or rewrite an accepted ADR.** If a decision changes, write a
   new ADR that supersedes the old one, and change the old one's status to
   `Superseded by ADR-NNNN`. The history is the value.
2. **An ADR is immutable once accepted.** Only `Status` may change.
3. **Significant decisions need team approval.** Mark them `Proposed` and get
   agreement before implementing.
4. **Numbering is sequential** and never reused.
5. **Link the ADR from `ARCHITECTURE.md` § 18** when it is accepted.

---

# ADR-NNNN: Title

| Field    | Value                              |
| -------- | ---------------------------------- |
| Status   | Proposed \| Accepted \| Superseded by ADR-NNNN \| Deprecated \| Rejected |
| Date     | YYYY-MM-DD                          |
| Deciders | Team member names                  |
| Related  | PRD sections, ARCHITECTURE sections, other ADRs |

## Context

What is the situation? What forces are in play? What constraints apply?

Include:
- The technical problem or opportunity.
- The constraints (timeline, team size, budget, licensing, existing
  commitments).
- The decision criteria that matter.

State facts, not opinions. Cite sources.

## Options considered

### Option A: <name>

- **Description:** what it is.
- **Advantages:** …
- **Disadvantages:** …
- **Risks:** …

### Option B: <name>

- …

### Option C: <name>

- …

## Decision

**We chose <option>.**

State the decision concretely enough that someone can implement it without
re-deriving the reasoning. Name the specific technology, schema, or approach.

## Reasoning

Why this option, over the others?

Tie the reasoning back to the decision criteria. If a criterion was not met by
the chosen option, say so. An ADR that claims no downsides is not credible.

## Consequences

### Positive

- …

### Negative / accepted costs

- …

### Follow-up work

- [ ] …

### Revisit when

State the condition under which this decision should be reconsidered, so it
does not calcify silently.
