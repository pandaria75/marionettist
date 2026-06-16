import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildOpencodeAgentTemplateVariables,
  loadModelProfilesState,
  renderCanonicalModelProfiles,
  resolveAgentModelConfig
} from "./model-profiles.js";

async function withTempProject(testContext, callback) {
  const projectPath = await fs.mkdtemp(path.join(os.tmpdir(), "harness-model-profiles-test-"));
  testContext.after(async () => {
    await fs.rm(projectPath, { recursive: true, force: true });
  });
  await callback(projectPath);
}

test("loadModelProfilesState resolves profile defaults and agent overrides deterministically", async (t) => {
  await withTempProject(t, async (projectPath) => {
    await fs.mkdir(path.join(projectPath, ".harness"), { recursive: true });
    await fs.writeFile(path.join(projectPath, ".harness", "model-profiles.yml"), [
      "profiles:",
      "  think:",
      "    default: \"project/think\"",
      "    temperature: 0.3",
      "    fallback: \"ignored/legacy\"",
      "    agentOverrides:",
      "      harness-builder:",
      "        model: \"override/builder\"",
      "      harness-planner:",
      "        temperature: 0.7",
      "  review:",
      "    agentOverrides:",
      "      harness-reviewer:",
      "        model: \"override/reviewer\"",
      "        temperature: 0.4",
      ""
    ].join("\n"), "utf8");

    const state = await loadModelProfilesState(projectPath);

    assert.equal(state.source, "canonical");
    assert.equal(state.effectiveProfiles.think.default, "project/think");
    assert.equal(state.effectiveProfiles.think.temperature, 0.3);
    assert.deepEqual(state.effectiveProfiles.think.agentOverrides["harness-builder"], { model: "override/builder" });
    assert.deepEqual(state.effectiveProfiles.think.agentOverrides["harness-planner"], { temperature: 0.7 });

    assert.deepEqual(resolveAgentModelConfig(state.effectiveProfiles, "think", "harness-builder"), {
      model: "override/builder",
      temperature: 0.3
    });
    assert.deepEqual(resolveAgentModelConfig(state.effectiveProfiles, "think", "harness-planner"), {
      model: "project/think",
      temperature: 0.7
    });
    assert.deepEqual(resolveAgentModelConfig(state.effectiveProfiles, "review", "harness-reviewer"), {
      model: "override/reviewer",
      temperature: 0.4
    });
    assert.deepEqual(resolveAgentModelConfig(state.effectiveProfiles, "build", "harness-coder"), {
      model: state.frameworkDefaults.build.default,
      temperature: state.frameworkDefaults.build.temperature
    });
  });
});

test("loadModelProfilesState preserves legacy harness.config model profile defaults while ignoring fallback keys", async (t) => {
  await withTempProject(t, async (projectPath) => {
    await fs.writeFile(path.join(projectPath, "harness.config.yaml"), [
      "models:",
      "  profiles:",
      "    build:",
      "      default: \"legacy/build\"",
      "      fallback: \"legacy/ignored\"",
      "      temperature: 0.6",
      "      agentOverrides:",
      "        harness-coder:",
      "          temperature: 0.2",
      ""
    ].join("\n"), "utf8");

    const state = await loadModelProfilesState(projectPath);

    assert.equal(state.source, "legacy");
    assert.equal(state.effectiveProfiles.build.default, "legacy/build");
    assert.equal(state.effectiveProfiles.build.temperature, 0.6);
    assert.deepEqual(resolveAgentModelConfig(state.effectiveProfiles, "build", "harness-coder"), {
      model: "legacy/build",
      temperature: 0.2
    });
    assert.equal(resolveAgentModelConfig(state.effectiveProfiles, "build", "harness-builder").model, "legacy/build");
  });
});

test("renderCanonicalModelProfiles omits fallback and writes temperature and agent overrides", () => {
  const rendered = renderCanonicalModelProfiles({
    think: {
      description: "Think",
      default: "model/think",
      temperature: 0.1,
      agentOverrides: {
        "harness-builder": { model: "model/builder" },
        "harness-planner": { temperature: 0.5 }
      }
    },
    build: {
      description: "Build",
      default: "model/build",
      temperature: 0.2,
      agentOverrides: {}
    },
    review: {
      description: "Review",
      default: "model/review",
      temperature: 0,
      agentOverrides: {}
    },
    run: {
      description: "Run",
      default: "model/run",
      temperature: 0,
      agentOverrides: {}
    }
  });

  assert(rendered.includes("    temperature: 0.1"));
  assert(rendered.includes("    agentOverrides:\n      harness-builder:\n        model: \"model/builder\""));
  assert(rendered.includes("      harness-planner:\n        temperature: 0.5"));
  assert(!rendered.includes("fallback:"));
});

test("buildOpencodeAgentTemplateVariables exposes per-agent resolved model and temperature while preserving legacy profile variables", () => {
  const variables = buildOpencodeAgentTemplateVariables({
    think: {
      description: "Think",
      default: "model/think",
      temperature: 0.1,
      agentOverrides: {
        "harness-builder": { model: "model/builder", temperature: 0.6 }
      }
    },
    build: {
      description: "Build",
      default: "model/build",
      temperature: 0.2,
      agentOverrides: {
        "harness-coder": { temperature: 0.0 }
      }
    },
    review: {
      description: "Review",
      default: "model/review",
      temperature: 0,
      agentOverrides: {
        "harness-critic": { model: "model/critic" }
      }
    },
    run: {
      description: "Run",
      default: "model/run",
      temperature: 0,
      agentOverrides: {}
    }
  }, { projectName: "Smoke Project" });

  assert.equal(variables.projectName, "Smoke Project");
  assert.equal(variables.modelProfileThink, "model/think");
  assert.equal(variables.modelProfileBuild, "model/build");
  assert.equal(variables.modelProfileReview, "model/review");
  assert.equal(variables.modelProfileRun, "model/run");
  assert.equal(variables.harnessBuilderModel, "model/builder");
  assert.equal(variables.harnessBuilderTemperature, "0.6");
  assert.equal(variables.harnessPlannerModel, "model/think");
  assert.equal(variables.harnessPlannerTemperature, "0.1");
  assert.equal(variables.harnessCoderModel, "model/build");
  assert.equal(variables.harnessCoderTemperature, "0.0");
  assert.equal(variables.harnessCriticModel, "model/critic");
  assert.equal(variables.harnessCriticTemperature, "0.0");
  assert.equal(variables.harnessValidatorModel, "model/run");
  assert.equal(variables.harnessValidatorTemperature, "0.0");
});
