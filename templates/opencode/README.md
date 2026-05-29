## Optional OpenCode Assets

These files are optional local OpenCode assets for repositories that want a harness-oriented command and subagent setup.

### What Is Included

- `opencode.jsonc`: project-level OpenCode config that enables the `opencode-tasks` plugin.
- `commands/*.md`: starter slash commands that route users into the harness workflow, including status, continuation, context refresh, and incident-first evidence commands that read `.task/active.json`.
- `agents/*.md`: starter agent definitions for builder, coder, critic, indexer, planner, reviewer, and validator roles.
- `agents/validators/*.md`: validator guidance variants you can copy from or adapt to your project type.

### P1 Workflow Additions

- `agents/harness-critic.md` provides a dedicated critic gate role and renders its `model` from the review profile.
- `commands/harness-incident.md` starts an evidence-first incident flow and prepares handoff to `incident-pack-builder` and `hypothesis-critic`.
- Context refresh and coding flows should keep `docs/project/knowledge-map.md` and nearby `MODULE_RULES.md`, `AGENTS.md`, and `HARNESS_RULES.md` aligned with the current project.

### Customization

- Model defaults are rendered from `.harness/model-profiles.yml` profiles. Update `profiles.think/build/review/run` there first, then regenerate or manually align the agent `model` fields. If a project has not adopted `.harness/model-profiles.yml` yet, `harness.config.yaml` `models.profiles.*` remains the legacy fallback.
- Permission settings are also examples. Tighten or relax them to fit your safety requirements.
- Keep terminology aligned with your repository docs, rules, and `docs/project/knowledge-map.md`.

### Validator Guidance

- `agents/harness-validator.md` includes a generic fallback.
- If `opencode.jsonc` enables `opencode-tasks`, the validator also gets scheduling guidance for recurring validation requests.
- `agents/validators/gradle-kotlin.md` provides a Gradle/Kotlin-oriented example.
- `agents/validators/maven.md` provides Maven-oriented validation guidance.
- `agents/validators/node.md` provides Node.js package manager validation guidance.
- `agents/validators/python.md` provides Python validation guidance.
- `agents/validators/generic-fallback.md` provides tool-agnostic validation guidance.

If your repository uses another stack, keep the generic fallback and replace the project-type-specific examples with local guidance.
