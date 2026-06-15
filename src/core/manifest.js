import path from "node:path";
import { pathExists, readText, writeText } from "./files.js";

export const manifestRelative = ".harness/manifest.json";
export const distributionModeValues = new Set(["embedded", "hybrid", "adapter"]);
export const opencodeArtifactAdapter = "opencode";
export const opencodeCommandSurfaceValues = new Set(["minimal", "standard", "advanced"]);
export const opencodePermissionModeValues = new Set(["default", "moderate", "loose"]);
const opencodeCommandSurfaceAliases = new Map([["full", "advanced"]]);

export function manifestPath(projectPath) {
  return path.join(projectPath, manifestRelative);
}

export async function readManifest(projectPath) {
  const filePath = manifestPath(projectPath);
  if (!(await pathExists(filePath))) {
    return null;
  }

  const manifest = JSON.parse(await readText(filePath));
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.managedFiles)) {
    throw new Error(`Unsupported harness manifest format: ${filePath}`);
  }
  return manifest;
}

export async function writeManifest(projectPath, manifest, options) {
  await writeText(manifestPath(projectPath), `${JSON.stringify(manifest, null, 2)}\n`, options);
}

export function manifestFileMap(manifest) {
  const result = new Map();
  for (const file of manifest?.managedFiles ?? []) {
    result.set(file.path, file);
  }
  return result;
}

export function buildManifest({ version, installedAt, previousManifest, operations, force = false, distributionMode = null, opencodePermissionMode = null }) {
  const previousInstalledAt = previousManifest?.installedAt ?? installedAt;
  const manifestDistributionMode = resolveManifestDistributionMode(previousManifest, distributionMode);
  const manifestOpencodePermissionMode = resolveManifestOpencodePermissionMode(previousManifest, opencodePermissionMode);
  const managedFiles = operations
    .filter((operation) => operation.type === "file" && operation.managed)
    .map((operation) => buildManagedFileRecord(operation, force))
    .sort((left, right) => left.path.localeCompare(right.path));

  return {
    schemaVersion: 1,
    frameworkVersion: version,
    ...(manifestDistributionMode ? { distributionMode: manifestDistributionMode } : {}),
    ...(manifestOpencodePermissionMode ? { opencodePermissionMode: manifestOpencodePermissionMode } : {}),
    installedAt: previousInstalledAt,
    updatedAt: installedAt,
    managedFiles
  };
}

export function getManagedFileHash(file) {
  return file?.hash ?? file?.renderedHash ?? null;
}

export function normalizeDistributionMode(value, label = "distribution mode") {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!distributionModeValues.has(normalized)) {
    throw new Error(`Unsupported ${label}: ${value}. Expected embedded, hybrid, or adapter.`);
  }
  return normalized;
}

export function validateOptionalDistributionMode(value, label = "distribution mode") {
  if (value === undefined || value === null || value === "") {
    return { value: null, error: null, rawValue: value };
  }

  if (typeof value !== "string") {
    return {
      value: null,
      error: `${label} invalid: expected string embedded|hybrid|adapter, got ${typeof value}`,
      rawValue: value
    };
  }

  try {
    return {
      value: normalizeDistributionMode(value, label),
      error: null,
      rawValue: value
    };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : String(error),
      rawValue: value
    };
  }
}

export function normalizeOpencodeCommandSurface(value, label = "OpenCode command surface") {
  const normalized = String(value ?? "").trim().toLowerCase();
  const canonical = opencodeCommandSurfaceAliases.get(normalized) ?? normalized;

  if (!opencodeCommandSurfaceValues.has(canonical)) {
    throw new Error(`Unsupported ${label}: ${value}. Expected minimal, standard, advanced, or legacy full.`);
  }

  return canonical;
}

