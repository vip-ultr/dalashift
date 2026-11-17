# Pages

Every route in the DalaShift application, what is on it, and who owns it.
Route groups (`(marketing)`, `(auth)`, `(dashboard)`) organise the code
without affecting the URL.

Live source tree: `apps/web/src/app/`.

---

## 1. Public pages

| Route | File | Owner | What is on it |
| ----- | ---- | ----- | ------------- |
| `/` | `app/(marketing)/page.tsx` | Khaleel | The proposition, stated plainly: what the tool uses and what it cannot do. The hook, the evidence, the solution, and the route into the case studies. |
| `/methodology` | `app/(marketing)/methodology/page.tsx` | Khaleel | The method in public language. How a comparison is made, what the three claim types mean (farmer report, documented agronomic evidence, environmental observation), and what the engine refuses to do. This is the page a sceptical judge reads. |

---

## 2. Authentication

| Route | File | Owner | What is on it |
| ----- | ---- | ----- | ------------- |
| `/login` | `app/(auth)/login/page.tsx` | Ammar | Email and password, with a visible password toggle. Explicit consent to the terms. |
| `/register` | `app/(auth)/register/page.tsx` | Ammar | Name, email, phone, password, and the consent checkbox. |

Account handling is first-party, not Supabase Auth. See
[`ADR-0012`](../decisions/ADR-0012-first-party-authentication.md).

---

## 3. The workspace

All routes under `(dashboard)` require a session. `apps/web/src/middleware.ts`
redirects unauthenticated requests, and Row Level Security is the real
boundary behind it.

| Route | File | Owner | What is on it |
| ----- | ---- | ----- | ------------- |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Khaleel | The unified entry. Holdings the farmer has registered, the current seasonal situation, and the case studies for the validation area. |
| `/farms` | `app/(dashboard)/farms/page.tsx` | Hamza | The list of registered holdings, each with its area, crop count and last analysis. |
| `/farms/new` | `app/(dashboard)/farms/new/page.tsx` | Hamza | Farm creation. Name, parcels captured by GPS with an accuracy radius or drawn on the map, crops, priorities. The area is computed by PostGIS and confirmed back to the farmer. |
| `/farms/[farmId]` | `app/(dashboard)/farms/[farmId]/page.tsx` | Hamza | The parcel workspace: the parcel sidebar, the map, and the environmental and comparison panels. |
| `/farms/[farmId]/reports` | `app/(dashboard)/farms/[farmId]/reports/page.tsx` | Khaleel | The printable field sheet for a single holding. |
| `/reports` | `app/(dashboard)/reports/page.tsx` | Khaleel | Reports across the farmer's holdings. |
| `/profile` | `app/(dashboard)/profile/page.tsx` | Khaleel | Name, contact details, language preference, and the coordinate-redaction setting. |
| `/cases` | `app/(dashboard)/cases/page.tsx` | Hamza | The anonymised validation case studies: interviews with smallholders in Tofa LGA. |
| `/cases/[slug]` | `app/(dashboard)/cases/[slug]/page.tsx` | Hamza | One case study in full: the farmer, the parcels, the crops, the rotation, the environmental evidence with provenance, and the comparison. |

---

## 4. API routes

Every handler follows the same five steps: **validate, authorise, call the
service, map the error, respond**. Zod validates every input.

### Authentication

| Route | Methods | Purpose |
| ----- | ------- | ------- |
| `/api/auth/register` | POST | Create an account. Returns the session cookie. |
| `/api/auth/login` | POST | Exchange credentials for a session cookie. |
| `/api/auth/logout` | POST | Destroy the session. |

### Farms and parcels

