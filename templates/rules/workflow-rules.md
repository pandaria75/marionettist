# Workflow Rules

Use rule metadata from `00-repository-rules.md` when workflow constraints are provisional, verified, future-state, or strictly enforceable.

## Harness Gates

- Rule: For non-trivial tasks, do not move from analysis to coding, between coding slices, or from coding to review without explicit user confirmation.
  - type: hard
  - confidence: high
  - source: repository workflow policy

## Context Pack

- Rule: For Tier M and Tier L tasks, create or update `.task/<task-id>/context-pack.md` before coding. Read `<task-id>` from `.task/active.json`.
  - type: confirmed
  - confidence: high
  - source: repository workflow policy

Legacy `.task/context-pack.md` may be used only as a migration fallback and must not be the default output path for new tasks.

## Documentation

- Rule: Update project knowledge only when design, architecture, functional behavior, workflow, or boundary rules change.
  - type: confirmed
  - confidence: high
  - source: repository workflow policy

Do not update docs only because implementation files were added, renamed, or reorganized unless the design meaning changed.

## Interpretation Reminder

- Workflow rules marked `observed` describe how the project currently appears to operate; they are evidence, not default blockers.
- Workflow rules marked `target` describe desired future process and should not be reported as current mandatory behavior unless the approved work is implementing them.
