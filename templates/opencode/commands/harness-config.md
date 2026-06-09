---
description: Start harness or project configuration work through the builder-first flow
agent: harness-builder
---

I want help with harness or project workflow configuration:

$ARGUMENTS

Requirements:
- Treat this as the normal-user configuration wrapper.
- Prefer configuration-oriented routing for harness-managed setup, workflow, agent, rule, tasking, or OpenCode-related config work unless another workflow is clearly a better fit.
- When the request describes Tier-policy changes in natural language, draft candidate `.harness/tier-policy.yml` content, show a diff before any write, and require explicit confirmation before persistence.
- For Tier-policy authoring, use the existing builder/config workflow rather than inventing a new command unless a future approved design adds one.
- Explain the selected workflow in one concise sentence, including any required gate before acting or delegating.
- Keep the request project-neutral.
- Do not skip analysis, critic, review, validation, or human-confirmation gates.
