# DalaShift Redesign Brief

**Status:** Approved for planning. Implementation starts only after this brief is reviewed.

**Scope:** The whole farmer-facing product in `apps/web`: landing, marketing, authentication, dashboard, farm and field management, map, advisory output, reports, data states, offline behavior, accessibility, and the shared design system. Database schema and engine rules are out of scope unless a design decision requires a small schema change, which must be recorded separately. The adviser view is explicitly out of scope for this redesign, with the reasoning in section 13.

**Companions:** `../../AGENTS.md`, `../../CONTRIBUTING.md`, `../build/BRAND.md`, `../build/PAGES.md`, `../decisions/OPEN-DECISIONS.md`.

---

## 1. Why this brief exists

A full audit of the codebase and a browser walkthrough found a product that is functionally substantial but visually and interactively unfit for its users. The findings are recorded here so the redesign has a fixed target rather than a moving one.

| Area | Finding |
| ---- | ------- |
| Visual language | 65 distinct hardcoded hex values, four parallel color token systems, and an undeclared bright green used 55 times as a primary interactive color. The logo has two colors: deep green and terracotta. The rest is drift. |
| Components | 12 native browser selects, no custom select or combobox, no dialog, sheet, dropdown menu, tooltip, toast, accordion or card primitive. `components.json` declares shadcn but no Radix packages are installed. |
| Map | Polygon drawing has no finish control on touch, no in-map instruction, no area feedback, no undo, and breaks after a basemap switch. The workspace hides the GPS button, so adding a point field requires typing coordinates. |
| Information architecture | Farm and field (parcel) are conflated. Labels vary across six names. Crops are attached to the first parcel only. There is no "add a field to this farm" entry point and no mobile farm list. |
| Language | English only. A profile preference and a no-op workspace control exist, but there is no dictionary, no global switcher, no logged-out support, and no change to the interface when the preference changes. |
| Anti-slop tells | Eyebrow pill above nearly every heading, repeated icon-in-square card grids, a fake data panel as the hero centerpiece, two competing hero actions, and a cramped six-column table on the methodology page. |

The root cause is not the technology stack. Next.js 16, React 19, Tailwind v4, MapLibre, Terra Draw and Lucide are all capable of a professional result. The cause is the absence of one enforced design system and of interaction design for a low-literacy farmer on a phone.

---

## 2. The user we are designing for

The primary user is a smallholder farmer in Tofa LGA, Kano State, Nigeria. They may have limited formal education, Hausa is often their first language, and their main device is likely an Android phone on a mobile connection. They think in terms of their farm, their fields, what they planted last season, and when the soil is ready. They do not think in hectares to three decimal places, NDVI, modelled baselines, spatial resolution, or advisory focus.

Design consequences:

- One question and one action per screen.
- Plain words before technical words. "Your field" before "parcel".
- Anything technical lives behind an Advanced or Details layer, collapsed by default.
- Every control works with a thumb at 390 px width before it is checked on a desktop.
- The app must work on a slow connection and a small screen without horizontal scrolling.
- Language can be switched at any time, by anyone, signed in or not.

This is a product for farmers, not a demonstration for reviewers. Copy that explains how honest the data is belongs in the methodology page and in source attributions, not in the primary flow.

---

## 3. The one idea that drives the design

Both anti-slop skills ask for a single idea that belongs to this client and let it run the page, rather than a theme applied everywhere.

DalaShift's one idea is **the field instrument**: a calm, precise tool that answers one farmer question about one specific field, and states plainly when the data cannot answer it. NASA provides the observations; DalaShift provides the method and the local framing. The interface should feel like a well-made measuring instrument, not a marketing dashboard or a satellite image viewer.

What this means in practice:

- The map and the field are the hero, not a grid of feature cards.
- Numbers always appear with their source and real resolution, in a quiet provenance line, never as a large decorative metric.
- Honesty is shown by what the interface refuses to claim. A blank state with "we do not know yet, here is what would help" is the product working correctly.
- The palette is a field notebook: deep green ink, terracotta accent, warm off-white paper, hairline rules. Light mode only.
- Photographs, if used, are real field scenes with visible credits. No generated imagery, no stock sites, no portraits of research participants.

---

## 4. Design system

### 4.0 Visual direction: the field instrument on paper

This section defines what the interface actually looks and feels like. It is the concrete expression of the one idea in section 3.

**Type of UI.** A flat, calm measuring instrument laid on a warm field notebook. Not a glossy consumer app, not a dense enterprise dashboard, not a satellite image viewer. The logo is flat green vector with no gradient, glow or shadow, and the interface follows it: solid color, hairline rules, generous space, and nothing decorative competing with the data.

**Texture.** There is no literal texture. No noise, no grain, no gradient fills, no glass, no glossy buttons, no neon accents. The perceived material comes from three choices: the warm off-white canvas `#fafafa`, hairline `#e5e7eb` borders instead of shadows, and the terraced-field contour motif from the logo used very sparingly as a section divider or empty-state mark. That contour is the only illustration language. Photographs, if any, are real field scenes with credits, never generated imagery.

**Buttons.** We take shadcn behavior and accessibility, then replace every visual token. The result is a DalaShift system, not shadcn as shipped.

