import path from "node:path";
import { pathExists, readText } from "./files.js";
import { templatesRoot } from "./framework-paths.js";
import { parseSimpleYaml } from "./yaml.js";

export const tierPolicySourceRelative = ".harness/tier-policy.yml";
export const tierValues = ["S", "M", "L"];

const tierIndex = new Map(tierValues.map((tier, index) => [tier, index]));
const workflowHintRank = new Map([
  ["direct", 0],
  ["analysis-context", 1],
  ["full-harness", 2]
]);
const reviewLevelRank = new Map([
  ["standard", 0],
  ["critic-required", 1]
]);
const gateHintRank = new Map([
  ["default", 0],
  ["prefer-strict", 1],
  ["critic-required", 2]
]);

const allowedRootKeys = new Set(["schemaVersion", "tiers"]);
const allowedTierKeys = new Set([
  "description",
  "matchRules",
  "minTier",
  "maxTier",
  "workflowHint",
  "gateHint",
  "reviewLevel",
  "modelProfileHint"
]);
const requiredTierKeys = [
  "description",
  "matchRules",
  "workflowHint",
  "gateHint",
  "reviewLevel",
  "modelProfileHint"
];

export async function loadTierPolicy(projectPath) {
  return (await loadTierPolicyState(projectPath)).effectivePolicy;
}

export async function loadTierPolicyState(projectPath) {
  const frameworkDefaults = await loadFrameworkTierPolicy();

  if (!frameworkDefaults) {
    throw new Error(`Framework tier policy defaults not found: ${path.join(templatesRoot, tierPolicySourceRelative)}`);
  }

  const projectSource = await readTierPolicySource(path.join(projectPath, tierPolicySourceRelative));
  const explanation = buildTierPolicyExplanation({ frameworkDefaults, projectSource });

  return {
    frameworkDefaults,
    projectSource,
    effectivePolicy: explanation.tiers,
    explanation
  };
}

export async function loadTierPolicyExplanation(projectPath) {
  return (await loadTierPolicyState(projectPath)).explanation;
}

export function explainTierPolicyState(state) {
  return state.explanation;
}

async function loadFrameworkTierPolicy() {
  const source = await readTierPolicySource(path.join(templatesRoot, tierPolicySourceRelative));
  if (!source.exists) {
    return null;
  }
  if (source.parseError) {
    throw new Error(`Framework tier policy template parse failed: ${source.parseError.message}`);
  }

  const normalized = normalizeTierPolicyDocument(source.parsed, { sourceLabel: "framework tier policy defaults" });
  if (normalized.errors.length > 0) {
    throw new Error(`Framework tier policy template is invalid: ${normalized.errors.join("; ")}`);
  }

  return normalized.tiers;
}

async function readTierPolicySource(filePath) {
  if (!(await pathExists(filePath))) {
    return { exists: false, filePath, parsed: null, parseError: null };
  }

  try {
    return {
      exists: true,
      filePath,
      parsed: parseSimpleYaml(await readText(filePath), { validateIndentation: true }),
      parseError: null
    };
  } catch (error) {
    return {
      exists: true,
      filePath,
      parsed: null,
      parseError: error instanceof Error ? error : new Error(String(error))
    };
  }
}

function buildTierPolicyExplanation({ frameworkDefaults, projectSource }) {
  const warnings = [];
  const errors = [];
  const relativePath = tierPolicySourceRelative;

  if (!projectSource.exists) {
    warnings.push(`${relativePath} not found; using framework tier defaults.`);
    return buildExplanation({
      activeSource: "framework-default",
      relativePath,
      tiers: frameworkDefaults,
      warnings,
      errors,
      usingDefaultPolicy: true,
      usingFallbackPolicy: true,
      fallbackReason: "missing-policy"
    });
  }

  if (projectSource.parseError) {
    errors.push(`${relativePath} parse failed: ${projectSource.parseError.message}`);
    warnings.push("Task intake should explain the parse failure and continue with framework tier defaults until the project policy is fixed.");
    return buildExplanation({
      activeSource: "project-invalid-fallback",
      relativePath,
      tiers: frameworkDefaults,
      warnings,
      errors,
      usingDefaultPolicy: true,
      usingFallbackPolicy: true,
      fallbackReason: "malformed-policy"
    });
  }

  const normalized = normalizeTierPolicyDocument(projectSource.parsed, { sourceLabel: relativePath, basePolicy: frameworkDefaults });
  warnings.push(...normalized.warnings);
  errors.push(...normalized.errors);

  const resolution = resolveTierPolicyInteractions({
    frameworkDefaults,
    projectPolicy: normalized.tiers,
    projectDocument: projectSource.parsed,
    sourceLabel: relativePath
  });
  warnings.push(...resolution.warnings);
  errors.push(...resolution.errors);

  if (errors.length > 0) {
    warnings.push("Task intake should explain that invalid tier-policy fields were ignored and framework defaults remain active where needed.");
  }

  return buildExplanation({
    activeSource: errors.length > 0 ? "project-partial-fallback" : "project",
    relativePath,
    tiers: resolution.tiers,
    warnings,
    errors,
    usingDefaultPolicy: false,
    usingFallbackPolicy: errors.length > 0,
    fallbackReason: errors.length > 0 ? resolution.fallbackReason : "none",
    interactions: resolution.interactions
  });
}

