---
description: Start harness workflow for a bug fix
agent: harness-builder
---

I want to fix a bug. Follow the current repository bugfix harness workflow.

Observed behavior:
$1

Expected behavior:
$2

Reproduction steps:
$3

Evidence:
$4

Affected scope:
$5

Requirements:
- First decide whether `workflow-inspector` or `module-inspector` is needed.
- Create a task-scoped directory `.task/<yyyy-MM-dd>/<task-slug>/` for non-trivial work and point `.task/active.json` to it.
- Use `harness-indexer` for repository, docs, rules, knowledge, boundary, or call-path exploration when evidence is incomplete.
- Use `harness-planner` only when the bugfix needs an implementation slice, validation strategy, or context-pack planning.
- Do not use `requirement-freezer` by default.
- Only use `requirement-freezer` when expected behavior or business rules are unclear.
- Create `.task/<yyyy-MM-dd>/<task-slug>/context-pack.md` before coding.
- Do not code directly.
- After the user confirms analysis is complete, orchestrate the approved slice through `harness-coder` and `harness-reviewer`.