| Variant | Appearance |
| ------- | ---------- |
| Primary | Solid `#0a4232`, white 14 px medium label, flat radius 10 px, no shadow or gradient. Hover one step darker to `#072f24`. Pressed is flat, no scale bounce. |
| Secondary | White surface, 1 px `#e5e7eb` border, ink text. Hover sinks to `#f4f5f6`. |
| Accent | Terracotta `#c26e4a`, at most one per page, for the single contextual action such as "See my advice". Never navigation, never focus. |
| Destructive | `#b42318` text and border on `#fdeceb`, quiet until hover. |
| Icon | 44 x 44 minimum, 48 px in the map, ink-muted glyph, surface-sunken on hover, no trailing background pill. |

Every interactive element has one global focus treatment: 2 px white then 2 px primary green. No colored glow. Disabled is 0.5 opacity with muted surface and not-allowed cursor.

**Surfaces and cards.** White surface on warm canvas, 1 px hairline border, radius 12 px, padding 16 px mobile and 24 px desktop. At most one subtle shadow on genuinely raised panels such as the map bottom sheet. No stacked shadows, no colored card borders, no icon-in-a-square headers by default.

**Typography.** Geologica for display, Inter for body and numbers. Display sizes stay in the 24 to 32 px range, body 16 px, secondary 14 px, helper 12 px, nothing smaller. Numbers use tabular figures. No tracked uppercase micro-labels.

**Map palette.** The only colors on the map are paper-white and ink for chrome, green for the selected field, terracotta for other field outlines and grid footprints. Grid cells are hatched outlines at low opacity, never solid fills. Satellite imagery is the only photographic layer. The stray navy `#2c5282`, steel `#76a1c2` and slate `#3d6382` used today for resolution overlays and advisory cards are removed; they are not brand colors and have no semantic role.

### 4.1 Color tokens

Derive every token from the two brand colors in the logo. There are no other brand colors. Light mode only.

| Token | Value | Role |
| ----- | ----- | ---- |
| `--brand-primary` | `#0a4232` | Primary actions, focus ring, links, active navigation |
| `--brand-primary-hover` | `#072f24` | Hover and pressed states |
| `--brand-primary-tint` | `#eaf2ee` | Selected rows, active tabs, soft surfaces |
| `--brand-accent` | `#c26e4a` | Single accent for emphasis and seasonal outlook |
| `--brand-accent-tint` | `#f9efea` | Tinted accent surfaces |
| `--canvas` | `#fafafa` | Page background |
| `--surface` | `#ffffff` | Cards, panels, inputs |
| `--surface-sunken` | `#f4f5f6` | Table headers, inactive controls, insets |
| `--border` | `#e5e7eb` | Hairline borders |
| `--ink` | `#111827` | Primary text and measurements |
| `--ink-muted` | `#4b5563` | Secondary text |
| `--ink-faint` | `#9ca3af` | Provenance, disabled, axis labels |
| `--positive` | `#00b159` | Semantic good condition only. Never a brand color, never a default focus or active state |
| `--danger` | `#b42318` | Errors and destructive actions |
| `--danger-bg` | `#fdeceb` | Error surfaces |
| `--warning` | `#b45309` | Caution |
| `--info` | `#2c5282` | Information |

Rules:

- One naming scheme. Delete the duplicate `--color-ink-*`, `--color-surface-raised`, `--color-border` and `:root` aliases, or generate them from this set.
- Retire `#AB6A43` in the stacked logo and favicon, and `#F6F3EB` in the favicon, in favor of the tokens above.
- `#00b159` may only communicate a genuinely good agronomic condition. It must not style tabs, focus rings, steppers or GPS buttons.
- Contrast must pass WCAG 2.1 AA for normal text on canvas and surface. This is a Floor gate.

### 4.2 Typography

Fonts are already self-hosted with `next/font/local`: Inter for body, Geologica for display. Keep them; they render identically on every device.

- Fix the font path in `BRAND.md`: the files are in `apps/web/src/app/fonts/`, not `apps/web/src/fonts/`.
- Collapse ad hoc sizes into one scale: display 32/28/24, heading 20/18, body 16, secondary 14, helper 12. Nothing below 12 px.
- Remove all `text-[10px]` and `text-[11px]` usage.
- Set `tabular-nums` globally for measurement-heavy UI, or correct the design-system doc if we keep it opt-in. Prefer global.
- Add a Hausa-capable latin subset or document that Hausa is written in latin script here. If a script outside latin is ever needed, self-host that subset too so rendering never depends on the device.
- Set `<html lang>` from the active language.

### 4.3 Spacing, radius, elevation, focus

- Spacing scale: 4, 8, 12, 16, 24, 32. Label to control is 8 px. Card padding is 16 px mobile and 24 px desktop.
- Radius: 10 px controls, 12 px cards, full for pills. Retire arbitrary `rounded-[8px]` and `rounded-2xl` on controls.
- Elevation: hairline borders and at most one subtle shadow on raised panels. No layered shadows.
- One global focus-visible ring: 2 px white then 2 px primary. Never use `outline-none` without a replacement. This is a Floor gate.
- Minimum touch target 44 px, with 48 to 56 px for map and primary actions. No `h-7` or `h-8` controls on touch.
- Control text 16 px on mobile to prevent iOS zoom. Fourteen px is allowed from the medium breakpoint upward.
- Disabled: 0.5 opacity, muted surface, not-allowed cursor. Error: danger border and text, message linked with `aria-describedby`.

### 4.4 Component primitives

