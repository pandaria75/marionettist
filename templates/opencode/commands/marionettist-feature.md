---
description: Start Marionettist workflow for a feature request
agent: marionettist-builder
---

I want to develop a new requirement:

$ARGUMENTS

Follow the current repository Marionettist workflow.
Run `task-intake` first.
Create a dated task directory for non-trivial work and point `.task/active.json` to it.
Use `marionettist-indexer` for repository, module, docs, rules, or workflow exploration when scope is unclear.
Use `marionettist-planner` when implementation slicing, validation strategy, or context-pack planning is needed.
If needed, create the requirement document and implementation plan later.
Do not code directly.
Do not skip analysis gates.
After the user confirms analysis is complete, orchestrate the approved slice through `marionettist-coder` and `marionettist-reviewer`.
