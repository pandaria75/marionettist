import path from "node:path";
import { pathExists, readText } from "./files.js";
import { opencodeArtifactAdapter, readManifest } from "./manifest.js";
import { previewManagedBlockCleanup } from "./managed-block.js";

export async function buildClearPlan(projectPath, options = {}) {
  const scope = options.scope ?? "all";
  const manifest = await readManifest(projectPath);

  if (!manifest) {
    return {
      projectPath,
      scope,
      manifest,
      manifestFound: false,
      targets: [],
      summary: {
        total: 0,
        removable: 0,
        editable: 0,
        missing: 0
      }
    };
  }

  const managedFiles = manifest.managedFiles.filter((record) => matchesScope(record, scope));
  const targets = await Promise.all(managedFiles.map(async (record) => {
    const targetPath = path.join(projectPath, record.path);
    const exists = await pathExists(targetPath);
    const action = record.kind === "managed-block" ? "edit" : "remove";
    const preview = record.kind === "managed-block" && exists
      ? previewManagedBlockCleanup(await readText(targetPath))
      : null;

    return {
      path: record.path,
      targetPath,
      kind: record.kind,
      adapter: record.adapter ?? null,
      exists,
      action,
      status: exists ? "present" : "missing",
      preview,
      record
    };
  }));

  targets.sort((left, right) => left.path.localeCompare(right.path));

  return {
    projectPath,
    scope,
    manifest,
    manifestFound: true,
    targets,
    summary: {
      total: targets.length,
      removable: targets.filter((target) => target.action === "remove").length,
      editable: targets.filter((target) => target.action === "edit").length,
      missing: targets.filter((target) => !target.exists).length
    }
  };
}

function matchesScope(record, scope) {
  if (scope === "opencode") {
    return record.adapter === opencodeArtifactAdapter;
  }

  return true;
}
