# ADR-0012: First-Party Authentication with Supabase RLS

| Field    | Value |
| -------- | ----- |
| Status   | Accepted |
| Date     | 2026-11-15 |
| Deciders | Product owner request |
| Related  | `ADR-0003` (authentication portion superseded), `ARCHITECTURE.md` § 10, `SECURITY.md`, `PRD.md` FR-1 |

## Context

Supabase Auth email and phone signups are disabled for the project, blocking
the app's registration flow. The product owner directed that users register
and sign in through an application-managed method, with account data stored in
the existing Supabase database. Supabase PostgreSQL, PostGIS, Storage and RLS
remain in use.

Farm and profile RLS policies use `auth.uid()` as the identity anchor. Replacing
Supabase Auth must not remove or bypass those database policies. The app also
needs to preserve existing account UUIDs and farm ownership without pretending
that Supabase Auth password hashes are exportable.

## Options considered

### Option A: Continue using Supabase Auth

- **Advantages:** Managed password and session handling; existing RLS claims.
- **Disadvantages:** Signup is disabled in the active Supabase project.
- **Risks:** Registration remains blocked.

### Option B: First-party credentials and application sessions

- **Advantages:** Registration and sign-in are controlled by the app; no
  external email or SMS provider is required for basic access.
- **Disadvantages:** The application owns password security, session storage,
  rate limiting and recovery.
- **Risks:** A signing-secret leak can allow database identity forgery. Users
  cannot prove control of an email or phone without a verification channel.

## Decision

Use first-party email-or-international-phone plus password accounts. Hash
passwords with scrypt, store only random session-token hashes in the database,
and issue seven-day HttpOnly, SameSite=Lax cookies that are Secure in
production. Verify each session server-side, then sign a five-minute
HS256 JWT for that account UUID using the Supabase project's legacy
`SUPABASE_JWT_SECRET`. Use the anon key plus this user-scoped JWT for all
farmer-owned database operations so existing `auth.uid()` policies remain in
force.

The service-role client may access authentication tables for signup, session
verification, revocation and rate limiting, and create the profile row during
registration. It must not read or write farmer business data on behalf of a
user. Existing environmental-observation ingestion remains a separate,
validated service-role path after user-scoped parcel ownership checks.
Authentication routes validate inputs, require same-origin requests,
and use Postgres-backed rate limits of five registrations and ten sign-in
attempts per identifier and client address in a 15-minute window.

Existing account UUIDs and profile/farm data remain intact. Password hashes
cannot be transferred from Supabase Auth. Legacy accounts remain locked out:
they cannot sign in or be claimed through ordinary signup. An administrator
must verify the user's identity out of band and perform a separately reviewed
password reset. This release has no recovery route or reset procedure. The
current version sends no email or SMS verification.

## Reasoning

This makes registration work without relying on Supabase Auth providers while
retaining database-enforced ownership. Short-lived signed tokens bridge the
first-party identity to existing RLS policies. Server-side session checks,
database-stored token digests and limited service-role use reduce the amount
of privileged access.

The design does not provide verified contact ownership or account recovery.
Those are known product and security limitations and must be addressed before
production use with real farmer data.

## Consequences

### Positive

- Users can create accounts and sign in without Supabase Auth email or phone
  provider availability.
- Existing RLS rules and stable farm-owner UUIDs remain in force.
- Passwords and session tokens are never stored in plaintext.

### Negative / accepted costs

- The application owns credential security, rate limiting, session revocation
  and future account recovery.
- Vercel must receive `SUPABASE_JWT_SECRET` as a server-only environment
  variable. Projects without the legacy HS256 signing secret cannot use this
  implementation as configured.
- Existing Supabase Auth users cannot sign in until a verified reset process
  is available.
- The legacy reset must be performed manually by an administrator after
  independent identity verification. Matching an unverified email or phone is
  not sufficient.
- Email and phone ownership is not verified in this version.

### Follow-up work

- [ ] Implement verified account recovery and migration for legacy users.
- [ ] Add email or SMS verification before relying on contact details for
  recovery or sensitive communications.
- [ ] Review rate limits and retention under production traffic.

### Revisit when

Reconsider this decision before production use with real farmer data, or when
verified recovery and identity checks can be supported.
