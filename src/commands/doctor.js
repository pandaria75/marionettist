import fs from "node:fs/promises";
import path from "node:path";
import { parseCommonArgs } from "../core/args.js";

const managedBlockStart = "<!-- harness-kit:start -->";
const managedBlockEnd = "<!-- harness-kit:end -->";
const requiredModelProfiles = ["think", "build", "review", "run"];
const codingPhases = new Set(["coding", "review", "validation", "finalization"]);

export async function doctorCommand(args) {
  const options = parseCommonArgs(args);
  const results = [];

  await checkHarnessConfig(options.project, results);
  await checkAgents(options.project, results);
  await checkManifest(options.project, results);
  await checkPath(options.project, ".aiassistant/rules", "directory", ".aiassistant/rules exists", results);
  await checkPath(options.project, "docs/project/knowledge-map.md", "file", "docs/project/knowledge-map.md exists", results);
  await checkPath(options.project, "docs/project/harness-workflow.md", "file", "docs/project/harness-workflow.md exists", results);
  await checkPath(options.project, ".task", "directory", ".task directory exists", results);
  await checkOpencode(options.project, results);
  await checkSkills(options.project, results);
  await checkActiveTask(options.project, results);

  printResults(results);

  if (results.some((result) => result.level === "FAIL")) {
    process.exitCode = 1;
  }
}

async function checkHarnessConfig(projectPath, results) {
  const relative = "harness.config.yaml";
  const absolute = path.join(projectPath, relative);
  if (!(await exists(absolute))) {
    results.push(fail(`${relative} missing`));
    return;
  }

  let parsed;
  try {
    parsed = parseSimpleYaml(await fs.readFile(absolute, "utf8"));
    results.push(pass(`${relative} parsed`));
  } catch (error) {
    results.push(fail(`${relative} parse failed: ${error.message}`));
    return;
  }

  const profiles = parsed.models?.profiles ?? {};
  const missing = requiredModelProfiles.filter((profile) => !profiles[profile]);
  if (missing.length > 0) {
    results.push(warn(`model profiles missing: ${missing.join(", ")}`));
    return;
  }
  results.push(pass("model profiles found: think, build, review, run"));
}

async function checkAgents(projectPath, results) {
  const absolute = path.join(projectPath, "AGENTS.md");
  if (!(await exists(absolute))) {
    results.push(fail("AGENTS.md missing"));
    return;
  }

  const content = await fs.readFile(absolute, "utf8");
  if (content.includes(managedBlockStart) && content.includes(managedBlockEnd)) {
    results.push(pass("AGENTS.md managed block found"));
    return;
  }
  results.push(fail("AGENTS.md managed block missing"));
}

async function checkManifest(projectPath, results) {
  const relative = ".harness/manifest.json";
  const absolute = path.join(projectPath, relative);
  if (!(await exists(absolute))) {
    results.push(fail(`${relative} missing`));
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(absolute, "utf8"));
  } catch (error) {
    results.push(fail(`${relative} parse failed: ${error.message}`));
    return;
  }

  if (manifest.schemaVersion !== 1) {
    results.push(fail(`${relative} unsupported schemaVersion: ${manifest.schemaVersion}`));
    return;
  }
  results.push(pass(`${relative} schemaVersion=${manifest.schemaVersion}`));

  if (!manifest.frameworkVersion) {
    results.push(fail(`${relative} missing frameworkVersion`));
  } else {
    results.push(pass(`${relative} frameworkVersion=${manifest.frameworkVersion}`));
  }

  if (!Array.isArray(manifest.managedFiles)) {
    results.push(fail(`${relative} managedFiles missing or not an array`));
    return;
  }
  results.push(pass(`${relative} managedFiles count=${manifest.managedFiles.length}`));

  const missingManaged = [];
  for (const file of manifest.managedFiles) {
    if (!(await exists(path.join(projectPath, file.path)))) {
      missingManaged.push(file.path);
    }
  }
  if (missingManaged.length > 0) {
    const preview = missingManaged.slice(0, 5).join(", ");
    const suffix = missingManaged.length > 5 ? ` (+${missingManaged.length - 5} more)` : "";
    results.push(warn(`manifest references ${missingManaged.length} missing managed file(s): ${preview}${suffix}`));
  } else {
    results.push(pass("all managed files referenced in manifest exist on disk"));
  }
}

async function checkPath(projectPath, relative, expectedType, label, results) {
  const absolute = path.join(projectPath, relative);
  try {
    const stat = await fs.stat(absolute);
    const ok = expectedType === "directory" ? stat.isDirectory() : stat.isFile();
    results.push(ok ? pass(label) : fail(`${relative} is not a ${expectedType}`));
  } catch {
    results.push(fail(`${relative} missing`));
  }
}

