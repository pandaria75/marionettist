import { initCommand } from "../commands/init.js";
import { syncCommand } from "../commands/sync.js";
import { diffCommand } from "../commands/diff.js";

const help = `Universal AI Harness Framework

Usage:
  harness init [--project <path>] [--dry-run] [--force]
  harness sync [--project <path>] [--dry-run] [--force]
  harness diff [--project <path>]
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

  throw new Error(`Unknown command: ${command}\n\n${help}`);
}
