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
| `harness-critic` | Audits requirement clarity, plan safety, context sufficiency, and validation gaps at critic gates |

Use a capable but cost-efficient model here. These agents work from explicit constraints already captured in `.task/<task-id>/context-pack.md` and the implementation plan. Here `<task-id>` is selected by `.task/active.json`.

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

Command-surface options:

```powershell
# Default for new installs
harness init --with-opencode --opencode-command-surface minimal

# Optional advanced surface
harness init --with-opencode --opencode-command-surface full
```

You can also set the installed command layer in project config:

```yaml
opencode:
  commandSurface: minimal # or full
```

When these assets are installed, later `harness diff` and `harness sync` runs treat them as framework-managed files through the manifest.

## 4. What Gets Installed

Typical files:

- `opencode.jsonc` (project root)
- `.opencode/commands/harness.md`
- `.opencode/commands/harness-dev.md`
- `.opencode/commands/harness-docs.md`
- `.opencode/commands/harness-config.md`
- `.opencode/commands/harness-incident.md`
- `.opencode/agents/harness-builder.md`
- `.opencode/agents/harness-coder.md`
- `.opencode/agents/harness-indexer.md`
- `.opencode/agents/harness-planner.md`
- `.opencode/agents/harness-reviewer.md`
- `.opencode/agents/harness-critic.md`
- `.opencode/agents/harness-validator.md`
- `.opencode/README.md`

These are editable local defaults, not locked product behavior.

The framework also installs `opencode.jsonc` at the project root (not under `.opencode/`) that enables `opencode-tasks`.

By default, new installs recommend a builder-first minimal surface centered on `/harness`. Full mode adds explicit advanced wrappers such as `/harness-feature`, `/harness-bugfix`, `/harness-refactor`, `/harness-context`, `/harness-status`, and `/harness-continue` for teams that want them visible.

## 5. How OpenCode Fits The Harness

OpenCode should follow the same harness method already defined by repository files.

The expected mapping is:

1. slash command or direct prompt starts the correct flow
2. builder runs analysis (Tier 1 model)
3. builder stops at the analysis gate for non-trivial work
4. builder selects the current approved slice or group
5. coder implements that approved work only (Tier 2 model)
6. reviewer checks that same approved work immediately after coding (Tier 2 model)
7. when critic-gated, critic checks the gate artifact before coding and again before done
8. builder stops at the next slice gate

OpenCode should make this flow easier to execute. It should not weaken the gate model.

## 6. Slash Commands

### Default builder-first entrypoint: `/harness`

Use for most requests, especially when the user starts from natural language instead of choosing a low-level workflow.

Expected behavior:

- route to `harness-builder`
- classify the request into the right harness workflow
- explain the selected workflow briefly before acting or delegating
- ask only minimal clarifying questions when blocking ambiguity remains

### Focused wrappers: `/harness-dev`, `/harness-incident`, `/harness-docs`, `/harness-config`

Use these when you want to hint at the likely workflow while still routing through `harness-builder`.

- `/harness-dev`: development, feature, implementation, or build-oriented work without forcing an advanced command choice
- `/harness-incident`: evidence-first incident or urgent-fix investigation
- `/harness-docs`: documentation or writing work
- `/harness-config`: harness or project workflow configuration work

### `/harness-docs`

Use for docs or rules work.

Expected behavior:

- route documentation work without pretending it is a production-code slice
- keep the update scoped to the requested design, module, or workflow concern

### `/harness-incident`

Use for an evidence-first incident or on-site investigation.

Expected behavior:

- route to `harness-builder`
- read `.task/active.json` first, then task state when present
- create or update `.task/<task-id>/incident.md` as an analysis artifact only
- organize user-provided symptoms, logs, screenshots, packets, config, environment details, reproduction notes, and unknowns
- avoid assuming local reproduction or site access
- avoid automatic terminal log capture
- stop before coding and keep the incident artifact ready for the next approved investigation or implementation step

### Advanced/full escape hatches

Full mode keeps explicit advanced wrappers available for teams that want them visible:

- `/harness-feature`
- `/harness-bugfix`
- `/harness-refactor`
- `/harness-context`
- `/harness-status`
- `/harness-continue`

These remain useful, but they are escape hatches rather than the normal-user default. Minimal installs omit the dedicated advanced wrappers while still letting `/harness` route those intents.

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
| `harness-critic` | Audits requirement, plan, context, scope, and validation risk before coding or before critic-gated work is declared done. | Tier 2 (`review` profile) |
| `harness-indexer` | Read-only repository explorer for docs, rules, boundaries, and workflow entrypoints. | Tier 3 |
| `harness-validator` | Runs build, compile, test, lint, or other validation commands and returns concise diagnostics. | Tier 3 |

## 8. Gate Behavior

OpenCode flows must obey the same non-trivial task gates as the harness itself.

Required gates:

- analysis complete -> before coding starts
- current approved slice or approved group complete -> before the next slice or group starts

Additional critic-gated behavior:

- when task state or workflow policy marks work as critic-gated, `harness-continue` should route to `harness-critic` before any coding handoff when `criticPassed` is false
- critic `PASS` does not bypass `allowedToCode`, current phase rules, or user confirmation
- when coding, review, and required validation are complete for critic-gated work, route back to `harness-critic` before declaring the approved work done

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

The installed `.opencode/agents/*.md` files contain concrete model fields for OpenCode compatibility, but those values are rendered from `.harness/model-profiles.yml` model profiles when present, with legacy fallback to `harness.config.yaml` `models.profiles.*` only where needed.

The harness keeps model and permission runtime fields in generated agent markdown for now. `opencode.jsonc` is not the canonical model or permission source for harness agents. If a project also defines agent model settings in `opencode.jsonc`, `harness doctor` should treat disagreements with `.harness/model-profiles.yml` as configuration conflict rather than choosing a winner silently.

Stable profiles:

- `think`: builder and planner
- `build`: coder
- `review`: reviewer and critic
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

Design guidance:

- update `.harness/model-profiles.yml` first when changing harness agent models
- let `harness diff` and `harness sync --with-opencode` render those model values into `.opencode/agents/*.md`
- edit agent markdown permissions only when the team intentionally wants a local permission policy
- avoid duplicating harness agent model or permission values in `opencode.jsonc` unless you also accept the extra drift/conflict surface
- do not rely on `opencode.jsonc` to override generated harness agent frontmatter as a hidden migration path

A future harness version may add an explicit OpenCode adapter mode that renders inline agent config into `opencode.jsonc`, but that would be a separate opt-in migration with preview and conflict handling.

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
