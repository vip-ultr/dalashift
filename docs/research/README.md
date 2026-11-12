# Documentation — `docs/research/`

Background research that informs decisions rather than specifying them.

| File                                                | Purpose                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| [`nasa-datasets.md`](./nasa-datasets.md)               | **Which NASA product for which farmer question**, the traps that cause silent errors, and what is genuinely farm-scale. |
| [`nigerian-agriculture.md`](./nigerian-agriculture.md) | The regional context, the verified public sources, and the validation questions to ask farmers in Tofa. |
| [`crop-calendars.md`](./crop-calendars.md)           | Where each planting window comes from, and the precedence rule.               |
| [`prior-art.md`](./prior-art.md)                       | The landscape, the gap we occupy, and the competitive risks.                   |

---

## Distinction from `docs/api/`

| Directory     | Contains                                                          |
| ------------- | ----------------------------------------------------------------- |
| `docs/api/`   | **Verified facts about a specific service** — endpoints, resolution, auth, rate limits, licences. Usable to write code against. |
| `docs/research/` | **Analysis and judgement** — which source to use for which question, what the traps are, what the competitive landscape looks like. Not directly consumable by code. |

---

## Rules for this directory

1. **Separate verified facts from judgement.** Use the same tags as
   `PRD.md`: `[Verified]`, `[UNVERIFIED]`, `[To verify]`, `[Open]`.
2. **Record the source URL and the date you checked it.**
3. **Prefer primary sources.** Official documentation, official data
   catalogues, official statistics agencies.
4. **Do not quote a statistic from memory.** If you cannot find the source
   today, mark it `[UNVERIFIED]` and look it up later, or leave it out.
5. **A farmer's direct testimony outranks a secondary source.** This is not
   just a principle — it is the design rule that makes the product correct.

---

## The honesty convention

These research notes contain a deliberately small number of hard numbers. That
is not an oversight — it is the same discipline the product applies:

> Do not present an estimated or coarse-resolution figure as a precise
> measurement. Do not present a secondary source as a primary one. Do not
> present a hypothesis as a validated finding.

If a number appears here without a citation and a date, it should be treated
as a claim to verify, not a fact.
