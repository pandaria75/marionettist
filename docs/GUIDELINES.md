# Universal AI Harness Framework Usage Guide

[中文版](./GUIDELINES.zh-CN.md)

This guide explains how to use the harness in a target project after installation.

It focuses on practical day-to-day collaboration with agents rather than framework internals.

## 1. Who Should Read This

- Teams onboarding a repository with `harness init`
- Developers using agents for feature work, bugfixes, refactors, and docs work

If you maintain the framework itself, also read [DESIGN.md](./DESIGN.md).

## 2. Quick Start

Initialize the target project:

```powershell
harness init --dry-run
harness init
```

Recommended setup with OpenCode scaffolding:

```powershell
harness init --dry-run --with-opencode
harness init --with-opencode
```

After initialization, do these three things:

1. Run `workspace-knowledge-manager init` to create the first project knowledge.
2. Fill the `project-local` block in `AGENTS.md` with team-specific rules and defaults.
3. Adjust `harness.config.yaml`, rules, and `docs/project/knowledge-map.md` for the real project.

## 3. What To Expect After Init

Core files:

- `AGENTS.md`
- `harness.config.yaml`
- `docs/project/harness-workflow.md`
- `docs/project/knowledge-map.md`
- `.aiassistant/rules/*.md`
- `.agents/skills/*/SKILL.md`
- `.task/`
- `.harness/manifest.json`

Default behavior:

- existing project-local files are preserved
- `AGENTS.md` updates only the managed block
- `.task/` is local task state, not a managed file
- future framework upgrades use the manifest to decide what is safe

## 4. The Working Model

Use the harness as a controlled sequence, not as free-form continuous coding.

The default flow is:

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

Not every task needs every step. The harness trims the process by task tier.

## 5. Task Tiers

### 5.1 Tier S

Use Tier S for one small low-risk change with clear scope.

Examples:

- typo fix
- comment or copy update
- one-file config tweak
- obvious low-risk local fix

Flow:

```text
coding -> boundary-reviewer
```

Example prompt:

```text
This is a Tier S change.

Task:
<description>

Requirements:
- Modify only relevant files.
- Do not expand scope.
- Preserve existing style.
- Summarize validation when done.
```

### 5.2 Tier M

Use Tier M for standard scoped work that needs analysis before safe coding.

Examples:

- feature touching a few files
- bugfix needing code-path inspection
- refactor with clear boundaries
- docs update tied to behavior change

Flow:

```text
task-intake
  -> module-inspector / workflow-inspector when needed
  -> context-pack-builder
  -> coding
  -> boundary-reviewer
```

Minimum rule: create `.task/context-pack.md` before coding.

Example prompt:

```text
I need to handle a standard task:

<task description>

Follow the current repository harness workflow.
Start with task-intake.
Create .task/context-pack.md before coding.
Do not start coding yet.
```

### 5.3 Tier L

Use Tier L for complex or boundary-sensitive work.

Examples:

- unclear requirements or compatibility constraints
- cross-module changes
- public behavior or contract changes
- high-risk refactor
- staged delivery work

Flow:

```text
task-intake
  -> requirement-freezer when needed
  -> module-inspector / workflow-inspector
  -> implementation-slicer
  -> context-pack-builder
  -> coding by slice
  -> boundary-reviewer
  -> workspace-knowledge-manager review
```

Minimum rule: code only from an approved slice.

Example prompt:

```text
I need to handle a complex task:

<task description>

Follow the current repository harness workflow.
Start with task-intake.
If requirements or boundaries are unclear, use requirement-freezer.
Create an implementation plan and .task/context-pack.md before coding.
Do not start coding yet.
```

## 6. Gates

For non-trivial work, gates are mandatory.

The agent must stop at:

- the end of analysis, before coding
- the end of each approved slice or approved parallel group

The agent may move directly from coding into review only for the same approved slice or group.

It must not continue into the next slice automatically.

Recommended gate report:

```text
Phase:
Completed Work:
Files Created or Changed:
Validation Status:
Recommended Next Step:
User confirmation required to continue.
```

## 7. The Main Skills

### 7.1 `task-intake`

Use for the default entry into non-trivial work.

It should:

