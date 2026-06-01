import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPlan } from "../src/core/plan.js";
import { parseSimpleYaml } from "../src/core/yaml.js";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const harnessBin = path.join(repoRoot, "bin", "harness.js");
const frameworkVersion = (await fs.readFile(path.join(repoRoot, "VERSION"), "utf8")).trim();
const tempBase = process.env.HARNESS_SMOKE_TMP || os.tmpdir();
const dryRunProject = path.join(tempBase, `harness-smoke-dry-${process.pid}`);
const project = path.join(tempBase, `harness-smoke-${process.pid}`);
const opencodeProject = path.join(tempBase, `harness-smoke-opencode-${process.pid}`);
const backfillProject = path.join(tempBase, `harness-smoke-backfill-${process.pid}`);
const gradleProject = path.join(tempBase, `harness-smoke-gradle-${process.pid}`);
const validatorSnippetPathText = ["templates", "opencode", "agents", "validators"].join("/");
const publishableScanRoots = ["README.md", "README.zh-CN.md", "docs", "templates", "skills", "src", "scripts", "package.json"];
const publishableScanExcludedDirectories = [path.join("docs", "blogs")];
const normalOpencodeCommands = [
  "harness.md",
  "harness-dev.md",
  "harness-incident.md",
  "harness-docs.md",
  "harness-config.md"
];
const advancedOpencodeCommands = [
  "harness-feature.md",
  "harness-bugfix.md",
  "harness-refactor.md",
  "harness-context.md",
  "harness-status.md",
  "harness-continue.md"
];
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

  const doctorOutput = await harness("doctor", "--project", project);
  assertIncludes(doctorOutput, "PASS  harness.config.yaml parsed");
  assertIncludes(doctorOutput, "PASS  model profiles found: think, build, review, run");
  assertIncludes(doctorOutput, "WARN  .task/active.json not found; no active task selected");

  await assertTaskStateContractTemplate();
  await assertP1DocsAndTemplateCoverage();

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

  await assertDoctorFailures(project);

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
  assertIncludes(initOutput, "new-managed: .opencode/commands/harness.md");
  assertIncludes(initOutput, "new-managed: .opencode/commands/harness-dev.md");
  assertIncludes(initOutput, "new-managed: .opencode/commands/harness-incident.md");
  assertIncludes(initOutput, "new-managed: .opencode/agents/harness-validator.md");
  assertIncludes(initOutput, "new-managed: opencode.jsonc");
  assertIncludes(initOutput, "note: project-level opencode-tasks is enabled via opencode.jsonc");

  await assertMinimalOpencodeCommandsAndAgents(projectPath);
  await assertRenderedOpencodeModels(projectPath);
  await assertCanonicalProfileOverridesRender(projectPath);

  const doctorOutput = await harness("doctor", "--project", projectPath);
  assertIncludes(doctorOutput, "PASS  opencode.jsonc parsed");
  assertIncludes(doctorOutput, "PASS  OpenCode command surface [minimal] required normal commands present");
  assertIncludes(doctorOutput, "PASS  OpenCode command surface [minimal] advanced commands absent");
  assertIncludes(doctorOutput, "PASS  .opencode/commands/harness-incident.md frontmatter parsed");
  assertIncludes(doctorOutput, "PASS  OpenCode model [OK] .opencode/agents/harness-builder.md model openai/gpt-5.5 matches profile think.default.");
  assertIncludes(doctorOutput, "PASS  OpenCode model [OK] .opencode/agents/harness-coder.md model openai/gpt-5.3-codex matches profile build.default.");
  assertIncludes(doctorOutput, "PASS  OpenCode model [OK] .opencode/agents/harness-reviewer.md model opencode-go/glm-5.1 matches profile review.default.");
  assertIncludes(doctorOutput, "PASS  OpenCode model [OK] .opencode/agents/harness-validator.md model opencode-go/deepseek-v4-flash matches profile run.default.");

  await assertDoctorModelDriftStates(projectPath);

  const manifest = await readManifest(projectPath);
  assert(manifest.managedFiles.some((file) => file.path === ".opencode/commands/harness.md"), "manifest must include minimal OpenCode commands");
  assert(!manifest.managedFiles.some((file) => file.path === ".opencode/commands/harness-feature.md"), "minimal install must not include advanced OpenCode commands in manifest");
  assert(manifest.managedFiles.some((file) => file.path === ".opencode/agents/harness-validator.md"), "manifest must include harness validator agent");
  assert(manifest.managedFiles.some((file) => file.path === "opencode.jsonc"), "manifest must include project OpenCode config");
  assert(!manifest.managedFiles.some((file) => file.path.startsWith(".opencode/agents/validators/")), "manifest must not install validator snippet assets");

  const harnessConfig = await fs.readFile(path.join(projectPath, "harness.config.yaml"), "utf8");
  assertIncludes(harnessConfig, 'opencode:\n  commandSurface: "minimal"');

  const projectConfig = await fs.readFile(path.join(projectPath, "opencode.jsonc"), "utf8");
  assertIncludes(projectConfig, '"plugin": ["opencode-tasks"]');
  assert(await pathExists(path.join(projectPath, ".harness", "model-profiles.yml")), "OpenCode install must include .harness/model-profiles.yml");

  const validatorContent = await fs.readFile(path.join(projectPath, ".opencode", "agents", "harness-validator.md"), "utf8");
  assertIncludes(validatorContent, "# Generic Validator Guidance");
  assertIncludes(validatorContent, "# Scheduled Validator Guidance");
  assertIncludes(validatorContent, "model: opencode-go/deepseek-v4-flash");
  assertExcludes(validatorContent, validatorSnippetPathText);
  assert(!(await pathExists(path.join(projectPath, ".opencode", "agents", "validators"))), "project must not contain installed validator snippet directory");

  await assertFullOpencodeInstall(path.join(path.dirname(projectPath), `${path.basename(projectPath)}-full`));
}

