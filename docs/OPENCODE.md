# OpenCode With The Harness

[中文版](./OPENCODE.zh-CN.md)

This guide explains the optional OpenCode scaffolding installed by `harness init --with-opencode`.

OpenCode is recommended, but it is not the harness core.

The harness core remains:

- repository files as the collaboration contract
- skills as the workflow model
- gates as the control mechanism

OpenCode adds a more ergonomic local execution layer on top of that model. Its real advantage over plain prompting lies in multi-agent roles with independent model assignments, giving every type of work a model that fits its capability demand and cost profile.

## 1. The Model-Tiering Strategy

Not every step in the harness flow needs the smartest model. The harness workflow naturally splits work across three capability tiers.

Assign models the same way you would assign people: put your strongest reasoning where scope, risk, and design clarity matter most, and let cheaper fast models handle focused execution.

**Tier 1 — Think**

Jobs that need deep reasoning, ambiguity resolution, and scope decisions:

| Agent | Why |
| --- | --- |
| `harness-builder` | Orchestrates the full flow, reads active task state, interprets gate reports, routes subagents, and keeps the task from drifting |
| `harness-planner` | Freezes requirements, slices work, and designs the validation strategy |

Assign your strongest, most capable model here. This work determines whether the rest of the flow succeeds.

**Tier 2 — Build**

Jobs that need consistent execution but not deep original reasoning:

| Agent | Why |
| --- | --- |
| `harness-coder` | Implements the approved slice or group within allowed scope |
| `harness-reviewer` | Checks scope, boundaries, validation, and docs sync against an approved plan |

Use a capable but cost-efficient model here. These agents work from explicit constraints already captured in `.task/<task-id>/context-pack.md` and the implementation plan.

**Tier 3 — Run**

Jobs that need fast, reliable tool execution with minimal reasoning:

| Agent | Why |
| --- | --- |
| `harness-indexer` | Explores the repository read-only for docs, rules, and entrypoints |
| `harness-validator` | Runs build, compile, test, lint, and returns concise diagnostics |

Use the cheapest model that reliably follows a defined instruction set. Speed and low cost matter more than reasoning depth.

This three-tier split is the primary reason multi-agent OpenCode scaffolding exists. It is not about distributing work across agents for parallelism. It is about matching model capability and cost to the actual demand of each job.

## 2. When To Use OpenCode

Use OpenCode when your team wants:

- model-tiering that matches the right model to each harness step
- slash commands for common task entrypoints
- local agent role definitions with per-role model assignment
- reusable validator scaffolding
- project-level scheduler-aware setup through `opencode-tasks`

Do not treat OpenCode as the source of truth.

If `.opencode/` is removed, the repository should still be understandable and usable through `AGENTS.md`, rules, docs, `.task/`, and the installed skills.

## 3. Install Or Backfill

Install OpenCode scaffolding during project setup:

```powershell
harness init --with-opencode
```

Preview before writing:

```powershell
harness init --dry-run --with-opencode
```

Backfill it into an already initialized project:

```powershell
harness init --with-opencode
```

When these assets are installed, later `harness diff` and `harness sync` runs treat them as framework-managed files through the manifest.

## 4. What Gets Installed

Typical files:

- `opencode.jsonc` (project root)
- `.opencode/commands/harness-feature.md`
- `.opencode/commands/harness-bugfix.md`
- `.opencode/commands/harness-refactor.md`
- `.opencode/commands/harness-docs.md`
- `.opencode/commands/harness-context.md`
- `.opencode/commands/harness-status.md`
- `.opencode/commands/harness-continue.md`
- `.opencode/agents/harness-builder.md`
- `.opencode/agents/harness-coder.md`
- `.opencode/agents/harness-indexer.md`
- `.opencode/agents/harness-planner.md`
- `.opencode/agents/harness-reviewer.md`
- `.opencode/agents/harness-validator.md`
- `.opencode/README.md`

These are editable local defaults, not locked product behavior.

The framework also installs `opencode.jsonc` at the project root (not under `.opencode/`) that enables `opencode-tasks`.

## 5. How OpenCode Fits The Harness

OpenCode should follow the same harness method already defined by repository files.

The expected mapping is:

1. slash command or direct prompt starts the correct flow
2. builder runs analysis (Tier 1 model)
3. builder stops at the analysis gate for non-trivial work
4. builder selects the current approved slice or group
5. coder implements that approved work only (Tier 2 model)
6. reviewer checks that same approved work immediately after coding (Tier 2 model)
7. builder stops at the next slice gate

OpenCode should make this flow easier to execute. It should not weaken the gate model.

## 6. Slash Commands

### `/harness-feature`

Use for a new feature or requirement.

Expected behavior:

- route to `harness-builder`
- start from `task-intake`
- stay in analysis until the analysis gate is approved

### `/harness-bugfix`

Use for a bugfix when you have observed behavior, expected behavior, reproduction, or evidence.

Expected behavior:

