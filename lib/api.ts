export type AnalysisLabel = "REAL" | "FAKE";

export interface AnalysisResponse {
  label: AnalysisLabel;
  confidence: number;
}

const MAX_TEXT_LENGTH = 5_000;
const REQUEST_TIMEOUT_MS = 6_000;
const FALLBACK_DELAY_MS = 1_000;

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const isAnalysisResponse = (value: unknown): value is AnalysisResponse => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    (candidate.label === "REAL" || candidate.label === "FAKE") &&
    typeof candidate.confidence === "number" &&
    Number.isFinite(candidate.confidence) &&
    candidate.confidence >= 0 &&
    candidate.confidence <= 1
  );
};

const fakeSignals = [
  /срочно/u,
  /(?:перешлите|распространите).*(?:всем|друзьям|родным)/u,
  /врачи скрывают/u,
  /уч[её]ные(?: из [^,.!?]+)? (?:доказали|подтвердили|установили)/u,
  /полностью (?:очищает|защищает|излечивает)/u,
  /очища(?:ет|ют) организм от токсинов/u,
  /без (?:диет|лекарств|физических нагрузок)/u,
  /(?:гарантированно|мгновенно|навсегда)/u,
  /(?:чудо-средство|чудодейственн)/u,
  /(?:карты|счета) заблокируют/u,
] as const;

const credibleSignals = [
  /(?:росстат|мчс|минздрав|интерфакс|тасс|рбк)/u,
  /по данным/u,
  /пресс-служб[аы]/u,
  /официальн(?:ый|ая|ое|ом|ые)/u,
  /(?:отч[её]т|исследование).*(?:журнал|doi)/u,
] as const;

/**
 * Deterministic local classifier used by the Next.js mock route and as an
 * offline fallback. It is intentionally a demo, not a factuality verdict.
 */
export function getMockAnalysis(text: string): AnalysisResponse {
  const normalized = text.toLocaleLowerCase("ru-RU").replace(/\s+/gu, " ");

  if (normalized.includes("горячей воды натощак")) {
    return { label: "FAKE", confidence: 0.91 };
  }

  const fakeScore = fakeSignals.reduce(
    (score, pattern) => score + Number(pattern.test(normalized)),
    0,
  );
  const credibleScore = credibleSignals.reduce(
    (score, pattern) => score + Number(pattern.test(normalized)),
    0,
  );

  if (fakeScore - Math.min(credibleScore, 2) >= 2) {
    return {
      label: "FAKE",
      confidence: Math.min(0.95, Number((0.8 + fakeScore * 0.03).toFixed(2))),
    };
  }

  return {
    label: "REAL",
    confidence: Math.min(
      0.92,
      Number((0.75 + credibleScore * 0.04 + Number(fakeScore === 0) * 0.03).toFixed(2)),
    ),
  };
}

/**
 * Sends text to the local route by default. Set NEXT_PUBLIC_ANALYSIS_API_URL
 * to a FastAPI `/predict` URL later without changing UI components.
 */
export async function analyzeText(text: string): Promise<AnalysisResponse> {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Введите текст для проверки.");
  }

  const normalizedText = text.trim();

  if (normalizedText.length > MAX_TEXT_LENGTH) {
    throw new Error("Текст не должен превышать 5000 символов.");
  }

  const endpoint =
    process.env.NEXT_PUBLIC_ANALYSIS_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_RUFACT_API_URL?.trim() ||
    "/api/analyze";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: normalizedText }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Analysis request failed with status ${response.status}.`);
    }

    const payload: unknown = await response.json();

    if (!isAnalysisResponse(payload)) {
      throw new Error("Analysis response has an invalid shape.");
    }

    return payload;
  } catch {
    await wait(FALLBACK_DELAY_MS);
    return getMockAnalysis(normalizedText);
  } finally {
    clearTimeout(timeoutId);
  }
}
