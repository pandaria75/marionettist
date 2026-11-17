# Pathways

This directory records pathway-specific decisions that do not belong in the framework-wide design docs.

Current documents:

- [OpenCode Pathway MVP](./opencode.md)
- [Cursor Pathway MVP](./cursor.md)

Current MVP workflow note:

- OpenCode Pathway configuration authoring is documented as the distinct `marionettist-pathway-config` workflow, not as a core CLI config feature.
- Cursor Pathway currently focuses on plugin-first packaging plus CLI local `.cursor/**` fallback for skills, rules, agents, and commands.

Related operator guide:

- [Documentation home](../README.md)
- [OpenCode With Marionettist](../OPENCODE.md)
- [Reference landing page](../reference/README.md)
- [Migration planning](../migration/README.md)

## Current status

- OpenCode remains the primary documented Pathway with package-first plugin usage and generated-file fallback.
- Cursor Pathway is now also in MVP scope as `marionettist-pathway-cursor`, with source rooted at `templates/pathways/cursor/` and staging at `distributions/cursor/`.
- The OpenCode package spec remains `marionettist-pathway-opencode`, with source rooted at `distributions/opencode/`.
- Pathway-scoped config authoring currently means the OpenCode `marionettist-pathway-config` workflow, separate from the general `marionettist-config` wrapper.
- Pi remains an experimental parallel pathway; see the Pi pathway package under `distributions/pi/` and related docs for its current boundary.

Scope for this directory:

- describe pathway behavior and ownership boundaries
- capture MVP decisions before broader information architecture work
- stay project-neutral and reusable across target projects

Non-goals for this initial skeleton:

- full pathway API documentation
- implementation details for future pathway variants
- project-specific setup guidance
