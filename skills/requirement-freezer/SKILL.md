---
name: requirement-freezer
description: Convert ambiguous feature, refactor, or behavior requests into a concise frozen requirement document before implementation planning.
---

# Requirement Freezer

Use this skill for Tier L tasks or when expected behavior, scope, compatibility, or business rules are unclear.

## Workflow

1. Read the user request and relevant existing docs.
2. Inspect code only when needed to verify current behavior.
3. Separate facts, assumptions, open questions, non-goals, and risks.
4. Ask blocking questions only when implementation would be unsafe without an answer.
5. Create or update `.task/<yyyy-MM-dd>/<task-name>.requirement.md`.

## Requirement Template

```markdown
# <Task Name> Requirement

## Goal

## Success Criteria

## In Scope

## Out Of Scope

## Current Behavior

## Required Behavior

## Compatibility Requirements

## Constraints

## Assumptions

## Risks

## Acceptance Criteria
```

## Guardrails

- Do not implement code.
- Do not invent business rules.
- Keep requirements concise and testable.
