---
name: module-inspector
description: Perform module-level document lookup and boundary analysis for the repository. Use when a task modifies a module, spans multiple modules, involves unfamiliar ownership, or requires dependency or boundary judgment before implementation.
---

# Module Inspector

Use this skill to inspect module ownership, modifiability, dependency direction, and boundary risks before changing code.

`docs/project/knowledge-map.md` is the routing source for relevant docs and rules. Do not duplicate routing tables inside this skill.

## Workflow

1. Read `docs/project/knowledge-map.md`.
2. Identify the target module, package, feature area, subsystem, or directory from the request, file paths, names, or knowledge-map entries.
3. Identify related areas, cross-area impact, protected areas, restricted areas, and any ownership notes from the knowledge-map and loaded rules.
4. From the knowledge-map, load only the context needed for the target and involved related areas:
   - repository-level rule files required for the task
   - area-specific rule files for involved scope
   - minimum doc files required for the current task
5. Do not load unrelated docs or rules.
6. Inspect source files only when the knowledge-map and loaded docs are insufficient to determine ownership, modifiability, dependency direction, or boundary risks.
7. If ownership or boundaries remain unclear, state the uncertainty explicitly and inspect only the smallest relevant source area before recommending changes.
8. Output the boundary summary using the required format below.

## Required Output Format

```md
# Module Boundary Summary

## Module Scope
- Target area:
- Related areas:
- Cross-area impact:

## Modifiability
- Modifiable:
- Restricted areas:
- Forbidden areas:

## Loaded Context

## Dependency Direction

## Boundary Risks

## Recommended Modification Path
1.
2.
3.

## Uncertainty
- Unresolved ownership or boundary uncertainty:
```

## Guardrails

- Do not duplicate knowledge-map content.
- Do not load unrelated docs.
- Do not treat docs as stronger than rules.
- Use `docs/project/knowledge-map.md` as the routing authority for rule and doc paths.
- When the task spans multiple areas, load every applicable rule file for the involved areas, but load only the minimum doc files required for the current task.
- When adding, moving, renaming, or deleting docs or rules, update `docs/project/knowledge-map.md`.
- Do not implement code.
