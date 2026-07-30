import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Update here if the account's available model ID changes — this is the
// single place the model name is configured.
const MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export type AnthropicChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Single entry point for calling the Anthropic API — the API key never
 * leaves the server since this is only ever imported from Server Actions.
 * Callers are responsible for catching errors and surfacing a friendly
 * message; this rethrows whatever the SDK throws (rate limits, auth,
 * network) so callers can distinguish failure modes if they need to.
 */
export async function callAnthropic(params: {
  system: string;
  messages: AnthropicChatMessage[];
  maxTokens?: number;
}): Promise<string> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: params.maxTokens ?? 1024,
    system: params.system,
    messages: params.messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}

/**
 * Server Actions that throw a plain Error have their message redacted by
 * Next.js in production (only a generic message + digest reach the client),
 * so callers should catch here and return this friendly string in a
 * discriminated result instead of letting the original error propagate.
 */
export function describeAnthropicError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return "The Anthropic API key is missing or invalid. Check ANTHROPIC_API_KEY.";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "Anthropic's API is rate-limiting requests right now. Please try again in a moment.";
  }
  if (err instanceof Anthropic.APIError) {
    return `Anthropic API error (${err.status ?? "unknown status"}). Please try again.`;
  }
  if (err instanceof Error && err.message === "ANTHROPIC_API_KEY is not configured.") {
    return err.message;
  }
  return "Couldn't reach the AI service. Check your connection and try again.";
}
