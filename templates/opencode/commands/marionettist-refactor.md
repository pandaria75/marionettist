---
description: Start Marionettist workflow for a refactor task
agent: marionettist-builder
---

I want to perform a refactor task:

$ARGUMENTS

Follow the current repository Marionettist workflow.
Analyze boundaries and workflow impact first.
Use `marionettist-indexer` for ownership, docs, rules, and call-path exploration.
Use `marionettist-planner` to create small implementation slices and validation strategy after scope is clear.
Do not code directly.
After the user confirms analysis is complete, orchestrate the approved slice through `marionettist-coder` and `marionettist-reviewer`.
