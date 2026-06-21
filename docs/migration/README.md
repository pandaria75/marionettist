# Marionettist migration guide

This guide documents the migration path for the strict rename from legacy `harness` naming to current `marionettist` naming.

## Current-state summary

Issue #42 has implemented the public rename:

- the current CLI commands are `marionettist` and `mari`
- current config uses `marionettist.config.yaml`
- managed runtime state uses `.marionettist/`
- current OpenCode assets use `marionettist-*` names
- the OpenCode plugin package spec is `marionettist-pathway-opencode`

Legacy `harness` names in this document exist only to help older installs migrate.

## Breaking-change statement

The rename implemented in issue #42 is a **strict breaking rename**.

- do not assume long-lived compatibility aliases
- do not assume old `harness` commands or file names will keep working after the rename
- do not assume automatic in-place migration

Teams should plan for a deliberate migration window rather than a mixed-name transition period.

## Legacy-to-current mapping

| Legacy surface | Current Marionettist surface |
| --- | --- |
| project/package `universal-ai-harness-framework` | `marionettist` |
| CLI `harness` | `marionettist` |
| short CLI | `mari` |
| `harness.config.yaml` | `marionettist.config.yaml` |
| `.harness/` | `.marionettist/` |
| `.harness/manifest.json` | `.marionettist/manifest.json` |
| `harness-kit` | `marionettist-kit` |
| OpenCode assets named `harness-*` | `marionettist-*` |
| future pathway OpenCode package naming | `marionettist-pathway-opencode` |

## Recommended migration path

The recommended migration path is:

1. **Backup**
   - save project-local configuration, task state, local docs, and any repo-specific customizations before changing naming surfaces
2. **Clear/uninstall**
   - use the current `marionettist clear` or `marionettist uninstall` workflow for removing old harness-managed installation state
   - review the preview carefully before apply, especially when local customizations exist
3. **Re-init**
   - re-initialize using the current `marionettist` command surface
   - `mari` is available as the short alias when preferred
4. **Reconfigure**
   - move project settings from `harness.config.yaml` expectations to `marionettist.config.yaml` expectations
   - update scripts, docs, CI references, local automation, and any OpenCode references to the new names
5. **Verify**
   - confirm the new installation state, manifest location, command references, and OpenCode asset names all match Marionettist naming

## OpenCode package migration

For OpenCode specifically, do **not** assume old generated installs are auto-migrated to the package default.

Current package facts:

- package spec: `marionettist-pathway-opencode`
- repository source root: `distributions/opencode/`
- package-first installs use `marionettist-pathway-opencode`, while this repository remains the source root for the packaged assets
- repository-local fallback remains available through `opencode.pluginSource: local`

Recommended migration path for an older generated OpenCode install:

1. **Preserve customizations**
   - back up user-owned `.opencode` commands, agents, skills, and config edits
2. **Remove generated integration first**
   - uninstall or remove the old generated OpenCode integration before enabling the package plugin path
   - avoid mixed old/new installs unless you are intentionally debugging overlap
3. **Enable package plugin**
   - switch to the package-first OpenCode path
   - use `opencode.pluginSource: local` only when you intentionally want the repository-local fallback instead
4. **Reapply local overrides carefully**
   - same-name local commands or agents can remain as intentional overrides of plugin-provided entries
   - keep only the user-owned customizations you still want to win
5. **Reload OpenCode**
   - restart or reload OpenCode after plugin/config changes so the new integration is picked up

During sync, rendering `opencode.pluginSource` into `marionettist.config.yaml` can cause that config file to appear as `conflict`. Review the diff before applying it; this reflects managed render-input change rather than automatic migration.

## Explicit non-compatibility note

This migration guidance assumes **no default compatibility layer** between old and new names.

That means teams should expect to update:

- command invocations
- config file references
- managed directory references
- manifest path references
- package names
- OpenCode agent, command, and related asset references
- internal documentation and onboarding instructions

If a later release introduces any temporary compatibility help, treat that as narrow implementation detail rather than a durable guarantee unless that release's documentation says otherwise.

## Troubleshooting and rollback

If migration work fails or produces unclear state:

- stop and keep the backup as the recovery source of truth
- verify whether old `harness` state was fully cleared before re-init
- verify that renamed config, manifest, and OpenCode references were updated consistently
- verify that local scripts and CI are not still invoking old names
- check the latest roadmap and issue #42 follow-up guidance for final naming details

For rollback, prefer:

1. remove the incomplete Marionettist installation state
2. restore the backup of the pre-migration project state
3. return to the pre-migration harness-era state until the migration can be retried cleanly

## Planning references

- [Future roadmap](../develop/marionettist-future-roadmap.md)
- [Recommended development order](../develop/marionettist-recommended-development-order.md)
- [Parallel development guidance](../develop/marionettist-parallel-development-guidance.md)

## Boundary note

This document does not add compatibility guarantees. It establishes the canonical migration guidance for moving older harness-era installs onto the current Marionettist surface.
