# DalaShift: Web Application

The Next.js application: user-facing product surface **and** the server-side
integration layer for NASA Earth observation data, Supabase and the agricultural
analysis engine.

**Status: built.** The App Router routes, API route handlers, feature slices,
components and integrations in this directory are the current implementation.
See [`CHANGELOG.md`](../../CHANGELOG.md) for what landed and when, and
[`docs/build/PAGES.md`](../../docs/build/PAGES.md) for the page inventory.

## Local development

```bash
pnpm install
cp .env.example .env.local   # then fill in real values
pnpm dev
```

The app is served at <http://localhost:3000>.

## Structure

| Path             | Responsibility                                                     |
| ---------------- | ------------------------------------------------------------------ |
| `src/app/`       | App Router routes and API route handlers                            |
| `src/components/`| Presentational, reusable UI (`ui/`, `layout/`, `dashboard/`, …)     |
| `src/features/`  | Vertical feature slices: the unit of product work                  |
| `src/lib/`       | Integrations, geospatial helpers, Supabase clients, utilities       |
| `src/hooks/`     | Shared React hooks                                                  |
| `src/types/`     | App-local TypeScript types                                          |
| `src/styles/`    | Component-level styles not expressible in Tailwind                  |
| `tests/`         | Unit, integration and end-to-end tests                              |

`src/lib/integrations/` is **server-only**. No file in that directory may be
imported from a Client Component. See `ARCHITECTURE_ESSENTIALS.md` § Security rules.