function buildExplanation({
  activeSource,
  relativePath,
  tiers,
  warnings,
  errors,
  usingDefaultPolicy,
  usingFallbackPolicy,
  fallbackReason,
  interactions = []
}) {
  return {
    activeSource,
    policyPath: relativePath,
    usingDefaultPolicy,
    usingFallbackPolicy,
    fallbackReason,
    warnings,
    errors,
    interactions,
    tiers,
    advisoryHints: buildAdvisoryHints(tiers)
  };
}

function buildAdvisoryHints(tiers) {
  const hints = {};

  for (const tier of tierValues) {
    const config = tiers[tier];
    hints[tier] = {
      workflowHint: config.workflowHint,
      gateHint: config.gateHint,
      reviewLevel: config.reviewLevel,
      modelProfileHint: config.modelProfileHint,
      minTier: config.minTier,
      maxTier: config.maxTier,
      matchRules: [...config.matchRules],
      description: config.description
    };
  }

  return hints;
}

function normalizeTierPolicyDocument(rawPolicy, { sourceLabel, basePolicy = null }) {
  const warnings = [];
  const errors = [];
  const tiers = cloneTierMap(basePolicy);
  const rawDocument = isPlainObject(rawPolicy) ? rawPolicy : {};

  if (!isPlainObject(rawPolicy)) {
    errors.push(`${sourceLabel} invalid: expected a mapping at the document root.`);
  }

  const unexpectedRootKeys = Object.keys(rawDocument).filter((key) => !allowedRootKeys.has(key));
  if (unexpectedRootKeys.length > 0) {
    errors.push(`${sourceLabel} invalid: unsupported root key(s): ${unexpectedRootKeys.join(", ")}. Allowed root keys: schemaVersion, tiers.`);
  }

  const schemaVersion = normalizeSchemaVersion(rawDocument.schemaVersion);
  if (schemaVersion.error) {
    errors.push(`${sourceLabel} schemaVersion invalid: ${schemaVersion.error}`);
  }

  const rawTiers = rawDocument.tiers;
  if (!isPlainObject(rawTiers)) {
    errors.push(`${sourceLabel} invalid: tiers must be a mapping containing S, M, and L.`);
  }

  for (const tierName of tierValues) {
    const rawTier = rawTiers?.[tierName];
    if (!isPlainObject(rawTier)) {
      errors.push(`${sourceLabel} invalid: tiers.${tierName} must be a mapping.`);
      continue;
    }

    const baseTier = basePolicy?.[tierName] ?? null;
    const normalizedTier = baseTier ? { ...baseTier, matchRules: [...baseTier.matchRules] } : {};
    const unexpectedTierKeys = Object.keys(rawTier).filter((key) => !allowedTierKeys.has(key));
    if (unexpectedTierKeys.length > 0) {
      errors.push(`${sourceLabel} invalid: tiers.${tierName} has unsupported key(s): ${unexpectedTierKeys.join(", ")}.`);
    }

    normalizedTier.description = normalizeRequiredString(rawTier.description, `${sourceLabel} tiers.${tierName}.description`, errors, baseTier?.description);
    normalizedTier.workflowHint = normalizeRequiredString(rawTier.workflowHint, `${sourceLabel} tiers.${tierName}.workflowHint`, errors, baseTier?.workflowHint);
    normalizedTier.gateHint = normalizeRequiredString(rawTier.gateHint, `${sourceLabel} tiers.${tierName}.gateHint`, errors, baseTier?.gateHint);
    normalizedTier.reviewLevel = normalizeRequiredString(rawTier.reviewLevel, `${sourceLabel} tiers.${tierName}.reviewLevel`, errors, baseTier?.reviewLevel);
    normalizedTier.modelProfileHint = normalizeRequiredString(rawTier.modelProfileHint, `${sourceLabel} tiers.${tierName}.modelProfileHint`, errors, baseTier?.modelProfileHint);
    normalizedTier.matchRules = normalizeMatchRules(rawTier.matchRules, `${sourceLabel} tiers.${tierName}.matchRules`, errors, warnings, baseTier?.matchRules ?? []);
    normalizedTier.minTier = normalizeTierBoundary(rawTier.minTier, `${sourceLabel} tiers.${tierName}.minTier`, errors, warnings, baseTier?.minTier ?? null);
    normalizedTier.maxTier = normalizeTierBoundary(rawTier.maxTier, `${sourceLabel} tiers.${tierName}.maxTier`, errors, warnings, baseTier?.maxTier ?? null);

    for (const fieldName of requiredTierKeys) {
      if (!hasOwn(rawTier, fieldName)) {
        errors.push(`${sourceLabel} invalid: tiers.${tierName}.${fieldName} is required.`);
      }
    }

    if (!hasOwn(rawTier, "minTier")) {
      normalizedTier.minTier = baseTier?.minTier ?? null;
    }
    if (!hasOwn(rawTier, "maxTier")) {
      normalizedTier.maxTier = baseTier?.maxTier ?? null;
    }

    validateTierBoundaryInvariants({ tierName, tierConfig: normalizedTier, sourceLabel, errors });

    tiers[tierName] = normalizedTier;
  }

  return { tiers, warnings, errors };
}

