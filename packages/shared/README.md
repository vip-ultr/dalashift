# DalaShift: Shared Package

Framework-agnostic types, validation schemas and constants shared between the
web application and any future server, worker or script.

**Status: Phase 1 (foundation).** Contains only the scaffolding needed for the
workspace to type-check. Entity types and Zod schemas are Phase 2 deliverables
and are specified in [`docs/database/data-model.md`](../../docs/database/data-model.md).

## Intended contents

| Directory    | Responsibility                                                        |
| ------------ | --------------------------------------------------------------------- |
| `types/`     | TypeScript interfaces and discriminated unions for domain entities    |
| `schemas/`   | Zod schemas used for runtime validation of API inputs and outputs     |
| `constants/` | Enums, spatial/temporal resolution constants, unit conversions       |

## Rules

- This package must stay dependency-light and runtime-agnostic. It may import
  `zod`; it must not import Next.js, React, or Supabase client code.
- Types shared with the database are derived from the canonical schema in
  `docs/database/database-design.md`, not hand-duplicated.
