# Universal AI Harness Framework Usage Guide

[中文版](./GUIDELINES.zh-CN.md)

This guide explains how to install Universal AI Harness Framework into a target project and how to use the harness workflow for agent analysis, implementation, review, and knowledge maintenance.

## 1. Audience

This guide is for two groups:

- Framework maintainers who work on this repository's CLI, templates, and core skills.
- Target-project users who run `harness init`, `harness diff`, and `harness sync`, then collaborate with agents through the installed workflow.

If you only use the harness inside a target project, start from section 3.

## 2. Local Install

From this framework repository:

```powershell
npm link
```

Then from a target project:

```powershell
harness init
```

Without `npm link`, run the CLI directly:

```powershell
node E:\AI_WORK\universal-ai-harness-framework\bin\harness.js init --project .
```

## 3. Initialize A Target Project

Preview first:

```powershell
harness init --dry-run
```

Then write files:

```powershell
harness init
```

Initialization creates or updates:

- `AGENTS.md`
- `harness.config.yaml`
- `docs/project/harness-workflow.md`
- `docs/project/knowledge-map.md`
- `.aiassistant/rules/*.md`
- `.agents/skills/*/SKILL.md`
- `.task/`
- `.harness/manifest.json`

Defaults:

- Existing project-local files are not overwritten directly.
- `AGENTS.md` writes or updates only the harness managed block.
- `.task/` is a target-project task directory and is not listed as a managed file.
- `.harness/manifest.json` records framework-managed ownership and hashes.

## 4. After Initialization

### 4.1 Generate Project Knowledge

Ask the agent in the target project:

```text
Use workspace-knowledge-manager init.

Goals:
- Read the current project structure, configuration, existing docs, and key source evidence.
- Create or update docs/project/knowledge-map.md.
- Create only high-value design, architecture, behavior, and boundary-rule documents.
- Do not generate code indexes, file trees, class inventories, or function inventories.
```

### 4.2 Fill Project-local Rules

Edit the project-local section in the target project's `AGENTS.md`:

```html
<!-- project-local:start -->
...
<!-- project-local:end -->
```

Use this section for team preferences, project-specific workflow rules, default validation commands, and risk-area notes. Avoid editing the managed block unless you accept that future sync may overwrite those edits.

### 4.3 Tune Config And Rules

Update these files for the target project:

- `harness.config.yaml`
- `.aiassistant/rules/*.md`
- `docs/project/knowledge-map.md`

Rules constrain behavior. Docs explain design. Do not duplicate the same content in both places.

## 5. Daily Task Workflow

Full workflow:

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

Trim it by task complexity.

### 5.1 Tier S: Minor Change

Use for:

- single-file low-risk changes
- copy, comment, or small config edits
- clear formatting or typo fixes
- local changes with enough existing context

Prompt:

```text
This is a Tier S minor change.

Task:
<description>

Requirements:
- Modify only relevant files.
- Do not expand scope.
- Preserve existing style.
- When done, summarize the change and validation.
```

### 5.2 Tier M: Standard Task

Use for:

- clear bugfixes or features touching multiple files
- work that needs rules and design docs before safe modification
- tasks that need a compact context pack before coding

Recommended flow:

```text
task-intake
  -> module-inspector / workflow-inspector
  -> context-pack-builder
  -> coding
  -> boundary-reviewer
```

Prompt:

```text
I need to handle a standard task:

<task description>

Follow the current repository harness workflow.
Start with task-intake, and use module-inspector or workflow-inspector if needed.
Create .task/context-pack.md before coding.
Do not start coding yet.
```

### 5.3 Tier L: Complex Task

Use for:

- unclear requirements, compatibility, or boundaries
- cross-module or cross-subsystem changes
- high-risk refactors
- changes to public behavior, data models, external contracts, critical workflows, or permission boundaries
- work requiring review or staged delivery

Recommended flow:

```text
task-intake
  -> requirement-freezer
  -> module-inspector / workflow-inspector
  -> implementation-slicer
  -> context-pack-builder
  -> coding by slice
  -> boundary-reviewer
  -> workspace-knowledge-manager review
```

