# OpenCode With The Harness

[中文版](./OPENCODE.zh-CN.md)

This guide explains the optional OpenCode scaffolding installed by `harness init --with-opencode`.

OpenCode is recommended, but it is not the harness core.

The harness core remains:

- repository files as the collaboration contract
- skills as the workflow model
- gates as the control mechanism

OpenCode adds a more ergonomic local execution layer on top of that model.

## 1. When To Use OpenCode

Use OpenCode when your team wants faster repeated execution of the harness flow through:

- slash commands for common task entrypoints
- local agent role definitions
- reusable validator scaffolding
- project-level scheduler-aware setup through `opencode-tasks`

Do not treat OpenCode as the source of truth.

If `.opencode/` is removed, the repository should still be understandable and usable through `AGENTS.md`, rules, docs, `.task/`, and the installed skills.

## 2. Install Or Backfill

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

## 3. What Gets Installed

Typical files:

- `opencode.jsonc`
- `.opencode/commands/harness-feature.md`
- `.opencode/commands/harness-bugfix.md`
- `.opencode/commands/harness-refactor.md`
- `.opencode/commands/harness-docs.md`
- `.opencode/commands/harness-context.md`
- `.opencode/agents/harness-builder.md`
- `.opencode/agents/harness-coder.md`
- `.opencode/agents/harness-indexer.md`
- `.opencode/agents/harness-planner.md`
- `.opencode/agents/harness-reviewer.md`
- `.opencode/agents/harness-validator.md`
- `.opencode/README.md`

These are editable local defaults, not locked product behavior.

The framework also installs a project-local `opencode.jsonc` that enables `opencode-tasks`.

## 4. How OpenCode Fits The Harness

OpenCode should follow the same harness method already defined by repository files.

The expected mapping is:

1. slash command or direct prompt starts the correct flow
2. builder runs analysis
3. builder stops at the analysis gate for non-trivial work
4. builder selects the current approved slice or group
5. coder implements that approved work only
6. reviewer checks that same approved work immediately after coding
7. builder stops at the next slice gate

OpenCode should make this flow easier to execute. It should not weaken the gate model.

## 5. Slash Commands

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

Use to rebuild or refresh `.task/context-pack.md`.

Expected behavior:

- compress the current approved slice or group into minimal coding context
- update context only
- not authorize coding by itself

## 6. Agent Roles

| Agent | Role |
| --- | --- |
| `harness-builder` | Primary orchestrator. Runs analysis, enforces gates, selects the approved slice, calls coder, reviewer, and validator, and stops for confirmation. |
| `harness-indexer` | Read-only repository explorer for docs, rules, boundaries, and workflow entrypoints. |
| `harness-planner` | Creates requirements, implementation slices, validation strategy, and context-pack planning. |
| `harness-coder` | Implements only the current approved slice or approved group. |
| `harness-reviewer` | Reviews boundary safety, actual scope, validation coverage, and docs or rules sync needs. |
| `harness-validator` | Runs build, compile, test, lint, or other validation commands and returns concise diagnostics. |

## 7. Gate Behavior

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

## 8. Model And Permission Customization

The installed `.opencode/agents/*.md` files contain example values only.

Recommended adjustments:

- use your strongest model for `harness-builder` and `harness-reviewer`
- use cheaper or smaller models for `harness-indexer` and `harness-validator` when appropriate
- keep validator and reviewer `temperature` low
- inspect `permission` blocks before enabling shell, edit, or task delegation

Treat these files as team-local scaffolding unless your team intentionally wants shared defaults.

## 9. Validator Behavior

The validator template is project-type-aware:

- generic fallback guidance is always included
- Gradle/Kotlin, Maven, Node.js, and Python projects also receive stack-specific guidance when detected
- other stacks can keep the generic fallback or replace it with repository-specific guidance

Expected runtime behavior:

- prefer validation commands defined in `.task/context-pack.md` when available
- otherwise choose the smallest relevant command for the current approved slice or group
- when `opencode-tasks` is enabled and the user asks for recurring validation, prefer proposing a scheduler-backed task instead of an ad hoc loop
- keep long-running validation artifacts under `.harness/tmp/harness-validator/<run-id>/`

Useful artifacts include:

- `command.txt`
- `status.txt`
- `stdout.log`
- `stderr.log`
- process id file when available

## 10. Privacy And Versioning

Recommended defaults:

- treat `.opencode/` as local/private until your team decides what to standardize
- add it to `.gitignore` if you want fully local customization
- version only the files your team wants to share
- scrub usernames, absolute paths, secrets, and internal URLs before sharing agent files

Keep reusable examples generic, for example:

- `/path/to/universal-ai-harness-framework`
- `C:\path\to\universal-ai-harness-framework`

Do not publish machine-specific paths or business-project identifiers in reusable defaults.
