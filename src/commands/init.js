import path from "node:path";
import { parseCommonArgs } from "../core/args.js";
import { applyPlan, printPlan } from "../core/apply-plan.js";
import { buildPlan } from "../core/plan.js";
import { promptConfig, promptConflictStrategy, promptOpencodeCommandSurface, promptWithOpencode } from "./init-prompts.js";

export async function initCommand(args) {
  const options = parseCommonArgs(args);

  // 1. Interactive Prompts (unless --auto)
  let variables = {
    projectName: path.basename(options.project),
    projectType: "unknown",
    architecture: "unknown",
    primaryLanguage: "unknown"
  };
  let conflictStrategies = {};
  let withOpencode = options.withOpencode;
  let opencodeCommandSurface = options.opencodeCommandSurface;

  if (!options.auto) {
    variables = await promptConfig(variables.projectName);

    if (withOpencode === null) {
      withOpencode = await promptWithOpencode();
    }

    if (withOpencode && opencodeCommandSurface === null) {
      opencodeCommandSurface = await promptOpencodeCommandSurface();
    }
  }

  const planningOptions = {
    ...options,
    variables,
    withOpencode,
    opencodeCommandSurface
  };

  // 2. Initial plan to detect existing files for the selected asset set
  const initialPlan = await buildPlan(options.project, "init", planningOptions);
  const conflicts = initialPlan.operations.filter(op => op.type === "file" && op.exists && op.status === "skip-project-local");

  // 3. Conflict strategy prompts
  if (!options.auto) {
    for (const conflict of conflicts) {
      conflictStrategies[conflict.targetRelative] = await promptConflictStrategy(conflict.targetRelative);
    }
  }

  // 4. Final plan with variables and strategies
  const finalOptions = {
    ...planningOptions,
    conflictStrategies
  };

  const plan = await buildPlan(options.project, "init", finalOptions);
  printPlan(plan, finalOptions);
  await applyPlan(plan, finalOptions);

  if (withOpencode) {
    console.log("note: project-level opencode-tasks is enabled via opencode.jsonc");
  }
}
