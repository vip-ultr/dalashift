# Design Direction

**Status: implemented.** The direction is built and live in `apps/web/src`.
The token set, typography pairing and workspace shell are in
`apps/web/src/app/globals.css` and `apps/web/src/app/layout.tsx`; the page
inventory is in [`../../docs/build/PAGES.md`](../../docs/build/PAGES.md).
The brand identity (name, logo, final palette) is still not finalised and
should not be presented as one. See [`docs/product/brand-and-naming.md`](../product/brand-and-naming.md).

Companion: [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) § 3.5 ·
[`../../PRD.md`](../../PRD.md) § 11

---

## 1. What we are building the look of

**A professional agricultural intelligence product.** The kind of tool a farm
manager, an extension worker or a serious smallholder would trust enough to act
on.

Not a consumer app with a map and some charts. Not a government dashboard. Not
a data portal that shows you everything and helps you with nothing.

---

## 2. What to avoid, and why

| Avoid                            | Why                                                                        |
| -------------------------------- | -------------------------------------------------------------------------- |
| Generic dashboard templates      | Instantly reads as a template, and every agricultural platform uses them.   |
| Excessive green backgrounds      | Every agri-tech product is green. It signals nothing and tires the eye.     |
| Unnecessary gradients            | They reduce legibility of the numbers, which are the point.                |
| Excessive animation              | Slow, distracting, and unprofessional on a low-end Android phone.           |
| Cluttered dashboards             | A farmer needs one answer, not twelve.                                     |
| Decorative elements              | Anything that does not help a decision is noise.                            |
| Unfinished AI-template appearance | Judges and farmers both recognise it immediately, and both discount it.    |

**[Proposed] The test:** if an element cannot be justified by "this helps the
farmer understand their field", it does not ship.

---

## 3. What to prioritise

| Priority               | How it shows up                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| Clear information hierarchy | One primary message per screen, then supporting detail                |
| Professional typography  | A proper type scale, generous line height, real hierarchy                |
| Consistent spacing      | A spacing scale used everywhere; no ad-hoc margins                      |
| Accessible contrast     | WCAG 2.1 AA on text and meaningful graphics                              |
| Readable charts         | Direct labelling over legends; no chart junk                            |
| Useful data visualisation | Every chart answers a question a farmer actually has                  |
| Intuitive farm selection | Drawing a boundary must feel obvious on first attempt                  |
| Responsive layouts      | Mobile is the primary target                                             |
| Mobile-friendly interactions | Big targets, bottom-sheet sheets, no hover-only actions             |
| Clear loading, error and empty states | Every data view has all three                                 |

---

## 4. The information hierarchy that matters most

**[Proposed] The farm page is the product.** Everything else supports it.

```
Farm page
├── Header
│   ├── Farm name + area (1.4 ha) + location
│   └── Season selector + refresh control
├── PRIMARY: the situation (one sentence)
│   └── "The rains started 9 days late and rainfall is 14% below normal."
├── THE MEASUREMENTS (with resolution labels on every one)
│   ├── Rainfall: chart + current value + baseline
│   ├── Temperature: chart + range
│   ├── Soil moisture: value + "9 km area around your farm"
│   └── Vegetation: index + "measured over your field"
├── THE ADVICE
│   ├── Your millet: conditional, confidence 0.42
│   ├── What this means (rationale)
│   └── What we don't know (limitations)
├── ROTATIONS
│   ├── Your current rotation
│   └── Three alternatives, each with evidence / benefits / gaps / risks
└── Secondary
    ├── Crops
    ├── Soil
    ├── Reports
    └── Field notes
```

**[Proposed] The "one sentence" at the top is the hardest and most valuable
element.** It must be generated from the analysis, not written by hand. It is
also where the honesty constraint bites hardest: the sentence must not claim
more precision than the underlying data supports.

---

## 5. Visual direction: proposed, not final

**[Proposed] The direction: "field instrument".**

The reference points are **weather stations, agronomic field trial records and
professional mapping tools**, not consumer health apps. Concretely:

