import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyCursorAgentModelFrontmatter } from "../src/core/model-profiles.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const agentsRoot = path.join(repoRoot, "templates", "pathways", "cursor", "agents");
const models = {
  "marionettist-builder.md": "grok-4.7-high",
  "marionettist-planner.md": "grok-4.7-high",
  "marionettist-coder.md": "grok-4.7-high",
  "marionettist-reviewer.md": "claude-opus-5-5",
  "marionettist-critic.md": "claude-opus-5-5",
  "marionettist-validator.md": "composer-2.5-fast",
  "marionettist-indexer.md": "composer-2.5-fast"
};

for (const [fileName, model] of Object.entries(models)) {
  const filePath = path.join(agentsRoot, fileName);
  const current = await fs.readFile(filePath, "utf8");
  const next = applyCursorAgentModelFrontmatter(current, model);
  await fs.writeFile(filePath, next, "utf8");
  console.log(`${fileName} -> ${model}`);
}
