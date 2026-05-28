import { initCommand } from "../commands/init.js";
import { syncCommand } from "../commands/sync.js";
import { diffCommand } from "../commands/diff.js";
import { doctorCommand } from "../commands/doctor.js";
import { selfCommand } from "../commands/self.js";
import { fileURLToPath } from "node:url";

const help = `Universal AI Harness Framework

Usage:
  harness init [--project <path>] [--dry-run] [--force] [--auto] [--with-opencode]
  harness sync [--project <path>] [--dry-run] [--force]
  harness diff [--project <path>]
  harness doctor [--project <path>]
  harness self init [--apply] [--with-opencode]
  harness self doctor
  harness self test
  harness --help
`;

export async function runCli(args) {
  const [command, ...rest] = args;

  if (!command || command === "--help" || command === "-h") {
    console.log(help);
    return;
  }

  if (command === "init") {
    await initCommand(rest);
    return;
  }

  if (command === "sync") {
    await syncCommand(rest);
    return;
  }

  if (command === "diff") {
    await diffCommand(rest);
    return;
  }

  if (command === "doctor") {
    await doctorCommand(rest);
    return;
  }

  if (command === "self") {
    await selfCommand(rest);
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${help}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
