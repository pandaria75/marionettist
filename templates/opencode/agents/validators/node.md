# Node Validator Guidance

Use this guidance when the repository clearly uses Node.js with npm, pnpm, yarn, or a lockfile/package manifest.

## Command Selection

1. Prefer explicit commands from the caller or `.task/<yyyy-MM-dd>/<task-slug>/context-pack.md`.
2. Prefer the package manager indicated by the committed lockfile: `pnpm-lock.yaml`, `package-lock.json`, `npm-shrinkwrap.json`, or `yarn.lock`.
3. Prefer existing `package.json` scripts over direct tool invocations.
4. Choose the narrowest workspace, package, or script that validates the approved slice.

## Recommended Order

- Type or compile checks: scripts such as `typecheck`, `check`, `compile`, or `build` when they are narrow enough.
- Test checks: targeted test scripts or a test runner filter when a file, suite, or test name is known.
- Lint checks: `lint` or a narrower lint script when relevant to the changed files.

## Guardrails

- Do not install dependencies or mutate lockfiles unless explicitly requested.
- Do not run broad workspace validation when a package-scoped command exists.
- If the package manager or script is ambiguous, report `NOT_RUN` with the candidate package manager and scripts.
