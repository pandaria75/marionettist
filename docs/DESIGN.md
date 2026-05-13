# Universal AI Harness Framework Design

[中文版](./DESIGN.zh-CN.md)

## 1. Positioning

Universal AI Harness Framework is a lightweight file-based AI collaboration framework that can be installed into any software project.

It is not a rule set for one business project and it is not a plugin for one specific agent. It provides reusable assets:

- target-project `AGENTS.md`
- project workflow and knowledge-map templates
- project-neutral rules
- Markdown skills readable by multiple agents
- the `harness` Node CLI for `init`, `diff`, and `sync`

The target project gets a stable AI workflow: classify the task, clarify scope, pack the minimum context, implement in slices, then review boundaries and documentation sync needs.

## 2. Design Goals

### 2.1 Project Neutrality

The framework core must stay project-neutral. Templates, skills, and CLI defaults must not assume a specific business domain, language, build tool, module name, or validation command.

Target-project specifics belong in:

- `harness.config.yaml`
- the project-local section of `AGENTS.md`
- target-project `docs/`
- target-project `.aiassistant/rules/`
- target-project `.agents/skills/`

### 2.2 Files As The Collaboration Contract

The main risk in AI-assisted development is not code generation itself. The common failure modes are context drift, scope expansion, and lost constraints.

The harness stores durable context in repository files:

- `AGENTS.md` stores the agent entrypoint rules.
- `.aiassistant/rules/*.md` stores hard constraints.
- `docs/**/*.md` stores design, architecture, behavior, and boundary knowledge.
- `.task/` stores active task requirements, plans, and context packs.
- `.harness/manifest.json` stores framework-managed file ownership.

These files can be versioned, reviewed, migrated, and read by different agents.

### 2.3 Safe Upgrades

The framework can evolve, but existing target-project docs, rules, skills, and task context must not be overwritten by default.

The v1 CLI therefore uses a manifest to track managed ownership:

- `harness init` creates `.harness/manifest.json`.
- `harness diff` prints the change plan without writing files.
- `harness sync` updates only safe framework-managed content.
- `AGENTS.md` sync updates only the managed block and preserves project-local sections.
- `--force` can overwrite only framework-managed files and never deletes project-local files.

## 3. Harness Asset Model

### 3.1 Framework-managed Assets

Framework-managed assets come from this repository:

- `templates/AGENTS.md`
- `templates/harness.config.yaml`
- `templates/docs/project/harness-workflow.md`
- `templates/docs/project/knowledge-map.md`
- `templates/rules/*.md`
- `skills/*/SKILL.md`

After installation, these files are tracked by `.harness/manifest.json`.

### 3.2 Project-local Assets

Project-local assets belong to the target project team:

- target-project design docs
- target-project rules
- target-project skills
- `.task/` task context
- project-local sections in `AGENTS.md`
- any existing file not tracked by the manifest

`init` and `sync` must preserve project-local content by default.

### 3.3 `AGENTS.md` Managed Block

`AGENTS.md` is special. It contains both framework-managed and project-local areas:

```html
<!-- harness-kit:start -->
...
<!-- harness-kit:end -->

<!-- project-local:start -->
...
<!-- project-local:end -->
```

The manifest hash for `AGENTS.md` covers only the managed block. Target projects can maintain the project-local section freely; `harness sync` must not rewrite it.

## 4. Manifest Mechanism

Manifest path:

```text
.harness/manifest.json
```

Format:

```json
{
  "schemaVersion": 1,
  "frameworkVersion": "0.1.0",
  "installedAt": "2026-05-13T00:00:00.000Z",
  "updatedAt": "2026-05-13T00:00:00.000Z",
  "managedFiles": [
    {
      "path": "AGENTS.md",
      "source": "templates/AGENTS.md",
      "kind": "managed-block",
      "hash": "sha256..."
    }
  ]
}
```

Fields:

- `schemaVersion`: manifest format version.
- `frameworkVersion`: framework version used for the install or sync.
- `installedAt`: first install timestamp.
- `updatedAt`: latest manifest write timestamp.
- `managedFiles[].path`: target-project relative path.
- `managedFiles[].source`: source asset path in the framework.
- `managedFiles[].kind`: `file` or `managed-block`.
- `managedFiles[].hash`: SHA-256 of the last installed managed content.

The manifest is the source of truth for sync and diff state decisions. A project without a manifest cannot be synced reliably and should run `harness init` first.

## 5. Managed File State Machine

`harness diff` and `harness sync` use the same state model:

- `unchanged`: local managed content still matches the last installed hash.
- `new-managed`: the current framework ships a new managed asset and the target path is absent.
- `missing`: a previously managed file is absent and can be recreated.
- `update`: local content is unchanged and framework content changed, so sync can update it.
- `modified-local`: local managed content changed while framework content did not; do not overwrite by default.
- `conflict`: both local content and framework content changed since the last manifest; require human judgment.
- `orphan-managed`: the manifest still tracks a file no longer shipped by the current framework; report it and do not delete it.
- `skip-project-local`: the target path exists but is not manifest-managed; preserve it.

The rule is simple: write only when safety can be proven; otherwise report.

## 6. Workflow Design

The harness workflow is extracted from real AI-assisted development practice and generalized:

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

The workflow is trimmed by task complexity:

- Tier S: low-risk minor change; can proceed directly.
- Tier M: standard task; needs analysis and `.task/context-pack.md`.
- Tier L: complex task; needs frozen requirements, inspection, slicing, and gates.

Gates force the agent to stop for user confirmation:

- analysis to coding
- one slice or group to the next
- coding to review

## 7. Knowledge Design

The harness encourages durable design knowledge, not code indexes.

Docs should capture:

- system capabilities and design intent
- architecture and dependency direction
- feature behavior and workflows
- domain concepts
- state lifecycle
- extension points
- integration boundaries
- compatibility and migration constraints
- high-risk areas and why they are risky

Docs must not become:

- file trees
- class inventories
- function lists
- call-site indexes
- mechanical controller, service, or repository lists
- implementation details recoverable through IDE tools, MCP tools, or local search

`workspace-knowledge-manager` creates and maintains design docs, architecture notes, boundary rules, and knowledge routing. It must not generate code index directories.

## 8. CLI Architecture

The CLI is implemented in Node.js. The entrypoint is `bin/harness.js`.

Core modules:

- `src/commands/init.js`: initializes target projects.
- `src/commands/sync.js`: syncs framework-managed assets.
- `src/commands/diff.js`: prints sync plans.
- `src/core/plan.js`: builds manifest-aware file plans.
- `src/core/apply-plan.js`: applies or prints plans.
- `src/core/manifest.js`: reads and writes the manifest.
- `src/core/managed-block.js`: handles `AGENTS.md` managed blocks.
- `src/core/hash.js`: computes content hashes.

The v1 CLI manages text assets only. Binary assets, a remote registry, and plugin distribution are outside the current scope.

## 9. Non-goals

The framework does not:

- replace IDE code navigation
- generate exhaustive code indexes
- prescribe the target project's technology stack
- manage private business-project knowledge
- delete target-project local files
- auto-resolve conflicts
- act as a dedicated plugin for one specific agent

These boundaries keep the framework portable, reviewable, and safer to upgrade.
