import fs from "node:fs/promises";
import path from "node:path";
import { frameworkRoot } from "../core/framework-paths.js";
import { buildModelProfileTemplateVariables, loadCanonicalOrFrameworkModelProfiles, modelProfilesSourceRelative } from "../core/model-profiles.js";
import { getOpencodePermissionPolicy } from "../core/opencode-permissions.js";
import { renderTemplate } from "../core/template.js";
import { initCommand } from "./init.js";
import { diffCommand } from "./diff.js";
import { syncCommand } from "./sync.js";
import { doctorCommand } from "./doctor.js";

const selfProfileRelative = ".harness/self/README.md";
const selfRuntimeRelative = ".harness-self/";
const templatesAgentsRelative = "templates/AGENTS.md";
const templatesOpencodeRelative = "templates/opencode";
const selfOpencodeMirrorRoots = ["agents", "commands"];
const selfOpencodeRequiredFiles = [
  "opencode.jsonc",
  ".opencode/README.md",
  ".opencode/commands/harness-self-init.md",
  ".opencode/commands/harness-self-review.md",
  ".opencode/commands/harness-self-test.md",
  ".opencode/agents/harness-framework-planner.md",
  ".opencode/agents/harness-framework-reviewer.md"
];
const selfOpencodeBoundaryTerms = [
  "Do not run regular harness init against this framework repository",
  "templates/ and skills/ are product source assets, not self runtime output",
  ".harness-self/ is local runtime sandbox state",
  "self-only rules must not be written into target-project templates"
];
const selfGeneratedMirrorIgnoreLines = [
  ".opencode/commands/harness.md"
];
const selfPolicyStart = "<!-- HARNESS_SELF_POLICY_BEGIN -->";
const selfPolicyEnd = "<!-- HARNESS_SELF_POLICY_END -->";
const selfHelp = `Harness self-dogfooding commands

Usage:
  harness self init [--apply] [--with-opencode]
  harness self doctor
  harness self test
`;

const selfProfileContent = [
  "# Harness Framework Self Profile",
  "",
  "This profile applies only to this framework repository.",
  "",
  "- The root AGENTS.md remains the highest-priority agent entrypoint.",
  "- Do not run regular harness init against this repository as if it were a target project.",
  "- Keep templates/ as product source templates for target projects.",
  "- Keep skills/ as canonical publishable skill source assets.",
  "- Use .harness-self/ only for local runtime state, cache, tmp files, and sandbox runs.",
  "- Use fixtures/ as versioned sandbox inputs for CLI behavior checks.",
  "- Keep self-dogfooding rules out of templates/AGENTS.md and skills/.",
  "",
  "## Commands",
  "",
  "- `harness self init` prints the self profile plan without writing by default.",
  "- `harness self init --apply` creates or updates self profile files and `.gitignore` entries.",
  "- `harness self doctor` checks self-dogfooding safety boundaries.",
  "- `harness self test` copies fixtures into `.harness-self/sandbox-runs/` and runs sandbox smoke checks.",
  "",
  "## Boundaries",
  "",
  "- `.harness/self/` is versioned repository policy for maintaining this framework with its own workflow.",
  "- `.harness-self/` is disposable local runtime state and may be deleted at any time.",
  "- `fixtures/` contains versioned test inputs for target-project CLI behavior.",
  "- `templates/` and `skills/` are publishable source assets; self-only rules do not belong there.",
  ""
].join("\n");

const forbiddenTemplateTerms = [
  "HARNESS_SELF_POLICY",
  ".harness-self",
  "self-dogfooding",
  "self dogfooding",
  "framework self profile"
];

const forbiddenSelfOpencodeOutputHints = [
  "output self opencode to templates",
  "write self opencode to templates",
  "copy self opencode into skills",
  "sync self-only rules into templates/AGENTS.md"
];

