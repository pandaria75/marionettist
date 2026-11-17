import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const targetRoot = path.join(repoRoot, "templates", "pathways", "cursor");
const skillsRoot = path.join(repoRoot, "skills");
const rulesRoot = path.join(repoRoot, "templates", "rules");
const opencodeAgentsRoot = path.join(repoRoot, "templates", "pathways", "opencode", "agents");
const opencodeCommandsRoot = path.join(repoRoot, "templates", "pathways", "opencode", "commands");

const agentNames = [
  "marionettist-builder",
  "marionettist-planner",
  "marionettist-coder",
  "marionettist-reviewer",
  "marionettist-critic",
  "marionettist-validator",
  "marionettist-indexer"
];

const ruleDescriptions = {
  "00-repository-rules.md": "Repository-level constraint priority and rule metadata conventions for Marionettist agents.",
  "workflow-rules.md": "Marionettist workflow gates, context-pack expectations, and documentation update rules."
};

await fs.rm(targetRoot, { recursive: true, force: true });
await fs.mkdir(path.join(targetRoot, ".cursor-plugin"), { recursive: true });

await writeText(path.join(targetRoot, ".cursor-plugin", "plugin.json"), `${JSON.stringify({
  name: "marionettist-pathway-cursor",
  version: "0.3.5",
  description: "Cursor Pathway plugin surface for Marionettist skills, rules, agents, and commands.",
  author: { name: "Marionettist" },
  keywords: ["marionettist", "pathway", "skills", "rules", "agents", "commands"]
}, null, 2)}\n`);

await writeText(path.join(targetRoot, "README.md"), `# Marionettist Cursor Pathway

This pathway packages Marionettist skills, rules, agents, and commands for Cursor.

## Install options

### Plugin-first (recommended)

Add this repository as a Cursor marketplace source, then install \`marionettist-pathway-cursor\`.

The staged package lives in \`distributions/cursor/\`. The source of truth is \`templates/pathways/cursor/\`.

### Local fallback via CLI

In a target project:

\`\`\`bash
marionettist init --with-cursor
\`\`\`

This writes managed local files under \`.cursor/skills\`, \`.cursor/rules\`, \`.cursor/agents\`, and \`.cursor/commands\`.

Use \`marionettist sync --with-cursor\` to refresh managed Cursor assets while preserving project-local files outside the managed set.

## Boundaries

- Keep pathway content project-neutral.
- Do not put framework self-only rules into this pathway.
- Edit \`templates/pathways/cursor/**\`, then run \`npm run cursor:dist\`.
`);

for (const skillName of await fs.readdir(skillsRoot)) {
  const skillPath = path.join(skillsRoot, skillName, "SKILL.md");
  try {
    const content = await fs.readFile(skillPath, "utf8");
    await writeText(path.join(targetRoot, "skills", skillName, "SKILL.md"), content);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

for (const fileName of await fs.readdir(rulesRoot)) {
  if (!fileName.endsWith(".md")) continue;
  const body = (await fs.readFile(path.join(rulesRoot, fileName), "utf8")).trimEnd();
  const description = ruleDescriptions[fileName] ?? `Marionettist rule file derived from ${fileName}.`;
  const mdcName = fileName.replace(/\.md$/u, ".mdc");
  await writeText(path.join(targetRoot, "rules", mdcName), [
    "---",
    `description: ${description}`,
    "alwaysApply: true",
    "---",
    "",
    body,
    ""
  ].join("\n"));
}

for (const agentName of agentNames) {
  const source = await fs.readFile(path.join(opencodeAgentsRoot, `${agentName}.md`), "utf8");
  await writeText(path.join(targetRoot, "agents", `${agentName}.md`), adaptAgent(agentName, source));
}

for (const fileName of await fs.readdir(opencodeCommandsRoot)) {
  if (!fileName.endsWith(".md") || !fileName.startsWith("marionettist")) continue;
  const source = await fs.readFile(path.join(opencodeCommandsRoot, fileName), "utf8");
  await writeText(path.join(targetRoot, "commands", fileName), adaptCommand(fileName, source));
}

console.log(`Scaffolded Cursor pathway source at ${path.relative(repoRoot, targetRoot)}`);

function adaptAgent(agentName, source) {
  const { frontmatter, body } = splitFrontmatter(source);
  const description = frontmatter.description
    ?? `Marionettist ${agentName.replace(/^marionettist-/u, "")} agent for Cursor.`;
  const cleanedBody = body
    .split(/\r?\n/u)
    .filter((line) => !line.includes("{{OPENCODE_"))
    .filter((line) => !/^Your model field is rendered from/u.test(line))
    .filter((line) => !/^OpenCode permission policy notes/u.test(line))
    .map((line) => line
      .replaceAll("OpenCode permission policy", "tool-permission policy")
      .replaceAll("`opencode.permissionMode`", "host tool-permission settings")
      .replaceAll("local Marionettist OpenCode configuration", "local Marionettist host configuration")
      .replaceAll("`.opencode/README.md`, `.opencode/commands/`, and `.opencode/agents/`", "`.cursor/commands/` and `.cursor/agents/` when present, plus `AGENTS.md`")
      .replaceAll("local OpenCode config inspection command", "local host config inspection")
      .replaceAll("OpenCode", "Cursor"))
    .join("\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();

  return [
    "---",
    `name: ${agentName}`,
    `description: ${description}`,
    "---",
    "",
    cleanedBody,
    ""
  ].join("\n");
}

function adaptCommand(fileName, source) {
  const commandName = fileName.replace(/\.md$/u, "");
  const { frontmatter, body } = splitFrontmatter(source);
  const description = frontmatter.description ?? `Marionettist command: ${commandName}`;
  const cleanedBody = body
    .replaceAll("$ARGUMENTS", "<user-request>")
    .replaceAll("OpenCode permissions", "host tool permissions")
    .replaceAll("`opencode.permissionMode`", "host tool-permission settings")
    .replaceAll("OpenCode", "Cursor")
    .trim();

  return [
    "---",
    `name: ${commandName}`,
    `description: ${description}`,
    "---",
    "",
    cleanedBody,
    ""
  ].join("\n");
}

function splitFrontmatter(source) {
  if (!source.startsWith("---\n") && !source.startsWith("---\r\n")) {
    return { frontmatter: {}, body: source };
  }
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/u);
  if (!match) {
    return { frontmatter: {}, body: source };
  }
  const frontmatter = {};
  for (const line of match[1].split(/\r?\n/u)) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key.startsWith("{{")) {
      frontmatter[key] = value;
    }
  }
  return { frontmatter, body: match[2] };
}

async function writeText(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}
