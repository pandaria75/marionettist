import fs from "node:fs/promises";
import path from "node:path";
import {
  backupsRootRelative,
  isBackupPath,
  readText,
  resolveContainedPath,
  resolveExistingContainedPath,
  toPosixPath,
  writeText
} from "./files.js";

const safeEmptyAgentsContent = "# AGENTS\n";

export async function applyClearPlan(plan, options = {}) {
  const dryRun = options.dryRun ?? false;
  const timestamp = options.timestamp ?? new Date().toISOString().replace(/[:.]/g, "-");
  const backupRootRelative = `${backupsRootRelative}/${timestamp}`;
  const backupRootPath = resolveContainedPath(plan.projectPath, backupRootRelative);
  const operations = [];

  for (const target of plan.targets) {
    if (!target.exists) {
      continue;
    }

    if (isBackupPath(target.path)) {
      continue;
    }

    if (target.action === "remove") {
      assertRemovableTarget(target);
      const targetPath = await resolveExistingContainedPath(plan.projectPath, target.path);
      const backupPath = resolveContainedPath(backupRootPath, target.path);

      operations.push({
        type: "remove",
        path: target.path,
        targetPath,
        backupPath
      });
      continue;
    }

    if (target.action === "edit") {
      const editOperation = await buildManagedBlockEditOperation(plan, target, backupRootPath);
      if (editOperation) {
        operations.push(editOperation);
      }
    }
  }

  if (dryRun) {
    return {
      applied: false,
      dryRun: true,
      backupRootRelative,
      operations: operations.map(toReportedOperation)
    };
  }

  for (const operation of operations) {
    await backupTarget(operation.targetPath, operation.backupPath);

    if (operation.type === "remove") {
      await fs.rm(operation.targetPath);
      continue;
    }

    await writeText(operation.targetPath, operation.nextContent);
  }

  return {
    applied: true,
    dryRun: false,
    backupRootRelative,
    operations: operations.map(toReportedOperation)
  };
}

function assertRemovableTarget(target) {
  if (target.record?.kind !== "file") {
    throw new Error(`Refusing to remove non-file target: ${target.path}`);
  }
}

async function buildManagedBlockEditOperation(plan, target, backupRootPath) {
  const targetPath = await resolveExistingContainedPath(plan.projectPath, target.path);
  const existingContent = await readText(targetPath);
  const preview = target.preview;

  if (!preview?.hasManagedBlock) {
    return null;
  }

  const backupPath = resolveContainedPath(backupRootPath, target.path);
  return {
    type: "edit",
    path: target.path,
    targetPath,
    backupPath,
    managedBlockOnly: preview.managedBlockOnly,
    nextContent: preview.managedBlockOnly ? safeEmptyAgentsContent : `${preview.preservedContent}\n`
  };
}

async function backupTarget(targetPath, backupPath) {
  await fs.mkdir(path.dirname(backupPath), { recursive: true });
  await fs.copyFile(targetPath, backupPath);
}

function toReportedOperation(operation) {
  return {
    type: operation.type,
    path: operation.path,
    backupPath: toPosixPath(operation.backupPath),
    managedBlockOnly: operation.managedBlockOnly ?? false
  };
}
