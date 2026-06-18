import { readFile } from "node:fs/promises";

const prototypeSkillPath = ".opencode/pathway-skills";

const agentDefinitions = [
  {
    name: "harness-pathway-prototype",
    description: "Repository-local OpenCode pathway prototype agent installed through the harness plugin seam.",
    file: "../pathway/agents/harness-pathway-prototype.md"
  }
];

const commandDefinitions = [
  {
    name: "harness-pathway-prototype",
    description: "Repository-local OpenCode pathway prototype command installed through the harness plugin seam.",
    file: "../pathway/commands/harness-pathway-prototype.md"
  },
  {
    name: "harness-pathway-config",
    description: "Pathway-scoped OpenCode or harness config drafting command with preview-first confirmation.",
    file: "../pathway/commands/harness-pathway-config.md"
  }
];

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export default async function opencodeTasksPathwayPlugin() {
  const [agentPrompts, commandPrompts] = await Promise.all([
    Promise.all(
      agentDefinitions.map(async (definition) => [
        definition.name,
        await readFile(new URL(definition.file, import.meta.url), "utf8")
      ])
    ),
    Promise.all(
      commandDefinitions.map(async (definition) => [
        definition.name,
        await readFile(new URL(definition.file, import.meta.url), "utf8")
      ])
    )
  ]);

  const agentPromptMap = new Map(agentPrompts);
  const commandPromptMap = new Map(commandPrompts);

  return {
    config: (cfg) => {
      cfg.agent = isRecord(cfg.agent) ? cfg.agent : {};
      cfg.command = isRecord(cfg.command) ? cfg.command : {};
      cfg.skills = isRecord(cfg.skills) ? cfg.skills : {};

      for (const definition of agentDefinitions) {
        cfg.agent[definition.name] ??= {
          mode: "subagent",
          description: definition.description,
          prompt: agentPromptMap.get(definition.name)?.trim()
        };
      }

      for (const definition of commandDefinitions) {
        cfg.command[definition.name] ??= {
          description: definition.description,
          template: commandPromptMap.get(definition.name)?.trim()
        };
      }

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
