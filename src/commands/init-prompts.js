import { confirm, input, select } from "@inquirer/prompts";

export async function promptConfig(defaultProjectName) {
  const projectName = await input({
    message: "Project Name:",
    default: defaultProjectName,
  });

  const projectType = await input({
    message: "Project Type (e.g., web, library, api):",
    default: "unknown",
  });

  const architecture = await input({
    message: "Architecture (e.g., monolith, microservices):",
    default: "unknown",
  });

  const primaryLanguage = await input({
    message: "Primary Language:",
    default: "unknown",
  });

  return {
    projectName,
    projectType,
    architecture,
    primaryLanguage,
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
