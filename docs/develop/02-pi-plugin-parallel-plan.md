# Pi Plugin Parallel Plan

## Principle

The first Pi plugin stage is an experimental adapter, not a Marionettist rewrite.

## Goals

1. Validate whether Pi can carry Marionettist pathway, skill, and workflow concepts.
2. Validate how a Pi plugin can load Marionettist rules.
3. Validate mapping between Marionettist agent roles and Pi plugin roles.
4. Validate model-role mapping in Pi.
5. Validate whether Pi context management is suitable for long-term iteration.
6. Produce a minimal usable adapter scaffold.

## Scope

- Create a separate branch, preferably `feature/pi-plugin-adapter`.
- Add a minimal plugin directory and README if implementation is later approved.
- Map Marionettist concepts to Pi concepts at the adapter boundary.
- Keep the experiment isolated from the mainline OpenCode Pathway.

## Non-goals

- Do not refactor the workflow engine.
- Do not extract shared core.
- Do not adapt Codex, OpenCode, Hermes, and Pi simultaneously.
- Do not let Quill MVP wait for Pi.
- Do not make the Pi plugin a mainline blocker.

## Branch strategy

- Roadmap and issue planning live on `feature/next-stage-roadmap`.
- Pi experiment work should live on `feature/pi-plugin-adapter`.
- The Pi branch can exist before implementation, but functional development should remain separate.

## Minimal adapter scaffold

A future minimal scaffold should include:

- README explaining experimental status;
- adapter entrypoint placeholder;
- rule-loading sketch;
- role/model mapping sketch;
- context-loading notes;
- validation notes for what Pi can and cannot support.

## Acceptance criteria

- The branch does not affect mainline behavior.
- The adapter scope is documented.
- Pi capability boundaries are recorded.
- The experiment answers whether Pi deserves continued investment.

## Merge criteria

Merge only if the adapter has a clear path to stable maintenance, does not destabilize OpenCode Pathway, and demonstrates useful rule/context/model-role mapping.

## Keep as experiment when

Keep the branch experimental if Pi APIs are unstable, mapping is too lossy, maintenance cost is high, or the adapter would slow Quill MVP or Marionettist mainline work.
