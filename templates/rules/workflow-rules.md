# Workflow Rules

## Harness Gates

For non-trivial tasks, do not move from analysis to coding, between coding slices, or from coding to review without explicit user confirmation.

## Context Pack

For Tier M and Tier L tasks, create or update `.task/<task-id>/context-pack.md` before coding. Read `<task-id>` from `.task/active.json`.

Legacy `.task/context-pack.md` may be used only as a migration fallback and must not be the default output path for new tasks.

## Documentation

Update project knowledge only when design, architecture, functional behavior, workflow, or boundary rules change.

Do not update docs only because implementation files were added, renamed, or reorganized unless the design meaning changed.
