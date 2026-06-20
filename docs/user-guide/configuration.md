# Configuration

Start with the smallest set of files that control local behavior.

## Core files

- `AGENTS.md` — repository-level agent instructions
- `marionettist.config.yaml` — local Marionettist behavior and policy
- `.marionettist/model-profiles.yml` — model profile mapping when OpenCode is used
- `docs/project/knowledge-map.md` — project-specific doc routing after installation into a target repo

## High-value settings to review first

In `marionettist.config.yaml`, teams usually review:

- gate policy defaults
- any local workflow adjustments
- optional `riskZones`
- OpenCode settings if used

Example optional risk zone:

```yaml
riskZones:
  - name: "auth"
    paths:
      - "src/auth/**"
    notes:
      - "Touches access control and user permissions"
```

## OpenCode-specific configuration

If you install with OpenCode, also review:

- command surface choices
- permission mode choices
- model profiles in `.marionettist/model-profiles.yml`

OpenCode also has two different config-oriented command surfaces to keep distinct:

- `marionettist-config` remains the general OpenCode config wrapper
- `marionettist-pathway-config` is the OpenCode Pathway MVP workflow for Pathway-scoped config authoring

`marionettist-pathway-config` is not a new core CLI config command. It is a Pathway-scoped workflow that should:

- draft candidate YAML or config edits first
- show a diff or diff-like preview before writing
- require explicit confirmation before applying writes

If config changes also update OpenCode-visible plugin, command, or skill assets, restarting OpenCode may be required before the session sees the new behavior.

See [../OPENCODE.md](../OPENCODE.md) for the current supported options.

Migration note: legacy `harness` config or OpenCode names should not be treated as a long-lived compatibility surface unless a future release explicitly says otherwise. Use the [migration guide](../migration/README.md) when reconciling older installs.

## Need the full reference?

- [../GUIDELINES.md](../GUIDELINES.md)
- [../OPENCODE.md](../OPENCODE.md)
