import test from "node:test";
import assert from "node:assert/strict";
import { getMarionettistLanguageGuideText, promptConfig } from "./init-prompts.js";

test("promptConfig skips marionettist language selection when existing config value is present", async () => {
  let selectCalls = 0;

  const result = await promptConfig("demo", {
    projectType: "node",
    architecture: "monolith",
    primaryLanguage: "javascript",
    knowledgeMode: "standard",
    knowledgeMaturity: "L1",
    marionettistLanguage: "zh-CN",
    skipKnowledgeModePrompt: true,
    skipKnowledgeMaturityPrompt: true,
    skipMarionettistLanguagePrompt: true
  }, {
    input: async ({ default: defaultValue }) => defaultValue,
    select: async () => {
      selectCalls += 1;
      throw new Error("select should not be called");
    }
  });

  assert.equal(selectCalls, 0);
  assert.equal(result.marionettistLanguage, "zh-CN");
  assert.equal(result.marionettistLanguageWasSelected, false);
});

test("promptConfig offers only en and zh-CN for new marionettist language selection", async () => {
  const selectCalls = [];

  const result = await promptConfig("demo", {
    projectType: "node",
    architecture: "monolith",
    primaryLanguage: "javascript",
    knowledgeMode: "standard",
    knowledgeMaturity: "L1",
    skipKnowledgeModePrompt: true,
    skipKnowledgeMaturityPrompt: true,
    skipMarionettistLanguagePrompt: false
  }, {
    input: async ({ default: defaultValue }) => defaultValue,
    select: async (config) => {
      selectCalls.push(config);
      return "zh-CN";
    }
  });

  assert.equal(selectCalls.length, 1);
  assert.equal(selectCalls[0].message, "Marionettist Language:");
  assert.deepEqual(selectCalls[0].choices.map((choice) => choice.value), ["en", "zh-CN"]);
  assert.equal(result.marionettistLanguage, "zh-CN");
  assert.equal(result.marionettistLanguageWasSelected, true);
});

test("getMarionettistLanguageGuideText keeps docs.language separate from marionettist language messaging", () => {
  assert.equal(getMarionettistLanguageGuideText("en"), "Marionettist will use English for Marionettist CLI guidance and agent replies.");
  assert.equal(getMarionettistLanguageGuideText("zh-CN"), "Marionettist 将使用中文提供 Marionettist CLI 引导和 agent 回复。");
});
