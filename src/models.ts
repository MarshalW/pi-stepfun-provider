/**
 * StepFun Model Definitions
 *
 * Specs verified against official docs (platform.stepfun.com):
 * /v1/models only returns ids, so known models always use the static
 * spec table below; dynamic fetching only discovers new ids.
 */

import type { ProviderModelConfig } from "@earendil-works/pi-coding-agent";
import type { RefreshModelsContext } from "@earendil-works/pi-ai";

/**
 * Officially verified model specs.
 *
 * `cost` is in **USD** per 1M tokens and always comes from the English pricing
 * page (platform.stepfun.com/docs/en/guides/pricing/details). The Chinese page
 * quotes CNY, so never copy its numbers into these fields.
 *
 * Reference (2026-09):
 *   step-5-preview    1M ctx / 64K out  $1.00  $2.70  (cache hit $0.05)
 *   step-3.7-flash  256K ctx / 64K out  $0.20  $1.15  (cache hit $0.04)
 *   step-3.5-flash* 256K ctx / 64K out  $0.10  $0.30  (cache hit $0.02)
 */
export const MODEL_SPECS: Record<string, ProviderModelConfig> = {
  "step-5-preview": {
    id: "step-5-preview",
    name: "Step 5 Preview",
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
    cost: { input: 1.0, output: 2.7, cacheRead: 0.05, cacheWrite: 1.0 },
    contextWindow: 1024000,
    maxTokens: 65536,
    compat: {
      supportsDeveloperRole: false,
      supportsReasoningEffort: true,
      maxTokensField: "max_tokens",
    },
  },
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
    cost: { input: 0.2, output: 1.15, cacheRead: 0.04, cacheWrite: 0.2 },
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
    cost: { input: 0.1, output: 0.3, cacheRead: 0.02, cacheWrite: 0.1 },
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
    cost: { input: 0.1, output: 0.3, cacheRead: 0.02, cacheWrite: 0.1 },
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
const REASONING_THINKING_LEVEL_MAP = {
  off: null,
  minimal: null,
  low: "low",
  medium: "medium",
  high: "high",
  xhigh: null,
  max: null,
};
const NO_REASONING_THINKING_LEVEL_MAP = {
  off: null,
  minimal: null,
  low: null,
  medium: null,
  high: null,
  xhigh: null,
  max: null,
};
const FALLBACK_COMPAT = {
  supportsDeveloperRole: false,
  supportsReasoningEffort: true,
  maxTokensField: "max_tokens",
};
/** Unknown pricing is reported as zero rather than as a guessed (wrong) number */
const UNKNOWN_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
/** Used only when the API omits `max_input_tokens` */
const FALLBACK_CONTEXT_WINDOW = 128000;
const STEPFUN_BASE_URL =
  process.env.STEPFUN_BASE_URL ?? "https://api.stepfun.com/v1";

/** Subset of `/v1/models` payload we rely on (verified against the live API) */
interface StepFunModelInfo {
  id: string;
  max_input_tokens?: number;
  enable_vision_input?: boolean;
  enable_reason?: boolean;
}

/**
 * Dynamic model discovery from StepFun API.
 *
 * Known ids come from MODEL_SPECS (curated specs + USD pricing). Unknown ids are
 * built from the API's own metadata (`max_input_tokens`, `enable_vision_input`,
 * `enable_reason`) instead of hard-coded guesses, so a new model such as
 * `step-5-preview` reports its real 1M context immediately.
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
      data?: StepFunModelInfo[];
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
      const reasoning = m.enable_reason === true;
      const contextWindow =
        typeof m.max_input_tokens === "number" && m.max_input_tokens > 0
          ? m.max_input_tokens
          : FALLBACK_CONTEXT_WINDOW;

      return {
        id: m.id,
        name: m.id,
        reasoning,
        thinkingLevelMap: reasoning
          ? REASONING_THINKING_LEVEL_MAP
          : NO_REASONING_THINKING_LEVEL_MAP,
        input: m.enable_vision_input === true ? ["text", "image"] : ["text"],
        cost: UNKNOWN_COST,
        contextWindow,
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
