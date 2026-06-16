import path from "node:path";
import { listFiles, pathExists, readText, toPosixPath } from "./files.js";
import { listResolvedOpencodeTemplateRelatives, resolveCoreTemplateSource, resolveOpencodeTemplateSource, skillsRoot, templatesRoot, versionFile } from "./framework-paths.js";
import { extractManagedBlock, replaceManagedBlock } from "./managed-block.js";
import { sha256 } from "./hash.js";
import { buildManifest, getManagedFileHash, manifestFileMap, manifestRelative, normalizeDistributionMode, normalizeOpencodeCommandSurface, normalizeOpencodePermissionMode, opencodeArtifactAdapter, readManifest, validateOptionalDistributionMode, validateOptionalOpencodeCommandSurface, validateOptionalOpencodePermissionMode } from "./manifest.js";
import { buildOpencodeAgentTemplateVariables, loadModelProfiles, loadModelProfilesState, modelProfilesSourceRelative, renderCanonicalModelProfiles } from "./model-profiles.js";
import { getOpencodePermissionPolicy } from "./opencode-permissions.js";
import { renderWithMetadata } from "./render.js";
import { parseSimpleYaml } from "./yaml.js";

const coreTemplateTargets = new Map([
  ["AGENTS.md", "AGENTS.md"],
  [".harness/model-profiles.yml", ".harness/model-profiles.yml"],
  [".harness/tier-policy.yml", ".harness/tier-policy.yml"],
  ["harness.config.yaml", "harness.config.yaml"],
  ["docs/project/harness-workflow.md", "docs/project/harness-workflow.md"],
  ["docs/project/knowledge-map.md", "docs/project/knowledge-map.md"],
  ["docs/project/tier-policy-workflow-design.md", "docs/project/tier-policy-workflow-design.md"],
  ["docs/current/system-map.md", "docs/current/system-map.md"],
  ["docs/target/architecture-intent.md", "docs/target/architecture-intent.md"],
  ["rules/00-repository-rules.md", ".aiassistant/rules/00-repository-rules.md"],
  ["rules/workflow-rules.md", ".aiassistant/rules/workflow-rules.md"]
]);

const opencodeManagedPrefix = ".opencode/";
const opencodeValidatorTemplatePrefix = "agents/validators/";
const opencodeProjectConfigSource = "opencode.jsonc";
const minimalOpencodeCommandRelatives = new Set([
  "commands/harness.md",
  "commands/harness-dev.md",
  "commands/harness-incident.md",
  "commands/harness-docs.md",
  "commands/harness-config.md"
]);
const standardOnlyOpencodeCommandRelatives = new Set([
  "commands/harness-context.md",
  "commands/harness-status.md",
  "commands/harness-continue.md"
]);
const advancedOnlyOpencodeCommandRelatives = new Set([
  "commands/harness-feature.md",
  "commands/harness-bugfix.md",
  "commands/harness-refactor.md"
]);
const knowledgeModeValues = new Set(["standard", "mudball"]);
const knowledgeMaturityValues = new Set(["L0", "L1", "L2", "L3", "L4"]);

