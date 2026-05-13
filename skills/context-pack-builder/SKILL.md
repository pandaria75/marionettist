---
name: context-pack-builder
description: Build a compact `.task/context-pack.md` from requirements, implementation plans, docs, rules, and source evidence before coding starts.
---

# Context Pack Builder

Use this skill before coding Tier M or Tier L work.

## Workflow

1. Read the active requirement or implementation plan when present.
2. Read relevant knowledge-map entries, docs, and rules.
3. Inspect source only for missing implementation context.
4. Extract the minimum context needed for the current slice or approved group.
5. Create or update `.task/context-pack.md`.

## Context Pack Template

```markdown
# Task Context Pack

## Task Goal

## Current Slice Or Group

## Requirement Source

## Implementation Source

## Involved Knowledge Areas

## Loaded Rules

## Loaded Docs

## Allowed Modification Scope

## Forbidden Modification Scope

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
- Do not implement code.
