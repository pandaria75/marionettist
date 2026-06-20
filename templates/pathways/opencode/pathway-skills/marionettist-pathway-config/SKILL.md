---
name: marionettist-pathway-config
description: Use when the user wants natural-language Pathway-scoped OpenCode or Marionettist configuration help, especially opencode.json, marionettist.config.yaml, .marionettist/model-profiles.yml, permissions, gatePolicy, or tier-policy drafting with confirmation before writes.
---

# Marionettist Pathway Config

Pathway-scoped workflow for drafting configuration changes safely from natural-language requests.

Relationship note: `templates/opencode/commands/marionettist-config.md` is the general or legacy OpenCode config wrapper. This skill is Pathway-scoped guidance and must not silently duplicate or replace that wrapper.

## When To Use

Use this skill when the user wants to configure OpenCode Pathway behavior in natural language and needs candidate config content before any write.

Typical triggers:
- `opencode.json`, `opencode.jsonc`, or `.opencode/opencode.json`
- `marionettist.config.yaml`
- `.marionettist/model-profiles.yml`
- gate policy, permissions, model, temperature, skill path, plugin, or agent config questions
- requests to preview or draft config changes safely

Do not use this skill to perform direct writes without an explicit confirmation step.

## Inputs Required

- The user's requested behavior change in plain language
- The current relevant config files, if they exist
- Whether the request is about:
  - OpenCode permission settings
  - Marionettist `gatePolicy`
  - model or temperature defaults
  - tier policy, only if explicitly requested
- Any constraints about project-local vs global OpenCode config scope

## Steps

1. Classify the request before drafting anything.
   - Route OpenCode runtime config to `opencode.json`, `opencode.jsonc`, or `.opencode/opencode.json`.
   - Route Marionettist workflow gate settings to `marionettist.config.yaml` under `gatePolicy`.
   - Route model and temperature drafting only to `.marionettist/model-profiles.yml`.
   - Route `.marionettist/tier-policy.yml` changes only when the user explicitly asks for tier-policy authoring.
2. Identify the exact target file or files and explain why each file is in scope.
3. Keep `gatePolicy` separate from OpenCode permission settings.
   - Do not place Marionettist gate-policy choices into OpenCode permission config.
   - Do not treat OpenCode permission rules as a substitute for Marionettist workflow gates.
4. Inspect existing config shape before proposing changes.
   - Preserve unrelated user settings.
   - If an OpenCode config field shape is uncertain, validate it against `https://opencode.ai/config.json` instead of guessing.
5. Draft candidate config content.
   - Produce YAML or JSON candidate content for the exact target file.
   - Include a diff or diff-like preview showing added, removed, or changed lines.
   - If a target file does not exist, show a minimal candidate file plus a creation preview.
6. Explain any assumptions, especially when a request could map to multiple files.
7. Stop and ask for explicit confirmation before writing any file.
8. After any approved OpenCode config, skill, agent, or plugin change, remind the user to restart OpenCode for the change to take effect.

## Output Artifact

Produce all of the following before any write:
- target file list
- rationale for each target file
- candidate YAML or JSON content
- diff or diff-like preview
- notes about any schema validation performed or still required
- explicit confirmation prompt for whether to apply the change

## Gate / Stop Condition

Stop before writing when any of the following is true:
- the user has not explicitly confirmed the proposed change
- the request mixes `gatePolicy` and OpenCode permission settings without a clear separation
- an OpenCode config field shape is uncertain and has not been checked against `https://opencode.ai/config.json`
- the request implies `.marionettist/tier-policy.yml` edits but tier policy was not explicitly requested
- the target file is ambiguous and the mapping has not been explained

## Red Flags

- Writing config immediately from natural language without a preview
- Guessing OpenCode config keys or shapes
- Drafting temperature changes anywhere other than `.marionettist/model-profiles.yml`
- Editing `marionettist.config.yaml` for OpenCode permission rules
- Editing OpenCode config to represent Marionettist gate policy
- Touching `.marionettist/tier-policy.yml` without an explicit tier-policy request
- Forgetting the OpenCode restart reminder after config-time file changes

## Exit Criteria

- The correct target config files were identified
- `gatePolicy` and OpenCode permission settings were handled separately
- Any model or temperature change was drafted only in `.marionettist/model-profiles.yml`
- Tier policy was excluded unless explicitly requested
- OpenCode config shape was validated from schema when needed
- Candidate content and diff preview were shown
- The workflow stopped for explicit confirmation before any write

## Handoff

- If the user confirms, apply only the approved candidate changes to the identified files.
- If OpenCode config or config-time assets changed, tell the user to restart OpenCode.
- If the request is broader general configuration routing, hand off through the existing `marionettist-config` wrapper rather than silently merging the two surfaces.
