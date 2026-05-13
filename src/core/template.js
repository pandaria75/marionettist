export function renderTemplate(content, variables) {
  return content.replaceAll("{{PROJECT_NAME}}", variables.projectName);
}