| Property        | Direction                                                                        |
| --------------- | -------------------------------------------------------------------------------- |
| **Ground**      | A neutral off-white (`oklch(0.99 0.002 250)`) with a very slightly cool cast. Reads as paper, not as a screen. |
| **Ink**         | A near-black slate (`oklch(0.21 0.01 250)`) for text. Never pure `#000`: it vibrates on screen. |
| **Primary**     | A single restrained blue-slate (`oklch(0.48 0.09 250)`). It reads as *measurement*, not as agriculture, and it is what the current token set already defines. |
| **Semantic colours** | Amber for warnings, red for genuine failure, green only where something is genuinely good. **Never green as a brand colour.** |
| **Charts**      | A small, fixed categorical palette. One colour per meaning, reused everywhere. Never a rainbow. |
| **Type**        | A neutral sans (Inter, or the system stack). A tabular-figures setting for all numbers. |
| **Corners**     | `0.625rem` base radius. Slightly rounded, not pill-shaped, not sharp. |
| **Borders**     | Hairline `oklch(0.92 0.005 250)`. Structure comes from spacing, not from heavy borders or shadows. |
| **Shadows**     | Almost none. Elevation is expressed by spacing and background steps. |

**[Proposed] On the "green" question.** There is a real argument for green:
agriculture. And a real argument against: every agricultural platform is
green, so green carries no meaning, and a full-saturation green background
degrades the readability of charts and numbers. **A restrained, earthy green is
acceptable as an accent**, for a "good condition" indicator, a vegetation
series, a crop chip. **A green brand palette is not.**

**[Proposed] The final brand identity is a design-phase decision and requires
team approval.** The token set in `apps/web/src/app/globals.css` is
deliberately neutral so that no brand colour is asserted prematurely.

---

## 6. Typography

| Role               | Size / weight   | Notes                                                     |
| ------------------ | --------------- | --------------------------------------------------------- |
| Page title         | 30 / 600        | One per page                                                |
| Section heading    | 20 / 600        |                                                            |
| Card title         | 16 / 600        |                                                            |
| Body               | 16 / 400        | 1.6 line height                                             |
| Secondary text     | 14 / 400        | `muted-foreground`                                          |
| Label / caption    | 12 / 500        | Uppercase with letter-spacing for field labels only        |
| **Measurement**    | 28 to 36 / 600  | Tabular figures. **The headline number on a card.**        |
| Axis / chart label | 12 / 400        | Never smaller than 12px                                     |

**[Proposed] Tabular figures on every number.** Proportional digits make a
column of measurements jitter as values update, and they make comparison
harder. This is a small detail with a large effect on whether the numbers look
professional.

**[Proposed] Body text minimum of 16px.** Larger than most dashboards
default to. On a phone, 16px is the minimum that avoids iOS's automatic zoom
on focus, and it is more readable for the target user.

---

## 7. Spacing and layout

**[Proposed] A 4px base scale:** `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`.

| Context           | Spacing                                              |
| ----------------- | ----------------------------------------------------- |
| Card padding      | 24 (mobile 16)                                        |
| Gap between cards | 16                                                     |
| Section gap       | 32 (mobile 24)                                        |
| Page gutter       | 24 (mobile 16)                                        |
| Inline gap        | 8                                                      |
| Label-to-value    | 4                                                      |

**[Proposed] A max content width of ~1200px for the dashboard.** Wide enough
for a farm page with a chart beside a reading, narrow enough to avoid a
1600px line length.

---

## 8. Responsive behaviour

| Breakpoint | Width   | Layout                                                        |
| ---------- | ------- | ------------------------------------------------------------- |
| `sm`       | < 640px | **Primary.** Single column. Cards stack. Charts fill width.   |
| `md`       | ≥ 768px | Two-column where it helps (chart + readings).                  |
| `lg`       | ≥ 1024px| Full dashboard. Sidebar navigation.                            |
| `xl`       | ≥ 1280px| Same as `lg`, wider gutters and max-width cap.                 |

**[Proposed] Mobile-first.** The implementation targets the phone and scales
up. A desktop layout that is scaled down is a different product, and it is
worse.

**[Proposed] The map on mobile** takes the full viewport height with the
controls in a bottom sheet, so the map remains the largest visible element.

---

## 9. Component guidelines

### 9.1 Cards

One idea per card. A card has a title, an optional one-line explanation, the
content, and (where relevant) a provenance line.

**[Proposed] Every data card carries a provenance line.** It is small, muted,
and always present. Example:

> *Measured over your field · Landsat, 12 Nov 2026*

or

> *Estimate for the 9 km area around your farm · NASA SMAP, 3 days ago*

This is the mechanism that makes the honesty principle visible without
lecturing. It appears on every measurement, everywhere, without exception.

### 9.2 Data display

