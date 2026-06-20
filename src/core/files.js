import fs from "node:fs/promises";
import path from "node:path";

export const backupsRootRelative = ".marionettist/backups";

export async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

export async function writeText(filePath, content, { dryRun = false } = {}) {
  if (dryRun) {
    return;
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

export async function listFiles(root) {
  const result = [];

  if (!(await pathExists(root))) {
    return result;
  }

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        result.push(fullPath);
      }
    }
  }

  await walk(root);
  return result;
}

export function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

export function isBackupPath(relativePath) {
  const normalized = toPosixPath(path.normalize(relativePath));
  return normalized === backupsRootRelative || normalized.startsWith(`${backupsRootRelative}/`);
}

export function resolveContainedPath(projectRoot, relativePath) {
  const rootPath = path.resolve(projectRoot);
  const targetPath = path.resolve(rootPath, relativePath);
  const relativeTargetPath = path.relative(rootPath, targetPath);

  if (
    relativeTargetPath === ".."
    || relativeTargetPath.startsWith(`..${path.sep}`)
    || path.isAbsolute(relativeTargetPath)
  ) {
    throw new Error(`Target path escapes project root: ${toPosixPath(relativePath)}`);
  }

  return targetPath;
}

export async function resolveExistingContainedPath(projectRoot, relativePath) {
  const rootPath = path.resolve(projectRoot);
  const containedPath = resolveContainedPath(rootPath, relativePath);
  const realProjectRoot = await fs.realpath(rootPath);
  const realTargetPath = await fs.realpath(containedPath);
  const relativeRealTargetPath = path.relative(realProjectRoot, realTargetPath);

  if (
    relativeRealTargetPath === ".."
    || relativeRealTargetPath.startsWith(`..${path.sep}`)
    || path.isAbsolute(relativeRealTargetPath)
  ) {
    throw new Error(`Target path resolves outside project root: ${toPosixPath(relativePath)}`);
  }

  return containedPath;
}
