import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const sourceRoot = path.join(repoRoot, "templates", "pathways", "cursor");
const distributionRoot = path.join(repoRoot, "distributions", "cursor");
const versionFile = path.join(repoRoot, "VERSION");

const managedMappings = [
  { source: ".cursor-plugin", target: ".cursor-plugin" },
  { source: "agents", target: "agents" },
  { source: "commands", target: "commands" },
  { source: "rules", target: "rules" },
  { source: "skills", target: "skills" }
];

const managedFileMappings = [
  { source: "README.md", target: "README.md" }
];

const checkOnly = process.argv.includes("--check");
const expectedFiles = await buildExpectedFiles();

if (checkOnly) {
  const drift = await computeDrift(expectedFiles);
  if (drift.length > 0) {
    console.error("Cursor distribution drift detected:");
    for (const entry of drift) {
      console.error(`- ${entry}`);
    }
    process.exitCode = 1;
  }
} else {
  await writeExpectedFiles(expectedFiles);
}

async function buildExpectedFiles() {
  const expected = new Map();
  const version = (await fs.readFile(versionFile, "utf8")).trim();

  for (const mapping of managedMappings) {
    const sourceDirectory = path.join(sourceRoot, mapping.source);
    for (const [relative, content] of await collectFiles(sourceDirectory)) {
      const targetRelative = toPosix(path.join(mapping.target, relative));
      expected.set(targetRelative, transformContent(mapping, relative, content, version));
    }
  }

  for (const mapping of managedFileMappings) {
    const content = await fs.readFile(path.join(sourceRoot, mapping.source), "utf8");
    expected.set(mapping.target, content);
  }

  expected.set("package.json", `${JSON.stringify({
    name: "marionettist-pathway-cursor",
    version,
    description: "Cursor Pathway plugin package surface for Marionettist.",
    type: "module",
    files: [
      "README.md",
      ".cursor-plugin/",
      "agents/",
      "commands/",
      "rules/",
      "skills/"
    ],
    engines: {
      node: ">=20"
    }
  }, null, 2)}\n`);

  return expected;
}

function transformContent(mapping, relative, content, version) {
  if (mapping.source === ".cursor-plugin" && relative === "plugin.json") {
    const parsed = JSON.parse(content);
    parsed.version = version;
    return `${JSON.stringify(parsed, null, 2)}\n`;
  }
  return content;
}

async function computeDrift(expectedFiles) {
  const drift = [];
  const actualFiles = new Map();

  for (const mapping of managedMappings) {
    const targetDirectory = path.join(distributionRoot, mapping.target);
    for (const [relative, content] of await collectFiles(targetDirectory, { allowMissing: true })) {
      actualFiles.set(toPosix(path.join(mapping.target, relative)), content);
    }
  }

  for (const mapping of managedFileMappings) {
    const targetPath = path.join(distributionRoot, mapping.target);
    try {
      actualFiles.set(mapping.target, await fs.readFile(targetPath, "utf8"));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  try {
    actualFiles.set("package.json", await fs.readFile(path.join(distributionRoot, "package.json"), "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  for (const [targetRelative, expectedContent] of expectedFiles) {
    if (!actualFiles.has(targetRelative)) {
      drift.push(`missing ${targetRelative}`);
      continue;
    }
    if (actualFiles.get(targetRelative) !== expectedContent) {
      drift.push(`content mismatch ${targetRelative}`);
    }
  }

  for (const targetRelative of actualFiles.keys()) {
    if (!expectedFiles.has(targetRelative)) {
      drift.push(`unexpected ${targetRelative}`);
    }
  }

  return drift.sort((left, right) => left.localeCompare(right));
}

async function writeExpectedFiles(expectedFiles) {
  await fs.rm(distributionRoot, { recursive: true, force: true });
  await fs.mkdir(distributionRoot, { recursive: true });

  for (const [targetRelative, content] of expectedFiles) {
    const targetPath = path.join(distributionRoot, targetRelative);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, content, "utf8");
  }
}

async function collectFiles(root, options = {}) {
  if (options.allowMissing) {
    try {
      await fs.access(root);
    } catch {
      return [];
    }
  }

  const entries = [];
  await walk(root, "", entries);
  entries.sort(([left], [right]) => left.localeCompare(right));
  return entries;
}

async function walk(root, prefix, entries) {
  const children = await fs.readdir(root, { withFileTypes: true });
  for (const child of children) {
    const absolute = path.join(root, child.name);
    const relative = prefix ? `${prefix}/${child.name}` : child.name;
    if (child.isDirectory()) {
      await walk(absolute, relative, entries);
      continue;
    }
    entries.push([relative, await fs.readFile(absolute, "utf8")]);
  }
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}
