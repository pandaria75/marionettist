# OpenCode Pathway

This note captures the confirmed MVP direction for OpenCode Pathway support in Marionettist.

Current-state reminder:

- current commands, config files, and repository docs use **Marionettist** naming
- the package spec is `marionettist-pathway-opencode`, with source rooted at `distributions/opencode/`
- the default package path targets `marionettist-pathway-opencode`, while this repository continues to own the package source
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
- Package shape: `marionettist-pathway-opencode` sourced from `distributions/opencode/`.
- Default plugin source for new installs: package.
- Local fallback plugin path: `./.opencode/plugin/opencode-tasks.js` when `opencode.pluginSource: local` is selected.
- Compatibility: generated OpenCode files remain a supported local fallback, sourced from `templates/pathways/opencode/**` and generated into `.opencode/agents/**` and `.opencode/commands/**` when local mode is selected.
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

For the current implementation, new installs default to the package plugin path for `marionettist-pathway-opencode`. OpenCode should prefer package/plugin-provided behavior when that behavior is available. The framework still keeps generated-file local fallback behavior so existing installs and safer migration paths remain available.

Fallback choices:

- `opencode.pluginSource: package` uses the package plugin path as the default happy path.
- `opencode.pluginSource: local` keeps the repository-local generated plugin entry `./.opencode/plugin/opencode-tasks.js`.
- generated `.opencode/agents/**` and `.opencode/commands/**` remain supported fallback assets when local mode is selected.

Plugin-first does not remove normal Marionettist boundaries:

- repository files remain the source of truth
- managed assets must still be safe to diff and sync
- user-owned local OpenCode customization must not be overwritten by default

## Package And Fallback Shape

The OpenCode Pathway source of truth now lives in `templates/pathways/opencode/**`. The package staging tree lives in `distributions/opencode/**` and is generated/checked from the pathway source.

Current source-layout intent:

- `templates/pathways/opencode/**` contains the framework source for package and local OpenCode Pathway assets.
- `distributions/opencode/**` contains generated package staging for `marionettist-pathway-opencode`.
- `templates/opencode/**` has been removed and is no longer used.
- generated local fallback support is preserved; old installs are not auto-migrated.

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

This MVP direction preserves generated `.opencode/**` local fallback behavior while removing the old `templates/opencode/**` source directory.

The current fallback includes generated `.opencode/agents/**` and `.opencode/commands/**` files even when the plugin-first default is enabled.

## Override Behavior

Plugin-provided entries do not overwrite same-name local entries during injection. In practice, same-name local commands or agents remain the user-owned override path.

Practical meaning:

- if a project-local command or agent uses the same name as a plugin-provided entry, the local entry should remain the effective override
- teams should still avoid duplicate names unless override behavior is intentional
- user-owned custom `.opencode` files should be preserved during migration rather than silently replaced

This warning applies both to generated fallback entries and to project-local custom entries.

## Migration Guidance

Old generated installs should not be auto-migrated.

Recommended path:

1. back up user-owned `.opencode` customizations
2. uninstall or remove the old generated OpenCode integration first
3. enable the package plugin path for `marionettist-pathway-opencode`
4. restore or reapply user-owned customizations that should remain local overrides
5. restart or reload OpenCode so plugin/config changes are picked up

Do not mix the old generated integration and the new package plugin path unless you intentionally want to debug overlap.

## Runtime Validation And Smoke Posture

Runtime validation for the prototype command is:

- `opencode run --command marionettist-pathway-prototype`

Smoke behavior is intentionally environment-conditional:

- if the OpenCode CLI is unavailable, smoke reports `NOT_RUN` with evidence
- if the current OpenCode CLI does not advertise `--command` support, smoke reports `NOT_RUN` with evidence
- before final closure, live runtime validation still needs to run in at least one capable environment

## Plugin Loading Notes

Two MVP caveats are currently accepted:

- an explicit plugin entry and `.opencode/plugin/` auto-discovery may load different sources that inject the same Marionettist surface
- the current prototype `config` hook is idempotent, so this posture is accepted for the MVP instead of adding extra hardening in this slice

After changing `opencode.jsonc`, switching `opencode.pluginSource`, reinstalling generated fallback assets, or updating plugin assets, restart or reload OpenCode if the running session does not pick up the changes automatically.

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
- package publishing or npm release completion
- full conflict-prevention automation
- a full pathway documentation architecture beyond this initial skeleton
