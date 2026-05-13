import path from "node:path";
import { listFiles, pathExists, readText, toPosixPath } from "./files.js";
import { skillsRoot, templatesRoot, versionFile } from "./framework-paths.js";
import { renderTemplate } from "./template.js";
import { extractManagedBlock, replaceManagedBlock } from "./managed-block.js";
import { sha256 } from "./hash.js";
import { buildManifest, manifestFileMap, manifestRelative, readManifest } from "./manifest.js";

const templateTargets = new Map([
  ["AGENTS.md", "AGENTS.md"],
  ["harness.config.yaml", "harness.config.yaml"],
  ["docs/project/harness-workflow.md", "docs/project/harness-workflow.md"],
  ["docs/project/knowledge-map.md", "docs/project/knowledge-map.md"],
  ["rules/00-repository-rules.md", ".aiassistant/rules/00-repository-rules.md"],
  ["rules/workflow-rules.md", ".aiassistant/rules/workflow-rules.md"]
]);

async function buildFrameworkAssets(projectPath) {
  const projectName = path.basename(projectPath);
  const variables = { projectName };
  const assets = [];

  for (const [sourceRelative, targetRelative] of templateTargets.entries()) {
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

  return assets;
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

async function operationForAsset(asset, mode, previousByPath) {
  const exists = await pathExists(asset.targetPath);
  const currentContent = exists ? await readText(asset.targetPath) : null;
  const currentManaged = exists ? currentManagedContent(asset, currentContent) : null;
  const currentHash = currentManaged === null ? null : sha256(currentManaged);
  const previous = previousByPath.get(asset.targetRelative);

  if (mode === "init") {
    let status = exists ? "skip-project-local" : "new-managed";
    let content = asset.content;
    let managed = shouldManageInitAsset(asset, exists);

    if (asset.kind === "file" && exists && currentHash === asset.frameworkHash) {
      status = "unchanged";
      managed = true;
    }

    if (asset.kind === "managed-block" && exists) {
      status = currentHash === asset.frameworkHash ? "unchanged" : "update-managed-block";
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
      action: status,
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
  const assets = await buildFrameworkAssets(projectPath);
  const assetPaths = new Set(assets.map((asset) => asset.targetRelative));

  for (const asset of assets) {
    operations.push(await operationForAsset(asset, mode, previousByPath));
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
