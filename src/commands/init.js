import path from "node:path";
import { parseCommonArgs } from "../core/args.js";
import { applyPlan, printPlan } from "../core/apply-plan.js";
import { buildPlan } from "../core/plan.js";
import { promptConfig, promptConflictStrategy } from "./init-prompts.js";

export async function initCommand(args) {
  const options = parseCommonArgs(args);
  
  // 1. Initial plan to detect existing files
  const initialPlan = await buildPlan(options.project, "init", options);
  const conflicts = initialPlan.operations.filter(op => op.type === "file" && op.exists && op.status === "skip-project-local");

  // 2. Interactive Prompts (unless --auto)
  let variables = {
    projectName: path.basename(options.project),
    projectType: "unknown",
    architecture: "unknown",
    primaryLanguage: "unknown"
  };
  let conflictStrategies = {};

  if (!options.auto) {
    variables = await promptConfig(variables.projectName);
    for (const conflict of conflicts) {
      conflictStrategies[conflict.targetRelative] = await promptConflictStrategy(conflict.targetRelative);
    }
  }

  // 3. Final plan with variables and strategies
  const finalOptions = {
    ...options,
    variables,
    conflictStrategies
  };
  
  const plan = await buildPlan(options.project, "init", finalOptions);
  printPlan(plan, finalOptions);
  await applyPlan(plan, finalOptions);
}
