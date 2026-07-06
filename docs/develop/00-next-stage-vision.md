# Marionettist Next-stage Vision

This document records the next-stage direction for Marionettist after the current OpenCode Pathway and onboarding work. It supplements the earlier long-form roadmap in `marionettist-future-roadmap.md`; it does not replace that historical planning material.

## Current status

Marionettist is already a practical, long-used agent harness for coding work. It provides repository-local rules, task context, checkpoints, review gates, validators, model-role configuration, and safe framework-managed updates.

The current baseline is not a greenfield prototype waiting for first proof. The Harness is already usable, the mid-term capability set is already substantial, and no large blocking defects are currently known. Small bugs and workflow rough edges should still be expected, but they can be tracked, triaged, and fixed gradually through normal dogfooding work.

The project was previously known as `universal-ai-harness-framework`. The current repository and package identity are `marionettist`, with OpenCode as the first documented Pathway.

## Next-stage positioning

Marionettist should keep extending from a coding-focused harness toward an **Agent Workflow Harness**: a broader direction for disciplined agent workflows across coding, writing, research, and operations.

This does not mean using the most expensive model for every task or building a heavy platform. The preferred direction is:

- choose models by task role;
- use workflows, skills, checkpoints, reviews, validators, and artifacts to improve agent output;
- let specialized tools do specialized work;
- constrain and enhance multiple agent platforms through Harness conventions;
- dogfood the Harness on real projects before abstracting.

## Progress framing for this stage

### Short-term focus

- Keep Quill MVP as the mainline pressure field for near-term progress.
- Use real Quill work to discover small Marionettist bugs, friction, and missing polish.
- Fix Marionettist issues immediately only when they actually block Quill MVP progress.
- Record non-blocking issues, workflow pain points, and architecture ideas without treating them as evidence of overall immaturity.

### Existing mid-term foundation

- Marionettist already has a meaningful Harness baseline: task intake, artifacts, review gates, validators, role/model configuration, and framework-managed updates.
- The next stage builds on that foundation rather than re-proving it from scratch.
- Quill dogfooding should refine and extend this baseline with better evidence, not reset roadmap confidence.

### Long-term direction

- Broaden Marionettist toward workflow families beyond coding when real evidence supports it.
- Use Quill and later projects to clarify which workflow/artifact/checkpoint/review primitives are truly reusable.
- Keep shared-foundation decisions evidence-gated until repeated patterns and stable boundaries are clear.

## Next-stage goals

- Continue improving the existing Harness where it directly supports real work.
- Use Quill as a real dogfooding project for the OpenCode Pathway.
- Advance short-term execution without overstating short-term bugs as platform blockers.
- Build on the existing mid-term Harness foundation while collecting long-term workflow-family evidence.
- Explore a Pi plugin adapter in parallel without blocking Quill.
- Collect evidence for a future shared foundation, but do not implement that foundation prematurely.

## What this stage does not do

- It does not create a new shared-core package.
- It does not force Quill MVP to run on Marionettist runtime.
- It does not refactor Marionettist into a heavy all-in-one workflow platform.
- It does not mix writing-workflow business logic into coding workflows.
- It does not treat future architecture goals as already implemented.
- It does not portray Marionettist as blocked on major defects before forward progress can continue.
- It does not commit the project to shared-foundation extraction before evidence exists.

## Why Quill matters

Quill is a local-first workflow CLI for high-quality content production. It is valuable because it exercises non-coding workflows while still needing disciplined planning, artifacts, review, and repair loops.

For the current stage, Marionettist is Quill's development harness. Quill should use `marionettist-pathway-opencode` for development tasks, but Quill MVP must not depend on Marionettist runtime.

## Why Pi is worth exploring

Pi may offer a useful new platform surface for Marionettist Pathways. A small Pi plugin adapter can validate rule loading, role mapping, model mapping, and context behavior without forcing a mainline architecture rewrite.

## Why shared foundation is delayed

Shared foundation work should be evidence-driven. A primitive should be extracted only after it repeats across projects and workflows, survives real tasks, and has stable API boundaries. Until then, the project should document terms, issues, and lightweight conventions rather than build a premature core.
