const startMarker = "<!-- harness-kit:start -->";
const endMarker = "<!-- harness-kit:end -->";

export function hasManagedBlock(content) {
  return content.includes(startMarker) && content.includes(endMarker);
}

export function extractManagedBlock(content) {
  if (!hasManagedBlock(content)) {
    return null;
  }

  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker) + endMarker.length;
  return content.slice(start, end);
}

export function replaceManagedBlock(existingContent, templateContent) {
  if (!hasManagedBlock(templateContent)) {
    throw new Error("Template is missing harness managed block markers");
  }

  if (!hasManagedBlock(existingContent)) {
    return `${templateContent.trimEnd()}

<!-- project-local-imported:start -->

${existingContent.trimEnd()}

<!-- project-local-imported:end -->
`;
  }

  const templateStart = templateContent.indexOf(startMarker);
  const templateEnd = templateContent.indexOf(endMarker) + endMarker.length;
  const replacement = templateContent.slice(templateStart, templateEnd);

  const existingStart = existingContent.indexOf(startMarker);
  const existingEnd = existingContent.indexOf(endMarker) + endMarker.length;

  return `${existingContent.slice(0, existingStart)}${replacement}${existingContent.slice(existingEnd)}`;
}
