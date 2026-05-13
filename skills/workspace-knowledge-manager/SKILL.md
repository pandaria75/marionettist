---
name: workspace-knowledge-manager
description: Build and maintain project design knowledge docs, architecture docs, boundary rules, and knowledge-map routing for frontend, backend, fullstack, monorepo, multi-module, and single-module projects. Use for initializing project docs, refreshing architecture knowledge, or reviewing whether code changes require docs/rules updates.
---

# Workspace Knowledge Manager

Use this skill to create and maintain design-oriented project knowledge.

This skill must not create code index directories or exhaustive source inventories. Code lookup belongs to IDE tools, MCP tools, local search, and direct source inspection.

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

### refresh

Use for periodic maintenance.

1. Compare current project behavior, structure, and docs.
2. Update docs only when design meaning changed.
3. Update rules only when enforceable constraints changed.
4. Update knowledge-map routing when docs or rules were added, moved, renamed, or deleted.

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

```markdown
# Workspace Knowledge Result

## Mode

## Project Shape

## Created Or Updated Docs

## Created Or Updated Rules

## Knowledge Map Changes

## Assumptions

## Deferred Questions

## Validation Notes
```

When reviewing docs impact:

```markdown
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
