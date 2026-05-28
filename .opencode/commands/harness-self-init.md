---
description: Initialize or refresh framework self-dogfooding files
agent: harness-framework-planner
---

Run framework self setup for this repository only.

Use:
- `harness self init --with-opencode` to preview self OpenCode files.
- `harness self init --apply --with-opencode` to write self OpenCode files.

Do not run regular harness init against this framework repository. templates/ and skills/ are product source assets, not self runtime output. .harness-self/ is local runtime sandbox state. self-only rules must not be written into target-project templates.
