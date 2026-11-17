# Cursor Pathway

This note captures the confirmed MVP direction for Cursor Pathway support in Marionettist.

## Decisions

- Default posture: plugin-first.
- Package shape: `marionettist-pathway-cursor` sourced from `distributions/cursor/`.
- Source of truth: `templates/pathways/cursor/**`.
- Local fallback: `marionettist init --with-cursor` and `marionettist sync --with-cursor` write managed files under `.cursor/skills`, `.cursor/rules`, `.cursor/agents`, and `.cursor/commands`.
- Marketplace entry for this repository: `.cursor-plugin/marketplace.json` points at `distributions/cursor`.
- Surface coverage for this MVP: Skills, Rules, Agents, and Commands.
- Out of scope for this MVP: hooks, MCP servers, and official Cursor Marketplace submission automation.

## What Plugin-First Means

New Cursor Pathway consumers can install `marionettist-pathway-cursor` through a Cursor marketplace pointing at this repository. OpenCode-style generated local files remain a supported fallback so projects can enable Cursor surfaces without requiring a marketplace install step.

Fallback choices:

- Marketplace / plugin install uses `distributions/cursor` as the staged package surface.
- CLI local fallback keeps repository-local generated `.cursor/**` assets managed by Marionettist init/sync.

Plugin-first does not remove normal Marionettist boundaries:

- repository files remain the source of truth
- managed assets must still be safe to diff and sync
- user-owned local Cursor customization outside the managed set must not be overwritten by default

## Package And Fallback Shape

- `templates/pathways/cursor/**` contains the framework source for package and local Cursor Pathway assets.
- `distributions/cursor/**` contains generated package staging for `marionettist-pathway-cursor`.
- Root `.cursor-plugin/marketplace.json` indexes the staged package for Cursor marketplace discovery from this repository.

Expected MVP capabilities are:

- Cursor-visible skills
- Cursor-visible rules (`.mdc`)
- Cursor-visible agents
- Cursor-visible commands

## Framework Self Path

For this framework repository itself:

- use `marionettist self init --apply --with-cursor`
- do not run regular target-project `marionettist init --with-cursor` against the framework source tree
- keep self-only policy out of `templates/AGENTS.md` and root `skills/`

## Validation

- `npm run cursor:dist`
- `npm run cursor:dist:check`
- Cursor-related smoke coverage under `npm run smoke` / `npm run self:smoke`
