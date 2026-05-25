---
name: context-pack-builder
description: Build a minimal task context pack before coding. Use after a requirement document or implementation plan exists, or when a coding task spans modules and needs compact context for AI agent execution.
---

# Context Pack Builder

Use this skill to build `.task/context-pack.md` before implementation.

## Workflow

1. Read the requirement document if available, preferring `.task/<yyyy-MM-dd>/<task-name>.requirement.md`.
2. Read the implementation plan if available, preferring `.task/<yyyy-MM-dd>/<task-name>.implementation-plan.md`.
3. Read `docs/project/knowledge-map.md` if involved areas need routing.
4. Use module-inspector or workflow-inspector only when scope is unclear.
5. Extract only the minimum context needed for coding.
6. Create or update `.task/context-pack.md`.
7. Do not implement code.

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
- Do not implement code.
