import { parseCommonArgs } from "../core/args.js";
import { applyPlan, printPlan } from "../core/apply-plan.js";
import { buildPlan } from "../core/plan.js";

export async function initCommand(args) {
  const options = parseCommonArgs(args);
  const plan = await buildPlan(options.project, "init", options);
  printPlan(plan, options);
  await applyPlan(plan, options);
}
