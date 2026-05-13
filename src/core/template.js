export function renderTemplate(content, variables) {
  return Object.entries(variables).reduce((acc, [key, value]) => {
    const placeholder = `{{${key.replace(/([A-Z])/g, "_$1").toUpperCase()}}}`;
    return acc.replaceAll(placeholder, value || "unknown");
  }, content);
}
