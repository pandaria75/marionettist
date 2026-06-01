# Current System Map

Use this file to record how the project works today.

This is a current-state document, not a target architecture document. Prefer observed reality over polished theory.

It must not become a code index. List only the files, entrypoints, and flows needed to explain behavior or change risk.

## Scope

- Area or workflow:
- Why this document exists:
- Last substantial verification date:
- Related rules:

## Knowledge Status

- Facts confirmed:
- Inferences needing confirmation:
- Unknowns or missing evidence:

## Entrypoints

List the main starting points for this area.

- Fact:
  - <request handler, CLI command, scheduled job, UI entry, worker trigger, or integration boundary>
- Inference:
  - <likely entrypoint that still needs confirmation>
- Unknown:
  - <possible entrypoint not yet verified>

## Main Call Paths

Summarize only the important paths that explain behavior, side effects, or risk.

1. Fact: <entrypoint> -> <major step> -> <major step> -> <result>
2. Inference: <entrypoint> -> <suspected path>
3. Unknown: <where the path becomes unclear>

## Related Files And Areas

Keep this selective. Include only the files or directories that matter for understanding behavior or making safe changes.

- Fact:
  - `path/to/important-area` - <why it matters>
- Inference:
  - `path/to/possible-area` - <why it might matter>
- Unknown:
  - <missing file, generated source, external dependency, or runtime-only area>

## Implicit Rules And Constraints

Capture rules that appear to shape behavior even if they are not yet formalized elsewhere.

- Fact:
  - <observed compatibility, ordering, data-shape, ownership, or deployment constraint>
- Inference:
  - <suspected rule that needs confirmation>
- Unknown:
  - <constraint that likely exists but is not yet understood>

## High-Risk Areas

- <stateful workflow, legacy dependency, migration boundary, shared component, concurrency edge, or compatibility hotspot>
- Explain why the area is risky and what could break.

## Safe-Change Advice

- Start from these entrypoints or seams:
- Change these areas together when relevant:
- Re-check these behaviors after changes:
- Prefer these low-blast-radius approaches first:
- Escalate or pause when these unknowns remain unresolved:

## Open Questions

- <question>
- <question>

## Target-State Contrast (Optional)

If needed, add only a short note pointing to related `docs/target/...` material.

- Related target doc:
- Why current state differs from target:

## Maintenance Notes

- Update this file when the current behavior, risks, or key paths are clarified.
- Move desired-future design into `docs/target/`, not into this file.
