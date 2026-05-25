# Python Validator Guidance

Use this guidance when the repository clearly uses Python with common project metadata, virtual environment files, or test configuration.

## Command Selection

1. Prefer explicit commands from the caller or `.task/context-pack.md`.
2. Prefer repository-documented commands from `Makefile`, `tox.ini`, `noxfile.py`, `pyproject.toml`, or project docs.
3. Choose the narrowest relevant test, lint, type-check, or build command for the approved slice.

## Recommended Order

- Test checks: a specific `pytest` file, class, or test when named; otherwise the smallest relevant test path.
- Type checks: project scripts or tools such as `mypy` or `pyright` when configured.
- Lint/format checks: configured tools such as `ruff`, `flake8`, or `black --check` when relevant.
- Build checks: package build commands only when packaging behavior is in scope.

## Guardrails

- Do not create or modify virtual environments, install packages, or update lockfiles unless explicitly requested.
- Prefer invoking configured project commands over guessing global tool availability.
- If the active environment or configured tool is ambiguous, report `NOT_RUN` with likely command candidates.
