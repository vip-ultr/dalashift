# DalaShift: Shared Package

Framework-agnostic types, validation schemas and constants shared between the
web application and any future server, worker or script.

**Status: populated.** The shared package holds the live types, Zod schemas
and constants consumed by `apps/web`. New entities land here before any
feature code is written against them; see
[`docs/database/data-model.md`](../../docs/database/data-model.md) for the
canonical schema.

## Contents

| Directory    | Responsibility                                                        |
| ------------ | --------------------------------------------------------------------- |
| `types/`     | TypeScript interfaces and discriminated unions for domain entities    |
| `schemas/`   | Zod schemas used for runtime validation of API inputs and outputs     |
| `constants/` | Enums, spatial/temporal resolution constants, unit conversions       |

## Rules

- This package must stay dependency-light and runtime-agnostic. It may import
  `zod`; it must not import Next.js, React, or Supabase client code.
- Types shared with the database are derived from the canonical schema in
  `docs/database/data-model.md`, not hand-duplicated.