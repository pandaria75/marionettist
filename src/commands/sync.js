import { parseCommonArgs } from "../core/args.js";
import { applyPlan, printPlan } from "../core/apply-plan.js";
import { buildPlan } from "../core/plan.js";

export async function syncCommand(args) {
  const options = parseCommonArgs(args);
  const plan = await buildPlan(options.project, "sync", options);
  printPlan(plan, options);
  await applyPlan(plan, options);
}
