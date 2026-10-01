import type {
  GeminiReview,
  GeminiReviewCertainty,
  GeminiReviewLabel,
  GeminiReviewRequestOptions,
  GeminiUnavailableReason,
} from "@/lib/gemini-review";

export type { GeminiReview } from "@/lib/gemini-review";

export type AnalysisLabel = "REAL" | "FAKE";
export type SignalTone = "risk" | "reassuring";
export type SignalSeverity = "low" | "medium" | "high";
export type AnalysisEngine = "demo-heuristic" | "external-model";

export interface EvidenceSpan {
  id: string;
  start: number;
  end: number;
  quote: string;
  signalId: string;
  tone: SignalTone;
}

export interface AnalysisSignal {
  id: string;
  title: string;
  description: string;
  tone: SignalTone;
  severity: SignalSeverity;
  evidenceIds: string[];
}

export interface SourceCheckAction {
  id: string;
  label: string;
  query: string;
  rationale: string;
}

export interface SourceReview {
  status: "not-checked";
  message: string;
  actions: SourceCheckAction[];
}

export interface AnalysisMeta {
  engine: AnalysisEngine;
  engineVersion: string;
  externalSourcesChecked: false;
}

export interface AnalysisResponse {
  label: AnalysisLabel;
  confidence: number;
  explanation?: string;
  signals?: AnalysisSignal[];
  evidence?: EvidenceSpan[];
  sourceReview?: SourceReview;
  meta?: AnalysisMeta;
  geminiReview?: GeminiReview;
}

type DetectorSpec = {
  id: string;
  pattern: RegExp;
  title: string;
  description: string;
  tone: SignalTone;
  severity: SignalSeverity;
};

const MAX_TEXT_LENGTH = 5_000;
const REQUEST_TIMEOUT_MS = 12_000;
const DEMO_ENGINE_VERSION = "demo-heuristic-v1";

const riskDetectors: readonly DetectorSpec[] = [
  {
    id: "unnamed-experts",
    pattern: /уч[её]ные(?:\s+из\s+[^,.!?]+)?\s+(?:подтвердили|доказали|установили)/iu,
    title: "Неопределённая ссылка на экспертов",
    description:
      "Упоминаются учёные, но нет названия организации, публикации или ссылки на исследование.",
    tone: "risk",
    severity: "high",
  },
  {
    id: "absolute-benefit",
    pattern: /полностью\s+(?:очищает|защищает|излечивает)(?:\s+[^,.!?]{0,55})?/iu,
    title: "Категоричное обещание результата",
    description:
      "Абсолютные формулировки требуют особенно надёжных и проверяемых доказательств.",
    tone: "risk",
    severity: "high",
  },
  {
    id: "effortless-result",
    pattern: /без\s+(?:диет|лекарств|физических нагрузок)(?:\s+и\s+(?:диет|лекарств|физических нагрузок))?/iu,
    title: "Обещание результата без усилий",
    description:
      "Упрощённая причинно-следственная связь может быть признаком манипулятивного текста.",
    tone: "risk",
    severity: "medium",
  },
  {
    id: "urgency",
    pattern: /срочно(?:\s+перешлите)?/iu,
    title: "Давление через срочность",
    description:
      "Текст подталкивает действовать немедленно и оставляет меньше времени на проверку.",
    tone: "risk",
    severity: "medium",
  },
  {
    id: "forward-request",
    pattern: /перешлите\s+(?:всем|друзьям|родным)/iu,
    title: "Призыв к массовому распространению",
    description:
      "Просьба переслать сообщение до проверки характерна для вирусных недостоверных сообщений.",
    tone: "risk",
    severity: "medium",
  },
  {
    id: "fear-consequence",
    pattern: /(?:карты|сч[её]та)\s+[^.!?]{0,70}заблокируют(?:\s+навсегда)?/iu,
    title: "Запугивающее последствие",
    description:
      "Угроза блокировки используется как эмоциональный аргумент вместо проверяемого источника.",
    tone: "risk",
    severity: "high",
  },
  {
    id: "hidden-truth",
    pattern: /(?:официально\s+об\s+этом\s+пока\s+не\s+объявляют|врачи\s+скрывают)/iu,
    title: "Непроверяемая ссылка на скрытую информацию",
    description:
      "Утверждение заранее объясняет отсутствие подтверждений и затрудняет проверку.",
    tone: "risk",
    severity: "high",
  },
] as const;

