import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildClearPlan } from "./clear-plan.js";

async function createProject(managedFiles = [], filesToWrite = []) {
  const projectPath = await fs.mkdtemp(path.join(os.tmpdir(), "harness-clear-plan-test-"));
  await fs.mkdir(path.join(projectPath, ".marionettist"), { recursive: true });
  await fs.writeFile(path.join(projectPath, ".marionettist", "manifest.json"), `${JSON.stringify({
    schemaVersion: 1,
    frameworkVersion: "0.0.0-test",
    installedAt: "2026-06-16T00:00:00.000Z",
    updatedAt: "2026-06-16T00:00:00.000Z",
    managedFiles
  }, null, 2)}\n`);

  for (const relativePath of filesToWrite) {
    const targetPath = path.join(projectPath, relativePath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, `content for ${relativePath}\n`);
  }

  return projectPath;
}

test("buildClearPlan is safe when manifest is missing", async () => {
  const projectPath = await fs.mkdtemp(path.join(os.tmpdir(), "harness-clear-plan-missing-"));
  const plan = await buildClearPlan(projectPath, { scope: "all" });

  assert.equal(plan.manifestFound, false);
  assert.deepEqual(plan.targets, []);
  assert.equal(plan.summary.total, 0);
});

test("buildClearPlan includes manifest-managed targets for scope all, including legacy and missing records", async () => {
  const projectPath = await createProject([
    { path: "AGENTS.md", source: "templates/AGENTS.md", kind: "managed-block", hash: "agents-hash" },
    { path: "README.md", source: "templates/README.md", kind: "file", hash: "readme-hash" },
    { path: ".opencode/agents/harness.md", source: "templates/opencode/agents/harness.md", kind: "file", hash: "legacy-opencode-hash" }
  ], ["AGENTS.md", ".opencode/agents/harness.md"]);

  const plan = await buildClearPlan(projectPath, { scope: "all" });

  assert.equal(plan.manifestFound, true);
  assert.deepEqual(
    plan.targets.map((target) => ({ path: target.path, action: target.action, status: target.status })),
    [
      { path: ".opencode/agents/harness.md", action: "remove", status: "present" },
      { path: "AGENTS.md", action: "edit", status: "present" },
      { path: "README.md", action: "remove", status: "missing" }
    ]
  );
  assert.deepEqual(plan.summary, {
    total: 3,
    removable: 2,
    editable: 1,
    missing: 1
  });
  assert.equal(plan.targets[1].preview.hasManagedBlock, false);
  assert.match(plan.targets[1].preview.preservedContent, /content for AGENTS\.md/);
});

test("buildClearPlan scope opencode only includes adapter-managed records", async () => {
  const projectPath = await createProject([
    { path: ".opencode/agents/managed.md", source: "templates/opencode/agents/managed.md", kind: "file", hash: "managed", adapter: "opencode" },
    { path: ".opencode/agents/inferred-only.md", source: "templates/opencode/agents/inferred-only.md", kind: "file", hash: "inferred" },
    { path: "AGENTS.md", source: "templates/AGENTS.md", kind: "managed-block", hash: "agents-hash" }
  ], [".opencode/agents/managed.md", ".opencode/agents/inferred-only.md", "AGENTS.md"]);

  const plan = await buildClearPlan(projectPath, { scope: "opencode" });

  assert.deepEqual(plan.targets.map((target) => target.path), [".opencode/agents/managed.md"]);
  assert.equal(plan.summary.total, 1);
  assert.equal(plan.summary.removable, 1);
  assert.equal(plan.summary.editable, 0);
});

test("buildClearPlan previews removable and preserved AGENTS sections when managed block exists", async () => {
  const projectPath = await createProject([
    { path: "AGENTS.md", source: "templates/AGENTS.md", kind: "managed-block", hash: "agents-hash" }
  ]);
  await fs.writeFile(path.join(projectPath, "AGENTS.md"), `# Existing Managed Block Target\n\n<!-- marionettist-kit:start -->\n\n## Purpose\n\nOld managed section.\n\n<!-- marionettist-kit:end -->\n\n<!-- project-local:start -->\n\nKeep this local section.\n\n<!-- project-local:end -->\n`);

  const plan = await buildClearPlan(projectPath, { scope: "all" });
  const agentsTarget = plan.targets[0];

  assert.equal(agentsTarget.preview.hasManagedBlock, true);
  assert.equal(agentsTarget.preview.managedBlockOnly, false);
  assert.match(agentsTarget.preview.removableContent, /Old managed section/);
  assert.match(agentsTarget.preview.preservedContent, /Keep this local section/);
});

test("buildClearPlan previews managed-only AGENTS cleanup without preserved content", async () => {
  const projectPath = await createProject([
    { path: "AGENTS.md", source: "templates/AGENTS.md", kind: "managed-block", hash: "agents-hash" }
  ], ["AGENTS.md"]);

  await fs.writeFile(path.join(projectPath, "AGENTS.md"), `<!-- marionettist-kit:start -->\n\nOnly managed content.\n\n<!-- marionettist-kit:end -->\n`);

  const plan = await buildClearPlan(projectPath, { scope: "all" });
  const agentsTarget = plan.targets[0];

  assert.equal(agentsTarget.preview.hasManagedBlock, true);
  assert.equal(agentsTarget.preview.managedBlockOnly, true);
  assert.equal(agentsTarget.preview.hasProjectLocalContent, false);
  assert.equal(agentsTarget.preview.preservedContent, "");
});
