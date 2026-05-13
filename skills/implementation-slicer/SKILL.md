---
name: implementation-slicer
description: Convert an approved requirement, refactor scope, or analysis result into small executable implementation slices with allowed scope, validation, and stop conditions.
---

# Implementation Slicer

Use this skill before non-trivial coding.

## Workflow

1. Read requirement or analysis artifacts.
2. Read relevant boundary and workflow summaries.
3. Split work into the smallest safe slices.
4. Define allowed and forbidden scope for each slice.
5. Define validation and done criteria.
6. Create or update `.task/<yyyy-MM-dd>/<task-name>.implementation-plan.md`.

## Plan Template

```markdown
# <Task Name> Implementation Plan

## Requirement Source

## Scope Summary

## Global Forbidden Scope

## Execution Strategy

## Slice Dependency Graph

## Implementation Slices

### Slice 1: <Name>

#### Goal

#### Allowed Modification Scope

#### Forbidden Scope

#### Steps

#### Validation

#### Done Criteria

#### Rollback Notes

## Final Validation

## Documentation Update Requirement

## Risks
```

## Guardrails

- Do not implement code.
- Prefer sequential slices unless parallel work is clearly safe.
- Do not mark shared-file work as parallel unless a merge owner is named.