const selfOpencodeContents = new Map([
  ["opencode.jsonc", [
    "{",
    "  \"$schema\": \"https://opencode.ai/config.json\",",
    "  \"instructions\": [\"AGENTS.md\", \".harness/self/README.md\"],",
    "  \"plugin\": [\"opencode-tasks\"]",
    "}",
    ""
  ].join("\n")],
  [".opencode/README.md", [
    "# Framework Self OpenCode",
    "",
    "These OpenCode files are for maintaining this harness framework repository itself.",
    "",
    "This directory intentionally contains two kinds of files:",
    "- framework self-only files that may be committed",
    "- generated local runtime mirrors copied from `templates/opencode/**`",
    "",
    "Boundary rules:",
    "- Do not run regular harness init against this framework repository; use `harness self init --apply --with-opencode` for self setup.",
    "- templates/ and skills/ are product source assets, not self runtime output.",
    "- .harness-self/ is local runtime sandbox state and must stay disposable.",
    "- self-only rules must not be written into target-project templates, including `templates/AGENTS.md`.",
    "- Framework private implementation details must not be copied into target-project templates.",
    "",
    "Source of truth:",
    "- Self-only files in `.opencode/agents/harness-framework-*.md` and `.opencode/commands/harness-self-*.md` are maintained for this repository.",
    "- Target-project OpenCode agents and commands still come only from `templates/opencode/**`.",
    "- Mirrored files under `.opencode/agents/harness-*.md`, `.opencode/agents/validators/**`, `.opencode/commands/harness.md`, and `.opencode/commands/harness-*.md` must not be edited directly.",
    "- Edit `templates/opencode/**` instead, then rerun `harness self init --apply --with-opencode`, then run `harness self doctor`.",
    "",
    "Commit policy:",
    "- Commit `opencode.jsonc`.",
    "- Commit `.opencode/README.md`.",
    "- Commit `.opencode/agents/harness-framework-*.md`.",
    "- Commit `.opencode/commands/harness-self-*.md`.",
    "- Do not commit generated mirrors from `templates/opencode/**`.",
    "",
    "Before changing `src/commands`, `src/core`, `templates`, or `skills`, inspect the current boundary and run relevant smoke tests.",
    "",
    "Recommended validation:",
    "- `npm run smoke`",
    "- `npm run self:smoke`",
    ""
  ].join("\n")],
  [".opencode/commands/harness-self-init.md", [
    "---",
    "description: Initialize or refresh framework self-dogfooding files",
    "agent: harness-framework-planner",
    "---",
    "",
    "Run framework self setup for this repository only.",
    "",
    "Use:",
    "- `harness self init --with-opencode` to preview self OpenCode files.",
    "- `harness self init --apply --with-opencode` to write self OpenCode files.",
    "",
    "Do not run regular harness init against this framework repository. templates/ and skills/ are product source assets, not self runtime output. .harness-self/ is local runtime sandbox state. self-only rules must not be written into target-project templates.",
    ""
  ].join("\n")],
  [".opencode/commands/harness-self-review.md", [
    "---",
    "description: Review framework changes for boundary leaks",
    "agent: harness-framework-reviewer",
    "---",
    "",
    "Review the current diff for harness framework maintenance risks.",
    "",
    "Focus on:",
    "- target-project templates staying project-neutral",
    "- self-only rules staying out of `templates/AGENTS.md` and target OpenCode templates",
    "- init/sync/diff/doctor behavior staying safe and reversible",
    "- tests covering template, skill, and self-opencode boundaries",
    "",
    "Do not run regular harness init against this framework repository. templates/ and skills/ are product source assets, not self runtime output. .harness-self/ is local runtime sandbox state. self-only rules must not be written into target-project templates.",
    ""
  ].join("\n")],
  [".opencode/commands/harness-self-test.md", [
    "---",
    "description: Run framework smoke tests",
    "agent: harness-framework-reviewer",
    "---",
    "",
    "Run the regression tests for framework changes.",
    "",
    "Recommended commands:",
    "- `npm run smoke`",
    "- `npm run self:smoke`",
    "",
    "Run these after changing `src/commands`, `src/core`, `templates`, `skills`, sync/init/diff/doctor logic, or self OpenCode files.",
    "",
    "Do not run regular harness init against this framework repository. templates/ and skills/ are product source assets, not self runtime output. .harness-self/ is local runtime sandbox state. self-only rules must not be written into target-project templates.",
    ""
  ].join("\n")],
  [".opencode/agents/harness-framework-planner.md", [
    "---",
    "description: Plans changes to the harness framework repository while preserving target/self boundaries.",
    "model: openai/gpt-5.5",
    "---",
    "",
    "# Harness Framework Planner",
    "",
    "You plan maintenance work for the universal AI harness framework repository.",
    "",
    "Rules:",
    "- Read relevant files before proposing or editing changes.",
    "- Do not run regular harness init against this framework repository.",
    "- templates/ and skills/ are product source assets, not self runtime output.",
    "- .harness-self/ is local runtime sandbox state.",
    "- self-only rules must not be written into target-project templates.",
    "- Do not copy framework-private implementation details into target-project templates.",
    "- Keep changes minimal and update tests when touching init, sync, diff, doctor, templates, or skills.",
    "",
    "Validation to recommend:",
    "- `npm run smoke`",
    "- `npm run self:smoke`",
    ""
  ].join("\n")],
  [".opencode/agents/harness-framework-reviewer.md", [
    "---",
    "description: Reviews harness framework changes for regressions and boundary contamination.",
    "model: opencode-go/glm-5.1",
    "---",
    "",
    "# Harness Framework Reviewer",
    "",
    "Review diffs in this framework repository with findings first.",
    "",
    "Check:",
    "- regular target-project `harness init --with-opencode` remains separate from `harness self init --apply --with-opencode`",
    "- self-only rules are not added to `templates/AGENTS.md`, `templates/opencode`, or `skills/`",
    "- templates/ and skills/ remain product source assets, not self runtime output",
    "- .harness-self/ remains local runtime sandbox state",
    "- managed block markers in `templates/AGENTS.md` are present",
    "- changes to templates, skills, sync/init/diff/doctor logic have smoke coverage",
    "",
    "Do not run regular harness init against this framework repository. self-only rules must not be written into target-project templates.",
    ""
  ].join("\n")]
]);

