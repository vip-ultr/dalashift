# Third-Party Notices

**This file is required by the NASA Space Apps Challenge.** The Participant
Terms & Conditions state:

> *"Any licenses applicable to your Solution Materials must be identified in
> the documentation that you submit with your Solution. NASA will not accept
> or post any Solutions that do not include appropriate license documentation."*
> Source: <https://www.spaceappschallenge.org/legal/>

and

> *"**You must cite every source that is used in the creation of your project,
> even if it is open source or freely available.**"*

**Last generated: 2026-11-13.** Regenerate with
`node scripts/validation/generate-third-party-notices.mjs`.

---

## 1. Software dependencies

Licences below were read from each installed package's `package.json`, not
recalled. **Every entry is compatible with MIT, Apache-2.0 and AGPL-3.0.**

### Runtime dependencies

| Package                    | Licence      | Version  |
| -------------------------- | ------------ | -------- |
| `@hookform/resolvers`      | MIT          | 7.0.6    |
| `@supabase/supabase-js`    | MIT          | 2.119.0  |
| `@turf/turf`               | MIT          | 7.4.0    |
| `class-variance-authority` | Apache-2.0   | 0.7.1    |
| `clsx`                     | MIT          | 2.1.1    |
| `date-fns`                 | MIT          | 4.4.0    |
| `lucide-react`             | ISC          | 1.72.0   |
| `maplibre-gl`              | BSD-3-Clause | 6.18.0   |
| `next`                     | MIT          | 16.4.6   |
| `react`                    | MIT          | 19.3.1   |
| `react-dom`                | MIT          | 19.3.1   |
| `react-hook-form`          | MIT          | 7.92.0   |
| `recharts`                 | MIT          | 3.10.1   |
| `tailwind-merge`           | MIT          | 3.7.0    |
| `terra-draw`               | MIT          | 1.39.0   |
| `zod`                      | MIT          | 4.6.7    |

### Development dependencies

| Package                 | Licence    | Version  |
| ----------------------- | ---------- | -------- |
| `@playwright/test`      | Apache-2.0 | 1.65.0   |
| `@tailwindcss/postcss`  | MIT        | 4.3.5    |
| `@testing-library/dom`  | MIT        | 10.4.2   |
| `@testing-library/jest-dom` | MIT    | 7.0.1    |
| `@testing-library/react`    | MIT    | 16.3.3   |
| `@testing-library/user-event` | MIT   | 14.6.10  |
| `@types/node`           | MIT        | 22.20.5  |
| `@types/react`          | MIT        | 19.3.0   |
| `@types/react-dom`      | MIT        | 19.3.0   |
| `@vitejs/plugin-react`  | MIT        | 6.3.0    |
| `eslint`                | MIT        | 9.39.5   |
| `eslint-config-next`    | MIT        | 16.4.6   |
| `jsdom`                 | MIT        | 31.0.0   |
| `postcss`               | MIT        | 8.5.32   |
| `prettier`              | MIT        | 3.10.1   |
| `tailwindcss`           | MIT        | 4.3.5    |
| `tw-animate-css`        | MIT        | 1.4.0    |
| `typescript`            | Apache-2.0 | 5.9.3    |
| `vitest`                | MIT        | 5.1.0    |

### Workspace-internal packages

`@dalashift/config-eslint`, `@dalashift/config-typescript`,
`@dalashift/shared` and `@dalashift/web` are part of this project and carry
the licence chosen in [`ADR-0001`](./docs/decisions/ADR-0001-open-source-license.md).

### To be added

**[Proposed]** shadcn/ui components and their Radix UI primitives will be
added during the design phase. Radix UI is MIT-licensed. **Re-run the
generator after they are added.**

### Notable transitive dependencies

**[Proposed]** The following are pulled in transitively and are material
enough to name:

| Package          | Licence                       | Why it matters                                  |
| ---------------- | ----------------------------- | ----------------------------------------------- |
| `caniuse-lite`   | CC-BY-4.0                     | Browserslist data: a data licence, not a code licence |
| `postcss`        | MIT                           |                                               |
| `sharp`          | Apache-2.0                    | Next.js image optimisation                      |
| `vite`           | MIT                           | Vitest's engine                                |
| `@swc/*`         | MIT / Apache-2.0              | Fast transpilation                             |
| `lightningcss`   | MPL-2.0                       | CSS transforms, **note: MPL-2.0 is file-level copyleft** |

**[Proposed]** `lightningcss` (MPL-2.0) is worth flagging: MPL-2.0 is
file-level copyleft. It is a transitive dependency of the toolchain and is not
distributed with our code, so it imposes no obligation on the project, but it
is listed here rather than omitted.

