import { parseCommonArgs } from "../core/args.js";
import { printPlan } from "../core/apply-plan.js";
import { buildPlan } from "../core/plan.js";

export async function diffCommand(args) {
  const options = parseCommonArgs(args);
  const plan = await buildPlan(options.project, "sync", { ...options, dryRun: true });
  printPlan(plan, { ...options, dryRun: true });
}
