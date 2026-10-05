import {
  AlertTriangle,
  CircleHelp,
  ExternalLink,
  SearchCheck,
  Sparkles,
} from "lucide-react";

import type { AnalysisLabel } from "@/lib/api";
import type { GeminiReview } from "@/lib/gemini-review";
import { GeminiClaimsPanel } from "./GeminiClaimsPanel";

interface GeminiReviewPanelProps {
  review: GeminiReview;
  primaryLabel: AnalysisLabel;
}

const certaintyCopy = {
  low: "низкая",
  medium: "средняя",
  high: "высокая",
} as const;

const unavailableCopy: Record<
  Extract<GeminiReview, { status: "unavailable" }>["reason"],
  string
> = {
  "not-configured":
    "Gemini не настроен на сервере. Основной анализ RuFact завершён как обычно.",
  "search-not-configured":
    "Tavily не настроен на сервере. Добавьте TAVILY_API_KEY для интернет-проверки.",
  "search-rate-limited":
    "Месячный лимит Tavily временно исчерпан. Основной результат RuFact остаётся доступен.",
  "no-search-results":
    "Tavily не нашёл достаточно источников для этого текста.",
  "search-error":
    "Интернет-поиск Tavily временно недоступен. Основной результат RuFact остаётся доступен.",
  "primary-unavailable":
    "Второе мнение доступно только вместе с обученной ML-моделью RuFact.",
  timeout:
    "Gemini не успел ответить. Основной результат RuFact остаётся доступен.",
  "rate-limited":
    "Лимит Gemini временно исчерпан. Основной результат RuFact остаётся доступен.",
  blocked:
    "Gemini не смог обработать этот текст из-за ограничений безопасности.",
  "invalid-response":
    "Gemini вернул ответ, который не прошёл проверку формата.",
  "upstream-error":
    "Gemini временно недоступен. Основной результат RuFact остаётся доступен.",
};

export function GeminiReviewPanel({
  review,
  primaryLabel,
}: GeminiReviewPanelProps) {
  if (review.status === "unavailable") {
    return (
      <section
        aria-label="Проверка Gemini по источникам недоступна"
        className="mt-4 rounded-[13px] border border-[#d6dde5] bg-[#f2f5f7] px-4 py-3.5"
      >
        <div className="flex gap-3">
          <CircleHelp
            className="mt-0.5 shrink-0 text-[#687c8d]"
            size={19}
            aria-hidden="true"
          />
          <div>
            <h3 className="text-[12.5px] font-extrabold text-[#29465f]">
              Проверка по источникам не получена
            </h3>
            <p className="mt-1 text-[10.5px] leading-[1.5] text-[#6c7986]">
              {unavailableCopy[review.reason]}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const isUnsure = review.label === "UNSURE";
  const disagrees = review.agreesWithPrimary === false;
  const heading = isUnsure
    ? "Источников недостаточно для уверенного вывода"
    : review.label === "FAKE"
      ? "Источники опровергают ключевое утверждение"
      : "Источники подтверждают ключевые утверждения";
  const toneClass = disagrees
    ? "border-[#e7cdb3] bg-[#fff6e9]"
    : isUnsure
      ? "border-[#d6dde5] bg-[#f3f6f8]"
      : "border-[#cbdceb] bg-[#edf5fb]";

  return (
    <section
      aria-label="Проверка Gemini по источникам"
      className={`mt-4 rounded-[13px] border px-4 py-3.5 ${toneClass}`}
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white/70 text-[#31648e]">
          {disagrees ? (
            <AlertTriangle size={17} aria-hidden="true" />
          ) : (
            <Sparkles size={17} aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#668097]">
                Проверка по интернет-источникам
              </p>
              <h3 className="mt-0.5 text-[13px] font-extrabold text-[#173b59]">
                {heading}
              </h3>
            </div>
            <span className="rounded-md bg-white/75 px-2 py-1 text-[9px] font-extrabold text-[#526b7f]">
              Tavily + Gemini
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-[9px] bg-white/60 px-3 py-2">
              <span className="block text-[#778796]">RuFact ML</span>
              <strong className="mt-0.5 block text-[13px] text-[#173b59]">
                {primaryLabel}
              </strong>
            </div>
            <div className="rounded-[9px] bg-white/60 px-3 py-2">
              <span className="block text-[#778796]">Gemini</span>
              <strong className="mt-0.5 block text-[13px] text-[#173b59]">
                {review.label}
              </strong>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-[1.55] text-[#5c7082]">
            {review.explanation}
          </p>

          {review.warningSigns.length ? (
            <ul className="mt-2.5 space-y-1.5">
              {review.warningSigns.map((sign, index) => (
                <li
                  key={`${index}-${sign}`}
                  className="flex gap-2 text-[10.5px] leading-[1.45] text-[#627383]"
                >
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6f8fa9]" />
                  <span>{sign}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <GeminiClaimsPanel claims={review.claims} />

          <details open className="group mt-3 overflow-hidden rounded-[11px] border border-[#cbd8e2]/90 bg-white/55">
            <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-[10px] px-3 text-[#294a65] marker:hidden">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#dce9f2] text-[#356783]">
                <SearchCheck size={15} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-[11.5px] font-extrabold">
                Источники Tavily
              </span>
              <span className="rounded-md bg-white/80 px-2 py-0.5 text-[9px] font-bold tabular-nums text-[#60768a]">
                {review.sources.length}
              </span>
            </summary>
            <ul
              aria-label="Источники проверки Gemini"
              className="grid gap-2 border-t border-[#cbd8e2]/80 px-3 py-3"
            >
              {review.sources.map((source, index) => (
                <li key={source.id}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring flex min-h-9 items-start gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold leading-[1.4] text-[#315d7b] transition-colors hover:bg-white"
                  >
                    <span className="mt-0.5 text-[9px] tabular-nums text-[#8293a1]">
                      {index + 1}.
                    </span>
                    <span className="min-w-0 flex-1">{source.title}</span>
                    <ExternalLink className="mt-0.5 shrink-0" size={12} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </details>

          <p className="mt-3 border-t border-[#cbd8e2]/80 pt-2 text-[9.5px] leading-[1.45] text-[#758696]">
            Качественная уверенность Gemini: {certaintyCopy[review.certainty]}; она не
            калибрована и не усредняется с процентом RuFact. Tavily выполнил поиск по запросу:
            {" "}{review.searchQueries.join(" · ")}. Даже найденный источник может ошибаться —
            откройте важные ссылки и проверьте контекст.
          </p>
        </div>
      </div>
    </section>
  );
}
