export type GeminiReviewLabel = "REAL" | "FAKE" | "UNSURE";
export type GeminiReviewCertainty = "low" | "medium" | "high";
export type GeminiClaimKind = "FACTUAL" | "OPINION";
export type GeminiClaimAssessment =
  | "PLAUSIBLE"
  | "SUSPICIOUS"
  | "UNSUPPORTED"
  | "UNSURE"
  | "NOT_APPLICABLE";

export interface GeminiClaim {
  id: string;
  quote: string;
  kind: GeminiClaimKind;
  assessment: GeminiClaimAssessment;
  explanation: string;
  needsExternalVerification: boolean;
}

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
  promptVersion: "misinfo-review-v2";
  label: GeminiReviewLabel;
  certainty: GeminiReviewCertainty;
  agreesWithPrimary: boolean | null;
  explanation: string;
  warningSigns: string[];
  claims: GeminiClaim[];
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
