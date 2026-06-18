# Troubleshooting

## `harness init` would change existing files

That is expected in repositories that already contain local material.

- Start with `harness init --dry-run`
- Use interactive choices to back up, overwrite, or skip
- Use `--force` only when replacement is intentional

## The generated setup does not match local expectations

- Run `harness diff` to inspect managed changes
- Run `harness sync` only after the preview looks safe
- Review `AGENTS.md`, `harness.config.yaml`, and `.harness/manifest.json`

## OpenCode files exist but behavior looks stale

- Re-check the install mode and OpenCode options
- Review [../OPENCODE.md](../OPENCODE.md)
- Restart OpenCode if regenerated config or plugin files were not reloaded automatically

## The workflow feels too strict or too loose

- Check gate policy settings in `harness.config.yaml`
- Remember gate policy is separate from OpenCode permission mode
- Adjust only with explicit team intent

## You saw Marionettist in some docs

Current user-facing commands and configuration still use **harness** naming. Marionettist references in development docs describe future planning, not a finished migration.

## More help

- Full usage guide: [../GUIDELINES.md](../GUIDELINES.md)
- Chinese usage guide: [../GUIDELINES.zh-CN.md](../GUIDELINES.zh-CN.md)
- OpenCode guide: [../OPENCODE.md](../OPENCODE.md)
- Chinese OpenCode guide: [../OPENCODE.zh-CN.md](../OPENCODE.zh-CN.md)
