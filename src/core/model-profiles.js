import path from "node:path";
import { pathExists, readText } from "./files.js";
import { parseSimpleYaml } from "./yaml.js";
import { templatesRoot } from "./framework-paths.js";

export const modelProfilesSourceRelative = ".harness/model-profiles.yml";
export const legacyHarnessConfigRelative = "harness.config.yaml";
export const requiredModelProfiles = ["think", "build", "review", "run"];

export async function loadModelProfiles(projectPath) {
  const frameworkDefaults = await loadFrameworkDefaultProfiles();

  if (!frameworkDefaults) {
    throw new Error(`Framework model profile defaults not found: ${path.join(templatesRoot, modelProfilesSourceRelative)}`);
  }

  const canonicalProfiles = await readModelProfilesFromPath(
    path.join(projectPath, modelProfilesSourceRelative),
    "canonical"
  );
  if (canonicalProfiles) {
    return mergeModelProfiles(frameworkDefaults, canonicalProfiles);
  }

  const legacyProfiles = await readModelProfilesFromPath(
    path.join(projectPath, legacyHarnessConfigRelative),
    "legacy"
  );
  if (legacyProfiles) {
    return mergeModelProfiles(frameworkDefaults, legacyProfiles);
  }

  return frameworkDefaults;
}

export async function loadCanonicalOrFrameworkModelProfiles(projectPath) {
  const frameworkDefaults = await loadFrameworkDefaultProfiles();

  if (!frameworkDefaults) {
    throw new Error(`Framework model profile defaults not found: ${path.join(templatesRoot, modelProfilesSourceRelative)}`);
  }

  const canonicalProfiles = await readModelProfilesFromPath(
    path.join(projectPath, modelProfilesSourceRelative),
    "canonical"
  );

  return canonicalProfiles ? mergeModelProfiles(frameworkDefaults, canonicalProfiles) : frameworkDefaults;
}

export function buildModelProfileTemplateVariables(profiles, variables = {}) {
  return {
    ...variables,
    modelProfileThink: profiles.think.default,
    modelProfileBuild: profiles.build.default,
    modelProfileReview: profiles.review.default,
    modelProfileRun: profiles.run.default
  };
}

async function loadFrameworkDefaultProfiles() {
  const frameworkDefaultSource = await readModelProfilesFromPath(
    path.join(templatesRoot, modelProfilesSourceRelative),
    "canonical"
  );
  return frameworkDefaultSource ? normalizeModelProfiles(frameworkDefaultSource) : null;
}

async function readModelProfilesFromPath(filePath, sourceType) {
  if (!(await pathExists(filePath))) {
    return null;
  }

  const parsed = parseSimpleYaml(await readText(filePath));
  const rawProfiles = sourceType === "legacy"
    ? parsed?.models?.profiles
    : parsed?.profiles;

  if (!rawProfiles || typeof rawProfiles !== "object") {
    return null;
  }

  return rawProfiles;
}

function normalizeModelProfiles(rawProfiles) {
  const result = {};

  for (const profileName of requiredModelProfiles) {
    const rawProfile = rawProfiles?.[profileName];
    result[profileName] = {
      description: readProfileField(rawProfile, "description"),
      default: readProfileField(rawProfile, "default"),
      fallback: readProfileField(rawProfile, "fallback")
    };
  }

  return result;
}

function mergeModelProfiles(defaultProfiles, overrideProfiles) {
  const result = {};

  for (const profileName of requiredModelProfiles) {
    result[profileName] = {
      description: readProfileField(overrideProfiles?.[profileName], "description", defaultProfiles[profileName].description),
      default: readProfileField(overrideProfiles?.[profileName], "default", defaultProfiles[profileName].default),
      fallback: readProfileField(overrideProfiles?.[profileName], "fallback", defaultProfiles[profileName].fallback)
    };
  }

  return result;
}

function readProfileField(rawProfile, fieldName, fallback = "unknown") {
  const value = rawProfile?.[fieldName];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
