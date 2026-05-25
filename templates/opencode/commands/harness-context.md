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
`.task/context-pack.md`

Requirements:
- Keep the context pack compact.
- Include only what is needed for the current coding slice.
- State allowed modification scope.
- State forbidden modification scope.
- State validation commands.
- State stop conditions.
- Do not code.
