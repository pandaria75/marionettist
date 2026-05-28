import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const harnessBin = path.join(repoRoot, "bin", "harness.js");

const initOutput = await harness("self", "init");
assertIncludes(initOutput, "mode: dry-run");
assertIncludes(initOutput, ".harness/self/README.md");
assertIncludes(initOutput, "note: use --apply");

const doctorOutput = await harness("self", "doctor");
assertIncludes(doctorOutput, "PASS  root AGENTS.md exists");
assertIncludes(doctorOutput, "PASS  .harness/self profile exists");
assertIncludes(doctorOutput, "PASS  .harness-self/ is ignored");
assertIncludes(doctorOutput, "PASS  templates/AGENTS.md has no self-dogfooding markers");
assertIncludes(doctorOutput, "PASS  fixtures/target-empty exists");
assertIncludes(doctorOutput, "PASS  scripts/self-smoke.mjs exists");

const templateAgents = await fs.readFile(path.join(repoRoot, "templates", "AGENTS.md"), "utf8");
assertExcludes(templateAgents, "HARNESS_SELF_POLICY");
assertExcludes(templateAgents, ".harness-self");

const testOutput = await harness("self", "test");
assertIncludes(testOutput, "Harness Self Test");
assertIncludes(testOutput, "PASS  target-empty manifest exists");
assertIncludes(testOutput, "PASS  target-existing-agents local AGENTS.md content preserved");
assertIncludes(testOutput, "PASS  target-conflict-managed-block local content preserved");
assertIncludes(testOutput, "PASS  target-conflict-managed-block sync dry-run preserves AGENTS.md");
assertIncludes(testOutput, "PASS  target-old-manifest reports missing managed AGENTS.md");
assertIncludes(testOutput, "PASS  templates/AGENTS.md remains free of self rules");
assertIncludes(testOutput, "sandbox:");

console.log("self-smoke: PASS");

async function harness(...args) {
  return exec(process.execPath, [harnessBin, ...args], repoRoot);
}

async function exec(command, args, cwd) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd, encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) {
        error.message = `${error.message}\nstdout:\n${stdout}\nstderr:\n${stderr}`;
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(content, expected) {
  assert(content.includes(expected), `Expected output to include: ${expected}\nActual output:\n${content}`);
}

function assertExcludes(content, unexpected) {
  assert(!content.includes(unexpected), `Expected content to exclude: ${unexpected}`);
}
