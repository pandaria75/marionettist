import path from "node:path";

export function parseCommonArgs(args) {
  const knowledgeModes = new Set(["standard", "mudball"]);
  const knowledgeMaturities = new Set(["L0", "L1", "L2", "L3", "L4"]);
  const options = {
    project: process.cwd(),
    dryRun: false,
    force: false,
    auto: false,
    withOpencode: null,
    opencodeCommandSurface: null,
    knowledgeMode: null,
    knowledgeMaturity: null
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--project") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--project requires a path");
      }
      options.project = value;
      index += 1;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg === "--auto") {
      options.auto = true;
      continue;
    }

    if (arg === "--with-opencode") {
      options.withOpencode = true;
      continue;
    }

    if (arg === "--opencode-command-surface") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--opencode-command-surface requires minimal or full");
      }
      if (value !== "minimal" && value !== "full") {
        throw new Error(`Unsupported --opencode-command-surface value: ${value}`);
      }
      options.opencodeCommandSurface = value;
      index += 1;
      continue;
    }

    if (arg === "--knowledge-mode") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--knowledge-mode requires standard or mudball");
      }
      if (!knowledgeModes.has(value)) {
        throw new Error(`Unsupported --knowledge-mode value: ${value}`);
      }
      options.knowledgeMode = value;
      index += 1;
      continue;
    }

    if (arg === "--knowledge-maturity") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--knowledge-maturity requires L0, L1, L2, L3, or L4");
      }
      if (!knowledgeMaturities.has(value)) {
        throw new Error(`Unsupported --knowledge-maturity value: ${value}`);
      }
      options.knowledgeMaturity = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (options.opencodeCommandSurface && options.withOpencode !== false) {
    options.withOpencode = true;
  }

  options.project = path.resolve(options.project);
  return options;
}
