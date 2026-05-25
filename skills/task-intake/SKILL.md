---
name: task-intake
description: Default lightweight entrypoint for non-trivial repository tasks, including feature development, bug fixing, refactoring, documentation updates, investigations, reviews, and workflow-sensitive work. Use when a new task starts and the harness flow has not started yet; use fast path when structured task artifacts or a clearly scoped ongoing slice are already provided.
---

# Task Intake

Use this skill to collect task information and route the task into the lightweight file-based harness.

## Fast Path

If the user already provides structured task artifacts or a clearly scoped ongoing slice, do not ask the full intake questions.

Structured task artifacts include:
- `.task/<yyyy-MM-dd>/<task>.requirement.md`
- `.task/<yyyy-MM-dd>/<task>.implementation-plan.md`
- `.task/context-pack.md`

Use the local task date for `<yyyy-MM-dd>`, for example `.task/2026-04-28/`.

For fast-path tasks:
1. Summarize the current task state.
2. Identify the next required harness step.
3. Route directly to that step.
4. Ask only blocking questions needed for routing.

## Workflow

1. Read `AGENTS.md`.
2. Read `harness.config.yaml` if present.
3. Classify the task type:
   - feature
   - bugfix
   - refactor
   - documentation
   - review
   - investigation
   - build/deployment
4. Ask only the minimum blocking questions required to choose the next workflow.
5. Do not implement code.
6. Do not create large documents unless the task requires them.
7. Route to the correct next skill or workflow.

## Questions To Ask

### Common Questions

- What is the task goal?
- Which module, package, feature area, API, page, or workflow is involved?
- Is this a new feature, bug fix, refactor, investigation, documentation task, or review?
- Is the expected behavior already known?
- Are there files, logs, screenshots, APIs, or docs that must be used?
- Is any area forbidden to modify?
- What validation command or manual verification is expected?

### Feature Task Questions

- What user or system scenario should be supported?
- What is in scope?
- What is explicitly out of scope?
- Are UI, API, database, workflow, or infrastructure changes required?
- Are compatibility requirements involved?

### Bugfix Task Questions

- What is the observed behavior?
- What is the expected behavior?
- How can the issue be reproduced?
- Is there an error log or stack trace?
- Is the bug stable or intermittent?
- Which version, branch, environment, customer, or deployment context is affected?
- Is this a regression?

### Refactor Task Questions

- What problem should the refactor solve?
- What behavior must remain unchanged?
- What areas are allowed to change?
- What areas are forbidden to change?

## Routing Rules

### Feature

Use:

1. requirement-freezer when scope, business rules, or expected behavior are unclear
2. module-inspector or workflow-inspector when boundaries or flows need analysis
3. implementation-slicer
4. context-pack-builder
5. coding
6. boundary-reviewer

### Bugfix

Use:

1. bug intake section in this skill
2. workflow-inspector if call chain or runtime flow is unclear
3. module-inspector if module boundary is unclear
4. requirement-freezer only when expected behavior or business rule is unclear
5. context-pack-builder
6. coding
7. boundary-reviewer

### Refactor

Use:

1. module-inspector
2. workflow-inspector if behavior flow may be affected
3. implementation-slicer
4. context-pack-builder
5. coding
6. boundary-reviewer

### Documentation

Use:

1. workspace-knowledge-manager
2. update `docs/project/knowledge-map.md` when docs or rules are added, moved, renamed, or deleted

## Output Format

```md
# Task Intake Result

## Task Type

## Current Understanding

## Blocking Questions

## Non-blocking Assumptions

## Recommended Next Step

## Suggested Prompt For Next Step
```

## Guardrails

- Ask only blocking questions.
- Do not implement code.
- Do not generate full implementation plans directly.
- Keep the intake lightweight.
- Prefer repository evidence over asking the user when possible.
