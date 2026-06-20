# OpenCode Pathway MVP

This note captures the confirmed MVP direction for OpenCode Pathway support in Marionettist.

Current-state reminder:

- current commands, config files, and repository docs use **Marionettist** naming
- `marionettist-pathway-opencode` is still a future packaging direction, not a current released artifact
- generated `.opencode/**` assets remain part of the supported MVP story

Related docs:

- [Documentation home](../README.md)
- [Pathways landing page](./README.md)
- [OpenCode operator guide](../OPENCODE.md)
- [Configuration guide](../user-guide/configuration.md)
- [Migration planning](../migration/README.md)

Migration note: legacy `harness` names are migration-only context now. For the breaking rename sequence, carry-over expectations, and non-compatibility posture, use the [migration guide](../migration/README.md).

## Decisions

- Default posture: plugin-first.
- MVP distribution shape: repository-local prototype, not a published package.
- Default plugin path: `./.opencode/plugin/opencode-tasks.js`.
- Compatibility: generated OpenCode files remain a supported fallback under `templates/opencode/**` and generated `.opencode/agents/**` and `.opencode/commands/**` files.
- Validation path: `opencode run --command marionettist-pathway-prototype` is the accepted runtime smoke path for this MVP.

## Pathway Configuration Workflow

The OpenCode Pathway MVP now documents a distinct `marionettist-pathway-config` workflow for Pathway-scoped configuration authoring.

Important boundaries:

- it is Pathway-scoped, not a new core CLI `marionettist config` feature
- it is distinct from the existing general `marionettist-config` OpenCode wrapper
- current naming is already `marionettist`; legacy `harness` terms here should only be read as migration history

If you are migrating an older harness-era install, follow the concise migration steps in the [migration guide](../migration/README.md) instead of keeping mixed-name local OpenCode surfaces.

Expected workflow posture:

- draft candidate YAML or config changes for the relevant Marionettist-managed files
- show a diff or diff-like preview before any write
- require explicit user confirmation before writing config changes
- mention an OpenCode restart when config changes or plugin, command, or skill changes/assets may not load into the current session automatically

For this MVP, the documented targets are illustrative rather than exhaustive: existing Marionettist/OpenCode configuration surfaces include `marionettist.config.yaml`, `.marionettist/model-profiles.yml`, OpenCode config such as `opencode.jsonc`, and explicit tier-policy request targets when a user is asking the Pathway workflow to draft those policy changes. The workflow still does not create a broader non-OpenCode Pathway configuration system.

## What Plugin-First Means

For the MVP, generated `opencode.jsonc` enables a repository-local plugin entry for `./.opencode/plugin/opencode-tasks.js`. OpenCode should prefer pathway/plugin-provided behavior when that behavior is available. The framework still keeps generated-file fallback behavior so existing installs and safer migration paths remain available.

Plugin-first does not remove normal Marionettist boundaries:

- repository files remain the source of truth
- managed assets must still be safe to diff and sync
- user-owned local OpenCode customization must not be overwritten by default

## Repository-Local MVP Shape

The MVP only needs a repository-local prototype. It does not require package publishing, external distribution, or a broader pathway ecosystem rollout.

Current source-layout intent:

- `templates/pathways/opencode/**` contains the plugin prototype assets only.
- It does not mirror the generated fallback templates.
- Generated fallback assets continue to come from `templates/opencode/**`.
- A future packaged release may compose or bundle both kinds of assets differently, but that is outside this MVP.

Expected MVP capabilities are:

- OpenCode-visible agents
- OpenCode-visible commands
- skill-path discovery or an equivalent local skill asset strategy
- resolved model and temperature values flowing into visible agent behavior

## Generated-Files Fallback

Generated `.opencode` files remain part of the supported story for this MVP.

Fallback intent:

- preserve existing generated-file installs
- keep a safe compatibility path while pathway behavior is introduced
- avoid forcing immediate migration to plugin-only behavior

This MVP direction is intentionally additive. It does not remove or invalidate `templates/opencode/**` fallback behavior.

The current fallback includes generated `.opencode/agents/**` and `.opencode/commands/**` files even when the plugin-first default is enabled.

## Same-Name Override Behavior

Issue #37 accepted that same-name plugin entries may override file-defined entries. For the MVP, documentation is the mitigation; an automatic conflict-prevention mechanism is out of scope.

Practical meaning:

- if a plugin and a file define the same OpenCode entry name, the plugin-provided entry may win
- teams should avoid relying on duplicate names unless override behavior is intentional

This warning applies both to generated fallback entries and to project-local custom entries.

## Runtime Validation And Smoke Posture

Runtime validation for the prototype command is:

- `opencode run --command marionettist-pathway-prototype`

Smoke behavior is intentionally environment-conditional:

- if the OpenCode CLI is unavailable, smoke reports `NOT_RUN` with evidence
- if the current OpenCode CLI does not advertise `--command` support, smoke reports `NOT_RUN` with evidence
- before final closure, live runtime validation still needs to run in at least one capable environment

## Plugin Loading Notes

Two MVP caveats are currently accepted:

- an explicit plugin entry and `.opencode/plugin/` auto-discovery may load the same plugin twice
- the current prototype `config` hook is idempotent, so this posture is accepted for the MVP instead of adding extra hardening in this slice

After regenerating `opencode.jsonc` or `.opencode/plugin/**`, restart OpenCode if the running session does not pick up the changes automatically.

The same restart guidance applies when a config-writing workflow updates OpenCode-visible plugin, command, or skill assets and the current session does not reload them automatically.

## User Mitigation Options

When local OpenCode entries conflict with pathway-provided entries, users can reduce risk by:

- choosing distinct local names for custom commands or agents
- removing or renaming local entries that are no longer intended to win
- using `marionettist diff` and `marionettist sync` to inspect managed changes before applying them
- keeping local `.opencode` customization clearly separated from framework-managed assets

## Boundaries For Later Work

This MVP note does not define:

- Pi Pathway behavior
- package publishing strategy
- full conflict-prevention automation
- a full pathway documentation architecture beyond this initial skeleton
