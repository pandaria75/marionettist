# Harness Workflow

This project uses a lightweight file-based AI harness so task intent, design context, implementation slices, and review decisions remain visible in repository files.

## Task Tiers

- Tier S: minor, low-risk work that can proceed directly.
- Tier M: standard work that needs analysis and a context pack before coding.
- Tier L: complex work that needs frozen requirements, inspection, slicing, context packing, and gate confirmations.

## Phases

1. Analysis: clarify intent, inspect relevant project knowledge, create or update task context.
2. Coding: implement only the approved slice or approved group.
3. Review: check scope, rules, validation, and documentation sync needs.

## Gates

For non-trivial work, agents must stop before crossing:

- analysis to coding
- one coding slice or group to the next
- coding to review

At each gate, report:

- Phase
- Completed Work
- Files Created or Changed
- Validation Status
- Recommended Next Step
- User Confirmation Required

The final gate line must be:

`User confirmation required to continue.`

## Knowledge Policy

Docs explain design, architecture, functional behavior, workflow, and boundaries.

Docs must not become source-code indexes. Use IDE tools or local search for code navigation.
