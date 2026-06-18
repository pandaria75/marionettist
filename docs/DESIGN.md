# Universal AI Harness Framework Design

[中文版](./DESIGN.zh-CN.md)

This document is for people who want to understand why the harness exists and how its main ideas fit together. It avoids implementation details unless they explain a design choice.

Navigation note:

- start from [docs/README.md](./README.md) for the main documentation map
- use [docs/reference/README.md](./reference/README.md) for stable concept and maintainer references
- use [docs/advanced/README.md](./advanced/README.md) for workflow-depth topics such as gates, tiers, and slicing

## 1. Positioning

The harness is a file-based collaboration framework for repositories that use AI agents.

It is for teams that want AI work to be:

- inspectable
- repeatable
- safe to pause and review
- independent of a single agent product
- safe to upgrade over time

It is not a business-project template, an IDE replacement, or a vendor-specific agent runtime.

## 2. Core Idea

The main risk in AI-assisted development is usually not a single bad code suggestion. The larger risk is that context disappears, constraints drift, and the agent continues past the point where a human should decide.

The harness answers that by putting the collaboration contract into repository files.

Important facts are not trapped in chat. They live in files that humans and agents can both inspect.

## 3. Design Principles

### 3.1 Files Are The Contract

The harness uses normal files for durable state:

- `AGENTS.md` defines repository-level agent behavior.
- `.aiassistant/rules/*.md` stores enforceable constraints.
- `docs/**/*.md` explains design, workflow, ownership, and risk.
- `.task/` stores task-local requirements, plans, context, and state.
- `.harness/manifest.json` tracks framework-managed assets.

Plain files are easy to review, version, diff, and sync. They also keep the method portable across agents.

### 3.2 Gates Matter More Than Autonomy

The harness is intentionally not an “agent keeps going until done” system.

For non-trivial work, the workflow stops at key points:

1. after analysis, before coding
2. after each approved implementation slice or approved group

Within one approved slice, coding can flow into review. Moving beyond that slice requires the workflow to respect the selected gate policy and any explicit stop conditions.

Gate policy controls pause behavior. It does not relax safety rules, dangerous-command handling, or scope boundaries.

### 3.3 Work Is Sliced

Large tasks are safer when split into small, reviewable units.

Each slice should define:

- goal
- allowed scope
- forbidden scope
- validation expectation
- done criteria

This keeps approval, implementation, review, and validation focused on the same unit of work.

### 3.4 Knowledge Is Routed, Not Loaded All At Once

Docs should help agents understand the relevant area. They should not become source-code indexes.

The harness separates:

- **docs**: explain design meaning, workflows, boundaries, risks, and decisions
- **rules**: define behavioral constraints
- **local search / IDE tools**: find files, symbols, call sites, and implementation details

This keeps documentation useful and prevents it from becoming stale inventory.

### 3.5 The Core Must Stay Project-Neutral

Framework templates, skills, and CLI defaults must not assume a business domain, programming language, build tool, module name, or customer-specific rule.

Project-specific knowledge belongs in the target project’s own docs, rules, config, and task files.

## 4. Workflow Model

The harness scales process by task complexity.

- **Tier S**: trivial, low-risk work. Direct coding and review may be enough.
- **Tier M**: standard scoped work. Prepare task context before coding.
- **Tier L**: complex or boundary-sensitive work. Freeze requirements, slice the plan, build context, and use stronger gates.

The exact task-state contract is installed into target projects as `docs/project/harness-workflow.md`.

The design intent is simple: do enough analysis to make the next coding step safe, then stop at the right boundary.

## 5. Asset Ownership Model

The framework separates managed assets from project-local assets.

### Framework-managed assets

These are installed from this repository and tracked in `.harness/manifest.json`:

- core templates
- standard rules
- project workflow docs
- reusable skills
- optional OpenCode scaffolding

They can be previewed with `harness diff` and updated with `harness sync`.

### Project-local assets

These belong to the target team and must be preserved by default:

- local docs and rules
- task artifacts in `.task/`
- project-local sections of `AGENTS.md`
- local OpenCode customizations
- files not tracked by the manifest

### Split ownership in `AGENTS.md`

`AGENTS.md` uses managed and project-local blocks so the framework can update shared guidance without overwriting local team rules.

## 6. CLI Design

The CLI is a safe installer and synchronizer for text assets.

Its responsibilities are narrow:

- install a harness into a target project
- preview managed changes
- apply safe managed updates
- preserve local work by default
- diagnose ownership and drift

The CLI does not own business knowledge, does not resolve every conflict automatically, and does not delete local content by default.

## 7. OpenCode Integration

OpenCode is an optional execution layer.

It adds slash commands, role agents, validator guidance, and model-profile rendering. It does not change the core method: the repository files and harness gates remain the source of truth.

See [docs/OPENCODE.md](./OPENCODE.md) for practical OpenCode usage.

## 8. Safe Evolution

The harness must be upgradeable without taking over a project.

That is why the framework uses:

- manifest tracking
- dry-run previews
- managed blocks
- conservative sync behavior
- explicit force paths for unsafe replacement

Safe evolution matters more than convenience. A framework upgrade should not silently erase local team practice.

## 9. Non-Goals

The framework does not aim to:

- replace IDE navigation
- generate code indexes
- prescribe one engineering stack
- own project-private knowledge
- bind teams to one agent vendor
- bypass human approval for risky decisions
- overwrite project-local work by default

## 10. For Framework Maintainers

This repository is the framework source. Maintain it using the root `AGENTS.md` and the self-profile rules under `.harness/self/`.

Do not copy framework self-maintenance rules into target-project templates.
