import { parseCommonArgs } from "../core/args.js";
import { manifestRelative } from "../core/manifest.js";
import { buildClearPlan } from "../core/clear-plan.js";
import { applyClearPlan } from "../core/clear-apply.js";

export async function clearCommand(args) {
  const options = parseCommonArgs(args);
  const mode = options.apply ? "apply" : "preview";
  const plan = await buildClearPlan(options.project, { scope: options.scope });

  console.log(`marionettist clear (${mode})`);
  console.log(`project: ${options.project}`);
  console.log(`scope: ${options.scope}`);
  console.log(`manifest: ${plan.manifestFound ? manifestRelative : `${manifestRelative} (missing)`}`);

  if (!plan.manifestFound) {
    console.log("planned actions: none (manifest not found)");
  } else {
    console.log(`planned actions: ${plan.summary.total}`);
    for (const target of plan.targets) {
      if (target.action === "edit") {
        console.log(`edit: ${target.path}`);
        if (target.preview?.hasManagedBlock) {
          const localSummary = target.preview.hasProjectLocalContent
            ? `preserves project-local content (${target.preview.preservedLineCount} lines)`
            : "no project-local content remains";
          console.log(`  remove: managed block (${target.preview.removableLineCount} lines)`);
          console.log(`  keep: ${localSummary}`);
        } else {
          console.log("  keep: no managed block found; nothing would be removed");
        }
        continue;
      }

      const suffix = target.exists ? "" : " (already missing)";
      console.log(`${target.action}: ${target.path}${suffix}`);
    }
  }

  if (!options.apply) {
    console.log("dry-run: preview only; no files will be changed");
    return;
  }

  const result = await applyClearPlan(plan);
  console.log(`backup root: ${result.backupRootRelative}`);
  for (const operation of result.operations) {
    if (operation.type === "remove") {
      console.log(`applied remove: ${operation.path}`);
      continue;
    }

    const safeFileMessage = operation.managedBlockOnly
      ? " (managed block removed; safe empty file kept)"
      : "";
    console.log(`applied edit: ${operation.path}${safeFileMessage}`);
  }
}
