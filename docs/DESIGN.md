# Universal AI Harness Framework Design

[中文版](./DESIGN.zh-CN.md)

## 1. Positioning

Universal AI Harness Framework is a file-based collaboration framework for software repositories.

It is designed for teams that want AI assistance to be:

- inspectable in normal repository files
- reusable across agent products
- safe to upgrade over time
- controlled by explicit workflow gates

It is not a business-project template, not an IDE replacement, and not a plugin for one specific agent runtime.

## 2. Design Thesis

The framework is built on four ideas.

### 2.1 Files Are The Collaboration Contract

The main failure mode in AI-assisted work is not raw code generation. It is lost constraints, context drift, and silent scope expansion.

The harness makes important collaboration state durable in repository files:

- `AGENTS.md` defines repository entry behavior and workflow priority
- `.aiassistant/rules/*.md` defines enforceable constraints
- `docs/**/*.md` explains design knowledge and boundary context
- `.task/` holds requirement, plan, and coding context artifacts
- `.task/active.json` and task-local `state.json` hold the current workflow state
- `.harness/manifest.json` records framework-managed ownership

Because these artifacts are plain files, they can be reviewed, versioned, synced, and read by different agents.

### 2.2 Skills Are Lightweight Workflow Orchestration

The harness does not depend on a central orchestration server.

Instead, workflow is composed from small reusable skills with clear responsibilities:

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

This keeps the framework portable. A team can run the same method with plain prompting, with OpenCode, or with another agent environment that can read Markdown context.

### 2.3 Gates Matter More Than Automation

The framework intentionally upgrades methodology from “agent keeps going until done” to “agent advances only through explicit state transitions.”

The core gates are:

- analysis -> coding
- current approved slice or approved parallel group -> next slice or group

Within one approved slice, coding may continue directly into review. Outside that boundary, the agent must stop.

This gate model keeps human approval focused on the moments where scope and risk change.

### 2.4 OpenCode Is Optional Scaffolding

The harness core must work without OpenCode.

Optional OpenCode assets exist to improve ergonomics through slash commands, local agent roles, and validator scaffolding. They are recommended, but they are not the source of truth for the framework.

The source of truth remains the repository files and the harness method itself.

## 3. Design Goals

### 3.1 Project Neutrality

Core templates, skills, and CLI defaults must remain project-neutral.

The framework must not assume:

- one business domain
- one technology stack
- one repository layout
- one build tool
- one validation command
- one agent runtime

Project-specific knowledge belongs in target-project config, docs, rules, local `AGENTS.md` content, and local skills.

### 3.2 Safe Evolution

The framework must evolve without silently overwriting project-local work.

That is why the CLI uses a manifest-aware model:

- `harness init` installs managed assets and writes `.harness/manifest.json`
- `harness diff` computes the write plan without changing files
- `harness sync` updates only safe managed content by default
- `AGENTS.md` is synced by managed block, preserving the local block
- `--force` applies only to framework-managed assets
- `harness doctor` validates the installed file contract without modifying the project

### 3.3 Minimal Durable Process

The framework should capture just enough process to control risk, without turning every task into ceremony.

That is why it uses three task tiers:

- Tier S: trivial low-risk work
- Tier M: standard scoped work needing analysis and context pack
- Tier L: complex or boundary-sensitive work needing slicing and explicit gates

The methodology is strict about transitions, but flexible about how much analysis is needed.

## 4. Asset Model

### 4.1 Framework-Managed Assets

Framework-managed assets are installed from this repository and tracked in `.harness/manifest.json`.

They include:

- `templates/AGENTS.md`
- `templates/harness.config.yaml`
- `templates/docs/project/*`
- `templates/rules/*`
- `skills/*/SKILL.md`
- optional `.opencode/*` assets when requested

### 4.2 Project-Local Assets

Project-local assets belong to the target repository team.

They include:

- project-specific docs
- project-specific rules
- project-specific skills
- `.task/` work artifacts
- the local section of `AGENTS.md`
- local `.opencode/` customization not standardized by the framework
- any file not tracked in the manifest

The default rule is preserve local work unless safety is explicit.

