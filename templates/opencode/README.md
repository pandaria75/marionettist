## Optional OpenCode Assets

These files are optional local OpenCode assets for repositories that want a harness-oriented command and subagent setup.

### What Is Included

- `opencode.jsonc`: project-level OpenCode config that enables the `opencode-tasks` plugin.
- `commands/*.md`: starter slash commands that route users into the harness workflow, with `/harness` as the default builder-first entrypoint and optional `minimal`, `standard`, and `advanced` command surfaces.
- `agents/*.md`: starter agent definitions for builder, coder, critic, indexer, planner, reviewer, and validator roles.
- `agents/validators/*.md`: validator guidance variants you can copy from or adapt to your project type.

### P1 Workflow Additions

- `agents/harness-critic.md` provides a dedicated critic gate role and renders its `model` from the review profile.
- `commands/harness-incident.md` starts an evidence-first incident flow, stops before coding, and keeps the incident artifact ready for the next approved investigation or implementation step.
- Context refresh and coding flows should keep `docs/project/knowledge-map.md` and nearby `MODULE_RULES.md`, `AGENTS.md`, and `HARNESS_RULES.md` aligned with the current project.

### Customization

- Model defaults are rendered from `.harness/model-profiles.yml` profiles. Update `profiles.think/build/review/run` there first, then run `harness diff --with-opencode` and `harness sync --with-opencode` to preview and apply regenerated agent `model` fields. If a project has not adopted `.harness/model-profiles.yml` yet, `harness.config.yaml` `models.profiles.*` remains the legacy fallback.
- Command visibility is configured through `opencode.commandSurface: minimal|standard|advanced` or `harness init --with-opencode --opencode-command-surface minimal|standard|advanced`. Legacy `full` remains an accepted alias for `advanced`.
- Surface definitions are builder-first by design: `minimal` installs `/harness`, `/harness-dev`, `/harness-incident`, `/harness-docs`, and `/harness-config`; `standard` adds `/harness-context`, `/harness-status`, and `/harness-continue`; `advanced` adds `/harness-feature`, `/harness-bugfix`, and `/harness-refactor`.
- Install/distribution mode is recorded in `.harness/manifest.json` as `distributionMode` (`embedded`, `hybrid`, or `adapter`). Legacy installs without that field remain valid and are reported safely.
- OpenCode generated artifact ownership stays template-driven: framework source of truth is `templates/opencode/**`, while target-project manifest entries track adapter metadata, `templateHash`, `renderedHash`, and legacy `hash` compatibility.
- `harness diff` and `harness sync` protect local modifications. Missing files, conflicts, and orphaned managed entries are reported rather than silently overwritten; explicit force is required for intentional managed replacement.
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
