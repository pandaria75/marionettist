# Harness Workflow

This project uses a lightweight file-based harness so requirements, knowledge routing, implementation slices, and execution context stay visible in normal repository files. The goal is to keep repository-agent work reproducible without adding a separate workflow system.

## Standard Task Flow

This project uses a branched harness workflow based on task complexity:

1. **Tier S (Minor)**: Skip `.task/` documents and gates. Direct coding and review.
2. **Tier M (Standard)**: Analysis plus task-scoped `.task/<yyyy-MM-dd>/<task-slug>/context-pack.md` before coding. `requirement-freezer` is optional and only used when behavior or business rules are unclear.
3. **Tier L (Complex)**: Full mandatory harness with analysis, approved slice execution, automatic slice review, and finalization.

For Tier M and L, the agent must complete phases in order and must not automatically cross analysis or inter-slice gates.

### Analysis Phase

The agent may perform any of the following as needed:
- use `task-intake` to classify the task and identify the next harness step
- use `requirement-freezer` when business rules, expected behavior, compatibility, or scope need stabilization
- use `workflow-inspector` when execution flow or workflow impact is important
- use `module-inspector` when module ownership, modifiability, or dependency direction is unclear
- use `implementation-slicer` to convert requirements or goals into slices
- use `context-pack-builder` to create `.task/<yyyy-MM-dd>/<task-slug>/context-pack.md` before coding

**Bugfix Fast-Track**: For bug fixes, the analysis phase is considered complete once a failing test case or clear reproduction steps are confirmed. Formal requirement freezing is usually bypassed unless expected behavior is unclear.

The analysis phase may produce:
- `.task/active.json`
- `.task/<yyyy-MM-dd>/<task-slug>/requirement.md`
- `.task/<yyyy-MM-dd>/<task-slug>/implementation-plan.md`
- `.task/<yyyy-MM-dd>/<task-slug>/context-pack.md`
- `.task/<yyyy-MM-dd>/<task-slug>/state.json`

When analysis is complete, the agent must stop and wait for explicit user confirmation before starting coding, except Tier S.

### Coding Phase

The agent must code only from the approved context pack and approved implementation slice or approved parallel slice group.

For complex tasks, the approved implementation plan may define `parallel-capable` slices or approved parallel slice groups. This is optional planning metadata, not a requirement that every agent must run in parallel.

The agent may complete temporary substeps inside the current approved slice or group without asking again, for example:
- editing multiple files inside the same approved slice
- local refactoring required only for that slice
- running validation commands for that slice
- fixing slice-local test failures

When a confirmed parallel slice group is active:
- agents with subagent or safe parallel execution support may execute the group members concurrently
- agents without that capability must execute the same group members sequentially in the declared fallback order
- the primary agent remains responsible for merging results, resolving conflicts, and running group validation

When the current coding slice is complete, the agent must automatically perform review for that same slice before stopping at the slice gate.

When the current approved work is a parallel slice group, the agent must stop only after the whole approved group is complete, merged, validated, and reviewed, then wait for explicit user confirmation before the next slice or group.

If review fails for the current slice or group, the agent may plan the smallest slice-local fix, apply it, and re-run review. Stop for user decision if the same slice or group is still blocked after 3 total review attempts.

When all approved coding slices and groups are complete, the agent must stop with a final validation and review summary.

Validation levels are:
- slice validation: checks the current slice only
- group validation: checks all members of the approved parallel group after merge or sequential fallback execution
- final validation: checks the full approved implementation after slice review is complete
- review validation: records boundary-reviewer findings and any remaining validation gaps

### Review Phase

Review for the current approved slice or group starts automatically after implementation. A separate user confirmation is not required between coding and review for the same approved slice or group.

Review includes:
- boundary review
- scope check against allowed and forbidden modifications
- rule conflict check
- validation status check
- docs, rules, and knowledge-map sync decision

## Human Confirmation

Humans must confirm blocking business questions, scope tradeoffs, protected-area changes, compatibility breaks, and any requirement that cannot be inferred from existing code, docs, or rules.

