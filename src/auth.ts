/**
 * StepFun OAuth Implementation
 *
 * Currently a placeholder. Implement when StepFun adds OAuth support.
 * The structure follows pi-ai's OAuth provider interface.
 */

import type { OAuthCredentials, OAuthLoginCallbacks } from "@earendil-works/pi-ai";

/**
 * OAuth configuration for StepFun.
 * Set `oauth` in the provider config to enable `/login stepfun` command.
 */
export const stepFunOAuth = {
  /** Display name in login UI */
  name: "StepFun (Account)",

  /** Whether this auth method is backed by a provider subscription */
  isSubscription: false,

  /**
   * Run the OAuth login flow.
   * Called when user runs `/login stepfun` in pi.
   */
  login: async (_callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials> => {
    throw new Error(
      "StepFun OAuth not yet implemented. Use API key authentication via STEPFUN_API_KEY environment variable."
    );
  },

  /**
   * Refresh expired OAuth credentials.
   * Called automatically by pi when access token expires.
   */
  refreshToken: async (
    _credentials: OAuthCredentials,
    _signal: AbortSignal
  ): Promise<OAuthCredentials> => {
    throw new Error("StepFun OAuth not yet implemented");
  },

  /**
   * Convert stored OAuth credentials to API key string for requests.
   */
  getApiKey: (credentials: OAuthCredentials): string => credentials.access,
};