---
description: Run framework smoke tests
agent: harness-framework-reviewer
---

Run the regression tests for framework changes.

Recommended commands:
- `npm run smoke`
- `npm run self:smoke`

Run these after changing `src/commands`, `src/core`, `templates`, `skills`, sync/init/diff/doctor logic, or self OpenCode files.

Do not run regular harness init against this framework repository. templates/ and skills/ are product source assets, not self runtime output. .harness-self/ is local runtime sandbox state. self-only rules must not be written into target-project templates.
