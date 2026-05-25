import path from "node:path";

export function parseCommonArgs(args) {
  const options = {
    project: process.cwd(),
    dryRun: false,
    force: false,
    auto: false,
    withOpencode: null
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

    throw new Error(`Unknown option: ${arg}`);
  }

  options.project = path.resolve(options.project);
  return options;
}
