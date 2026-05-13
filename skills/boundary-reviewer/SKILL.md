---
name: boundary-reviewer
description: Review code changes for scope expansion, boundary violations, rule conflicts, missing validation, and knowledge documentation sync needs before commit.
---

# Boundary Reviewer

Use this skill after implementation and before commit or handoff.

## Workflow

1. Inspect current diff.
2. Read `AGENTS.md`.
3. Read `.task/context-pack.md` if present.
4. Read `docs/project/knowledge-map.md`.
5. Read relevant rules and docs for changed areas.
6. Check:
   - actual changed files vs allowed scope
   - forbidden scope violations
   - boundary or dependency direction violations
   - rule conflicts
   - missing validation
   - harness gate compliance
   - design docs or rules sync needs
7. Output findings only unless the user asks for fixes.

## Output Format

```markdown
# Boundary Review Result

## Summary

## Changed Scope

## Violations

## Warnings

## Missing Validation

## Harness Gate Check

## Knowledge Sync Needed

## Final Recommendation
```

Final recommendation must be one of:

- PASS
- PASS_WITH_WARNINGS
- BLOCKED

## Guardrails

- Do not modify code during review.
- Treat rules as constraints and docs as knowledge.
- If uncertain, report a warning instead of inventing a violation.
