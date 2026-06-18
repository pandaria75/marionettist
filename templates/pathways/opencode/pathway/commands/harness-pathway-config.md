I want help with OpenCode Pathway MVP configuration:

$ARGUMENTS

Requirements:
- Treat this as the distinct Pathway-scoped `harness-pathway-config` command for the current harness-named MVP.
- Keep the existing `harness-config` command unchanged as the general or legacy configuration wrapper; do not merge or replace that surface.
- Use the `harness-pathway-config` skill/workflow for routing and execution.
- Identify the exact target config file or files before drafting changes.
- Produce candidate YAML or JSON content plus a diff or diff-like preview before any write.
- If a target file does not exist, show a minimal candidate file and creation preview instead of writing immediately.
- Require explicit user confirmation before any configuration write.
- Do not write config directly from this command wrapper.
- Keep harness `gatePolicy` separate from OpenCode permission settings.
- Route model or temperature drafting only to `.harness/model-profiles.yml`.
- If any OpenCode config shape is uncertain, validate it against `https://opencode.ai/config.json` before proposing a write.
- After any approved OpenCode config-time change, remind the user to restart OpenCode.