const reassuringDetectors: readonly DetectorSpec[] = [
  {
    id: "named-official-source",
    pattern: /(?:росстат|мчс|минздрав|интерфакс|тасс|рбк|государственн(?:ой|ая)\s+дум(?:ы|а))/iu,
    title: "Назван проверяемый источник",
    description:
      "Организация указана явно, поэтому исходное сообщение можно найти и сопоставить.",
    tone: "reassuring",
    severity: "medium",
  },
  {
    id: "attribution",
    pattern: /(?:по\s+данным|пресс-служба|в\s+официальном\s+отч[её]те|на\s+официальном\s+сайте)/iu,
    title: "Есть атрибуция сообщения",
    description:
      "Текст указывает, кому принадлежит информация и где искать первоисточник.",
    tone: "reassuring",
    severity: "medium",
  },
  {
    id: "verifiable-detail",
    pattern: /(?:\d{1,2}[,.]\d+\s*%|\d{1,2}\s+[а-яё]+|номер\s+документа|результаты\s+голосования)/iu,
    title: "Указаны проверяемые детали",
    description:
      "Даты, числа или реквизиты помогают сопоставить утверждение с первичным источником.",
    tone: "reassuring",
    severity: "low",
  },
  {
    id: "qualified-language",
    pattern: /(?:ещ[её]\s+не\s+принято|по\s+сравнению|уточнил[аио]?|прош[её]л\s+первое\s+чтение)/iu,
    title: "Формулировки учитывают контекст",
    description:
      "В тексте есть оговорки, этапы процесса или границы применимости утверждения.",
    tone: "reassuring",
    severity: "low",
  },
] as const;

function collectDetections(text: string, specs: readonly DetectorSpec[]) {
  const signals: AnalysisSignal[] = [];
  const evidence: EvidenceSpan[] = [];

  for (const spec of specs) {
    const match = spec.pattern.exec(text);

    if (!match || typeof match.index !== "number") {
      continue;
    }

    const evidenceId = `${spec.id}-evidence`;
    const quote = match[0];

    signals.push({
      id: spec.id,
      title: spec.title,
      description: spec.description,
      tone: spec.tone,
      severity: spec.severity,
      evidenceIds: [evidenceId],
    });
    evidence.push({
      id: evidenceId,
      start: match.index,
      end: match.index + quote.length,
      quote,
      signalId: spec.id,
      tone: spec.tone,
    });
  }

  return { signals, evidence };
}

function buildSearchQuery(text: string) {
  const firstSentence = text.split(/[.!?]/u)[0]?.trim() ?? text.trim();
  const compact = firstSentence.replace(/\s+/gu, " ");

  return compact.length > 150 ? `${compact.slice(0, 147)}…` : compact;
}

function createSourceReview(text: string): SourceReview {
  const query = buildSearchQuery(text);

  return {
    status: "not-checked",
    message:
      "Внешние источники автоматически не проверялись. Используйте запросы ниже как отправную точку для самостоятельной проверки.",
    actions: [
      {
        id: "exact-claim",
        label: "Проверить формулировку",
        query: `\"${query}\"`,
        rationale: "Точный поиск помогает найти первичную публикацию или повторения текста.",
      },
      {
        id: "primary-source",
        label: "Найти первоисточник",
        query: `${query} первоисточник исследование официальный сайт`,
        rationale: "Сопоставьте утверждение с официальным сообщением или публикацией.",
      },
    ],
  };
}

function createMeta(engine: AnalysisEngine, engineVersion: string): AnalysisMeta {
  return {
    engine,
    engineVersion,
    externalSourcesChecked: false,
  };
}

function isSignalTone(value: unknown): value is SignalTone {
  return value === "risk" || value === "reassuring";
}

function isSignalSeverity(value: unknown): value is SignalSeverity {
  return value === "low" || value === "medium" || value === "high";
}

function isGeminiLabel(value: unknown): value is GeminiReviewLabel {
  return value === "REAL" || value === "FAKE" || value === "UNSURE";
}

function isGeminiCertainty(value: unknown): value is GeminiReviewCertainty {
  return value === "low" || value === "medium" || value === "high";
}

function isGeminiUnavailableReason(
  value: unknown,
): value is GeminiUnavailableReason {
  return (
    value === "not-configured" ||
    value === "primary-unavailable" ||
    value === "timeout" ||
    value === "rate-limited" ||
    value === "blocked" ||
    value === "invalid-response" ||
    value === "upstream-error"
  );
}

