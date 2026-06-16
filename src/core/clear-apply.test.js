import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { applyClearPlan } from "./clear-apply.js";
import { buildClearPlan } from "./clear-plan.js";

async function createProject(managedFiles = [], files = {}) {
  const projectPath = await fs.mkdtemp(path.join(os.tmpdir(), "harness-clear-apply-test-"));
  await fs.mkdir(path.join(projectPath, ".harness"), { recursive: true });
  await fs.writeFile(path.join(projectPath, ".harness", "manifest.json"), `${JSON.stringify({
    schemaVersion: 1,
    frameworkVersion: "0.0.0-test",
    installedAt: "2026-06-16T00:00:00.000Z",
    updatedAt: "2026-06-16T00:00:00.000Z",
    managedFiles
  }, null, 2)}\n`);

  for (const [relativePath, content] of Object.entries(files)) {
    const targetPath = path.join(projectPath, relativePath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, content);
  }

  return projectPath;
}

async function readIfExists(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

test("applyClearPlan backs up file before remove", async () => {
  const projectPath = await createProject([
    { path: "README.md", source: "templates/README.md", kind: "file", hash: "readme-hash" }
  ], {
    "README.md": "managed readme\n"
  });

  const plan = await buildClearPlan(projectPath, { scope: "all" });
  const result = await applyClearPlan(plan, { timestamp: "2026-06-16T10-20-30-000Z" });

  assert.equal(result.applied, true);
  assert.equal(await readIfExists(path.join(projectPath, "README.md")), null);
  assert.equal(
    await fs.readFile(path.join(projectPath, ".harness", "backups", "2026-06-16T10-20-30-000Z", "README.md"), "utf8"),
    "managed readme\n"
  );
});

test("applyClearPlan backs up file before managed-block edit", async () => {
  const agentsContent = `# Project Agent Guide\n\n<!-- harness-kit:start -->\n\nManaged guidance.\n\n<!-- harness-kit:end -->\n\n## Local Notes\n\nKeep these notes.\n`;
  const projectPath = await createProject([
    { path: "AGENTS.md", source: "templates/AGENTS.md", kind: "managed-block", hash: "agents-hash" }
  ], {
    "AGENTS.md": agentsContent
  });

  const plan = await buildClearPlan(projectPath, { scope: "all" });
  const result = await applyClearPlan(plan, { timestamp: "2026-06-16T10-20-31-000Z" });

  assert.equal(result.applied, true);
  assert.equal(
    await fs.readFile(path.join(projectPath, ".harness", "backups", "2026-06-16T10-20-31-000Z", "AGENTS.md"), "utf8"),
    agentsContent
  );
  const updatedAgents = await fs.readFile(path.join(projectPath, "AGENTS.md"), "utf8");
  assert.match(updatedAgents, /# Project Agent Guide/);
  assert.match(updatedAgents, /## Local Notes/);
  assert.match(updatedAgents, /Keep these notes\./);
  assert.doesNotMatch(updatedAgents, /harness-kit:start/);
  assert.doesNotMatch(updatedAgents, /Managed guidance\./);
});

test("applyClearPlan dry-run makes no writes", async () => {
  const projectPath = await createProject([
    { path: "README.md", source: "templates/README.md", kind: "file", hash: "readme-hash" }
  ], {
    "README.md": "managed readme\n"
  });

  const plan = await buildClearPlan(projectPath, { scope: "all" });
  const result = await applyClearPlan(plan, { dryRun: true, timestamp: "2026-06-16T10-20-32-000Z" });

  assert.equal(result.dryRun, true);
  assert.equal(await fs.readFile(path.join(projectPath, "README.md"), "utf8"), "managed readme\n");
  assert.equal(await readIfExists(path.join(projectPath, ".harness", "backups", "2026-06-16T10-20-32-000Z", "README.md")), null);
});

test("applyClearPlan aborts mutation when backup fails", async () => {
  const projectPath = await createProject([
    { path: "README.md", source: "templates/README.md", kind: "file", hash: "readme-hash" }
  ], {
    "README.md": "managed readme\n"
  });
  const blockingFile = path.join(projectPath, ".harness", "backups", "2026-06-16T10-20-33-000Z");
  await fs.mkdir(path.dirname(blockingFile), { recursive: true });
  await fs.writeFile(blockingFile, "not a directory\n");

  const plan = await buildClearPlan(projectPath, { scope: "all" });

  await assert.rejects(
    applyClearPlan(plan, { timestamp: "2026-06-16T10-20-33-000Z" }),
    /ENOTDIR|EEXIST/
  );
  assert.equal(await fs.readFile(path.join(projectPath, "README.md"), "utf8"), "managed readme\n");
});

test("applyClearPlan rejects traversal targets outside project root", async () => {
  const projectPath = await createProject([
    { path: "../outside.txt", source: "templates/outside.txt", kind: "file", hash: "outside-hash" }
  ]);
  await fs.writeFile(path.resolve(projectPath, "../outside.txt"), "outside\n");

  const plan = await buildClearPlan(projectPath, { scope: "all" });

  await assert.rejects(
    applyClearPlan(plan, { timestamp: "2026-06-16T10-20-34-000Z" }),
    /escapes project root/
  );
});

test("applyClearPlan excludes backup root targets from cleanup", async () => {
  const projectPath = await createProject([
    { path: ".harness/backups/old/README.md", source: "templates/README.md", kind: "file", hash: "old-backup-hash" },
    { path: "README.md", source: "templates/README.md", kind: "file", hash: "readme-hash" }
  ], {
    ".harness/backups/old/README.md": "preserve prior backup\n",
    "README.md": "managed readme\n"
  });

  const plan = await buildClearPlan(projectPath, { scope: "all" });
  const result = await applyClearPlan(plan, { timestamp: "2026-06-16T10-20-35-000Z" });

  assert.equal(result.operations.length, 1);
  assert.equal(result.operations[0].path, "README.md");
  assert.equal(await fs.readFile(path.join(projectPath, ".harness", "backups", "old", "README.md"), "utf8"), "preserve prior backup\n");
});

test("applyClearPlan keeps safe file for managed-block-only AGENTS", async () => {
  const projectPath = await createProject([
    { path: "AGENTS.md", source: "templates/AGENTS.md", kind: "managed-block", hash: "agents-hash" }
  ], {
    "AGENTS.md": "<!-- harness-kit:start -->\n\nManaged only.\n\n<!-- harness-kit:end -->\n"
  });

  const plan = await buildClearPlan(projectPath, { scope: "all" });
  const result = await applyClearPlan(plan, { timestamp: "2026-06-16T10-20-36-000Z" });

  assert.equal(result.operations[0].managedBlockOnly, true);
  assert.equal(await fs.readFile(path.join(projectPath, "AGENTS.md"), "utf8"), "# AGENTS\n");
});
