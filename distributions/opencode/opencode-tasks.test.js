import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import plugin from "./plugin/opencode-tasks.js";

async function withTempProject(testContext, callback) {
  const projectPath = await fs.mkdtemp(path.join(os.tmpdir(), "marionettist-opencode-plugin-test-"));
  testContext.after(async () => {
    await fs.rm(projectPath, { recursive: true, force: true });
  });
  await callback(projectPath);
}

test("package plugin registers standard Marionettist agents and configured command surface", async (t) => {
  await withTempProject(t, async (projectPath) => {
    await fs.mkdir(path.join(projectPath, ".marionettist"), { recursive: true });
    await fs.writeFile(path.join(projectPath, ".marionettist", "model-profiles.yml"), [
      "profiles:",
      "  think:",
      "    default: \"project/think\"",
      "    temperature: 0.2",
      "    agentOverrides:",
      "      harness-builder:",
      "        model: \"override/builder\"",
      "  build:",
      "    default: \"project/build\"",
      "    temperature: 0.3",
      "    agentOverrides:",
      "      marionettist-coder:",
      "        temperature: 0.0",
      "  review:",
      "    default: \"project/review\"",
      "  run:",
      "    default: \"project/run\"",
      ""
    ].join("\n"), "utf8");
    await fs.writeFile(path.join(projectPath, "marionettist.config.yaml"), [
      "opencode:",
      "  commandSurface: \"standard\"",
      "  permissionMode: \"moderate\"",
      ""
    ].join("\n"), "utf8");

    const hooks = await plugin({ directory: projectPath });
    const cfg = {};
    hooks.config(cfg);

    assert.equal(cfg.agent["marionettist-builder"].model, "override/builder");
    assert.equal(cfg.agent["marionettist-builder"].temperature, 0.2);
    assert.equal(cfg.agent["marionettist-coder"].model, "project/build");
    assert.equal(cfg.agent["marionettist-coder"].temperature, 0.0);
    assert.equal(cfg.agent["marionettist-reviewer"].model, "project/review");
    assert.equal(cfg.agent["marionettist-validator"].model, "project/run");
    assert.equal(cfg.agent["marionettist-coder"].permission.webfetch, "allow");
    assert.equal(cfg.agent["marionettist-coder"].permission.task["*"], "deny");
    assert.equal(cfg.agent["marionettist-coder"].permission.task["marionettist-indexer"], "allow");
    assert(!cfg.agent["marionettist-coder"].prompt.includes("{{"));

    for (const name of [
      "marionettist",
      "marionettist-dev",
      "marionettist-incident",
      "marionettist-docs",
      "marionettist-config",
      "marionettist-context",
      "marionettist-status",
      "marionettist-continue",
      "marionettist-pathway-prototype",
      "marionettist-pathway-config"
    ]) {
      assert(cfg.command[name], `expected command ${name}`);
      assert(!cfg.command[name].template.includes("{{"));
    }

    assert.equal(cfg.command["marionettist-feature"], undefined);
    assert.equal(cfg.command["marionettist-bugfix"], undefined);
    assert.equal(cfg.command["marionettist-refactor"], undefined);
    assert(Array.isArray(cfg.skills.paths));
    assert(cfg.skills.paths.some((entry) => entry.endsWith("distributions/opencode/pathway-skills")));
  });
});

test("package plugin falls back to legacy model profiles and minimal surface defaults", async (t) => {
  await withTempProject(t, async (projectPath) => {
    await fs.writeFile(path.join(projectPath, "marionettist.config.yaml"), [
      "models:",
      "  profiles:",
      "    think:",
      "      default: \"legacy/think\"",
      "    build:",
      "      default: \"legacy/build\"",
      "    review:",
      "      default: \"legacy/review\"",
      "    run:",
      "      default: \"legacy/run\"",
      ""
    ].join("\n"), "utf8");

    const hooks = await plugin({ directory: projectPath });
    const cfg = {};
    hooks.config(cfg);

    assert.equal(cfg.agent["marionettist-builder"].model, "legacy/think");
    assert.equal(cfg.agent["marionettist-coder"].model, "legacy/build");
    assert.equal(cfg.command["marionettist"].agent, "marionettist-builder");
    assert.equal(cfg.command["marionettist-context"], undefined);
    assert.equal(cfg.command["marionettist-feature"], undefined);
  });
});
