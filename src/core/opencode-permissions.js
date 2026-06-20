import { normalizeOpencodePermissionMode } from "./manifest.js";

const dangerousCommandBaselineWarning = [
  "Dangerous command baseline: treat destructive shell actions as high-risk even when OpenCode permission schema cannot match them directly.",
  "Require explicit user confirmation before force-push, history rewrite, destructive delete/overwrite, publish/release/deploy, project-external writes, global tool or git config mutation, or risky shell pipes/chains that can hide side effects.",
  "When schema-level command filters cannot express a risky pattern, enforce the baseline through prompt text, reviewer guidance, and operator warnings instead of silently broadening autonomy."
].join(" ");

const schemaLimitationWarning = "OpenCode agent permission schema is tool-level, not command-pattern-level, so dangerous bash subcommands and shell compositions must still be constrained by prompt instructions and review guidance.";

const permissionModeWarnings = {
  default: "Default mode preserves the current per-agent OpenCode permission behavior.",
  moderate: "Moderate mode reduces routine prompt friction where the schema supports it, while keeping dangerous-command expectations explicit.",
  loose: "Loose mode is the broadest supported per-agent policy and must retain visible risk warnings because schema-level dangerous-command matching remains limited."
};

const permissionPolicies = {
  default: {
    "marionettist-builder": {
      edit: "allow",
      bash: "allow",
      webfetch: "allow",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow",
        "marionettist-planner": "allow",
        "marionettist-critic": "allow",
        "marionettist-coder": "allow",
        "marionettist-reviewer": "allow",
        "marionettist-validator": "allow"
      }
    },
    "marionettist-planner": {
      edit: "allow",
      bash: "allow",
      webfetch: "ask",
      task: "deny"
    },
    "marionettist-coder": {
      edit: "allow",
      bash: "allow",
      webfetch: "ask",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow",
        "marionettist-validator": "allow"
      }
    },
    "marionettist-reviewer": {
      edit: "deny",
      bash: "allow",
      webfetch: "ask",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow",
        "marionettist-validator": "allow"
      }
    },
    "marionettist-critic": {
      edit: "deny",
      bash: "allow",
      webfetch: "ask",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow",
        "marionettist-validator": "allow"
      }
    },
    "marionettist-indexer": {
      edit: "deny",
      bash: "allow",
      webfetch: "ask",
      task: "deny"
    },
    "marionettist-validator": {
      edit: "deny",
      bash: "allow",
      webfetch: "deny",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow"
      }
    }
  },
  moderate: {
    "marionettist-builder": {
      edit: "allow",
      bash: "allow",
      webfetch: "allow",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow",
        "marionettist-planner": "allow",
        "marionettist-critic": "allow",
        "marionettist-coder": "allow",
        "marionettist-reviewer": "allow",
        "marionettist-validator": "allow"
      }
    },
    "marionettist-planner": {
      edit: "allow",
      bash: "allow",
      webfetch: "allow",
      task: "deny"
    },
    "marionettist-coder": {
      edit: "allow",
      bash: "allow",
      webfetch: "allow",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow",
        "marionettist-validator": "allow"
      }
    },
    "marionettist-reviewer": {
      edit: "deny",
      bash: "allow",
      webfetch: "allow",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow",
        "marionettist-validator": "allow"
      }
    },
    "marionettist-critic": {
      edit: "deny",
      bash: "allow",
      webfetch: "allow",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow",
        "marionettist-validator": "allow"
      }
    },
    "marionettist-indexer": {
      edit: "deny",
      bash: "allow",
      webfetch: "allow",
      task: "deny"
    },
    "marionettist-validator": {
      edit: "deny",
      bash: "allow",
      webfetch: "deny",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow"
      }
    }
  },
  loose: {
    "marionettist-builder": {
      edit: "allow",
      bash: "allow",
      webfetch: "allow",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow",
        "marionettist-planner": "allow",
        "marionettist-critic": "allow",
        "marionettist-coder": "allow",
        "marionettist-reviewer": "allow",
        "marionettist-validator": "allow"
      }
    },
    "marionettist-planner": {
      edit: "allow",
      bash: "allow",
      webfetch: "allow",
      task: "deny"
    },
    "marionettist-coder": {
      edit: "allow",
      bash: "allow",
      webfetch: "allow",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow",
        "marionettist-validator": "allow"
      }
    },
    "marionettist-reviewer": {
      edit: "deny",
      bash: "allow",
      webfetch: "allow",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow",
        "marionettist-validator": "allow"
      }
    },
    "marionettist-critic": {
      edit: "deny",
      bash: "allow",
      webfetch: "allow",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow",
        "marionettist-validator": "allow"
      }
    },
    "marionettist-indexer": {
      edit: "deny",
      bash: "allow",
      webfetch: "allow",
      task: "deny"
    },
    "marionettist-validator": {
      edit: "deny",
      bash: "allow",
      webfetch: "ask",
      task: {
        "*": "deny",
        "marionettist-indexer": "allow"
      }
    }
  }
};