Adopt shadcn/ui properly through its CLI, installed into `components/ui`, and map its CSS variables to the tokens above. The scaffolding already exists (`components.json`, cva, clsx, tailwind-merge, tw-animate-css), so this is a completion rather than a strategy change.

Required primitives, in build order:

1. Select or Combobox with search, keyboard navigation and portal positioning. Replace all 12 native selects.
2. Checkbox, Switch and RadioGroup. Replace the native consent checkbox and the ad hoc toggle buttons.
3. Dialog and Sheet with focus trap, Escape, `aria-modal` and focus restore. Replace both hand-rolled mobile overlays.
4. DropdownMenu, Tooltip and Toast. Tooltips must work on touch and keyboard, not hover alone.
5. Card, Alert and FormField to replace repeated ad hoc surfaces and inline error blocks.
6. Tabs rebuilt on one accessible base with arrow keys and roving tabindex, used by both SegmentedControl and UnderlineTabs.

Normalize Button to one primary variant, 44 px default height, one radius, one focus style, and `aria-pressed` on every toggle. Consolidate the 15 badge variants to semantic roles. Fix the stale `components.json` utils alias so it points at the real `cn.ts`.

If the team refuses new dependencies, a custom set is possible, but the budget must include focus traps, portals and keyboard navigation. Given the WCAG requirement, that is the worse trade.

---

### 4.5 Icon rail and tooltips

The desktop side rail currently shows labels with the native HTML `title` attribute (`workspace-rail.tsx:257,276,295`) plus a custom `group-hover:block` span beside it. The browser therefore draws its own slow, OS-styled tooltip over our styled one, and neither appears on touch. This is the "native browser tooltip" the team flagged, and it is a Floor issue because it is inconsistent and inaccessible.

Target state:

- Build one `Tooltip` primitive from the shadcn set with a portal, a small delay, `role="tooltip"`, and support for keyboard focus and touch. It follows the paper material: ink surface, hairline border, 12 px label, no shadow beyond one subtle raise.
- Remove every native `title` attribute used as a label. Keep `aria-label` on icon buttons for screen readers, since that is not a visual tooltip.
- On desktop, focus or hover shows our styled tooltip with an arrow pointing to the icon, positioned to avoid clipping at the screen edge.
- On touch, tapping an icon performing its action is primary; the label is also visible in the active state or in a compact text label on the expanded rail. Do not rely on a long press to reveal the name.
- Add an expand/collapse control to the desktop rail so a user who is unsure can see labels permanently. This removes the need to guess any icon.

### 4.6 Aim: better than comparable products

OneSoil and similar tools are capable but desktop-first, English-only, dense, and built for experienced operators. Our advantage is not more features. It is being the first tool in this space that a low-literacy smallholder can use alone on a phone, in their own language, with honest limits. Concretely, we win on:

- Full responsiveness at 390, 768 and 1440, with a touch-first map. They do not have this.
- A global EN/HA switch available on every view, signed in or not.
- One action per screen and plain language, with technical detail behind a Layers or Advanced surface.
- Explicit Done, Undo and confirmation on field drawing, with an area the farmer can confirm before saving.
- Honest uncertainty as a first-class part of the interface, never a fabricated live value.

We study their useful patterns, such as explicit Select on Map, Draw and Upload entry points and a ruler for selection, then implement them in our own material and with our own users in mind. We do not copy their layout, palette or information architecture.

---

## 5. Anti-slop quality gates

We will use the two skills you supplied as our standing quality process, not as decoration. Both support OpenCode.

- Hallmark (`Nutlope/hallmark`): `npx skills add nutlope/hallmark -g`
- Taste Skill (`Leonxlnx/taste-skill`): `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"`

Their browser checks need Node 22, Puppeteer Core and a local Chrome or Chromium. Set `CHROME_PATH` if the browser is not on the default path.

### 5.1 Floor: never ship a violation

Taken from Hallmark's Floor and adapted to this product:

- Text contrast fails WCAG 2.1 AA.
- No visible focus indicator on an interactive element.
- Reduced-motion preference is ignored.
- Any invented fact, invented number, invented source, or fabricated "live" value.
- A broken layout at 390 px.
- A form that claims success without persisting data.
- A control that looks interactive but does nothing, such as the current "Crop terminology" segmented control.
- Personal data of research participants appears anywhere.

Floor violations block a pull request. There is no override.

### 5.2 Reflex: defaults we must not fall into

Hallmark names these as the tells that read as machine-made. We adopt them as Reflex gates. A build may overrule one only with a written reason in the page's design note.

- An eyebrow label above every heading. Remove all current instances.
- Tracked, capitalized micro-labels used for section titles.
- One colored word inside a headline for emphasis.
- A page made only of empty frames, icon squares, or photographs.
- A hero that does not fit the viewport on first load.
- An email sign-up panel at the end of every page.
- Repeated three-card icon grids. The landing page currently has two and the methodology page has another.
- A decorative dashboard mockup used as a hero. The current "Example field report layout" is honest in its labeling but occupies the wrong space. Move it below the primary action or into documentation.
- Two competing primary actions in a hero. Choose one.
- Dense tables with no mobile layout, such as the six-column methodology table.

For Taste Skill classification, register DalaShift as a **service or product**, not a software or tech showcase. That keeps shaders, scroll scenes and WebGL effects off the site. A field instrument is calm. We allow a hero entrance and one or two quiet moments per page, never four-context shader scenes.

### 5.3 Finish: craft checks that do not block a ship

