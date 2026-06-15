import { sha256 } from "./hash.js";
import { renderTemplate } from "./template.js";

export function renderWithMetadata({
  templateContent,
  variables = {},
  renderContext = null,
  renderOptions = null,
  postRender = null
} = {}) {
  if (typeof templateContent !== "string") {
    throw new TypeError("renderWithMetadata() requires templateContent to be a string");
  }

  const resolvedVariables = variables ?? {};
  const initialContent = renderTemplate(templateContent, resolvedVariables);
  const content = applyPostRender(initialContent, {
    templateContent,
    variables: resolvedVariables,
    renderContext,
    renderOptions,
    postRender
  });

  return {
    content,
    templateHash: sha256(templateContent),
    renderedHash: sha256(content),
    renderInputHash: buildRenderInputHash({
      variables: resolvedVariables,
      renderContext,
      renderOptions
    })
  };
}

export function buildRenderInputHash({
  variables = {},
  renderContext = null,
  renderOptions = null
} = {}) {
  return sha256(buildRenderInputHashSource({ variables, renderContext, renderOptions }));
}

export function buildRenderInputHashSource({
  variables = {},
  renderContext = null,
  renderOptions = null
} = {}) {
  return stableJsonStringify({
    variables: variables ?? {},
    renderContext: renderContext ?? null,
    renderOptions: renderOptions ?? null
  });
}

export function stableJsonStringify(value) {
  return JSON.stringify(normalizeStableJsonValue(value));
}

function applyPostRender(content, context) {
  if (!context.postRender) {
    return content;
  }

  const renderedContent = context.postRender({
    content,
    templateContent: context.templateContent,
    variables: context.variables,
    renderContext: context.renderContext,
    renderOptions: context.renderOptions
  });

  if (typeof renderedContent !== "string") {
    throw new TypeError("renderWithMetadata() postRender must return a string");
  }

  return renderedContent;
}

function normalizeStableJsonValue(value) {
  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => {
      const normalizedEntry = normalizeStableJsonValue(entry);
      return normalizedEntry === undefined ? null : normalizedEntry;
    });
  }

  if (value instanceof Date) {
    return value.toJSON();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "undefined" || typeof value === "function" || typeof value === "symbol") {
    return undefined;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, entryValue]) => [key, normalizeStableJsonValue(entryValue)])
      .filter(([, entryValue]) => entryValue !== undefined);

    return Object.fromEntries(entries);
  }

  return String(value);
}
