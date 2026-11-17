# Documentation: `docs/design/`

Visual direction and interface standards.

| File                        | Purpose                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| [`design-system.md`](./design-system.md) | The proposed direction, typography, spacing, component rules, accessibility requirements, and the map interface. |

---

## Status

The direction is implemented and live in `apps/web/src`. The token set,
typography pairing and workspace shell are in `globals.css` and
`layout.tsx`; the page inventory is in
[`../build/PAGES.md`](../build/PAGES.md). The brand identity (name, logo,
final palette) is still not finalised and should not be presented as one.
See [`../product/brand-and-naming.md`](../product/brand-and-naming.md).

The token set in `apps/web/src/app/globals.css` is deliberately neutral so
that no brand colour is asserted before the team confirms the direction. A
final visual identity is a design-phase deliverable.

---

## The governing idea

**The interface must never overstate what it knows.**

This is not an aesthetic principle; it is a functional requirement that
determines the layout:

- Every data card carries a **provenance line**: the source, the resolution in
  plain words, and the observation date.
- When a coarse value is shown, the map draws the **grid cell boundary** over
  the farm. The visual proportion is the explanation.
- Every recommendation shows its **limitations** alongside its verdict, not
  hidden below the fold.
- A missing value is a **visible gap**, never a zero and never a flat line.

---

## Reading order

1. [`design-system.md`](./design-system.md): the direction and the rules.
2. [`../product/user-flows.md`](../product/user-flows.md): what the screens
   actually do.
3. [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) § 3: the frontend
   architecture those rules sit inside.
