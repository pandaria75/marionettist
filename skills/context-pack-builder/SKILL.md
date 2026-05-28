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
4. For bugfix or incident-style work, read `.task/<task-id>/incident.md` when it exists.
5. Read `docs/project/knowledge-map.md` to route only the most relevant docs and rules.
6. Match involved areas using knowledge-map fields such as `Areas`, `Tags`, `Docs`, `Rules`, `Read When`, `Boundaries`, and `Validation`.
7. If target files or directories are known, walk upward from those paths and load only nearby `MODULE_RULES.md`, `AGENTS.md`, or `HARNESS_RULES.md` files that actually constrain the work.
8. Treat global safety and boundary rules as higher priority than local path-proximity rules when they conflict.
9. Use module-inspector or workflow-inspector only when scope is still unclear after targeted routing.
10. Extract only the minimum context needed for coding.
11. Create or update `.task/<task-id>/context-pack.md`.
12. Do not implement code.
13. If legacy `.task/context-pack.md` exists, read it only as a migration fallback and recommend moving context into the active task directory.

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

## Loaded Context

### Global Rules

### Knowledge Map Matches

### Path-Proximity Rules

### Excluded Context

Use `Loaded Context` to explain routing decisions and why each source was included or excluded. Use the following `Loaded Rules` and `Loaded Docs` sections as concise reference lists, not as places to duplicate full content.

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
- Read `incident.md` only when the task type and available evidence justify it.
- Do not load the whole `docs` directory by default.
- Do not turn `knowledge-map.md` into a code index.
- Record which context was loaded, why it matched, and what was intentionally excluded.
- Prefer references to the exact docs and rules that matter instead of copying them.
- If local path rules conflict with repository-global safety or boundary rules, follow the global rules and note the conflict.
- Do not implement code.
