# ADR-0003 — Supabase + PostGIS as the Data Platform

| Field    | Value                                                              |
| -------- | ------------------------------------------------------------------ |
| Status   | Accepted                                                          |
| Date     | 2026-11-13                                                        |
| Deciders | Team                                                              |
| Related  | `ARCHITECTURE.md` § 5, `SECURITY.md`, `docs/database/`, `PRD.md` § 5 |

---

## Context

DalaShift needs a database that stores:

- Relational farmer, farm, crop and analysis records.
- **Geospatial data** — farm boundary polygons and plot polygons.
- Authentication with per-user access control.
- Object storage for farm photographs and generated reports.
- A durable cache for upstream API responses (serverless has no persistent
  process memory).

The fundamental constraint is that **every farmer must only ever see their own
data**. That is a security property, not a feature.

### Decision criteria

| Criterion                                    | Weight |
| -------------------------------------------- | ------ |
| Row-level, per-user access control           | High   |
| Native geospatial types, indexing and functions | High   |
| Managed operation (3 people, 48 hours)       | High   |
| Integration with Next.js auth                 | High   |
| No separate infrastructure to run            | High   |
| Cost during the hackathon                     | Medium |

## Options considered

### Option A — Supabase (PostgreSQL + PostGIS + Auth + Storage + RLS)

- **Advantages:** All five needs in one managed platform. PostGIS is
  PostgreSQL-native, so `ST_Area`, `ST_Intersects` and GIST indexes work
  alongside the relational model with no separate spatial database. RLS is a
  first-class, database-enforced authorisation layer — the authorisation
  boundary is not an application-layer convention that can be bypassed by a
  forgotten `where` clause. `@supabase/ssr` integrates cleanly with Next.js.
  Row Level Security also means the browser can read the database directly
  without every read going through an API route — a significant simplification.
- **Disadvantages:** Vendor coupling. Free-tier rate limits and project
  pausing need watching. RLS policies must be written correctly — a wrong
  policy is a security hole, and policies are code that needs review.
- **Risks:** A badly written RLS policy leaks data. Mitigated by policy
  review and by tests that assert cross-account isolation.

### Option B — PostgreSQL + PostGIS on a managed host, separate Auth provider

- **Advantages:** Full database control; the auth provider is a swappable
  concern.
- **Disadvantages:** More moving parts for a 3-person team. Authentication and
  database authorisation must be wired together manually, which is exactly
  where mistakes happen.
- **Risks:** More time spent on plumbing instead of product.

### Option C — MongoDB with geospatial indexes + a separate auth provider

- **Advantages:** Flexible document model.
- **Disadvantages:** The domain model is strongly relational (farms → crops →
  analyses → recommendations). GeoJSON documents in Mongo would duplicate the
  relational model in a worse form, and PostGIS's spatial function library has
  no equivalent.
- **Risks:** Rewriting spatial queries by hand.

### Option D — A spatial database (PostGIS, SpatiaLite, or a dedicated raster
store) as the primary store

- **Advantages:** Purpose-built for the hardest requirement.
- **Disadvantages:** The hardest requirement is one of five; making it the
  primary store splits the data across systems and breaks transactions.
- **Risks:** Over-engineering for the actual bottleneck.

### Option E — Firebase / Firestore + Cloud Storage

- **Advantages:** Excellent mobile client sync; simple security rules.
- **Disadvantages:** Firestore's security rules model is unfamiliar to most
  SQL developers and harder to audit for the "farmer sees only their own data"
  requirement. The geospatial story is weak. Firestore is also being
  superseded by Firebase Data Connect for relational use.
- **Risks:** Rewriting the whole model mid-hackathon.

## Decision

**Option A — Supabase as the single platform for database, authentication,
storage and cache.**

**PostGIS is the geospatial authority.** All spatial computation happens in
PostgreSQL, not in JavaScript:

| Operation                       | Implementation                              |
| ------------------------------- | -------------------------------------------- |
| Farm area                       | `ST_Area(boundary::geography)` — spherical, correct |
| Plot area within a farm         | `ST_Area(ST_Intersection(...)::geography)`    |
| Point-in-polygon                | `ST_Contains` / `ST_Intersects`              |
| Spatial indexing                | GIST indexes on `boundary`, `centroid`, `location` |
| Centroid                        | `ST_Centroid(boundary)`                      |
| Validity                        | `ST_IsValid` / `ST_MakeValid`                |

**Rasters are never stored in PostgreSQL.** See ADR-0005.

**Row Level Security is the authorisation boundary.** Application-level
checks improve the user experience; RLS enforces the rule.

**Service-role access is restricted** to background jobs and administrative
operations. It is never used to serve a user request directly.

**The durable cache lives in the same database** (`external_cache`), because
Vercel serverless has no persistent process memory and no writable persistent
filesystem.

## Reasoning

The decisive factor is that **the hardest requirement — per-farmer data
isolation — is enforced by the database, not by application code.**

With RLS, a whole class of bug disappears: a forgotten `where farmer_id = ?`
in a query cannot leak data, because the policy rejects the row regardless of
what the query asked for. With an application-enforced model, every future
query is a potential leak, and every future contributor has to remember.

That matters more than usual here: three people, an AI agent writing code, and
a 48-hour build. The design should make the safe path the default path.

PostGIS was also decisive on the geospatial side. Alternatives — computing
areas with Turf and storing them as columns — look equivalent until you need
to ask "which farms intersect this plot?" or "which farms fall inside this
rainfall cell?". Those questions are natural in SQL with a spatial index and
painful without one. A smallholder farm being a sub-hectare polygon makes
correct spherical area computation non-negotiable; `ST_Area` on a raw
4326 geometry returns square degrees, which is a silent, wrong answer.

Rejecting MongoDB also matters for the time budget: modelling farms, crops,
analyses and recommendations relationally is natural, and the domain
relationships (a farm has many plots, each with crops; an analysis produces
recommendations) are already relational in the product thinking.

## Consequences

### Positive

- One platform, one credential set, one dashboard — minimal operational load.
- Authorisation is database-enforced and auditable.
- Spatial and relational queries combine in a single statement.
- The browser can read farmer-scoped data directly, so many read paths need no
  API route at all.
- Storage for photographs and reports is private-bucket + signed-URL by
  default.
- The cache table survives cold starts.

### Negative / accepted costs

- **RLS policies are security-critical code.** They get reviewed like code.
  `docs/database/rls-policies.md` defines them before any migration is written.
- Supabase free-tier limits exist and must be checked against expected demo
  load. **[Open]** — which plan the team uses is not yet decided; a Pro plan
  may be needed for `pg_cron` and for pooler mode.
- Vendor coupling: moving off Supabase would be a real migration.
- The service-role key is the most dangerous secret in the project.

### Follow-up work

- [ ] Write the RLS policies and a cross-account isolation test **before** the
      first user-facing migration.
- [ ] Confirm which Supabase plan the team uses, and whether the pooler is
      needed for serverless connection management.
- [ ] Review connection pooling behaviour under Vercel serverless concurrency.
- [ ] Decide whether generated reports use a signed URL or an inlined
      render — affects the `storage_path` semantics.

### Revisit when

- Free-tier limits are consistently exceeded.
- A requirement emerges that PostGIS/RLS genuinely cannot serve — e.g. heavy
  raster zonal statistics that need a dedicated processing tier (see ADR-0005
  and ADR-0008).
- Team size grows enough that independent deployable services become
  practical.
