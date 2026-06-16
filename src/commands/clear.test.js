import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { clearCommand } from "./clear.js";

async function captureLogs(callback) {
  const lines = [];
  const originalLog = console.log;
  console.log = (...args) => {
    lines.push(args.join(" "));
  };

  try {
    await callback();
  } finally {
    console.log = originalLog;
  }

  return lines;
}

async function createProject() {
  const projectPath = await fs.mkdtemp(path.join(os.tmpdir(), "harness-clear-command-test-"));
  await fs.mkdir(path.join(projectPath, ".harness"), { recursive: true });
  await fs.mkdir(path.join(projectPath, ".opencode", "agents"), { recursive: true });
  await fs.writeFile(path.join(projectPath, ".opencode", "agents", "harness.md"), "agent\n");
  await fs.writeFile(path.join(projectPath, "AGENTS.md"), `# Project Agent Guide\n\n<!-- harness-kit:start -->\n\nManaged guidance.\n\n<!-- harness-kit:end -->\n\n## Local Notes\n\nKeep these notes.\n`);
  await fs.writeFile(path.join(projectPath, ".harness", "manifest.json"), `${JSON.stringify({
    schemaVersion: 1,
    frameworkVersion: "0.0.0-test",
    installedAt: "2026-06-16T00:00:00.000Z",
    updatedAt: "2026-06-16T00:00:00.000Z",
    managedFiles: [
      {
        path: ".opencode/agents/harness.md",
        source: "templates/opencode/agents/harness.md",
        kind: "file",
        hash: "agent-hash",
        adapter: "opencode"
      },
      {
        path: "AGENTS.md",
        source: "templates/AGENTS.md",
        kind: "managed-block",
        hash: "agents-hash"
      }
    ]
  }, null, 2)}\n`);

  return projectPath;
}

test("clearCommand preview prints planned removals for manifest-managed targets", async () => {
  const projectPath = await createProject();
  const lines = await captureLogs(async () => {
    await clearCommand(["--project", projectPath, "--scope", "all"]);
  });

  assert.equal(lines[0], "harness clear (preview)");
  assert(lines.some((line) => line === "manifest: .harness/manifest.json"));
  assert(lines.some((line) => line === "planned actions: 2"));
  assert(lines.some((line) => line === "remove: .opencode/agents/harness.md"));
  assert(lines.some((line) => line === "edit: AGENTS.md"));
  assert(lines.some((line) => line === "  remove: managed block (5 lines)"));
  assert(lines.some((line) => line === "  keep: preserves project-local content (9 lines)"));
  assert(lines.some((line) => line === "dry-run: preview only; no files will be changed"));
});

test("clearCommand opencode scope only prints adapter-managed preview targets", async () => {
  const projectPath = await createProject();
  const lines = await captureLogs(async () => {
    await clearCommand(["--project", projectPath, "--scope", "opencode"]);
  });

  assert(lines.some((line) => line === "planned actions: 1"));
  assert(lines.some((line) => line === "remove: .opencode/agents/harness.md"));
  assert(lines.every((line) => !line.includes("edit: AGENTS.md")));
});

test("clearCommand preview explains when AGENTS has no managed block", async () => {
  const projectPath = await fs.mkdtemp(path.join(os.tmpdir(), "harness-clear-command-no-managed-"));
  await fs.mkdir(path.join(projectPath, ".harness"), { recursive: true });
  await fs.writeFile(path.join(projectPath, "AGENTS.md"), "# Local guide\n\nOnly project-local content.\n");
  await fs.writeFile(path.join(projectPath, ".harness", "manifest.json"), `${JSON.stringify({
    schemaVersion: 1,
    frameworkVersion: "0.0.0-test",
    installedAt: "2026-06-16T00:00:00.000Z",
    updatedAt: "2026-06-16T00:00:00.000Z",
    managedFiles: [
      {
        path: "AGENTS.md",
        source: "templates/AGENTS.md",
        kind: "managed-block",
        hash: "agents-hash"
      }
    ]
  }, null, 2)}\n`);

  const lines = await captureLogs(async () => {
    await clearCommand(["--project", projectPath, "--scope", "all"]);
  });

  assert(lines.some((line) => line === "edit: AGENTS.md"));
  assert(lines.some((line) => line === "  keep: no managed block found; nothing would be removed"));
});

test("clearCommand apply executes after plan build and reports backups", async () => {
  const projectPath = await createProject();

  const lines = await captureLogs(async () => {
    await clearCommand(["--project", projectPath, "--scope", "all", "--apply"]);
  });

  assert(lines.some((line) => line.startsWith("backup root: .harness/backups/")));
  assert(lines.some((line) => line === "applied remove: .opencode/agents/harness.md"));
  assert(lines.some((line) => line === "applied edit: AGENTS.md"));
  await assert.rejects(fs.access(path.join(projectPath, ".opencode", "agents", "harness.md")));
  assert.match(await fs.readFile(path.join(projectPath, "AGENTS.md"), "utf8"), /Keep these notes/);
});
