---
name: requirement-freezer
description: Convert raw feature requests, meeting notes, ambiguous requirements, or behavior disputes into a frozen requirement document with scope, assumptions, non-goals, risks, and acceptance criteria. Use before implementation planning when requirements are unclear, business rules need stabilization, or the task will later be handed to an AI agent for coding.
---

# Requirement Freezer

Use this skill to convert raw requirements into a stable requirement document.

## Workflow

1. Read the user-provided requirement.
2. Identify:
   - business or system goal
   - involved users or actors
   - affected modules or feature areas if obvious
   - expected behavior
   - unclear business rules or compatibility expectations
3. Classify questions:
   - Blocking Questions
   - Non-blocking Assumptions
   - Deferred Questions
4. Ask only Blocking Questions.
5. If enough information is available, create or update `.task/<yyyy-MM-dd>/<task-name>.requirement.md`.
6. Use the local task date for `<yyyy-MM-dd>`, for example `.task/2026-04-28/`.
7. Do not implement code.
8. Do not write an implementation plan.

## Output Document Template

```md
# <Task Name> Requirement

## Goal

## Background

## In Scope

## Out Of Scope

## Current Behavior

## Required Behavior

## User Flow

## Business Rules

## Data Rules

## API Contract

## UI Requirements

## Compatibility Requirements

## Error Handling

## Permissions And Security

## Assumptions

## Risks

## Acceptance Criteria

## Deferred Questions

## Source Notes
```

## Guardrails

- Do not implement code.
- Do not invent business rules.
- Record assumptions explicitly.
- Keep requirements separate from implementation details.
- Ask only blocking questions.