---

## 2. Data sources and services

**Separate from the code licence.** Each source keeps its own terms. The
authoritative register, with verification dates and live-verified behaviour,
is [`docs/api/data-sources.md`](./docs/api/data-sources.md). The attribution
register is in § 10 of that document.

| Source                      | Licence / terms                                    | Attribution required |
| --------------------------- | -------------------------------------------------- | -------------------- |
| **NASA POWER**              | NASA open data; courtesy citation requested         | **Yes**: service + data reference |
| **NASA SMAP**               | Public domain (US Government work)                   | **Yes**: citation + DOI |
| **NASA GPM IMERG**          | Free for public use                                 | **Yes**: citation + DOI |
| **NASA MODIS**              | No restrictions on use, sale or redistribution      | **Yes**: LP DAAC citation + DOI |
| **NASA Landsat**            | Public domain                                       | Requested: *"courtesy of the U.S. Geological Survey"* |
| **NASA SRTM**               | Public domain                                       | Requested |
| **NASA ECOSTRESS**          | Public domain                                       | **Yes**: citation |
| **NASA GRACE / GRACE-FO**   | Public domain                                       | **Yes**: citation |
| **NASA GIBS**                | NASA open data                                      | **Yes**: product credit + GIBS service |
| **ISRIC SoilGrids 2.0**     | **CC BY 4.0**                                       | **Yes**: credit, licence notice, indicate changes |
| **Open-Meteo**              | **CC BY 4.0** (data); AGPL-3.0 (source)             | **Yes**: *"Data provided by Open-Meteo"* |
| **Copernicus Sentinel-2**   | Copernicus Sentinel Data Terms and Conditions        | **Yes**: *"Contains modified Copernicus Sentinel data [year]"* |
| **CHIRPS**                   | Attribution required (CC BY 4.0 on the NOAA record; CHC waives copyright) | **Yes**: citation + DOI |
| **FAOSTAT**                 | **CC BY 4.0** + FAO Statistical Database Terms      | **Yes**: citation + licence notice |
| **Overture Maps**           | Per-feature; ODbL-derived                            | **Yes**: *"Overture Maps Foundation, overturemaps.org"* |
| **Sacks et al. crop calendar** | CC BY 4.0 (verify)                                | **Yes**: citation + courtesy email |
| **OpenStreetMap / OpenMapTiles** | ODbL                                            | **Yes**: *"© OpenStreetMap contributors"* |
| **Google Earth Engine**     | EE Terms of Service + tier rules                     | Per-dataset terms apply |

**[Proposed] Every one of these attributions is rendered in the product** in
an "About / Data sources" panel, and reproduced in every generated report.
Attribution that exists only in a repository file does not discharge the
obligation for a user who sees the data in the app.

---

## 3. Fonts and imagery

**[Open]** The interface currently uses the system font stack; no web font is
bundled, so there is no font licence obligation. **If a web font is added in
the design phase, its licence must be added here.** The same applies to any
icon set beyond Lucide (ISC) and any imagery used in the marketing pages.

---

## 4. Content and text

**[Confirmed]** No third-party copyrighted text, music or imagery is included
in this repository. All written content (the product requirements,
architecture, research notes and code) was written for this project.

**[Proposed]** The crop requirements catalog is the one place where this
needs checking: every value in it must carry a source citation, and where a
requirement is paraphrased from a published source, that source is cited.

---

## 5. How to keep this file accurate

```bash
node scripts/validation/generate-third-party-notices.mjs
```

The script reads the direct dependencies from every workspace `package.json`
and resolves each one's licence from the installed package metadata. **Run it
whenever a dependency is added or removed**, and re-check the data-source
table by hand; the script cannot know about external APIs.

---

## 6. AI-generated content

**[Required by the NASA Space Apps rules.]** NASA requires that the use of
"Super Intelligence" tools be described in the project submission, and that
SI-generated code, data, images and video be acknowledged in text and
metadata.

**[Proposed] The disclosure for this project:**

> DalaShift was developed by a three-person team with the assistance of AI
> coding agents. The product concept, the agronomic methodology, the
> architectural decisions and the field validation are human work. AI tools
> assisted with repository scaffolding, documentation drafting, research
> synthesis, and parts of the implementation. **No AI output was used to
> determine any crop requirement, suitability score or recommendation**, and
> no NASA branding or design elements appear in AI-generated content.

**[Proposed]** Per-file acknowledgement is handled by the commit history and
by this notice. No NASA logo, flag or mission identifier appears anywhere in
this repository or in generated content.
