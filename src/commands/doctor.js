import fs from "node:fs/promises";
import path from "node:path";
import { parseCommonArgs } from "../core/args.js";
import { parseSimpleYaml } from "../core/yaml.js";

const managedBlockStart = "<!-- harness-kit:start -->";
const managedBlockEnd = "<!-- harness-kit:end -->";
const requiredModelProfiles = ["think", "build", "review", "run"];
const codingPhases = new Set(["coding", "review", "validation", "finalization"]);
const opencodeAgentRoleMap = new Map([
  ["harness-builder", "think"],
  ["harness-planner", "think"],
  ["harness-coder", "build"],
  ["harness-reviewer", "review"],
  ["harness-critic", "review"],
  ["harness-validator", "run"],
  ["harness-indexer", "run"]
]);
const opencodeAdapterConfigRelatives = [
  ".harness/adapters/opencode.yml",
  ".harness/adapters/opencode.yaml"
];
const modelDriftRemediation = "Reconcile the local model sources, then run `harness diff --project <path>` or `harness sync --project <path> --with-opencode` to preview or apply the safe regeneration.";

export async function doctorCommand(args) {
  const options = parseCommonArgs(args);
  const results = [];

  const harnessConfig = await checkHarnessConfig(options.project, results);
  await checkAgents(options.project, results);
  await checkManifest(options.project, results);
  await checkPath(options.project, ".aiassistant/rules", "directory", ".aiassistant/rules exists", results);
  await checkPath(options.project, "docs/project/knowledge-map.md", "file", "docs/project/knowledge-map.md exists", results);
  await checkPath(options.project, "docs/project/harness-workflow.md", "file", "docs/project/harness-workflow.md exists", results);
  await checkPath(options.project, ".task", "directory", ".task directory exists", results);
  const opencodeConfig = await checkOpencode(options.project, results);
  await checkOpenCodeModelDrift(options.project, harnessConfig, opencodeConfig, results);
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
    return null;
  }

  let parsed;
  try {
    parsed = parseSimpleYaml(await fs.readFile(absolute, "utf8"), { validateIndentation: true });
    results.push(pass(`${relative} parsed`));
  } catch (error) {
    results.push(fail(`${relative} parse failed: ${error.message}`));
    return null;
  }

  const profiles = parsed.models?.profiles ?? {};
  const missing = requiredModelProfiles.filter((profile) => !profiles[profile]);
  if (missing.length > 0) {
    results.push(warn(`model profiles missing: ${missing.join(", ")}`));
    return parsed;
  }
  results.push(pass("model profiles found: think, build, review, run"));
  return parsed;
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
  let parsedConfig = null;
  if (await exists(configPath)) {
    try {
      parsedConfig = JSON.parse(stripJsonComments(await fs.readFile(configPath, "utf8")));
      results.push(pass("opencode.jsonc parsed"));
    } catch (error) {
      results.push(fail(`opencode.jsonc parse failed: ${error.message}`));
    }
  } else {
    results.push(warn("opencode.jsonc not found; optional OpenCode scaffold not installed"));
  }

  await checkMarkdownFrontmatterDirectory(projectPath, [".opencode/agent", ".opencode/agents"], "OpenCode agent", results);
  await checkMarkdownFrontmatterDirectory(projectPath, [".opencode/command", ".opencode/commands"], "OpenCode command", results);
  return parsedConfig;
}

async function checkOpenCodeModelDrift(projectPath, harnessConfig, opencodeConfig, results) {
  const agentDirectory = await findFirstDirectory(projectPath, [".opencode/agent", ".opencode/agents"]);
  if (!agentDirectory) {
    return;
  }

  const canonicalSource = await readModelProfileSource(path.join(projectPath, ".harness", "model-profiles.yml"), "canonical");
  const legacySource = harnessConfig
    ? { label: "harness.config.yaml", exists: true, profiles: normalizeProfileDefaults(harnessConfig.models?.profiles), parseError: null }
    : { label: "harness.config.yaml", exists: false, profiles: null, parseError: null };
  const adapterSource = await readAdapterModelSource(projectPath);
  const opencodeAssignments = extractOpencodeModelAssignments(opencodeConfig);

  if (canonicalSource.parseError) {
    results.push(fail(`.harness/model-profiles.yml parse failed: ${canonicalSource.parseError.message}`));
    return;
  }
  if (adapterSource.parseError) {
    results.push(fail(`${adapterSource.label} parse failed: ${adapterSource.parseError.message}`));
    return;
  }

  for (const [agentName, role] of opencodeAgentRoleMap.entries()) {
    const agentRelative = toPosix(path.join(path.relative(projectPath, agentDirectory), `${agentName}.md`));
    const agentAbsolute = path.join(projectPath, agentRelative);
    const agentExists = await exists(agentAbsolute);
    const agentContent = agentExists ? await fs.readFile(agentAbsolute, "utf8") : null;
    const evaluation = evaluateAgentModelStatus({
      role,
      agentName,
      canonicalSource,
      legacySource,
      adapterSource,
      opencodeAssignments,
      agentExists,
      agentContent,
      agentRelative
    });
    results.push(statusResult(evaluation.status, evaluation.message));
  }
}

