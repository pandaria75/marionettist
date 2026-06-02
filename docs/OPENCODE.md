# OpenCode With The Harness

[中文版](./OPENCODE.zh-CN.md)

For tech leads and developers using the optional OpenCode scaffolding installed by `harness init --with-opencode`.

OpenCode is recommended but optional. The harness core works without it, using plain repository files, prompts, and installed skills. See [docs/DESIGN.md](./DESIGN.md) for the design rationale.

## 1. What OpenCode Adds

OpenCode wraps the harness workflow with ergonomic improvements:

- **Model tiering.** Assign different models to different harness roles — strongest model for planning, cost-efficient model for coding and review, cheapest model for utility tasks.
- **Slash commands.** Quick entrypoints like `/harness` that route to the correct workflow.
- **Agent roles.** Local role definitions (builder, coder, reviewer, validator) with per-role model and permission settings.
- **Validator scaffolding.** Build, test, and lint guidance that follows the harness workflow.

## 2. Model-Tiering Strategy

The harness workflow naturally splits work across three capability tiers.

| Tier | Profile | Roles | Model Choice |
| --- | --- | --- | --- |
| Think | `think` | builder, planner | Strongest reasoning model available |
| Build | `build` | coder | Capable model with good cost-performance |
| Review | `review` | reviewer, critic | Capable, deterministic model |
| Run | `run` | indexer, validator | Cheapest model that reliably follows instructions |

This separation is the primary reason multi-agent scaffolding exists. It matches model capability and cost to the actual demand of each job.

## 3. Install

```powershell
# During project setup
harness init --with-opencode

# Preview first
harness init --dry-run --with-opencode

# Choose command surface
harness init --with-opencode --opencode-command-surface minimal   # default
harness init --with-opencode --opencode-command-surface standard
harness init --with-opencode --opencode-command-surface advanced
```

You can also set the surface in project config:

```yaml
opencode:
  commandSurface: minimal  # or standard | advanced
```

Legacy `full` remains accepted as an alias for `advanced`.

OpenCode installs also follow the harness distribution modes:

- `embedded` — default and closest to legacy behavior
- `hybrid` — local install with explicit adapter-aware distribution metadata
- `adapter` — adapter-oriented install, still tracked locally for safe sync

The chosen mode is recorded in `.harness/manifest.json` as `distributionMode`. Older projects without that field remain valid, and the CLI reports or infers the effective mode. The field is written only when the user explicitly selects or provides a mode, when the manifest already contains `distributionMode`, or when `harness.config.yaml` specifies `distribution.mode`.

These assets are tracked in `.harness/manifest.json` and participate in `harness diff`, `harness sync`, and `harness doctor`.

## 4. What Gets Installed

- `opencode.jsonc` (project root) — shared runtime setup
- `.opencode/commands/harness.md`, `harness-dev.md`, `harness-docs.md`, `harness-config.md`, `harness-incident.md`
- `.opencode/agents/harness-builder.md`, `harness-coder.md`, `harness-indexer.md`, `harness-planner.md`, `harness-reviewer.md`, `harness-critic.md`, `harness-validator.md`
- `.opencode/README.md`

These are generated managed defaults, not locked product behavior.

The command surfaces are:

- `minimal`: `/harness`, `/harness-dev`, `/harness-incident`, `/harness-docs`, `/harness-config`
- `standard`: minimal plus `/harness-context`, `/harness-status`, `/harness-continue`
- `advanced`: standard plus `/harness-feature`, `/harness-bugfix`, `/harness-refactor`

The design intent is builder-first usage: most teams should start from `/harness` and only expose more wrappers when they improve team ergonomics.

## 5. How OpenCode Fits The Harness

OpenCode follows the same harness method:

1. Slash command or prompt starts the flow.
2. Builder classifies the request and runs analysis (Think tier).
3. Builder stops at the analysis gate for non-trivial work.
4. Builder selects the current approved slice.
5. Coder implements that approved work only (Build tier).
6. Reviewer checks the same approved work immediately after coding (Review tier).
7. If critic-gated, critic audits before coding and again before declaring done.
8. Builder stops at the next slice gate.

OpenCode makes this flow easier — it does not weaken the gate model.

## 6. Key Slash Commands

