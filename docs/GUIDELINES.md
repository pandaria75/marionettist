# Universal AI Harness Framework Usage Guide

[中文版](./GUIDELINES.zh-CN.md)

For tech leads and developers using the harness day-to-day in a target project. Covers installation, task workflows, gates, skills, and practical prompts.

For the underlying design, see [docs/DESIGN.md](./DESIGN.md).

## 1. Quick Start

```powershell
# Preview the install plan
harness init --dry-run

# Interactive install
harness init

# Recommended: install with OpenCode scaffolding
harness init --dry-run --with-opencode
harness init --with-opencode
```

After init, do these things:

1. Run `workspace-knowledge-manager init` to create the first project knowledge documents.
2. Adjust `harness.config.yaml`, rules, and `docs/project/knowledge-map.md` for the real project.
3. Fill the `project-local` block in `AGENTS.md` with team-specific rules.
4. If OpenCode is installed, adjust agent models through `.harness/model-profiles.yml`.

## 2. What You Get After Init

Core files:
- `AGENTS.md` — repository entry behavior
- `harness.config.yaml` — project config
- `docs/project/harness-workflow.md` — task state contract
- `docs/project/knowledge-map.md` — knowledge routing
- `.aiassistant/rules/*.md` — enforceable constraints
- `.agents/skills/*/SKILL.md` — workflow skills
- `.task/` — task artifacts (local, not managed)
- `.harness/manifest.json` — framework ownership tracking

Default safety behavior:
- Existing project-local files are preserved.
- `AGENTS.md` updates only the managed block.
- Future framework upgrades use the manifest to decide what is safe.

During interactive `harness init`, the CLI asks per existing file whether to backup, overwrite, or skip. Use `--auto` to skip all existing files; add `--force` to overwrite them.

### Install Distribution Modes

`harness init` supports three install/distribution modes:

- `embedded` — default for new installs and the closest match to legacy behavior
- `hybrid` — local harness install plus explicit adapter-aware distribution metadata
- `adapter` — adapter-oriented install with the same local safety tracking

The chosen mode is recorded in `.harness/manifest.json` as `distributionMode` and mirrored in `harness.config.yaml` under `distribution.mode` for readability. Legacy installs without manifest `distributionMode` remain valid; `harness diff`, `harness sync`, and `harness doctor` report or infer the effective mode. The field is written only when the user explicitly selects or provides a mode, when the manifest already contains `distributionMode`, or when `harness.config.yaml` specifies `distribution.mode`.

## 3. The Working Model

The harness is a controlled sequence, not free-form continuous coding.

```text
task-intake
  -> requirement-freezer
  -> module-inspector / workflow-inspector
  -> implementation-slicer
  -> context-pack-builder
  -> coding
  -> boundary-reviewer
  -> workspace-knowledge-manager review
```

Not every step is needed for every task. The harness trims the process by tier.

## 4. Task Tiers

### Tier S — Trivial, Low-Risk

One small change with clear scope. Examples: typo fix, comment update, single-file config tweak.

Flow: `coding -> boundary-reviewer`

```text
This is a Tier S change.

Task: <description>

Requirements:
- Modify only relevant files.
- Do not expand scope.
- Preserve existing style.
- Summarize validation when done.
```

### Tier M — Standard Scoped Work

Work needing analysis before safe coding. Examples: feature touching a few files, bugfix needing code-path inspection, refactor with clear boundaries.

Flow: `task-intake -> module/workflow-inspector (when needed) -> context-pack-builder -> coding -> boundary-reviewer`

Minimum rule: create `.task/<task-id>/context-pack.md` before coding.

```text
I need to handle a standard task:

<task description>

Follow the current repository harness workflow.
Start with task-intake.
Create .task/<task-id>/context-pack.md before coding.
Do not start coding yet.
```

### Tier L — Complex or Boundary-Sensitive Work

Unclear requirements, cross-module changes, public contract changes, high-risk refactors, or staged delivery.

Flow: full `task-intake` through `workspace-knowledge-manager review`

Minimum rule: code only from an approved slice.

```text
I need to handle a complex task:

<task description>

Follow the current repository harness workflow.
Start with task-intake.
If requirements or boundaries are unclear, use requirement-freezer.
Create an implementation plan and .task/<task-id>/context-pack.md before coding.
Do not start coding yet.
```

