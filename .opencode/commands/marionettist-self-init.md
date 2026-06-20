---
description: Initialize or refresh framework self-dogfooding files
agent: marionettist-framework-planner
---

Run framework self setup for this repository only.

Use:
- `marionettist self init --with-opencode` to preview self OpenCode files.
- `marionettist self init --apply --with-opencode` to write self OpenCode files.

Do not run regular marionettist init against this framework repository. templates/ and skills/ are product source assets, not self runtime output. .marionettist-self/ is local runtime sandbox state. self-only rules must not be written into target-project templates.
