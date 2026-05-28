# Knowledge Map

This file routes agents and humans to project design knowledge.

It must not become a code index. Do not list every file, class, function, or symbol here.

Docs explain context. Rules enforce constraints. Keep them separate and update this file whenever docs or rules are added, moved, renamed, or deleted.

## Project Overview

- Knowledge Docs:
- Rule Files:
- Scope:
- When To Read:
- Boundary Notes:

## How To Use This File

- Use this file to choose a small set of relevant docs and rules.
- Match the task to one or more knowledge areas by purpose, domain language, workflow, ownership, or validation needs.
- Read only the entries that match the current task.
- Use repository search or source inspection for file and symbol lookup.
- Do not list the whole repository here.

## Knowledge Area Template

Copy this block for each major project area:

```md
### <Area Name>

- Areas:
- Tags:
- Docs:
- Rules:
- Read When:
- Boundaries:
- Validation:
```

## Example Structure

Replace these placeholders with project-local content.

### <Area Name>

- Areas: <functional area, module family, workflow, or bounded subsystem>
- Tags: <short routing keywords>
- Docs:
  - `docs/...`
- Rules:
  - `.aiassistant/rules/...`
  - `AGENTS.md`
- Read When:
  - <when this area is relevant>
- Boundaries:
  - <safety, ownership, layering, or compatibility constraints>
- Validation:
  - <tests, smoke checks, or review expectations>

## Path-Proximity Rule Reminder

When target files are known, agents should also look upward from those paths for local rule files such as:

- `MODULE_RULES.md`
- `AGENTS.md`
- `HARNESS_RULES.md`

Local path rules narrow area-specific behavior, but repository-global safety and boundary rules still take precedence if there is a conflict.
