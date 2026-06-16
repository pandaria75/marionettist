import test from "node:test";
import assert from "node:assert/strict";
import { runCli } from "./cli.js";

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

test("runCli routes clear to preview mode by default", async () => {
  const lines = await captureLogs(async () => {
    await runCli(["clear", "--project", "fixtures", "--scope", "opencode"]);
  });

  assert.equal(lines[0], "harness clear (preview)");
  assert(lines.some((line) => line === "scope: opencode"));
  assert(lines.some((line) => line === "manifest: .harness/manifest.json (missing)"));
  assert(lines.some((line) => line.includes("dry-run: preview only; no files will be changed")));
});

test("runCli routes uninstall alias to the same command", async () => {
  const lines = await captureLogs(async () => {
    await runCli(["uninstall", "--project", "fixtures", "--apply", "--scope", "all"]);
  });

  assert.equal(lines[0], "harness clear (apply)");
  assert(lines.some((line) => line === "scope: all"));
  assert(lines.some((line) => line === "planned actions: none (manifest not found)"));
  assert(lines.some((line) => line.startsWith("backup root: .harness/backups/")));
});

test("runCli surfaces invalid clear scope clearly", async () => {
  await assert.rejects(
    () => runCli(["clear", "--scope", "manifest"]),
    /Unsupported --scope value: manifest/
  );
});
