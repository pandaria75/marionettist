import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

export const frameworkRoot = path.resolve(currentDir, "../..");
export const templatesRoot = path.join(frameworkRoot, "templates");
export const opencodeTemplatesRoot = path.join(templatesRoot, "opencode");
export const skillsRoot = path.join(frameworkRoot, "skills");
export const versionFile = path.join(frameworkRoot, "VERSION");
