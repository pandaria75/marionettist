import path from "node:path";
import { parseCommonArgs } from "../core/args.js";
import { applyPlan, printPlan } from "../core/apply-plan.js";
import { buildPlan } from "../core/plan.js";
import { promptConfig, promptConflictStrategy, promptDistributionMode, promptOpencodeCommandSurface, promptWithOpencode } from "./init-prompts.js";

export async function initCommand(args) {
  const options = parseCommonArgs(args);

  // 1. Interactive Prompts (unless --auto)
  let variables = {
    projectName: path.basename(options.project),
    projectType: "unknown",
    architecture: "unknown",
    primaryLanguage: "unknown",
    knowledgeMode: options.knowledgeMode ?? "standard",
    knowledgeMaturity: options.knowledgeMaturity ?? "L1"
  };
  let conflictStrategies = {};
  let withOpencode = options.withOpencode;
  let distributionMode = options.distributionMode;
  let opencodeCommandSurface = options.opencodeCommandSurface;

  if (!options.auto) {
    const promptedVariables = await promptConfig(variables.projectName, {
      projectType: variables.projectType,
      architecture: variables.architecture,
      primaryLanguage: variables.primaryLanguage,
      knowledgeMode: variables.knowledgeMode,
      knowledgeMaturity: variables.knowledgeMaturity,
      skipKnowledgeModePrompt: options.knowledgeMode !== null,
      skipKnowledgeMaturityPrompt: options.knowledgeMaturity !== null
    });
    variables = {
      ...promptedVariables,
      knowledgeMode: options.knowledgeMode ?? promptedVariables.knowledgeMode,
      knowledgeMaturity: options.knowledgeMaturity ?? promptedVariables.knowledgeMaturity
    };

    if (withOpencode === null) {
      withOpencode = await promptWithOpencode();
    }

    if (distributionMode === null) {
      distributionMode = await promptDistributionMode();
    }

    if (withOpencode && opencodeCommandSurface === null) {
      opencodeCommandSurface = await promptOpencodeCommandSurface();
    }
  }

  const planningOptions = {
    ...options,
    variables,
    withOpencode,
    distributionMode,
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
