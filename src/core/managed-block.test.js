import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { previewManagedBlockCleanup } from "./managed-block.js";

const fixturesRoot = path.resolve("fixtures");

async function readFixture(relativePath) {
  return fs.readFile(path.join(fixturesRoot, relativePath), "utf8");
}

test("previewManagedBlockCleanup summarizes mixed AGENTS content", async () => {
  const preview = previewManagedBlockCleanup(await readFixture("target-conflict-managed-block/AGENTS.md"));

  assert.equal(preview.hasManagedBlock, true);
  assert.equal(preview.managedBlockOnly, false);
  assert.equal(preview.hasProjectLocalContent, true);
  assert.match(preview.removableContent, /intentionally old managed block/);
  assert.match(preview.preservedContent, /project-local content must be preserved/);
  assert.ok(preview.removableLineCount > 0);
  assert.ok(preview.preservedLineCount > 0);
});

test("previewManagedBlockCleanup summarizes managed-only AGENTS content", async () => {
  const preview = previewManagedBlockCleanup(await readFixture("target-managed-only-agents/AGENTS.md"));

  assert.equal(preview.hasManagedBlock, true);
  assert.equal(preview.managedBlockOnly, true);
  assert.equal(preview.hasProjectLocalContent, false);
  assert.equal(preview.preservedContent, "");
  assert.match(preview.removableContent, /Managed Only Fixture/);
});

test("previewManagedBlockCleanup preserves all content when no managed block exists", async () => {
  const preview = previewManagedBlockCleanup(await readFixture("target-existing-agents/AGENTS.md"));

  assert.equal(preview.hasManagedBlock, false);
  assert.equal(preview.managedBlockOnly, false);
  assert.equal(preview.removableContent, null);
  assert.match(preview.preservedContent, /project-local agent guidance/);
  assert.equal(preview.preservedLineCount, 3);
});
