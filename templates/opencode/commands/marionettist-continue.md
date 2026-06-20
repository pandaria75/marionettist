---
description: Continue the active Marionettist task by reading task state and respecting gates
agent: marionettist-builder
---

Read `.task/active.json` first, then `.task/<task-id>/state.json`. Here `<task-id>` is selected by `.task/active.json`.

When available, also read `marionettist.config.yaml` to determine the local `gatePolicy.defaultMode`. Treat gate policy as Marionettist workflow behavior, not as `opencode.permissionMode` or other tool-permission settings.

Do not blindly write code. Respect the current phase, all gates, `criticPassed`, and `allowedToCode`.

Treat work as critic-gated when it is Tier L, or when the requirement, implementation plan, state, or context pack marks it as high-risk, boundary-sensitive, or workflow-sensitive.

Use this effective gate policy order for continuation decisions:
- `gatePolicy.selected` from task state when present
- otherwise `gatePolicy.defaultMode` from `marionettist.config.yaml` when present
- otherwise current safe Marionettist behavior

Policy semantics for continuation:
- `strict`: stop at each required Marionettist gate.
- `balanced`: preserve analysis and final approval gates; allow continuation only into the next already-approved `gateClass: simple` slice or group when supplemental `risk_score` does not strengthen the gate and no critic gate, explicit stop condition, or missing approval evidence blocks it.
- `autonomous`: preserve analysis and final approval gates; stop mid-task for `gateClass: high-risk`, `gateClass: boundary-sensitive`, critic-required, explicitly requested gates, or any slice whose supplemental `risk_score` requires a stronger pause than `gateClass` alone.

`risk_score` is stricter supplemental metadata. Use it together with `gateClass` and `gateReasons` when deciding whether to continue, pause, or escalate. It may only preserve or strengthen required pauses and routing; it must never weaken `gateClass`, critic requirements, explicit gates, final approval, or other mandatory stops.

Continuation rules:
- If there is no active task, prompt the user to create one with `/marionettist` or a focused entrypoint such as `/marionettist-dev`, `/marionettist-incident`, `/marionettist-docs`, or `/marionettist-config`.
- If `requirementFrozen` is false and the task needs frozen requirements, route to `requirement-freezer`.
- If `implementationPlan` is missing or plan approval is required, route to `implementation-slicer` or `marionettist-planner`.
- If `contextPackReady` is false, route to `context-pack-builder` and write `.task/<task-id>/context-pack.md`.
- If the task is critic-gated and `criticPassed` is false, route to `marionettist-critic` in `plan-review` mode before any coding handoff.
- A critic `PASS` does not authorize coding by itself. If `allowedToCode` is false, explain the blocked gate and ask the user for confirmation before coding.
- If `allowedToCode` is true, pass only the current approved slice or group to `marionettist-coder`.
- If coding is complete but review has not passed, route to `marionettist-reviewer` for the current slice or group.
- Use the reviewer’s bounded high-risk two-stage mode when the task or current slice/group is Tier L, high-risk, boundary-sensitive, workflow-sensitive, or critic-required.
- Otherwise use the reviewer’s standard bounded diff-review mode by default.
- If coding, review, and required validation are complete for critic-gated work, route to `marionettist-critic` in `pre-done` mode before declaring the approved work done. Provide reviewer verdict, validation evidence, changed-file inventory, and state/gate summary; do not ask the critic to redo code review.
- If review passed but validation has not passed, route to `marionettist-validator`.
- If the current slice or group is done and the next step is another already-approved slice or group, use the effective gate policy plus that next item's `gateClass`, `risk_score`, and `gateReasons` to decide whether to pause or continue.
- In `balanced` mode, continue only for `gateClass: simple` slices or groups whose supplemental `risk_score` does not strengthen the gate, and only when no critic-required, explicit gate, or other stop condition applies.
- In `autonomous` mode, pause for `high-risk`, `boundary-sensitive`, critic-required, explicitly requested gates, or any next slice/group whose supplemental `risk_score` strengthens the gate beyond what `gateClass` alone would allow.
- When pausing or escalating because of risk, explain the controlling `gateClass` and include the relevant `risk_score` and `gateReasons` in the gate explanation.
- Keep final approval required by default.

Do not use the critic gate to bypass coding, review, validation, or human-confirmation gates.

Before any important phase transition, tell the user what will happen next and request confirmation.
