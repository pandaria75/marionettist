import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  coreTemplatesRoot,
  distributionsRoot,
  frameworkRoot,
  getCoreTemplateSourceCandidates,
  getCoreTemplateSourceRelativeCandidates,
  getOpencodeTemplateSourceCandidates,
  getOpencodeTemplateSourceRelativeCandidates,
  listResolvedOpencodeTemplateRelatives,
  opencodeTemplatesRoot,
  pathwayOpencodeTemplatesRoot,
  pathwaysTemplatesRoot,
  resolveFirstExistingPath,
  templatesRoot
} from "./framework-paths.js";

test("framework path constants expose future layout roots while preserving legacy roots", () => {
  assert.equal(templatesRoot, path.join(frameworkRoot, "templates"));
  assert.equal(coreTemplatesRoot, path.join(templatesRoot, "core"));
  assert.equal(pathwaysTemplatesRoot, path.join(templatesRoot, "pathways"));
  assert.equal(opencodeTemplatesRoot, path.join(templatesRoot, "opencode"));
  assert.equal(pathwayOpencodeTemplatesRoot, path.join(pathwaysTemplatesRoot, "opencode"));
  assert.equal(distributionsRoot, path.join(frameworkRoot, "distributions"));
});

test("core template candidates prefer future core layout then legacy path", () => {
  assert.deepEqual(
    getCoreTemplateSourceRelativeCandidates("docs/project/harness-workflow.md"),
    ["core/docs/project/harness-workflow.md", "docs/project/harness-workflow.md"]
  );
  assert.deepEqual(
    getCoreTemplateSourceCandidates("docs/project/harness-workflow.md"),
    [
      path.join(templatesRoot, "core", "docs", "project", "harness-workflow.md"),
      path.join(templatesRoot, "docs", "project", "harness-workflow.md")
    ]
  );
});

test("OpenCode template candidates prefer pathway layout then legacy fallback", () => {
  assert.deepEqual(
    getOpencodeTemplateSourceRelativeCandidates("agents/harness-builder.md"),
    ["pathways/opencode/agents/harness-builder.md", "opencode/agents/harness-builder.md"]
  );
  assert.deepEqual(
    getOpencodeTemplateSourceCandidates("agents/harness-builder.md"),
    [
      path.join(templatesRoot, "pathways", "opencode", "agents", "harness-builder.md"),
      path.join(templatesRoot, "opencode", "agents", "harness-builder.md")
    ]
  );
});

test("template source candidate helpers normalize leading separators", () => {
  assert.deepEqual(
    getCoreTemplateSourceRelativeCandidates("/AGENTS.md"),
    ["core/AGENTS.md", "AGENTS.md"]
  );
  assert.deepEqual(
    getOpencodeTemplateSourceRelativeCandidates("\\commands/harness.md"),
    ["pathways/opencode/commands/harness.md", "opencode/commands/harness.md"]
  );
});

test("resolveFirstExistingPath returns the first existing candidate", async (t) => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "harness-framework-paths-"));
  t.after(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  const missingCandidate = path.join(tempRoot, "future", "example.md");
  const fallbackCandidate = path.join(tempRoot, "legacy", "example.md");
  await fs.mkdir(path.dirname(fallbackCandidate), { recursive: true });
  await fs.writeFile(fallbackCandidate, "legacy", "utf8");

  assert.equal(await resolveFirstExistingPath([missingCandidate, fallbackCandidate]), fallbackCandidate);

  await fs.mkdir(path.dirname(missingCandidate), { recursive: true });
  await fs.writeFile(missingCandidate, "future", "utf8");

  assert.equal(await resolveFirstExistingPath([missingCandidate, fallbackCandidate]), missingCandidate);
});

test("resolved OpenCode relatives ignore placeholder files and include future candidates", async (t) => {
  const futureSource = path.join(pathwayOpencodeTemplatesRoot, "commands", "slice-3-test-command.md");
  const legacySource = path.join(opencodeTemplatesRoot, "commands", "slice-3-test-command.md");
  const placeholder = path.join(pathwayOpencodeTemplatesRoot, ".gitkeep");

  await fs.mkdir(path.dirname(futureSource), { recursive: true });
  await fs.mkdir(path.dirname(legacySource), { recursive: true });
  await fs.writeFile(legacySource, "legacy", "utf8");
  await fs.writeFile(futureSource, "future", "utf8");
  await fs.writeFile(placeholder, "", "utf8");

  t.after(async () => {
    await fs.rm(futureSource, { force: true });
    await fs.rm(legacySource, { force: true });
  });

  const relatives = await listResolvedOpencodeTemplateRelatives();
  assert(relatives.includes("commands/slice-3-test-command.md"));
  assert(!relatives.includes(".gitkeep"));
});