| Element     | Rule                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| **Numbers** | Tabular figures. Units always present, in a smaller muted style beside them. |
| **Dates**   | Relative for recent ("3 days ago"), absolute beyond a week ("12 Nov 2026"). |
| **Missing** | Never a blank. A dash with a tooltip saying why it is missing.              |
| **Ranges**  | Always show the range and the mean: *"0.11 to 0.24 (avg 0.16)"*.         |
| **Percentages** | One decimal place, not rounded to a whole number.                     |
| **Comparisons** | Always against a stated baseline, never in the abstract.                |

### 9.3 Charts

Recharts. The rules:

| Rule                    | Why                                                       |
| ----------------------- | --------------------------------------------------------- |
| Direct labelling where possible | Fewer legend lookups; better on a small screen     |
| No 3D, no gradients, no drop shadows | They distort perception of the data               |
| Y-axis starts at zero for counts | Truncated axes exaggerate change                    |
| Y-axis is labelled with the unit | The unit belongs on the axis, not just the tooltip   |
| Gridlines are subtle    | They aid reading but must not compete with the data       |
| Tooltips on touch        | Mobile has no hover                                          |
| A summary line above the chart | "Below average for the last 30 years" is more useful than the chart |
| Every chart has a text alternative | Accessibility, and the summary line is often enough alone |

**[Proposed] The summary line above the chart is the highest-value chart
convention here.** A farmer does not need to read an axis to learn that
rainfall has been 14% below average. Put that in a sentence above the chart,
and let the chart be supporting detail.

### 9.4 Forms

| Rule                                  | Why                                            |
| ------------------------------------- | ---------------------------------------------- |
| One column on mobile                  | Two columns on a 360px screen is unusable       |
| Labels above fields                   | Placeholders are not labels                     |
| Show the required/optional distinction | The brief requires it                            |
| Explain *why* a field is asked         | The brief requires only collecting what has a purpose |
| Validate on blur, not on every keystroke | Aggressive validation punishes                  |
| Never clear a form on error            | Losing a farmer's input is unforgivable         |
| Save drafts locally                   | A dropped connection must not lose work          |

### 9.5 Buttons

| Variant   | Use                                                       |
| --------- | --------------------------------------------------------- |
| Primary   | One per screen. The main forward action.                  |
| Secondary | Alternative actions, outlined.                            |
| Ghost     | Tertiary.                                                 |
| Destructive | Delete, and nothing else. Colour alone conveys the risk. |

**[Proposed]** Minimum touch target 44×44px. Labels are verbs: "Save farm",
not "Submit".

---

## 10. Accessibility

**Target: WCAG 2.1 AA.** This is a requirement, not a nice-to-have.

| Requirement | Implementation                                                  |
| ------------ | --------------------------------------------------------------- |
| Contrast     | Text ≥ 4.5:1; large text and meaningful graphics ≥ 3:1. The current token set is designed to satisfy this. |
| Focus        | A visible focus ring on every interactive element. Never `outline: none` without a replacement. |
| Keyboard     | Every flow completable by keyboard. The map draw control needs a keyboard alternative. **[Open]** See below. |
| Semantics    | Real `<button>`, `<label>`, `<fieldset>`. Landmark elements.     |
| Charts       | A text alternative conveying the same information.               |
| Motion       | `prefers-reduced-motion` respected.                             |
| Screen reader | Live regions for async results (analysis complete, data loaded). |
| Form errors  | Linked to the field via `aria-describedby`, announced.           |
| Language     | `<html lang>` set. **[Proposed]** an English/Hausa switch if an Hausa interface ships (PRD OQ-1). |

**[Proposed] The map's keyboard accessibility is a genuine problem.** Drawing
a polygon with a mouse is not keyboard accessible. Options:

1. Accept it and provide a **non-map alternative** (a centroid + radius
   entry with a numeric area field). **[Proposed]** This also serves farmers
   with lower digital literacy, so it solves two problems.
2. Build a full keyboard polygon editor. Out of scope.

**Recommendation:** option 1, in Phase 3. It is the same fallback that helps
farmers who cannot draw accurately, which makes it worth building.

---

## 11. The map interface

The map is an input device, not the product. It should get out of the way.

| Element              | Design                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| **Style**            | Neutral vector base. Satellite as a toggle. **NASA GIBS as a NASA layer toggle.** |
| **Farm polygon**     | High-contrast outline, semi-transparent fill, drawn above everything.    |
| **The grid cell**    | When a coarse value is shown, draw the **cell boundary** over the farm with a clear caption. *This is the single most effective honesty device in the product.* |
| **Draw interaction**  | Large hit targets, an undo action, and a live area readout while drawing. |
| **Search**           | Optional. Pan-and-draw must work without it.                             |
| **Attribution**      | Always visible, in the corner, driven by the actual provider in use.    |
| **Controls**         | Zoom in/out, and nothing else by default. Fullscreen as an option.       |
| **Mobile**           | Full-height map, controls in a bottom sheet.                             |