## 5. Gates

For non-trivial work, gates are mandatory. The agent must stop at:
- end of analysis, before coding
- end of each approved slice or approved parallel group

The agent may move directly from coding into review only for the same approved slice. It must not continue into the next slice automatically.

Recommended gate report:

```text
Phase:
Completed Work:
Files Created or Changed:
Validation Status:
Recommended Next Step:
User confirmation required to continue.
```

## 6. Core Skills

| Skill | When to Use | Output |
| --- | --- | --- |
| `task-intake` | Default entry into non-trivial work | Classification, next step |
| `requirement-freezer` | Unclear requirements or boundaries | `.task/<task-id>/requirement.md` |
| `module-inspector` | Understanding a module, package, or boundary | — |
| `workflow-inspector` | Understanding execution flow or orchestration | — |
| `implementation-slicer` | Splitting complex work into small slices | `.task/<task-id>/implementation-plan.md` |
| `context-pack-builder` | Building minimum working context before coding | `.task/<task-id>/context-pack.md` |
| `boundary-reviewer` | Immediate review of the same approved slice | `PASS`, `PASS_WITH_WARNINGS`, or `BLOCKED` |
| `workspace-knowledge-manager` | Creating or maintaining design docs and knowledge | — |

## 7. Core Task Artifacts

| Artifact | Path | When |
| --- | --- | --- |
| Requirement | `.task/<task-id>/requirement.md` | Tier L or ambiguous work |
| Implementation Plan | `.task/<task-id>/implementation-plan.md` | Tier L sliced work |
| Context Pack | `.task/<task-id>/context-pack.md` | Tier M or L before coding |

Each slice in the implementation plan defines: goal, allowed scope, forbidden scope, validation, and done criteria.

## 8. Practical Prompts

### New Feature

```text
I want to build a new feature:

<requirement description>

Follow the current repository harness workflow.
Start with task-intake.
Do not start coding yet.
```

### Bugfix

```text
I need to fix a bug:

Observed: <actual behavior>
Expected: <expected behavior>
Reproduction: <steps>
Evidence: <logs, failing test, screenshot, or other evidence>

Follow the current repository harness workflow.
Start with task-intake.
Prioritize confirming the reproduction path or failing test.
Create .task/<task-id>/context-pack.md before coding.
Do not start coding yet.
```

### Refactor

```text
I need to perform a refactor:

Goal: <refactor goal>
Behavior that must stay unchanged: <constraints>
Allowed modification scope: <scope>
Forbidden modification scope: <scope>

Follow the current repository harness workflow.
Analyze boundary and workflow impact first.
Do not start coding yet.
```

## 9. Docs And Rules

Keep the separation:
- **Docs** explain design meaning.
- **Rules** enforce behavior.

Docs capture responsibilities, workflows, domain concepts, boundaries, and risk areas. Docs should not become code indexes.

When docs or rules are added, moved, renamed, or deleted, update `docs/project/knowledge-map.md`.

## 10. Optional OpenCode

OpenCode is optional but recommended for faster repeated harness execution. It adds builder-first slash commands, local agent roles with per-role model assignment, and validator scaffolding.

OpenCode command surfaces are:

- `minimal` — default: `/harness`, `/harness-dev`, `/harness-incident`, `/harness-docs`, `/harness-config`
- `standard` — minimal plus `/harness-context`, `/harness-status`, `/harness-continue`
- `advanced` — standard plus `/harness-feature`, `/harness-bugfix`, `/harness-refactor`

Legacy `full` remains accepted as an alias for `advanced`.

See [docs/OPENCODE.md](./OPENCODE.md) for the full guide.

## 11. Upgrade And Sync

```powershell
# Preview changes before applying
harness diff

# Apply safe updates
harness sync
harness sync --dry-run
```

Local task artifacts, docs, rules, and skills are preserved by default. `AGENTS.md` updates only the managed block. Local modifications and conflicts are reported, not silently overwritten.

For OpenCode-generated managed artifacts, the source of truth is the framework template under `templates/opencode/**`. The manifest tracks ownership metadata, including rendered hashes. `harness diff` reports local modifications, conflicts, missing files, and orphaned managed entries; `harness sync` does not silently overwrite local edits. Use force only when you intentionally want managed replacement.
