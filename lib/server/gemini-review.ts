import "server-only";

import type { GeminiReviewUnavailable } from "../gemini-review";
import {
  DEFAULT_GEMINI_MODEL,
  requestGeminiAssessment,
  type GeminiAssessment,
} from "./gemini-review-core";

const ALLOWED_GEMINI_MODELS = new Set([
  DEFAULT_GEMINI_MODEL,
  "gemini-3.8-flash",
]);

function notConfigured(): GeminiReviewUnavailable {
  return {
    status: "unavailable",
    provider: "gemini",
    reason: "not-configured",
  };
}

function isEnabled() {
  return process.env.GEMINI_REVIEW_ENABLED?.trim().toLowerCase() === "true";
}

function configuredModel() {
  const requested = process.env.GEMINI_MODEL?.trim();
  return requested && ALLOWED_GEMINI_MODELS.has(requested)
    ? requested
    : DEFAULT_GEMINI_MODEL;
}

export function isGeminiReviewConfigured() {
  return isEnabled() && Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function getGeminiAssessment(
  text: string,
): Promise<GeminiAssessment> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!isEnabled() || !apiKey) {
    return notConfigured();
  }

  return requestGeminiAssessment({
    text,
    apiKey,
    model: configuredModel(),
  });
}
