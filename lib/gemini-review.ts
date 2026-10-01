export type GeminiReviewLabel = "REAL" | "FAKE" | "UNSURE";
export type GeminiReviewCertainty = "low" | "medium" | "high";
export type GeminiUnavailableReason =
  | "not-configured"
  | "primary-unavailable"
  | "timeout"
  | "rate-limited"
  | "blocked"
  | "invalid-response"
  | "upstream-error";

export interface GeminiReviewComplete {
  status: "complete";
  provider: "gemini";
  model: string;
  promptVersion: "misinfo-review-v1";
  label: GeminiReviewLabel;
  certainty: GeminiReviewCertainty;
  agreesWithPrimary: boolean | null;
  explanation: string;
  warningSigns: string[];
  externalSourcesChecked: false;
}

export interface GeminiReviewUnavailable {
  status: "unavailable";
  provider: "gemini";
  reason: GeminiUnavailableReason;
}

export type GeminiReview = GeminiReviewComplete | GeminiReviewUnavailable;

export interface GeminiReviewRequestOptions {
  useGemini?: boolean;
}