const renderVariableNames = new Map([
  ["marionettist-builder", "opencodePermissionBlockHarnessBuilder"],
  ["marionettist-planner", "opencodePermissionBlockHarnessPlanner"],
  ["marionettist-coder", "opencodePermissionBlockHarnessCoder"],
  ["marionettist-reviewer", "opencodePermissionBlockHarnessReviewer"],
  ["marionettist-critic", "opencodePermissionBlockHarnessCritic"],
  ["marionettist-indexer", "opencodePermissionBlockHarnessIndexer"],
  ["marionettist-validator", "opencodePermissionBlockHarnessValidator"]
]);

export const opencodePermissionPolicyModes = Object.freeze(Object.keys(permissionPolicies));

export function getOpencodePermissionPolicy(permissionMode = "default") {
  const mode = normalizeOpencodePermissionMode(permissionMode, "OpenCode permission mode");
  const policy = permissionPolicies[mode];
  const agents = {};

  for (const agentName of Object.keys(policy)) {
    const permission = policy[agentName];
    agents[agentName] = {
      permission,
      renderedBlock: renderPermissionBlock(permission)
    };
  }

  return {
    mode,
    agents,
    warnings: buildPermissionWarnings(mode),
    renderVariables: buildPermissionRenderVariables(mode, agents)
  };
}

function buildPermissionWarnings(mode) {
  return {
    modeSummary: permissionModeWarnings[mode],
    dangerousCommandBaseline: dangerousCommandBaselineWarning,
    schemaLimitation: schemaLimitationWarning
  };
}

function buildPermissionRenderVariables(mode, agents) {
  const warnings = buildPermissionWarnings(mode);
  const markdownWarnings = [
    `- ${warnings.modeSummary}`,
    `- ${warnings.dangerousCommandBaseline}`,
    `- ${warnings.schemaLimitation}`
  ].join("\n");
  const variables = {
    opencodePermissionMode: mode,
    opencodePermissionModeWarning: warnings.modeSummary,
    opencodePermissionDangerousCommandWarning: warnings.dangerousCommandBaseline,
    opencodePermissionSchemaLimitationWarning: warnings.schemaLimitation,
    opencodePermissionWarningsMarkdown: markdownWarnings
  };

  for (const [agentName, variableName] of renderVariableNames.entries()) {
    variables[variableName] = agents[agentName].renderedBlock;
  }

  return variables;
}

function renderPermissionBlock(permission) {
  return [
    "permission:",
    `  edit: ${permission.edit}`,
    `  bash: ${permission.bash}`,
    `  webfetch: ${permission.webfetch}`,
    ...renderTaskPermission(permission.task)
  ].join("\n");
}

function renderTaskPermission(taskPermission) {
  if (typeof taskPermission === "string") {
    return [`  task: ${taskPermission}`];
  }

  const lines = ["  task:"];
  for (const [agentName, access] of Object.entries(taskPermission)) {
    lines.push(`    ${JSON.stringify(agentName)}: ${access}`);
  }
  return lines;
}
