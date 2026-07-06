# Next-stage Decision Record

## ADR-001: Quill MVP does not depend on Marionettist runtime

- Status: accepted for next stage
- Decision: Quill MVP may use Marionettist as a development harness, but it must not run on Marionettist runtime.
- Rationale: Quill needs to ship a usable writing workflow first; runtime dependency would add premature coupling.

## ADR-002: Use Quill as dogfooding project for Marionettist

- Status: accepted for next stage
- Decision: Quill development should use `marionettist-pathway-opencode` and record Harness feedback.
- Rationale: Real project pressure is the best way to discover useful workflow, artifact, checkpoint, review, and model-role improvements.

## ADR-003: Develop Pi plugin in parallel branch

- Status: accepted for next stage
- Decision: Pi plugin exploration should happen on `feature/pi-plugin-adapter` or an equivalent isolated branch.
- Rationale: Pi is promising enough to validate, but not stable enough to block Quill MVP or mainline Marionettist work.

## ADR-004: Delay shared foundation extraction until patterns are validated

- Status: accepted for next stage
- Decision: Do not extract shared core packages until primitives repeat across real projects and workflows.
- Rationale: Premature shared foundation work could slow Quill, overfit abstractions, and destabilize Marionettist.

## ADR-005: Treat Marionettist as Agent Workflow Harness, not only coding harness

- Status: accepted for next stage
- Decision: Marionettist's long-term direction is a broader Agent Workflow Harness for coding, writing, research, and ops families.
- Rationale: The Harness concepts are broader than coding, but each family must be validated before implementation.

## ADR-006: Treat current Marionettist maturity as the baseline; use next stage for short-term advancement and long-term evidence

- Status: accepted for next stage
- Decision: Next-stage planning should assume Marionettist is already practically mature enough to continue real work now, use Quill dogfooding for short-term advancement and gradual bug discovery, and reserve long-term architecture changes for evidence-backed decisions.
- Rationale: Marionettist has already been used for a long time, no major blocking defects are currently known, and the mid-term Harness capability set already exists. The real planning need is clearer short-term execution plus clearer long-term evidence thresholds, not a reset to first-proof thinking.