async function buildFrameworkAssets(projectPath, options = {}) {
  const variables = normalizeKnowledgeVariables(options.variables ?? {});
  const assets = [];
  const modelProfilesState = await loadModelProfilesState(projectPath);

  for (const [sourceRelative, targetRelative] of coreTemplateTargets.entries()) {
    const resolvedSource = await resolveCoreTemplateSource(sourceRelative);
    if (!resolvedSource) {
      throw new Error(`Framework template source not found: templates/${sourceRelative}`);
    }
    const templateContent = await readText(resolvedSource.sourcePath);
    const renderState = buildFrameworkAssetRenderState(sourceRelative, variables, {
      modelProfilesState,
      distributionModeState: options.distributionModeState,
      opencodeCommandSurfaceState: options.opencodeCommandSurfaceState,
      opencodePermissionModeState: options.opencodePermissionModeState
    });
    const rendered = renderWithMetadata({
      templateContent,
      variables: renderState.variables,
      renderContext: renderState.renderContext,
      postRender: finalizeFrameworkAssetRender
    });
    const content = rendered.content;
    const kind = targetRelative === "AGENTS.md" ? "managed-block" : "file";
    const managedContent = kind === "managed-block" ? extractManagedBlock(content) : content;
    if (!managedContent) {
      throw new Error(`Template is missing harness managed block markers: ${sourceRelative}`);
    }

    assets.push({
      sourceRelative: resolvedSource.sourceRelative,
      targetRelative,
      targetPath: path.join(projectPath, targetRelative),
      kind,
      content,
      managedContent,
      frameworkHash: sha256(managedContent),
      templateHash: rendered.templateHash,
      renderedHash: rendered.renderedHash,
      renderInputHash: rendered.renderInputHash
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
    assets.push(...await buildOpencodeAssets(projectPath, variables, {
      commandSurfaceState: options.opencodeCommandSurfaceState,
      permissionModeState: options.opencodePermissionModeState
    }));
  }

  return assets;
}

async function buildOpencodeAssets(projectPath, variables = {}, states = {}) {
  const assets = [];
  const opencodeVariables = await resolveOpencodeVariables(projectPath, variables, states.permissionModeState);
  const opencodeRelatives = await listResolvedOpencodeTemplateRelatives();
  const validatorProjectGuidance = await buildValidatorProjectGuidance(projectPath, opencodeVariables);
  const commandSurface = normalizeOpencodeCommandSurface(states.commandSurfaceState?.value ?? "advanced", "effective OpenCode command surface");
  const permissionMode = normalizeOpencodePermissionMode(states.permissionModeState?.permissionMode ?? "default", "effective OpenCode permission mode");

  for (const sourceRelative of opencodeRelatives) {
    const resolvedSource = await resolveOpencodeTemplateSource(sourceRelative);
    if (!resolvedSource) {
      throw new Error(`Framework OpenCode template source not found: templates/opencode/${sourceRelative}`);
    }
    if (sourceRelative.startsWith(opencodeValidatorTemplatePrefix)) {
      continue;
    }
    if (sourceRelative.startsWith("commands/") && !shouldIncludeOpencodeCommand(sourceRelative, commandSurface)) {
      continue;
    }

    const targetRelative = sourceRelative === opencodeProjectConfigSource
      ? sourceRelative
      : toPosixPath(path.join(".opencode", sourceRelative));

    const templateContent = await readText(resolvedSource.sourcePath);
    const rendered = renderWithMetadata({
      templateContent,
      variables: sourceRelative === "agents/harness-validator.md"
        ? {
          ...opencodeVariables,
          validatorProjectGuidance
        }
        : opencodeVariables
    });
    const content = rendered.content;

    assets.push({
      sourceRelative: resolvedSource.sourceRelative,
      targetRelative,
      targetPath: path.join(projectPath, targetRelative),
      kind: "file",
      adapter: opencodeArtifactAdapter,
      templateHash: rendered.templateHash,
      renderedHash: rendered.renderedHash,
      renderInputHash: rendered.renderInputHash,
      commandSurface,
      permissionMode,
      content,
      managedContent: content,
      frameworkHash: sha256(content)
    });
  }

  return assets;
}

async function resolveOpencodeVariables(projectPath, variables = {}, permissionModeState = {}) {
  const profiles = await loadModelProfiles(projectPath);
  const permissionPolicy = getOpencodePermissionPolicy(permissionModeState.permissionMode ?? "default");

  return {
    ...buildOpencodeAgentTemplateVariables(profiles, variables),
    ...permissionPolicy.renderVariables
  };
}

async function buildValidatorProjectGuidance(projectPath, variables = {}) {
  const guidanceParts = [];
  const genericFallback = await readResolvedOpencodeTemplateText("agents/validators/generic-fallback.md");
  guidanceParts.push(genericFallback.trim());

  guidanceParts.push([
    "# Scheduled Validator Guidance",
    "",
    "- If `opencode.jsonc` enables `opencode-tasks` and the caller asks for recurring, unattended, or cron-style validation, prefer proposing an `opencode-tasks` schedule over an ad hoc loop.",
    "- Do not modify user-global scheduler state or create recurring tasks unless the caller explicitly asks for scheduling.",
    "- For normal one-off validation, continue to run the smallest relevant validation command directly."
  ].join("\n"));

  if (await detectGradleKotlinProject(projectPath, variables)) {
    const gradleKotlin = await readResolvedOpencodeTemplateText("agents/validators/gradle-kotlin.md");
    guidanceParts.push(gradleKotlin.trim());
  }

  if (await detectMavenProject(projectPath, variables)) {
    const maven = await readResolvedOpencodeTemplateText("agents/validators/maven.md");
    guidanceParts.push(maven.trim());
  }

  if (await detectNodeProject(projectPath, variables)) {
    const node = await readResolvedOpencodeTemplateText("agents/validators/node.md");
    guidanceParts.push(node.trim());
  }

  if (await detectPythonProject(projectPath, variables)) {
    const python = await readResolvedOpencodeTemplateText("agents/validators/python.md");
    guidanceParts.push(python.trim());
  }

  return guidanceParts.join("\n\n");
}

async function readResolvedOpencodeTemplateText(sourceRelative) {
  const resolvedSource = await resolveOpencodeTemplateSource(sourceRelative);
  if (!resolvedSource) {
    throw new Error(`Framework OpenCode template source not found: templates/opencode/${sourceRelative}`);
  }

  return readText(resolvedSource.sourcePath);
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

function hasManagedOpencodeAssets(previousManifest) {
  return previousManifest?.managedFiles?.some((file) => file.path === opencodeProjectConfigSource || file.path.startsWith(opencodeManagedPrefix)) ?? false;
}

function hasManagedAdvancedOpencodeCommands(previousManifest) {
  return previousManifest?.managedFiles?.some((file) => advancedOnlyOpencodeCommandRelatives.has(stripOpencodeManagedPrefix(file.path))) ?? false;
}

function hasManagedStandardOpencodeCommands(previousManifest) {
  return previousManifest?.managedFiles?.some((file) => standardOnlyOpencodeCommandRelatives.has(stripOpencodeManagedPrefix(file.path))) ?? false;
}

function stripOpencodeManagedPrefix(targetRelative) {
  return targetRelative.startsWith(opencodeManagedPrefix)
    ? targetRelative.slice(opencodeManagedPrefix.length)
    : targetRelative;
}

function shouldIncludeOpencodeCommand(sourceRelative, commandSurface) {
  if (!sourceRelative.startsWith("commands/")) {
    return true;
  }

  if (commandSurface === "advanced") {
    return true;
  }

  if (commandSurface === "standard") {
    return minimalOpencodeCommandRelatives.has(sourceRelative) || standardOnlyOpencodeCommandRelatives.has(sourceRelative);
  }

  return minimalOpencodeCommandRelatives.has(sourceRelative);
}

async function resolveDistributionModeState(projectPath, previousManifest, options = {}, mode = "sync") {
  const explicitDistributionMode = options.distributionMode === null || options.distributionMode === undefined
    ? null
    : normalizeDistributionMode(options.distributionMode, "--distribution-mode value");
  const recordedDistributionMode = validateOptionalDistributionMode(previousManifest?.distributionMode, "manifest distributionMode");
  const configuredDistributionMode = await readConfiguredDistributionMode(projectPath);

  assertValidDistributionModeSource(recordedDistributionMode, mode, "manifest");
  assertValidDistributionModeSource(configuredDistributionMode, mode, "config");

  let value = null;
  let source = null;
  let reportedValue = null;
  let reportedSource = null;
  let legacyInference = false;

  if (explicitDistributionMode !== null) {
    value = explicitDistributionMode;
    source = "cli";
    reportedValue = value;
    reportedSource = source;
  } else if (recordedDistributionMode.value !== null) {
    value = recordedDistributionMode.value;
    source = "manifest";
    reportedValue = value;
    reportedSource = source;
  } else if (configuredDistributionMode.value !== null) {
    value = configuredDistributionMode.value;
    source = "config";
    reportedValue = value;
    reportedSource = source;
  } else if (mode === "init") {
    value = "embedded";
    source = "default-new-install";
    reportedValue = value;
    reportedSource = source;
  } else if (previousManifest) {
    reportedValue = "embedded";
    reportedSource = "legacy-inferred";
    legacyInference = true;
  }

  return {
    value,
    source,
    reportedValue,
    reportedSource,
    legacyInference,
    persistToHarnessConfig: value !== null && (
      mode === "init"
      || source === "cli"
      || source === "manifest"
      || source === "config"
    )
  };
}

async function resolveOpencodeSurfaceAndPermissionState(projectPath, previousManifest, options = {}) {
  const configuredCommandSurface = await readConfiguredOpencodeCommandSurface(projectPath);
  const configuredPermissionMode = await readConfiguredOpencodePermissionMode(projectPath);
  const explicitCommandSurface = options.opencodeCommandSurface === null || options.opencodeCommandSurface === undefined
    ? null
    : normalizeOpencodeCommandSurface(options.opencodeCommandSurface, "--opencode-command-surface value");
  const explicitPermissionMode = options.opencodePermissionMode === null || options.opencodePermissionMode === undefined
    ? null
    : normalizeOpencodePermissionMode(options.opencodePermissionMode, "--opencode-permission-mode value");
  const managedCommandSurface = inferManagedOpencodeCommandSurface(previousManifest);
  const managedPermissionMode = inferManagedOpencodePermissionMode(previousManifest);
  const hasOpencode = explicitCommandSurface !== null
    || explicitPermissionMode !== null
    || options.withOpencode === true
    || hasManagedOpencodeAssets(previousManifest)
    || configuredCommandSurface.value !== null
    || configuredPermissionMode.value !== null;

  let value = null;
  let source = null;
  let permissionMode = null;
  let permissionModeSource = null;

  assertValidOpencodeCommandSurfaceSource(configuredCommandSurface, "config");
  assertValidOpencodePermissionModeSource(configuredPermissionMode, "config");
  assertValidOpencodePermissionModeSource(validateOptionalOpencodePermissionMode(previousManifest?.opencodePermissionMode, "manifest opencodePermissionMode"), "manifest");

  if (explicitCommandSurface !== null) {
    value = explicitCommandSurface;
    source = "cli";
  } else if (configuredCommandSurface.value !== null) {
    value = configuredCommandSurface.value;
    source = "config";
  } else if (managedCommandSurface.value !== null) {
    value = managedCommandSurface.value;
    source = managedCommandSurface.source;
  } else if (hasManagedOpencodeAssets(previousManifest)) {
    value = "minimal";
    source = "existing-managed-assets";
  } else if (options.withOpencode === true) {
    value = "minimal";
    source = "default-new-install";
  }

  if (explicitPermissionMode !== null) {
    permissionMode = explicitPermissionMode;
    permissionModeSource = "cli";
  } else if (configuredPermissionMode.value !== null) {
    permissionMode = configuredPermissionMode.value;
    permissionModeSource = "config";
  } else if (managedPermissionMode.value !== null) {
    permissionMode = managedPermissionMode.value;
    permissionModeSource = managedPermissionMode.source;
  } else if (hasManagedOpencodeAssets(previousManifest) || options.withOpencode === true) {
    permissionMode = "default";
    permissionModeSource = hasManagedOpencodeAssets(previousManifest) ? "legacy-default" : "default-new-install";
  }

  return {
    includeOpencode: options.withOpencode === false ? false : hasOpencode,
    value,
    source,
    permissionMode,
    permissionModeSource,
    persistToHarnessConfig: value !== null && (
      source === "cli"
      || source === "config"
      || options.withOpencode === true
    ),
    persistPermissionModeToHarnessConfig: permissionMode !== null && (
      permissionModeSource === "cli"
      || permissionModeSource === "config"
      || options.withOpencode === true
    )
  };
}

async function readConfiguredOpencodeCommandSurface(projectPath) {
  const harnessConfigPath = path.join(projectPath, "harness.config.yaml");
  if (!(await pathExists(harnessConfigPath))) {
    return { value: null, error: null, rawValue: null, isLegacyAlias: false };
  }

  try {
    const parsed = parseSimpleYaml(await readText(harnessConfigPath));
    const value = parsed?.opencode?.commandSurface;
    return validateOptionalOpencodeCommandSurface(value, "harness.config.yaml opencode.commandSurface");
  } catch {
    return { value: null, error: null, rawValue: null, isLegacyAlias: false };
  }
}

async function readConfiguredOpencodePermissionMode(projectPath) {
  const harnessConfigPath = path.join(projectPath, "harness.config.yaml");
  if (!(await pathExists(harnessConfigPath))) {
    return { value: null, error: null, rawValue: null };
  }

  try {
    const parsed = parseSimpleYaml(await readText(harnessConfigPath));
    const value = parsed?.opencode?.permissionMode;
    return validateOptionalOpencodePermissionMode(value, "harness.config.yaml opencode.permissionMode");
  } catch {
    return { value: null, error: null, rawValue: null };
  }
}

function inferManagedOpencodeCommandSurface(previousManifest) {
  if (!hasManagedOpencodeAssets(previousManifest)) {
    return { value: null, source: null };
  }

  const recordedValues = (previousManifest?.managedFiles ?? [])
    .filter((file) => file.adapter === opencodeArtifactAdapter && typeof file.commandSurface === "string" && file.commandSurface.length > 0)
    .map((file) => validateOptionalOpencodeCommandSurface(file.commandSurface, `manifest managedFiles[${file.path}] commandSurface`))
    .filter((result) => result.value !== null);

  if (recordedValues.some((result) => result.value === "advanced")) {
    return { value: "advanced", source: recordedValues.some((result) => result.isLegacyAlias) ? "legacy-manifest" : "manifest-metadata" };
  }

  if (recordedValues.some((result) => result.value === "standard")) {
    return { value: "standard", source: "manifest-metadata" };
  }

  if (recordedValues.some((result) => result.value === "minimal")) {
    return { value: "minimal", source: "manifest-metadata" };
  }

  if (hasManagedAdvancedOpencodeCommands(previousManifest)) {
    return { value: "advanced", source: "legacy-manifest" };
  }

  if (hasManagedStandardOpencodeCommands(previousManifest)) {
    return { value: "standard", source: "existing-managed-assets" };
  }

  return { value: "minimal", source: "existing-managed-assets" };
}

function inferManagedOpencodePermissionMode(previousManifest) {
  const topLevel = validateOptionalOpencodePermissionMode(previousManifest?.opencodePermissionMode, "manifest opencodePermissionMode");
  if (topLevel.value !== null) {
    return { value: topLevel.value, source: "manifest" };
  }

  if (!hasManagedOpencodeAssets(previousManifest)) {
    return { value: null, source: null };
  }

  const recordedValues = (previousManifest?.managedFiles ?? [])
    .filter((file) => file.adapter === opencodeArtifactAdapter && typeof file.permissionMode === "string" && file.permissionMode.length > 0)
    .map((file) => validateOptionalOpencodePermissionMode(file.permissionMode, `manifest managedFiles[${file.path}] permissionMode`))
    .filter((result) => result.value !== null);

  if (recordedValues.some((result) => result.value === "loose")) {
    return { value: "loose", source: "manifest-metadata" };
  }

  if (recordedValues.some((result) => result.value === "moderate")) {
    return { value: "moderate", source: "manifest-metadata" };
  }

  if (recordedValues.some((result) => result.value === "default")) {
    return { value: "default", source: "manifest-metadata" };
  }

  return { value: "default", source: "legacy-default" };
}

async function readConfiguredDistributionMode(projectPath) {
  const harnessConfigPath = path.join(projectPath, "harness.config.yaml");
  if (!(await pathExists(harnessConfigPath))) {
    return { value: null, error: null, rawValue: null };
  }

  try {
    const parsed = parseSimpleYaml(await readText(harnessConfigPath));
    const value = parsed?.distribution?.mode;
    return validateOptionalDistributionMode(value, "harness.config.yaml distribution.mode");
  } catch {
    return { value: null, error: null, rawValue: null };
  }
}

function assertValidDistributionModeSource(result, mode, sourceKind) {
  if (!result?.error) {
    return;
  }

  const subject = sourceKind === "manifest"
    ? ".harness/manifest.json distributionMode"
    : "harness.config.yaml distribution.mode";
  throw new Error(
    `Cannot continue because ${subject} is invalid for harness ${mode}. ${result.error} Fix the recorded distribution mode or remove it before rerunning. Use \`harness doctor --project <path>\` for a detailed report.`
  );
}

function assertValidOpencodeCommandSurfaceSource(result, sourceKind) {
  if (!result?.error) {
    return;
  }

  const subject = sourceKind === "manifest"
    ? ".harness/manifest.json managedFiles[*].commandSurface"
    : "harness.config.yaml opencode.commandSurface";
  throw new Error(
    `Cannot continue because ${subject} is invalid. ${result.error} Fix the recorded OpenCode command surface or remove it before rerunning. Use \`harness doctor --project <path>\` for a detailed report.`
  );
}

function assertValidOpencodePermissionModeSource(result, sourceKind) {
  if (!result?.error) {
    return;
  }

  const subject = sourceKind === "manifest"
    ? ".harness/manifest.json opencodePermissionMode"
    : "harness.config.yaml opencode.permissionMode";
  throw new Error(
    `Cannot continue because ${subject} is invalid. ${result.error} Fix the recorded OpenCode permission mode or remove it before rerunning. Use \`harness doctor --project <path>\` for a detailed report.`
  );
}

function renderHarnessConfigWithSelections(content, states = {}) {
  const sections = [];

  if (states.distributionModeState?.persistToHarnessConfig && states.distributionModeState.value) {
    sections.push(`distribution:\n  mode: "${states.distributionModeState.value}"`);
  }

  const opencodeLines = [];
  if (states.opencodeCommandSurfaceState?.persistToHarnessConfig && states.opencodeCommandSurfaceState.value) {
    opencodeLines.push(`  commandSurface: "${states.opencodeCommandSurfaceState.value}"`);
  }
  if (states.opencodePermissionModeState?.persistPermissionModeToHarnessConfig && states.opencodePermissionModeState.permissionMode) {
    opencodeLines.push(`  permissionMode: "${states.opencodePermissionModeState.permissionMode}"`);
  }
  if (opencodeLines.length > 0) {
    sections.push(`opencode:\n${opencodeLines.join("\n")}`);
  }

  if (sections.length === 0) {
    return content;
  }

  const trimmed = content.replace(/\s*$/u, "");
  return `${trimmed}\n\n${sections.join("\n\n")}\n`;
}

function buildFrameworkAssetRenderState(sourceRelative, variables, states = {}) {
  if (sourceRelative === modelProfilesSourceRelative && states.modelProfilesState?.source === "legacy") {
    return {
      variables: {},
      renderContext: {
        modelProfilesState: {
          source: states.modelProfilesState.source,
          effectiveProfiles: states.modelProfilesState.effectiveProfiles
        }
      }
    };
  }

  if (sourceRelative === "harness.config.yaml") {
    return {
      variables,
      renderContext: {
        harnessConfigSelections: buildHarnessConfigRenderSelections(states)
      }
    };
  }

  return {
    variables,
    renderContext: null
  };
}

function buildHarnessConfigRenderSelections(states = {}) {
  return {
    distributionModeState: states.distributionModeState?.persistToHarnessConfig
      ? {
        value: states.distributionModeState.value,
        persistToHarnessConfig: true
      }
      : {
        value: null,
        persistToHarnessConfig: false
      },
    opencodeCommandSurfaceState: states.opencodeCommandSurfaceState?.persistToHarnessConfig
      ? {
        value: states.opencodeCommandSurfaceState.value,
        persistToHarnessConfig: true
      }
      : {
        value: null,
        persistToHarnessConfig: false
      },
    opencodePermissionModeState: states.opencodePermissionModeState?.persistPermissionModeToHarnessConfig
      ? {
        permissionMode: states.opencodePermissionModeState.permissionMode,
        persistPermissionModeToHarnessConfig: true
      }
      : {
        permissionMode: null,
        persistPermissionModeToHarnessConfig: false
      }
  };
}

function finalizeFrameworkAssetRender({ content, renderContext }) {
  if (renderContext?.modelProfilesState?.source === "legacy") {
    return renderCanonicalModelProfiles(renderContext.modelProfilesState.effectiveProfiles);
  }

  if (renderContext?.harnessConfigSelections) {
    return renderHarnessConfigWithSelections(content, renderContext.harnessConfigSelections);
  }

  return content;
}

function normalizeKnowledgeVariables(variables = {}) {
  const knowledgeMode = normalizeKnowledgeMode(variables.knowledgeMode ?? "standard");
  const knowledgeMaturity = normalizeKnowledgeMaturity(variables.knowledgeMaturity ?? "L1");

  return {
    ...variables,
    knowledgeMode,
    knowledgeMaturity
  };
}

function normalizeKnowledgeMode(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!knowledgeModeValues.has(normalized)) {
    throw new Error(`Unsupported knowledge mode: ${value}`);
  }
  return normalized;
}

function normalizeKnowledgeMaturity(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!knowledgeMaturityValues.has(normalized)) {
    throw new Error(`Unsupported knowledge maturity: ${value}`);
  }
  return normalized;
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

  const previousHash = getManagedFileHash(previous);
  const localChanged = currentHash !== previousHash;
  const frameworkChanged = frameworkHash !== previousHash;

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
      previousHash: getManagedFileHash(previous),
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
    previousHash: getManagedFileHash(previous),
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
    adapter: previous.adapter,
    renderedHash: previous.renderedHash,
    templateHash: previous.templateHash,
    renderInputHash: previous.renderInputHash,
    commandSurface: previous.commandSurface,
    permissionMode: previous.permissionMode,
    exists,
    currentHash: currentManaged === null ? null : sha256(currentManaged),
    previousHash: getManagedFileHash(previous),
    frameworkHash: getManagedFileHash(previous),
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
  const distributionModeState = await resolveDistributionModeState(projectPath, previousManifest, options, mode);
  const opencodeCommandSurfaceState = await resolveOpencodeSurfaceAndPermissionState(projectPath, previousManifest, options);
  const opencodePermissionModeState = {
    permissionMode: opencodeCommandSurfaceState.permissionMode,
    permissionModeSource: opencodeCommandSurfaceState.permissionModeSource,
    persistPermissionModeToHarnessConfig: opencodeCommandSurfaceState.persistPermissionModeToHarnessConfig
  };
  const assets = await buildFrameworkAssets(projectPath, {
    ...options,
    includeOpencode: opencodeCommandSurfaceState.includeOpencode,
    distributionModeState,
    opencodeCommandSurfaceState,
    opencodePermissionModeState
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
    force: options.force,
    distributionMode: distributionModeState.value,
    opencodePermissionMode: opencodePermissionModeState.permissionMode
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

  return { version, previousManifest, manifest, operations, distributionModeState, opencodeCommandSurfaceState, opencodePermissionModeState };
}
