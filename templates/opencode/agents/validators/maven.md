# Maven Validator Guidance

Use this guidance when the repository clearly uses Maven with `pom.xml` or a Maven wrapper committed.

## Command Selection

1. Prefer explicit commands from the caller or `.task/context-pack.md`.
2. Prefer the committed wrapper when available: `./mvnw` on Unix-like systems or `./mvnw.cmd` on Windows.
3. Choose the narrowest relevant module, profile, or test target first.

## Recommended Order

- Compile-only checks: `compile` for the affected module when available.
- Test checks: a specific test class or method when named; otherwise the smallest relevant module test command.
- Build-style checks: `verify` or another repository-documented lifecycle phase only when broader validation is needed.

## Guardrails

- Do not jump to a full multi-module root build if a smaller module command exists.
- Avoid `clean` unless explicitly requested.
- If wrapper or module discovery is ambiguous, report `NOT_RUN` with likely Maven command candidates.
