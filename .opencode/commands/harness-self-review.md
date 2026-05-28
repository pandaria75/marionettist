---
description: Review framework changes for boundary leaks
agent: harness-framework-reviewer
---

Review the current diff for harness framework maintenance risks.

Focus on:
- target-project templates staying project-neutral
- self-only rules staying out of `templates/AGENTS.md` and target OpenCode templates
- init/sync/diff/doctor behavior staying safe and reversible
- tests covering template, skill, and self-opencode boundaries

Do not run regular harness init against this framework repository. templates/ and skills/ are product source assets, not self runtime output. .harness-self/ is local runtime sandbox state. self-only rules must not be written into target-project templates.
