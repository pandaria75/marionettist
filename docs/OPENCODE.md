# OpenCode With The Harness

[中文版](./OPENCODE.zh-CN.md)

This guide is for teams that use the optional OpenCode scaffolding installed by `harness init --with-opencode`.

OpenCode improves ergonomics. It does not replace the harness workflow. The repository files, task artifacts, and gates remain the source of truth.

## 1. What OpenCode Adds

- **Slash commands** such as `/harness`, `/harness-dev`, and `/harness-docs`.
- **Role agents** for builder, planner, coder, reviewer, critic, indexer, and validator work.
- **Model profiles** so each role can use an appropriate model tier.
- **Validator guidance** for build, test, lint, and smoke-check workflows.
- **Local permission posture** through generated OpenCode agent files.

The core harness still works without OpenCode.

## 2. Install

```powershell
# Preview first
harness init --dry-run --with-opencode

# Install OpenCode scaffolding
harness init --with-opencode

# Optional command surfaces
harness init --with-opencode --opencode-command-surface minimal
harness init --with-opencode --opencode-command-surface standard
harness init --with-opencode --opencode-command-surface advanced
```

You can also set the command surface in project config:

```yaml
opencode:
  commandSurface: minimal  # minimal | standard | advanced
```

Legacy `full` is accepted as an alias for `advanced`.

## 3. Installed Files

Typical OpenCode assets:

- `opencode.jsonc`
- `.opencode/README.md`
- `.opencode/plugin/opencode-tasks.js`
- `.opencode/commands/harness*.md`
- `.opencode/agents/harness-*.md`
- `.opencode/agents/validators/**`

These are managed defaults. Teams may choose what to commit and what to keep local.

Current MVP posture:

- `opencode.jsonc` enables the repository-local plugin path `./.opencode/plugin/opencode-tasks.js`
- plugin-first behavior is the default when that plugin is present
- generated `.opencode/agents/**` and `.opencode/commands/**` files remain supported fallback assets
- framework source stays split on purpose: plugin prototype assets come from `templates/pathways/opencode/**`, while generated fallback assets come from `templates/opencode/**`

Use `harness diff`, `harness sync`, and `harness doctor` to inspect drift and safe updates. After regenerating `opencode.jsonc` or `.opencode/plugin/**`, restart OpenCode if the current session does not reload configuration automatically.

## 4. Command Surfaces

| Surface | Commands | Use When |
| --- | --- | --- |
| `minimal` | `/harness`, `/harness-dev`, `/harness-incident`, `/harness-docs`, `/harness-config` | Default builder-first workflow |
| `standard` | minimal plus `/harness-context`, `/harness-status`, `/harness-continue` | Teams want explicit status and continuation commands |
| `advanced` | standard plus `/harness-feature`, `/harness-bugfix`, `/harness-refactor` | Teams want dedicated wrappers by task type |

Most teams should start with `minimal`. The builder can route natural-language requests from `/harness`.

## 5. Key Commands

| Command | Purpose |
| --- | --- |
| `/harness` | Default entrypoint. Classifies the request and routes the workflow. |
| `/harness-dev` | Feature or implementation work. |
| `/harness-incident` | Urgent incident or mitigation work. |
| `/harness-docs` | Documentation, rules, or knowledge work. |
| `/harness-config` | Harness, workflow, tooling, or agent configuration work. |
| `/harness-status` | Show current task state without modifying files. |
| `/harness-continue` | Continue the active task according to recorded state. |

## 6. Agent Roles

| Agent | Responsibility | Profile |
| --- | --- | --- |
| `harness-builder` | Orchestrates the workflow, reads state, enforces gates, delegates bounded work. | `think` |
| `harness-planner` | Plans requirements, slices, validation, and dependency order. | `think` |
| `harness-coder` | Implements only the approved slice or group. | `build` |
| `harness-reviewer` | Reviews the diff for scope, boundaries, validation, and docs sync. | `review` |
| `harness-critic` | Audits risk gates before coding or before done for high-risk work. | `review` |
| `harness-indexer` | Performs read-only repository exploration. | `run` |
| `harness-validator` | Runs or interprets validation commands. | `run` |

