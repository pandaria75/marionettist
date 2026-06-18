# Universal AI Harness Framework Usage Guide

[中文版](./GUIDELINES.zh-CN.md)

This guide is for tech leads and developers who want to install and use the harness in a target project.

For design rationale, see [docs/DESIGN.md](./DESIGN.md). For OpenCode usage, see [docs/OPENCODE.md](./OPENCODE.md).

Navigation note:

- start from [docs/README.md](./README.md) for the reorganized documentation entrypoint
- use [docs/user-guide/README.md](./user-guide/README.md) for the shorter task-focused path through setup and daily use

## 1. Install

Install the CLI first:

```powershell
npm install -g github:pandaria75/universal-ai-harness-framework
```

Then run it inside a target project:

```powershell
# Preview first
harness init --dry-run

# Install interactively
harness init

# Optional: include OpenCode commands and agents
harness init --with-opencode
```

During interactive init, existing files are not overwritten silently. The CLI asks whether to back up, overwrite, or skip. Use `--auto` to skip existing files. Use `--force` only when you intentionally want replacement.

## 2. What Init Adds

Typical installed files:

- `AGENTS.md` — repository-level agent behavior
- `harness.config.yaml` — local harness settings
- `docs/project/harness-workflow.md` — task workflow and state contract
- `docs/project/knowledge-map.md` — routing map for project knowledge
- `.aiassistant/rules/*.md` — enforceable constraints
- `.agents/skills/*/SKILL.md` — portable workflow skills
- `.harness/manifest.json` — managed-file ownership record
- optional `.opencode/*` files when installed with OpenCode

After init, a tech lead should usually:

1. Fill the project-local section in `AGENTS.md`.
2. Adjust `harness.config.yaml` for the project.
3. Update `docs/project/knowledge-map.md` to point to real project docs.
4. Add or refine local rules under `.aiassistant/rules/`.
5. If OpenCode is used, review `.harness/model-profiles.yml`.

### Optional: `riskZones`

`riskZones` is an optional config field in `harness.config.yaml` for marking higher-risk project areas.

- Use it to highlight areas such as auth, billing, schema changes, production config, or external API contracts.
- If it is not configured, the harness still works normally.
- Treat it as a lightweight project hint for analysis, documentation, and review. Do not treat it as a fully enforced policy system.

Example:

```yaml
riskZones:
  - name: "auth"
    paths:
      - "src/auth/**"
      - "src/permissions/**"
    notes:
      - "Touches access control and user permissions"
```

## 3. Install Modes

`harness init` supports three distribution modes:

- `embedded` — default; the harness is installed locally in the target repo
- `hybrid` — local install plus adapter-aware metadata
- `adapter` — adapter-oriented install while still tracking local generated files

The selected mode is recorded in `.harness/manifest.json` when applicable. Most teams can start with the default `embedded` mode.

## 4. Daily Workflow

The harness is a controlled sequence:

```text
intake -> analysis/context -> coding -> review -> gate
```

For non-trivial work, the agent should prepare task context before coding. For larger work, it should also freeze requirements and split implementation into slices.

Useful starting prompt:

```text
Follow this repository's harness workflow.

Task: <describe the work>.

Start with task intake and context preparation.
Do not start coding until the analysis gate is approved.
```

With OpenCode:

```text
/harness <describe the work>
```

## 5. Task Tiers

### Tier S — trivial and low-risk

Use for a typo, comment change, or tiny one-file update with no boundary risk.

Expected flow:

```text
coding -> review
```

### Tier M — standard scoped work

Use for a small feature, bugfix, refactor, or documentation task that needs context but has clear boundaries.

Expected flow:

```text
analysis -> context-pack -> coding -> review -> gate
```

Minimum expectation: create or update `.task/<task-id>/context-pack.md` before coding.

### Tier L — complex or sensitive work

Use for cross-area changes, architecture-sensitive refactors, public contract changes, unclear requirements, or staged delivery.

Expected flow:

```text
intake -> requirement -> inspection -> implementation plan -> context-pack -> approved slice coding -> review -> gate
```

Minimum expectation: code only from an approved slice. Use stricter gates unless the user explicitly chooses another allowed posture.

## 6. Gates

For non-trivial work, the agent must stop at these points:

- after analysis, before coding
- after each approved slice or approved group, before moving to the next one

Coding may flow directly into review for the same approved slice. It must not silently continue into unrelated work.

Gate report format:

```text
Phase:
Completed Work:
Files Created or Changed:
Validation Status:
Recommended Next Step:
User confirmation required to continue.
```

### Gate policy modes

Projects can configure gate posture in `harness.config.yaml`:

```yaml
gatePolicy:
  defaultMode: "strict" # strict | balanced | autonomous
  finalApprovalRequired: true
  allowTaskOverride: true
```

