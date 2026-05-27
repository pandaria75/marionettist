---
description: Continue the active harness task by reading task state and respecting gates
agent: harness-builder
---

Read `.task/active.json` first, then `.task/<task-id>/state.json`.

Do not blindly write code. Respect all gates and `allowedToCode`.

Continuation rules:
- If there is no active task, prompt the user to create one with `/harness-feature`, `/harness-bugfix`, `/harness-refactor`, or `/harness-docs`.
- If `requirementFrozen` is false and the task needs frozen requirements, route to `requirement-freezer`.
- If `implementationPlan` is missing or plan approval is required, route to `implementation-slicer` or `harness-planner`.
- If `contextPackReady` is false, route to `context-pack-builder` and write `.task/<task-id>/context-pack.md`.
- If `allowedToCode` is false, explain the blocked gate and ask the user for confirmation before coding.
- If `allowedToCode` is true, pass only the current approved slice or group to `harness-coder`.
- If coding is complete but review has not passed, route to `harness-reviewer`.
- If review passed but validation has not passed, route to `harness-validator`.

Before any important phase transition, tell the user what will happen next and request confirmation.
