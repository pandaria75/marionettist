---
name: workflow-inspector
description: Analyze user-facing, backend, frontend-backend, event, task, or integration flows before changing workflow-sensitive behavior.
---

# Workflow Inspector

Use this skill when a task may affect execution flow, orchestration, async processing, frontend-backend integration, state transitions, or external integrations.

## Workflow

1. Identify the flow entrypoint from the request, docs, routes, commands, events, jobs, or UI action.
2. Read relevant knowledge-map entries.
3. Load only required design docs and rules.
4. Inspect source as needed for runtime evidence.
5. Summarize current flow, proposed impact area, risks, and validation needs.

## Output Format

```markdown
# Workflow Summary

## Entrypoint

## Current Flow

## State Or Data Changes

## Integration Points

## Impacted Boundaries

## Risks

## Validation Needs

## Uncertainty
```

## Guardrails

- Do not create code indexes.
- Do not inspect unrelated flows.
- Do not implement code.
