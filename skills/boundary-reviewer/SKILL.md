---
name: boundary-reviewer
description: Review code changes for boundary violations, rule conflicts, unintended scope expansion, missing validation, and documentation sync requirements. Use after implementation and before commit.
phase: review
model_requirement: reflective
can_edit: false
risk_level: medium
---

# Boundary Reviewer

Use this skill after code changes and before commit or handoff.

## Workflow

1. Inspect the current diff.
2. Read `AGENTS.md`.
3. Read `.task/active.json`, `.task/<task-id>/state.json`, and `.task/<task-id>/context-pack.md` if present. Here `<task-id>` is selected by `.task/active.json`.
4. Read `docs/project/knowledge-map.md`.
5. Read relevant rules and docs for changed areas.
6. Check:
   - allowed scope vs actual changed files
   - forbidden scope violations
   - protected area modifications
   - dependency direction
   - architecture-sensitive changes
   - SQL or data migration risks
   - parallel group shared files, merge owner, fallback order, and group validation when applicable
   - harness gate compliance for analysis, coding slice/group, and review transitions
   - rule conflicts
   - missing validation
   - docs, rules, or knowledge-map sync needs
7. Output review findings only.
8. Do not modify code unless explicitly asked.

## Diff Sources

Prefer these git sources when reviewing changes:
- `git status --short`
- `git diff --stat`
- `git diff`
- `git diff --staged` when staged changes are present

If git is unavailable, state the limitation explicitly in the review output.

## Blocking Criteria

Return `BLOCKED` when:
- a forbidden file or area was modified
- a protected area was modified without explicit user approval
- actual changes exceed `.task/<task-id>/context-pack.md` allowed scope
- a rule in `AGENTS.md` or `.aiassistant/rules` is violated
- destructive SQL or migration risk is detected without explicit approval
- required validation is missing for architecture-sensitive changes
- parallel group work touched shared files without a declared merge owner or conflict resolution rule
- current changes show the task crossed a required harness gate without explicit user confirmation

## Output Format

```md
# Boundary Review Result

## Summary

## Changed Scope

## Violations

### Violation 1
- File:
- Rule:
- Risk:
- Required Fix:

## Warnings

## Missing Validation

## Parallel Group Check

- Applicable:
- Shared Files:
- Merge Owner:
- Fallback Order:
- Group Validation:
- Issues:

## Harness Gate Check

## Documentation Sync Needed

## Final Recommendation

Final recommendation must be one of:

- PASS
- PASS_WITH_WARNINGS
- BLOCKED
```

## Guardrails

- Do not modify code during review.
- Treat rules as constraints and docs as knowledge.
- Do not expand the task scope.
- If a violation is uncertain, report a warning instead of inventing a violation.
