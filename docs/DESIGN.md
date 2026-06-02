# Universal AI Harness Framework Design

[中文版](./DESIGN.zh-CN.md)

## 1. Positioning

The harness is a file-based collaboration framework for software repositories.

It is built for teams that want AI assistance to be inspectable, agent-neutral, safe to upgrade, and controlled by explicit workflow gates. It is not a business-project template, not an IDE replacement, and not tied to one agent product.

## 2. Design Principles

### 2.1 Files Are The Collaboration Contract

The main failure mode in AI-assisted work is not bad code generation. It is lost constraints, context drift, and scope expansion.

The harness makes important state durable in repository files:

- `AGENTS.md` — repository entry behavior and workflow priority
- `.aiassistant/rules/*.md` — enforceable constraints
- `docs/**/*.md` — design knowledge and boundary context
- `.task/` — requirement, plan, and coding context artifacts
- `.task/active.json` and task-local `state.json` — runtime workflow state
- `.harness/manifest.json` — framework ownership tracking

Because these are plain files, any agent can read them. They can be reviewed, versioned, and synced across teams.

### 2.2 Skills Are Lightweight Workflow Orchestration

The harness does not use a central orchestration server. Workflow is composed from small reusable skills:

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

This keeps the framework portable. A team can run the same method with plain prompting, with OpenCode, or with another agent environment that reads Markdown.

### 2.3 Gates Matter More Than Automation

The harness deliberately upgrades methodology from "agent keeps going" to "agent advances only through explicit state transitions."

Core gates:
- analysis → coding
- current approved slice → next slice

Within one approved slice, coding may flow directly into review. Outside that boundary, the agent must stop.

For high-risk work, a `harness-critic` role can audit requirements, slices, and validation plans at critic gates — before coding and before declaring work done.

### 2.4 OpenCode Is Optional

The harness core works without OpenCode. The source of truth is always the repository files and the method itself.

OpenCode adds ergonomic scaffolding — slash commands, agent roles, and validator templates — but it is not required.

## 3. Design Goals

### 3.1 Project Neutrality

Core templates, skills, and CLI defaults must not assume a specific business domain, technology stack, repository layout, build tool, or agent runtime. Project-specific knowledge belongs in target-project config, docs, rules, and local skills.

### 3.2 Safe Evolution

The framework must evolve without silently overwriting project-local work. The CLI uses a manifest-aware model:

- `harness init` installs managed assets and writes `.harness/manifest.json`
- `harness diff` computes the write plan without changing files
- `harness sync` updates only safe managed content by default
- `AGENTS.md` is synced by managed block, preserving the local block
- `harness doctor` validates the installed file contract without modifying the project

### 3.3 Minimal Durable Process

The harness captures just enough process to control risk, without ceremony. Three task tiers adapt the workflow to complexity:

- **Tier S**: trivial low-risk change — direct coding and review
- **Tier M**: standard scoped work — analysis and context pack before coding
- **Tier L**: complex or boundary-sensitive work — full requirement, slicing, gates, and review

The methodology is strict about gate transitions but flexible about how much analysis each tier needs.

## 4. Asset Model

### Framework-Managed

Installed from this repository and tracked in `.harness/manifest.json`:
- `templates/AGENTS.md`, `templates/harness.config.yaml`, `templates/docs/project/*`, `templates/rules/*`
- `skills/*/SKILL.md`
- optional `.opencode/*` assets when requested

### Project-Local

Belongs to the target repository team and is preserved by default:
- project-specific docs, rules, and skills
- `.task/` work artifacts
- the local section of `AGENTS.md`
- local `.opencode/` customization not standardized by the framework
- any file not tracked in the manifest

### `AGENTS.md` Split Ownership

`AGENTS.md` uses managed-block markers so the framework can evolve the common section while leaving the project-local section editable:

```html
<!-- harness-kit:start -->
...
<!-- harness-kit:end -->

<!-- project-local:start -->
...
<!-- project-local:end -->
```

## 5. Workflow Model

### Analysis Before Coding

Non-trivial tasks do not start from coding. They start from classification and artifact creation: `requirement.md`, `implementation-plan.md`, `context-pack.md`, and `state.json`.

### Slice-Based Execution

Complex work is split into small slices. Each slice defines goal, allowed scope, forbidden scope, validation, and done criteria. The unit of approval, coding, and review stays small.

### Same-Slice Review

Review is not a separate future phase — it is part of the same execution unit. Implement, validate, and review the same approved slice, then stop at the slice gate.

### Parallel Work Is Optional

The methodology allows parallel-capable slices or groups, but the fallback is always sequential. Parallelism is an optimization, not a prerequisite.

## 6. Knowledge Model

Harness docs are for design knowledge, not source indexes.

Docs capture design intent, architecture direction, workflows, domain concepts, extension points, boundaries, and risk areas. They do not capture file trees, class inventories, function inventories, or call-site indexes. Use IDE tools or local search for code navigation.

Rules enforce behavior. Docs explain meaning. The framework keeps both, but separates them.

Context routing stays file-based:
- start from `docs/project/knowledge-map.md`
- match by area fields (Areas, Tags, Docs, Rules, Read When, Boundaries, Validation)
- walk upward for nearby `MODULE_RULES.md`, `AGENTS.md`, and `HARNESS_RULES.md` when target paths are known

## 7. CLI Model

The CLI is a text-asset installer and synchronizer. It renders framework templates into target projects, detects safe vs unsafe updates, and preserves project-local content by default. It does not manage business knowledge, binary assets, or automatic conflict resolution.

## 8. OpenCode Integration (Optional)

When enabled, the framework installs project-local scaffolding: slash commands, agent role definitions with per-role model assignment, validator guidance, and `opencode.jsonc`.

The primary design value of multi-agent roles is model tiering — assigning the strongest model to analysis and planning, a cost-efficient model to coding and review, and the cheapest reliable model to utility tasks.

See [docs/OPENCODE.md](./OPENCODE.md) for the practical usage guide.

## 9. Non-Goals

The framework does not aim to:
- replace IDE navigation
- generate exhaustive code indexes
- prescribe one engineering stack
- own project-private business knowledge
- delete project-local files by default
- auto-resolve manifest conflicts
- bind the method to one agent vendor
