import path from "node:path";
import { listFiles, pathExists, readText, toPosixPath } from "./files.js";
import { opencodeTemplatesRoot, skillsRoot, templatesRoot, versionFile } from "./framework-paths.js";
import { renderTemplate } from "./template.js";
import { extractManagedBlock, replaceManagedBlock } from "./managed-block.js";
import { sha256 } from "./hash.js";
import { buildManifest, manifestFileMap, manifestRelative, readManifest } from "./manifest.js";
import { buildModelProfileTemplateVariables, loadModelProfiles } from "./model-profiles.js";

const coreTemplateTargets = new Map([
  ["AGENTS.md", "AGENTS.md"],
  [".harness/model-profiles.yml", ".harness/model-profiles.yml"],
  ["harness.config.yaml", "harness.config.yaml"],
  ["docs/project/harness-workflow.md", "docs/project/harness-workflow.md"],
  ["docs/project/knowledge-map.md", "docs/project/knowledge-map.md"],
  ["rules/00-repository-rules.md", ".aiassistant/rules/00-repository-rules.md"],
  ["rules/workflow-rules.md", ".aiassistant/rules/workflow-rules.md"]
]);

const opencodeManagedPrefix = ".opencode/";
const opencodeValidatorTemplatePrefix = "agents/validators/";
const opencodeProjectConfigSource = "opencode.jsonc";

async function buildFrameworkAssets(projectPath, options = {}) {
  const variables = options.variables ?? {};
  const assets = [];

  for (const [sourceRelative, targetRelative] of coreTemplateTargets.entries()) {
    const sourcePath = path.join(templatesRoot, sourceRelative);
    const content = renderTemplate(await readText(sourcePath), variables);
    const kind = targetRelative === "AGENTS.md" ? "managed-block" : "file";
    const managedContent = kind === "managed-block" ? extractManagedBlock(content) : content;
    if (!managedContent) {
      throw new Error(`Template is missing harness managed block markers: ${sourceRelative}`);
    }

    assets.push({
      sourceRelative: `templates/${sourceRelative}`,
      targetRelative,
      targetPath: path.join(projectPath, targetRelative),
      kind,
      content,
      managedContent,
      frameworkHash: sha256(managedContent)
    });
  }

  const skillFiles = await listFiles(skillsRoot);
  for (const sourcePath of skillFiles) {
    const sourceRelative = toPosixPath(path.relative(skillsRoot, sourcePath));
    const targetRelative = toPosixPath(path.join(".agents/skills", sourceRelative));
    const content = await readText(sourcePath);
    assets.push({
      sourceRelative: `skills/${sourceRelative}`,
      targetRelative,
      targetPath: path.join(projectPath, targetRelative),
      kind: "file",
      content,
      managedContent: content,
      frameworkHash: sha256(content)
    });
  }

  if (options.includeOpencode) {
    assets.push(...await buildOpencodeAssets(projectPath, variables));
  }

  return assets;
}

async function buildOpencodeAssets(projectPath, variables = {}) {
  const assets = [];
  const opencodeVariables = await resolveOpencodeVariables(projectPath, variables);
  const opencodeFiles = await listFiles(opencodeTemplatesRoot);
  const validatorProjectGuidance = await buildValidatorProjectGuidance(projectPath, opencodeVariables);

  for (const sourcePath of opencodeFiles) {
    const sourceRelative = toPosixPath(path.relative(opencodeTemplatesRoot, sourcePath));
    if (sourceRelative.startsWith(opencodeValidatorTemplatePrefix)) {
      continue;
    }

    const targetRelative = sourceRelative === opencodeProjectConfigSource
      ? sourceRelative
      : toPosixPath(path.join(".opencode", sourceRelative));

    let content = await readText(sourcePath);
    if (sourceRelative === "agents/harness-validator.md") {
      content = renderTemplate(content, {
        ...opencodeVariables,
        validatorProjectGuidance
      });
    } else {
      content = renderTemplate(content, opencodeVariables);
    }

    assets.push({
      sourceRelative: `templates/opencode/${sourceRelative}`,
      targetRelative,
      targetPath: path.join(projectPath, targetRelative),
      kind: "file",
      content,
      managedContent: content,
      frameworkHash: sha256(content)
    });
  }

  return assets;
}

async function resolveOpencodeVariables(projectPath, variables = {}) {
  const profiles = await loadModelProfiles(projectPath);

  return buildModelProfileTemplateVariables(profiles, variables);
}

