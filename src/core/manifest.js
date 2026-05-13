import path from "node:path";
import { pathExists, readText, writeText } from "./files.js";

export const manifestRelative = ".harness/manifest.json";

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

export function buildManifest({ version, installedAt, previousManifest, operations, force = false }) {
  const previousInstalledAt = previousManifest?.installedAt ?? installedAt;
  const managedFiles = operations
    .filter((operation) => operation.type === "file" && operation.managed)
    .map((operation) => ({
      path: operation.targetRelative,
      source: operation.sourceRelative,
      kind: operation.kind,
      hash: manifestHashForOperation(operation, force)
    }))
    .sort((left, right) => left.path.localeCompare(right.path));

  return {
    schemaVersion: 1,
    frameworkVersion: version,
    installedAt: previousInstalledAt,
    updatedAt: installedAt,
    managedFiles
  };
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