- route to `harness-builder`
- prioritize confirming reproduction or a failing test
- use `requirement-freezer` only when expected behavior remains unclear

### `/harness-refactor`

Use for behavior-preserving structural change.

Expected behavior:

- make allowed and forbidden scope explicit
- analyze boundary and workflow impact before coding

### `/harness-docs`

Use for docs or rules work.

Expected behavior:

- route documentation work without pretending it is a production-code slice
- keep the update scoped to the requested design, module, or workflow concern

### `/harness-context`

Use to rebuild or refresh `.task/<task-id>/context-pack.md`.

Expected behavior:

- compress the current approved slice or group into minimal coding context
- update context only
- not authorize coding by itself

### `/harness-status`

Use to show the current task state without modifying files.

Expected behavior:

- read `.task/active.json` and `.task/<task-id>/state.json`
- show phase, gates, current slice, next command, required files, and warnings
- do not guess missing state

### `/harness-continue`

Use to continue the active task according to task state.

Expected behavior:

- read state before acting
- respect gates and `allowedToCode`
- route to the next skill or subagent
- request confirmation before important phase transitions

## 7. Agent Roles

| Agent | Role | Model Tier |
| --- | --- | --- |
| `harness-builder` | Primary orchestrator. Reads active task state, enforces gates, selects the approved slice, calls other agents, aggregates outputs, and stops for confirmation. | Tier 1 |
| `harness-planner` | Creates requirements, implementation slices, validation strategy, and context-pack planning. | Tier 1 |
| `harness-coder` | Implements only the current approved slice or approved group. | Tier 2 |
| `harness-reviewer` | Reviews boundary safety, actual scope, validation coverage, and docs or rules sync needs. | Tier 2 |
| `harness-indexer` | Read-only repository explorer for docs, rules, boundaries, and workflow entrypoints. | Tier 3 |
| `harness-validator` | Runs build, compile, test, lint, or other validation commands and returns concise diagnostics. | Tier 3 |

## 8. Gate Behavior

OpenCode flows must obey the same non-trivial task gates as the harness itself.

Required gates:

- analysis complete -> before coding starts
- current approved slice or approved group complete -> before the next slice or group starts

Important details:

- coding and review for the same approved slice belong to the same execution stage
- the user does not need to confirm between coder and reviewer for that same approved slice
- the user does need to confirm before the next slice or group starts

Common continuation prompts:

```text
continue
proceed
start current slice
accept this slice and continue
start the next approved slice
```

If the same slice remains `BLOCKED` after three total review attempts, stop and ask the user to decide the next step.

## 9. Model Profiles And Permission Customization

The installed `.opencode/agents/*.md` files contain concrete model fields for OpenCode compatibility, but those values are rendered from `harness.config.yaml` model profiles.

Stable profiles:

- `think`: builder and planner
- `build`: coder
- `review`: reviewer
- `run`: indexer and validator

Skill model requirements map to profiles as follows:

- `reasoning` -> `think`
- `coding` -> `build`
- `reflective` -> `review`
- `utility` -> `run`

Each agent role has its own file where you can adjust the concrete model after changing the corresponding profile.

Start from the three-tier strategy and tune it to your team's available models and budget:

- Tier 1 (builder, planner): strongest reasoning model available
- Tier 2 (coder, reviewer): capable model with good cost-performance ratio
- Tier 3 (indexer, validator): cheapest model that can reliably follow tool instructions

Additional settings:

- keep validator and reviewer `temperature` low for deterministic output
- inspect `permission` blocks before enabling shell, edit, or task delegation
- Tier 3 agents often need fewer permissions than Tier 1 agents

Treat these files as team-local scaffolding unless your team intentionally wants shared defaults.

## 10. Validator Behavior

The validator template is project-type-aware:

- generic fallback guidance is always included
- Gradle/Kotlin, Maven, Node.js, and Python projects also receive stack-specific guidance when detected
- other stacks can keep the generic fallback or replace it with repository-specific guidance

Expected runtime behavior:

- prefer validation commands defined in `.task/<task-id>/context-pack.md` when available
- otherwise choose the smallest relevant command for the current approved slice or group
- when `opencode-tasks` is enabled and the user asks for recurring validation, prefer proposing a scheduler-backed task instead of an ad hoc loop
- keep long-running validation artifacts under `.harness/tmp/harness-validator/<run-id>/`

Useful artifacts include:

- `command.txt`
- `status.txt`
- `stdout.log`
- `stderr.log`
- process id file when available

## 11. Privacy And Versioning

Recommended defaults:

- treat `.opencode/` as local/private until your team decides what to standardize
- add it to `.gitignore` if you want fully local customization
- version only the files your team wants to share
- scrub usernames, absolute paths, secrets, and internal URLs before sharing agent files

Keep reusable examples generic, for example:

- `/path/to/universal-ai-harness-framework`
- `C:\path\to\universal-ai-harness-framework`

Do not publish machine-specific paths or business-project identifiers in reusable defaults.
