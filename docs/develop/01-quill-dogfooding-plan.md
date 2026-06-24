# Quill Dogfooding Plan

## Positioning

Quill is a local-first workflow CLI for high-quality content production. Marionettist is the development harness used to build Quill, not a runtime dependency for Quill MVP.

## Quill MVP mainline

The Quill MVP should focus on a usable article-generation chain:

```text
brief -> sources -> outline -> draft -> review -> final
```

The MVP should establish a practical CLI, minimal docs, workflow shape, style profile support, and article artifacts. It should produce real content before shared abstractions are considered.

## How `marionettist-pathway-opencode` participates

- Use Marionettist task intake for Quill development work.
- Use OpenCode Pathway commands and agents to plan, implement, review, repair, and validate Quill tasks.
- Treat Marionettist artifacts as development harness evidence, not as Quill runtime data.
- Record Harness pain points discovered during Quill work.

## Feedback classification

When Quill development exposes Marionettist issues, classify them as:

| Class | Meaning | Action |
| --- | --- | --- |
| `blocking` | Prevents Quill MVP progress | Fix Marionettist immediately |
| `non-blocking` | Hurts developer experience but does not stop MVP | Create Marionettist issue and roadmap it |
| `architecture-idea` | Improves design but is not needed for MVP | Record for later evaluation |
| `future-work` | Useful after Quill MVP stabilizes | Track in future roadmap |

## Blocker handling

If a Harness issue blocks Quill MVP, Marionettist work takes priority until the blocker is removed. The fix should be minimal, validated, and scoped to restoring Quill progress.

## Non-blocking issue handling

Non-blocking issues should become GitHub issues with clear reproduction context, affected workflow stage, and whether they came from planning, coding, review, validation, artifact tracking, or model-role mapping.

## Patterns that may feed back into Marionettist

Quill may later provide evidence for stable primitives such as:

- workflow family definitions;
- article artifact tracking;
- checkpoint result formats;
- review / repair loops for prose;
- model roles for planning, drafting, reviewing, and polishing;
- run logs for dogfooding projects.

These patterns should feed back only after real Quill usage proves they are stable.