export function validateOptionalOpencodeCommandSurface(value, label = "OpenCode command surface") {
  if (value === undefined || value === null || value === "") {
    return {
      value: null,
      error: null,
      rawValue: value,
      isLegacyAlias: false
    };
  }

  if (typeof value !== "string") {
    return {
      value: null,
      error: `${label} invalid: expected string minimal|standard|advanced|full, got ${typeof value}`,
      rawValue: value,
      isLegacyAlias: false
    };
  }

  const normalized = value.trim().toLowerCase();

  if (!opencodeCommandSurfaceValues.has(normalized) && !opencodeCommandSurfaceAliases.has(normalized)) {
    return {
      value: null,
      error: `${label} invalid: expected minimal|standard|advanced|full, got ${value}`,
      rawValue: value,
      isLegacyAlias: false
    };
  }

  try {
    return {
      value: normalizeOpencodeCommandSurface(value, label),
      error: null,
      rawValue: value,
      isLegacyAlias: normalized === "full"
    };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : String(error),
      rawValue: value,
      isLegacyAlias: false
    };
  }
}

export function normalizeOpencodePermissionMode(value, label = "OpenCode permission mode") {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (!opencodePermissionModeValues.has(normalized)) {
    throw new Error(`Unsupported ${label}: ${value}. Expected default, moderate, or loose.`);
  }

  return normalized;
}

export function validateOptionalOpencodePermissionMode(value, label = "OpenCode permission mode") {
  if (value === undefined || value === null || value === "") {
    return {
      value: null,
      error: null,
      rawValue: value
    };
  }

  if (typeof value !== "string") {
    return {
      value: null,
      error: `${label} invalid: expected string default|moderate|loose, got ${typeof value}`,
      rawValue: value
    };
  }

  try {
    return {
      value: normalizeOpencodePermissionMode(value, label),
      error: null,
      rawValue: value
    };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : String(error),
      rawValue: value
    };
  }
}

function resolveManifestDistributionMode(previousManifest, distributionMode) {
  if (distributionMode !== null && distributionMode !== undefined) {
    return normalizeDistributionMode(distributionMode, "distribution mode");
  }

  if (previousManifest?.distributionMode !== undefined) {
    return normalizeDistributionMode(previousManifest.distributionMode, "manifest distributionMode");
  }

  return null;
}

function resolveManifestOpencodePermissionMode(previousManifest, opencodePermissionMode) {
  if (opencodePermissionMode !== null && opencodePermissionMode !== undefined) {
    return normalizeOpencodePermissionMode(opencodePermissionMode, "OpenCode permission mode");
  }

  if (previousManifest?.opencodePermissionMode !== undefined) {
    return normalizeOpencodePermissionMode(previousManifest.opencodePermissionMode, "manifest opencodePermissionMode");
  }

  return null;
}

function buildManagedFileRecord(operation, force) {
  const hash = manifestHashForOperation(operation, force);
  const record = {
    path: operation.targetRelative,
    source: operation.sourceRelative,
    kind: operation.kind,
    hash
  };

  if (operation.renderedHash) {
    record.renderedHash = operation.renderedHash;
  }

  if (operation.templateHash) {
    record.templateHash = operation.templateHash;
  }

  if (operation.renderInputHash) {
    record.renderInputHash = operation.renderInputHash;
  }

  if (operation.adapter === opencodeArtifactAdapter) {
    record.adapter = operation.adapter;
    if (operation.commandSurface) {
      record.commandSurface = normalizeOpencodeCommandSurface(operation.commandSurface, "OpenCode command surface metadata");
    }
    if (operation.permissionMode) {
      record.permissionMode = normalizeOpencodePermissionMode(operation.permissionMode, "OpenCode permission mode metadata");
    }
  }

  return record;
}

function manifestHashForOperation(operation, force) {
  if (force && (operation.status === "modified-local" || operation.status === "conflict")) {
    return operation.frameworkHash;
  }
  if (operation.status === "modified-local" || operation.status === "conflict") {
    return operation.previousHash;
  }
  return operation.frameworkHash;
}