### 4.3 `AGENTS.md` As A Split-Ownership File

`AGENTS.md` contains both framework-managed and project-local sections:

```html
<!-- harness-kit:start -->
...
<!-- harness-kit:end -->

<!-- project-local:start -->
...
<!-- project-local:end -->
```

This split allows the framework to evolve repository-wide workflow guidance while leaving team-local behavior editable.

## 5. Workflow Model

### 5.1 Analysis Before Coding

Non-trivial tasks do not start from coding.

They start from classification, boundary reading, and artifact creation.

Depending on the task, analysis may produce:

- `.task/active.json`
- `.task/<yyyy-MM-dd>/<task-slug>/requirement.md`
- `.task/<yyyy-MM-dd>/<task-slug>/implementation-plan.md`
- `.task/<yyyy-MM-dd>/<task-slug>/context-pack.md`
- `.task/<yyyy-MM-dd>/<task-slug>/state.json`

These files convert conversational intent into executable repository state.

Legacy `.task/context-pack.md` can be read as a migration fallback, but new work should use the active task directory.

### 5.2 Slice-Based Execution

For complex work, implementation is sliced so the unit of approval, coding, validation, and review stays small.

Each slice should define:

- goal
- allowed scope
- forbidden scope
- validation
- done criteria

This keeps the framework aligned with reviewable increments instead of broad agent autonomy.

### 5.3 Immediate Same-Slice Review

Review is not a separate future phase. It is part of the same execution unit.

The harness expects:

1. implement the approved slice
2. validate the approved slice
3. review the approved slice
4. stop at the slice gate

If review returns `BLOCKED`, the agent may attempt the smallest slice-local repair and retry, up to three total review attempts.

### 5.4 Parallel Work Is Optional, Not Foundational

The methodology allows `parallel-capable` slices or groups for complex work, but parallelism is optional and capability-dependent.

The fallback model is always sequential execution in dependency order.

This avoids making advanced runtime features a prerequisite for the framework itself.

## 6. Knowledge Model

Harness docs are design knowledge, not source indexes.

Docs should capture:

- design intent
- architecture direction
- workflows and state transitions
- domain concepts
- extension points
- boundaries and risk areas
- compatibility and migration meaning

Docs should not capture:

- file trees
- class or function inventories
- call-site indexes
- mechanical implementation lists

Rules exist to enforce behavior. Docs exist to explain meaning. The framework keeps both, but separates them.

## 7. CLI Model

The current CLI is a text-asset installer and synchronizer.

Its job is to:

- render framework templates into target projects
- detect safe vs unsafe updates
- preserve project-local content by default
- install optional OpenCode scaffolding when requested

It is intentionally narrow in scope. It does not manage business knowledge, binary assets, or automatic conflict resolution.

## 8. Optional OpenCode Integration

OpenCode support is intentionally secondary.

When a team enables `--with-opencode`, the framework installs project-local scaffolding such as:

- starter slash commands
- local agent role definitions, each with independent model assignment
- validator guidance
- `opencode.jsonc` with project-level scheduler enablement

The `harness-builder` remains the primary orchestrator. Its core responsibility is state reading, gate decisions, subagent routing, result aggregation, and user confirmation at gates. Deep analysis, implementation, review, and validation should be delegated to bounded roles.

Model selection is profile-driven. `harness.config.yaml` defines stable profiles named `think`, `build`, `review`, and `run`; optional OpenCode agent files render concrete model values from those profiles.

The primary design value of multi-agent roles is not parallelism. It is model tiering: letting the team assign the strongest model to analysis and planning, a cost-efficient model to coding and review, and the cheapest reliable model to indexer and validator utility tasks.

OpenCode improves day-to-day ergonomics, especially for repeated harness flows. But the framework must remain understandable and usable without it.

## 9. Non-Goals

The framework does not aim to:

- replace IDE navigation
- generate exhaustive code indexes
- prescribe one engineering stack
- own project-private business knowledge
- delete project-local files by default
- auto-resolve manifest conflicts
- bind the method to one agent vendor

Those non-goals keep the framework portable and safer to maintain.
