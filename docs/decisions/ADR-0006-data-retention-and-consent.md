# ADR-0006: Data Retention, Consent and Farmer Data

| Field    | Value                                                             |
| -------- | ----------------------------------------------------------------- |
| Status   | **Proposed (awaiting team decision)**                            |
| Date     | 2026-11-13                                                       |
| Deciders | Team                                                             |
| Related  | `SECURITY.md`, `PRD.md` FR-1, `docs/database/rls-policies.md`     |

---

## Context

DalaShift handles two categories of data that a farmer has not consented to
being collected by a third party in the way a typical SaaS product does:

1. **Precise farm location and boundary.** A farm polygon is commercially
   sensitive. It reveals what a household is growing, whether they are
   vulnerable, and where land disputes may exist.
2. **Field-validation data.** Anything collected from farmers during the
   hackathon in Tofa (interview notes, photographs, yield observations,
   planting dates) is the highest-sensitivity data the project will touch.

**[Confirmed]** The platform must collect only information with a clear
product purpose.

**[Open]** The following are unresolved and need team decisions:

| # | Question                                                     |
| - | ------------------------------------------------------------- |
| 1 | What is the retention period for a farmer's farm and analysis data? |
| 2 | What happens on account deletion: immediate hard delete, or a soft delete with a grace period? |
| 3 | Is a farmer's farm polygon ever exposed outside their account? |
| 4 | What consent is required for field-validation data, and how is it recorded? |
| 5 | Does the platform require an explicit opt-in for any data sharing? |
| 6 | Can a farmer export their data, and in what format? |

---

## Options considered

### Option A: Store everything indefinitely

- **Advantages:** Simplest. Full history for research.
- **Disadvantages:** No basis for indefinite retention of a farmer's precise
  location. Creates an unbounded liability. **[Proposed]** Hard to defend to a
  farmer or to a judge.
- **Risks:** A data breach exposes every farmer's location. Deleting an
  account becomes impossible.

### Option B: Delete everything on account deletion

- **Advantages:** Maximum privacy. Simple to explain. Aligns with
  GDPR-style erasure.
- **Disadvantages:** Destroys aggregate value. A farmer who wants to leave
  cannot take their records with them.
- **Risks:** A cascading delete could be slow and could fail partially.

### Option C: Tiered retention with a grace period and export

- **Description:** A defined retention period for analysis data, a soft-delete
  grace window, and a self-service export.
- **Advantages:** Balanced. The farmer can leave and take their data. The
  platform can delete on request. A clear, defensible policy.
- **Disadvantages:** More implementation work: a scheduled purge job, an
  export endpoint, a soft-delete column.
- **Risks:** The grace period means some data outlives the account briefly.

### Option D: Aggregated, anonymised research data

- **Description:** Strip the farmer identifier and the precise geometry from
  data used for research, retaining only coarse aggregates.
- **Advantages:** Research value without keeping the sensitive link.
- **Disadvantages:** The anonymisation itself must be done carefully: farm
  polygons in a sparsely populated area can be re-identifiable from their
  shape and location.
- **Risks:** False confidence in the anonymity.

---

## Decision

**Not yet decided (but the following are proposed and the reasoning is
recorded so the team can approve or amend it).**

### Proposed retention

| Data class                       | Retention                                            | Rationale                                |
| -------------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| Farmer profile                   | Until account deletion                                |                                          |
| Farm, plot and crop records      | Until account deletion                                |                                          |
| Environmental observations       | Until account deletion                                | They are derived, not personal          |
| Analyses, recommendations, rotations | Until account deletion                            |                                          |
| Reports                          | Until account deletion                                |                                          |
| **Cached upstream responses**    | **Per the source TTL; purged when expired**           | Not personal; a technical necessity      |
| **De-identified research aggregates** | **Indefinitely, with the farmer identifier and exact geometry removed** | The long-term value |
| **Audit logs**                   | **90 days**                                           | Enough to investigate an incident        |

### Proposed deletion behaviour

**[Proposed]** A soft delete first, with a **30-day grace period**, then a
hard delete that cascades to every dependent row.