- classify task type
- classify task tier
- ask only blocking questions
- choose the next harness step

### 7.2 `requirement-freezer`

Use when expected behavior, business rules, compatibility, or boundaries are unclear.

Output:

```text
.task/<yyyy-MM-dd>/<task-slug>/requirement.md
```

### 7.3 `module-inspector`

Use when you need to understand a module, package, feature area, or dependency boundary.

### 7.4 `workflow-inspector`

Use when you need to understand execution flow, async behavior, orchestration, or integration flow.

### 7.5 `implementation-slicer`

Use to split complex approved work into small executable slices.

Output:

```text
.task/<yyyy-MM-dd>/<task-slug>/implementation-plan.md
```

### 7.6 `context-pack-builder`

Use before coding to build the minimum working context.

Output:

```text
.task/context-pack.md
```

It should capture only the current slice or approved group context, not whole docs or source files.

### 7.7 `boundary-reviewer`

Use immediately after implementation of the same approved slice.

Final recommendation must be one of:

- `PASS`
- `PASS_WITH_WARNINGS`
- `BLOCKED`

### 7.8 `workspace-knowledge-manager`

Use to create or maintain design docs, rules routing, and knowledge updates.

Common modes:

- `init`
- `refresh`
- `review`
- `topic`

## 8. The Core Task Artifacts

### 8.1 Requirement Document

Used when the task needs frozen requirements.

Path:

```text
.task/<yyyy-MM-dd>/<task-slug>/requirement.md
```

### 8.2 Implementation Plan

Used when the task needs explicit slices.

Path:

```text
.task/<yyyy-MM-dd>/<task-slug>/implementation-plan.md
```

Each slice should define:

- goal
- allowed scope
- forbidden scope
- validation
- done criteria

### 8.3 Context Pack

Used before coding for non-trivial implementation work.

Path:

```text
.task/context-pack.md
```

It should include:

- task goal
- requirement and plan source
- loaded docs and rules
- allowed and forbidden scope
- current approved slice or group
- validation commands
- assumptions
- stop conditions

## 9. Practical Examples

### 9.1 New Feature

```text
I want to build a new feature:

<requirement description>

Follow the current repository harness workflow.
Start with task-intake.
Do not start coding yet.
```

### 9.2 Bugfix

```text
I need to fix a bug:

Observed:
<actual behavior>

Expected:
<expected behavior>

Reproduction:
<steps>

Evidence:
<logs, failing test, screenshot, or other evidence>

Follow the current repository harness workflow.
Start with task-intake.
Prioritize confirming the reproduction path or failing test.
Create .task/context-pack.md before coding.
Do not start coding yet.
```

### 9.3 Refactor

```text
I need to perform a refactor:

Goal:
<refactor goal>

Behavior that must stay unchanged:
<constraints>

Allowed modification scope:
<scope>

Forbidden modification scope:
<scope>

Follow the current repository harness workflow.
Analyze boundary and workflow impact first.
Do not start coding yet.
```

## 10. Documentation And Rules

Keep the separation clear:

- docs explain design meaning
- rules enforce behavior

Docs should capture:

- responsibilities
- workflows
- domain concepts
- boundaries
- risk areas

Docs should not become code indexes.

When docs or rules are added, moved, renamed, or deleted, update `docs/project/knowledge-map.md`.

## 11. Optional OpenCode

OpenCode is optional, but recommended when your team wants faster repeated execution of the harness flow.

Typical benefits:

- reusable slash commands such as `/harness-feature` and `/harness-bugfix`
- local builder, coder, reviewer, and validator agent roles
- project-level validator guidance and scheduler-aware scaffolding

Treat `.opencode/` as editable local scaffolding, not as a locked system.

For details, see [OPENCODE.md](./OPENCODE.md).

## 12. Upgrade And Sync

Preview framework-managed changes:

```powershell
harness diff
```

Apply safe updates:

```powershell
harness sync
harness sync --dry-run
```

Notes:

- local task artifacts stay local
- local docs, rules, and skills are preserved by default
- `AGENTS.md` updates only the managed block
- local modifications and conflicts are reported instead of silently overwritten

## 13. Validation

When maintaining this framework, run:

```powershell
npm run smoke
```
