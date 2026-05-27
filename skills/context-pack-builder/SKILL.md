---
name: context-pack-builder
description: Build a minimal task context pack before coding. Use after a requirement document or implementation plan exists, or when a coding task spans modules and needs compact context for AI agent execution.
phase: analysis
model_requirement: reasoning
can_edit: true
risk_level: medium
---

# Context Pack Builder

Use this skill to build `.task/<task-id>/context-pack.md` before implementation. Read `<task-id>` from `.task/active.json`.

## Workflow

1. Read `.task/active.json` and `.task/<task-id>/state.json`.
2. Read the requirement document if available, preferring `.task/<task-id>/requirement.md`.
3. Read the implementation plan if available, preferring `.task/<task-id>/implementation-plan.md`.
4. Read `docs/project/knowledge-map.md` if involved areas need routing.
5. Use module-inspector or workflow-inspector only when scope is unclear.
6. Extract only the minimum context needed for coding.
7. Create or update `.task/<task-id>/context-pack.md`.
8. Do not implement code.
9. If legacy `.task/context-pack.md` exists, read it only as a migration fallback and recommend moving context into the active task directory.

## Output File Template

```md
# Task Context Pack

## Task Goal

## Current Slice Or Group

## Bugfix Context

### Observed Behavior

### Expected Behavior

### Reproduction Steps

### Evidence
- Logs:
- Stack Trace:
- Screenshots:
- Related Files:

### Suspected Scope

### Regression Risk

## Requirement Source

## Implementation Source

## Involved Modules Or Areas

## Loaded Rules

## Loaded Docs

## Execution Mode

- Mode: sequential | parallel-group
- Current Slice Or Group:
- Parallel Members:
- Fallback Order:
- Shared Files:
- Merge Owner:
- Conflict Resolution Rule:
- Validation Level: slice | group | final

## Execution Chain

## Allowed Modification Scope

## Forbidden Modification Scope

## Key Existing Classes Or Entrypoints

## Required Behavior

## Non-goals

## Implementation Steps

## Validation Commands

## Assumptions

## Risks

## Stop Conditions
```

## Guardrails

- Keep the context pack compact.
- Do not copy full docs or source files.
- Include forbidden scope explicitly.
- Include validation commands explicitly.
- When the current approved work is `parallel-capable`, include both the parallel mode and the sequential fallback order.
- When the current approved work is a parallel group, include members, shared files, merge owner, conflict rule, and group validation.
- Include stop conditions explicitly.
- For bugfix tasks, include observed behavior, expected behavior, reproduction steps, evidence, suspected scope, and regression risk when available.
- Do not load the whole `docs` directory by default.
- Record which context was loaded and why.
- Do not implement code.
