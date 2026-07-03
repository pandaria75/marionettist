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

## Roadmap and decision anchors

Use this protocol together with the surrounding next-stage material:

- `00-next-stage-vision.md` for the overall dogfooding direction and Quill-vs-runtime boundary.
- `05-project-sequencing.md` for phase order and project priority.
- `06-issue-plan.md` for roadmap items #8 and #9 that track this protocol and blocker triage work.
- `07-open-questions.md` for questions that should stay open until Quill MVP evidence exists.
- `08-decision-record.md` for ADR-001 and ADR-002, which require Quill to dogfood Marionettist without becoming runtime-dependent.

## Feedback classification

When Quill development exposes Marionettist issues, classify them as:

| Class | Meaning | Action |
| --- | --- | --- |
| `blocking` | Prevents Quill MVP progress | Fix Marionettist immediately |
| `non-blocking` | Hurts developer experience but does not stop MVP | Create Marionettist issue and roadmap it |
| `architecture-idea` | Improves design but is not needed for MVP | Record for later evaluation |
| `future-work` | Useful after Quill MVP stabilizes | Track in future roadmap |

## Feedback recording protocol

Every Marionettist issue found during Quill work should become a GitHub issue or a consciously deferred note with the same minimum fields:

| Field | What to record |
| --- | --- |
| Classification | One of `blocking`, `non-blocking`, `architecture-idea`, or `future-work` |
| Quill workflow stage | Which step exposed the problem: `brief`, `sources`, `outline`, `draft`, `review`, `final`, or supporting development work such as planning/coding/review/validation |
| Marionettist workflow area | The Harness area involved, such as task intake, artifact tracking, review gates, validation, model-role mapping, or docs |
| Reproduction / evidence | The smallest reproducible scenario, relevant task artifacts, logs, screenshots, or command output |
| Impact on Quill MVP | What work is slowed, blocked, or merely made less efficient |
| Workaround | Current workaround if one exists, or an explicit note that none is known |
| Triage decision | Whether to fix now, record for roadmap, hold as architecture idea, or defer as future work |

When evidence is weak, record the uncertainty instead of upgrading it to a blocker. When evidence is strong, keep the report narrow enough to restore Quill progress without silently expanding into unrelated Marionettist redesign.

## Blocker triage rules

Treat a problem as `blocking` only when it directly prevents Quill MVP progress under the accepted next-stage constraints in `00-next-stage-vision.md` and `08-decision-record.md`.

### Fix Marionettist immediately when the issue:

- stops Quill work from advancing through the current MVP workflow;
- makes required Marionettist task artifacts, review gates, or validation unusable for the current slice of Quill work;
- has no practical workaround that keeps Quill moving with acceptable discipline;
- conflicts with ADR-001 or ADR-002 in a way that prevents Quill from using Marionettist as a development harness.

### Record for later when the issue:

- is painful but still has a workable manual path;
- points to a cleaner architecture, shared-core extraction, or broader workflow abstraction not required for the next Quill step;
- would mainly improve future Pi adapter work, future workflow families, or post-MVP optimization;
- belongs to unresolved questions already captured in `07-open-questions.md`.

## Blocker handling

If a Harness issue blocks Quill MVP, Marionettist work takes priority until the blocker is removed. The fix should be minimal, validated, and scoped to restoring Quill progress.

## Non-blocking issue handling

Non-blocking issues should become GitHub issues with the protocol fields above, including affected workflow stage, reproduction/evidence, workaround, and explicit triage decision.

## Triage outcomes by class

- `blocking`: fix the smallest Marionettist problem that unblocks Quill, then continue Quill MVP work.
- `non-blocking`: file the issue, link the evidence, and keep Quill moving.
- `architecture-idea`: capture the design idea and link it to later evaluation in `07-open-questions.md` or future roadmap work.
- `future-work`: record it as intentionally deferred until Quill MVP stabilizes or later phases in `05-project-sequencing.md` begin.

## Patterns that may feed back into Marionettist

Quill may later provide evidence for stable primitives such as:

- workflow family definitions;
- article artifact tracking;
- checkpoint result formats;
- review / repair loops for prose;
- model roles for planning, drafting, reviewing, and polishing;
- run logs for dogfooding projects.

These patterns should feed back only after real Quill usage proves they are stable.