function sanitizeGeminiReview(
  value: unknown,
  primaryLabel: AnalysisLabel,
): GeminiReview | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const review = value as Record<string, unknown>;
  if (review.provider !== "gemini") {
    return null;
  }

  if (review.status === "unavailable") {
    const keys = Object.keys(review);
    return keys.length === 3 &&
      keys.every((key) => ["status", "provider", "reason"].includes(key)) &&
      isGeminiUnavailableReason(review.reason)
      ? {
          status: "unavailable",
          provider: "gemini",
          reason: review.reason,
        }
      : null;
  }

  const completeKeys = Object.keys(review);
  const expectedCompleteKeys = [
    "status",
    "provider",
    "model",
    "promptVersion",
    "label",
    "certainty",
    "agreesWithPrimary",
    "explanation",
    "warningSigns",
    "externalSourcesChecked",
  ];

  if (
    completeKeys.length !== expectedCompleteKeys.length ||
    !completeKeys.every((key) => expectedCompleteKeys.includes(key)) ||
    review.status !== "complete" ||
    typeof review.model !== "string" ||
    review.model.length === 0 ||
    review.model.length > 100 ||
    review.promptVersion !== "misinfo-review-v1" ||
    !isGeminiLabel(review.label) ||
    !isGeminiCertainty(review.certainty) ||
    typeof review.explanation !== "string" ||
    review.explanation.length < 10 ||
    review.explanation.length > 1_200 ||
    !Array.isArray(review.warningSigns) ||
    review.warningSigns.length > 5 ||
    review.externalSourcesChecked !== false
  ) {
    return null;
  }

  const explanation = review.explanation.trim();
  if (explanation.length < 10 || explanation.length > 1_200) {
    return null;
  }

  const expectedAgreement =
    review.label === "UNSURE" ? null : review.label === primaryLabel;
  if (review.agreesWithPrimary !== expectedAgreement) {
    return null;
  }

  const warningSigns: string[] = [];
  for (const item of review.warningSigns) {
    if (typeof item !== "string") {
      return null;
    }
    const normalized = item.trim();
    if (!normalized || normalized.length > 220) {
      return null;
    }
    warningSigns.push(normalized);
  }

  return {
    status: "complete",
    provider: "gemini",
    model: review.model,
    promptVersion: "misinfo-review-v1",
    label: review.label,
    certainty: review.certainty,
    agreesWithPrimary: expectedAgreement,
    explanation,
    warningSigns,
    externalSourcesChecked: false,
  };
}

function sanitizeAnalysisResponse(
  value: unknown,
  analyzedText: string,
  defaultMeta: AnalysisMeta,
): AnalysisResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    (candidate.label !== "REAL" && candidate.label !== "FAKE") ||
    typeof candidate.confidence !== "number" ||
    !Number.isFinite(candidate.confidence) ||
    candidate.confidence < 0 ||
    candidate.confidence > 1
  ) {
    return null;
  }

  const response: AnalysisResponse = {
    label: candidate.label,
    confidence: candidate.confidence,
    sourceReview: createSourceReview(analyzedText),
    meta: defaultMeta,
  };

  if (typeof candidate.explanation === "string" && candidate.explanation.length <= 2_000) {
    response.explanation = candidate.explanation;
  }

  if (Array.isArray(candidate.signals)) {
    response.signals = candidate.signals
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .filter(
        (entry) =>
          typeof entry.id === "string" &&
          typeof entry.title === "string" &&
          typeof entry.description === "string" &&
          isSignalTone(entry.tone) &&
          isSignalSeverity(entry.severity) &&
          Array.isArray(entry.evidenceIds),
      )
      .slice(0, 12)
      .map((entry) => ({
        id: entry.id as string,
        title: (entry.title as string).slice(0, 160),
        description: (entry.description as string).slice(0, 600),
        tone: entry.tone as SignalTone,
        severity: entry.severity as SignalSeverity,
        evidenceIds: (entry.evidenceIds as unknown[])
          .filter((id): id is string => typeof id === "string")
          .slice(0, 6),
      }));
  }

  if (Array.isArray(candidate.evidence)) {
    response.evidence = candidate.evidence
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .filter((entry) => {
        if (
          typeof entry.id !== "string" ||
          typeof entry.start !== "number" ||
          typeof entry.end !== "number" ||
          typeof entry.quote !== "string" ||
          typeof entry.signalId !== "string" ||
          !isSignalTone(entry.tone)
        ) {
          return false;
        }

        const start = Math.trunc(entry.start);
        const end = Math.trunc(entry.end);
        return (
          start >= 0 &&
          end > start &&
          end <= analyzedText.length &&
          analyzedText.slice(start, end) === entry.quote
        );
      })
      .slice(0, 16)
      .map((entry) => ({
        id: entry.id as string,
        start: Math.trunc(entry.start as number),
        end: Math.trunc(entry.end as number),
        quote: entry.quote as string,
        signalId: entry.signalId as string,
        tone: entry.tone as SignalTone,
      }));
  }

  if (candidate.sourceReview && typeof candidate.sourceReview === "object") {
    const review = candidate.sourceReview as Record<string, unknown>;
    if (
      review.status === "not-checked" &&
      typeof review.message === "string" &&
      Array.isArray(review.actions)
    ) {
      const actions = review.actions
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .filter(
          (entry) =>
            typeof entry.id === "string" &&
            typeof entry.label === "string" &&
            typeof entry.query === "string" &&
            typeof entry.rationale === "string",
        )
        .slice(0, 4)
        .map((entry) => ({
          id: entry.id as string,
          label: (entry.label as string).slice(0, 100),
          query: (entry.query as string).slice(0, 500),
          rationale: (entry.rationale as string).slice(0, 300),
        }));

      response.sourceReview = {
        status: "not-checked",
        message: review.message.slice(0, 600),
        actions,
      };
    }
  }

  if (candidate.meta && typeof candidate.meta === "object") {
    const meta = candidate.meta as Record<string, unknown>;
    if (
      (meta.engine === "demo-heuristic" || meta.engine === "external-model") &&
      typeof meta.engineVersion === "string" &&
      meta.externalSourcesChecked === false
    ) {
      response.meta = {
        engine: meta.engine,
        engineVersion: meta.engineVersion.slice(0, 100),
        externalSourcesChecked: false,
      };
    }
  }

  if (candidate.geminiReview) {
    const geminiReview = sanitizeGeminiReview(
      candidate.geminiReview,
      response.label,
    );
    if (geminiReview) {
      response.geminiReview = geminiReview;
    }
  }

  return response;
}

