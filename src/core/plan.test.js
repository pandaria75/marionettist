import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildPlan } from "./plan.js";

function buildPlanOptions(overrides = {}) {
  return {
    project: overrides.project,
    auto: true,
    dryRun: true,
    force: false,
    variables: {
      projectName: "Smoke Project",
      projectType: "node",
      architecture: "monolith",
      primaryLanguage: "javascript",
      ...(overrides.variables ?? {})
    },
    withOpencode: false,
    conflictStrategies: {},
    ...overrides
  };
}

async function withTempProject(testContext, callback) {
  const projectPath = await fs.mkdtemp(path.join(os.tmpdir(), "harness-plan-test-"));
  testContext.after(async () => {
    await fs.rm(projectPath, { recursive: true, force: true });
  });
  await callback(projectPath);
}

async function applyManagedOperations(plan) {
  for (const operation of plan.operations) {
    if (operation.type === "directory") {
      await fs.mkdir(operation.targetPath, { recursive: true });
      continue;
    }

    if (typeof operation.content !== "string") {
      continue;
    }

    if (operation.status === "modified-local" || operation.status === "conflict" || operation.status === "orphan-managed") {
      continue;
    }

    await fs.mkdir(path.dirname(operation.targetPath), { recursive: true });
    await fs.writeFile(operation.targetPath, operation.content, "utf8");
  }
}

test("buildPlan rerenders OpenCode agents when only model profile config changes", async (t) => {
  await withTempProject(t, async (projectPath) => {
    const initPlan = await buildPlan(projectPath, "init", buildPlanOptions({ project: projectPath, withOpencode: true }));
    await applyManagedOperations(initPlan);

    const initialBuilderOperation = initPlan.operations.find((operation) => operation.targetRelative === ".opencode/agents/harness-builder.md");
    const initialBuilderRecord = initPlan.manifest.managedFiles.find((file) => file.path === ".opencode/agents/harness-builder.md");
    assert(initialBuilderOperation, "expected initial OpenCode builder operation");
    assert(initialBuilderRecord, "expected initial OpenCode builder manifest record");

    const profilesPath = path.join(projectPath, ".harness", "model-profiles.yml");
    const originalProfiles = await fs.readFile(profilesPath, "utf8");
    await fs.writeFile(
      profilesPath,
      originalProfiles.replace(/default: "[^"]+"/, 'default: "config-only-rerender-think"'),
      "utf8"
    );

    const syncPlan = await buildPlan(projectPath, "sync", buildPlanOptions({ project: projectPath, withOpencode: true }));
    const builderSyncOperation = syncPlan.operations.find((operation) => operation.targetRelative === ".opencode/agents/harness-builder.md");
    assert(builderSyncOperation, "expected sync plan OpenCode builder operation");
    assert.equal(builderSyncOperation.status, "update");
    assert(builderSyncOperation.content.includes("model: config-only-rerender-think"), "expected config-only model profile change to rerender builder model");
    assert.equal(builderSyncOperation.templateHash, initialBuilderRecord.templateHash, "expected config-only change to preserve templateHash");
    assert.notEqual(builderSyncOperation.renderInputHash, initialBuilderRecord.renderInputHash, "expected config-only change to alter renderInputHash");
    assert.notEqual(builderSyncOperation.renderedHash, initialBuilderOperation.renderedHash, "expected config-only change to alter renderedHash");
  });
});

