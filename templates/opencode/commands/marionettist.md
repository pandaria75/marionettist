---
description: Start from the unified builder-first Marionettist entrypoint
agent: marionettist-builder
---

Use this as the default Marionettist command.

User request:
$ARGUMENTS

Requirements:
- Treat this as a builder-first natural-language entrypoint.
- First classify the intent and choose the smallest matching Marionettist workflow.
- Explain the selected workflow in one concise sentence, including any required gate before acting or delegating.
- Ask only minimal clarifying questions when ambiguity blocks safe progress.
- Keep the command project-neutral and preserve normal Marionettist gates.

Supported intent examples include development, bugfix, incident, docs, config, review, validation, status, continuation, and context-pack requests.
