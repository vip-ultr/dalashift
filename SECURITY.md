# Security Policy

DalaShift handles **personal information** (farmer names, contact details,
locations) and **farm business information** (boundaries, crops, practices).
Both are treated as sensitive.

---

## Reporting a vulnerability

**Do not open a public GitHub issue, pull request or discussion for a security
problem.**

Report it privately to the team. Since this repository is new, the reporting
channel is the team itself; create a **private** issue or contact the
repository owner directly:

**Contact:** the repository owner (`vip-ultr`); see
<https://github.com/vip-ultr>

Include:

- What the issue is and where in the code it lives.
- How to reproduce it.
- What an attacker gains.
- Any suggested fix, if you have one.

**Expected response:** acknowledgement within 24 hours, an assessment within 3
days. Fixes for critical issues (authentication bypass, service-role key
exposure, cross-farmer data access) are prioritised immediately, ahead of the
hackathon feature work.

If the team agrees to disclose publicly after a fix, a SECURITY advisory and a
`CVE` may be requested.

---

## Security model

### Trust boundaries

| Boundary                    | Rule                                                                    |
| --------------------------- | ----------------------------------------------------------------------- |
| Browser → server            | The browser is **untrusted**. Every input is validated server-side.    |
| Server → Supabase           | The service-role key bypasses RLS. It lives only in server code.       |
| Server → NASA / other APIs  | Credentials live only in server code.                                  |
| Farmer → farmer             | RLS guarantees a farmer can only read and write their own records.     |
| Public repo → deployed app  | No secret, credential or real farmer data exists in the repository.    |

### What is sensitive here

| Class                     | Examples                                          | Handling                                        |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| **Credentials**           | Supabase service-role key and JWT secret, Earthdata token, provider keys | Server-side only. Never in `NEXT_PUBLIC_*`. Never in Git. |
| **Personal data**         | Farmer name, phone, email, precise farm location  | RLS-protected. Never in Git. Never in logs.     |
| **Farm business data**    | Boundaries, crops, planting dates, yields          | RLS-protected. Export only with explicit consent. |
| **Public research data**  | NASA products, SoilGrids, crop calendars           | Licence + attribution obligations apply.        |

### Controls in place

- **Row Level Security** on every table that holds farmer data. A new table
  shipped without policies is a security defect, not an oversight.
- **Least privilege.** The server uses the anon key with a short-lived,
  user-scoped JWT for farmer data. The service-role key is limited to
  authentication tables, registration-time profile creation, cache maintenance
  and validated environmental-observation ingestion after parcel ownership is
  checked with the user-scoped token.
- **`import "server-only"`** in `apps/web/src/lib/integrations/*` to make an
  accidental client import a build-time error rather than a runtime leak.
- **Secret scanning** in CI (gitleaks) plus a `.gitignore` that excludes all
  `.env*` variants, keys, certificates and service-account JSON.
- **Input validation** with Zod at every route handler, server action and
  external API boundary. Upstream responses are validated too.
- **Parameterised SQL only.** No string interpolation into SQL. Use the
  Supabase query builder or PostgREST filters.
- **Rate limiting** on endpoints that trigger external API calls.
- **Caching** so upstream quota is never the availability failure mode.
- **Safe error handling.** Internal errors are logged server-side; the client
  receives a generic message.
- **First-party sessions.** Passwords use scrypt, opaque session tokens are
  stored as hashes, and cookies are HttpOnly, SameSite=Lax and Secure in
  production. Auth routes require same-origin requests and database-backed
  rate limits.
- **Security headers** set in `apps/web/next.config.ts`
  (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`).

### Data retention

Phase 1 has no production data. For Phase 2, the retention rules below are
**proposed and require team approval** (see
`docs/decisions/ADR-0006-data-retention-and-consent.md`):

- Farmers can delete their account and associated farms. Deletion must cascade
  to analyses, recommendations and stored environmental values.
- Aggregated, non-identifying usage analytics are acceptable only if
  documented and disclosed in the product.
- Field-validation data collected during the hackathon is the highest-risk
  category. It must be captured on paper or in a local encrypted store, and
  transcribed into the platform only with explicit farmer consent.

---

## Data source security and licence compliance

External services are attack surface and legal obligation.

- **All keys are server-side.** No NASA Earthdata token, GEE credential or
  basemap key may appear in a `NEXT_PUBLIC_*` variable or in client code.
- **Third-party requests** must not forward farmer personal data to a provider
  that does not need it. A soil-grid lookup needs a coordinate, not a name.
- **Attribution and licence compliance** is a security-adjacent obligation:
  misattributed data breaches the terms under which we obtained it. Each source
  is recorded in `docs/api/data-sources.md`.

---

## Known gaps and open items

These are acknowledged, not hidden. They are tracked as open issues.

| Gap                                                    | Severity | Status                                     |
| ------------------------------------------------------ | -------- | ------------------------------------------ |
| RLS policies are specified but not yet implemented     | High     | Phase 2 first task                         |
| No automated dependency vulnerability audit yet         | Medium   | Add `pnpm audit` to CI                     |
| No email/SMS verification or account recovery           | High     | Implement before production use with real farmer data   |
| Legacy account password migration not implemented       | High     | Manual admin reset after out-of-band identity verification |
| No CSP configured yet                                   | Medium   | Phase 2: required before any external script loads |
| GitHub branch protection not configured                 | Medium   | Team action, outside the repository        |
| No account deletion flow                                | Medium   | Phase 2                                    |
| Supplier keys rotate on a schedule                     | Low      | Post-hackathon                             |
| `SECURITY.md` contact is a personal account, not an org | Low      | Replace with an org-level address before any public announcement |

---

## Responsible disclosure

We ask that you:

- Give us reasonable time to fix the issue before public disclosure.
- Avoid accessing, modifying or exfiltrating data beyond what is needed to
  demonstrate the issue.
- Avoid privacy violations and service degradation for other users.
- Report ethically and in good faith.

We will not pursue legal action against good-faith research that follows these
guidelines, respects farmer privacy, and does not degrade the service.
