---
description: Continue the active harness task by reading task state and respecting gates
agent: harness-builder
---

Read `.task/active.json` first, then `.task/<task-id>/state.json`. Here `<task-id>` is selected by `.task/active.json`.

Do not blindly write code. Respect the current phase, all gates, `criticPassed`, and `allowedToCode`.

Treat work as critic-gated when it is Tier L, or when the requirement, implementation plan, state, or context pack marks it as high-risk, boundary-sensitive, or workflow-sensitive.

Continuation rules:
- If there is no active task, prompt the user to create one with `/harness-feature`, `/harness-bugfix`, `/harness-refactor`, or `/harness-docs`.
- If `requirementFrozen` is false and the task needs frozen requirements, route to `requirement-freezer`.
- If `implementationPlan` is missing or plan approval is required, route to `implementation-slicer` or `harness-planner`.
- If `contextPackReady` is false, route to `context-pack-builder` and write `.task/<task-id>/context-pack.md`.
- If the task is critic-gated and `criticPassed` is false, route to `harness-critic` in `plan-review` mode before any coding handoff.
- A critic `PASS` does not authorize coding by itself. If `allowedToCode` is false, explain the blocked gate and ask the user for confirmation before coding.
- If `allowedToCode` is true, pass only the current approved slice or group to `harness-coder`.
- If coding is complete but review has not passed, route to `harness-reviewer` in bounded `diff-review` mode for the current slice or group.
- If coding, review, and required validation are complete for critic-gated work, route to `harness-critic` in `pre-done` mode before declaring the approved work done. Provide reviewer verdict, validation evidence, changed-file inventory, and state/gate summary; do not ask the critic to redo code review.
- If review passed but validation has not passed, route to `harness-validator`.

Do not use the critic gate to bypass coding, review, validation, or human-confirmation gates.

Before any important phase transition, tell the user what will happen next and request confirmation.