const selfOnlyOpencodePaths = new Set(selfOpencodeContents.keys());

const sensitivePatterns = [
  { label: "Windows user path", regex: new RegExp(["C:", "Users"].join("\\\\"), "i") },
  { label: "local AI workspace path", regex: new RegExp(["E:", "AI_WORK"].join("\\\\"), "i") },
  { label: "internal URL", regex: /https?:\/\/(localhost|127\.0\.0\.1|[^\s/]*\.(?:corp|internal|local))(?:[/:\s]|$)/i },
  { label: "token-like text", regex: /(?:api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{16,}/i }
];

export async function selfCommand(args) {
  const [subcommand, ...rest] = args;

  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    console.log(selfHelp);
    return;
  }

  if (subcommand === "init") {
    await selfInit(rest);
    return;
  }

  if (subcommand === "doctor") {
    await selfDoctor(rest);
    return;
  }

  if (subcommand === "test") {
    await selfTest(rest);
    return;
  }

  throw new Error(`Unknown self command: ${subcommand}\n\n${selfHelp}`);
}

async function selfInit(args) {
  const options = parseSelfArgs(args, { allowApply: true });
  if (options.help) return;
  const operations = await buildSelfInitOperations(options);

  printSelfPlan(operations, options.apply ? "write" : "dry-run");

  if (!options.apply) {
    console.log("note: use --apply to create or update self profile files");
    return;
  }

  for (const operation of operations) {
    if (operation.action === "create" || operation.action === "update") {
      await writeText(path.join(frameworkRoot, operation.path), operation.content);
    }
  }
}

async function selfDoctor(args) {
  const options = parseSelfArgs(args);
  if (options.help) return;
  const results = [];

  await checkPath("AGENTS.md", "file", "root AGENTS.md exists", results);
  await checkPath(selfProfileRelative, "file", `${selfProfileRelative} exists`, results);
  await checkPath(modelProfilesSourceRelative, "file", `${modelProfilesSourceRelative} exists`, results);
  await checkGitignore(results);
  await checkSelfOpencode(results);
  await checkTemplatesClean(results);
  await checkFixtures(results);
  await checkSmokeEntrypoint(results);
  await checkSensitiveText(results);

  printResults("Harness Self Doctor", results);

  if (results.some((result) => result.level === "FAIL")) {
    process.exitCode = 1;
  }
}

