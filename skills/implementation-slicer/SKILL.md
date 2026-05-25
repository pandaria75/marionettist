---
name: implementation-slicer
description: Convert a frozen requirement document or approved refactor scope into small implementation slices with file scope, modification order, validation commands, rollback notes, and done criteria. Use before coding non-trivial features or refactors.
---

# Implementation Slicer

Use this skill to convert a requirement document into executable implementation slices.

## Workflow

1. Read the requirement document or approved refactor scope.
2. Use module-inspector or workflow-inspector when module or workflow scope is unclear.
3. Identify the smallest safe implementation slices.
4. For each slice, define:
   - goal
   - allowed files, packages, or directories
   - forbidden files, packages, or directories
   - execution mode
   - dependencies and parallel eligibility when the task is complex
   - validation level
   - merge owner and conflict rule when shared files are involved
   - steps
   - validation command
   - done criteria
   - rollback notes
5. Create or update `.task/<yyyy-MM-dd>/<task-name>.implementation-plan.md`.
6. Use the local task date for `<yyyy-MM-dd>`, for example `.task/2026-04-28/`.
7. Do not implement code.

## Output Document Template

```md
# <Task Name> Implementation Plan

## Requirement Source

## Scope Summary

## Involved Modules Or Areas

## Loaded Rules

## Loaded Docs

## Global Forbidden Scope

## Execution Strategy

- Complexity: simple | complex
- Default Execution: sequential
- Parallel Execution: optional | not-needed
- Fallback Execution: sequential
- Merge Owner:
- Conflict Resolution Rule:

## Slice Dependency Graph

| Slice | Depends On | Can Run In Parallel With | Fallback Order | Shared Files | Merge Owner | Conflict Risk |
| --- | --- | --- | --- | --- | --- | --- |

## Implementation Slices

### Slice 1: <Name>

#### Goal

#### Allowed Modification Scope

#### Forbidden Scope

#### Execution

- Mode: sequential | parallel-capable
- Depends On:
- Can Run With:
- Must Not Run With:
- Fallback Order:
- Shared Files:
- Merge Owner:
- Conflict Risk: low | medium | high
- Validation Level: slice | group | final
- Recommended Agent Strategy:

#### Steps

#### Validation

#### Done Criteria

#### Rollback Notes

## Parallel Slice Groups

Use this section only for complex tasks that have independent work worth parallel planning.

### Group A: <Name>

#### Members

#### Parallel Eligibility

#### Sequential Fallback Order

#### Merge Rule

#### Conflict Resolution Rule

#### Group Validation

#### Group Done Criteria

## Final Validation

## Documentation Update Requirement

## Risks
```

## Guardrails

- Prefer small slices.
- Do not merge unrelated work into one slice.
- Do not implement code.
- Use `parallel-capable` planning only for complex tasks with independent scope and a clear sequential fallback.
- Do not mark shared-file work as `parallel-capable` unless the plan names a merge owner and conflict resolution rule.
- Do not expand the requirement scope.
- Include validation commands whenever possible.