function evaluateAgentModelStatus(context) {
  const {
    role,
    agentName,
    canonicalSource,
    legacySource,
    adapterSource,
    opencodeAssignments,
    agentExists,
    agentContent,
    agentRelative
  } = context;

  const canonicalValue = readProfileDefault(canonicalSource.profiles, role);
  const legacyValue = readProfileDefault(legacySource.profiles, role);
  const adapterValue = readAdapterExpectedModel(adapterSource, role, agentName);
  const opencodeValue = readOpencodeExpectedModel(opencodeAssignments, role, agentName);

  if (canonicalSource.exists) {
    if (!canonicalValue) {
      return buildModelStatus("MISSING", `${agentRelative} expected profile ${role}.default is missing from .harness/model-profiles.yml. ${modelDriftRemediation}`);
    }
  }

  if (!canonicalSource.exists && legacySource.exists) {
    if (!legacyValue) {
      return buildModelStatus("MISSING", `${agentRelative} expected legacy profile ${role}.default is missing from harness.config.yaml. ${modelDriftRemediation}`);
    }
  }

  if (!canonicalSource.exists && !legacySource.exists) {
    return buildModelStatus("MISSING", `${agentRelative} cannot determine expected model because neither .harness/model-profiles.yml nor harness.config.yaml provides profile ${role}. ${modelDriftRemediation}`);
  }

  if (canonicalValue && legacyValue && canonicalValue !== legacyValue) {
    return buildModelStatus("CONFLICT", `${agentRelative} profile ${role}.default conflicts between .harness/model-profiles.yml (${canonicalValue}) and harness.config.yaml (${legacyValue}). ${modelDriftRemediation}`);
  }

  const expectedModel = canonicalValue ?? legacyValue;

  if (adapterValue && adapterValue !== expectedModel) {
    return buildModelStatus("CONFLICT", `${agentRelative} adapter config ${adapterSource.label} expects ${adapterValue} for ${agentName}, but profile ${role}.default expects ${expectedModel}. ${modelDriftRemediation}`);
  }

  if (opencodeValue && opencodeValue !== expectedModel) {
    return buildModelStatus("CONFLICT", `${agentRelative} opencode.jsonc model data expects ${opencodeValue} for ${agentName}, but profile ${role}.default expects ${expectedModel}. ${modelDriftRemediation}`);
  }

  if (!agentExists) {
    return buildModelStatus("MISSING", `${agentRelative} missing; expected model ${expectedModel} from profile ${role}.default. ${modelDriftRemediation}`);
  }

  try {
    const frontmatter = parseFrontmatter(agentContent);
    const actualModel = typeof frontmatter.model === "string" && frontmatter.model.length > 0
      ? frontmatter.model
      : null;

    if (!actualModel) {
      return buildModelStatus("MISSING", `${agentRelative} is missing frontmatter model; expected ${expectedModel} from profile ${role}.default. ${modelDriftRemediation}`);
    }

    if (actualModel !== expectedModel) {
      return buildModelStatus("DRIFTED", `${agentRelative} model drifted to ${actualModel}; expected ${expectedModel} from profile ${role}.default. ${modelDriftRemediation}`);
    }

    return buildModelStatus("OK", `${agentRelative} model ${actualModel} matches profile ${role}.default.`);
  } catch (error) {
    return buildModelStatus("MISSING", `${agentRelative} frontmatter could not be parsed for model drift inspection: ${error.message}. ${modelDriftRemediation}`);
  }
}