The builder owns orchestration. Subagents should receive bounded inputs and return compact evidence.

## 7. Model Profiles

OpenCode agent model values are rendered from `.harness/model-profiles.yml` when it exists. Legacy `harness.config.yaml` model profiles are fallback only.

Default profile intent:

| Profile | Use | Typical Need |
| --- | --- | --- |
| `think` | builder, planner | strongest reasoning available |
| `build` | coder | capable implementation model with good cost-performance |
| `review` | reviewer, critic | cautious and stable review model |
| `run` | indexer, validator | cheaper reliable utility model |

Skill-to-profile mapping:

- `reasoning` → `think`
- `coding` → `build`
- `reflective` → `review`
- `utility` → `run`

To change models:

1. Edit `.harness/model-profiles.yml`.
2. Run `harness diff` to preview generated changes.
3. Run `harness sync` when the preview is safe.
4. Avoid duplicating model choices in `opencode.jsonc`.

## 8. Gate Behavior

OpenCode follows the same harness gates as the file-based workflow.

- Stop after analysis before coding for non-trivial work.
- Implement only the approved slice or group.
- Review the same slice immediately after coding.
- Stop before the next slice unless the selected gate policy explicitly allows safe continuation.

Gate policy is configured separately from OpenCode permission mode. `balanced` or `autonomous` gates do not grant broader tool permissions and do not bypass dangerous-command handling.

For exact gate rules, use the installed `docs/project/harness-workflow.md` in the target project.

## 9. Permission Modes

OpenCode permission mode controls tool and command friction. It is configured through `harness.config.yaml`:

```yaml
opencode:
  permissionMode: default  # default | moderate | loose
```

Mode summary:

- `default` keeps the standard generated permission posture.
- `moderate` reduces routine friction while keeping risk warnings.
- `loose` reduces friction further for experienced local users.

Permission mode does not remove the dangerous-command baseline. Agents must still treat force pushes, history rewrites, destructive deletes, release/publish/deploy actions, global config mutation, project-external writes, and risky shell chains as high-risk.

OpenCode schema cannot express every dangerous shell pattern. Where schema rules are not enough, the harness relies on prompt text, warnings, and review guidance.

## 10. Validator Behavior

The validator role should use the smallest relevant validation command.

Preferred order:

1. commands listed in `.task/<task-id>/context-pack.md`
2. commands implied by the changed files
3. project defaults from docs or config
4. generic fallback checks

Validation may include build, compile, unit tests, lint, type checks, smoke checks, or documentation checks. For documentation-only changes, a smoke test is often unnecessary unless the task or project rules require it.

## 11. Managed Ownership And Sync

Generated OpenCode files are tracked through `.harness/manifest.json` when installed by the harness.

For this MVP, manifest ownership and generated-file fallback still apply even though the default posture is plugin-first.

Safe behavior:

- local edits are reported, not overwritten silently
- missing managed files are reported
- render-input drift is surfaced as a conflict
- force-style replacement must be explicit

Operational notes:

- if a plugin entry and a file entry share the same name, the plugin entry may win
- if both an explicit plugin entry and `.opencode/plugin/` auto-discovery load the same plugin, the current prototype remains acceptable because its config hook is idempotent
- command smoke may report `NOT_RUN` with evidence when the local OpenCode CLI is unavailable or lacks `--command` support; at least one capable environment should still run `opencode run --command harness-pathway-prototype` before closing MVP runtime validation work

Use this flow:

```powershell
harness diff
harness sync
harness doctor
```

For general upgrade guidance, see [docs/GUIDELINES.md](./GUIDELINES.md#11-upgrade-and-sync).

## 12. Privacy And Versioning

Treat `.opencode/` as local/private until your team decides what should be shared.

Before committing generated or customized OpenCode files:

- remove usernames and absolute local paths
- remove secrets and internal URLs
- review permission settings
- confirm the team wants shared command and agent behavior

For this framework repository itself, follow `.opencode/README.md` and the root `AGENTS.md`. Self-only OpenCode files must not be copied into target-project templates.
