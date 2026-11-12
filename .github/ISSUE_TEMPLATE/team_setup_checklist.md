---
name: Team working agreement
description: Confirm the shared conventions the three-person team works by
labels: ["meta"]
body:
  - type: markdown
    attributes:
      value: |
        This issue is the team's shared checklist for a branch that touches
        the platform core. Tick items as they are completed.

  - type: checkboxes
    id: setup
    attributes:
      label: Setup
      options:
        - label: Cloned the repository and read AGENTS.md and CONTRIBUTING.md
          required: true
        - label: `pnpm install` completes without errors
          required: true
        - label: `.env.local` created from `.env.example` with real values
          required: true
        - label: `pnpm dev` serves the application locally
          required: true

  - type: checkboxes
    id: before-merge
    attributes:
      label: Before merge
      options:
        - label: `pnpm check` passes (format, lint, typecheck)
          required: true
        - label: `pnpm test` passes
          required: true
        - label: Branch was rebased on the latest `main`
          required: true
        - label: PR describes the change and links the issue
          required: true

  - type: checkboxes
    id: honesty
    attributes:
      label: Claim integrity
      options:
        - label: Any statement about data accuracy reflects the real spatial/temporal resolution of the source
          required: true
        - label: No NASA endorsement or affiliation is implied
          required: true
        - label: Field validation claims are limited to the locations actually visited
          required: true
