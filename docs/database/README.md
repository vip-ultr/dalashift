# Documentation — `docs/database/`

Database design and data-access rules.

| File                                                | Purpose                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| [`data-model.md`](./data-model.md)                    | **The canonical schema.** Every table, column, constraint and index. |
| [`postgis-design.md`](./postgis-design.md)            | Geometry types, SRID, the spatial functions, indexing, aggregation.  |
| [`rls-policies.md`](./rls-policies.md)                | Row Level Security — the authorisation boundary.                    |

---

## The three rules that matter most

1. **RLS is the authorisation boundary.** Application-level checks improve the
   user experience; the database enforces the rule. A table shipped without
   policies is a security defect.
2. **Provenance is part of the data.** Every environmental value stores its
   source, licence, spatial resolution, temporal resolution, observation
   date, retrieval date and whether it is modelled. A value without
   provenance is not acceptable to store.
3. **PostGIS computes the geometry.** Farm area, plot area, intersections
   and containment are computed in the database. The client-side Turf area is
   a drawing-time preview; the database value is authoritative.

---

## Status

**Phase 1 contains no migrations.** The schema is specified here and
implemented in Phase 2 under `supabase/migrations/`.

Migrations and their RLS policies land **together** — never a table without
its policies.

---

## Naming conventions

| Kind                  | Convention                                     | Example                     |
| --------------------- | ---------------------------------------------- | --------------------------- |
| Table                 | `snake_case`, plural                            | `environmental_observations` |
| Column                | `snake_case`                                    | `spatial_resolution_m`       |
| Primary key           | `id`                                             | `id uuid primary key`        |
| Foreign key column    | `<singular table>_id`                           | `farmer_id`                  |
| Enum-like column      | `text` + `CHECK` constraint                     | `status`                     |
| Boolean               | `is_` / `has_` prefix                           | `is_modelled`                |
| Timestamp             | `_at` suffix                                    | `observed_at`                |
| Date                  | `_date` suffix, type `date`                    | `planting_date`              |
| Index                 | `idx_<table>_<columns>`                         | `idx_farms_boundary_gist`    |

**Text + CHECK, not a PostgreSQL `ENUM` type.** Adding a value to a native
enum requires `ALTER TYPE`, which is awkward inside a transaction and breaks
migrations that expect a plain column. A `CHECK` constraint is a one-line
change and reads the same in the schema.

---

## Reading order

1. [`data-model.md`](./data-model.md) — what exists and why.
2. [`postgis-design.md`](./postgis-design.md) — how the spatial parts work.
3. [`rls-policies.md`](./rls-policies.md) — who can see what.