- Equal left and right content edges at every breakpoint.
- One section per screen on desktop.
- Real product UI in screenshots, not hollow frames.
- Real field photographs with credits in one expandable footer line, if photographs are used at all.
- Spacing and radius consistent with the tokens.
- Micro-interactions are quiet and respect reduced motion.

### 5.4 Browser verification protocol

Taste Skill renders at 1440, 1024, 820, 768 and 390. Hallmark's `sloplint --render` checks eight widths. Our minimum protocol for every changed page:

1. `node scripts/sloplint.mjs <path> --render` from the Hallmark skill.
2. `node scripts/consistency.mjs <local-url> --page service` from the Taste Skill.
3. Manual check at 390, 768 and 1440 in the project browser: initial viewport, full page, keyboard tab order, focus visibility, and one primary flow completed end to end.
4. Run the checks again after any change to tokens or shared primitives.

No page is called done on code review alone.

### 5.5 Fresh-context review

Hallmark gives a fresh-context reviewer the last word. Before merging a redesign pull request, open the built page in a clean browser session and ask: what is this product, what should I do here, and what can I trust? If a reviewer cannot answer in one sentence each, the page is not done. The reviewer should not be the author.

### 5.6 Design note per page

Following Hallmark's stamped decisions, every redesigned page carries a short note in its source comment or adjacent doc recording: the tokens used, the one idea applied, any Reflex gate overruled and why, and the widths checked. This makes design intent reviewable in a pull request.

---

## 6. Information architecture

### 6.1 Two nouns only

Use **Farm** for the holding and **Field** for the parcel, everywhere. Retire holding, plot, parcel and field-unit from user-facing copy in favor of these two words. The database can keep `parcels` internally.

Audit and update every current label:

| Current label | Location | Replace with |
| ------------- | -------- | ------------ |
| Add Farm / Parcel | `workspace-rail.tsx` | Add a farm |
| Add Farm or Parcel | `farms/page.tsx` | Add a field |
| + Add Field | `workspace-rail.tsx` | Add a farm |
| Add New Farm / Add Parcel | `parcel-sidebar-drawer.tsx` | Add a farm / Add a field |
| Parcel Registration / Register Farm Holding & Parcels | `farms/new/page.tsx` | Register your farm / Add a field |

Never use one destination for two actions. A farmer with an existing farm who wants a second plot must see "Add a field to this farm" without creating a new farm.

### 6.2 Navigation structure

- Public: Overview, How it works, Methodology, language switcher, Sign in or My farm. One primary action.
- Signed in: a compact top bar on mobile with logo, current farm, language switcher and menu. A slim icon rail on desktop with Dashboard, My farms, Reports, Settings, language and sign out.
- A farm selector is visible in every signed-in view, including mobile. The current farm name is never the only clue about where the user is.
- The farm workspace is divided into clear sections: Fields, Crops, Priorities, Advice. The selected field name stays visible at the top of every section.
- Reports have one entry point: My reports. Generate, list and print live in one per-farm view.
- Add a breadcrumb or "Back to my farms" link in the workspace header.

### 6.3 Field lifecycle must be obvious

A field can be added to a farm at any time, edited, and deleted at any time.

- Add a field to this farm: one action, then a clear choice of method.
- Rename and edit accuracy use an explicit Edit action with Save and Cancel. Remove all silent `onBlur` saves.
- Delete asks for confirmation and offers undo where practical.
- Redraw boundary is available on an existing field.
- Edit farm and Delete farm use the existing PATCH and DELETE routes and sit in the farm settings area.
- After adding a field, the user returns to the field list with the new field selected.

---

## 7. Map redesign

The map is the product's central instrument and needs a dedicated redesign. Detailed target state:

### 7.1 Persistent toolbar

Replace the scattered top and bottom chrome with one bottom toolbar. Four large buttons, icon plus one word, minimum 56 px:

- Select field
- Draw field
- My location
- Layers

Active mode is a filled primary pill with a white ring. A top status card appears only during a task, with one plain-language sentence and a Done or Cancel button.

### 7.2 Selection and the measure tool

- Default mode on entry is Select field.
- Tapping a parcel selects it, eases the camera to it, and opens a bottom sheet with field name and area in large type. Unselected fields dim. Selected field gets a thick white pulse ring and a larger label chip.
- A Measure toggle gives the OneSoil-style ruler. Tapping two points draws a dashed line with a live length label, so a farmer can confirm the boundary they tapped. Terra Draw v1.39 has no measure mode, so build it with LineString mode plus a turf distance label.
- If two fields overlap the tap, show a small chooser instead of silently taking the first feature.

### 7.3 Drawing a field

- Draw field starts polygon mode and shows: "Tap every corner. When you reach the first corner, tap Done."
- Large Done, Undo and Clear buttons are always present. Done closes the polygon programmatically, so no tiny closing dot and no Enter key are needed.
- A live floating chip shows "About 2.4 hectares" and updates on each tap, using the area the code already computes and currently discards. Invalid shapes get a warning state.
- After Done, freeze the shape and show the area with "Is this your field? Save / Redraw". Only then call the save handler.
- Undo and redo use Terra Draw's configured `TerraDrawModeUndoRedo` and `TerraDrawUndoRedoKeyboardShortcuts`, which are available but not wired.
- After save, clear the drawing, exit draw mode and select the new field.

### 7.4 GPS point and accuracy

