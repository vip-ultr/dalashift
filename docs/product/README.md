# Documentation: `docs/product/`

Product behaviour: flows, onboarding, and the recommendation method.

| File                                                    | Purpose                                                                    |
| ------------------------------------------------------- | -------------------------------------------------------------------------- |
| [`user-flows.md`](./user-flows.md)                        | The three farmer modes, the onboarding sequence, the error journeys, and the flow that proves the product is honest. |
| [`recommendation-methodology.md`](./recommendation-methodology.md) | **The method.** Hard constraints, evidence per dimension, evidence strength, limitations, rotation strategy comparison, and the crop catalog format. |
| [`../../PRD.md`](../../PRD.md)                            | The authoritative product requirements.                                    |

---

## The principle that governs this directory

**The product must never overstate what it knows.**

Every assessment carries a verdict, a rationale that cites its inputs, and an
explicit list of limitations. Every environmental value carries its source,
its resolution, when it was observed, and whether it is a direct observation
or a model output.

A product that says *"I don't know, and here is what would help"* is more
useful to a farmer than one that always produces an answer.

---

## Reading order

1. [`../../PRD.md`](../../PRD.md): what we are building and why.
2. [`user-flows.md`](./user-flows.md): how the farmer moves through it.
3. [`recommendation-methodology.md`](./recommendation-methodology.md): how the
   answer is produced.
4. [`docs/build/PAGES.md`](../build/PAGES.md): what is actually on each screen.

## Status

The method and the flows are specified and implemented. The implementation is
in `apps/web/src/features/` and `apps/web/src/components/`; the page inventory
is in `docs/build/PAGES.md`.