test("buildPlan records future pathway OpenCode sources when present and falls back otherwise", async (t) => {
  const futureSource = path.join(process.cwd(), "templates", "pathways", "opencode", "commands", "slice-3-plan-source.md");
  const legacySource = path.join(process.cwd(), "templates", "opencode", "commands", "slice-3-plan-source.md");

  await fs.mkdir(path.dirname(legacySource), { recursive: true });
  await fs.writeFile(legacySource, "legacy command", "utf8");

  t.after(async () => {
    await fs.rm(futureSource, { force: true });
    await fs.rm(legacySource, { force: true });
  });

  await withTempProject(t, async (projectPath) => {
    let plan = await buildPlan(projectPath, "init", buildPlanOptions({ project: projectPath, withOpencode: true, opencodeCommandSurface: "advanced" }));
    let operation = plan.operations.find((entry) => entry.targetRelative === ".opencode/commands/slice-3-plan-source.md");
    assert(operation, "expected legacy fallback command to be planned");
    assert.equal(operation.sourceRelative, "templates/opencode/commands/slice-3-plan-source.md");

    await fs.mkdir(path.dirname(futureSource), { recursive: true });
    await fs.writeFile(futureSource, "future command", "utf8");

    plan = await buildPlan(projectPath, "init", buildPlanOptions({ project: projectPath, withOpencode: true, opencodeCommandSurface: "advanced" }));
    operation = plan.operations.find((entry) => entry.targetRelative === ".opencode/commands/slice-3-plan-source.md");
    assert(operation, "expected future pathway command to be planned");
    assert.equal(operation.sourceRelative, "templates/pathways/opencode/commands/slice-3-plan-source.md");
    assert.equal(operation.content, "future command");
  });
});

test("buildPlan rerenders OpenCode agents when resolved agent override values change in config only", async (t) => {
  await withTempProject(t, async (projectPath) => {
    const initPlan = await buildPlan(projectPath, "init", buildPlanOptions({ project: projectPath, withOpencode: true }));
    await applyManagedOperations(initPlan);

    const initialBuilderRecord = initPlan.manifest.managedFiles.find((file) => file.path === ".opencode/agents/harness-builder.md");
    assert(initialBuilderRecord, "expected initial OpenCode builder manifest record");

    const initialReviewerContent = await fs.readFile(path.join(projectPath, ".opencode", "agents", "harness-reviewer.md"), "utf8");

    const profilesPath = path.join(projectPath, ".harness", "model-profiles.yml");
    await fs.writeFile(profilesPath, [
      "profiles:",
      "  think:",
      "    description: \"Deep reasoning, planning, and gate decisions\"",
      "    default: \"openai/gpt-5.5\"",
      "    temperature: 0.1",
      "    agentOverrides:",
      "      harness-builder:",
      "        model: \"override/builder\"",
      "        temperature: 0.7",
      "  build:",
      "    description: \"Focused coding and implementation from approved task context\"",
      "    default: \"openai/gpt-5.4\"",
      "    temperature: 0.1",
      "  review:",
      "    description: \"Reflective, cautious, nuanced review\"",
      "    default: \"opencode-go/glm-5.1\"",
      "    temperature: 0",
      "  run:",
      "    description: \"Fast utility work such as indexing and validation\"",
      "    default: \"opencode-go/deepseek-v4-flash\"",
      "    temperature: 0",
      "",
    ].join("\n"), "utf8");

    const syncPlan = await buildPlan(projectPath, "sync", buildPlanOptions({ project: projectPath, withOpencode: true }));
    const builderSyncOperation = syncPlan.operations.find((operation) => operation.targetRelative === ".opencode/agents/harness-builder.md");
    const reviewerSyncOperation = syncPlan.operations.find((operation) => operation.targetRelative === ".opencode/agents/harness-reviewer.md");
    assert(builderSyncOperation, "expected sync plan OpenCode builder operation");
    assert(reviewerSyncOperation, "expected sync plan OpenCode reviewer operation");

    assert.equal(builderSyncOperation.status, "update");
    assert(builderSyncOperation.content.includes("model: override/builder"), "expected builder override model to rerender");
    assert(builderSyncOperation.content.includes("temperature: 0.7"), "expected builder override temperature to rerender");
    assert.equal(builderSyncOperation.templateHash, initialBuilderRecord.templateHash, "expected config-only builder change to preserve templateHash");
    assert.notEqual(builderSyncOperation.renderInputHash, initialBuilderRecord.renderInputHash, "expected builder renderInputHash to change when resolved variables change");

    assert.equal(reviewerSyncOperation.status, "unchanged");
    assert.equal(reviewerSyncOperation.content, initialReviewerContent, "expected unrelated agent rendered content to remain stable");
  });
});

