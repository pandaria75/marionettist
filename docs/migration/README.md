# Migration

This section prepares future migration work. It does **not** mean the harness has already been renamed to Marionettist.

## Current state

- user-facing commands still use `harness`
- current config still uses files such as `harness.config.yaml` and `.harness/`
- current docs should stay honest about present naming and behavior

## What this section is for

- preparing teams for a future harness-to-Marionettist rename
- linking the roadmap material that explains why the rename is planned
- giving future migration work a stable documentation home before the rename is implemented

## Current planning references

- [Future roadmap](../develop/marionettist-future-roadmap.md)
- [Recommended development order](../develop/marionettist-recommended-development-order.md)
- [Parallel development guidance](../develop/marionettist-parallel-development-guidance.md)

## Boundary note

Issue #40 only creates the information-architecture slot for migration docs. It does not perform the rename, add compatibility guarantees, or change current commands.