function resolveTierPolicyInteractions({ frameworkDefaults, projectPolicy, projectDocument, sourceLabel }) {
  const warnings = [];
  const errors = [];
  const tiers = cloneTierMap(frameworkDefaults);
  const interactions = [];
  const rawTiers = isPlainObject(projectDocument?.tiers) ? projectDocument.tiers : {};

  for (const tierName of tierValues) {
    const rawTier = isPlainObject(rawTiers[tierName]) ? rawTiers[tierName] : null;
    const frameworkTier = frameworkDefaults[tierName];
    const projectTier = projectPolicy[tierName] ?? frameworkTier;
    const effectiveTier = {
      ...frameworkTier,
      matchRules: [...frameworkTier.matchRules]
    };

    for (const fieldName of allowedTierKeys) {
      if (!rawTier || !hasOwn(rawTier, fieldName)) {
        effectiveTier[fieldName] = cloneTierField(projectTier[fieldName]);
        continue;
      }

      const frameworkValue = frameworkTier[fieldName];
      const projectValue = projectTier[fieldName];
      const interaction = classifyTierFieldInteraction({ tierName, fieldName, frameworkValue, projectValue, sourceLabel });

      if (interaction) {
        interactions.push(interaction);
        if (interaction.classification === "hard-conflict") {
          errors.push(interaction.message);
          effectiveTier[fieldName] = cloneTierField(frameworkValue);
          continue;
        }

        if (interaction.classification === "soft-conflict" || interaction.classification === "explicit-override") {
          warnings.push(interaction.message);
        }
      }

      effectiveTier[fieldName] = cloneTierField(projectValue);
    }

    tiers[tierName] = effectiveTier;
  }

  return {
    tiers,
    interactions,
    warnings,
    errors,
    fallbackReason: errors.some((message) => message.includes("hard conflict")) ? "hard-conflict" : "malformed-policy"
  };
}

function normalizeSchemaVersion(value) {
  if (value === undefined || value === null || value === "") {
    return { value: null, error: "expected \"1\"." };
  }

  if (String(value).trim() !== "1") {
    return { value: null, error: `expected \"1\", got ${JSON.stringify(value)}.` };
  }

  return { value: "1", error: null };
}

