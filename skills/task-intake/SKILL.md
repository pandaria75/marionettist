---
name: task-intake
description: Classify a new repository task, choose the harness tier, identify required context, and route to the next analysis step without implementing code.
---

# Task Intake

Use this skill when a new task starts and no current `.task/context-pack.md` or approved implementation slice already applies.

## Workflow

1. Read `AGENTS.md`.
2. Read `harness.config.yaml` if present.
3. Classify task type:
   - feature
   - bugfix
   - refactor
   - documentation
   - review
   - investigation
   - build or deployment
4. Classify tier:
   - Tier S: single low-risk change with no boundary ambiguity.
   - Tier M: standard task requiring analysis and context pack.
   - Tier L: complex task requiring requirement freeze, inspection, slicing, and context pack.
5. Ask only blocking questions that cannot be answered from the repo.
6. Route to the next skill or workflow step.

## Output Format

```markdown
# Task Intake Result

## Task Type

## Tier

## Current Understanding

## Blocking Questions

## Assumptions

## Recommended Next Step

## Guardrails
```

## Guardrails

- Do not implement code.
- Do not create full plans unless routing requires it.
- Keep intake lightweight.
- Prefer repo evidence over asking the user.
