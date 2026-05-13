# Project Agent Guide

<!-- harness-kit:start -->

## Purpose

This file is the target-project entrypoint for AI agents.

Use it to understand:
- task workflow
- constraint priority
- project knowledge routing
- documentation and review expectations

## Constraint Sources

1. `AGENTS.md`
2. `.aiassistant/rules/*.md`

If constraints conflict, this file takes precedence unless the user explicitly overrides it.

## Knowledge Sources

- `docs/**/*.md` contains project design knowledge, architecture explanations, functional behavior, and workflow notes.
- `docs/project/knowledge-map.md` routes agents to relevant design knowledge.
- Docs are knowledge sources, not stronger constraints than rules.

## Code Lookup Policy

Docs must not be used as a code index.

Use available IDE tools, MCP tools, local search, or direct source inspection for:
- file lookup
- symbol lookup
- call-site lookup
- class or function inventories
- implementation details

## Task Workflow

Read `docs/project/harness-workflow.md` for the detailed workflow.

Default flow:
1. Classify task tier.
2. Complete analysis for non-trivial work.
3. Create or update `.task/context-pack.md` before coding.
4. Implement only the approved slice or group.
5. Stop at required gates for user confirmation.
6. Review scope, rules, validation, and documentation sync needs.

## Documentation Policy

Project docs should explain software design and architecture:
- responsibilities
- functional behavior
- workflows
- domain concepts
- extension points
- boundaries and risks

Project docs should not list every source file, class, function, or implementation detail.

## Harness Sync Policy

Framework-managed sections may be updated by `harness sync`.

Project-local docs, rules, skills, and task files must be preserved unless the user explicitly requests replacement.

<!-- harness-kit:end -->

<!-- project-local:start -->

Add project-specific agent instructions here.

<!-- project-local:end -->
