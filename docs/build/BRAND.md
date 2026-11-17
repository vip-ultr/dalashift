# Brand

The DalaShift visual identity: palette, typography, component rules, and the
logo and favicon specification.

The design principle is a **field instrument**: weather stations, agronomic
trial records and professional mapping tools. Not a consumer health app, not
a marketing landing page.

> **The interface must never overstate what it knows.** That single rule
> determines the layout. Every data card carries a provenance line. When a
> coarse value is shown, the map draws the grid cell over the farm, because the
> visual proportion is the explanation. Every limitation appears next to the
> claim it qualifies. A missing value is a visible gap, never a zero and
> never a flat line.

---

## 1. Palette

Defined in `apps/web/src/app/globals.css` as Tailwind v4 theme tokens. There is
one canonical set of tokens. Do not introduce a second naming scheme.

The product is light mode only. The only brand colours are field green and
terracotta. There is no blue anywhere in the palette, including informational
and focus states. Semantic colours are chosen to be distinguishable without
relying on hue alone.

### Brand

| Token | Value | Use |
| ----- | ----- | ---- |
| `--color-brand-primary` | `#0a4232` | Primary action, the logo mark, active navigation |
| `--color-brand-primary-hover` | `#072f24` | Hover and pressed states |
| `--color-brand-primary-tint` | `#eaf2ee` | Tinted surfaces, selected rows, tag backgrounds |
| `--color-brand-accent` | `#c26e4a` | The single accent. Used for emphasis and for the seasonal outlook, never as a second brand colour |
| `--color-brand-accent-tint` | `#f9efea` | Tinted accent surfaces |

A deep field green with a terracotta accent. The green is a working colour
used sparingly for primary actions and is never used as a generic "good"
signal. The genuine good state uses `--color-positive`, which is a different,
brighter green and is never a brand colour.

### Surface

| Token | Value | Use |
| ----- | ----- | ---- |
| `--color-surface-canvas` | `#fafafa` | The page background |
| `--color-surface-card` | `#ffffff` | Cards, panels, the sidebar |
| `--color-surface-subtle` | `#f4f5f6` | Table headers, inactive tabs, inset areas |
| `--color-surface-border` | `#e5e7eb` | Hairline borders |

### Text

| Token | Value | Use |
| ----- | ----- | ---- |
| `--color-text-primary` | `#111827` | Body text and measurements |
| `--color-text-secondary` | `#4b5563` | Secondary lines, helper text |
| `--color-text-muted` | `#9ca3af` | Provenance lines, disabled states, axis labels |

All three pass WCAG 2.1 AA for normal text against the canvas.

### Semantic

| Token | Value | Use |
| ----- | ----- | ---- |
| `--color-positive` | `#00b159` | A genuinely good condition only. Never a brand colour |
| `--color-warning` | `#b45309` | A warning that needs attention |
| `--color-danger` | `#b42318` | A genuine failure |
| `--color-danger-bg` | `#fdeceb` | Tinted background for danger messages |
| `--color-info` | `#4b5563` | Neutral informational text, not blue |
| `--color-focus` | `#0a4232` | The single focus ring colour |

Semantic colours must never be the only carrier of meaning. Pair every state
with an icon or a text label. A missing value is a gap in a muted colour, never
a red and never a zero.

---

## 2. Typography

| Token | Value |
| ----- | ----- |
| `--font-sans` | `Inter`, with the system stack as fallback |
| `--font-display` | `Geologica`, with the system stack as fallback |

Both are **bundled locally** from `apps/web/src/app/fonts/`. No build-time
request is made to a third-party font host, and no font licence obligation
is created at run time. The licence text is at
`apps/web/src/app/fonts/OFL.txt` (SIL Open Font License 1.1).

The type scale is defined once as custom properties in `globals.css`. Nothing
is smaller than 12 px.

| Token | Value | Role |
| ----- | ----- | ---- |
| `--text-display` | 32 px | Page title |
| `--text-display-sm` | 28 px | Compact page title |
| `--text-heading` | 20 px | Section heading |
| `--text-body` | 16 px | Body and measurements |
| `--text-secondary` | 14 px | Secondary text |
| `--text-helper` | 12 px | Labels, captions and axis labels |

| Role | Treatment |
| ---- | --------- |
| Page title | Display face, one per page |
| Section heading | Sans, semibold |
| Card title | Sans, semibold |
| Body | Sans, 16 px minimum, 1.6 line height |
| Secondary text | Sans, 14 px, `--color-text-secondary` |
| Label and caption | Sans, 12 px, uppercase with letter spacing, for field labels only |
| **Measurement** | Display face, large, **tabular figures** |
| Axis and chart label | Sans, 12 px, never smaller |

`font-variant-numeric: tabular-nums` is applied through the `.tabular` utility
on measurement elements, not to the whole document. Keeping it scoped means
prose and display text retain their natural proportional figures while a
column of measurements stays aligned. Do not rely on a global body rule.

---

## 3. Spacing and layout

A 4 px base scale: 4, 8, 12, 16, 24, 32, 48, 64.

| Context | Spacing |
| ------- | ------- |
| Card padding | 24 (16 on mobile) |
| Gap between cards | 16 |
| Section gap | 32 (24 on mobile) |
| Page gutter | 24 (16 on mobile) |
| Label to value | 4 |

**Mobile first.** The target is a mid-range Android phone on a slow
connection. The single column at under 640 px is the primary layout, and the
desktop layout is the enhancement.