async function assertDoctorFailures(projectPath) {
  const activePath = path.join(projectPath, ".task", "active.json");
  await fs.writeFile(activePath, `${JSON.stringify({ taskId: "2099-01-01/missing-task", phase: "analysis", allowedToCode: false }, null, 2)}\n`, "utf8");
  const missingTaskDoctor = await harnessAllowFailure("doctor", "--project", projectPath);
  assert(missingTaskDoctor.code !== 0, "doctor must fail when active task directory is missing");
  assertIncludes(missingTaskDoctor.stdout, "FAIL  .task/2099-01-01/missing-task missing");

  const skillPath = path.join(projectPath, ".agents", "skills", "bad-smoke-skill", "SKILL.md");
  await fs.mkdir(path.dirname(skillPath), { recursive: true });
  await fs.writeFile(skillPath, "---\ndescription: Missing name for smoke test.\n---\n\n# Bad Smoke Skill\n", "utf8");
  const badSkillDoctor = await harnessAllowFailure("doctor", "--project", projectPath);
  assert(badSkillDoctor.code !== 0, "doctor must fail when skill name is missing");
  assertIncludes(badSkillDoctor.stdout, "FAIL  .agents/skills/bad-smoke-skill/SKILL.md missing required frontmatter: name");

  await fs.rm(path.dirname(skillPath), { recursive: true, force: true });
  await fs.rm(activePath, { force: true });
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
  await assertMinimalOpencodeCommandsAndAgents(projectPath);

  const diffOutput = await harness("diff", "--project", projectPath);
  assertIncludes(diffOutput, "unchanged: .opencode/commands/harness.md");
  assertIncludes(diffOutput, "unchanged: .opencode/agents/harness-validator.md");
  assertIncludes(diffOutput, "unchanged: opencode.jsonc");

  const manifest = await readManifest(projectPath);
  assert(manifest.managedFiles.some((file) => file.path === ".opencode/commands/harness.md"), "backfill must add minimal OpenCode command to manifest");
  assert(!manifest.managedFiles.some((file) => file.path === ".opencode/commands/harness-feature.md"), "backfill minimal mode must not add advanced OpenCode command to manifest");
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

async function assertMinimalOpencodeCommandsAndAgents(projectPath) {
  await assertCommandSurface(projectPath, { mode: "minimal" });
  assert(await pathExists(path.join(projectPath, ".opencode", "agents", "harness-builder.md")), "OpenCode harness-builder agent must exist");
  assert(await pathExists(path.join(projectPath, ".opencode", "agents", "harness-critic.md")), "OpenCode harness-critic agent must exist");
  assert(await pathExists(path.join(projectPath, ".opencode", "agents", "harness-indexer.md")), "OpenCode harness-indexer agent must exist");
  assert(await pathExists(path.join(projectPath, ".opencode", "agents", "harness-planner.md")), "OpenCode harness-planner agent must exist");
  assert(await pathExists(path.join(projectPath, ".opencode", "agents", "harness-reviewer.md")), "OpenCode harness-reviewer agent must exist");
  assert(await pathExists(path.join(projectPath, ".opencode", "agents", "harness-validator.md")), "OpenCode harness-validator agent must exist");
}

async function assertFullOpencodeInstall(projectPath) {
  await cleanupPaths(projectPath);

  const initOutput = await harness("init", "--project", projectPath, "--auto", "--with-opencode", "--opencode-command-surface", "full");
  for (const command of advancedOpencodeCommands) {
    assertIncludes(initOutput, `new-managed: .opencode/commands/${command}`);
  }

  const harnessConfig = await fs.readFile(path.join(projectPath, "harness.config.yaml"), "utf8");
  assertIncludes(harnessConfig, 'opencode:\n  commandSurface: "full"');

  await assertCommandSurface(projectPath, { mode: "full" });

  let doctorOutput = await harness("doctor", "--project", projectPath);
  assertIncludes(doctorOutput, "PASS  OpenCode command surface [full] required normal commands present");
  assertIncludes(doctorOutput, "PASS  OpenCode command surface [full] advanced commands present");

  const diffOutput = await harness("diff", "--project", projectPath);
  assertIncludes(diffOutput, "unchanged: .opencode/commands/harness-feature.md");
  assertIncludes(diffOutput, "unchanged: .opencode/commands/harness-status.md");

  const legacyConfig = harnessConfig.replace(/\n\nopencode:\n  commandSurface: "full"\n/u, "\n");
  await fs.writeFile(path.join(projectPath, "harness.config.yaml"), legacyConfig, "utf8");

  const legacyDiffOutput = await harness("diff", "--project", projectPath);
  assertIncludes(legacyDiffOutput, "unchanged: .opencode/commands/harness-feature.md");
  assertIncludes(legacyDiffOutput, "unchanged: .opencode/commands/harness-status.md");

  doctorOutput = await harness("doctor", "--project", projectPath);
  assertIncludes(doctorOutput, "PASS  OpenCode command surface [legacy-full] required normal commands present");
  assertIncludes(doctorOutput, "PASS  OpenCode command surface [legacy-full] advanced commands present");

  const invalidConfig = `${legacyConfig.replace(/\s*$/u, "")}\n\nopencode:\n  commandSurface: "surprise"\n`;
  await fs.writeFile(path.join(projectPath, "harness.config.yaml"), invalidConfig, "utf8");
  let invalidDoctor = await harnessAllowFailure("doctor", "--project", projectPath);
  assert(invalidDoctor.code !== 0, "doctor must fail when opencode.commandSurface is invalid");
  assertIncludes(invalidDoctor.stdout, "FAIL  harness.config.yaml opencode.commandSurface invalid: expected minimal|full, got surprise");

  await fs.writeFile(path.join(projectPath, "harness.config.yaml"), harnessConfig, "utf8");
  await fs.rm(path.join(projectPath, ".opencode", "commands", "harness.md"));
  invalidDoctor = await harnessAllowFailure("doctor", "--project", projectPath);
  assert(invalidDoctor.code !== 0, "doctor must fail when a required normal command is missing");
  assertIncludes(invalidDoctor.stdout, "FAIL  OpenCode command surface [full] missing required normal command(s): .opencode/commands/harness.md");
}

async function assertCommandSurface(projectPath, { mode }) {
  const commandsRoot = path.join(projectPath, ".opencode", "commands");
  for (const command of normalOpencodeCommands) {
    assert(await pathExists(path.join(commandsRoot, command)), `${mode} OpenCode install must include ${command}`);
  }

  for (const command of advancedOpencodeCommands) {
    const exists = await pathExists(path.join(commandsRoot, command));
    if (mode === "full") {
      assert(exists, `full OpenCode install must include ${command}`);
    } else {
      assert(!exists, `minimal OpenCode install must not include ${command}`);
    }
  }
}

async function assertRenderedOpencodeModels(projectPath) {
  const expectedModels = await readExpectedAgentModels(projectPath);

  for (const [agentName, expectedModel] of Object.entries(expectedModels)) {
    assert(typeof expectedModel === "string" && expectedModel.length > 0, `Expected model profile default for ${agentName}`);
    const agentContent = await fs.readFile(path.join(projectPath, ".opencode", "agents", `${agentName}.md`), "utf8");
    assertIncludes(agentContent, `model: ${expectedModel}`);
    assertExcludes(agentContent, "{{MODEL_PROFILE_");
  }
}

async function assertCanonicalProfileOverridesRender(projectPath) {
  const modelProfilesPath = path.join(projectPath, ".harness", "model-profiles.yml");
  const originalProfiles = await fs.readFile(modelProfilesPath, "utf8");
  const overriddenProfiles = originalProfiles
    .replace("default: \"openai/gpt-5.5\"", "default: \"smoke/think-override\"")
    .replace("default: \"openai/gpt-5.3-codex\"", "default: \"smoke/build-override\"")
    .replace("default: \"opencode-go/glm-5.1\"", "default: \"smoke/review-override\"")
    .replace("default: \"opencode-go/deepseek-v4-flash\"", "default: \"smoke/run-override\"");
  assert(overriddenProfiles !== originalProfiles, "Expected canonical profile override fixture to change model defaults");

  try {
    await fs.writeFile(modelProfilesPath, overriddenProfiles, "utf8");
    const diffOutput = await harness("diff", "--project", projectPath, "--with-opencode");
    assertIncludes(diffOutput, "update: .opencode/agents/harness-builder.md");
    assertIncludes(diffOutput, "update: .opencode/agents/harness-coder.md");
    assertIncludes(diffOutput, "update: .opencode/agents/harness-reviewer.md");
    assertIncludes(diffOutput, "update: .opencode/agents/harness-validator.md");

    await harness("sync", "--project", projectPath, "--with-opencode");
    const overriddenModels = await readExpectedAgentModels(projectPath);
    for (const [agentName, expectedModel] of Object.entries(overriddenModels)) {
      const agentContent = await fs.readFile(path.join(projectPath, ".opencode", "agents", `${agentName}.md`), "utf8");
      assertIncludes(agentContent, `model: ${expectedModel}`);
    }
  } finally {
    await fs.writeFile(modelProfilesPath, originalProfiles, "utf8");
    await harness("sync", "--project", projectPath, "--with-opencode");
    await assertRenderedOpencodeModels(projectPath);
  }
}

async function assertDoctorModelDriftStates(projectPath) {
  const builderPath = path.join(projectPath, ".opencode", "agents", "harness-builder.md");
  const reviewerPath = path.join(projectPath, ".opencode", "agents", "harness-reviewer.md");
  const configPath = path.join(projectPath, "harness.config.yaml");
  const expectedModels = await readExpectedAgentModels(projectPath);

  const originalBuilder = await fs.readFile(builderPath, "utf8");
  const originalReviewer = await fs.readFile(reviewerPath, "utf8");
  const originalConfig = await fs.readFile(configPath, "utf8");

  const driftedBuilder = originalBuilder.replace(`model: ${expectedModels["harness-builder"]}`, "model: smoke/drifted-think");
  assert(driftedBuilder !== originalBuilder, "Expected harness-builder test fixture replacement to change the model");

  try {
    await fs.writeFile(builderPath, driftedBuilder, "utf8");
    let doctor = await harnessAllowFailure("doctor", "--project", projectPath);
    assert(doctor.code === 0, "doctor drift diagnostics should report DRIFTED without hard failure");
    assertIncludes(doctor.stdout, `WARN  OpenCode model [DRIFTED] .opencode/agents/harness-builder.md model drifted to smoke/drifted-think; expected ${expectedModels["harness-builder"]} from profile think.default.`);

    await fs.writeFile(builderPath, originalBuilder.replace(`model: ${expectedModels["harness-builder"]}`, "model: {{MODEL_PROFILE_THINK}}"), "utf8");
    doctor = await harnessAllowFailure("doctor", "--project", projectPath);
    assert(doctor.code !== 0, "doctor must fail when unresolved placeholders remain in runtime OpenCode files");
    assertIncludes(doctor.stdout, "FAIL  OpenCode placeholder [UNRESOLVED] .opencode/agents/harness-builder.md still contains MODEL_PROFILE placeholders.");

    await fs.writeFile(builderPath, originalBuilder, "utf8");
    await fs.rm(reviewerPath);
    doctor = await harnessAllowFailure("doctor", "--project", projectPath);
    assert(doctor.code === 0, "doctor drift diagnostics should report MISSING without hard failure");
    assertIncludes(doctor.stdout, `WARN  OpenCode model [MISSING] .opencode/agents/harness-reviewer.md missing; expected model ${expectedModels["harness-reviewer"]} from profile review.default.`);

    await fs.writeFile(reviewerPath, originalReviewer, "utf8");
    await fs.writeFile(configPath, originalConfig.replace("default: \"openai/gpt-5.5\"", "default: \"legacy/conflict-think\""), "utf8");
    doctor = await harnessAllowFailure("doctor", "--project", projectPath);
    assert(doctor.code === 0, "doctor drift diagnostics should report CONFLICT without hard failure");
    assertIncludes(doctor.stdout, `WARN  OpenCode model [CONFLICT] .opencode/agents/harness-builder.md profile think.default conflicts between .harness/model-profiles.yml (${expectedModels["harness-builder"]}) and harness.config.yaml (legacy/conflict-think).`);
  } finally {
    await fs.writeFile(builderPath, originalBuilder, "utf8");
    await fs.writeFile(reviewerPath, originalReviewer, "utf8");
    await fs.writeFile(configPath, originalConfig, "utf8");
  }
}

async function readExpectedAgentModels(projectPath) {
  const profileSource = parseSimpleYaml(await fs.readFile(path.join(projectPath, ".harness", "model-profiles.yml"), "utf8"));
  return {
    "harness-builder": profileSource.profiles?.think?.default,
    "harness-planner": profileSource.profiles?.think?.default,
    "harness-coder": profileSource.profiles?.build?.default,
    "harness-reviewer": profileSource.profiles?.review?.default,
    "harness-critic": profileSource.profiles?.review?.default,
    "harness-validator": profileSource.profiles?.run?.default,
    "harness-indexer": profileSource.profiles?.run?.default
  };
}

async function assertP1DocsAndTemplateCoverage() {
  const builderTemplate = await fs.readFile(path.join(repoRoot, "templates", "opencode", "agents", "harness-builder.md"), "utf8");
  const coderTemplate = await fs.readFile(path.join(repoRoot, "templates", "opencode", "agents", "harness-coder.md"), "utf8");
  const criticTemplate = await fs.readFile(path.join(repoRoot, "templates", "opencode", "agents", "harness-critic.md"), "utf8");
  const reviewerTemplate = await fs.readFile(path.join(repoRoot, "templates", "opencode", "agents", "harness-reviewer.md"), "utf8");
  const continueCommand = await fs.readFile(path.join(repoRoot, "templates", "opencode", "commands", "harness-continue.md"), "utf8");
  const workflowTemplate = await fs.readFile(path.join(repoRoot, "templates", "docs", "project", "harness-workflow.md"), "utf8");
  const incidentCommand = await fs.readFile(path.join(repoRoot, "templates", "opencode", "commands", "harness-incident.md"), "utf8");
  const incidentSkill = await fs.readFile(path.join(repoRoot, "skills", "incident-pack-builder", "SKILL.md"), "utf8");
  const hypothesisSkill = await fs.readFile(path.join(repoRoot, "skills", "hypothesis-critic", "SKILL.md"), "utf8");
  const contextPackSkill = await fs.readFile(path.join(repoRoot, "skills", "context-pack-builder", "SKILL.md"), "utf8");
  const knowledgeMapTemplate = await fs.readFile(path.join(repoRoot, "templates", "docs", "project", "knowledge-map.md"), "utf8");

  assertIncludes(criticTemplate, "model: {{MODEL_PROFILE_REVIEW}}");
  assertIncludes(criticTemplate, "Your model field is rendered from `.harness/model-profiles.yml` profile `profiles.review.default` when present, with legacy fallback to `harness.config.yaml` `models.profiles.review.default` only when needed.");
  assertIncludes(coderTemplate, "Your responsibility is implementation plus lightweight self-check, not independent review.");
  assertIncludes(coderTemplate, "Do not perform broad `git diff` review, repository-wide search, gate audit, requirement audit, or docs/knowledge-map review");
  assertIncludes(reviewerTemplate, "## Diff-First Review Protocol");
  assertIncludes(reviewerTemplate, "Do not re-review requirement freezing, implementation-plan quality, context-pack sufficiency, or harness gate state");
  assertIncludes(reviewerTemplate, "Repository-wide search is an exception, not the default.");
  assertIncludes(criticTemplate, "The caller must state the critic mode:");
  assertIncludes(criticTemplate, "`plan-review`: runs before coding for Tier L or high-risk work.");
  assertIncludes(criticTemplate, "`pre-done`: runs after coding, validation, and `harness-reviewer` for the current approved slice or group.");
  assertIncludes(criticTemplate, "Do not read full code diffs in `pre-done` unless reviewer evidence is missing");
  assertIncludes(criticTemplate, "PASS | PASS_WITH_WARNINGS | BLOCKED");
  assertIncludes(builderTemplate, "For `harness-coder`, request implementation plus lightweight self-check only.");
  assertIncludes(builderTemplate, "For `harness-reviewer`, request `diff-review` of the current slice or repair and provide changed files.");
  assertIncludes(builderTemplate, "For `harness-critic`, always state `plan-review` or `pre-done`.");
  assertIncludes(continueCommand, "route to `harness-reviewer` in bounded `diff-review` mode");
  assertIncludes(continueCommand, "route to `harness-critic` in `pre-done` mode");
  assertIncludes(workflowTemplate, "Review is diff-first and bounded to the current approved slice or group.");
  assertIncludes(workflowTemplate, "The coding agent may perform lightweight self-check");

  const incidentFrontmatter = parseSimpleFrontmatter(incidentCommand);
  assert(incidentFrontmatter.description?.length > 0, "harness-incident template must declare description frontmatter");
  assert(incidentFrontmatter.agent === "harness-builder", "harness-incident template must route to harness-builder");

  const incidentSkillFrontmatter = parseSimpleFrontmatter(incidentSkill);
  assert(incidentSkillFrontmatter.name === "incident-pack-builder", "incident-pack-builder skill must declare its name");
  assert(incidentSkillFrontmatter.description?.length > 0, "incident-pack-builder skill must declare description frontmatter");

  const hypothesisSkillFrontmatter = parseSimpleFrontmatter(hypothesisSkill);
  assert(hypothesisSkillFrontmatter.name === "hypothesis-critic", "hypothesis-critic skill must declare its name");
  assert(hypothesisSkillFrontmatter.description?.length > 0, "hypothesis-critic skill must declare description frontmatter");

  assertIncludes(contextPackSkill, "Read `docs/project/knowledge-map.md` to route only the most relevant docs and rules.");
  assertIncludes(contextPackSkill, "load only nearby `MODULE_RULES.md`, `AGENTS.md`, or `HARNESS_RULES.md` files");
  assertIncludes(contextPackSkill, "### Global Rules");
  assertIncludes(contextPackSkill, "### Knowledge Map Matches");
  assertIncludes(contextPackSkill, "### Path-Proximity Rules");
  assertIncludes(contextPackSkill, "### Excluded Context");

  for (const field of ["- Areas:", "- Tags:", "- Docs:", "- Rules:", "- Read When:", "- Boundaries:", "- Validation:"]) {
    assertIncludes(knowledgeMapTemplate, field);
  }
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

async function assertTaskStateContractTemplate() {
  const workflowTemplate = await fs.readFile(path.join(repoRoot, "templates", "docs", "project", "harness-workflow.md"), "utf8");
  assertIncludes(workflowTemplate, "## Task State Contract");
  assertIncludes(workflowTemplate, "`taskId` is a relative task path under `.task/`, using `yyyy-MM-dd/task-slug`");
  assertIncludes(workflowTemplate, "### `.task/active.json`");
  assertIncludes(workflowTemplate, "### `.task/<task-id>/state.json`");
  assertIncludes(workflowTemplate, "| `taskId` | string | yes | Active task path. |");
  assertIncludes(workflowTemplate, "| `status` | string | no | Task status: `in_progress`, `completed`, or `blocked`. |");
  assertIncludes(workflowTemplate, "Its `taskId` must match `.task/active.json.taskId`.");
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

function parseSimpleFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert(match, "Expected Markdown file to start with frontmatter");
  const frontmatter = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    frontmatter[key] = value;
  }
  return frontmatter;
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

async function harnessAllowFailure(...args) {
  return execAllowFailure(process.execPath, [harnessBin, ...args], repoRoot);
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

async function execAllowFailure(command, args, cwd) {
  return new Promise((resolve) => {
    execFile(command, args, { cwd, encoding: "utf8" }, (error, stdout, stderr) => {
      resolve({ code: error?.code ?? 0, stdout, stderr });
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
