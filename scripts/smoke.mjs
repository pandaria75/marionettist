import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const harnessBin = path.join(repoRoot, "bin", "harness.js");
const frameworkVersion = (await fs.readFile(path.join(repoRoot, "VERSION"), "utf8")).trim();
const tempBase = await pathExists("E:\\tmp") ? "E:\\tmp" : os.tmpdir();
const dryRunProject = path.join(tempBase, `harness-smoke-dry-${process.pid}`);
const project = path.join(tempBase, `harness-smoke-${process.pid}`);

try {
  await fs.rm(dryRunProject, { recursive: true, force: true });
  await fs.rm(project, { recursive: true, force: true });

  const dryRunOutput = await harness("init", "--project", dryRunProject, "--dry-run", "--auto");
  assertIncludes(dryRunOutput, "new-managed: AGENTS.md");
  assertIncludes(dryRunOutput, "manifest-preview: .harness/manifest.json");
  assert(!(await pathExists(dryRunProject)), "init --dry-run must not create the target project directory");

  const initOutput = await harness("init", "--project", project, "--auto");
  assertIncludes(initOutput, "write-manifest: .harness/manifest.json");

  const manifestPath = path.join(project, ".harness", "manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  assert(manifest.schemaVersion === 1, "manifest schemaVersion must be 1");
  assert(manifest.frameworkVersion === frameworkVersion, "manifest must record framework version");
  assert(manifest.managedFiles.some((file) => file.path === "AGENTS.md" && file.kind === "managed-block"), "manifest must include AGENTS.md as a managed block");

  const cleanDiffOutput = await harness("diff", "--project", project);
  assertIncludes(cleanDiffOutput, "unchanged: AGENTS.md");
  assertIncludes(cleanDiffOutput, "unchanged: .aiassistant/rules/workflow-rules.md");

  const managedRulePath = path.join(project, ".aiassistant", "rules", "workflow-rules.md");
  await fs.appendFile(managedRulePath, "\nLocal validation change.\n", "utf8");
  const modifiedRuleContent = await fs.readFile(managedRulePath, "utf8");

  const modifiedDiffOutput = await harness("diff", "--project", project);
  assertIncludes(modifiedDiffOutput, "modified-local: .aiassistant/rules/workflow-rules.md");

  const syncDryRunOutput = await harness("sync", "--project", project, "--dry-run");
  assertIncludes(syncDryRunOutput, "modified-local: .aiassistant/rules/workflow-rules.md");
  const afterSyncDryRunRuleContent = await fs.readFile(managedRulePath, "utf8");
  assert(afterSyncDryRunRuleContent === modifiedRuleContent, "sync --dry-run must not overwrite local modifications");

  const agentsPath = path.join(project, "AGENTS.md");
  await fs.appendFile(agentsPath, "\nProject local note.\n", "utf8");
  const localAgentsDiffOutput = await harness("diff", "--project", project);
  assertIncludes(localAgentsDiffOutput, "unchanged: AGENTS.md");

  const missingFilePath = path.join(project, "docs", "project", "harness-workflow.md");
  await fs.rm(missingFilePath);
  const missingDiffOutput = await harness("diff", "--project", project);
  assertIncludes(missingDiffOutput, "missing: docs/project/harness-workflow.md");

  manifest.managedFiles.push({
    path: ".agents/skills/old-core/SKILL.md",
    source: "skills/old-core/SKILL.md",
    kind: "file",
    hash: "orphan-hash"
  });
  await fs.mkdir(path.join(project, ".agents", "skills", "old-core"), { recursive: true });
  await fs.writeFile(path.join(project, ".agents", "skills", "old-core", "SKILL.md"), "# Old Core\n", "utf8");
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const orphanDiffOutput = await harness("diff", "--project", project);
  assertIncludes(orphanDiffOutput, "orphan-managed: .agents/skills/old-core/SKILL.md");

  console.log("smoke: PASS");
} finally {
  await fs.rm(dryRunProject, { recursive: true, force: true });
  await fs.rm(project, { recursive: true, force: true });
}

async function harness(...args) {
  return exec(process.execPath, [harnessBin, ...args], repoRoot);
}

async function exec(command, args, cwd) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd, encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) {
        error.message = `${error.message}\nstdout:\n${stdout}\nstderr:\n${stderr}`;
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(content, expected) {
  assert(content.includes(expected), `Expected output to include: ${expected}\nActual output:\n${content}`);
}
