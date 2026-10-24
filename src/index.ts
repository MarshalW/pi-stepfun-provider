/**
 * pi-stepfun-provider - StepFun Model Provider for pi
 *
 * Registers StepFun as a native model provider in pi coding agent.
 * Authenticates with an API key (`STEPFUN_API_KEY`).
 *
 * Installation:
 *   pi install git:github.com/MarshalW/pi-stepfun-provider
 *
 * Configuration:
 *   export STEPFUN_API_KEY=sk-xxx
 *
 * Usage:
 *   pi
 *   /model  # Select stepfun/step-5-preview, stepfun/step-3.7-flash, etc.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { MODELS, fetchModels } from "./models.js";
import { streamStepFun } from "./streaming.js";

export default function (pi: ExtensionAPI) {
  const baseUrl =
    process.env.STEPFUN_BASE_URL ?? "https://api.stepfun.com/v1";

  pi.registerProvider("stepfun", {
    name: "StepFun",
    baseUrl,
    apiKey: "$STEPFUN_API_KEY",
    api: "openai-completions",
    models: MODELS,
    refreshModels: fetchModels,
    streamSimple: streamStepFun,
  });
}