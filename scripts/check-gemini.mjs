import {
  DEFAULT_GEMINI_MODEL,
  requestGeminiAssessment,
} from "../lib/server/gemini-review-core.ts";
import { requestTavilyEvidence } from "../lib/server/tavily-search.ts";

const enabled = process.env.GEMINI_REVIEW_ENABLED?.trim().toLowerCase() === "true";
const apiKey = process.env.GEMINI_API_KEY?.trim();
const tavilyApiKey = process.env.TAVILY_API_KEY?.trim();
const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

if (!enabled) {
  console.error("Gemini check failed: GEMINI_REVIEW_ENABLED is not true.");
  process.exitCode = 1;
}

if (!apiKey) {
  console.error("Gemini check failed: GEMINI_API_KEY is missing.");
  process.exitCode = 1;
}

if (!tavilyApiKey) {
  console.error("Grounded check failed: TAVILY_API_KEY is missing.");
  process.exitCode = 1;
}

if (enabled && apiKey && tavilyApiKey) {
  let providerStatus = null;
  let providerError = null;
  const startedAt = performance.now();
  const testText =
    "Вода при нормальном атмосферном давлении замерзает примерно при 0 °C.";
  const search = await requestTavilyEvidence({
    text: testText,
    apiKey: tavilyApiKey,
  });

  if (!search.ok) {
    console.error(`Grounded check failed: ${search.reason}.`);
    process.exitCode = 1;
  } else {
    const result = await requestGeminiAssessment({
      text: testText,
      apiKey,
      model,
      evidence: search.evidence,
      timeoutMs: 15_000,
      fetchImpl: async (input, init) => {
        const response = await fetch(input, init);
        providerStatus = response.status;
        if (!response.ok) {
          try {
            const payload = await response.clone().json();
            providerError = {
              code: payload?.error?.code ?? null,
              status: payload?.error?.status ?? null,
              message:
                typeof payload?.error?.message === "string"
                  ? payload.error.message.slice(0, 500)
                  : null,
            };
          } catch {
            providerError = null;
          }
        }
        return response;
      },
    });

    if (result.status !== "complete") {
      console.error(
        `Gemini check failed: ${result.reason}; provider status: ${providerStatus ?? "no-response"}.`,
      );
      if (providerError) {
        console.error(JSON.stringify(providerError, null, 2));
      }
      process.exitCode = 1;
    } else {
      console.log(
        JSON.stringify(
          {
            status: result.status,
            provider: result.provider,
            providerStatus,
            model: result.model,
            label: result.label,
            certainty: result.certainty,
            warningSigns: result.warningSigns.length,
            claims: result.claims.length,
            searchProvider: "tavily",
            searchQueries: result.searchQueries.length,
            sources: result.sources.length,
            externalSourcesChecked: result.externalSourcesChecked,
            latencyMs: Math.round(performance.now() - startedAt),
          },
          null,
          2,
        ),
      );
    }
  }
}