async function buildValidatorProjectGuidance(projectPath, variables = {}) {
  const guidanceParts = [];
  const genericFallback = await readText(path.join(opencodeTemplatesRoot, "agents", "validators", "generic-fallback.md"));
  guidanceParts.push(genericFallback.trim());

  guidanceParts.push([
    "# Scheduled Validator Guidance",
    "",
    "- If `opencode.jsonc` enables `opencode-tasks` and the caller asks for recurring, unattended, or cron-style validation, prefer proposing an `opencode-tasks` schedule over an ad hoc loop.",
    "- Do not modify user-global scheduler state or create recurring tasks unless the caller explicitly asks for scheduling.",
    "- For normal one-off validation, continue to run the smallest relevant validation command directly."
  ].join("\n"));

  if (await detectGradleKotlinProject(projectPath, variables)) {
    const gradleKotlin = await readText(path.join(opencodeTemplatesRoot, "agents", "validators", "gradle-kotlin.md"));
    guidanceParts.push(gradleKotlin.trim());
  }

  if (await detectMavenProject(projectPath, variables)) {
    const maven = await readText(path.join(opencodeTemplatesRoot, "agents", "validators", "maven.md"));
    guidanceParts.push(maven.trim());
  }

  if (await detectNodeProject(projectPath, variables)) {
    const node = await readText(path.join(opencodeTemplatesRoot, "agents", "validators", "node.md"));
    guidanceParts.push(node.trim());
  }

  if (await detectPythonProject(projectPath, variables)) {
    const python = await readText(path.join(opencodeTemplatesRoot, "agents", "validators", "python.md"));
    guidanceParts.push(python.trim());
  }

  return guidanceParts.join("\n\n");
}

async function detectGradleKotlinProject(projectPath, variables = {}) {
  const primaryLanguage = String(variables.primaryLanguage ?? "").toLowerCase();
  const projectType = String(variables.projectType ?? "").toLowerCase();
  const architecture = String(variables.architecture ?? "").toLowerCase();

  if (primaryLanguage.includes("kotlin") || projectType.includes("gradle") || architecture.includes("gradle")) {
    return true;
  }

  const gradleMarkers = [
    "build.gradle",
    "build.gradle.kts",
    "settings.gradle",
    "settings.gradle.kts",
    "gradlew",
    "gradlew.bat"
  ];

  for (const marker of gradleMarkers) {
    if (await pathExists(path.join(projectPath, marker))) {
      return true;
    }
  }

  return false;
}

async function detectMavenProject(projectPath, variables = {}) {
  const projectType = String(variables.projectType ?? "").toLowerCase();
  const architecture = String(variables.architecture ?? "").toLowerCase();

  if (projectType.includes("maven") || projectType.includes("mvn") || architecture.includes("maven")) {
    return true;
  }

  const mavenMarkers = [
    "pom.xml",
    "mvnw",
    "mvnw.cmd",
    ".mvn"
  ];

  for (const marker of mavenMarkers) {
    if (await pathExists(path.join(projectPath, marker))) {
      return true;
    }
  }

  return false;
}

async function detectNodeProject(projectPath, variables = {}) {
  const primaryLanguage = String(variables.primaryLanguage ?? "").toLowerCase();
  const projectType = String(variables.projectType ?? "").toLowerCase();
  const architecture = String(variables.architecture ?? "").toLowerCase();

  if (
    primaryLanguage.includes("javascript")
    || primaryLanguage.includes("typescript")
    || primaryLanguage.includes("node")
    || projectType.includes("node")
    || projectType.includes("npm")
    || projectType.includes("pnpm")
    || projectType.includes("yarn")
    || architecture.includes("node")
  ) {
    return true;
  }

  const nodeMarkers = [
    "package.json",
    "package-lock.json",
    "npm-shrinkwrap.json",
    "pnpm-lock.yaml",
    "yarn.lock"
  ];

  for (const marker of nodeMarkers) {
    if (await pathExists(path.join(projectPath, marker))) {
      return true;
    }
  }

  return false;
}

async function detectPythonProject(projectPath, variables = {}) {
  const primaryLanguage = String(variables.primaryLanguage ?? "").toLowerCase();
  const projectType = String(variables.projectType ?? "").toLowerCase();
  const architecture = String(variables.architecture ?? "").toLowerCase();

  if (primaryLanguage.includes("python") || projectType.includes("python") || architecture.includes("python")) {
    return true;
  }

  const pythonMarkers = [
    "pyproject.toml",
    "setup.py",
    "setup.cfg",
    "requirements.txt",
    "tox.ini",
    "noxfile.py",
    "pytest.ini"
  ];

  for (const marker of pythonMarkers) {
    if (await pathExists(path.join(projectPath, marker))) {
      return true;
    }
  }

  return false;
}

function shouldIncludeOpencodeAssets(previousManifest, options = {}) {
  if (options.withOpencode === true) {
    return true;
  }

  if (options.withOpencode === false) {
    return false;
  }

  return previousManifest?.managedFiles?.some((file) => file.path.startsWith(opencodeManagedPrefix)) ?? false;
}

function currentManagedContent(asset, currentContent) {
  if (asset.kind === "managed-block") {
    return extractManagedBlock(currentContent);
  }
  return currentContent;
}

function plannedContent(asset, currentContent) {
  if (asset.kind === "managed-block" && currentContent !== null) {
    return replaceManagedBlock(currentContent, asset.content);
  }
  return asset.content;
}