- `strict` stops at every normal gate.
- `balanced` keeps main approvals and can reduce friction for already-approved simple continuation.
- `autonomous` allows more continuation inside approved scope, but still preserves required stops.

Gate policy is not OpenCode permission mode. It does not relax dangerous-command rules, forbidden scope, or final approval unless explicitly configured.

For exact gate semantics, use the installed `docs/project/harness-workflow.md` in the target project.

## 7. Task Artifacts

Common task files:

| Artifact | Path | Use |
| --- | --- | --- |
| Active task pointer | `.task/active.json` | Selects the current task and phase |
| Requirement | `.task/<task-id>/requirement.md` | Freezes goals and constraints |
| Implementation plan | `.task/<task-id>/implementation-plan.md` | Defines slices and validation |
| Context pack | `.task/<task-id>/context-pack.md` | Gives the coder the compact approved context |
| State | `.task/<task-id>/state.json` | Records gates, current slice, and status |

Keep these files concise. Prefer links and distilled context over copying large source files.

## 8. Practical Prompts

### Feature

```text
I want to build a feature:

<requirement>

Follow the current repository harness workflow.
Start with task intake.
Do not start coding yet.
```

### Bugfix

```text
I need to fix a bug:

Observed: <actual behavior>
Expected: <expected behavior>
Reproduction: <steps or evidence>

Follow the current repository harness workflow.
Confirm the reproduction path or failing test before coding.
```

### Refactor

```text
I need to refactor:

Goal: <goal>
Behavior that must stay unchanged: <constraints>
Allowed scope: <files or areas>
Forbidden scope: <files or areas>

Follow the current repository harness workflow.
Analyze boundary impact first.
Do not start coding yet.
```

### Documentation

```text
I need to update documentation:

Audience: <reader>
Goal: <what the docs should explain>
Files: <target docs>

Follow the docs workflow.
Keep language concise and avoid turning docs into code indexes.
```

## 9. Docs And Rules

Keep the separation clear:

- **Docs** explain design, responsibilities, workflows, boundaries, and risks.
- **Rules** define constraints agents must follow.

Docs should not list every file, class, function, or call site. Use IDE tools or local search for code navigation.

When docs or rules are added, moved, renamed, or deleted, update `docs/project/knowledge-map.md`.

## 10. OpenCode

OpenCode is optional. The harness still works through files, prompts, and skills without it.

Use OpenCode when you want:

- `/harness` and focused slash commands
- local role agents such as builder, coder, reviewer, validator
- model profiles by role
- generated validator guidance

See [docs/OPENCODE.md](./OPENCODE.md) for setup and usage.

## 11. Upgrade And Sync

Preview changes before applying them:

```powershell
harness diff
```

Apply safe managed updates:

```powershell
harness sync
harness sync --dry-run
```

Check the install:

```powershell
harness doctor
```

Local task artifacts, local docs, local rules, and local skills are preserved by default. `AGENTS.md` updates only the managed block. Conflicts are reported instead of being overwritten silently.

## 12. Clear And Re-Init

Use `harness clear` when you want to remove framework-managed files before a clean reinstall or migration. `harness uninstall` is an alias.

Preview first:

```powershell
harness clear
harness clear --scope opencode
```

Apply only when you are ready to remove managed assets:

```powershell
harness clear --apply
harness uninstall --scope all --apply
```

- Default mode is preview only. No files change unless `--apply` is present.
- `--scope all` removes all manifest-managed harness assets that still exist.
- `--scope opencode` removes only manifest-managed files recorded with the OpenCode adapter; it does not infer ownership from `.opencode/` paths alone.
- Apply mode writes backups under `.harness/backups/<timestamp>/` before each file removal or `AGENTS.md` managed-block edit.
- `AGENTS.md` is not deleted wholesale. Clear removes only the harness-managed block and preserves project-local sections.
- If `AGENTS.md` contains only the managed block, clear keeps a safe `# AGENTS` placeholder file instead of deleting it.
- Apply is not atomic across all targets. If a later backup or delete step fails, earlier targets may already be backed up and removed. Use the backup folder to restore as needed.
- Current apply failures surface the underlying filesystem error directly. Treat that output as the immediate recovery clue.

Typical migration flow:

```powershell
# 1) Preview what clear would remove
harness clear --scope all

# 2) Apply clear after reviewing the preview
harness clear --scope all --apply

# 3) Reinstall the harness cleanly
harness init --with-opencode
```

Run apply only in the target project you intend to clean. The command refuses manifest targets that escape the project root, including symlink targets that resolve outside the workspace.

## 13. Common Pitfalls

- Do not treat `harness init` as safe to run blindly in this framework source repo. Use self commands here.
- Do not start coding for non-trivial work before the analysis gate is approved.
- Do not use docs as a source-code index.
- Do not confuse gate policy with OpenCode permission mode.
- Do not put project-private rules into framework templates.
- Do not force sync unless the team intentionally accepts managed replacement.
