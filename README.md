# Universal AI Harness Framework

[中文版](./README.zh-CN.md)

Reusable file-based harness for repository-level AI collaboration.

It gives a project a durable collaboration contract for agents through:

- `AGENTS.md` as the repository entrypoint
- `.aiassistant/rules/*.md` for enforceable constraints
- `docs/**/*.md` for design knowledge and routing
- `.task/` for requirement, plan, and context artifacts
- `skills/*/SKILL.md` for lightweight workflow orchestration
- `.harness/manifest.json` for safe framework upgrades
- optional `.opencode/` scaffolding for command and agent automation (plus project-root `opencode.jsonc`)

## Who This Is For

- Framework maintainers evolving templates, skills, and CLI behavior
- Project teams onboarding a repository with `harness init`
- Developers who collaborate with agents in day-to-day work

## What The Harness Is

This framework is not a code generator, and it is not tied to one agent product.

It installs a small set of repository files that make AI collaboration reviewable, repeatable, and upgradeable.

The core idea is simple:

1. Put durable constraints and knowledge in files.
2. Let agents analyze before coding.
3. Allow coding only from explicit task artifacts.
4. Review the same slice immediately after implementation.
5. Stop at gates before crossing phases or slices.

See [docs/DESIGN.md](./docs/DESIGN.md) for the design model and [docs/GUIDELINES.md](./docs/GUIDELINES.md) for daily usage.

## Core Workflow

The harness workflow is a lightweight orchestration model built from reusable skills:

```text
task-intake
  -> requirement-freezer
  -> module-inspector / workflow-inspector
  -> implementation-slicer
  -> context-pack-builder
  -> coding
  -> boundary-reviewer
  -> workspace-knowledge-manager review
```

The workflow is trimmed by task complexity:

- Tier S: trivial low-risk change, direct coding and review
- Tier M: analysis plus task-scoped `.task/<task-id>/context-pack.md` before coding
- Tier L: full requirement, slicing, gate, and review flow

The key harness rule is the gate model:

- stop after analysis, before coding
- stop after each approved slice or approved parallel group
- allow coding to flow directly into review only for that same approved slice or group

## Install For Local Development

### Install from GitHub

```powershell
npm install -g github:pandaria75/universal-ai-harness-framework
```

Then from any target project:

```powershell
harness init
```

To upgrade to the latest version:

```powershell
npm install -g github:pandaria75/universal-ai-harness-framework#master
```

### Install from local clone

From this repository:

```powershell
npm link
```

Then from any target project:

```powershell
harness init
```

Alternatively, run the CLI directly without linking:

```powershell
node /path/to/universal-ai-harness-framework/bin/harness.js init --project .
```

Windows example:

```powershell
node C:\path\to\universal-ai-harness-framework\bin\harness.js init --project .
```

## Commands

Initialize a project:

```powershell
# Preview what would be installed
harness init --dry-run

# Full interactive init
harness init

# Non-interactive init with default values
harness init --auto

# Non-interactive init that overwrites existing managed files
harness init --auto --force
```

When `harness init` detects existing files, it prompts for a conflict strategy per file: backup (rename to `.bak`), overwrite, or skip. Use `--auto` to bypass interactive prompts and skip all existing files by default; combine with `--force` to overwrite all existing managed files instead.

Initialize with recommended OpenCode scaffolding:

```powershell
harness init --dry-run --with-opencode
harness init --with-opencode
```

Preview framework-managed changes:

```powershell
harness diff
```

Apply safe framework-managed updates:

```powershell
harness sync
harness sync --dry-run

# Overwrite locally modified managed files with framework versions
harness sync --force
```

Diagnose a target project harness installation:

```powershell
harness doctor
```

`harness doctor` checks the config, managed `AGENTS.md` block, manifest, rules, knowledge map, workflow doc, `.task` directory, optional OpenCode templates, skill frontmatter, model profiles, and the active task pointer.

## Task State

Non-trivial tasks are task-scoped. The active task is selected by `.task/active.json`, and durable task state lives under `.task/<task-id>/state.json`.

New context packs should be written to `.task/<task-id>/context-pack.md`. Legacy `.task/context-pack.md` remains a migration fallback only. The installed `docs/project/harness-workflow.md` defines the task state contract.

## Model Profiles

`harness.config.yaml` defines stable model profiles: `think`, `build`, `review`, and `run`.

Skills declare capability needs such as `reasoning`, `coding`, `reflective`, or `utility`. OpenCode agent files may render concrete `model` fields, but those values come from the configured profiles rather than being chosen independently inside each skill.

## What `harness init` Installs

Core assets:

- `AGENTS.md`
- `harness.config.yaml`
- `docs/project/harness-workflow.md`
- `docs/project/knowledge-map.md`
- `.aiassistant/rules/*.md`
- `.agents/skills/*/SKILL.md`
- `.task/`
- `.harness/manifest.json`

Optional OpenCode assets when `--with-opencode` is used:

- `opencode.jsonc` (project root)
- `.opencode/commands/*.md`
- `.opencode/agents/*.md`
- `.opencode/README.md`

## Managed And Local Content

This framework is designed to evolve without taking ownership of project-local work.

Framework-managed content is tracked in `.harness/manifest.json`.

Project-local content is preserved by default, including:

- project-specific docs
- project-specific rules
- project-specific skills
- `.task/` task artifacts
- the `project-local` section in `AGENTS.md`
- local `.opencode/` customization you choose not to standardize

`harness diff` shows the plan without writing files.

`harness sync` updates only content that is safe to update, and reports local modifications or conflicts instead of overwriting them by default.

## Optional OpenCode

OpenCode is optional, not required.

The harness core works with plain repository files, standard prompts, and the installed skills. That is the primary model.

OpenCode is recommended for two reasons:

1. **Model tiering.** Multi-agent roles with independent model assignments let you match the right model to each job. Strong models handle requirement analysis and planning. Cost-efficient models handle coding and review. Cheap fast models handle indexer and validator utility work.
2. **Faster execution.** Reusable slash commands, local agent roles, and validator scaffolding reduce repeated prompting overhead.

When enabled, the framework installs editable local scaffolding rather than hard product behavior. Teams can adapt models, permissions, and validator strategy to their own environment.

See [docs/OPENCODE.md](./docs/OPENCODE.md).

## Knowledge Policy

Harness docs are for design knowledge, not code indexing.

Docs should explain:

- responsibilities
- behavior
- workflows
- domain concepts
- boundaries
- extension points
- risk areas

Docs should not become:

- file trees
- class inventories
- function inventories
- call-site indexes
- mechanical source maps

Use IDE tools, local search, or source inspection for code navigation.

## Publishability

Reusable framework assets must stay scrubbed of project-specific and machine-specific data.

Do not publish:

- personal usernames
- workstation absolute paths
- secrets or tokens
- internal-only URLs
- source-project branding copied into defaults

## Validation

Run:

```powershell
npm run smoke
```