async function checkOpencode(projectPath, results) {
  const configPath = path.join(projectPath, "opencode.jsonc");
  if (await exists(configPath)) {
    try {
      JSON.parse(stripJsonComments(await fs.readFile(configPath, "utf8")));
      results.push(pass("opencode.jsonc parsed"));
    } catch (error) {
      results.push(fail(`opencode.jsonc parse failed: ${error.message}`));
    }
  } else {
    results.push(warn("opencode.jsonc not found; optional OpenCode scaffold not installed"));
  }

  await checkMarkdownFrontmatterDirectory(projectPath, [".opencode/agent", ".opencode/agents"], "OpenCode agent", results);
  await checkMarkdownFrontmatterDirectory(projectPath, [".opencode/command", ".opencode/commands"], "OpenCode command", results);
}

async function checkMarkdownFrontmatterDirectory(projectPath, relatives, label, results) {
  let foundDirectory = false;
  for (const relative of relatives) {
    const absolute = path.join(projectPath, relative);
    if (!(await isDirectory(absolute))) {
      continue;
    }
    foundDirectory = true;
    const files = await listFiles(absolute, ".md");
    if (files.length === 0) {
      results.push(warn(`${relative} contains no markdown files`));
      continue;
    }
    for (const file of files) {
      const fileRelative = toPosix(path.relative(projectPath, file));
      try {
        parseFrontmatter(await fs.readFile(file, "utf8"));
        results.push(pass(`${fileRelative} frontmatter parsed`));
      } catch (error) {
        results.push(fail(`${fileRelative} frontmatter failed: ${error.message}`));
      }
    }
  }
  if (!foundDirectory) {
    results.push(warn(`${label} directory not found; optional OpenCode scaffold not installed`));
  }
}

async function checkSkills(projectPath, results) {
  const skillRoots = [path.join(projectPath, ".agents", "skills"), path.join(projectPath, "skills")];
  const skillFiles = [];
  for (const root of skillRoots) {
    if (await isDirectory(root)) {
      skillFiles.push(...(await listSkillFiles(root)));
    }
  }

  if (skillFiles.length === 0) {
    results.push(warn("no skill SKILL.md files found"));
    return;
  }

  for (const skillFile of skillFiles) {
    const relative = toPosix(path.relative(projectPath, skillFile));
    try {
      const frontmatter = parseFrontmatter(await fs.readFile(skillFile, "utf8"));
      if (!frontmatter.name) {
        results.push(fail(`${relative} missing required frontmatter: name`));
        continue;
      }
      if (!frontmatter.description) {
        results.push(fail(`${relative} missing required frontmatter: description`));
        continue;
      }
      results.push(pass(`${relative} valid`));
    } catch (error) {
      results.push(fail(`${relative} frontmatter failed: ${error.message}`));
    }
  }
}

async function checkActiveTask(projectPath, results) {
  const activePath = path.join(projectPath, ".task", "active.json");
  const legacyContextPath = path.join(projectPath, ".task", "context-pack.md");
  if (!(await exists(activePath))) {
    results.push(warn(".task/active.json not found; no active task selected"));
    if (await exists(legacyContextPath)) {
      results.push(warn("legacy .task/context-pack.md found; migrate to .task/<date>/<task-slug>/context-pack.md"));
    }
    return;
  }

  let active;
  try {
    active = JSON.parse(await fs.readFile(activePath, "utf8"));
    results.push(pass(".task/active.json parsed"));
  } catch (error) {
    results.push(fail(`.task/active.json parse failed: ${error.message}`));
    return;
  }

  if (!active.taskId) {
    results.push(fail(".task/active.json missing taskId"));
    return;
  }

  const taskRelative = toPosix(path.join(".task", active.taskId));
  const taskDirectory = path.join(projectPath, taskRelative);
  if (!(await isDirectory(taskDirectory))) {
    results.push(fail(`${taskRelative} missing`));
    return;
  }
  results.push(pass(`${taskRelative} found`));

  const statePath = path.join(taskDirectory, "state.json");
  if (!(await exists(statePath))) {
    results.push(fail(`${taskRelative}/state.json missing`));
    return;
  }

  let state;
  try {
    state = JSON.parse(await fs.readFile(statePath, "utf8"));
    results.push(pass(`${taskRelative}/state.json parsed`));
  } catch (error) {
    results.push(fail(`${taskRelative}/state.json parse failed: ${error.message}`));
    return;
  }

  const contextPackPath = path.join(taskDirectory, "context-pack.md");
  const contextPackRequired = Boolean(active.allowedToCode || state.allowedToCode || codingPhases.has(active.phase) || codingPhases.has(state.phase));
  if (await exists(contextPackPath)) {
    results.push(pass(`${taskRelative}/context-pack.md found`));
  } else if (contextPackRequired) {
    results.push(fail(`${taskRelative}/context-pack.md missing for coding-stage task`));
  } else {
    results.push(warn(`${taskRelative}/context-pack.md not found; required before coding`));
  }

  if (await exists(legacyContextPath)) {
    results.push(warn("legacy .task/context-pack.md found; active task should use task-scoped context-pack.md"));
  }
}