function normalizeRequiredString(value, label, errors, fallback) {
  if (value === undefined) {
    return fallback ?? "";
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${label} invalid: expected a non-empty string.`);
    return fallback ?? "";
  }

  return value.trim();
}

function normalizeMatchRules(value, label, errors, warnings, fallback) {
  if (value === undefined) {
    return [...fallback];
  }

  if (Array.isArray(value)) {
    const normalized = [];

    for (const item of value) {
      if (typeof item !== "string" || item.trim().length === 0) {
        errors.push(`${label} invalid: expected a list of non-empty strings.`);
        return [...fallback];
      }
      normalized.push(item.trim());
    }

    if (normalized.length === 0) {
      errors.push(`${label} invalid: expected at least one match rule.`);
      return [...fallback];
    }

    return normalized;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    warnings.push(`${label} normalized from a single string to a one-item list.`);
    return [value.trim()];
  }

  if (isPlainObject(value)) {
    const extracted = Object.values(value)
      .filter((item) => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim());

    if (extracted.length > 0) {
      warnings.push(`${label} normalized from a mapping to a string list because the simple YAML parser may have produced an edge-case structure.`);
      return extracted;
    }
  }

  errors.push(`${label} invalid: expected a list of plain strings.`);
  return [...fallback];
}

function normalizeTierBoundary(value, label, errors, warnings, fallback) {
  const normalizedNull = normalizeTierNullish(value);
  if (normalizedNull.wasQuotedNull) {
    warnings.push(`${label} normalized quoted string \"null\" to null.`);
  }
  if (normalizedNull.value === null) {
    return null;
  }

  if (typeof normalizedNull.value !== "string") {
    errors.push(`${label} invalid: expected S, M, L, or null.`);
    return fallback;
  }

  const candidate = normalizedNull.value.trim().toUpperCase();
  if (!tierValues.includes(candidate)) {
    errors.push(`${label} invalid: expected S, M, L, or null, got ${JSON.stringify(value)}.`);
    return fallback;
  }

  return candidate;
}

function validateTierBoundaryInvariants({ tierName, tierConfig, sourceLabel, errors }) {
  const tierPosition = tierIndex.get(tierName);
  const minPosition = tierBoundaryPosition(tierConfig.minTier, -1);
  const maxPosition = tierBoundaryPosition(tierConfig.maxTier, Number.POSITIVE_INFINITY);

  if (minPosition > tierPosition) {
    errors.push(`${sourceLabel} invalid: tiers.${tierName}.minTier cannot be stricter than tier ${tierName}.`);
  }

  if (maxPosition < tierPosition) {
    errors.push(`${sourceLabel} invalid: tiers.${tierName}.maxTier cannot be lower than tier ${tierName}.`);
  }

  if (minPosition > maxPosition) {
    errors.push(`${sourceLabel} invalid: tiers.${tierName}.minTier cannot exceed tiers.${tierName}.maxTier.`);
  }
}

function classifyTierFieldInteraction({ tierName, fieldName, frameworkValue, projectValue, sourceLabel }) {
  if (areTierFieldValuesEqual(frameworkValue, projectValue)) {
    return null;
  }

  const label = `${sourceLabel} tiers.${tierName}.${fieldName}`;

  if (fieldName === "description") {
    return buildInteraction({
      tierName,
      fieldName,
      classification: "explicit-override",
      frameworkValue,
      projectValue,
      message: `${label} explicit override accepted: project-local description replaces framework default text.`
    });
  }

  if (fieldName === "modelProfileHint") {
    return buildInteraction({
      tierName,
      fieldName,
      classification: "explicit-override",
      frameworkValue,
      projectValue,
      message: `${label} explicit override accepted: project-local modelProfileHint replaces framework default hint.`
    });
  }

  if (fieldName === "matchRules") {
    if (isRuleSuperset(projectValue, frameworkValue)) {
      return buildInteraction({
        tierName,
        fieldName,
        classification: "refinement",
        frameworkValue,
        projectValue,
        message: `${label} refinement accepted: project-local matchRules retain all framework defaults and add stricter project-local guidance.`
      });
    }

    return buildInteraction({
      tierName,
      fieldName,
      classification: "soft-conflict",
      frameworkValue,
      projectValue,
      message: `${label} soft conflict accepted with explanation: project-local matchRules replace or remove framework defaults, so task intake should explain the local wording change.`
    });
  }

  if (fieldName === "minTier") {
    return compareOrderedField({
      tierName,
      fieldName,
      frameworkValue,
      projectValue,
      weakerIsHardConflict: true,
      strongerMessage: `${label} refinement accepted: project-local minTier is stricter than the framework default.`,
      weakerMessage: `${label} hard conflict: project-local minTier weakens the framework default and would lower the minimum risk floor without explicit override signaling.`
    });
  }

  if (fieldName === "maxTier") {
    return compareOrderedField({
      tierName,
      fieldName,
      frameworkValue,
      projectValue,
      reverseOrder: true,
      weakerIsHardConflict: true,
      strongerMessage: `${label} refinement accepted: project-local maxTier is stricter than the framework default.`,
      weakerMessage: `${label} hard conflict: project-local maxTier weakens the framework default and would broaden lower-risk classification without explicit override signaling.`
    });
  }

  if (fieldName === "workflowHint") {
    return compareOrderedField({
      tierName,
      fieldName,
      frameworkValue,
      projectValue,
      rankMap: workflowHintRank,
      weakerIsHardConflict: true,
      strongerMessage: `${label} refinement accepted: project-local workflowHint is stricter than the framework default.`,
      weakerMessage: `${label} hard conflict: project-local workflowHint weakens the framework default and would downgrade a higher-risk workflow path without explicit override signaling.`
    });
  }

  if (fieldName === "reviewLevel") {
    return compareOrderedField({
      tierName,
      fieldName,
      frameworkValue,
      projectValue,
      rankMap: reviewLevelRank,
      weakerIsHardConflict: true,
      strongerMessage: `${label} refinement accepted: project-local reviewLevel is stricter than the framework default.`,
      weakerMessage: `${label} hard conflict: project-local reviewLevel weakens the framework default and would reduce required review signaling for higher-risk work without explicit override signaling.`
    });
  }

  if (fieldName === "gateHint") {
    return compareOrderedField({
      tierName,
      fieldName,
      frameworkValue,
      projectValue,
      rankMap: gateHintRank,
      weakerIsHardConflict: false,
      strongerMessage: `${label} refinement accepted: project-local gateHint is stricter than the framework default.`,
      weakerMessage: `${label} soft conflict accepted with explanation: project-local gateHint is less strict than the framework default, but gateHint remains advisory and must not silently downgrade real gate behavior.`
    });
  }

  return buildInteraction({
    tierName,
    fieldName,
    classification: "explicit-override",
    frameworkValue,
    projectValue,
    message: `${label} explicit override accepted.`
  });
}