| Breakpoint | Width | Layout |
| ---------- | ----- | ------ |
| `sm` | under 640 px | Single column. Cards stack. Charts fill the width. The map is full viewport with controls in a bottom sheet |
| `md` | 768 px and up | Two columns where it helps: chart beside readings |
| `lg` | 1024 px and up | Full dashboard with the navigation rail |
| `xl` | 1280 px and up | The same, with wider gutters |

Structure comes from spacing, not from heavy borders or shadows. There are
almost no shadows in the system.

### Radii and focus

Controls use `--radius-control` at 10 px and cards use `--radius-card` at
12 px. There is a single focus token, `--color-focus`, shared by every
interactive element. The focus ring is a 2 px solid outline with a 2 px
offset and is applied in `globals.css` to links, buttons, form controls and
anything with `role="button"` or `tabindex`. It must never be removed without
an equivalent replacement.

---

## 4. Component rules

### Cards

One idea per card. Title, an optional one-line explanation, the content, and
the provenance line.

> **Measured over your field** · Landsat, 12 Nov 2026
> **An estimate for the 9 km area around your farm** · NASA SMAP, 3 days ago

The provenance line is small, muted, and always present.

### Data display

| Element | Rule |
| ------- | ---- |
| Numbers | Tabular figures. The unit always sits beside the number, smaller and muted |
| Dates | Relative for recent, absolute beyond a week |
| Missing | Never blank. A dash with a tooltip that says why it is missing |
| Ranges | Always the range and the mean: "0.11 to 0.24 (avg 0.16)" |
| Percentages | One decimal place, never rounded to a whole number |
| Comparisons | Always against a stated baseline, never in the abstract |

### Charts

Recharts. Direct labelling where possible, so a farmer is not hunting through
a legend on a small screen. No 3D, no gradients, no drop shadows. The y-axis
starts at zero for counts and is labelled with its unit. Gridlines are
subtle. A summary line sits above the chart, which is the highest-value chart
convention in the system. Every chart has a text alternative.

`honesty-time-series-chart.tsx` draws a gap as a gap. A flat line through a
missing period is a lie.

### Forms

One column on mobile. Labels sit above the fields, because placeholders are
not labels. Required and optional are visually distinguished. Every field
states why it is asked. Validation runs on blur, not on every keystroke. **A
form is never cleared on error.** Losing a farmer's input is unforgivable.

### Buttons

One primary button per screen, carrying the main forward action. Labels are
verbs: "Save farm", not "Submit". The minimum touch target is 44 by 44 px.

---

## 5. Logo and favicon

Assets live in `apps/web/public/brand/` and `apps/web/public/`.

| File | Use |
| ---- | --- |
| `brand/logo.svg` | The primary mark, vector |
| `brand/logo.png` | The primary mark, raster, 274 KB |
| `brand/logo-horizontal.svg` / `.png` | Horizontal lockup for the navigation bar |
| `brand/logo-stacked.svg` / `.png` | Stacked lockup for print and for the presentation |
| `favicon.svg` | The scalable favicon |
| `favicon.ico` | The legacy favicon, 32 by 32 and 16 by 16 |
| `favicon-16x16.png`, `favicon-32x32.png` | Raster favicons |
| `icon-192.png`, `icon-512.png` | PWA and install icons |
| `icon-maskable-512.png` | The maskable icon, with the safe zone respected |
| `apple-touch-icon.png` | The iOS home screen icon |
| `og-image.png` | The social preview card, 146 KB |
| `site.webmanifest` | The web app manifest |

**Rules.**

1. The mark is drawn in `--color-brand-primary` (`#0a4232`) on a transparent
   background. Never re-colour it per page.
2. The clear space around the mark is at least the height of the leaf element.
3. The favicon must remain legible at 16 by 16. It uses the simplified
   silhouette, not the full lockup.
4. The maskable icon keeps its content inside the inner 80 percent circle.
5. PNG assets are rasterised from the SVG at the sizes listed above. Do not
   hand-edit the raster files.
6. The SVG sources are the master. A change is made in the SVG and
   re-exported.

---

## 6. Accessibility

WCAG 2.1 AA is a requirement, not a nicety.

| Requirement | Implementation |
| ----------- | -------------- |
| Contrast | Text at 4.5:1 or better. Meaningful graphics and large text at 3:1 or better |
| Focus | A visible focus ring on every interactive element. Never `outline: none` without a replacement |
| Keyboard | Every flow completable by keyboard |
| Semantics | Real `button`, `label` and `fieldset` elements. Landmark elements |
| Charts | A text alternative conveying the same information |
| Motion | `prefers-reduced-motion` is respected |
| Screen reader | Live regions for asynchronous results |
| Form errors | Linked to the field with `aria-describedby`, and announced |
| Language | `<html lang>` is set |

---

## 7. Writing

Plain language. Short sentences. No jargon without an immediate explanation.
Lead with the conclusion, then the evidence.

- "An estimate for the 9 km area around your farm", not "SMAP L3 enhanced 9
  km EASE-Grid".
- Never "we know", "accurately" or "precisely" about an environmental value.
- No exclamation marks. No emoji in a data context.
- **Never an em dash (U+2014).** The rule is enforced mechanically by
  `pnpm validate:style`.

See [`docs/design/design-system.md`](../design/design-system.md) for the full
design rationale and [`docs/product/user-flows.md`](../product/user-flows.md)
for the screen-by-screen behaviour.