function parseFrontmatter(content) {
  const normalized = content.replace(/^\uFEFF/, "");
  if (!normalized.startsWith("---\n") && !normalized.startsWith("---\r\n")) {
    throw new Error("missing opening ---");
  }
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error("missing closing ---");
  }
  return parseSimpleYaml(match[1]);
}

function parseSimpleYaml(content) {
  const root = {};
  const stack = [{ indent: -1, value: root }];
  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) {
      continue;
    }
    const indent = rawLine.match(/^ */)[0].length;
    if (indent % 2 !== 0) {
      throw new Error(`line ${index + 1}: indentation must use two-space levels`);
    }
    const line = rawLine.trim();
    while (stack.length > 1 && indent <= stack.at(-1).indent) {
      stack.pop();
    }
    const parent = stack.at(-1).value;

    if (line.startsWith("- ")) {
      if (!Array.isArray(parent)) {
        throw new Error(`line ${index + 1}: list item has no list parent`);
      }
      parent.push(parseScalar(line.slice(2).trim()));
      continue;
    }

    const separator = line.indexOf(":");
    if (separator === -1) {
      throw new Error(`line ${index + 1}: expected key-value pair`);
    }
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    if (!key) {
      throw new Error(`line ${index + 1}: empty key`);
    }
    if (rawValue === "") {
      const nextMeaningful = nextMeaningfulLine(lines, index + 1);
      const value = nextMeaningful?.trim().startsWith("- ") ? [] : {};
      parent[key] = value;
      stack.push({ indent, value });
      continue;
    }
    parent[key] = parseScalar(rawValue);
  }

  return root;
}

function nextMeaningfulLine(lines, start) {
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() && !line.trimStart().startsWith("#")) {
      return line;
    }
  }
  return null;
}

function parseScalar(rawValue) {
  const value = rawValue.replace(/\s+#.*$/, "");
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  return value;
}

function stripJsonComments(content) {
  let output = "";
  let inString = false;
  let quote = "";
  for (let index = 0; index < content.length; index += 1) {
    const current = content[index];
    const next = content[index + 1];
    if (inString) {
      output += current;
      if (current === "\\") {
        output += next ?? "";
        index += 1;
      } else if (current === quote) {
        inString = false;
      }
      continue;
    }
    if (current === '"' || current === "'") {
      inString = true;
      quote = current;
      output += current;
      continue;
    }
    if (current === "/" && next === "/") {
      while (index < content.length && content[index] !== "\n") {
        index += 1;
      }
      output += "\n";
      continue;
    }
    if (current === "/" && next === "*") {
      index += 2;
      while (index < content.length && !(content[index] === "*" && content[index + 1] === "/")) {
        index += 1;
      }
      index += 1;
      continue;
    }
    output += current;
  }
  return output;
}

async function listSkillFiles(root) {
  const files = await listFiles(root, "SKILL.md");
  return files.filter((file) => path.basename(file) === "SKILL.md");
}

async function listFiles(directory, extensionOrName) {
  const files = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolute, extensionOrName)));
      continue;
    }
    if (extensionOrName.startsWith(".")) {
      if (entry.name.endsWith(extensionOrName)) files.push(absolute);
    } else if (entry.name === extensionOrName) {
      files.push(absolute);
    }
  }
  return files;
}

async function exists(absolute) {
  try {
    await fs.access(absolute);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(absolute) {
  try {
    return (await fs.stat(absolute)).isDirectory();
  } catch {
    return false;
  }
}

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function pass(message) {
  return { level: "PASS", message };
}

function warn(message) {
  return { level: "WARN", message };
}

function fail(message) {
  return { level: "FAIL", message };
}

function printResults(results) {
  console.log("Harness Doctor");
  console.log("");
  for (const result of results) {
    console.log(`${result.level.padEnd(5)} ${result.message}`);
  }
}
