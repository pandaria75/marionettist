import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPlan } from "../src/core/plan.js";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const harnessBin = path.join(repoRoot, "bin", "harness.js");
const frameworkVersion = (await fs.readFile(path.join(repoRoot, "VERSION"), "utf8")).trim();
const tempBase = await pathExists("E:\\tmp") ? "E:\\tmp" : os.tmpdir();
const dryRunProject = path.join(tempBase, `harness-smoke-dry-${process.pid}`);
const project = path.join(tempBase, `harness-smoke-${process.pid}`);
const opencodeProject = path.join(tempBase, `harness-smoke-opencode-${process.pid}`);
const backfillProject = path.join(tempBase, `harness-smoke-backfill-${process.pid}`);
const gradleProject = path.join(tempBase, `harness-smoke-gradle-${process.pid}`);
const validatorSnippetPathText = ["templates", "opencode", "agents", "validators"].join("/");
const publishableScanRoots = ["README.md", "README.zh-CN.md", "docs", "templates", "skills", "src", "scripts", "package.json"];
const publishableScanExcludedDirectories = [path.join("docs", "blogs")];
const forbiddenSensitivePatterns = [
  { label: "username fragment", regex: new RegExp(["haoyu", "gao"].join("\\."), "g") },
  { label: "C:\\Users\\", regex: /C:\\Users\\/g },
  { label: "E:\\KOTLIN_PROJECT", regex: /E:\\KOTLIN_PROJECT/g },
  { label: "E:\\AI_WORK", regex: /E:\\AI_WORK/g },
  { label: "legacy project prefix", regex: new RegExp(["unisic", ""].join("-"), "g") },
  { label: "legacy map term", regex: new RegExp(["module", "map"].join("-"), "g") },
  { label: validatorSnippetPathText, regex: /templates\/opencode\/agents\/validators/g }
];
const binaryLikeExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".jar",
  ".class"
]);

try {
  await cleanupPaths(dryRunProject, project, opencodeProject, backfillProject, gradleProject);

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
  assert(!manifest.managedFiles.some((file) => file.path.startsWith(".opencode/")), "manifest must not include OpenCode assets when init runs without --with-opencode");

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

  await assertOpencodeInstall(opencodeProject);
  await assertExplicitFalseSkipsOpencode(opencodeProject);
  await assertOpencodeBackfill(backfillProject);
  await assertGradleValidatorGuidance(gradleProject);
  await assertPublishableSensitiveScan();

  console.log("smoke: PASS");
} finally {
  await cleanupPaths(dryRunProject, project, opencodeProject, backfillProject, gradleProject);
}

async function assertOpencodeInstall(projectPath) {
  const initOutput = await harness("init", "--project", projectPath, "--auto", "--with-opencode");
  assertIncludes(initOutput, "new-managed: .opencode/commands/harness-feature.md");
  assertIncludes(initOutput, "new-managed: .opencode/agents/harness-validator.md");
  assertIncludes(initOutput, "new-managed: opencode.jsonc");
  assertIncludes(initOutput, "note: project-level opencode-tasks is enabled via opencode.jsonc");

  await assertOpencodeCommandsAndAgents(projectPath);

  const manifest = await readManifest(projectPath);
  assert(manifest.managedFiles.some((file) => file.path === ".opencode/commands/harness-feature.md"), "manifest must include OpenCode commands");
  assert(manifest.managedFiles.some((file) => file.path === ".opencode/agents/harness-validator.md"), "manifest must include harness validator agent");
  assert(manifest.managedFiles.some((file) => file.path === "opencode.jsonc"), "manifest must include project OpenCode config");
  assert(!manifest.managedFiles.some((file) => file.path.startsWith(".opencode/agents/validators/")), "manifest must not install validator snippet assets");

  const projectConfig = await fs.readFile(path.join(projectPath, "opencode.jsonc"), "utf8");
  assertIncludes(projectConfig, '"plugin": ["opencode-tasks"]');

  const validatorContent = await fs.readFile(path.join(projectPath, ".opencode", "agents", "harness-validator.md"), "utf8");
  assertIncludes(validatorContent, "# Generic Validator Guidance");
  assertIncludes(validatorContent, "# Scheduled Validator Guidance");
  assertExcludes(validatorContent, validatorSnippetPathText);
  assert(!(await pathExists(path.join(projectPath, ".opencode", "agents", "validators"))), "project must not contain installed validator snippet directory");
}

async function assertExplicitFalseSkipsOpencode(projectPath) {
  const plan = await buildPlan(projectPath, "init", {
    project: projectPath,
    auto: true,
    dryRun: true,
    force: false,
    variables: {
      projectName: path.basename(projectPath),
      projectType: "unknown",
      architecture: "unknown",
      primaryLanguage: "unknown"
    },
    withOpencode: false,
    conflictStrategies: {}
  });

  const directOpencodeOps = plan.operations.filter((operation) => operation.targetRelative?.startsWith(".opencode/"));
  assert(directOpencodeOps.length > 0, "explicit false plan should still account for previously managed OpenCode paths via orphan handling");
  assert(directOpencodeOps.every((operation) => operation.status === "orphan-managed"), "explicit false must not silently include or update OpenCode assets");
  assert(!directOpencodeOps.some((operation) => operation.status === "unchanged" || operation.status === "update" || operation.status === "new-managed"), "explicit false must not treat OpenCode assets as active install targets");
}