- The farmer sees *"Your account will be permanently deleted on [date]. You can
  restore it until then."*
- The hard delete cascades: `farms` → `parcels`, `farm_crops`,
  `farm_priorities`, `analyses` → `recommendations`, `rotation_strategies` →
  `rotation_legs`, `environmental_observations`, `reports`.
- Storage objects (photographs, generated reports) are deleted from the
  bucket by prefix.
- A purge job runs daily and removes anything past the grace period.

### Proposed export

**[Proposed]** A farmer can export their complete data as JSON and CSV (their
farms, boundaries (as GeoJSON), crops, analyses, recommendations and reports)
from a settings page. This is the fair counterpart to a deletion right, and it
is cheap to build once the queries exist.

### Proposed consent

**[Proposed] Field-validation data is handled on paper, not in the platform
during the hackathon.**

| Rule                                                                       | Reason                                                     |
| --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Interviews are recorded as **notes**, not as structured farmer records     | Notes are easier to delete and less likely to be leaked     |
| **No farm polygon, name, or phone number is entered into the live app** during validation | The demo database must not accumulate real farmer data |
| Any farmer who does register gets **explicit verbal consent** recorded with the date and the interviewer's name | A paper consent record is defensible; a vague verbal one is not |
| Photographs of farmers are **not taken** without specific, separate consent | Lowest-risk default                                          |
| Validation notes are stored in a **local encrypted store**, not in the repository and not in the demo Supabase project | Keeps the public repository and the demo database clean |

**[Proposed]** If a farmer's data is entered into the platform for
demonstration, the record is deleted immediately afterwards and the deletion
is confirmed in the field notes.

### Proposed non-disclosure

**[Proposed] A farmer's precise farm geometry is never exposed outside their
own account.** Specifically:

- Not in any public leaderboard, map of "all users' farms", or aggregate
  view.
- Not in a shared report without explicit, per-report consent.
- Not in error logs or analytics payloads.
- A report's default output **excludes exact coordinates**; it names the
  nearest named place and the area in hectares.

**[Proposed]** Aggregate multi-farm views (for extension workers, in a later
phase) show counts and area statistics, **not** the individual farm polygons,
unless the farmer has consented.

---

## Reasoning

The balance is between two real obligations: **the farmer's privacy** and
**the platform's usefulness**. A product that deletes everything on request
is respectful but frustrates a farmer who wants their history; a product that
keeps everything indefinitely is useful but indefensible.

The tiered approach serves both: the farmer keeps their data while they are
with the platform, can take it with them when they leave, and can ask for its
removal without ceremony. The research value is preserved in a de-identified
form.

**The most important decision here is about field-validation data, not about
the product.** During the hackathon the team will be talking to farmers and
may be tempted to enter their details into the demo to make it look real.
That would put real personal data into a database that may be reset, shared
with judges, or publicly accessible. The rule should be: **the demo contains
synthetic farms; real farmer data stays on paper.**

---

## Consequences

### Positive

- A defensible, explainable privacy position.
- The repository and the demo database contain no real farmer data: a
  requirement that also satisfies the NASA rule about not including
  copyrighted or restricted material.
- Farmers can take their data with them.
- Research value is preserved in a safe form.

### Negative / accepted costs

- A scheduled purge job and an export endpoint are real work.
- The 30-day grace period means a small amount of data outlives the account
  briefly.
- De-identification is genuinely hard for farm polygons; it must be done
  carefully.

### Follow-up work

- [ ] Team decision on retention periods, grace period and export.
- [ ] Add `deleted_at` to `profiles` and `farms`; implement the soft delete.
- [ ] Implement the cascading hard delete.
- [ ] Implement the daily purge job.
- [ ] Implement the export endpoint.
- [ ] Write the privacy summary for the product's own "About" page.
- [ ] Write the paper consent form for field validation.

### Revisit when

- The platform gains a paying customer relationship, which changes the
  retention calculus.
- The extension-worker role is implemented, which changes who can see whose
  data.
