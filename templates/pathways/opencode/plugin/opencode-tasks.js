import { readFile } from "node:fs/promises";

const prototypeAgentName = "harness-pathway-prototype";
const prototypeCommandName = "harness-pathway-prototype";
const prototypeSkillPath = ".opencode/pathway-skills";

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export default async function opencodeTasksPathwayPlugin() {
  const [agentPrompt, commandPrompt] = await Promise.all([
    readFile(new URL("../pathway/agents/harness-pathway-prototype.md", import.meta.url), "utf8"),
    readFile(new URL("../pathway/commands/harness-pathway-prototype.md", import.meta.url), "utf8")
  ]);

  return {
    config: (cfg) => {
      cfg.agent = isRecord(cfg.agent) ? cfg.agent : {};
      cfg.command = isRecord(cfg.command) ? cfg.command : {};
      cfg.skills = isRecord(cfg.skills) ? cfg.skills : {};

      cfg.agent[prototypeAgentName] ??= {
        mode: "subagent",
        description: "Repository-local OpenCode pathway prototype agent installed through the harness plugin seam.",
        prompt: agentPrompt.trim()
      };

      cfg.command[prototypeCommandName] ??= {
        description: "Repository-local OpenCode pathway prototype command installed through the harness plugin seam.",
        template: commandPrompt.trim()
      };

      const skillPaths = Array.isArray(cfg.skills.paths)
        ? [...cfg.skills.paths]
        : [];

      if (!skillPaths.includes(prototypeSkillPath)) {
        skillPaths.push(prototypeSkillPath);
      }

      cfg.skills.paths = skillPaths;
    }
  };
}
