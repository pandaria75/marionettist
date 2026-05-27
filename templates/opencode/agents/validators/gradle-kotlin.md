# Gradle Or Kotlin Validator Guidance

Use this guidance when the repository clearly uses Gradle and Kotlin or Java with the Gradle wrapper committed.

## Command Selection

1. Prefer explicit commands from the caller or `.task/<yyyy-MM-dd>/<task-slug>/context-pack.md`.
2. Prefer Windows-compatible wrapper commands when working on Windows, such as `./gradlew.bat`.
3. Choose the narrowest relevant task first.

## Recommended Order

- Compile-only checks: module-scoped or target-scoped compile task when available.
- Build-style checks: the smallest build or check task covering the changed scope.
- Test checks: a specific test class or method when named; otherwise the smallest relevant test task.

## Guardrails

- Do not jump to a full root build if a smaller module or target command exists.
- Avoid clean or destructive tasks unless explicitly requested.
- If task discovery is ambiguous, report `NOT_RUN` with the likely wrapper command candidates.
