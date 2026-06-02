# Universal AI Harness Framework

[中文版](./README.zh-CN.md)

A reusable file-based framework that gives any repository a durable, upgradeable collaboration contract for AI agents.

## What Problem It Solves

AI-assisted development without guardrails produces lost constraints, context drift, and silent scope expansion. The harness solves this by putting inspectable collaboration rules and task state in plain repository files that agents read before acting.

## Main Strengths

- **File-based contract.** `AGENTS.md`, rules, docs, and task artifacts are plain files — reviewable, versionable, and agent-neutral.
- **Workflow gates.** Agents stop after analysis and after each approved slice. No unbounded autonomy.
- **Safe upgrades.** `harness diff` previews changes. `harness sync` updates only managed content. Local work is preserved by default.
- **Model tiering.** OpenCode scaffolding lets you assign the strongest model to planning, a cost-efficient model to coding and review, and the cheapest reliable model to utility tasks.
- **Optional tooling.** OpenCode slash commands and agent roles are ergonomic improvements, not required. The core harness works with plain prompts and files alone.

## Install

```powershell
# From GitHub
npm install -g github:pandaria75/universal-ai-harness-framework

# Or from a local clone
npm link
```

## Minimal Usage

From any target project:

```powershell
# Preview what would be installed
harness init --dry-run

# Interactive install
harness init
```

That installs `AGENTS.md`, `harness.config.yaml`, project docs, rules, skills, and a `.harness/manifest.json` for future safe upgrades.

Optional install choices:

- `--distribution-mode embedded` (default) keeps the harness self-contained in the target repo.
- `--distribution-mode hybrid` keeps the standard local install while marking that the project also expects external adapter-aware tooling.
- `--distribution-mode adapter` is for adapter-oriented installs where generated tooling is still tracked locally, but the manifest records adapter distribution explicitly.

The selected mode is recorded in `.harness/manifest.json` as `distributionMode`. Legacy installs may not have that field yet; in that case the CLI preserves legacy behavior, infers or reports the effective mode when possible, and does not silently rewrite the manifest just to add the field.

## Where To Go Next

| Document | Audience |
| --- | --- |
| [docs/DESIGN.md](./docs/DESIGN.md) | Tech leads and developers who want to understand the design principles |
| [docs/GUIDELINES.md](./docs/GUIDELINES.md) | Teams using the harness day-to-day — installation, task tiers, gates, skills, and prompts |
| [docs/OPENCODE.md](./docs/OPENCODE.md) | Teams using or evaluating the optional OpenCode scaffolding |

## Quick Command Reference

```powershell
# Initialize a target project
harness init
harness init --with-opencode
harness init --with-opencode --opencode-command-surface minimal
harness init --with-opencode --opencode-command-surface standard
harness init --with-opencode --opencode-command-surface advanced

# Preview framework updates without writing
harness diff

# Apply safe managed-content updates
harness sync
harness sync --dry-run

# Diagnose the harness installation
harness doctor
```

For OpenCode installs, the default command surface is the builder-first minimal set: `/harness`, `/harness-dev`, `/harness-incident`, `/harness-docs`, and `/harness-config`. `standard` adds `/harness-context`, `/harness-status`, and `/harness-continue`. `advanced` adds `/harness-feature`, `/harness-bugfix`, and `/harness-refactor`. Legacy `full` remains an accepted alias for `advanced`.

## Boundaries

- This repository is the **framework source**. Use `harness self init` for maintaining it — not regular `harness init`.
- `templates/` and `skills/` are publishable assets. Self-only rules do not go there.
- `.harness-self/` is disposable local runtime state.
- OpenCode is optional. The harness works without it.
- Docs are for design knowledge, not code indexes.
