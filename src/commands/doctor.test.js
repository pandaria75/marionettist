import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { doctorCommand } from "./doctor.js";

async function withTempProject(testContext, callback) {
  const projectPath = await fs.mkdtemp(path.join(os.tmpdir(), "marionettist-doctor-test-"));
  testContext.after(async () => {
    await fs.rm(projectPath, { recursive: true, force: true });
  });
  await callback(projectPath);
}

async function captureLogs(callback) {
  const originalLog = console.log;
  const lines = [];
  console.log = (...args) => {
    lines.push(args.join(" "));
  };
  const previousExitCode = process.exitCode;
  process.exitCode = undefined;
  try {
    await callback();
  } finally {
    console.log = originalLog;
    process.exitCode = previousExitCode;
  }
  return lines;
}

test("doctor package plugin mode does not fail missing generated .opencode agents or commands", async (t) => {
  await withTempProject(t, async (projectPath) => {
    await fs.mkdir(path.join(projectPath, ".marionettist"), { recursive: true });
    await fs.mkdir(path.join(projectPath, ".aiassistant", "rules"), { recursive: true });
    await fs.mkdir(path.join(projectPath, "docs", "project"), { recursive: true });
    await fs.mkdir(path.join(projectPath, ".task"), { recursive: true });

    await fs.writeFile(path.join(projectPath, "AGENTS.md"), [
      "# Agents",
      "",
      "<!-- marionettist-kit:start -->",
      "managed",
      "<!-- marionettist-kit:end -->",
      ""
    ].join("\n"), "utf8");
    await fs.writeFile(path.join(projectPath, "marionettist.config.yaml"), [
      "opencode:",
      "  pluginSource: \"package\"",
      "  commandSurface: \"minimal\"",
      ""
    ].join("\n"), "utf8");
    await fs.writeFile(path.join(projectPath, ".marionettist", "manifest.json"), `${JSON.stringify({
      schemaVersion: 1,
      frameworkVersion: "test",
      opencodePluginSource: "package",
      managedFiles: [{ path: "opencode.jsonc", adapter: "opencode" }]
    }, null, 2)}\n`, "utf8");
    await fs.writeFile(path.join(projectPath, "opencode.jsonc"), [
      "{",
      "  \"plugin\": [\"marionettist-pathway-opencode\"]",
      "}",
      ""
    ].join("\n"), "utf8");
    await fs.writeFile(path.join(projectPath, "docs", "project", "knowledge-map.md"), "# Map\n", "utf8");
    await fs.writeFile(path.join(projectPath, "docs", "project", "marionettist-workflow.md"), "# Workflow\n", "utf8");

    const lines = await captureLogs(async () => {
      await doctorCommand(["--project", projectPath]);
    });

    assert(lines.some((line) => line.includes("PASS  OpenCode runtime source: package plugin")));
    assert(lines.some((line) => line.includes("PASS  OpenCode command surface [minimal] required normal commands provided by package plugin")));
    assert(lines.some((line) => line.includes("PASS  OpenCode package agents will use package-safe default model profiles because .marionettist/model-profiles.yml is missing")));
    assert(!lines.some((line) => line.includes("FAIL  OpenCode command surface")));
    assert(!lines.some((line) => line.includes("FAIL  .opencode/commands")));
    assert(!lines.some((line) => line.includes("FAIL  .opencode/agents")));
  });
});

test("doctor package plugin mode defaults command surface to minimal without local commands", async (t) => {
  await withTempProject(t, async (projectPath) => {
    await fs.mkdir(path.join(projectPath, ".marionettist"), { recursive: true });
    await fs.mkdir(path.join(projectPath, ".aiassistant", "rules"), { recursive: true });
    await fs.mkdir(path.join(projectPath, "docs", "project"), { recursive: true });
    await fs.mkdir(path.join(projectPath, ".task"), { recursive: true });

    await fs.writeFile(path.join(projectPath, "AGENTS.md"), [
      "# Agents",
      "",
      "<!-- marionettist-kit:start -->",
      "managed",
      "<!-- marionettist-kit:end -->",
      ""
    ].join("\n"), "utf8");
    await fs.writeFile(path.join(projectPath, "marionettist.config.yaml"), [
      "opencode:",
      "  pluginSource: \"package\"",
      ""
    ].join("\n"), "utf8");
    await fs.writeFile(path.join(projectPath, ".marionettist", "manifest.json"), `${JSON.stringify({
      schemaVersion: 1,
      frameworkVersion: "test",
      opencodePluginSource: "package",
      managedFiles: [{ path: "opencode.jsonc", adapter: "opencode" }]
    }, null, 2)}\n`, "utf8");
    await fs.writeFile(path.join(projectPath, "opencode.jsonc"), [
      "{",
      "  \"plugin\": [\"marionettist-pathway-opencode\"]",
      "}",
      ""
    ].join("\n"), "utf8");
    await fs.writeFile(path.join(projectPath, "docs", "project", "knowledge-map.md"), "# Map\n", "utf8");
    await fs.writeFile(path.join(projectPath, "docs", "project", "marionettist-workflow.md"), "# Workflow\n", "utf8");

    const lines = await captureLogs(async () => {
      await doctorCommand(["--project", projectPath]);
    });

    assert(lines.some((line) => line.includes("PASS  OpenCode command surface [minimal] required normal commands provided by package plugin")));
    assert(!lines.some((line) => line.includes("WARN  OpenCode command surface")));
    assert(!lines.some((line) => line.includes("FAIL  OpenCode command surface")));
  });
});
