export function parseSimpleYaml(content, options = {}) {
  const { validateIndentation = false } = options;
  const root = {};
  const stack = [{ indent: -1, value: root }];
  const lines = content.split(/\r?\n/u);

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) {
      continue;
    }

    const indent = rawLine.match(/^ */u)?.[0].length ?? 0;
    if (validateIndentation && indent % 2 !== 0) {
      throw new Error(`line ${index + 1}: indentation must use two-space levels`);
    }

    const line = rawLine.trim();
    while (stack.length > 1 && indent <= stack.at(-1).indent) {
      stack.pop();
    }

    const parent = stack.at(-1).value;

    if (line.startsWith("- ")) {
      if (!Array.isArray(parent)) {
        throw new Error(`line ${index + 1}: list item has no list parent`);
      }
      parent.push(parseYamlScalar(line.slice(2).trim()));
      continue;
    }

    const separator = line.indexOf(":");
    if (separator === -1) {
      throw new Error(`line ${index + 1}: expected key-value pair`);
    }

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    if (!key) {
      throw new Error(`line ${index + 1}: empty key`);
    }

    if (rawValue === "") {
      const nextMeaningful = nextMeaningfulLine(lines, index + 1);
      const value = nextMeaningful?.trim().startsWith("- ") ? [] : {};
      parent[key] = value;
      stack.push({ indent, value });
      continue;
    }

    parent[key] = parseYamlScalar(rawValue);
  }

  return root;
}

function nextMeaningfulLine(lines, start) {
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() && !line.trimStart().startsWith("#")) {
      return line;
    }
  }
  return null;
}

function parseYamlScalar(rawValue) {
  const value = stripYamlInlineComment(rawValue).trim();

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  return value;
}

function stripYamlInlineComment(value) {
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let index = 0; index < value.length; index += 1) {
    const current = value[index];

    if (current === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (current === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (current === "#" && !inSingleQuote && !inDoubleQuote) {
      return value.slice(0, index);
    }
  }

  return value;
}
