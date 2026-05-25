---
name: workspace-knowledge-manager
description: Build and maintain project design knowledge docs, architecture docs, boundary rules, and knowledge-map routing for frontend, backend, fullstack, monorepo, multi-module, and single-module projects. Use for initializing project docs, refreshing architecture knowledge, or reviewing whether code changes require docs/rules updates.
---

# Workspace Knowledge Manager

Use this skill to create and maintain design-oriented project knowledge.

This skill must not create code index directories or exhaustive source inventories. Code lookup belongs to IDE tools, MCP tools, local search, and direct source inspection.

## Question Classification

Classify uncertainty before writing docs or rules.

### Blocking Questions

Use for unknowns that affect correctness, ownership, scope, terminology, or rule enforceability.

- These questions must stop the workflow.
- Wait for user clarification before writing docs or rules.

### Non-blocking Assumptions

Use when the likely answer can be inferred from code, docs, rules, naming, or existing patterns without creating correctness risk.

- Record these assumptions explicitly in the output.
- Continue after recording them.

### Deferred Questions

Use for helpful follow-up questions that do not affect the current docs or rules correctness.

- These questions must not stop the workflow.
- List them as follow-up items in the output.

## Modes

### init

Use when a project is first connected to the harness.

1. Inspect project configuration and high-level structure.
2. Identify architecture shape:
   - frontend
   - backend
   - fullstack
   - library
   - monorepo
   - multi-module
   - single-module
   - unknown
3. Identify major design areas, functional domains, workflows, and high-risk boundaries.
4. Create or update `docs/project/knowledge-map.md`.
5. Create only high-value design docs and rule files.
6. Do not create one doc per directory unless each directory represents a real design boundary.
7. Keep docs and rules non-overlapping.

### refresh

Use for periodic maintenance.

1. Compare current project behavior, structure, and docs.
2. Update docs only when design meaning changed.
3. Update rules only when enforceable constraints changed.
4. Update knowledge-map routing when docs or rules were added, moved, renamed, or deleted.
5. Keep terminology consistent across docs, rules, and knowledge-map entries.

### review

Use after code changes or before review.

1. Inspect the diff.
2. Decide whether changes affect:
   - architecture
   - public behavior
   - feature design
   - workflow
   - domain concepts
   - module or directory boundaries
   - extension points
   - operational or compatibility constraints
3. Output one of:
   - `Docs Update Required`
   - `Rules Update Required`
   - `No Knowledge Update Needed`
4. Do not update docs automatically unless the user asks for updates.

### topic

Use when the user asks for documentation of a specific feature, workflow, subsystem, or architecture concern.

The target does not need to be a module.

## Docs vs Rules Separation Policy

### Core Principle

- Docs = explain
- Rules = enforce

### Docs Scope

Docs should explain:

- responsibilities and design intent
- architecture and dependency direction
- domain concepts and terminology
- workflows and state transitions
- extension points
- boundary context and risk areas
- compatibility or migration meaning at a high level

Docs must not include:

- rule-style MUST or MUST NOT directives unless needed as brief high-level context
- line-by-line implementation explanation
- source-code indexes, inventories, or generated navigation tables
- content already fully covered by rules

### Rules Scope

Rules should define enforceable constraints:

- MUST and MUST NOT behavior
- boundary constraints
- dependency direction
- forbidden coupling
- required validation
- compatibility guarantees
- documentation sync triggers

Rules must not include:

- narrative background
- broad architecture explanation
- duplicated explanatory content already present in docs

### Strict Requirements

1. No duplication:
   - the same content must not appear in both docs and rules
2. Conflict resolution:
   - rules take priority
   - docs may keep only high-level explanation
3. Routing consistency:
   - when docs or rules are created, moved, renamed, or deleted, update `docs/project/knowledge-map.md`

## Document Scope

Docs should explain:

- product or system capability
- design intent
- architecture and dependency direction
- domain concepts and terminology
- request, event, or task workflows
- state transitions and lifecycle
- extension patterns
- integration boundaries
- compatibility and migration concerns
- high-risk areas and why they are risky

Docs must not include:

- file trees
- class inventories
- function lists
- controller/service/repository mechanical lists
- line-by-line implementation explanation
- information easily recoverable through IDE search
- generated indexes of source locations

## Rules Scope

Rules should define enforceable constraints:

- MUST and MUST NOT behavior
- boundary constraints
- dependency direction
- forbidden coupling
- required validation
- compatibility guarantees
- documentation sync triggers

Rules must not include narrative background or broad architecture explanation.

## Knowledge Map Scope

`docs/project/knowledge-map.md` routes design knowledge.

Each entry should include:

- knowledge docs
- rule files
- scope
- when to read
- boundary notes

Do not include every file, class, function, or symbol.

## Output Format

When creating or updating docs:

```md
# Workspace Knowledge Result

## Mode

## Project Shape

## Created Or Updated Docs

## Created Or Updated Rules

## Knowledge Map Changes

## Blocking Questions

## Assumptions

## Deferred Questions

## Validation Notes
```

When reviewing docs impact:

```md
# Knowledge Review Result

## Recommendation

## Design Impact

## Rules Impact

## Knowledge Map Impact

## Required Updates

## No-Update Rationale
```

## Guardrails

- Base docs on actual behavior and source evidence.
- Prefer fewer, higher-value documents over many shallow documents.
- Ask blocking questions only when design meaning or boundary ownership cannot be inferred.
- Keep docs useful for human and agent understanding.
- Keep code navigation out of docs.
- Keep docs and rules non-overlapping.
- Update `docs/project/knowledge-map.md` whenever routing changes.