- My location uses `getCurrentPosition` with high accuracy. On denial, show a friendly message and "Place pin manually" that drops a pin at map center. Never capture a hidden demo coordinate.
- The pin has a large draggable halo and an accuracy circle.
- Replace "uncertainty radius in metres" with "How sure are you?" and a simple small, medium, large choice mapped to metres.
- My location must also be available in the post-creation workspace by passing the capture props to the map.

### 7.5 Technical controls and fixes

- Move data layer, cell footprint and spatial resolution into the Layers sheet, collapsed by default. Add "Hide map details".
- Replace the navy `#2c5282` and steel `#76a1c2` grid fills and the slate `#3d6382` card accents with terracotta hatched outlines at low opacity. No blue appears anywhere in the product.
- Fix the blank tiles at high zoom. The current raster source at `honesty-map-canvas.tsx:182-204` has no `maxzoom`, the layer caps at 19, and the map sets no `maxZoom`. Zooming past the tile provider's real limit shows "Map data not yet available". Set the source `maxzoom` to the provider's documented limit, set `maxzoom` on the layers so MapLibre overzooms the last tile instead of requesting tiles that do not exist, and set a sensible `maxZoom` on the map instance. Verify the true limit against each provider's official documentation before coding it; do not guess. Add the attribution for each basemap in a visible, permanent control, since `attributionControl` is currently disabled at line 229.
- Add zoom, recenter and compass controls.
- All controls 48 px minimum with `touch-action: manipulation`.
- Fix the lifecycle: reset `mapLoaded` on basemap change or stop rebuilding the map and use `setStyle`. All sync effects must depend on a stable map instance or generation counter.
- Harden the custom adapter by extending `TerraDrawBaseAdapter`, implementing `onDrag` and `onClear`, handling drag thresholds and primary-button checks, and restoring draggability after pointer up.
- Pass `activeParcelId` and `selectedParcelId` in every consumer so the status badge and footprint match the field being edited.
- Ignore parcel-click selection while drawing.
- Add select mode alongside polygon mode and route selection through `select` and `deselect` events.

---

## 8. Core flows

### 8.1 Register your farm

One short flow, farm-level details only: farm name, water source in plain words, and optional notes about the soil. One question per step, with Save and Back. Validate on Continue, not only at the end. Do not create the farm until all required details are complete, or wrap creation in a server transaction.

### 8.2 Add a field to this farm

A separate action offering three explicit methods, following the useful part of the OneSoil pattern:

1. Select on map: tap an existing boundary.
2. Draw a field: the drawing flow above.
3. My location: GPS point or manual pin.

Only after a field exists do we ask about the crops in it. Crops and comparison must attach to the selected field, never to `parcelIds[0]`.

### 8.3 Read the advice

One field at a time. Show the trigger condition first, then the rotation options with evidence, benefits, gaps and local-review risks. Use labeled messages for every status and enum. Never show a raw UUID or snake_case value.

### 8.4 Reports

One action per field: Generate report. The report carries source attribution and redacted coordinates. Saved reports live in the same view.

---

## 9. Language system

English is the default. Hausa is the only other language for now. The user can switch at any time, on any view, signed in or not.

### 9.1 Architecture

- Add a `LanguageProvider` mounted once in `apps/web/src/app/layout.tsx`. Extend the existing `PreferredLanguage` type rather than inventing another locale type.
- Persist signed-in preference through `/api/profile` and signed-out preference in `localStorage`.
- Build one keyed message dictionary with the shape already used in `format.ts`: `Record<MessageId, { en: string; ha: string }>`, plus a `t(id, vars)` helper. Start with the wizard, workspace cards, auth and dashboard. Roughly 350 to 500 strings are expected.
- Move engine-generated copy behind keyed templates so rationales, explanations, ranking basis and report disclaimers translate too.
- Set `<html lang>` dynamically and pass `ha-NG` to date and number formatting.
- Decide and document whether Hausa mode is Hausa-only or bilingual. Current crop formatting is bilingual with English first, which may not match the intent.

### 9.2 One reusable switcher

Build a single `LanguageSwitcher` component and place it in a professional, visible location in every chrome surface:

| Surface | Placement |
| ------- | --------- |
| Landing and methodology | Public navbar header row, desktop action cluster and mobile beside the hamburger. Also full width in the mobile menu. |
| Login and register | Top-right of the auth card header, aligned with the logo. |
| Dashboard and farms | Workspace rail mobile top header between logo and menu, mobile drawer Preferences section, and desktop lower icon cluster with a globe or EN/HA label. |
| Settings | Keep the detailed control, wired to the global provider so changes take effect immediately. |

Remove or wire the no-op control at `registered-farm-workspace.tsx:578-592`. There is one source of truth.

### 9.3 Decision to supersede

Decision D-08 in `../decisions/OPEN-DECISIONS.md` currently says "English operator chrome, Hausa field layer". This brief supersedes it. Record a short decision note in `docs/decisions/` when implementation starts, stating that full EN/HA interface switching replaces the earlier partial approach.

---

## 10. Data states, connectivity and honesty in the interface

This section turns the product's honesty principle into concrete interface behavior. The shared component already exists at `components/dashboard/data-state-boundary.tsx` and defines five states: `ready`, `loading`, `empty`, `error` and `stale`. The `stale` state and the `no-crops` empty kind are implemented but never used. The redesign must use all of them.

### 10.1 State catalog

Every data view must render the correct state from this table. No view may show an empty white panel where a state should be.

