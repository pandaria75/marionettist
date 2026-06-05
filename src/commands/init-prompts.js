import { confirm, input, select } from "@inquirer/prompts";

export async function promptConfig(defaultProjectName, options = {}) {
  const projectName = await input({
    message: "Project Name:",
    default: defaultProjectName,
  });

  const projectType = await input({
    message: "Project Type (e.g., web, library, api):",
    default: options.projectType ?? "unknown",
  });

  const architecture = await input({
    message: "Architecture (e.g., monolith, microservices):",
    default: options.architecture ?? "unknown",
  });

  const primaryLanguage = await input({
    message: "Primary Language:",
    default: options.primaryLanguage ?? "unknown",
  });

  const knowledgeMode = options.skipKnowledgeModePrompt
    ? options.knowledgeMode
    : await select({
      message: "Knowledge Mode:",
      default: options.knowledgeMode ?? "standard",
      choices: [
        {
          name: "standard - balanced project knowledge guidance",
          value: "standard",
        },
        {
          name: "mudball - current-state-first guidance for messy or legacy-heavy codebases",
          value: "mudball",
        },
      ],
    });

  const knowledgeMaturity = options.skipKnowledgeMaturityPrompt
    ? options.knowledgeMaturity
    : await select({
      message: "Knowledge Maturity:",
      default: options.knowledgeMaturity ?? "L1",
      choices: [
        {
          name: "L0 - minimal knowledge capture",
          value: "L0",
        },
        {
          name: "L1 - lightweight current working guidance",
          value: "L1",
        },
        {
          name: "L2 - moderate structure and consistency",
          value: "L2",
        },
        {
          name: "L3 - stronger review and governance expectations",
          value: "L3",
        },
        {
          name: "L4 - highest knowledge rigor",
          value: "L4",
        },
      ],
    });

  return {
    projectName,
    projectType,
    architecture,
    primaryLanguage,
    knowledgeMode,
    knowledgeMaturity,
  };
}

export async function promptConflictStrategy(targetRelative) {
  return await select({
    message: `File already exists: ${targetRelative}. How would you like to proceed?`,
    choices: [
      {
        name: "Backup and Overwrite (Rename existing to .bak)",
        value: "backup",
      },
      {
        name: "Overwrite (Replace existing file)",
        value: "overwrite",
      },
      {
        name: "Skip (Keep existing file)",
        value: "skip",
      },
    ],
  });
}

export async function promptWithOpencode() {
  return await confirm({
    message: "Install optional OpenCode commands and agents?",
    default: false,
  });
}

export async function promptDistributionMode(defaultMode = "embedded") {
  return await select({
    message: "Choose the distribution mode:",
    default: defaultMode,
    choices: [
      {
        name: "embedded - default all-in-one harness install",
        value: "embedded",
      },
      {
        name: "hybrid - mixed source and adapter-oriented install",
        value: "hybrid",
      },
      {
        name: "adapter - adapter-focused runtime distribution",
        value: "adapter",
      },
    ],
  });
}

export async function promptOpencodeCommandSurface() {
  return await select({
    message: "Choose the OpenCode command surface:",
    default: "minimal",
    choices: [
      {
        name: "minimal - only /harness, /harness-dev, /harness-incident, /harness-docs, /harness-config",
        value: "minimal",
      },
      {
        name: "standard - minimal plus /harness-context, /harness-status, /harness-continue",
        value: "standard",
      },
      {
        name: "advanced - standard plus legacy feature, bugfix, and refactor wrappers",
        value: "advanced",
      },
    ],
  });
}

export async function promptOpencodePermissionMode(defaultMode = "default") {
  return await select({
    message: "Choose the OpenCode permission mode:",
    default: defaultMode,
    choices: [
      {
        name: "default - preserve current baseline behavior",
        value: "default",
      },
      {
        name: "moderate - broader routine work with safety baseline preserved",
        value: "moderate",
      },
      {
        name: "loose - broader access with higher risk",
        value: "loose",
      },
    ],
  });
}
