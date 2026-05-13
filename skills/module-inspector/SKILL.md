---
name: module-inspector
description: Inspect project knowledge, rules, and source evidence to determine ownership, boundaries, dependency direction, and safe modification scope for a module, package, feature, or directory.
---

# Module Inspector

Use this skill before changes that touch a module, package, feature area, or ownership boundary.

## Workflow

1. Read `docs/project/knowledge-map.md`.
2. Read only relevant docs and rules for the target area.
3. Inspect source only when docs and rules are insufficient.
4. Identify:
   - target scope
   - related scopes
   - allowed modification area
   - forbidden or protected area
   - dependency direction
   - validation expectations
5. Report uncertainty explicitly.

## Output Format

```markdown
# Boundary Summary

## Target Scope

## Related Scope

## Loaded Context

## Allowed Modification Scope

## Forbidden Scope

## Dependency Direction

## Boundary Risks

## Recommended Path

## Uncertainty
```

## Guardrails

- Do not duplicate knowledge-map content.
- Do not load unrelated docs.
- Do not treat docs as stronger than rules.
- Do not implement code.