| State | When | What the farmer sees | Action |
| ----- | ---- | -------------------- | ------ |
| Loading | A request is in flight and no cached value exists | A skeleton shaped like the content, not a spinner. `role="status"`, `aria-live="polite"`. | None yet |
| Empty: no fields | The farm has no fields | "You have not added a field yet." A drawing of the terraced contour. | Add a field |
| Empty: no crops | A field has no crop records | "No crops recorded on this field yet." | Record a crop |
| Empty: no data | No observations are cached for this field | "No satellite data for this field yet." | Refresh when online |
| Stale | The last observation is older than the source's update cadence | A quiet banner with the real observation date: "Last seen 14 June. Refresh when connected." The cached content stays visible below it. | Refresh now |
| Partial | Some sources returned, others failed | Show what arrived with its own provenance, and name what is missing: "Rainfall loaded. Soil data unavailable." | Retry missing |
| Error | The request failed and no cached value exists | "We could not load this." Plain language, no stack trace, no error code. | Try again |
| Offline | The device has no connection | Cached field records and the last advice remain readable, with an offline banner. | Reconnect |
| Unauthenticated | The session is missing | "Sign in to see your fields." | Sign in |

Rules:

- Retry must refetch the failed resource, not call `window.location.reload()`, which is what three pages do today.
- A failed per-farm detail fetch must not be silently dropped, as it is in `farms/page.tsx:90-99`.
- Never replace a stale cached value with a blank state. Show the old value with its real date.
- The full-page spinner in `registered-farm-workspace.tsx:508-515` becomes a layout-shaped skeleton so the farmer sees where content will appear.

### 10.2 Connectivity and performance

The primary user is on an Android phone on a mobile connection in a rural area. The current app has a web manifest and is installable, but no service worker, no offline runtime, and all client fetches use `cache: 'no-store'`. The only cache is server-side in Supabase. This must change for the redesign.

Targets and behavior:

- The "register farm, add field, read advice" flow must complete on a 3G connection. Set a budget for initial JavaScript and map tiles and check it in CI with the Taste Skill perf script.
- Add a small service worker that precaches the application shell and the last viewed farm, field list and advice payload. Do not cache secrets, credentials or any authenticated response containing personal data.
- A farmer opening a previously viewed field while offline sees its name, boundary, crop records and last advice, with an offline banner and a disabled Refresh action.
- Map tile failure degrades to a blank canvas with the field polygon still drawn, as `docs/product/user-flows.md:225` already specifies. Never show a broken-image icon or an infinite loader.
- Satellite tiles are the heaviest asset. Set tile `maxzoom` correctly so the browser stops requesting tiles that do not exist, and prefer fewer, larger tiles where the provider allows it.
- Skeleton timing: show a skeleton only when a response takes longer than 200 ms. Faster responses render directly to avoid a flicker.
- The basemap must never be required to understand the field. The polygon, area and advice are drawn from data, not from the imagery.

### 10.3 Accessibility

The floor is WCAG 2.1 AA. These are the specific checks the redesign must pass.

- **Color-blind safety.** Green `#0a4232`, terracotta `#c26e4a` and danger `#b42318` must be distinguishable under deuteranopia and protanopia. Never rely on color alone to show a field state. Pair every color with a label, icon or pattern. The grid footprints use hatch patterns, not hue alone.
- **Screen readers.** Every icon button has an `aria-label`. Every state uses `role="status"` or `role="alert"` correctly. Errors are announced. Form errors are linked to inputs with `aria-describedby`. The map has a text alternative listing fields and their areas, since a canvas cannot be read by a screen reader.
- **Structure.** One `h1` per page, logical heading order, landmark regions, and a skip link to main content on every page.
- **Keyboard.** Every action reachable and operable by keyboard. Tabs support arrow keys and roving tabindex. Dialogs trap focus, close on Escape and restore focus. No hover-only control, which `docs/design/design-system.md:55` already forbids.
- **Reduced motion.** Honor `prefers-reduced-motion`. Camera flights become instant recenter. Entrances and micro-interactions stop. The pill pulse on a selected field becomes a static outline.
- **Touch.** 44 px minimum everywhere, 48 to 56 px on the map. Control text 16 px on mobile to prevent iOS zoom. Safe-area insets respected on notched phones.
- **Test.** Run one automated accessibility check per page and one manual screen reader pass on the register-farm and read-advice flows before release.

### 10.4 In-product attribution and trust

Attribution is a hard requirement in `AGENTS.md`, not a nice-to-have. The redesign defines exactly where it appears.

- Every environmental number carries a quiet provenance line directly beneath it: source name, real spatial resolution, observation date, and measured or modelled. Example: "NASA POWER, about 55 km cell, observed 14 June, modelled."
- Each basemap carries a visible, permanent attribution control on the map. MapLibre's `attributionControl` is currently disabled at `honesty-map-canvas.tsx:229`; it must be enabled or replaced with an equivalent visible control.
- The Methodology page is the full public register: dataset, licence, resolution, cadence, role in the engine, and access date.
- The printable report repeats the attribution block for every source used, with no fabricated entries.
- A short, plain statement of independence from NASA appears in the site footer and on printed reports: "DalaShift uses public NASA data. It is not endorsed by or affiliated with NASA."
- No source may be attributed that was not actually used. The engine and report code must never insert a default source when the observation set is empty.

### 10.5 First-run and onboarding

A farmer opening the product for the first time must know what to do without reading documentation.