async function readModelProfileSource(filePath, sourceType) {
  const label = sourceType === "canonical" ? ".harness/model-profiles.yml" : path.basename(filePath);
  if (!(await exists(filePath))) {
    return { label, exists: false, profiles: null, parseError: null };
  }

  try {
    const parsed = parseSimpleYaml(await fs.readFile(filePath, "utf8"), { validateIndentation: true });
    return {
      label,
      exists: true,
      profiles: normalizeProfileDefaults(sourceType === "legacy" ? parsed.models?.profiles : parsed.profiles),
      parseError: null
    };
  } catch (error) {
    return { label, exists: true, profiles: null, parseError: error };
  }
}

async function readAdapterModelSource(projectPath) {
  for (const relative of opencodeAdapterConfigRelatives) {
    const absolute = path.join(projectPath, relative);
    if (!(await exists(absolute))) {
      continue;
    }

    try {
      const parsed = parseSimpleYaml(await fs.readFile(absolute, "utf8"), { validateIndentation: true });
      return {
        label: relative,
        exists: true,
        profiles: normalizeProfileDefaults(parsed.profiles ?? parsed.modelProfiles ?? parsed.models?.profiles),
        agentModels: normalizeNamedModelMap(parsed.agents),
        parseError: null
      };
    } catch (error) {
      return { label: relative, exists: true, profiles: null, agentModels: {}, parseError: error };
    }
  }

  return { label: opencodeAdapterConfigRelatives[0], exists: false, profiles: null, agentModels: {}, parseError: null };
}

function extractOpencodeModelAssignments(opencodeConfig) {
  if (!opencodeConfig || typeof opencodeConfig !== "object") {
    return { byAgent: {}, byRole: {}, globalModel: null };
  }

  return {
    globalModel: readString(opencodeConfig.model),
    byAgent: {
      ...normalizeNamedModelMap(opencodeConfig.agents),
      ...normalizeNamedModelMap(opencodeConfig.models)
    },
    byRole: {
      ...normalizeNamedModelMap(opencodeConfig.roles),
      ...pickKnownRoleModels(opencodeConfig.models)
    }
  };
}

function pickKnownRoleModels(value) {
  const result = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return result;
  }
  for (const role of requiredModelProfiles) {
    const model = readModelField(value[role]);
    if (model) {
      result[role] = model;
    }
  }
  return result;
}

function normalizeProfileDefaults(rawProfiles) {
  if (!rawProfiles || typeof rawProfiles !== "object" || Array.isArray(rawProfiles)) {
    return null;
  }

  const normalized = {};
  for (const role of requiredModelProfiles) {
    normalized[role] = {
      default: readModelField(rawProfiles[role]?.default ?? rawProfiles[role])
    };
  }
  return normalized;
}

function normalizeNamedModelMap(rawMap) {
  if (!rawMap || typeof rawMap !== "object" || Array.isArray(rawMap)) {
    return {};
  }

  const normalized = {};
  for (const [key, value] of Object.entries(rawMap)) {
    const model = readModelField(value);
    if (model) {
      normalized[key] = model;
    }
  }
  return normalized;
}

function readProfileDefault(profiles, role) {
  const value = profiles?.[role]?.default;
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readAdapterExpectedModel(adapterSource, role, agentName) {
  return adapterSource.agentModels?.[agentName] ?? readProfileDefault(adapterSource.profiles, role);
}

function readOpencodeExpectedModel(opencodeAssignments, role, agentName) {
  return opencodeAssignments.byAgent?.[agentName] ?? opencodeAssignments.byRole?.[role] ?? opencodeAssignments.globalModel;
}

function readModelField(value) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return readString(value.model) ?? readString(value.default);
  }
  return null;
}

function readString(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function buildModelStatus(status, message) {
  return { status, message: `OpenCode model [${status}] ${message}` };
}

function statusResult(status, message) {
  if (status === "OK") {
    return pass(message);
  }
  return warn(message);
}

async function findFirstDirectory(projectPath, relatives) {
  for (const relative of relatives) {
    const absolute = path.join(projectPath, relative);
    if (await isDirectory(absolute)) {
      return absolute;
    }
  }
  return null;
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
  return parseSimpleYaml(match[1], { validateIndentation: true });
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
