/**
 * pi-stepfun-provider - StepFun Model Provider for pi
 *
 * Registers StepFun as a native model provider in pi coding agent.
 * Supports both API key and (future) OAuth authentication.
 *
 * Installation:
 *   pi install git:github.com/yourusername/pi-stepfun-provider
 *
 * Configuration:
 *   export STEPFUN_API_KEY=sk-xxx
 *
 * Usage:
 *   pi
 *   /model  # Select stepfun/step-1o, stepfun/step-1v, etc.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { MODELS, fetchModels } from "./models.js";
import { streamStepFun } from "./streaming.js";
import { stepFunOAuth } from "./auth.js";

export default function (pi: ExtensionAPI) {
  pi.registerProvider("stepfun", {
    name: "StepFun",
    baseUrl: "https://api.stepfun.com/v1",
    apiKey: "$STEPFUN_API_KEY",
    api: "openai-completions",
    models: MODELS,
    refreshModels: fetchModels,
    streamSimple: streamStepFun,
    oauth: stepFunOAuth,
  });
}