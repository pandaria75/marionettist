# Open Questions

These questions should remain open until Quill MVP, Pi adapter exploration, and Marionettist feedback work provide enough evidence.

## Runtime and dependency questions

- Should Marionettist ever become Quill runtime, or remain Quill's development harness only?
- If Quill stabilizes writing primitives, should they feed back into Marionettist as conventions, templates, or runtime behavior?
- Should workflow primitives eventually become an npm package?

## Platform questions

- Can Pi become a long-term first-class Pathway?
- Which Pi plugin capabilities are stable enough for Marionettist?
- How should Marionettist compare Pi, OpenCode, Codex, and future platforms without overgeneralizing too early?

## Workflow-family questions

- Should writing workflows live in Marionettist mainline, in Quill, or in a separate package?
- Which writing capabilities are general primitives and which belong only to Quill?
- Which research and ops workflows are worth validating after Quill?

## Shared-foundation questions

- What exact evidence proves a primitive appears in two projects and three workflows?
- What test coverage is required before extraction?
- What migration path avoids breaking existing target projects?