function statusForManagedAsset({ exists, previous, currentHash, frameworkHash }) {
  if (!exists) {
    return "missing";
  }

  const localChanged = currentHash !== previous.hash;
  const frameworkChanged = frameworkHash !== previous.hash;

  if (!localChanged && !frameworkChanged) {
    return "unchanged";
  }
  if (!localChanged && frameworkChanged) {
    return "update";
  }
  if (localChanged && !frameworkChanged) {
    return "modified-local";
  }
  return "conflict";
}

function shouldManageInitAsset(asset, exists) {
  return !exists || asset.kind === "managed-block";
}

async function operationForAsset(asset, mode, previousByPath, options = {}) {
  const exists = await pathExists(asset.targetPath);
  const currentContent = exists ? await readText(asset.targetPath) : null;
  const currentManaged = exists ? currentManagedContent(asset, currentContent) : null;
  const currentHash = currentManaged === null ? null : sha256(currentManaged);
  const previous = previousByPath.get(asset.targetRelative);

  if (mode === "init") {
    let status = exists ? "skip-project-local" : "new-managed";
    let action = status;
    let content = asset.content;
    let managed = shouldManageInitAsset(asset, exists);

    if (exists) {
      const strategy = options.conflictStrategies?.[asset.targetRelative];
      if (strategy === "backup") {
        status = "backup-and-write";
        action = "backup-and-write";
        managed = true;
      } else if (strategy === "overwrite") {
        status = "overwrite-local";
        action = "overwrite-local";
        managed = true;
      }
    }

    if (asset.kind === "file" && exists && currentHash === asset.frameworkHash) {
      status = "unchanged";
      action = "unchanged";
      managed = true;
    }

    if (asset.kind === "managed-block" && exists && status !== "backup-and-write" && status !== "overwrite-local") {
      status = currentHash === asset.frameworkHash ? "unchanged" : "update-managed-block";
      action = status;
      content = plannedContent(asset, currentContent);
    }

    return {
      type: "file",
      ...asset,
      content,
      exists,
      currentHash,
      previousHash: previous?.hash ?? null,
      status,
      action,
      managed
    };
  }

  if (!previous) {
    return {
      type: "file",
      ...asset,
      exists,
      currentHash,
      previousHash: null,
      status: exists ? "skip-project-local" : "new-managed",
      action: exists ? "skip-project-local" : "new-managed",
      managed: !exists
    };
  }

  const status = statusForManagedAsset({
    exists,
    previous,
    currentHash,
    frameworkHash: asset.frameworkHash
  });

  return {
    type: "file",
    ...asset,
    content: plannedContent(asset, currentContent),
    exists,
    currentHash,
    previousHash: previous.hash,
    status,
    action: status,
    managed: true
  };
}

async function operationForOrphan(previous, projectPath) {
  const targetPath = path.join(projectPath, previous.path);
  const exists = await pathExists(targetPath);
  const currentContent = exists ? await readText(targetPath) : null;
  const currentManaged = previous.kind === "managed-block" && currentContent !== null
    ? extractManagedBlock(currentContent)
    : currentContent;

  return {
    type: "file",
    sourceRelative: previous.source,
    targetRelative: previous.path,
    targetPath,
    kind: previous.kind,
    exists,
    currentHash: currentManaged === null ? null : sha256(currentManaged),
    previousHash: previous.hash,
    frameworkHash: previous.hash,
    status: "orphan-managed",
    action: "orphan-managed",
    managed: true
  };
}

export async function buildPlan(projectPath, mode, options = {}) {
  const version = (await readText(versionFile)).trim();
  const previousManifest = await readManifest(projectPath);

  if (mode !== "init" && !previousManifest) {
    throw new Error(`Harness manifest not found: ${path.join(projectPath, manifestRelative)}. Run harness init first.`);
  }

  const previousByPath = manifestFileMap(previousManifest);
  const operations = [];
  const assets = await buildFrameworkAssets(projectPath, {
    ...options,
    includeOpencode: shouldIncludeOpencodeAssets(previousManifest, options)
  });
  const assetPaths = new Set(assets.map((asset) => asset.targetRelative));

  for (const asset of assets) {
    operations.push(await operationForAsset(asset, mode, previousByPath, options));
  }

  if (previousManifest) {
    for (const previous of previousManifest.managedFiles) {
      if (!assetPaths.has(previous.path)) {
        operations.push(await operationForOrphan(previous, projectPath));
      }
    }
  }

  operations.push({
    type: "directory",
    targetRelative: ".task",
    targetPath: path.join(projectPath, ".task"),
    action: "ensure-directory",
    status: "ensure-directory"
  });

  const manifest = buildManifest({
    version,
    installedAt: new Date().toISOString(),
    previousManifest,
    operations,
    force: options.force
  });

  operations.push({
    type: "manifest",
    targetRelative: manifestRelative,
    targetPath: path.join(projectPath, manifestRelative),
    action: "write-manifest",
    status: "write-manifest",
    content: `${JSON.stringify(manifest, null, 2)}\n`,
    manifest
  });

  return { version, previousManifest, manifest, operations };
}
