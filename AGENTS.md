# Universal AI Harness Framework Agent Guide

## Purpose

This repository maintains the reusable AI harness framework used to initialize and upgrade harness files in other projects.

This file governs work on the framework itself. It is not the same as `templates/AGENTS.md`, which is installed into target projects.

## Core Principles

- Keep framework core project-neutral.
- Do not add business-project-specific knowledge to templates, core skills, or CLI defaults.
- Do not hard-code module names, customer names, domain terms, technology stacks, or validation commands from a source project.
- Prefer configuration-driven behavior through `harness.config.yaml`.
- Keep target-project installation safe, repeatable, and reversible.

## Repository Layout

- `bin/` contains CLI entrypoints.
- `src/commands/` contains command implementations: `init` (with interactive prompts from `init-prompts`), `sync`, `diff`, and `doctor`.
- `src/core/` contains reusable CLI helpers: `plan` (builds install/sync plans), `manifest` (reads/writes `.harness/manifest.json`), `managed-block` (split-ownership markers in `AGENTS.md`), `template` (variable rendering), `apply-plan` (writes plan operations), `hash`, `args`, `cli`, `files`, and `framework-paths`.
- `templates/` contains files installed into target projects.
- `skills/` contains framework-managed agent skills copied into target projects.

## Template Policy

- `templates/AGENTS.md` defines target-project agent behavior.
- Root `AGENTS.md` defines framework maintenance behavior.
- Template files must not assume a specific language, build tool, backend framework, frontend framework, or module layout.
- Template files may reference `harness.config.yaml` as the target-project source of local configuration.
- Managed template sections must be safe for `harness sync` to update without overwriting project-local sections.

## Skill Policy

- Core skills must be agent-neutral and usable from Codex, Gemini CLI, OpenCode, or any agent that can read Markdown context.
- Skills must not depend on private MCP implementations.
- Skills may instruct agents to prefer available IDE or local search tools for code lookup.
- `workspace-knowledge-manager` must generate design and architecture knowledge, not code index directories.
- Code indexes, symbol lookup, call-site lookup, and implementation navigation belong to IDE MCP or local search tools, not project docs.

## CLI Policy

- `harness init` must be safe by default and must not overwrite existing project-local content without an explicit force option.
- `harness sync` must update framework-managed files while preserving project-local docs, rules, skills, and task files.
- `harness diff` must show what would change before sync.
- Destructive behavior is forbidden unless explicitly requested by the user and implemented behind clear flags.

## Validation

When changing CLI code, run the relevant Node command or smoke test.

When changing templates or skills, validate that:
- no project-specific terms leaked into core assets
- target-project install paths remain consistent
- sync behavior still preserves project-local content

## Guardrails

- Do not implement broad behavior changes without updating templates and docs consistently.
- Do not mix framework-maintenance rules with target-project harness rules.
- Do not treat generated target-project docs as code indexes.
