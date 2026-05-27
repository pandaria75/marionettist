---
description: Show current harness task state without modifying files
agent: harness-builder
---

Read `.task/active.json` first, then read `.task/<yyyy-MM-dd>/<task-slug>/state.json` if an active task exists.

Output only the current task status. Do not modify files and do not code.

If no active task exists, tell the user to start with one of:
- `/harness-feature`
- `/harness-bugfix`
- `/harness-refactor`
- `/harness-docs`

Report:
- Task
- Type
- Phase
- Allowed To Code
- Current Slice
- Last Gate
- Next Command
- Required files and whether each exists
- Warnings

Do not guess missing state. If state is incomplete, name the missing field and suggest the smallest repair.
