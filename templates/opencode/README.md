## Optional OpenCode Assets

These files are optional local OpenCode assets for repositories that want a harness-oriented command and subagent setup.

### What Is Included

- `opencode.jsonc`: project-level OpenCode config that enables the repository-local `./.opencode/plugin/opencode-tasks.js` plugin prototype.
- `.opencode/plugin/opencode-tasks.js`: repository-local OpenCode plugin prototype asset installed from the Pathway source root.
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
- The existing `harness-config` command remains the general or legacy OpenCode config wrapper. The OpenCode Pathway MVP may also expose a distinct `harness-pathway-config` workflow for Pathway-scoped config authoring; that workflow is not a new core CLI config command.
- Pathway config writes should always follow the same safety posture: draft candidate YAML or config content, show a diff or diff-like preview, and require explicit confirmation before writing managed config files.
- Harness gate policy is configured separately through `harness.config.yaml` `gatePolicy.defaultMode: strict|balanced|autonomous`. The builder should recommend a task policy before coding, and task-local artifacts may record a selected override when the project workflow allows it.
- Gate policy is not the same as `opencode.permissionMode`. Gate policy controls where the harness pauses or continues; `opencode.permissionMode` only adjusts OpenCode tool-permission friction.
- In `balanced` mode, `/harness-continue` may continue only into the next already-approved `gateClass: simple` slice or group when that slice's supplemental `risk_score` does not strengthen the gate and no critic-required or explicit gate blocks continuation. In `autonomous` mode, it still pauses for `high-risk`, `boundary-sensitive`, critic-required, explicitly requested gates, or any slice whose supplemental `risk_score` requires a stronger pause than `gateClass` alone. Final approval remains required by default.
- Permission mode is configured through `opencode.permissionMode: default|moderate|loose`. `default` preserves current behavior; `moderate` and `loose` adjust friction around higher-risk operations without changing the harness gate model.
- The dangerous-command baseline covers destructive deletes, dangerous git rewrites, force pushes, publish/release operations, global config mutation, project-external writes, and risky shell pipe/chain patterns.
- That baseline is enforced as strongly as OpenCode schema allows. Where schema cannot express a risky pattern precisely, templates fall back to warnings, prompts, and agent guidance prose.
- Treat `loose` as a higher-trust local option, not as a shared default recommendation. Do not treat these templates as endorsing global `permission: allow`.
- Install/distribution mode is recorded in `.harness/manifest.json` as `distributionMode` (`embedded`, `hybrid`, or `adapter`). Legacy installs without that field remain valid and are reported safely.
- OpenCode generated artifact ownership stays template-driven: plugin prototype assets currently come from `templates/pathways/opencode/**`, generated fallback assets remain in `templates/opencode/**`, and target-project manifest entries track adapter metadata, `templateHash`, `renderedHash`, and legacy `hash` compatibility.
- `harness diff` and `harness sync` protect local modifications. Missing files, conflicts, and orphaned managed entries are reported rather than silently overwritten; explicit force is required for intentional managed replacement.
- Same-name plugin and file entries may conflict. If a plugin-provided agent or command shares a name with a generated or project-local file entry, the plugin entry may win.
- OpenCode may load the same plugin from both the explicit config entry and `.opencode/plugin/` auto-discovery. The current prototype is accepted because its config hook is idempotent.
- If generated config, plugin, command, or skill files change, restarting OpenCode may be required before the running session observes the update.
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
