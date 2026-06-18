# Quick Start

## 1. Install the CLI

```powershell
npm install -g github:pandaria75/universal-ai-harness-framework
```

## 2. Preview installation in a target project

```powershell
harness init --dry-run
```

## 3. Install the framework files

```powershell
harness init
```

Optional OpenCode scaffolding:

```powershell
harness init --with-opencode
```

## 4. Adjust the first project-local files

After install, usually review:

- `AGENTS.md`
- `harness.config.yaml`
- `docs/project/knowledge-map.md`
- `.harness/model-profiles.yml` if using OpenCode

## 5. Start normal work through the harness workflow

Typical flow:

```text
intake -> analysis/context -> coding -> review -> gate
```

Useful prompt:

```text
Follow this repository's harness workflow.

Task: <describe the work>.

Start with task intake and context preparation.
Do not start coding until the analysis gate is approved.
```

With OpenCode:

```text
/harness <describe the work>
```

## Next steps

- More detail: [../GUIDELINES.md](../GUIDELINES.md)
- OpenCode setup: [../OPENCODE.md](../OPENCODE.md)
- Troubleshooting: [./troubleshooting.md](./troubleshooting.md)
