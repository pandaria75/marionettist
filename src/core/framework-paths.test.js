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
  pathwayOpencodeTemplatesRoot,
  pathwaysTemplatesRoot,
  resolveOpencodeTemplateSource,
  resolveFirstExistingPath,
  templatesRoot
} from "./framework-paths.js";

test("framework path constants expose pathway OpenCode source roots", () => {
  assert.equal(templatesRoot, path.join(frameworkRoot, "templates"));
  assert.equal(coreTemplatesRoot, path.join(templatesRoot, "core"));
  assert.equal(pathwaysTemplatesRoot, path.join(templatesRoot, "pathways"));
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

test("OpenCode template candidates resolve only from pathway layout", () => {
  assert.deepEqual(
    getOpencodeTemplateSourceRelativeCandidates("agents/harness-builder.md"),
    ["pathways/opencode/agents/harness-builder.md"]
  );
  assert.deepEqual(
    getOpencodeTemplateSourceCandidates("agents/harness-builder.md"),
    [path.join(templatesRoot, "pathways", "opencode", "agents", "harness-builder.md")]
  );
});

test("template source candidate helpers normalize leading separators", () => {
  assert.deepEqual(
    getCoreTemplateSourceRelativeCandidates("/AGENTS.md"),
    ["core/AGENTS.md", "AGENTS.md"]
  );
  assert.deepEqual(
    getOpencodeTemplateSourceRelativeCandidates("\\commands/harness.md"),
    ["pathways/opencode/commands/harness.md"]
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

test("resolved OpenCode relatives ignore placeholder files in pathway source", async (t) => {
  const futureSource = path.join(pathwayOpencodeTemplatesRoot, "commands", "slice-3-test-command.md");
  const placeholder = path.join(pathwayOpencodeTemplatesRoot, ".gitkeep");

  await fs.mkdir(path.dirname(futureSource), { recursive: true });
  await fs.writeFile(futureSource, "future", "utf8");
  await fs.writeFile(placeholder, "", "utf8");

  t.after(async () => {
    await fs.rm(futureSource, { force: true });
  });

  const relatives = await listResolvedOpencodeTemplateRelatives();
  assert(relatives.includes("commands/slice-3-test-command.md"));
  assert(!relatives.includes(".gitkeep"));
});

test("resolveOpencodeTemplateSource resolves pathway source only", async (t) => {
  const sourceRelative = "commands/slice-38-2-resolution-test.md";
  const futureSource = path.join(pathwayOpencodeTemplatesRoot, sourceRelative);

  t.after(async () => {
    await fs.rm(futureSource, { force: true });
  });

  let resolved = await resolveOpencodeTemplateSource(sourceRelative);
  assert.equal(resolved, null);

  await fs.mkdir(path.dirname(futureSource), { recursive: true });
  await fs.writeFile(futureSource, "future", "utf8");

  resolved = await resolveOpencodeTemplateSource(sourceRelative);
  assert(resolved, "expected pathway source to resolve");
  assert.equal(resolved.sourcePath, futureSource);
  assert.equal(resolved.sourceRelative, "templates/pathways/opencode/commands/slice-38-2-resolution-test.md");
});
