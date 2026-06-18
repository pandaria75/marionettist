# Pathways

This directory records pathway-specific decisions that do not belong in the framework-wide design docs.

Today, the framework still ships with **harness** naming. Pathway notes may mention **Marionettist** when they discuss planned future packaging or naming, but those references are roadmap direction rather than completed product behavior.

Current documents:

- [OpenCode Pathway MVP](./opencode.md)

Current MVP workflow note:

- OpenCode Pathway configuration authoring is documented as the distinct `harness-pathway-config` workflow, not as a core CLI config feature.

Related operator guide:

- [Documentation home](../README.md)
- [OpenCode With The Harness](../OPENCODE.md)
- [Reference landing page](../reference/README.md)
- [Migration planning](../migration/README.md)

## Current status

- OpenCode is the only documented Pathway in the current MVP scope.
- The current OpenCode story is plugin-first with generated-file fallback, not a completed packaged Pathway release.
- Pathway-scoped config authoring currently means the OpenCode `harness-pathway-config` workflow, separate from the older general `harness-config` wrapper.
- Future Pathways such as Pi belong to later roadmap work and are not implemented here.

Scope for this directory:

- describe pathway behavior and ownership boundaries
- capture MVP decisions before broader information architecture work
- stay project-neutral and reusable across target projects

Non-goals for this initial skeleton:

- full pathway API documentation
- implementation details for future pathway variants
- project-specific setup guidance
