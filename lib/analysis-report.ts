import type { AnalysisResponse } from "@/lib/api";

interface AnalysisReportInput {
  result: AnalysisResponse;
  analyzedText: string;
  timestamp: string;
}

function formatPercent(value: number) {
  return `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`;
}

function labelCopy(label: AnalysisResponse["label"]) {
  return label === "FAKE"
    ? "Обнаружены признаки недостоверной информации"
    : "Выраженные признаки недостоверности не обнаружены";
}

export function buildAnalysisReport({
  result,
  analyzedText,
  timestamp,
}: AnalysisReportInput) {
  const lines = [
    "ОТЧЁТ RUFACT",
    `Дата анализа: ${timestamp}`,
    `Результат: ${result.label}`,
    `Уверенность модели в этом ответе: ${formatPercent(result.confidence)}`,
    `Интерпретация: ${labelCopy(result.label)}`,
    "",
    "АНАЛИЗИРУЕМЫЙ ТЕКСТ",
    analyzedText,
  ];

  if (result.explanation) {
    lines.push("", "ПОЧЕМУ ТАК", result.explanation);
  }

  if (result.signals?.length) {
    lines.push("", "СТАТИСТИЧЕСКИЕ ПРИЗНАКИ");
    for (const signal of result.signals) {
      lines.push(`• ${signal.title}: ${signal.description}`);
    }
  }

  if (result.geminiReview?.status === "complete") {
    const review = result.geminiReview;
    lines.push(
      "",
      "ВТОРОЕ МНЕНИЕ GEMINI",
      `Результат: ${review.label}`,
      review.explanation,
      "",
      "ВЫДЕЛЕННЫЕ УТВЕРЖДЕНИЯ",
    );

    for (const [index, claim] of review.claims.entries()) {
      lines.push(
        `${index + 1}. [${claim.kind} / ${claim.assessment}] «${claim.quote}»`,
        `   ${claim.explanation}`,
      );
    }
  }

  lines.push(
    "",
    "ВАЖНО",
    "RuFact показывает вероятностную оценку, а не окончательный фактологический вердикт. Проверяйте ключевые утверждения по независимым первоисточникам.",
    "Внешние источники автоматически не проверялись.",
  );

  return `${lines.join("\n")}\n`;
}
