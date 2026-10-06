import assert from "node:assert/strict";
import test from "node:test";

import { analyzeText } from "../lib/api.ts";

const TEST_TEXT =
  "Вода кипит при 100 градусах Цельсия при нормальном атмосферном давлении.";

test("marks sources as checked and removes the manual-search fallback", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (_input, init) => {
    const request = JSON.parse(String(init?.body));
    assert.equal(request.useGemini, true);
    assert.equal(request.locale, "uz");

    return Response.json({
      label: "REAL",
      confidence: 0.82,
      geminiReview: {
        status: "complete",
        provider: "gemini",
        model: "gemini-3.5-flash-lite",
        promptVersion: "misinfo-tavily-v3",
        label: "REAL",
        certainty: "high",
        agreesWithPrimary: true,
        explanation:
          "Найденные источники подтверждают утверждение для указанного нормального давления.",
        warningSigns: [],
        claims: [
          {
            id: "claim-1",
            quote: TEST_TEXT.slice(0, -1),
            kind: "FACTUAL",
            assessment: "SUPPORTED",
            explanation:
              "Формулировка соответствует справочным данным при нормальном атмосферном давлении.",
            needsExternalVerification: false,
          },
        ],
        externalSourcesChecked: true,
        searchQueries: ["температура кипения воды нормальное давление"],
        sources: [
          {
            id: "source-1",
            title: "Справочник по температуре кипения воды",
            url: "https://example.org/water-boiling-point",
          },
        ],
      },
    });
  };

  try {
    const result = await analyzeText(TEST_TEXT, { useGemini: true });

    assert.equal(result.geminiReview?.status, "complete");
    assert.equal(result.meta?.externalSourcesChecked, true);
    assert.equal(result.sourceReview, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
