# ADR-0013: Full EN/HA Interface Language Switching

| Field    | Value |
| -------- | ----- |
| Status   | Accepted |
| Date     | 2026-11-17 |
| Deciders | Product owner via the approved redesign brief, section 9 |
| Related  | `OPEN-DECISIONS.md` D-08 (superseded), `ADR-0011` D-14, `docs/design/redesign-brief.md` § 9 |

## Context

Decision D-08 chose "English operator chrome, Hausa field layer": farmer-facing
agronomic content appeared in Hausa while the surrounding interface stayed in
English. Field interviews later showed that the person who introduces the tool
is often a Hausa speaker who is not comfortable in English, and the redesign
brief now requires that language be switchable at any time, by anyone, signed
in or not. A partial mixed-language interface cannot meet that requirement.

## Decision

D-08 is superseded by full EN/HA interface switching.

- English is the default. Hausa is the only other language for now.
- One `LanguageProvider` mounted once in the root layout is the single source
  of truth. A single `LanguageSwitcher` using EN and HA labels is visible on
  every view, for signed-in and signed-out users alike.
- All interface copy, including engine-generated copy such as rationales,
  explanations, ranking basis, report disclaimers and planting triggers, is
  keyed in one message dictionary with `{placeholder}` substitution. No raw
  message id or untranslated key is shown to the user.
- A signed-in preference is read from and written to `/api/profile`; the server
  value wins on load. A signed-out preference is stored in `localStorage` under
  `dalashift-language` so it survives reloads and sessions. Rendering never
  blocks on the network.
- The active language sets the document `html lang` attribute at runtime.

## Consequences

### Positive

- Any user can read the whole interface in their own language on any screen.
- One dictionary and one switcher give one place to add future languages.
- Signed-out users keep their choice without an account.

### Negative / accepted costs

- Every string needs an accurate Hausa translation and native-speaker review
  before release. This is a new, ongoing translation review obligation.
- The `html lang` attribute is now dynamic and must be set after hydration, so
  the server-rendered document initially carries `lang="en"`.
- Engine copy must remain keyed; untracked raw strings will not translate.

### Follow-up work

- [ ] Native Hausa review of the full message dictionary, including crop names
      and planting triggers.
- [ ] Decide whether Hausa mode is Hausa-only or bilingual, as left open in
      brief section 17.
- [ ] Wire the switcher into every chrome surface listed in brief section 9.2
      and remove the no-op control in `registered-farm-workspace.tsx`.
