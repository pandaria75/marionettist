# Universal AI Harness Framework

[中文版](./README.zh-CN.md)

A reusable, file-based harness for safer AI-assisted development in any repository.

It gives AI agents and human teams a shared contract: where rules live, how task context is prepared, when coding may start, and where the agent must stop for approval.

## What Problem It Solves

AI-assisted work often fails for simple reasons:

- the agent forgets constraints from earlier messages
- project knowledge stays in chat instead of the repository
- scope expands silently during implementation
- reviews happen too late or against unclear requirements
- upgrades to agent prompts overwrite local team rules

This framework moves the important parts into normal files. They can be read by any agent, reviewed in Git, and upgraded safely.

## Highlights

- **Repository-local contract.** `AGENTS.md`, rules, docs, task state, and manifests are plain files.
- **Agent-neutral workflow.** The method works with any agent that can read Markdown and edit files.
- **Explicit gates.** Non-trivial work stops after analysis and after each approved slice.
- **Task context before coding.** Agents prepare compact context packs instead of coding from chat alone.
- **Safe sync.** `harness diff` previews changes; `harness sync` updates managed assets while preserving local work.
- **Optional OpenCode support.** Slash commands and role agents improve ergonomics, but the harness does not depend on OpenCode.
- **Model tiering.** OpenCode setups can use stronger models for planning, balanced models for coding/review, and cheaper reliable models for utility work.

## Install

```powershell
# From GitHub
npm install -g github:pandaria75/universal-ai-harness-framework

# Or from a local clone of this framework repo
npm link
```

## Minimal Usage

Run these commands inside a target project:

```powershell
# Preview what will be installed
harness init --dry-run

# Install the harness interactively
harness init

# Optional: install OpenCode commands and agents too
harness init --with-opencode
```

After init, the target project gets files such as:

- `AGENTS.md` for repository-agent behavior
- `harness.config.yaml` for local harness settings
- `docs/project/*` for workflow and knowledge routing
- `.aiassistant/rules/*` for constraints
- `.agents/skills/*` for portable workflow skills
- `.harness/manifest.json` for safe upgrades

## Small Example

Without OpenCode, give your agent a prompt like this:

```text
Follow this repository's harness workflow.

Task: Add a small user-facing feature: <describe the change>.

Start with task intake and context preparation.
Do not start coding until the analysis gate is approved.
```

With OpenCode installed, start from the builder command:

```text
/harness Add a small user-facing feature: <describe the change>
```

The agent should classify the task, prepare the needed context, stop at the analysis gate, and wait for approval before coding.

## Common Commands

```powershell
# Preview framework updates
harness diff

# Apply safe managed updates
harness sync

# Diagnose an installed harness
harness doctor
```

For more install modes, command-surface options, task tiers, and gate behavior, see the usage guide.

## Read Next

| Document | Best For | What It Covers |
| --- | --- | --- |
| [docs/DESIGN.md](./docs/DESIGN.md) | Tech leads, architects, framework evaluators | Design ideas, workflow philosophy, asset ownership, non-goals |
| [docs/GUIDELINES.md](./docs/GUIDELINES.md) | Teams adopting the harness | Installation, daily usage, task tiers, gates, upgrades |
| [docs/OPENCODE.md](./docs/OPENCODE.md) | Teams using OpenCode | Slash commands, agent roles, model profiles, permission posture |

## Boundary For This Repository

This repository is the **framework source**, not a normal target project.

- Use `harness self init` when maintaining this framework repo.
- Do not run regular `harness init` here as if this were a target project.
- `templates/` and `skills/` are publishable assets for target projects.
- `.harness-self/` is disposable local runtime state.
- OpenCode is optional. The core harness works through files and prompts.