async function selfTest(args) {
  const options = parseSelfArgs(args);
  if (options.help) return;
  const runId = `self-test-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const runRoot = path.join(frameworkRoot, ".harness-self", "sandbox-runs", runId);
  const results = [];

  await fs.mkdir(runRoot, { recursive: true });

  await runTargetEmpty(runRoot, results);
  await runTargetExistingAgents(runRoot, results);
  await runTargetConflictManagedBlock(runRoot, results);
  await runTargetOldManifest(runRoot, results);
  await assertSelfAssetsClean(results);

  printResults("Harness Self Test", results);
  console.log("");
  console.log(`sandbox: ${runRoot}`);

  if (results.some((result) => result.level === "FAIL")) {
    process.exitCode = 1;
  }
}

async function runTargetEmpty(runRoot, results) {
  const project = await copyFixture("target-empty", runRoot);
  const initOutput = await harnessCapture("init", "--project", project, "--auto");
  assertOutputIncludes(initOutput, "write-manifest: .harness/manifest.json", "target-empty init writes manifest", results);
  await checkPathInProject(project, ".harness/manifest.json", "file", "target-empty manifest exists", results);
  await checkPathInProject(project, "AGENTS.md", "file", "target-empty AGENTS.md exists", results);

  const doctorOutput = await harnessCapture("doctor", "--project", project);
  assertOutputIncludes(doctorOutput, "PASS  harness.config.yaml parsed", "target-empty doctor passes config check", results);
}

async function runTargetExistingAgents(runRoot, results) {
  const project = await copyFixture("target-existing-agents", runRoot);
  const before = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");
  await harnessCapture("init", "--project", project, "--auto");
  const after = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

  results.push(after.includes("<!-- harness-kit:start -->") ? pass("target-existing-agents managed block inserted") : fail("target-existing-agents managed block missing"));
  results.push(after.includes(before.trim()) ? pass("target-existing-agents local AGENTS.md content preserved") : fail("target-existing-agents local AGENTS.md content lost"));
  results.push(after.includes("<!-- project-local-imported:start -->") ? pass("target-existing-agents local content imported into local block") : fail("target-existing-agents imported local block missing"));
}

async function runTargetConflictManagedBlock(runRoot, results) {
  const project = await copyFixture("target-conflict-managed-block", runRoot);
  await harnessCapture("init", "--project", project, "--auto");
  const content = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

  results.push(content.includes("This project-local content must be preserved by sync behavior.") ? pass("target-conflict-managed-block local content preserved") : fail("target-conflict-managed-block local content lost"));
  results.push(content.includes("This file is the primary repository-agent instruction entrypoint") ? pass("target-conflict-managed-block managed block updated") : fail("target-conflict-managed-block managed block not updated"));

  const syncDryRunOutput = await harnessCapture("sync", "--project", project, "--dry-run");
  const afterSyncDryRun = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");
  assertOutputIncludes(syncDryRunOutput, "unchanged: AGENTS.md", "target-conflict-managed-block sync dry-run checks AGENTS.md", results);
  results.push(afterSyncDryRun === content ? pass("target-conflict-managed-block sync dry-run preserves AGENTS.md") : fail("target-conflict-managed-block sync dry-run changed AGENTS.md"));
}

async function runTargetOldManifest(runRoot, results) {
  const project = await copyFixture("target-old-manifest", runRoot);
  const diffOutput = await harnessCapture("diff", "--project", project);
  assertOutputIncludes(diffOutput, "missing: AGENTS.md", "target-old-manifest reports missing managed AGENTS.md", results);
}

async function assertSelfAssetsClean(results) {
  const templateContent = await fs.readFile(path.join(frameworkRoot, templatesAgentsRelative), "utf8");
  const contaminated = forbiddenTemplateTerms.filter((term) => templateContent.toLowerCase().includes(term.toLowerCase()));
  results.push(contaminated.length === 0 ? pass("templates/AGENTS.md remains free of self rules") : fail(`templates/AGENTS.md self contamination: ${contaminated.join(", ")}`));

  const gitignoreContent = await fs.readFile(path.join(frameworkRoot, ".gitignore"), "utf8");
  results.push(gitignoreContent.includes(selfRuntimeRelative) ? pass(".harness-self sandbox runs are git-ignored") : fail(".harness-self sandbox runs are not git-ignored"));
}

async function copyFixture(name, runRoot) {
  const source = path.join(frameworkRoot, "fixtures", name);
  const target = path.join(runRoot, name);
  await fs.cp(source, target, { recursive: true });
  return target;
}

async function checkPathInProject(project, relative, expectedType, label, results) {
  const absolute = path.join(project, relative);
  try {
    const stat = await fs.stat(absolute);
    const ok = expectedType === "directory" ? stat.isDirectory() : stat.isFile();
    results.push(ok ? pass(label) : fail(`${label}: ${relative} is not a ${expectedType}`));
  } catch {
    results.push(fail(`${label}: ${relative} missing`));
  }
}

function assertOutputIncludes(output, expected, label, results) {
  results.push(output.includes(expected) ? pass(label) : fail(`${label}: expected output to include ${expected}`));
}

async function buildSelfInitOperations(options = {}) {
  const operations = [];
  const profilePath = path.join(frameworkRoot, selfProfileRelative);
  const profileExists = await exists(profilePath);
  const profileCurrent = profileExists ? await fs.readFile(profilePath, "utf8") : null;
  operations.push({
    path: selfProfileRelative,
    action: textEquals(profileCurrent, selfProfileContent) ? "unchanged" : profileExists ? "update" : "create",
    content: selfProfileContent
  });

  const gitignorePath = path.join(frameworkRoot, ".gitignore");
  const gitignoreCurrent = await readOptional(gitignorePath);
  let gitignoreNext = ensureLine(gitignoreCurrent ?? "", selfRuntimeRelative);
  for (const line of selfGeneratedMirrorIgnoreLines) {
    gitignoreNext = ensureLine(gitignoreNext, line);
  }
  operations.push({
    path: ".gitignore",
    action: textEquals(gitignoreCurrent, gitignoreNext) ? "unchanged" : gitignoreCurrent === null ? "create" : "update",
    content: gitignoreNext
  });

  operations.push({
    path: "AGENTS.md",
    action: "unchanged",
    content: null,
    note: `root AGENTS.md is not rewritten; any future self policy must use ${selfPolicyStart} / ${selfPolicyEnd}`
  });

  const modelProfilesTemplatePath = path.join(frameworkRoot, "templates", modelProfilesSourceRelative);
  const modelProfilesTemplateContent = await fs.readFile(modelProfilesTemplatePath, "utf8");
  const modelProfilesAbsolute = path.join(frameworkRoot, modelProfilesSourceRelative);
  const modelProfilesCurrent = await readOptional(modelProfilesAbsolute);
  operations.push({
    path: modelProfilesSourceRelative,
    action: modelProfilesCurrent === null
      ? "create"
      : textEquals(modelProfilesCurrent, modelProfilesTemplateContent)
        ? "unchanged"
        : "skip-project-local",
    content: modelProfilesTemplateContent,
    note: modelProfilesCurrent !== null && !textEquals(modelProfilesCurrent, modelProfilesTemplateContent)
      ? "preserved local model profile edits"
      : undefined
  });

  if (options.withOpencode) {
    for (const [relative, content] of selfOpencodeContents.entries()) {
      const absolute = path.join(frameworkRoot, relative);
      const current = await readOptional(absolute);
      operations.push({
        path: relative,
        action: textEquals(current, content) ? "unchanged" : current === null ? "create" : "update",
        content
      });
    }

    for (const mirror of await buildSelfOpencodeMirrorEntries()) {
      const absolute = path.join(frameworkRoot, mirror.path);
      const current = await readOptional(absolute);
      operations.push({
        path: mirror.path,
        action: textEquals(current, mirror.content) ? "unchanged" : current === null ? "create" : "update",
        content: mirror.content,
        note: `generated mirror from ${mirror.source}`
      });
    }
  }

  return operations;
}

function printSelfPlan(operations, mode) {
  console.log("Harness Self Init");
  console.log(`repository: ${frameworkRoot}`);
  console.log(`mode: ${mode}`);
  for (const operation of operations) {
    const note = operation.note ? ` (${operation.note})` : "";
    console.log(`${operation.action}: ${operation.path}${note}`);
  }
}

async function checkGitignore(results) {
  const content = await readOptional(path.join(frameworkRoot, ".gitignore"));
  if (content === null) {
    results.push(fail(".gitignore missing"));
    return;
  }
  const ignored = content.split(/\r?\n/).some((line) => line.trim() === selfRuntimeRelative || line.trim() === ".harness-self");
  results.push(ignored ? pass(".harness-self/ is ignored") : fail(".harness-self/ is not ignored by .gitignore"));
  for (const line of selfGeneratedMirrorIgnoreLines) {
    const lineIgnored = content.split(/\r?\n/).some((entry) => entry.trim() === line);
    results.push(lineIgnored ? pass(`${line} is ignored`) : fail(`${line} is not ignored by .gitignore`));
  }
}

async function checkSelfOpencode(results) {
  const hasOpencode = await exists(path.join(frameworkRoot, ".opencode")) || await exists(path.join(frameworkRoot, "opencode.jsonc"));
  if (!hasOpencode) {
    results.push(warn("self OpenCode files not installed"));
    return;
  }

  const contents = [];
  for (const relative of selfOpencodeRequiredFiles) {
    const absolute = path.join(frameworkRoot, relative);
    const content = await readOptional(absolute);
    if (content === null) {
      results.push(fail(`${relative} missing`));
      continue;
    }
    results.push(pass(`${relative} exists`));
    contents.push({ relative, content });
  }

  const combined = contents.map((entry) => entry.content).join("\n").toLowerCase();
  for (const term of selfOpencodeBoundaryTerms) {
    results.push(combined.includes(term.toLowerCase()) ? pass(`self OpenCode boundary rule present: ${term}`) : fail(`self OpenCode boundary rule missing: ${term}`));
  }

  const badPaths = selfOpencodeRequiredFiles.filter((relative) => relative.startsWith("templates/") || relative.startsWith("skills/"));
  results.push(badPaths.length === 0 ? pass("self OpenCode outputs are outside templates/ and skills/") : fail(`self OpenCode outputs target product assets: ${badPaths.join(", ")}`));

  const badHints = forbiddenSelfOpencodeOutputHints.filter((hint) => combined.includes(hint.toLowerCase()));
  results.push(badHints.length === 0 ? pass("self OpenCode files do not redirect output into target templates") : fail(`self OpenCode output boundary hints found: ${badHints.join(", ")}`));

  await checkSelfOpencodeMirrors(results);
}

async function checkSelfOpencodeMirrors(results) {
  let mirrors;
  try {
    mirrors = await buildSelfOpencodeMirrorEntries();
  } catch (error) {
    results.push(fail(error instanceof Error ? error.message : String(error)));
    return;
  }

  for (const mirror of mirrors) {
    const target = path.join(frameworkRoot, mirror.path);
    const current = await readOptional(target);
    if (current === null) {
      results.push(fail(`${mirror.path} missing; mirror drift from ${mirror.source}. Edit templates/opencode/** instead, then rerun harness self init --apply --with-opencode.`));
      continue;
    }
    if (containsUnresolvedModelProfilePlaceholder(current)) {
      results.push(fail(`${mirror.path} still contains unresolved MODEL_PROFILE placeholders. Rerun harness self init --apply --with-opencode after reconciling .harness/model-profiles.yml.`));
      continue;
    }
    if (containsUnresolvedPermissionPlaceholder(current)) {
      results.push(fail(`${mirror.path} still contains unresolved OPENCODE_PERMISSION placeholders. Rerun harness self init --apply --with-opencode.`));
      continue;
    }
    if (!textEquals(current, mirror.content)) {
      results.push(fail(`${mirror.path} drifted from ${mirror.source}. Edit templates/opencode/** instead, then rerun harness self init --apply --with-opencode.`));
      continue;
    }
    results.push(pass(`${mirror.path} matches ${mirror.source}`));
  }
}

async function checkTemplatesClean(results) {
  const content = await readOptional(path.join(frameworkRoot, templatesAgentsRelative));
  if (content === null) {
    results.push(fail(`${templatesAgentsRelative} missing`));
    return;
  }

  const found = forbiddenTemplateTerms.filter((term) => content.toLowerCase().includes(term.toLowerCase()));
  if (found.length > 0) {
    results.push(fail(`${templatesAgentsRelative} contains self-only terms: ${found.join(", ")}`));
    return;
  }
  results.push(pass(`${templatesAgentsRelative} has no self-dogfooding markers`));
}

async function checkFixtures(results) {
  const required = [
    "fixtures/target-empty",
    "fixtures/target-existing-agents/AGENTS.md",
    "fixtures/target-old-manifest/.harness/manifest.json",
    "fixtures/target-conflict-managed-block/AGENTS.md"
  ];

  for (const relative of required) {
    const absolute = path.join(frameworkRoot, relative);
    if (await exists(absolute)) {
      results.push(pass(`${relative} exists`));
    } else {
      results.push(fail(`${relative} missing`));
    }
  }
}

async function checkSmokeEntrypoint(results) {
  if (await exists(path.join(frameworkRoot, "scripts", "self-smoke.mjs"))) {
    results.push(pass("scripts/self-smoke.mjs exists"));
    return;
  }
  if (await exists(path.join(frameworkRoot, "scripts", "smoke.mjs"))) {
    results.push(warn("scripts/self-smoke.mjs missing; falling back to scripts/smoke.mjs"));
    return;
  }
  results.push(fail("no smoke/test script found"));
}

async function checkSensitiveText(results) {
  const scanRoots = ["AGENTS.md", ".harness", "fixtures", "src", "scripts", "README.md", "README.zh-CN.md", "docs", "package.json"];
  const files = [];
  for (const relative of scanRoots) {
    await collectTextFiles(path.join(frameworkRoot, relative), relative, files);
  }

  const matches = [];
  for (const relative of files) {
    const content = await fs.readFile(path.join(frameworkRoot, relative), "utf8");
    for (const pattern of sensitivePatterns) {
      if (pattern.regex.test(content)) {
        matches.push(`${relative}: ${pattern.label}`);
      }
    }
  }

  if (matches.length > 0) {
    results.push(fail(`sensitive text candidates found: ${matches.slice(0, 5).join("; ")}`));
    return;
  }
  results.push(pass(`sensitive text scan passed (${files.length} files checked)`));
}

async function checkPath(relative, expectedType, label, results) {
  const absolute = path.join(frameworkRoot, relative);
  try {
    const stat = await fs.stat(absolute);
    const ok = expectedType === "directory" ? stat.isDirectory() : stat.isFile();
    results.push(ok ? pass(label) : fail(`${relative} is not a ${expectedType}`));
  } catch {
    results.push(fail(`${relative} missing`));
  }
}

async function collectTextFiles(absolute, relative, files) {
  if (!(await exists(absolute)) || shouldSkipScan(relative)) {
    return;
  }
  const stat = await fs.stat(absolute);
  if (stat.isFile()) {
    if (!isBinaryLike(relative)) files.push(toPosix(relative));
    return;
  }
  if (!stat.isDirectory()) {
    return;
  }
  const entries = await fs.readdir(absolute, { withFileTypes: true });
  for (const entry of entries) {
    const childRelative = path.join(relative, entry.name);
    await collectTextFiles(path.join(absolute, entry.name), childRelative, files);
  }
}

function parseSelfArgs(args, { allowApply = false } = {}) {
  const options = { apply: false, withOpencode: false, help: false };
  for (const arg of args) {
    if (arg === "--apply" && allowApply) {
      options.apply = true;
      continue;
    }
    if (arg === "--with-opencode") {
      options.withOpencode = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      console.log(selfHelp);
      options.help = true;
      return options;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

function ensureLine(content, line) {
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n").filter((value, index, array) => index < array.length - 1 || value !== "");
  if (!lines.includes(line)) {
    lines.push(line);
  }
  return `${lines.join("\n")}\n`;
}

async function buildSelfOpencodeMirrorEntries() {
  const entries = [];
  const seenTargets = new Set();
  const modelProfileVariables = buildModelProfileTemplateVariables(await loadCanonicalOrFrameworkModelProfiles(frameworkRoot));
  const permissionPolicy = getOpencodePermissionPolicy("default");
  const renderVariables = {
    ...modelProfileVariables,
    ...permissionPolicy.renderVariables
  };

  for (const root of selfOpencodeMirrorRoots) {
    const sourceRoot = path.join(frameworkRoot, templatesOpencodeRelative, root);
    if (!(await exists(sourceRoot))) {
      continue;
    }

    for (const sourcePath of await collectFilesRecursive(sourceRoot)) {
      const sourceRelative = toPosix(path.relative(path.join(frameworkRoot, templatesOpencodeRelative), sourcePath));
      const targetRelative = toPosix(path.join(".opencode", sourceRelative));

      if (selfOnlyOpencodePaths.has(targetRelative)) {
        throw new Error(`self-opencode path conflict: ${targetRelative} is reserved for self-only files but would also mirror ${toPosix(path.join(templatesOpencodeRelative, sourceRelative))}`);
      }
      if (seenTargets.has(targetRelative)) {
        throw new Error(`self-opencode mirror path conflict: multiple template files map to ${targetRelative}`);
      }

      seenTargets.add(targetRelative);
      const sourceContent = await fs.readFile(sourcePath, "utf8");
      entries.push({
        path: targetRelative,
        source: toPosix(path.join(templatesOpencodeRelative, sourceRelative)),
        content: renderTemplate(sourceContent, renderVariables)
      });
    }
  }

  entries.sort((left, right) => left.path.localeCompare(right.path));
  return entries;
}

async function collectFilesRecursive(rootPath) {
  const files = [];
  const entries = await fs.readdir(rootPath, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFilesRecursive(absolute));
      continue;
    }
    if (entry.isFile()) {
      files.push(absolute);
    }
  }
  return files;
}

function textEquals(left, right) {
  return left !== null && left.replace(/\r\n/g, "\n") === right.replace(/\r\n/g, "\n");
}

function containsUnresolvedModelProfilePlaceholder(content) {
  return /\{\{MODEL_PROFILE_[A-Z_]+\}\}/.test(content);
}

function containsUnresolvedPermissionPlaceholder(content) {
  return /\{\{OPENCODE_PERMISSION_[A-Z_]+\}\}/.test(content);
}

async function readOptional(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeText(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function shouldSkipScan(relative) {
  const normalized = toPosix(relative);
  return normalized === "scripts/smoke.mjs" || normalized.startsWith("docs/blogs/") || normalized.includes("/node_modules/") || normalized.startsWith(".harness-self/");
}

function isBinaryLike(relative) {
  return new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".zip", ".gz", ".jar", ".class"]).has(path.extname(relative).toLowerCase());
}

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function pass(message) {
  return { level: "PASS", message };
}

function warn(message) {
  return { level: "WARN", message };
}

function fail(message) {
  return { level: "FAIL", message };
}

function printResults(title, results) {
  console.log(title);
  console.log("");
  for (const result of results) {
    console.log(`${result.level.padEnd(5)} ${result.message}`);
  }
}

async function harnessCapture(...args) {
  const [command, ...rest] = args;
  if (command === "init") {
    return captureCommand(() => initCommand(rest));
  }
  if (command === "diff") {
    return captureCommand(() => diffCommand(rest));
  }
  if (command === "sync") {
    return captureCommand(() => syncCommand(rest));
  }
  if (command === "doctor") {
    return captureCommand(() => doctorCommand(rest));
  }
  throw new Error(`Unsupported self test harness command: ${command}`);
}

async function captureCommand(callback) {
  const originalLog = console.log;
  const originalExitCode = process.exitCode;
  const lines = [];
  process.exitCode = undefined;
  console.log = (...values) => {
    lines.push(values.join(" "));
  };
  try {
    await callback();
    if (process.exitCode) {
      throw new Error(`Command failed with exitCode=${process.exitCode}\nstdout:\n${lines.join("\n")}`);
    }
    return `${lines.join("\n")}\n`;
  } finally {
    console.log = originalLog;
    process.exitCode = originalExitCode;
  }
}