| Command | Purpose |
| --- | --- |
| `/harness` | Default entrypoint. Routes natural-language requests to the correct workflow. |
| `/harness-dev` | Development and implementation work. |
| `/harness-incident` | Evidence-first incident investigation. Stops before coding. |
| `/harness-docs` | Documentation or design work. |
| `/harness-config` | Harness or project workflow configuration. |
| `/harness-status` | Show current task state without modifying files. |
| `/harness-continue` | Continue the active task according to task state. |

## 7. Agent Roles

| Agent | Responsibility | Profile |
| --- | --- | --- |
| `harness-builder` | Primary orchestrator. Reads state, enforces gates, routes subagents. | `think` |
| `harness-planner` | Requirements, slices, validation strategy. | `think` |
| `harness-coder` | Implements only the current approved slice or group. | `build` |
| `harness-reviewer` | Reviews scope, boundaries, validation, and docs sync. | `review` |
| `harness-critic` | Audits requirements, plan, and validation at critic gates. | `review` |
| `harness-indexer` | Read-only repository exploration for docs, rules, and entrypoints. | `run` |
| `harness-validator` | Runs build, compile, test, lint and returns diagnostics. | `run` |

## 8. Gate Behavior

OpenCode flows obey the same gates:

- Stop after analysis, before coding.
- Stop after each approved slice or group.

Within the same approved slice, coding and review flow without an extra gate. The user confirms only before the next slice.

If review returns `BLOCKED`, the coder may attempt the smallest repair and retry — up to three total review attempts for that slice. After three blocks, stop and ask the user.

Common continuation prompts: `continue`, `proceed`, `start current slice`, `accept this slice and continue`, `start the next approved slice`.

## 9. Model Profiles And Customization

Agent model values are rendered from the canonical `.harness/model-profiles.yml`, with legacy fallback to `harness.config.yaml` profiles only when the canonical file is absent. The profiles map to skill requirements:

- `reasoning` → `think`
- `coding` → `build`
- `reflective` → `review`
- `utility` → `run`

To adjust models:

1. Update `.harness/model-profiles.yml` first.
2. Let `harness diff` and `harness sync` re-render values into `.opencode/agents/*.md`.
3. Edit agent markdown permissions only for intentional local policy.
4. Avoid duplicating harness agent model or permission values in `opencode.jsonc`.

If a project still relies on legacy `harness.config.yaml` profiles and has not created `.harness/model-profiles.yml`, sync restores the canonical file from the effective legacy values so generated OpenCode artifacts and the canonical source stay aligned. `harness doctor` reports whether expected model values came from the canonical file or the legacy fallback, and flags drift in generated artifacts.

Keep validator and reviewer `temperature` low for deterministic output. Tier 3 agents (indexer, validator) need fewer permissions than Tier 1 agents.

## 10. Managed Artifact Ownership And Safe Sync

For target-project OpenCode assets, the source of truth is `templates/opencode/**` in the framework.

Managed OpenCode manifest entries record adapter-aware metadata such as:

- `adapter: "opencode"`
- `commandSurface`
- `templateHash`
- `renderedHash`
- legacy `hash`, retained as a compatibility fallback for older installs

Comparison uses `renderedHash ?? hash` so legacy manifests still participate in safe sync.

Safety behavior:

- local modifications are protected and reported, not silently overwritten
- missing generated files are reported as missing managed files
- render-input drift is surfaced as conflicts when the generated output no longer matches the recorded rendered hash
- orphaned managed entries remain visible as orphan-managed records until the project chooses how to clean them up
- force semantics are explicit; managed replacement requires an intentional force path rather than silent overwrite

This means `harness diff` is the preview step, `harness sync` applies only safe managed updates, and `harness doctor` helps explain drift and ownership state.

## 11. Validator Behavior

The validator template adapts to the project type (Gradle/Kotlin, Maven, Node.js, Python, or generic fallback).

Runtime behavior:
- Prefer validation commands from `.task/<task-id>/context-pack.md` when available.
- Otherwise choose the smallest relevant command for the current slice.
- Keep long-running validation artifacts under `.harness/tmp/harness-validator/<run-id>/`.

## 12. Privacy And Versioning

- Treat `.opencode/` as local/private until your team decides what to standardize.
- Add it to `.gitignore` if you want fully local customization.
- Version only the files your team wants to share.
- Scrub usernames, absolute paths, secrets, and internal URLs before sharing agent files.