- The landing page has one primary action: Register your farm. It explains in one sentence what the product gives back: guidance for your own field, based on satellite data and local knowledge.
- After sign-up, the dashboard is not an empty set of stat cards. It shows one guided path: "1. Add your farm. 2. Add a field. 3. Get advice." The current step is highlighted.
- The first field flow explains each choice in plain language with a small illustration. No mention of advisory focus, screening or uncertainty radius.
- If a registration was interrupted after the farm was created, the next visit resumes at the missing step instead of creating a duplicate farm. The transactional save in section 8.1 prevents this in new code, but existing partial records must be recoverable.
- Help is available from one fixed action on every screen: "Need help?" opens a short, plain-language guide with the three steps and a contact path for an extension officer. No tooltips are required to understand the interface.
- The first advice screen explains the verdict words in plain language: what suitable, conditional, not suitable and not enough information each mean.

### 10.6 Validation UX and recovery

The current wizard creates the farm before the remaining calls can fail, then tells the user "the holding was created, but some details may still need to be saved". The redesign removes this class of failure.

- Validate each step on Continue. Never defer all validation to the final save.
- Create the farm and its fields in one server-side transaction, or use a single draft that commits only when every required part is valid. No partial holdings.
- Show errors next to the field that caused them, in plain language: "Enter a name for your farm" rather than "Invalid input".
- A successful save shows a confirmation with the farm name and a direct action to add a field or read advice. No silent success.
- A failed request keeps everything the farmer typed. Never clear the form on error.
- A retry re-sends only the failed part. The farmer never starts over because one request failed.
- If a session expires mid-flow, preserve the draft locally and resume after sign-in.

---

## 11. Engine honesty in the interface

The engine deliberately produces no composite score, no weighting system, no confidence percentage, no numeric verdict threshold and no LLM-generated agronomic claim. `AGENTS.md:117-122`, `README.md:111-114` and ADR-0011 D-05 are explicit about this. The interface must never imply one.

- The actual outputs are qualitative: a verdict from four values, per-dimension pass or fail or uncertain or not assessed, evidence strength of strong or moderate or weak with a reason, a rank of first or tied or lower, and a written ranking basis with limitations.
- Do not render stars, progress bars, gauges, percentages, numbered scores or coloured grade badges. The current "Top candidate" badge in `suitability-shortlist-card.tsx:35-43` and the strong or moderate or weak badge mapped to pass or warning or danger at lines 97 to 107 read like grades. Replace them with plain labels and the written reason.
- When candidates tie because the data cannot separate them, say so directly: "These crops are tied on the data available." Keep the `tied` rank. Do not break a tie for presentation.
- Show the cited threshold beside each measured value, with the source and resolution, so the farmer can see the rule behind the verdict.
- Show limitations next to the claim they qualify, never in a collapsed appendix.
- A verdict of `insufficient_information` is a valid, successful result. The interface presents it as "We do not have enough information yet" with what would help, not as an error.

---

## 12. Usability testing and success criteria

### 12.1 Test with real users

A redesign that passes automated checks can still fail farmers. Before wide rollout, run a small moderated test with five to eight participants: smallholder farmers from the validation area and at least one extension worker. Use the same tasks every time:

1. Register a farm.
2. Add a field by drawing a boundary on a phone.
3. Add a field using GPS.
4. Record a crop and read the advice.
5. Find and print a report.
6. Switch the interface to Hausa and back.

Run the tasks on a mid-range Android phone on a throttled connection. Observe where people hesitate, misread a word, or cannot finish. Feed the findings back before rollout. Do not ask participants to rate the design; watch what they do.

### 12.2 Success criteria

The redesign is successful when all of the following are measurably true:

| Measure | Target |
| ------- | ------ |
| Task completion for the three core flows at 390 px | At least 90 percent without assistance |
| Field drawing completed on touch without help | At least 90 percent |
| Reflex gate failures per page | Zero at merge |
| Floor gate violations | Zero at merge |
| Browser check widths | 390, 768 and 1440 clean, plus the skill defaults |
| Fresh-context review | Reviewer answers what, where and can I trust in one sentence each |
| Accessibility | One automated check clean, one manual screen reader pass on core flows |
| Language | Every string in the three core flows resolves in both EN and HA |
| Connectivity | Advice readable offline after one prior visit |
| Attribution | Every displayed number has a source, resolution and date, with no fabricated entries |

---

## 13. Roles and the adviser surface

The database already has a four-value role on `profiles`: farmer, extension_worker, researcher and admin. Self-registration is hard-coded to farmer. There is no adviser UI, no role-based routing, no assigned-farm access, and no farmer view or adviser view toggle in the shipped code. Documentation contains a detailed plan for an adviser view, including ADR-0011 decision 1, OPEN-DECISIONS D-04 and D-15, and the interview case studies which describe the extension officer as a primary operator.

Decision for this redesign: **the farmer view remains the only built surface.** Supporting evidence:

- The interview case studies were anonymised and the personal data removed, so an adviser view cannot be tied to those named farmers.
- There is no authorization path for an adviser to see another farmer's fields. Building the UI first would create a privacy risk and require RLS changes beyond this brief's scope.
- A separate adviser surface is a later product decision with its own ADR, RLS design and consent model.

What we do now:

