/**
 * StepFun Model Definitions
 *
 * Static baseline models loaded immediately at startup.
 * Dynamic fetching via refreshModels() updates the catalog from StepFun API.
 */

import type { ProviderModelConfig } from "@earendil-works/pi-coding-agent";
import type { Model, Api, RefreshModelsContext } from "@earendil-works/pi-ai";

/** Static baseline models (loaded immediately, no network required) */
export const MODELS: ProviderModelConfig[] = [
  {
    id: "step-1o",
    name: "Step-1o",
    reasoning: false,
    input: ["text", "image"],
    cost: { input: 1.0, output: 3.0, cacheRead: 0.1, cacheWrite: 0.25 },
    contextWindow: 128000,
    maxTokens: 8192,
  },
  {
    id: "step-1v",
    name: "Step-1v (Vision)",
    reasoning: false,
    input: ["text", "image"],
    cost: { input: 2.0, output: 6.0, cacheRead: 0.2, cacheWrite: 0.5 },
    contextWindow: 128000,
    maxTokens: 8192,
  },
  {
    id: "step-2",
    name: "Step-2",
    reasoning: true,
    input: ["text", "image"],
    cost: { input: 5.0, output: 15.0, cacheRead: 0.5, cacheWrite: 1.25 },
    contextWindow: 200000,
    maxTokens: 16384,
  },
];

/**
 * Dynamic model fetching from StepFun API
 * Called by pi's model refresh infrastructure when user runs `/model` or on startup.
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
    // No credentials available, return static models
    return MODELS;
  }

  try {
    const response = await fetch("https://api.stepfun.com/v1/models", {
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
      data?: Array<{
        id: string;
        name?: string;
        context_window?: number;
        max_tokens?: number;
      }>;
    };

    if (!data.data || !Array.isArray(data.data)) {
      console.warn(
        `[pi-stepfun-provider] Unexpected models response format`
      );
      return MODELS;
    }

    // Transform StepFun model list to pi ProviderModelConfig format
    const dynamicModels: ProviderModelConfig[] = data.data.map((m) => ({
      id: m.id,
      name: m.name ?? m.id,
      reasoning: m.id.toLowerCase().includes("reasoning") ||
        m.id.toLowerCase().includes("step-2"),
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 3,
        cacheRead: 0.1,
        cacheWrite: 0.25,
      },
      contextWindow: m.context_window ?? 128000,
      maxTokens: m.max_tokens ?? 8192,
    }));

    // Merge with static models, preferring dynamic data for overlapping IDs
    const staticMap = new Map(MODELS.map((m) => [m.id, m]));
    for (const dm of dynamicModels) {
      staticMap.set(dm.id, dm);
    }

    return Array.from(staticMap.values());
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // Request was cancelled, return static models
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