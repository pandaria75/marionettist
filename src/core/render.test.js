import test from "node:test";
import assert from "node:assert/strict";
import { sha256 } from "./hash.js";
import { buildRenderInputHash, buildRenderInputHashSource, renderWithMetadata, stableJsonStringify } from "./render.js";

test("renderWithMetadata preserves current placeholder substitution behavior", () => {
  const result = renderWithMetadata({
    templateContent: "Hello {{PROJECT_NAME}} / {{EMPTY_VALUE}}",
    variables: {
      projectName: "Framework",
      emptyValue: ""
    }
  });

  assert.equal(result.content, "Hello Framework / unknown");
  assert.equal(result.templateHash, sha256("Hello {{PROJECT_NAME}} / {{EMPTY_VALUE}}"));
  assert.equal(result.renderedHash, sha256("Hello Framework / unknown"));
});

test("renderWithMetadata preserves numeric zero placeholder values", () => {
  const result = renderWithMetadata({
    templateContent: "temperature={{TEMPERATURE}}",
    variables: {
      temperature: 0
    }
  });

  assert.equal(result.content, "temperature=0");
});

test("renderInputHash is based on stable render inputs, not template bytes", () => {
  const first = renderWithMetadata({
    templateContent: "A {{PROJECT_NAME}}",
    variables: { projectName: "Framework" },
    renderContext: { selection: ["advanced", undefined], nested: { beta: 2, alpha: 1 } },
    renderOptions: { mode: "sync" }
  });
  const second = renderWithMetadata({
    templateContent: "B {{PROJECT_NAME}}",
    variables: { projectName: "Framework" },
    renderContext: { nested: { alpha: 1, beta: 2 }, selection: ["advanced", undefined] },
    renderOptions: { mode: "sync" }
  });

  assert.notEqual(first.templateHash, second.templateHash);
  assert.equal(first.renderInputHash, second.renderInputHash);
  assert.equal(
    buildRenderInputHashSource({
      variables: { projectName: "Framework" },
      renderContext: { nested: { beta: 2, alpha: 1 }, selection: ["advanced", undefined] },
      renderOptions: { mode: "sync" }
    }),
    '{"renderContext":{"nested":{"alpha":1,"beta":2},"selection":["advanced",null]},"renderOptions":{"mode":"sync"},"variables":{"projectName":"Framework"}}'
  );
});

test("postRender can change final content while render input hash stays caller-owned", () => {
  const result = renderWithMetadata({
    templateContent: "name={{PROJECT_NAME}}",
    variables: { projectName: "Framework" },
    renderContext: { appendMode: "doc" },
    renderOptions: { finalization: "append" },
    postRender: ({ content, renderContext }) => `${content}\nmode=${renderContext.appendMode}`
  });

  assert.equal(result.content, "name=Framework\nmode=doc");
  assert.equal(result.renderedHash, sha256("name=Framework\nmode=doc"));
  assert.equal(
    result.renderInputHash,
    buildRenderInputHash({
      variables: { projectName: "Framework" },
      renderContext: { appendMode: "doc" },
      renderOptions: { finalization: "append" }
    })
  );
});

test("renderWithMetadata throws when templateContent is not a string", () => {
  assert.throws(
    () => renderWithMetadata({ templateContent: { not: "a string" } }),
    {
      name: "TypeError",
      message: "renderWithMetadata() requires templateContent to be a string"
    }
  );
});

test("renderWithMetadata throws when postRender returns a non-string", () => {
  assert.throws(
    () => renderWithMetadata({
      templateContent: "Hello {{PROJECT_NAME}}",
      variables: { projectName: "Framework" },
      postRender: () => ({ invalid: true })
    }),
    {
      name: "TypeError",
      message: "renderWithMetadata() postRender must return a string"
    }
  );
});

test("stableJsonStringify normalizes Date, bigint, symbol/function omission, and nested undefined", () => {
  const stableDate = new Date("2026-06-15T00:00:00.000Z");
  const arraySymbol = Symbol("array-symbol");

  assert.equal(
    stableJsonStringify({
      nested: {
        keep: "value",
        omitUndefined: undefined,
        omitFunction: () => "ignored",
        omitSymbol: Symbol("object-symbol")
      },
      array: [undefined, () => "ignored", arraySymbol, stableDate, 7n],
      when: stableDate,
      count: 7n
    }),
    '{"array":[null,null,null,"2026-06-15T00:00:00.000Z","7"],"count":"7","nested":{"keep":"value"},"when":"2026-06-15T00:00:00.000Z"}'
  );
});