test("buildPlan renders harness.config.yaml from persisted plan selections", async (t) => {
  await withTempProject(t, async (projectPath) => {
    const plan = await buildPlan(projectPath, "init", buildPlanOptions({
      project: projectPath,
      withOpencode: true,
      distributionMode: "adapter",
      opencodeCommandSurface: "standard",
      opencodePermissionMode: "moderate"
    }));

    const harnessConfigOperation = plan.operations.find((operation) => operation.targetRelative === "harness.config.yaml");
    assert(harnessConfigOperation, "expected harness.config.yaml operation");
    assert(harnessConfigOperation.content.includes('distribution:\n  mode: "adapter"'));
    assert(harnessConfigOperation.content.includes('opencode:\n  commandSurface: "standard"\n  permissionMode: "moderate"'));
    assert(typeof harnessConfigOperation.renderInputHash === "string" && harnessConfigOperation.renderInputHash.length > 0, "expected harness.config.yaml renderInputHash metadata");
  });
});

test("buildPlan canonicalizes legacy harness.config model profiles into .harness/model-profiles.yml", async (t) => {
  await withTempProject(t, async (projectPath) => {
    await fs.writeFile(path.join(projectPath, "harness.config.yaml"), [
      'models:',
      '  profiles:',
      '    think:',
      '      default: "legacy/think"',
      '    build:',
      '      default: "legacy/build"',
      ''
    ].join("\n"), "utf8");

    const plan = await buildPlan(projectPath, "init", buildPlanOptions({ project: projectPath }));
    const modelProfilesOperation = plan.operations.find((operation) => operation.targetRelative === ".harness/model-profiles.yml");
    assert(modelProfilesOperation, "expected canonical model profiles operation");
    assert(modelProfilesOperation.content.includes('  think:\n    description: '), "expected canonical model profile content");
    assert(modelProfilesOperation.content.includes('    default: "legacy/think"'));
    assert(modelProfilesOperation.content.includes('    default: "legacy/build"'));
    assert(modelProfilesOperation.content.includes('    temperature: 0.1'));
    assert(!modelProfilesOperation.content.includes("fallback:"), "expected canonical output to omit legacy fallback field");
    assert(!modelProfilesOperation.content.includes("{{MODEL_PROFILE_"), "expected legacy model profile render to finalize to concrete content");
  });
});

test("buildPlan preserves orphan render metadata for removed managed records", async (t) => {
  await withTempProject(t, async (projectPath) => {
    await fs.mkdir(path.join(projectPath, ".harness"), { recursive: true });
    await fs.writeFile(path.join(projectPath, ".harness", "manifest.json"), `${JSON.stringify({
      schemaVersion: 1,
      frameworkVersion: "0.0.0-test",
      installedAt: "2026-06-15T00:00:00.000Z",
      updatedAt: "2026-06-15T00:00:00.000Z",
      managedFiles: [{
        path: "removed.txt",
        source: "templates/removed.txt",
        kind: "file",
        hash: "managed-compatibility-hash",
        renderedHash: "rendered-file-hash",
        templateHash: "template-hash",
        renderInputHash: "render-input-hash"
      }]
    }, null, 2)}\n`, "utf8");

    const plan = await buildPlan(projectPath, "sync", buildPlanOptions({ project: projectPath }));
    const orphanOperation = plan.operations.find((operation) => operation.targetRelative === "removed.txt");
    assert(orphanOperation, "expected orphan operation for removed managed record");
    assert.equal(orphanOperation.status, "orphan-managed");
    assert.equal(orphanOperation.previousHash, "managed-compatibility-hash");
    assert.equal(orphanOperation.frameworkHash, "managed-compatibility-hash");
    assert.equal(orphanOperation.renderedHash, "rendered-file-hash");
    assert.equal(orphanOperation.templateHash, "template-hash");
    assert.equal(orphanOperation.renderInputHash, "render-input-hash");
  });
});
