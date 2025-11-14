// ABOUTME: Validates Ably environment configuration.
// ABOUTME: Ensures required env vars are present with helpful error messages.

/**
 * Validates Ably environment configuration
 * @throws {Error} If ABLY_API_KEY is missing or invalid format
 */
export function validateAblyConfig(): void {
  const apiKey = process.env.ABLY_API_KEY;

  // Check if API key exists and is not empty
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('ABLY_API_KEY environment variable is required');
  }

  // Validate format: appId.keyId:keySecret
  // Format example: abc123.def456:ghi789jkl
  const formatRegex = /^[^.]+\.[^:]+:.+$/;
  if (!formatRegex.test(apiKey)) {
    throw new Error('ABLY_API_KEY must be in format: appId.keyId:keySecret');
  }
}