| Route | Methods | Purpose |
| ----- | ------- | ------- |
| `/api/farms` | GET, POST | List the farmer's holdings. Create a holding with its parcels. |
| `/api/farms/[farmId]` | GET, PATCH, DELETE | Read, update or remove one holding. |
| `/api/farms/[farmId]/parcels` | GET, POST | List and create parcels. |
| `/api/farms/[farmId]/parcels/[parcelId]` | GET, PATCH | Read and update one parcel, including its geometry and accuracy radius. |
| `/api/farms/[farmId]/crops` | GET, POST | List and create crop records for a parcel. |
| `/api/farms/[farmId]/crops/[cropRecordId]` | PATCH, DELETE | Update or remove one crop record, moving it through current, previous and planned. |
| `/api/farms/[farmId]/priorities` | GET, PUT | Read and write the farmer's stated priorities and risk tolerance. |

### Analysis and output

| Route | Methods | Purpose |
| ----- | ------- | ------- |
| `/api/farms/[farmId]/environment` | GET | Environmental observations for a parcel over a period, each with source, resolution, observation date and coverage fraction. |
| `/api/farms/[farmId]/compare` | POST | Run the comparison engine. Returns the existing practice and the alternatives, each with its rationale, evidence, benefits, information gaps and local-review risks. |
| `/api/farms/[farmId]/reports` | POST | Generate a report from stored data. Reports are regenerated, never served from a stale file. |

### Reference and profile

| Route | Methods | Purpose |
| ----- | ------- | ------- |
| `/api/catalog/crops` | GET | The crop catalog, with aliases and the unresolved-name list. |
| `/api/profile` | GET, PATCH | The farmer's profile and preferences. |

---

## 5. Shared components

| Component | Owner | Purpose |
| --------- | ----- | ------- |
| `components/dashboard/provenance-line.tsx` | Khaleel | The line under every number: source, resolution in plain words, observation date. Enforces the resolution-honesty rule. |
| `components/dashboard/situation-banner.tsx` | Khaleel | The one sentence at the top of a farm: what the season looks like. |
| `components/dashboard/dimension-threshold-row.tsx` | Khaleel | One dimension: the measured value, the cited threshold, and the evidence strength. No composite score. |
| `components/dashboard/rotation-strategy-card.tsx` | Khaleel | One rotation strategy, with its four required fields. |
| `components/dashboard/planting-trigger-card.tsx` | Khaleel | The planting trigger, the farmer's own rule, and the trade-off between them. |
| `components/dashboard/seasonal-outlook-panel.tsx` | Khaleel | The seasonal risk outlook. Framed as an outlook, never as a forecast. |
| `components/dashboard/data-state-boundary.tsx` | Khaleel | Loading, empty, error and stale states for every data view. |
| `components/dashboard/printable-field-sheet.tsx` | Khaleel | The printable report, with source attribution and coordinates redacted by default. |
| `components/dashboard/parcel-workspace-view.tsx` | Hamza | The parcel workspace shell. |
| `components/dashboard/registered-farm-workspace.tsx` | Hamza | The registered holding view. |
| `components/maps/honesty-map-canvas.tsx` | Hamza | The MapLibre canvas. Draws the farm parcel and, over it, the grid cell of any coarse value on display. |
| `components/charts/honesty-time-series-chart.tsx` | Khaleel | A time series that shows gaps as gaps and never flattens a missing period into a line. |
| `components/farms/parcel-vector-thumbnail.tsx` | Hamza | A parcel outline in a list row. |
| `components/layout/workspace-rail.tsx` | Khaleel | The desktop navigation rail. |
| `components/layout/parcel-sidebar-drawer.tsx` | Hamza | The parcel drawer on narrow screens. |
| `components/layout/public-navbar.tsx` | Khaleel | The public navigation. |

---

## 6. Feature slices

`apps/web/src/features/` holds the vertical slices. A slice owns its data and
its presentation, and does not import another slice's internals.

| Slice | Contains |
| ----- | -------- |
| `features/recommendations/engine/` | `assess-crop.ts`, `assess-planting-trigger.ts`, `build-crop-inputs.ts`, `build-rotation-strategies.ts`, `compare-rotations.ts`, `compare-suitability.ts` |
| `features/outlook/` | `assess-seasonal-outlook.ts` |
| `features/crops/` | `catalog.ts`, the cited crop reference list (no personal data) |
| `features/reports/` | `build-farm-report.ts` |
