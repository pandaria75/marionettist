# Configuration

Start with the smallest set of files that control local behavior.

## Core files

- `AGENTS.md` — repository-level agent instructions
- `harness.config.yaml` — local harness behavior and policy
- `.harness/model-profiles.yml` — model profile mapping when OpenCode is used
- `docs/project/knowledge-map.md` — project-specific doc routing after installation into a target repo

## High-value settings to review first

In `harness.config.yaml`, teams usually review:

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
- model profiles in `.harness/model-profiles.yml`

OpenCode also has two different config-oriented command surfaces to keep distinct:

- `harness-config` remains the general or legacy OpenCode config wrapper
- `harness-pathway-config` is the OpenCode Pathway MVP workflow for Pathway-scoped config authoring

`harness-pathway-config` is not a new core CLI config command. It is a Pathway-scoped workflow that should:

- draft candidate YAML or config edits first
- show a diff or diff-like preview before writing
- require explicit confirmation before applying writes

If config changes also update OpenCode-visible plugin, command, or skill assets, restarting OpenCode may be required before the session sees the new behavior.

See [../OPENCODE.md](../OPENCODE.md) for the current supported options.

## Important naming note

Current configuration still uses **harness** naming. Do not rename commands, files, or keys based on future Marionettist planning docs unless a later migration explicitly instructs you to do so. Marionettist references in pathway docs are future framing, not a current rename instruction.

## Need the full reference?

- [../GUIDELINES.md](../GUIDELINES.md)
- [../OPENCODE.md](../OPENCODE.md)
