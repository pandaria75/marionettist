---
description: Generate or update the current task context pack
agent: harness-builder
---

Use `context-pack-builder`.
Use `harness-planner` first if the current slice, validation commands, or stop conditions are not clear enough.

Requirement source:
$1

Implementation source:
$2

Current slice:
$3

Output:
`.task/<yyyy-MM-dd>/<task-slug>/context-pack.md`, where `<task-slug>` is read from `.task/active.json`.

Requirements:
- Keep the context pack compact.
- Include only what is needed for the current coding slice.
- State allowed modification scope.
- State forbidden modification scope.
- State validation commands.
- State stop conditions.
- Do not code.
- If `.task/active.json` is missing, do not guess a task path; ask the user to start or select a task first.
- If legacy `.task/context-pack.md` exists, use it only as migration fallback and recommend moving context into the active task directory.
