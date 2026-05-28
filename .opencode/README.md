# Framework Self OpenCode

These OpenCode files are for maintaining this harness framework repository itself.

This directory intentionally contains two kinds of files:
- framework self-only files that may be committed
- generated local runtime mirrors copied from `templates/opencode/**`

Boundary rules:
- Do not run regular harness init against this framework repository; use `harness self init --apply --with-opencode` for self setup.
- templates/ and skills/ are product source assets, not self runtime output.
- .harness-self/ is local runtime sandbox state and must stay disposable.
- self-only rules must not be written into target-project templates, including `templates/AGENTS.md`.
- Framework private implementation details must not be copied into target-project templates.

Source of truth:
- Self-only files in `.opencode/agents/harness-framework-*.md` and `.opencode/commands/harness-self-*.md` are maintained for this repository.
- Target-project OpenCode agents and commands still come only from `templates/opencode/**`.
- Mirrored files under `.opencode/agents/harness-*.md`, `.opencode/agents/validators/**`, and `.opencode/commands/harness-*.md` must not be edited directly.
- Edit `templates/opencode/**` instead, then rerun `harness self init --apply --with-opencode`, then run `harness self doctor`.

Commit policy:
- Commit `opencode.jsonc`.
- Commit `.opencode/README.md`.
- Commit `.opencode/agents/harness-framework-*.md`.
- Commit `.opencode/commands/harness-self-*.md`.
- Do not commit generated mirrors from `templates/opencode/**`.

Before changing `src/commands`, `src/core`, `templates`, or `skills`, inspect the current boundary and run relevant smoke tests.

Recommended validation:
- `npm run smoke`
- `npm run self:smoke`
