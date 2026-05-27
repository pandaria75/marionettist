---
description: Start harness workflow for a feature request
agent: harness-builder
---

I want to develop a new requirement:

$ARGUMENTS

Follow the current repository harness workflow.
Run `task-intake` first.
Create a task-scoped directory `.task/<yyyy-MM-dd>/<task-slug>/` for non-trivial work and point `.task/active.json` to it.
Use `harness-indexer` for repository, module, docs, rules, or workflow exploration when scope is unclear.
Use `harness-planner` when implementation slicing, validation strategy, or context-pack planning is needed.
If needed, create the requirement document and implementation plan later.
Do not code directly.
Do not skip analysis gates.
After the user confirms analysis is complete, orchestrate the approved slice through `harness-coder` and `harness-reviewer`.