/**
 * Deterministic local classifier used by the Next.js mock route and as an
 * offline fallback for that route only. It is a UI demo, not a factuality verdict.
 */
export function getMockAnalysis(text: string): AnalysisResponse {
  const normalizedText = text.trim();
  const risk = collectDetections(normalizedText, riskDetectors);
  const reassuring = collectDetections(normalizedText, reassuringDetectors);
  const riskScore = risk.signals.length;
  const reassuringScore = reassuring.signals.length;
  const isDefaultMedicalExample = normalizedText
    .toLocaleLowerCase("ru-RU")
    .includes("горячей воды натощак");
  const isFake = isDefaultMedicalExample || riskScore - Math.min(reassuringScore, 2) >= 2;

  const selected = isFake ? risk : reassuring;
  const confidence = isDefaultMedicalExample
    ? 0.91
    : isFake
      ? Math.min(0.95, Number((0.8 + riskScore * 0.03).toFixed(2)))
      : Math.min(
          0.92,
          Number((0.75 + reassuringScore * 0.04 + Number(riskScore === 0) * 0.03).toFixed(2)),
        );

  if (isFake && reassuringScore === 0) {
    selected.signals.push({
      id: "missing-verifiable-source",
      title: "Нет конкретного проверяемого источника",
      description:
        "В тексте не найдено названия публикации, официального документа или другого первоисточника.",
      tone: "risk",
      severity: "high",
      evidenceIds: [],
    });
  }

  return {
    label: isFake ? "FAKE" : "REAL",
    confidence,
    explanation: isFake
      ? "В тексте обнаружены языковые признаки, которые часто встречаются в недостоверных или манипулятивных сообщениях. Это повод проверить утверждения по первоисточникам, а не окончательный вердикт."
      : "Выраженные языковые признаки манипуляции не обнаружены. Формулировки выглядят проверяемыми, но содержание фактов всё равно нужно сопоставить с первоисточником.",
    signals: selected.signals,
    evidence: selected.evidence,
    sourceReview: createSourceReview(normalizedText),
    meta: createMeta("demo-heuristic", DEMO_ENGINE_VERSION),
  };
}

/**
 * Sends text through the same-origin Next.js route. That route reads the server-only
 * ML_API_URL setting and proxies FastAPI without exposing backend topology to browsers.
 * When ML_API_URL is absent, the route explicitly returns the labelled demo engine.
 */
export async function analyzeText(
  text: string,
  options: GeminiReviewRequestOptions = {},
): Promise<AnalysisResponse> {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Введите текст для проверки.");
  }

  const normalizedText = text.trim();

  if (normalizedText.length > MAX_TEXT_LENGTH) {
    throw new Error("Текст не должен превышать 5000 символов.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: normalizedText,
        useGemini: options.useGemini === true,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Analysis request failed with status ${response.status}.`);
    }

    const payload: unknown = await response.json();
    const parsed = sanitizeAnalysisResponse(
      payload,
      normalizedText,
      createMeta("demo-heuristic", DEMO_ENGINE_VERSION),
    );

    if (!parsed) {
      throw new Error("Analysis response has an invalid shape.");
    }

    return parsed;
  } finally {
    clearTimeout(timeoutId);
  }
}
