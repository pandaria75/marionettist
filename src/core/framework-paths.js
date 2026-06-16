import path from "node:path";
import { fileURLToPath } from "node:url";
import { listFiles, pathExists, toPosixPath } from "./files.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

function normalizeSourceRelative(sourceRelative) {
  return sourceRelative.replace(/^[\\/]+/, "");
}

function isPlaceholderSourceRelative(sourceRelative) {
  return path.posix.basename(sourceRelative) === ".gitkeep";
}

export const frameworkRoot = path.resolve(currentDir, "../..");
export const templatesRoot = path.join(frameworkRoot, "templates");
export const coreTemplatesRoot = path.join(templatesRoot, "core");
export const pathwaysTemplatesRoot = path.join(templatesRoot, "pathways");
export const opencodeTemplatesRoot = path.join(templatesRoot, "opencode");
export const pathwayOpencodeTemplatesRoot = path.join(pathwaysTemplatesRoot, "opencode");
export const distributionsRoot = path.join(frameworkRoot, "distributions");
export const skillsRoot = path.join(frameworkRoot, "skills");
export const versionFile = path.join(frameworkRoot, "VERSION");

export function getCoreTemplateSourceRelativeCandidates(sourceRelative) {
  const normalizedSourceRelative = normalizeSourceRelative(sourceRelative);
  return [
    path.posix.join("core", normalizedSourceRelative),
    normalizedSourceRelative
  ];
}

export function getOpencodeTemplateSourceRelativeCandidates(sourceRelative) {
  const normalizedSourceRelative = normalizeSourceRelative(sourceRelative);
  return [
    path.posix.join("pathways", "opencode", normalizedSourceRelative),
    path.posix.join("opencode", normalizedSourceRelative)
  ];
}

export function getCoreTemplateSourceCandidates(sourceRelative) {
  return getCoreTemplateSourceRelativeCandidates(sourceRelative)
    .map((candidate) => path.join(templatesRoot, candidate));
}

export function getOpencodeTemplateSourceCandidates(sourceRelative) {
  return getOpencodeTemplateSourceRelativeCandidates(sourceRelative)
    .map((candidate) => path.join(templatesRoot, candidate));
}

export async function resolveFirstExistingPath(candidatePaths) {
  for (const candidatePath of candidatePaths) {
    if (await pathExists(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
}

export async function resolveCoreTemplateSource(sourceRelative) {
  const sourceCandidates = getCoreTemplateSourceCandidates(sourceRelative);
  const resolvedPath = await resolveFirstExistingPath(sourceCandidates);
  if (!resolvedPath) {
    return null;
  }

  return {
    sourcePath: resolvedPath,
    sourceRelative: `templates/${toPosixPath(path.relative(templatesRoot, resolvedPath))}`
  };
}

export async function resolveOpencodeTemplateSource(sourceRelative) {
  const sourceCandidates = getOpencodeTemplateSourceCandidates(sourceRelative);
  const resolvedPath = await resolveFirstExistingPath(sourceCandidates);
  if (!resolvedPath) {
    return null;
  }

  return {
    sourcePath: resolvedPath,
    sourceRelative: `templates/${toPosixPath(path.relative(templatesRoot, resolvedPath))}`
  };
}

export async function listResolvedOpencodeTemplateRelatives() {
  const relatives = new Set();
  for (const root of [pathwayOpencodeTemplatesRoot, opencodeTemplatesRoot]) {
    for (const sourcePath of await listFiles(root)) {
      const sourceRelative = toPosixPath(path.relative(root, sourcePath));
      if (isPlaceholderSourceRelative(sourceRelative)) {
        continue;
      }
      relatives.add(sourceRelative);
    }
  }

  return [...relatives].sort((left, right) => left.localeCompare(right));
}
