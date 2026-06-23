# Pathways

This directory records pathway-specific decisions that do not belong in the framework-wide design docs.

Current documents:

- [OpenCode Pathway MVP](./opencode.md)

Current MVP workflow note:

- OpenCode Pathway configuration authoring is documented as the distinct `marionettist-pathway-config` workflow, not as a core CLI config feature.

Related operator guide:

- [Documentation home](../README.md)
- [OpenCode With Marionettist](../OPENCODE.md)
- [Reference landing page](../reference/README.md)
- [Migration planning](../migration/README.md)

## Current status

- OpenCode is the only documented Pathway in the current MVP scope.
- The current OpenCode story is package-first plugin usage with generated-file fallback.
- The package spec is `marionettist-pathway-opencode`, with source rooted at `distributions/opencode/`.
- Pathway-scoped config authoring currently means the OpenCode `marionettist-pathway-config` workflow, separate from the general `marionettist-config` wrapper.
- Future Pathways such as Pi belong to later roadmap work and are not implemented here; see the [Pi plugin parallel plan](../develop/02-pi-plugin-parallel-plan.md) for the current experimental boundary.

Scope for this directory:

- describe pathway behavior and ownership boundaries
- capture MVP decisions before broader information architecture work
- stay project-neutral and reusable across target projects

Non-goals for this initial skeleton:

- full pathway API documentation
- implementation details for future pathway variants
- project-specific setup guidance
