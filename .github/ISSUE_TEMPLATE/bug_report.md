---
name: Bug report
description: Report a defect in the DalaShift platform
labels: ["bug", "needs-triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to report a defect.

        **Before filing:** please check that the issue still reproduces on the
        latest `main` branch. Field-validation issues that depend on a specific
        farm or farmer must **not** include real names, phone numbers or
        precise farm boundaries.

  - type: textarea
    id: what-happened
    attributes:
      label: What happened
      description: What did you observe, and what did you expect instead?
      placeholder: The farm map drew the polygon in the wrong location / the recommendation said "unsuitable" but rainfall matched.
    validations:
      required: true

  - type: textarea
    id: reproduce
    attributes:
      label: Steps to reproduce
      placeholder: |
        1. Register a farm at (redacted)
        2. Open the environment panel
        3. Observe ...
    validations:
      required: true

  - type: textarea
    id: environment
    attributes:
      label: Environment
      description: Branch, commit, browser, OS, and whether the issue is specific to a data source.
      placeholder: main @ abc1234, Chrome 120 on Windows 11, POWER + SoilGrids sources
    validations:
      required: true

  - type: dropdown
    id: severity
    attributes:
      label: Severity
      options:
        - Blocks the hackathon demo
        - Major — core flow broken
        - Minor — cosmetic or secondary flow
    validations:
      required: true

  - type: checkboxes
    id: data-attribution
    attributes:
      label: Data attribution
      options:
        - label: If this involves an external data source, I checked the source's licence/attribution requirements.
          required: false
        - label: This report contains no real farmer personal data.
          required: true

  - type: textarea
    id: logs
    attributes:
      label: Error output or logs
      render: shell
    validations:
      required: false
