import {
  ExternalLink,
  FileQuestion,
  MessageSquareQuote,
  Search,
} from "lucide-react";

import type {
  GeminiClaim,
  GeminiClaimAssessment,
} from "@/lib/gemini-review";

interface GeminiClaimsPanelProps {
  claims: readonly GeminiClaim[];
}

const assessmentCopy: Record<GeminiClaimAssessment, string> = {
  PLAUSIBLE: "Правдоподобно",
  SUSPICIOUS: "Есть сомнения",
  UNSUPPORTED: "Нет опоры в тексте",
  UNSURE: "Недостаточно данных",
  NOT_APPLICABLE: "Субъективная оценка",
};

const assessmentTone: Record<GeminiClaimAssessment, string> = {
  PLAUSIBLE: "bg-[#dcecdf] text-[#306d45]",
  SUSPICIOUS: "bg-[#f7dfd3] text-[#a34f35]",
  UNSUPPORTED: "bg-[#f4d9d6] text-[#a63c43]",
  UNSURE: "bg-[#e5e8eb] text-[#526475]",
  NOT_APPLICABLE: "bg-[#e8e2f0] text-[#66547a]",
};

function buildVerificationUrl(quote: string) {
  const query = `\"${quote}\" первоисточник`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function factualClaimSummary(count: number) {
  if (count === 1) {
    return "Одно фактологическое утверждение требует проверки по внешним источникам.";
  }

  if (count > 1 && count < 5) {
    return `${count} фактологических утверждения требуют проверки по внешним источникам.`;
  }

  return `${count} фактологических утверждений требуют проверки по внешним источникам.`;
}

export function GeminiClaimsPanel({ claims }: GeminiClaimsPanelProps) {
  const factualCount = claims.reduce(
    (count, claim) => count + (claim.kind === "FACTUAL" ? 1 : 0),
    0,
  );

  return (
    <details className="group mt-3 overflow-hidden rounded-[11px] border border-[#cbd8e2]/90 bg-white/45">
      <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-[10px] px-3 text-[#294a65] marker:hidden">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#dce9f2] text-[#356783]">
          <MessageSquareQuote size={15} strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 text-[11.5px] font-extrabold">
          Утверждения в тексте
        </span>
        <span className="rounded-md bg-white/80 px-2 py-0.5 text-[9px] font-bold tabular-nums text-[#60768a]">
          {claims.length}
        </span>
        <span className="text-[9px] font-bold text-[#738494] group-open:hidden">
          Показать
        </span>
        <span className="hidden text-[9px] font-bold text-[#738494] group-open:inline">
          Скрыть
        </span>
      </summary>

      <div className="border-t border-[#cbd8e2]/80 px-3 py-3">
        <p className="mb-3 flex items-start gap-2 text-[9.5px] leading-[1.45] text-[#738494]">
          <FileQuestion className="mt-0.5 shrink-0" size={13} aria-hidden="true" />
          {factualCount
            ? factualClaimSummary(factualCount)
            : "В тексте выделены только оценочные суждения."}
        </p>

        <ol className="grid gap-2.5">
          {claims.map((claim, index) => (
            <li
              key={claim.id}
              className="rounded-[10px] border border-[#d8e0e6] bg-white/70 p-3"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-extrabold tabular-nums text-[#81909e]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="rounded-md bg-[#e8eef2] px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-[0.06em] text-[#526b7f]">
                  {claim.kind === "FACTUAL" ? "Факт" : "Мнение"}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[8.5px] font-extrabold ${assessmentTone[claim.assessment]}`}
                >
                  {assessmentCopy[claim.assessment]}
                </span>
              </div>

              <blockquote className="mt-2 border-l-2 border-[#7897ad] pl-2.5 text-[10.5px] leading-[1.5] font-semibold text-[#354f65]">
                «{claim.quote}»
              </blockquote>
              <p className="mt-2 text-[10px] leading-[1.5] text-[#6b7b89]">
                {claim.explanation}
              </p>

              {claim.needsExternalVerification ? (
                <a
                  href={buildVerificationUrl(claim.quote)}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring mt-2.5 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#d7e0e5] bg-[#f7fafb] px-2.5 text-[9.5px] font-extrabold text-[#315d7b] transition-colors hover:bg-white"
                >
                  <Search size={12} strokeWidth={2} aria-hidden="true" />
                  Искать первоисточник
                  <ExternalLink size={11} strokeWidth={2} aria-hidden="true" />
                </a>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
