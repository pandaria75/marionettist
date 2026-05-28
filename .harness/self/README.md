# Harness Framework Self Profile

This profile applies only to this framework repository.

- The root AGENTS.md remains the highest-priority agent entrypoint.
- Do not run regular harness init against this repository as if it were a target project.
- Keep templates/ as product source templates for target projects.
- Keep skills/ as canonical publishable skill source assets.
- Use .harness-self/ only for local runtime state, cache, tmp files, and sandbox runs.
- Use fixtures/ as versioned sandbox inputs for CLI behavior checks.
- Keep self-dogfooding rules out of templates/AGENTS.md and skills/.

## Commands

- `harness self init` prints the self profile plan without writing by default.
- `harness self init --apply` creates or updates self profile files and `.gitignore` entries.
- `harness self doctor` checks self-dogfooding safety boundaries.
- `harness self test` copies fixtures into `.harness-self/sandbox-runs/` and runs sandbox smoke checks.

## Boundaries

- `.harness/self/` is versioned repository policy for maintaining this framework with its own workflow.
- `.harness-self/` is disposable local runtime state and may be deleted at any time.
- `fixtures/` contains versioned test inputs for target-project CLI behavior.
- `templates/` and `skills/` are publishable source assets; self-only rules do not belong there.