Prompt:

```text
I need to handle a complex task:

<task description>

Follow the current repository harness workflow.
Start with task-intake.
If requirements, compatibility, or boundaries are unclear, use requirement-freezer.
Before coding, create an implementation plan and .task/context-pack.md.
Do not start coding yet.
```

## 6. Core Skills

### 6.1 task-intake

Purpose: classify and route a new task.

Expected output:

- Task Type
- Tier
- Current Understanding
- Blocking Questions
- Assumptions
- Recommended Next Step
- Guardrails

### 6.2 requirement-freezer

Purpose: turn ambiguous requests into testable facts.

Output:

```text
.task/<yyyy-MM-dd>/<task-name>.requirement.md
```

Use it for complex features, disputed behavior, unclear compatibility, or public contract changes.

### 6.3 module-inspector

Purpose: inspect module, directory, feature-area, or ownership boundaries.

It should read `docs/project/knowledge-map.md`, then load only relevant docs, rules, and source evidence.

### 6.4 workflow-inspector

Purpose: analyze execution flows, state changes, async processing, frontend-backend interaction, external integrations, or task orchestration.

It analyzes impact and risk. It does not create the full implementation plan.

### 6.5 implementation-slicer

Purpose: split an approved requirement or analysis result into small implementation slices.

Output:

```text
.task/<yyyy-MM-dd>/<task-name>.implementation-plan.md
```

Each slice should define:

- Goal
- Allowed Modification Scope
- Forbidden Scope
- Steps
- Validation
- Done Criteria
- Rollback Notes

### 6.6 context-pack-builder

Purpose: create the minimum coding context before implementation.

Output:

```text
.task/context-pack.md
```

The context pack should include only what the current slice or approved group needs. It must not copy whole docs or source files.

### 6.7 boundary-reviewer

Purpose: check implemented changes against scope, rules, validation, and knowledge sync needs.

Final recommendation must be one of:

- `PASS`
- `PASS_WITH_WARNINGS`
- `BLOCKED`

### 6.8 workspace-knowledge-manager

Purpose: create and maintain design knowledge, architecture notes, boundary rules, and the knowledge map.

Modes:

- `init`: create the initial project knowledge structure.
- `refresh`: periodically refresh design docs and rules.
- `review`: decide whether implemented changes require docs or rules updates.
- `topic`: document one capability, workflow, subsystem, or architecture concern.

It must not output code index directories, file trees, class inventories, function inventories, or call-site indexes.

## 7. Coding Gates

Non-trivial tasks must stop at these gates:

- analysis to coding
- one slice or group to the next
- coding to review

Recommended gate report:

```text
Phase:
Completed Work:
Files Created or Changed:
Validation Status:
Recommended Next Step:
User confirmation required to continue.
```

If the agent crosses a gate and keeps coding, stop it and return to the current approved slice.

## 8. Feature Workflow Example

```text
I want to build a new feature:

<requirement description>

Follow the current repository harness workflow.
Start with task-intake.
Do not start coding yet.
```

After intent is clear:

```text
Use requirement-freezer.

Input:
<task-intake result>

Output:
.task/<yyyy-MM-dd>/<task-name>.requirement.md

Requirements:
- Keep only correctness or scope questions as Blocking Questions.
- Put other uncertainty under Assumptions or Deferred Questions.
- Do not write an implementation plan.
- Do not code.
```

Slice the work:

```text
Use implementation-slicer.

Input:
.task/<yyyy-MM-dd>/<task-name>.requirement.md
and the module-inspector / workflow-inspector results.

Output:
.task/<yyyy-MM-dd>/<task-name>.implementation-plan.md

Requirements:
- Split into small slices.
- For every slice, define allowed scope, forbidden scope, validation, and done criteria.
- Mark work as parallel-capable only when file ownership is independent and merge risk is explicit.
- Do not code.
```

Before coding:

```text
Use context-pack-builder.

Current slice:
Slice <N>: <name>

Output:
.task/context-pack.md

Requirements:
- Keep only the context needed for the current slice.
- Define allowed scope, forbidden scope, validation commands, and stop conditions.
- Do not code.
```

