# Documentation — `docs/api/`

Integration and external-service documentation.

| File                                                          | Purpose                                                             |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`data-sources.md`](./data-sources.md)                          | **The source registry.** Every candidate dataset with verified resolution, latency, auth, licence and limitations. |
| [`data-retrieval-strategy.md`](./data-retrieval-strategy.md)    | How we call, cache, normalise and fail over to each source.          |
| [`google-earth-engine.md`](./google-earth-engine.md)            | GEE assessment: quotas, tiers, licensing, 48-hour feasibility.       |
| [`map-tile-providers.md`](./map-tile-providers.md)              | Basemap and satellite imagery options, attribution, policy risks.    |

---

## Rules for this directory

1. **Never document an endpoint you have not read in official documentation.**
   If you inferred it, mark it UNVERIFIED.
2. **Every fact carries a source URL and a verification date.**
3. **Live behaviour beats documentation.** If the documentation and the live
   service disagree, record both — and trust the live service.
4. **Every source carries its licence and attribution requirement**, because
   NASA Space Apps requires that *"all resources, even open source resources,
   must be cited."* See [`../hackathon/README.md`](../hackathon/README.md) § 4.4.
5. **Never document a credential.** Reference the environment variable name
   only.

---

## The shape of an integration

```
lib/integrations/<source>/
├── index.ts        public surface — typed, normalised, provenance-bearing
├── client.ts       fetch, timeout, bounded retry, rate-limit handling
├── normalise.ts    units, time standard, fill values, mapped-unit factors
├── params.ts       upstream parameter ↔ canonical variable mapping
└── types.ts        upstream response shapes (Zod schemas)
```

Every adapter returns `ProvenancedValue[]`. Nothing crosses the boundary
without it. See [`data-retrieval-strategy.md`](./data-retrieval-strategy.md) § 5.

---

## Adding a new source — checklist

- [ ] Read the official documentation. Record the URL and today's date.
- [ ] Verify the live response shape with a real call.
- [ ] Document resolution, temporal cadence, latency, history depth, auth,
      rate limits, licence and attribution.
- [ ] Map upstream parameters to canonical variable ids in
      `packages/shared/constants`.
- [ ] Write the Zod schema for the upstream response.
- [ ] Implement `normalise.ts`: units, time standard, fill values.
- [ ] Add the source to `data_sources` and the attribution register.
- [ ] Add the attribution string to the in-product credits.
- [ ] Add the source to `THIRD_PARTY_NOTICES.md`.
- [ ] Write the integration test with a **sanitised fixture**, never a live
      call.
