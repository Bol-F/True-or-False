import type { AppLocale } from "./i18n";

export type GeminiReviewLabel = "REAL" | "FAKE" | "UNSURE";
export type GeminiReviewCertainty = "low" | "medium" | "high";
export type GeminiClaimKind = "FACTUAL" | "OPINION";
export type GeminiClaimAssessment =
  | "SUPPORTED"
  | "CONTRADICTED"
  | "MIXED"
  | "UNVERIFIED"
  | "NOT_APPLICABLE";

export interface GeminiSource {
  id: string;
  title: string;
  url: string;
}

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
  | "search-not-configured"
  | "search-rate-limited"
  | "no-search-results"
  | "search-error"
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
  promptVersion: "misinfo-tavily-v3";
  label: GeminiReviewLabel;
  certainty: GeminiReviewCertainty;
  agreesWithPrimary: boolean | null;
  explanation: string;
  warningSigns: string[];
  claims: GeminiClaim[];
  externalSourcesChecked: true;
  searchQueries: string[];
  sources: GeminiSource[];
}

export interface GeminiReviewUnavailable {
  status: "unavailable";
  provider: "gemini";
  reason: GeminiUnavailableReason;
}

export type GeminiReview = GeminiReviewComplete | GeminiReviewUnavailable;

export interface GeminiReviewRequestOptions {
  useGemini?: boolean;
  locale?: AppLocale;
}
