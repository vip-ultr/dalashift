---
name: Feature or research request
description: Propose a feature, investigation or documentation change
labels: ["enhancement", "needs-triage"]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem
      description: What farmer need or project gap does this address? "As a farmer, I want…"
    validations:
      required: true

  - type: textarea
    id: proposal
    attributes:
      label: Proposed change
      description: What would you like to happen, and where in the product?
    validations:
      required: true

  - type: dropdown
    id: type
    attributes:
      label: Type
      options:
        - Product feature
        - Data source / API research
        - Agricultural knowledge / crop data
        - Infrastructure / DevOps
        - Documentation
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
    validations:
      required: false

  - type: checkboxes
    id: scope
    attributes:
      label: Scope
      options:
        - label: This fits within the MVP scope defined in PRD.md.
          required: false
        - label: This changes architecture or the agreed technology stack, and needs an ADR in docs/decisions/.
          required: false
        - label: This requires a new external API key or paid service.
          required: false