**[Proposed] The grid-cell overlay is the signature design decision.** When the
platform shows a 9 km soil-moisture value, it draws the 9 km square over the
farmer's 1.4 ha field. The visual proportion *is* the explanation. No
sentence can do it better.

---

## 12. Writing

| Rule                                                                     |
| ------------------------------------------------------------------------ |
| Plain language. Short sentences. No jargon without an immediate explanation. |
| **"9 km area around your farm", not "SMAP L3 enhanced 9 km EASE-Grid".**  |
| Lead with the conclusion, then the evidence.                            |
| Never imply more certainty than the data has.                           |
| Say what is missing, not just what is present.                           |
| Use the farmer's words: "millet", not "Pennisetum glaucum", though the Latin name can appear in parentheses on the crop detail page. |
| No exclamation marks. No emoji in data contexts.                          |
| **Never** say "we know", "accurately", or "precisely" about an environmental value. |
| **Never use an em dash (U+2014) in any user-facing copy.** Use a full stop, a colon, a comma or parentheses. The same rule applies to the whole repository, and it is enforced by `pnpm validate:style` in CI. |

**[Proposed]** Why this matters more for a screen than for a document. A farmer
reading a short message on a phone, or an extension worker scanning a report
between visits, parses punctuation quickly and unconsciously. Em dashes are
dense, they break the rhythm of a short sentence, and they are a well-known
marker of machine-written text. Short sentences and plain punctuation are a
usability requirement here, not a style preference.

---

## 13. Deliverables for the design phase

- [x] Final visual direction approved by the team.
- [x] Confirm the colour palette and verify contrast ratios in both themes.
- [x] Build the shadcn/ui component set and extend the Tailwind token set.
- [x] Define the chart palette and the categorical mapping rules.
- [x] Build the map style (both base and satellite) with the farm and grid-cell
      layers.
- [x] Design the provenance-line component and place it in every data card.
- [x] Write the empty, loading and error state copy for every view.
- [ ] Test with a real phone on a real connection.
- [x] Accessibility audit against WCAG 2.1 AA.
- [x] Implement the non-map GPS point + uncertainty radius farm-entry fallback (ADR-0011 D-06).

---

## 14. Implemented token set and workspace shell

### 14.1 Surface, semantic, and HUD tokens (`apps/web/src/app/globals.css`)

| Token | Value | Purpose |
| ----- | ----- | ------- |
| `--ds-surface` | `#f6f4ef` | Warm sand page canvas |
| `--ds-surface-raised` | `#ffffff` | Primary card and drawer surface |
| `--ds-surface-sunken` | `#f4f5f6` | Input fills, segmented controls, and table headers |
| `--ds-action-green` | `#00b159` | Primary interactive CTA, active underline tab, and polygon highlight |
| `--ds-forest` | `#0a4232` | Deep forest editorial sections and secondary actions |
| `--ds-terracotta` | `#ab6a43` | SoilGrids baseline accent and farmer verbatim quote callout border |
| `--ds-sky` | `#76a1c2` | Rainfall and climate baseline series accent |
| `--ds-hud` | `rgba(17, 19, 21, 0.84)` | Translucent dark obsidian floating map HUD controls |

### 14.2 Typography pairing (`apps/web/src/app/layout.tsx`)

- **Display headings (`--font-display`):** `Geologica` (`600`, `700`) for page titles, hero headlines, and card headers.
- **Workspace UI and body (`--font-sans`):** `Inter` (`400`, `500`, `600`, `700`) with `.tabular` (`font-variant-numeric: tabular-nums`) applied to all measurements, areas, coordinates, and thresholds.

### 14.3 Desktop rail and parcel drawer shell (`apps/web/src/app/(dashboard)/layout.tsx`)

- **Desktop (`lg+`, `>= 1024px`):** Fixed `56px` vertical icon rail (`WorkspaceRail`) on the far left + collapsible `288px` parcel and case-study drawer (`ParcelSidebarDrawer` with `40x40px` dark vector parcel thumbnails) + main scrollable intelligence workspace.
- **Mobile (`< 1024px`):** Single-column layout with sticky top `SituationBanner` and `64px` bottom navigation bar.

