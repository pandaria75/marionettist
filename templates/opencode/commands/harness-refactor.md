---
description: Start harness workflow for a refactor task
agent: harness-builder
---

I want to perform a refactor task:

$ARGUMENTS

Follow the current repository harness workflow.
Analyze boundaries and workflow impact first.
Use `harness-indexer` for ownership, docs, rules, and call-path exploration.
Use `harness-planner` to create small implementation slices and validation strategy after scope is clear.
Do not code directly.
After the user confirms analysis is complete, orchestrate the approved slice through `harness-coder` and `harness-reviewer`.
