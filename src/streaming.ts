/**
 * StepFun Streaming Implementation
 *
 * StepFun uses an OpenAI-compatible API, so we delegate to pi-ai's
 * built-in OpenAI completions handler. This handles streaming, tool calls,
 * thinking/reasoning, and cost tracking automatically.
 *
 * If StepFun has API quirks, override specific behavior here.
 */

import {
  openAICompletionsApi,
  type SimpleStreamOptions,
} from "@earendil-works/pi-ai/compat";
import type {
  Model,
  Context,
  AssistantMessageEventStream,
  Api,
} from "@earendil-works/pi-ai";

/**
 * Custom streamSimple for StepFun provider.
 * Delegates to OpenAI completions API with StepFun-specific adjustments.
 */
export function streamStepFun(
  model: Model<Api>,
  context: Context,
  options?: SimpleStreamOptions
): AssistantMessageEventStream {
  // Ensure the model uses the correct base URL for StepFun
  const modelWithBaseUrl: Model<Api> = {
    ...model,
    baseUrl: model.baseUrl ?? "https://api.stepfun.com/v1",
  };

  // Delegate to built-in OpenAI completions handler
  // StepFun should be fully compatible with OpenAI chat completions format
  return openAICompletionsApi().streamSimple(modelWithBaseUrl, context, {
    ...options,
    // StepFun-specific request adjustments can go here if needed
    // e.g., custom headers, parameter transformations
  });
}