async function assertOpencodeBackfill(projectPath) {
  await harness("init", "--project", projectPath, "--auto");
  const manifestBeforeBackfill = await readManifest(projectPath);
  assert(!manifestBeforeBackfill.managedFiles.some((file) => file.path.startsWith(".opencode/")), "backfill baseline manifest must start without OpenCode assets");

  await harness("init", "--project", projectPath, "--auto", "--with-opencode");
  await assertOpencodeCommandsAndAgents(projectPath);

  const diffOutput = await harness("diff", "--project", projectPath);
  assertIncludes(diffOutput, "unchanged: .opencode/commands/harness-feature.md");
  assertIncludes(diffOutput, "unchanged: .opencode/agents/harness-validator.md");
  assertIncludes(diffOutput, "unchanged: opencode.jsonc");

  const manifest = await readManifest(projectPath);
  assert(manifest.managedFiles.some((file) => file.path === ".opencode/commands/harness-feature.md"), "backfill must add OpenCode command to manifest");
  assert(manifest.managedFiles.some((file) => file.path === ".opencode/agents/harness-validator.md"), "backfill must add OpenCode validator agent to manifest");
  assert(manifest.managedFiles.some((file) => file.path === "opencode.jsonc"), "backfill must add project OpenCode config to manifest");
  assert(!manifest.managedFiles.some((file) => file.path.startsWith(".opencode/agents/validators/")), "backfill must not add validator snippet assets to manifest");
}

async function assertGradleValidatorGuidance(projectPath) {
  await fs.mkdir(projectPath, { recursive: true });
  await fs.writeFile(path.join(projectPath, "settings.gradle.kts"), "rootProject.name = \"smoke\"\n", "utf8");

  await harness("init", "--project", projectPath, "--auto", "--with-opencode");

  const validatorContent = await fs.readFile(path.join(projectPath, ".opencode", "agents", "harness-validator.md"), "utf8");
  assertIncludes(validatorContent, "# Generic Validator Guidance");
  assertIncludes(validatorContent, "# Scheduled Validator Guidance");
  assertIncludes(validatorContent, "# Gradle Or Kotlin Validator Guidance");
  assertExcludes(validatorContent, validatorSnippetPathText);
}

async function assertOpencodeCommandsAndAgents(projectPath) {
  assert(await pathExists(path.join(projectPath, ".opencode", "commands", "harness-feature.md")), "OpenCode command must exist");
  assert(await pathExists(path.join(projectPath, ".opencode", "agents", "harness-builder.md")), "OpenCode harness-builder agent must exist");
  assert(await pathExists(path.join(projectPath, ".opencode", "agents", "harness-validator.md")), "OpenCode harness-validator agent must exist");
}

async function readManifest(projectPath) {
  return JSON.parse(await fs.readFile(path.join(projectPath, ".harness", "manifest.json"), "utf8"));
}

async function assertPublishableSensitiveScan() {
  const exclusions = [];
  const filesToScan = [];

  for (const relativeRoot of publishableScanRoots) {
    const absoluteRoot = path.join(repoRoot, relativeRoot);
    if (!(await pathExists(absoluteRoot))) {
      continue;
    }

    const stat = await fs.stat(absoluteRoot);
    if (stat.isDirectory()) {
      await collectTextFiles(absoluteRoot, relativeRoot, filesToScan, exclusions);
      continue;
    }

    if (!isBinaryLikePath(relativeRoot)) {
      filesToScan.push(relativeRoot);
    }
  }

  const matches = [];

  for (const relativeFile of filesToScan) {
    const absoluteFile = path.join(repoRoot, relativeFile);
    const content = await fs.readFile(absoluteFile, "utf8");
    for (const pattern of forbiddenSensitivePatterns) {
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(content)) {
        matches.push({ file: relativeFile, pattern: pattern.label });
      }
    }
  }

  if (exclusions.length > 0) {
    console.log(`sensitive-scan: excluded ${exclusions.join(", ")}`);
  }

  assert(matches.length === 0, `Sensitive publishable asset matches found:\n${matches.map((match) => `- ${match.file}: ${match.pattern}`).join("\n")}`);
  console.log(`sensitive-scan: PASS (${filesToScan.length} files checked)`);
}

async function collectTextFiles(absoluteDirectory, relativeDirectory, filesToScan, exclusions) {
  if (shouldExcludeFromPublishableScan(relativeDirectory)) {
    exclusions.push(relativeDirectory.replace(/\\/g, "/"));
    return;
  }

  const entries = await fs.readdir(absoluteDirectory, { withFileTypes: true });
  for (const entry of entries) {
    const childRelativePath = path.join(relativeDirectory, entry.name);
    const childAbsolutePath = path.join(absoluteDirectory, entry.name);
    if (entry.isDirectory()) {
      await collectTextFiles(childAbsolutePath, childRelativePath, filesToScan, exclusions);
      continue;
    }
    if (!isBinaryLikePath(childRelativePath)) {
      filesToScan.push(childRelativePath);
    }
  }
}

function shouldExcludeFromPublishableScan(relativePath) {
  return publishableScanExcludedDirectories.some((excludedDirectory) => relativePath === excludedDirectory || relativePath.startsWith(`${excludedDirectory}${path.sep}`));
}

function isBinaryLikePath(relativePath) {
  return binaryLikeExtensions.has(path.extname(relativePath).toLowerCase());
}

async function cleanupPaths(...pathsToRemove) {
  await Promise.all(pathsToRemove.map((targetPath) => fs.rm(targetPath, { recursive: true, force: true })));
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

function assertExcludes(content, unexpected) {
  assert(!content.includes(unexpected), `Expected output to exclude: ${unexpected}\nActual output:\n${content}`);
}
