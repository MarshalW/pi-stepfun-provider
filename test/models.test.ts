import assert from "node:assert/strict";
import test from "node:test";

import { MODELS, fetchModels } from "../src/models.ts";

const CTX = { credential: null, signal: undefined } as never;

/** Replace global fetch with a canned /v1/models response. */
function stubModels(payload: unknown, status = 200) {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    }) as unknown as Response;
  return () => {
    globalThis.fetch = original;
  };
}

test("speech models are filtered out of the model list", async () => {
  const restore = stubModels({
    data: [
      { id: "step-3.7-flash", model_type: "大语言模型" },
      { id: "stepaudio-2.5-tts", model_type: "语音合成" },
      { id: "stepaudio-2.5-asr", model_type: "语音识别" },
      { id: "stepaudio-2.5-realtime", model_type: "实时语音" },
      { id: "stepaudio-2.5-chat", model_type: "实时语音" },
    ],
  });
  try {
    const models = await fetchModels(CTX);
    assert.deepEqual(
      models.map((m) => m.id),
      ["step-3.7-flash"]
    );
  } finally {
    restore();
  }
});

test("supported_protocols decides chat capability when present", async () => {
  const restore = stubModels({
    data: [
      { id: "chat-only", supported_protocols: ["chat", "messages"] },
      { id: "responses-only", supported_protocols: ["responses"] },
    ],
  });
  try {
    const models = await fetchModels(CTX);
    assert.deepEqual(
      models.map((m) => m.id),
      ["chat-only"]
    );
  } finally {
    restore();
  }
});

test("empty response falls back to the static catalog", async () => {
  const restore = stubModels({ data: [] });
  try {
    assert.equal((await fetchModels(CTX)).length, MODELS.length);
  } finally {
    restore();
  }
});

test("response containing only speech models falls back to the static catalog", async () => {
  const restore = stubModels({
    data: [
      { id: "stepaudio-2.5-tts", model_type: "语音合成" },
      { id: "stepaudio-2.5-asr", model_type: "语音识别" },
    ],
  });
  try {
    assert.equal((await fetchModels(CTX)).length, MODELS.length);
  } finally {
    restore();
  }
});

test("unknown models build specs from API metadata", async () => {
  const restore = stubModels({
    data: [
      {
        id: "step-9-future",
        model_type: "大语言模型",
        max_input_tokens: 500000,
        enable_vision_input: true,
        enable_reason: true,
        reasoning_effort_support_list: ["low", "high"],
      },
    ],
  });
  try {
    const [model] = await fetchModels(CTX);
    assert.equal(model.id, "step-9-future");
    assert.equal(model.contextWindow, 500000);
    assert.deepEqual(model.input, ["text", "image"]);
    assert.equal(model.reasoning, true);
    // Only the efforts the API declares are offered — never assume all three.
    assert.deepEqual(model.thinkingLevelMap, {
      off: null,
      minimal: null,
      low: "low",
      medium: null,
      high: "high",
      xhigh: null,
      max: null,
    });
    assert.equal(model.compat?.supportsReasoningEffort, true);
    // Unknown pricing stays zero rather than being guessed.
    assert.deepEqual(model.cost, {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
    });
  } finally {
    restore();
  }
});

test("reasoning models without an effort list expose no thinking levels", async () => {
  const restore = stubModels({
    data: [
      {
        id: "step-router-v1",
        model_type: "大语言模型",
        max_input_tokens: 262144,
        enable_reason: true,
      },
    ],
  });
  try {
    const [model] = await fetchModels(CTX);
    assert.equal(model.reasoning, true);
    assert.equal(model.compat?.supportsReasoningEffort, false);
    assert.ok(
      Object.values(model.thinkingLevelMap ?? {}).every((level) => level === null)
    );
  } finally {
    restore();
  }
});

test("models without context metadata use the conservative fallback", async () => {
  const restore = stubModels({
    data: [{ id: "step-mystery", model_type: "大语言模型" }],
  });
  try {
    const [model] = await fetchModels(CTX);
    assert.equal(model.contextWindow, 128000);
  } finally {
    restore();
  }
});

test("non-200 responses fall back to the static catalog", async () => {
  const restore = stubModels({ error: "nope" }, 500);
  try {
    assert.equal((await fetchModels(CTX)).length, MODELS.length);
  } finally {
    restore();
  }
});

test("step-5-preview carries the post-2026-10-14 cache-hit price", async () => {
  const spec = MODELS.find((m) => m.id === "step-5-preview");
  assert.ok(spec, "step-5-preview must be in the static catalog");
  assert.equal(spec.cost.cacheRead, 0.09);
});
