import path from "node:path";

export function parseCommonArgs(args) {
  const options = {
    project: process.cwd(),
    dryRun: false,
    force: false,
    auto: false,
    withOpencode: null,
    opencodeCommandSurface: null
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

    throw new Error(`Unknown option: ${arg}`);
  }

  if (options.opencodeCommandSurface && options.withOpencode !== false) {
    options.withOpencode = true;
  }

  options.project = path.resolve(options.project);
  return options;
}
