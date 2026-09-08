/**
 * StepFun Model Definitions
 *
 * Specs verified against official docs (platform.stepfun.com):
 * /v1/models only returns ids, so known models always use the static
 * spec table below; dynamic fetching only discovers new ids.
 */

import type { ProviderModelConfig } from "@earendil-works/pi-coding-agent";
import type { RefreshModelsContext } from "@earendil-works/pi-ai";

/** Officially verified model specs (cost in $/M tokens per StepFun pricing page) */
export const MODEL_SPECS: Record<string, ProviderModelConfig> = {
  "step-3.7-flash": {
    id: "step-3.7-flash",
    name: "Step 3.7 Flash",
    reasoning: true,
    thinkingLevelMap: {
      off: null,
      minimal: null,
      low: "low",
      medium: "medium",
      high: "high",
      xhigh: null,
      max: null,
    },
    input: ["text", "image"],
    cost: { input: 1.35, output: 8.1, cacheRead: 0.27, cacheWrite: 1.35 },
    contextWindow: 262144,
    maxTokens: 65536,
    compat: {
      supportsDeveloperRole: false,
      supportsReasoningEffort: true,
      maxTokensField: "max_tokens",
    },
  },
  "step-3.5-flash": {
    id: "step-3.5-flash",
    name: "Step 3.5 Flash",
    reasoning: true,
    thinkingLevelMap: {
      off: null,
      minimal: null,
      low: "low",
      medium: "medium",
      high: "high",
      xhigh: null,
      max: null,
    },
    input: ["text"],
    cost: { input: 0.7, output: 2.1, cacheRead: 0.14, cacheWrite: 0.7 },
    contextWindow: 262144,
    maxTokens: 65536,
    compat: {
      supportsDeveloperRole: false,
      supportsReasoningEffort: true,
      maxTokensField: "max_tokens",
    },
  },
  "step-3.5-flash-2603": {
    id: "step-3.5-flash-2603",
    name: "Step 3.5 Flash 2603",
    reasoning: true,
    thinkingLevelMap: {
      off: null,
      minimal: null,
      low: "low",
      medium: "medium",
      high: "high",
      xhigh: null,
      max: null,
    },
    input: ["text"],
    cost: { input: 0.7, output: 2.1, cacheRead: 0.14, cacheWrite: 0.7 },
    contextWindow: 262144,
    maxTokens: 65536,
    compat: {
      supportsDeveloperRole: false,
      supportsReasoningEffort: true,
      maxTokensField: "max_tokens",
    },
  },
};

/** Static baseline models (loaded immediately, no network required) */
export const MODELS: ProviderModelConfig[] = Object.values(MODEL_SPECS);

/** Conservative fallback for models not in the spec table */
const FALLBACK_THINKING_LEVEL_MAP = {
  off: null,
  minimal: null,
  low: "low",
  medium: "medium",
  high: "high",
  xhigh: null,
  max: null,
};
const FALLBACK_COMPAT = {
  supportsDeveloperRole: false,
  supportsReasoningEffort: true,
  maxTokensField: "max_tokens",
};
const FALLBACK_COST = {
  input: 0.7,
  output: 2.1,
  cacheRead: 0.14,
  cacheWrite: 0.7,
};
const STEPFUN_BASE_URL =
  process.env.STEPFUN_BASE_URL ?? "https://api.stepfun.com/v1";

/**
 * Dynamic model discovery from StepFun API.
 * Known ids are served from MODEL_SPECS; unknown ids get a conservative fallback.
 */
export async function fetchModels(
  context: RefreshModelsContext
): Promise<ProviderModelConfig[]> {
  const cred = context.credential;
  const apiKey =
    cred?.type === "api_key"
      ? cred.key
      : cred?.type === "oauth"
        ? cred.access
        : process.env.STEPFUN_API_KEY;

  if (!apiKey) {
    return MODELS;
  }

  try {
    const response = await fetch(`${STEPFUN_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: context.signal,
    });

    if (!response.ok) {
      console.warn(
        `[pi-stepfun-provider] Failed to fetch models: HTTP ${response.status}`
      );
      return MODELS;
    }

    const data = (await response.json()) as {
      data?: Array<{ id: string }>;
    };

    if (!data.data || !Array.isArray(data.data)) {
      console.warn(`[pi-stepfun-provider] Unexpected models response format`);
      return MODELS;
    }

    return data.data.map((m): ProviderModelConfig => {
      const spec = MODEL_SPECS[m.id];
      if (spec) {
        return spec;
      }
      return {
        id: m.id,
        name: m.id,
        reasoning: false,
        thinkingLevelMap: FALLBACK_THINKING_LEVEL_MAP,
        input: ["text"],
        cost: FALLBACK_COST,
        contextWindow: 128000,
        maxTokens: 65536,
        compat: FALLBACK_COMPAT,
      };
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return MODELS;
    }
    console.warn(
      `[pi-stepfun-provider] Model fetch failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return MODELS;
  }
}