The agent must also stop at these harness gates:
- after the analysis phase is complete, before coding starts
- after each coding slice or approved parallel group has completed coding and review, before the next slice or group starts

Do not stop between small analysis steps such as intake, requirement freezing, inspection, slicing, and context-pack creation. Do not stop for temporary implementation substeps inside a coding slice, such as file batches, local test fixes, or slice-local refactoring.

## Mandatory Gate Behavior

At each harness gate, the agent must output a short gate report with all of the following fields:
- `Phase`
- `Completed Work`
- `Files Created or Changed`
- `Validation Status`
- `Recommended Next Step`
- `User Confirmation Required`

When the completed work is a parallel slice group, the gate report must also state the group name, member slices, execution mode used, fallback order if used, shared files, and merge owner.

The final line must be exactly:

`User confirmation required to continue.`

## Priority Rule

This harness workflow overrides any general default behavior that would otherwise continue automatically from analysis to coding or from one coding slice to the next. Coding may continue automatically into review only for the currently approved slice or group.

If instructions conflict, the agent must follow the harness gates unless the user explicitly overrides them.

## Trivial Task Exception (Tier S)

A task is Tier S only if it is a single low-risk change with clear scope, no boundary ambiguity, no workflow impact, and no need for task documents. If any of those conditions is not clearly true, treat the task as non-trivial.

## Agent Automation

Repository agents may inspect files, classify questions, write task docs, build context packs, slice implementation work, apply scoped code changes, run validation commands, and review diffs against allowed scope within the currently confirmed phase. They must not automatically cross from analysis to coding or from one coding slice or group to the next. They may automatically cross from coding into review only for the current approved slice or group.

## Agent Capability And Parallel Fallback

Parallel execution is optional and capability-dependent. For single-agent environments, it refers to processing independent file groups continuously within one approved coding phase.

Preferred uses for parallel execution:
- parallel exploration during analysis
- independent module or workflow inspection
- independent investigation of logs, tests, or call paths
- implementation of disjoint files inside an approved parallel slice group

Do not use parallel execution for:
- trivial or low-risk tasks
- shared-file edits without a clear merge owner
- SQL or data migration steps that require strict ordering
- public API or contract changes without an explicit serial owner
- architecture-sensitive refactors without a dependency graph

If the current agent does not support subagents, or cannot safely coordinate parallel execution, it must execute the same approved work sequentially in dependency order.

`parallel-capable` means optional parallelism with a required sequential fallback, not a mandatory parallel execution model.

## Knowledge Policy

Docs explain design, architecture, functional behavior, workflow, and boundaries.

Docs must not become source-code indexes. Use IDE tools or local search for code navigation.

Rules define enforceable constraints. When adding, moving, renaming, or deleting docs or rules, update `docs/project/knowledge-map.md`.

## File Roles

- `AGENTS.md` defines repository-level workflow and constraint priority.
- `.aiassistant/rules/*.md` contains enforceable agent constraints.
- `docs/**/*.md` contains project knowledge and architecture explanations.
- `docs/project/knowledge-map.md` is the routing index for ownership, docs, rules, and boundary notes.
- `.task/active.json` selects the current task and records phase, gate, and next-command summary.
- `.task/<yyyy-MM-dd>/<task-slug>/requirement.md` freezes task requirements.
- `.task/<yyyy-MM-dd>/<task-slug>/implementation-plan.md` defines executable implementation slices.
- `.task/<yyyy-MM-dd>/<task-slug>/state.json` records durable task phase, status, gates, files, and current slice.
- `.task/<yyyy-MM-dd>/<task-slug>/context-pack.md` contains the compact context for the current coding slice or approved parallel group.

Use the local task date for `<yyyy-MM-dd>`, for example `.task/2026-04-28/`. Keep task docs concise. Prefer references and distilled summaries over copying full source documents.

Legacy `.task/context-pack.md` is supported only as a migration fallback. Prefer the active task directory for all new context packs.