Coding:

```text
Read AGENTS.md and .task/context-pack.md.

Implement only the current approved slice.
Do not expand requirements.
Do not modify forbidden scope.
When done, run or explain validation commands.
After the current slice is complete, stop and wait for confirmation.
Do not automatically move to the next slice or review.
```

Review:

```text
Use boundary-reviewer.

Review the current diff against:
- AGENTS.md
- .task/context-pack.md
- docs/project/knowledge-map.md
- relevant rules/docs

Output PASS / PASS_WITH_WARNINGS / BLOCKED.
Do not modify code.
```

## 9. Bugfix Workflow Example

```text
I need to fix a bug:

Observed:
<actual behavior>

Expected:
<expected behavior>

Reproduction:
<steps>

Evidence:
<logs, screenshots, failing test, or other evidence>

Follow the current repository bugfix harness workflow.
Start with task-intake.
Prioritize confirming the reproduction path or failing test.
Create .task/context-pack.md before coding.
Do not start coding yet.
```

Bugfixes usually do not need a full requirement-freezer step, but use it when:

- expected behavior is unclear
- correct behavior is disputed
- compatibility is involved
- external contracts, data contracts, or public behavior change
- the fix changes design rules

## 10. Refactor Workflow Example

```text
I need to perform a refactor:

Goal:
<refactor goal>

Behavior that must stay unchanged:
<behavior constraints>

Allowed modification scope:
<scope>

Forbidden modification scope:
<scope>

Follow the current repository harness workflow.
Analyze boundary and workflow impact first.
Do not start coding yet.
```

Refactors must make these explicit:

- behavior remains unchanged
- modification scope is clear
- validation is defined before coding
- refactor and feature work are not mixed

## 11. Documentation And Knowledge Sync

After implementation, ask:

```text
Use workspace-knowledge-manager review.

Check whether the current diff affects:
- architecture
- public behavior
- feature design
- workflow
- domain concepts
- module or directory boundaries
- extension points
- operational or compatibility constraints

Only report whether docs/rules updates are needed.
Do not modify docs unless I explicitly ask.
```

Update docs only when design meaning changes. Do not create file lists or indexes just because source files were added, renamed, or moved.

## 12. Upgrade And Sync

Preview framework-managed changes:

```powershell
harness diff
```

Sync safe changes:

```powershell
harness sync
```

Dry run:

```powershell
harness sync --dry-run
```

Force managed-file overwrite:

```powershell
harness sync --force
```

Notes:

- `--force` applies only to manifest-managed files.
- `--force` does not delete project-local files.
- `orphan-managed` is reported and not deleted.
- `modified-local` and `conflict` are not overwritten by default.
- `AGENTS.md` sync updates only the managed block.

## 13. Managed Statuses

`harness diff` and `harness sync --dry-run` print a plan:

- `unchanged`: local managed content did not change.
- `new-managed`: framework added a managed file and the target project can create it.
- `missing`: a previously installed managed file is missing and can be recreated.
- `update`: local content is unchanged and framework content can safely update it.
- `modified-local`: local content changed; do not overwrite by default.
- `conflict`: local and framework content both changed; requires human judgment.
- `orphan-managed`: manifest still tracks a file no longer shipped by the framework; report and do not delete.
- `skip-project-local`: target path already contains a local file; preserve it.
- `manifest-preview`: dry-run preview of the manifest write.

## 14. Framework Maintenance Validation

After changing CLI code, templates, or skills, run:

```powershell
npm run smoke
```

After changing templates or skills, also check project neutrality:

```powershell
rg -n "<source-project-term-1>|<source-project-term-2>|<source-project-technology>" templates skills README.md AGENTS.md package.json src scripts docs
```

Expected result: no matches. Default templates must not contain terms or technology assumptions from a source business project.

## 15. One-line Principle

```text
Classify first, then define scope.
Pack context before coding.
Implement one slice at a time.
Confirm between phases.
Review boundaries after implementation.
Put design knowledge in docs, and leave code indexes to IDE and search tools.
```
