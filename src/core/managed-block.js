const startMarker = "<!-- marionettist-kit:start -->";
const endMarker = "<!-- marionettist-kit:end -->";

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

export function previewManagedBlockCleanup(content) {
  const removableContent = extractManagedBlock(content);

  if (!removableContent) {
    const preservedContent = trimPreviewContent(content);
    return {
      hasManagedBlock: false,
      removableContent: null,
      removableLineCount: 0,
      preservedContent,
      preservedLineCount: countPreviewLines(preservedContent),
      hasProjectLocalContent: preservedContent.length > 0,
      managedBlockOnly: false
    };
  }

  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker) + endMarker.length;
  const preservedContent = trimPreviewContent(`${content.slice(0, start)}\n\n${content.slice(end)}`);

  return {
    hasManagedBlock: true,
    removableContent,
    removableLineCount: countPreviewLines(removableContent),
    preservedContent,
    preservedLineCount: countPreviewLines(preservedContent),
    hasProjectLocalContent: preservedContent.length > 0,
    managedBlockOnly: preservedContent.length === 0
  };
}

export function replaceManagedBlock(existingContent, templateContent) {
  if (!hasManagedBlock(templateContent)) {
    throw new Error("Template is missing marionettist managed block markers");
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

function trimPreviewContent(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function countPreviewLines(content) {
  if (!content) {
    return 0;
  }

  return content.split(/\r?\n/).length;
}
