# Delayed Shared Foundation Strategy

## Summary

Marionettist may eventually become a shared foundation for multiple workflow families, but this stage should not extract a shared core. The correct near-term work is documentation, terminology alignment, lightweight conventions, and evidence collection through Quill dogfooding.

## Why not now

- Quill has not yet produced real MVP feedback.
- Writing workflows may need different artifacts and quality rules from coding workflows.
- Premature abstractions could slow both Quill and Marionettist.
- API boundaries are not yet stable.
- Tests and migration plans for a core package do not exist yet.

## Possible future shared primitives

- task routing;
- workflow execution concepts;
- artifact tracking;
- checkpoints;
- review / repair loops;
- model-role mapping;
- context loading;
- run logs;
- platform adapter conventions.

## Extraction criteria

A primitive is eligible for shared-foundation extraction only when:

1. the same mechanism appears in at least two projects;
2. the same mechanism is used by at least three workflows;
3. it has been validated by real tasks;
4. extraction will not slow short-term Quill or Marionettist iteration;
5. API boundaries are relatively stable;
6. tests and migration strategy are clear.

## Current allowed work

- document design options;
- create roadmap issues;
- align terminology;
- define lightweight run log, artifact, and checkpoint conventions;
- collect dogfooding evidence from Quill.

## Current non-goals

- Do not create `@pandaria/workflow-core`.
- Do not create `@pandaria/marionettist-core`.
- Do not force Quill to depend on Marionettist.
- Do not rewrite the Harness architecture.
- Do not build a large workflow platform.

## Relationship to Quill

Quill owns writing-specific logic: article style, prompt templates, article artifacts, Markdown / article IR / article AST, platform output strategy, and writing quality rules. Stable workflow primitives may later feed back into Marionettist.

## Relationship to coding workflows

Coding workflows should remain focused on feature development, bugfix, review, refactor, validation, and repository change safety. Writing workflow concepts must not pollute coding workflow behavior unless they prove to be general Harness primitives.

## Migration strategy

If extraction becomes justified later, migrate by documenting the primitive, adding tests, introducing the shared boundary behind existing behavior, and moving one workflow family at a time.
