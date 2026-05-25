# Generic Validator Guidance

Use this guidance when the repository stack is unknown or when no project-specific validator variant exists.

## Selection Rules

1. Prefer explicit commands from the caller or `.task/context-pack.md`.
2. If no explicit command exists, inspect the repository only enough to identify the native validation entrypoint.
3. Choose the narrowest non-destructive command that validates the approved slice.
4. Avoid full-suite validation unless the caller requests it or the slice risk requires it.
5. If the correct command cannot be identified safely, return `NOT_RUN` instead of guessing.

## Typical Native Entrypoints

- `package.json` scripts
- `Makefile` targets
- language or build-tool wrappers committed to the repository
- repository-specific validation scripts documented in `AGENTS.md`, rules, or `.task/context-pack.md`

## Reporting

- Report the exact command.
- Report whether the command is compile, build, test, lint, or mixed validation.
- Report the smallest useful next command if the first validation is inconclusive.
