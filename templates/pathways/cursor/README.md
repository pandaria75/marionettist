# Marionettist Cursor Pathway

This pathway packages Marionettist skills, rules, agents, and commands for Cursor.

## Install options

### Plugin-first (recommended)

Add this repository as a Cursor marketplace source, then install `marionettist-pathway-cursor`.

The staged package lives in `distributions/cursor/`. The source of truth is `templates/pathways/cursor/`.

### Local fallback via CLI

In a target project:

```bash
marionettist init --with-cursor
```

This writes managed local files under `.cursor/skills`, `.cursor/rules`, `.cursor/agents`, and `.cursor/commands`.

Use `marionettist sync --with-cursor` to refresh managed Cursor assets while preserving project-local files outside the managed set.

## Boundaries

- Keep pathway content project-neutral.
- Do not put framework self-only rules into this pathway.
- Edit `templates/pathways/cursor/**`, then run `npm run cursor:dist`.
