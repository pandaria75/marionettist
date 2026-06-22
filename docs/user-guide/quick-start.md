# Quick Start

[中文版](./quick-start.zh-CN.md)

Use this page when you want the shortest safe path for setting up Marionettist in a target project.

## Before you start

- Use these steps inside the repository you want to set up with Marionettist.
- If you are maintaining this framework repository itself, use `marionettist self init --apply` instead of regular `marionettist init`.
- If you want optional OpenCode integration, finish the base install first and then continue with [OpenCode docs](../OPENCODE.md).

## 1. Install the CLI

```powershell
npm install -g github:pandaria75/marionettist
```

## 2. Preview installation in your target project

Run the following commands inside the target project you want to set up.

```powershell
marionettist init --dry-run
```

Use the preview to confirm which files Marionettist plans to create or manage before you apply the install.

## 3. Install the framework files

```powershell
marionettist init
```

Optional OpenCode scaffolding:

```powershell
marionettist init --with-opencode
```

After install, your project should have framework entry files such as `AGENTS.md`, `marionettist.config.yaml`, and the `.marionettist/` task/runtime area.

## 4. Adjust the first project-local files

After install, usually review these first:

- `AGENTS.md`
- `marionettist.config.yaml`
- `docs/project/knowledge-map.md`
- `.marionettist/model-profiles.yml` if using OpenCode

Recommended first edits:

- describe your repository boundaries and expectations in `AGENTS.md`
- set project-specific defaults in `marionettist.config.yaml`
- add repo-specific architecture and ownership notes to `docs/project/knowledge-map.md`
- adjust model choices only if your team needs different OpenCode defaults

## 5. Start normal work through the Marionettist workflow

Typical flow:

```text
intake -> analysis/context -> coding -> review -> gate
```

Useful prompt:

```text
Follow this repository's Marionettist workflow.

Task: <describe the work>.

Start with task intake and context preparation.
Do not start coding until the analysis gate is approved.
```

With OpenCode, the short entrypoint is:

```text
/marionettist <describe the work>
```

If this is your first OpenCode setup, read [../OPENCODE.md](../OPENCODE.md) for command surfaces, agents, model profiles, and permission guidance.

## 6. Keep the install healthy

After you change config or update framework-managed files, use:

```powershell
marionettist diff
marionettist sync
marionettist doctor
```

Use `diff` before `sync` so you can review managed changes safely.

## Next steps

- More detail: [../GUIDELINES.md](../GUIDELINES.md)
- OpenCode setup: [../OPENCODE.md](../OPENCODE.md)
- Configuration: [./configuration.md](./configuration.md)
- Troubleshooting: [./troubleshooting.md](./troubleshooting.md)
- Broader docs map: [./README.md](./README.md)
