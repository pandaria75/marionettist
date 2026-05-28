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

Recent P1 workflow additions keep that model explicit:

- `harness-critic` adds a plan-and-gate audit role for Tier L or high-risk work
- critic gates sit before coding and again before declaring critic-gated work done
- `/harness-incident` starts an evidence-first incident flow without authorizing code changes
- `incident-pack-builder` and `hypothesis-critic` structure incident evidence and challenge root-cause claims before implementation
- `context-pack-builder` routes docs through `docs/project/knowledge-map.md`, then narrows further with nearby `MODULE_RULES.md`, `AGENTS.md`, and `HARNESS_RULES.md`
- task context packs should record `Loaded Context` categories such as global rules, knowledge-map matches, path-proximity rules, and excluded context

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

This command is for ordinary target projects. Do not use regular `harness init` to bootstrap this framework repository.

Bootstrap OpenCode files for maintaining this framework repository itself:

```powershell
harness self init --with-opencode
harness self init --apply --with-opencode
```

Self OpenCode files are separate from target-project OpenCode templates. They live in this repository root and are only for framework maintenance. Target-project OpenCode templates remain under `templates/opencode/` and are installed only by regular target-project `harness init --with-opencode`.

When self OpenCode is enabled for this framework repository, root `.opencode/` contains two kinds of files:

- framework self-only OpenCode files for maintaining this repository
- generated local runtime mirrors copied from `templates/opencode/**`

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

Skills declare capability needs such as `reasoning`, `coding`, `reflective`, or `utility`. OpenCode agent files may render concrete `model` fields, but those values come from the configured profiles rather than being chosen independently inside each skill. In the default P1 workflow, the `review` profile backs both `harness-reviewer` and `harness-critic`.

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

Framework self-bootstrap uses a different command and different content:

- `harness self init --apply --with-opencode`
- root `opencode.jsonc`
- `.opencode/commands/harness-self-*.md`
- `.opencode/agents/harness-framework-*.md`
- generated mirrors under `.opencode/agents/harness-*.md`
- generated mirrors under `.opencode/agents/validators/**`
- generated mirrors under `.opencode/commands/harness-*.md`

Those self files are for maintaining this framework codebase. They must not be copied into `templates/AGENTS.md`, `templates/opencode/`, or `skills/`.

`templates/opencode/**` remains the only source of truth for target-project OpenCode agents and commands. If you need to change the standard harness builder/coder/planner/reviewer/validator or harness slash commands, edit `templates/opencode/**`, then run:

```powershell
harness self init --apply --with-opencode
harness self doctor
```

Do not edit generated mirror files under root `.opencode/agents/harness-*.md`, `.opencode/agents/validators/**`, or `.opencode/commands/harness-*.md` directly.

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

For this framework repository, use `harness self init --apply --with-opencode` instead. It generates self-only OpenCode commands and agents for working on `src/commands`, `src/core`, `templates`, and `skills` while preserving the boundary between framework maintenance rules and target-project templates.

Files intended to be committed for framework self OpenCode are:

- `opencode.jsonc`
- `.opencode/README.md`
- `.opencode/agents/harness-framework-*.md`
- `.opencode/commands/harness-self-*.md`

Generated mirror files that should not be treated as source of truth are:

- `.opencode/agents/harness-builder.md`
- `.opencode/agents/harness-coder.md`
- `.opencode/agents/harness-indexer.md`
- `.opencode/agents/harness-planner.md`
- `.opencode/agents/harness-reviewer.md`
- `.opencode/agents/harness-validator.md`
- `.opencode/agents/validators/**`
- `.opencode/commands/harness-bugfix.md`
- `.opencode/commands/harness-context.md`
- `.opencode/commands/harness-incident.md`
- `.opencode/commands/harness-continue.md`
- `.opencode/commands/harness-docs.md`
- `.opencode/commands/harness-feature.md`
- `.opencode/commands/harness-refactor.md`
- `.opencode/commands/harness-status.md`

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

## Framework Self Profile

This repository is the framework source, not a normal target project. Use `harness self init`, `harness self doctor`, and `harness self test` for self-dogfooding.

- `.harness/self/` is the versioned self profile.
- `.harness-self/` is disposable local runtime state and sandbox output.
- `fixtures/` contains versioned sandbox inputs.
- `templates/` and `skills/` remain publishable source assets and must not receive self-only rules.

## Validation

Run:

```powershell
npm run smoke
npm run self:smoke
```