function compareOrderedField({
  tierName,
  fieldName,
  frameworkValue,
  projectValue,
  label = `${tierPolicySourceRelative} tiers.${tierName}.${fieldName}`,
  rankMap = tierIndex,
  reverseOrder = false,
  weakerIsHardConflict,
  strongerMessage,
  weakerMessage
}) {
  const frameworkRank = readRank(frameworkValue, rankMap, reverseOrder);
  const projectRank = readRank(projectValue, rankMap, reverseOrder);

  if (frameworkRank === null || projectRank === null) {
    return buildInteraction({
      tierName,
      fieldName,
      classification: "explicit-override",
      frameworkValue,
      projectValue,
      message: `${label} explicit override accepted.`
    });
  }

  if (projectRank > frameworkRank) {
    return buildInteraction({ tierName, fieldName, classification: "refinement", frameworkValue, projectValue, message: strongerMessage });
  }

  return buildInteraction({
    tierName,
    fieldName,
    classification: weakerIsHardConflict ? "hard-conflict" : "soft-conflict",
    frameworkValue,
    projectValue,
    message: weakerMessage,
    dangerous: weakerIsHardConflict
  });
}

function buildInteraction({ tierName, fieldName, classification, frameworkValue, projectValue, message, dangerous = false }) {
  return {
    tier: tierName,
    field: fieldName,
    classification,
    frameworkValue: cloneTierField(frameworkValue),
    projectValue: cloneTierField(projectValue),
    dangerous,
    message
  };
}

function areTierFieldValuesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isRuleSuperset(projectRules, frameworkRules) {
  if (!Array.isArray(projectRules) || !Array.isArray(frameworkRules)) {
    return false;
  }

  const projectSet = new Set(projectRules);
  return frameworkRules.every((rule) => projectSet.has(rule));
}

function readRank(value, rankMap, reverseOrder) {
  if (value === null) {
    return reverseOrder ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  const rank = rankMap.get(normalized) ?? rankMap.get(normalized.toUpperCase());
  if (rank === undefined) {
    return null;
  }

  return reverseOrder ? -rank : rank;
}

function tierBoundaryPosition(value, fallback) {
  if (value === null) {
    return fallback;
  }

  return tierIndex.get(value) ?? fallback;
}

function cloneTierField(value) {
  return Array.isArray(value) ? [...value] : value;
}

function normalizeTierNullish(value) {
  if (value === undefined || value === null || value === "") {
    return { value: null, wasQuotedNull: false };
  }

  if (typeof value === "string" && value.trim().toLowerCase() === "null") {
    return { value: null, wasQuotedNull: true };
  }

  return { value, wasQuotedNull: false };
}

function cloneTierMap(basePolicy) {
  if (!basePolicy) {
    return {};
  }

  const result = {};
  for (const tier of tierValues) {
    result[tier] = {
      ...basePolicy[tier],
      matchRules: [...(basePolicy[tier]?.matchRules ?? [])]
    };
  }
  return result;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}
