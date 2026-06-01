---
description: Start from the unified builder-first harness entrypoint
agent: harness-builder
---

Use this as the default harness command.

User request:
$ARGUMENTS

Requirements:
- Treat this as a builder-first natural-language entrypoint.
- First classify the intent and choose the smallest matching harness workflow.
- Explain the selected workflow in one concise sentence, including any required gate before acting or delegating.
- Ask only minimal clarifying questions when ambiguity blocks safe progress.
- Keep the command project-neutral and preserve normal harness gates.

Supported intent examples include development, bugfix, incident, docs, config, review, validation, status, continuation, and context-pack requests.