- Keep the printable report as the sharing surface. It is designed for an extension officer to review with a farmer, with coordinates redacted and attribution intact.
- Remove the misleading "Switch between Farmer View and Adviser View" copy from the parcel drawer.
- Do not add any role switcher or multi-farm view in this redesign.
- Record a decision note when a future adviser view is proposed, covering consent, RLS, assigned farms and the anonymised research data.

---

## 14. Iconography, motion and device support

### 14.1 Icons and markers

- Use Lucide only, with a single stroke width of 1.75 and sizes of 16, 20 and 24 px. No mixed icon families, no filled icons beside outline icons.
- The terraced contour from the logo is the only illustration mark. It appears in empty states and as a subtle section divider, never as a decorative badge.
- Map markers have one language: a green filled pin with white ring for the selected field, a terracotta outlined pin with white ring for other fields, and a small green dot with an accuracy circle for a GPS point. All have 48 px touch targets.
- Selected and unselected states differ by shape and outline, not only color, so they survive color-blindness and greyscale printing.
- No icon-in-a-tinted-square card headers by default. This is the Reflex gate from section 5.2.

### 14.2 Motion

- Entrances: 150 ms ease-out, opacity and at most 8 px of upward movement. No staggered card cascades.
- Camera flights: at most 500 ms ease-in-out, reduced to instant when `prefers-reduced-motion` is set.
- Sheets and dialogs: 200 ms slide and fade. Focus moves immediately, before the animation finishes.
- Micro-interactions: a single 100 ms color or border change on hover and press. No scale bounce, no elastic effects.
- Never animate: numbers counting up, shimmering gradients, auto-playing video, or continuous pulsing except the static selected-state ring which is disabled under reduced motion.
- Keep effects to one or two quiet moments per page, per the Taste Skill guidance in section 5.2. No shaders or scroll scenes.

### 14.3 Device and browser support

| Tier | Target | Requirement |
| ---- | ------ | ----------- |
| Primary | Android Chrome, current and previous major, on a mid-range phone | Full support, touch-first, offline read of last viewed data |
| Secondary | iOS Safari, current and previous major, on iPhone | Full support, 16 px control text to prevent focus zoom, safe-area insets |
| Secondary | Desktop Chrome, Edge and Firefox, current majors | Full support, one section per screen |
| Tablet | Android and iPad at 768 and 820 px | Full support, no hidden functionality |
| Not targeted | Internet Explorer, legacy browsers | No support |

Layouts are verified at 390, 768, 820, 1024, 1440 and the skill defaults. The app is installable through the existing `site.webmanifest`, but it must behave correctly as a normal mobile web page without installation.

---

## 15. Phasing

Each phase ends with a pull request, the browser checks from section 5, and a fresh-context review.

1. **Foundation.** Tokens, typography scale, focus and touch targets, shadcn primitives, Button, Select, Checkbox, Switch, Tooltip, focus fixes, color cleanup, icon and motion rules. Remove the native `title` tooltips on the rail.
2. **Data states and connectivity.** State catalog on every view, real retry behavior, stale and partial states, service worker for offline read, tile failure handling, attribution controls.
3. **Map.** Fix lifecycle and adapter, correct tile `maxzoom` and basemap attribution, then toolbar, Done, Undo, area preview, selection states, measure tool, GPS, layers sheet.
4. **Information architecture.** Farm and Field labels, navigation, farm selector, mobile farm list, workspace sections, adviser-view copy removal.
5. **Flows.** Register farm transactionally, add field with three explicit methods, crop assignment to the selected field, edit and delete field and farm, printable report design, onboarding and validation recovery.
6. **Language.** Provider, dictionary, switcher surfaces, engine templates, dynamic `lang`, Hausa review, supersede D-08.
7. **Page polish and validation.** Landing, methodology, auth, dashboard, reports, workspace. Apply Reflex and Finish gates, remove eyebrow pills and repeated card grids, fix mobile tables. Run usability sessions with real users and confirm the success criteria in section 12.

---

## 16. Definition of done

A redesign pull request is done when all of the following are true:

- `pnpm check`, `pnpm test`, `pnpm validate:style` and `pnpm validate:links` pass.
- Hallmark `sloplint --render` and Taste Skill `consistency.mjs` report no fixable FAIL.
- The page passes Floor gates with no override.
- Any Reflex override is written in the page design note.
- The primary farmer flow works end to end at 390 px using touch only.
- Initial viewport, full page, keyboard tab order and focus visibility are checked at 390, 768 and 1440.
- A fresh-context reviewer answers what the product is, what to do here and what can be trusted, in one sentence each.
- No new secrets, no personal data, no invented facts, and all sources and attributions are correct.

---

## 17. Open questions for the team

1. Does Hausa mode show Hausa only, or Hausa with the English term in parentheses?
2. Do we add search to the crop Select now, given the crop list and Hausa aliases?
3. Do we keep the methodology page as a public, detailed source register, or split a short farmer page from a technical appendix?
4. Should the measure tool also compute area by tapping a boundary, or only distance between two points?
5. Who is the standing fresh-context reviewer for each redesign pull request?
6. Which tile providers and official `maxzoom` limits do we pin for satellite and street basemaps, given the blank-tile bug?
7. Do we add a service worker in phase 2, and what is the exact set of cached resources that contains no farmer data?
8. Who is the native Hausa reviewer for the message dictionary?
9. When are the usability sessions with farmers and the extension worker scheduled?
10. Do we keep the "Top candidate" and evidence badges in any form, or replace them entirely with plain labels and written reasons, per section 11?
